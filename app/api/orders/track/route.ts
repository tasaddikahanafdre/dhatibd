import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, phone } = await request.json();

    if (!orderNumber || !phone) {
      return NextResponse.json({ error: 'Order Number and Phone Number are required' }, { status: 400 });
    }

    const order = await db.trackOrder(orderNumber, phone);
    if (!order) {
      return NextResponse.json({
        error: 'No order found matching this order number and phone number. Please verify your details.'
      }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Tracking error' }, { status: 500 });
  }
}
