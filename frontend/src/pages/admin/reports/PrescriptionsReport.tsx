import React, { useState, useEffect } from 'react';
import { reportApi } from '../../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PrescriptionsReport({ dateRange }: { dateRange: { startDate: string, endDate: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await reportApi.getPrescriptionReport(dateRange);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  if (loading) return <div className="text-muted py-8 text-center">Loading prescriptions report...</div>;
  if (!data) return null;

  const { summary, prescriptionsByDate, prescriptionsByUser } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-base p-4 rounded-2xl border border-subtle text-center">
          <p className="text-muted text-xs uppercase font-bold mb-1 tracking-wider">Total Rx</p>
          <p className="text-2xl font-bold text-main">{summary.total_prescriptions}</p>
        </div>
        <div className="bg-base p-4 rounded-2xl border border-amber-500/20 text-center">
          <p className="text-amber-400 text-xs uppercase font-bold mb-1 tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-amber-400">{summary.pending_prescriptions}</p>
        </div>
        <div className="bg-base p-4 rounded-2xl border border-emerald-500/20 text-center">
          <p className="text-emerald-400 text-xs uppercase font-bold mb-1 tracking-wider">Approved</p>
          <p className="text-2xl font-bold text-emerald-400">{summary.approved_prescriptions}</p>
        </div>
        <div className="bg-base p-4 rounded-2xl border border-red-500/20 text-center">
          <p className="text-red-400 text-xs uppercase font-bold mb-1 tracking-wider">Rejected</p>
          <p className="text-2xl font-bold text-red-400">{summary.rejected_prescriptions}</p>
        </div>
        <div className="bg-base p-4 rounded-2xl border border-subtle text-center">
          <p className="text-muted text-xs uppercase font-bold mb-1 tracking-wider">Approval Rate</p>
          <p className="text-2xl font-bold text-main">{summary.approval_rate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-base p-6 rounded-2xl border border-subtle">
          <h3 className="text-lg font-bold text-main mb-6">Prescription Volume</h3>
          <div className="h-64 w-full">
            {prescriptionsByDate.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prescriptionsByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2746" />
                  <XAxis dataKey="date" stroke="#a09eb5" />
                  <YAxis stroke="#a09eb5" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#232136', borderColor: 'rgba(255,255,255,0.1)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" name="Prescriptions" fill="#9b51e0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted">No data for this period</div>
            )}
          </div>
        </div>

        <div className="bg-base p-6 rounded-2xl border border-subtle">
          <h3 className="text-lg font-bold text-main mb-4">Reviews by Pharmacist</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-subtle text-muted text-sm">
                <th className="pb-3">Pharmacist</th>
                <th className="pb-3 text-right">Prescriptions Reviewed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {prescriptionsByUser.map((u: any, i: number) => (
                <tr key={i}>
                  <td className="py-3 text-main capitalize">{u.username || 'System'}</td>
                  <td className="py-3 text-main font-medium text-right">{u.count}</td>
                </tr>
              ))}
              {prescriptionsByUser.length === 0 && (
                <tr><td colSpan={2} className="py-4 text-center text-muted">No reviews recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
