import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  Package, 
  FileText, 
  CreditCard, 
  Tag, 
  User,
  Settings,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Filter
} from 'lucide-react';
import { notificationApi } from '../../services/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  related_id: number | null;
  is_read: boolean;
  created_at: string;
}

interface CustomerNotificationsTabProps {
  onNavigateToOrder?: (orderId: number) => void;
  onNavigateToPrescription?: (prescriptionId: number) => void;
  onUnreadCountChange?: (count: number) => void;
}

const CustomerNotificationsTab: React.FC<CustomerNotificationsTabProps> = ({
  onNavigateToOrder,
  onNavigateToPrescription,
  onUnreadCountChange
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [isReadFilter, setIsReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async (currentPage = 1) => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: 10 };
      if (filter !== 'All') params.type = filter;
      if (isReadFilter === 'unread') params.is_read = 'false';
      if (isReadFilter === 'read') params.is_read = 'true';

      const response = await notificationApi.getNotifications(params);
      setNotifications(response.data);
      setTotalPages(response.pagination.totalPages);
      updateUnreadCountBadge();
    } catch (error: any) {
      console.error(error.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const updateUnreadCountBadge = async () => {
    if (onUnreadCountChange) {
      try {
        const res = await notificationApi.getUnreadCount();
        onUnreadCountChange(res.unread_count);
      } catch (e) {
        console.error('Failed to update unread count badge');
      }
    }
  };

  useEffect(() => {
    fetchNotifications(page);
  }, [filter, isReadFilter, page]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      updateUnreadCountBadge();
    } catch (error: any) {
      console.error(error.message || 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      updateUnreadCountBadge();
      // Optional: success message state can be added if needed
    } catch (error: any) {
      console.error(error.message || 'Failed to mark all as read');
    }
  };

  const handleActionClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.related_id) {
      if (notification.type === 'ORDER' && onNavigateToOrder) {
        onNavigateToOrder(notification.related_id);
      } else if (notification.type === 'PRESCRIPTION' && onNavigateToPrescription) {
        onNavigateToPrescription(notification.related_id);
      }
    }
  };

  const getIcon = (type: string, isRead: boolean) => {
    const iconClass = isRead ? "text-muted/50" : "text-[#00e5ff]";
    switch (type) {
      case 'ORDER': return <Package className={`w-6 h-6 ${iconClass}`} />;
      case 'PRESCRIPTION': return <FileText className={`w-6 h-6 ${iconClass}`} />;
      case 'PAYMENT': return <CreditCard className={`w-6 h-6 ${iconClass}`} />;
      case 'PROMOTION': return <Tag className={`w-6 h-6 ${iconClass}`} />;
      case 'ACCOUNT': return <User className={`w-6 h-6 ${iconClass}`} />;
      case 'SYSTEM': return <Settings className={`w-6 h-6 ${iconClass}`} />;
      default: return <Bell className={`w-6 h-6 ${iconClass}`} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-base text-muted">
      {/* Header section */}
      <div className="p-6 pb-2 border-b border-subtle bg-surface-alt flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main mb-2">Notifications</h1>
          <p className="text-sm">Stay updated on your orders and prescriptions.</p>
        </div>
        
        <div className="flex items-center gap-3 mb-2 sm:mb-0">
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#6b4cff]/20 rounded-xl hover:bg-[#6b4cff]/40 transition-colors border border-[#6b4cff]/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark all read
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar">

      {/* Filters */}
      <div className="bg-surface-alt p-4 rounded-2xl border border-subtle flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
          {['All', 'ORDER', 'PRESCRIPTION', 'PROMOTION'].map((type) => (
            <button
              key={type}
              onClick={() => { setFilter(type); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filter === type
                  ? 'bg-[#6b4cff] text-white shadow-lg shadow-[#6b4cff]/20'
                  : 'bg-surface-alt text-muted hover:bg-[#6b4cff]/20 hover:text-white'
              }`}
            >
              {type === 'All' ? 'All Types' : type.charAt(0) + type.slice(1).toLowerCase() + 's'}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 bg-surface-alt p-1 rounded-xl w-full sm:w-auto border border-subtle">
          {['all', 'unread', 'read'].map((status) => (
            <button
              key={status}
              onClick={() => { setIsReadFilter(status as any); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors flex-1 sm:flex-none ${
                isReadFilter === status
                  ? 'bg-surface-alt text-main shadow-sm border border-subtle-hover'
                  : 'text-muted hover:text-main'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-surface-alt rounded-2xl border border-subtle overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#6b4cff]/30 border-t-[#6b4cff] rounded-full animate-spin"></div>
            <p className="text-muted mt-4">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-surface-alt p-5 rounded-2xl mb-4 border border-subtle">
              <Bell className="w-10 h-10 text-[#6b4cff]/50" />
            </div>
            <h3 className="text-xl font-bold text-main mb-2">No notifications found</h3>
            <p className="text-muted max-w-sm">
              You're all caught up! When you receive updates about your orders or prescriptions, they will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-5 transition-colors flex gap-4 hover:bg-surface-alt ${
                  !notification.is_read ? 'bg-[#6b4cff]/10 border-l-4 border-[#00e5ff]' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  <div className={`p-3 rounded-2xl ${!notification.is_read ? 'bg-[#6b4cff]/20 border border-[#6b4cff]/30' : 'bg-surface-alt border border-subtle'}`}>
                    {getIcon(notification.type, notification.is_read)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className={`text-base font-bold truncate ${!notification.is_read ? 'text-main' : 'text-muted'}`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5 text-muted/70" />
                      <span className="text-xs text-muted whitespace-nowrap">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-3 ${!notification.is_read ? 'text-muted brightness-125' : 'text-muted/80'}`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    {notification.related_id && (notification.type === 'ORDER' || notification.type === 'PRESCRIPTION') && (
                      <button
                        onClick={() => handleActionClick(notification)}
                        className="inline-flex items-center gap-1 text-sm font-bold text-[#00e5ff] hover:text-main transition-colors"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-main transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
                
                {!notification.is_read && (
                  <div className="flex-shrink-0 flex items-center">
                    <div className="w-2.5 h-2.5 bg-[#00e5ff] rounded-full shadow-[0_0_8px_rgba(0,229,255,0.5)]"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-subtle-hover rounded-xl text-sm font-bold text-main bg-surface-alt hover:bg-surface-alt hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-muted font-bold px-4">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-subtle-hover rounded-xl text-sm font-bold text-main bg-surface-alt hover:bg-surface-alt hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

export default CustomerNotificationsTab;
