'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronRight, Search, Loader2, Sparkles, Filter } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Product, Category } from '@/lib/types';

const PAGE_SIZE = 48;

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  // Load categories
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(err => console.error('Categories load error:', err));
  }, []);

  // Fetch initial batch of products when filters change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy) params.set('sortBy', sortBy);
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', '0');

    fetch(`/api/products?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.products)) {
          setProducts(data.products);
          setTotalProducts(data.total || data.products.length);
        }
      })
      .catch(err => console.error('Fetch products error:', err))
      .finally(() => setLoading(false));
  }, [search, selectedCategory, sortBy]);

  // Load more handler
  const handleLoadMore = () => {
    if (loadingMore || products.length >= totalProducts) return;
    setLoadingMore(true);

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy) params.set('sortBy', sortBy);
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', String(products.length));

    fetch(`/api/products?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.products)) {
          setProducts(prev => [...prev, ...data.products]);
          setTotalProducts(data.total || (products.length + data.products.length));
        }
      })
      .catch(err => console.error('Load more error:', err))
      .finally(() => setLoadingMore(false));
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSortBy('newest');
    router.push('/shop');
  };

  const selectedCategoryObj = categories.find(c => c.slug === selectedCategory);
  const categoryDisplayName = selectedCategoryObj ? selectedCategoryObj.name : (selectedCategory || 'Catalog');

  return (
    <div className="w-full bg-white text-black min-h-screen py-6 sm:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-neutral-400 flex items-center gap-2">
          <button onClick={() => router.push('/')} className="hover:text-black uppercase tracking-wider">
            Home
          </button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => { setSelectedCategory(''); router.push('/shop'); }} className="hover:text-black uppercase tracking-wider">
            Shop
          </button>
          {selectedCategory && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-black font-semibold uppercase tracking-wider">{categoryDisplayName}</span>
            </>
          )}
        </nav>

        {/* Title & Stats Header */}
        <div className="border-b border-black pb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
                  {selectedCategory ? categoryDisplayName : 'All Products'}
                </h1>
                <span className="bg-[#eb5a00] text-white text-xs sm:text-sm font-black px-3 py-1 rounded-full shadow-xs">
                  {totalProducts.toLocaleString()} Items
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-light mt-1.5">
                Authentic clothing collections with cash on delivery across all 64 districts of Bangladesh
              </p>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="shop-sort" className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Sort:
              </label>
              <select
                id="shop-sort"
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

          {/* Quick Categories Bar */}
          <div 
            className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar [&::-webkit-scrollbar]:hidden pt-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3.5 py-1.5 rounded-full uppercase tracking-wider font-bold transition-all text-xs ${
                !selectedCategory ? 'bg-black text-white shadow-xs' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All ({totalProducts.toLocaleString()})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.slug)}
                className={`px-3.5 py-1.5 rounded-full uppercase tracking-wider font-semibold transition-all whitespace-nowrap text-xs ${
                  selectedCategory === c.slug ? 'bg-[#eb5a00] text-white shadow-xs font-bold' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid Area */}
        <div>
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3 text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#eb5a00]" />
              <p className="text-xs uppercase tracking-wider font-bold text-neutral-500">Loading catalog...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="w-full border border-neutral-200 rounded-xl p-12 sm:p-20 text-center bg-white shadow-xs">
              <div className="max-w-md mx-auto space-y-3">
                <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-black">
                  No products found
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
                  We could not find any items matching your selected filter.
                </p>
                {(search || selectedCategory) && (
                  <div className="pt-2">
                    <button
                      onClick={handleResetFilters}
                      className="bg-[#eb5a00] text-white text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded hover:bg-[#d04f00] transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Grid: 2 columns on mobile, 3 columns on sm, 4 columns on lg */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Progress & Load More Area */}
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
                      style={{ width: `${Math.min(100, Math.round((products.length / (totalProducts || 1)) * 100))}%` }}
                    />
                  </div>
                </div>

                {products.length < totalProducts && (
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-black uppercase tracking-widest shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#eb5a00]" />
                        <span>Loading more...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#eb5a00]" />
                        <span>Load More Products ({Math.min(PAGE_SIZE, totalProducts - products.length)} more)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-20 text-center text-xs">Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}
