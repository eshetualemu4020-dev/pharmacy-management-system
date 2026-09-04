import { formatCurrency } from '../../../utils/currency';
import React, { useState, useEffect } from 'react';
import { reportApi } from '../../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function SalesReport({ dateRange }: { dateRange: { startDate: string, endDate: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await reportApi.getSalesReport(dateRange);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  if (loading) return <div className="text-muted py-8 text-center">Loading sales report...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-base p-6 rounded-2xl border border-subtle">
          <p className="text-muted text-sm mb-1">Total In-Store Revenue</p>
          <p className="text-2xl font-bold text-main">{formatCurrency(data.summary.total_revenue)}</p>
        </div>
        <div className="bg-base p-6 rounded-2xl border border-subtle">
          <p className="text-muted text-sm mb-1">Number of Sales</p>
          <p className="text-2xl font-bold text-main">{data.summary.number_of_sales}</p>
        </div>
        <div className="bg-base p-6 rounded-2xl border border-subtle">
          <p className="text-muted text-sm mb-1">Average Sale Value</p>
          <p className="text-2xl font-bold text-main">{formatCurrency(data.summary.average_sale_value)}</p>
        </div>
        <div className="bg-base p-6 rounded-2xl border border-subtle">
          <p className="text-muted text-sm mb-1">Total Discounts Given</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(data.summary.total_discounts)}</p>
        </div>
      </div>

      <div className="bg-base p-6 rounded-2xl border border-subtle">
        <h3 className="text-lg font-bold text-main mb-6">Revenue Trend</h3>
        <div className="h-80 w-full">
          {data.salesByDate.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.salesByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2746" />
                <XAxis dataKey="date" stroke="#a09eb5" />
                <YAxis stroke="#a09eb5" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#232136', borderColor: 'rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#9b51e0" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted">No sales data for this period</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-base p-6 rounded-2xl border border-subtle">
          <h3 className="text-lg font-bold text-main mb-4">Sales by Category</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-subtle text-muted text-sm">
                <th className="pb-3">Category</th>
                <th className="pb-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.salesByCategory.map((c: any, i: number) => (
                <tr key={i}>
                  <td className="py-3 text-main">{c.category || 'Uncategorized'}</td>
                  <td className="py-3 text-main font-medium text-right">{formatCurrency(c.revenue)}</td>
                </tr>
              ))}
              {data.salesByCategory.length === 0 && (
                <tr><td colSpan={2} className="py-4 text-center text-muted">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-base p-6 rounded-2xl border border-subtle">
          <h3 className="text-lg font-bold text-main mb-4">Sales by Pharmacist</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-subtle text-muted text-sm">
                <th className="pb-3">Staff Member</th>
                <th className="pb-3 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.salesByUser.map((u: any, i: number) => (
                <tr key={i}>
                  <td className="py-3 text-main capitalize">{u.username}</td>
                  <td className="py-3 text-emerald-400 font-bold text-right">{formatCurrency(u.revenue)}</td>
                </tr>
              ))}
              {data.salesByUser.length === 0 && (
                <tr><td colSpan={2} className="py-4 text-center text-muted">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
