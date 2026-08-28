import { formatCurrency } from '../../../utils/currency';
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, Truck, Package, XCircle, FileText, Download, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';
import { orderApi } from '../../../services/api';

interface OrderDetailsModalProps {
  orderId: number;
  onClose: () => void;
  onUpdate: () => void;
}

export default function OrderDetailsModal({ orderId, onClose, onUpdate }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await orderApi.getOrderById(orderId);
      setOrder(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      await orderApi.updateOrderStatus(orderId, { status: newStatus });
      await fetchOrderDetails();
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePayment = async (newPaymentStatus: string) => {
    try {
      setUpdating(true);
      await orderApi.updateOrderStatus(orderId, { payment_status: newPaymentStatus });
      await fetchOrderDetails();
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }
    try {
      setUpdating(true);
      await orderApi.cancelOrder(orderId, cancelReason);
      await fetchOrderDetails();
      onUpdate();
      setShowCancelPrompt(false);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#232136] p-8 rounded-2xl border border-white/5 shadow-2xl flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-[#9b51e0] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white font-medium">Loading details...</p>
      </div>
    </div>
  );

  if (error || !order) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#232136] p-8 rounded-2xl border border-white/5 shadow-2xl w-full max-w-md">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-[#a09eb5] mb-6">{error || 'Order not found'}</p>
          <button onClick={onClose} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Helper for UI progression
  const statusFlow = ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered', 'completed'];
  const currentStatusIndex = statusFlow.indexOf(order.status);
  
  const getNextStatusOptions = () => {
    if (order.status === 'cancelled') return [];
    if (currentStatusIndex === -1) return []; // Unknown status
    if (currentStatusIndex === statusFlow.length - 1) return []; // Already completed
    
    // Suggest the immediate next status, plus maybe skip options if appropriate
    const options = [statusFlow[currentStatusIndex + 1]];
    if (order.delivery_method === 'pickup' && order.status === 'processing') {
      options[0] = 'ready'; // Skip out_for_delivery for pickup
    }
    if (order.status === 'ready' && order.delivery_method === 'pickup') {
      options[0] = 'completed'; // Skip out_for_delivery & delivered for pickup
    }
    return options;
  };

  const nextOptions = getNextStatusOptions();
  const subtotal = order.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
  const totalDiscount = order.items.reduce((sum: number, item: any) => sum + parseFloat(item.discount || 0), 0);
  
  const hasPrescriptionBlock = order.items.some((i: any) => i.requires_prescription) && order.prescription_status !== 'approved';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-[#110f22] w-full max-w-4xl h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-white/5">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#232136]">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              Order ORD-{order.id.toString().padStart(4, '0')}
              <span className={`ml-4 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {order.status.replace('_', ' ')}
              </span>
            </h2>
            <p className="text-[#a09eb5] mt-1 text-sm flex items-center">
              <Clock className="w-4 h-4 mr-2" /> Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-[#a09eb5] hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Action Bar */}
          {!['completed', 'cancelled', 'delivered'].includes(order.status) && (
            <div className="bg-gradient-to-r from-[#232136] to-[#1e1c2e] p-6 rounded-2xl border border-white/5 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h3 className="text-white font-medium mb-1">Update Order Status</h3>
                <p className="text-[#a09eb5] text-sm">Advance this order through the fulfillment lifecycle.</p>
                {hasPrescriptionBlock && ['pending', 'confirmed'].includes(order.status) && (
                  <div className="flex items-center text-yellow-400 text-sm mt-2 font-medium bg-yellow-500/10 px-3 py-1.5 rounded-lg w-fit">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Cannot process: Waiting for Pharmacist prescription approval.
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {nextOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleUpdateStatus(opt)}
                    disabled={updating || (hasPrescriptionBlock && ['processing', 'ready', 'out_for_delivery', 'completed'].includes(opt))}
                    className="px-5 py-2.5 bg-[#9b51e0] hover:bg-[#8b45cd] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-[#9b51e0]/20 flex items-center capitalize"
                  >
                    Mark as {opt.replace('_', ' ')}
                  </button>
                ))}
                
                <button
                  onClick={() => setShowCancelPrompt(true)}
                  disabled={updating}
                  className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          )}

          {showCancelPrompt && (
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
              <h3 className="text-red-400 font-bold mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Cancel Order
              </h3>
              <p className="text-[#a09eb5] mb-4 text-sm">Are you sure you want to cancel this order? This action cannot be undone.</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (required)"
                className="w-full bg-[#110f22] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-400 mb-4"
                rows={3}
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowCancelPrompt(false)} className="px-4 py-2 text-white hover:bg-white/5 rounded-lg transition-colors">
                  Keep Order
                </button>
                <button onClick={handleCancelOrder} disabled={updating || !cancelReason.trim()} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50">
                  Confirm Cancellation
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="bg-[#232136] p-6 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-[#9b51e0]" /> Customer Information
              </h3>
              <div className="space-y-3">
                <div><span className="text-[#a09eb5] text-sm">Name:</span> <p className="text-white font-medium">{order.customer_name}</p></div>
                <div><span className="text-[#a09eb5] text-sm">Email:</span> <p className="text-white">{order.customer_email}</p></div>
                <div><span className="text-[#a09eb5] text-sm">Phone:</span> <p className="text-white">{order.customer_phone}</p></div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-[#232136] p-6 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-[#9b51e0]" /> {order.delivery_method === 'pickup' ? 'Pickup Details' : 'Delivery Details'}
              </h3>
              <div className="space-y-3">
                <div><span className="text-[#a09eb5] text-sm">Method:</span> <p className="text-white font-medium uppercase">{order.delivery_method}</p></div>
                {order.delivery_method === 'delivery' && (
                  <div><span className="text-[#a09eb5] text-sm">Address:</span> <p className="text-white">{order.delivery_address || 'No address provided'}</p></div>
                )}
                {order.notes && (
                  <div><span className="text-[#a09eb5] text-sm">Notes:</span> <p className="text-white italic">"{order.notes}"</p></div>
                )}
              </div>
            </div>
          </div>

          {/* Payment & Prescription */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#232136] p-6 rounded-2xl border border-white/5">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  Payment Information
                </h3>
                <select
                  value={order.payment_status}
                  onChange={(e) => handleUpdatePayment(e.target.value)}
                  disabled={updating || order.status === 'cancelled'}
                  className={`text-sm font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer border border-white/10 ${
                    order.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' :
                    order.payment_status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    order.payment_status === 'refunded' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-[#a09eb5]">Subtotal:</span> <span className="text-white font-medium">{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-[#a09eb5]">Discount:</span> <span className="text-green-400 font-medium">-{formatCurrency(totalDiscount)}</span></div>
                <div className="flex justify-between pt-2 border-t border-white/5">
                  <span className="text-[#a09eb5] font-bold">Total Amount:</span> 
                  <span className="text-white font-bold text-lg">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {order.prescription_id && (
              <div className="bg-[#232136] p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-[#9b51e0]" /> Prescription
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#a09eb5] text-sm">Status:</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium uppercase ${
                      order.prescription_status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      order.prescription_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {order.prescription_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#a09eb5] text-sm">Document:</span>
                    <a href={order.prescription_url} target="_blank" rel="noreferrer" className="block mt-1 text-[#9b51e0] hover:text-[#8b45cd] font-medium flex items-center transition-colors">
                      <Download className="w-4 h-4 mr-1" /> View Prescription
                    </a>
                  </div>
                  {order.prescription_notes && (
                    <div><span className="text-[#a09eb5] text-sm">Pharmacist Notes:</span> <p className="text-white text-sm bg-white/5 p-2 rounded-lg mt-1">{order.prescription_notes}</p></div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-[#232136] rounded-2xl border border-white/5 overflow-hidden">
            <h3 className="text-lg font-bold text-white p-6 border-b border-white/5">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider text-right">Unit Price</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider text-right">Quantity</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider text-right">Discount</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {order.items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{item.drug_name}</div>
                        <div className="text-xs text-[#a09eb5]">Batch: {item.batch_id}</div>
                        {item.requires_prescription ? <span className="text-xs text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">Rx Required</span> : null}
                      </td>
                      <td className="px-6 py-4 text-white text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="px-6 py-4 text-white font-medium text-right">{item.quantity}</td>
                      <td className="px-6 py-4 text-green-400 text-right">-{formatCurrency(item.discount || 0)}</td>
                      <td className="px-6 py-4 text-white font-bold text-right">{formatCurrency(((item.quantity * item.unit_price) - (item.discount || 0)))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order History */}
          <div className="bg-[#232136] rounded-2xl border border-white/5 overflow-hidden p-6">
            <h3 className="text-lg font-bold text-white mb-4">Order History</h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              {order.history.map((event: any, index: number) => (
                <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#110f22] text-[#a09eb5] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                    <CheckCircle2 className="w-5 h-5 text-[#9b51e0]" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/5 p-4 rounded-xl border border-white/5 shadow-lg">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-white uppercase text-sm">
                        {event.previous_status ? `${event.previous_status.replace('_', ' ')} → ` : ''}{event.new_status.replace('_', ' ')}
                      </div>
                      <time className="font-medium text-[#a09eb5] text-xs">{new Date(event.created_at).toLocaleString()}</time>
                    </div>
                    <div className="text-sm text-[#a09eb5]">
                      Changed by <span className="text-white">{event.user_name || 'System'}</span>
                    </div>
                    {event.reason && (
                      <div className="text-xs text-gray-400 mt-2 italic bg-black/20 p-2 rounded">
                        "{event.reason}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {order.history.length === 0 && (
                <div className="text-[#a09eb5] text-sm text-center">No history recorded yet.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
