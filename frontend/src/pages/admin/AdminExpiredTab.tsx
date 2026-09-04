import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { Search, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import AdminDrugDetailsModal from './components/AdminDrugDetailsModal';

export default function AdminExpiredTab() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [selectedDrug, setSelectedDrug] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchExpired();
  }, [page, debouncedSearch]);

  const fetchExpired = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getAllBatches({
        page,
        limit: 20,
        search: debouncedSearch,
        status: 'expired'
      });
      setBatches(data.data || []);
      setTotalPages(data.totalPages || 1);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch expired batches');
    } finally {
      setLoading(false);
    }
  };

  const getDaysSinceExpiry = (expDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expDate);
    const diffTime = today.getTime() - expiry.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-main flex items-center gap-2">
            <XCircle className="text-red-500" />
            Expired Drugs
          </h2>
          <p className="text-muted mt-1">Batches that have passed their expiration date and require safe disposal.</p>
        </div>
        <button 
          onClick={fetchExpired}
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
              className="w-full bg-base border border-subtle-hover rounded-xl pl-10 pr-4 py-2 text-main focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
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
                <th className="pb-3 font-medium">Exp Date</th>
                <th className="pb-3 font-medium text-center">Days Expired</th>
                <th className="pb-3 font-medium text-right">Qty Left</th>
                <th className="pb-3 font-medium">Supplier</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-red-500 mb-4" />
                      Loading expired batches...
                    </div>
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    Good news! No expired batches found.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const daysExpired = getDaysSinceExpiry(batch.exp_date);
                  const isDepleted = batch.quantity === 0;

                  return (
                    <tr key={batch.id} className="border-b border-subtle hover:bg-hover transition-colors">
                      <td className="py-4">
                        <div className="font-medium text-main">{batch.drug_name}</div>
                        <div className="text-xs text-muted mt-1">{batch.batch_number}</div>
                      </td>
                      <td className="py-4 text-red-400 font-medium">{new Date(batch.exp_date).toLocaleDateString()}</td>
                      <td className="py-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20">
                          {daysExpired} days
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <span className={`font-bold ${isDepleted ? 'text-gray-500' : 'text-red-400'}`}>
                          {batch.quantity}
                        </span>
                      </td>
                      <td className="py-4 text-muted">
                        {batch.supplier_name || '-'}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => setSelectedDrug({ id: batch.drug_id, name: batch.drug_name, generic_name: batch.generic_name, category_name: batch.category_name, min_stock_level: batch.min_stock_level, available_quantity: batch.quantity })}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-colors"
                        >
                          Dispose / Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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
