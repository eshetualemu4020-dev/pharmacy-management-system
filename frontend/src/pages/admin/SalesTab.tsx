import React, { useState, useEffect } from 'react';
import { salesApi } from '../../services/api';
import { formatCurrency } from '../../utils/currency';

const SalesTab: React.FC = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [saleStatus, setSaleStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await salesApi.getAll({
        search,
        date_range: dateRange,
        payment_status: paymentStatus,
        sale_status: saleStatus,
        page,
        limit: 10
      });
      setSales(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await salesApi.getSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Error fetching summary', err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [search, dateRange, paymentStatus, saleStatus, page]);

  const openSaleDetails = async (id: number) => {
    try {
      const data = await salesApi.getById(id);
      setSelectedSale(data);
      setIsModalOpen(true);
    } catch (err: any) {
      alert('Error fetching sale details: ' + err.message);
    }
  };

  const handleRefund = async () => {
    if (!selectedSale) return;
    if (!window.confirm('Are you sure you want to refund this sale? This action cannot be undone and will restore inventory.')) return;
    
    try {
      setRefundLoading(true);
      await salesApi.refund(selectedSale.id);
      alert('Sale refunded successfully');
      setIsModalOpen(false);
      fetchSales();
      fetchSummary();
    } catch (err: any) {
      alert(err.message || 'Error refunding sale');
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-main mb-2">Sales Management</h2>
      </div>
      <p className="text-muted">Monitor, search, and manage completed pharmacy sales.</p>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-base p-6 rounded-xl border border-subtle shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-blue-500/20"></div>
            <h3 className="text-muted font-medium">Today's Sales</h3>
            <p className="text-3xl font-bold text-main mt-2">{formatCurrency(summary.today_sales)}</p>
          </div>
          <div className="bg-base p-6 rounded-xl border border-subtle shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-emerald-500/20"></div>
            <h3 className="text-muted font-medium">This Month</h3>
            <p className="text-3xl font-bold text-main mt-2">{formatCurrency(summary.month_sales)}</p>
          </div>
          <div className="bg-base p-6 rounded-xl border border-subtle shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#9b51e0]/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-[#9b51e0]/20"></div>
            <p className="text-sm font-bold text-muted">Total Sales (All Time)</p>
            <p className="text-3xl font-bold text-main mt-2">{formatCurrency(summary.total_sales)}</p>
          </div>
          <div className="bg-base p-6 rounded-xl border border-subtle shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-amber-500/20"></div>
            <p className="text-sm font-bold text-muted">Total Transactions</p>
            <p className="text-3xl font-bold text-main mt-2">{summary.total_transactions}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-base p-4 rounded-xl border border-subtle space-y-4 md:space-y-0 md:flex md:space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by Sale ID, User, Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-subtle rounded-lg px-4 py-2.5 text-main focus:outline-none focus:border-[#9b51e0]"
          />
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-surface border border-subtle rounded-lg px-4 py-2.5 text-main focus:outline-none focus:border-[#9b51e0] appearance-none"
        >
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className="bg-surface border border-subtle rounded-lg px-4 py-2.5 text-main focus:outline-none focus:border-[#9b51e0] appearance-none"
        >
          <option value="">All Payment Statuses</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={saleStatus}
          onChange={(e) => setSaleStatus(e.target.value)}
          className="bg-surface border border-subtle rounded-lg px-4 py-2.5 text-main focus:outline-none focus:border-[#9b51e0] appearance-none"
        >
          <option value="">All Sale Statuses</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Sales List */}
      <div className="bg-base border border-subtle rounded-xl overflow-hidden">
        {error && <div className="p-4 bg-red-900/50 text-red-400 border-b border-subtle">{error}</div>}
        {loading ? (
          <div className="p-12 text-center text-muted">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            Loading sales...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-subtle bg-hover">
                  <th className="p-4 text-sm font-bold text-muted">ID</th>
                  <th className="p-4 text-sm font-bold text-muted">Date</th>
                  <th className="p-4 text-sm font-bold text-muted">Customer</th>
                  <th className="p-4 text-sm font-bold text-muted">User</th>
                  <th className="p-4 text-sm font-bold text-muted">Total Items</th>
                  <th className="p-4 text-sm font-bold text-muted">Total Amount</th>
                  <th className="p-4 text-sm font-bold text-muted">Payment</th>
                  <th className="p-4 text-sm font-bold text-muted">Status</th>
                  <th className="p-4 text-sm font-bold text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted">No sales found matching your criteria.</td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-subtle hover:bg-hover transition-colors">
                      <td className="p-4 text-main font-bold">#{sale.id}</td>
                      <td className="p-4 text-sm text-muted">
                        {new Date(sale.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 text-sm text-main">{sale.customer_name || 'Walk-in Customer'}</td>
                      <td className="p-4 text-sm text-muted">{sale.pharmacist_name}</td>
                      <td className="p-4 text-sm text-main">{sale.total_items}</td>
                      <td className="p-4 font-bold text-main">{formatCurrency(sale.total_amount)}</td>
                      <td className="p-4 text-sm text-muted">
                        <span className="capitalize">{sale.payment_method}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          sale.sale_status === 'completed' ? 'bg-emerald-400/10 text-emerald-400' :
                          sale.sale_status === 'refunded' ? 'bg-red-400/10 text-red-400' :
                          'bg-gray-400/10 text-gray-400'
                        }`}>
                          {sale.sale_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openSaleDetails(sale.id)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-subtle flex justify-between items-center bg-hover">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-surface text-white rounded-lg disabled:opacity-50 transition-colors hover:bg-white/10"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-muted">Page {page} of {totalPages}</span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-surface text-white rounded-lg disabled:opacity-50 transition-colors hover:bg-white/10"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Sale Details Modal */}
      {isModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1829] border border-subtle-hover rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-subtle-hover bg-base">
              <h3 className="text-xl font-bold text-main">Sale Receipt #{selectedSale.id}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-main transition-colors">
                &times;
              </button>
            </div>
            
            <div className="p-8 space-y-8 overflow-y-auto">
              <div className="grid grid-cols-2 gap-8 text-sm bg-base p-6 rounded-xl border border-subtle">
                <div>
                  <h4 className="font-bold text-muted mb-3 uppercase tracking-wider text-xs">Customer Info</h4>
                  <p className="text-main font-medium text-base mb-1">{selectedSale.customer_name || 'Walk-in Customer'}</p>
                  {selectedSale.customer_email && <p className="text-muted">{selectedSale.customer_email}</p>}
                  {selectedSale.customer_phone && <p className="text-muted">{selectedSale.customer_phone}</p>}
                </div>
                <div>
                  <h4 className="font-bold text-muted mb-3 uppercase tracking-wider text-xs">Sale Info</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted">Date:</span>
                      <span className="text-main font-medium">{new Date(selectedSale.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Processed By:</span>
                      <span className="text-main font-medium">{selectedSale.pharmacist_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Status:</span>
                      <span className="text-main font-bold uppercase">{selectedSale.sale_status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-muted mb-4 uppercase tracking-wider text-xs">Items Purchased</h4>
                <div className="bg-base rounded-xl border border-subtle overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-hover border-b border-subtle">
                      <tr>
                        <th className="p-4 font-bold text-muted">Product</th>
                        <th className="p-4 font-bold text-muted text-center">Qty</th>
                        <th className="p-4 font-bold text-muted text-right">Unit Price</th>
                        <th className="p-4 font-bold text-muted text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale.items?.map((item: any) => (
                        <tr key={item.id} className="border-b border-subtle">
                          <td className="p-4 text-main font-medium">{item.drug_name || `Drug ID: ${item.drug_id}`}</td>
                          <td className="p-4 text-center text-main">{item.quantity}</td>
                          <td className="p-4 text-right text-muted">{formatCurrency(item.unit_price)}</td>
                          <td className="p-4 text-right text-main font-bold">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-hover">
                      <tr>
                        <td colSpan={3} className="p-4 text-right text-muted font-medium border-b border-subtle">Subtotal:</td>
                        <td className="p-4 text-right text-main font-bold border-b border-subtle">{formatCurrency(selectedSale.subtotal)}</td>
                      </tr>
                      {Number(selectedSale.discount) > 0 && (
                        <tr>
                          <td colSpan={3} className="p-4 text-right text-red-400 font-medium border-b border-subtle">Discount:</td>
                          <td className="p-4 text-right text-red-400 font-bold border-b border-subtle">-{formatCurrency(selectedSale.discount)}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={3} className="p-4 text-right text-main font-black text-lg">Total Paid:</td>
                        <td className="p-4 text-right text-main font-black">{formatCurrency(selectedSale.total_amount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>
                    <h4 className="font-bold text-muted mb-2 uppercase tracking-wider text-xs">Payment Info</h4>
                    <p className="text-main"><strong className="text-muted">Method:</strong> <span className="capitalize ml-1">{selectedSale.payment_method}</span></p>
                    <p className="text-main mt-1"><strong className="text-muted">Status:</strong> <span className="uppercase ml-1">{selectedSale.payment_status}</span></p>
                 </div>
              </div>
            </div>

            <div className="p-6 border-t border-subtle-hover bg-base flex justify-end space-x-3">
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
              >
                Print Receipt
              </button>
              {selectedSale.sale_status === 'completed' && (
                <button
                  onClick={handleRefund}
                  disabled={refundLoading}
                  className="px-6 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white disabled:opacity-50 font-bold transition-colors"
                >
                  {refundLoading ? 'Refunding...' : 'Refund Sale'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTab;
