import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { promotionApi, categoryApi, drugApi } from '../../../services/api';

interface PromotionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotionData?: any;
  isEdit: boolean;
  onSuccess: () => void;
}

export default function PromotionFormModal({ isOpen, onClose, promotionData, isEdit, onSuccess }: PromotionFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    apply_to: 'all', // 'all', 'categories', 'drugs'
    category_ids: [] as number[],
    drug_ids: [] as number[]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data for select dropdowns
  const [categories, setCategories] = useState<any[]>([]);
  const [drugs, setDrugs] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      if (isEdit && promotionData) {
        // Fetch full promotion details to get categories and drugs
        fetchFullPromotion(promotionData.id);
      } else {
        // Default dates
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        setFormData({
          ...formData,
          start_date: today,
          end_date: nextWeekStr
        });
      }
    }
  }, [isOpen]);

  const fetchOptions = async () => {
    try {
      const cats = await categoryApi.getAll();
      setCategories(cats);
      // Wait, drugs might be paginated, for this modal we could either load all or have an autocomplete.
      // Let's load the first 1000 for simplicity or assume getAll without pagination works for dropdown.
      const drgs = await drugApi.getAll({ limit: 1000 });
      setDrugs(drgs.data || drgs);
    } catch (err) {
      console.error('Failed to load options', err);
    }
  };

  const fetchFullPromotion = async (id: number) => {
    try {
      const promo = await promotionApi.getPromotionById(id);
      
      const cIds = promo.categories ? promo.categories.map((c: any) => c.id) : [];
      const dIds = promo.drugs ? promo.drugs.map((d: any) => d.id) : [];
      
      let applyTo = 'all';
      if (cIds.length > 0) applyTo = 'categories';
      else if (dIds.length > 0) applyTo = 'drugs';

      setFormData({
        name: promo.name,
        description: promo.description || '',
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        start_date: new Date(promo.start_date).toISOString().split('T')[0],
        end_date: new Date(promo.end_date).toISOString().split('T')[0],
        status: promo.status,
        apply_to: applyTo,
        category_ids: cIds,
        drug_ids: dIds
      });
    } catch (err: any) {
      setError('Failed to load full promotion data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    const val = parseFloat(formData.discount_value);
    if (isNaN(val) || val <= 0) {
      setError('Discount value must be greater than 0');
      return;
    }
    if (formData.discount_type === 'percentage' && val > 100) {
      setError('Percentage discount cannot exceed 100%');
      return;
    }
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError('Start date cannot be after end date');
      return;
    }

    if (!isEdit) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(formData.start_date);
      if (startDate < today) {
        setError('Start date cannot be in the past');
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        category_ids: formData.apply_to === 'categories' ? formData.category_ids : [],
        drug_ids: formData.apply_to === 'drugs' ? formData.drug_ids : []
      };

      if (isEdit) {
        await promotionApi.updatePromotion(promotionData.id, payload);
      } else {
        await promotionApi.createPromotion(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>, field: 'category_ids' | 'drug_ids') => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(opt => parseInt(opt.value));
    setFormData({ ...formData, [field]: selectedOptions });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface rounded-2xl w-full max-w-2xl border border-subtle-hover shadow-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-subtle">
          <h2 className="text-xl font-bold text-main">
            {isEdit ? 'Edit Promotion' : 'Create Promotion'}
          </h2>
          <button onClick={onClose} className="p-2 text-muted hover:text-main transition-colors rounded-xl hover:bg-hover">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-muted mb-2">Promotion Name *</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-base border border-subtle rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#9b51e0] transition-colors"
                placeholder="e.g. Summer Health Sale"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-muted mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-base border border-subtle rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#9b51e0] transition-colors min-h-[80px]"
                placeholder="Brief details about the promotion..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-muted mb-2">Discount Type *</label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                className="w-full bg-base border border-subtle rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#9b51e0] appearance-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-muted mb-2">Discount Value *</label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                className="w-full bg-base border border-subtle rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#9b51e0] transition-colors"
                placeholder={formData.discount_type === 'percentage' ? 'e.g. 15' : 'e.g. 10.00'}
              />
            </div>

            <div className="md:col-span-2 border-t border-subtle pt-6">
              <h3 className="text-main font-bold mb-4">Applicability</h3>
              
              <div className="flex gap-4 mb-4">
                <label className="flex items-center space-x-2 text-muted cursor-pointer">
                  <input type="radio" checked={formData.apply_to === 'all'} onChange={() => setFormData({ ...formData, apply_to: 'all', category_ids: [], drug_ids: [] })} className="text-[#9b51e0] focus:ring-[#9b51e0] bg-base" />
                  <span>All Products</span>
                </label>
                <label className="flex items-center space-x-2 text-muted cursor-pointer">
                  <input type="radio" checked={formData.apply_to === 'categories'} onChange={() => setFormData({ ...formData, apply_to: 'categories', drug_ids: [] })} className="text-[#9b51e0] focus:ring-[#9b51e0] bg-base" />
                  <span>Specific Categories</span>
                </label>
                <label className="flex items-center space-x-2 text-muted cursor-pointer">
                  <input type="radio" checked={formData.apply_to === 'drugs'} onChange={() => setFormData({ ...formData, apply_to: 'drugs', category_ids: [] })} className="text-[#9b51e0] focus:ring-[#9b51e0] bg-base" />
                  <span>Specific Drugs</span>
                </label>
              </div>

              {formData.apply_to === 'categories' && (
                <div>
                  <label className="block text-sm font-bold text-muted mb-2">Select Categories (Hold Ctrl/Cmd to select multiple)</label>
                  <select
                    multiple
                    value={formData.category_ids.map(String)}
                    onChange={(e) => handleMultiSelect(e, 'category_ids')}
                    className="w-full bg-base border border-subtle rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#9b51e0] h-32"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {formData.apply_to === 'drugs' && (
                <div>
                  <label className="block text-sm font-bold text-muted mb-2">Select Drugs (Hold Ctrl/Cmd to select multiple)</label>
                  <select
                    multiple
                    value={formData.drug_ids.map(String)}
                    onChange={(e) => handleMultiSelect(e, 'drug_ids')}
                    className="w-full bg-base border border-subtle rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#9b51e0] h-48"
                  >
                    {drugs.map(d => <option key={d.id} value={d.id}>{d.name} ({d.generic_name})</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="md:col-span-2 border-t border-subtle pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-muted mb-2">Start Date *</label>
                <input
                  required
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full bg-base border border-subtle rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#9b51e0]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-muted mb-2">End Date *</label>
                <input
                  required
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full bg-base border border-subtle rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#9b51e0]"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-muted mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-base border border-subtle rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#9b51e0] appearance-none"
              >
                <option value="draft">Draft</option>
                <option value="active">Active (If within dates)</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 text-muted hover:text-main transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#9b51e0] hover:bg-[#8a44c8] disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center space-x-2 transition-colors shadow-lg shadow-[#9b51e0]/20"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Saving...' : 'Save Promotion'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
