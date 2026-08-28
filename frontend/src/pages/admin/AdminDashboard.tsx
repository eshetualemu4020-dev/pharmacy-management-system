import React, { useState, useEffect } from 'react';
import {
  Users, LayoutDashboard, Settings, Plus, Activity,
  Grid, Pill, Package, Truck, ShoppingCart,
  TrendingUp, ShoppingBag, FileText, Tag, BarChart, BarChart3, LogOut,
  Search, Filter, Edit, Eye, ShieldAlert, Key, CheckCircle, XCircle, Bell
} from 'lucide-react';
import { userApi } from '../../services/api';
import CategoriesTab from './CategoriesTab';
import DrugsTab from './DrugsTab';
import InventoryTab from './InventoryTab';
import SuppliersTab from './SuppliersTab';
import PurchaseOrdersTab from './PurchaseOrdersTab';
import SalesTab from './SalesTab';
import OrdersTab from './OrdersTab';
import PrescriptionsTab from './PrescriptionsTab';
import PromotionsTab from './PromotionsTab';
import ReportsTab from './ReportsTab';
import AuditLogsTab from './components/AuditLogsTab';
import SettingsTab from './components/SettingsTab';
import ProfileTab from './components/ProfileTab';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'categories' | 'drugs' | 'inventory' | 'suppliers' | 'purchase-orders' | 'sales' | 'orders' | 'prescriptions' | 'promotions' | 'reports' | 'audit-logs' | 'settings' | 'profile'>('dashboard');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Selected User
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '', email: '', phone: '', role: 'pharmacist', status: 'active', password: ''
  });

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await userApi.getUsers(params);
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Basic frontend search filter on already fetched data
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setFormData({ username: '', email: '', phone: '', role: 'pharmacist', status: 'active', password: '' });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: any) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status || 'active',
      password: ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditModalOpen && selectedUser) {
        await userApi.updateUser(selectedUser.id, formData);
        setIsEditModalOpen(false);
      } else {
        await userApi.createUser(formData);
        setIsAddModalOpen(false);
      }
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await userApi.updateStatus(user.id, newStatus);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.resetPassword(selectedUser.id, formData.password);
      setIsResetModalOpen(false);
      alert('Password reset successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#110f22] flex">
      {/* Sidebar */}
      <div className="w-64 shrink-0 bg-[#232136] border-r border-white/5 flex flex-col p-4 h-screen sticky top-0 overflow-y-auto custom-scrollbar">
        <div className="flex items-center space-x-3 mb-6 px-2">
          <div className="w-9 h-9 bg-gradient-to-br from-[#9b51e0] to-[#7a39b7] rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">RxAdmin</h2>
        </div>

        <nav className="space-y-0.5 flex-1 overflow-y-auto pr-2 pb-2 custom-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-[#9b51e0]/10 text-[#9b51e0]' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-[#9b51e0]/10 text-[#9b51e0]' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
          >
            <Users className="w-5 h-5" />
            <span>Users</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'categories' ? 'bg-[#9b51e0]/10 text-[#9b51e0]' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
          >
            <Grid className="w-5 h-5" />
            <span>Categories</span>
          </button>
          <button
            onClick={() => setActiveTab('drugs')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'drugs' ? 'bg-[#9b51e0] text-white shadow-lg shadow-[#9b51e0]/20' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
          >
            <Pill className="w-5 h-5" />
            <span>Drugs Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-[#9b51e0] text-white shadow-lg shadow-[#9b51e0]/20' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
          >
            <Package className="w-5 h-5" />
            <span>Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'suppliers' ? 'bg-[#9b51e0] text-white shadow-lg shadow-[#9b51e0]/20' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
          >
            <Truck className="w-5 h-5" />
            <span>Suppliers</span>
          </button>
          <button
            onClick={() => setActiveTab('purchase-orders')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'purchase-orders' ? 'bg-[#9b51e0] text-white shadow-lg shadow-[#9b51e0]/20' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Purchase Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'sales' ? 'bg-[#9b51e0] text-white shadow-lg shadow-[#9b51e0]/20' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Sales</span>
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'orders' ? 'bg-[#9b51e0] text-white shadow-lg shadow-[#9b51e0]/20' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Orders</span>
          </button>
          <button 
            onClick={() => setActiveTab('prescriptions')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'prescriptions' ? 'bg-[#9b51e0] text-white shadow-lg shadow-[#9b51e0]/20' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
          >
            <FileText className="w-5 h-5" />
            <span>Prescriptions</span>
          </button>
          <button 
            onClick={() => setActiveTab('promotions')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'promotions' ? 'bg-[#9b51e0] text-white shadow-lg shadow-[#9b51e0]/20' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
          >
            <Tag className="w-5 h-5" />
            <span>Promotions</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-[#9b51e0] text-white shadow-lg shadow-[#9b51e0]/20' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Reports & Analytics</span>
          </button>
          <button 
            onClick={() => setActiveTab('audit-logs')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'audit-logs' ? 'bg-[#9b51e0] text-white shadow-lg shadow-[#9b51e0]/20' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
          >
            <Activity className="w-5 h-5" />
            <span>Audit Logs</span>
          </button>
        </nav>

        <div className="pt-4 border-t border-white/5 space-y-1">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-[#9b51e0] text-white shadow-lg shadow-[#9b51e0]/20' : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#110f22]">
        
        {/* Global Top Header */}
        <div className="h-16 w-full flex justify-end items-center px-8 shrink-0 border-b border-white/5 bg-[#110f22]/50 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <button className="relative p-2 bg-[#232136] text-[#a09eb5] hover:text-white border border-white/5 shadow-sm rounded-lg transition-all hover:bg-white/5 hover:scale-105">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.6)]"></span>
            </button>
            
            {/* Profile Avatar */}
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-8 h-8 rounded-lg bg-gradient-to-br from-[#9b51e0] to-[#7a39b7] flex items-center justify-center text-white font-bold text-sm shadow-sm transition-all hover:scale-105 cursor-pointer ${activeTab === 'profile' ? 'ring-2 ring-white/50 shadow-[#9b51e0]/40' : 'shadow-[#9b51e0]/20'}`}
              title="My Profile"
            >
              {currentUser ? currentUser.username.charAt(0).toUpperCase() : 'A'}
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
              className="relative p-2 bg-[#232136] text-[#a09eb5] hover:text-red-400 border border-white/5 shadow-sm rounded-lg transition-all hover:bg-red-500/10 hover:border-red-500/20 hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto w-full relative">
          {activeTab === 'dashboard' && (
            <div className="p-10 w-full">
              <div className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
                <p className="text-[#a09eb5]">Welcome to the Pharmacy Management System admin panel.</p>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#232136] p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col justify-between cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setActiveTab('users')}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#a09eb5] font-medium">System Users</h3>
                <div className="w-10 h-10 rounded-xl bg-[#9b51e0]/10 flex items-center justify-center text-[#9b51e0]">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{users.length || '--'}</p>
              <p className="text-sm text-[#a09eb5] mt-2">Active accounts</p>
            </div>

            <div className="bg-[#232136] p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col justify-between cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setActiveTab('categories')}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#a09eb5] font-medium">Categories</h3>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Grid className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">Manage</p>
              <p className="text-sm text-[#a09eb5] mt-2">Drug classifications</p>
            </div>

            <div className="bg-[#232136] p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col justify-between cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setActiveTab('drugs')}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#a09eb5] font-medium">Drug Catalog</h3>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Pill className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">Manage</p>
              <p className="text-sm text-[#a09eb5] mt-2">Medication records</p>
            </div>

            <div className="bg-[#232136] p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col justify-between cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setActiveTab('inventory')}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#a09eb5] font-medium">Inventory</h3>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">Track</p>
              <p className="text-sm text-[#a09eb5] mt-2">Stock levels & batches</p>
            </div>
          </div>

          <div className="bg-[#232136] p-8 rounded-2xl border border-white/5 text-center">
            <div className="w-16 h-16 bg-[#9b51e0]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-[#9b51e0]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">System Running Smoothly</h2>
            <p className="text-[#a09eb5] max-w-md mx-auto">
              Select an option from the sidebar or click on the metric cards above to manage the pharmacy system.
            </p>
          </div>
        </div>
      )}

          {activeTab === 'users' && (<>
            <div className="p-10 w-full">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                  <p className="text-[#a09eb5]">Manage staff members, roles, and system access.</p>
                </div>
                <button
                  onClick={handleOpenAddModal}
              className="flex items-center px-5 py-2.5 bg-[#9b51e0] hover:bg-[#8b45cd] text-white rounded-xl font-bold transition-colors shadow-lg shadow-[#9b51e0]/20"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add User
            </button>
          </div>

          {/* Filters and Search */}
          <div className="bg-[#232136] p-4 rounded-2xl border border-white/5 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a09eb5]" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#110f22] border border-white/5 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-[#9b51e0] transition-colors"
              />
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#110f22] border border-white/5 text-[#a09eb5] px-4 py-2 rounded-xl focus:outline-none focus:border-[#9b51e0] appearance-none"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="inventory_staff">Inventory Staff</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#110f22] border border-white/5 text-[#a09eb5] px-4 py-2 rounded-xl focus:outline-none focus:border-[#9b51e0] appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-[#232136] rounded-2xl border border-white/5 overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-[#a09eb5]">Loading users...</div>
            ) : error ? (
              <div className="p-10 text-center text-red-400">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Joined Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9b51e0]/20 to-[#7a39b7]/20 flex items-center justify-center text-[#9b51e0] font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white font-medium">{user.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white">{user.email}</div>
                          <div className="text-xs text-[#a09eb5]">{user.phone || 'No phone'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                          ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                              user.role === 'pharmacist' ? 'bg-blue-500/10 text-blue-400' :
                                'bg-amber-500/10 text-amber-400'}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                          ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {user.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#a09eb5]">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => { setSelectedUser(user); setIsViewModalOpen(true); }} className="p-2 text-[#a09eb5] hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="View">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleOpenEditModal(user)} className="p-2 text-[#a09eb5] hover:text-[#9b51e0] hover:bg-[#9b51e0]/10 rounded-lg transition-colors" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedUser(user); setFormData({ ...formData, password: '' }); setIsResetModalOpen(true); }} className="p-2 text-[#a09eb5] hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors" title="Reset Password">
                              <Key className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleToggleStatus(user)} className={`p-2 rounded-lg transition-colors ${user.status === 'active' ? 'text-[#a09eb5] hover:text-red-400 hover:bg-red-400/10' : 'text-[#a09eb5] hover:text-emerald-400 hover:bg-emerald-400/10'}`} title={user.status === 'active' ? 'Deactivate' : 'Activate'}>
                              {user.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-[#a09eb5]">
                          No users found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add / Edit Modal */}
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#232136] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">{isEditModalOpen ? 'Edit User' : 'Add New User'}</h3>
              <form onSubmit={handleSaveUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#a09eb5] mb-1">Name / Username *</label>
                  <input required type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#a09eb5] mb-1">Email *</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#a09eb5] mb-1">Phone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#a09eb5] mb-1">Role *</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0] appearance-none">
                    <option value="pharmacist">Pharmacist</option>
                    <option value="inventory_staff">Inventory Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {!isEditModalOpen && (
                  <div>
                    <label className="block text-xs font-bold text-[#a09eb5] mb-1">Password *</label>
                    <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#9b51e0]" />
                  </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 text-[#a09eb5] hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-[#9b51e0] hover:bg-[#8b45cd] text-white rounded-xl font-bold transition-colors">Save User</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {isViewModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#232136] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">User Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#a09eb5]">Name</span>
                  <span className="text-white font-medium">{selectedUser.username}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#a09eb5]">Email</span>
                  <span className="text-white font-medium">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#a09eb5]">Phone</span>
                  <span className="text-white font-medium">{selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#a09eb5]">Role</span>
                  <span className="text-white font-medium capitalize">{selectedUser.role.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#a09eb5]">Status</span>
                  <span className={`font-medium capitalize ${selectedUser.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>{selectedUser.status || 'Active'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#a09eb5]">Joined</span>
                  <span className="text-white font-medium">{new Date(selectedUser.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-end pt-6">
                <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {isResetModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#232136] rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2">Reset Password</h3>
              <p className="text-sm text-[#a09eb5] mb-4">Enter a new password for <strong className="text-white">{selectedUser.username}</strong>.</p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#a09eb5] mb-1">New Password *</label>
                  <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-[#110f22] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setIsResetModalOpen(false)} className="px-4 py-2 text-[#a09eb5] hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors">Reset</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </>
      )}

          {activeTab === 'categories' && (
            <div className="p-10 w-full">
              <CategoriesTab />
            </div>
          )}

          {activeTab === 'drugs' && (
            <div className="p-10 w-full">
              <DrugsTab />
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="p-10 w-full">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">Inventory Management</h1>
                <p className="text-[#a09eb5]">Monitor drug stock levels, view active batches, and track adjustment history.</p>
              </div>
              <InventoryTab />
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="p-10 w-full">
              <SuppliersTab />
            </div>
          )}

          {activeTab === 'purchase-orders' && (
            <div className="p-10 w-full">
              <PurchaseOrdersTab />
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="p-10 w-full">
              <SalesTab />
            </div>
          )}

          {activeTab === 'orders' && (
            <OrdersTab />
          )}
          
          {activeTab === 'prescriptions' && (
            <PrescriptionsTab />
          )}

          {activeTab === 'promotions' && (
            <div className="p-10 w-full">
              <PromotionsTab />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="p-10 w-full print:p-0 print:overflow-visible">
              <ReportsTab />
            </div>
          )}

          {activeTab === 'audit-logs' && (
            <div className="p-10 w-full">
              <AuditLogsTab />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-10 w-full">
              <SettingsTab />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-10 w-full">
              <ProfileTab />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
