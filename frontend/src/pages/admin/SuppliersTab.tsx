import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Eye, CheckCircle, XCircle, Truck, Building2, MapPin, Phone, Mail } from 'lucide-react';
import { supplierApi } from '../../services/api';
import SupplierFormModal from './components/SupplierFormModal';

export default function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  // Success Notification
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, [statusFilter]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      // We handle search on the frontend for simplicity, but could be backend too.
      const data = await supplierApi.getSuppliers(params);
      setSuppliers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.contact_person && s.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    s.phone.includes(searchTerm)
  );

  const handleOpenAddModal = () => {
    setSelectedSupplier(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsEditModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSuccessMessage(selectedSupplier ? 'Supplier updated successfully.' : 'Supplier created successfully.');
    fetchSuppliers();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleOpenViewModal = async (supplier: any) => {
    try {
      // Fetch full details including purchase order history
      const fullSupplierData = await supplierApi.getSupplierById(supplier.id);
      setSelectedSupplier(fullSupplierData);
      setIsViewModalOpen(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (supplier: any) => {
    if (supplier.status === 'active') {
      if (!window.confirm(`Are you sure you want to deactivate ${supplier.name}? They will no longer be selectable for new purchase orders.`)) {
        return;
      }
    }
    
    try {
      const newStatus = supplier.status === 'active' ? 'inactive' : 'active';
      await supplierApi.updateStatus(supplier.id, newStatus);
      fetchSuppliers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      {successMessage && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center text-green-400">
          <CheckCircle className="w-5 h-5 mr-3 shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-main mb-2">Suppliers Management</h1>
          <p className="text-muted">Manage drug manufacturers and wholesale distributors.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center px-5 py-2.5 bg-[#9b51e0] hover:bg-[#8b45cd] text-white rounded-xl font-bold transition-colors shadow-lg shadow-[#9b51e0]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Supplier
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-surface p-4 rounded-2xl border border-subtle mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input 
            type="text" 
            placeholder="Search suppliers..." 
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

      {/* Supplier Table */}
      <div className="bg-surface rounded-2xl border border-subtle overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted">Loading suppliers...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-hover border-b border-subtle">
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Company Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSuppliers.length > 0 ? filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-main font-medium">{supplier.name}</div>
                          <div className="text-xs text-muted">ID: SUP-{supplier.id.toString().padStart(4, '0')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-main">{supplier.contact_person || 'N/A'}</div>
                      <div className="text-xs text-muted">{supplier.phone}</div>
                      <div className="text-xs text-muted">{supplier.email || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-main">{supplier.city || 'N/A'}</div>
                      <div className="text-xs text-muted">{supplier.country || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                        ${supplier.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      <span className="bg-hover px-2 py-1 rounded-lg">{supplier.total_orders || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => handleOpenViewModal(supplier)} className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenEditModal(supplier)} className="p-2 text-muted hover:text-[#9b51e0] hover:bg-[#9b51e0]/10 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleStatus(supplier)} className={`p-2 rounded-lg transition-colors ${supplier.status === 'active' ? 'text-muted hover:text-red-400 hover:bg-red-400/10' : 'text-muted hover:text-emerald-400 hover:bg-emerald-400/10'}`} title={supplier.status === 'active' ? 'Deactivate' : 'Activate'}>
                          {supplier.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted">
                      No suppliers found matching your criteria.
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
        <SupplierFormModal 
          supplier={isEditModalOpen ? selectedSupplier : undefined}
          onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* View Details Modal */}
      {isViewModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-3xl border border-subtle-hover shadow-2xl my-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-main">{selectedSupplier.name}</h3>
                  <div className="text-muted flex items-center mt-1">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${selectedSupplier.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                    {selectedSupplier.status === 'active' ? 'Active Partner' : 'Inactive'}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2 bg-hover hover:bg-white/10 text-white rounded-xl transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-main border-b border-subtle-hover pb-2">Contact Details</h4>
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-muted shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-muted">Phone / Contact Person</div>
                    <div className="text-main">{selectedSupplier.phone}</div>
                    {selectedSupplier.contact_person && <div className="text-sm text-main/70">{selectedSupplier.contact_person}</div>}
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-muted shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-muted">Email</div>
                    <div className="text-main">{selectedSupplier.email || 'N/A'}</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-muted shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-muted">Address</div>
                    <div className="text-main">{selectedSupplier.address || 'N/A'}</div>
                    {(selectedSupplier.city || selectedSupplier.country) && (
                      <div className="text-sm text-main/70">
                        {[selectedSupplier.city, selectedSupplier.country].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-main border-b border-subtle-hover pb-2">Information</h4>
                <div>
                  <div className="text-sm text-muted">Registered Date</div>
                  <div className="text-main">{new Date(selectedSupplier.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted">Notes</div>
                  <div className="text-main text-sm bg-base p-3 rounded-xl border border-subtle mt-1 min-h-[80px]">
                    {selectedSupplier.notes || 'No notes available.'}
                  </div>
                </div>
              </div>
            </div>

            <h4 className="text-lg font-bold text-main border-b border-subtle-hover pb-2 mb-4">Recent Purchase Orders</h4>
            <div className="bg-base rounded-xl border border-subtle overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-subtle">
                    <th className="px-4 py-3 text-xs font-bold text-muted uppercase">Order ID</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted uppercase">Date</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted uppercase">Created By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {selectedSupplier.purchase_orders && selectedSupplier.purchase_orders.length > 0 ? (
                    selectedSupplier.purchase_orders.map((po: any) => (
                      <tr key={po.id} className="hover:bg-hover transition-colors">
                        <td className="px-4 py-3 text-main font-medium">PO-{po.id.toString().padStart(4, '0')}</td>
                        <td className="px-4 py-3 text-sm text-muted">{new Date(po.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 text-xs rounded-lg ${
                            po.status === 'received' || po.status === 'closed' ? 'bg-emerald-500/10 text-emerald-400' :
                            po.status === 'draft' ? 'bg-gray-500/10 text-gray-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {po.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted">{po.created_by_name}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted">No purchase orders found for this supplier.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
