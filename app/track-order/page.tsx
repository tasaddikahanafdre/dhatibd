'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  MapPin,
  Calendar,
  CreditCard
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';

const STATUS_STEPS: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTrack = async (num: string, ph: string) => {
    if (!num || !ph) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: num, phone: ph })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Order not found');
      }

      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to locate order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialNum = searchParams.get('orderNumber');
    const initialPhone = searchParams.get('phone');
    if (initialNum && initialPhone) {
      fetchTrack(initialNum, initialPhone);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrack(orderNumber, phone);
  };

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'Cancelled') return -1;
    return STATUS_STEPS.indexOf(status);
  };

  const currentStep = order ? getStepIndex(order.order_status as OrderStatus) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-black mb-3">
          <Truck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
          Track Your Order
        </h1>
        <p className="text-xs text-neutral-500 mt-2">
          Enter your Order Number and registered mobile number to see live delivery status and tracking details.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-10 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                Order Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DRG-202611-1001"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black uppercase font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                Mobile Number
              </label>
              <input
                type="tel"
                required
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#eb5a00] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#d04f00] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Searching Status...' : 'Track Parcel'}</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Live Order Status Display */}
      {order && (
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs space-y-6">
          
          {/* Header */}
          <div className="bg-neutral-900 text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono text-neutral-400">Order ID: #{order.order_number}</span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Status: <span className="uppercase">{order.order_status}</span>
              </h2>
            </div>
            {order.tracking_number && (
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-neutral-400 block">Courier Tracking ID</span>
                <span className="text-sm font-bold text-white font-mono bg-white/10 px-2.5 py-1 rounded inline-block mt-0.5">
                  {order.tracking_number}
                </span>
              </div>
            )}
          </div>

          {/* Visual Timeline Bar */}
          <div className="px-6 py-4">
            {order.order_status === 'Cancelled' ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-xs">
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <p className="font-bold">This order has been cancelled.</p>
                  <p className="text-neutral-500">Contact our support hotline (09612-000000) for further information or re-ordering.</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center justify-between">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = currentStep >= idx;
                    const isCurrent = currentStep === idx;

                    return (
                      <div key={step} className="flex-1 flex flex-col items-center relative">
                        {/* Connecting Line */}
                        {idx !== 0 && (
                          <div 
                            className={`absolute top-4 -left-1/2 right-1/2 h-1 transition-colors ${
                              currentStep >= idx ? 'bg-black' : 'bg-neutral-200'
                            }`}
                          />
                        )}

                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCompleted
                            ? 'bg-black text-white'
                            : 'bg-neutral-200 text-neutral-400'
                        } ${isCurrent ? 'ring-4 ring-neutral-300' : ''}`}>
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>

                        <span className={`text-[11px] font-semibold mt-2 text-center ${
                          isCompleted ? 'text-black font-bold' : 'text-neutral-400'
                        }`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Order Details Breakdown */}
          <div className="px-6 pb-6 pt-2 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <h3 className="font-bold text-neutral-400 uppercase tracking-wider mb-2">Delivery Information</h3>
              <p className="font-semibold text-neutral-900">{order.customer_name}</p>
              <p className="text-neutral-600">{order.customer_phone}</p>
              <p className="text-neutral-600 mt-1">{order.delivery_address}</p>
              <p className="text-neutral-800 font-medium">{order.area}, {order.district}</p>
            </div>

            <div>
              <h3 className="font-bold text-neutral-400 uppercase tracking-wider mb-2">Payment Summary</h3>
              <p className="font-semibold text-neutral-900">{order.payment_method}</p>
              <p className="text-neutral-600">Payment Status: <strong className="text-black">{order.payment_status}</strong></p>
              <p className="text-neutral-600 mt-2">Subtotal: {formatPrice(order.subtotal)}</p>
              <p className="text-neutral-600">Delivery: {formatPrice(order.delivery_charge)}</p>
              <p className="text-sm font-black text-black mt-1">Total: {formatPrice(order.total)}</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-20 text-center text-sm">Loading order tracker...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
