import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Pill, Grid, FileText, ShoppingCart, Heart, Activity } from 'lucide-react';
import { categoryApi, drugApi, promotionApi, cartApi, wishlistApi } from '../../services/api';

interface CustomerHomeTabProps {
  onNavigate?: (tab: string, contextId?: any) => void;
}

export default function CustomerHomeTab({ onNavigate }: CustomerHomeTabProps) {
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [featuredDrugs, setFeaturedDrugs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user?.username || 'Guest';

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [catsRes, promoRes, drugsRes] = await Promise.all([
        categoryApi.getCategories(),
        promotionApi.getPromotions({ status: 'active' }),
        drugApi.getAll({ status: 'active' }) // Only active drugs
      ]);

      setCategories(catsRes);
      setPromotions(promoRes);
      // Wait, drugApi getAll uses is_active=1 in backend if status='active' is passed
      // Let's just slice the first 8 for featured
      setFeaturedDrugs(drugsRes.slice(0, 8)); 
    } catch (err: any) {
      setError('Failed to load store data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }
    
    try {
      setLoading(true);
      const results = await drugApi.getAll({ search: searchTerm, status: 'active' });
      setSearchResults(results);
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (drug: any) => {
    cartApi.addToCart(drug);
    alert('Added to cart!');
    window.dispatchEvent(new Event('storage'));
  };

  const handleToggleWishlist = (drug: any) => {
    // We already toggled the wishlist in the DrugCard component
    window.dispatchEvent(new Event('storage'));
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-[#f43f5e]/20 border-t-[#f43f5e] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 p-10 pb-20">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-surface to-base rounded-3xl p-10 border border-subtle overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f43f5e]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#3b82f6]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-bold text-main mb-4">
            Hello, {userName}! <br/> Your Health, Our Priority
          </h1>
          <p className="text-muted text-lg mb-8">
            Find trusted medicines, healthcare products, and upload your prescriptions easily.
          </p>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                placeholder="Search by drug name, generic name, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-base border border-subtle-hover rounded-xl py-4 pl-12 pr-4 text-main placeholder:text-muted focus:outline-none focus:border-[#f43f5e]/50 focus:ring-1 focus:ring-[#f43f5e]/50 transition-all"
              />
            </div>
            <button type="submit" className="px-8 py-4 bg-[#f43f5e] hover:bg-[#e11d48] text-white rounded-xl font-medium transition-colors">
              Search
            </button>
            {searchResults && (
              <button type="button" onClick={() => { setSearchTerm(''); setSearchResults(null); }} className="px-6 py-4 bg-hover text-main rounded-xl font-medium transition-colors border border-subtle">
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center space-x-3">
          <Activity className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-main">Search Results</h2>
            <span className="text-muted">{searchResults.length} found</span>
          </div>
          {searchResults.length === 0 ? (
            <div className="bg-surface rounded-2xl p-10 text-center border border-subtle">
              <Search className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-main mb-2">No medicines found</h3>
              <p className="text-muted">Try adjusting your search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {searchResults.map((drug: any) => (
                <DrugCard key={drug.id} drug={drug} onAddCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </section>
      )}

      {!searchResults && (
        <>
          {/* Active Promotions */}
          {promotions.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-main">Active Promotions</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {promotions.map((promo: any) => (
                  <div key={promo.id} className="bg-gradient-to-r from-[#f43f5e]/20 to-surface p-6 rounded-2xl border border-[#f43f5e]/30 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-main mb-2">{promo.name}</h3>
                      <p className="text-muted text-sm mb-4">{promo.description}</p>
                      <span className="inline-block px-3 py-1 bg-[#f43f5e] text-white text-xs font-bold rounded-lg uppercase tracking-wider">
                        {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `$${promo.discount_value} OFF`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Popular Categories */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-main">Popular Categories</h2>
              <button 
                onClick={() => onNavigate && onNavigate('categories')}
                className="text-[#f43f5e] hover:text-[#e11d48] font-medium flex items-center space-x-1"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((cat: any) => (
                <div 
                  key={cat.id} 
                  onClick={() => onNavigate && onNavigate('browse_drugs', cat.id.toString())}
                  className="bg-surface p-6 rounded-2xl border border-subtle hover:border-[#f43f5e]/50 cursor-pointer transition-all text-center group"
                >
                  <div className="w-12 h-12 bg-hover group-hover:bg-[#f43f5e]/10 rounded-xl mx-auto flex items-center justify-center mb-4 transition-colors">
                    <Grid className="w-6 h-6 text-muted group-hover:text-[#f43f5e] transition-colors" />
                  </div>
                  <h3 className="font-medium text-main">{cat.name}</h3>
                </div>
              ))}
            </div>
          </section>

          {/* Featured Products */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-main">Featured Products</h2>
              <button 
                onClick={() => onNavigate && onNavigate('browse_drugs')}
                className="text-[#f43f5e] hover:text-[#e11d48] font-medium flex items-center space-x-1"
              >
                <span>Browse All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {featuredDrugs.length === 0 ? (
              <div className="bg-surface rounded-2xl p-10 text-center border border-subtle">
                <Pill className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-main mb-2">No products available</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredDrugs.map((drug: any) => (
                  <DrugCard key={drug.id} drug={drug} onAddCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} onNavigate={onNavigate} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Prescription Service Callout */}
      <section className="bg-surface rounded-3xl p-10 border border-[#3b82f6]/30 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl font-bold text-main mb-4">Have a Prescription?</h2>
          <p className="text-muted max-w-xl text-lg">
            Upload your prescription for Rx-only medicines. Our pharmacists will review and approve it shortly.
          </p>
        </div>
        <button className="px-8 py-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl font-bold transition-colors flex items-center space-x-2 shrink-0 shadow-lg shadow-[#3b82f6]/20">
          <FileText className="w-5 h-5" />
          <span>Upload Prescription</span>
        </button>
      </section>

    </div>
  );
}

// Subcomponent for Drug Card
function DrugCard({ drug, onAddCart, onToggleWishlist, onNavigate }: { drug: any, onAddCart: (d: any) => void, onToggleWishlist: (d: any) => void, onNavigate?: (tab: string, contextId?: any) => void }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkWishlist = async () => {
      try {
        const wl = await wishlistApi.getWishlist();
        setIsWishlisted(wl.some((item: any) => item.id === drug.id));
      } catch (err) {}
    };
    checkWishlist();
  }, [drug.id]);
  
  const toggle = async () => {
    setIsLoading(true);
    try {
      if (isWishlisted) {
        await wishlistApi.removeFromWishlist(drug.id);
        setIsWishlisted(false);
      } else {
        await wishlistApi.addToWishlist(drug.id);
        setIsWishlisted(true);
      }
      onToggleWishlist(drug);
    } catch (err) {
      alert('Failed to update wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-subtle p-5 flex flex-col group hover:border-[#f43f5e]/30 transition-colors">
      <div className="relative mb-4">
        <div className="aspect-square bg-base rounded-xl flex items-center justify-center p-4">
          {drug.image_url ? (
            <img src={drug.image_url} alt={drug.name} className="w-full h-full object-contain mix-blend-screen opacity-90 group-hover:scale-105 transition-transform" />
          ) : (
            <Pill className="w-16 h-16 text-main/10 group-hover:scale-105 transition-transform" />
          )}
        </div>
        <button 
          onClick={toggle}
          disabled={isLoading}
          className="absolute top-3 right-3 p-2 bg-surface rounded-lg border border-subtle-hover hover:bg-[#f43f5e]/10 hover:border-[#f43f5e]/30 hover:text-[#f43f5e] transition-colors"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#f43f5e] text-[#f43f5e]' : 'text-muted'} ${isLoading ? 'animate-pulse' : ''}`} />
        </button>
        {drug.requires_prescription === 1 && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-[#3b82f6]/20 text-[#3b82f6] text-[10px] font-bold rounded uppercase tracking-wider">
            Rx Only
          </span>
        )}
      </div>
      
      <div 
        className="flex-1 flex flex-col cursor-pointer"
        onClick={() => onNavigate && onNavigate('product_details', drug.id)}
      >
        <div className="text-xs text-muted mb-1">{drug.category_name || 'Uncategorized'}</div>
        <h3 className="font-bold text-main text-lg mb-1 line-clamp-1" title={drug.name}>{drug.name}</h3>
        {drug.strength && <div className="text-sm text-muted mb-3">{drug.strength}</div>}
        
        <div className="mt-auto flex items-center justify-between pt-4" onClick={(e) => e.stopPropagation()}>
          <div>
            <span className="text-muted text-xs uppercase tracking-wider block mb-0.5">Price</span>
            <span className="text-xl font-bold text-main">${Number(drug.price).toFixed(2)}</span>
          </div>
          <button 
            onClick={() => onAddCart(drug)}
            className="w-10 h-10 bg-[#f43f5e] hover:bg-[#e11d48] text-white rounded-xl flex items-center justify-center transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
