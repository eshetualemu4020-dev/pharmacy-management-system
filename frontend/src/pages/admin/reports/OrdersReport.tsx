import { formatCurrency } from '../../../utils/currency';
import React, { useState, useEffect } from 'react';
import { reportApi } from '../../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, Clock, Package, XCircle } from 'lucide-react';

export default function OrdersReport({ dateRange }: { dateRange: { startDate: string, endDate: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await reportApi.getOrderReport(dateRange);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  if (loading) return <div className="text-[#a09eb5] py-8 text-center">Loading orders report...</div>;
  if (!data) return null;

  const { summary, ordersByDate } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#110f22] p-4 rounded-2xl border border-white/5 text-center">
          <p className="text-[#a09eb5] text-xs uppercase font-bold mb-1 tracking-wider">Total Orders</p>
          <p className="text-2xl font-bold text-white">{summary.total_orders}</p>
        </div>
        <div className="bg-[#110f22] p-4 rounded-2xl border border-white/5 text-center">
          <p className="text-[#a09eb5] text-xs uppercase font-bold mb-1 tracking-wider">Total Value</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(summary.total_order_value)}</p>
        </div>
        <div className="bg-[#110f22] p-4 rounded-2xl border border-amber-500/20 text-center">
          <p className="text-amber-400 text-xs uppercase font-bold mb-1 tracking-wider flex items-center justify-center gap-1"><Clock className="w-3 h-3"/> Pending</p>
          <p className="text-2xl font-bold text-amber-400">{summary.pending_orders}</p>
        </div>
        <div className="bg-[#110f22] p-4 rounded-2xl border border-blue-500/20 text-center">
          <p className="text-blue-400 text-xs uppercase font-bold mb-1 tracking-wider flex items-center justify-center gap-1"><Package className="w-3 h-3"/> Processing</p>
          <p className="text-2xl font-bold text-blue-400">{summary.processing_orders}</p>
        </div>
        <div className="bg-[#110f22] p-4 rounded-2xl border border-emerald-500/20 text-center">
          <p className="text-emerald-400 text-xs uppercase font-bold mb-1 tracking-wider flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3"/> Completed</p>
          <p className="text-2xl font-bold text-emerald-400">{summary.completed_orders}</p>
        </div>
        <div className="bg-[#110f22] p-4 rounded-2xl border border-red-500/20 text-center">
          <p className="text-red-400 text-xs uppercase font-bold mb-1 tracking-wider flex items-center justify-center gap-1"><XCircle className="w-3 h-3"/> Cancelled</p>
          <p className="text-2xl font-bold text-red-400">{summary.cancelled_orders}</p>
        </div>
      </div>

      <div className="bg-[#110f22] p-6 rounded-2xl border border-white/5">
        <h3 className="text-lg font-bold text-white mb-6">Order Volume Trend</h3>
        <div className="h-80 w-full">
          {ordersByDate.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ordersByDate}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2746" />
                <XAxis dataKey="date" stroke="#a09eb5" />
                <YAxis stroke="#a09eb5" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#232136', borderColor: 'rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="orders_count" name="Orders" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-[#a09eb5]">No orders for this period</div>
          )}
        </div>
      </div>
    </div>
  );
}
