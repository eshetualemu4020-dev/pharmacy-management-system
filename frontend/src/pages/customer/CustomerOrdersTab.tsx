import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Filter, Calendar, ChevronRight, 
  Clock, CheckCircle, XCircle, AlertCircle, RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { customerOrderApi } from '../../services/api';

interface Order {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
  total_items: number;
}

interface CustomerOrdersTabProps {
  onViewOrderDetails: (orderId: number) => void;
}

const CustomerOrdersTab: React.FC<CustomerOrdersTabProps> = ({ onViewOrderDetails }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState('all');
  const [sort, setSort] = useState('newest');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerOrderApi.getOrders({
        search: searchTerm,
        status: statusFilter,
        date_range: dateRange,
        sort,
        page,
        limit: 10
      });
      setOrders(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, dateRange, sort]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchOrders();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
      case 'pending_prescription':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'confirmed':
      case 'preparing':
      case 'ready':
      case 'shipped':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'delivered':
      case 'completed':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-hover text-muted border-subtle-hover';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <CheckCircle size={16} className="mr-1.5" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle size={16} className="mr-1.5" />;
      case 'placed':
      case 'pending_prescription':
        return <AlertCircle size={16} className="mr-1.5" />;
      default:
        return <Clock size={16} className="mr-1.5" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="h-full bg-base overflow-y-auto">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-main flex items-center gap-3">
              <ShoppingBag className="text-[#6b4cff]" size={32} />
              My Orders
            </h1>
            <p className="text-muted mt-2">Track and manage your order history.</p>
          </div>
          <button 
            onClick={fetchOrders}
            className="p-2.5 text-muted bg-surface-alt hover:bg-white/10 border border-subtle rounded-xl transition-colors"
            title="Refresh orders"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

      {/* Filters and Controls */}
      <div className="bg-surface-alt p-5 rounded-2xl border border-subtle space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              placeholder="Search by Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-base text-main border border-subtle-hover rounded-xl focus:outline-none focus:border-[#6b4cff]/50 focus:ring-1 focus:ring-[#6b4cff]/50 transition-all placeholder:text-muted"
            />
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <div className="relative flex-1 min-w-[140px]">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-8 py-3 bg-base text-main border border-subtle-hover rounded-xl focus:outline-none focus:border-[#6b4cff]/50 appearance-none"
              >
                <option value="All">All Statuses</option>
                <option value="placed">Placed</option>
                <option value="pending_prescription">Pending RX</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="relative hidden sm:block flex-1 min-w-[140px]">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={16} />
              <select
                value={dateRange}
                onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-8 py-3 bg-base text-main border border-subtle-hover rounded-xl focus:outline-none focus:border-[#6b4cff]/50 appearance-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="px-4 py-3 bg-base text-main border border-subtle-hover rounded-xl focus:outline-none focus:border-[#6b4cff]/50 flex-1 min-w-[140px]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-surface-alt rounded-2xl border border-subtle overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-muted">
            <RefreshCw size={32} className="animate-spin text-[#6b4cff] mb-4" />
            <p>Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-64 text-red-400">
            <AlertCircle size={32} className="mb-4" />
            <p>{error}</p>
            <button 
              onClick={fetchOrders}
              className="mt-4 px-6 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-80 text-muted">
            <ShoppingBag size={64} className="text-muted/30 mb-6" />
            <p className="text-xl font-bold text-main mb-2">No orders found</p>
            <p>Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-base/50 border-b border-subtle">
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-muted uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-5 text-xs font-bold text-muted uppercase tracking-wider">Date</th>
                  <th className="px-6 py-5 text-xs font-bold text-muted uppercase tracking-wider">Items</th>
                  <th className="px-6 py-5 text-xs font-bold text-muted uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-5 text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-5 text-xs font-bold text-muted uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-hover transition-colors cursor-pointer group"
                    onClick={() => onViewOrderDetails(order.id)}
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="font-bold text-main group-hover:text-[#6b4cff] transition-colors">
                        #ORD-{order.id.toString().padStart(4, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-main">
                        {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-muted">
                      <span className="bg-base px-3 py-1 rounded-full border border-subtle">
                        {order.total_items} {order.total_items === 1 ? 'item' : 'items'}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="font-bold text-main text-lg">
                        {Number(order.total_amount).toFixed(2)} <span className="text-sm font-normal text-muted">ETB</span>
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onViewOrderDetails(order.id); }}
                        className="text-[#6b4cff] hover:text-[#5a3ee0] inline-flex items-center font-bold text-sm bg-[#6b4cff]/10 hover:bg-[#6b4cff]/20 px-4 py-2 rounded-xl transition-colors"
                      >
                        Details
                        <ChevronRight size={16} className="ml-1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-surface-alt px-6 py-4 border border-subtle rounded-2xl">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-xl border border-subtle-hover bg-base px-4 py-2 text-sm font-medium text-main hover:bg-hover disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="relative ml-3 inline-flex items-center rounded-xl border border-subtle-hover bg-base px-4 py-2 text-sm font-medium text-main hover:bg-hover disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted">
                Showing <span className="font-bold text-main">{(page - 1) * 10 + 1}</span> to <span className="font-bold text-main">{Math.min(page * 10, totalItems)}</span> of{' '}
                <span className="font-bold text-main">{totalItems}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-l-xl px-3 py-2 text-muted bg-base border border-subtle-hover hover:bg-hover focus:z-20 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronRight size={16} className="rotate-180" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-bold border border-subtle-hover focus:z-20 ${
                      p === page 
                        ? 'z-10 bg-[#6b4cff] text-white border-[#6b4cff]'
                        : 'text-main bg-base hover:bg-hover'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center rounded-r-xl px-3 py-2 text-muted bg-base border border-subtle-hover hover:bg-hover focus:z-20 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight size={16} />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CustomerOrdersTab;
