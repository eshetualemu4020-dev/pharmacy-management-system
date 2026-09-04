import React, { useState, useEffect } from 'react';
import { Search, History, DollarSign, Calendar, Eye, FileText, ChevronLeft, ChevronRight, X, AlertCircle, ShoppingBag, Hash, Clock, Package } from 'lucide-react';
import { salesApi } from '../../services/api';

const PharmacistSalesHistoryTab: React.FC = () => {
  // List State
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [saleStatus, setSaleStatus] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest' | 'highest_amount' | 'lowest_amount'
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sales, setSales] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail State
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const fetchSalesAndStats = async () => {
    try {
      setLoading(true);
      
      // Fetch stats once if not loaded
      if (!stats) {
        try {
          const statsRes = await salesApi.getSummary();
          setStats(statsRes);
        } catch (e) {
          console.error('Failed to load stats', e);
        }
      }

      const res = await salesApi.getAll({
        search: searchTerm,
        date_range: dateRange,
        payment_status: paymentStatus,
        sale_status: saleStatus,
        sort: sortOrder,
        page,
        limit: 10
      });
      
      setSales(res.data);
      setTotalPages(res.pagination.totalPages);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedSale) {
      fetchSalesAndStats();
    }
  }, [page, sortOrder, dateRange, paymentStatus, saleStatus, selectedSale]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSalesAndStats();
  };

  const loadSaleDetails = async (id: number) => {
    try {
      setDetailLoading(true);
      const res = await salesApi.getById(id);
      setSelectedSale(res);
      setShowReceipt(false);
    } catch (err: any) {
      alert(err.message || 'Failed to load sale details');
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20';
      case 'refunded': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'cancelled': return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
      case 'failed': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  if (selectedSale) {
    if (showReceipt) {
      return (
        <div className="flex-1 p-10 overflow-y-auto">
          <div className="flex items-center space-x-4 mb-8">
            <button 
              onClick={() => setShowReceipt(false)}
              className="p-2 bg-surface hover:bg-[#2a2740] rounded-xl text-main transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-main flex items-center space-x-3">
                <span>Receipt {selectedSale.sell_no}</span>
              </h1>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto bg-white p-10 rounded-lg shadow-2xl text-black">
            <div className="text-center mb-8 border-b border-gray-200 pb-8">
              <h2 className="text-3xl font-bold uppercase tracking-wider mb-2">Pharmacy POS</h2>
              <p className="text-gray-500 mb-1">Receipt #: {selectedSale.sell_no}</p>
              <p className="text-gray-500">Date: {new Date(selectedSale.created_at).toLocaleString()}</p>
            </div>
            
            <div className="mb-8">
              <p><span className="font-semibold">Cashier:</span> {selectedSale.pharmacist_name || 'Staff'}</p>
              <p><span className="font-semibold">Customer:</span> {selectedSale.customer_name || 'Walk-in Customer'}</p>
            </div>
            
            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 font-bold">Item</th>
                  <th className="text-center py-2 font-bold">Qty</th>
                  <th className="text-right py-2 font-bold">Price</th>
                  <th className="text-right py-2 font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-3 text-sm">
                      <div className="font-semibold">{item.drug_name}</div>
                      {item.batch_number && <div className="text-xs text-gray-500">Batch: {item.batch_number}</div>}
                    </td>
                    <td className="text-center py-3">{item.quantity}</td>
                    <td className="text-right py-3 text-sm">${parseFloat(item.unit_price).toFixed(2)}</td>
                    <td className="text-right py-3 font-semibold">${parseFloat(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>${parseFloat(selectedSale.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span>-${parseFloat(selectedSale.discount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t border-gray-300 pt-2 mt-2">
                  <span>Total:</span>
                  <span>${parseFloat(selectedSale.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="text-center border-t border-gray-200 pt-8">
              <p className="font-semibold mb-2">Thank you for your business!</p>
              <p className="text-sm text-gray-500">
                Payment Method: <span className="uppercase">{selectedSale.payment_method}</span><br />
                Status: <span className="uppercase">{selectedSale.payment_status}</span>
              </p>
            </div>
            
            <div className="mt-8 flex justify-center print:hidden">
              <button 
                onClick={() => window.print()} 
                className="bg-[#10b981] hover:bg-[#059669] text-main px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="flex items-center space-x-4 mb-8">
          <button 
            onClick={() => setSelectedSale(null)}
            className="p-2 bg-surface hover:bg-[#2a2740] rounded-xl text-main transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-main flex items-center space-x-3">
              <span>Sale {selectedSale.sell_no}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(selectedSale.sale_status)}`}>
                {selectedSale.sale_status}
              </span>
            </h1>
            <p className="text-muted mt-1">{new Date(selectedSale.created_at).toLocaleString()}</p>
          </div>
          <div className="ml-auto flex items-center space-x-3">
            <button 
              onClick={() => setShowReceipt(true)}
              className="flex items-center space-x-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-4 py-2 rounded-xl transition-colors font-medium"
            >
              <FileText className="w-4 h-4" />
              <span>View Receipt</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sale Info */}
          <div className="bg-surface rounded-2xl border border-subtle p-6">
            <h2 className="text-lg font-semibold text-main mb-4 flex items-center">
              <Hash className="w-5 h-5 mr-2 text-muted" />
              Sale Information
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-muted text-sm mb-1">Transaction Ref</p>
                <p className="text-main font-medium">{selectedSale.sell_no}</p>
              </div>
              <div>
                <p className="text-muted text-sm mb-1">Date & Time</p>
                <p className="text-main font-medium">{new Date(selectedSale.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted text-sm mb-1">Processed By</p>
                <p className="text-main font-medium">{selectedSale.pharmacist_name || 'Unknown Staff'}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-surface rounded-2xl border border-subtle p-6">
            <h2 className="text-lg font-semibold text-main mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-muted" />
              Customer Details
            </h2>
            <div className="space-y-4">
              {selectedSale.customer_id ? (
                <>
                  <div>
                    <p className="text-muted text-sm mb-1">Customer Name</p>
                    <p className="text-main font-medium">{selectedSale.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-muted text-sm mb-1">Email</p>
                    <p className="text-main font-medium">{selectedSale.customer_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted text-sm mb-1">Phone</p>
                    <p className="text-main font-medium">{selectedSale.customer_phone || 'N/A'}</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-4">
                  <div className="w-12 h-12 bg-gray-500/10 rounded-full flex items-center justify-center mb-3">
                    <AlertCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-main font-medium">Walk-in Customer</p>
                  <p className="text-muted text-sm">No registered account linked</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-surface rounded-2xl border border-subtle p-6">
            <h2 className="text-lg font-semibold text-main mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-muted" />
              Payment Details
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-muted text-sm mb-1">Payment Method</p>
                <p className="text-main font-medium uppercase">{selectedSale.payment_method}</p>
              </div>
              <div>
                <p className="text-muted text-sm mb-1">Payment Status</p>
                <p className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(selectedSale.payment_status)}`}>
                  {selectedSale.payment_status}
                </p>
              </div>
              <div>
                <p className="text-muted text-sm mb-1">Total Amount</p>
                <p className="text-[#10b981] font-bold text-2xl">${parseFloat(selectedSale.total_amount).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sale Items & Batch Traceability */}
        <div className="bg-surface rounded-2xl border border-subtle overflow-hidden">
          <div className="p-6 border-b border-subtle">
            <h2 className="text-lg font-semibold text-main">Sale Items & Traceability</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-hover text-muted text-sm">
                  <th className="px-6 py-4 font-medium">Item Details</th>
                  <th className="px-6 py-4 font-medium">Batch Info</th>
                  <th className="px-6 py-4 font-medium">Quantity</th>
                  <th className="px-6 py-4 font-medium">Unit Price</th>
                  <th className="px-6 py-4 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {selectedSale.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-base rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-muted" />
                        </div>
                        <div>
                          <p className="text-main font-medium">{item.drug_name}</p>
                          {item.generic_name && <p className="text-muted text-xs">{item.generic_name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.batch_number ? (
                        <div>
                          <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-medium">
                            {item.batch_number}
                          </span>
                          {(item.mfg_date || item.exp_date) && (
                            <p className="text-muted text-xs mt-1">
                              EXP: {item.exp_date ? new Date(item.exp_date).toLocaleDateString() : 'N/A'}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 italic text-xs">No batch data</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-white/10 text-white px-3 py-1 rounded-full font-medium">
                        x{item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-main">${parseFloat(item.unit_price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-[#10b981] font-semibold">${parseFloat(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-white/[0.02] border-t border-subtle flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="text-main">${parseFloat(selectedSale.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Discount</span>
                <span className="text-red-400">-${parseFloat(selectedSale.discount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-main font-bold text-lg pt-3 border-t border-subtle-hover">
                <span>Total</span>
                <span className="text-[#10b981]">${parseFloat(selectedSale.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-main mb-2">Sales History</h1>
          <p className="text-muted">View and review completed pharmacy sales and transaction records.</p>
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface border border-subtle p-6 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-muted text-sm">Today's Sales</p>
              <p className="text-2xl font-bold text-main">${parseFloat(stats.today_sales).toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-surface border border-subtle p-6 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#10b981]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-6 h-6 text-[#10b981]" />
            </div>
            <div>
              <p className="text-muted text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-main">${parseFloat(stats.total_sales).toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-surface border border-subtle p-6 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <History className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-muted text-sm">Total Transactions</p>
              <p className="text-2xl font-bold text-main">{stats.total_transactions}</p>
            </div>
          </div>
          <div className="bg-surface border border-subtle p-6 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Hash className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-muted text-sm">Today's Trans.</p>
              <p className="text-2xl font-bold text-main">{stats.today_transactions}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-surface rounded-2xl border border-subtle p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-muted absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by Sale Number, Customer, or Pharmacist..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-base border border-subtle-hover rounded-xl py-3 pl-12 pr-4 text-main focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <select 
              value={dateRange} 
              onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
              className="bg-base border border-subtle-hover text-main rounded-xl px-4 py-3 focus:outline-none focus:border-[#10b981] min-w-[140px]"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            
            <select 
              value={paymentStatus} 
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
              className="bg-base border border-subtle-hover text-main rounded-xl px-4 py-3 focus:outline-none focus:border-[#10b981] min-w-[160px]"
            >
              <option value="">All Payments</option>
              <option value="completed">Paid/Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
            
            <select 
              value={saleStatus} 
              onChange={(e) => { setSaleStatus(e.target.value); setPage(1); }}
              className="bg-base border border-subtle-hover text-main rounded-xl px-4 py-3 focus:outline-none focus:border-[#10b981] min-w-[160px]"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select 
              value={sortOrder} 
              onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
              className="bg-base border border-subtle-hover text-main rounded-xl px-4 py-3 focus:outline-none focus:border-[#10b981]"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="highest_amount">Sort: Highest Amount</option>
              <option value="lowest_amount">Sort: Lowest Amount</option>
            </select>

            <button type="submit" className="bg-[#10b981] hover:bg-[#059669] text-main px-6 py-3 rounded-xl font-medium transition-colors">
              Search
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-3" />
          {error}
        </div>
      )}

      {/* Sales List */}
      <div className="bg-surface rounded-2xl border border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-hover text-muted text-sm">
                <th className="px-6 py-4 font-medium">Sale Number</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date/Time</th>
                <th className="px-6 py-4 font-medium">Pharmacist</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium">Total Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p>Loading sales history...</p>
                    </div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-hover rounded-full flex items-center justify-center mb-4">
                        <History className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-lg text-main font-medium mb-1">No sales records found</p>
                      <p>Adjust your search or filters to see results.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-medium text-main">{sale.sell_no}</span>
                    </td>
                    <td className="px-6 py-4">
                      {sale.customer_name ? (
                        <span className="text-main">{sale.customer_name}</span>
                      ) : (
                        <span className="text-gray-500 italic">Walk-in</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {new Date(sale.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {sale.pharmacist_name || 'Staff'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-main uppercase text-xs font-medium">{sale.payment_method}</span>
                        <span className={`mt-1 inline-block w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(sale.payment_status)}`}>
                          {sale.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#10b981] font-semibold">${parseFloat(sale.total_amount).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(sale.sale_status)}`}>
                        {sale.sale_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => loadSaleDetails(sale.id)}
                        disabled={detailLoading}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted hover:text-white inline-flex"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && sales.length > 0 && (
          <div className="p-4 border-t border-subtle flex items-center justify-between text-sm">
            <p className="text-muted">
              Page <span className="text-main font-medium">{page}</span> of <span className="text-main font-medium">{totalPages}</span>
            </p>
            <div className="flex space-x-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 bg-hover hover:bg-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-2 bg-hover hover:bg-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacistSalesHistoryTab;
