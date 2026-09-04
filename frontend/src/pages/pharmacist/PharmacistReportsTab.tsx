import React, { useState, useEffect } from 'react';
import { 
  BarChart2, TrendingUp, Package, FileText, ShoppingBag, 
  AlertTriangle, Calendar, Download, Printer, Filter, ChevronDown, DollarSign
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { reportsApi } from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this-week', label: 'This Week' },
  { id: 'this-month', label: 'This Month' },
  { id: 'last-month', label: 'Last Month' },
  { id: 'this-year', label: 'This Year' }
];

const getDatesForPreset = (preset: string) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  
  switch(preset) {
    case 'today':
      break;
    case 'yesterday':
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
      break;
    case 'this-week':
      start.setDate(now.getDate() - now.getDay());
      break;
    case 'this-month':
      start.setDate(1);
      break;
    case 'last-month':
      start.setMonth(now.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
      break;
    case 'this-year':
      start.setMonth(0, 1);
      break;
  }
  return { 
    startDate: start.toISOString().split('T')[0], 
    endDate: end.toISOString().split('T')[0] 
  };
};

const PharmacistReportsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [datePreset, setDatePreset] = useState('this-month');
  const [customDates, setCustomDates] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let params = {};
      if (datePreset === 'custom') {
        params = { startDate: customDates.startDate, endDate: customDates.endDate };
      } else {
        params = getDatesForPreset(datePreset);
      }

      let data;
      switch (activeTab) {
        case 'sales':
          data = await reportsApi.getSales(params);
          break;
        case 'medicine':
          data = await reportsApi.getProducts(params);
          break;
        case 'inventory':
          data = await reportsApi.getInventory(); // Inventory doesn't typically filter by date for current state
          break;
        case 'prescriptions':
          data = await reportsApi.getPrescriptions(params);
          break;
        case 'orders':
          data = await reportsApi.getOrders(params);
          break;
      }
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, datePreset, customDates]);

  const handlePrint = () => {
    window.print();
  };

  const renderSummaryCard = (title: string, value: string | number, icon: React.ReactNode, bgColor: string) => (
    <div className="bg-surface rounded-xl p-6 border border-subtle">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-muted text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-main mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${bgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const renderSalesTab = () => {
    if (!reportData?.summary || !reportData?.salesByDate || !reportData?.salesByCategory) return <div className="text-muted p-8 text-center">No sales were recorded during this period.</div>;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {renderSummaryCard('Total Sales Amount', `$${Number(reportData.summary.total_revenue).toFixed(2)}`, <DollarSign size={20} className="text-emerald-400" />, 'bg-emerald-400/10')}
          {renderSummaryCard('Transactions', reportData.summary.number_of_sales, <ShoppingBag size={20} className="text-blue-400" />, 'bg-blue-400/10')}
          {renderSummaryCard('Avg Transaction', `$${Number(reportData.summary.average_sale_value).toFixed(2)}`, <TrendingUp size={20} className="text-indigo-400" />, 'bg-indigo-400/10')}
          {renderSummaryCard('Total Discounts', `$${Number(reportData.summary.total_discounts).toFixed(2)}`, <FileText size={20} className="text-rose-400" />, 'bg-rose-400/10')}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface rounded-xl border border-subtle p-6">
            <h3 className="text-lg font-medium text-main mb-4">Sales Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.salesByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--surface)', border: 'none', borderRadius: '0.5rem', color: 'var(--main)' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-subtle p-6">
            <h3 className="text-lg font-medium text-main mb-4">Sales by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reportData.salesByCategory} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                    {reportData.salesByCategory?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--surface)', border: 'none', borderRadius: '0.5rem', color: 'var(--main)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMedicineTab = () => {
    if (!reportData?.bestSelling) return <div className="text-muted p-8 text-center">No medicine usage recorded for this period.</div>;
    return (
      <div className="space-y-6">
        <div className="bg-surface rounded-xl border border-subtle overflow-hidden">
          <div className="p-4 border-b border-subtle">
            <h3 className="text-lg font-medium text-main">Most Sold Medicines</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted">
              <thead className="bg-hover text-muted">
                <tr>
                  <th className="p-4">Drug Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Qty Sold</th>
                  <th className="p-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reportData.bestSelling.map((med: any) => (
                  <tr key={med.id} className="border-b border-subtle hover:bg-hover">
                    <td className="p-4">
                      <div className="font-medium text-main">{med.name}</div>
                      <div className="text-xs text-muted">{med.generic_name}</div>
                    </td>
                    <td className="p-4">{med.category_name || 'N/A'}</td>
                    <td className="p-4 text-right font-medium text-emerald-400">{med.total_sold_qty}</td>
                    <td className="p-4 text-right">${Number(med.total_revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderInventoryTab = () => {
    if (!reportData?.summary || !reportData?.details) return <div className="text-muted p-8 text-center">No inventory alerts at this time.</div>;
    
    // Filter to only show actionable alerts
    const lowStockThreshold = reportData.summary.lowStockThreshold || 10;
    const expiryDays = reportData.summary.expiryDays || 30;
    
    const alerts = reportData.details.filter((d: any) => d.qty <= lowStockThreshold || (new Date(d.exp_date) <= new Date(new Date().setDate(new Date().getDate() + expiryDays))));
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {renderSummaryCard('Low Stock Items', reportData.summary.low_stock_products, <AlertTriangle size={20} className="text-amber-400" />, 'bg-amber-400/10')}
          {renderSummaryCard('Out of Stock', reportData.summary.out_of_stock_products, <AlertTriangle size={20} className="text-red-400" />, 'bg-red-400/10')}
          {renderSummaryCard('Expiring Soon', reportData.summary.expiring_products, <Calendar size={20} className="text-orange-400" />, 'bg-orange-400/10')}
          {renderSummaryCard('Expired', reportData.summary.expired_products, <AlertTriangle size={20} className="text-rose-600" />, 'bg-rose-600/10')}
        </div>

        <div className="bg-surface rounded-xl border border-subtle overflow-hidden">
          <div className="p-4 border-b border-subtle">
            <h3 className="text-lg font-medium text-main">Actionable Inventory Alerts</h3>
          </div>
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-muted">No low-stock medicines currently require attention.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted">
                <thead className="bg-hover text-muted">
                  <tr>
                    <th className="p-4">Drug Name</th>
                    <th className="p-4">Batch ID</th>
                    <th className="p-4 text-right">Current Qty</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((med: any) => {
                    const isExpiring = new Date(med.exp_date) <= new Date(new Date().setDate(new Date().getDate() + expiryDays));
                    const isLow = med.qty <= lowStockThreshold;
                    return (
                      <tr key={`${med.id}-${med.batch_id}`} className="border-b border-subtle hover:bg-hover">
                        <td className="p-4 font-medium text-main">{med.name}</td>
                        <td className="p-4">{med.batch_id || '-'}</td>
                        <td className="p-4 text-right">
                          <span className={isLow ? 'text-red-400 font-bold' : ''}>{med.qty}</span>
                        </td>
                        <td className="p-4 text-muted">{new Date(med.exp_date).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {isLow && <span className="px-2 py-1 bg-red-400/10 text-red-400 rounded text-xs font-medium border border-red-400/20">Low Stock</span>}
                            {isExpiring && <span className="px-2 py-1 bg-orange-400/10 text-orange-400 rounded text-xs font-medium border border-orange-400/20">Expiring</span>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPrescriptionsTab = () => {
    if (!reportData?.summary || !reportData?.prescriptionsByDate) return <div className="text-muted p-8 text-center">No prescriptions were processed during this period.</div>;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {renderSummaryCard('Total Prescriptions', reportData.summary.total_prescriptions, <FileText size={20} className="text-blue-400" />, 'bg-blue-400/10')}
          {renderSummaryCard('Pending', reportData.summary.pending_prescriptions, <AlertTriangle size={20} className="text-amber-400" />, 'bg-amber-400/10')}
          {renderSummaryCard('Approved', reportData.summary.approved_prescriptions, <FileText size={20} className="text-emerald-400" />, 'bg-emerald-400/10')}
          {renderSummaryCard('Approval Rate', `${reportData.summary.approval_rate}%`, <TrendingUp size={20} className="text-emerald-400" />, 'bg-emerald-400/10')}
        </div>
        
        <div className="bg-surface rounded-xl border border-subtle p-6">
          <h3 className="text-lg font-medium text-main mb-4">Prescription Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.prescriptionsByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--surface)', border: 'none', borderRadius: '0.5rem', color: 'var(--main)' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderOrdersTab = () => {
    if (!reportData?.summary || !reportData?.ordersByDate) return <div className="text-muted p-8 text-center">No orders match the selected filters.</div>;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {renderSummaryCard('Total Orders', reportData.summary.total_orders, <ShoppingBag size={20} className="text-blue-400" />, 'bg-blue-400/10')}
          {renderSummaryCard('Pending Orders', reportData.summary.pending_orders, <AlertTriangle size={20} className="text-amber-400" />, 'bg-amber-400/10')}
          {renderSummaryCard('Completed Orders', reportData.summary.completed_orders, <Package size={20} className="text-emerald-400" />, 'bg-emerald-400/10')}
          {renderSummaryCard('Total Order Value', `$${Number(reportData.summary.total_order_value).toFixed(2)}`, <DollarSign size={20} className="text-indigo-400" />, 'bg-indigo-400/10')}
        </div>
        
        <div className="bg-surface rounded-xl border border-subtle p-6">
          <h3 className="text-lg font-medium text-main mb-4">Orders Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.ordersByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis yAxisId="left" stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--surface)', border: 'none', borderRadius: '0.5rem', color: 'var(--main)' }} />
                <Bar yAxisId="left" dataKey="orders_count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Orders" />
                <Bar yAxisId="right" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 printable-report">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-main flex items-center gap-2">
            <BarChart2 className="text-blue-500" />
            Reports
          </h1>
          <p className="text-muted mt-1 max-w-2xl">
            View operational pharmacy reports for sales, medicines, prescriptions, orders, and inventory alerts.
          </p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <button onClick={handlePrint} className="px-4 py-2 bg-base hover:bg-hover text-main rounded-xl flex items-center gap-2 transition-colors">
            <Printer size={18} />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface p-4 rounded-xl border border-subtle no-print">
        <div className="flex overflow-x-auto w-full md:w-auto hide-scrollbar space-x-1">
          {[
            { id: 'sales', label: 'Sales' },
            { id: 'medicine', label: 'Medicine Usage' },
            { id: 'inventory', label: 'Inventory Alerts' },
            { id: 'prescriptions', label: 'Prescriptions' },
            { id: 'orders', label: 'Orders' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-muted hover:bg-surface hover:bg-hover hover:text-main'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'inventory' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                className="w-full appearance-none bg-base border border-subtle text-main rounded-xl pl-10 pr-8 py-2 focus:outline-none focus:border-blue-500"
              >
                {DATE_PRESETS.map(preset => (
                  <option key={preset.id} value={preset.id}>{preset.label}</option>
                ))}
                <option value="custom">Custom Range</option>
              </select>
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
            </div>

            {datePreset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customDates.startDate}
                  onChange={(e) => setCustomDates({...customDates, startDate: e.target.value})}
                  className="bg-base border border-subtle text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <span className="text-muted">-</span>
                <input
                  type="date"
                  value={customDates.endDate}
                  onChange={(e) => setCustomDates({...customDates, endDate: e.target.value})}
                  className="bg-base border border-subtle text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-medium">Error loading report</p>
              <p className="text-sm opacity-80 mt-1">{error}</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'sales' && renderSalesTab()}
            {activeTab === 'medicine' && renderMedicineTab()}
            {activeTab === 'inventory' && renderInventoryTab()}
            {activeTab === 'prescriptions' && renderPrescriptionsTab()}
            {activeTab === 'orders' && renderOrdersTab()}
          </>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .printable-report, .printable-report * { visibility: visible; }
          .printable-report { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .no-print { display: none !important; }
        }
      `}} />
    </div>
  );
};

export default PharmacistReportsTab;
