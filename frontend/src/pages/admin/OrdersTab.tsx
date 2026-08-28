import { formatCurrency } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, CheckCircle2, Clock, Truck, Package, XCircle, FileText } from 'lucide-react';
import { orderApi } from '../../services/api';
import OrderDetailsModal from './components/OrderDetailsModal';

export default function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderApi.getOrders({
        page,
        limit,
        search: searchTerm,
        status: statusFilter,
        payment_status: paymentFilter
      });
      setOrders(data.data);
      setTotalPages(data.pagination.totalPages);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleOpenDetails = (id: number) => {
    setSelectedOrderId(id);
    setIsDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium flex items-center w-fit"><Clock className="w-3 h-3 mr-1"/> Pending</span>;
      case 'confirmed': return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium flex items-center w-fit"><CheckCircle2 className="w-3 h-3 mr-1"/> Confirmed</span>;
      case 'processing': return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium flex items-center w-fit"><Package className="w-3 h-3 mr-1"/> Processing</span>;
      case 'ready': return <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-medium flex items-center w-fit"><Package className="w-3 h-3 mr-1"/> Ready</span>;
      case 'out_for_delivery': return <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-xs font-medium flex items-center w-fit"><Truck className="w-3 h-3 mr-1"/> Out for Delivery</span>;
      case 'delivered': return <span className="px-2 py-1 bg-teal-500/20 text-teal-400 rounded-lg text-xs font-medium flex items-center w-fit"><CheckCircle2 className="w-3 h-3 mr-1"/> Delivered</span>;
      case 'completed': return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium flex items-center w-fit"><CheckCircle2 className="w-3 h-3 mr-1"/> Completed</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium flex items-center w-fit"><XCircle className="w-3 h-3 mr-1"/> Cancelled</span>;
      default: return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium">{status}</span>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium w-fit">Paid</span>;
      case 'pending': return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium w-fit">Pending</span>;
      case 'failed': return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium w-fit">Failed</span>;
      case 'refunded': return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium w-fit">Refunded</span>;
      default: return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="flex-1 p-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Order Management</h1>
          <p className="text-[#a09eb5]">Monitor and manage customer orders lifecycle.</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-[#232136] p-4 rounded-2xl border border-white/5 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a09eb5]" />
          <input 
            type="text" 
            placeholder="Search by ID, name, email or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#110f22] border border-white/5 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-[#9b51e0] transition-colors"
          />
        </form>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#110f22] border border-white/5 text-[#a09eb5] px-4 py-2 rounded-xl focus:outline-none focus:border-[#9b51e0] appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="ready">Ready</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select 
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            className="bg-[#110f22] border border-white/5 text-[#a09eb5] px-4 py-2 rounded-xl focus:outline-none focus:border-[#9b51e0] appearance-none"
          >
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select 
            value={searchTerm.startsWith('delivery:') ? searchTerm.split(':')[1] : ''}
            onChange={(e) => { setSearchTerm(e.target.value ? `delivery:${e.target.value}` : ''); setPage(1); }}
            className="bg-[#110f22] border border-white/5 text-[#a09eb5] px-4 py-2 rounded-xl focus:outline-none focus:border-[#9b51e0] appearance-none"
          >
            <option value="">All Methods</option>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#232136] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-10 text-center text-[#a09eb5]">Loading orders...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-400">{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-[#a09eb5]">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Order Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Prescription</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white">ORD-{order.id.toString().padStart(4, '0')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{order.customer_name}</div>
                      <div className="text-xs text-[#a09eb5]">{order.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 text-[#a09eb5] text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{order.total_items}</td>
                    <td className="px-6 py-4 text-white font-semibold">{formatCurrency(order.total_amount)}</td>
                    <td className="px-6 py-4">{getPaymentBadge(order.payment_status)}</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4">
                      {order.prescription_status ? (
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          order.prescription_status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          order.prescription_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          Rx: {order.prescription_status.charAt(0).toUpperCase() + order.prescription_status.slice(1)}
                        </span>
                      ) : (
                        <span className="text-[#a09eb5] text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenDetails(order.id)}
                        className="p-2 bg-white/5 hover:bg-[#9b51e0]/20 text-[#a09eb5] hover:text-[#9b51e0] rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/5 flex justify-between items-center">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              Previous
            </button>
            <span className="text-[#a09eb5] text-sm">
              Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages}</span>
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white/5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {isDetailsOpen && selectedOrderId && (
        <OrderDetailsModal 
          orderId={selectedOrderId} 
          onClose={() => { setIsDetailsOpen(false); setSelectedOrderId(null); }}
          onUpdate={fetchOrders}
        />
      )}
    </div>
  );
}
