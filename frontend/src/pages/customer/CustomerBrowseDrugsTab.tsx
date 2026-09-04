import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, PackageOpen } from 'lucide-react';
import { catalogApi, categoryApi } from '../../services/api';
import { ProductCard } from '../../components/customer/ProductCard';

interface CustomerBrowseDrugsTabProps {
  onNavigate: (tab: string, contextId?: any) => void;
  onUpdateCounts: () => void;
  initialCategory?: string;
}

export const CustomerBrowseDrugsTab: React.FC<CustomerBrowseDrugsTabProps> = ({ onNavigate, onUpdateCounts, initialCategory }) => {
  const [drugs, setDrugs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [dosageForms, setDosageForms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory || '');
  const [prescription, setPrescription] = useState('');
  const [availability, setAvailability] = useState('');
  const [dosageForm, setDosageForm] = useState('');
  const [sort, setSort] = useState('name_asc');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 12;

  const [showFilters, setShowFilters] = useState(false); // For mobile

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cats, forms] = await Promise.all([
          categoryApi.getCategories(),
          catalogApi.getDosageForms()
        ]);
        setCategories(cats);
        setDosageForms(forms);
      } catch (err) {
        console.error('Failed to load metadata', err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (initialCategory !== undefined) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    const fetchDrugs = async () => {
      setIsLoading(true);
      try {
        const data = await catalogApi.getDrugs({
          search,
          category,
          prescription,
          availability,
          dosage_form: dosageForm,
          sort,
          page,
          limit
        });
        setDrugs(data.drugs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.total || 0);
      } catch (err) {
        console.error('Failed to load drugs', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchDrugs();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, category, prescription, availability, dosageForm, sort, page]);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full p-6 bg-base text-muted">
      
      {/* Mobile filter toggle */}
      <div className="md:hidden flex justify-between items-center bg-surface-alt p-4 rounded-xl border border-subtle">
        <span className="font-bold text-main">Filters</span>
        <button onClick={() => setShowFilters(!showFilters)} className="text-main">
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar Filters */}
      <div className={`w-full md:w-64 flex-shrink-0 flex flex-col gap-6 transition-all ${showFilters ? 'block' : 'hidden md:block'}`}>
        <div className="bg-surface-alt/50 p-5 rounded-2xl border border-subtle">
          <div className="flex items-center gap-2 mb-4 text-main font-bold pb-4 border-b border-subtle-hover">
            <Filter className="w-5 h-5 text-[#6b4cff]" />
            Filters
          </div>

          <div className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2">Category</label>
              <select 
                value={category} 
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-3 py-2 text-main focus:outline-none focus:border-[#6b4cff]"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Prescription */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2">Prescription</label>
              <select 
                value={prescription} 
                onChange={(e) => { setPrescription(e.target.value); setPage(1); }}
                className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-3 py-2 text-main focus:outline-none focus:border-[#6b4cff]"
              >
                <option value="">Any</option>
                <option value="required">Rx Required</option>
                <option value="not_required">Over the Counter</option>
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2">Availability</label>
              <select 
                value={availability} 
                onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
                className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-3 py-2 text-main focus:outline-none focus:border-[#6b4cff]"
              >
                <option value="">Any</option>
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Dosage Form */}
            {dosageForms.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">Dosage Form</label>
                <select 
                  value={dosageForm} 
                  onChange={(e) => { setDosageForm(e.target.value); setPage(1); }}
                  className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-3 py-2 text-main focus:outline-none focus:border-[#6b4cff]"
                >
                  <option value="">All Forms</option>
                  {dosageForms.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            )}
            
            <button
              onClick={() => {
                setCategory(''); setPrescription(''); setAvailability(''); setDosageForm(''); setPage(1);
              }}
              className="w-full py-2 text-sm text-muted hover:text-main transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* Topbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search medications..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-surface-alt/50 border border-subtle-hover rounded-xl pl-12 pr-4 py-3 text-main focus:outline-none focus:border-[#6b4cff] focus:bg-surface-alt"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="bg-surface-alt/50 border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#6b4cff]"
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>

        <div className="mb-4 text-sm font-bold">
          Showing {drugs.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, totalItems)} of {totalItems} products
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pr-2 pb-6 min-h-[400px]">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 bg-surface-alt/30 rounded-2xl animate-pulse border border-subtle"></div>
              ))}
            </div>
          ) : drugs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {drugs.map(drug => (
                <ProductCard 
                  key={drug.id} 
                  product={drug} 
                  onViewDetails={(id) => onNavigate('product_details', id)}
                  onUpdateCounts={onUpdateCounts}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 bg-surface-alt rounded-full flex items-center justify-center mb-6">
                <PackageOpen className="w-10 h-10 text-[#6b4cff]" />
              </div>
              <h3 className="text-xl font-bold text-main mb-2">No products found</h3>
              <p className="max-w-md">We couldn't find any medications matching your current filters. Try adjusting your search criteria.</p>
              <button 
                onClick={() => { setSearch(''); setCategory(''); setPrescription(''); setAvailability(''); setDosageForm(''); setPage(1); }}
                className="mt-6 px-6 py-2 bg-[#6b4cff] text-white rounded-xl hover:bg-[#5a3ee0] transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !isLoading && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 rounded-xl bg-surface-alt border border-subtle-hover hover:bg-[#2a2843] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  // simple truncation logic for pagination
                  if (totalPages > 7 && p !== 1 && p !== totalPages && Math.abs(p - page) > 1) {
                    if (p === 2 || p === totalPages - 1) return <span key={p} className="px-2">...</span>;
                    return null;
                  }
                  
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-xl font-bold transition-all ${
                        page === p
                          ? 'bg-[#6b4cff] text-white'
                          : 'bg-surface-alt border border-subtle-hover hover:bg-[#2a2843]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 rounded-xl bg-surface-alt border border-subtle-hover hover:bg-[#2a2843] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
