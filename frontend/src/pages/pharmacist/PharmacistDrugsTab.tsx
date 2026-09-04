import React, { useState, useEffect } from 'react';
import { Search, Eye, AlertTriangle } from 'lucide-react';
import { drugApi, categoryApi } from '../../services/api';
import { formatCurrency } from '../../utils/currency';

export default function PharmacistDrugsTab() {
  const [drugs, setDrugs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rxFilter, setRxFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<any>(null);

  useEffect(() => {
    fetchDrugs();
    fetchCategories();
  }, []);

  const fetchDrugs = async () => {
    try {
      setLoading(true);
      const data = await drugApi.getAll();
      setDrugs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch drugs');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleOpenViewModal = (drug: any) => {
    setSelectedDrug(drug);
    setIsViewModalOpen(true);
  };

  const filteredDrugs = drugs.filter(drug => {
    const matchesSearch = drug.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (drug.generic_name && drug.generic_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter ? drug.category_id === parseInt(categoryFilter) : true;
    const matchesStatus = statusFilter === 'active' ? drug.is_active === 1 : 
                          statusFilter === 'inactive' ? drug.is_active === 0 : true;
    const matchesRx = rxFilter === 'yes' ? drug.requires_prescription === 1 :
                      rxFilter === 'no' ? drug.requires_prescription === 0 : true;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesRx;
  });

  return (
    <div className="flex-1 p-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-main mb-2">Drug Database</h1>
          <p className="text-muted">View all drugs, their properties, and inventory levels.</p>
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
        <div className="flex-1 min-w-[250px] relative">
          <Search className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by name or generic name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-base border border-subtle-hover text-main rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-[#10b981] transition-colors"
          />
        </div>
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-base border border-subtle-hover text-main rounded-xl px-4 py-2 focus:outline-none focus:border-[#10b981] transition-colors"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select 
          value={rxFilter}
          onChange={(e) => setRxFilter(e.target.value)}
          className="bg-base border border-subtle-hover text-main rounded-xl px-4 py-2 focus:outline-none focus:border-[#10b981] transition-colors"
        >
          <option value="">All Rx Types</option>
          <option value="yes">Prescription Only</option>
          <option value="no">OTC (Over the Counter)</option>
        </select>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-base border border-subtle-hover text-main rounded-xl px-4 py-2 focus:outline-none focus:border-[#10b981] transition-colors"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Drugs Table */}
      <div className="bg-surface rounded-2xl border border-subtle overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted">Loading drugs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-base/50 border-b border-subtle">
                  <th className="p-4 text-muted font-semibold text-sm">Drug Name</th>
                  <th className="p-4 text-muted font-semibold text-sm">Category</th>
                  <th className="p-4 text-muted font-semibold text-sm">Manufacturer</th>
                  <th className="p-4 text-muted font-semibold text-sm">Price</th>
                  <th className="p-4 text-muted font-semibold text-sm">Rx Required</th>
                  <th className="p-4 text-muted font-semibold text-sm">Status</th>
                  <th className="p-4 text-muted font-semibold text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrugs.map((drug) => (
                  <tr key={drug.id} className="border-b border-subtle hover:bg-hover transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {drug.image_url ? (
                          <img src={drug.image_url} alt={drug.name} className="w-10 h-10 rounded-lg object-cover bg-hover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-hover flex items-center justify-center text-muted text-xs">
                            No Img
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-main">{drug.name}</div>
                          <div className="text-xs text-muted">{drug.generic_name} • {drug.strength} {drug.dosage_form}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted">{drug.category_name || 'N/A'}</td>
                    <td className="p-4 text-muted">{drug.manufacturer}</td>
                    <td className="p-4 text-main font-medium">{formatCurrency(drug.price)}</td>
                    <td className="p-4">
                      {drug.requires_prescription === 1 ? (
                        <span className="bg-purple-500/10 text-purple-400 text-xs px-2.5 py-1 rounded-full font-medium">Yes</span>
                      ) : (
                        <span className="bg-gray-500/10 text-gray-400 text-xs px-2.5 py-1 rounded-full font-medium">No</span>
                      )}
                    </td>
                    <td className="p-4">
                      {drug.is_active === 1 ? (
                        <span className="bg-[#10b981]/10 text-[#10b981] text-xs px-2.5 py-1 rounded-full font-medium">Active</span>
                      ) : (
                        <span className="bg-red-500/10 text-red-400 text-xs px-2.5 py-1 rounded-full font-medium">Inactive</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleOpenViewModal(drug)}
                        className="text-muted hover:text-[#10b981] p-1.5 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredDrugs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted">
                      No drugs found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Drug Modal */}
      {isViewModalOpen && selectedDrug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl w-full max-w-2xl border border-subtle-hover overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-subtle flex justify-between items-center">
              <h2 className="text-xl font-bold text-main flex items-center gap-3">
                <Eye className="w-5 h-5 text-[#3b82f6]" />
                Drug Details
              </h2>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-muted hover:text-main transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex gap-6">
                <div className="w-1/3">
                  {selectedDrug.image_url ? (
                    <img 
                      src={selectedDrug.image_url} 
                      alt={selectedDrug.name} 
                      className="w-full aspect-square object-cover rounded-xl border border-subtle-hover bg-base"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-xl border border-subtle-hover bg-base flex flex-col items-center justify-center text-muted">
                      <Eye className="w-12 h-12 mb-2 opacity-20" />
                      <span className="text-sm">No Image</span>
                    </div>
                  )}
                </div>
                
                <div className="w-2/3 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-main">{selectedDrug.name}</h3>
                    <p className="text-[#10b981] font-medium">{selectedDrug.generic_name}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-base p-3 rounded-xl border border-subtle">
                      <p className="text-xs text-muted mb-1">Brand Name</p>
                      <p className="text-main font-medium">{selectedDrug.brand_name || 'N/A'}</p>
                    </div>
                    <div className="bg-base p-3 rounded-xl border border-subtle">
                      <p className="text-xs text-muted mb-1">Category</p>
                      <p className="text-main font-medium">{selectedDrug.category_name || 'N/A'}</p>
                    </div>
                    <div className="bg-base p-3 rounded-xl border border-subtle">
                      <p className="text-xs text-muted mb-1">Strength</p>
                      <p className="text-main font-medium">{selectedDrug.strength || 'N/A'}</p>
                    </div>
                    <div className="bg-base p-3 rounded-xl border border-subtle">
                      <p className="text-xs text-muted mb-1">Dosage Form</p>
                      <p className="text-main font-medium">{selectedDrug.dosage_form || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-base p-4 rounded-xl border border-subtle">
                  <p className="text-xs text-muted mb-1">Manufacturer</p>
                  <p className="text-main font-medium">{selectedDrug.manufacturer || 'N/A'}</p>
                </div>
                <div className="bg-base p-4 rounded-xl border border-subtle flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted mb-1">Selling Price</p>
                    <p className="text-main font-bold text-lg">{formatCurrency(selectedDrug.price)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-base p-4 rounded-xl border border-subtle">
                <p className="text-xs text-muted mb-2">Description & Notes</p>
                <p className="text-main text-sm leading-relaxed">
                  {selectedDrug.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                {selectedDrug.requires_prescription === 1 && (
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center">
                    Requires Prescription
                  </span>
                )}
                {selectedDrug.is_active === 1 ? (
                  <span className="bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 px-3 py-1.5 rounded-lg text-sm font-medium">
                    Active Status
                  </span>
                ) : (
                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-sm font-medium">
                    Inactive Status
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-subtle bg-base/50 flex justify-end">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
