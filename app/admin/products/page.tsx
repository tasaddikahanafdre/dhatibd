'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Upload, 
  Eye, 
  EyeOff,
  Image as ImageIcon,
  Layers, 
  Percent,
  Sliders,
  AlertCircle,
  ExternalLink,
  Star
} from 'lucide-react';
import { Product, Category, ProductVariant, ProductOption } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    original_price: '',
    category_id: '',
    stock_quantity: '10',
    low_stock_threshold: '5',
    sku: '',
    model_number: '',
    image_url: '',
    short_description: '',
    description: '',
    warranty_info: '',
    is_active: true,
    is_featured: false,
    is_bestseller: false
  });

  // Specifications State (key-value pairs)
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([]);

  // Multiple Options State (Colour, Size, Storage, etc.)
  const [options, setOptions] = useState<Array<{ name: string; values: string[] }>>([]);
  const [newValInputs, setNewValInputs] = useState<Record<number, string>>({});

  // Variations / Price Adjustments State
  const [variants, setVariants] = useState<Array<{
    variant_name: string;
    variant_value: string;
    sku: string;
    price_adjustment: number;
    stock_quantity: number;
  }>>([]);

  // Multiple Gallery Images State
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/products?limit=300&includeInactive=true').then(r => r.json()),
      fetch('/api/categories?includeInactive=true').then(r => r.json())
    ])
      .then(([prodsData, catsData]) => {
        if (prodsData && Array.isArray(prodsData.products)) {
          setProducts(prodsData.products);
        }
        if (Array.isArray(catsData)) {
          setCategories(catsData);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live discount percentage
  const sellingNum = Number(formData.price) || 0;
  const originalNum = Number(formData.original_price) || 0;
  const calculatedDiscount = originalNum > sellingNum && originalNum > 0
    ? Math.round(((originalNum - sellingNum) / originalNum) * 100)
    : 0;

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      original_price: '',
      category_id: categories[0]?.id || '',
      stock_quantity: '10',
      low_stock_threshold: '5',
      sku: `DRG-${Date.now().toString().slice(-6)}`,
      model_number: '',
      image_url: '',
      short_description: '',
      description: '',
      warranty_info: '',
      is_active: true,
      is_featured: false,
      is_bestseller: false
    });
    setSpecs([{ key: 'Color', value: '' }]);
    setOptions([]);
    setNewValInputs({});
    setVariants([]);
    setGalleryImages([]);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      price: String(p.price),
      original_price: p.original_price ? String(p.original_price) : '',
      category_id: p.category_id || '',
      stock_quantity: String(p.stock_quantity),
      low_stock_threshold: String(p.low_stock_threshold || 5),
      sku: p.sku || '',
      model_number: p.model_number || '',
      image_url: p.image_url || '',
      short_description: p.short_description || '',
      description: p.description || '',
      warranty_info: p.warranty_info || '',
      is_active: p.is_active !== false,
      is_featured: Boolean(p.is_featured),
      is_bestseller: Boolean(p.is_bestseller)
    });

    // Parse specifications
    if (p.specifications && typeof p.specifications === 'object') {
      const parsed = Object.entries(p.specifications).map(([key, value]) => ({
        key,
        value: String(value)
      }));
      setSpecs(parsed.length > 0 ? parsed : [{ key: '', value: '' }]);
    } else {
      setSpecs([{ key: '', value: '' }]);
    }

    // Parse options (Colour, Size, etc.)
    if (Array.isArray(p.options) && p.options.length > 0) {
      setOptions(p.options.map(o => ({
        name: o.name || '',
        values: Array.isArray(o.values) ? [...o.values] : []
      })));
    } else if (Array.isArray(p.variants) && p.variants.length > 0) {
      // Intelligently group legacy variants into option groups
      const groupMap = new Map<string, Set<string>>();
      p.variants.forEach(v => {
        const name = (v.variant_name || 'Option').trim();
        const val = (v.variant_value || '').trim();
        if (name && val) {
          if (!groupMap.has(name)) groupMap.set(name, new Set());
          groupMap.get(name)!.add(val);
        }
      });
      setOptions(Array.from(groupMap.entries()).map(([name, valSet]) => ({
        name,
        values: Array.from(valSet)
      })));
    } else {
      setOptions([]);
    }
    setNewValInputs({});

    // Parse variants
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      setVariants(p.variants.map(v => ({
        variant_name: v.variant_name || '',
        variant_value: v.variant_value || '',
        sku: v.sku || '',
        price_adjustment: Number(v.price_adjustment) || 0,
        stock_quantity: Number(v.stock_quantity) || 0
      })));
    } else {
      setVariants([]);
    }

    // Parse images
    let allImgs: string[] = [];
    if (p.image_url) allImgs.push(p.image_url);
    if (Array.isArray(p.images) && p.images.length > 0) {
      p.images.forEach(img => {
        if (img.image_url && !allImgs.includes(img.image_url)) {
          allImgs.push(img.image_url);
        }
      });
    }
    setGalleryImages(allImgs);

    setIsModalOpen(true);
  };

  // Multiple Product Photos Upload from PC -> Supabase bucket 'image'
  const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadBody = new FormData();
      uploadBody.append('folder', 'products');
      Array.from(files).forEach((file) => {
        uploadBody.append('files', file);
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadBody
      });
      const data = await res.json();
      
      const newUrls: string[] = Array.isArray(data.urls) 
        ? data.urls 
        : data.url ? [data.url] : [];

      if (newUrls.length > 0) {
        setGalleryImages(prev => {
          const combined = [...prev];
          newUrls.forEach(u => {
            if (!combined.includes(u)) combined.push(u);
          });
          return combined;
        });

        // Set first image as primary if not set
        if (!formData.image_url) {
          setFormData(prev => ({ ...prev, image_url: newUrls[0] }));
        }
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('Failed to upload image(s) to Supabase');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetPrimaryImage = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
  };

  const handleRemoveImage = (urlToRemove: string) => {
    const updated = galleryImages.filter(url => url !== urlToRemove);
    setGalleryImages(updated);
    if (formData.image_url === urlToRemove) {
      setFormData(prev => ({ ...prev, image_url: updated[0] || '' }));
    }
  };

  // Fast Toggle Publish Status directly from table
  const handleTogglePublish = async (p: Product) => {
    const newStatus = !p.is_active;
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus })
      });
      if (res.ok) {
        setProducts(prev => prev.map(item => item.id === p.id ? { ...item, is_active: newStatus } : item));
      }
    } catch (err) {
      alert('Failed to update product publish status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch {
      alert('Failed to delete product');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a product name');
      return;
    }
    if (formData.price === '' || isNaN(Number(formData.price))) {
      alert('Please enter a valid selling price');
      return;
    }

    // Convert specs to object
    const specsObj: Record<string, string> = {};
    specs.forEach(s => {
      if (s.key.trim() && s.value.trim()) {
        specsObj[s.key.trim()] = s.value.trim();
      }
    });

    // Primary image is either formData.image_url or first gallery image
    const primaryImgUrl = formData.image_url.trim() || galleryImages[0] || '';

    // Format gallery images
    const imagesPayload = galleryImages.filter(url => url.trim()).map((url, idx) => ({
      id: `img-${Date.now()}-${idx}`,
      product_id: editingProduct?.id || '',
      image_url: url.trim(),
      display_order: idx + 1,
      is_primary: url.trim() === primaryImgUrl
    }));

    // Format options (Colour, Size, Storage, etc.)
    const validOptions = options
      .filter(o => o.name.trim() && o.values.length > 0)
      .map(o => ({
        name: o.name.trim(),
        values: o.values.map(v => v.trim()).filter(Boolean)
      }));

    // Format variants (preserve manual price adjustments or auto-derive from options)
    let variantsPayload = variants.filter(v => v.variant_name.trim() && v.variant_value.trim()).map((v, idx) => ({
      id: `var-${Date.now()}-${idx}`,
      product_id: editingProduct?.id || '',
      variant_name: v.variant_name.trim(),
      variant_value: v.variant_value.trim(),
      sku: v.sku ? v.sku.trim() : null,
      price_adjustment: Number(v.price_adjustment) || 0,
      stock_quantity: Number(v.stock_quantity) || 0
    }));

    if (variantsPayload.length === 0 && validOptions.length > 0) {
      variantsPayload = validOptions.flatMap((opt, oIdx) =>
        opt.values.map((val, vIdx) => ({
          id: `var-${Date.now()}-${oIdx}-${vIdx}`,
          product_id: editingProduct?.id || '',
          variant_name: opt.name,
          variant_value: val,
          sku: null,
          price_adjustment: 0,
          stock_quantity: Number(formData.stock_quantity) || 10
        }))
      );
    }

    const payload = {
      name: formData.name.trim(),
      price: Number(formData.price),
      original_price: formData.original_price ? Number(formData.original_price) : null,
      category_id: formData.category_id || null,
      stock_quantity: Number(formData.stock_quantity) || 0,
      low_stock_threshold: Number(formData.low_stock_threshold) || 5,
      sku: formData.sku.trim(),
      model_number: formData.model_number.trim(),
      image_url: primaryImgUrl,
      images: imagesPayload,
      specifications: specsObj,
      options: validOptions,
      variants: variantsPayload,
      short_description: formData.short_description.trim(),
      description: formData.description.trim(),
      warranty_info: formData.warranty_info.trim(),
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      is_bestseller: formData.is_bestseller
    };

    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to update product');
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          setProducts(prev => [created, ...prev]);
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to create product');
        }
      }
    } catch {
      alert('Error saving product');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = !categoryFilter || p.category_id === categoryFilter;
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'published' 
        ? p.is_active !== false 
        : p.is_active === false;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              Product Catalogue
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Add products, upload multiple photos to Supabase bucket, manage specifications & variations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/featured?tab=products"
              className="inline-flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 text-neutral-200 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Manage 3×3 Featured</span>
            </Link>

            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600"
            />
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-48 text-xs px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-neutral-600"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-40 text-xs px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-neutral-600"
          >
            <option value="all">All Status</option>
            <option value="published">Published Only</option>
            <option value="unpublished">Unpublished (Draft)</option>
          </select>

          <span className="text-xs text-neutral-500 ml-auto">
            Total: <strong className="text-white">{filteredProducts.length}</strong> products
          </span>
        </div>

        {/* Products Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-neutral-400">Loading product catalogue...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 text-center text-neutral-400 space-y-3">
              <ImageIcon className="w-10 h-10 mx-auto text-neutral-600" />
              <p className="text-sm font-semibold text-white">No products found</p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {products.length === 0 
                  ? 'Your store is currently empty. Click "Add New Product" to manually create your first product.' 
                  : 'No products match the selected filters.'}
              </p>
              {products.length === 0 && (
                <button
                  onClick={openAddModal}
                  className="mt-2 inline-flex items-center gap-1.5 bg-white text-black px-4 py-2 rounded text-xs font-bold uppercase hover:bg-neutral-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Product
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Product</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Selling Price</th>
                    <th className="py-3 px-4 font-semibold">Stock</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredProducts.map((p) => {
                    const catName = categories.find(c => c.id === p.category_id)?.name || 'Unassigned';
                    const isPublished = p.is_active !== false;
                    const discount = p.original_price && p.original_price > p.price
                      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
                      : 0;

                    return (
                      <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded bg-neutral-950 border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-neutral-600" />
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <p className="font-bold text-white truncate">{p.name}</p>
                              <p className="text-[10px] text-neutral-400 mt-0.5">SKU: {p.sku || 'N/A'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-neutral-300">
                          <span className="bg-neutral-800 px-2 py-0.5 rounded text-[11px]">
                            {catName}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{formatPrice(p.price)}</div>
                          {p.original_price && p.original_price > p.price && (
                            <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                              <span className="line-through">{formatPrice(p.original_price)}</span>
                              <span className="text-emerald-400 font-bold">-{discount}%</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            p.stock_quantity <= 0
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : p.stock_quantity <= (p.low_stock_threshold || 5)
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-neutral-800 text-neutral-300'
                          }`}>
                            {p.stock_quantity} units
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleTogglePublish(p)}
                            title="Click to toggle publish status"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              isPublished
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                                : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700'
                            }`}
                          >
                            {isPublished ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Published</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Draft (Hidden)</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                              title="Edit product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ADD / EDIT PRODUCT MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl p-6 sm:p-8 my-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6 sticky top-0 bg-neutral-900 z-10">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <p className="text-xs text-neutral-400">Fill in product details, upload multiple images to Supabase, set specs & variants</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                
                {/* 1. Basic Information */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3 pb-1 border-b border-neutral-800">
                    1. Basic Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-neutral-300 block mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Wireless Noise Cancelling Headphones"
                        className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-neutral-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-neutral-300 block mb-1">
                        Category *
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-neutral-500"
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-neutral-300 block mb-1">
                        SKU (Stock Keeping Unit)
                      </label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="DRG-XXXXXX"
                        className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-neutral-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Multiple Product Photos Upload from PC -> Supabase bucket 'image' */}
                <div>
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-800 mb-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                        2. Product Photos (Upload Multiple from PC)
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Select multiple images from your PC. Photos are saved directly to Supabase storage bucket (<code className="text-neutral-400">image/products</code>).
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                      Supabase Bucket: image
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Upload Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleMultipleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="inline-flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0 shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{uploadingImage ? 'Uploading to Supabase...' : 'Upload Photos From PC (Select Multiple)'}</span>
                      </button>

                      <span className="text-xs text-neutral-500">
                        {galleryImages.length} photo(s) selected
                      </span>
                    </div>

                    {/* Gallery Thumbnails Grid */}
                    {galleryImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                        {galleryImages.map((imgUrl, idx) => {
                          const isPrimary = imgUrl === formData.image_url;
                          return (
                            <div 
                              key={idx} 
                              className={`relative group rounded-lg overflow-hidden border transition-all ${
                                isPrimary ? 'border-white ring-2 ring-white/50' : 'border-neutral-800 hover:border-neutral-600'
                              }`}
                            >
                              <div className="aspect-square bg-neutral-900">
                                <img
                                  src={imgUrl}
                                  alt={`Product photo ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Badges & Actions */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(imgUrl)}
                                    className="p-1 rounded bg-red-600 text-white hover:bg-red-700"
                                    title="Delete photo"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(imgUrl)}
                                  className="w-full py-1 text-[10px] font-bold uppercase bg-white text-black rounded hover:bg-neutral-200"
                                >
                                  {isPrimary ? 'Primary' : 'Set Primary'}
                                </button>
                              </div>

                              {isPrimary && (
                                <div className="absolute top-1 left-1 bg-white text-black text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                                  Cover
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Primary Image URL input if manual editing is desired */}
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                        Primary Cover Image URL (or paste direct image URL)
                      </label>
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://...supabase.co/storage/v1/object/public/image/..."
                        className="w-full text-xs p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:border-neutral-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Pricing & Discounts */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3 pb-1 border-b border-neutral-800">
                    3. Pricing & Discounts
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-neutral-300 block mb-1">
                        Selling Price (BDT ৳) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="e.g. 2500"
                        className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-neutral-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-neutral-300 block mb-1">
                        Original / Regular Price (BDT ৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.original_price}
                        onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                        placeholder="e.g. 3000 (optional)"
                        className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-neutral-500"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs">
                        {calculatedDiscount > 0 ? (
                          <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                            <Percent className="w-3.5 h-3.5" />
                            <span>{calculatedDiscount}% Discount (Save ৳{originalNum - sellingNum})</span>
                          </div>
                        ) : (
                          <span className="text-neutral-500">No discount applied</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Stock & Inventory */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3 pb-1 border-b border-neutral-800">
                    4. Inventory & Stock
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-neutral-300 block mb-1">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-neutral-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-neutral-300 block mb-1">
                        Low Stock Alert Threshold
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.low_stock_threshold}
                        onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                        className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-neutral-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-neutral-300 block mb-1">
                        Warranty Information
                      </label>
                      <input
                        type="text"
                        value={formData.warranty_info}
                        onChange={(e) => setFormData({ ...formData, warranty_info: e.target.value })}
                        placeholder="e.g. 1 Year Official Warranty"
                        className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-neutral-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Product Descriptions */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3 pb-1 border-b border-neutral-800">
                    5. Product Descriptions
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-neutral-300 block mb-1">
                        Short Summary Description
                      </label>
                      <input
                        type="text"
                        value={formData.short_description}
                        onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                        placeholder="Brief 1-line headline describing the product"
                        className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-neutral-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-neutral-300 block mb-1">
                        Full Product Description
                      </label>
                      <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Write detailed specifications, features, in-the-box contents, and product highlights..."
                        className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-neutral-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Product Specifications (Key-Value Pairs) */}
                <div>
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-800 mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                      6. Product Specifications
                    </h4>
                    <button
                      type="button"
                      onClick={() => setSpecs([...specs, { key: '', value: '' }])}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Specification
                    </button>
                  </div>

                  <div className="space-y-2">
                    {specs.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Spec Name (e.g. Battery Life, Material, Weight)"
                          value={item.key}
                          onChange={(e) => {
                            const newSpecs = [...specs];
                            newSpecs[index].key = e.target.value;
                            setSpecs(newSpecs);
                          }}
                          className="w-1/2 text-xs p-2 bg-neutral-950 border border-neutral-800 rounded text-white focus:outline-none focus:border-neutral-500"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. 30 Hours, Titanium, 180g)"
                          value={item.value}
                          onChange={(e) => {
                            const newSpecs = [...specs];
                            newSpecs[index].value = e.target.value;
                            setSpecs(newSpecs);
                          }}
                          className="w-1/2 text-xs p-2 bg-neutral-950 border border-neutral-800 rounded text-white focus:outline-none focus:border-neutral-500"
                        />
                        <button
                          type="button"
                          onClick={() => setSpecs(specs.filter((_, i) => i !== index))}
                          className="p-2 text-neutral-500 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. Product Options & Variations (Colour, Size, Storage, etc.) */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                        7. Product Options & Variations
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Add multiple choices for customers (e.g. Colour, Size, Storage, Material).
                      </p>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const existingColor = options.find(o => o.name.toLowerCase() === 'colour' || o.name.toLowerCase() === 'color');
                          if (!existingColor) {
                            setOptions([...options, { name: 'Colour', values: ['Matte Black', 'Pearl White', 'Midnight Blue'] }]);
                          }
                        }}
                        className="text-[10px] font-bold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        + Add Colour
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const existingSize = options.find(o => o.name.toLowerCase() === 'size');
                          if (!existingSize) {
                            setOptions([...options, { name: 'Size', values: ['S', 'M', 'L', 'XL'] }]);
                          }
                        }}
                        className="text-[10px] font-bold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        + Add Size
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const existingStorage = options.find(o => o.name.toLowerCase() === 'storage' || o.name.toLowerCase() === 'capacity');
                          if (!existingStorage) {
                            setOptions([...options, { name: 'Storage', values: ['128GB', '256GB', '512GB'] }]);
                          }
                        }}
                        className="text-[10px] font-bold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        + Add Storage
                      </button>
                      <button
                        type="button"
                        onClick={() => setOptions([...options, { name: 'Option', values: [] }])}
                        className="text-[10px] font-bold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 px-2.5 py-1 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Custom Option
                      </button>
                    </div>
                  </div>

                  {options.length === 0 ? (
                    <div className="p-4 bg-neutral-950/60 border border-dashed border-neutral-800 rounded-lg text-center space-y-1">
                      <p className="text-xs font-semibold text-neutral-300">No options added yet</p>
                      <p className="text-[11px] text-neutral-500">
                        Click the quick preset buttons above (e.g. <strong>+ Add Colour</strong>, <strong>+ Add Size</strong>) to allow customers to choose variations on the storefront.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {options.map((opt, optIdx) => {
                        const isColor = opt.name.toLowerCase().includes('colour') || opt.name.toLowerCase().includes('color');
                        return (
                          <div key={optIdx} className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-1 max-w-xs">
                                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Option:</span>
                                <input
                                  type="text"
                                  value={opt.name}
                                  placeholder="e.g. Colour, Size"
                                  onChange={(e) => {
                                    const updated = [...options];
                                    updated[optIdx].name = e.target.value;
                                    setOptions(updated);
                                  }}
                                  className="w-full text-xs font-bold p-1.5 bg-neutral-900 border border-neutral-700 rounded text-white focus:outline-none focus:border-white"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => setOptions(options.filter((_, i) => i !== optIdx))}
                                className="text-neutral-500 hover:text-red-400 p-1 transition cursor-pointer"
                                title="Remove Option"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Current Values as Chips */}
                            <div className="flex flex-wrap items-center gap-1.5 min-h-[30px]">
                              {opt.values.length === 0 ? (
                                <span className="text-[11px] text-neutral-500 italic">No values added yet. Type below and hit Enter.</span>
                              ) : (
                                opt.values.map((val) => (
                                  <span
                                    key={val}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-900 border border-neutral-700 text-white"
                                  >
                                    {isColor && (
                                      <span className="w-2.5 h-2.5 rounded-full border border-neutral-600 bg-neutral-400" />
                                    )}
                                    <span>{val}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...options];
                                        updated[optIdx].values = updated[optIdx].values.filter(v => v !== val);
                                        setOptions(updated);
                                      }}
                                      className="text-neutral-400 hover:text-red-400 p-0.5 cursor-pointer"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))
                              )}
                            </div>

                            {/* Input to add new value */}
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                placeholder={isColor ? 'Add colour (e.g. Midnight Black, Silver, Blue)...' : 'Add value (e.g. S, M, L, XL)...'}
                                value={newValInputs[optIdx] || ''}
                                onChange={(e) => setNewValInputs({ ...newValInputs, [optIdx]: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const raw = newValInputs[optIdx] || '';
                                    if (raw.trim()) {
                                      const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
                                      const updated = [...options];
                                      const set = new Set(updated[optIdx].values);
                                      parts.forEach(p => set.add(p));
                                      updated[optIdx].values = Array.from(set);
                                      setOptions(updated);
                                      setNewValInputs({ ...newValInputs, [optIdx]: '' });
                                    }
                                  }
                                }}
                                className="flex-1 text-xs p-2 bg-neutral-900 border border-neutral-800 rounded text-neutral-200 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const raw = newValInputs[optIdx] || '';
                                  if (raw.trim()) {
                                    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
                                    const updated = [...options];
                                    const set = new Set(updated[optIdx].values);
                                    parts.forEach(p => set.add(p));
                                    updated[optIdx].values = Array.from(set);
                                    setOptions(updated);
                                    setNewValInputs({ ...newValInputs, [optIdx]: '' });
                                  }
                                }}
                                className="px-3 py-2 text-xs font-bold bg-white text-black hover:bg-neutral-200 rounded transition cursor-pointer"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Optional Price Adjustments per Variant */}
                  {options.length > 0 && (
                    <details className="text-xs bg-neutral-950/40 border border-neutral-800 rounded-xl p-3">
                      <summary className="font-bold text-neutral-300 cursor-pointer hover:text-white">
                        Advanced: Configure individual Price Adjustments (+/- ৳)
                      </summary>
                      <div className="pt-3 space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[11px] text-neutral-500">
                            Add custom price surcharges or discounts for specific option values (e.g. +৳200 for 256GB or XL).
                          </p>
                          <button
                            type="button"
                            onClick={() => setVariants([...variants, {
                              variant_name: options[0]?.name || 'Option',
                              variant_value: options[0]?.values[0] || '',
                              sku: '',
                              price_adjustment: 0,
                              stock_quantity: 10
                            }])}
                            className="text-[10px] font-bold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded"
                          >
                            + Add Price Rule
                          </button>
                        </div>

                        {variants.map((v, index) => (
                          <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-2 bg-neutral-900 border border-neutral-800 rounded items-center">
                            <input
                              type="text"
                              placeholder="Option (e.g. Size)"
                              value={v.variant_name}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[index].variant_name = e.target.value;
                                setVariants(updated);
                              }}
                              className="text-xs p-1.5 bg-neutral-950 border border-neutral-800 rounded text-white"
                            />
                            <input
                              type="text"
                              placeholder="Value (e.g. 256GB)"
                              value={v.variant_value}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[index].variant_value = e.target.value;
                                setVariants(updated);
                              }}
                              className="text-xs p-1.5 bg-neutral-950 border border-neutral-800 rounded text-white"
                            />
                            <input
                              type="number"
                              placeholder="+/- Price (৳)"
                              value={v.price_adjustment}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[index].price_adjustment = Number(e.target.value);
                                setVariants(updated);
                              }}
                              className="text-xs p-1.5 bg-neutral-950 border border-neutral-800 rounded text-white font-mono"
                            />
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                                className="p-1 text-neutral-500 hover:text-red-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>

                {/* 8. Visibility & Flags */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3 pb-1 border-b border-neutral-800">
                    8. Publication Status & Badges
                  </h4>
                  <div className="flex flex-wrap items-center gap-6 p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
                    {/* Publish / Unpublish Toggle */}
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-neutral-900 border-neutral-700"
                      />
                      <span className="text-xs font-bold text-white">
                        Publish to store (Uncheck to keep as draft/unpublished)
                      </span>
                    </label>

                    {/* Featured */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        className="w-4 h-4 rounded text-black focus:ring-0 bg-neutral-900 border-neutral-700"
                      />
                      <span className="text-xs text-neutral-300">Featured Product</span>
                    </label>

                    {/* Bestseller */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_bestseller}
                        onChange={(e) => setFormData({ ...formData, is_bestseller: e.target.checked })}
                        className="w-4 h-4 rounded text-black focus:ring-0 bg-neutral-900 border-neutral-700"
                      />
                      <span className="text-xs text-neutral-300">Bestseller</span>
                    </label>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-white text-black px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-sm"
                  >
                    {editingProduct ? 'Save Changes' : 'Create Product'}
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
