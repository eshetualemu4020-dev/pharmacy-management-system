import React, { useState, useEffect } from 'react';
import { Search, Grid, ChevronRight, Activity, Layers } from 'lucide-react';
import { catalogApi } from '../../services/api';

interface CustomerCategoriesTabProps {
  onNavigate: (tab: string, contextId?: any) => void;
}

export const CustomerCategoriesTab: React.FC<CustomerCategoriesTabProps> = ({ onNavigate }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchCategories = async (searchTerm: string = '') => {
    setIsLoading(true);
    setError('');
    try {
      const data = await catalogApi.getCategories({ search: searchTerm });
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCategories(search);
  };

  return (
    <div className="flex flex-col h-full bg-base text-muted">
      
      {/* Header & Search */}
      <div className="bg-surface-alt/30 border-b border-subtle p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-main mb-2">Categories</h1>
              <p className="text-muted">Browse medicines and healthcare products by category.</p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6b4cff] to-[#4c36b6] rounded-xl flex items-center justify-center shadow-lg shadow-[#6b4cff]/20">
                <Layers className="w-6 h-6 text-main" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-base border border-subtle-hover rounded-xl py-3 pl-12 pr-4 text-main placeholder:text-muted focus:outline-none focus:border-[#6b4cff]/50 focus:ring-1 focus:ring-[#6b4cff]/50 transition-all"
              />
            </div>
            <button type="submit" className="px-6 py-3 bg-[#6b4cff] hover:bg-[#5a3ee0] text-white rounded-xl font-medium transition-colors">
              Search
            </button>
            {search && (
              <button 
                type="button" 
                onClick={() => { setSearch(''); fetchCategories(''); }} 
                className="px-4 py-3 bg-hover hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl flex flex-col items-center justify-center text-center mb-8">
              <Activity className="w-8 h-8 mb-4" />
              <p className="text-lg mb-4">{error}</p>
              <button 
                onClick={() => fetchCategories(search)}
                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-surface-alt/30 border border-subtle rounded-2xl p-6 animate-pulse">
                  <div className="w-12 h-12 bg-hover rounded-xl mb-4"></div>
                  <div className="h-6 bg-hover rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-hover rounded w-full mb-2"></div>
                  <div className="h-4 bg-hover rounded w-2/3 mb-6"></div>
                  <div className="h-4 bg-hover rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-surface-alt/30 border border-subtle rounded-2xl p-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-hover rounded-full flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-muted/50" />
              </div>
              <h2 className="text-2xl font-bold text-main mb-2">
                {search ? 'No categories match your search.' : 'No categories are currently available.'}
              </h2>
              <p className="text-muted mb-6">
                {search ? 'Try adjusting your search terms to find what you are looking for.' : 'Please check back later for updates.'}
              </p>
              {search && (
                <button 
                  onClick={() => { setSearch(''); fetchCategories(''); }}
                  className="px-6 py-3 bg-surface-alt hover:bg-[#2a2843] text-main rounded-xl transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <div 
                  key={category.id} 
                  onClick={() => onNavigate('browse_drugs', category.id.toString())}
                  className="bg-surface-alt/50 border border-subtle rounded-2xl p-6 hover:border-[#6b4cff]/50 hover:bg-surface-alt cursor-pointer transition-all group flex flex-col h-full"
                >
                  <div className="w-12 h-12 bg-base group-hover:bg-[#6b4cff]/10 rounded-xl flex items-center justify-center mb-5 transition-colors border border-subtle group-hover:border-[#6b4cff]/20">
                    <Grid className="w-6 h-6 text-muted group-hover:text-[#6b4cff] transition-colors" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-main mb-2 group-hover:text-[#6b4cff] transition-colors line-clamp-1">{category.name}</h3>
                  <p className="text-sm text-muted mb-6 line-clamp-2 flex-1">
                    {category.description || 'Medicines and products in this category.'}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-subtle">
                    <span className="text-xs font-bold text-main/50 uppercase tracking-wider">
                      {category.productCount} {category.productCount === 1 ? 'Product' : 'Products'}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-hover flex items-center justify-center group-hover:bg-[#6b4cff] transition-colors">
                      <ChevronRight className="w-4 h-4 text-main/50 group-hover:text-main transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};
