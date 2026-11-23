import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Truck, Phone, PackageCheck, AlertCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { formatPrice, formatDate } from '@/lib/utils';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;
  const order = await db.getOrderByIdOrNumber(id);

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="w-16 h-16 bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-200">
          <PackageCheck className="w-8 h-8 text-neutral-500" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">
          Order Summary
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto mt-2">
          Looking for Order <code className="bg-neutral-100 px-2 py-0.5 rounded font-mono text-black font-bold">{id}</code>. Your order has been registered and is being processed by our dispatch center.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/track-order"
            className="w-full sm:w-auto px-6 py-3 bg-[#eb5a00] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#d04f00] transition-colors"
          >
            Track Order Live
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 border border-neutral-300 text-black text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-100 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const deliveryAddress = order.delivery_address || order.shipping_address || 'Address provided';
  const deliveryArea = order.area || order.shipping_city || 'Dhaka';
  const deliveryDistrict = order.district || order.shipping_district || 'Dhaka';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      
      {/* Success Banner */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
          Order Successfully Placed
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight mt-3">
          Thank You, {order.customer_name}!
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mt-2">
          Your order has been recorded. Our customer representative will call you at{' '}
          <strong className="text-black">{order.customer_phone}</strong> to confirm your dispatch.
        </p>
      </div>

      {/* Invoice Card */}
      <div id="invoice-printable" className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden mb-8">
        
        {/* Invoice Header */}
        <div className="bg-neutral-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xl font-black uppercase tracking-tighter">DHATI<span className="text-[#eb5a00]">.</span></span>
            <p className="text-xs text-neutral-400 mt-1">Order #{order.order_number}</p>
          </div>
          <div className="text-left sm:text-right text-xs">
            <span className="inline-block bg-white/20 text-white px-2.5 py-1 rounded font-semibold uppercase text-[10px]">
              {order.order_status}
            </span>
            <p className="text-neutral-400 mt-1.5">{formatDate(order.created_at || new Date().toISOString())}</p>
          </div>
        </div>

        {/* Customer & Shipping Summary */}
        <div className="p-6 sm:p-8 border-b border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <h3 className="font-bold text-neutral-400 uppercase tracking-wider mb-2">Delivery Details</h3>
            <p className="font-bold text-neutral-900 text-sm">{order.customer_name}</p>
            <p className="text-neutral-600 mt-0.5">{order.customer_phone}</p>
            <p className="text-neutral-600 mt-1">{deliveryAddress}</p>
            <p className="text-neutral-900 font-semibold mt-0.5">{deliveryArea}, {deliveryDistrict}</p>
          </div>

          <div>
            <h3 className="font-bold text-neutral-400 uppercase tracking-wider mb-2">Payment Details</h3>
            <p className="font-bold text-neutral-900">{order.payment_method}</p>
            <p className="text-neutral-500 mt-0.5">Status: <strong className="text-neutral-800">{order.payment_status}</strong></p>
            {order.tracking_number && (
              <p className="text-neutral-700 mt-2">
                Tracking No: <span className="font-mono font-bold">{order.tracking_number}</span>
              </p>
            )}
          </div>
        </div>

        {/* Ordered Items Table */}
        <div className="p-6 sm:p-8">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Ordered Products</h3>
          <div className="divide-y divide-neutral-100 text-xs">
            {order.items?.map((item, idx) => {
              const price = Number(item.product_price) || 0;
              const qty = Math.max(1, Number(item.quantity) || 1);
              const subtotal = Number(item.subtotal) || (price * qty);

              return (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.product_name} 
                        className="w-10 h-10 object-cover rounded border border-neutral-200"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <p className="font-semibold text-neutral-900">{item.product_name}</p>
                      <p className="text-neutral-500 text-[11px]">Qty: {qty} × {formatPrice(price)}</p>
                    </div>
                  </div>
                  <span className="font-bold text-neutral-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pricing Breakdown */}
          <div className="mt-6 pt-6 border-t border-neutral-100 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span className="font-semibold text-neutral-900">{formatPrice(order.subtotal)}</span>
            </div>
            {Boolean(order.discount_amount || order.discount) && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount Applied</span>
                <span>-{formatPrice(order.discount_amount || order.discount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-600">
              <span>Delivery Charge ({deliveryDistrict})</span>
              <span className="font-semibold text-neutral-900">
                {order.delivery_charge === 0 ? (
                  <span className="text-emerald-600 font-bold uppercase text-[10px]">FREE</span>
                ) : (
                  formatPrice(order.delivery_charge)
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-black pt-3 border-t border-neutral-200">
              <span>Total Payable Amount</span>
              <span className="text-base">{formatPrice(order.total_amount || order.total || order.subtotal + order.delivery_charge)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer Actions */}
        <div className="p-4 sm:p-6 bg-neutral-50 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <PrintButton />
          
          <div className="flex items-center gap-2">
            <Link
              href="/track-order"
              className="px-4 py-2 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Track Delivery</span>
            </Link>
            <Link
              href="/"
              className="px-4 py-2 border border-neutral-300 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-100 transition-colors flex items-center gap-1.5"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Hotline Notice */}
      <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 sm:p-6 text-center text-xs space-y-1">
        <p className="font-bold text-neutral-800 flex items-center justify-center gap-1.5">
          <Phone className="w-4 h-4 text-neutral-500" />
          <span>Need to modify your delivery address or contact number?</span>
        </p>
        <p className="text-neutral-500">
          Call our priority support line at <strong className="text-black">09612-000000</strong> quoting Order <span className="font-mono font-bold text-black">#{order.order_number}</span>.
        </p>
      </div>

    </div>
  );
}
