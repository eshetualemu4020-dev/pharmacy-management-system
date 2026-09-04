import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, Heart, AlertCircle, Pill, Building2, Beaker, FileText, CheckCircle2, Info } from 'lucide-react';
import { catalogApi, cartApi, wishlistApi } from '../../services/api';

interface CustomerProductDetailsTabProps {
  productId: number;
  onNavigate: (tab: string, contextId?: any) => void;
  onUpdateCounts: () => void;
}

export const CustomerProductDetailsTab: React.FC<CustomerProductDetailsTabProps> = ({ productId, onNavigate, onUpdateCounts }) => {
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const data = await catalogApi.getDrugById(productId);
        setProduct(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (productId) fetchProduct();
  }, [productId]);

  useEffect(() => {
    const checkWishlist = async () => {
      if (!product) return;
      try {
        const wl = await wishlistApi.getWishlist();
        setInWishlist(wl.some((item: any) => item.id === product.id));
      } catch (err) {
        // ignore
      }
    };
    checkWishlist();
  }, [product]);

  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!product || product.qty < quantity || isAdding) return;
    setIsAdding(true);
    try {
      await cartApi.addToCart({ drug_id: product.id, quantity });
      onUpdateCounts();
      // alert('Added to cart!');
    } catch (err: any) {
      alert(err.message || 'Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    setIsWishlistLoading(true);
    try {
      if (inWishlist) {
        await wishlistApi.removeFromWishlist(product.id);
        setInWishlist(false);
      } else {
        await wishlistApi.addToWishlist(product.id);
        setInWishlist(true);
      }
      onUpdateCounts();
    } catch (err) {
      alert('Failed to update wishlist');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-10 flex justify-center items-center h-full text-muted">Loading product details...</div>;
  }

  if (error || !product) {
    return (
      <div className="p-10 flex flex-col justify-center items-center h-full text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-main mb-2">Product Not Found</h2>
        <p className="text-muted mb-6">{error || 'The requested product could not be found or is no longer available.'}</p>
        <button onClick={() => onNavigate('browse_drugs')} className="px-6 py-2 bg-surface-alt text-main rounded-xl hover:bg-[#2a2843]">
          Back to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-base text-muted overflow-y-auto">
      
      {/* Header */}
      <div className="bg-surface-alt/30 border-b border-subtle p-6 flex items-center gap-4 sticky top-0 z-10 backdrop-blur-md">
        <button 
          onClick={() => onNavigate('browse_drugs')}
          className="p-2 rounded-xl bg-hover hover:bg-white/10 transition-colors text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-main line-clamp-1 flex-1">Back to Catalog</h2>
      </div>

      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Image & Badges */}
          <div className="bg-surface-alt/50 border border-subtle rounded-3xl p-10 flex flex-col items-center justify-center relative min-h-[400px]">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="max-w-full max-h-[400px] object-contain" />
            ) : (
              <Pill className="w-40 h-40 text-muted/30" />
            )}

            <div className="absolute top-6 left-6 flex flex-col gap-2">
              {product.requires_prescription === 1 && (
                <div className="bg-[#6b4cff]/20 text-[#6b4cff] text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm border border-[#6b4cff]/20">
                  <AlertCircle className="w-4 h-4" /> Prescription Required
                </div>
              )}
              <div className={`text-sm font-bold px-4 py-2 rounded-full backdrop-blur-sm border ${product.qty > 0 ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-red-500/20 text-red-400 border-red-500/20'}`}>
                {product.qty > 0 ? 'In Stock' : 'Out of Stock'}
              </div>
            </div>

            <button
              onClick={handleToggleWishlist}
              disabled={isWishlistLoading}
              className={`absolute top-6 right-6 p-4 rounded-2xl backdrop-blur-sm transition-all shadow-lg ${
                inWishlist 
                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                  : 'bg-black/20 text-white hover:bg-black/40'
              }`}
            >
              <Heart className={`w-6 h-6 ${inWishlist ? 'fill-current' : ''} ${isWishlistLoading ? 'animate-pulse' : ''}`} />
            </button>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className="text-[#6b4cff] font-bold tracking-wider uppercase text-sm">{product.category_name}</span>
            </div>
            
            <h1 className="text-4xl font-bold text-main mb-2">{product.name}</h1>
            <h2 className="text-xl text-muted mb-6">{product.generic_name || 'N/A'}</h2>
            
            <div className="text-4xl font-bold text-main mb-8">${Number(product.price).toFixed(2)}</div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {product.dosage_form && (
                <div className="bg-surface-alt/50 p-4 rounded-2xl border border-subtle flex items-center gap-3">
                  <Pill className="w-6 h-6 text-[#6b4cff]" />
                  <div>
                    <p className="text-xs text-muted uppercase font-bold">Dosage Form</p>
                    <p className="text-main font-medium">{product.dosage_form}</p>
                  </div>
                </div>
              )}
              {product.strength && (
                <div className="bg-surface-alt/50 p-4 rounded-2xl border border-subtle flex items-center gap-3">
                  <Beaker className="w-6 h-6 text-[#6b4cff]" />
                  <div>
                    <p className="text-xs text-muted uppercase font-bold">Strength</p>
                    <p className="text-main font-medium">{product.strength}</p>
                  </div>
                </div>
              )}
              {product.manufacturer && (
                <div className="bg-surface-alt/50 p-4 rounded-2xl border border-subtle flex items-center gap-3 col-span-2">
                  <Building2 className="w-6 h-6 text-[#6b4cff]" />
                  <div>
                    <p className="text-xs text-muted uppercase font-bold">Manufacturer</p>
                    <p className="text-main font-medium">{product.manufacturer}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Add to Cart Actions */}
            <div className="bg-surface-alt p-6 rounded-3xl border border-subtle mb-8">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 bg-base rounded-xl border border-subtle-hover p-2">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-hover text-main"
                  >-</button>
                  <span className="w-8 text-center text-main font-bold text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.qty, quantity + 1))}
                    disabled={quantity >= product.qty}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-hover text-main disabled:opacity-50"
                  >+</button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.qty <= 0 || isAdding}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${
                    product.qty > 0 && !isAdding
                      ? 'bg-[#6b4cff] hover:bg-[#5a3ee0] text-white shadow-lg shadow-[#6b4cff]/20 hover:shadow-[#6b4cff]/40 hover:-translate-y-1'
                      : 'bg-hover text-main/30 cursor-not-allowed'
                  }`}
                >
                  {isAdding ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ShoppingCart className="w-6 h-6" />
                  )}
                  {isAdding ? 'Adding...' : product.qty > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="flex items-center gap-2 text-main font-bold text-lg mb-3">
                <FileText className="w-5 h-5 text-[#6b4cff]" /> Description
              </h3>
              <div className="bg-surface-alt/30 p-5 rounded-2xl border border-subtle leading-relaxed text-muted">
                {product.description || 'No description available for this product.'}
              </div>
            </div>

            {/* Composition */}
            {product.composition && (
              <div>
                <h3 className="flex items-center gap-2 text-main font-bold text-lg mb-3">
                  <Info className="w-5 h-5 text-[#6b4cff]" /> Composition & Ingredients
                </h3>
                <div className="bg-surface-alt/30 p-5 rounded-2xl border border-subtle leading-relaxed text-muted">
                  {product.composition}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
