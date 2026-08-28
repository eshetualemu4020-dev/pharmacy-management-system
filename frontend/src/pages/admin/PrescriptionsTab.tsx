import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import PrescriptionDetailsModal from './components/PrescriptionDetailsModal';

export default function PrescriptionsTab() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      
      const res = await fetch(`http://localhost:8000/api/admin/prescriptions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch prescriptions');
      }
      
      const data = await res.json();
      setPrescriptions(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrescriptions();
  };

  const handleOpenDetails = (id: number) => {
    setSelectedPrescriptionId(id);
    setIsDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium flex items-center w-fit"><Clock className="w-3 h-3 mr-1"/> Pending</span>;
      case 'approved': return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium flex items-center w-fit"><CheckCircle2 className="w-3 h-3 mr-1"/> Approved</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium flex items-center w-fit"><XCircle className="w-3 h-3 mr-1"/> Rejected</span>;
      default: return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="flex-1 p-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Prescription Management</h1>
          <p className="text-[#a09eb5]">Oversight of customer prescriptions and pharmacist reviews.</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-[#232136] p-4 rounded-2xl border border-white/5 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a09eb5]" />
          <input 
            type="text" 
            placeholder="Search by ID, name, email or order ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#110f22] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-[#9b51e0] transition-colors"
          />
        </form>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a09eb5]" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#110f22] border border-white/5 rounded-xl pl-9 pr-8 py-2.5 text-white focus:outline-none focus:border-[#9b51e0] transition-colors appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center">
          <XCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-[#232136] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-left text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Prescription ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Date Submitted</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Reviewed By</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#a09eb5]">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-[#9b51e0] border-t-transparent rounded-full animate-spin mr-3"></div>
                      Loading prescriptions...
                    </div>
                  </td>
                </tr>
              ) : prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-[#a09eb5] mx-auto mb-4 opacity-50" />
                    <p className="text-white font-medium mb-1">No Prescriptions Found</p>
                    <p className="text-[#a09eb5] text-sm">There are no prescriptions matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                prescriptions.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">#{p.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{p.customer_name}</div>
                      <div className="text-[#a09eb5] text-xs">{p.customer_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#a09eb5]">#{p.order_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#a09eb5]">{new Date(p.created_at).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="px-6 py-4">
                      {p.pharmacist_name ? (
                        <span className="text-white">{p.pharmacist_name}</span>
                      ) : (
                        <span className="text-[#a09eb5] italic">Unreviewed</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpenDetails(p.id)}
                        className="p-2 text-[#a09eb5] hover:text-[#9b51e0] hover:bg-[#9b51e0]/10 rounded-lg transition-colors"
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
      </div>

      {isDetailsOpen && selectedPrescriptionId && (
        <PrescriptionDetailsModal
          prescriptionId={selectedPrescriptionId}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}
    </div>
  );
}
