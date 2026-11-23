'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone
} from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { BANGLADESH_DISTRICTS } from '@/lib/bangladeshDistricts';
import { formatPrice } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [area, setArea] = useState('Dhanmondi');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod] = useState<'Cash on Delivery'>('Cash on Delivery');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    coupon_id: string;
    code: string;
    discount_amount: number;
    discount_type: string;
    discount_value: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected district options with safe fallback
  const selectedDistrictData = BANGLADESH_DISTRICTS.find(d => d.name === district) || BANGLADESH_DISTRICTS[0] || {
    name: 'Dhaka',
    isDhaka: true,
    areas: ['Dhanmondi']
  };

  // When district changes, update area to first area
  useEffect(() => {
    if (selectedDistrictData?.areas && selectedDistrictData.areas.length > 0) {
      setArea(selectedDistrictData.areas[0]);
    }
  }, [district]);

  // Handle Apply Coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          subtotal: cartSubtotal,
          items: cart
        })
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.message || 'Invalid coupon code');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          coupon_id: data.coupon_id,
          code: data.code,
          discount_amount: data.discount_amount,
          discount_type: data.discount_type,
          discount_value: data.discount_value
        });
        setCouponInput('');
        setCouponError('');
      }
    } catch {
      setCouponError('Network error checking coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  // Calculate delivery charge & totals safely
  const isDhaka = Boolean(selectedDistrictData?.isDhaka);
  const safeSubtotal = Number(cartSubtotal) || 0;
  const isFreeDhakaShipping = isDhaka && safeSubtotal >= 3000;
  const deliveryCharge = isFreeDhakaShipping ? 0 : (isDhaka ? 60 : 120);
  const discountTotal = appliedCoupon ? (Number(appliedCoupon.discount_amount) || 0) : 0;
  const finalTotal = Math.max(0, safeSubtotal - discountTotal) + deliveryCharge;

  if (!mounted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-neutral-100 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold mb-3">Your cart is empty</h1>
        <p className="text-xs text-neutral-500 mb-6">Add items to your cart before proceeding to checkout.</p>
        <Link href="/shop" className="inline-block bg-[#eb5a00] text-white text-xs font-semibold px-5 py-2.5 rounded hover:bg-[#d04f00] transition-colors">
          Go to Shop
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 11) {
      setErrorMessage('Please enter a valid 11-digit mobile number (e.g. 01712345678)');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Please provide your detailed delivery address');
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        customer_name: fullName.trim(),
        customer_phone: cleanPhone,
        customer_email: email.trim() || null,
        delivery_address: address.trim(),
        district,
        area,
        notes: notes.trim() || null,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Pending',
        delivery_charge: deliveryCharge,
        subtotal: cartSubtotal,
        discount_amount: discountTotal,
        total_amount: finalTotal,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        items: cart.map(item => {
          const unitPrice = item?.deal_info?.deal_price ?? item?.product?.price ?? 0;
          const optionsText = item?.selected_options && Object.keys(item.selected_options).length > 0
            ? Object.entries(item.selected_options).map(([k, v]) => `${k}: ${v}`).join(', ')
            : (item?.variant ? `${item.variant.variant_name || 'Option'}: ${item.variant.variant_value || ''}` : null);
          const dealNote = item?.deal_info ? `[Deal: ${item.deal_info.deal_title}]` : null;
          const combinedDetails = [dealNote, optionsText].filter(Boolean).join(' | ');

          return {
            product_id: item?.product?.id || '',
            product_name: item?.product?.name || 'Product',
            product_price: Number(unitPrice) || 0,
            quantity: Math.max(1, Number(item?.quantity) || 1),
            subtotal: (Number(unitPrice) || 0) * Math.max(1, Number(item?.quantity) || 1),
            product_sku: item?.product?.sku || null,
            variant_details: combinedDetails || null,
            image_url: item?.product?.image_url || ''
          };
        })
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      clearCart();
      router.push(`/order-confirmation/${data.id || data.order_number}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong while placing your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="pb-6 border-b border-neutral-200 mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
          Express Checkout
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Fast and reliable delivery across all 64 districts in Bangladesh
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left 2 Cols: Customer & Shipping Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Customer Information Block */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider pb-3 border-b border-neutral-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">1</span>
              <span>Customer Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Hossain"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">Order verification code will be sent via SMS</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Delivery Address Block (Bangladesh Specific) */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider pb-3 border-b border-neutral-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">2</span>
              <span>Delivery Address (Bangladesh)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                  District <span className="text-red-500">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                >
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} {d.isDhaka ? '(Inside Dhaka - ৳60)' : '(Outside Dhaka - ৳120)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                  Thana / Area <span className="text-red-500">*</span>
                </label>
                {selectedDistrictData.areas.length > 0 ? (
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                  >
                    {selectedDistrictData.areas.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Enter Thana / Sub-district"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                Full Street Address, House & Flat No. <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="House #, Road #, Sector/Block, Landmark details..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                Special Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Call before delivery, deliver after 3 PM"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Payment Method Block (COD Only) */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider pb-3 border-b border-neutral-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">3</span>
              <span>Payment Method</span>
            </h2>

            <div className="space-y-3">
              {/* Cash on Delivery Only */}
              <div className="flex items-start gap-3.5 p-4 rounded-xl border border-black bg-neutral-50 ring-1 ring-black">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  checked={true}
                  readOnly
                  className="mt-0.5 text-black focus:ring-0 accent-black cursor-default"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-neutral-800" />
                    <span className="text-xs font-bold text-neutral-900">Cash on Delivery (COD)</span>
                    <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      ONLY PAYMENT METHOD
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    Pay securely with cash upon delivery when the courier hands your parcel to you at your doorstep. No advance payment required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Order Breakdown & Confirm Button */}
        <div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 space-y-4 sticky top-24">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider pb-3 border-b border-neutral-200">
              Items in Your Order ({cart.length})
            </h2>

            {/* Items preview */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-neutral-200 text-xs">
              {cart.map((item, idx) => {
                const unitPrice = item?.deal_info?.deal_price ?? item?.product?.price ?? 0;
                const isDeal = Boolean(item?.deal_info);
                const pName = item?.product?.name || 'Selected Product';
                const pImage = item?.product?.image_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=80';
                const qty = Math.max(1, Number(item?.quantity) || 1);

                return (
                  <div key={item?.id || idx} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                    <img
                      src={pImage}
                      alt={pName}
                      className="w-10 h-10 object-cover rounded border border-neutral-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-neutral-900 truncate">{pName}</p>
                      </div>
                      {item?.selected_options && Object.keys(item.selected_options).length > 0 && (
                        <p className="text-[10px] text-neutral-500 font-medium">
                          {Object.entries(item.selected_options).map(([k, v]) => `${k}: ${v}`).join(' / ')}
                        </p>
                      )}
                      {isDeal && (
                        <span className="inline-block text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.2 my-0.5">
                          {item.deal_info?.discount_text || 'Deal Price'}
                        </span>
                      )}
                      <p className="text-[11px] text-neutral-500">
                        Qty: {qty} × {formatPrice(unitPrice)}
                        {isDeal && item?.product?.price && (
                          <span className="line-through text-neutral-400 ml-1.5">
                            {formatPrice(item.product.price)}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="font-bold text-neutral-900 shrink-0">
                      {formatPrice(unitPrice * qty)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code Section */}
            <div className="border-t border-neutral-200 pt-3">
              {appliedCoupon ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <span>Coupon: {appliedCoupon.code}</span>
                      <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded font-black">
                        -{appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `৳${appliedCoupon.discount_value}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Discount applied: {formatPrice(appliedCoupon.discount_amount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-semibold text-red-600 hover:text-red-800 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon / Promo code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 text-xs px-3 py-2 bg-white border border-neutral-300 rounded-lg placeholder:text-neutral-400 uppercase font-mono tracking-wider focus:outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="px-4 py-2 bg-[#eb5a00] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#d04f00] disabled:opacity-40 transition-colors shrink-0"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-red-600 font-medium">{couponError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-neutral-200 pt-3 space-y-2 text-xs text-neutral-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-black">{formatPrice(cartSubtotal)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span>- {formatPrice(appliedCoupon.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge ({district})</span>
                <span className="font-semibold text-black">
                  {isFreeDhakaShipping ? <span className="text-emerald-700 font-bold">FREE</span> : formatPrice(deliveryCharge)}
                </span>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-bold text-black">Total Amount</span>
              <span className="text-2xl font-black text-black">{formatPrice(finalTotal)}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#eb5a00] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#d04f00] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Placing Your Order...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Order ({formatPrice(finalTotal)})</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-neutral-500">
                By placing this order, you agree to Dhati&apos;s Terms and Return Policy.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
