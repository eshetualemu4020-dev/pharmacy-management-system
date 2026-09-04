import React, { useState, useEffect } from 'react';
import {
  Home, Pill, Grid, ShoppingCart, ShoppingBag,
  FileText, Heart, Bell, User, HelpCircle, LogOut, Moon, Sun
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import CustomerHomeTab from './CustomerHomeTab';
import { CustomerBrowseDrugsTab } from './CustomerBrowseDrugsTab';
import { CustomerCategoriesTab } from './CustomerCategoriesTab';
import { CustomerProductDetailsTab } from './CustomerProductDetailsTab';
import { CustomerCartTab } from './CustomerCartTab';
import { CustomerCheckoutTab } from './CustomerCheckoutTab';
import CustomerOrdersTab from './CustomerOrdersTab';
import CustomerOrderDetailsTab from './CustomerOrderDetailsTab';
import CustomerPrescriptionsTab from './CustomerPrescriptionsTab';
import CustomerPrescriptionDetailsTab from './CustomerPrescriptionDetailsTab';
import CustomerPrescriptionUploadTab from './CustomerPrescriptionUploadTab';
import { CustomerWishlistTab } from './CustomerWishlistTab';
import CustomerNotificationsTab from './CustomerNotificationsTab';
import CustomerProfileTab from './CustomerProfileTab';
import { CustomerHelpSupportTab } from './CustomerHelpSupportTab';
import { cartApi, wishlistApi, notificationApi } from '../../services/api';

export default function CustomerDashboard() {
  const { theme, toggleTheme } = useTheme();
  
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const [activeTab, setActiveTab] = useState('home');
  const [contextId, setContextId] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    const updateCounts = async () => {
      try {
        const cartData = await cartApi.getCart();
        setCartCount(cartData.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0);
      } catch (err) {
        console.error('Failed to update cart count:', err);
      }
      
      try {
        const wishlist = await wishlistApi.getWishlist();
        setWishlistCount(wishlist.length || 0);
      } catch (err) {
        console.error('Failed to update wishlist count:', err);
      }

      try {
        const notifData = await notificationApi.getUnreadCount();
        setUnreadNotificationsCount(notifData.unread_count || 0);
      } catch (err) {
        console.error('Failed to update unread count:', err);
      }
    };
    
    updateCounts();
    // Expose updateCounts to be manually called
    window.addEventListener('storage', updateCounts);
    return () => window.removeEventListener('storage', updateCounts);
  }, []);

  const handleNavigate = (tab: string, id?: any) => {
    setActiveTab(tab);
    setContextId(id);
  };

  const renderTabContent = () => {
    // For manual updates from components without triggering storage event
    const handleUpdateCounts = async () => {
      try {
        const cartData = await cartApi.getCart();
        setCartCount(cartData.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0);
      } catch (err) {}
      try {
        const wishlist = await wishlistApi.getWishlist();
        setWishlistCount(wishlist.length || 0);
      } catch (err) {}
      try {
        const notifData = await notificationApi.getUnreadCount();
        setUnreadNotificationsCount(notifData.unread_count || 0);
      } catch (err) {}
    };

    switch (activeTab) {
      case 'home':
        return <CustomerHomeTab onNavigate={handleNavigate} />;
      case 'categories':
        return <CustomerCategoriesTab onNavigate={handleNavigate} />;
      case 'browse_drugs':
        return <CustomerBrowseDrugsTab onNavigate={handleNavigate} onUpdateCounts={handleUpdateCounts} initialCategory={contextId} />;
      case 'product_details':
        return <CustomerProductDetailsTab productId={contextId} onNavigate={handleNavigate} onUpdateCounts={handleUpdateCounts} />;
      case 'cart':
        return <CustomerCartTab onNavigate={handleNavigate} onUpdateCounts={handleUpdateCounts} />;
      case 'checkout':
        return <CustomerCheckoutTab contextData={contextId} onNavigate={handleNavigate} onUpdateCounts={handleUpdateCounts} />;
      case 'orders':
        return <CustomerOrdersTab onViewOrderDetails={(id) => handleNavigate('order_details', id)} />;
      case 'order_details':
        return <CustomerOrderDetailsTab orderId={contextId} onBack={() => handleNavigate('orders')} onGoToCart={() => handleNavigate('cart')} onGetHelp={(id) => handleNavigate('help', id)} />;
      case 'prescriptions':
        return <CustomerPrescriptionsTab onNavigate={handleNavigate} />;
      case 'prescription-details':
        return <CustomerPrescriptionDetailsTab prescriptionId={contextId} onNavigate={handleNavigate} />;
      case 'prescription-upload':
        return <CustomerPrescriptionUploadTab onNavigate={handleNavigate} />;
      case 'wishlist':
        return <CustomerWishlistTab onNavigate={handleNavigate} onUpdateCounts={handleUpdateCounts} />;
      case 'notifications':
        return (
          <CustomerNotificationsTab 
            onNavigateToOrder={(id) => handleNavigate('order_details', id)}
            onNavigateToPrescription={(id) => handleNavigate('prescription-details', id)}
            onUnreadCountChange={(count) => setUnreadNotificationsCount(count)}
          />
        );
      case 'profile':
        return <CustomerProfileTab />;
      case 'help':
        return <CustomerHelpSupportTab initialOrderId={contextId} />;
      // other cases can be added here as implemented
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold text-main mb-2">Coming Soon</h2>
            <p className="text-muted">This section is currently under construction.</p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-base text-main flex font-sans">
      {/* Sidebar */}
      <div className="w-64 shrink-0 bg-surface-alt border-r border-subtle flex flex-col p-6 h-full">
        <div className="flex items-center justify-between mb-12 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6b4cff] to-[#5839e0] rounded-xl flex items-center justify-center shadow-lg shadow-[#6b4cff]/20">
              <User className="w-5 h-5 text-main" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-main tracking-wide leading-tight">CUSTOMER</h2>
              <h2 className="text-sm font-bold text-[#6b4cff] tracking-wide leading-tight">PORTAL</h2>
            </div>
          </div>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
          <button 
            onClick={() => handleNavigate('home')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${activeTab === 'home' ? 'bg-[#6b4cff]/10 text-[#6b4cff]' : 'text-muted hover:bg-hover hover:text-white'}`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          <button 
            onClick={() => handleNavigate('browse_drugs')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${activeTab === 'browse_drugs' || activeTab === 'product_details' ? 'bg-[#6b4cff]/10 text-[#6b4cff]' : 'text-muted hover:bg-hover hover:text-white'}`}
          >
            <Pill className="w-5 h-5" />
            <span>Browse Drugs</span>
          </button>

          <button 
            onClick={() => handleNavigate('categories')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${activeTab === 'categories' ? 'bg-[#6b4cff]/10 text-[#6b4cff]' : 'text-muted hover:bg-hover hover:text-white'}`}
          >
            <Grid className="w-5 h-5" />
            <span>Categories</span>
          </button>

          <button 
            onClick={() => handleNavigate('cart')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium transition-colors ${activeTab === 'cart' ? 'bg-[#6b4cff]/10 text-[#6b4cff]' : 'text-muted hover:bg-hover hover:text-white'}`}
          >
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-5 h-5" />
              <span>Cart</span>
            </div>
            {cartCount > 0 && (
              <span className="bg-[#6b4cff] text-white text-xs font-bold px-2 py-0.5 rounded-full">{cartCount}</span>
            )}
          </button>

          <button 
            onClick={() => handleNavigate('orders')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${activeTab === 'orders' || activeTab === 'order_details' ? 'bg-[#6b4cff]/10 text-[#6b4cff]' : 'text-muted hover:bg-hover hover:text-white'}`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>My Orders</span>
          </button>

          <button 
            onClick={() => handleNavigate('prescriptions')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${activeTab === 'prescriptions' || activeTab === 'prescription-details' || activeTab === 'prescription-upload' ? 'bg-[#6b4cff]/10 text-[#6b4cff]' : 'text-muted hover:bg-hover hover:text-white'}`}
          >
            <FileText className="w-5 h-5" />
            <span>Prescriptions</span>
          </button>

          <button 
            onClick={() => handleNavigate('wishlist')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium transition-colors ${activeTab === 'wishlist' ? 'bg-[#6b4cff]/10 text-[#6b4cff]' : 'text-muted hover:bg-hover hover:text-white'}`}
          >
            <div className="flex items-center space-x-3">
              <Heart className="w-5 h-5" />
              <span>Wishlist</span>
            </div>
            {wishlistCount > 0 && (
              <span className="bg-[#6b4cff] text-white text-xs font-bold px-2 py-0.5 rounded-full">{wishlistCount}</span>
            )}
          </button>
        </nav>

        <div className="pt-6 border-t border-subtle space-y-2 shrink-0">
          <button 
            onClick={() => handleNavigate('help')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'help' ? 'bg-[#6b4cff]/10 text-[#6b4cff]' : 'text-muted hover:bg-hover hover:text-white'}`}
          >
            <HelpCircle className="w-5 h-5" />
            <span>Help & Support</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Global Top Header */}
        <div className="h-16 w-full flex justify-end items-center px-8 shrink-0 border-b border-subtle bg-surface-alt/50 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="relative p-2 bg-surface text-muted hover:text-main border border-subtle shadow-sm rounded-lg transition-all hover:bg-hover hover:scale-105"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Notification Bell */}
            <button 
              onClick={() => handleNavigate('notifications')}
              className="relative p-2 bg-surface text-muted hover:text-main border border-subtle shadow-sm rounded-lg transition-all hover:bg-hover hover:scale-105"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.6)]"></span>
              )}
            </button>

            {/* Profile Avatar */}
            <button
              onClick={() => handleNavigate('profile')}
              className={`w-8 h-8 rounded-lg bg-gradient-to-br from-[#6b4cff] to-[#5839e0] flex items-center justify-center text-white font-bold text-sm shadow-sm transition-all hover:scale-105 cursor-pointer ${activeTab === 'profile' ? 'ring-2 ring-white/50 shadow-[#6b4cff]/40' : 'shadow-[#6b4cff]/20'}`}
              title="My Profile"
            >
              {currentUser ? currentUser.name?.charAt(0).toUpperCase() || 'C' : 'C'}
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-white/10 mx-1"></div>

            {/* Log Out */}
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              title="Log Out"
              className="relative p-2 bg-surface text-muted hover:text-red-400 border border-subtle shadow-sm rounded-lg transition-all hover:bg-red-500/10 hover:border-red-500/20 hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
