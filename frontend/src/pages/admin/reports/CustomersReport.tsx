import { formatCurrency } from '../../../utils/currency';
import React, { useState, useEffect } from 'react';
import { reportApi } from '../../../services/api';
import { Users, UserPlus, UserCheck } from 'lucide-react';

export default function CustomersReport({ dateRange }: { dateRange: { startDate: string, endDate: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await reportApi.getCustomerReport(dateRange);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  if (loading) return <div className="text-muted py-8 text-center">Loading customers report...</div>;
  if (!data) return null;

  const { summary, top_customers } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-base p-6 rounded-2xl border border-subtle flex items-center justify-between">
          <div>
            <p className="text-muted text-sm mb-1">Total Customers</p>
            <p className="text-2xl font-bold text-main">{summary.total_customers}</p>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-base p-6 rounded-2xl border border-subtle flex items-center justify-between">
          <div>
            <p className="text-muted text-sm mb-1">New Customers</p>
            <p className="text-2xl font-bold text-emerald-400">{summary.new_customers}</p>
            <p className="text-xs text-muted mt-1">in selected period</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
            <UserPlus className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-base p-6 rounded-2xl border border-subtle flex items-center justify-between">
          <div>
            <p className="text-muted text-sm mb-1">Active Customers</p>
            <p className="text-2xl font-bold text-amber-400">{summary.active_customers}</p>
            <p className="text-xs text-muted mt-1">ordered in selected period</p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-base p-6 rounded-2xl border border-subtle">
        <h3 className="text-lg font-bold text-main mb-4">Top Customers (Lifetime Value)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-subtle text-muted text-sm">
                <th className="pb-3 px-4">Customer Name</th>
                <th className="pb-3 px-4">Email</th>
                <th className="pb-3 px-4 text-center">Total Orders</th>
                <th className="pb-3 px-4 text-right">Lifetime Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {top_customers.map((c: any, i: number) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 text-main font-bold">{c.name}</td>
                  <td className="py-3 px-4 text-muted">{c.email}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-hover px-2 py-1 rounded-lg text-main font-medium">{c.total_orders}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                    {formatCurrency(c.lifetime_value)}
                  </td>
                </tr>
              ))}
              {top_customers.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-muted">No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
