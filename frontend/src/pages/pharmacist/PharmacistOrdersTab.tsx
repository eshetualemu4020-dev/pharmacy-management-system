import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, CheckCircle, XCircle, Clock, Play, FileText, AlertTriangle } from 'lucide-react';
import { orderApi } from '../../services/api';
import { formatCurrency } from '../../utils/currency';

export default function PharmacistOrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getOrders({
        search: searchTerm,
        status: statusFilter,
        date_range: dateFilter,
        page,
        limit: 10
      });
      setOrders(res.data);
      setTotalPages(res.pagination.totalPages);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, dateFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const openOrderDetails = async (id: number) => {
    try {
      const res = await orderApi.getOrderById(id);
      setSelectedOrder(res);
      setIsViewModalOpen(true);
      setRejectionReason('');
      setIsRejecting(false);
      setActionError('');
    } catch (err: any) {
      alert(err.message || 'Failed to fetch order details');
    }
  };

  const handleStatusUpdate = async (newStatus: string, requireReason = false) => {
    if (!selectedOrder) return;
    
    if (requireReason && !rejectionReason.trim()) {
      setActionError('A reason is required.');
      return;
    }

    if (!window.confirm(`Are you sure you want to change the status to ${newStatus.toUpperCase()}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError('');
      await orderApi.updateOrderStatus(selectedOrder.id, {
        status: newStatus,
        reason: rejectionReason
      });
      setIsViewModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-yellow-500/10 text-yellow-500 px-2.5 py-1 rounded-full text-xs font-bold">Pending</span>;
      case 'confirmed': return <span className="bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-full text-xs font-bold">Confirmed</span>;
      case 'preparing': 
      case 'processing': return <span className="bg-indigo-500/10 text-indigo-500 px-2.5 py-1 rounded-full text-xs font-bold">Preparing</span>;
      case 'ready': return <span className="bg-purple-500/10 text-purple-500 px-2.5 py-1 rounded-full text-xs font-bold">Ready</span>;
      case 'completed': return <span className="bg-[#10b981]/10 text-[#10b981] px-2.5 py-1 rounded-full text-xs font-bold">Completed</span>;
      case 'rejected': return <span className="bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full text-xs font-bold">Rejected</span>;
      case 'cancelled': return <span className="bg-gray-500/10 text-gray-400 px-2.5 py-1 rounded-full text-xs font-bold">Cancelled</span>;
      default: return <span className="bg-gray-500/10 text-gray-400 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="flex-1 p-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Orders Management</h1>
          <p className="text-[#a09eb5]">Process online orders, verify stock, and manage fulfillment.</p>
        </div>
      </div>

      <div className="bg-[#232136] rounded-2xl border border-white/5 p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-[#a09eb5] absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by Order #, Customer Name, Phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1825] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#1a1825] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#10b981] transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select 
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="bg-[#1a1825] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#10b981] transition-colors"
          >
            <option value="">Any Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <button type="submit" className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-3 rounded-xl font-medium transition-colors">
            Search
          </button>
        </form>
      </div>

      <div className="bg-[#232136] rounded-2xl border border-white/5 overflow-hidden">
        {loading && <div className="p-8 text-center text-[#a09eb5]">Loading orders...</div>}
        {error && <div className="p-8 text-center text-red-400">{error}</div>}
        
        {!loading && !error && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-4 px-6 text-[#a09eb5] font-medium text-sm">Order #</th>
                <th className="text-left py-4 px-6 text-[#a09eb5] font-medium text-sm">Customer</th>
                <th className="text-left py-4 px-6 text-[#a09eb5] font-medium text-sm">Items</th>
                <th className="text-left py-4 px-6 text-[#a09eb5] font-medium text-sm">Total</th>
                <th className="text-left py-4 px-6 text-[#a09eb5] font-medium text-sm">Date</th>
                <th className="text-left py-4 px-6 text-[#a09eb5] font-medium text-sm">Status</th>
                <th className="text-right py-4 px-6 text-[#a09eb5] font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#a09eb5]">No orders found.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-white font-medium">#{order.id}</td>
                    <td className="py-4 px-6">
                      <div className="text-white font-medium">{order.customer_name}</div>
                      <div className="text-[#a09eb5] text-sm">{order.customer_phone}</div>
                    </td>
                    <td className="py-4 px-6 text-white">{order.total_items} items</td>
                    <td className="py-4 px-6 text-[#10b981] font-medium">{formatCurrency(order.total_amount)}</td>
                    <td className="py-4 px-6 text-[#a09eb5] text-sm">{new Date(order.created_at).toLocaleString()}</td>
                    <td className="py-4 px-6">{getStatusBadge(order.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => openOrderDetails(order.id)}
                        className="p-2 text-[#a09eb5] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
        )}
        
        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex justify-center space-x-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPage(idx + 1)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium transition-colors ${
                  page === idx + 1 ? 'bg-[#10b981] text-white' : 'bg-[#1a1825] text-[#a09eb5] hover:text-white'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {isViewModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#232136] rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <span>Order #{selectedOrder.id}</span>
                  {getStatusBadge(selectedOrder.status)}
                </h2>
                <p className="text-[#a09eb5] text-sm mt-1">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-[#a09eb5] hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {actionError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 text-red-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{actionError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#1a1825] p-5 rounded-xl border border-white/5">
                  <h3 className="text-sm font-bold text-[#a09eb5] mb-4 uppercase tracking-wider">Customer Details</h3>
                  <div className="space-y-2">
                    <p className="text-white"><span className="text-[#a09eb5] mr-2">Name:</span> {selectedOrder.customer_name}</p>
                    <p className="text-white"><span className="text-[#a09eb5] mr-2">Phone:</span> {selectedOrder.customer_phone}</p>
                    <p className="text-white"><span className="text-[#a09eb5] mr-2">Email:</span> {selectedOrder.customer_email}</p>
                    <p className="text-white"><span className="text-[#a09eb5] mr-2">Address:</span> {selectedOrder.customer_address}</p>
                  </div>
                </div>
                
                <div className="bg-[#1a1825] p-5 rounded-xl border border-white/5">
                  <h3 className="text-sm font-bold text-[#a09eb5] mb-4 uppercase tracking-wider">Order Summary</h3>
                  <div className="space-y-2">
                    <p className="text-white"><span className="text-[#a09eb5] mr-2">Payment Status:</span> 
                      <span className={selectedOrder.payment_status === 'paid' ? 'text-[#10b981]' : 'text-yellow-400'}>
                        {selectedOrder.payment_status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </p>
                    <p className="text-white"><span className="text-[#a09eb5] mr-2">Delivery Method:</span> {selectedOrder.delivery_method}</p>
                    {selectedOrder.prescription_id && (
                      <p className="text-white"><span className="text-[#a09eb5] mr-2">Prescription Status:</span> 
                        <span className={selectedOrder.prescription_status === 'approved' ? 'text-[#10b981]' : 'text-red-400'}>
                          {selectedOrder.prescription_status?.toUpperCase()}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-4">Order Items</h3>
              <div className="bg-[#1a1825] rounded-xl border border-white/5 overflow-hidden mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="text-left py-3 px-4 text-[#a09eb5] font-medium text-sm">Product</th>
                      <th className="text-center py-3 px-4 text-[#a09eb5] font-medium text-sm">Batch</th>
                      <th className="text-center py-3 px-4 text-[#a09eb5] font-medium text-sm">Rx Req</th>
                      <th className="text-right py-3 px-4 text-[#a09eb5] font-medium text-sm">Price</th>
                      <th className="text-center py-3 px-4 text-[#a09eb5] font-medium text-sm">Qty Ordered</th>
                      <th className="text-right py-3 px-4 text-[#a09eb5] font-medium text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item: any) => (
                      <tr key={item.id} className="border-b border-white/5 last:border-0">
                        <td className="py-3 px-4 text-white">{item.drug_name}</td>
                        <td className="py-3 px-4 text-center text-[#a09eb5]">{item.batch_id}</td>
                        <td className="py-3 px-4 text-center">
                          {item.requires_prescription ? (
                            <span className="text-red-400 text-xs font-bold border border-red-400/30 px-2 py-0.5 rounded">Rx</span>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-white">{formatCurrency(item.unit_price)}</td>
                        <td className="py-3 px-4 text-center font-bold text-[#10b981]">{item.quantity}</td>
                        <td className="py-3 px-4 text-right text-white">{formatCurrency((item.unit_price * item.quantity) - (item.discount || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-white/5 font-bold">
                      <td colSpan={5} className="py-4 px-4 text-right text-white">Grand Total:</td>
                      <td className="py-4 px-4 text-right text-[#10b981] text-lg">{formatCurrency(selectedOrder.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Action Area depending on status */}
              <div className="bg-[#1a1825] rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center space-y-4">
                <h3 className="text-white font-bold text-lg mb-2">Actions</h3>
                
                {selectedOrder.status === 'pending' || selectedOrder.status === 'placed' || selectedOrder.status === 'pending_prescription' ? (
                  isRejecting ? (
                    <div className="w-full max-w-md space-y-3">
                      <input 
                        type="text" 
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter rejection reason..."
                        className="w-full bg-[#232136] border border-red-500/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-500"
                      />
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => handleStatusUpdate('rejected', true)}
                          disabled={actionLoading}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                          Confirm Rejection
                        </button>
                        <button 
                          onClick={() => setIsRejecting(false)}
                          disabled={actionLoading}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-4">
                      <button 
                        onClick={() => handleStatusUpdate('confirmed')}
                        disabled={actionLoading}
                        className="flex items-center space-x-2 bg-[#10b981] hover:bg-[#059669] text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Confirm Order</span>
                      </button>
                      <button 
                        onClick={() => setIsRejecting(true)}
                        disabled={actionLoading}
                        className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )
                ) : selectedOrder.status === 'confirmed' ? (
                  <button 
                    onClick={() => handleStatusUpdate('preparing')}
                    disabled={actionLoading}
                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Preparation</span>
                  </button>
                ) : selectedOrder.status === 'preparing' || selectedOrder.status === 'processing' ? (
                  <button 
                    onClick={() => handleStatusUpdate('ready')}
                    disabled={actionLoading}
                    className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    <Clock className="w-5 h-5" />
                    <span>Mark as Ready</span>
                  </button>
                ) : selectedOrder.status === 'ready' ? (
                  <button 
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={actionLoading}
                    className="flex items-center space-x-2 bg-[#10b981] hover:bg-[#059669] text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Complete & Fulfil</span>
                  </button>
                ) : (
                  <p className="text-[#a09eb5]">No further actions available for this state.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
