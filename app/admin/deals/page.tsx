'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { 
  Flame, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Copy, 
  Check, 
  Calendar, 
  ToggleLeft, 
  ToggleRight, 
  Tag, 
  ArrowUp, 
  ArrowDown, 
  X, 
  AlertCircle,
  Eye,
  ShoppingBag,
  Sparkles,
  Layers,
  Palette
} from 'lucide-react';
import { DealPage, DealProduct, Product } from '@/lib/types';
import { getProductPrimaryImage } from '@/lib/utils';

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<DealPage[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Builder Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#e11d48');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [dealProducts, setDealProducts] = useState<DealProduct[]>([]);

  // Product Picker state inside builder
  const [productSearch, setProductSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resDeals, resProducts] = await Promise.all([
        fetch('/api/deals?all=true'),
        fetch('/api/products?all=true&includeInactive=true')
      ]);

      if (resDeals.ok) {
        const data = await resDeals.json();
        setDeals(Array.isArray(data) ? data : []);
      }
      if (resProducts.ok) {
        const data = await resProducts.json();
        setCatalogProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load deals data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingDeal) {
      setSlug(generateSlug(val));
    }
  };

  const openCreateBuilder = () => {
    setEditingDeal(null);
    setTitle('');
    setSlug('');
    setSubtitle('Exclusive limited-time discounts on our top selected gear');
    setDescription('');
    setBannerUrl('');
    setAccentColor('#e11d48');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setDealProducts([]);
    setErrorMsg('');
    setIsBuilderOpen(true);
  };

  const openEditBuilder = (deal: DealPage) => {
    setEditingDeal(deal);
    setTitle(deal.title);
    setSlug(deal.slug);
    setSubtitle(deal.subtitle || '');
    setDescription(deal.description || '');
    setBannerUrl(deal.banner_url || '');
    setAccentColor(deal.accent_color || '#e11d48');
    setStartDate(deal.start_date ? deal.start_date.substring(0, 10) : '');
    setEndDate(deal.end_date ? deal.end_date.substring(0, 10) : '');
    setIsActive(deal.is_active);
    setDealProducts(deal.products || []);
    setErrorMsg('');
    setIsBuilderOpen(true);
  };

  const addProductToDeal = (product: Product) => {
    if (dealProducts.some(dp => dp.product_id === product.id)) return;

    const newDealProduct: DealProduct = {
      product_id: product.id,
      discount_type: 'percentage',
      discount_value: 15,
      custom_badge: 'SPECIAL DEAL',
      sort_order: dealProducts.length
    };
    setDealProducts([...dealProducts, newDealProduct]);
  };

  const removeProductFromDeal = (productId: string) => {
    setDealProducts(dealProducts.filter(dp => dp.product_id !== productId));
  };

  const updateDealProduct = (productId: string, updates: Partial<DealProduct>) => {
    setDealProducts(dealProducts.map(dp => {
      if (dp.product_id === productId) {
        return { ...dp, ...updates };
      }
      return dp;
    }));
  };

  const moveProductOrder = (index: number, direction: 'up' | 'down') => {
    const newItems = [...dealProducts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // reassign sort_orders
    const reordered = newItems.map((item, idx) => ({ ...item, sort_order: idx }));
    setDealProducts(reordered);
  };

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Deal page title is required.');
      return;
    }

    if (!slug.trim()) {
      setErrorMsg('URL Slug is required.');
      return;
    }

    if (dealProducts.length === 0) {
      setErrorMsg('Please add at least one product to this deal page.');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim() || undefined,
        banner_url: bannerUrl.trim() || undefined,
        accent_color: accentColor,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        is_active: isActive,
        products: dealProducts.map((p, idx) => ({
          product_id: p.product_id,
          discount_type: p.discount_type,
          discount_value: Number(p.discount_value),
          custom_badge: p.custom_badge?.trim() || undefined,
          sort_order: idx
        }))
      };

      let res;
      if (editingDeal) {
        payload.id = editingDeal.id;
        res = await fetch('/api/deals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save deal page.');
      }

      setIsBuilderOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving deal page.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (deal: DealPage) => {
    try {
      const res = await fetch('/api/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deal.id,
          is_active: !deal.is_active
        })
      });
      if (res.ok) {
        setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, is_active: !d.is_active } : d));
      }
    } catch (err) {
      console.error('Failed to toggle deal status:', err);
    }
  };

  const handleDeleteDeal = async (id: string, dealTitle: string) => {
    if (!confirm(`Are you sure you want to delete deal page "${dealTitle}"?`)) return;

    try {
      const res = await fetch(`/api/deals?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeals(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const copySlugLink = (dealSlug: string) => {
    const fullUrl = `${window.location.origin}/deal/${dealSlug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(dealSlug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const filteredDeals = deals.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-rose-500" />
              Deal Page Maker
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Create standalone promotional landing pages with custom per-product deals without modifying catalog prices.
            </p>
          </div>
          <button
            onClick={openCreateBuilder}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-neutral-200 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Deal Page
          </button>
        </div>

        {/* Protection Note */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-start gap-3">
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-emerald-300">Catalog Price Protection Active:</span> Deals created here apply strictly when visitors access that specific deal landing page. Your regular catalog prices on the homepage, category pages, search results, and regular product pages remain completely untouched.
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-neutral-900/40 p-3 rounded-xl border border-neutral-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search deal page name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div className="text-xs text-neutral-400">
            {filteredDeals.length} Deal Pages
          </div>
        </div>

        {/* Deals Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-neutral-500 text-sm">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-neutral-600 border-t-white mb-2" />
            <p>Loading deal pages...</p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl py-20 text-center">
            <Flame className="w-12 h-12 mx-auto text-neutral-700 mb-3" />
            <h3 className="text-base font-semibold text-white">No Deal Pages Created Yet</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-5">
              Launch high-converting landing pages for seasonal sales, flash campaigns, or product bundles.
            </p>
            <button
              onClick={openCreateBuilder}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Deal Page
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDeals.map((deal) => {
              const isExpired = deal.end_date && new Date(deal.end_date) < new Date();
              return (
                <div 
                  key={deal.id}
                  className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden flex flex-col hover:border-neutral-700 transition-colors"
                >
                  {/* Card Banner / Header Preview */}
                  <div 
                    className="h-28 relative flex items-center justify-center p-4 text-center overflow-hidden bg-neutral-950"
                    style={{ borderTop: `4px solid ${deal.accent_color || '#e11d48'}` }}
                  >
                    {deal.banner_url ? (
                      <img 
                        src={deal.banner_url} 
                        alt={deal.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-35" 
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black opacity-80" />
                    )}
                    <div className="relative z-10">
                      <span 
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white inline-block mb-1 shadow-sm"
                        style={{ backgroundColor: deal.accent_color || '#e11d48' }}
                      >
                        {deal.products?.length || 0} Products on Deal
                      </span>
                      <h3 className="text-base font-bold text-white line-clamp-1">{deal.title}</h3>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Slug & Copy */}
                      <div className="flex items-center justify-between text-xs text-neutral-400 bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800/80">
                        <span className="font-mono text-neutral-300 truncate">/deal/{deal.slug}</span>
                        <button
                          onClick={() => copySlugLink(deal.slug)}
                          className="text-neutral-500 hover:text-white transition-colors shrink-0 ml-2"
                          title="Copy Link"
                        >
                          {copiedSlug === deal.slug ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Dates */}
                      <div className="mt-3 text-xs text-neutral-400 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          {deal.end_date ? (
                            <span>Ends: {deal.end_date.substring(0, 10)}</span>
                          ) : (
                            <span className="text-neutral-500">No time limit</span>
                          )}
                        </div>
                        {isExpired && (
                          <span className="text-rose-400 font-medium">Expired</span>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleStatus(deal)}
                        className="flex items-center gap-1.5 focus:outline-none"
                      >
                        {deal.is_active ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-emerald-400" />
                            <span className="text-xs text-emerald-400 font-medium">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-neutral-600" />
                            <span className="text-xs text-neutral-500">Disabled</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1">
                        <Link
                          href={`/deal/${deal.slug}`}
                          target="_blank"
                          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                          title="View Live Page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEditBuilder(deal)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                          title="Edit Deal Page"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDeal(deal.id, deal.title)}
                          className="p-1.5 text-neutral-400 hover:text-rose-400 rounded hover:bg-neutral-800 transition-colors"
                          title="Delete Deal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Builder Modal */}
        {isBuilderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl p-6 my-6 text-white relative shadow-2xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-500" />
                    {editingDeal ? 'Edit Deal Landing Page' : 'Create New Deal Landing Page'}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Configure your promotional campaign, select products, and specify custom discounts.
                  </p>
                </div>
                <button
                  onClick={() => setIsBuilderOpen(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="my-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Scrollable Form Body */}
              <form onSubmit={handleSaveDeal} className="flex-1 overflow-y-auto pr-1 py-4 space-y-6">
                {/* 1. Page Details */}
                <div className="space-y-4 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    1. Page Identity & Banner Settings
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Deal Title <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Winter Flash Sale"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        URL Slug <span className="text-rose-400">*</span>
                      </label>
                      <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                        <span className="px-3 py-2 bg-neutral-950 text-neutral-500 text-xs border-r border-neutral-800">
                          /deal/
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="winter-flash-sale"
                          value={slug}
                          onChange={(e) => setSlug(generateSlug(e.target.value))}
                          className="flex-1 bg-neutral-900 px-3 py-2 text-sm text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Promotional Subtitle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Special discounts up to 30% off for 48 hours only"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Hero Banner Image URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={bannerUrl}
                        onChange={(e) => setBannerUrl(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Accent Theme Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="w-10 h-9 bg-neutral-900 border border-neutral-800 rounded cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dates & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Start Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        End Date / Countdown (Optional)
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 sm:pt-6">
                      <input
                        type="checkbox"
                        id="dealIsActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="rounded border-neutral-700 bg-neutral-900 text-white focus:ring-0"
                      />
                      <label htmlFor="dealIsActive" className="text-xs text-neutral-300 cursor-pointer">
                        Page is Active
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. Select & Configure Deal Products */}
                <div className="space-y-4 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        2. Deal Products ({dealProducts.length} selected)
                      </h3>
                      <p className="text-[11px] text-neutral-500">
                        Select catalog items and set custom promotional prices.
                      </p>
                    </div>
                  </div>

                  {/* Catalog Selector Dropdown / Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Type to search and add products from your catalog..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                    />

                    {/* Search Results Dropdown */}
                    {productSearch.trim().length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-20 divide-y divide-neutral-800/80">
                        {catalogProducts
                          .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                          .slice(0, 10)
                          .map(p => {
                            const alreadyAdded = dealProducts.some(dp => dp.product_id === p.id);
                            return (
                              <div 
                                key={p.id}
                                className="p-2.5 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-lg bg-neutral-950 overflow-hidden shrink-0 border border-neutral-800 flex items-center justify-center">
                                    <img 
                                      src={getProductPrimaryImage(p)} 
                                      alt={p.name} 
                                      className="w-full h-full object-cover" 
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-white truncate">{p.name}</p>
                                    <p className="text-[10px] text-neutral-400">Regular: ৳{p.price}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  disabled={alreadyAdded}
                                  onClick={() => {
                                    addProductToDeal(p);
                                    setProductSearch('');
                                  }}
                                  className="px-2.5 py-1 text-xs font-medium rounded bg-white text-black hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                  {alreadyAdded ? 'Added' : 'Add to Deal'}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Selected Products List */}
                  {dealProducts.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-neutral-800 rounded-xl text-neutral-500 text-xs">
                      No products added to this deal yet. Use the search bar above to select products.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dealProducts.map((dp, index) => {
                        const product = catalogProducts.find(p => p.id === dp.product_id);
                        const regPrice = product ? product.price : 1000;
                        
                        let dealPrice = regPrice;
                        if (dp.discount_type === 'percentage') {
                          dealPrice = Math.max(0, Math.round(regPrice * (1 - (dp.discount_value / 100))));
                        } else {
                          dealPrice = Math.max(0, regPrice - dp.discount_value);
                        }
                        const savedAmount = Math.max(0, regPrice - dealPrice);

                        return (
                          <div 
                            key={dp.product_id}
                            className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"
                          >
                            {/* Product Info */}
                            <div className="flex items-center gap-3 min-w-0 md:w-1/3">
                              <div className="w-10 h-10 rounded-lg bg-neutral-950 overflow-hidden shrink-0 border border-neutral-800 flex items-center justify-center">
                                <img 
                                  src={getProductPrimaryImage(product)} 
                                  alt={product?.name || 'Product'} 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-white truncate">{product?.name || 'Product'}</h4>
                                <p className="text-[11px] text-neutral-400">
                                  Catalog: <span className="line-through text-neutral-500">৳{regPrice}</span>
                                </p>
                              </div>
                            </div>

                            {/* Discount Controls */}
                            <div className="flex flex-wrap items-center gap-2 md:w-1/2">
                              {/* Discount Type */}
                              <select
                                value={dp.discount_type}
                                onChange={(e) => updateDealProduct(dp.product_id, { discount_type: e.target.value as any })}
                                className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                              >
                                <option value="percentage">% Off</option>
                                <option value="fixed">৳ Off</option>
                              </select>

                              {/* Value Input */}
                              <input
                                type="number"
                                min="1"
                                value={dp.discount_value}
                                onChange={(e) => updateDealProduct(dp.product_id, { discount_value: parseFloat(e.target.value) || 0 })}
                                className="w-20 bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none"
                              />

                              {/* Custom Badge */}
                              <input
                                type="text"
                                placeholder="Badge (e.g. HOT)"
                                value={dp.custom_badge || ''}
                                onChange={(e) => updateDealProduct(dp.product_id, { custom_badge: e.target.value })}
                                className="w-28 bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none uppercase"
                              />

                              {/* Live Calculation Badge */}
                              <div className="px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-[11px]">
                                <span className="text-emerald-400 font-bold">৳{dealPrice}</span>
                                <span className="text-neutral-500 text-[10px] ml-1">(-৳{savedAmount})</span>
                              </div>
                            </div>

                            {/* Order & Remove Actions */}
                            <div className="flex items-center gap-1 self-end md:self-center">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => moveProductOrder(index, 'up')}
                                className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === dealProducts.length - 1}
                                onClick={() => moveProductOrder(index, 'down')}
                                className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeProductFromDeal(dp.product_id)}
                                className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 ml-1"
                                title="Remove from deal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Save Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsBuilderOpen(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingDeal ? 'Save Deal Page' : 'Create Deal Page'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}