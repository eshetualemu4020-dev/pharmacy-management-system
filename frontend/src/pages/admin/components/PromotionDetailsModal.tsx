import { formatCurrency } from '../../../utils/currency';
import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, Info, AlertCircle, Edit, CheckCircle } from 'lucide-react';
import { promotionApi } from '../../../services/api';

interface PromotionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotionId: number;
  onStatusChange: () => void;
}

export default function PromotionDetailsModal({ isOpen, onClose, promotionId, onStatusChange }: PromotionDetailsModalProps) {
  const [promotion, setPromotion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPromotion();
    }
  }, [isOpen, promotionId]);

  const fetchPromotion = async () => {
    try {
      setLoading(true);
      const data = await promotionApi.getPromotionById(promotionId);
      setPromotion(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (newStatus: string) => {
    try {
      await promotionApi.updateStatus(promotionId, newStatus);
      fetchPromotion();
      onStatusChange();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface rounded-2xl w-full max-w-2xl border border-subtle-hover shadow-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-subtle">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-main">Promotion Details</h2>
              <p className="text-sm text-muted">ID: #{promotionId.toString().padStart(4, '0')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-main transition-colors rounded-xl hover:bg-hover">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-muted">Loading...</div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          ) : promotion ? (
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-base p-4 rounded-xl border border-subtle">
                  <span className="block text-xs font-bold text-muted mb-1">Name</span>
                  <p className="text-main font-medium">{promotion.name}</p>
                </div>
                <div className="bg-base p-4 rounded-xl border border-subtle">
                  <span className="block text-xs font-bold text-muted mb-1">Status</span>
                  <div className="flex items-center justify-between">
                    <span className="text-main font-medium capitalize">{promotion.current_status}</span>
                    <select
                      value={promotion.status}
                      onChange={(e) => handleStatusToggle(e.target.value)}
                      className="bg-surface text-xs border border-subtle-hover rounded px-2 py-1 text-main focus:outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active (Auto)</option>
                      <option value="inactive">Force Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="bg-base p-4 rounded-xl border border-subtle">
                  <span className="block text-xs font-bold text-muted mb-1">Discount</span>
                  <p className="text-2xl font-bold text-amber-400">
                    {promotion.discount_type === 'percentage' ? `${promotion.discount_value}%` : `${formatCurrency(promotion.discount_value)}`}
                    <span className="text-sm font-medium text-muted ml-2 capitalize">OFF</span>
                  </p>
                </div>

                <div className="bg-base p-4 rounded-xl border border-subtle">
                  <span className="block text-xs font-bold text-muted mb-1">Validity Period</span>
                  <div className="flex items-center space-x-2 text-main">
                    <Calendar className="w-4 h-4 text-muted" />
                    <span>{new Date(promotion.start_date).toLocaleDateString()} to {new Date(promotion.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {promotion.description && (
                <div>
                  <span className="block text-xs font-bold text-muted mb-2">Description</span>
                  <p className="text-main text-sm bg-base p-4 rounded-xl border border-subtle whitespace-pre-wrap">
                    {promotion.description}
                  </p>
                </div>
              )}

              <div>
                <span className="block text-xs font-bold text-muted mb-2">Applicability</span>
                <div className="bg-base p-4 rounded-xl border border-subtle max-h-48 overflow-y-auto">
                  {promotion.categories && promotion.categories.length > 0 ? (
                    <div>
                      <p className="text-sm text-main font-bold mb-2">Selected Categories:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {promotion.categories.map((c: any) => (
                          <li key={c.id} className="text-muted text-sm">{c.name}</li>
                        ))}
                      </ul>
                    </div>
                  ) : promotion.drugs && promotion.drugs.length > 0 ? (
                    <div>
                      <p className="text-sm text-main font-bold mb-2">Selected Drugs:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {promotion.drugs.map((d: any) => (
                          <li key={d.id} className="text-muted text-sm">{d.name} <span className="opacity-50">({d.generic_name})</span></li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-emerald-400 font-medium flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Applies to all products</span>
                    </p>
                  )}
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
