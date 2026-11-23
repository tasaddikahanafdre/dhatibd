import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const orders = await db.getOrders({ search, status });
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Required Bangladesh validation
    if (!body.customer_name || !body.customer_phone || !body.delivery_address || !body.district) {
      return NextResponse.json({
        error: 'Customer name, phone number, delivery address, and district are required'
      }, { status: 400 });
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 });
    }

    // Phone number format validation (Bangladesh 11 digits: 01XXXXXXXXX)
    const cleanPhone = body.customer_phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid mobile number (e.g. 01712345678)' }, { status: 400 });
    }

    const order = await db.createOrder(body);
    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 500 });
  }
}
