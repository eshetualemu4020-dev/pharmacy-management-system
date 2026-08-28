import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Eye, CheckCircle, XCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import { drugApi, categoryApi } from '../../services/api';
import { formatCurrency, EXCHANGE_RATE_ETB } from '../../utils/currency';

export default function DrugsTab() {
  const [drugs, setDrugs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<any>(null);
  const [priceCurrency, setPriceCurrency] = useState<'USD' | 'ETB'>('USD');

  const initialFormState = {
    name: '',
    generic_name: '',
    brand_name: '',
    category_id: '',
    manufacturer: '',
    description: '',
    dosage_form: '',
    strength: '',
    price: '',
    requires_prescription: false,
    is_active: 'active',
    image_url: ''
  };

  const [formData, setFormData] = useState<any>(initialFormState);

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

  const handleOpenAddModal = () => {
    setFormData(initialFormState);
    setPriceCurrency('USD');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (drug: any) => {
    setSelectedDrug(drug);
    setPriceCurrency('USD');
    setFormData({
      name: drug.name,
      generic_name: drug.generic_name || '',
      brand_name: drug.brand_name || '',
      category_id: drug.category_id || '',
      manufacturer: drug.manufacturer || '',
      description: drug.description || '',
      dosage_form: drug.dosage_form || '',
      strength: drug.strength || '',
      price: drug.price,
      requires_prescription: drug.requires_prescription === 1,
      is_active: drug.is_active === 1 ? 'active' : 'inactive',
      image_url: drug.image_url || ''
    });
    setIsEditModalOpen(true);
  };

  const handleOpenViewModal = (drug: any) => {
    setSelectedDrug(drug);
    setIsViewModalOpen(true);
  };

  const handleSaveDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (parseFloat(formData.price) < 0) {
        return alert('Selling Price cannot be negative');
      }

      const payload = { ...formData };
      
      // If the user inputted the price in ETB, convert it to the base currency (USD) for storage
      if (priceCurrency === 'ETB' && payload.price) {
        payload.price = (parseFloat(payload.price) / EXCHANGE_RATE_ETB).toFixed(4);
      }

      if (isEditModalOpen && selectedDrug) {
        await drugApi.update(selectedDrug.id, payload);
      } else {
        await drugApi.create(payload);
      }
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      fetchDrugs();
    } catch (err: any) {
      alert(err.message || 'Failed to save drug');
    }
  };

  const handleToggleStatus = async (drug: any) => {
    if (window.confirm(`Are you sure you want to ${drug.is_active === 1 ? 'deactivate' : 'activate'} this drug?`)) {
      try {
        await drugApi.updateStatus(drug.id, drug.is_active === 0);
        fetchDrugs();
      } catch (err: any) {
        alert(err.message || 'Failed to update status');
      }
    }
  };

  const filteredDrugs = drugs.filter(drug => {
    const matchesSearch = drug.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (drug.generic_name && drug.generic_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter ? drug.category_id === parseInt(categoryFilter) : true;
    const matchesStatus = statusFilter === 'active' ? drug.is_active === 1 : 
                          statusFilter === 'inactive' ? drug.is_active === 0 : true;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="flex-1 p-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Drug Catalog</h1>
          <p className="text-[#a09eb5]">Manage the pharmacy's drug and product inventory.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center px-5 py-2.5 bg-[#9b51e0] hover:bg-[#8b45cd] text-white rounded-xl font-bold transition-colors shadow-lg shadow-[#9b51e0]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Drug
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-[#232136] p-4 rounded-2xl border border-white/5 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a09eb5]" />
          <input 
            type="text" 
            placeholder="Search by drug name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#110f22] border border-white/5 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-[#9b51e0] transition-colors"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#110f22] border border-white/5 text-[#a09eb5] px-4 py-2 rounded-xl focus:outline-none focus:border-[#9b51e0] appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#110f22] border border-white/5 text-[#a09eb5] px-4 py-2 rounded-xl focus:outline-none focus:border-[#9b51e0] appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Drug Table */}
      <div className="bg-[#232136] rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#a09eb5]">Loading drugs...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Drug</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Manufacturer</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredDrugs.length > 0 ? filteredDrugs.map((drug) => (
                  <tr key={drug.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-[#110f22] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {drug.image_url ? (
                          <img src={drug.image_url} alt={drug.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-[#a09eb5]" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium">{drug.name}</div>
                        <div className="text-xs text-[#a09eb5]">{drug.generic_name || 'No generic name'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#a09eb5]">
                      {drug.category_name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#a09eb5]">
                      {drug.manufacturer || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#a09eb5]">
                      {formatCurrency(drug.price)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                        ${drug.is_active === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {drug.is_active === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => handleOpenViewModal(drug)} className="p-2 text-[#a09eb5] hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenEditModal(drug)} className="p-2 text-[#a09eb5] hover:text-[#9b51e0] hover:bg-[#9b51e0]/10 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleStatus(drug)} className={`p-2 rounded-lg transition-colors ${drug.is_active === 1 ? 'text-[#a09eb5] hover:text-amber-400 hover:bg-amber-400/10' : 'text-[#a09eb5] hover:text-emerald-400 hover:bg-emerald-400/10'}`} title={drug.is_active === 1 ? 'Deactivate' : 'Activate'}>
                          {drug.is_active === 1 ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#a09eb5]">
                      No drugs found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#232136] rounded-2xl w-full max-w-4xl border border-white/10 shadow-2xl flex flex-col max-h-full overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{isEditModalOpen ? 'Edit Drug' : 'Add New Drug'}</h3>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="text-[#a09eb5] hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="drug-form" onSubmit={handleSaveDrug} className="space-y-6">
                
                {/* Image & Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#a09eb5] mb-1">Image URL</label>
                    <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://example.com/image.jpg" className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#a09eb5] mb-1">Drug Name *</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#a09eb5] mb-1">Generic Name</label>
                    <input type="text" value={formData.generic_name} onChange={e => setFormData({...formData, generic_name: e.target.value})} className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#a09eb5] mb-1">Brand Name</label>
                    <input type="text" value={formData.brand_name} onChange={e => setFormData({...formData, brand_name: e.target.value})} className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                </div>

                <hr className="border-white/5" />

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#a09eb5] mb-1">Category</label>
                    <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]">
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#a09eb5] mb-1">Manufacturer</label>
                    <input type="text" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#a09eb5] mb-1">Selling Price *</label>
                    <div className="flex rounded-xl overflow-hidden border border-white/5 focus-within:border-[#9b51e0] transition-colors">
                      <select
                        value={priceCurrency}
                        onChange={(e) => setPriceCurrency(e.target.value as 'USD' | 'ETB')}
                        className="bg-[#232136] text-white px-3 py-2 text-sm border-r border-white/5 focus:outline-none cursor-pointer"
                      >
                        <option value="USD">USD</option>
                        <option value="ETB">ETB</option>
                      </select>
                      <input 
                        required 
                        type="number" 
                        step="0.01" 
                        value={formData.price} 
                        onChange={e => setFormData({...formData, price: e.target.value})} 
                        className="flex-1 w-full bg-[#110f22] px-4 py-2 text-white focus:outline-none" 
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#a09eb5] mb-1">Dosage Form</label>
                    <input type="text" value={formData.dosage_form} onChange={e => setFormData({...formData, dosage_form: e.target.value})} placeholder="e.g. Tablet, Syrup" className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#a09eb5] mb-1">Strength</label>
                    <input type="text" value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})} placeholder="e.g. 500mg" className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center space-x-3 bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white cursor-pointer hover:border-[#9b51e0] transition-colors">
                      <input type="checkbox" checked={formData.requires_prescription} onChange={e => setFormData({...formData, requires_prescription: e.target.checked})} className="w-4 h-4 rounded bg-[#110f22] border-white/10 text-[#9b51e0] focus:ring-[#9b51e0]" />
                      <span className="text-sm font-medium">Prescription Required</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#a09eb5] mb-1">Description</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0] resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#a09eb5] mb-1">Status</label>
                  <select value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value})} className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-white/5 flex justify-end space-x-3 bg-[#110f22]/50">
              <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 text-[#a09eb5] hover:text-white transition-colors">Cancel</button>
              <button type="submit" form="drug-form" className="px-6 py-2 bg-[#9b51e0] hover:bg-[#8b45cd] text-white rounded-xl font-bold transition-colors">Save Drug</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedDrug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#232136] rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#110f22]/50">
              <h3 className="text-xl font-bold text-white">Drug Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-[#a09eb5] hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex space-x-6">
                <div className="w-32 h-32 rounded-xl bg-[#110f22] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedDrug.image_url ? (
                    <img src={selectedDrug.image_url} alt={selectedDrug.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-[#a09eb5]" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedDrug.name}</h2>
                  <p className="text-[#a09eb5] text-lg mb-2">{selectedDrug.brand_name || selectedDrug.generic_name || 'No brand/generic name'}</p>
                  
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${selectedDrug.is_active === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {selectedDrug.is_active === 1 ? 'Active' : 'Inactive'}
                    </span>
                    {selectedDrug.requires_prescription === 1 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                        Rx Required
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-[#110f22] p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-xs text-[#a09eb5] mb-1">Category</p>
                  <p className="text-white font-medium">{selectedDrug.category_name || 'Uncategorized'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#a09eb5] mb-1">Manufacturer</p>
                  <p className="text-white font-medium">{selectedDrug.manufacturer || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#a09eb5] mb-1">Dosage Form</p>
                  <p className="text-white font-medium">{selectedDrug.dosage_form || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#a09eb5] mb-1">Strength</p>
                  <p className="text-white font-medium">{selectedDrug.strength || 'N/A'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-[#a09eb5] mb-1">Selling Price</p>
                  <p className="text-white font-bold text-lg">{formatCurrency(selectedDrug.price)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-[#a09eb5] mb-1">Description</p>
                <p className="text-white bg-[#110f22] p-4 rounded-xl border border-white/5 text-sm leading-relaxed">
                  {selectedDrug.description || 'No description provided.'}
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-white/5 flex justify-end bg-[#110f22]/50">
              <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2 bg-[#232136] hover:bg-white/10 text-white rounded-xl font-bold transition-colors border border-white/10">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
