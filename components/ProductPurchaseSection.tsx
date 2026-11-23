'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap, Heart, Minus, Plus, Truck, ShieldCheck, RefreshCw, Check } from 'lucide-react';
import { Product, ProductVariant, ProductOption } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { useWishlist } from '@/lib/WishlistContext';
import { formatPrice, calculateDiscount } from '@/lib/utils';

// Color map for rendering visual color swatches
const COLOR_MAP: Record<string, string> = {
  black: '#111111',
  'matte black': '#1a1a1a',
  'jet black': '#0a0a0a',
  white: '#ffffff',
  'pearl white': '#f8f9fa',
  silver: '#d1d5db',
  gray: '#6b7280',
  grey: '#6b7280',
  'space gray': '#4b5563',
  red: '#ef4444',
  blue: '#3b82f6',
  'navy blue': '#1e3a8a',
  navy: '#1e3a8a',
  'midnight blue': '#0f172a',
  green: '#10b981',
  'olive green': '#556b2f',
  olive: '#556b2f',
  yellow: '#f59e0b',
  gold: '#d97706',
  orange: '#f97316',
  purple: '#8b5cf6',
  pink: '#ec4899',
  rose: '#f43f5e',
  brown: '#78350f',
  beige: '#f5f5dc',
  cream: '#fffdd0'
};

function getColorHex(colorName: string): string | null {
  if (!colorName) return null;
  const normalized = String(colorName).trim().toLowerCase();
  return COLOR_MAP[normalized] || null;
}

export default function ProductPurchaseSection({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Normalize all option groups: either from product.options or derived from product.variants
  const optionGroups = useMemo<ProductOption[]>(() => {
    if (Array.isArray(product.options) && product.options.length > 0) {
      return product.options;
    }

    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const groupMap = new Map<string, Set<string>>();
      product.variants.forEach(v => {
        const name = (v.variant_name || 'Option').trim();
        const val = (v.variant_value || '').trim();
        if (name && val) {
          if (!groupMap.has(name)) groupMap.set(name, new Set());
          groupMap.get(name)!.add(val);
        }
      });

      return Array.from(groupMap.entries()).map(([name, valSet]) => ({
        name,
        values: Array.from(valSet)
      }));
    }

    return [];
  }, [product.options, product.variants]);

  // Initial state for selected options
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    optionGroups.forEach(og => {
      if (og.values.length > 0) {
        initial[og.name] = og.values[0];
      }
    });
    return initial;
  });

  const [quantity, setQuantity] = useState(1);

  // Find if there is a price adjustment from any matching variant
  const currentPriceAdjustment = useMemo(() => {
    if (!Array.isArray(product.variants) || product.variants.length === 0) return 0;
    let adjustment = 0;
    Object.entries(selectedOptions).forEach(([optName, optVal]) => {
      const match = product.variants?.find(
        v => String(v.variant_name || '').toLowerCase() === String(optName || '').toLowerCase() &&
             String(v.variant_value || '').toLowerCase() === String(optVal || '').toLowerCase()
      );
      if (match && match.price_adjustment) {
        adjustment += Number(match.price_adjustment);
      }
    });
    return adjustment;
  }, [product.variants, selectedOptions]);

  const basePrice = product.price;
  const currentPrice = Math.max(0, basePrice + currentPriceAdjustment);
  const discount = calculateDiscount(currentPrice, product.original_price);
  const inWishlist = isInWishlist(product.id);
  const stockAvailable = product.stock_quantity;
  const isOutOfStock = stockAvailable <= 0;

  const handleSelectOption = (groupName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [groupName]: value
    }));
  };

  const handleAddToCart = () => {
    // Find primary variant if any
    const firstSelectedVal = Object.values(selectedOptions)[0];
    const matchedVariant = product.variants?.find(v => v.variant_value === firstSelectedVal) || null;

    addToCart(
      {
        ...product,
        price: currentPrice
      },
      quantity,
      matchedVariant,
      selectedOptions
    );
  };

  const handleBuyNow = () => {
    const firstSelectedVal = Object.values(selectedOptions)[0];
    const matchedVariant = product.variants?.find(v => v.variant_value === firstSelectedVal) || null;

    addToCart(
      {
        ...product,
        price: currentPrice
      },
      quantity,
      matchedVariant,
      selectedOptions
    );
    router.push('/checkout');
  };

  return (
    <div className="space-y-6">
      {/* Price Block */}
      <div className="border-b border-neutral-100 pb-5">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl sm:text-4xl font-black text-black">
            {formatPrice(currentPrice)}
          </span>
          {product.original_price && product.original_price > currentPrice && (
            <>
              <span className="text-base text-neutral-400 line-through">
                {formatPrice(product.original_price)}
              </span>
              <span className="bg-black text-white text-xs font-bold px-2 py-0.5 rounded">
                Save {discount}%
              </span>
            </>
          )}
        </div>
        <p className="text-[11px] text-neutral-500 mt-1">Inclusive of all taxes in Bangladesh</p>
      </div>

      {/* MULTIPLE OPTION GROUPS (Color, Size, Storage, etc.) */}
      {optionGroups.length > 0 && (
        <div className="space-y-4 border-b border-neutral-100 pb-5">
          {optionGroups.map((group) => {
            const isColorGroup = group.name.toLowerCase().includes('color') || group.name.toLowerCase().includes('colour');
            const selectedVal = selectedOptions[group.name] || group.values[0];

            return (
              <div key={group.name} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-black">
                    {group.name}: <span className="font-semibold text-neutral-600 capitalize">{selectedVal}</span>
                  </span>
                </div>

                {isColorGroup ? (
                  /* Color Swatches / Pills */
                  <div className="flex flex-wrap items-center gap-2">
                    {group.values.map((rawVal) => {
                      const val = String(rawVal);
                      const isSelected = String(selectedVal || '').toLowerCase() === val.toLowerCase();
                      const hex = getColorHex(val);

                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleSelectOption(group.name, val)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#eb5a00] bg-[#eb5a00] text-white shadow-xs'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-[#eb5a00]'
                          }`}
                        >
                          {hex && (
                            <span 
                              className={`w-3.5 h-3.5 rounded-full shrink-0 border ${
                                val.toLowerCase().includes('white') ? 'border-neutral-300' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: hex }}
                            />
                          )}
                          <span>{val}</span>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Size / Storage / Spec Pills */
                  <div className="flex flex-wrap items-center gap-2">
                    {group.values.map((rawVal) => {
                      const val = String(rawVal);
                      const isSelected = String(selectedVal || '').toLowerCase() === val.toLowerCase();

                      // Check for price adjustment label
                      const variantMatch = product.variants?.find(
                        v => String(v.variant_name || '').toLowerCase() === String(group.name || '').toLowerCase() &&
                             String(v.variant_value || '').toLowerCase() === val.toLowerCase()
                      );
                      const adj = variantMatch?.price_adjustment || 0;

                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleSelectOption(group.name, val)}
                          className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#eb5a00] bg-[#eb5a00] text-white shadow-xs'
                              : 'border-neutral-200 bg-white text-neutral-800 hover:border-[#eb5a00]'
                          }`}
                        >
                          <span>{val}</span>
                          {adj !== 0 && (
                            <span className="ml-1 opacity-80 text-[10px]">
                              ({adj > 0 ? `+৳${adj}` : `-৳${Math.abs(adj)}`})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stock Availability */}
      <div className="flex items-center gap-2 text-xs">
        {isOutOfStock ? (
          <span className="inline-flex items-center gap-1.5 text-red-600 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            Currently Out of Stock
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            In Stock ({stockAvailable} units available)
          </span>
        )}
      </div>

      {/* Quantity & Actions */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-neutral-300 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={isOutOfStock || quantity <= 1}
              className="p-3 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-4 text-sm font-bold text-neutral-900 min-w-10 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(stockAvailable, quantity + 1))}
              disabled={isOutOfStock || quantity >= stockAvailable}
              className="p-3 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => toggleWishlist(product)}
            className={`p-3 rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
              inWishlist 
                ? 'border-red-200 bg-red-50 text-red-600' 
                : 'border-neutral-300 text-neutral-600 hover:border-black hover:text-black'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full py-3.5 px-4 bg-white border-2 border-[#eb5a00] text-[#eb5a00] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Bag</span>
          </button>

          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="w-full py-3.5 px-4 bg-[#eb5a00] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#d04f00] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Buy Now (Express)</span>
          </button>
        </div>
      </div>

      {/* Bangladesh Delivery & Guarantee Box */}
      <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50 space-y-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Truck className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-neutral-900">Nationwide Bangladesh Delivery</p>
            <p className="text-neutral-500 text-[11px]">Inside Dhaka: ৳70 (24-48h) | Outside Dhaka: ৳130 (2-4 days)</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-neutral-900">Warranty Protection</p>
            <p className="text-neutral-500 text-[11px]">{product.warranty_info || '1 Year Official Warranty'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <RefreshCw className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-neutral-900">7-Day Return Policy</p>
            <p className="text-neutral-500 text-[11px]">Replacement guaranteed for unboxed manufacturing defects</p>
          </div>
        </div>
      </div>
    </div>
  );
}
