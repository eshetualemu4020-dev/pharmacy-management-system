import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, Pill } from 'lucide-react';
import { inventoryApi } from '../../services/api';

export default function PharmacistLowStockTab() {
  const [drugs, setDrugs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getList();
      // Filter only low stock items
      const lowStockItems = data.filter((d: any) => d.total_stock <= d.min_stock_level);
      setDrugs(lowStockItems);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const filteredDrugs = drugs.filter(drug => {
    return drug.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (drug.generic_name && drug.generic_name.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="flex-1 p-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Low Stock Alerts</h1>
          <p className="text-[#a09eb5]">Monitor medicines that are at or below their minimum stock level.</p>
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
            placeholder="Search by drug name or generic name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#110f22] border border-white/10 text-white rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-[#10b981] transition-colors"
          />
        </div>
      </div>

      {/* Low Stock Table */}
      <div className="bg-[#232136] rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#a09eb5]">Loading low stock items...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#110f22]/50 border-b border-white/5">
                  <th className="p-4 text-[#a09eb5] font-semibold text-sm">Drug Name</th>
                  <th className="p-4 text-[#a09eb5] font-semibold text-sm">Category</th>
                  <th className="p-4 text-[#a09eb5] font-semibold text-sm">Current Stock</th>
                  <th className="p-4 text-[#a09eb5] font-semibold text-sm">Min. Level</th>
                  <th className="p-4 text-[#a09eb5] font-semibold text-sm text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrugs.map((drug) => {
                  const isOutOfStock = drug.total_stock === 0;
                  return (
                    <tr key={drug.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <Pill className="w-4 h-4 text-[#a09eb5]" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{drug.name}</div>
                            <div className="text-xs text-[#a09eb5]">{drug.generic_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-[#a09eb5]">{drug.category_name || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`font-bold ${isOutOfStock ? 'text-red-400' : 'text-yellow-400'}`}>
                          {drug.total_stock}
                        </span>
                      </td>
                      <td className="p-4 text-[#a09eb5]">{drug.min_stock_level}</td>
                      <td className="p-4 text-right">
                        {isOutOfStock ? (
                          <span className="bg-red-500/10 text-red-400 text-xs px-2.5 py-1 rounded-full font-medium flex items-center justify-end w-fit ml-auto">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Out of Stock
                          </span>
                        ) : (
                          <span className="bg-yellow-500/10 text-yellow-400 text-xs px-2.5 py-1 rounded-full font-medium flex items-center justify-end w-fit ml-auto">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Low Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredDrugs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#10b981]">
                      No low stock alerts! All medications are sufficiently stocked.
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
