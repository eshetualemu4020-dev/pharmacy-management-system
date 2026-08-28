import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: any;
  pharmacyInfo?: any;
}

export default function ReceiptModal({ isOpen, onClose, saleData, pharmacyInfo }: ReceiptModalProps) {
  if (!isOpen || !saleData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 print:bg-white print:p-0">
      <div className="bg-[#1a1825] print:bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden print:shadow-none print:w-[80mm] print:rounded-none">
        {/* Header - Hidden on print */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#232136] print:hidden">
          <div className="flex items-center space-x-2 text-[#10b981]">
            <CheckCircle className="w-5 h-5" />
            <h2 className="font-semibold text-white">Sale Completed</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-[#a09eb5] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 text-sm text-[#a09eb5] print:text-black print:p-4" id="receipt-content">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-white print:text-black mb-1">
              {pharmacyInfo?.name || 'Pharma POS'}
            </h1>
            <p className="text-xs">
              {pharmacyInfo?.address || '123 Pharmacy St, City'}
            </p>
            <p className="text-xs">
              Tel: {pharmacyInfo?.phone || '+1 234 567 8900'}
            </p>
          </div>

          <div className="border-t border-dashed border-white/20 print:border-black/20 my-4"></div>

          <div className="flex justify-between mb-1">
            <span>Sale No:</span>
            <span className="text-white print:text-black font-medium">{saleData.sell_no || saleData.saleId || 'N/A'}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Date:</span>
            <span className="text-white print:text-black">{new Date().toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Pharmacist:</span>
            <span className="text-white print:text-black">{saleData.pharmacist_name || 'Pharmacist'}</span>
          </div>
          {saleData.customer_name && (
            <div className="flex justify-between mb-1">
              <span>Customer:</span>
              <span className="text-white print:text-black">{saleData.customer_name}</span>
            </div>
          )}

          <div className="border-t border-dashed border-white/20 print:border-black/20 my-4"></div>

          <div className="mb-2 font-semibold text-white print:text-black">Items</div>
          <div className="space-y-3">
            {saleData.items?.map((item: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between text-white print:text-black">
                  <span>{item.name || item.drug_name}</span>
                  <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>{item.quantity} x ${(item.unit_price || 0).toFixed(2)}</span>
                  {item.prescription_verified && <span className="text-[#10b981] print:text-black">(Rx)</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-white/20 print:border-black/20 my-4"></div>

          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span className="text-white print:text-black">${(saleData.subtotal || 0).toFixed(2)}</span>
          </div>
          {saleData.discount > 0 && (
            <div className="flex justify-between mb-1 text-[#10b981] print:text-black">
              <span>Discount:</span>
              <span>-${saleData.discount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="border-t border-white/10 print:border-black/50 my-2"></div>
          
          <div className="flex justify-between text-lg font-bold text-white print:text-black mb-4">
            <span>Total:</span>
            <span>${(saleData.total_amount || 0).toFixed(2)}</span>
          </div>

          <div className="flex justify-between mb-1 text-xs">
            <span>Payment Method:</span>
            <span className="text-white print:text-black uppercase">{saleData.payment_method || 'CASH'}</span>
          </div>
          <div className="flex justify-between mb-1 text-xs">
            <span>Amount Paid:</span>
            <span className="text-white print:text-black">${(saleData.amount_paid || saleData.total_amount || 0).toFixed(2)}</span>
          </div>
          {saleData.change > 0 && (
            <div className="flex justify-between mb-1 text-xs">
              <span>Change:</span>
              <span className="text-white print:text-black">${saleData.change.toFixed(2)}</span>
            </div>
          )}

          <div className="text-center mt-8 text-xs">
            <p>Thank you for your visit!</p>
            <p>Please keep this receipt for your records.</p>
          </div>
        </div>

        {/* Footer actions - Hidden on print */}
        <div className="p-4 border-t border-white/5 bg-[#232136] flex gap-3 print:hidden">
          <button 
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 transition-colors"
          >
            New Sale
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 py-2 px-4 rounded-xl font-medium bg-[#10b981] text-white hover:bg-[#059669] transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
