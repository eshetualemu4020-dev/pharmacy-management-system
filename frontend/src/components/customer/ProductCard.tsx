import React, { useState, useEffect } from 'react';
import { Pill, Heart, ShoppingCart, AlertCircle } from 'lucide-react';
import { cartApi, wishlistApi } from '../../services/api';

interface ProductCardProps {
  product: any;
  onViewDetails: (id: number) => void;
  onUpdateCounts?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails, onUpdateCounts }) => {
  const [inWishlist, setInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  useEffect(() => {
    // Check initial wishlist status
    const checkWishlist = async () => {
      try {
        const wl = await wishlistApi.getWishlist();
        setInWishlist(wl.some((item: any) => item.id === product.id));
      } catch (err) {
        // ignore
      }
    };
    checkWishlist();
  }, [product.id]);

  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.qty <= 0 || isAdding) return;
    setIsAdding(true);
    try {
      await cartApi.addToCart({ drug_id: product.id, quantity: 1 });
      if (onUpdateCounts) onUpdateCounts();
      // Optional: show a success toast here
    } catch (err: any) {
      alert(err.message || 'Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlistLoading(true);
    try {
      if (inWishlist) {
        await wishlistApi.removeFromWishlist(product.id);
        setInWishlist(false);
      } else {
        await wishlistApi.addToWishlist(product.id);
        setInWishlist(true);
      }
      if (onUpdateCounts) onUpdateCounts();
    } catch (err) {
      alert('Failed to update wishlist');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  return (
    <div 
      className="bg-surface-alt/50 border border-subtle rounded-2xl overflow-hidden hover:bg-[#2a2843] transition-colors flex flex-col h-full cursor-pointer group"
      onClick={() => onViewDetails(product.id)}
    >
      <div className="relative h-48 bg-[#1f1d35] flex items-center justify-center p-6">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full object-contain" />
        ) : (
          <Pill className="w-16 h-16 text-muted/30 group-hover:scale-110 transition-transform duration-300" />
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.requires_prescription === 1 && (
            <div className="bg-[#6b4cff]/20 text-[#6b4cff] text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm border border-[#6b4cff]/20">
              <AlertCircle className="w-3 h-3" /> Rx Only
            </div>
          )}
          {product.qty <= 0 && (
            <div className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm border border-red-500/20">
              Out of Stock
            </div>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          disabled={isWishlistLoading}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-sm transition-all ${
            inWishlist 
              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
              : 'bg-black/20 text-muted hover:bg-black/40 hover:text-white'
          }`}
        >
          <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''} ${isWishlistLoading ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-main font-bold text-lg mb-1 line-clamp-1">{product.name}</h3>
          <p className="text-muted text-sm mb-3 line-clamp-1">{product.generic_name || 'N/A'}</p>
          
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {product.dosage_form && (
              <span className="text-xs bg-hover text-muted px-2 py-1 rounded-md">
                {product.dosage_form}
              </span>
            )}
            {product.strength && (
              <span className="text-xs bg-hover text-muted px-2 py-1 rounded-md">
                {product.strength}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-xl font-bold text-main">${Number(product.price).toFixed(2)}</span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.qty <= 0 || isAdding}
            className={`p-3 rounded-xl transition-all ${
              product.qty > 0 && !isAdding
                ? 'bg-[#6b4cff] hover:bg-[#5a3ee0] text-main shadow-lg shadow-[#6b4cff]/20 hover:shadow-[#6b4cff]/40 hover:-translate-y-0.5' 
                : 'bg-hover text-main/30 cursor-not-allowed'
            }`}
          >
            {isAdding ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
