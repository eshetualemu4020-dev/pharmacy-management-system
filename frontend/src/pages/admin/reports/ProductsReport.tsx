import { formatCurrency } from '../../../utils/currency';
import React, { useState, useEffect } from 'react';
import { reportApi } from '../../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PackageOpen, TrendingUp, TrendingDown } from 'lucide-react';

export default function ProductsReport({ dateRange }: { dateRange: { startDate: string, endDate: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await reportApi.getProductReport(dateRange);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  if (loading) return <div className="text-muted py-8 text-center">Loading products report...</div>;
  if (!data) return null;

  const { bestSelling, leastSelling, performance } = data;

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-base p-6 rounded-2xl border border-emerald-500/20">
          <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Top 5 Best-Selling Products
          </h3>
          <div className="space-y-4">
            {bestSelling.slice(0,5).map((p: any, i: number) => (
              <div key={i} className="flex justify-between items-center bg-surface p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    {i+1}
                  </div>
                  <div>
                    <p className="text-main font-bold">{p.name}</p>
                    <p className="text-xs text-muted">{p.category_name || 'Uncategorized'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">{p.total_sold_qty} sold</p>
                  <p className="text-xs text-main">{formatCurrency(p.total_revenue)}</p>
                </div>
              </div>
            ))}
            {bestSelling.length === 0 && <p className="text-muted">No sales data.</p>}
          </div>
        </div>

        <div className="bg-base p-6 rounded-2xl border border-red-500/20">
          <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" /> Least-Selling Products
          </h3>
          <div className="space-y-4">
            {leastSelling.slice(0,5).map((p: any, i: number) => (
              <div key={i} className="flex justify-between items-center bg-surface p-4 rounded-xl">
                <div>
                  <p className="text-main font-bold">{p.name}</p>
                  <p className="text-xs text-muted">{p.category_name || 'Uncategorized'}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold">{p.total_sold_qty} sold</p>
                  <p className="text-xs text-main">{formatCurrency(p.total_revenue)}</p>
                </div>
              </div>
            ))}
            {leastSelling.length === 0 && <p className="text-muted">No sales data.</p>}
          </div>
        </div>
      </div>

      <div className="bg-base p-6 rounded-2xl border border-subtle">
        <h3 className="text-lg font-bold text-main mb-6">Top 10 Products by Quantity</h3>
        <div className="h-80 w-full">
          {bestSelling.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bestSelling.slice(0,10)} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2746" horizontal={true} vertical={false}/>
                <XAxis type="number" stroke="#a09eb5" />
                <YAxis dataKey="name" type="category" stroke="#a09eb5" width={100} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#232136', borderColor: 'rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="total_sold_qty" name="Qty Sold" fill="#9b51e0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted">No sales data</div>
          )}
        </div>
      </div>

      <div className="bg-base p-6 rounded-2xl border border-subtle">
        <h3 className="text-lg font-bold text-main mb-4">Complete Product Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-subtle text-muted text-sm">
                <th className="pb-3 px-4">Product</th>
                <th className="pb-3 px-4">Category</th>
                <th className="pb-3 px-4 text-right">Total Sold (Qty)</th>
                <th className="pb-3 px-4 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {performance.slice(0,50).map((p: any, i: number) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 text-main">
                    <span className="font-bold">{p.name}</span>
                    <span className="block text-xs text-muted">{p.generic_name}</span>
                  </td>
                  <td className="py-3 px-4 text-main">{p.category_name || 'N/A'}</td>
                  <td className="py-3 px-4 text-right font-medium text-emerald-400">{p.total_sold_qty}</td>
                  <td className="py-3 px-4 text-right text-main">{formatCurrency(p.total_revenue)}</td>
                </tr>
              ))}
              {performance.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-muted">No data available.</td></tr>
              )}
            </tbody>
          </table>
          {performance.length > 50 && (
            <p className="text-center text-muted text-sm mt-4">Showing top 50 results.</p>
          )}
        </div>
      </div>

    </div>
  );
}
