import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { PackageOpen, AlertTriangle, XCircle, Clock, Search, History, Check, Plus, Package } from 'lucide-react';

export default function InventoryTab() {
  const [summary, setSummary] = useState<any>(null);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeView, setActiveView] = useState<'stock' | 'history'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Batch Modal State
  const [selectedDrug, setSelectedDrug] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  
  // Add Stock Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({
    batch_number: '',
    quantity: '',
    mfg_date: '',
    exp_date: '',
    remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumData, listData, txData] = await Promise.all([
        inventoryApi.getSummary(),
        inventoryApi.getList(),
        inventoryApi.getTransactions()
      ]);
      setSummary(sumData);
      setDrugs(listData);
      setTransactions(txData);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBatches = async (drug: any) => {
    setSelectedDrug(drug);
    setIsBatchModalOpen(true);
    setShowAddForm(false);
    try {
      const data = await inventoryApi.getBatches(drug.id);
      setBatches(data);
    } catch (err: any) {
      alert(err.message || 'Failed to load batches');
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrug) return;
    
    try {
      await inventoryApi.adjustStock({
        drug_id: selectedDrug.id,
        batch_number: addFormData.batch_number,
        quantity: addFormData.quantity,
        mfg_date: addFormData.mfg_date,
        exp_date: addFormData.exp_date,
        transaction_type: 'ADD',
        remarks: addFormData.remarks || 'Stock added manually'
      });
      
      // Refresh
      setShowAddForm(false);
      setAddFormData({ batch_number: '', quantity: '', mfg_date: '', exp_date: '', remarks: '' });
      await fetchData();
      
      // Refresh current modal batches
      const data = await inventoryApi.getBatches(selectedDrug.id);
      setBatches(data);
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  const filteredDrugs = drugs.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (d.generic_name && d.generic_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStockStatus = (stock: number, min: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'text-red-400 bg-red-400/10' };
    if (stock <= min) return { label: 'Low Stock', color: 'text-yellow-400 bg-yellow-400/10' };
    return { label: 'In Stock', color: 'text-green-400 bg-green-400/10' };
  };

  if (loading) return <div className="text-white p-8 text-center">Loading inventory data...</div>;
  if (error) return <div className="text-red-400 p-8 text-center">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#110f22]/60 border border-white/5 p-6 rounded-2xl backdrop-blur-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <PackageOpen size={24} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Unique Items</p>
              <h3 className="text-2xl font-bold text-white">{summary?.totalItems || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#110f22]/60 border border-white/5 p-6 rounded-2xl backdrop-blur-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
              <XCircle size={24} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Out of Stock</p>
              <h3 className="text-2xl font-bold text-white">{summary?.outOfStock || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#110f22]/60 border border-white/5 p-6 rounded-2xl backdrop-blur-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Low Stock Items</p>
              <h3 className="text-2xl font-bold text-white">{summary?.lowStock || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#110f22]/60 border border-white/5 p-6 rounded-2xl backdrop-blur-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Expiring &lt; 90 Days</p>
              <h3 className="text-2xl font-bold text-white">{summary?.expiringSoon || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[#110f22]/60 border border-white/5 rounded-2xl backdrop-blur-xl flex flex-col h-[calc(100vh-280px)]">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex space-x-1 bg-black/20 p-1 rounded-xl">
            <button
              onClick={() => setActiveView('stock')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'stock' ? 'bg-[#9b51e0] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Package size={16} />
                <span>Current Stock</span>
              </div>
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'history' ? 'bg-[#9b51e0] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-2">
                <History size={16} />
                <span>Stock History</span>
              </div>
            </button>
          </div>

          {activeView === 'stock' && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#9b51e0] transition-colors"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeView === 'stock' ? (
            <div className="space-y-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-white/40 text-sm border-b border-white/5">
                    <th className="pb-4 font-medium">Drug Name</th>
                    <th className="pb-4 font-medium">Category</th>
                    <th className="pb-4 font-medium text-right">Current Stock</th>
                    <th className="pb-4 font-medium text-right">Min Level</th>
                    <th className="pb-4 font-medium text-center">Status</th>
                    <th className="pb-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredDrugs.map((drug) => {
                    const status = getStockStatus(drug.stock, drug.min_stock_level);
                    return (
                      <tr key={drug.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                              {drug.image_url ? (
                                <img src={drug.image_url} alt={drug.name} className="w-full h-full object-cover" />
                              ) : (
                                <PackageOpen className="text-white/20" size={20} />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">{drug.name}</p>
                              {drug.generic_name && <p className="text-white/40 text-xs">{drug.generic_name}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-white/60">{drug.category_name || 'Uncategorized'}</td>
                        <td className="py-4 text-right">
                          <span className="text-white font-medium text-lg">{drug.stock}</span>
                        </td>
                        <td className="py-4 text-right text-white/40">{drug.min_stock_level}</td>
                        <td className="py-4">
                          <div className="flex justify-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleOpenBatches(drug)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm transition-colors"
                          >
                            Manage Batches
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDrugs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-white/40">
                        No drugs found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-white/40 text-sm border-b border-white/5">
                    <th className="pb-4 font-medium">Date</th>
                    <th className="pb-4 font-medium">Drug</th>
                    <th className="pb-4 font-medium">Batch</th>
                    <th className="pb-4 font-medium">Type</th>
                    <th className="pb-4 font-medium text-right">Quantity</th>
                    <th className="pb-4 font-medium">Remarks</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 text-white/60">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 text-white font-medium">{tx.drug_name}</td>
                      <td className="py-4 text-white/60">{tx.batch_number || '-'}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          tx.transaction_type === 'ADD' ? 'text-green-400 bg-green-400/10' :
                          tx.transaction_type === 'REMOVE' ? 'text-red-400 bg-red-400/10' :
                          'text-blue-400 bg-blue-400/10'
                        }`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <span className={`font-medium ${tx.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                        </span>
                      </td>
                      <td className="py-4 text-white/40 truncate max-w-[200px]">{tx.remarks}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-white/40">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Batch Management Modal */}
      {isBatchModalOpen && selectedDrug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0b0914] border border-white/10 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl my-8">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h3 className="text-xl font-bold text-white">Manage Batches</h3>
                <p className="text-white/60 text-sm mt-1">{selectedDrug.name}</p>
              </div>
              <button 
                onClick={() => setIsBatchModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-auto">
              <div className="mb-6 flex justify-between items-center">
                <h4 className="text-white font-medium">Current Batches</h4>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#9b51e0] hover:bg-[#8a44c8] text-white rounded-xl transition-colors text-sm"
                  >
                    <Plus size={16} />
                    <span>Add New Batch</span>
                  </button>
                )}
              </div>

              {showAddForm && (
                <form onSubmit={handleAddStock} className="mb-8 bg-white/5 p-6 rounded-2xl border border-[#9b51e0]/30 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#9b51e0]"></div>
                  <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
                    <PackageOpen size={18} className="text-[#9b51e0]" />
                    <span>Receive New Stock</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-[#a09eb5] mb-1">Batch Number *</label>
                      <input required type="text" value={addFormData.batch_number} onChange={e => setAddFormData({...addFormData, batch_number: e.target.value})} className="w-full bg-[#110f22] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" placeholder="e.g. BATCH-2023-A" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#a09eb5] mb-1">Quantity Received *</label>
                      <input required type="number" min="1" value={addFormData.quantity} onChange={e => setAddFormData({...addFormData, quantity: e.target.value})} className="w-full bg-[#110f22] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#a09eb5] mb-1">Manufacturing Date *</label>
                      <input 
                        required 
                        type="date" 
                        value={addFormData.mfg_date} 
                        onChange={e => {
                          const mfg = e.target.value;
                          let exp = addFormData.exp_date;
                          if (mfg) {
                            const d = new Date(mfg);
                            d.setFullYear(d.getFullYear() + 2);
                            exp = d.toISOString().split('T')[0];
                          }
                          setAddFormData({...addFormData, mfg_date: mfg, exp_date: exp});
                        }} 
                        className="w-full bg-[#110f22] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#a09eb5] mb-1">Expiry Date *</label>
                      <input 
                        required 
                        type="date" 
                        value={addFormData.exp_date} 
                        onChange={e => {
                          const exp = e.target.value;
                          let mfg = addFormData.mfg_date;
                          if (exp) {
                            const d = new Date(exp);
                            d.setFullYear(d.getFullYear() - 2);
                            mfg = d.toISOString().split('T')[0];
                          }
                          setAddFormData({...addFormData, exp_date: exp, mfg_date: mfg});
                        }} 
                        className="w-full bg-[#110f22] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" 
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-[#a09eb5] mb-1">Remarks (Optional)</label>
                    <input type="text" value={addFormData.remarks} onChange={e => setAddFormData({...addFormData, remarks: e.target.value})} className="w-full bg-[#110f22] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" placeholder="e.g. Received from Supplier X" />
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-white/60 hover:text-white transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="px-6 py-2 bg-[#9b51e0] hover:bg-[#8a44c8] text-white rounded-xl transition-colors font-medium shadow-lg shadow-purple-500/20">
                      Save Batch
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {batches.length === 0 ? (
                  <div className="text-center py-8 text-white/40 border border-white/5 rounded-xl border-dashed">
                    No batches recorded for this drug.
                  </div>
                ) : (
                  batches.map(batch => {
                    const expDate = new Date(batch.exp_date);
                    const isExpired = expDate < new Date();
                    const isExpiringSoon = expDate < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && !isExpired;
                    
                    return (
                      <div key={batch.id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-white font-medium text-lg">{batch.batch_number}</span>
                          <span className="text-white/40 text-xs">Mfg: {new Date(batch.mfg_date).toLocaleDateString()}</span>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-bold text-xl">{batch.quantity}</div>
                          <div className="text-white/40 text-xs uppercase tracking-wider">In Stock</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-green-400'}`}>
                            Exp: {expDate.toLocaleDateString()}
                          </div>
                          {isExpired && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded mt-1 inline-block">Expired</span>}
                          {isExpiringSoon && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded mt-1 inline-block">Expiring Soon</span>}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
