import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Package, Clock, CheckCircle, XCircle, 
  MapPin, CreditCard, FileText, AlertCircle, RefreshCw,
  Truck, ShoppingBag, ArrowRight
} from 'lucide-react';
import { customerOrderApi, cartApi, customerApi } from '../../services/api';

interface OrderItem {
  id: number;
  drug_name: string;
  generic_name?: string;
  dosage_form?: string;
  strength?: string;
  quantity: number;
  unit_price: string;
  requires_prescription: boolean;
  drug_id: number;
}

interface OrderHistory {
  id: number;
  previous_status: string;
  new_status: string;
  reason: string;
  created_at: string;
}

interface OrderDetails {
  id: number;
  status: string;
  total_amount: string;
  created_at: string;
  delivery_address: string;
  payment_status: string;
  payment_method: string;
  prescription_id: number | null;
  prescription_status: string | null;
  prescription_url: string | null;
  items: OrderItem[];
  history: OrderHistory[];
}

interface CustomerOrderDetailsTabProps {
  orderId: number;
  onBack: () => void;
  onGoToCart: () => void;
  onGetHelp: (orderId: number) => void;
}

const CustomerOrderDetailsTab: React.FC<CustomerOrderDetailsTabProps> = ({ orderId, onBack, onGoToCart, onGetHelp }) => {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerOrderApi.getOrderDetails(orderId);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    setCancelling(true);
    try {
      await customerOrderApi.cancelOrder(orderId, 'Cancelled by Customer');
      await fetchOrderDetails(); // Refresh details
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = async () => {
    if (!order) return;
    setReordering(true);
    try {
      for (const item of order.items) {
        try {
          await cartApi.addToCart({
            drug_id: item.drug_id,
            quantity: item.quantity
          });
        } catch (itemErr: any) {
          console.warn(`Failed to reorder ${item.drug_name}: ${itemErr.message}`);
        }
      }
      onGoToCart();
    } catch (err: any) {
      alert(err.message || 'Failed to reorder items');
    } finally {
      setReordering(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
      case 'pending_prescription':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'confirmed':
      case 'preparing':
      case 'ready':
      case 'shipped':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'delivered':
      case 'completed':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-hover text-muted border-subtle-hover';
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return '';
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-muted">
        <RefreshCw size={32} className="animate-spin text-[#f43f5e] mb-4" />
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="h-full bg-base flex flex-col justify-center items-center">
        <div className="flex flex-col justify-center items-center text-red-400 bg-surface-alt rounded-2xl border border-red-500/20 p-8 max-w-lg mx-auto">
          <AlertCircle size={48} className="mb-4 text-red-400/80" />
          <h3 className="text-xl font-bold mb-2">Order Not Found</h3>
          <p className="text-red-400/60 mb-6 text-center">{error || 'Could not load order details.'}</p>
          <button 
            onClick={onBack}
            className="px-6 py-3 bg-base text-main rounded-xl border border-subtle-hover hover:bg-hover transition-colors flex items-center font-bold"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const isCancellable = ['placed', 'pending_prescription'].includes(order.status);
  const timelineStages = ['placed', 'confirmed', 'preparing', 'shipped', 'delivered'];
  let currentStageIndex = timelineStages.indexOf(order.status);
  if (order.status === 'completed') currentStageIndex = timelineStages.length - 1; 

  return (
    <div className="h-full bg-base overflow-y-auto">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-3 text-muted bg-surface-alt hover:bg-white/10 border border-subtle rounded-xl transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-main flex items-center gap-3">
                Order #ORD-{order.id.toString().padStart(4, '0')}
              </h2>
              <p className="text-muted mt-1">
                Placed on {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-4 py-2 rounded-xl text-sm font-bold border ${getStatusColor(order.status)}`}>
            {formatStatus(order.status)}
          </span>
          <button
            onClick={() => onGetHelp(order.id)}
            className="px-6 py-2 text-sm font-bold text-white bg-surface-alt border border-subtle-hover rounded-xl hover:bg-white/10 transition-colors flex items-center"
          >
            <AlertCircle size={18} className="mr-2 text-muted" />
            Get Help
          </button>
          {isCancellable && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-6 py-2 text-sm font-bold text-white bg-red-500/20 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
          <button
            onClick={handleReorder}
            disabled={reordering}
            className="px-6 py-2 text-sm font-bold text-white bg-[#6b4cff] hover:bg-[#5a3ee0] rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center"
          >
            <ShoppingBag size={18} className="mr-2" />
            {reordering ? 'Adding to cart...' : 'Reorder Items'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Items & Timeline) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Timeline */}
          {order.status !== 'cancelled' && order.status !== 'rejected' && (
            <div className="bg-surface-alt p-8 rounded-2xl border border-subtle">
              <h3 className="text-xl font-bold text-main mb-8">Order Status</h3>
              <div className="relative">
                <div className="overflow-hidden h-2 mb-6 text-xs flex rounded-full bg-base">
                  <div style={{ width: `${(Math.max(currentStageIndex, 0) / (timelineStages.length - 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#6b4cff] transition-all duration-500"></div>
                </div>
                <div className="flex justify-between w-full">
                  {timelineStages.map((stage, idx) => (
                    <div key={stage} className={`flex flex-col items-center ${idx <= currentStageIndex ? 'text-[#6b4cff]' : 'text-muted/50'}`}>
                      <div className={`rounded-xl h-10 w-10 flex items-center justify-center border-2 mb-3 bg-base ${idx <= currentStageIndex ? 'border-[#6b4cff]' : 'border-subtle-hover'}`}>
                        {idx === 0 ? <Package size={16} /> : 
                         idx === 1 ? <CheckCircle size={16} /> :
                         idx === 2 ? <Clock size={16} /> :
                         idx === 3 ? <Truck size={16} /> : <CheckCircle size={16} />}
                      </div>
                      <span className={`text-xs font-bold hidden sm:block ${idx <= currentStageIndex ? 'text-main' : 'text-muted'}`}>{formatStatus(stage)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-surface-alt rounded-2xl border border-subtle overflow-hidden">
            <div className="p-6 bg-base/30 border-b border-subtle">
              <h3 className="text-xl font-bold text-main">Items Ordered</h3>
            </div>
            <div className="divide-y divide-white/5">
              {order.items.map((item) => (
                <div key={item.id} className="p-6 flex items-center justify-between hover:bg-hover transition-colors">
                  <div className="flex items-start gap-5">
                    <div className="h-16 w-16 bg-base rounded-xl flex items-center justify-center flex-shrink-0 border border-subtle">
                      <Package className="text-muted" size={28} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-main">{item.drug_name}</h4>
                      <p className="text-sm text-muted mb-2">
                        {item.dosage_form || 'N/A'} • {item.strength || 'N/A'}
                      </p>
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="text-muted bg-base px-3 py-1 rounded-lg border border-subtle">Qty: {item.quantity}</span>
                        <span className="text-muted bg-base px-3 py-1 rounded-lg border border-subtle">Price: ${Number(item.unit_price).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-main">
                      ${(item.quantity * Number(item.unit_price)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* History */}
          <div className="bg-surface-alt p-8 rounded-2xl border border-subtle">
            <h3 className="text-xl font-bold text-main mb-6">Order History</h3>
            <div className="space-y-4">
              {order.history.map((hist, idx) => (
                <div key={hist.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-[#6b4cff] mt-1.5 border-2 border-[#24223d] ring-2 ring-[#6b4cff]/30"></div>
                    {idx !== order.history.length - 1 && <div className="w-px h-full bg-white/10 mt-1.5"></div>}
                  </div>
                  <div className="pb-6">
                    <p className="text-base font-bold text-main">
                      Status changed to <span className="text-[#6b4cff]">{formatStatus(hist.new_status)}</span>
                    </p>
                    <p className="text-sm text-muted mt-1.5">
                      {new Date(hist.created_at).toLocaleString()} • {hist.reason || 'No details'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (Summary & Info) */}
        <div className="space-y-8">
          
          {/* Order Summary */}
          <div className="bg-surface-alt p-8 rounded-2xl border border-subtle">
            <h3 className="text-xl font-bold text-main mb-6">Order Summary</h3>
            <div className="space-y-4 text-sm font-medium">
              <div className="flex justify-between text-muted">
                <span>Subtotal ({order.items.reduce((acc, it) => acc + it.quantity, 0)} items)</span>
                <span>${Number(order.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Tax</span>
                <span>$0.00</span>
              </div>
              <div className="pt-6 border-t border-subtle flex justify-between items-center">
                <span className="font-bold text-main text-lg">Total</span>
                <span className="font-bold text-[#6b4cff] text-2xl">${Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Prescription Info */}
          {order.prescription_id && (
            <div className="bg-blue-500/10 p-6 rounded-2xl border border-blue-500/20">
              <h3 className="text-base font-bold text-blue-400 mb-3 flex items-center">
                <FileText size={18} className="mr-2" />
                Prescription Required
              </h3>
              <p className="text-sm text-blue-400/80 mb-4">
                This order contains items that require a prescription.
              </p>
              <div className="flex justify-between items-center bg-base/50 p-4 rounded-xl border border-blue-500/10 text-sm">
                <span className="text-muted font-bold">Status</span>
                <span className={`px-3 py-1 rounded-lg font-bold text-xs ${
                  order.prescription_status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  order.prescription_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {formatStatus(order.prescription_status || 'Pending')}
                </span>
              </div>
              <div className="flex justify-between items-center bg-base/50 p-4 rounded-xl border border-blue-500/10 text-sm mt-3">
                <span className="text-muted font-bold">Document</span>
                <button
                  onClick={() => customerApi.downloadMyPrescriptionFile(order.prescription_id!)}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg font-bold text-xs transition-colors"
                >
                  View File
                </button>
              </div>
              {order.prescription_notes && (
                <p className="text-sm text-blue-400 mt-3 bg-base/50 p-3 rounded-xl border border-blue-500/10 italic">
                  Note: {order.prescription_notes}
                </p>
              )}
            </div>
          )}

          {/* Delivery & Payment Info */}
          <div className="bg-surface-alt p-8 rounded-2xl border border-subtle space-y-8">
            <div>
              <h3 className="text-base font-bold text-main mb-4 flex items-center">
                <MapPin size={18} className="mr-2 text-[#6b4cff]" />
                Delivery Address
              </h3>
              <p className="text-sm font-medium text-muted whitespace-pre-line leading-relaxed pl-7 border-l-2 border-subtle">
                {order.delivery_address || 'No address provided'}
              </p>
            </div>
            
            <div className="pt-6 border-t border-subtle">
              <h3 className="text-base font-bold text-main mb-4 flex items-center">
                <CreditCard size={18} className="mr-2 text-[#6b4cff]" />
                Payment Information
              </h3>
              <div className="pl-7 border-l-2 border-subtle space-y-3 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-muted">Method:</span>
                  <span className="text-main">{formatStatus(order.payment_method || 'Online')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status:</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${order.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {formatStatus(order.payment_status || 'Pending')}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      </div>
    </div>
  );
};

export default CustomerOrderDetailsTab;
