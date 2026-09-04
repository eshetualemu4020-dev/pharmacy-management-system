import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, Download, FileUp, AlertCircle, ShoppingBag, Pill } from 'lucide-react';
import { customerPrescriptionApi } from '../../services/api';

interface CustomerPrescriptionDetailsTabProps {
  prescriptionId: string;
  onNavigate: (tab: string, id?: string) => void;
}

const CustomerPrescriptionDetailsTab: React.FC<CustomerPrescriptionDetailsTabProps> = ({ prescriptionId, onNavigate }) => {
  const [prescription, setPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptionDetails();
  }, [prescriptionId]);

  const fetchPrescriptionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerPrescriptionApi.getPrescriptionDetails(prescriptionId);
      setPrescription(data);
      
      // We can also securely fetch the document to preview it
      const url = customerPrescriptionApi.getPrescriptionFileUrl(prescriptionId);
      
      // Need to fetch it with auth headers to display it properly, 
      // or we can create an object URL if it's an image.
      // For now, let's try fetching the blob to create an object URL since it's a secure endpoint
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setDocumentUrl(objectUrl);
      }
      
    } catch (err: any) {
      setError(err.message || 'Unable to load prescription details.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'under_review':
        return (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium border border-yellow-500/30 flex items-center gap-1.5 w-fit">
            <Clock className="w-4 h-4" /> Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/30 flex items-center gap-1.5 w-fit">
            <CheckCircle className="w-4 h-4" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium border border-red-500/30 flex items-center gap-1.5 w-fit">
            <XCircle className="w-4 h-4" /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm font-medium border border-gray-500/30 w-fit">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6b4cff]"></div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="space-y-6 p-8">
        <button
          onClick={() => onNavigate('prescriptions')}
          className="flex items-center gap-2 text-gray-400 hover:text-main transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Prescriptions
        </button>
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error || 'Prescription not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('prescriptions')}
            className="p-2 hover:bg-hover text-gray-400 hover:text-main rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-main flex items-center gap-3">
              RX-{prescription.id.toString().padStart(5, '0')}
            </h2>
            <p className="text-gray-400 mt-1">Submitted on {formatDate(prescription.created_at)}</p>
          </div>
        </div>
        <div>
          {getStatusBadge(prescription.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Pharmacist Response */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Status Message Card */}
          <div className="bg-surface-alt rounded-xl border border-subtle p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-main mb-4">Review Status</h3>
            
            {prescription.status.toLowerCase() === 'pending' || prescription.status.toLowerCase() === 'under_review' ? (
              <div className="text-gray-300">
                <p>Your prescription is waiting for pharmacist review. We will notify you once it has been processed.</p>
              </div>
            ) : prescription.status.toLowerCase() === 'approved' ? (
              <div className="space-y-3">
                <p className="text-emerald-400 font-medium">Your prescription has been approved.</p>
                <p className="text-gray-400 text-sm">Your related order can continue through the pharmacy workflow.</p>
                {prescription.review_notes && (
                  <div className="mt-4 p-4 bg-black/20 rounded-lg border border-subtle">
                    <p className="text-sm text-gray-300"><span className="text-gray-500">Pharmacist Note:</span> {prescription.review_notes}</p>
                  </div>
                )}
                {prescription.updated_at !== prescription.created_at && (
                  <p className="text-xs text-gray-500 mt-4">Reviewed on {formatDate(prescription.updated_at)}</p>
                )}
              </div>
            ) : prescription.status.toLowerCase() === 'rejected' ? (
              <div className="space-y-3">
                <p className="text-red-400 font-medium">Your prescription was rejected.</p>
                <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-sm text-red-200"><span className="text-red-400 font-medium">Reason:</span> {prescription.review_notes || 'No reason provided.'}</p>
                </div>
                {/* Optional: Allow upload of replacement prescription for the same order */}
                <div className="mt-6">
                  <p className="text-sm text-gray-400 mb-3">You may upload a new prescription for this order.</p>
                  <button
                    onClick={() => onNavigate('prescription-upload')}
                    className="w-full bg-[#6b4cff] hover:bg-[#5839e0] text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                  >
                    <FileUp className="w-4 h-4" />
                    Upload Replacement
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Related Order Card */}
          <div className="bg-surface-alt rounded-xl border border-subtle p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-main">Related Order</h3>
              <button
                onClick={() => onNavigate('order-details', prescription.order_id.toString())}
                className="text-[#6b4cff] hover:text-[#8b73ff] text-sm font-medium hover:underline flex items-center gap-1"
              >
                View Order
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-subtle">
                <ShoppingBag className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-main font-medium">ORD-{prescription.order_id.toString().padStart(4, '0')}</p>
                  <p className="text-xs text-gray-500">Status: {prescription.order_status}</p>
                </div>
              </div>

              {prescription.ordered_drugs && prescription.ordered_drugs.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2 font-medium">Prescription Required Items:</p>
                  <ul className="space-y-2">
                    {prescription.ordered_drugs.map((drug: any) => (
                      <li key={drug.order_item_id} className="flex items-start gap-2 text-sm text-gray-300">
                        <Pill className="w-4 h-4 text-[#6b4cff] mt-0.5 flex-shrink-0" />
                        <span>
                          {drug.drug_name} <span className="text-gray-500">x{drug.quantity}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Document Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-surface-alt rounded-xl border border-subtle p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-main flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#6b4cff]" />
                Prescription Document
              </h3>
              {documentUrl && (
                <a
                  href={documentUrl}
                  download={`RX-${prescription.id.toString().padStart(5, '0')}`}
                  className="flex items-center gap-2 text-sm text-[#6b4cff] hover:text-[#8b73ff] transition-colors bg-[#6b4cff]/10 hover:bg-[#6b4cff]/20 px-3 py-1.5 rounded-lg font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
            </div>

            <div className="flex-1 min-h-[500px] bg-black/30 rounded-lg border border-subtle overflow-hidden relative">
              {documentUrl ? (
                // Try to render image or PDF
                documentUrl.endsWith('.pdf') || true ? ( // Object URLs don't have extensions, so we just use iframe which handles PDFs and images
                  <iframe 
                    src={documentUrl} 
                    className="w-full h-full border-0 absolute inset-0" 
                    title="Prescription Document"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <img 
                      src={documentUrl} 
                      alt="Prescription" 
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                  <FileText className="w-12 h-12 mb-3 opacity-50" />
                  <p>Loading document preview...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPrescriptionDetailsTab;
