import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileUp, AlertCircle, CheckCircle, FileText, UploadCloud, X, ShoppingBag } from 'lucide-react';
import { customerPrescriptionApi } from '../../services/api';

interface CustomerPrescriptionUploadTabProps {
  onNavigate: (tab: string, id?: string) => void;
}

const CustomerPrescriptionUploadTab: React.FC<CustomerPrescriptionUploadTabProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEligibleOrders();
  }, []);

  const fetchEligibleOrders = async () => {
    try {
      setLoadingOrders(true);
      setError(null);
      const data = await customerPrescriptionApi.getEligibleOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load eligible orders.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please upload a JPG, PNG, or PDF file.');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      // Validate file size (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!selectedOrderId) {
      setError('Please select a related order.');
      return;
    }
    
    if (!file) {
      setError('Please upload a prescription document.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('order_id', selectedOrderId);
      formData.append('prescription', file);

      await customerPrescriptionApi.uploadPrescription(formData);
      
      setSuccess(true);
      setTimeout(() => {
        onNavigate('prescriptions');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Unable to submit prescription.');
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 p-8">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-main mb-2">Prescription Submitted</h2>
        <p className="text-gray-400 text-center max-w-md mb-8">
          Your prescription has been successfully uploaded and is now pending pharmacist review. 
          You will be redirected shortly...
        </p>
        <button
          onClick={() => onNavigate('prescriptions')}
          className="bg-[#6b4cff] hover:bg-[#5839e0] text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow-lg shadow-[#6b4cff]/20"
        >
          View Prescriptions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('prescriptions')}
          className="p-2 hover:bg-hover text-gray-400 hover:text-main rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-main flex items-center gap-3">
            <FileUp className="w-7 h-7 text-[#6b4cff]" />
            Upload Prescription
          </h2>
          <p className="text-gray-400 mt-1">Submit a prescription document for pharmacist review.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Step 1: Select Order */}
        <div className="bg-surface-alt rounded-xl border border-subtle p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-main mb-1">1. Select Related Order</h3>
          <p className="text-gray-400 text-sm mb-6">Choose the order that requires this prescription.</p>
          
          {loadingOrders ? (
            <div className="flex items-center gap-3 text-gray-400 py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#6b4cff]"></div>
              Loading eligible orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-hover border border-subtle-hover rounded-lg p-6 text-center">
              <ShoppingBag className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-300 font-medium">No eligible orders found</p>
              <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                You don't have any pending orders that require a prescription, or they already have prescriptions attached.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {orders.map((order) => (
                <label 
                  key={order.id} 
                  className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedOrderId === order.id.toString() 
                      ? 'bg-[#6b4cff]/10 border-[#6b4cff] shadow-sm' 
                      : 'bg-black/20 border-subtle hover:bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  <div className="mt-1 flex-shrink-0">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedOrderId === order.id.toString() ? 'border-[#6b4cff]' : 'border-gray-500'
                    }`}>
                      {selectedOrderId === order.id.toString() && (
                        <div className="w-3 h-3 rounded-full bg-[#6b4cff]" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-main">ORD-{order.id.toString().padStart(4, '0')}</span>
                      <span className="font-medium text-emerald-400">${Number(order.total_amount).toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-400">Placed on {formatDate(order.created_at)}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Upload File */}
        <div className="bg-surface-alt rounded-xl border border-subtle p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-main mb-1">2. Upload Document</h3>
          <p className="text-gray-400 text-sm mb-6">Upload a clear photo or PDF of your prescription.</p>
          
          <div className="space-y-4">
            {!file ? (
              <div 
                className="border-2 border-dashed border-subtle-hover rounded-xl p-10 text-center hover:bg-white/[0.02] hover:border-[#6b4cff]/50 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-hover rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8 text-[#6b4cff]" />
                </div>
                <p className="text-main font-medium mb-1">Click to browse or drag and drop</p>
                <p className="text-sm text-gray-500 mb-4">Supported formats: JPG, PNG, PDF (Max 5MB)</p>
                <button
                  type="button"
                  className="bg-white/10 text-white px-5 py-2 rounded-lg font-medium border border-subtle group-hover:border-subtle-hover transition-all"
                >
                  Select File
                </button>
              </div>
            ) : (
              <div className="bg-black/30 border border-subtle-hover rounded-xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-12 h-12 bg-[#6b4cff]/20 text-[#6b4cff] rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="truncate">
                    <p className="text-main font-medium truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                  title="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              className="hidden"
            />
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div className="text-sm text-blue-200/80">
                <p className="font-medium text-blue-300 mb-1">Important Privacy Notice</p>
                <p>Your prescription document will be stored securely and is only accessible to authorized pharmacy staff for review purposes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-4 border-t border-subtle">
          <button
            type="submit"
            disabled={!selectedOrderId || !file || isSubmitting}
            className="bg-[#6b4cff] hover:bg-[#5839e0] text-white px-8 py-3 rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#6b4cff]/20 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <FileUp className="w-5 h-5" />
                Submit Prescription
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerPrescriptionUploadTab;
