'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  DownloadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Pause, 
  XCircle, 
  RotateCcw, 
  Upload, 
  FileText, 
  Sliders, 
  FolderTree, 
  History, 
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface SupplierStatus {
  status: string;
  limitation_code?: string;
  limitation_message?: string;
  http_status?: number;
  latency_ms?: number;
  last_checked_at?: string;
}

interface ImportJob {
  id: string;
  job_type: string;
  status: string;
  total_discovered: number;
  total_imported: number;
  total_updated: number;
  total_skipped: number;
  total_failed: number;
  images_downloaded: number;
  current_batch: number;
  total_batches: number;
  progress_percent: number;
  created_at: string;
  completed_at?: string | null;
}

interface FailedItem {
  id: string;
  supplier_product_id: string;
  name: string;
  status: string;
  error_message: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductImporterAdmin() {
  const [activeTab, setActiveTab] = useState<'upload' | 'pricing' | 'categories' | 'failed' | 'history'>('upload');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const [supplierStatus, setSupplierStatus] = useState<SupplierStatus | null>(null);
  const [activeJob, setActiveJob] = useState<ImportJob | null>(null);
  const [history, setHistory] = useState<ImportJob[]>([]);
  const [failedItems, setFailedItems] = useState<FailedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Config State
  const [pricingConfig, setPricingConfig] = useState<{
    markup_type: 'none' | 'fixed' | 'percentage';
    markup_value: number;
    auto_publish: boolean;
  }>({
    markup_type: 'none',
    markup_value: 0,
    auto_publish: false
  });

  const [categoryMappings, setCategoryMappings] = useState<Record<string, string>>({});
  const [newCatSupplier, setNewCatSupplier] = useState('');
  const [newCatDhati, setNewCatDhati] = useState('');

  // Upload state
  const [rawJsonInput, setRawJsonInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll state every 3.5 seconds if a job is actively running
  useEffect(() => {
    fetchState();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeJob && (activeJob.status === 'running' || activeJob.status === 'pending')) {
      interval = setInterval(() => {
        fetchState(true);
      }, 3500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeJob]);

  const fetchState = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/importer');
      const data = await res.json();
      if (data.success && data.state) {
        setSupplierStatus(data.state.supplier_status);
        setActiveJob(data.state.active_job);
        setHistory(data.state.history || []);
        setFailedItems(data.state.failed_items || []);
        if (data.state.pricing_config) setPricingConfig(data.state.pricing_config);
        if (data.state.category_mappings) setCategoryMappings(data.state.category_mappings);
        if (data.categories) setCategories(data.categories);
      }
    } catch {
      if (!silent) setMessage({ type: 'error', text: 'Failed to connect to importer service' });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAction = async (action: string, payload: any = {}) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/importer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'check_supplier') {
          setMessage({ type: 'success', text: 'Supplier connectivity check refreshed' });
        } else if (action === 'test_sample') {
          setMessage({ 
            type: 'success', 
            text: `Test import completed! ${data.result?.importedCount || 0} products imported, ${data.result?.imagesCount || 0} images downloaded to Supabase.` 
          });
        } else if (action === 'update_config') {
          setMessage({ type: 'success', text: 'Configuration rules saved successfully.' });
        } else if (action === 'retry_failed') {
          setMessage({ type: 'success', text: 'Retried failed products successfully.' });
        } else if (action === 'upload_catalog') {
          setMessage({ 
            type: 'success', 
            text: `Bulk import completed! ${data.result?.importedCount || 0} imported, ${data.result?.updatedCount || 0} updated, ${data.result?.failedCount || 0} failed.` 
          });
          setRawJsonInput('');
        }
        await fetchState(true);
      } else {
        setMessage({ type: 'error', text: data.error || 'Operation failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Network error occurred' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          const productsArray = Array.isArray(parsed) ? parsed : (parsed.products || parsed.items || []);
          if (productsArray.length === 0) {
            setMessage({ type: 'error', text: 'No products array found in JSON file' });
            return;
          }
          await handleAction('upload_catalog', { products: productsArray });
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n').filter(l => l.trim().length > 0);
          if (lines.length <= 1) {
            setMessage({ type: 'error', text: 'CSV file contains no product rows' });
            return;
          }
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
          const products = [];
          for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
            const p: any = {};
            headers.forEach((h, idx) => {
              p[h] = row[idx];
            });
            products.push({
              supplier_product_id: p.id || p.product_id || p.sku || `CSV-${i}`,
              name: p.name || p.title || `Product ${i}`,
              sku: p.sku,
              supplier_price: Number(p.price || p.cost || p.supplier_price || 0),
              discount_price: p.discount_price ? Number(p.discount_price) : undefined,
              category_name: p.category || p.category_name,
              main_image_url: p.image || p.image_url || p.main_image || '',
              short_description: p.short_description || p.description,
              description: p.description
            });
          }
          await handleAction('upload_catalog', { products });
        } else {
          setMessage({ type: 'error', text: 'Please upload a .json or .csv file' });
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: `Failed to read file: ${err?.message}` });
      }
    };
    reader.readAsText(file);
  };

  const handleManualJsonImport = () => {
    if (!rawJsonInput.trim()) {
      setMessage({ type: 'error', text: 'Please enter JSON product catalogue text' });
      return;
    }
    try {
      const parsed = JSON.parse(rawJsonInput);
      const products = Array.isArray(parsed) ? parsed : (parsed.products || parsed.items || []);
      if (!Array.isArray(products) || products.length === 0) {
        setMessage({ type: 'error', text: 'Invalid JSON: Expected an array of products' });
        return;
      }
      handleAction('upload_catalog', { products });
    } catch {
      setMessage({ type: 'error', text: 'Invalid JSON syntax. Please verify JSON format.' });
    }
  };

  const handleAddCategoryMapping = () => {
    if (!newCatSupplier.trim() || !newCatDhati) return;
    const updated = { ...categoryMappings, [newCatSupplier.trim()]: newCatDhati };
    setCategoryMappings(updated);
    setNewCatSupplier('');
    handleAction('update_config', { category_mappings: updated });
  };

  const handleRemoveCategoryMapping = (supplierKey: string) => {
    const updated = { ...categoryMappings };
    delete updated[supplierKey];
    setCategoryMappings(updated);
    handleAction('update_config', { category_mappings: updated });
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-16">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                Supplier Hub
              </span>
              <span className="text-xs text-neutral-400">Node.js + Supabase Storage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase mt-1">
              DropBazar BD Catalog Importer
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Automated fashion catalog importer connected to <code className="text-neutral-300 font-mono">https://www.dropbazarbd.com/api/v1</code>, with sizes, colors, and live image persistence.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => handleAction('check_supplier')}
              disabled={actionLoading}
              className="px-3.5 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg flex items-center gap-2 border border-neutral-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Check Connection</span>
            </button>

            <button
              onClick={() => handleAction('test_sample')}
              disabled={actionLoading || (activeJob && activeJob.status === 'running')}
              className="px-4 py-2 text-xs font-bold bg-white text-black hover:bg-neutral-200 rounded-lg flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Run Sample Test Import (5 Products)</span>
            </button>
          </div>
        </div>

        {/* Status Notification Alert */}
        {message && (
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' :
            message.type === 'error' ? 'bg-red-950/40 border-red-800/80 text-red-200' :
            'bg-blue-950/40 border-blue-800/80 text-blue-200'
          }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />}
              <span className="text-xs sm:text-sm font-medium">{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-xs text-neutral-400 hover:text-white p-1">✕</button>
          </div>
        )}

        {/* SECTION 1: Supplier Connection & Security Status */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-3.5 h-3.5 rounded-full animate-pulse ${
                supplierStatus?.status === 'connected' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' :
                supplierStatus?.status === 'challenge_gated' ? 'bg-amber-500 shadow-lg shadow-amber-500/50' :
                'bg-red-500'
              }`} />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Supplier Host: <span className="font-mono text-neutral-300">dropbazarbd.com</span>
                  <a href="https://www.dropbazarbd.com/" target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-300">
                    <ExternalLink className="w-3.5 h-3.5 inline" />
                  </a>
                </h3>
                <p className="text-xs text-neutral-400">
                  Status: <span className="font-semibold text-white capitalize">{supplierStatus?.status?.replace('_', ' ') || 'Checking...'}</span>
                  {supplierStatus?.latency_ms ? ` • Latency: ${supplierStatus.latency_ms}ms` : ''}
                  {supplierStatus?.last_checked_at ? ` • Checked: ${new Date(supplierStatus.last_checked_at).toLocaleTimeString()}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction('check_supplier')}
                className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 rounded-md transition"
              >
                Scan Catalogue
              </button>
              <button
                onClick={() => handleAction('check_supplier')}
                className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 rounded-md transition"
              >
                Scan All Categories
              </button>
            </div>
          </div>

          {/* Cloudflare Challenge Security Notice */}
          {supplierStatus?.status === 'challenge_gated' && (
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-amber-200">
                    Cloudflare Verification Challenge Active
                  </p>
                  <p className="text-neutral-400 leading-relaxed">
                    Mohasagor has deployed Cloudflare challenge protection (<code className="text-neutral-300">wsidchk</code>). As mandated by security guidelines, automated crawling halts to respect site restrictions. You can seamlessly use the <strong>Bulk Catalogue Upload</strong> below (JSON or CSV) or the <strong>Sample Test Importer</strong> to import full product catalogues with images and pricing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Active Import Job & Progress Bar */}
        {activeJob && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Active Import Execution
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  Job #{activeJob.id}
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                    activeJob.status === 'running' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    activeJob.status === 'paused' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    activeJob.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    'bg-neutral-800 text-neutral-400'
                  }`}>
                    {activeJob.status}
                  </span>
                </h3>
              </div>

              {/* Pause / Resume / Cancel Controls */}
              <div className="flex items-center gap-2">
                {activeJob.status === 'running' && (
                  <button
                    onClick={() => handleAction('pause_job')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg flex items-center gap-1.5 border border-neutral-700 transition cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                )}

                {activeJob.status === 'paused' && (
                  <button
                    onClick={() => handleAction('resume_job')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </button>
                )}

                <button
                  onClick={() => handleAction('cancel_job')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-xs font-semibold bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Import</span>
                </button>
              </div>
            </div>

            {/* Progress percentage bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400">Import Progress</span>
                <span className="font-bold text-white">{activeJob.progress_percent}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, activeJob.progress_percent))}%` }}
                />
              </div>
            </div>

            {/* 8 Required Metrics Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 text-center">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Discovered</span>
                <span className="text-lg font-bold text-white mt-1 block">{activeJob.total_discovered}</span>
              </div>
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 text-center">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Imported</span>
                <span className="text-lg font-bold text-emerald-400 mt-1 block">{activeJob.total_imported}</span>
              </div>
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 text-center">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Updated</span>
                <span className="text-lg font-bold text-blue-400 mt-1 block">{activeJob.total_updated}</span>
              </div>
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 text-center">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Skipped</span>
                <span className="text-lg font-bold text-neutral-400 mt-1 block">{activeJob.total_skipped}</span>
              </div>
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 text-center">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Failed</span>
                <span className="text-lg font-bold text-red-400 mt-1 block">{activeJob.total_failed}</span>
              </div>
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 text-center">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Images Saved</span>
                <span className="text-lg font-bold text-purple-400 mt-1 block">{activeJob.images_downloaded}</span>
              </div>
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 text-center">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Batch</span>
                <span className="text-lg font-bold text-white mt-1 block">{activeJob.current_batch}/{activeJob.total_batches || 1}</span>
              </div>
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 text-center">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Completed</span>
                <span className="text-lg font-bold text-white mt-1 block">{activeJob.progress_percent}%</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: Tab Navigation */}
        <div className="border-b border-neutral-800 flex items-center gap-1 sm:gap-2 overflow-x-auto pb-px">
          {[
            { id: 'upload', label: 'Import Catalogue', icon: Upload },
            { id: 'pricing', label: 'Pricing Configuration', icon: Sliders },
            { id: 'categories', label: 'Category Mapping', icon: FolderTree },
            { id: 'failed', label: `Failed Products (${failedItems.length})`, icon: AlertTriangle },
            { id: 'history', label: `History (${history.length})`, icon: History },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'border-white text-white bg-neutral-900/40' 
                    : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: BULK CATALOGUE IMPORT */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Direct Catalogue Import</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Upload Mohasagor product export files (JSON or CSV) or paste catalogue data. Images will be automatically downloaded and stored permanently in Supabase Storage.
                </p>
              </div>

              {/* Drag & drop upload area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-700 hover:border-neutral-500 bg-neutral-950/40 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-12 h-12 bg-neutral-800 text-white rounded-full flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Click or drag & drop supplier catalog file</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Supports .JSON or .CSV formats with product arrays</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".json,.csv" 
                  className="hidden" 
                />
              </div>

              {/* Paste JSON manually */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-neutral-300">Or Paste Raw Catalogue JSON</label>
                  <button 
                    onClick={() => {
                      setRawJsonInput(JSON.stringify([
                        {
                          "supplier_product_id": "MOH-SAMPLE-101",
                          "name": "Baseus Bowie EZ10 Ultra Low-Latency Wireless Earbuds",
                          "sku": "MOH-EZ10",
                          "supplier_price": 1450,
                          "discount_price": 1950,
                          "category_name": "Tech",
                          "main_image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
                          "short_description": "0.06s Ultra-low latency gaming and music TWS earbuds with 25H battery life."
                        }
                      ], null, 2));
                    }}
                    className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
                  >
                    Insert Example Template
                  </button>
                </div>
                <textarea
                  value={rawJsonInput}
                  onChange={(e) => setRawJsonInput(e.target.value)}
                  placeholder="Paste JSON array: [{ supplier_product_id, name, supplier_price, category_name, main_image_url, ... }]"
                  rows={6}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-200 focus:outline-none focus:border-white"
                />
                <button
                  onClick={handleManualJsonImport}
                  disabled={actionLoading || !rawJsonInput.trim()}
                  className="px-5 py-2.5 text-xs font-bold bg-white text-black hover:bg-neutral-200 rounded-lg flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Import Products from Input</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRICING CONFIGURATION */}
        {activeTab === 'pricing' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Pricing & Markup Rules</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Configure Dhati retail prices relative to Mohasagor supplier wholesale prices. Supplier prices are permanently saved in <code className="text-neutral-300">cost_price</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Markup Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300">Markup Calculation Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: 'No Markup (1:1)' },
                    { id: 'fixed', label: 'Fixed BDT (+৳)' },
                    { id: 'percentage', label: 'Percentage (+%)' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPricingConfig({ ...pricingConfig, markup_type: m.id as any })}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                        pricingConfig.markup_type === m.id
                          ? 'bg-white text-black border-white'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Markup Value */}
              {pricingConfig.markup_type !== 'none' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-300">
                    {pricingConfig.markup_type === 'fixed' ? 'Fixed Markup Amount (BDT ৳)' : 'Percentage Markup (%)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pricingConfig.markup_value}
                    onChange={(e) => setPricingConfig({ ...pricingConfig, markup_value: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                    placeholder={pricingConfig.markup_type === 'fixed' ? 'e.g. 150 BDT' : 'e.g. 15%'}
                  />
                </div>
              )}
            </div>

            {/* Auto-publish switch */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Auto-Publish to Storefront</p>
                <p className="text-xs text-neutral-500">
                  When enabled, successfully imported products with valid prices will immediately be active. Default is DRAFT for safe administrator review.
                </p>
              </div>
              <input
                type="checkbox"
                checked={pricingConfig.auto_publish}
                onChange={(e) => setPricingConfig({ ...pricingConfig, auto_publish: e.target.checked })}
                className="w-5 h-5 accent-white rounded cursor-pointer"
              />
            </div>

            <button
              onClick={() => handleAction('update_config', { pricing_config: pricingConfig })}
              disabled={actionLoading}
              className="px-5 py-2.5 text-xs font-bold bg-white text-black hover:bg-neutral-200 rounded-lg flex items-center gap-2 cursor-pointer transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Pricing Configuration</span>
            </button>
          </div>
        )}

        {/* TAB 3: CATEGORY MAPPING */}
        {activeTab === 'categories' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Supplier Category Routing</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Route supplier category names to your Dhati store categories.
              </p>
            </div>

            {/* Add Mapping Form */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-neutral-950/60 p-4 border border-neutral-800 rounded-xl">
              <input
                type="text"
                placeholder="Supplier Category (e.g. Earphones)"
                value={newCatSupplier}
                onChange={(e) => setNewCatSupplier(e.target.value)}
                className="w-full sm:flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
              />
              <ArrowRight className="w-4 h-4 text-neutral-500 shrink-0 hidden sm:block" />
              <select
                value={newCatDhati}
                onChange={(e) => setNewCatDhati(e.target.value)}
                className="w-full sm:flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white cursor-pointer"
              >
                <option value="">Select Dhati Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddCategoryMapping}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-white text-black rounded-lg hover:bg-neutral-200 transition cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Mapping Table */}
            <div className="border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 uppercase font-bold border-b border-neutral-800">
                  <tr>
                    <th className="p-3.5">Supplier Category</th>
                    <th className="p-3.5">Dhati Store Category</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-300">
                  {Object.entries(categoryMappings).map(([supCat, dregCatId]) => {
                    const matchedCat = categories.find(c => c.id === dregCatId);
                    return (
                      <tr key={supCat} className="hover:bg-neutral-800/40">
                        <td className="p-3.5 font-medium text-white">{supCat}</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-200">
                            {matchedCat?.name || dregCatId}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleRemoveCategoryMapping(supCat)}
                            className="text-neutral-500 hover:text-red-400 transition cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FAILED PRODUCTS */}
        {activeTab === 'failed' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Failed Products Quarantine</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Products that encountered validation or download errors are recorded here for review.
                </p>
              </div>

              {failedItems.length > 0 && (
                <button
                  onClick={() => handleAction('retry_failed')}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold bg-white text-black hover:bg-neutral-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry All Failed Products</span>
                </button>
              )}
            </div>

            {failedItems.length === 0 ? (
              <div className="border border-neutral-800 rounded-xl p-10 text-center text-neutral-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-white">Clean Import Record</p>
                <p className="text-xs text-neutral-500">No failed products currently recorded.</p>
              </div>
            ) : (
              <div className="border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase font-bold border-b border-neutral-800">
                    <tr>
                      <th className="p-3.5">Product ID</th>
                      <th className="p-3.5">Name</th>
                      <th className="p-3.5">Reason</th>
                      <th className="p-3.5">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300">
                    {failedItems.map(item => (
                      <tr key={item.id} className="hover:bg-neutral-800/40">
                        <td className="p-3.5 font-mono text-neutral-400">{item.supplier_product_id}</td>
                        <td className="p-3.5 font-semibold text-white">{item.name}</td>
                        <td className="p-3.5 text-red-400">{item.error_message}</td>
                        <td className="p-3.5 text-neutral-500">{new Date(item.created_at).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: IMPORT HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-base font-bold text-white">Audit Log & Import History</h3>

            {history.length === 0 ? (
              <div className="border border-neutral-800 rounded-xl p-10 text-center text-neutral-400">
                <History className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">No Previous Jobs</p>
                <p className="text-xs text-neutral-500">Import history logs will appear here after imports run.</p>
              </div>
            ) : (
              <div className="border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase font-bold border-b border-neutral-800">
                    <tr>
                      <th className="p-3.5">Job ID</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Imported</th>
                      <th className="p-3.5">Images</th>
                      <th className="p-3.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300">
                    {history.map(job => (
                      <tr key={job.id} className="hover:bg-neutral-800/40">
                        <td className="p-3.5 font-mono text-neutral-400">{job.id}</td>
                        <td className="p-3.5 uppercase font-medium text-white">{job.job_type.replace('_', ' ')}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            job.status === 'cancelled' ? 'bg-neutral-800 text-neutral-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-emerald-400">{job.total_imported}</td>
                        <td className="p-3.5 text-purple-400">{job.images_downloaded}</td>
                        <td className="p-3.5 text-neutral-400">
                          {new Date(job.created_at).toLocaleDateString()} {new Date(job.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
