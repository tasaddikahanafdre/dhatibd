'use client';

import React, { useState, useEffect, useTransition } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  Sparkles, 
  FolderTree, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft,
  ArrowRight,
  Check, 
  X, 
  Search, 
  AlertCircle, 
  Save, 
  RotateCcw, 
  Layers, 
  Package, 
  ExternalLink,
  Info
} from 'lucide-react';
import { Product, Category } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { getCategoryIconUrl } from '@/lib/categoryIcons';
import Link from 'next/link';

export default function FeaturedManagementPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Products state
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [featuredProductSlots, setFeaturedProductSlots] = useState<Array<Product | null>>([
    null, null, null, null, null, null, null, null, null
  ]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Categories state
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [headerCategories, setHeaderCategories] = useState<Category[]>([]);
  const [selectedCatToAdd, setSelectedCatToAdd] = useState('');

  // Status & loading
  const [loading, setLoading] = useState(true);
  const [savingProducts, setSavingProducts] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load
  useEffect(() => {
    Promise.all([
      fetch('/api/featured-products').then(r => r.json()),
      fetch('/api/header-categories').then(r => r.json())
    ])
      .then(([productsData, categoriesData]) => {
        if (productsData && Array.isArray(productsData.all_products)) {
          setAllProducts(productsData.all_products);
          
          // Populate the 9 slots
          const initialSlots: Array<Product | null> = [null, null, null, null, null, null, null, null, null];
          if (Array.isArray(productsData.featured_products)) {
            productsData.featured_products.slice(0, 9).forEach((p: Product, i: number) => {
              initialSlots[i] = p;
            });
          }
          setFeaturedProductSlots(initialSlots);
        }

        if (categoriesData) {
          if (Array.isArray(categoriesData.all_categories)) {
            setAllCategories(categoriesData.all_categories);
          }
          if (Array.isArray(categoriesData.header_categories)) {
            setHeaderCategories(categoriesData.header_categories);
          }
        }
      })
      .catch(err => {
        console.error('Failed to load featured data:', err);
        showToast('Error loading featured items data', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  // Check URL query for tab selection (e.g. ?tab=categories)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'categories') {
        setActiveTab('categories');
      } else if (tabParam === 'products') {
        setActiveTab('products');
      }
    }
  }, []);

  /* ---------------- FEATURED PRODUCTS LOGIC (3x3 GRID) ---------------- */

  const handleAssignProduct = (product: Product) => {
    if (selectedSlotIndex === null) return;
    const newSlots = [...featuredProductSlots];
    
    // If this product was already in another slot, clear that slot
    const existingIndex = newSlots.findIndex(p => p?.id === product.id);
    if (existingIndex !== -1 && existingIndex !== selectedSlotIndex) {
      newSlots[existingIndex] = null;
    }

    newSlots[selectedSlotIndex] = product;
    setFeaturedProductSlots(newSlots);
    setSelectedSlotIndex(null);
    setProductSearch('');
  };

  const handleRemoveProductFromSlot = (index: number) => {
    const newSlots = [...featuredProductSlots];
    newSlots[index] = null;
    setFeaturedProductSlots(newSlots);
  };

  const handleMoveProductSlot = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= 9) return;
    const newSlots = [...featuredProductSlots];
    const temp = newSlots[fromIndex];
    newSlots[fromIndex] = newSlots[toIndex];
    newSlots[toIndex] = temp;
    setFeaturedProductSlots(newSlots);
  };

  const handleQuickFillLatest = () => {
    const activeProds = allProducts.filter(p => p.is_active !== false).slice(0, 9);
    const newSlots: Array<Product | null> = [null, null, null, null, null, null, null, null, null];
    activeProds.forEach((p, idx) => {
      newSlots[idx] = p;
    });
    setFeaturedProductSlots(newSlots);
    showToast('Loaded top 9 active products into slots. Click "Save Featured Products" to apply.');
  };

  const handleClearAllSlots = () => {
    if (confirm('Are you sure you want to clear all 9 featured product slots?')) {
      setFeaturedProductSlots([null, null, null, null, null, null, null, null, null]);
    }
  };

  const handleSaveFeaturedProducts = async () => {
    setSavingProducts(true);
    try {
      // Gather non-null IDs in slot order
      const productIds = featuredProductSlots
        .filter((p): p is Product => Boolean(p && p.id))
        .map(p => p.id);

      const res = await fetch('/api/featured-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_ids: productIds })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to save');
      }

      showToast('Featured Products (3x3 grid) successfully updated and live on homepage!');
    } catch (err: any) {
      console.error('Error saving featured products:', err);
      showToast(err.message || 'Error saving featured products', 'error');
    } finally {
      setSavingProducts(false);
    }
  };

  // Filter products for the picker modal
  const filteredProductsForPicker = allProducts.filter(p => {
    const searchLower = productSearch.toLowerCase().trim();
    const catName = typeof p.category === 'object' ? (p.category?.name || '') : String(p.category || '');
    const matchesSearch = !searchLower ||
      String(p.name || '').toLowerCase().includes(searchLower) ||
      (p.sku && String(p.sku).toLowerCase().includes(searchLower)) ||
      catName.toLowerCase().includes(searchLower);

    if (selectedCategoryFilter === 'all') {
      return matchesSearch;
    }

    const childCategoryIds = allCategories
      .filter(c => c.parent_id === selectedCategoryFilter)
      .map(c => c.id);
    const targetCategoryIds = [selectedCategoryFilter, ...childCategoryIds];

    const matchesCat = 
      targetCategoryIds.includes(p.category_id || '') || 
      targetCategoryIds.includes(p.category?.id || '') ||
      targetCategoryIds.includes(p.category?.slug || '');

    return matchesSearch && matchesCat;
  });

  const assignedProductCount = featuredProductSlots.filter(Boolean).length;

  /* ---------------- HEADER CATEGORIES LOGIC ---------------- */

  const handleAddHeaderCategory = () => {
    if (!selectedCatToAdd) return;
    const cat = allCategories.find(c => c.id === selectedCatToAdd || c.slug === selectedCatToAdd);
    if (!cat) return;
    
    if (headerCategories.some(c => c.id === cat.id)) {
      showToast('This category is already in the header navigation bar', 'error');
      return;
    }

    setHeaderCategories([...headerCategories, cat]);
    setSelectedCatToAdd('');
  };

  const handleRemoveHeaderCategory = (catId: string) => {
    setHeaderCategories(headerCategories.filter(c => c.id !== catId));
  };

  const handleMoveHeaderCategory = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= headerCategories.length) return;
    const list = [...headerCategories];
    const item = list.splice(fromIndex, 1)[0];
    list.splice(toIndex, 0, item);
    setHeaderCategories(list);
  };

  const handleResetDefaultCategories = () => {
    const defaultSlugs = ['tech', 'food', 'clothing', 'kids', 'home', 'other'];
    const matched = defaultSlugs
      .map(s => allCategories.find(c => c.slug === s || c.id === s))
      .filter((c): c is Category => Boolean(c));

    setHeaderCategories(matched);
    showToast('Reset header categories to default 6. Click "Save Header Categories" to apply.');
  };

  const handleSaveHeaderCategories = async () => {
    setSavingCategories(true);
    try {
      const categoryIds = headerCategories.map(c => c.id);
      const res = await fetch('/api/header-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_ids: categoryIds })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to save');
      }

      showToast('Header Navigation categories successfully updated!');
    } catch (err: any) {
      console.error('Error saving header categories:', err);
      showToast(err.message || 'Error saving header categories', 'error');
    } finally {
      setSavingCategories(false);
    }
  };

  // Categories available to add to header (not yet added)
  const unselectedCategories = allCategories.filter(
    c => c.is_active !== false && !headerCategories.some(hc => hc.id === c.id)
  );

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 border ${
            toastType === 'success' 
              ? 'bg-neutral-900 text-white border-neutral-700' 
              : 'bg-red-950 text-red-200 border-red-800'
          }`}>
            {toastType === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            {toastMessage}
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Featured Items Management
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-800 text-neutral-300 uppercase tracking-wider">
                Storefront Controls
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Curate the Homepage 3×3 Featured Products grid and manage the Top Header Navigation categories
            </p>
          </div>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-xs font-semibold text-neutral-200 transition-colors self-start sm:self-auto"
          >
            <span>View Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-neutral-800 gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'products'
                ? 'border-white text-white bg-neutral-900/40'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Featured Products (3×3 Grid)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              assignedProductCount === 9 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                : 'bg-neutral-800 text-neutral-400'
            }`}>
              {assignedProductCount} / 9
            </span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'categories'
                ? 'border-white text-white bg-neutral-900/40'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            <FolderTree className="w-4 h-4 text-sky-400" />
            <span>Header Categories</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">
              {headerCategories.length}
            </span>
          </button>
        </div>

        {/* ===================== TAB 1: FEATURED PRODUCTS (3x3 GRID) ===================== */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            
            {/* Control & Info Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-neutral-900/70 border border-neutral-800 rounded-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Homepage 3×3 Grid Layout
                  </h2>
                  <span className="text-[11px] px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded font-medium">
                    Total: {assignedProductCount} / 9 slots selected
                  </span>
                </div>
                <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
                  These 9 products appear directly on the storefront homepage in this exact order (Row 1: Slots 1–3, Row 2: Slots 4–6, Row 3: Slots 7–9). Click any slot to assign or replace a product.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleQuickFillLatest}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Fills empty slots with latest published products"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Quick Fill (Latest 9)</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAllSlots}
                  className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-red-300 border border-neutral-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveFeaturedProducts}
                  disabled={savingProducts}
                  className="px-4 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingProducts ? 'Saving...' : 'Save Featured Products'}</span>
                </button>
              </div>
            </div>

            {/* Visual 3x3 Grid (3 columns x 3 rows = 9 slots) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredProductSlots.map((product, index) => {
                const row = Math.floor(index / 3) + 1;
                const col = (index % 3) + 1;

                if (!product) {
                  return (
                    <div
                      key={`slot-${index}`}
                      onClick={() => setSelectedSlotIndex(index)}
                      className="group cursor-pointer border-2 border-dashed border-neutral-800 hover:border-neutral-500 rounded-xl p-6 bg-neutral-900/30 hover:bg-neutral-900/80 transition-all flex flex-col items-center justify-center text-center min-h-[220px]"
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-800 group-hover:bg-white group-hover:text-black text-neutral-400 flex items-center justify-center transition-colors mb-3">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Slot #{index + 1}
                      </span>
                      <span className="text-[11px] text-neutral-500 mt-0.5">
                        Row {row}, Column {col} (Empty)
                      </span>
                      <span className="mt-3 px-3 py-1 bg-neutral-800 group-hover:bg-neutral-700 text-neutral-300 rounded text-[11px] font-semibold transition-colors">
                        Click to Assign Product
                      </span>
                    </div>
                  );
                }

                // Primary image fallback
                const imageUrl = product.image_url || 
                  (product.images && product.images[0]?.image_url) || 
                  '/placeholder.png';

                return (
                  <div
                    key={`slot-${index}-${product.id}`}
                    className="border border-neutral-800 bg-neutral-900/90 rounded-xl p-3.5 flex flex-col justify-between hover:border-neutral-700 transition-colors relative group"
                  >
                    {/* Top Row: Slot Indicator & Position Controls */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/80">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-white text-black text-[10px] font-black rounded uppercase tracking-wider">
                          Slot #{index + 1}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          R{row}:C{col}
                        </span>
                      </div>

                      {/* Move left/right in slots */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveProductSlot(index, index - 1)}
                          disabled={index === 0}
                          title="Move Earlier"
                          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-20 disabled:hover:bg-neutral-800 transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveProductSlot(index, index + 1)}
                          disabled={index === 8}
                          title="Move Later"
                          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-20 disabled:hover:bg-neutral-800 transition-colors"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveProductFromSlot(index)}
                          title="Remove from slot"
                          className="p-1 rounded bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 transition-colors ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Product Info */}
                    <div className="flex gap-3 items-start my-1">
                      <div className="w-16 h-16 bg-neutral-950 rounded-lg overflow-hidden shrink-0 border border-neutral-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block truncate">
                          {product.category?.name || 'Category'}
                        </span>
                        <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug mt-0.5" title={product.name}>
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-white">
                            ৳{product.price?.toLocaleString()}
                          </span>
                          {product.stock_quantity <= 0 ? (
                            <span className="text-[10px] px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-900 rounded">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-500 font-medium">
                              Stock: {product.stock_quantity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Replace Button */}
                    <div className="mt-3 pt-2 border-t border-neutral-800/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setSelectedSlotIndex(index)}
                        className="text-[11px] font-semibold text-neutral-400 hover:text-white transition-colors"
                      >
                        Change Product...
                      </button>

                      <Link
                        href={`/product/${product.slug}`}
                        target="_blank"
                        className="text-[11px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Save Bar */}
            <div className="flex justify-end pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={handleSaveFeaturedProducts}
                disabled={savingProducts}
                className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingProducts ? 'Saving Changes...' : 'Save Featured Products'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: HEADER CATEGORIES ===================== */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            
            {/* Notice Banner */}
            <div className="p-4 bg-sky-950/30 border border-sky-800/60 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-sky-200 uppercase tracking-wide block">
                  Header Navigation Bar Configuration
                </span>
                <p className="text-sky-300/80 leading-relaxed">
                  These categories appear exclusively in the website&apos;s top black navigation bar (separated by &quot;|&quot;).
                </p>
                <p className="text-amber-300/90 font-medium pt-1">
                  <strong>Important:</strong> This setting is completely independent of the homepage animated category carousel. Adding, removing, or reordering categories here does not alter the categories displayed in the homepage animation, which continues to show all store categories automatically.
                </p>
              </div>
            </div>

            {/* Live Header Bar Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Live Navigation Bar Preview
                </span>
                <span className="text-[11px] text-neutral-500">
                  {headerCategories.length} categories visible
                </span>
              </div>

              <div className="w-full bg-black text-white py-3 px-4 rounded-xl border border-neutral-800 overflow-x-auto no-scrollbar shadow-inner">
                {headerCategories.length === 0 ? (
                  <div className="text-center py-2 text-xs text-neutral-500 italic">
                    No categories assigned to the header yet. Add categories below.
                  </div>
                ) : (
                  <div className="flex items-center justify-center whitespace-nowrap text-xs sm:text-sm font-normal tracking-wide">
                    {headerCategories.map((cat, index) => (
                      <React.Fragment key={cat.id || cat.slug}>
                        <span className="px-2.5 sm:px-4 py-0.5 text-white hover:text-neutral-300 select-none">
                          {cat.name}
                        </span>
                        {index < headerCategories.length - 1 && (
                          <span className="text-white/60 select-none">|</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Management Controls & Add Category */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <div className="flex flex-1 items-center gap-2 max-w-md">
                <select
                  value={selectedCatToAdd}
                  onChange={(e) => setSelectedCatToAdd(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-white"
                >
                  <option value="">-- Choose Category to Add to Header --</option>
                  {unselectedCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddHeaderCategory}
                  disabled={!selectedCatToAdd}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Header</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaultCategories}
                  className="px-3 py-2 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveHeaderCategories}
                  disabled={savingCategories}
                  className="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingCategories ? 'Saving...' : 'Save Header Categories'}</span>
                </button>
              </div>
            </div>

            {/* Reorderable Header Categories List */}
            <div className="border border-neutral-800 rounded-xl bg-neutral-900/50 overflow-hidden divide-y divide-neutral-800">
              <div className="p-3.5 bg-neutral-900/90 flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-wider">
                <span>Active Header Categories (Order: Left &rarr; Right)</span>
                <span>Actions</span>
              </div>

              {headerCategories.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  No categories in the header. Add one from the dropdown above.
                </div>
              ) : (
                headerCategories.map((cat, index) => (
                  <div
                    key={cat.id || cat.slug}
                    className="p-3.5 flex items-center justify-between gap-4 hover:bg-neutral-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank Number */}
                      <span className="w-6 h-6 rounded-md bg-neutral-800 text-neutral-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 p-1 flex items-center justify-center shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getCategoryIconUrl(cat)}
                          alt={cat.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/icons/categories/other.svg';
                          }}
                        />
                      </div>

                      {/* Name & Slug */}
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {cat.name}
                        </h4>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          /category/{cat.slug}
                        </span>
                      </div>
                    </div>

                    {/* Reorder & Remove Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleMoveHeaderCategory(index, index - 1)}
                        disabled={index === 0}
                        title="Move Left (Earlier in Header)"
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-25 transition-colors"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveHeaderCategory(index, index + 1)}
                        disabled={index === headerCategories.length - 1}
                        title="Move Right (Later in Header)"
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-25 transition-colors"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveHeaderCategory(cat.id)}
                        title="Remove from Header"
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 transition-colors ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Save Bar */}
            <div className="flex justify-end pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={handleSaveHeaderCategories}
                disabled={savingCategories}
                className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingCategories ? 'Saving Changes...' : 'Save Header Categories'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== PRODUCT SELECTOR MODAL ===================== */}
        {selectedSlotIndex !== null && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    Select Product for Slot #{selectedSlotIndex + 1}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Choose an active catalog product to display on Homepage Row {Math.floor(selectedSlotIndex / 3) + 1}, Column {(selectedSlotIndex % 3) + 1}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSlotIndex(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="p-4 border-b border-neutral-800 bg-neutral-950 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search by product name or SKU..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-white"
                      autoFocus
                    />
                  </div>

                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-white"
                  >
                    <option value="all">All Categories ({allProducts.length} items)</option>
                    {allCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Showing <strong className="text-white">{filteredProductsForPicker.length}</strong> of <strong className="text-white">{allProducts.length}</strong> catalog products</span>
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch('')}
                      className="text-neutral-400 hover:text-white transition-colors"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>

              {/* Product List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-neutral-800/40">
                {filteredProductsForPicker.length === 0 ? (
                  <div className="py-12 text-center text-xs text-neutral-500">
                    No products matched your search.
                  </div>
                ) : (
                  filteredProductsForPicker.map((product) => {
                    const alreadySlot = featuredProductSlots.findIndex(p => p?.id === product.id);
                    const isAlreadyAssigned = alreadySlot !== -1;
                    const isCurrentSlot = alreadySlot === selectedSlotIndex;

                    const imageUrl = product.image_url || 
                      (product.images && product.images[0]?.image_url) || 
                      '/placeholder.png';

                    return (
                      <div
                        key={product.id}
                        onClick={() => handleAssignProduct(product)}
                        className={`pt-2 first:pt-0 p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isCurrentSlot
                            ? 'bg-neutral-800 border border-white/20'
                            : 'hover:bg-neutral-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-neutral-950 overflow-hidden shrink-0 border border-neutral-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                              }}
                            />
                          </div>

                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block truncate">
                              {product.category?.name || 'Category'}
                            </span>
                            <h4 className="text-xs font-bold text-white truncate" title={product.name}>
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-black text-white">
                                ৳{product.price?.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-neutral-500">
                                Stock: {product.stock_quantity}
                              </span>
                              {product.is_active === false && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-medium">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {isAlreadyAssigned && (
                            <span className="text-[10px] px-2 py-0.5 bg-neutral-800 text-amber-300 border border-amber-500/30 rounded font-medium">
                              {isCurrentSlot ? 'Current Slot' : `In Slot #${alreadySlot + 1}`}
                            </span>
                          )}

                          <button
                            type="button"
                            className="px-3 py-1.5 bg-white text-black hover:bg-neutral-200 text-xs font-bold rounded-lg transition-colors"
                          >
                            {isCurrentSlot ? 'Keep' : 'Select'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedSlotIndex(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
