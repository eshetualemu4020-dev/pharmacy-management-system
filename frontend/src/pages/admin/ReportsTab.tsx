import React, { useState } from 'react';
import { BarChart3, TrendingUp, PackageSearch, ShoppingBag, FileText, PackageOpen, Users, Calendar, Printer, Download } from 'lucide-react';
import DashboardReport from './reports/DashboardReport';
import SalesReport from './reports/SalesReport';
import InventoryReport from './reports/InventoryReport';
import OrdersReport from './reports/OrdersReport';
import PrescriptionsReport from './reports/PrescriptionsReport';
import ProductsReport from './reports/ProductsReport';
import CustomersReport from './reports/CustomersReport';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'sales', label: 'Sales', icon: TrendingUp },
  { id: 'inventory', label: 'Inventory', icon: PackageSearch },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
  { id: 'products', label: 'Products', icon: PackageOpen },
  { id: 'customers', label: 'Customers', icon: Users },
];

export default function ReportsTab() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('this-month');
  
  // Custom Date Range
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate = '';
    let endDate = '';

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (dateFilter) {
      case 'today':
        startDate = formatDate(today);
        endDate = formatDate(today);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = formatDate(yesterday);
        endDate = formatDate(yesterday);
        break;
      case 'this-week':
        const thisWeek = new Date(today);
        thisWeek.setDate(today.getDate() - today.getDay());
        startDate = formatDate(thisWeek);
        endDate = formatDate(new Date());
        break;
      case 'this-month':
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = formatDate(thisMonth);
        endDate = formatDate(new Date());
        break;
      case 'last-month':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = formatDate(lastMonthStart);
        endDate = formatDate(lastMonthEnd);
        break;
      case 'this-year':
        const thisYear = new Date(today.getFullYear(), 0, 1);
        startDate = formatDate(thisYear);
        endDate = formatDate(new Date());
        break;
      case 'custom':
        startDate = customStart;
        endDate = customEnd;
        break;
    }
    
    return { startDate, endDate };
  };

  const handlePrint = () => {
    window.print();
  };

  const dateRange = getDateRange();

  return (
    <div className="space-y-6">
      {/* Header & Global Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-main mb-2">Pharmacy Reports</h1>
          <p className="text-muted">Centralized view of pharmacy performance and operational data.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handlePrint} className="px-4 py-2 bg-hover hover:bg-white/10 text-white rounded-xl flex items-center space-x-2 transition-colors border border-subtle-hover">
            <Printer className="w-4 h-4" />
            <span>Print / Export</span>
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-subtle p-4 shadow-xl print:hidden flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2 text-muted">
          <Calendar className="w-5 h-5" />
          <span className="font-medium">Period:</span>
        </div>
        <select 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-base border border-subtle-hover rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0] appearance-none"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="this-week">This Week</option>
          <option value="this-month">This Month</option>
          <option value="last-month">Last Month</option>
          <option value="this-year">This Year</option>
          <option value="custom">Custom Date Range</option>
        </select>

        {dateFilter === 'custom' && (
          <div className="flex items-center space-x-2">
            <input 
              type="date" 
              value={customStart}
              max={customEnd || undefined}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-base border border-subtle-hover rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0]"
            />
            <span className="text-muted">to</span>
            <input 
              type="date" 
              value={customEnd}
              min={customStart || undefined}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-base border border-subtle-hover rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0]"
            />
          </div>
        )}
      </div>

      <div className="print:block hidden mb-6">
        <h1 className="text-2xl font-bold text-black mb-1">Pharmacy Management Report</h1>
        <p className="text-gray-600">Generated on: {new Date().toLocaleString()}</p>
        <p className="text-gray-600">
          Period: {dateRange.startDate ? `${dateRange.startDate} to ${dateRange.endDate || 'Present'}` : 'All Time'}
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-2 overflow-x-auto pb-2 print:hidden scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'bg-[#9b51e0] text-white shadow-lg shadow-[#9b51e0]/20' 
                : 'bg-hover text-muted hover:bg-white/10 hover:text-white'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && <DashboardReport dateRange={dateRange} />}
        {activeTab === 'sales' && <SalesReport dateRange={dateRange} />}
        {activeTab === 'inventory' && <InventoryReport dateRange={dateRange} />}
        {activeTab === 'orders' && <OrdersReport dateRange={dateRange} />}
        {activeTab === 'prescriptions' && <PrescriptionsReport dateRange={dateRange} />}
        {activeTab === 'products' && <ProductsReport dateRange={dateRange} />}
        {activeTab === 'customers' && <CustomersReport dateRange={dateRange} />}
      </div>
    </div>
  );
}
