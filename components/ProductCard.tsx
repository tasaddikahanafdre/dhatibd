'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { useWishlist } from '@/lib/WishlistContext';
import { formatPrice, calculateDiscount, getProductPrimaryImage } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const discount = calculateDiscount(product.price, product.original_price);
  const inWishlist = isInWishlist(product.id);
  const isOutOfStock = product.stock_quantity <= 0;

  const imageUrl = getProductPrimaryImage(product);
  const fallbackImage = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600';

  return (
    <div className="group relative bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-neutral-400 hover:shadow-md">
      
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.fallback) {
                target.dataset.fallback = 'true';
                target.src = fallbackImage;
              }
            }}
          />
        </Link>

        {/* Top Badges: Discount & Stock */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
          {discount > 0 && (
            <span className="bg-[#eb5a00] text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded uppercase tracking-wider shadow-xs">
              -{discount}%
            </span>
          )}
          {product.is_featured && (
            <span className="bg-neutral-800 text-white text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block shadow-xs">
              Featured
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-red-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded uppercase tracking-wider shadow-xs">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-xs shadow-xs transition-colors z-10 ${
            inWishlist ? 'text-red-600 bg-red-50' : 'text-neutral-500 hover:text-black hover:bg-white'
          }`}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${inWishlist ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Product Information */}
      <div className="p-2 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category breadcrumb preview */}
          {product.category && (
            <p className="text-[9px] sm:text-[11px] font-medium text-neutral-400 uppercase tracking-wider truncate mb-0.5 sm:mb-1">
              {product.category.name}
            </p>
          )}

          <Link 
            href={`/product/${product.slug}`}
            className="text-[11px] sm:text-sm font-semibold text-neutral-900 group-hover:text-black line-clamp-2 transition-colors mb-1 leading-tight sm:leading-snug min-h-[26px] sm:min-h-0"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Options / Colours preview */}
          {product.options && product.options.length > 0 && (
            <p className="text-[10px] text-neutral-500 mb-1.5 truncate">
              {product.options.map(o => `${o.values.length} ${o.name}`).join(' • ')}
            </p>
          )}
        </div>

        <div className="pt-1 sm:pt-2">
          {/* Price & Original Price */}
          <div className="flex items-baseline gap-1 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
            <span className="text-xs sm:text-base font-bold text-black leading-none">
              {formatPrice(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-[9px] sm:text-xs text-neutral-400 line-through leading-none">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => addToCart(product, 1)}
            disabled={isOutOfStock}
            className={`w-full py-1.5 sm:py-2 px-1.5 sm:px-3 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-colors shadow-xs ${
              isOutOfStock
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : 'bg-[#eb5a00] text-white hover:bg-[#d04f00]'
            }`}
          >
            <ShoppingBag className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
