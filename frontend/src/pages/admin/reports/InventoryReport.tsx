import { formatCurrency } from '../../../utils/currency';
import React, { useState, useEffect } from 'react';
import { reportApi } from '../../../services/api';
import { AlertTriangle, PackageSearch } from 'lucide-react';

export default function InventoryReport({ dateRange }: { dateRange: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'low', 'out', 'expired'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await reportApi.getInventoryReport();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  if (loading) return <div className="text-muted py-8 text-center">Loading inventory report...</div>;
  if (!data) return null;

  let filteredDetails = data.details;
  if (filter === 'low') {
    const lowStockThreshold = data.summary.lowStockThreshold || 10;
    filteredDetails = filteredDetails.filter((d: any) => d.qty > 0 && d.qty <= lowStockThreshold);
  } else if (filter === 'out') {
    filteredDetails = filteredDetails.filter((d: any) => d.qty === 0);
  } else if (filter === 'expired') {
    const today = new Date().getTime();
    filteredDetails = filteredDetails.filter((d: any) => new Date(d.exp_date).getTime() < today);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-base p-6 rounded-2xl border border-subtle">
          <p className="text-muted text-sm mb-1">Total Stock Quantity</p>
          <p className="text-2xl font-bold text-main">{data.summary.total_stock_quantity} units</p>
        </div>
        <div className="bg-base p-6 rounded-2xl border border-subtle">
          <p className="text-muted text-sm mb-1">Total Inventory Value</p>
          <p className="text-2xl font-bold text-main">{formatCurrency(data.summary.total_inventory_value)}</p>
        </div>
        <div className="bg-base p-6 rounded-2xl border border-subtle">
          <p className="text-muted text-sm mb-1">Available Stock Products</p>
          <p className="text-2xl font-bold text-emerald-400">{data.summary.available_stock_products}</p>
        </div>
        <div className="bg-base p-6 rounded-2xl border border-subtle">
          <p className="text-muted text-sm mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-400">{data.summary.out_of_stock_products}</p>
        </div>
      </div>

      <div className="bg-base p-6 rounded-2xl border border-subtle">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-main">Inventory Breakdown</h3>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-surface border border-subtle-hover rounded-xl px-4 py-2 text-main focus:outline-none focus:border-[#9b51e0]"
          >
            <option value="all">All Products</option>
            <option value="low">Low Stock (&le; {data.summary.lowStockThreshold || 10})</option>
            <option value="out">Out of Stock</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-subtle text-muted text-sm">
                <th className="pb-3 px-4">Product Name</th>
                <th className="pb-3 px-4">Batch ID</th>
                <th className="pb-3 px-4">Category</th>
                <th className="pb-3 px-4">Quantity</th>
                <th className="pb-3 px-4">Unit Price</th>
                <th className="pb-3 px-4">Stock Value</th>
                <th className="pb-3 px-4">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDetails.map((item: any, i: number) => {
                const lowStockThreshold = data.summary.lowStockThreshold || 10;
                const isLow = item.qty > 0 && item.qty <= lowStockThreshold;
                const isOut = item.qty === 0;
                const isExpired = new Date(item.exp_date).getTime() < new Date().getTime();
                
                return (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-main">
                      <div className="font-bold">{item.name}</div>
                      <div className="text-xs text-muted">{item.generic_name}</div>
                    </td>
                    <td className="py-3 px-4 text-muted text-sm">{item.batch_id}</td>
                    <td className="py-3 px-4 text-muted text-sm">{item.category_name || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold px-2 py-1 rounded-lg text-xs ${isOut ? 'bg-red-500/20 text-red-400' : isLow ? 'bg-amber-500/20 text-amber-400' : 'bg-hover text-white'}`}>
                        {item.qty}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-main">{formatCurrency(item.price)}</td>
                    <td className="py-3 px-4 text-main font-medium">${(item.qty * parseFloat(item.price)).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-sm ${isExpired ? 'text-red-400 font-bold' : 'text-muted'}`}>
                        {new Date(item.exp_date).toLocaleDateString()}
                        {isExpired && ' (Expired)'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredDetails.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-muted">No matching products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
