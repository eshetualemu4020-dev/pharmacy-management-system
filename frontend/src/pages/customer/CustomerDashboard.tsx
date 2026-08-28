import React from 'react';
import {
  Home, Pill, Grid, ShoppingCart, ShoppingBag,
  FileText, Heart, Bell, User, HelpCircle, LogOut
} from 'lucide-react';

export default function CustomerDashboard() {
  return (
    <div className="min-h-screen bg-[#110f22] flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#232136] border-r border-white/5 flex flex-col p-6">
        <div className="flex items-center space-x-3 mb-12">
          <div className="w-10 h-10 bg-gradient-to-br from-[#f43f5e] to-[#e11d48] rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide leading-tight">CUSTOMER</h2>
            <h2 className="text-sm font-bold text-[#f43f5e] tracking-wide leading-tight">PORTAL</h2>
          </div>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
          <button className="w-full flex items-center space-x-3 px-4 py-2.5 bg-[#f43f5e]/10 text-[#f43f5e] rounded-xl font-medium transition-colors">
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <Pill className="w-5 h-5" />
            <span>Browse Drugs</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <Grid className="w-5 h-5" />
            <span>Categories</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <ShoppingCart className="w-5 h-5" />
            <span>Cart</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <ShoppingBag className="w-5 h-5" />
            <span>My Orders</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <FileText className="w-5 h-5" />
            <span>Prescriptions</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <Heart className="w-5 h-5" />
            <span>Wishlist</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </button>
        </nav>

        <div className="pt-6 border-t border-white/5 space-y-2">
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-[#a09eb5] hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <HelpCircle className="w-5 h-5" />
            <span>Help & Support</span>
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
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
            <p className="text-[#a09eb5]">Find the medications you need, upload prescriptions, and track your orders.</p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">

          {/* Card 1 */}
          <div className="bg-[#232136] rounded-2xl p-6 border border-white/5 hover:border-[#f43f5e]/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#f43f5e]/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#f43f5e]" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-1 text-white">Active Orders</h3>
            <p className="text-[#a09eb5] text-sm">Track your recent purchases and delivery status.</p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#232136] rounded-2xl p-6 border border-white/5 hover:border-[#3b82f6]/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#3b82f6]" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-1 text-white">My Prescriptions</h3>
            <p className="text-[#a09eb5] text-sm">Upload new prescriptions and check approval status.</p>
          </div>

        </div>

      </div>
    </div>
  );
}
