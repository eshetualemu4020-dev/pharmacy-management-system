import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { Search, Layers, AlertCircle, RefreshCw, XCircle, Clock, CheckCircle } from 'lucide-react';
import AdminDrugDetailsModal from './components/AdminDrugDetailsModal';

export default function AdminDrugBatchesTab() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Selected Drug for details modal
  const [selectedDrug, setSelectedDrug] = useState<any>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchBatches();
  }, [page, debouncedSearch, statusFilter]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getAllBatches({
        page,
        limit: 20,
        search: debouncedSearch,
        status: statusFilter
      });
      setBatches(data.data || []);
      setTotalPages(data.totalPages || 1);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch drug batches');
    } finally {
      setLoading(false);
    }
  };

  const getBatchStatus = (expDate: string, quantity: number) => {
    if (quantity === 0) return { label: 'Depleted', color: 'text-gray-400 bg-gray-400/10' };
    
    const expiry = new Date(expDate);
    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);

    if (expiry <= today) {
      return { label: 'Expired', color: 'text-red-400 bg-red-400/10' };
    } else if (expiry <= ninetyDaysFromNow) {
      return { label: 'Expiring Soon', color: 'text-yellow-400 bg-yellow-400/10' };
    } else {
      return { label: 'Available', color: 'text-green-400 bg-green-400/10' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-main flex items-center gap-2">
            <Layers className="text-[#3b82f6]" />
            Drug Batches
          </h2>
          <p className="text-muted mt-1">Manage and track all pharmaceutical drug batches.</p>
        </div>
        <button 
          onClick={fetchBatches}
          className="flex items-center gap-2 px-4 py-2 bg-hover hover:bg-white/10 text-white rounded-xl transition-colors border border-subtle-hover"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-subtle p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
            <input
              type="text"
              placeholder="Search by drug name or batch number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-base border border-subtle-hover rounded-xl pl-10 pr-4 py-2 text-main focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-base border border-subtle-hover rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#3b82f6] transition-colors appearance-none min-w-[200px]"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="depleted">Depleted</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-muted border-b border-subtle-hover">
                <th className="pb-3 font-medium">Drug / Batch</th>
                <th className="pb-3 font-medium">Mfg Date</th>
                <th className="pb-3 font-medium">Exp Date</th>
                <th className="pb-3 font-medium text-right">Qty</th>
                <th className="pb-3 font-medium">Supplier</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-[#3b82f6] mb-4" />
                      Loading batches...
                    </div>
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    No batches found matching your criteria.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const status = getBatchStatus(batch.exp_date, batch.quantity);
                  return (
                    <tr key={batch.id} className="border-b border-subtle hover:bg-hover transition-colors">
                      <td className="py-4">
                        <div className="font-medium text-main">{batch.drug_name}</div>
                        <div className="text-xs text-muted mt-1">{batch.batch_number}</div>
                      </td>
                      <td className="py-4 text-muted">{new Date(batch.mfg_date).toLocaleDateString()}</td>
                      <td className="py-4 text-muted">{new Date(batch.exp_date).toLocaleDateString()}</td>
                      <td className="py-4 text-right">
                        <span className="font-medium text-main">{batch.quantity}</span>
                      </td>
                      <td className="py-4 text-muted">
                        {batch.supplier_name || '-'}
                        {batch.po_number && <div className="text-xs mt-1 text-[#3b82f6]">{batch.po_number}</div>}
                      </td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => setSelectedDrug({ id: batch.drug_id, name: batch.drug_name, generic_name: batch.generic_name, category_name: batch.category_name, min_stock_level: batch.min_stock_level, available_quantity: batch.quantity })}
                          className="px-3 py-1.5 bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6]/20 rounded-lg text-xs font-medium transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-subtle pt-4">
            <div className="text-sm text-muted">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 bg-base border border-subtle-hover rounded-xl text-main disabled:opacity-50 disabled:cursor-not-allowed hover:bg-hover transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-4 py-2 bg-base border border-subtle-hover rounded-xl text-main disabled:opacity-50 disabled:cursor-not-allowed hover:bg-hover transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedDrug && (
        <AdminDrugDetailsModal 
          drug={selectedDrug} 
          onClose={() => setSelectedDrug(null)} 
        />
      )}
    </div>
  );
}
