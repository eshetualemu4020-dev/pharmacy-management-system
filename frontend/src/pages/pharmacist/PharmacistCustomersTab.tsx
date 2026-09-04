import React, { useState, useEffect } from 'react';
import { Search, Eye, ShoppingBag, ShoppingCart, FileText, CheckCircle, Clock, XCircle, ArrowLeft, User } from 'lucide-react';
import { customerApi } from '../../services/api';
import { formatCurrency } from '../../utils/currency';

interface PharmacistCustomersTabProps {
  onNavigate: (tab: string, context?: any) => void;
}

export default function PharmacistCustomersTab({ onNavigate }: PharmacistCustomersTabProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // List State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);
  
  // Detail State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'orders' | 'sales' | 'prescriptions'>('overview');
  
  // Related Data
  const [relatedData, setRelatedData] = useState<any[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedPage, setRelatedPage] = useState(1);
  const [relatedTotalPages, setRelatedTotalPages] = useState(1);

  // Fetch Customers List & Stats
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Fetch stats once if not loaded
      if (!stats) {
        try {
          const statsRes = await customerApi.getCustomerStats();
          setStats(statsRes);
        } catch (e) {
          console.error('Failed to load stats', e);
        }
      }

      const res = await customerApi.getCustomers({
        search: searchTerm,
        sort: sortOrder,
        page,
        limit: 10
      });
      setCustomers(res.data);
      setTotalPages(res.pagination.totalPages);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCustomer) {
      fetchCustomers();
    }
  }, [page, sortOrder, selectedCustomer]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  // Open Customer Details
  const openCustomerDetails = async (id: number) => {
    try {
      setDetailLoading(true);
      setDetailError('');
      const res = await customerApi.getCustomerById(id);
      setSelectedCustomer(res);
      setActiveSubTab('overview');
    } catch (err: any) {
      setDetailError(err.message || 'Failed to load customer details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Fetch Related Data based on sub-tab
  const fetchRelatedData = async () => {
    if (!selectedCustomer || activeSubTab === 'overview') return;
    
    try {
      setRelatedLoading(true);
      let res;
      if (activeSubTab === 'orders') {
        res = await customerApi.getCustomerOrders(selectedCustomer.id, { page: relatedPage, limit: 10 });
      } else if (activeSubTab === 'sales') {
        res = await customerApi.getCustomerSales(selectedCustomer.id, { page: relatedPage, limit: 10 });
      } else if (activeSubTab === 'prescriptions') {
        res = await customerApi.getCustomerPrescriptions(selectedCustomer.id, { page: relatedPage, limit: 10 });
      }
      
      if (res) {
        setRelatedData(res.data);
        setRelatedTotalPages(res.pagination.totalPages);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setRelatedLoading(false);
    }
  };

  useEffect(() => {
    fetchRelatedData();
  }, [activeSubTab, relatedPage, selectedCustomer]);

  const handleSubTabChange = (tab: any) => {
    setActiveSubTab(tab);
    setRelatedPage(1);
    setRelatedData([]);
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered': return <span className="text-[#10b981]">{status}</span>;
      case 'cancelled':
      case 'rejected': return <span className="text-red-400">{status}</span>;
      default: return <span className="text-yellow-400">{status}</span>;
    }
  };

  // ---------------------------------------------
  // Render: Customer Details View
  // ---------------------------------------------
  if (selectedCustomer) {
    if (detailLoading) {
       return <div className="flex-1 p-10 flex items-center justify-center text-muted">Loading customer details...</div>;
    }

    if (detailError) {
       return (
         <div className="flex-1 p-10 flex flex-col items-center justify-center">
            <p className="text-red-400 mb-4">{detailError}</p>
            <button onClick={() => setSelectedCustomer(null)} className="text-main bg-base px-4 py-2 rounded">Back to List</button>
         </div>
       );
    }

    return (
      <div className="flex-1 p-10 overflow-y-auto">
        <button 
          onClick={() => setSelectedCustomer(null)}
          className="flex items-center space-x-2 text-muted hover:text-main transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Customers</span>
        </button>

        {/* Header */}
        <div className="bg-surface rounded-2xl border border-subtle p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-base rounded-full flex items-center justify-center border border-subtle-hover">
              <User className="w-8 h-8 text-muted" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-main flex items-center space-x-3">
                <span>{selectedCustomer.name}</span>
              </h1>
              <p className="text-muted mt-1">ID: #{selectedCustomer.id} • Joined {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex space-x-4 mb-6 border-b border-subtle pb-2">
          {['overview', 'orders', 'sales', 'prescriptions'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleSubTabChange(tab)}
              className={`px-4 py-2 font-medium capitalize rounded-t-lg transition-colors ${
                activeSubTab === tab 
                  ? 'text-[#10b981] border-b-2 border-[#10b981]' 
                  : 'text-muted hover:text-main'
              }`}
            >
              {tab === 'sales' ? 'Sales History' : tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeSubTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface rounded-2xl border border-subtle p-6">
              <h3 className="text-lg font-bold text-main mb-4">Contact Information</h3>
              <div className="space-y-3">
                <p className="text-main"><span className="text-muted mr-2">Phone:</span> {selectedCustomer.phone || 'N/A'}</p>
                <p className="text-main"><span className="text-muted mr-2">Email:</span> {selectedCustomer.email || 'N/A'}</p>
                <p className="text-main"><span className="text-muted mr-2">Address:</span> {selectedCustomer.address || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-subtle p-6">
              <h3 className="text-lg font-bold text-main mb-4">Activity Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-base p-4 rounded-xl border border-subtle">
                  <p className="text-muted text-sm">Total Orders</p>
                  <p className="text-2xl font-bold text-main">{selectedCustomer.stats?.total_orders}</p>
                </div>
                <div className="bg-base p-4 rounded-xl border border-subtle">
                  <p className="text-muted text-sm">Completed Orders</p>
                  <p className="text-2xl font-bold text-[#10b981]">{selectedCustomer.stats?.completed_orders}</p>
                </div>
                <div className="bg-base p-4 rounded-xl border border-subtle">
                  <p className="text-muted text-sm">Pending Orders</p>
                  <p className="text-2xl font-bold text-yellow-500">{selectedCustomer.stats?.pending_orders}</p>
                </div>
                <div className="bg-base p-4 rounded-xl border border-subtle">
                  <p className="text-muted text-sm">Prescriptions</p>
                  <p className="text-2xl font-bold text-main">{selectedCustomer.stats?.total_prescriptions}</p>
                </div>
              </div>
              {selectedCustomer.stats?.last_order_date && (
                <p className="mt-4 text-sm text-muted">Last Order: {new Date(selectedCustomer.stats.last_order_date).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}

        {/* Related Data Tables */}
        {activeSubTab !== 'overview' && (
          <div className="bg-surface rounded-2xl border border-subtle overflow-hidden">
            {relatedLoading ? (
              <div className="p-8 text-center text-muted">Loading {activeSubTab}...</div>
            ) : relatedData.length === 0 ? (
              <div className="p-8 text-center text-muted">
                No {activeSubTab} found for this customer.
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-subtle">
                      {activeSubTab === 'orders' && (
                        <>
                          <th className="text-left py-4 px-6 text-muted font-medium text-sm">Order #</th>
                          <th className="text-left py-4 px-6 text-muted font-medium text-sm">Date</th>
                          <th className="text-left py-4 px-6 text-muted font-medium text-sm">Status</th>
                          <th className="text-right py-4 px-6 text-muted font-medium text-sm">Total</th>
                        </>
                      )}
                      {activeSubTab === 'sales' && (
                        <>
                          <th className="text-left py-4 px-6 text-muted font-medium text-sm">Sale #</th>
                          <th className="text-left py-4 px-6 text-muted font-medium text-sm">Date</th>
                          <th className="text-left py-4 px-6 text-muted font-medium text-sm">Payment</th>
                          <th className="text-right py-4 px-6 text-muted font-medium text-sm">Total</th>
                        </>
                      )}
                      {activeSubTab === 'prescriptions' && (
                        <>
                          <th className="text-left py-4 px-6 text-muted font-medium text-sm">Rx #</th>
                          <th className="text-left py-4 px-6 text-muted font-medium text-sm">Order #</th>
                          <th className="text-left py-4 px-6 text-muted font-medium text-sm">Status</th>
                          <th className="text-left py-4 px-6 text-muted font-medium text-sm">Date</th>
                        </>
                      )}
                      <th className="text-right py-4 px-6 text-muted font-medium text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedData.map((item) => (
                      <tr key={item.id} className="border-b border-subtle hover:bg-hover transition-colors">
                        {activeSubTab === 'orders' && (
                          <>
                            <td className="py-4 px-6 text-main">#{item.id}</td>
                            <td className="py-4 px-6 text-main">{new Date(item.created_at).toLocaleString()}</td>
                            <td className="py-4 px-6">{getOrderStatusBadge(item.status)}</td>
                            <td className="py-4 px-6 text-right text-[#10b981]">{formatCurrency(item.total_amount)}</td>
                          </>
                        )}
                        {activeSubTab === 'sales' && (
                          <>
                            <td className="py-4 px-6 text-main">{item.sell_no}</td>
                            <td className="py-4 px-6 text-main">{new Date(item.created_at).toLocaleString()}</td>
                            <td className="py-4 px-6 text-main">{item.payment_method?.toUpperCase()}</td>
                            <td className="py-4 px-6 text-right text-[#10b981]">{formatCurrency(item.total_amount)}</td>
                          </>
                        )}
                        {activeSubTab === 'prescriptions' && (
                          <>
                            <td className="py-4 px-6 text-main">#{item.id}</td>
                            <td className="py-4 px-6 text-main">#{item.order_id}</td>
                            <td className="py-4 px-6 text-main">{item.status}</td>
                            <td className="py-4 px-6 text-main">{new Date(item.created_at).toLocaleString()}</td>
                          </>
                        )}
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => onNavigate(activeSubTab === 'sales' ? 'pos' : activeSubTab, { search: activeSubTab === 'sales' ? item.sell_no : item.id.toString(), contextId: item.id })}
                            className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors"
                          >
                            View in {activeSubTab === 'sales' ? 'Sales History' : activeSubTab.charAt(0).toUpperCase() + activeSubTab.slice(1)}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {relatedTotalPages > 1 && (
                  <div className="p-4 border-t border-subtle flex justify-center space-x-2">
                    {Array.from({ length: relatedTotalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setRelatedPage(idx + 1)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium transition-colors ${
                          relatedPage === idx + 1 ? 'bg-[#10b981] text-main' : 'bg-base text-muted hover:text-main'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------
  // Render: Customer List View
  // ---------------------------------------------
  return (
    <div className="flex-1 p-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-main mb-2">Customers</h1>
          <p className="text-muted">View and manage customer information required for pharmacy operations.</p>
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface border border-subtle p-6 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-muted text-sm">Total Customers</p>
              <p className="text-2xl font-bold text-main">{stats.total_customers}</p>
            </div>
          </div>
          <div className="bg-surface border border-subtle p-6 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#10b981]/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[#10b981]" />
            </div>
            <div>
              <p className="text-muted text-sm">Customers With Orders</p>
              <p className="text-2xl font-bold text-main">{stats.active_customers}</p>
            </div>
          </div>
          <div className="bg-surface border border-subtle p-6 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-muted text-sm">New Customers (30d)</p>
              <p className="text-2xl font-bold text-main">{stats.new_customers}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-subtle p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-muted absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by ID, Name, Phone, or Email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-base border border-subtle-hover rounded-xl py-3 pl-12 pr-4 text-main focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={sortOrder} 
              onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
              className="bg-base border border-subtle-hover text-main rounded-xl px-4 py-3 focus:outline-none focus:border-[#10b981] appearance-none"
            >
              <option value="newest">Registration: Newest First</option>
              <option value="oldest">Registration: Oldest First</option>
            </select>
            <button type="submit" className="bg-[#10b981] hover:bg-[#059669] text-main px-6 py-3 rounded-xl font-medium transition-colors">
              Search
            </button>
          </div>
        </form>
      </div>

      <div className="bg-surface rounded-2xl border border-subtle overflow-hidden">
        {loading && <div className="p-8 text-center text-muted">Loading customers...</div>}
        {error && <div className="p-8 text-center text-red-400">{error}</div>}
        
        {!loading && !error && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-subtle">
                <th className="text-left py-4 px-6 text-muted font-medium text-sm">ID</th>
                <th className="text-left py-4 px-6 text-muted font-medium text-sm">Name</th>
                <th className="text-left py-4 px-6 text-muted font-medium text-sm">Contact</th>
                <th className="text-left py-4 px-6 text-muted font-medium text-sm">Registered</th>
                <th className="text-right py-4 px-6 text-muted font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted">No customers found.</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-subtle hover:bg-hover transition-colors">
                    <td className="py-4 px-6 text-main font-medium">#{customer.id}</td>
                    <td className="py-4 px-6 text-main font-medium">{customer.name}</td>
                    <td className="py-4 px-6">
                      <div className="text-main">{customer.phone || 'N/A'}</div>
                      <div className="text-muted text-sm">{customer.email || 'N/A'}</div>
                    </td>
                    <td className="py-4 px-6 text-muted">{new Date(customer.created_at).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => openCustomerDetails(customer.id)}
                        className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="View Customer Details"
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
          <div className="p-4 border-t border-subtle flex justify-center space-x-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPage(idx + 1)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium transition-colors ${
                  page === idx + 1 ? 'bg-[#10b981] text-main' : 'bg-base text-muted hover:text-main'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
