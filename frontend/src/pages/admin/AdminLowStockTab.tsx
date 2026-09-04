import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { Search, AlertTriangle, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import AdminDrugDetailsModal from './components/AdminDrugDetailsModal';

export default function AdminLowStockTab() {
  const [drugs, setDrugs] = useState<any[]>([]);
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
    fetchLowStock();
  }, [page, debouncedSearch]);

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getList({
        page,
        limit: 20,
        search: debouncedSearch,
        stock_status: 'replenishment' // fetches drugs where stock <= min_stock_level
      });
      setDrugs(data.data || []);
      setTotalPages(data.totalPages || 1);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch low stock alerts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-main flex items-center gap-2">
            <AlertTriangle className="text-yellow-400" />
            Low Stock Alerts
          </h2>
          <p className="text-muted mt-1">Drugs that have fallen below their minimum configured stock level.</p>
        </div>
        <button 
          onClick={fetchLowStock}
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
              placeholder="Search by drug name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-base border border-subtle-hover rounded-xl pl-10 pr-4 py-2 text-main focus:outline-none focus:border-yellow-400 transition-colors"
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
                <th className="pb-3 font-medium">Drug Name</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium text-right">Current Stock</th>
                <th className="pb-3 font-medium text-right">Min Stock Level</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && drugs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-yellow-400 mb-4" />
                      Checking inventory levels...
                    </div>
                  </td>
                </tr>
              ) : drugs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      </div>
                      <p>No low stock alerts! All items are sufficiently stocked.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                drugs.map((drug) => {
                  const isOutOfStock = drug.available_quantity === 0;
                  return (
                    <tr key={drug.id} className="border-b border-subtle hover:bg-hover transition-colors">
                      <td className="py-4">
                        <div className="font-medium text-main">{drug.name}</div>
                        {drug.generic_name && <div className="text-xs text-muted mt-1">{drug.generic_name}</div>}
                      </td>
                      <td className="py-4 text-muted">{drug.category_name || '-'}</td>
                      <td className="py-4 text-right">
                        <span className={`font-bold ${isOutOfStock ? 'text-red-400' : 'text-yellow-400'}`}>
                          {drug.available_quantity}
                        </span>
                      </td>
                      <td className="py-4 text-right text-main">
                        {drug.min_stock_level}
                      </td>
                      <td className="py-4 text-center">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                            Low Stock
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => setSelectedDrug(drug)}
                          className="px-3 py-1.5 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 rounded-lg text-xs font-medium transition-colors"
                        >
                          View Batches
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
