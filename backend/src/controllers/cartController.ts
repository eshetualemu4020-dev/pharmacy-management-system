import { Request, Response } from 'express';
import pool from '../config/db.js';

export const getCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;
        
        // Ensure cart exists
        let [cartRows] = await pool.query(`SELECT id FROM carts WHERE customer_id = ?`, [customerId]);
        let cartId;
        if ((cartRows as any[]).length === 0) {
            const [result] = await pool.query(`INSERT INTO carts (customer_id) VALUES (?)`, [customerId]);
            cartId = (result as any).insertId;
        } else {
            cartId = (cartRows as any)[0].id;
        }

        // Fetch items with drug details
        const [items] = await pool.query(`
            SELECT ci.id as cart_item_id, ci.quantity, d.id as drug_id, d.name, d.generic_name, 
                   d.price, d.stock, d.requires_prescription, d.is_active, d.category_id
            FROM cart_items ci
            JOIN drugs d ON ci.drug_id = d.id
            WHERE ci.cart_id = ?
        `, [cartId]);

        let subtotal = 0;
        const formattedItems = (items as any[]).map(item => {
            const priceVal = parseFloat(item.price);
            const lineTotal = item.quantity * priceVal;
            subtotal += lineTotal;
            return {
                ...item,
                price: priceVal,
                lineTotal,
                is_available: item.is_active === 1,
                has_sufficient_stock: item.stock >= item.quantity
            };
        });

        res.json({
            cartId,
            items: formattedItems,
            subtotal
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const addToCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;
        const { drug_id, quantity } = req.body;

        if (quantity <= 0) {
            res.status(400).json({ error: 'Quantity must be greater than 0' });
            return;
        }

        // Validate drug
        const [drugRows] = await pool.query(`SELECT id, stock as qty, is_active FROM drugs WHERE id = ?`, [drug_id]);
        if ((drugRows as any[]).length === 0) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        
        const drug = (drugRows as any)[0];
        if (!drug.is_active) {
            res.status(400).json({ error: 'Product is no longer available' });
            return;
        }

        // Ensure cart exists
        let [cartRows] = await pool.query(`SELECT id FROM carts WHERE customer_id = ?`, [customerId]);
        let cartId;
        if ((cartRows as any[]).length === 0) {
            const [result] = await pool.query(`INSERT INTO carts (customer_id) VALUES (?)`, [customerId]);
            cartId = (result as any).insertId;
        } else {
            cartId = (cartRows as any)[0].id;
        }

        // Check if item already in cart
        const [existingItemRows] = await pool.query(`SELECT id, quantity FROM cart_items WHERE cart_id = ? AND drug_id = ?`, [cartId, drug_id]);
        
        let newQuantity = quantity;
        if ((existingItemRows as any[]).length > 0) {
            newQuantity += (existingItemRows as any)[0].quantity;
        }

        if (newQuantity > drug.qty) {
            res.status(400).json({ error: `Only ${drug.qty} units are currently available.` });
            return;
        }

        if ((existingItemRows as any[]).length > 0) {
            await pool.query(`UPDATE cart_items SET quantity = ? WHERE id = ?`, [newQuantity, (existingItemRows as any)[0].id]);
        } else {
            await pool.query(`INSERT INTO cart_items (cart_id, drug_id, quantity) VALUES (?, ?, ?)`, [cartId, drug_id, quantity]);
        }

        res.json({ message: 'Added to cart successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;
        const itemId = req.params.id;
        const { quantity } = req.body;

        if (quantity <= 0) {
            res.status(400).json({ error: 'Quantity must be greater than 0' });
            return;
        }

        const [itemRows] = await pool.query(`
            SELECT ci.id, ci.drug_id, c.customer_id 
            FROM cart_items ci
            JOIN carts c ON ci.cart_id = c.id
            WHERE ci.id = ?
        `, [itemId]);

        if ((itemRows as any[]).length === 0 || (itemRows as any)[0].customer_id !== customerId) {
            res.status(404).json({ error: 'Cart item not found' });
            return;
        }

        const drugId = (itemRows as any)[0].drug_id;
        const [drugRows] = await pool.query(`SELECT stock as qty, is_active FROM drugs WHERE id = ?`, [drugId]);
        
        if ((drugRows as any[]).length === 0 || !(drugRows as any)[0].is_active) {
            res.status(400).json({ error: 'Product is no longer available' });
            return;
        }

        const drug = (drugRows as any)[0];
        if (quantity > drug.qty) {
            res.status(400).json({ error: `Only ${drug.qty} units are currently available.` });
            return;
        }

        await pool.query(`UPDATE cart_items SET quantity = ? WHERE id = ?`, [quantity, itemId]);
        res.json({ message: 'Cart updated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const removeCartItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;
        const itemId = req.params.id;

        const [itemRows] = await pool.query(`
            SELECT ci.id, c.customer_id 
            FROM cart_items ci
            JOIN carts c ON ci.cart_id = c.id
            WHERE ci.id = ?
        `, [itemId]);

        if ((itemRows as any[]).length > 0 && (itemRows as any)[0].customer_id === customerId) {
            await pool.query(`DELETE FROM cart_items WHERE id = ?`, [itemId]);
        }

        res.json({ message: 'Item removed from cart' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const clearCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;
        
        const [cartRows] = await pool.query(`SELECT id FROM carts WHERE customer_id = ?`, [customerId]);
        if ((cartRows as any[]).length > 0) {
            await pool.query(`DELETE FROM cart_items WHERE cart_id = ?`, [(cartRows as any)[0].id]);
        }
        
        res.json({ message: 'Cart cleared successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const validateCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;
        const { promotion_id } = req.body;

        const [cartRows] = await pool.query(`SELECT id FROM carts WHERE customer_id = ?`, [customerId]);
        if ((cartRows as any[]).length === 0) {
            res.status(400).json({ error: 'Cart is empty' });
            return;
        }
        const cartId = (cartRows as any)[0].id;

        const [items] = await pool.query(`
            SELECT ci.id as cart_item_id, ci.quantity, d.id as drug_id, d.name, d.price, d.stock, d.is_active, d.requires_prescription, d.category_id
            FROM cart_items ci
            JOIN drugs d ON ci.drug_id = d.id
            WHERE ci.cart_id = ?
        `, [cartId]);

        if ((items as any[]).length === 0) {
            res.status(400).json({ error: 'Cart is empty' });
            return;
        }

        let subtotal = 0;
        let requiresPrescription = false;
        const validationErrors: string[] = [];

        for (const item of (items as any[])) {
            if (!item.is_active) {
                validationErrors.push(`${item.name} is no longer available.`);
            } else if (item.quantity > item.stock) {
                validationErrors.push(`Only ${item.stock} units of ${item.name} are currently available.`);
            }
            if (item.requires_prescription) {
                requiresPrescription = true;
            }
            subtotal += (item.quantity * item.price);
        }

        if (validationErrors.length > 0) {
            res.status(400).json({ error: 'Your cart needs to be updated before checkout.', details: validationErrors });
            return;
        }

        let discount = 0;
        if (promotion_id) {
            // Validate promotion
            const [promoRows] = await pool.query(`SELECT * FROM promotions WHERE id = ? AND status = 'active'`, [promotion_id]);
            if ((promoRows as any[]).length > 0) {
                const promotion = (promoRows as any)[0];
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const startDate = new Date(promotion.start_date);
                const endDate = new Date(promotion.end_date);
                
                if (today >= startDate && today <= endDate) {
                    const [promoDrugs] = await pool.query(`SELECT drug_id FROM promotion_drugs WHERE promotion_id = ?`, [promotion_id]);
                    const applicableDrugIds = new Set((promoDrugs as any[]).map(d => d.drug_id));

                    const [promoCats] = await pool.query(`SELECT category_id FROM promotion_categories WHERE promotion_id = ?`, [promotion_id]);
                    const applicableCategoryIds = new Set((promoCats as any[]).map(c => c.category_id));

                    let totalEligibleSubtotal = 0;
                    for (const item of (items as any[])) {
                        const isEligible = applicableDrugIds.has(item.drug_id) || (item.category_id && applicableCategoryIds.has(item.category_id));
                        if (isEligible) {
                            totalEligibleSubtotal += (item.quantity * item.price);
                        }
                    }

                    if (totalEligibleSubtotal > 0) {
                        if (promotion.discount_type === 'percentage') {
                            discount = (totalEligibleSubtotal * parseFloat(promotion.discount_value)) / 100;
                        } else if (promotion.discount_type === 'fixed') {
                            discount = parseFloat(promotion.discount_value);
                            if (discount > totalEligibleSubtotal) discount = totalEligibleSubtotal;
                        }
                    }
                }
            }
        }

        const total = subtotal - discount;

        res.json({
            valid: true,
            subtotal,
            discount,
            total,
            requiresPrescription
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
