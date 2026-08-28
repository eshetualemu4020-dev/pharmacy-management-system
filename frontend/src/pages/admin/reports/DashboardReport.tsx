import { formatCurrency } from '../../../utils/currency';
import React, { useState, useEffect } from 'react';
import { reportApi } from '../../../services/api';
import { 
  DollarSign, ShoppingCart, Package, AlertTriangle, 
  Clock, XOctagon, CheckCircle, FileText 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DashboardReport({ dateRange }: { dateRange: { startDate: string, endDate: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getDashboardSummary({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-[#a09eb5]">Loading dashboard metrics...</div>;
  if (error) return <div className="text-red-400 p-4 bg-red-500/10 rounded-xl">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-4">Executive Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#110f22] p-6 rounded-2xl border border-white/5">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><DollarSign className="w-5 h-5" /></div>
            <h3 className="text-[#a09eb5] font-medium">Total Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(data.total_revenue)}</p>
        </div>

        <div className="bg-[#110f22] p-6 rounded-2xl border border-white/5">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><ShoppingCart className="w-5 h-5" /></div>
            <h3 className="text-[#a09eb5] font-medium">Online Orders</h3>
          </div>
          <p className="text-3xl font-bold text-white">{data.total_orders}</p>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-emerald-400 flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> {data.completed_orders}</span>
            <span className="text-red-400 flex items-center"><XOctagon className="w-3 h-3 mr-1"/> {data.cancelled_orders}</span>
          </div>
        </div>

        <div className="bg-[#110f22] p-6 rounded-2xl border border-white/5">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400"><Package className="w-5 h-5" /></div>
            <h3 className="text-[#a09eb5] font-medium">In-Store Sales</h3>
          </div>
          <p className="text-3xl font-bold text-white">{data.total_sales}</p>
        </div>

        <div className="bg-[#110f22] p-6 rounded-2xl border border-white/5">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><FileText className="w-5 h-5" /></div>
            <h3 className="text-[#a09eb5] font-medium">Pending Rx</h3>
          </div>
          <p className="text-3xl font-bold text-white">{data.pending_prescriptions}</p>
        </div>
      </div>

      <div className="bg-[#110f22] p-6 rounded-2xl border border-white/5">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>Inventory Alerts</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#232136] rounded-xl border border-amber-500/20">
            <p className="text-[#a09eb5] text-sm mb-1">Low Stock Products</p>
            <p className="text-2xl font-bold text-amber-400">{data.low_stock_products}</p>
          </div>
          <div className="p-4 bg-[#232136] rounded-xl border border-orange-500/20">
            <p className="text-[#a09eb5] text-sm mb-1">Expiring Soon (90 Days)</p>
            <p className="text-2xl font-bold text-orange-400">{data.expiring_soon}</p>
          </div>
          <div className="p-4 bg-[#232136] rounded-xl border border-red-500/20">
            <p className="text-[#a09eb5] text-sm mb-1">Expired Products</p>
            <p className="text-2xl font-bold text-red-400">{data.expired_products}</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
