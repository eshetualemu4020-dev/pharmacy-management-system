import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, Layers, Clock } from 'lucide-react';
import { inventoryApi } from '../../services/api';

export default function PharmacistExpiringSoonTab() {
  const [batches, setBatches] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getAllBatches();
      
      const today = new Date();
      // Filter batches that are expired or expiring within 3 months
      const expiringBatches = data.filter((b: any) => {
        const expDate = new Date(b.exp_date);
        const monthsToExpiry = (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsToExpiry <= 3;
      });
      
      setBatches(expiringBatches);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter(batch => {
    return batch.drug_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex-1 p-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-main mb-2">Expiring Soon</h1>
          <p className="text-muted">Monitor drug batches that have expired or will expire within 3 months.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-3" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface p-4 rounded-2xl border border-subtle mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by drug name or batch number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-base border border-subtle-hover text-main rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-[#10b981] transition-colors"
          />
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-surface rounded-2xl border border-subtle overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted">Loading expiring batches...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-base/50 border-b border-subtle">
                  <th className="p-4 text-muted font-semibold text-sm">Batch Number</th>
                  <th className="p-4 text-muted font-semibold text-sm">Drug Name</th>
                  <th className="p-4 text-muted font-semibold text-sm">Quantity</th>
                  <th className="p-4 text-muted font-semibold text-sm">Expiry Date</th>
                  <th className="p-4 text-muted font-semibold text-sm text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch) => {
                  const today = new Date();
                  const expDate = new Date(batch.exp_date);
                  const isExpired = expDate < today;
                  
                  return (
                    <tr key={batch.id} className="border-b border-subtle hover:bg-hover transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Layers className="w-4 h-4 text-[#3b82f6]" />
                          <span className="font-medium text-main">{batch.batch_number}</span>
                        </div>
                      </td>
                      <td className="p-4 text-main">{batch.drug_name}</td>
                      <td className="p-4">
                        <span className="font-medium text-main">{batch.quantity}</span>
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${isExpired ? 'text-red-400' : 'text-orange-400'}`}>
                          {new Date(batch.exp_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {isExpired ? (
                          <span className="bg-red-500/10 text-red-400 text-xs px-2.5 py-1 rounded-full font-medium flex items-center justify-end w-fit ml-auto">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Expired
                          </span>
                        ) : (
                          <span className="bg-orange-500/10 text-orange-400 text-xs px-2.5 py-1 rounded-full font-medium flex items-center justify-end w-fit ml-auto">
                            <Clock className="w-3 h-3 mr-1" />
                            Expiring Soon
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredBatches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#10b981]">
                      No batches are expired or expiring within the next 3 months!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
