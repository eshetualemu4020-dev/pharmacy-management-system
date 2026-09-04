import React, { useState, useEffect } from 'react';
import { 
  Activity, LayoutDashboard, Package, ShoppingCart, 
  ShoppingBag, FileText, Users, TrendingUp, BarChart, 
  User, LogOut, ChevronDown, ChevronRight, Pill, 
  Layers, AlertTriangle, Clock, CheckCircle, XCircle, History, Sun, Moon, Bell
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import PharmacistDrugsTab from './PharmacistDrugsTab';
import PharmacistDrugBatchesTab from './PharmacistDrugBatchesTab';
import PharmacistLowStockTab from './PharmacistLowStockTab';
import PharmacistExpiringSoonTab from './PharmacistExpiringSoonTab';
import PharmacistPOSTab from './PharmacistPOSTab';
import PharmacistOrdersTab from './PharmacistOrdersTab';
import PharmacistPrescriptionsTab from './PharmacistPrescriptionsTab';
import PharmacistCustomersTab from './PharmacistCustomersTab';
import PharmacistSalesHistoryTab from './PharmacistSalesHistoryTab';
import PharmacistReportsTab from './PharmacistReportsTab';
import PharmacistProfileTab from './PharmacistProfileTab';
import { dashboardApi } from '../../services/api';

export default function PharmacistDashboard() {
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isPrescriptionsOpen, setIsPrescriptionsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [navigationState, setNavigationState] = useState<any>(null);
  const { theme, toggleTheme } = useTheme();

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const [stats, setStats] = useState({ pendingPrescriptions: 0, lowStock: 0, recentVerified: [] });

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const data = await dashboardApi.getPharmacistStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  const handleNavigate = (tab: string, context?: any) => {
    setNavigationState(context || null);
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'drugs':
        return <PharmacistDrugsTab />;
      case 'batches':
        return <PharmacistDrugBatchesTab />;
      case 'low_stock':
        return <PharmacistLowStockTab />;
      case 'expiring':
        return <PharmacistExpiringSoonTab />;
      case 'pos':
        return <PharmacistPOSTab navigationContext={navigationState} />;
      case 'orders':
        return <PharmacistOrdersTab navigationContext={navigationState} />;
      case 'prescriptions':
        return <PharmacistPrescriptionsTab navigationContext={navigationState} />;
      case 'customers':
        return <PharmacistCustomersTab onNavigate={handleNavigate} />;
      case 'sales_history':
        return <PharmacistSalesHistoryTab />;
      case 'reports':
        return <PharmacistReportsTab />;
      case 'profile':
        return <PharmacistProfileTab />;
      default:
        return (
          <div className="flex-1 p-10 overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-bold text-main mb-2">Pharmacist Dashboard</h1>
                <p className="text-muted">Review prescriptions, manage drug interactions, and oversee dispensaries.</p>
              </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {/* Card 1 */}
              <div className="bg-surface rounded-2xl p-6 border border-subtle hover:border-[#10b981]/30 transition-colors cursor-pointer" onClick={() => setActiveTab('prescriptions')}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <span className="bg-[#10b981]/10 text-[#10b981] text-xs font-bold px-2.5 py-1 rounded-full">{stats.pendingPrescriptions} Pending</span>
                </div>
                <h3 className="text-xl font-bold mb-1 text-main">Verify Prescriptions</h3>
                <p className="text-muted text-sm">Review incoming orders for correct dosage and validity.</p>
              </div>

              {/* Card 2 */}
              <div className="bg-surface rounded-2xl p-6 border border-subtle hover:border-[#f59e0b]/30 transition-colors cursor-pointer" onClick={() => setActiveTab('low_stock')}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
                  </div>
                  <span className="bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-bold px-2.5 py-1 rounded-full">{stats.lowStock} Alerts</span>
                </div>
                <h3 className="text-xl font-bold mb-1 text-main">Inventory Alerts</h3>
                <p className="text-muted text-sm">
                  {stats.lowStock > 0 || (stats as any).expiring > 0 
                    ? `You have ${stats.lowStock} medicines running low on stock and ${(stats as any).expiring || 0} items expiring soon. Please review the inventory.`
                    : 'Monitor inventory that is running below minimum thresholds.'}
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-surface rounded-2xl p-6 border border-subtle hover:border-[#3b82f6]/30 transition-colors cursor-pointer" onClick={() => setActiveTab('drugs')}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-[#3b82f6]" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1 text-main">Dispensary Control</h3>
                <p className="text-muted text-sm">Manage scheduled medications and restricted inventory.</p>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-surface rounded-2xl p-6 border border-subtle mt-8">
              <h2 className="text-xl font-bold mb-6 flex items-center text-main">
                <CheckCircle className="w-5 h-5 mr-2 text-[#10b981]" />
                Recently Verified
              </h2>
              <div className="space-y-4">
                {stats.recentVerified && stats.recentVerified.length > 0 ? (
                  stats.recentVerified.map((item: any) => (
                    <div key={item.prescription_id} className="flex items-center justify-between p-4 bg-[#312e4b] rounded-xl border border-subtle">
                      <div>
                        <p className="font-medium text-main">{item.drug_names || 'Multiple Drugs'}</p>
                        <p className="text-xs text-muted mt-1">Patient: {item.customer_name} • Order #{item.order_id}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize ${item.status === 'approved' ? 'text-[#10b981] bg-[#10b981]/10' : 'text-red-400 bg-red-400/10'}`}>
                        {item.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-sm">No recently verified prescriptions found.</p>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-base flex font-sans">
      {/* Sidebar */}
      <div className="w-64 shrink-0 bg-surface border-r border-subtle flex flex-col p-6 h-full">
        <div className="flex items-center space-x-3 mb-12 shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-main" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-main tracking-wide leading-tight">PHARMACIST</h2>
            <h2 className="text-sm font-bold text-[#10b981] tracking-wide leading-tight">PORTAL</h2>
          </div>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'dashboard' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-muted hover:bg-hover hover:text-main'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          
          {/* Inventory Dropdown */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsInventoryOpen(!isInventoryOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-muted hover:bg-hover hover:text-main rounded-xl font-medium transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5" />
                <span>Inventory</span>
              </div>
              {isInventoryOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {isInventoryOpen && (
              <div className="pl-11 pr-2 space-y-1">
                <button 
                  onClick={() => setActiveTab('drugs')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === 'drugs' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
                  }`}
                >
                  <Pill className="w-4 h-4" />
                  <span>Drugs</span>
                </button>
                <button 
                  onClick={() => setActiveTab('batches')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === 'batches' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Drug Batches</span>
                </button>
                <button 
                  onClick={() => setActiveTab('low_stock')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === 'low_stock' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
                  <span>Low Stock</span>
                </button>
                <button 
                  onClick={() => setActiveTab('expiring')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === 'expiring' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4 text-[#f59e0b]" />
                  <span>Expiring Soon</span>
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => setActiveTab('pos')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'pos' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-muted hover:bg-hover hover:text-main'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Sales / POS</span>
          </button>

          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'orders' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-muted hover:bg-hover hover:text-main'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Orders</span>
          </button>

          {/* Prescriptions Dropdown */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsPrescriptionsOpen(!isPrescriptionsOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-muted hover:bg-hover hover:text-main rounded-xl font-medium transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5" />
                <span>Prescriptions</span>
              </div>
              {isPrescriptionsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {isPrescriptionsOpen && (
              <div className="pl-11 pr-2 space-y-1">
                <button 
                  onClick={() => setActiveTab('prescriptions')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === 'prescriptions' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4 text-[#f59e0b]" />
                  <span>All Prescriptions</span>
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'customers' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-muted hover:bg-hover hover:text-main'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Customers</span>
          </button>

          <button 
            onClick={() => setActiveTab('sales_history')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'sales_history' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-muted hover:bg-hover hover:text-main'
            }`}
          >
            <History className="w-5 h-5" />
            <span>Sales History</span>
          </button>

          <button 
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'reports' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-muted hover:bg-hover hover:text-main'
            }`}
          >
            <BarChart className="w-5 h-5" />
            <span>Reports</span>
          </button>

        </nav>
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
            <button className="relative p-2 bg-surface text-muted hover:text-main border border-subtle shadow-sm rounded-lg transition-all hover:bg-hover hover:scale-105">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.6)]"></span>
            </button>

            {/* Profile Avatar */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-8 h-8 rounded-lg bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white font-bold text-sm shadow-sm transition-all hover:scale-105 cursor-pointer ${activeTab === 'profile' ? 'ring-2 ring-white/50 shadow-[#10b981]/40' : 'shadow-[#10b981]/20'}`}
              title="My Profile"
            >
              {currentUser ? currentUser.name?.charAt(0).toUpperCase() || 'P' : 'P'}
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
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
