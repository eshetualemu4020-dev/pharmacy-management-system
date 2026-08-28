import React, { useState } from 'react';
import { 
  Package, LayoutDashboard, Grid, Truck, ShoppingCart, 
  Sliders, User, LogOut, ChevronDown, ChevronRight,
  Pill, Layers, AlertTriangle, Clock, XCircle
} from 'lucide-react';

export default function StaffDashboard() {
  const [isInventoryOpen, setIsInventoryOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#110f22] flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#232136] border-r border-white/5 flex flex-col p-6">
        <div className="flex items-center space-x-3 mb-12">
          <div className="w-10 h-10 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide leading-tight">INVENTORY</h2>
            <h2 className="text-sm font-bold text-[#3b82f6] tracking-wide leading-tight">STAFF</h2>
          </div>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
          <button className="w-full flex items-center space-x-3 px-4 py-2.5 bg-[#3b82f6]/10 text-[#3b82f6] rounded-xl font-medium transition-colors">
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
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#a09eb5] hover:text-white rounded-lg transition-colors">
                  <Pill className="w-4 h-4" />
                  <span>All Drugs</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#a09eb5] hover:text-white rounded-lg transition-colors">
                  <Layers className="w-4 h-4" />
                  <span>Drug Batches</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#a09eb5] hover:text-white rounded-lg transition-colors">
                  <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
                  <span>Low Stock</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#a09eb5] hover:text-white rounded-lg transition-colors">
                  <Clock className="w-4 h-4 text-[#f59e0b]" />
                  <span>Expiring Soon</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#a09eb5] hover:text-white rounded-lg transition-colors">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>Expired</span>
                </button>
              </div>
            )}
          </div>

          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <Grid className="w-5 h-5" />
            <span>Categories</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <Truck className="w-5 h-5" />
            <span>Suppliers</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <ShoppingCart className="w-5 h-5" />
            <span>Purchase Orders</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <Sliders className="w-5 h-5" />
            <span>Stock Adjustments</span>
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
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Inventory Dashboard</h1>
            <p className="text-[#a09eb5]">Monitor stock levels, drug batches, and expiring medications.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#232136] p-6 rounded-2xl border border-white/5">
            <p className="text-[#a09eb5] text-sm font-medium mb-1">Total Drugs</p>
            <p className="text-3xl font-bold text-white">458</p>
          </div>
          <div className="bg-[#232136] p-6 rounded-2xl border border-[#f59e0b]/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#f59e0b]/10 rounded-bl-full -mr-8 -mt-8"></div>
            <p className="text-[#a09eb5] text-sm font-medium mb-1">Low Stock Alerts</p>
            <p className="text-3xl font-bold text-[#f59e0b]">24</p>
          </div>
          <div className="bg-[#232136] p-6 rounded-2xl border border-red-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -mr-8 -mt-8"></div>
            <p className="text-[#a09eb5] text-sm font-medium mb-1">Expiring Soon</p>
            <p className="text-3xl font-bold text-red-400">12</p>
          </div>
        </div>
        
        {/* Placeholder for Quick Inventory Table */}
        <div className="bg-[#232136] rounded-2xl border border-white/5 p-6 h-64 flex items-center justify-center text-[#a09eb5]">
          Inventory Alerts / Data Table goes here...
        </div>
      </div>
    </div>
  );
}
