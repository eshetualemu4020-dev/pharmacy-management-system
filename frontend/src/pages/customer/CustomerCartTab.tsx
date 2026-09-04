import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, ShoppingCart, Plus, Minus, ArrowRight, Activity, ShieldAlert, Tag } from 'lucide-react';
import { cartApi, promotionApi } from '../../services/api';

interface CartItem {
  cart_item_id: number;
  drug_id: number;
  quantity: number;
  name: string;
  generic_name: string;
  price: number;
  stock: number;
  requires_prescription: boolean;
  is_available: boolean;
  has_sufficient_stock: boolean;
  lineTotal: number;
}

interface CartResponse {
  cartId: number;
  items: CartItem[];
  subtotal: number;
}

export const CustomerCartTab: React.FC<{ onNavigate: (tab: string, id?: any) => void, onUpdateCounts: () => void }> = ({ onNavigate, onUpdateCounts }) => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const [promotionCode, setPromotionCode] = useState('');
  const [activePromotion, setActivePromotion] = useState<any>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [validationData, setValidationData] = useState<any>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await cartApi.getCart();
      setCart(data);
      if (data.items.length > 0) {
        validateCurrentCart(activePromotion?.id);
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const validateCurrentCart = async (promoId?: number) => {
    try {
      const result = await cartApi.validateCart(promoId);
      setValidationData(result);
    } catch (err: any) {
      setValidationData(null);
    }
  };

  const handleUpdateQuantity = async (itemId: number, currentQty: number, change: number) => {
    if (actionLoading === itemId) return;
    const newQty = currentQty + change;
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      setActionLoading(itemId);
      setGlobalError(null);
      await cartApi.updateCartItem(itemId, newQty);
      await fetchCart();
      onUpdateCounts();
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to update quantity');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (actionLoading === itemId) return;
    try {
      setActionLoading(itemId);
      setGlobalError(null);
      await cartApi.removeFromCart(itemId);
      await fetchCart();
      onUpdateCounts();
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to remove item');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Remove all items from your cart?')) {
      try {
        setLoading(true);
        await cartApi.clearCart();
        await fetchCart();
        onUpdateCounts();
      } catch (err: any) {
        setGlobalError(err.message || 'Failed to clear cart');
        setLoading(false);
      }
    }
  };

  const handleApplyPromotion = async () => {
    if (!promotionCode.trim()) return;
    
    // Attempt to apply promotion
    try {
      setPromoError(null);
      const promos = await promotionApi.getPromotions({ status: 'active' });
      const promo = promos.find((p: any) => p.name.toLowerCase() === promotionCode.toLowerCase());
      
      if (!promo) {
        setPromoError('Invalid or inactive promotion code.');
        setActivePromotion(null);
        validateCurrentCart(undefined);
        return;
      }
      
      setActivePromotion(promo);
      await validateCurrentCart(promo.id);
      
    } catch (err: any) {
      setPromoError('Failed to verify promotion');
    }
  };

  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);
      setGlobalError(null);
      const result = await cartApi.validateCart(activePromotion?.id);
      
      if (result.valid) {
        // Validation passed! Proceed to checkout
        // The implementation plan says route to checkout flow
        onNavigate('checkout', { validationResult: result, promotionId: activePromotion?.id });
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Unable to proceed to checkout. Please review your cart.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-base">
        <Activity className="w-8 h-8 text-[#f43f5e] animate-spin" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="h-full bg-base p-8 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-surface-alt rounded-full flex items-center justify-center mb-6 border border-subtle">
          <ShoppingCart className="w-12 h-12 text-muted" />
        </div>
        <h2 className="text-2xl font-bold text-main mb-2">Your Cart is Empty</h2>
        <p className="text-muted mb-8">You haven't added any medicines or healthcare products yet.</p>
        <button 
          onClick={() => onNavigate('browse_drugs')}
          className="bg-[#6b4cff] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#5a3ee0] transition-colors"
        >
          Browse Medicines
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-base p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-main">Cart</h1>
            <p className="text-muted mt-1">Your selected medicines and healthcare products.</p>
          </div>
          <button
            onClick={handleClearCart}
            className="text-red-400 hover:text-red-300 font-medium text-sm flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Cart
          </button>
        </div>

      {globalError && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400">{globalError}</p>
        </div>
      )}

      {validationData?.requiresPrescription && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-400">
            This cart contains prescription-required medicines. A valid prescription may be required during checkout.
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {cart.items.map((item) => (
            <div key={item.cart_item_id} className="bg-surface-alt rounded-xl p-4 border border-subtle flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-main leading-tight">{item.name}</h3>
                    {item.generic_name && (
                      <p className="text-muted text-sm mt-0.5">{item.generic_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-main">{item.lineTotal.toFixed(2)} ETB</p>
                    <p className="text-muted text-sm">{item.price.toFixed(2)} ETB each</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    {/* Quantity Control */}
                    <div className="flex items-center space-x-3 bg-base border border-subtle rounded-lg p-1">
                      <button 
                        onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity, -1)}
                        disabled={actionLoading === item.cart_item_id}
                        className="p-1.5 hover:bg-hover rounded-md text-muted hover:text-main disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-main">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity, 1)}
                        disabled={actionLoading === item.cart_item_id || item.quantity >= item.stock}
                        className="p-1.5 hover:bg-hover rounded-md text-muted hover:text-main disabled:opacity-50"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.cart_item_id)}
                      disabled={actionLoading === item.cart_item_id}
                      className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </button>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {item.requires_prescription && (
                      <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-bold rounded flex items-center">
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        Prescription Required
                      </span>
                    )}
                    
                    {!item.is_available && (
                      <span className="text-red-400 text-sm font-medium">This product is no longer available.</span>
                    )}
                    {item.is_available && !item.has_sufficient_stock && (
                      <span className="text-yellow-400 text-sm font-medium">Only {item.stock} units are currently available.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96 space-y-6">
          <div className="bg-surface-alt rounded-xl p-6 border border-subtle">
            <h2 className="text-xl font-bold text-main mb-6">Order Summary</h2>
            
            <div className="space-y-4 text-sm font-medium">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{cart.subtotal.toFixed(2)} ETB</span>
              </div>
              
              {validationData?.discount > 0 && (
                <div className="flex justify-between text-[#6b4cff]">
                  <span>Discount</span>
                  <span>-{validationData.discount.toFixed(2)} ETB</span>
                </div>
              )}
              
              <div className="flex justify-between text-muted">
                <span>Delivery Fee</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="pt-4 border-t border-subtle">
                <div className="flex justify-between items-center">
                  <span className="text-main font-bold text-lg">Total</span>
                  <span className="text-main font-bold text-2xl">
                    {(validationData?.total ?? cart.subtotal).toFixed(2)} ETB
                  </span>
                </div>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="mt-6 pt-6 border-t border-subtle">
              <label className="block text-sm font-bold text-muted mb-2">Apply Promo Code</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={promotionCode}
                  onChange={(e) => setPromotionCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 bg-base border border-subtle-hover rounded-lg px-4 py-2 text-main placeholder:text-muted focus:outline-none focus:border-[#6b4cff]"
                />
                <button
                  onClick={handleApplyPromotion}
                  className="bg-hover hover:bg-white/10 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Apply
                </button>
              </div>
              {promoError && (
                <p className="text-red-400 text-xs mt-2">{promoError}</p>
              )}
              {activePromotion && !promoError && (
                <p className="text-green-400 text-xs mt-2 flex items-center">
                  <Tag className="w-3 h-3 mr-1" />
                  Promotion '{activePromotion.name}' applied!
                </p>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || cart.items.some(i => !i.is_available || !i.has_sufficient_stock)}
              className="w-full mt-6 bg-[#6b4cff] hover:bg-[#5a3ee0] disabled:bg-[#6b4cff]/50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold flex items-center justify-center transition-colors"
            >
              {isCheckingOut ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
            <button
              onClick={() => onNavigate('browse_drugs')}
              className="w-full mt-3 bg-transparent hover:bg-hover text-main py-3.5 rounded-xl font-bold flex items-center justify-center transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
