'use client';

import React from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2, Truck } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { formatPrice } from '@/lib/utils';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartCount,
    cartSubtotal,
    freeShippingThreshold,
    freeShippingProgress,
    amountUntilFreeShipping
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <div className="relative w-full max-w-[100vw] sm:max-w-md bg-white h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-200 overflow-x-hidden">
        
        {/* Drawer Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            <h2 className="text-sm sm:text-base font-bold text-black uppercase tracking-tight">Shopping Bag</h2>
            <span className="text-[11px] sm:text-xs bg-[#eb5a00] text-white font-bold px-2 py-0.5 rounded-full">
              {cartCount}
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-neutral-500 hover:text-black rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Progress Indicator */}
        <div className="bg-neutral-50 px-3.5 py-2.5 sm:px-5 sm:py-3 border-b border-neutral-200 shrink-0">
          <div className="text-[11px] sm:text-xs font-medium mb-1.5 flex items-center justify-between gap-1">
            {amountUntilFreeShipping > 0 ? (
              <span className="text-neutral-700 truncate">
                Add <strong className="text-black">{formatPrice(amountUntilFreeShipping)}</strong> more for <strong>FREE Delivery</strong>
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 inline" />
                <span>FREE Delivery Unlocked!</span>
              </span>
            )}
            <span className="text-neutral-500 text-[10px] sm:text-xs font-bold shrink-0">{freeShippingProgress}%</span>
          </div>
          <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#eb5a00] h-full rounded-full transition-all duration-300"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 divide-y divide-neutral-100 overscroll-contain">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
                <ShoppingBag className="w-8 h-8 stroke-1" />
              </div>
              <p className="text-sm font-bold text-neutral-900 mb-1">Your shopping bag is empty</p>
              <p className="text-xs text-neutral-500 mb-6 max-w-xs leading-relaxed">
                Discover our curated tech, lifestyle, clothing and home essentials.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="inline-flex items-center justify-center gap-2 bg-[#eb5a00] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#d04f00] transition-colors shadow-xs"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const pName = item?.product?.name || 'Product';
              const pSlug = item?.product?.slug || 'product';
              const pImage = item?.product?.image_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120';
              const unitPrice = item?.deal_info?.deal_price ?? item?.product?.price ?? 0;

              return (
                <div key={item?.id || Math.random().toString()} className="py-3 sm:py-4 first:pt-0 last:pb-0 flex items-start gap-3 sm:gap-4">
                  {/* Product Thumbnail */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-100 rounded-lg border border-neutral-200 overflow-hidden shrink-0 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pImage}
                      alt={pName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = 'true';
                          target.src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120';
                        }
                      }}
                    />
                  </div>

                  {/* Details Column */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                    <div>
                      <div className="flex justify-between items-start gap-1.5">
                        <Link
                          href={`/product/${pSlug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="text-xs sm:text-sm font-semibold text-neutral-900 hover:text-black line-clamp-2 leading-snug break-words"
                        >
                          {pName}
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-400 hover:text-red-600 transition-colors p-1 -mr-1 shrink-0"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-[11px] text-neutral-500 flex-wrap">
                        <span>{formatPrice(unitPrice)} each</span>
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

                  {/* Quantity Stepper & Item Total */}
                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-neutral-50">
                    <div className="flex items-center border border-neutral-200 rounded-md bg-white">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-30"
                        aria-label="Decrease quantity"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-6 sm:w-8 text-center text-xs font-bold text-neutral-900 select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-black text-black">
                        {formatPrice(unitPrice * (Number(item?.quantity) || 1))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>

        {/* Sticky Drawer Footer with Subtotal & Equal Height Buttons */}
        {cart.length > 0 && (
          <div className="p-3.5 sm:p-5 border-t border-neutral-200 bg-white sm:bg-neutral-50 space-y-3 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))] shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-neutral-600 font-medium">Subtotal</span>
                <span className="text-sm sm:text-base font-black text-black">{formatPrice(cartSubtotal)}</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-neutral-500">
                Delivery calculated during checkout based on your district in Bangladesh.
              </p>
            </div>

            {/* Equal Height Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Link
                href="/cart"
                onClick={() => setIsCartOpen(false)}
                className="h-10 sm:h-11 flex items-center justify-center px-3 border border-[#eb5a00] text-[#eb5a00] bg-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-orange-50 transition-colors text-center"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="h-10 sm:h-11 flex items-center justify-center gap-1.5 px-3 bg-[#eb5a00] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#d04f00] transition-colors text-center shadow-xs"
              >
                <span>Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
