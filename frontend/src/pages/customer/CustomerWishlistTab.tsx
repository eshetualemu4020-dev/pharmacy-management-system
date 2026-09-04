import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, HeartCrack } from 'lucide-react';
import { wishlistApi, categoryApi } from '../../services/api';
import { ProductCard } from '../../components/customer/ProductCard';

interface CustomerWishlistTabProps {
  onNavigate: (tab: string, contextId?: any) => void;
  onUpdateCounts: () => void;
}

export const CustomerWishlistTab: React.FC<CustomerWishlistTabProps> = ({ onNavigate, onUpdateCounts }) => {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [filteredWishlist, setFilteredWishlist] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [prescription, setPrescription] = useState('');
  const [availability, setAvailability] = useState('');
  const [sort, setSort] = useState('recent');
  
  const [showFilters, setShowFilters] = useState(false); // For mobile

  const loadWishlist = async () => {
    setIsLoading(true);
    try {
      const data = await wishlistApi.getWishlist();
      setWishlist(data || []);
    } catch (err) {
      console.error('Failed to load wishlist', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const cats = await categoryApi.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load metadata', err);
      }
    };
    fetchMetadata();
    loadWishlist();
  }, []);

  // Filter and Sort logic
  useEffect(() => {
    let result = [...wishlist];

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(s) || 
        (item.generic_name && item.generic_name.toLowerCase().includes(s))
      );
    }

    // Category filter
    if (category) {
      result = result.filter(item => item.category_id?.toString() === category);
    }

    // Prescription filter
    if (prescription === 'required') {
      result = result.filter(item => item.requires_prescription === 1);
    } else if (prescription === 'not_required') {
      result = result.filter(item => item.requires_prescription === 0);
    }

    // Availability filter
    if (availability === 'in_stock') {
      result = result.filter(item => item.qty > 0 && item.is_active === 1);
    } else if (availability === 'out_of_stock') {
      result = result.filter(item => item.qty <= 0 || item.is_active === 0);
    }

    // Sorting
    switch (sort) {
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price_asc':
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_desc':
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'recent':
      default:
        // Already sorted from backend by recently added
        break;
    }

    setFilteredWishlist(result);
  }, [wishlist, search, category, prescription, availability, sort]);

  // Handle updates when a product is removed from wishlist
  const handleUpdateCounts = () => {
    onUpdateCounts(); // Notify parent (Dashboard) to update the sidebar badge
    // We also reload the wishlist so the removed item disappears from this view
    loadWishlist();
  };

  return (
    <div className="flex flex-col h-full bg-base text-muted">
      
      {/* Header section */}
      <div className="p-6 pb-2 border-b border-subtle bg-surface-alt">
        <h1 className="text-2xl font-bold text-main mb-2">Wishlist</h1>
        <p className="text-sm">Save medicines and healthcare products for later.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 p-6 flex-1 min-h-0 overflow-hidden">
        {/* Mobile filter toggle */}
        <div className="md:hidden flex justify-between items-center bg-surface-alt p-4 rounded-xl border border-subtle flex-shrink-0">
          <span className="font-bold text-main">Filters</span>
          <button onClick={() => setShowFilters(!showFilters)} className="text-main">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Filters */}
        <div className={`w-full md:w-64 flex-shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar transition-all ${showFilters ? 'block' : 'hidden md:block'}`}>
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
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-3 py-2 text-main focus:outline-none focus:border-[#6b4cff]"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Prescription */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">Prescription</label>
                <select 
                  value={prescription} 
                  onChange={(e) => setPrescription(e.target.value)}
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
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-3 py-2 text-main focus:outline-none focus:border-[#6b4cff]"
                >
                  <option value="">Any</option>
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Unavailable</option>
                </select>
              </div>
              
              <button
                onClick={() => {
                  setCategory(''); setPrescription(''); setAvailability('');
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-shrink-0">
            
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                placeholder="Search wishlist..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-alt/50 border border-subtle-hover rounded-xl pl-12 pr-4 py-3 text-main focus:outline-none focus:border-[#6b4cff] focus:bg-surface-alt"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-sm whitespace-nowrap">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-surface-alt/50 border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#6b4cff] w-full sm:w-auto"
              >
                <option value="recent">Recently Added</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
              </select>
            </div>
          </div>

          <div className="mb-4 text-sm font-bold flex-shrink-0">
            {filteredWishlist.length} item(s) found
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto pr-2 pb-6 custom-scrollbar">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 bg-surface-alt/30 rounded-2xl animate-pulse border border-subtle"></div>
                ))}
              </div>
            ) : wishlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 bg-surface-alt rounded-full flex items-center justify-center mb-6">
                  <HeartCrack className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-main mb-2">Your Wishlist is Empty</h3>
                <p className="max-w-md text-muted">Save medicines and healthcare products here so you can find them easily later.</p>
                <button 
                  onClick={() => onNavigate('browse_drugs')}
                  className="mt-6 px-6 py-2 bg-[#6b4cff] text-white rounded-xl hover:bg-[#5a3ee0] transition-colors"
                >
                  Browse Medicines
                </button>
              </div>
            ) : filteredWishlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWishlist.map(drug => (
                  <ProductCard 
                    key={drug.id} 
                    product={drug} 
                    onViewDetails={(id) => onNavigate('product_details', id)}
                    onUpdateCounts={handleUpdateCounts}
                  />
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-10">
                <h3 className="text-xl font-bold text-main mb-2">No matching items</h3>
                <p className="max-w-md text-muted">Try adjusting your filters to find what you're looking for.</p>
                <button 
                  onClick={() => { setSearch(''); setCategory(''); setPrescription(''); setAvailability(''); }}
                  className="mt-6 px-6 py-2 bg-[#6b4cff] text-white rounded-xl hover:bg-[#5a3ee0] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
