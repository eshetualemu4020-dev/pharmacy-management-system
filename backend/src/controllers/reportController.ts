import { Request, Response } from 'express';
import db from '../config/db';

const buildDateFilter = (dateField: string, startDate?: string, endDate?: string) => {
  let filter = '';
  const params: any[] = [];
  if (startDate) {
    filter += ` AND ${dateField} >= ?`;
    params.push(startDate + ' 00:00:00');
  }
  if (endDate) {
    filter += ` AND ${dateField} <= ?`;
    params.push(endDate + ' 23:59:59');
  }
  return { filter, params };
};

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    // In-store sales date filter
    const salesDate = buildDateFilter('created_at', startDate as string, endDate as string);
    // Online orders date filter
    const ordersDate = buildDateFilter('created_at', startDate as string, endDate as string);

    // 1. Total Sales (count) & In-store Revenue
    const [salesStats]: any = await db.query(
      `SELECT COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as instore_revenue FROM sales WHERE sale_status = 'completed' ${salesDate.filter}`, 
      salesDate.params
    );

    // 2. Online Orders Stats
    const [orderStats]: any = await db.query(
      `SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END), 0) as online_revenue
       FROM orders WHERE 1=1 ${ordersDate.filter}`,
       ordersDate.params
    );

    // 3. Products/Inventory
    const [inventoryStats]: any = await db.query(
      `SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN qty > 0 AND qty < 20 THEN 1 END) as low_stock_products,
        COUNT(CASE WHEN exp_date > CURDATE() AND exp_date < DATE_ADD(CURDATE(), INTERVAL 90 DAY) THEN 1 END) as expiring_soon,
        COUNT(CASE WHEN exp_date < CURDATE() THEN 1 END) as expired_products
       FROM drugs`
    );

    // 4. Prescriptions
    const [prescriptionStats]: any = await db.query(
      `SELECT COUNT(*) as pending_prescriptions FROM prescriptions WHERE status = 'pending' ${ordersDate.filter}`,
      ordersDate.params
    );

    const totalRevenue = parseFloat(salesStats[0].instore_revenue) + parseFloat(orderStats[0].online_revenue);

    res.json({
      total_sales: salesStats[0].total_sales,
      total_revenue: totalRevenue,
      total_orders: orderStats[0].total_orders,
      completed_orders: orderStats[0].completed_orders,
      cancelled_orders: orderStats[0].cancelled_orders,
      total_products: inventoryStats[0].total_products,
      low_stock_products: inventoryStats[0].low_stock_products,
      expiring_soon: inventoryStats[0].expiring_soon,
      expired_products: inventoryStats[0].expired_products,
      pending_prescriptions: prescriptionStats[0].pending_prescriptions
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const { filter, params } = buildDateFilter('s.created_at', startDate as string, endDate as string);

    // Overall summary
    const [summary]: any = await db.query(`
      SELECT 
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COUNT(s.id) as number_of_sales,
        COALESCE(AVG(s.total_amount), 0) as average_sale_value,
        COALESCE(SUM(si.quantity * (d.price - si.unit_price)), 0) as total_discounts
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN drugs d ON si.drug_id = d.id
      WHERE s.sale_status = 'completed' ${filter}
    `, params);

    // Sales by date (Trend)
    const [salesByDate]: any = await db.query(`
      SELECT DATE(s.created_at) as date, COALESCE(SUM(s.total_amount), 0) as revenue
      FROM sales s
      WHERE s.sale_status = 'completed' ${filter}
      GROUP BY DATE(s.created_at)
      ORDER BY date ASC
    `, params);

    // Sales by category
    const [salesByCategory]: any = await db.query(`
      SELECT c.name as category, COALESCE(SUM(si.quantity * si.unit_price), 0) as revenue
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN drugs d ON si.drug_id = d.id
      JOIN categories c ON d.category_id = c.id
      WHERE s.sale_status = 'completed' ${filter}
      GROUP BY c.id
      ORDER BY revenue DESC
    `, params);

    // Sales by user/pharmacist
    const [salesByUser]: any = await db.query(`
      SELECT u.username, COALESCE(SUM(s.total_amount), 0) as revenue
      FROM sales s
      JOIN users u ON s.user_id = u.id
      WHERE s.sale_status = 'completed' ${filter}
      GROUP BY u.id
      ORDER BY revenue DESC
    `, params);

    res.json({
      summary: summary[0],
      salesByDate,
      salesByCategory,
      salesByUser
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getInventoryReport = async (req: Request, res: Response) => {
  try {
    const [summary]: any = await db.query(`
      SELECT 
        COALESCE(SUM(qty), 0) as total_stock_quantity,
        COALESCE(SUM(qty * price), 0) as total_inventory_value,
        COUNT(CASE WHEN qty > 0 THEN 1 END) as available_stock_products,
        COUNT(CASE WHEN qty > 0 AND qty < 20 THEN 1 END) as low_stock_products,
        COUNT(CASE WHEN qty = 0 THEN 1 END) as out_of_stock_products,
        COUNT(CASE WHEN exp_date > CURDATE() AND exp_date < DATE_ADD(CURDATE(), INTERVAL 90 DAY) THEN 1 END) as expiring_products,
        COUNT(CASE WHEN exp_date < CURDATE() THEN 1 END) as expired_products
      FROM drugs
    `);

    const [details]: any = await db.query(`
      SELECT d.id, d.name, d.generic_name, d.batch_id, d.qty, d.price, d.exp_date, c.name as category_name
      FROM drugs d
      LEFT JOIN categories c ON d.category_id = c.id
      ORDER BY d.qty ASC
    `);

    res.json({
      summary: summary[0],
      details
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrderReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const { filter, params } = buildDateFilter('created_at', startDate as string, endDate as string);

    const [summary]: any = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status IN ('placed', 'pending_prescription') THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status IN ('packed', 'shipped') THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END), 0) as total_order_value
      FROM orders
      WHERE 1=1 ${filter}
    `, params);

    const [ordersByDate]: any = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as orders_count, COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END), 0) as revenue
      FROM orders
      WHERE 1=1 ${filter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, params);

    res.json({
      summary: summary[0],
      ordersByDate
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getPrescriptionReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const { filter, params } = buildDateFilter('p.created_at', startDate as string, endDate as string);

    const [summary]: any = await db.query(`
      SELECT 
        COUNT(*) as total_prescriptions,
        COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_prescriptions,
        COUNT(CASE WHEN p.status = 'approved' THEN 1 END) as approved_prescriptions,
        COUNT(CASE WHEN p.status = 'rejected' THEN 1 END) as rejected_prescriptions
      FROM prescriptions p
      WHERE 1=1 ${filter}
    `, params);

    const total = summary[0].total_prescriptions || 1; // prevent divide by zero
    const approvalRate = ((summary[0].approved_prescriptions / total) * 100).toFixed(1);
    const rejectionRate = ((summary[0].rejected_prescriptions / total) * 100).toFixed(1);

    const [prescriptionsByDate]: any = await db.query(`
      SELECT DATE(p.created_at) as date, COUNT(*) as count
      FROM prescriptions p
      WHERE 1=1 ${filter}
      GROUP BY DATE(p.created_at)
      ORDER BY date ASC
    `, params);

    const [prescriptionsByUser]: any = await db.query(`
      SELECT u.username, COUNT(p.id) as count
      FROM prescriptions p
      JOIN users u ON p.reviewed_by = u.id
      WHERE 1=1 ${filter}
      GROUP BY u.id
    `, params);

    res.json({
      summary: {
        ...summary[0],
        approval_rate: approvalRate,
        rejection_rate: rejectionRate
      },
      prescriptionsByDate,
      prescriptionsByUser
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const { filter, params } = buildDateFilter('s.created_at', startDate as string, endDate as string);
    const orderFilter = buildDateFilter('o.created_at', startDate as string, endDate as string);

    // Best-selling drugs (In-store + online combined conceptually, but doing in-store for simplicity or both)
    // For exactness, let's combine quantities from sales and order_items
    const [performance]: any = await db.query(`
      SELECT 
        d.id,
        d.name,
        d.generic_name,
        c.name as category_name,
        COALESCE(instore.qty, 0) + COALESCE(online.qty, 0) as total_sold_qty,
        COALESCE(instore.rev, 0) + COALESCE(online.rev, 0) as total_revenue
      FROM drugs d
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN (
        SELECT si.drug_id, SUM(si.quantity) as qty, SUM(si.quantity * si.unit_price) as rev 
        FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE s.sale_status = 'completed' ${filter} GROUP BY si.drug_id
      ) instore ON d.id = instore.drug_id
      LEFT JOIN (
        SELECT oi.drug_id, SUM(oi.quantity) as qty, SUM(oi.quantity * oi.unit_price) as rev 
        FROM order_items oi 
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'delivered' ${orderFilter.filter}
        GROUP BY oi.drug_id
      ) online ON d.id = online.drug_id
      ORDER BY total_sold_qty DESC
    `, [...params, ...orderFilter.params]);

    // Calculate best and least selling from performance list
    const activeProducts = performance.filter((p: any) => p.total_sold_qty > 0);
    const bestSelling = activeProducts.slice(0, 10);
    const leastSelling = activeProducts.slice(-10).reverse(); // assuming sorted DESC

    res.json({
      bestSelling,
      leastSelling,
      performance
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCustomerReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const { filter, params } = buildDateFilter('c.created_at', startDate as string, endDate as string);
    const orderFilter = buildDateFilter('o.created_at', startDate as string, endDate as string);

    const [totalCustomers]: any = await db.query(`SELECT COUNT(*) as count FROM customers`);
    
    const [newCustomers]: any = await db.query(`
      SELECT COUNT(*) as count FROM customers c WHERE 1=1 ${filter}
    `, params);

    const [activeCustomers]: any = await db.query(`
      SELECT COUNT(DISTINCT o.customer_id) as count 
      FROM orders o 
      WHERE 1=1 ${orderFilter.filter}
    `, orderFilter.params);

    const [customerTotals]: any = await db.query(`
      SELECT 
        c.id, c.name, c.email, 
        COUNT(o.id) as total_orders, 
        COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total_amount ELSE 0 END), 0) as lifetime_value
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      GROUP BY c.id
      ORDER BY lifetime_value DESC
      LIMIT 100
    `);

    res.json({
      summary: {
        total_customers: totalCustomers[0].count,
        new_customers: newCustomers[0].count,
        active_customers: activeCustomers[0].count
      },
      top_customers: customerTotals
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
