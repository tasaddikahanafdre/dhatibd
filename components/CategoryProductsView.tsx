'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Product, Category } from '@/lib/types';

interface CategoryProductsViewProps {
  category: Category;
  subcategories?: Category[];
  parentCategory?: Category | null;
  initialProducts: Product[];
  initialTotal: number;
  pageSize?: number;
}

export default function CategoryProductsView({
  category,
  subcategories = [],
  parentCategory = null,
  initialProducts,
  initialTotal,
  pageSize = 48
}: CategoryProductsViewProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [totalProducts, setTotalProducts] = useState(initialTotal);
  const [sortBy, setSortBy] = useState('newest');
  const [loadingMore, setLoadingMore] = useState(false);
  const [sorting, setSorting] = useState(false);

  // When sort option changes, fetch sorted products starting at offset 0
  useEffect(() => {
    // Skip initial render if sort is still default
    if (sortBy === 'newest' && products === initialProducts) return;

    setSorting(true);
    const params = new URLSearchParams();
    params.set('category', category.slug);
    params.set('sortBy', sortBy);
    params.set('limit', String(pageSize));
    params.set('offset', '0');

    fetch(`/api/products?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.products)) {
          setProducts(data.products);
          setTotalProducts(data.total ?? initialTotal);
        }
      })
      .catch(err => console.error('Failed to sort category products:', err))
      .finally(() => setSorting(false));
  }, [sortBy, category.slug, pageSize, initialProducts, initialTotal]);

  // Load more products handler
  const handleLoadMore = () => {
    if (loadingMore || products.length >= totalProducts) return;
    setLoadingMore(true);

    const params = new URLSearchParams();
    params.set('category', category.slug);
    params.set('sortBy', sortBy);
    params.set('limit', String(pageSize));
    params.set('offset', String(products.length));

    fetch(`/api/products?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.products)) {
          setProducts(prev => [...prev, ...data.products]);
          setTotalProducts(data.total ?? totalProducts);
        }
      })
      .catch(err => console.error('Load more products error:', err))
      .finally(() => setLoadingMore(false));
  };

  const remaining = Math.max(0, totalProducts - products.length);
  const nextBatchSize = Math.min(pageSize, remaining);
  const progressPercent = Math.min(100, Math.round((products.length / (totalProducts || 1)) * 100));

  return (
    <div className="w-full bg-white text-black min-h-screen py-6 sm:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-neutral-400 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-black uppercase tracking-wider">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-neutral-300 shrink-0" />
          <Link href="/shop" className="hover:text-black uppercase tracking-wider">
            Shop
          </Link>
          {parentCategory && (
            <>
              <ChevronRight className="w-3 h-3 text-neutral-300 shrink-0" />
              <Link href={`/category/${parentCategory.slug}`} className="hover:text-black uppercase tracking-wider">
                {parentCategory.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 text-neutral-300 shrink-0" />
          <span className="text-black font-semibold uppercase tracking-wider">
            {category.name}
          </span>
        </nav>

        {/* Category Header */}
        <div className="border-b border-black pb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
                  {category.name}
                </h1>
                <span className="bg-[#eb5a00] text-white text-xs sm:text-sm font-black px-3.5 py-1 rounded-full shadow-xs tracking-wide">
                  {totalProducts.toLocaleString()} Items
                </span>
              </div>
              {category.description && (
                <p className="text-xs sm:text-sm text-neutral-600 font-light max-w-2xl mt-2 leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="cat-sort" className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Sort:
              </label>
              <select
                id="cat-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold bg-neutral-100 border border-neutral-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-black cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Subcategories (if any) */}
          {subcategories.length > 0 && (
            <div 
              className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar [&::-webkit-scrollbar]:hidden pt-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <span className="bg-black text-white px-3.5 py-1.5 rounded-full uppercase tracking-wider font-bold text-xs shrink-0 shadow-xs">
                All ({totalProducts.toLocaleString()})
              </span>
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/category/${category.slug}/${sub.slug}`}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3.5 py-1.5 rounded-full uppercase tracking-wider font-semibold transition-colors whitespace-nowrap text-xs shrink-0"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid Area */}
        <div>
          {sorting ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3 text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#eb5a00]" />
              <p className="text-xs uppercase tracking-wider font-bold text-neutral-500">
                Updating {category.name}...
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 sm:py-24 border border-neutral-200 rounded-2xl p-8 bg-white shadow-xs">
              <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-black mb-2">
                No products found in {category.name}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 font-light mb-6">
                Check back soon or explore our other collections.
              </p>
              <Link
                href="/shop"
                className="inline-block bg-[#eb5a00] text-white text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-[#d04f00] transition-colors"
              >
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Product Grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Progress & Load More Section */}
              <div className="pt-6 pb-12 flex flex-col items-center space-y-4">
                <div className="w-full max-w-xs space-y-1.5 text-center">
                  <div className="flex justify-between text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                    <span>Showing {products.length.toLocaleString()}</span>
                    <span>of {totalProducts.toLocaleString()} products</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#eb5a00] transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {products.length < totalProducts ? (
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-black uppercase tracking-widest shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#eb5a00]" />
                        <span>Loading {nextBatchSize} more...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#eb5a00]" />
                        <span>Load More {category.name} ({nextBatchSize} more)</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 bg-neutral-100 px-4 py-2 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>You have viewed all {totalProducts.toLocaleString()} products in {category.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
