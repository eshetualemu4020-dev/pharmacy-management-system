import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Check, AlertTriangle, Pill, User } from 'lucide-react';
import { inventoryApi, salesApi, customerApi, promotionApi } from '../../services/api';
import ReceiptModal from '../../components/ReceiptModal';

export default function PharmacistPOSTab({ navigationContext }: { navigationContext?: any }) {
  const [drugs, setDrugs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cart & POS State
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedPromotion, setSelectedPromotion] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Receipt Modal State
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inventoryRes, customersRes, promotionsRes] = await Promise.all([
        inventoryApi.getList(),
        customerApi.getCustomers().catch(() => []), // gracefully fail if no customer API
        promotionApi.getPromotions({ status: 'active' }).catch(() => [])
      ]);
      
      setDrugs(Array.isArray(inventoryRes) ? inventoryRes : (inventoryRes.data || []));
      setCustomers(Array.isArray(customersRes) ? customersRes : (customersRes.data || []));
      setPromotions(promotionsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load POS data');
    } finally {
      setLoading(false);
    }
  };

  const filteredDrugs = useMemo(() => {
    return drugs.filter(drug => 
      drug.stock > 0 &&
      (drug.name.toLowerCase().includes(search.toLowerCase()) || 
       (drug.generic_name && drug.generic_name.toLowerCase().includes(search.toLowerCase())))
    );
  }, [drugs, search]);

  const addToCart = (drug: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === drug.id);
      if (existing) {
        if (existing.quantity >= drug.stock) return prev; // Prevent exceeding stock
        return prev.map(item => 
          item.id === drug.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prev, { 
        ...drug, 
        quantity: 1, 
        prescription_verified: false 
      }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        // Don't go below 1, don't exceed available stock
        if (newQty < 1 || newQty > item.total_stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const togglePrescriptionVerified = (id: number) => {
    setCart(prev => prev.map(item => 
      item.id === id 
        ? { ...item, prescription_verified: !item.prescription_verified }
        : item
    ));
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!selectedPromotion) return 0;
    const promo = promotions.find(p => p.id.toString() === selectedPromotion);
    if (!promo) return 0;

    let applicableSubtotal = 0;
    // Calculate if it applies to specific categories or drugs
    cart.forEach(item => {
      // Simplification: In a real app we'd check `promotion_drugs` and `promotion_categories`.
      // Assuming promotion applies to all cart for this demo if active.
      applicableSubtotal += (item.price * item.quantity);
    });

    if (promo.discount_type === 'percentage') {
      return (applicableSubtotal * promo.discount_value) / 100;
    } else {
      return Math.min(promo.discount_value, applicableSubtotal); // don't discount below 0
    }
  }, [selectedPromotion, cart, promotions]);

  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Client-side prescription check
    const missingRx = cart.find(item => item.requires_prescription && !item.prescription_verified);
    if (missingRx) {
      setError(`Cannot complete sale: ${missingRx.name} requires a verified prescription.`);
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      
      const payload = {
        customer_id: selectedCustomer || null,
        promotion_id: selectedPromotion || null,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          drug_id: item.id,
          batch_id: item.batch_id, // If multiple batches, we'd pick here. Assume item has one or controller handles.
          quantity: item.quantity,
          unit_price: item.price,
          prescription_verified: item.prescription_verified
        }))
      };

      const res = await salesApi.create(payload);
      
      // Store complete sale data for receipt
      const saleDetails = {
        saleId: res.saleId,
        sell_no: res.sell_no,
        pharmacist_name: 'Pharmacist', // Normally comes from user context
        customer_name: customers.find(c => c.id.toString() === selectedCustomer)?.name || '',
        items: cart,
        subtotal,
        discount: discountAmount,
        total_amount: total,
        payment_method: paymentMethod,
        amount_paid: amountPaid ? Number(amountPaid) : total,
        change: amountPaid ? Math.max(0, Number(amountPaid) - total) : 0
      };

      setCompletedSale(saleDetails);
      setShowReceipt(true);
      
      // Clear cart
      setCart([]);
      setSelectedCustomer('');
      setSelectedPromotion('');
      setAmountPaid('');
      
      // Refresh inventory
      fetchData();
      
    } catch (err: any) {
      setError(err.message || 'Failed to complete transaction.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full flex-col lg:flex-row overflow-hidden bg-base">
      
      {/* Receipt Modal */}
      <ReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        saleData={completedSale} 
        pharmacyInfo={{ name: 'Other Pharmacy', address: '456 Other St', phone: '+1 000 000 0000' }}
      />

      {/* Left Column: Drug Search */}
      <div className="flex-1 flex flex-col border-r border-subtle overflow-hidden">
        <div className="p-6 pb-4">
          <h1 className="text-2xl font-bold text-main mb-4">Point of Sale</h1>
          <div className="relative">
            <Search className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search medicines by name or generic name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-subtle-hover text-main rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {loading ? (
            <div className="text-center text-muted py-10">Loading catalog...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDrugs.map(drug => (
                <div 
                  key={drug.id} 
                  onClick={() => addToCart(drug)}
                  className="bg-surface border border-subtle p-4 rounded-2xl cursor-pointer hover:border-[#10b981]/50 hover:bg-hover transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-base rounded-lg text-[#10b981]">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-main">${Number(drug.price).toFixed(2)}</div>
                      <div className="text-xs text-muted">Available: {drug.total_stock}</div>
                    </div>
                  </div>
                  <div className="font-semibold text-main mb-1 group-hover:text-[#10b981] transition-colors line-clamp-1">{drug.name}</div>
                  <div className="text-xs text-muted line-clamp-1 mb-3">{drug.generic_name}</div>
                  {drug.requires_prescription && (
                    <span className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-1 rounded-full font-medium uppercase tracking-wider">
                      Rx Required
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Cart */}
      <div className="w-full lg:w-[450px] bg-surface flex flex-col overflow-hidden shadow-2xl z-10">
        <div className="p-6 border-b border-subtle flex justify-between items-center bg-base">
          <h2 className="text-xl font-bold text-main flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2 text-[#10b981]" />
            Current Sale
          </h2>
          <button 
            onClick={() => setCart([])}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Clear All
          </button>
        </div>

        {error && (
          <div className="m-6 mb-0 bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm flex items-start">
            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-muted py-10 flex flex-col items-center">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
              <p>Your cart is empty.</p>
              <p className="text-sm mt-1">Select items from the left to begin.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-base p-4 rounded-xl border border-subtle relative group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-main text-sm">{item.name}</div>
                    <div className="text-xs text-muted">${Number(item.price).toFixed(2)} each</div>
                  </div>
                  <div className="text-right font-bold text-main text-sm">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>

                {/* Prescription Checkbox */}
                {item.requires_prescription && (
                  <label className="flex items-center space-x-2 mb-3 bg-orange-500/5 p-2 rounded-lg cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={item.prescription_verified}
                      onChange={() => togglePrescriptionVerified(item.id)}
                      className="rounded border-orange-500/50 bg-base text-orange-500 focus:ring-orange-500/20"
                    />
                    <span className="text-xs font-medium text-orange-400 select-none">
                      Verify Physical Prescription
                    </span>
                  </label>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3 bg-surface rounded-lg p-1 border border-subtle">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:bg-hover hover:text-main transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium text-main">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:bg-hover hover:text-main transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Section */}
        <div className="p-6 bg-base border-t border-subtle">
          {/* Customer & Promo Selection */}
          <div className="space-y-3 mb-6">
            <div className="flex space-x-3">
              <div className="flex-1">
                <select 
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full bg-base border border-subtle-hover text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#10b981]"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <select 
                  value={selectedPromotion}
                  onChange={(e) => setSelectedPromotion(e.target.value)}
                  className="w-full bg-base border border-subtle-hover text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#10b981]"
                >
                  <option value="">No Promotion</option>
                  {promotions.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (-{p.discount_type === 'percentage' ? `${p.discount_value}%` : `$${p.discount_value}`})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-all ${
                  paymentMethod === 'cash' 
                    ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]' 
                    : 'bg-base border-subtle-hover text-muted hover:bg-hover'
                }`}
              >
                Cash
              </button>
              <button 
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-all ${
                  paymentMethod === 'card' 
                    ? 'bg-[#3b82f6]/10 border-[#3b82f6] text-[#3b82f6]' 
                    : 'bg-base border-subtle-hover text-muted hover:bg-hover'
                }`}
              >
                Card
              </button>
            </div>
            
            {paymentMethod === 'cash' && cart.length > 0 && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                <input 
                  type="number"
                  placeholder="Amount Paid"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-base border border-subtle-hover text-main rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-[#10b981]"
                />
              </div>
            )}
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-[#10b981]">
                <span>Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-bold text-main pt-2 border-t border-subtle">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            
            {paymentMethod === 'cash' && amountPaid !== '' && Number(amountPaid) >= total && (
              <div className="flex justify-between text-sm text-yellow-400 pt-1">
                <span>Change Due</span>
                <span>${(Number(amountPaid) - total).toFixed(2)}</span>
              </div>
            )}
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing || (paymentMethod === 'cash' && amountPaid !== '' && Number(amountPaid) < total)}
            className={`w-full py-4 rounded-xl font-bold text-main shadow-lg transition-all flex items-center justify-center gap-2 ${
              cart.length === 0 || isProcessing || (paymentMethod === 'cash' && amountPaid !== '' && Number(amountPaid) < total)
                ? 'bg-[#10b981]/50 cursor-not-allowed opacity-70'
                : 'bg-[#10b981] hover:bg-[#059669] hover:-translate-y-1 hover:shadow-[#10b981]/25'
            }`}
          >
            {isProcessing ? 'Processing...' : (
              <>
                <Check className="w-5 h-5" />
                Complete Sale
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
