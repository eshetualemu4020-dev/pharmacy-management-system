import { formatCurrency } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Eye, Tag, Calendar, AlertCircle } from 'lucide-react';
import { promotionApi } from '../../services/api';
import PromotionFormModal from './components/PromotionFormModal';
import PromotionDetailsModal from './components/PromotionDetailsModal';

export default function PromotionsTab() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, [statusFilter]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      
      const data = await promotionApi.getPromotions(params);
      setPromotions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedPromotion(null);
    setIsEdit(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (promo: any) => {
    setSelectedPromotion(promo);
    setIsEdit(true);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (promo: any) => {
    setSelectedPromotion(promo);
    setIsDetailsOpen(true);
  };

  const filteredPromotions = promotions.filter(promo => 
    promo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    promo.id.toString().includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">Active</span>;
      case 'scheduled':
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold border border-blue-500/20">Scheduled</span>;
      case 'expired':
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold border border-red-500/20">Expired</span>;
      case 'inactive':
        return <span className="px-3 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs font-bold border border-slate-500/20">Inactive</span>;
      default:
        return <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold border border-amber-500/20">Draft</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-main mb-2">Promotions & Offers</h1>
          <p className="text-muted">Manage discounts, special offers, and pricing rules.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-[#9b51e0] hover:bg-[#8a44c8] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-[#9b51e0]/20"
        >
          <Plus className="w-5 h-5" />
          <span>Create Promotion</span>
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-subtle p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input 
              type="text" 
              placeholder="Search by promotion name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-base border border-subtle rounded-xl pl-12 pr-4 py-3 text-main focus:outline-none focus:border-[#9b51e0] transition-colors"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-base border border-subtle rounded-xl pl-12 pr-10 py-3 text-main focus:outline-none focus:border-[#9b51e0] appearance-none cursor-pointer transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-subtle">
                <th className="py-4 px-4 text-xs font-bold text-muted uppercase tracking-wider">Promotion</th>
                <th className="py-4 px-4 text-xs font-bold text-muted uppercase tracking-wider">Discount</th>
                <th className="py-4 px-4 text-xs font-bold text-muted uppercase tracking-wider">Period</th>
                <th className="py-4 px-4 text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                <th className="py-4 px-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">Loading promotions...</td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">No promotions found.</td>
                </tr>
              ) : (
                filteredPromotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                          <Tag className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-main">{promo.name}</p>
                          <p className="text-xs text-muted">ID: #{promo.id.toString().padStart(4, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-main">
                        {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `${formatCurrency(promo.discount_value)}`}
                      </p>
                      <p className="text-xs text-muted capitalize">{promo.discount_type}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 text-sm text-muted">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(promo.current_status)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenDetails(promo)}
                          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(promo)}
                          className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <PromotionFormModal 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          promotionData={selectedPromotion}
          isEdit={isEdit}
          onSuccess={fetchPromotions}
        />
      )}

      {isDetailsOpen && selectedPromotion && (
        <PromotionDetailsModal 
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          promotionId={selectedPromotion.id}
          onStatusChange={fetchPromotions}
        />
      )}
    </div>
  );
}
