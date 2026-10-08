import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { inventoryApi, drugApi } from '../../../services/api';

interface AdminAddBatchModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminAddBatchModal({ onClose, onSuccess }: AdminAddBatchModalProps) {
  const [drugs, setDrugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDrugs, setFetchingDrugs] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    drug_id: '',
    batch_number: '',
    mfg_date: '',
    exp_date: '',
    quantity: '',
    remarks: ''
  });

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    try {
      setFetchingDrugs(true);
      const data = await inventoryApi.getList({ limit: 1000 });
      setDrugs(data.data || []);
    } catch (err: any) {
      setError('Failed to load drugs');
    } finally {
      setFetchingDrugs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await inventoryApi.adjustStock({
        drug_id: formData.drug_id,
        batch_number: formData.batch_number,
        transaction_type: 'ADD',
        quantity: parseInt(formData.quantity),
        mfg_date: formData.mfg_date,
        exp_date: formData.exp_date,
        remarks: formData.remarks || 'Manual batch addition'
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl border border-subtle shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-subtle">
          <h2 className="text-xl font-bold text-main flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#3b82f6]" />
            Add New Batch
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-muted hover:text-main hover:bg-hover rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-main mb-2">Drug</label>
            <select
              required
              value={formData.drug_id}
              onChange={e => setFormData({ ...formData, drug_id: e.target.value })}
              className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#3b82f6]"
              disabled={fetchingDrugs}
            >
              <option value="">{fetchingDrugs ? 'Loading...' : 'Select a drug'}</option>
              {drugs.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.generic_name})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-main mb-2">Batch Number</label>
            <input
              type="text"
              required
              value={formData.batch_number}
              onChange={e => setFormData({ ...formData, batch_number: e.target.value })}
              className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#3b82f6]"
              placeholder="e.g. BATCH-123"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-main mb-2">Mfg Date</label>
              <input
                type="date"
                required
                value={formData.mfg_date}
                onChange={e => setFormData({ ...formData, mfg_date: e.target.value })}
                className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#3b82f6] [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-2">Exp Date</label>
              <input
                type="date"
                required
                value={formData.exp_date}
                onChange={e => setFormData({ ...formData, exp_date: e.target.value })}
                className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#3b82f6] [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-main mb-2">Quantity</label>
            <input
              type="number"
              required
              min="1"
              value={formData.quantity}
              onChange={e => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#3b82f6]"
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-main mb-2">Remarks (Optional)</label>
            <input
              type="text"
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full bg-base border border-subtle rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#3b82f6]"
              placeholder="Any notes for this addition"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted hover:text-main font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Adding...' : 'Add Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
