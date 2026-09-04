import React, { useState, useEffect } from 'react';
import { 
  Truck, Store, CreditCard, Banknote, ShieldCheck, AlertCircle, ArrowRight, Activity
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { customerOrderApi } from '../../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface CustomerCheckoutTabProps {
  contextData: any; // { cartData: { subtotal, discount, total, requiresPrescription }, promotionId }
  onNavigate: (tab: string, contextId?: any) => void;
  onUpdateCounts?: () => void;
}

const CheckoutForm = ({ 
  cartData, 
  promotionId, 
  deliveryMethod, 
  paymentMethod, 
  deliveryAddress, 
  deliveryInstructions, 
  onSuccess, 
  onError,
  setProcessing 
}: any) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    onError('');

    if (paymentMethod === 'Card' && (!stripe || !elements)) {
      onError('Stripe is not loaded yet.');
      setProcessing(false);
      return;
    }

    try {
      // 1. Create order on backend
      const checkoutData = {
        payment_method: paymentMethod,
        delivery_method: deliveryMethod,
        delivery_address: deliveryMethod === 'Delivery' ? deliveryAddress : '',
        delivery_instructions: deliveryMethod === 'Delivery' ? deliveryInstructions : '',
        promotion_id: promotionId
      };

      const orderResponse = await customerOrderApi.checkout(checkoutData);

      // 2. Process payment if card
      if (paymentMethod === 'Card' && orderResponse.clientSecret) {
        const cardElement = elements?.getElement(CardElement);
        if (!cardElement) throw new Error('Card element not found');

        const { error, paymentIntent } = await stripe!.confirmCardPayment(orderResponse.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              // Add billing details if needed
            }
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (paymentIntent.status === 'succeeded') {
          // Confirm payment on backend
          await customerOrderApi.confirmPayment(orderResponse.orderId, paymentIntent.id);
        }
      }

      onSuccess(orderResponse.orderId);
    } catch (err: any) {
      onError(err.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      {paymentMethod === 'Card' && (
        <div className="mb-6 bg-base border border-subtle rounded-xl p-4">
          <label className="block text-sm font-bold text-muted mb-4">Credit or Debit Card</label>
          <div className="p-3 bg-surface-alt border border-subtle-hover rounded-lg">
            <CardElement options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#8b8a9d', // Adapts somewhat to dark mode, but we rely on standard Stripe styling
                  '::placeholder': { color: '#6b697d' },
                },
                invalid: { color: '#f43f5e' },
              },
            }} />
          </div>
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={(!stripe && paymentMethod === 'Card')}
        className="w-full bg-[#6b4cff] hover:bg-[#5a3ee0] disabled:bg-[#6b4cff]/50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold flex items-center justify-center transition-colors"
      >
        Place Order
        <ArrowRight className="w-5 h-5 ml-2" />
      </button>
    </form>
  );
};

export const CustomerCheckoutTab: React.FC<CustomerCheckoutTabProps> = ({ contextData, onNavigate, onUpdateCounts }) => {
  const [deliveryMethod, setDeliveryMethod] = useState('Delivery');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const cartData = contextData?.validationResult || contextData?.cartData;
  const promotionId = contextData?.promotionId;

  useEffect(() => {
    if (!cartData) {
      onNavigate('cart');
    }
  }, [cartData, onNavigate]);

  if (!cartData) {
    return (
      <div className="flex items-center justify-center h-full bg-base">
        <Activity className="w-8 h-8 text-[#f43f5e] animate-spin" />
      </div>
    );
  }

  const subtotal = cartData.subtotal || 0;
  const discount = cartData.discount || 0;
  const deliveryFee = deliveryMethod === 'Delivery' ? 50 : 0;
  const total = subtotal - discount + deliveryFee;
  const requiresPrescription = cartData.requiresPrescription || false;

  const handleSuccess = (orderId: number) => {
    if (onUpdateCounts) onUpdateCounts();
    onNavigate('orders');
  };

  return (
    <div className="h-full bg-base p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-main">Checkout</h1>
          <p className="text-muted mt-1">Complete your order details below.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Details */}
          <div className="flex-1 space-y-6">
            
            {/* Delivery Method */}
            <div className="bg-surface-alt rounded-xl p-6 border border-subtle">
              <h2 className="text-xl font-bold text-main mb-6">Delivery Method</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${deliveryMethod === 'Delivery' ? 'border-[#6b4cff] bg-[#6b4cff]/10' : 'border-subtle hover:border-subtle-hover bg-base'}`}>
                  <input type="radio" name="delivery" value="Delivery" checked={deliveryMethod === 'Delivery'} onChange={() => setDeliveryMethod('Delivery')} className="sr-only" />
                  <Truck className={`w-6 h-6 mr-3 ${deliveryMethod === 'Delivery' ? 'text-[#6b4cff]' : 'text-muted'}`} />
                  <div>
                    <p className={`font-bold ${deliveryMethod === 'Delivery' ? 'text-main' : 'text-muted'}`}>Delivery</p>
                    <p className="text-sm text-muted">+50 ETB</p>
                  </div>
                </label>
                
                <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${deliveryMethod === 'Pickup' ? 'border-[#6b4cff] bg-[#6b4cff]/10' : 'border-subtle hover:border-subtle-hover bg-base'}`}>
                  <input type="radio" name="delivery" value="Pickup" checked={deliveryMethod === 'Pickup'} onChange={() => setDeliveryMethod('Pickup')} className="sr-only" />
                  <Store className={`w-6 h-6 mr-3 ${deliveryMethod === 'Pickup' ? 'text-[#6b4cff]' : 'text-muted'}`} />
                  <div>
                    <p className={`font-bold ${deliveryMethod === 'Pickup' ? 'text-main' : 'text-muted'}`}>Store Pickup</p>
                    <p className="text-sm text-muted">Free</p>
                  </div>
                </label>
              </div>

              {deliveryMethod === 'Delivery' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-muted mb-2">Delivery Address <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter full delivery address"
                      className="w-full bg-base border border-subtle-hover rounded-lg px-4 py-3 text-main placeholder:text-muted focus:outline-none focus:border-[#6b4cff]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-muted mb-2">Delivery Instructions (Optional)</label>
                    <textarea
                      rows={2}
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      placeholder="e.g. Call upon arrival, leave at door..."
                      className="w-full bg-base border border-subtle-hover rounded-lg px-4 py-3 text-main placeholder:text-muted focus:outline-none focus:border-[#6b4cff] resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-surface-alt rounded-xl p-6 border border-subtle">
              <h2 className="text-xl font-bold text-main mb-6">Payment Method</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'Card' ? 'border-[#6b4cff] bg-[#6b4cff]/10' : 'border-subtle hover:border-subtle-hover bg-base'}`}>
                  <input type="radio" name="payment" value="Card" checked={paymentMethod === 'Card'} onChange={() => setPaymentMethod('Card')} className="sr-only" />
                  <CreditCard className={`w-6 h-6 mr-3 ${paymentMethod === 'Card' ? 'text-[#6b4cff]' : 'text-muted'}`} />
                  <div>
                    <p className={`font-bold ${paymentMethod === 'Card' ? 'text-main' : 'text-muted'}`}>Pay Online</p>
                    <p className="text-sm text-muted">Credit or Debit Card</p>
                  </div>
                </label>
                
                <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'Cash' ? 'border-[#6b4cff] bg-[#6b4cff]/10' : 'border-subtle hover:border-subtle-hover bg-base'}`}>
                  <input type="radio" name="payment" value="Cash" checked={paymentMethod === 'Cash'} onChange={() => setPaymentMethod('Cash')} className="sr-only" />
                  <Banknote className={`w-6 h-6 mr-3 ${paymentMethod === 'Cash' ? 'text-[#6b4cff]' : 'text-muted'}`} />
                  <div>
                    <p className={`font-bold ${paymentMethod === 'Cash' ? 'text-main' : 'text-muted'}`}>Pay on {deliveryMethod}</p>
                    <p className="text-sm text-muted">Cash only</p>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-96 space-y-6">
            <div className="bg-surface-alt rounded-xl p-6 border border-subtle">
              <h2 className="text-xl font-bold text-main mb-6">Order Summary</h2>
              
              <div className="space-y-4 text-sm font-medium">
                <div className="flex justify-between text-muted">
                  <span>Items Subtotal</span>
                  <span>{subtotal.toFixed(2)} ETB</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-[#6b4cff]">
                    <span>Discount</span>
                    <span>-{discount.toFixed(2)} ETB</span>
                  </div>
                )}
                
                <div className="flex justify-between text-muted">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee.toFixed(2)} ETB</span>
                </div>

                <div className="pt-4 border-t border-subtle">
                  <div className="flex justify-between items-center">
                    <span className="text-main font-bold text-lg">Total</span>
                    <span className="text-main font-bold text-2xl">
                      {total.toFixed(2)} ETB
                    </span>
                  </div>
                </div>
              </div>

              {requiresPrescription && (
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start space-x-3">
                  <ShieldCheck className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold text-yellow-400">Prescription Required</p>
                    <p className="text-yellow-400/80 mt-1">You will be prompted to upload a valid prescription after placing this order.</p>
                  </div>
                </div>
              )}

              {processing ? (
                <div className="mt-6 flex justify-center py-4">
                  <Activity className="w-6 h-6 text-[#6b4cff] animate-spin" />
                </div>
              ) : (
                <Elements stripe={stripePromise}>
                  <CheckoutForm 
                    cartData={cartData}
                    promotionId={promotionId}
                    deliveryMethod={deliveryMethod}
                    paymentMethod={paymentMethod}
                    deliveryAddress={deliveryAddress}
                    deliveryInstructions={deliveryInstructions}
                    onSuccess={handleSuccess}
                    onError={setError}
                    setProcessing={setProcessing}
                  />
                </Elements>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
