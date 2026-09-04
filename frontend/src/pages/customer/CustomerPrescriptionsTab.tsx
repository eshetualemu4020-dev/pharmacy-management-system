import React, { useState, useEffect } from 'react';
import { FileText, FileUp, Eye, Search, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { customerPrescriptionApi } from '../../services/api';

interface CustomerPrescriptionsTabProps {
  onNavigate: (tab: string, id?: string) => void;
}

const CustomerPrescriptionsTab: React.FC<CustomerPrescriptionsTabProps> = ({ onNavigate }) => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchPrescriptions();
  }, [filter, page]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerPrescriptionApi.getPrescriptions({
        search,
        status: filter,
        page,
        limit
      });
      setPrescriptions(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Unable to load your prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPrescriptions();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'under_review':
        return (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/30 flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
      case 'approved':
        return (
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/30 flex items-center gap-1.5 w-fit">
            <CheckCircle className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium border border-red-500/30 flex items-center gap-1.5 w-fit">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium border border-gray-500/30 w-fit">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header section matching dark theme */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-main flex items-center gap-3">
            <FileText className="w-7 h-7 text-[#6b4cff]" />
            Prescriptions
          </h2>
          <p className="text-gray-400 mt-1">Manage your prescription submissions and review status.</p>
        </div>
        <button
          onClick={() => onNavigate('prescription-upload')}
          className="bg-[#6b4cff] hover:bg-[#5839e0] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg shadow-[#6b4cff]/20"
        >
          <FileUp className="w-5 h-5" />
          Upload Prescription
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-alt p-4 rounded-xl border border-subtle">
        <div className="flex flex-wrap gap-2">
          {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
            <button
              key={status}
              onClick={() => { setFilter(status); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === status 
                  ? 'bg-[#6b4cff] text-white shadow-md' 
                  : 'bg-hover text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search Rx or Order #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-hover border border-subtle-hover rounded-lg text-main placeholder-gray-500 focus:outline-none focus:border-[#6b4cff] focus:ring-1 focus:ring-[#6b4cff] transition-all"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6b4cff]"></div>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-surface-alt rounded-xl border border-subtle p-12 text-center">
          <div className="w-16 h-16 bg-hover rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-main mb-2">No Prescriptions Yet</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            You haven't submitted any prescriptions or none match your current filters.
          </p>
          <button
            onClick={() => onNavigate('prescription-upload')}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-lg transition-colors font-medium border border-subtle"
          >
            Upload Prescription
          </button>
        </div>
      ) : (
        <>
          <div className="bg-surface-alt rounded-xl border border-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 border-b border-subtle">
                    <th className="p-4 text-sm font-semibold text-gray-300">Prescription #</th>
                    <th className="p-4 text-sm font-semibold text-gray-300">Related Order</th>
                    <th className="p-4 text-sm font-semibold text-gray-300">Submission Date</th>
                    <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                    <th className="p-4 text-sm font-semibold text-gray-300 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {prescriptions.map((rx) => (
                    <tr key={rx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <span className="text-main font-medium">RX-{rx.id.toString().padStart(5, '0')}</span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => onNavigate('order-details', rx.order_id.toString())}
                          className="text-[#6b4cff] hover:text-[#8b73ff] hover:underline transition-colors font-medium"
                        >
                          ORD-{rx.order_id.toString().padStart(4, '0')}
                        </button>
                      </td>
                      <td className="p-4 text-gray-400">
                        {formatDate(rx.created_at)}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(rx.status)}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => onNavigate('prescription-details', rx.id.toString())}
                          className="p-2 hover:bg-[#6b4cff]/10 text-gray-400 hover:text-[#6b4cff] rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-medium">View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-surface-alt p-4 rounded-xl border border-subtle">
              <span className="text-gray-400 text-sm">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalItems)} of {totalItems} entries
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 bg-hover text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 bg-hover text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerPrescriptionsTab;
