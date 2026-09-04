import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, Search, ChevronDown, ChevronUp, Phone, Mail, Clock, MapPin, 
  MessageSquare, FileText, CheckCircle2, AlertCircle, ArrowLeft, Send
} from 'lucide-react';
import { supportApi } from '../../services/api';

const FAQS = [
  {
    category: 'Orders',
    question: 'How do I place an order?',
    answer: 'Navigate to "Browse Drugs", add items to your cart, and proceed to checkout. You will need to select a delivery address and confirm your order.'
  },
  {
    category: 'Orders',
    question: 'How can I check my order status?',
    answer: 'Go to "My Orders" from the sidebar. You will see a list of all your past and current orders along with their real-time status.'
  },
  {
    category: 'Prescriptions',
    question: 'How do I upload a prescription?',
    answer: 'Go to "Prescriptions" and click "Upload Prescription". Provide the patient details, upload an image of the prescription, and our pharmacists will review it.'
  },
  {
    category: 'Prescriptions',
    question: 'What happens if my prescription is rejected?',
    answer: 'If rejected, you will receive a notification with the reason. You may need to upload a clearer image or consult your doctor for a valid prescription.'
  },
  {
    category: 'Payments',
    question: 'What payment methods are available?',
    answer: 'We accept credit cards, debit cards, and local mobile money services depending on your region.'
  },
  {
    category: 'General',
    question: 'How do I update my profile?',
    answer: 'Go to "Profile" from the sidebar to update your personal information, addresses, and notification preferences.'
  }
];

interface CustomerHelpSupportTabProps {
  initialOrderId?: number;
}

export const CustomerHelpSupportTab: React.FC<CustomerHelpSupportTabProps> = ({ initialOrderId }) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'report' | 'tickets'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Report Form state
  const [reportForm, setReportForm] = useState({
    issue_type: 'Order Problem',
    subject: '',
    description: '',
    order_id: initialOrderId ? initialOrderId.toString() : ''
  });
  const [submittingReport, setSubmittingReport] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (initialOrderId) {
      setActiveTab('report');
    }
  }, [initialOrderId]);

  useEffect(() => {
    if (activeTab === 'tickets') {
      loadTickets();
    }
  }, [activeTab]);

  const loadTickets = async () => {
    try {
      setLoadingTickets(true);
      const data = await supportApi.getTickets();
      setTickets(data);
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to load tickets.');
    } finally {
      setLoadingTickets(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      const payload = {
        ...reportForm,
        order_id: reportForm.order_id ? parseInt(reportForm.order_id) : undefined
      };
      await supportApi.createTicket(payload);
      showMessage('success', 'Your support request has been submitted successfully.');
      setReportForm({ issue_type: 'Order Problem', subject: '', description: '', order_id: '' });
      setActiveTab('tickets');
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to submit request.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleViewTicket = async (id: number) => {
    try {
      setLoadingTickets(true);
      const data = await supportApi.getTicketDetails(id);
      setTicketDetails(data);
      setSelectedTicket(id);
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to load ticket details.');
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    
    setSubmittingReply(true);
    try {
      await supportApi.replyToTicket(selectedTicket, { message: replyMessage });
      setReplyMessage('');
      // Reload ticket details
      const data = await supportApi.getTicketDetails(selectedTicket);
      setTicketDetails(data);
      loadTickets(); // update main list status if it changed
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to send reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredFaqs = FAQS.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'text-[#00e5ff] bg-[#00e5ff]/10 border-[#00e5ff]/30';
      case 'In Progress': return 'text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/30';
      case 'Resolved': return 'text-[#00e676] bg-[#00e676]/10 border-[#00e676]/30';
      case 'Closed': return 'text-muted bg-surface-alt border-subtle-hover';
      default: return 'text-white bg-white/10 border-white/20';
    }
  };

  // Ticket Details View
  if (selectedTicket && ticketDetails) {
    return (
      <div className="flex flex-col h-full bg-base text-muted">
        <div className="p-6 pb-4 border-b border-subtle bg-surface-alt flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedTicket(null)}
              className="p-2 hover:bg-hover rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-main flex items-center gap-3">
                Ticket SUP-{ticketDetails.ticket.id}
                <span className={`px-2 py-0.5 text-xs rounded-md border ${getStatusColor(ticketDetails.ticket.status)}`}>
                  {ticketDetails.ticket.status}
                </span>
              </h1>
              <p className="text-sm">{ticketDetails.ticket.subject}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Original Request */}
            <div className="bg-surface-alt rounded-2xl border border-subtle p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold px-2 py-1 bg-[#6b4cff]/20 text-[#6b4cff] rounded-lg">
                    {ticketDetails.ticket.issue_type}
                  </span>
                  {ticketDetails.ticket.order_id && (
                    <span className="text-xs font-bold px-2 py-1 bg-hover text-main rounded-lg ml-2 border border-subtle-hover">
                      Order: #{ticketDetails.ticket.order_id}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted">
                  {new Date(ticketDetails.ticket.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-main whitespace-pre-wrap">{ticketDetails.ticket.description}</p>
            </div>

            {/* Responses */}
            <div className="space-y-4">
              {ticketDetails.responses.map((resp: any) => (
                <div key={resp.id} className={`flex ${resp.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    resp.sender_type === 'customer' 
                      ? 'bg-[#6b4cff] text-white rounded-tr-sm' 
                      : 'bg-surface-alt text-main border border-subtle rounded-tl-sm'
                  }`}>
                    <p className="text-sm font-bold mb-1 opacity-70">
                      {resp.sender_type === 'customer' ? 'You' : 'Support Team'}
                    </p>
                    <p className="whitespace-pre-wrap">{resp.message}</p>
                    <p className={`text-[10px] mt-2 text-right ${resp.sender_type === 'customer' ? 'text-main/70' : 'text-muted'}`}>
                      {new Date(resp.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            {ticketDetails.ticket.status !== 'Closed' ? (
              <form onSubmit={handleReplySubmit} className="mt-8 bg-surface-alt rounded-2xl border border-subtle p-4 flex gap-4">
                <textarea
                  required
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  className="flex-1 bg-surface-alt border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#6b4cff] resize-none h-14 custom-scrollbar"
                />
                <button 
                  type="submit" 
                  disabled={submittingReply}
                  className="bg-[#6b4cff] text-white px-6 rounded-xl font-bold hover:bg-[#5a3ee0] transition-colors flex items-center justify-center min-w-[100px]"
                >
                  {submittingReply ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            ) : (
              <div className="text-center p-4 bg-surface-alt rounded-xl border border-subtle mt-8">
                <p>This ticket is closed and cannot receive further replies.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // Main View
  return (
    <div className="flex flex-col h-full bg-base text-muted">
      {/* Header section */}
      <div className="p-6 pb-2 border-b border-subtle bg-surface-alt">
        <h1 className="text-2xl font-bold text-main mb-2 flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-[#6b4cff]" /> Help & Support
        </h1>
        <p className="text-sm mb-4">Find answers or contact us if you need assistance.</p>

        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
          {[
            { id: 'faq', label: 'FAQ', icon: FileText },
            { id: 'report', label: 'Report a Problem', icon: AlertCircle },
            { id: 'tickets', label: 'My Tickets', icon: MessageSquare },
            { id: 'contact', label: 'Contact Us', icon: Phone }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#6b4cff] text-white'
                  : 'bg-surface-alt text-muted hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className="absolute top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold shadow-2xl ${
            message.type === 'success' ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-4xl mx-auto">
          
          {activeTab === 'faq' && (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  placeholder="Search frequently asked questions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-alt border border-subtle rounded-2xl pl-12 pr-4 py-4 text-main focus:outline-none focus:border-[#6b4cff] transition-colors"
                />
              </div>

              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12 bg-surface-alt rounded-2xl border border-subtle">
                  <p>No matching questions found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFaqs.map((faq, index) => (
                    <div key={index} className="bg-surface-alt rounded-2xl border border-subtle overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-hover transition-colors"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-[#6b4cff] uppercase tracking-wider mb-1 block">
                            {faq.category}
                          </span>
                          <h3 className="font-bold text-main">{faq.question}</h3>
                        </div>
                        {expandedFaq === index ? <ChevronUp className="w-5 h-5 text-[#6b4cff]" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expandedFaq === index && (
                        <div className="p-4 pt-0 border-t border-subtle">
                          <p className="text-muted leading-relaxed pt-3">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'report' && (
            <div className="bg-surface-alt rounded-2xl border border-subtle p-6">
              <h2 className="text-xl font-bold text-main mb-6">Report a Problem</h2>
              <form onSubmit={handleReportSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-main mb-2">Issue Type *</label>
                    <select
                      required
                      value={reportForm.issue_type}
                      onChange={e => setReportForm({...reportForm, issue_type: e.target.value})}
                      className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#6b4cff]"
                    >
                      <option value="Order Problem">Order Problem</option>
                      <option value="Prescription Problem">Prescription Problem</option>
                      <option value="Payment Problem">Payment Problem</option>
                      <option value="Account Problem">Account Problem</option>
                      <option value="Product Problem">Product Problem</option>
                      <option value="Delivery Problem">Delivery Problem</option>
                      <option value="Technical Problem">Technical Problem</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-main mb-2">Related Order ID (Optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1024"
                      value={reportForm.order_id}
                      onChange={e => setReportForm({...reportForm, order_id: e.target.value})}
                      className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#6b4cff]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-main mb-2">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief description of the issue"
                    value={reportForm.subject}
                    onChange={e => setReportForm({...reportForm, subject: e.target.value})}
                    className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#6b4cff]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-main mb-2">Description *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Please provide as much detail as possible..."
                    value={reportForm.description}
                    onChange={e => setReportForm({...reportForm, description: e.target.value})}
                    className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#6b4cff] resize-none custom-scrollbar"
                  />
                </div>

                <div className="pt-4 border-t border-subtle-hover flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="px-8 py-3 bg-[#6b4cff] text-white rounded-xl font-bold hover:bg-[#5a3ee0] transition-colors disabled:opacity-50 flex items-center justify-center min-w-[150px]"
                  >
                    {submittingReport ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-4">
              {loadingTickets ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-[#6b4cff]/30 border-t-[#6b4cff] rounded-full animate-spin"></div>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12 bg-surface-alt rounded-2xl border border-subtle">
                  <MessageSquare className="w-12 h-12 text-[#6b4cff]/30 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-main mb-2">No Support Requests</h3>
                  <p className="text-muted mb-6">Your submitted support requests will appear here.</p>
                  <button 
                    onClick={() => setActiveTab('report')}
                    className="px-6 py-2.5 bg-[#6b4cff] text-white rounded-xl font-bold hover:bg-[#5a3ee0] transition-colors"
                  >
                    Report a Problem
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {tickets.map(ticket => (
                    <button
                      key={ticket.id}
                      onClick={() => handleViewTicket(ticket.id)}
                      className="w-full text-left bg-surface-alt rounded-2xl border border-subtle p-4 md:p-5 hover:bg-hover transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-main text-lg">SUP-{ticket.id}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <h4 className="text-main font-medium">{ticket.subject}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted">
                          <span>{ticket.issue_type}</span>
                          <span>•</span>
                          <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-2 text-[#6b4cff] font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details <ArrowLeft className="w-4 h-4 rotate-180" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-surface-alt rounded-2xl border border-subtle p-8 text-center">
                <div className="w-16 h-16 bg-[#6b4cff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-[#6b4cff]" />
                </div>
                <h3 className="text-lg font-bold text-main mb-2">Phone Support</h3>
                <p className="text-2xl font-bold text-[#00e5ff] mb-2">+1 (800) PHARMACY</p>
                <p className="text-sm">Available Mon-Fri, 9AM - 6PM</p>
              </div>

              <div className="bg-surface-alt rounded-2xl border border-subtle p-8 text-center">
                <div className="w-16 h-16 bg-[#6b4cff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-[#6b4cff]" />
                </div>
                <h3 className="text-lg font-bold text-main mb-2">Email Support</h3>
                <p className="text-lg font-bold text-[#00e5ff] mb-2">support@pharmacy.com</p>
                <p className="text-sm">We aim to reply within 24 hours</p>
              </div>
              
              <div className="md:col-span-2 bg-surface-alt rounded-2xl border border-subtle p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-alt rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-muted" />
                </div>
                <div>
                  <h3 className="font-bold text-main">Main Office</h3>
                  <p className="text-sm">123 Health Avenue, Medical District, Cityville</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
