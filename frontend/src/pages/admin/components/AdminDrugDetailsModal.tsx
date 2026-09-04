import React, { useState, useEffect } from 'react';
import { X, Package, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { inventoryApi } from '../../../services/api';

interface Batch {
  id: number;
  batch_number: string;
  mfg_date: string;
  exp_date: string;
  quantity: number;
}

interface AdminDrugDetailsModalProps {
  drug: any;
  onClose: () => void;
}

export default function AdminDrugDetailsModal({ drug, onClose }: AdminDrugDetailsModalProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBatches();
  }, [drug.id]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getBatches(drug.id);
      setBatches(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const getBatchStatus = (expDate: string, quantity: number) => {
    if (quantity === 0) return { label: 'Empty', color: 'text-gray-400', icon: <Package className="w-4 h-4 mr-1" /> };
    
    const expiry = new Date(expDate);
    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);

    if (expiry <= today) {
      return { label: 'Expired', color: 'text-red-400', icon: <AlertTriangle className="w-4 h-4 mr-1" /> };
    } else if (expiry <= ninetyDaysFromNow) {
      return { label: 'Expiring Soon', color: 'text-[#f59e0b]', icon: <Clock className="w-4 h-4 mr-1" /> };
    } else {
      return { label: 'Valid', color: 'text-green-400', icon: <CheckCircle className="w-4 h-4 mr-1" /> };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl border border-subtle shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-subtle">
          <div>
            <h2 className="text-xl font-bold text-main flex items-center gap-2">
              <Package className="w-5 h-5 text-[#3b82f6]" />
              {drug.name} <span className="text-sm font-normal text-muted">({drug.generic_name})</span>
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted hover:text-main hover:bg-hover rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-hover rounded-xl p-4 border border-subtle">
              <p className="text-xs font-medium text-muted mb-1">Category</p>
              <p className="text-sm text-main font-medium">{drug.category_name || 'N/A'}</p>
            </div>
            <div className="bg-hover rounded-xl p-4 border border-subtle">
              <p className="text-xs font-medium text-muted mb-1">Strength / Dosage</p>
              <p className="text-sm text-main font-medium">{drug.strength || '-'} {drug.dosage_form || '-'}</p>
            </div>
            <div className="bg-hover rounded-xl p-4 border border-subtle">
              <p className="text-xs font-medium text-muted mb-1">Available Quantity</p>
              <p className="text-sm text-main font-medium">{drug.available_quantity}</p>
            </div>
            <div className="bg-hover rounded-xl p-4 border border-subtle">
              <p className="text-xs font-medium text-muted mb-1">Reorder Level</p>
              <p className="text-sm text-[#f59e0b] font-medium">{drug.min_stock_level}</p>
            </div>
          </div>

          <h3 className="text-lg font-bold text-main mb-4">Batch History</h3>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3b82f6]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-center">
              {error}
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center p-8 text-muted bg-hover rounded-xl border border-subtle">
              No batches found for this drug.
            </div>
          ) : (
            <div className="bg-base rounded-xl border border-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-hover text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Batch Number</th>
                      <th className="px-4 py-3 font-medium">Mfg Date</th>
                      <th className="px-4 py-3 font-medium">Exp Date</th>
                      <th className="px-4 py-3 font-medium text-right">Quantity</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {batches.map((batch) => {
                      const status = getBatchStatus(batch.exp_date, batch.quantity);
                      return (
                        <tr key={batch.id} className="hover:bg-hover transition-colors">
                          <td className="px-4 py-3 text-main font-medium">{batch.batch_number}</td>
                          <td className="px-4 py-3 text-muted">
                            {new Date(batch.mfg_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {new Date(batch.exp_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-main bg-hover px-2 py-1 rounded-lg">
                              {batch.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`flex items-center ${status.color} font-medium`}>
                              {status.icon}
                              {status.label}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
