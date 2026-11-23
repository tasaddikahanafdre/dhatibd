'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { 
  Plus, 
  FolderTree, 
  Edit2, 
  Trash2, 
  X, 
  Folder, 
  ChevronRight, 
  Layers, 
  Tag,
  Upload,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { Category } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { getCategoryIconUrl, matchCategoryIcon } from '@/lib/categoryIcons';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parent_id: '',
    description: '',
    image_url: '',
    banner_url: '',
    icon_name: 'Tag',
    display_order: 1,
    is_active: true,
    is_featured: false
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadBody = new FormData();
      uploadBody.append('folder', 'categories');
      uploadBody.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadBody
      });
      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, image_url: data.url }));
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories?includeInactive=true', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = (parentId: string | null = null) => {
    setEditingCategory(null);
    const initialMatched = matchCategoryIcon('');
    setFormData({
      name: '',
      slug: '',
      parent_id: parentId || '',
      description: '',
      image_url: initialMatched.iconUrl,
      banner_url: '',
      icon_name: initialMatched.iconName,
      display_order: categories.length + 1,
      is_active: true,
      is_featured: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id || '',
      description: cat.description || '',
      image_url: cat.image_url || getCategoryIconUrl(cat),
      banner_url: cat.banner_url || '',
      icon_name: cat.icon_name || 'Tag',
      display_order: cat.display_order,
      is_active: cat.is_active,
      is_featured: cat.is_featured
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (cat: Category) => {
    const promptMsg = `Delete "${cat.name}"? Products can be reassigned to another category if needed. Proceed?`;
    if (!confirm(promptMsg)) return;

    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== cat.id));
      }
    } catch {
      alert('Failed to delete category');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      slug: formData.slug || slugify(formData.name),
      parent_id: formData.parent_id || null,
      description: formData.description,
      image_url: formData.image_url || null,
      banner_url: formData.banner_url || null,
      icon_name: formData.icon_name,
      display_order: Number(formData.display_order) || 1,
      is_active: formData.is_active,
      is_featured: formData.is_featured
    };

    if (editingCategory) {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
        setIsModalOpen(false);
      }
    } else {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        setCategories(prev => [...prev, created]);
        setIsModalOpen(false);
      }
    }
  };

  const parentCategories = categories.filter(c => !c.parent_id);

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              Category & Subcategory Hierarchy
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Organize departments, unlimited nested subcategories, and navigation menus
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/featured?tab=categories"
              className="inline-flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 text-neutral-200 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            >
              <FolderTree className="w-3.5 h-3.5 text-sky-400" />
              <span>Manage Header Bar</span>
            </Link>

            <button
              onClick={() => openAddModal()}
              className="inline-flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Top Category</span>
            </button>
          </div>
        </div>

        {/* Tree Display */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#eb5a00]" />
            <span className="text-xs">Loading categories...</span>
          </div>
        ) : parentCategories.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/40">
            <p className="text-xs text-neutral-400">No categories found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {parentCategories.map((parent) => {
              const subcategories = categories.filter(c => c.parent_id === parent.id);

              return (
                <div 
                  key={parent.id} 
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xs"
                >
                  {/* Parent Row */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-950/40 border-b border-neutral-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-neutral-700 bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={parent.image_url || getCategoryIconUrl(parent)}
                          alt={parent.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/fashion/categories/saree.jpg';
                          }}
                        />
                      </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{parent.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono bg-neutral-800 px-1.5 py-0.5 rounded">
                          /{parent.slug}
                        </span>
                        {!parent.is_active && (
                          <span className="bg-red-950 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 max-w-md line-clamp-1">
                        {parent.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => openAddModal(parent.id)}
                      className="px-2.5 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:text-white text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Subcategory</span>
                    </button>
                    <button
                      onClick={() => openEditModal(parent)}
                      className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                      aria-label="Edit category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(parent)}
                      className="p-1.5 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-800"
                      aria-label="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subcategories Children List */}
                {subcategories.length > 0 ? (
                  <div className="divide-y divide-neutral-800/50 pl-6 sm:pl-12 bg-neutral-900/60">
                    {subcategories.map(sub => (
                      <div key={sub.id} className="py-3 pr-4 sm:pr-5 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-2.5">
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                          <span className="font-semibold text-neutral-200">{sub.name}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">/{sub.slug}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(sub)}
                            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                            aria-label="Edit subcategory"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub)}
                            className="p-1.5 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-800"
                            aria-label="Delete subcategory"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 pl-12 text-[11px] text-neutral-600 italic bg-neutral-900/30">
                    No subcategories created yet for this department.
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
                <h2 className="text-base font-bold uppercase tracking-tight">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const matched = matchCategoryIcon(newName);
                      const shouldAutoUpdateIcon = !formData.image_url || formData.image_url.startsWith('/icons/categories/');
                      setFormData({ 
                        ...formData, 
                        name: newName,
                        slug: !editingCategory ? slugify(newName) : formData.slug,
                        image_url: shouldAutoUpdateIcon ? matched.iconUrl : formData.image_url,
                        icon_name: shouldAutoUpdateIcon ? matched.iconName : formData.icon_name
                      });
                    }}
                    placeholder="e.g. Watches, Beauty, Electronics..."
                    className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Parent Category</label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
                  >
                    <option value="">None (Top-Level Category)</option>
                    {parentCategories.filter(p => !editingCategory || p.id !== editingCategory.id).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white resize-none"
                  />
                </div>

                {/* Category Icon & Appearance */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-neutral-300 font-semibold">
                      Category Icon & Appearance
                    </label>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Auto-Matched & Consistent
                    </span>
                  </div>

                  {/* 1:1 Live Icon Preview */}
                  {(() => {
                    const activeIconUrl = formData.image_url && formData.image_url.trim() !== ''
                      ? formData.image_url.trim()
                      : getCategoryIconUrl({ 
                          name: formData.name, 
                          slug: formData.slug, 
                          image_url: formData.image_url 
                        });

                    return (
                      <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {/* Live 1:1 Category Image Preview */}
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#eb5a00] bg-[#eb5a00] flex-shrink-0 shadow-xs flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={activeIconUrl}
                                alt="Category 1:1 preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-[9px] text-[#eb5a00] uppercase tracking-wider font-semibold">Storefront Preview</span>
                          </div>
                        </div>

                        <div className="text-right text-xs">
                          <span className="text-neutral-400 text-[10px] block">Current Image / Icon:</span>
                          <span className="text-white font-mono text-[11px] truncate max-w-[200px] block">
                            {activeIconUrl.split('/').pop()}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick Icon Selector Gallery */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Or Choose a Specific Category Icon:
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-neutral-950/60 border border-neutral-800 rounded-xl">
                      {[
                        { label: 'Watches', url: '/icons/categories/watches.svg' },
                        { label: "Men's Fashion", url: '/icons/categories/mens-fashion.svg' },
                        { label: 'Shirts', url: '/icons/categories/shirts.svg' },
                        { label: 'Accessories', url: '/icons/categories/accessories.svg' },
                        { label: 'Tech', url: '/icons/categories/tech.svg' },
                        { label: 'Clothing', url: '/icons/categories/clothing.svg' },
                        { label: 'Home', url: '/icons/categories/home.svg' },
                        { label: 'Lifestyle', url: '/icons/categories/lifestyle.svg' },
                        { label: 'Beauty', url: '/icons/categories/beauty.svg' },
                        { label: 'Shoes', url: '/icons/categories/shoes.svg' },
                        { label: 'Bags', url: '/icons/categories/bags.svg' },
                        { label: 'Sports', url: '/icons/categories/sports.svg' },
                        { label: 'Gaming', url: '/icons/categories/gaming.svg' },
                        { label: 'Jewelry', url: '/icons/categories/jewelry.svg' },
                        { label: 'Food', url: '/icons/categories/food.svg' },
                        { label: 'Kids', url: '/icons/categories/kids.svg' },
                        { label: 'Other', url: '/icons/categories/other.svg' },
                      ].map((item) => {
                        const isSelected = formData.image_url === item.url;
                        return (
                          <button
                            key={item.url}
                            type="button"
                            onClick={() => setFormData({ ...formData, image_url: item.url })}
                            className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white text-black border-white shadow-sm'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-500'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-neutral-100 overflow-hidden border border-neutral-400 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[9px] font-bold truncate max-w-full">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Upload button from PC (Optional) */}
                  <label className="border border-dashed border-neutral-700 hover:border-neutral-400 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors bg-neutral-950/40 hover:bg-neutral-950 group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCategoryImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    {uploadingImage ? (
                      <div className="flex items-center gap-2 text-neutral-300 py-1">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs font-medium">Uploading custom photo...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-center text-xs text-neutral-400 group-hover:text-white">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload custom 1:1 image file from PC</span>
                      </div>
                    )}
                  </label>

                  {/* Fallback Direct Image URL */}
                  <div>
                    <input
                      type="url"
                      placeholder="Or enter direct image URL (https://...)"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-[11px] placeholder-neutral-600 focus:border-neutral-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded bg-neutral-950 border-neutral-700 text-white"
                    />
                    <span>Publish (Active in Menu)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded bg-neutral-950 border-neutral-700 text-white"
                    />
                    <span>Featured on Homepage</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-neutral-700 rounded-lg text-neutral-300 hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-white text-black font-bold uppercase rounded-lg hover:bg-neutral-200"
                  >
                    Save Category
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
