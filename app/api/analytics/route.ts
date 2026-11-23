import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '30d'; // 'today', '7d', '30d', 'month', 'year', 'all'
    const customStart = searchParams.get('start');
    const customEnd = searchParams.get('end');

    const [orders, productsResult, categories, expenses] = await Promise.all([
      db.getOrders(),
      db.getProducts({ includeInactive: true }),
      db.getCategories(true),
      db.getExpenses()
    ]);

    const allProducts = productsResult.products;
    const now = new Date();

    // Determine current period date boundaries
    let startDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();

    if (customStart && customEnd) {
      startDate = new Date(customStart);
      const diffMs = new Date(customEnd).getTime() - startDate.getTime();
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getTime() - diffMs);
    } else {
      switch (timeRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          prevEndDate = new Date(startDate.getTime() - 1);
          prevStartDate = new Date(prevEndDate);
          prevStartDate.setHours(0, 0, 0, 0);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          prevEndDate = new Date(startDate.getTime() - 1);
          prevStartDate.setDate(prevEndDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          prevEndDate = new Date(startDate.getTime() - 1);
          prevStartDate = new Date(prevEndDate.getFullYear(), prevEndDate.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          prevEndDate = new Date(startDate.getTime() - 1);
          prevStartDate = new Date(prevEndDate.getFullYear(), 0, 1);
          break;
        case '30d':
        default:
          startDate.setDate(now.getDate() - 30);
          prevEndDate = new Date(startDate.getTime() - 1);
          prevStartDate.setDate(prevEndDate.getDate() - 30);
          break;
      }
    }

    // Filter current vs previous orders
    const currentOrders = timeRange === 'all' 
      ? orders 
      : orders.filter(o => new Date(o.created_at || Date.now()) >= startDate);

    const prevOrders = timeRange === 'all'
      ? []
      : orders.filter(o => {
          const d = new Date(o.created_at || Date.now());
          return d >= prevStartDate && d <= prevEndDate;
        });

    // Helper: compute financial metrics
    const computeMetrics = (orderList: typeof orders) => {
      let revenue = 0;
      let cogs = 0;
      let totalDiscounts = 0;
      let totalDelivery = 0;
      let completedOrders = 0;
      let cancelledOrders = 0;

      orderList.forEach(order => {
        const isCancelled = order.order_status === 'Cancelled';
        if (isCancelled) {
          cancelledOrders++;
          return;
        }

        completedOrders++;
        const orderTotal = Number(order.total || order.total_amount || 0);
        revenue += orderTotal;
        totalDiscounts += Number(order.discount || order.discount_amount || 0);
        totalDelivery += Number(order.delivery_charge || 0);

        // Calculate Cost of Goods Sold (COGS) from items
        if (Array.isArray(order.items)) {
          order.items.forEach(item => {
            const product = allProducts.find(p => p.id === item.product_id);
            const itemQty = Number(item.quantity || 1);
            // If cost_price is known, use it; otherwise fallback to 70% of price as conservative estimate
            const unitCost = product?.cost_price ?? (item.product_price ? item.product_price * 0.7 : 0);
            cogs += (unitCost * itemQty);
          });
        }
      });

      return {
        revenue,
        cogs,
        totalDiscounts,
        totalDelivery,
        completedOrders,
        cancelledOrders,
        grossProfit: Math.max(0, revenue - cogs)
      };
    };

    const currentMetrics = computeMetrics(currentOrders);
    const prevMetrics = computeMetrics(prevOrders);

    // Filter expenses in range
    const currentExpenses = timeRange === 'all'
      ? expenses
      : expenses.filter(e => new Date(e.date) >= startDate);
    
    const totalRecordedExpenses = currentExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netProfit = Math.max(0, currentMetrics.grossProfit - totalRecordedExpenses);
    const profitMargin = currentMetrics.revenue > 0 
      ? Math.round((netProfit / currentMetrics.revenue) * 100) 
      : 0;

    // Percent changes
    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const revenueGrowth = calcChange(currentMetrics.revenue, prevMetrics.revenue);
    const orderGrowth = calcChange(currentOrders.length, prevOrders.length);

    // Sales Trend by Date (aggregated for charts)
    const trendMap: Record<string, { date: string; revenue: number; orders: number }> = {};
    const daysToShow = timeRange === '7d' ? 7 : timeRange === 'today' ? 1 : 14;
    
    // Seed days
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trendMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
    }

    currentOrders.forEach(o => {
      if (o.order_status === 'Cancelled') return;
      const dateStr = (o.created_at || new Date().toISOString()).split('T')[0];
      if (!trendMap[dateStr]) {
        trendMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
      }
      trendMap[dateStr].revenue += Number(o.total || o.total_amount || 0);
      trendMap[dateStr].orders += 1;
    });

    const salesTrend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    // Best-Selling Products
    const productSalesMap: Record<string, { product: any; unitsSold: number; revenue: number; profit: number }> = {};
    currentOrders.forEach(o => {
      if (o.order_status === 'Cancelled') return;
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          const pId = item.product_id;
          if (!productSalesMap[pId]) {
            const product = allProducts.find(p => p.id === pId) || {
              id: pId,
              name: item.product_name || 'Product',
              price: item.product_price || 0,
              image_url: item.image_url || '/placeholder.png'
            };
            productSalesMap[pId] = { product, unitsSold: 0, revenue: 0, profit: 0 };
          }
          const qty = Number(item.quantity || 1);
          const price = Number(item.product_price || 0);
          const cost = productSalesMap[pId].product.cost_price ?? (price * 0.7);
          
          productSalesMap[pId].unitsSold += qty;
          productSalesMap[pId].revenue += (price * qty);
          productSalesMap[pId].profit += ((price - cost) * qty);
        });
      }
    });

    const bestSellers = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Top Categories
    const categorySalesMap: Record<string, { name: string; revenue: number; count: number }> = {};
    currentOrders.forEach(o => {
      if (o.order_status === 'Cancelled') return;
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          const product = allProducts.find(p => p.id === item.product_id);
          const cat = categories.find(c => c.id === product?.category_id) || { name: 'Tech' };
          if (!categorySalesMap[cat.name]) {
            categorySalesMap[cat.name] = { name: cat.name, revenue: 0, count: 0 };
          }
          categorySalesMap[cat.name].revenue += (Number(item.product_price || 0) * Number(item.quantity || 1));
          categorySalesMap[cat.name].count += Number(item.quantity || 1);
        });
      }
    });

    const topCategories = Object.values(categorySalesMap)
      .sort((a, b) => b.revenue - a.revenue);

    // Order Status Breakdown
    const statusCounts: Record<string, number> = {
      Pending: 0,
      Processing: 0,
      Confirmed: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0
    };
    currentOrders.forEach(o => {
      const s = o.order_status || 'Pending';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    return NextResponse.json({
      timeRange,
      kpis: {
        totalRevenue: currentMetrics.revenue,
        revenueGrowth,
        totalOrders: currentOrders.length,
        orderGrowth,
        completedOrders: currentMetrics.completedOrders,
        cancelledOrders: currentMetrics.cancelledOrders,
        grossProfit: currentMetrics.grossProfit,
        netProfit,
        profitMargin,
        cogs: currentMetrics.cogs,
        recordedExpenses: totalRecordedExpenses,
        totalDiscounts: currentMetrics.totalDiscounts,
        avgOrderValue: currentMetrics.completedOrders > 0 
          ? Math.round(currentMetrics.revenue / currentMetrics.completedOrders) 
          : 0,
        conversionRate: currentOrders.length > 0 
          ? Math.round((currentMetrics.completedOrders / currentOrders.length) * 100) 
          : 0
      },
      salesTrend,
      bestSellers,
      topCategories,
      statusCounts,
      expenses: currentExpenses
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message || 'Failed to calculate analytics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.amount) {
      return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 });
    }

    const newExpense = await db.createExpense(body);
    return NextResponse.json(newExpense, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add expense' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const deleted = await db.deleteExpense(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete expense' }, { status: 500 });
  }
}
