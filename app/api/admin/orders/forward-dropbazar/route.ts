import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Order } from '@/lib/types';

const DROPBAZAR_TOKEN = process.env.DROPBAZAR_API_TOKEN || '358|Fs3xffDFx95FYF2Ccv1RH3XlWQfinlZhArQuR5kbf8e1d62f';
const DROPBAZAR_API_URL = 'https://www.dropbazarbd.com/api/v1/orders';

interface ForwardResult {
  order_id: string;
  order_number: string;
  success: boolean;
  dropbazar_order_id?: number | string;
  dropbazar_order_number?: string;
  error?: string;
}

async function forwardSingleOrder(order: Order, products: any[]): Promise<ForwardResult> {
  const customerName = order.customer_name || 'Customer';
  const customerPhone = order.customer_phone || '';
  const deliveryAddress = order.delivery_address || order.shipping_address || 'Dhaka';
  const district = order.district || order.shipping_district || 'Dhaka';

  const cartItems: any[] = [];

  for (const item of (order.items || [])) {
    // Determine supplier product ID
    let supplierProdId: number | null = null;
    const prod = products.find(p => p.id === item.product_id);

    if (prod && prod.supplier_product_id) {
      supplierProdId = Number(prod.supplier_product_id);
    } else if (item.product_id && item.product_id.startsWith('prod-db-')) {
      const parsed = parseInt(item.product_id.replace('prod-db-', ''), 10);
      if (!isNaN(parsed)) supplierProdId = parsed;
    } else if (item.product_sku && item.product_sku.startsWith('DB-')) {
      const match = item.product_sku.match(/DB-(\d+)/);
      if (match) supplierProdId = parseInt(match[1], 10);
    }

    if (!supplierProdId) {
      // Default to first available fashion item ID if unavailable
      supplierProdId = 4653;
    }

    // Determine variant (size)
    let sizeAttr = 'Free Size';
    const anyItem = item as any;
    if (anyItem.selected_options?.['Size']) {
      sizeAttr = anyItem.selected_options['Size'];
    } else if (anyItem.variant?.attributes?.Size) {
      sizeAttr = anyItem.variant.attributes.Size;
    } else if (anyItem.variant?.name) {
      sizeAttr = anyItem.variant.name;
    } else if (anyItem.variant?.variant_value) {
      sizeAttr = anyItem.variant.variant_value;
    }

    cartItems.push({
      product_id: supplierProdId,
      quantity: item.quantity || 1,
      variant: [sizeAttr]
    });
  }

  if (cartItems.length === 0) {
    return {
      order_id: order.id,
      order_number: order.order_number,
      success: false,
      error: 'Order has no valid line items'
    };
  }

  const payload = {
    shipping_name: customerName,
    shipping_phone: customerPhone,
    shipping_address: deliveryAddress,
    district: district,
    cart_items: cartItems,
    reseller_note: `Dhati Store Order #${order.order_number}`
  };

  try {
    const response = await fetch(DROPBAZAR_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBAZAR_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Dhati-Store-Integration/1.0'
      },
      body: JSON.stringify(payload)
    });

    const resData = await response.json().catch(() => null);

    if (response.ok && resData && resData.success) {
      const dbOrder = resData.data;
      const dropbazarId = dbOrder?.id;
      const dropbazarOrderNum = dbOrder?.order_number;

      // Update our database record
      await db.updateOrderStatus(
        order.id,
        'Processing',
        dropbazarOrderNum ? `DB-${dropbazarOrderNum}` : order.tracking_number || null
      );

      // Save custom dropbazar metadata on order
      const allOrders = await db.getOrders();
      const target = allOrders.find(o => o.id === order.id);
      if (target) {
        target.dropbazar_order_id = dropbazarId;
        target.dropbazar_order_number = dropbazarOrderNum;
        target.dropbazar_status = 'placed';
        target.dropbazar_forwarded_at = new Date().toISOString();
        const store = await (db as any).loadDataAsync?.();
        if (store) {
          const idx = store.orders.findIndex((o: any) => o.id === order.id);
          if (idx !== -1) {
            store.orders[idx] = { ...store.orders[idx], ...target };
            await (db as any).saveDataAsync?.(store);
          }
        }
      }

      return {
        order_id: order.id,
        order_number: order.order_number,
        success: true,
        dropbazar_order_id: dropbazarId,
        dropbazar_order_number: dropbazarOrderNum
      };
    } else {
      const errMsg = resData?.message || `DropBazar HTTP ${response.status}`;
      return {
        order_id: order.id,
        order_number: order.order_number,
        success: false,
        error: errMsg
      };
    }
  } catch (err: any) {
    return {
      order_id: order.id,
      order_number: order.order_number,
      success: false,
      error: err.message || 'Network error forwarding to DropBazar'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = body.order_id;
    const orderIds: string[] = Array.isArray(body.order_ids) ? body.order_ids : (orderId ? [orderId] : []);

    if (orderIds.length === 0) {
      return NextResponse.json({ error: 'Please provide order_id or order_ids array' }, { status: 400 });
    }

    const allOrders = await db.getOrders();
    const store = await (db as any).loadDataAsync?.() || { products: [] };
    const products = store.products || [];

    const results: ForwardResult[] = [];

    for (const id of orderIds) {
      const order = allOrders.find(o => o.id === id || o.order_number === id);
      if (!order) {
        results.push({
          order_id: id,
          order_number: id,
          success: false,
          error: 'Order not found in store database'
        });
        continue;
      }

      const res = await forwardSingleOrder(order, products);
      results.push(res);
    }

    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: failed.length === 0,
      total_processed: results.length,
      succeeded_count: succeeded.length,
      failed_count: failed.length,
      results
    });
  } catch (err: any) {
    console.error('DropBazar Forward API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
