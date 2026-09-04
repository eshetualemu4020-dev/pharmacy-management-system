import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, 
  AlertTriangle, CheckCircle, Eye, Package, Activity, XCircle,
  Plus, Edit, Image as ImageIcon
} from 'lucide-react';
import { inventoryApi, categoryApi, drugApi } from '../../services/api';
import { formatCurrency, EXCHANGE_RATE_ETB } from '../../utils/currency';
import AdminDrugDetailsModal from './components/AdminDrugDetailsModal';

export default function AdminAllDrugsTab() {
  const [summary, setSummary] = useState<any>(null);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  
  const [selectedDrug, setSelectedDrug] = useState<any | null>(null);

  // Add/Edit Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [priceCurrency, setPriceCurrency] = useState<'USD' | 'ETB'>('USD');
  const [drugToEdit, setDrugToEdit] = useState<any>(null);

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
    fetchSummary();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchDrugs();
  }, [page, categoryFilter, statusFilter, stockStatusFilter]);

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1); // Reset to page 1 on search change
      fetchDrugs();
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchSummary = async () => {
    try {
      const data = await inventoryApi.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories', err);
    }
  };

  const fetchDrugs = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getList({
        page,
        limit: 15,
        search,
        category: categoryFilter,
        status: statusFilter,
        stock_status: stockStatusFilter
      });
      setDrugs(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (err) {
      console.error('Error fetching drugs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData(initialFormState);
    setPriceCurrency('USD');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (drug: any) => {
    setDrugToEdit(drug);
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

      if (isEditModalOpen && drugToEdit) {
        await drugApi.update(drugToEdit.id, payload);
      } else {
        await drugApi.create(payload);
      }
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      fetchDrugs();
      fetchSummary();
    } catch (err: any) {
      alert(err.message || 'Failed to save drug');
    }
  };

  const handleToggleStatus = async (drug: any) => {
    if (window.confirm(`Are you sure you want to ${drug.is_active === 1 ? 'deactivate' : 'activate'} this drug?`)) {
      try {
        await drugApi.updateStatus(drug.id, drug.is_active === 0);
        fetchDrugs();
        fetchSummary();
      } catch (err: any) {
        alert(err.message || 'Failed to update status');
      }
    }
  };

  const renderStockStatus = (drug: any) => {
    const available = Number(drug.available_quantity) || 0;
    const minStock = Number(drug.min_stock_level) || 0;
    const expiring = Number(drug.expiring_batches) || 0;
    const expired = Number(drug.expired_batches) || 0;

    let stockBadge;
    if (available === 0) {
      stockBadge = <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium">Out of Stock</span>;
    } else if (available <= minStock) {
      stockBadge = <span className="px-2 py-1 bg-[#f59e0b]/10 text-[#f59e0b] rounded-lg text-xs font-medium">Low Stock</span>;
    } else {
      stockBadge = <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs font-medium">In Stock</span>;
    }

    return (
      <div className="flex items-center gap-2">
        {stockBadge}
        {expiring > 0 && <span title={`${expiring} batch(es) expiring soon`} className="text-[#f59e0b]"><AlertTriangle className="w-4 h-4" /></span>}
        {expired > 0 && <span title={`${expired} batch(es) expired (not counted in available quantity)`} className="text-red-400"><XCircle className="w-4 h-4" /></span>}
      </div>
    );
  };

  return (
    <div className="flex-1 p-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-main mb-2">All Drugs Inventory</h1>
          <p className="text-muted">Manage drug catalog, view batch details and monitor stock levels.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center px-5 py-2.5 bg-[#9b51e0] hover:bg-[#8b45cd] text-white rounded-xl font-bold transition-colors shadow-lg shadow-[#9b51e0]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Drug
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-surface p-6 rounded-2xl border border-subtle flex items-center justify-between">
          <div>
            <p className="text-muted text-sm font-medium mb-1">Total Drugs</p>
            <p className="text-3xl font-bold text-main">{summary?.totalItems || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-surface p-6 rounded-2xl border border-subtle flex items-center justify-between">
          <div>
            <p className="text-muted text-sm font-medium mb-1">Active Drugs</p>
            <p className="text-3xl font-bold text-green-400">{summary?.activeItems || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-green-400" />
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-[#f59e0b]/30 flex items-center justify-between">
          <div>
            <p className="text-muted text-sm font-medium mb-1">Low Stock Alerts</p>
            <p className="text-3xl font-bold text-[#f59e0b]">{summary?.lowStock || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-[#f59e0b]" />
          </div>
        </div>
        
        <div className="bg-surface p-6 rounded-2xl border border-red-500/30 flex items-center justify-between">
          <div>
            <p className="text-muted text-sm font-medium mb-1">Out of Stock</p>
            <p className="text-3xl font-bold text-red-400">{summary?.outOfStock || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-surface p-4 rounded-2xl border border-subtle mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input 
            type="text" 
            placeholder="Search by name or generic name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-base border border-subtle-hover rounded-xl py-2.5 pl-10 pr-4 text-main placeholder-[#a09eb5] focus:outline-none focus:border-[#3b82f6] transition-colors"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => { setPage(1); setCategoryFilter(e.target.value); }}
            className="flex-1 md:w-40 bg-base border border-subtle-hover rounded-xl py-2.5 px-4 text-main focus:outline-none focus:border-[#3b82f6] transition-colors"
          >
            <option value="">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={stockStatusFilter}
            onChange={(e) => { setPage(1); setStockStatusFilter(e.target.value); }}
            className="flex-1 md:w-40 bg-base border border-subtle-hover rounded-xl py-2.5 px-4 text-main focus:outline-none focus:border-[#3b82f6] transition-colors"
          >
            <option value="">All Stock Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
            className="flex-1 md:w-32 bg-base border border-subtle-hover rounded-xl py-2.5 px-4 text-main focus:outline-none focus:border-[#3b82f6] transition-colors"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface rounded-2xl border border-subtle overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-hover text-muted">
              <tr>
                <th className="px-6 py-4 font-medium">Drug Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-right">Stock</th>
                <th className="px-6 py-4 font-medium">Stock Status</th>
                <th className="px-6 py-4 font-medium">Catalog Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3b82f6] mb-4"></div>
                      Loading inventory...
                    </div>
                  </td>
                </tr>
              ) : drugs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    No drugs found matching your criteria.
                  </td>
                </tr>
              ) : (
                drugs.map((drug) => (
                  <tr key={drug.id} className="hover:bg-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {drug.image_url ? (
                          <img src={drug.image_url} alt={drug.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-hover flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-main">{drug.name}</p>
                          <p className="text-xs text-muted">
                            {drug.generic_name ? drug.generic_name + ' • ' : ''}
                            {drug.strength || ''} {drug.dosage_form || ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted">{drug.category_name || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-main">{drug.available_quantity}</span>
                      <p className="text-xs text-muted">Min: {drug.min_stock_level}</p>
                    </td>
                    <td className="px-6 py-4">
                      {renderStockStatus(drug)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                        ${drug.is_active === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {drug.is_active === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => setSelectedDrug(drug)}
                          className="p-2 text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded-lg transition-colors"
                          title="View Details & Batches"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleOpenEditModal(drug)} 
                          className="p-2 text-muted hover:text-[#9b51e0] hover:bg-[#9b51e0]/10 rounded-lg transition-colors" 
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(drug)} 
                          className={`p-2 rounded-lg transition-colors ${drug.is_active === 1 ? 'text-muted hover:text-amber-400 hover:bg-amber-400/10' : 'text-muted hover:text-emerald-400 hover:bg-emerald-400/10'}`} 
                          title={drug.is_active === 1 ? 'Deactivate Catalog Entry' : 'Activate Catalog Entry'}
                        >
                          {drug.is_active === 1 ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-subtle flex items-center justify-between">
            <p className="text-sm text-muted">
              Showing <span className="font-medium text-main">{(page - 1) * 15 + 1}</span> to <span className="font-medium text-main">{Math.min(page * 15, totalItems)}</span> of <span className="font-medium text-main">{totalItems}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-muted hover:text-main hover:bg-hover rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = idx + 1;
                  else if (page <= 3) pageNum = idx + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + idx;
                  else pageNum = page - 2 + idx;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum 
                          ? 'bg-[#3b82f6] text-main' 
                          : 'text-muted hover:bg-hover hover:text-main'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 text-muted hover:text-main hover:bg-hover rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
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

      {/* Add / Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl w-full max-w-4xl border border-subtle-hover shadow-2xl flex flex-col max-h-full overflow-hidden">
            <div className="p-6 border-b border-subtle flex justify-between items-center">
              <h3 className="text-xl font-bold text-main">{isEditModalOpen ? 'Edit Drug' : 'Add New Drug'}</h3>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="text-muted hover:text-main">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="drug-form" onSubmit={handleSaveDrug} className="space-y-6">
                
                {/* Image & Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Image URL</label>
                    <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://example.com/image.jpg" className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Drug Name *</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Generic Name</label>
                    <input type="text" value={formData.generic_name} onChange={e => setFormData({...formData, generic_name: e.target.value})} className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Brand Name</label>
                    <input type="text" value={formData.brand_name} onChange={e => setFormData({...formData, brand_name: e.target.value})} className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                </div>

                <hr className="border-subtle" />

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Category</label>
                    <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0]">
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Manufacturer</label>
                    <input type="text" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Selling Price *</label>
                    <div className="flex rounded-xl overflow-hidden border border-subtle focus-within:border-[#9b51e0] transition-colors">
                      <select
                        value={priceCurrency}
                        onChange={(e) => setPriceCurrency(e.target.value as 'USD' | 'ETB')}
                        className="bg-surface text-main px-3 py-2 text-sm border-r border-subtle focus:outline-none cursor-pointer"
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
                        className="flex-1 w-full bg-base px-4 py-2 text-main focus:outline-none" 
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Dosage Form</label>
                    <input type="text" value={formData.dosage_form} onChange={e => setFormData({...formData, dosage_form: e.target.value})} placeholder="e.g. Tablet, Syrup" className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Strength</label>
                    <input type="text" value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})} placeholder="e.g. 500mg" className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center space-x-3 bg-base border border-subtle rounded-xl px-4 py-2 text-main cursor-pointer hover:border-[#9b51e0] transition-colors">
                      <input type="checkbox" checked={formData.requires_prescription} onChange={e => setFormData({...formData, requires_prescription: e.target.checked})} className="w-4 h-4 rounded bg-base border-subtle-hover text-[#9b51e0] focus:ring-[#9b51e0]" />
                      <span className="text-sm font-medium">Prescription Required</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted mb-1">Description</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0] resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted mb-1">Catalog Status</label>
                  <select value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value})} className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0]">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-subtle flex justify-end space-x-3 bg-base/50">
              <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 text-muted hover:text-main transition-colors">Cancel</button>
              <button type="submit" form="drug-form" className="px-6 py-2 bg-[#9b51e0] hover:bg-[#8b45cd] text-white rounded-xl font-bold transition-colors">Save Drug</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
