'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  Heart, 
  Tag, 
  CheckCircle2,
  MapPin,
  RotateCcw
} from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { useWishlist } from '@/lib/WishlistContext';
import { formatPrice, calculateDiscount } from '@/lib/utils';

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    freeShippingThreshold: contextThreshold,
  } = useCart();

  const { toggleWishlist, isInWishlist } = useWishlist();

  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>(() => cart.map(item => item?.id).filter(Boolean));

  // Sync selectedIds when cart changes
  React.useEffect(() => {
    setSelectedIds(prev => {
      const validIds = cart.map(i => i?.id).filter(Boolean);
      const filtered = prev.filter(id => validIds.includes(id));
      const newIds = validIds.filter(id => !prev.includes(id));
      return [...filtered, ...newIds];
    });
  }, [cart]);

  // Delivery zone selection (Dhaka vs Outside Dhaka)
  const [deliveryZone, setDeliveryZone] = useState<'inside' | 'outside'>('inside');

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; type: 'percent' | 'flat' | 'free_shipping'; value: number } | null>(null);
  const [voucherError, setVoucherError] = useState('');

  // Calculations
  const selectedItems = useMemo(() => {
    return cart.filter(item => item?.id && selectedIds.includes(item.id));
  }, [cart, selectedIds]);

  const selectedCount = selectedItems.reduce((acc, item) => acc + (Number(item?.quantity) || 1), 0);
  const selectedSubtotal = selectedItems.reduce((acc, item) => {
    const p = item?.deal_info?.deal_price ?? item?.product?.price ?? 0;
    const q = Number(item?.quantity) || 1;
    return acc + (Number(p) * q);
  }, 0);

  // Delivery fee calculation
  const freeShippingThreshold = contextThreshold || 3000;
  const isFreeDeliveryQualified = selectedSubtotal >= freeShippingThreshold || appliedVoucher?.type === 'free_shipping';
  const baseShippingFee = deliveryZone === 'inside' ? 70 : 130;
  const shippingFee = selectedCount === 0 ? 0 : (isFreeDeliveryQualified ? 0 : baseShippingFee);

  // Voucher discount calculation
  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.type === 'percent') {
      return Math.round((selectedSubtotal * appliedVoucher.value) / 100);
    }
    if (appliedVoucher.type === 'flat') {
      return Math.min(selectedSubtotal, appliedVoucher.value);
    }
    return 0;
  }, [appliedVoucher, selectedSubtotal]);

  const totalAmount = Math.max(0, selectedSubtotal + shippingFee - voucherDiscount);

  // Selection handlers
  const isAllSelected = cart.length > 0 && selectedIds.length === cart.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cart.map(item => item.id));
    }
  };

  const handleToggleItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Remove ${selectedIds.length} selected item(s) from your cart?`)) {
      selectedIds.forEach(id => removeFromCart(id));
      setSelectedIds([]);
    }
  };

  // Voucher application
  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError('');
    const code = voucherCode.trim().toUpperCase();

    if (!code) {
      setVoucherError('Please enter a voucher code');
      return;
    }

    if (code === 'DHATI10') {
      setAppliedVoucher({ code: 'DHATI10', type: 'percent', value: 10 });
      setVoucherCode('');
    } else if (code === 'DARAZ2026' || code === 'SAVE200' || code === 'DHATI200') {
      setAppliedVoucher({ code, type: 'flat', value: 200 });
      setVoucherCode('');
    } else if (code === 'FREESHIP') {
      setAppliedVoucher({ code: 'FREESHIP', type: 'free_shipping', value: 0 });
      setVoucherCode('');
    } else {
      setVoucherError('Invalid voucher code. Try: DHATI10 or FREESHIP');
    }
  };

  // Hydration guard
  if (!mounted) {
    return (
      <div className="w-full bg-[#f8f8f8] min-h-[75vh] py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 sm:p-10 text-center shadow-xs border border-neutral-200">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400 mb-5 animate-pulse">
            <ShoppingBag className="w-10 h-10 stroke-1 text-neutral-300" />
          </div>
          <div className="h-5 bg-neutral-200 rounded w-1/2 mx-auto mb-3 animate-pulse"></div>
          <div className="h-3 bg-neutral-100 rounded w-2/3 mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Empty Cart State
  if (cart.length === 0) {
    return (
      <div className="w-full bg-[#f8f8f8] min-h-[75vh] py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 sm:p-10 text-center shadow-xs border border-neutral-200">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400 mb-5">
            <ShoppingBag className="w-10 h-10 stroke-1 text-black" />
          </div>
          <h1 className="text-lg sm:text-xl font-black text-black uppercase tracking-tight mb-2">
            Your Shopping Bag is Empty
          </h1>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto mb-6 leading-relaxed">
            Discover our curated electronics, tech gear, lifestyle accessories, and everyday essentials.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 bg-[#eb5a00] text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#d04f00] transition-colors w-full shadow-xs"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f8f8f8] text-black min-h-screen overflow-x-hidden">
      
      {/* =========================================================================
          MOBILE VIEW: Specifically redesigned for mobile phones (320px - 1023px)
          Eliminates horizontal scrolling, oversized images, overflowing controls,
          excessive whitespace, and stacked duplicate cards.
          ========================================================================= */}
      <div className="block lg:hidden px-3 py-3 space-y-3 pb-36 max-w-full">
        
        {/* Mobile Header: Clean Shopping Bag heading + item count badge */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-black shrink-0" />
            <h1 className="text-sm font-bold text-black uppercase tracking-tight">Shopping Bag</h1>
            <span className="text-[10px] bg-black text-white font-bold px-2 py-0.5 rounded-full shrink-0">
              {cart.length}
            </span>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="text-[11px] text-neutral-500 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove ({selectedIds.length})</span>
            </button>
          )}
        </div>

        {/* Free Delivery Progress Indicator (Responsive & Dynamic) */}
        <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium gap-1">
            {isFreeDeliveryQualified ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 inline" />
                <span>FREE Delivery Unlocked!</span>
              </span>
            ) : (
              <span className="text-neutral-700 truncate">
                Add <strong className="text-black">{formatPrice(freeShippingThreshold - selectedSubtotal)}</strong> for <strong>FREE Delivery</strong>
              </span>
            )}
            <span className="text-[10px] font-bold text-neutral-500 shrink-0">
              {Math.min(100, Math.round((selectedSubtotal / freeShippingThreshold) * 100))}%
            </span>
          </div>
          <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-black h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (selectedSubtotal / freeShippingThreshold) * 100)}%` }}
            />
          </div>
        </div>

        {/* Mobile Select All Bar */}
        <div className="bg-white px-3 py-2.5 rounded-xl border border-neutral-200 shadow-xs flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-0 cursor-pointer accent-black shrink-0"
            />
            <span className="text-[11px] font-bold uppercase tracking-wider text-black">
              Select All ({cart.length})
            </span>
          </label>
          <span className="text-[10px] text-neutral-400 font-medium">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Mobile Product Items List (Compact & Perfectly Contained) */}
        <div className="space-y-2.5">
          {cart.map((item, idx) => {
            const isChecked = selectedIds.includes(item?.id);
            const pPrice = Number(item?.product?.price) || 0;
            const pOrig = Number(item?.product?.original_price) || 0;
            const pName = item?.product?.name || 'Product';
            const pSlug = item?.product?.slug || 'product';
            const pImage = item?.product?.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200';
            const qty = Math.max(1, Number(item?.quantity) || 1);
            const discount = calculateDiscount(pPrice, pOrig);
            const itemTotal = pPrice * qty;

            return (
              <div 
                key={item?.id || idx} 
                className={`bg-white rounded-xl border border-neutral-200 p-2.5 shadow-xs transition-colors overflow-hidden ${
                  isChecked ? 'border-neutral-300' : 'opacity-85'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Checkbox */}
                  <div className="pt-1 shrink-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleItem(item.id)}
                      className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-0 cursor-pointer accent-black"
                    />
                  </div>

                  {/* Thumbnail (Proportionate, no overflow) */}
                  <Link 
                    href={`/product/${pSlug}`} 
                    className="w-16 h-16 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 relative"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pImage}
                      alt={pName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = 'true';
                          target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200';
                        }
                      }}
                    />
                  </Link>

                  {/* Product Details Column */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <Link
                          href={`/product/${pSlug}`}
                          className="text-xs font-semibold text-neutral-900 leading-snug line-clamp-2 break-words hover:text-black"
                        >
                          {pName}
                        </Link>
                        
                        {/* Remove Icon */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-400 hover:text-red-600 p-0.5 -mr-0.5 shrink-0 transition-colors"
                          aria-label={`Remove ${pName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Variant and Unit Price */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-neutral-500 mt-0.5">
                        <span className="font-semibold text-neutral-800">{formatPrice(pPrice)}</span>
                        {pOrig > pPrice && (
                          <span className="line-through text-neutral-400">{formatPrice(pOrig)}</span>
                        )}
                        {discount > 0 && (
                          <span className="font-bold text-black border border-black px-1 rounded text-[8px]">
                            -{discount}%
                          </span>
                        )}
                        {item?.variant && (
                          <>
                            <span>•</span>
                            <span className="text-neutral-700 font-medium">
                              {item.variant.variant_name || 'Option'}: {item.variant.variant_value || ''}
                            </span>
                          </>
                        )}
                        {item?.selected_options && Object.keys(item.selected_options).length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-neutral-700 font-medium">
                              {Object.entries(item.selected_options).map(([k, v]) => `${k}: ${v}`).join(' / ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stepper + Item Total Row */}
                    <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-neutral-100">
                      {/* Stepper (Compact & contained) */}
                      <div className="flex items-center border border-neutral-200 rounded-md bg-white shrink-0">
                        <button
                          onClick={() => updateQuantity(item.id, qty - 1)}
                          disabled={qty <= 1}
                          className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-neutral-900 select-none">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, qty + 1)}
                          className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <span className="text-xs font-black text-black">
                          {formatPrice(itemTotal)}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Delivery Destination Selection */}
        <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs flex items-center justify-between text-xs">
          <span className="text-[11px] font-bold text-neutral-800 flex items-center gap-1.5 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-black" />
            <span>Delivery:</span>
          </span>
          <div className="flex bg-neutral-100 p-0.5 rounded-lg text-[10px] font-semibold">
            <button
              type="button"
              onClick={() => setDeliveryZone('inside')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                deliveryZone === 'inside'
                  ? 'bg-black text-white shadow-xs font-bold'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Inside Dhaka (৳70)
            </button>
            <button
              type="button"
              onClick={() => setDeliveryZone('outside')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                deliveryZone === 'outside'
                  ? 'bg-black text-white shadow-xs font-bold'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Outside (৳130)
            </button>
          </div>
        </div>

        {/* Mobile Cart Summary Section */}
        <div className="bg-white rounded-xl border border-neutral-200 p-3.5 shadow-xs space-y-2 text-xs">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-black pb-1.5 border-b border-neutral-100">
            Order Summary
          </h3>
          <div className="flex justify-between text-neutral-600 text-[11px]">
            <span>Subtotal ({selectedCount} item{selectedCount !== 1 ? 's' : ''})</span>
            <span className="font-bold text-black">{formatPrice(selectedSubtotal)}</span>
          </div>

          <div className="flex justify-between items-center text-neutral-600 text-[11px]">
            <span>Delivery Charge ({deliveryZone === 'inside' ? 'Dhaka' : 'Nationwide'})</span>
            <span className="font-semibold text-neutral-900">
              {shippingFee === 0 ? (
                <span className="text-emerald-600 font-bold">FREE</span>
              ) : (
                formatPrice(shippingFee)
              )}
            </span>
          </div>

          {voucherDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 text-[11px]">
              <span>Voucher Discount</span>
              <span className="font-semibold">-{formatPrice(voucherDiscount)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline">
            <span className="font-bold text-xs uppercase text-neutral-900">Total Payable</span>
            <span className="text-base font-black text-black">{formatPrice(totalAmount)}</span>
          </div>
        </div>

        {/* Mobile Sticky Checkout Section (Equal Height Buttons & Proper Safe-Area Spacing) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl">
          <div className="flex items-center justify-between pb-2 text-xs">
            <span className="text-[11px] text-neutral-500">
              Total ({selectedCount} item{selectedCount !== 1 ? 's' : ''}):
            </span>
            <span className="text-base font-black text-black">
              {formatPrice(totalAmount)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/shop"
              className="h-11 flex items-center justify-center px-3 border border-black text-black bg-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 transition-colors text-center"
            >
              Continue Shopping
            </Link>
            <Link
              href={selectedCount > 0 ? '/checkout' : '#'}
              className={`h-11 flex items-center justify-center gap-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors text-center shadow-md ${
                selectedCount > 0
                  ? 'bg-[#eb5a00] text-white hover:bg-[#d04f00] active:scale-98'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed pointer-events-none'
              }`}
            >
              <span>Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>


      {/* =========================================================================
          DESKTOP & TABLET VIEW (100% UNCHANGED AND PRESERVED EXACTLY AS BEFORE)
          Visible on lg: screens and above. Desktop layout, dimensions, spacing,
          sidebar, cards, and typography are strictly untouched.
          ========================================================================= */}
      <div className="hidden lg:block py-8 pb-12">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 space-y-4">
          
          {/* Breadcrumb & Top notice */}
          <div className="flex items-center justify-between text-xs text-neutral-500 pb-1">
            <div className="flex items-center gap-1.5">
              <Link href="/" className="hover:text-black">Home</Link>
              <span>/</span>
              <span className="text-black font-semibold">Shopping Cart</span>
            </div>
            <span className="text-neutral-500 text-[11px]">
              {cart.length} item{cart.length > 1 ? 's' : ''} in cart
            </span>
          </div>

          {/* Free Shipping Progress Banner (Desktop) */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                {isFreeDeliveryQualified ? (
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>You have unlocked FREE Shipping!</span>
                  </p>
                ) : (
                  <p className="text-xs text-neutral-800 font-medium">
                    Add <strong>{formatPrice(freeShippingThreshold - selectedSubtotal)}</strong> more of eligible items to enjoy <strong>FREE Shipping</strong>!
                  </p>
                )}
              </div>
            </div>

            <div className="w-48 bg-neutral-100 h-2 rounded-full overflow-hidden shrink-0">
              <div 
                className="bg-black h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (selectedSubtotal / freeShippingThreshold) * 100)}%` }}
              />
            </div>
          </div>

          {/* Main Desktop Grid */}
          <div className="grid grid-cols-12 gap-5 items-start">
            
            {/* LEFT: Cart Items (8 cols on lg) */}
            <div className="col-span-8 space-y-3">
              
              {/* Top Bulk Select Bar */}
              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold uppercase tracking-wider select-none">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-0 cursor-pointer accent-black"
                  />
                  <span>SELECT ALL ({cart.length} ITEMS)</span>
                </label>

                {selectedIds.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="text-xs text-neutral-500 hover:text-red-600 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>DELETE ({selectedIds.length})</span>
                  </button>
                )}
              </div>

              {/* Store Card */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
                
                {/* Store Header */}
                <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/60">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-0 cursor-pointer accent-black"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-[#eb5a00] text-white text-[9px] font-black uppercase tracking-wider rounded">
                        DHATI MALL
                      </span>
                      <span className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                        Dhati Official Store
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 inline" />
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] text-neutral-500">
                    Standard Delivery Guaranteed
                  </span>
                </div>

                {/* Items List */}
                <div className="divide-y divide-neutral-100">
                  {cart.map((item, idx) => {
                    const isChecked = selectedIds.includes(item?.id);
                    const pPrice = Number(item?.product?.price) || 0;
                    const pOrig = Number(item?.product?.original_price) || 0;
                    const pName = item?.product?.name || 'Product';
                    const pSlug = item?.product?.slug || 'product';
                    const pImage = item?.product?.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200';
                    const qty = Math.max(1, Number(item?.quantity) || 1);
                    const discount = calculateDiscount(pPrice, pOrig);
                    const inWish = item?.product?.id ? isInWishlist(item.product.id) : false;

                    return (
                      <div key={item?.id || idx} className="p-5 flex items-start gap-4 hover:bg-neutral-50/40 transition-colors">
                        {/* Checkbox */}
                        <div className="pt-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleItem(item.id)}
                            className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-0 cursor-pointer accent-black"
                          />
                        </div>

                        {/* Product Thumbnail */}
                        <Link 
                          href={`/product/${pSlug}`} 
                          className="w-24 h-24 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 relative group"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={pImage}
                            alt={pName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.fallback) {
                                target.dataset.fallback = 'true';
                                target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200';
                              }
                            }}
                          />
                        </Link>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                          <div className="space-y-1">
                            <Link
                              href={`/product/${pSlug}`}
                              className="text-sm font-semibold text-neutral-900 hover:text-black line-clamp-2 leading-snug"
                            >
                              {pName}
                            </Link>

                            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                              {item?.product?.category && (
                                <span className="uppercase">
                                  {typeof item.product.category === 'object' ? item.product.category.name : String(item.product.category)}
                                </span>
                              )}
                              {item?.variant && (
                                <>
                                  <span>•</span>
                                  <span className="bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded text-[10px]">
                                    {item.variant.variant_name || 'Option'}: {item.variant.variant_value || ''}
                                  </span>
                                </>
                              )}
                              {item?.selected_options && Object.keys(item.selected_options).length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded text-[10px]">
                                    {Object.entries(item.selected_options).map(([k, v]) => `${k}: ${v}`).join(' / ')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Price & Actions Row */}
                          <div className="pt-2 flex items-end justify-between gap-3">
                            <div>
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-base font-black text-black">
                                  {formatPrice(pPrice)}
                                </span>
                                {pOrig > pPrice && (
                                  <span className="text-xs text-neutral-400 line-through">
                                    {formatPrice(pOrig)}
                                  </span>
                                )}
                                {discount > 0 && (
                                  <span className="text-[10px] font-bold text-black border border-black px-1 rounded">
                                    -{discount}%
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-400">
                                Item total: {formatPrice(pPrice * qty)}
                              </span>
                            </div>

                            {/* Quantity Counter + Action Icons */}
                            <div className="flex items-center gap-3">
                              {item?.product && (
                                <button
                                  onClick={() => toggleWishlist(item.product)}
                                  className={`p-1.5 rounded-full hover:bg-neutral-100 transition-colors ${
                                    inWish ? 'text-red-500' : 'text-neutral-400 hover:text-black'
                                  }`}
                                  title={inWish ? 'Saved in wishlist' : 'Save for later'}
                                >
                                  <Heart className={`w-4 h-4 ${inWish ? 'fill-current' : ''}`} />
                                </button>
                              )}

                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-1.5 text-neutral-400 hover:text-red-600 rounded-full hover:bg-neutral-100 transition-colors"
                                title="Delete item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden bg-white">
                                <button
                                  onClick={() => updateQuantity(item.id, qty - 1)}
                                  disabled={qty <= 1}
                                  className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-10 text-center text-xs font-bold text-neutral-900 select-none">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, qty + 1)}
                                  className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-1">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>CONTINUE SHOPPING</span>
                </Link>
              </div>

            </div>

            {/* RIGHT: Order Summary Sidebar (4 cols on lg) */}
            <div className="col-span-4 space-y-4">
              
              {/* Delivery Location Box */}
              <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Delivery Destination</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">Bangladesh</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDeliveryZone('inside')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      deliveryZone === 'inside'
                        ? 'border-black bg-neutral-900 text-white font-bold'
                        : 'border-neutral-200 hover:border-neutral-400 text-neutral-700'
                    }`}
                  >
                    <p className="text-[11px] leading-tight">Inside Dhaka</p>
                    <p className="text-[10px] opacity-75 mt-0.5">৳70 • 24-48h</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryZone('outside')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      deliveryZone === 'outside'
                        ? 'border-black bg-neutral-900 text-white font-bold'
                        : 'border-neutral-200 hover:border-neutral-400 text-neutral-700'
                    }`}
                  >
                    <p className="text-[11px] leading-tight">Outside Dhaka</p>
                    <p className="text-[10px] opacity-75 mt-0.5">৳130 • 2-4 Days</p>
                  </button>
                </div>
              </div>

              {/* Voucher Box */}
              <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Dhati Voucher</span>
                  </span>
                </div>

                {appliedVoucher ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-800">{appliedVoucher.code}</span>
                      <span className="text-emerald-700 text-[11px] block">
                        {appliedVoucher.type === 'percent' && `10% Discount (-${formatPrice(voucherDiscount)})`}
                        {appliedVoucher.type === 'flat' && `৳200 Flat Discount Applied`}
                        {appliedVoucher.type === 'free_shipping' && `Free Shipping Applied`}
                      </span>
                    </div>
                    <button
                      onClick={() => setAppliedVoucher(null)}
                      className="text-xs text-red-600 font-semibold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyVoucher} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter Voucher Code"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        className="flex-1 p-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs uppercase placeholder-neutral-400 focus:outline-hidden focus:border-black"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#eb5a00] text-white text-xs font-bold uppercase rounded-lg hover:bg-[#d04f00] transition-colors shrink-0"
                      >
                        APPLY
                      </button>
                    </div>
                    {voucherError && (
                      <p className="text-[11px] text-red-600 font-medium">{voucherError}</p>
                    )}
                    <p className="text-[10px] text-neutral-400">
                      Try voucher: <strong className="text-neutral-700">DHATI10</strong> or <strong className="text-neutral-700">FREESHIP</strong>
                    </p>
                  </form>
                )}
              </div>

              {/* Order Summary Card */}
              <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs space-y-4">
                <h2 className="text-xs font-black uppercase tracking-wider text-black pb-3 border-b border-neutral-100">
                  Order Summary
                </h2>

                <div className="space-y-2.5 text-xs text-neutral-600">
                  <div className="flex justify-between items-center">
                    <span>Subtotal ({selectedCount} item{selectedCount !== 1 ? 's' : ''})</span>
                    <span className="font-bold text-black">{formatPrice(selectedSubtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Shipping Fee</span>
                    <span className="font-semibold text-neutral-900">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        formatPrice(shippingFee)
                      )}
                    </span>
                  </div>

                  {isFreeDeliveryQualified && shippingFee === 0 && selectedCount > 0 && (
                    <div className="flex justify-between items-center text-[11px] text-emerald-600">
                      <span>Shipping Fee Discount</span>
                      <span>-{formatPrice(baseShippingFee)}</span>
                    </div>
                  )}

                  {voucherDiscount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 font-semibold">
                      <span>Voucher Discount</span>
                      <span>-{formatPrice(voucherDiscount)}</span>
                    </div>
                  )}
                </div>

                {/* Total Row */}
                <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                  <span className="text-sm font-black text-black uppercase tracking-tight">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-black">
                      {formatPrice(totalAmount)}
                    </span>
                    <p className="text-[10px] text-neutral-400">VAT & Taxes included</p>
                  </div>
                </div>

                {/* Desktop Checkout CTA */}
                <Link
                  href={selectedCount > 0 ? '/checkout' : '#'}
                  className={`w-full py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xs ${
                    selectedCount > 0
                      ? 'bg-[#eb5a00] text-white hover:bg-[#d04f00]'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed pointer-events-none'
                  }`}
                >
                  <span>PROCEED TO CHECKOUT ({selectedCount})</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Daraz-Style Trust Badges */}
              <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3 text-[11px] text-neutral-600">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-neutral-800 shrink-0" />
                  <span><strong>100% Authentic</strong> Guaranteed Products</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-neutral-800 shrink-0" />
                  <span><strong>7 Days Easy Return</strong> with Full Refund</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-neutral-800 shrink-0" />
                  <span><strong>Cash on Delivery (COD)</strong> Available Nationwide</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
