import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Edit, Eye, ShieldAlert, CheckCircle, XCircle, Trash2, AlertTriangle
} from 'lucide-react';
import { categoryApi } from '../../services/api';
import { formatCurrency } from '../../utils/currency';

export default function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Selected Category & Full Category Data
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [viewData, setViewData] = useState<any>(null); // To store category + drugs
  const [viewLoading, setViewLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '', description: '', status: 'active'
  });

  useEffect(() => {
    fetchCategories();
  }, [statusFilter]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const data = await categoryApi.getCategories(params);
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setFormData({ name: '', description: '', status: 'active' });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (cat: any) => {
    setSelectedCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      status: cat.status || 'active',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenViewModal = async (cat: any) => {
    setSelectedCategory(cat);
    setIsViewModalOpen(true);
    setViewLoading(true);
    try {
      const data = await categoryApi.getCategoryById(cat.id);
      setViewData(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setViewLoading(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditModalOpen && selectedCategory) {
        await categoryApi.updateCategory(selectedCategory.id, formData);
        setIsEditModalOpen(false);
      } else {
        await categoryApi.createCategory(formData);
        setIsAddModalOpen(false);
      }
      fetchCategories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (cat: any) => {
    const confirmMessage = cat.status === 'active' 
      ? `Are you sure you want to deactivate ${cat.name}?` 
      : `Are you sure you want to activate ${cat.name}?`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const newStatus = cat.status === 'active' ? 'inactive' : 'active';
      await categoryApi.updateStatus(cat.id, newStatus);
      fetchCategories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (cat: any) => {
    if (!window.confirm(`Are you sure you want to delete the category: ${cat.name}?`)) return;

    try {
      await categoryApi.deleteCategory(cat.id);
      fetchCategories();
    } catch (err: any) {
      if (err.message.includes('CATEGORY_IN_USE') || err.message.includes('assigned to one or more drugs')) {
        if (window.confirm(`${err.message}\n\nWould you like to deactivate it instead?`)) {
          await categoryApi.updateStatus(cat.id, 'inactive');
          fetchCategories();
        }
      } else {
        alert(err.message);
      }
    }
  };

  return (
    <div className="flex-1 p-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-main mb-2">Category Management</h1>
          <p className="text-muted">Organize drugs into categories and manage their statuses.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center px-5 py-2.5 bg-[#9b51e0] hover:bg-[#8b45cd] text-white rounded-xl font-bold transition-colors shadow-lg shadow-[#9b51e0]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-surface p-4 rounded-2xl border border-subtle mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input 
            type="text" 
            placeholder="Search by category name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-base border border-subtle text-main pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-[#9b51e0] transition-colors"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-base border border-subtle text-muted px-4 py-2 rounded-xl focus:outline-none focus:border-[#9b51e0] appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Category Table */}
      <div className="bg-surface rounded-2xl border border-subtle overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted">Loading categories...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-hover border-b border-subtle">
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Drugs</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Created Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCategories.length > 0 ? filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-main font-medium">{cat.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted max-w-xs truncate" title={cat.description}>{cat.description || 'No description'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#9b51e0]/10 text-[#9b51e0]">
                        {cat.drugCount} Drugs
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                        ${cat.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {cat.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {new Date(cat.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => handleOpenViewModal(cat)} className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenEditModal(cat)} className="p-2 text-muted hover:text-[#9b51e0] hover:bg-[#9b51e0]/10 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleStatus(cat)} className={`p-2 rounded-lg transition-colors ${cat.status === 'active' ? 'text-muted hover:text-amber-400 hover:bg-amber-400/10' : 'text-muted hover:text-emerald-400 hover:bg-emerald-400/10'}`} title={cat.status === 'active' ? 'Deactivate' : 'Activate'}>
                          {cat.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(cat)} className="p-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted">
                      No categories found matching your criteria.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md border border-subtle-hover shadow-2xl">
            <h3 className="text-xl font-bold text-main mb-4">{isEditModalOpen ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              {isEditModalOpen && (
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">Drug Count</label>
                  <div className="w-full bg-base/50 border border-subtle rounded-xl px-4 py-2 text-muted cursor-not-allowed opacity-70">
                    {selectedCategory ? selectedCategory.drugCount : 0} Drugs
                  </div>
                  <p className="text-[10px] text-muted mt-1">Shows how many drugs belong to this category.</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-muted mb-1">Category Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1">Description</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0] resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0] appearance-none">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 text-muted hover:text-main transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#9b51e0] hover:bg-[#8b45cd] text-white rounded-xl font-bold transition-colors">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-2xl border border-subtle-hover shadow-2xl flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-bold text-main mb-4">Category Details</h3>
            
            {viewLoading ? (
              <div className="py-10 text-center text-muted">Loading details...</div>
            ) : viewData ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                {/* Details Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-hover rounded-xl p-4 border border-subtle">
                    <span className="block text-xs text-muted mb-1">Name</span>
                    <span className="text-main font-medium text-lg">{viewData.name}</span>
                  </div>
                  <div className="bg-hover rounded-xl p-4 border border-subtle">
                    <span className="block text-xs text-muted mb-1">Status</span>
                    <span className={`font-medium capitalize ${viewData.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>{viewData.status || 'Active'}</span>
                  </div>
                  <div className="col-span-2 bg-hover rounded-xl p-4 border border-subtle">
                    <span className="block text-xs text-muted mb-1">Description</span>
                    <span className="text-main">{viewData.description || 'No description provided.'}</span>
                  </div>
                </div>

                {/* Assigned Drugs Section */}
                <div>
                  <h4 className="text-lg font-bold text-main mb-3">Assigned Drugs ({viewData.drugs?.length || 0})</h4>
                  {viewData.drugs && viewData.drugs.length > 0 ? (
                    <div className="bg-base rounded-xl border border-subtle overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-hover">
                          <tr>
                            <th className="px-4 py-2 font-medium text-muted">Drug Name</th>
                            <th className="px-4 py-2 font-medium text-muted">Stock</th>
                            <th className="px-4 py-2 font-medium text-muted">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {viewData.drugs.map((drug: any) => (
                            <tr key={drug.id} className="hover:bg-white/[0.02]">
                              <td className="px-4 py-3 text-main">{drug.name}</td>
                              <td className="px-4 py-3 text-main">{drug.qty}</td>
                              <td className="px-4 py-3 text-main">{formatCurrency(drug.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-base rounded-xl border border-subtle p-6 text-center text-muted flex flex-col items-center">
                      <AlertTriangle className="w-8 h-8 mb-2 text-amber-500/50" />
                      <p>No drugs are currently assigned to this category.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-red-400">Failed to load details.</div>
            )}

            <div className="flex justify-end pt-4 mt-4 border-t border-subtle">
              <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
