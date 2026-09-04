import React, { useState, useEffect } from 'react';
import { X, Building2, AlertCircle } from 'lucide-react';
import { supplierApi } from '../../../services/api';

interface SupplierFormModalProps {
  supplier?: any; // If provided, we are editing
  onClose: () => void;
  onSuccess: () => void;
}

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', "Côte d'Ivoire", 'Cabo Verde', 
  'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo (Congo-Brazzaville)', 
  'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czechia (Czech Republic)', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini (fmr. "Swaziland")', 'Ethiopia', 'Fiji', 'Finland', 
  'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 
  'Guinea-Bissau', 'Guyana', 'Haiti', 'Holy See', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 
  'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 
  'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar (formerly Burma)', 'Namibia', 
  'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 
  'Oman', 'Pakistan', 'Palau', 'Palestine State', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 
  'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 
  'Syria', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 
  'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe', 'Other'
];

const COUNTRY_CALLING_CODES = [
  { code: '+1', country: 'United States' },
  { code: '+1', country: 'Canada' },
  { code: '+44', country: 'United Kingdom' },
  { code: '+61', country: 'Australia' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+81', country: 'Japan' },
  { code: '+86', country: 'China' },
  { code: '+91', country: 'India' },
  { code: '+55', country: 'Brazil' },
  { code: '+27', country: 'South Africa' },
  { code: '+52', country: 'Mexico' },
  { code: '+34', country: 'Spain' },
  { code: '+39', country: 'Italy' },
  { code: '+31', country: 'Netherlands' },
  { code: '+46', country: 'Sweden' },
  { code: '+41', country: 'Switzerland' },
  { code: '+65', country: 'Singapore' },
  { code: '+64', country: 'New Zealand' },
  { code: '+971', country: 'United Arab Emirates' },
  { code: '+966', country: 'Saudi Arabia' },
  { code: '+20', country: 'Egypt' },
  { code: '+92', country: 'Pakistan' },
  { code: '+880', country: 'Bangladesh' },
  { code: '+62', country: 'Indonesia' },
  { code: '+60', country: 'Malaysia' },
  { code: '+66', country: 'Thailand' },
  { code: '+63', country: 'Philippines' },
  { code: '+82', country: 'South Korea' },
  { code: '+7', country: 'Russia' },
  { code: '+90', country: 'Turkey' },
  { code: '+98', country: 'Iran' },
  { code: '+234', country: 'Nigeria' },
  { code: '+254', country: 'Kenya' }
];

export default function SupplierFormModal({ supplier, onClose, onSuccess }: SupplierFormModalProps) {
  const isEdit = !!supplier;

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    status: 'active',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [phoneSuggestions, setPhoneSuggestions] = useState<{code: string, country: string}[]>([]);

  useEffect(() => {
    if (formData.phone.startsWith('+')) {
      const matchStr = formData.phone.split(/[\s-()]/)[0];
      if (matchStr.length > 1) {
         const matches = COUNTRY_CALLING_CODES.filter(c => c.code.startsWith(matchStr) || matchStr.startsWith(c.code));
         setPhoneSuggestions(matches);
      } else {
         setPhoneSuggestions([]);
      }
    } else {
      setPhoneSuggestions([]);
    }
  }, [formData.phone]);

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        city: supplier.city || '',
        country: supplier.country || '',
        status: supplier.status || 'active',
        notes: supplier.notes || ''
      });
    }
  }, [supplier]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const name = formData.name.trim();
    if (!name) newErrors.name = 'Company Name is required.';
    else if (name.length < 2) newErrors.name = 'Minimum 2 characters required.';
    else if (name.length > 150) newErrors.name = 'Maximum 150 characters allowed.';

    const phone = formData.phone.trim();
    if (!phone) newErrors.phone = 'Phone Number is required.';
    else if (!/^[\d\s\-()+]+$/.test(phone)) newErrors.phone = 'Invalid phone number format.';

    const contact = formData.contact_person.trim();
    if (contact && contact.length > 100) newErrors.contact_person = 'Maximum 100 characters allowed.';
    else if (contact && !/^[a-zA-Z\s\-'.]+$/.test(contact)) newErrors.contact_person = 'Contains invalid characters.';

    const email = formData.email.trim();
    if (email) {
      if (email.length > 150) newErrors.email = 'Maximum 150 characters allowed.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email address format.';
    }

    if (formData.address.trim().length > 250) newErrors.address = 'Maximum 250 characters allowed.';
    if (formData.city.trim().length > 100) newErrors.city = 'Maximum 100 characters allowed.';
    if (formData.notes.trim().length > 500) newErrors.notes = 'Maximum 500 characters allowed.';

    if (!['active', 'inactive'].includes(formData.status)) newErrors.status = 'Invalid status selected.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
    setApiError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    try {
      setSubmitting(true);
      if (isEdit) {
        await supplierApi.updateSupplier(supplier.id, formData);
      } else {
        await supplierApi.createSupplier(formData);
      }
      onSuccess();
    } catch (err: any) {
      setApiError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-surface rounded-2xl w-full max-w-3xl border border-subtle-hover shadow-2xl my-auto animate-fade-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-subtle bg-base/50 rounded-t-2xl shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#9b51e0]/10 flex items-center justify-center text-[#9b51e0]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-main">{isEdit ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <p className="text-muted text-sm">{isEdit ? `Update details for ${supplier.name}` : 'Register a new supplier to the system'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-full transition-colors" disabled={submitting}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {apiError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start text-red-400">
              <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{apiError}</p>
            </div>
          )}

          <form id="supplier-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Company Name (Full Width) */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-muted mb-1">Company Name <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => handleChange('name', e.target.value)} 
                  disabled={submitting}
                  className={`w-full bg-base border ${errors.name ? 'border-red-500' : 'border-subtle'} rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#9b51e0] transition-colors`}
                  placeholder="Enter official company name"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
              
              {/* Contact Person */}
              <div>
                <label className="block text-sm font-bold text-muted mb-1">Contact Person</label>
                <input 
                  type="text" 
                  value={formData.contact_person} 
                  onChange={e => handleChange('contact_person', e.target.value)} 
                  disabled={submitting}
                  className={`w-full bg-base border ${errors.contact_person ? 'border-red-500' : 'border-subtle'} rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#9b51e0] transition-colors`}
                  placeholder="Full name of representative"
                />
                {errors.contact_person && <p className="text-red-400 text-xs mt-1">{errors.contact_person}</p>}
              </div>
              
              {/* Phone Number */}
              <div className="relative">
                <label className="block text-sm font-bold text-muted mb-1">Phone Number <span className="text-red-400">*</span></label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => handleChange('phone', e.target.value)} 
                  disabled={submitting}
                  className={`w-full bg-base border ${errors.phone ? 'border-red-500' : 'border-subtle'} rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#9b51e0] transition-colors`}
                  placeholder="+1 (555) 000-0000"
                />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                
                {phoneSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-surface border border-subtle-hover rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    <div className="p-2 text-xs font-bold text-muted border-b border-subtle sticky top-0 bg-surface">Suggested Countries</div>
                    {phoneSuggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, country: sug.country }));
                          setPhoneSuggestions([]);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#9b51e0]/20 transition-colors flex justify-between items-center border-b border-subtle last:border-0"
                      >
                        <span>{sug.country}</span>
                        <span className="text-muted font-mono text-xs">{sug.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Email Address */}
              <div>
                <label className="block text-sm font-bold text-muted mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => handleChange('email', e.target.value)} 
                  disabled={submitting}
                  className={`w-full bg-base border ${errors.email ? 'border-red-500' : 'border-subtle'} rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#9b51e0] transition-colors`}
                  placeholder="contact@company.com"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>
              
              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-muted mb-1">Status <span className="text-red-400">*</span></label>
                <select 
                  value={formData.status} 
                  onChange={e => handleChange('status', e.target.value)} 
                  disabled={submitting}
                  className={`w-full bg-base border ${errors.status ? 'border-red-500' : 'border-subtle'} rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#9b51e0] appearance-none transition-colors`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {errors.status && <p className="text-red-400 text-xs mt-1">{errors.status}</p>}
              </div>

              {/* Street Address (Full Width) */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-muted mb-1">Street Address</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={e => handleChange('address', e.target.value)} 
                  disabled={submitting}
                  className={`w-full bg-base border ${errors.address ? 'border-red-500' : 'border-subtle'} rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#9b51e0] transition-colors`}
                  placeholder="123 Corporate Blvd, Suite 100"
                />
                {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-bold text-muted mb-1">City</label>
                <input 
                  type="text" 
                  value={formData.city} 
                  onChange={e => handleChange('city', e.target.value)} 
                  disabled={submitting}
                  className={`w-full bg-base border ${errors.city ? 'border-red-500' : 'border-subtle'} rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#9b51e0] transition-colors`}
                  placeholder="City Name"
                />
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-bold text-muted mb-1">Country</label>
                <select 
                  value={formData.country} 
                  onChange={e => handleChange('country', e.target.value)} 
                  disabled={submitting}
                  className="w-full bg-base border border-subtle rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#9b51e0] appearance-none transition-colors"
                >
                  <option value="">Select a country...</option>
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Notes (Full Width) */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-bold text-muted">Notes</label>
                  <span className={`text-xs ${formData.notes.length > 500 ? 'text-red-400 font-bold' : 'text-muted'}`}>
                    {formData.notes.length} / 500
                  </span>
                </div>
                <textarea 
                  rows={4} 
                  value={formData.notes} 
                  onChange={e => handleChange('notes', e.target.value)} 
                  disabled={submitting}
                  className={`w-full bg-base border ${errors.notes ? 'border-red-500' : 'border-subtle'} rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#9b51e0] transition-colors resize-none`}
                  placeholder="Internal notes about this supplier, terms of service, shipping preferences, etc."
                />
                {errors.notes && <p className="text-red-400 text-xs mt-1">{errors.notes}</p>}
              </div>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end items-center space-x-3 p-6 border-t border-subtle shrink-0 bg-base/50 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={submitting}
            className="px-5 py-2.5 text-muted hover:text-main hover:bg-hover rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            form="supplier-form"
            type="submit" 
            disabled={submitting}
            className="px-6 py-2.5 bg-[#9b51e0] hover:bg-[#8b45cd] text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-[#9b51e0]/20"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              isEdit ? 'Save Changes' : 'Create Supplier'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
