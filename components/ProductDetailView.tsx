'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Zap, 
  Heart, 
  Minus, 
  Plus, 
  Truck, 
  ShieldCheck, 
  RefreshCw, 
  Check, 
  ChevronRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Product, ProductVariant, ProductOption } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { useWishlist } from '@/lib/WishlistContext';
import { formatPrice, calculateDiscount } from '@/lib/utils';

// Standard Bengali & English color names to hex mapping for swatches
const COLOR_MAP: Record<string, string> = {
  black: '#111111',
  'কালো': '#111111',
  white: '#ffffff',
  'সাদা': '#ffffff',
  red: '#dc2626',
  'লাল': '#dc2626',
  maroon: '#831843',
  'মেরুন': '#831843',
  blue: '#2563eb',
  'নীল': '#2563eb',
  navy: '#1e3a8a',
  'নেভি': '#1e3a8a',
  'নেভি ব্লু': '#1e3a8a',
  green: '#16a34a',
  'সবুজ': '#16a34a',
  olive: '#556b2f',
  'অলিভ': '#556b2f',
  yellow: '#ca8a04',
  'হলুদ': '#ca8a04',
  orange: '#ea580c',
  'কমলা': '#ea580c',
  pink: '#db2777',
  'গোলাপি': '#db2777',
  purple: '#9333ea',
  'বেগুনী': '#9333ea',
  grey: '#4b5563',
  gray: '#4b5563',
  'ধূসর': '#4b5563',
  brown: '#78350f',
  'বাদামী': '#78350f',
  beige: '#d6c5ad',
  'অফ হোয়াইট': '#faf8f5',
  'off white': '#faf8f5',
};

function getColorHex(colorName: string): string | null {
  if (!colorName) return null;
  const norm = String(colorName).trim().toLowerCase();
  return COLOR_MAP[norm] || null;
}

interface ProductDetailViewProps {
  product: Product;
}

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Prepare images list with explicit variant/version labels
  const allImages = useMemo(() => {
    const list: Array<{ id?: string; image_url: string; alt_text?: string | null; variant_value?: string }> = [];
    if (product.images && product.images.length > 0) {
      product.images.forEach((img, idx) => {
        const url = (img as any)?.image_url || (img as any)?.url;
        if (url && typeof url === 'string') {
          list.push({
            ...img,
            image_url: url,
            variant_value: `Color ${idx + 1}`
          });
        }
      });
    }
    if (list.length === 0 && product.image_url) {
      list.push({
        image_url: product.image_url,
        alt_text: product.name,
        variant_value: 'Standard'
      });
    }

    // Also include any variant-specific images not already in the list
    if (product.variants) {
      product.variants.forEach(v => {
        const vImg = v.image_url || (v as any)?.image;
        const vVal = String(v.variant_value || (v as any)?.name || '');
        if (vImg && !list.some(img => img.image_url === vImg)) {
          list.push({
            image_url: vImg,
            alt_text: `${product.name} - ${vVal}`,
            variant_value: vVal
          });
        }
      });
    }

    return list.length > 0 ? list : [{ image_url: '/placeholder.svg', alt_text: product.name, variant_value: 'Standard' }];
  }, [product]);

  // Derive option groups (Color / Version, Size, etc.)
  const optionGroups = useMemo<ProductOption[]>(() => {
    const groups: ProductOption[] = [];

    // 1. If product has multiple photos/versions, create an interactive "Color / Version" selector
    if (allImages.length > 1) {
      groups.push({
        name: 'Color / Version',
        values: allImages.map((img, i) => img.variant_value || `Color ${i + 1}`)
      });
    }

    // 2. Add Size or other option groups from product.options or variants
    if (Array.isArray(product.options) && product.options.length > 0) {
      product.options.forEach(opt => {
        const name = opt.name || 'Option';
        // Avoid duplicate Color / Version group if already generated from images
        if (allImages.length > 1 && (
          name.toLowerCase().includes('color') || 
          name.toLowerCase().includes('colour') || 
          name.toLowerCase().includes('version') ||
          name.toLowerCase().includes('style')
        )) {
          return;
        }
        groups.push({
          name,
          values: Array.isArray(opt.values) ? opt.values.map(String) : []
        });
      });
    } else if (Array.isArray(product.variants) && product.variants.length > 0) {
      const groupMap = new Map<string, Set<string>>();
      product.variants.forEach(v => {
        const name = (v.variant_name || ((v as any)?.attributes ? Object.keys((v as any).attributes || {})[0] : null)) || 'Size';
        const val = v.variant_value || (v as any)?.name || (v as any)?.attribute || '';
        if (name && val) {
          const sName = String(name).trim();
          const sVal = String(val).trim();
          if (allImages.length > 1 && (
            sName.toLowerCase().includes('color') || 
            sName.toLowerCase().includes('colour') || 
            sName.toLowerCase().includes('version')
          )) {
            return;
          }
          if (!groupMap.has(sName)) groupMap.set(sName, new Set());
          groupMap.get(sName)!.add(sVal);
        }
      });

      groupMap.forEach((valSet, name) => {
        groups.push({ name, values: Array.from(valSet) });
      });
    }

    return groups;
  }, [product.options, product.variants, allImages]);

  // Initial option selections
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    optionGroups.forEach(og => {
      if (og.values.length > 0) {
        initial[og.name] = og.values[0];
      }
    });
    return initial;
  });

  // Track the active gallery image
  const [activeImage, setActiveImage] = useState<string>(() => {
    return allImages[0]?.image_url || product.image_url || '';
  });

  const [quantity, setQuantity] = useState(1);
  const inWishlist = isInWishlist(product.id);

  // Find currently matched variant based on selections
  const currentVariant = useMemo<ProductVariant | null>(() => {
    if (!product.variants || product.variants.length === 0) return null;

    // First try exact match where variant_value matches selected option values
    const selectedVals = Object.values(selectedOptions).map(v => String(v || '').toLowerCase());
    for (const val of selectedVals) {
      if (!val) continue;
      const match = product.variants.find(v => {
        const vVal = String(v.variant_value || (v as any)?.name || (v as any)?.attribute || '').toLowerCase();
        return vVal === val;
      });
      if (match) return match;
    }

    return product.variants[0] || null;
  }, [product.variants, selectedOptions]);

  // Price calculation
  const currentPriceAdjustment = currentVariant?.price_adjustment || 0;
  const currentPrice = Math.max(0, product.price + currentPriceAdjustment);
  const discount = calculateDiscount(currentPrice, product.original_price);
  
  // Stock determination: variant specific stock or parent stock
  const currentStock = currentVariant?.stock_quantity !== undefined 
    ? currentVariant.stock_quantity 
    : product.stock_quantity;
  const isOutOfStock = currentStock <= 0;

  // Current SKU display
  const currentSku = currentVariant?.sku || product.sku || `DH-${product.id}`;

  // Handle option change (e.g. user selects a different color/version or size)
  const handleOptionChange = (groupName: string, value: string) => {
    setSelectedOptions(prev => {
      const updated = { ...prev, [groupName]: value };
      
      // If color or version changed, synchronize the main display image
      const isColorOrVersion = 
        groupName.toLowerCase().includes('color') || 
        groupName.toLowerCase().includes('colour') || 
        groupName.toLowerCase().includes('version') ||
        groupName.toLowerCase().includes('style');

      if (isColorOrVersion) {
        const targetVal = String(value || '').toLowerCase();
        // Check in allImages by variant_value or index
        const imgMatch = allImages.find((img, idx) => {
          const imgVal = String(img.variant_value || `Color ${idx + 1}`).toLowerCase();
          return imgVal === targetVal;
        });

        if (imgMatch?.image_url) {
          setActiveImage(imgMatch.image_url);
        }
      }

      return updated;
    });
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addToCart(
      {
        ...product,
        price: currentPrice,
        image_url: activeImage || product.image_url
      },
      quantity,
      currentVariant,
      selectedOptions
    );
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;

    addToCart(
      {
        ...product,
        price: currentPrice,
        image_url: activeImage || product.image_url
      },
      quantity,
      currentVariant,
      selectedOptions
    );
    router.push('/checkout');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 mb-16">
      
      {/* LEFT: INTERACTIVE IMAGE GALLERY */}
      <div>
        <div className="flex flex-col-reverse md:flex-row gap-4">
          
          {/* Thumbnails strip */}
          {allImages.length > 1 && (
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[500px] shrink-0 no-scrollbar">
              {allImages.map((img, idx) => {
                const isSelected = activeImage === img.image_url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImage(img.image_url);
                      const versionName = img.variant_value || `Color ${idx + 1}`;
                      setSelectedOptions(prev => ({
                        ...prev,
                        'Color / Version': versionName
                      }));
                    }}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'border-[#eb5a00] ring-2 ring-[#eb5a00]/30 shadow-md scale-98'
                        : 'border-neutral-200 hover:border-neutral-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={`${product.name} preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Large Display Image */}
          <div className="flex-1 aspect-square bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden relative group shadow-xs">
            <img
              src={activeImage || allImages[0]?.image_url}
              alt={product.name}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="eager"
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-[#eb5a00] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded-md shadow-md tracking-wider">
                -{discount}% OFF
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: INFO, ATTRIBUTE SELECTORS & PURCHASE CONTROLS */}
      <div className="space-y-6">
        <div>
          {product.category && (
            <Link
              href={`/category/${product.category.slug}`}
              className="text-xs font-bold text-[#eb5a00] uppercase tracking-wider hover:underline block mb-2"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 leading-tight">
            {product.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 mt-2.5">
            <span>
              SKU: <strong className="text-neutral-800 font-mono">{currentSku}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              Status:{' '}
              {isOutOfStock ? (
                <span className="text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Out of Stock
                </span>
              ) : (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> In Stock ({currentStock} available)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Price Block */}
        <div className="border-y border-neutral-100 py-4 bg-neutral-50/60 rounded-xl px-4">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-black text-black">
              {formatPrice(currentPrice)}
            </span>
            {product.original_price && product.original_price > currentPrice && (
              <>
                <span className="text-base text-neutral-400 line-through">
                  {formatPrice(product.original_price)}
                </span>
                <span className="bg-[#eb5a00] text-white text-xs font-bold px-2 py-0.5 rounded">
                  Save {discount}%
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Inclusive of nationwide taxes across Bangladesh</p>
        </div>

        {/* VARIATION SELECTORS (Size, Color, Style, etc.) */}
        {optionGroups.length > 0 && (
          <div className="space-y-5 border-b border-neutral-100 pb-5">
            {optionGroups.map((group) => {
              const gName = String(group.name || '').toLowerCase();
              const isColorGroup = gName.includes('color') || 
                                   gName.includes('colour') ||
                                   gName.includes('version') ||
                                   gName.includes('style');
              const selectedVal = selectedOptions[group.name] || group.values[0];

              return (
                <div key={group.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      Select {group.name}: <span className="text-[#eb5a00] font-black">{selectedVal}</span>
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {group.values.length} available
                    </span>
                  </div>

                  {/* Variation Options Pills / Swatches */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {group.values.map((rawVal) => {
                      const val = String(rawVal);
                      const isSelected = String(selectedVal || '').toLowerCase() === val.toLowerCase();
                      const hex = isColorGroup ? getColorHex(val) : null;

                      // Check if this option has a specific image
                      const matchingImg = allImages.find(
                        img => String(img.variant_value || '').toLowerCase() === val.toLowerCase()
                      );

                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleOptionChange(group.name, val)}
                          className={`flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#eb5a00] bg-[#eb5a00] text-white shadow-md scale-102'
                              : 'border-neutral-200 bg-white text-neutral-800 hover:border-[#eb5a00] hover:bg-orange-50/50'
                          }`}
                        >
                          {matchingImg && (
                            <img
                              src={matchingImg.image_url}
                              alt={val}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-white/60 shrink-0 shadow-xs"
                            />
                          )}
                          {!matchingImg && hex && (
                            <span 
                              className={`w-4 h-4 rounded-full shrink-0 border ${
                                val.toLowerCase().includes('white') ? 'border-neutral-300' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: hex }}
                            />
                          )}
                          <span>{val}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quantity Controls & Wishlist */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Quantity:
            </span>
            <div className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                className="p-2 hover:bg-neutral-100 disabled:opacity-30 transition-colors cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5 text-neutral-700" />
              </button>
              <span className="w-12 text-center text-xs font-black text-black">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(q => Math.min(currentStock || 99, q + 1))}
                disabled={quantity >= currentStock || isOutOfStock}
                className="p-2 hover:bg-neutral-100 disabled:opacity-30 transition-colors cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5 text-neutral-700" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              className={`p-2.5 rounded-lg border transition-colors cursor-pointer ml-auto ${
                inWishlist
                  ? 'border-red-500 bg-red-50 text-red-500'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:border-black'
              }`}
              title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Action Buttons: Add to Bag & Buy Now */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full py-3.5 px-4 bg-white border-2 border-[#eb5a00] text-[#eb5a00] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="w-full py-3.5 px-4 bg-[#eb5a00] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#d04f00] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>{isOutOfStock ? 'Unavailable' : 'Buy Now (Express)'}</span>
            </button>
          </div>
        </div>

        {/* Bangladesh Shipping & Quality Assurances */}
        <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/70 space-y-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-[#eb5a00] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-neutral-900">Fast Nationwide Delivery</p>
              <p className="text-neutral-500 text-[11px]">Inside Dhaka: ৳70 (24-48 Hours) | Outside Dhaka: ৳130 (2-4 Days)</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-neutral-900">100% Genuine Apparel & Quality Inspected</p>
              <p className="text-neutral-500 text-[11px]">Handcrafted fabrics, stitched for comfort and durability</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-neutral-900">Easy 7-Day Replacement Policy</p>
              <p className="text-neutral-500 text-[11px]">Hassle-free exchange for size adjustments or defects</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
