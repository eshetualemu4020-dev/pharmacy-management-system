import React, { useState } from 'react';
import { 
  Activity, LayoutDashboard, Package, ShoppingCart, 
  ShoppingBag, FileText, Users, TrendingUp, BarChart, 
  User, LogOut, ChevronDown, ChevronRight, Pill, 
  Layers, AlertTriangle, Clock, CheckCircle, XCircle 
} from 'lucide-react';
import PharmacistDrugsTab from './PharmacistDrugsTab';
import PharmacistDrugBatchesTab from './PharmacistDrugBatchesTab';
import PharmacistLowStockTab from './PharmacistLowStockTab';
import PharmacistExpiringSoonTab from './PharmacistExpiringSoonTab';
import PharmacistPOSTab from './PharmacistPOSTab';
import PharmacistOrdersTab from './PharmacistOrdersTab';

export default function PharmacistDashboard() {
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isPrescriptionsOpen, setIsPrescriptionsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

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
        return <PharmacistPOSTab />;
      case 'orders':
        return <PharmacistOrdersTab />;
      default:
        return (
          <div className="flex-1 p-10 overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Pharmacist Dashboard</h1>
                <p className="text-[#a09eb5]">Review prescriptions, manage drug interactions, and oversee dispensaries.</p>
              </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {/* Card 1 */}
              <div className="bg-[#232136] rounded-2xl p-6 border border-white/5 hover:border-[#10b981]/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <span className="bg-[#10b981]/10 text-[#10b981] text-xs font-bold px-2.5 py-1 rounded-full">12 Pending</span>
                </div>
                <h3 className="text-xl font-bold mb-1 text-white">Verify Prescriptions</h3>
                <p className="text-[#a09eb5] text-sm">Review incoming orders for correct dosage and validity.</p>
              </div>

              {/* Card 2 */}
              <div className="bg-[#232136] rounded-2xl p-6 border border-white/5 hover:border-[#f59e0b]/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1 text-white">Drug Interactions</h3>
                <p className="text-[#a09eb5] text-sm">Check for contraindications in patient medication history.</p>
              </div>

              {/* Card 3 */}
              <div className="bg-[#232136] rounded-2xl p-6 border border-white/5 hover:border-[#3b82f6]/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-[#3b82f6]" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1 text-white">Dispensary Control</h3>
                <p className="text-[#a09eb5] text-sm">Manage scheduled medications and restricted inventory.</p>
              </div>
            </div>

            {/* Recent Activity Section (Placeholder) */}
            <div className="bg-[#232136] rounded-2xl p-6 border border-white/5 mt-8">
              <h2 className="text-xl font-bold mb-6 flex items-center text-white">
                <CheckCircle className="w-5 h-5 mr-2 text-[#10b981]" />
                Recently Verified
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#312e4b] rounded-xl border border-white/5">
                  <div>
                    <p className="font-medium text-white">Amoxicillin 500mg</p>
                    <p className="text-xs text-[#a09eb5] mt-1">Patient: John Doe • Order #4829</p>
                  </div>
                  <span className="text-xs font-bold text-[#10b981] bg-[#10b981]/10 px-3 py-1.5 rounded-full">Approved</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#110f22] flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#232136] border-r border-white/5 flex flex-col p-6">
        <div className="flex items-center space-x-3 mb-12">
          <div className="w-10 h-10 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide leading-tight">PHARMACIST</h2>
            <h2 className="text-sm font-bold text-[#10b981] tracking-wide leading-tight">PORTAL</h2>
          </div>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'dashboard' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          
          {/* Inventory Dropdown */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsInventoryOpen(!isInventoryOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors"
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
                    activeTab === 'drugs' ? 'bg-white/10 text-white' : 'text-[#a09eb5] hover:text-white'
                  }`}
                >
                  <Pill className="w-4 h-4" />
                  <span>Drugs</span>
                </button>
                <button 
                  onClick={() => setActiveTab('batches')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === 'batches' ? 'bg-white/10 text-white' : 'text-[#a09eb5] hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Drug Batches</span>
                </button>
                <button 
                  onClick={() => setActiveTab('low_stock')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === 'low_stock' ? 'bg-white/10 text-white' : 'text-[#a09eb5] hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
                  <span>Low Stock</span>
                </button>
                <button 
                  onClick={() => setActiveTab('expiring')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === 'expiring' ? 'bg-white/10 text-white' : 'text-[#a09eb5] hover:text-white'
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
              activeTab === 'pos' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Sales / POS</span>
          </button>

          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'orders' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Orders</span>
          </button>

          {/* Prescriptions Dropdown */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsPrescriptionsOpen(!isPrescriptionsOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5" />
                <span>Prescriptions</span>
              </div>
              {isPrescriptionsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {isPrescriptionsOpen && (
              <div className="pl-11 pr-2 space-y-1">
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#a09eb5] hover:text-white rounded-lg transition-colors">
                  <Clock className="w-4 h-4 text-[#f59e0b]" />
                  <span>Pending</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#a09eb5] hover:text-white rounded-lg transition-colors">
                  <CheckCircle className="w-4 h-4 text-[#10b981]" />
                  <span>Approved</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#a09eb5] hover:text-white rounded-lg transition-colors">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>Rejected</span>
                </button>
              </div>
            )}
          </div>

          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <Users className="w-5 h-5" />
            <span>Customers</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <TrendingUp className="w-5 h-5" />
            <span>Sales History</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <BarChart className="w-5 h-5" />
            <span>Reports</span>
          </button>

        </nav>
        
        <div className="pt-6 border-t border-white/5 space-y-2">
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}
    </div>
  );
}
