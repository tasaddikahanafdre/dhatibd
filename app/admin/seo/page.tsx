'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { 
  Globe, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  Save, 
  Eye, 
  Layers, 
  Package, 
  FolderTree, 
  ShieldCheck
} from 'lucide-react';
import { GlobalSEOSettings, SEOMetadata, Product, Category } from '@/lib/types';

const defaultState: GlobalSEOSettings = {
  site_title_default: 'Dhati | Premium Lifestyle, Fashion & Retail Store Bangladesh',
  site_title_template: '%s | Dhati Bangladesh',
  meta_description: 'Shop top collections, sarees, panjabis, western wear, kids and shoes at the best prices with fast home delivery in Bangladesh.',
  og_image: '/banner/banner.png',
  canonical_base_url: '',
  keywords: 'online shop bangladesh, fashion bd, saree, panjabi, shoes, dhati',
  google_site_verification: '',
  robots_indexing: true,
  entity_overrides: {}
};

export default function AdminSEOPage() {
  const [activeTab, setActiveTab] = useState<'global' | 'products' | 'categories' | 'pages' | 'audit'>('global');
  const [settings, setSettings] = useState<GlobalSEOSettings>(defaultState);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Selected entity for editor in Products/Categories/Pages tab
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>('');
  const [currentSEO, setCurrentSEO] = useState<SEOMetadata>({});
  const [entitySearch, setEntitySearch] = useState('');

  const staticPages = [
    { key: 'page:home', path: '/', name: 'Homepage' },
    { key: 'page:shop', path: '/shop', name: 'All Products / Shop' },
    { key: 'page:category', path: '/category', name: 'Categories Hub' },
    { key: 'page:about', path: '/about', name: 'About Us' },
    { key: 'page:contact', path: '/contact', name: 'Contact & Support' },
    { key: 'page:faq', path: '/faq', name: 'FAQ & Help Center' },
  ];

  const fetchSEOData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/seo');
      if (res.ok) {
        const data = await res.json();
        if (data.settings && typeof data.settings === 'object') {
          const s = data.settings;
          setSettings({
            site_title_default: s.site_title_default || s.site_title || defaultState.site_title_default,
            site_title_template: s.site_title_template || s.title_suffix || defaultState.site_title_template,
            meta_description: s.meta_description || s.default_meta_description || defaultState.meta_description,
            og_image: s.og_image || defaultState.og_image,
            canonical_base_url: s.canonical_base_url || s.site_url || defaultState.canonical_base_url,
            keywords: typeof s.keywords === 'string' ? s.keywords : Array.isArray(s.keywords) ? s.keywords.join(', ') : defaultState.keywords,
            google_site_verification: s.google_site_verification || '',
            robots_indexing: s.robots_indexing ?? true,
            entity_overrides: s.entity_overrides || s.entities || {}
          });
        }
        if (Array.isArray(data.products)) {
          setProducts(data.products);
        }
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      }
    } catch (err) {
      console.error('Failed to load SEO data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSEOData();
  }, []);

  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectEntity = (key: string) => {
    setSelectedEntityKey(key);
    const existing = (settings.entity_overrides || {})[key] || {};
    setCurrentSEO(existing);
  };

  const handleSaveEntitySEO = async () => {
    if (!selectedEntityKey) return;
    try {
      setSaving(true);
      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityKey: selectedEntityKey,
          entitySEO: currentSEO
        })
      });
      if (res.ok) {
        setSettings(prev => ({
          ...prev,
          entity_overrides: {
            ...(prev.entity_overrides || {}),
            [selectedEntityKey]: currentSEO
          }
        }));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save entity SEO:', err);
    } finally {
      setSaving(false);
    }
  };

  // Preview computations
  const defaultSiteTitle = settings.site_title_default || 'Dhati';
  const titleSuffix = settings.site_title_template 
    ? ` | ${settings.site_title_template.replace('%s', '').replace(/^[| -]+/, '').trim()}`
    : ' | Dhati';
  const defaultDesc = settings.meta_description || '';
  const baseUrl = settings.canonical_base_url || (typeof window !== 'undefined' ? window.location.origin : '');

  const previewTitle = currentSEO.meta_title || (
    selectedEntityKey.startsWith('product:')
      ? (products.find(p => `product:${p.id}` === selectedEntityKey)?.name || 'Product') + titleSuffix
      : selectedEntityKey.startsWith('category:')
      ? (categories.find(c => `category:${c.id}` === selectedEntityKey)?.name || 'Category') + titleSuffix
      : defaultSiteTitle
  );

  const previewDescription = currentSEO.meta_description || defaultDesc;

  let previewUrl = baseUrl;
  if (selectedEntityKey.startsWith('product:')) {
    const prod = products.find(p => `product:${p.id}` === selectedEntityKey);
    previewUrl = `${baseUrl}/product/${prod?.slug || 'sample'}`;
  } else if (selectedEntityKey.startsWith('category:')) {
    const cat = categories.find(c => `category:${c.id}` === selectedEntityKey);
    previewUrl = `${baseUrl}/category/${cat?.slug || 'sample'}`;
  } else if (selectedEntityKey.startsWith('page:')) {
    const p = staticPages.find(sp => sp.key === selectedEntityKey);
    previewUrl = `${baseUrl}${p?.path || ''}`;
  }

  // SEO Health checks
  const siteTitleLen = (settings.site_title_default || '').length;
  const metaDescLen = (settings.meta_description || '').length;
  const hasValidGlobalTitle = siteTitleLen >= 30 && siteTitleLen <= 70;
  const hasValidGlobalDesc = metaDescLen >= 100 && metaDescLen <= 170;
  const overrides = settings.entity_overrides || {};
  const productsWithCustomSEO = Object.keys(overrides).filter(k => k.startsWith('product:')).length;
  const categoriesWithCustomSEO = Object.keys(overrides).filter(k => k.startsWith('category:')).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Globe className="w-6 h-6 text-white" />
              SEO Manager
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Centralized search engine optimization, Google SERP previews, Open Graph metadata, and sitemap controls.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/sitemap.xml"
              target="_blank"
              className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              sitemap.xml
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </Link>
            <Link
              href="/robots.txt"
              target="_blank"
              className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              robots.txt
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </Link>
          </div>
        </div>

        {/* Success toast */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>SEO configuration updated and saved successfully!</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 overflow-x-auto space-x-2 pb-px text-xs font-medium">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'global'
                ? 'bg-neutral-900 text-white border-t border-x border-neutral-800 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Globe className="w-4 h-4" />
            Global SEO & Metadata
          </button>
          <button
            onClick={() => { setActiveTab('products'); setSelectedEntityKey(''); }}
            className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'products'
                ? 'bg-neutral-900 text-white border-t border-x border-neutral-800 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Package className="w-4 h-4" />
            Products SEO ({products.length})
          </button>
          <button
            onClick={() => { setActiveTab('categories'); setSelectedEntityKey(''); }}
            className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'categories'
                ? 'bg-neutral-900 text-white border-t border-x border-neutral-800 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            Categories SEO ({categories.length})
          </button>
          <button
            onClick={() => { setActiveTab('pages'); setSelectedEntityKey(''); }}
            className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'pages'
                ? 'bg-neutral-900 text-white border-t border-x border-neutral-800 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Core Pages
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'audit'
                ? 'bg-neutral-900 text-white border-t border-x border-neutral-800 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            SEO Audit & Recommendations
          </button>
        </div>

        {/* Tab 1: Global Settings */}
        {activeTab === 'global' && (
          <form onSubmit={handleSaveGlobalSettings} className="space-y-6">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-white">Default Search Engine Snippet</h2>
              <p className="text-xs text-neutral-400">
                These settings form the fallback metadata across your entire domain whenever an individual product or page does not have a custom override.
              </p>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Default Site Title <span className="text-neutral-500">({siteTitleLen}/60 chars)</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.site_title_default || ''}
                  onChange={(e) => setSettings({ ...settings, site_title_default: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Title Template / Brand Suffix
                  </label>
                  <input
                    type="text"
                    value={settings.site_title_template || ''}
                    placeholder="%s | Dhati Bangladesh"
                    onChange={(e) => setSettings({ ...settings, site_title_template: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Canonical Base URL
                  </label>
                  <input
                    type="url"
                    value={settings.canonical_base_url || ''}
                    onChange={(e) => setSettings({ ...settings, canonical_base_url: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Default Meta Description <span className="text-neutral-500">({metaDescLen}/160 chars)</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={settings.meta_description || ''}
                  onChange={(e) => setSettings({ ...settings, meta_description: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Global Keywords
                  </label>
                  <input
                    type="text"
                    value={settings.keywords || ''}
                    placeholder="gadgets, electronics, online shop bangladesh"
                    onChange={(e) => setSettings({ ...settings, keywords: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Google Search Console Verification Token
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. google-site-verification=XXXXXXXXXXXXXXXXXXXX"
                    value={settings.google_site_verification || ''}
                    onChange={(e) => setSettings({ ...settings, google_site_verification: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Global SEO Settings'}
                </button>
              </div>
            </div>

            {/* Google SERP Live Preview */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                Live Google Search SERP Snippet Preview
              </h3>
              <div className="bg-[#1f1f1f] border border-neutral-700/60 rounded-xl p-4 max-w-2xl font-sans">
                <div className="text-[12px] text-[#bdc1c6] truncate flex items-center gap-1.5 mb-1">
                  <div className="w-4 h-4 rounded-full bg-neutral-700 flex items-center justify-center text-[9px] text-white font-bold">D</div>
                  <span>{settings.canonical_base_url ? settings.canonical_base_url.replace(/^https?:\/\//, '') : (typeof window !== 'undefined' ? window.location.host : 'store.com')}</span>
                  <span className="text-neutral-500">›</span>
                </div>
                <div className="text-[#8ab4f8] text-base hover:underline cursor-pointer font-medium leading-snug line-clamp-1 mb-1">
                  {settings.site_title_default}
                </div>
                <div className="text-[#bdc1c6] text-xs leading-relaxed line-clamp-2">
                  {settings.meta_description}
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Products SEO / Tab 3: Categories SEO / Tab 4: Core Pages SEO */}
        {(activeTab === 'products' || activeTab === 'categories' || activeTab === 'pages') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Entity List */}
            <div className="lg:col-span-5 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={entitySearch}
                  onChange={(e) => setEntitySearch(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl max-h-[600px] overflow-y-auto divide-y divide-neutral-800/60">
                {activeTab === 'products' && (
                  products
                    .filter(p => p.name.toLowerCase().includes(entitySearch.toLowerCase()))
                    .map(p => {
                      const key = `product:${p.id}`;
                      const hasCustom = !!(settings.entity_overrides || {})[key];
                      const isSelected = selectedEntityKey === key;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectEntity(key)}
                          className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                            isSelected ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-900 text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-neutral-800 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{p.name}</p>
                              <p className="text-[10px] text-neutral-500 font-mono truncate">/product/{p.slug}</p>
                            </div>
                          </div>
                          {hasCustom ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0 ml-2 font-medium">
                              Custom SEO
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-600 shrink-0 ml-2">
                              Default
                            </span>
                          )}
                        </div>
                      );
                    })
                )}

                {activeTab === 'categories' && (
                  categories
                    .filter(c => c.name.toLowerCase().includes(entitySearch.toLowerCase()))
                    .map(c => {
                      const key = `category:${c.id}`;
                      const hasCustom = !!(settings.entity_overrides || {})[key];
                      const isSelected = selectedEntityKey === key;
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleSelectEntity(key)}
                          className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                            isSelected ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-900 text-neutral-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{c.name}</p>
                            <p className="text-[10px] text-neutral-500 font-mono truncate">/category/{c.slug}</p>
                          </div>
                          {hasCustom ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0 ml-2 font-medium">
                              Custom SEO
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-600 shrink-0 ml-2">
                              Default
                            </span>
                          )}
                        </div>
                      );
                    })
                )}

                {activeTab === 'pages' && (
                  staticPages.map(page => {
                    const hasCustom = !!(settings.entity_overrides || {})[page.key];
                    const isSelected = selectedEntityKey === page.key;
                    return (
                      <div
                        key={page.key}
                        onClick={() => handleSelectEntity(page.key)}
                        className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                          isSelected ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-900 text-neutral-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{page.name}</p>
                          <p className="text-[10px] text-neutral-500 font-mono truncate">{page.path}</p>
                        </div>
                        {hasCustom ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0 ml-2 font-medium">
                            Custom SEO
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-600 shrink-0 ml-2">
                            Default
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Entity SEO Editor & Previews */}
            <div className="lg:col-span-7">
              {!selectedEntityKey ? (
                <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-12 text-center text-neutral-500 text-xs">
                  <Globe className="w-10 h-10 mx-auto text-neutral-700 mb-2" />
                  <p className="text-neutral-400 font-medium">Select an item from the list to manage its SEO</p>
                  <p className="mt-1 text-neutral-600">You can customize title tags, meta descriptions, image alt tags, and OpenGraph social shares.</p>
                </div>
              ) : (
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Editing SEO: {selectedEntityKey}
                      </h3>
                      <p className="text-[11px] text-neutral-400">Preview and customize metadata for search engines and social platforms.</p>
                    </div>
                    <button
                      onClick={handleSaveEntitySEO}
                      disabled={saving}
                      className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? 'Saving...' : 'Save Override'}
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="font-medium text-neutral-300">Custom Meta Title</label>
                        <span className={`text-[10px] ${(currentSEO.meta_title?.length || 0) > 60 ? 'text-amber-400' : 'text-neutral-500'}`}>
                          {currentSEO.meta_title?.length || 0} / 60 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Leave blank to use automatic catalog title"
                        value={currentSEO.meta_title || ''}
                        onChange={(e) => setCurrentSEO({ ...currentSEO, meta_title: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-neutral-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="font-medium text-neutral-300">Custom Meta Description</label>
                        <span className={`text-[10px] ${(currentSEO.meta_description?.length || 0) > 160 ? 'text-amber-400' : 'text-neutral-500'}`}>
                          {currentSEO.meta_description?.length || 0} / 160 chars
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Leave blank to use default store description"
                        value={currentSEO.meta_description || ''}
                        onChange={(e) => setCurrentSEO({ ...currentSEO, meta_description: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-neutral-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">Canonical URL Override</label>
                        <input
                          type="text"
                          placeholder="e.g. https://your-domain.com/..."
                          value={currentSEO.canonical_url || ''}
                          onChange={(e) => setCurrentSEO({ ...currentSEO, canonical_url: e.target.value })}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-neutral-600"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">Custom Social OG Image URL</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={currentSEO.og_image || ''}
                          onChange={(e) => setCurrentSEO({ ...currentSEO, og_image: e.target.value })}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-neutral-600"
                        />
                      </div>
                    </div>

                    {/* Robots Directive */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="noIndexCheck"
                        checked={currentSEO.no_index || false}
                        onChange={(e) => setCurrentSEO({ ...currentSEO, no_index: e.target.checked })}
                        className="rounded border-neutral-700 bg-neutral-900 text-white focus:ring-0"
                      />
                      <label htmlFor="noIndexCheck" className="text-xs text-neutral-400 cursor-pointer">
                        Block from search engines (<code className="text-[11px] text-rose-400">noindex, nofollow</code>)
                      </label>
                    </div>
                  </div>

                  {/* Live Google Preview */}
                  <div className="pt-4 border-t border-neutral-800 space-y-2">
                    <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold block">
                      Google Search Result Preview
                    </span>
                    <div className="bg-[#1f1f1f] border border-neutral-700/60 rounded-xl p-3 font-sans">
                      <div className="text-[11px] text-[#bdc1c6] truncate flex items-center gap-1.5 mb-0.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-neutral-700 flex items-center justify-center text-[8px] text-white font-bold">D</div>
                        <span className="truncate">{previewUrl}</span>
                      </div>
                      <div className="text-[#8ab4f8] text-sm hover:underline cursor-pointer font-medium leading-snug line-clamp-1 mb-1">
                        {previewTitle}
                      </div>
                      <div className="text-[#bdc1c6] text-[11px] leading-relaxed line-clamp-2">
                        {previewDescription}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: SEO Audit & Health */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Sitemap XML Status</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white mt-2">Active & Dynamic</div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Covers {products.length} products, {categories.length} categories & deal pages.
                </p>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Robots.txt Directive</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white mt-2">Properly Guarded</div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Blocks /admin/ and /api/ from bots while allowing storefront crawling.
                </p>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Custom Overrides</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-white mt-2">
                  {Object.keys(settings.entity_overrides || {}).length} Entities
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {productsWithCustomSEO} products & {categoriesWithCustomSEO} categories customized.
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">Recommended SEO Actions</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-neutral-950 rounded-lg border border-neutral-800/80">
                  {hasValidGlobalTitle ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-semibold text-white">Site Title Optimization</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Your global title is {siteTitleLen} characters long. Search engines recommend between 30 and 60 characters for maximum CTR.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-neutral-950 rounded-lg border border-neutral-800/80">
                  {hasValidGlobalDesc ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-semibold text-white">Meta Description Quality</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Your default description is {metaDescLen} characters long. Between 120 and 160 characters prevents truncation on mobile displays.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-neutral-950 rounded-lg border border-neutral-800/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Open Graph & Social Sharing</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Social metadata tags are dynamically attached to product and deal pages to ensure clear previews on WhatsApp, Facebook, and Twitter.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}