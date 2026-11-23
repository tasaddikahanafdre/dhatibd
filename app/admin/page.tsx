'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Package, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  Calendar,
  Users,
  Truck,
  XCircle,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Eye,
  Layers,
  ArrowUpRight,
  Filter,
  Check,
  X
} from 'lucide-react';
import { Order, Product, Category, OrderStatus } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

type DateFilterType = 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'last_month' | 'this_year' | 'custom' | 'all';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterType>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Orders table quick filter
  const [orderStatusTab, setOrderStatusTab] = useState<'All' | OrderStatus>('All');
  const [orderSearch, setOrderSearch] = useState('');

  // Order Details Modal
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null);

  // Fetch all primary database records
  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const [resOrders, resProducts, resCats, resAnalytics] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products?all=true&includeInactive=true'),
        fetch('/api/categories?include_inactive=true'),
        fetch('/api/analytics?range=all')
      ]);

      if (resOrders.ok) {
        const data = await resOrders.json();
        setOrders(Array.isArray(data) ? data : []);
      }
      if (resProducts.ok) {
        const data = await resProducts.json();
        setProducts(data.products || []);
      }
      if (resCats.ok) {
        const data = await resCats.json();
        setCategories(Array.isArray(data) ? data : []);
      }
      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        setExpenses(data.expenses || []);
      }
    } catch (err) {
      console.error('Dashboard data load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute Date Boundaries based on Asia/Dhaka time
  const { currentPeriodStart, currentPeriodEnd, prevPeriodStart, prevPeriodEnd } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date(now);
    let pStart = new Date();
    let pEnd = new Date();

    if (dateFilter === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      pStart = new Date(start);
      pStart.setDate(pStart.getDate() - 1);
      pEnd = new Date(end);
      pEnd.setDate(pEnd.getDate() - 1);
    } else if (dateFilter === 'yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      pStart = new Date(start);
      pStart.setDate(pStart.getDate() - 1);
      pEnd = new Date(end);
      pEnd.setDate(pEnd.getDate() - 1);
    } else if (dateFilter === '7d') {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      const span = now.getTime() - start.getTime();
      pEnd = new Date(start.getTime() - 1);
      pStart = new Date(pEnd.getTime() - span);
    } else if (dateFilter === '30d') {
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      const span = now.getTime() - start.getTime();
      pEnd = new Date(start.getTime() - 1);
      pStart = new Date(pEnd.getTime() - span);
    } else if (dateFilter === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      pStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      pEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (dateFilter === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      pStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
      pEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
    } else if (dateFilter === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      pStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
      pEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
      start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      const span = end.getTime() - start.getTime();
      pEnd = new Date(start.getTime() - 1);
      pStart = new Date(pEnd.getTime() - span);
    } else {
      // 'all'
      start = new Date(2020, 0, 1);
      pStart = new Date(2020, 0, 1);
    }

    return {
      currentPeriodStart: start,
      currentPeriodEnd: end,
      prevPeriodStart: pStart,
      prevPeriodEnd: pEnd
    };
  }, [dateFilter, customStartDate, customEndDate]);

  // Filter orders by date range
  const { filteredOrders, prevOrders } = useMemo(() => {
    if (dateFilter === 'all') {
      return { filteredOrders: orders, prevOrders: [] };
    }

    const cur = orders.filter(o => {
      const orderDate = new Date(o.created_at || Date.now());
      return orderDate >= currentPeriodStart && orderDate <= currentPeriodEnd;
    });

    const prev = orders.filter(o => {
      const orderDate = new Date(o.created_at || Date.now());
      return orderDate >= prevPeriodStart && orderDate <= prevPeriodEnd;
    });

    return { filteredOrders: cur, prevOrders: prev };
  }, [orders, dateFilter, currentPeriodStart, currentPeriodEnd, prevPeriodStart, prevPeriodEnd]);

  // 1. ADVANCED BUSINESS STATISTICS CALCULATIONS
  const stats = useMemo(() => {
    // Current Period Metrics
    let totalRevenue = 0;
    let totalDiscounts = 0;
    let totalDeliveryCharges = 0;
    let calculatedCOGS = 0;
    let cogsKnownItems = 0;
    let totalItemsCount = 0;

    let pendingCount = 0;
    let confirmedCount = 0;
    let processingCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    filteredOrders.forEach(order => {
      const status = order.order_status || 'Pending';
      if (status === 'Pending') pendingCount++;
      else if (status === 'Confirmed') confirmedCount++;
      else if (status === 'Processing') processingCount++;
      else if (status === 'Shipped') shippedCount++;
      else if (status === 'Delivered') deliveredCount++;
      else if (status === 'Cancelled') cancelledCount++;

      // Cancelled orders are strictly excluded from completed revenue
      if (status !== 'Cancelled') {
        const orderTotal = Number(order.total || order.total_amount || 0);
        totalRevenue += orderTotal;
        totalDiscounts += Number(order.discount || order.discount_amount || 0);
        totalDeliveryCharges += Number(order.delivery_charge || 0);

        if (Array.isArray(order.items)) {
          order.items.forEach(item => {
            totalItemsCount += Number(item.quantity || 1);
            const product = products.find(p => p.id === item.product_id);
            if (product?.cost_price) {
              calculatedCOGS += (Number(product.cost_price) * Number(item.quantity || 1));
              cogsKnownItems += Number(item.quantity || 1);
            } else if (item.product_price) {
              // conservative COGS estimate (65% of price)
              calculatedCOGS += (Number(item.product_price) * 0.65 * Number(item.quantity || 1));
            }
          });
        }
      }
    });

    // Previous Period Metrics (for comparison)
    let prevRevenue = 0;
    prevOrders.forEach(o => {
      if (o.order_status !== 'Cancelled') {
        prevRevenue += Number(o.total || o.total_amount || 0);
      }
    });

    // Expenses in current period
    const periodExpenses = dateFilter === 'all'
      ? expenses
      : expenses.filter(e => {
          const d = new Date(e.date);
          return d >= currentPeriodStart && d <= currentPeriodEnd;
        });
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Actual Net Profit: Revenue - COGS - Recorded Expenses
    const grossProfit = Math.max(0, totalRevenue - calculatedCOGS);
    const netProfit = Math.max(0, grossProfit - totalExpenses);
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    // Growth percentage calculation
    const calcGrowth = (curr: number, prev: number) => {
      if (dateFilter === 'all' || prev === 0) return null;
      const pct = Math.round(((curr - prev) / prev) * 100);
      return pct;
    };

    const revenueGrowth = calcGrowth(totalRevenue, prevRevenue);
    const ordersGrowth = calcGrowth(filteredOrders.length, prevOrders.length);

    // Products breakdown
    const activeProducts = products.filter(p => p.is_active !== false);
    const outOfStockProducts = products.filter(p => p.stock_quantity <= 0);
    const lowStockProducts = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold);

    // Qualifying orders for Average Order Value (AOV)
    const qualifyingOrdersCount = filteredOrders.length - cancelledCount;
    const aov = qualifyingOrdersCount > 0 ? Math.round(totalRevenue / qualifyingOrdersCount) : 0;

    // Cancellation rate
    const cancellationRate = filteredOrders.length > 0 
      ? Math.round((cancelledCount / filteredOrders.length) * 100) 
      : 0;

    return {
      totalRevenue,
      netProfit,
      profitMargin,
      totalOrders: filteredOrders.length,
      pendingCount,
      confirmedCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
      activeProductsCount: activeProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockCount: lowStockProducts.length,
      outOfStockList: outOfStockProducts,
      lowStockList: lowStockProducts,
      revenueGrowth,
      ordersGrowth,
      aov,
      cancellationRate,
      totalExpenses
    };
  }, [filteredOrders, prevOrders, products, expenses, dateFilter, currentPeriodStart, currentPeriodEnd]);

  // 2. SALES TREND DATA (Interactive SVG Chart)
  const salesTrend = useMemo(() => {
    const map: Record<string, { label: string; revenue: number; orders: number }> = {};
    const days = dateFilter === 'today' ? 1 : dateFilter === '7d' ? 7 : 14;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map[key] = { label, revenue: 0, orders: 0 };
    }

    filteredOrders.forEach(o => {
      if (o.order_status === 'Cancelled') return;
      const key = (o.created_at || new Date().toISOString()).split('T')[0];
      if (map[key]) {
        map[key].revenue += Number(o.total || o.total_amount || 0);
        map[key].orders += 1;
      } else if (dateFilter === 'all' || dateFilter === 'this_year' || dateFilter === 'this_month') {
        const d = new Date(key);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        map[key] = { label, revenue: Number(o.total || o.total_amount || 0), orders: 1 };
      }
    });

    const items = Object.entries(map)
      .map(([date, val]) => ({ date, ...val }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Limit to latest 14 data points for clean rendering
    return items.slice(-14);
  }, [filteredOrders, dateFilter]);

  const maxTrendRevenue = useMemo(() => {
    return Math.max(...salesTrend.map(t => t.revenue), 1000);
  }, [salesTrend]);

  // 3. PRODUCT PERFORMANCE (Top Sellers & Low Selling)
  const { topSellingProducts, lowSellingProducts } = useMemo(() => {
    const salesMap: Record<string, { product: Product; unitsSold: number; revenue: number; profit: number }> = {};

    // Seed catalog products
    products.forEach(p => {
      salesMap[p.id] = { product: p, unitsSold: 0, revenue: 0, profit: 0 };
    });

    filteredOrders.forEach(o => {
      if (o.order_status === 'Cancelled') return;
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          const pId = item.product_id;
          if (salesMap[pId]) {
            const qty = Number(item.quantity || 1);
            const price = Number(item.product_price || salesMap[pId].product.price || 0);
            const cost = salesMap[pId].product.cost_price ?? (price * 0.65);
            salesMap[pId].unitsSold += qty;
            salesMap[pId].revenue += (price * qty);
            salesMap[pId].profit += ((price - cost) * qty);
          }
        });
      }
    });

    const allRanked = Object.values(salesMap);
    const top = allRanked
      .filter(item => item.unitsSold > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const low = allRanked
      .filter(item => item.unitsSold === 0 && item.product.is_active !== false)
      .slice(0, 5);

    return { topSellingProducts: top, lowSellingProducts: low };
  }, [filteredOrders, products]);

  // 4. CUSTOMER ANALYTICS & INSIGHTS
  const customerAnalytics = useMemo(() => {
    const customerMap: Record<string, { name: string; phone: string; totalOrders: number; totalSpent: number; lastOrderDate: string }> = {};

    filteredOrders.forEach(o => {
      if (o.order_status === 'Cancelled') return;
      const phone = (o.customer_phone || '').replace(/[^0-9]/g, '');
      if (!phone) return;

      if (!customerMap[phone]) {
        customerMap[phone] = {
          name: o.customer_name || 'Customer',
          phone: o.customer_phone,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: o.created_at || ''
        };
      }
      customerMap[phone].totalOrders += 1;
      customerMap[phone].totalSpent += Number(o.total || o.total_amount || 0);
    });

    const uniqueCustomers = Object.values(customerMap);
    const totalCustomers = uniqueCustomers.length;
    const repeatCustomers = uniqueCustomers.filter(c => c.totalOrders > 1).length;
    const newCustomers = totalCustomers - repeatCustomers;
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
    const avgCustomerSpend = totalCustomers > 0 ? Math.round(stats.totalRevenue / totalCustomers) : 0;

    const topCustomers = uniqueCustomers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      totalCustomers,
      repeatCustomers,
      newCustomers,
      repeatRate,
      avgCustomerSpend,
      topCustomers
    };
  }, [filteredOrders, stats.totalRevenue]);

  // 5. CATEGORY REVENUE BREAKDOWN
  const categoryBreakdown = useMemo(() => {
    const catRevenueMap: Record<string, { name: string; revenue: number; ordersCount: number }> = {};

    categories.forEach(c => {
      catRevenueMap[c.id] = { name: c.name, revenue: 0, ordersCount: 0 };
    });

    filteredOrders.forEach(o => {
      if (o.order_status === 'Cancelled') return;
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          const prod = products.find(p => p.id === item.product_id);
          const catId = prod?.category_id || 'other';
          if (!catRevenueMap[catId]) {
            catRevenueMap[catId] = { name: prod?.category?.name || 'Other', revenue: 0, ordersCount: 0 };
          }
          catRevenueMap[catId].revenue += (Number(item.product_price || 0) * Number(item.quantity || 1));
          catRevenueMap[catId].ordersCount += 1;
        });
      }
    });

    const totalCatRev = Object.values(catRevenueMap).reduce((s, c) => s + c.revenue, 0) || 1;
    return Object.values(catRevenueMap)
      .filter(c => c.revenue > 0)
      .map(c => ({
        ...c,
        percentage: Math.round((c.revenue / totalCatRev) * 100)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders, products, categories]);

  // 6. FILTERED ORDERS FOR RECENT ORDERS TABLE
  const tableOrders = useMemo(() => {
    return filteredOrders.filter(o => {
      const matchStatus = orderStatusTab === 'All' || o.order_status === orderStatusTab;
      const q = orderSearch.toLowerCase().trim();
      const matchSearch = !q || 
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_phone?.includes(q);
      return matchStatus && matchSearch;
    });
  }, [filteredOrders, orderStatusTab, orderSearch]);

  // Format Bangladesh Local Date/Time
  const formatBDDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        timeZone: 'Asia/Dhaka',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* ===================== TOP HEADER & GLOBAL CONTROLS ===================== */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Executive Overview
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                LIVE BI
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Live enterprise database metrics & commerce intelligence for Dhati Bangladesh retail operations
            </p>
          </div>

          {/* Date Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  dateFilter === 'today' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateFilter('7d')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  dateFilter === '7d' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                7D
              </button>
              <button
                onClick={() => setDateFilter('30d')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  dateFilter === '30d' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                30D
              </button>
              <button
                onClick={() => setDateFilter('this_month')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  dateFilter === 'this_month' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setDateFilter('this_year')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  dateFilter === 'this_year' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Year
              </button>
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  dateFilter === 'all' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateFilter('custom')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  dateFilter === 'custom' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Custom
              </button>
            </div>

            <button
              onClick={loadDashboardData}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker Dropdown (if selected) */}
        {dateFilter === 'custom' && (
          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl flex flex-wrap items-center gap-4 text-xs">
            <span className="text-neutral-400 font-semibold uppercase">Custom Date Boundary:</span>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">From</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">To</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
          </div>
        )}

        {/* ===================== SECTION 1: ADVANCED BUSINESS STATISTICS (11 CARDS) ===================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-400">
            <span className="uppercase tracking-wider">Executive KPI Summary</span>
            <span className="text-[11px] text-neutral-500">Click any card to open filtered management views</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            
            {/* 1. Total Revenue */}
            <Link 
              href="/admin/orders" 
              className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Net Revenue</span>
                <div className="w-6 h-6 rounded-md bg-emerald-950/60 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-black text-white">{formatPrice(stats.totalRevenue)}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                  {stats.revenueGrowth !== null && (
                    <span className={`font-semibold flex items-center ${stats.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stats.revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                      {Math.abs(stats.revenueGrowth)}%
                    </span>
                  )}
                  <span className="text-neutral-500 truncate">Excl. cancelled</span>
                </div>
              </div>
            </Link>

            {/* 2. Net Profit */}
            <Link 
              href="/admin/analytics" 
              className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Actual Net Profit</span>
                <div className="w-6 h-6 rounded-md bg-blue-950/60 text-blue-400 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-black text-white">{formatPrice(stats.netProfit)}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                  <span className="text-blue-400 font-bold">{stats.profitMargin}% margin</span>
                  <span className="text-neutral-500">After COGS & exp</span>
                </div>
              </div>
            </Link>

            {/* 3. Total Orders */}
            <Link 
              href="/admin/orders" 
              className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Orders</span>
                <div className="w-6 h-6 rounded-md bg-neutral-800 text-white flex items-center justify-center">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-black text-white">{stats.totalOrders}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px]">
                  {stats.ordersGrowth !== null && (
                    <span className={`font-semibold ${stats.ordersGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stats.ordersGrowth >= 0 ? '+' : ''}{stats.ordersGrowth}%
                    </span>
                  )}
                  <span className="text-neutral-500">Avg ৳{stats.aov} / order</span>
                </div>
              </div>
            </Link>

            {/* 4. Pending Orders */}
            <Link 
              href="/admin/orders?status=Pending" 
              className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Pending</span>
                <div className="w-6 h-6 rounded-md bg-amber-950/60 text-amber-400 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-black text-amber-400">{stats.pendingCount}</p>
                <span className="text-[10px] text-neutral-500 block mt-1">Requires phone confirmation</span>
              </div>
            </Link>

            {/* 5. Confirmed Orders */}
            <Link 
              href="/admin/orders?status=Confirmed" 
              className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Confirmed</span>
                <div className="w-6 h-6 rounded-md bg-blue-950/60 text-blue-400 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-black text-blue-400">{stats.confirmedCount}</p>
                <span className="text-[10px] text-neutral-500 block mt-1">Ready for warehouse packaging</span>
              </div>
            </Link>

            {/* 6. Processing / Staging */}
            <Link 
              href="/admin/orders?status=Processing" 
              className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Processing</span>
                <div className="w-6 h-6 rounded-md bg-purple-950/60 text-purple-400 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-black text-purple-400">{stats.processingCount}</p>
                <span className="text-[10px] text-neutral-500 block mt-1">Packaging & courier handover</span>
              </div>
            </Link>

            {/* 7. Delivered Orders */}
            <Link 
              href="/admin/orders?status=Delivered" 
              className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Delivered</span>
                <div className="w-6 h-6 rounded-md bg-emerald-950/60 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-black text-emerald-400">{stats.deliveredCount}</p>
                <span className="text-[10px] text-neutral-500 block mt-1">Cash collected & completed</span>
              </div>
            </Link>

            {/* 8. Cancelled Orders */}
            <Link 
              href="/admin/orders?status=Cancelled" 
              className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-rose-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Cancelled</span>
                <div className="w-6 h-6 rounded-md bg-rose-950/60 text-rose-400 flex items-center justify-center">
                  <XCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-black text-rose-400">{stats.cancelledCount}</p>
                <span className="text-[10px] text-neutral-500 block mt-1">{stats.cancellationRate}% cancellation rate</span>
              </div>
            </Link>

            {/* 9. Active Catalog Products */}
            <Link 
              href="/admin/products" 
              className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Active Catalog</span>
                <div className="w-6 h-6 rounded-md bg-neutral-800 text-white flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-black text-white">{stats.activeProductsCount}</p>
                <span className="text-[10px] text-neutral-500 block mt-1">Live in store ({products.length} total)</span>
              </div>
            </Link>

            {/* 10. Low Stock Alert */}
            <Link 
              href="/admin/inventory?filter=low" 
              className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Low Stock Alert</span>
                <div className="w-6 h-6 rounded-md bg-amber-950/60 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-black text-amber-400">{stats.lowStockCount}</p>
                <span className="text-[10px] text-amber-400/80 block mt-1">≤ threshold units</span>
              </div>
            </Link>

            {/* 11. Out of Stock Alert */}
            <Link 
              href="/admin/inventory?filter=out" 
              className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-rose-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-xs col-span-2 sm:col-span-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Out of Stock</span>
                <div className="w-6 h-6 rounded-md bg-rose-950/60 text-rose-400 flex items-center justify-center">
                  <XCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-black text-rose-400">{stats.outOfStockCount}</p>
                <span className="text-[10px] text-rose-400/80 block mt-1">Requires immediate restocking</span>
              </div>
            </Link>

          </div>
        </div>

        {/* ===================== SECTION 2: SALES & REVENUE ANALYTICS ===================== */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Sales & Revenue Trajectory</span>
              </h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Real customer order trajectory excluding cancelled checkouts
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-neutral-500 text-[10px] uppercase font-bold block">Period Gross Sales</span>
                <span className="text-base font-bold text-white">{formatPrice(stats.totalRevenue)}</span>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 text-[10px] uppercase font-bold block">Average Order Value</span>
                <span className="text-base font-bold text-emerald-400">৳{stats.aov}</span>
              </div>
            </div>
          </div>

          {/* Responsive SVG Chart */}
          {salesTrend.length === 0 || stats.totalRevenue === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              No sales data recorded for the selected date timeframe.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-1">
                {salesTrend.map((point, index) => {
                  const heightPercent = maxTrendRevenue > 0 
                    ? Math.max(8, Math.min(100, Math.round((point.revenue / maxTrendRevenue) * 100))) 
                    : 8;
                  return (
                    <div key={point.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-950 border border-neutral-700 text-white text-[10px] rounded px-2 py-1 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                        <span className="font-bold">{formatPrice(point.revenue)}</span>
                        <span className="text-neutral-400 block">{point.orders} orders</span>
                      </div>
                      {/* Bar */}
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-neutral-800 group-hover:bg-white rounded-t transition-colors cursor-pointer"
                      />
                      <span className="text-[10px] text-neutral-500 group-hover:text-neutral-300 truncate w-full text-center">
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800/60">
                <span>Total Recorded Orders in Period: <strong className="text-neutral-300">{stats.totalOrders}</strong></span>
                <span>Fulfillment Rate: <strong className="text-emerald-400">{100 - stats.cancellationRate}%</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* ===================== SECTION 3 & 5: PRODUCT PERFORMANCE & INVENTORY WATCH ===================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Product Performance (Top Sellers & Lowest) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>Top-Performing Products</span>
                </h2>
                <Link href="/admin/products" className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
                  <span>Catalog</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {topSellingProducts.length === 0 ? (
                <div className="py-10 text-center text-xs text-neutral-500">
                  No completed sales for products in this period yet.
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/60 mt-2">
                  {topSellingProducts.map((item, idx) => (
                    <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[11px] font-bold text-neutral-500 w-4">{idx + 1}</span>
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-8 h-8 rounded object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-neutral-800 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{item.product.name}</p>
                          <p className="text-[10px] text-neutral-500">{item.unitsSold} units sold</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-white">{formatPrice(item.revenue)}</p>
                        <p className="text-[10px] text-emerald-400">+{formatPrice(item.profit)} profit</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low-Selling Notice */}
            {lowSellingProducts.length > 0 && (
              <div className="pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400 flex items-center justify-between">
                <span>{lowSellingProducts.length} active products have 0 sales in this timeframe</span>
                <Link href="/admin/inventory" className="text-blue-400 hover:underline">Review Inventory</Link>
              </div>
            )}
          </div>

          {/* Inventory Insights (Low Stock & Out of Stock Watch) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Warehouse Inventory Watch</span>
                </h2>
                <Link href="/admin/inventory" className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
                  <span>Manage</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {stats.outOfStockList.length === 0 && stats.lowStockList.length === 0 ? (
                <div className="py-10 text-center text-xs text-neutral-500">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  All warehouse inventory levels are currently healthy!
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/60 mt-2 space-y-1">
                  {/* Out of Stock first */}
                  {stats.outOfStockList.slice(0, 3).map((prod) => (
                    <div key={prod.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded bg-neutral-950 flex items-center justify-center text-rose-400 font-bold shrink-0 border border-neutral-800">
                          0
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{prod.name}</p>
                          <p className="text-[10px] text-neutral-500 font-mono">SKU: {prod.sku || 'N/A'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950/60 text-rose-400 shrink-0">
                        Out of Stock
                      </span>
                    </div>
                  ))}

                  {/* Low Stock next */}
                  {stats.lowStockList.slice(0, 3).map((prod) => (
                    <div key={prod.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded bg-neutral-950 flex items-center justify-center text-amber-400 font-bold shrink-0 border border-neutral-800">
                          {prod.stock_quantity}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{prod.name}</p>
                          <p className="text-[10px] text-neutral-500">Threshold: {prod.low_stock_threshold} units</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950/60 text-amber-400 shrink-0">
                        Low Stock ({prod.stock_quantity} left)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
              <span>{stats.outOfStockCount} items out of stock • {stats.lowStockCount} low stock</span>
              <Link href="/admin/inventory?filter=low" className="text-amber-400 hover:underline">
                Quick Adjust Stock
              </Link>
            </div>
          </div>

        </div>

        {/* ===================== SECTION 4: ORDER OVERVIEW TABLE ===================== */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-neutral-400" />
                <span>Customer Order Activity ({tableOrders.length})</span>
              </h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Real customer transactions filtered by selected timeframe
              </p>
            </div>

            <Link href="/admin/orders" className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 self-end sm:self-auto">
              <span>Full Orders Manager</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
              {(['All', 'Pending', 'Confirmed', 'Processing', 'Delivered', 'Cancelled'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderStatusTab(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    orderStatusTab === status
                      ? 'bg-neutral-800 text-white font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search orders, names, phones..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Orders Table */}
          {tableOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              No orders found matching the active status & search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-500 text-[11px] uppercase tracking-wider">
                    <th className="pb-3 px-3">Order #</th>
                    <th className="pb-3 px-3">Customer</th>
                    <th className="pb-3 px-3">Location</th>
                    <th className="pb-3 px-3">Payment</th>
                    <th className="pb-3 px-3">Total</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Time (Asia/Dhaka)</th>
                    <th className="pb-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {tableOrders.slice(0, 10).map((order) => {
                    const status = order.order_status;
                    return (
                      <tr key={order.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-white">
                          {order.order_number}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-neutral-200">{order.customer_name}</p>
                          <p className="text-[10px] text-neutral-500">{order.customer_phone}</p>
                        </td>
                        <td className="py-3 px-3 text-neutral-400 text-[11px]">
                          {order.district || 'Dhaka'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-neutral-300 block">{order.payment_method}</span>
                          <span className="text-[10px] text-neutral-500">{order.payment_status}</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-white">
                          {formatPrice(order.total || order.total_amount || 0)}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            status === 'Delivered' ? 'bg-emerald-950/80 text-emerald-400' :
                            status === 'Confirmed' ? 'bg-blue-950/80 text-blue-400' :
                            status === 'Processing' ? 'bg-purple-950/80 text-purple-400' :
                            status === 'Cancelled' ? 'bg-rose-950/80 text-rose-400' :
                            'bg-amber-950/80 text-amber-400'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-neutral-400 text-[11px]">
                          {formatBDDateTime(order.created_at)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setInspectOrder(order)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Inspect Order"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tableOrders.length > 10 && (
            <div className="pt-3 border-t border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
              <span>Showing 10 of {tableOrders.length} qualifying orders</span>
              <Link href="/admin/orders" className="text-white hover:underline flex items-center gap-1 font-semibold">
                <span>View all in Orders Management</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* ===================== SECTION 6 & 7: CUSTOMER INSIGHTS & CATEGORIES SHARE ===================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Customer Insights */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Customer Loyalty & Retention</span>
              </h2>
              <span className="text-xs text-neutral-400">{customerAnalytics.totalCustomers} Unique Clients</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 text-center">
                <span className="text-[10px] text-neutral-500 uppercase font-semibold block">New Clients</span>
                <span className="text-lg font-bold text-white mt-1 block">{customerAnalytics.newCustomers}</span>
              </div>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 text-center">
                <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Repeat Buyers</span>
                <span className="text-lg font-bold text-purple-400 mt-1 block">{customerAnalytics.repeatCustomers}</span>
              </div>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 text-center">
                <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Repeat Rate</span>
                <span className="text-lg font-bold text-emerald-400 mt-1 block">{customerAnalytics.repeatRate}%</span>
              </div>
            </div>

            {/* Top Spending Customers */}
            <div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                Top Spending Customers in Timeframe
              </span>
              {customerAnalytics.topCustomers.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 text-center">No customer records in this timeframe.</p>
              ) : (
                <div className="divide-y divide-neutral-800/60">
                  {customerAnalytics.topCustomers.map((cust, i) => (
                    <div key={cust.phone} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{cust.name}</p>
                        <p className="text-[10px] text-neutral-500">{cust.phone} • {cust.totalOrders} orders</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">{formatPrice(cust.totalSpent)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category Revenue Breakdown */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Top Categories by Sales</span>
              </h2>
              <Link href="/admin/categories" className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
                <span>Categories</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-neutral-500 py-10 text-center">No sales registered across categories yet.</p>
            ) : (
              <div className="space-y-4 pt-1">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-white">{cat.name}</span>
                      <span className="font-bold text-neutral-300">{formatPrice(cat.revenue)} ({cat.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                      <div 
                        style={{ width: `${cat.percentage}%` }}
                        className="h-full bg-white rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ===================== INSPECT ORDER MODAL ===================== */}
        {inspectOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 text-white shadow-2xl relative space-y-4">
              <button
                onClick={() => setInspectOrder(null)}
                className="absolute top-5 right-5 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Order Details
                </span>
                <h3 className="text-lg font-bold text-white mt-1 font-mono">
                  {inspectOrder.order_number}
                </h3>
                <p className="text-xs text-neutral-400">Placed on {formatBDDateTime(inspectOrder.created_at)}</p>
              </div>

              {/* Status and Total */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
                <div>
                  <span className="text-neutral-500 block">Fulfillment Status</span>
                  <span className="font-bold text-white">{inspectOrder.order_status}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Total Amount</span>
                  <span className="font-bold text-emerald-400 text-sm">{formatPrice(inspectOrder.total || inspectOrder.total_amount || 0)}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs space-y-1">
                <span className="text-neutral-500 uppercase text-[10px] font-bold block mb-1">Customer & Delivery</span>
                <p className="text-white font-semibold">{inspectOrder.customer_name} ({inspectOrder.customer_phone})</p>
                <p className="text-neutral-400">{inspectOrder.delivery_address}, {inspectOrder.district}</p>
                <p className="text-neutral-500 pt-1">Payment Method: <span className="text-neutral-300">{inspectOrder.payment_method}</span> ({inspectOrder.payment_status})</p>
              </div>

              {/* Items List */}
              <div>
                <span className="text-[11px] uppercase font-bold text-neutral-400 block mb-2">Order Items</span>
                <div className="divide-y divide-neutral-800/80 border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
                  {inspectOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{item.product_name}</p>
                        <p className="text-[10px] text-neutral-500">Qty: {item.quantity} × ৳{item.product_price}</p>
                      </div>
                      <span className="font-bold text-white">৳{(item.quantity || 1) * (item.product_price || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Link
                  href="/admin/orders"
                  className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Manage in Orders
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}