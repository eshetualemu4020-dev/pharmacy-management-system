import { formatCurrency, EXCHANGE_RATE_ETB } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, CheckCircle, XCircle, Package, Truck, Download, Calendar } from 'lucide-react';
import { purchaseOrderApi, supplierApi, drugApi, categoryApi } from '../../services/api';

export default function PurchaseOrdersTab() {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [poCurrency, setPoCurrency] = useState<'USD' | 'ETB'>('USD');

  const [createForm, setCreateForm] = useState({
    supplier_id: '',
    expected_delivery_date: '',
    notes: '',
    items: [{ drug_name: '', quantity: 1, unit_cost: 0 }]
  });

  const [receiveForm, setReceiveForm] = useState({
    items: [] as any[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [posData, supsData, drgsData, catsData] = await Promise.all([
        purchaseOrderApi.getAll(),
        supplierApi.getSuppliers(),
        drugApi.getAll(),
        categoryApi.getCategories()
      ]);
      setPurchaseOrders(posData);
      setSuppliers(supsData);
      setDrugs(drgsData);
      setCategories(catsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch = po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          po.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? po.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setCreateForm({
      supplier_id: '',
      expected_delivery_date: '',
      notes: '',
      items: [{ drug_name: '', quantity: 1, unit_cost: 0 }]
    });
    setPoCurrency('USD');
    setIsCreateModalOpen(true);
  };

  const handleCreateAddItem = () => {
    setCreateForm({
      ...createForm,
      items: [...createForm.items, { drug_name: '', quantity: 1, unit_cost: 0 }]
    });
  };

  const handleCreateRemoveItem = (index: number) => {
    const newItems = [...createForm.items];
    newItems.splice(index, 1);
    setCreateForm({ ...createForm, items: newItems });
  };

  const handleCreateItemChange = (index: number, field: string, value: any) => {
    const newItems = [...createForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setCreateForm({ ...createForm, items: newItems });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.supplier_id) return alert('Please select a supplier');
    
    if (createForm.expected_delivery_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deliveryDate = new Date(createForm.expected_delivery_date);
      if (deliveryDate < today) {
        return alert('Expected Delivery Date cannot be in the past');
      }
    }
    
    if (createForm.items.length === 0) return alert('Please add at least one item');
    for (const item of createForm.items) {
      if (!item.drug_name) return alert('All items must have a drug name');
      if (item.quantity <= 0) return alert('Quantity must be greater than zero');
      if (item.unit_cost < 0) return alert('Unit cost cannot be negative');
    }

    try {
      setIsSubmitting(true);
      const payload = { ...createForm };
      
      if (poCurrency === 'ETB') {
        payload.items = payload.items.map(item => ({
          ...item,
          unit_cost: parseFloat((item.unit_cost / EXCHANGE_RATE_ETB).toFixed(4))
        }));
      }

      await purchaseOrderApi.create(payload);
      setIsCreateModalOpen(false);
      fetchData();
      alert('Purchase Order created successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenView = async (po: any) => {
    try {
      const fullData = await purchaseOrderApi.getById(po.id);
      setSelectedPO(fullData);
      setIsViewModalOpen(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenReceive = async (po: any) => {
    try {
      const fullData = await purchaseOrderApi.getById(po.id);
      setSelectedPO(fullData);
      
      const rItems = fullData.items.map((item: any) => ({
        id: item.id,
        drug_name: item.drug_name,
        quantity_ordered: item.quantity_ordered,
        quantity_received: item.quantity_ordered - (item.quantity_received || 0),
        batch_id: '',
        mfg_date: '',
        exp_date: '',
        retail_price: item.unit_cost * 1.5, // default markup
        category_id: ''
      })).filter((item: any) => item.quantity_received > 0);
      
      if (rItems.length === 0) {
        return alert('All items have already been fully received.');
      }

      setReceiveForm({ items: rItems });
      setIsReceiveModalOpen(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReceiveItemChange = (index: number, field: string, value: any) => {
    const newItems = [...receiveForm.items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'mfg_date' && value) {
      const mDate = new Date(value);
      if (!isNaN(mDate.getTime())) {
        mDate.setFullYear(mDate.getFullYear() + 2);
        item.exp_date = mDate.toISOString().split('T')[0];
      }
    } else if (field === 'exp_date' && value) {
      const eDate = new Date(value);
      if (!isNaN(eDate.getTime())) {
        eDate.setFullYear(eDate.getFullYear() - 2);
        item.mfg_date = eDate.toISOString().split('T')[0];
      }
    }
    
    newItems[index] = item;
    setReceiveForm({ ...receiveForm, items: newItems });
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    for (const item of receiveForm.items) {
      if (item.quantity_received < 0) {
        return alert(`Received quantity cannot be negative for ${item.drug_name}.`);
      }
      if (item.retail_price < 0) {
        return alert(`Retail price cannot be negative for ${item.drug_name}.`);
      }
      if (item.quantity_received > 0 && !item.batch_id) {
        return alert(`Batch ID is required for ${item.drug_name} if receiving any quantity.`);
      }
      if (item.quantity_received > 0 && !item.exp_date) {
        return alert(`Expiration date is required for ${item.drug_name} if receiving any quantity.`);
      }
    }

    try {
      setIsSubmitting(true);
      await purchaseOrderApi.receive(selectedPO.id, receiveForm);
      setIsReceiveModalOpen(false);
      fetchData();
      alert('Purchase Order received successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    if (!window.confirm(`Are you sure you want to change status to ${status}?`)) return;
    try {
      await purchaseOrderApi.updateStatus(id, status);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-500/10 text-amber-400';
      case 'approved': return 'bg-blue-500/10 text-blue-400';
      case 'ordered': return 'bg-purple-500/10 text-purple-400';
      case 'partially_received': return 'bg-emerald-500/20 text-emerald-300';
      case 'received': return 'bg-emerald-500/10 text-emerald-400';
      case 'cancelled': return 'bg-red-500/10 text-red-400';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-main mb-2">Purchase Orders</h1>
          <p className="text-muted">Manage orders placed with suppliers.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center px-5 py-2.5 bg-[#9b51e0] hover:bg-[#8b45cd] text-white rounded-xl font-bold transition-colors shadow-lg shadow-[#9b51e0]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Order
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-surface p-4 rounded-2xl border border-subtle mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input 
            type="text" 
            placeholder="Search by PO Number or Supplier..." 
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="ordered">Ordered</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-subtle overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted">Loading purchase orders...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-hover border-b border-subtle">
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">PO Number</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Order Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Expected Delivery</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPOs.length > 0 ? filteredPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-main font-medium">{po.po_number}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {po.supplier_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {new Date(po.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-400 font-medium">
                      {formatCurrency(po.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(po.status)}`}>
                        {po.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => handleOpenView(po)} className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {po.status === 'pending' && (
                          <button onClick={() => handleUpdateStatus(po.id, 'approved')} className="p-2 text-muted hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Approve">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {po.status === 'approved' && (
                          <button onClick={() => handleUpdateStatus(po.id, 'ordered')} className="p-2 text-muted hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors" title="Mark as Ordered">
                            <Truck className="w-4 h-4" />
                          </button>
                        )}

                        {(po.status === 'ordered' || po.status === 'partially_received') && (
                          <button onClick={() => handleOpenReceive(po)} className="p-2 text-muted hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" title="Receive Items">
                            <Download className="w-4 h-4" />
                          </button>
                        )}

                        {(po.status === 'pending' || po.status === 'approved') && (
                          <button onClick={() => handleUpdateStatus(po.id, 'cancelled')} className="p-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Cancel Order">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted">
                      No purchase orders found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-4xl border border-subtle-hover shadow-2xl my-8">
            <h3 className="text-xl font-bold text-main mb-6">Create Purchase Order</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">Supplier *</label>
                  <select 
                    required 
                    value={createForm.supplier_id} 
                    onChange={e => setCreateForm({...createForm, supplier_id: e.target.value})} 
                    className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0] appearance-none"
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">Expected Delivery Date</label>
                  <input 
                    type="date" 
                    value={createForm.expected_delivery_date} 
                    onChange={e => setCreateForm({...createForm, expected_delivery_date: e.target.value})} 
                    className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0]" 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-muted">Order Items *</label>
                  <button type="button" onClick={handleCreateAddItem} className="text-xs text-[#9b51e0] hover:text-[#8b45cd] font-bold flex items-center">
                    <Plus className="w-3 h-3 mr-1" /> Add Item
                  </button>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  <datalist id="drugs-list">
                    {drugs.map(d => <option key={d.id} value={d.name} />)}
                  </datalist>

                  {createForm.items.map((item, index) => (
                    <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-base p-3 rounded-xl border border-subtle">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs text-muted mb-1">Drug Name</label>
                        <input 
                          required 
                          list="drugs-list"
                          placeholder="Select or type custom name..."
                          value={item.drug_name} 
                          onChange={e => handleCreateItemChange(index, 'drug_name', e.target.value)} 
                          className="w-full bg-surface border border-subtle rounded-lg px-3 py-1.5 text-main focus:outline-none focus:border-[#9b51e0] text-sm" 
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-muted mb-1">Quantity</label>
                        <input 
                          required type="number" min="1" 
                          value={item.quantity} 
                          onChange={e => handleCreateItemChange(index, 'quantity', parseInt(e.target.value))} 
                          className="w-full bg-surface border border-subtle rounded-lg px-3 py-1.5 text-main focus:outline-none focus:border-[#9b51e0] text-sm" 
                        />
                      </div>
                      <div className="w-44">
                        <label className="block text-xs text-muted mb-1">Unit Cost *</label>
                        <div className="flex rounded-lg overflow-hidden border border-subtle focus-within:border-[#9b51e0] transition-colors">
                          <select
                            value={poCurrency}
                            onChange={(e) => setPoCurrency(e.target.value as 'USD' | 'ETB')}
                            className="bg-surface text-main px-2 text-xs border-r border-subtle focus:outline-none cursor-pointer"
                          >
                            <option value="USD">USD</option>
                            <option value="ETB">ETB</option>
                          </select>
                          <input 
                            required type="number" min="0" step="0.01" 
                            value={item.unit_cost} 
                            onChange={e => handleCreateItemChange(index, 'unit_cost', parseFloat(e.target.value))} 
                            className="flex-1 w-full bg-surface px-3 py-1.5 text-main focus:outline-none text-sm" 
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="w-32">
                        <label className="block text-xs text-muted mb-1">Subtotal</label>
                        <div className="px-3 py-1.5 text-emerald-400 font-medium text-sm">
                          {((item.quantity || 0) * (item.unit_cost || 0)).toFixed(2)}
                        </div>
                      </div>
                      <button type="button" onClick={() => handleCreateRemoveItem(index)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg mb-0.5">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-right">
                  <span className="text-muted font-medium mr-4">Total Amount:</span>
                  <span className="text-2xl text-emerald-400 font-bold">
                    {formatCurrency(createForm.items.reduce((acc, item) => acc + ((item.quantity||0) * (item.unit_cost||0)), 0))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1">Notes</label>
                <textarea 
                  value={createForm.notes} 
                  onChange={e => setCreateForm({...createForm, notes: e.target.value})} 
                  className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0] h-20" 
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-subtle">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-muted hover:text-main transition-colors" disabled={isSubmitting}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#9b51e0] hover:bg-[#8b45cd] disabled:opacity-50 text-white rounded-xl font-bold transition-colors">
                  {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-3xl border border-subtle-hover shadow-2xl my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-main">Purchase Order {selectedPO.po_number}</h3>
                <p className="text-muted text-sm">Created on {new Date(selectedPO.created_at).toLocaleString()} by {selectedPO.created_by_username}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(selectedPO.status)}`}>
                {selectedPO.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6 bg-base p-4 rounded-xl border border-subtle">
              <div>
                <div className="text-xs text-muted uppercase tracking-wider font-bold mb-1">Supplier</div>
                <div className="text-main font-medium">{selectedPO.supplier_name}</div>
              </div>
              <div>
                <div className="text-xs text-muted uppercase tracking-wider font-bold mb-1">Dates</div>
                <div className="text-main text-sm">
                  <div>Ordered: {new Date(selectedPO.order_date).toLocaleDateString()}</div>
                  {selectedPO.expected_delivery_date && (
                    <div className="text-blue-300">Expected: {new Date(selectedPO.expected_delivery_date).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Order Items</h4>
              <div className="border border-subtle rounded-xl overflow-hidden">
                <table className="w-full text-left bg-base">
                  <thead>
                    <tr className="border-b border-subtle">
                      <th className="px-4 py-2 text-xs text-muted">Item</th>
                      <th className="px-4 py-2 text-xs text-muted text-right">Ordered</th>
                      <th className="px-4 py-2 text-xs text-muted text-right">Received</th>
                      <th className="px-4 py-2 text-xs text-muted text-right">Unit Cost</th>
                      <th className="px-4 py-2 text-xs text-muted text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedPO.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm text-main font-medium">{item.drug_name}</td>
                        <td className="px-4 py-2 text-sm text-main text-right">{item.quantity_ordered}</td>
                        <td className="px-4 py-2 text-sm text-emerald-400 text-right">{item.quantity_received || 0}</td>
                        <td className="px-4 py-2 text-sm text-muted text-right">{formatCurrency(item.unit_cost)}</td>
                        <td className="px-4 py-2 text-sm text-emerald-400 font-medium text-right">
                          {formatCurrency((item.quantity_ordered * item.unit_cost))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <div className="bg-base p-3 rounded-xl border border-subtle flex items-center space-x-4">
                  <span className="text-muted font-medium uppercase text-xs tracking-wider">Total Purchase Cost</span>
                  <span className="text-2xl text-emerald-400 font-bold">{formatCurrency(selectedPO.total_amount)}</span>
                </div>
              </div>
            </div>

            {selectedPO.notes && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Notes</h4>
                <div className="bg-base p-4 rounded-xl border border-subtle text-main text-sm whitespace-pre-wrap">
                  {selectedPO.notes}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-subtle">
              <button onClick={() => setIsViewModalOpen(false)} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {isReceiveModalOpen && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-5xl border border-subtle-hover shadow-2xl my-8">
            <h3 className="text-xl font-bold text-main mb-2">Receive Purchase Order: {selectedPO.po_number}</h3>
            <p className="text-sm text-muted mb-6">Enter received quantities, batch numbers, and expiration dates. This will automatically update your inventory stock.</p>
            
            <form onSubmit={handleReceiveSubmit} className="space-y-6">
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {receiveForm.items.map((item, index) => (
                  <div key={item.id} className="bg-base p-4 rounded-xl border border-subtle">
                    <div className="flex justify-between items-center mb-4 border-b border-subtle-hover pb-2">
                      <span className="font-bold text-lg text-main">{item.drug_name}</span>
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">Ordered: {item.quantity_ordered}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-muted mb-1">Recv Qty</label>
                        <input 
                          type="number" required min="0" max={item.quantity_ordered}
                          value={item.quantity_received} 
                          onChange={e => handleReceiveItemChange(index, 'quantity_received', parseInt(e.target.value))} 
                          className="w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-main focus:outline-none focus:border-emerald-500" 
                        />
                      </div>
                      
                      {item.quantity_received > 0 && (
                        <>
                          <div className="col-span-1">
                            <label className="block text-xs font-bold text-muted mb-1">Batch ID *</label>
                            <input 
                              type="text" required
                              value={item.batch_id} 
                              onChange={e => handleReceiveItemChange(index, 'batch_id', e.target.value)} 
                              className="w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-main focus:outline-none focus:border-[#9b51e0]" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted mb-1">Mfg Date</label>
                            <input 
                              type="date"
                              value={item.mfg_date} 
                              onChange={e => handleReceiveItemChange(index, 'mfg_date', e.target.value)} 
                              className="w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-main focus:outline-none focus:border-[#9b51e0] text-sm" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted mb-1">Exp Date *</label>
                            <input 
                              type="date" required
                              value={item.exp_date} 
                              onChange={e => handleReceiveItemChange(index, 'exp_date', e.target.value)} 
                              className="w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-main focus:outline-none focus:border-red-400 text-sm" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted mb-1">Retail Price</label>
                            <input 
                              type="number" required step="0.01" min="0"
                              value={item.retail_price} 
                              onChange={e => handleReceiveItemChange(index, 'retail_price', parseFloat(e.target.value))} 
                              className="w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-main focus:outline-none focus:border-[#9b51e0]" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted mb-1">Category (New)</label>
                            <select 
                              value={item.category_id} 
                              onChange={e => handleReceiveItemChange(index, 'category_id', e.target.value)} 
                              className="w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-main focus:outline-none focus:border-[#9b51e0] appearance-none text-sm"
                            >
                              <option value="">Default/Auto</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-subtle">
                <button type="button" onClick={() => setIsReceiveModalOpen(false)} className="px-4 py-2 text-muted hover:text-main transition-colors" disabled={isSubmitting}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold transition-colors">
                  {isSubmitting ? 'Receiving...' : 'Confirm Receipt & Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
