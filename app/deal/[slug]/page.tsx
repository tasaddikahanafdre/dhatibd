'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  Flame, 
  Clock, 
  ShoppingBag, 
  ChevronRight, 
  Sparkles, 
  Tag, 
  Check, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { formatPrice, getProductPrimaryImage } from '@/lib/utils';
import { DealPage, Product } from '@/lib/types';

interface ResolvedDealProduct {
  product_id: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  deal_price: number;
  original_price: number;
  savings: number;
  discount_percent: number;
  discount_badge: string;
  product: Product;
}

interface DealPageData extends DealPage {
  resolved_products: ResolvedDealProduct[];
}

export default function StorefrontDealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addToCart } = useCart();

  const [deal, setDeal] = useState<DealPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    fetch(`/api/deals/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Deal not found or inactive');
        return r.json();
      })
      .then(data => {
        if (data.error) throw new Error(data.error);
        setDeal(data);
      })
      .catch(err => {
        setError(err.message || 'Deal page not found');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Live countdown timer calculation
  useEffect(() => {
    if (!deal?.end_date) return;

    const timer = setInterval(() => {
      const difference = +new Date(deal.end_date!) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deal?.end_date]);

  const handleAddDealItem = (dp: ResolvedDealProduct) => {
    addToCart(
      dp.product,
      1,
      null,
      undefined,
      {
        deal_id: deal!.id,
        deal_slug: deal!.slug,
        deal_title: deal!.title,
        deal_price: dp.deal_price,
        original_price: dp.original_price,
        discount_text: dp.discount_badge
      }
    );

    setAddedIds(prev => ({ ...prev, [dp.product_id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [dp.product_id]: false }));
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Loading Deal Showcase...</p>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-white max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-black uppercase tracking-tight">Deal Not Available</h1>
        <p className="text-xs text-neutral-500 leading-relaxed">
          This promotional campaign may have ended or the URL has changed. Explore our full catalog for more genuine tech and lifestyle essentials.
        </p>
        <div className="pt-2">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-[#eb5a00] text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg hover:bg-[#d04f00] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue to Store</span>
          </Link>
        </div>
      </div>
    );
  }

  const products = deal.resolved_products || [];

  return (
    <div className="min-h-screen bg-white text-black pb-20">
      
      {/* 1. Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-neutral-400 flex items-center gap-2 border-b border-neutral-100">
        <Link href="/" className="hover:text-black uppercase tracking-wider">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-neutral-500 uppercase tracking-wider">Deals</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black font-semibold uppercase tracking-wider">{deal.title}</span>
      </div>

      {/* 2. Hero Promotional Deal Banner */}
      <div className="w-full bg-black text-white py-10 sm:py-16 px-4 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-widest shadow-md">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{deal.badge_text || 'EXCLUSIVE PROMOTIONAL DEAL'}</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white max-w-3xl mx-auto">
            {deal.title}
          </h1>

          {/* Subtitle / Description */}
          {deal.subtitle && (
            <p className="text-sm sm:text-base text-neutral-300 font-medium max-w-xl mx-auto">
              {deal.subtitle}
            </p>
          )}

          {deal.description && (
            <p className="text-xs text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed">
              {deal.description}
            </p>
          )}

          {/* Live Countdown Timer (If end_date set) */}
          {timeLeft && (
            <div className="pt-4 flex items-center justify-center gap-2 sm:gap-3">
              <div className="flex flex-col items-center bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 min-w-[54px]">
                <span className="text-base sm:text-xl font-black text-white">{timeLeft.days}</span>
                <span className="text-[9px] uppercase tracking-wider text-neutral-400">Days</span>
              </div>
              <span className="text-neutral-600 font-bold">:</span>
              <div className="flex flex-col items-center bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 min-w-[54px]">
                <span className="text-base sm:text-xl font-black text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase tracking-wider text-neutral-400">Hours</span>
              </div>
              <span className="text-neutral-600 font-bold">:</span>
              <div className="flex flex-col items-center bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 min-w-[54px]">
                <span className="text-base sm:text-xl font-black text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase tracking-wider text-neutral-400">Mins</span>
              </div>
              <span className="text-neutral-600 font-bold">:</span>
              <div className="flex flex-col items-center bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 min-w-[54px]">
                <span className="text-base sm:text-xl font-black text-red-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase tracking-wider text-neutral-400">Secs</span>
              </div>
            </div>
          )}

          <p className="text-[11px] text-neutral-400 pt-2 italic">
            * Promotional deal prices are exclusive to this page and apply at checkout while stock lasts.
          </p>
        </div>
      </div>

      {/* 3. Products Showcase Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 space-y-8">
        
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-black uppercase tracking-wider">
              Promotional Products ({products.length})
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Click &quot;Add to Bag&quot; to secure the special deal price
            </p>
          </div>
          <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full uppercase tracking-wider">
            Deal Active
          </span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-200 rounded-2xl">
            <p className="text-sm text-neutral-500">Products are currently being selected for this deal campaign. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((dp) => {
              const product = dp.product;
              const isAdded = addedIds[dp.product_id];
              const imageUrl = getProductPrimaryImage(product);

              return (
                <div
                  key={dp.product_id}
                  className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-black transition-all flex flex-col justify-between group"
                >
                  {/* Top Image + Badges */}
                  <div className="relative aspect-square bg-neutral-100 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />

                    {/* Deal Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-md shadow-md">
                        {dp.discount_badge}
                      </span>
                    </div>

                    {/* Stock pill */}
                    {product.stock_quantity <= 0 && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="px-2 py-0.5 bg-black/80 text-white text-[10px] font-bold rounded">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider truncate">
                        {product.category?.name || 'Curated Deal'}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-2 leading-snug group-hover:text-black transition-colors" title={product.name}>
                        {product.name}
                      </h3>
                    </div>

                    {/* Price Block: Deal Price + Strikethrough Original Price */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base sm:text-lg font-black text-red-600">
                          {formatPrice(dp.deal_price)}
                        </span>
                        <span className="text-xs text-neutral-400 line-through font-medium">
                          {formatPrice(dp.original_price)}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-emerald-600">
                        You save {formatPrice(dp.savings)} ({dp.discount_percent}% off)
                      </p>
                    </div>

                    {/* Add to Bag Button with Deal Price */}
                    <button
                      type="button"
                      onClick={() => handleAddDealItem(dp)}
                      disabled={product.stock_quantity <= 0}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : product.stock_quantity <= 0
                            ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                            : 'bg-[#eb5a00] text-white hover:bg-[#d04f00]'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added to Bag!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add at Deal Price</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
