'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Percent, 
  Package, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Calendar, 
  ArrowRight,
  PieChart,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Download
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { ExpenseRecord } from '@/lib/types';

export default function AdvancedAnalyticsPage() {
  const [range, setRange] = useState<'today' | '7d' | '30d' | 'month' | 'year' | 'all'>('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'packaging' | 'courier_extra' | 'marketing' | 'software' | 'inventory' | 'other'>('packaging');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);

  const fetchAnalytics = (selectedRange = range) => {
    setLoading(true);
    fetch(`/api/analytics?range=${selectedRange}`)
      .then(r => r.json())
      .then(res => {
        setData(res);
      })
      .catch(err => console.error('Failed to load analytics:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;

    setAddingExpense(true);
    try {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: expenseTitle.trim(),
          amount: Number(expenseAmount),
          category: expenseCategory,
          date: expenseDate,
          notes: expenseNotes.trim()
        })
      });
      if (res.ok) {
        setIsExpenseModalOpen(false);
        setExpenseTitle('');
        setExpenseAmount('');
        setExpenseNotes('');
        fetchAnalytics(range);
      }
    } catch (err) {
      console.error('Failed to add expense:', err);
    } finally {
      setAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to remove this expense record?')) return;
    try {
      await fetch(`/api/analytics?id=${id}`, { method: 'DELETE' });
      fetchAnalytics(range);
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const kpis = data?.kpis || {
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    orderGrowth: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
    cogs: 0,
    recordedExpenses: 0,
    totalDiscounts: 0,
    avgOrderValue: 0,
    conversionRate: 0
  };

  const salesTrend = data?.salesTrend || [];
  const maxTrendRevenue = Math.max(...salesTrend.map((t: any) => t.revenue), 1000);
  const bestSellers = data?.bestSellers || [];
  const topCategories = data?.topCategories || [];
  const statusCounts = data?.statusCounts || {};
  const expenses: ExpenseRecord[] = data?.expenses || [];

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        
        {/* Header & Date Range Filter Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Advanced Analytics & Profit Engine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase tracking-wider">
                Live Intelligence
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Real-time revenue, COGS-backed profit calculation, conversion performance & operational audits
            </p>
          </div>

          {/* Time Range Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-x-auto text-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Time' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRange(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[11px] transition-all whitespace-nowrap ${
                  range === tab.id
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Total Revenue */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs uppercase font-bold tracking-wider">
              <span>Gross Sales Revenue</span>
              <span className="p-2 bg-neutral-800 rounded-lg text-white">৳</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ৳{kpis.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {kpis.revenueGrowth >= 0 ? (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{kpis.revenueGrowth}%
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {kpis.revenueGrowth}%
                </span>
              )}
              <span className="text-neutral-500 font-normal">vs previous period</span>
            </div>
          </div>

          {/* 2. Actual Net Profit */}
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/90 border border-emerald-900/40 rounded-2xl p-5 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-emerald-400 text-xs uppercase font-bold tracking-wider">
              <span>Actual Net Profit</span>
              <span className="p-2 bg-emerald-950 border border-emerald-800/60 rounded-lg text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              ৳{kpis.netProfit.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/80 rounded font-bold text-[10px]">
                {kpis.profitMargin}% Net Margin
              </span>
              <span className="text-neutral-400 text-[11px]">COGS & expenses deducted</span>
            </div>
          </div>

          {/* 3. Total Orders & Volume */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs uppercase font-bold tracking-wider">
              <span>Total Orders Placed</span>
              <span className="p-2 bg-neutral-800 rounded-lg text-white">
                <ShoppingBag className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {kpis.totalOrders}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="text-white font-bold">{kpis.completedOrders} active</span>
              <span>•</span>
              <span className="text-red-400">{kpis.cancelledOrders} cancelled</span>
            </div>
          </div>

          {/* 4. Average Order Value (AOV) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs uppercase font-bold tracking-wider">
              <span>Average Order Value</span>
              <span className="p-2 bg-neutral-800 rounded-lg text-white">
                <BarChart3 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ৳{kpis.avgOrderValue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="text-white font-bold">{kpis.conversionRate}%</span>
              <span>order fulfillment rate</span>
            </div>
          </div>

        </div>

        {/* Detailed Financial Breakdown Bar */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6 divide-x divide-neutral-800">
            <div>
              <span className="text-neutral-500 uppercase font-bold tracking-wider text-[10px] block">Product COGS (Cost)</span>
              <span className="text-sm font-black text-white">৳{kpis.cogs.toLocaleString()}</span>
            </div>
            <div className="pl-6">
              <span className="text-neutral-500 uppercase font-bold tracking-wider text-[10px] block">Gross Product Margin</span>
              <span className="text-sm font-black text-white">৳{kpis.grossProfit.toLocaleString()}</span>
            </div>
            <div className="pl-6">
              <span className="text-neutral-500 uppercase font-bold tracking-wider text-[10px] block">Total Discounts Given</span>
              <span className="text-sm font-black text-red-400">- ৳{kpis.totalDiscounts.toLocaleString()}</span>
            </div>
            <div className="pl-6">
              <span className="text-neutral-500 uppercase font-bold tracking-wider text-[10px] block">Recorded Expenses</span>
              <span className="text-sm font-black text-amber-400">- ৳{kpis.recordedExpenses.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-3.5 py-2 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Operating Expense</span>
          </button>
        </div>

        {/* Sales Trend Chart & Order Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Visual Sales Revenue Trend Chart */}
          <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Sales Revenue & Order Trajectory
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Daily revenue volume across the active selection
                </p>
              </div>
              <span className="text-xs font-bold text-neutral-400 uppercase">
                Peak: ৳{maxTrendRevenue.toLocaleString()}
              </span>
            </div>

            {/* Interactive SVG Bar Trend Visual */}
            <div className="pt-4 pb-2">
              {salesTrend.length === 0 ? (
                <div className="py-16 text-center text-xs text-neutral-500">
                  No sales recorded in this timeframe.
                </div>
              ) : (
                <div className="flex items-end justify-between gap-2 h-48 border-b border-neutral-800 px-2 pb-1">
                  {salesTrend.map((t: any) => {
                    const heightPercent = Math.max(8, Math.round((t.revenue / maxTrendRevenue) * 100));
                    const dateFormatted = t.date.slice(5); // e.g. "11-22"

                    return (
                      <div key={t.date} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-12 bg-neutral-950 border border-neutral-700 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap">
                          <p className="font-bold">৳{t.revenue.toLocaleString()}</p>
                          <p className="text-neutral-400">{t.orders} order(s) on {t.date}</p>
                        </div>

                        {/* Bar */}
                        <div className="w-full max-w-[28px] bg-neutral-800 group-hover:bg-white rounded-t-md transition-colors flex items-end justify-center" style={{ height: `${heightPercent}%` }}>
                          {t.orders > 0 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mb-1" />
                          )}
                        </div>

                        {/* X-axis Label */}
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {dateFormatted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800/60">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-white" />
                  <span>Revenue Volume</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Orders Placed</span>
                </span>
              </div>
              <span className="text-neutral-500 text-[11px]">Updated live from database</span>
            </div>
          </div>

          {/* Order Status Distribution */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Order Pipeline Status
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Current order lifecycle stages
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { status: 'Delivered', count: statusCounts.Delivered || 0, color: 'bg-emerald-500 text-emerald-400', icon: CheckCircle2 },
                { status: 'Confirmed', count: statusCounts.Confirmed || 0, color: 'bg-sky-500 text-sky-400', icon: CheckCircle2 },
                { status: 'Processing', count: statusCounts.Processing || 0, color: 'bg-amber-500 text-amber-400', icon: Clock },
                { status: 'Pending', count: statusCounts.Pending || 0, color: 'bg-neutral-400 text-neutral-300', icon: Clock },
                { status: 'Cancelled', count: statusCounts.Cancelled || 0, color: 'bg-red-500 text-red-400', icon: XCircle }
              ].map(st => {
                const total = Math.max(1, kpis.totalOrders);
                const percent = Math.round((st.count / total) * 100);
                const Icon = st.icon;

                return (
                  <div key={st.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-1.5 text-neutral-300">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{st.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{st.count}</span>
                        <span className="text-neutral-500 text-[11px] font-mono">({percent}%)</span>
                      </div>
                    </div>
                    {/* Meter bar */}
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${st.color.split(' ')[0]}`} 
                        style={{ width: `${percent}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Conversion / Fulfillment:</span>
              <span className="font-bold text-white">{kpis.conversionRate}%</span>
            </div>
          </div>

        </div>

        {/* Best Sellers & Category Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Best-Selling Products Leaderboard */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Top Best-Selling Products
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Ranked by revenue contribution & unit volume
                </p>
              </div>
              <span className="text-xs text-neutral-500">
                Top {bestSellers.length}
              </span>
            </div>

            {bestSellers.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No product sales recorded in this timeframe.
              </div>
            ) : (
              <div className="space-y-2.5 divide-y divide-neutral-800/60">
                {bestSellers.map((item: any, idx: number) => {
                  const product = item.product;
                  const imageUrl = product.image_url || '/placeholder.png';

                  return (
                    <div key={product.id || idx} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                          idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-neutral-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {idx + 1}
                        </span>

                        <div className="w-10 h-10 rounded-lg bg-neutral-950 overflow-hidden shrink-0 border border-neutral-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                            }}
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate" title={product.name}>
                            {product.name}
                          </h4>
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {item.unitsSold} units sold • Profit: ৳{Math.round(item.profit).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-white block">
                          ৳{item.revenue.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          ৳{product.price} each
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Categories Breakdown */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Category Revenue Share
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Performance across store departments
                </p>
              </div>
              <span className="text-xs text-neutral-500">
                {topCategories.length} Categories
              </span>
            </div>

            {topCategories.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No category sales recorded in this timeframe.
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {topCategories.map((cat: any) => {
                  const share = kpis.totalRevenue > 0 
                    ? Math.round((cat.revenue / kpis.totalRevenue) * 100) 
                    : 0;

                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-white">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">৳{cat.revenue.toLocaleString()}</span>
                          <span className="text-neutral-400 font-mono text-[11px]">({share}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all" style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Operating Expenses Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Operating Expenses & Deductions ({expenses.length})
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Packaging, marketing and overheads deducted from gross profit
              </p>
            </div>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No additional expenses logged. Click &quot;Record Expense&quot; to audit custom operational costs.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-[10px] text-neutral-400 uppercase tracking-wider">
                    <th className="pb-2 font-bold">Title / Description</th>
                    <th className="pb-2 font-bold">Category</th>
                    <th className="pb-2 font-bold">Date</th>
                    <th className="pb-2 font-bold text-right">Amount</th>
                    <th className="pb-2 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-neutral-800/40">
                      <td className="py-2.5 font-medium text-white">{e.title}</td>
                      <td className="py-2.5 capitalize text-neutral-400">{e.category.replace('_', ' ')}</td>
                      <td className="py-2.5 text-neutral-500 font-mono text-[11px]">{e.date}</td>
                      <td className="py-2.5 text-right font-black text-amber-400">৳{e.amount.toLocaleString()}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Expense Modal */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Record Operating Expense
                </h3>
                <button
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
                <div>
                  <label className="text-neutral-400 block mb-1">Expense Title <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Courier poly packaging bags 500 pcs"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-hidden focus:border-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-400 block mb-1">Amount (৳ BDT) <span className="text-red-400">*</span></label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 1500"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-hidden focus:border-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">Category</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value as any)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-white"
                    >
                      <option value="packaging">Packaging</option>
                      <option value="courier_extra">Courier & Delivery</option>
                      <option value="marketing">Marketing & Ads</option>
                      <option value="software">Software & Hosting</option>
                      <option value="inventory">Inventory & Samples</option>
                      <option value="other">Other Overhead</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-white"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Supplier or receipt notes"
                    value={expenseNotes}
                    onChange={(e) => setExpenseNotes(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-hidden focus:border-white"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingExpense}
                    className="px-5 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {addingExpense ? 'Saving...' : 'Add Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
