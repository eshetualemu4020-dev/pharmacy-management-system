import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, Layers } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { formatCurrency } from '../../utils/currency';

export default function PharmacistDrugBatchesTab() {
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
      setBatches(data);
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
          <h1 className="text-3xl font-bold text-white mb-2">Drug Batches</h1>
          <p className="text-[#a09eb5]">Monitor drug batches and manufacturing details.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-3" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#232136] p-4 rounded-2xl border border-white/5 mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="w-5 h-5 text-[#a09eb5] absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by drug name or batch number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#110f22] border border-white/10 text-white rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-[#10b981] transition-colors"
          />
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-[#232136] rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#a09eb5]">Loading batches...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#110f22]/50 border-b border-white/5">
                  <th className="p-4 text-[#a09eb5] font-semibold text-sm">Batch Number</th>
                  <th className="p-4 text-[#a09eb5] font-semibold text-sm">Drug Name</th>
                  <th className="p-4 text-[#a09eb5] font-semibold text-sm">Quantity</th>
                  <th className="p-4 text-[#a09eb5] font-semibold text-sm">Unit Cost</th>
                  <th className="p-4 text-[#a09eb5] font-semibold text-sm">Mfg Date</th>
                  <th className="p-4 text-[#a09eb5] font-semibold text-sm">Expiry Date</th>
                  <th className="p-4 text-[#a09eb5] font-semibold text-sm text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch) => {
                  const today = new Date();
                  const expDate = new Date(batch.exp_date);
                  const isExpired = expDate < today;
                  const monthsToExpiry = (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
                  const isExpiringSoon = monthsToExpiry > 0 && monthsToExpiry <= 3;
                  
                  return (
                    <tr key={batch.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Layers className="w-4 h-4 text-[#3b82f6]" />
                          <span className="font-medium text-white">{batch.batch_number}</span>
                        </div>
                      </td>
                      <td className="p-4 text-white">{batch.drug_name}</td>
                      <td className="p-4">
                        <span className="font-medium text-white">{batch.quantity}</span>
                      </td>
                      <td className="p-4 text-[#a09eb5]">{formatCurrency(batch.unit_cost)}</td>
                      <td className="p-4 text-[#a09eb5]">
                        {new Date(batch.mfg_date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-[#a09eb5]">
                        {new Date(batch.exp_date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        {isExpired ? (
                          <span className="bg-red-500/10 text-red-400 text-xs px-2.5 py-1 rounded-full font-medium">Expired</span>
                        ) : isExpiringSoon ? (
                          <span className="bg-orange-500/10 text-orange-400 text-xs px-2.5 py-1 rounded-full font-medium">Expiring Soon</span>
                        ) : (
                          <span className="bg-[#10b981]/10 text-[#10b981] text-xs px-2.5 py-1 rounded-full font-medium">Valid</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredBatches.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#a09eb5]">
                      No batches found.
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
