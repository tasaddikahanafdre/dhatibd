'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  Ticket, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  Copy, 
  Calendar, 
  Percent, 
  DollarSign, 
  Tag, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Clock,
  X
} from 'lucide-react';
import { Coupon, Category, Product } from '@/lib/types';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_value: '',
    max_discount_value: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
    is_active: true,
    applicable_categories: [] as string[],
    applicable_products: [] as string[],
    description: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resCoupons, resProducts, resCats] = await Promise.all([
        fetch('/api/coupons'),
        fetch('/api/products?limit=100'),
        fetch('/api/categories?include_inactive=true')
      ]);

      if (resCoupons.ok) {
        const data = await resCoupons.json();
        setCoupons(Array.isArray(data) ? data : []);
      }
      if (resProducts.ok) {
        const data = await resProducts.json();
        setProducts(data.products || []);
      }
      if (resCats.ok) {
        const data = await resCats.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_value: '',
      max_discount_value: '',
      usage_limit: '',
      start_date: '',
      end_date: '',
      is_active: true,
      applicable_categories: [],
      applicable_products: [],
      description: ''
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_value: coupon.min_order_value ? coupon.min_order_value.toString() : '',
      max_discount_value: coupon.max_discount_value ? coupon.max_discount_value.toString() : '',
      usage_limit: coupon.usage_limit ? coupon.usage_limit.toString() : '',
      start_date: coupon.start_date ? coupon.start_date.substring(0, 10) : '',
      end_date: coupon.end_date ? coupon.end_date.substring(0, 10) : '',
      is_active: coupon.is_active,
      applicable_categories: coupon.applicable_categories || [],
      applicable_products: coupon.applicable_products || [],
      description: coupon.description || ''
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'DREG';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.code.trim()) {
      setErrorMsg('Coupon code is required.');
      return;
    }

    const val = parseFloat(formData.discount_value);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Valid discount value is required.');
      return;
    }

    if (formData.discount_type === 'percentage' && val > 100) {
      setErrorMsg('Percentage discount cannot exceed 100%.');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: val,
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : undefined,
        max_discount_value: formData.max_discount_value ? parseFloat(formData.max_discount_value) : undefined,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        is_active: formData.is_active,
        applicable_categories: formData.applicable_categories.length > 0 ? formData.applicable_categories : undefined,
        applicable_products: formData.applicable_products.length > 0 ? formData.applicable_products : undefined,
        description: formData.description.trim() || undefined
      };

      let res;
      if (editingCoupon) {
        payload.id = editingCoupon.id;
        res = await fetch('/api/coupons', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save coupon.');
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const res = await fetch('/api/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: coupon.id,
          is_active: !coupon.is_active
        })
      });
      if (res.ok) {
        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) return;

    try {
      const res = await fetch(`/api/coupons?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== id));
      } else {
        alert('Failed to delete coupon.');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered coupons
  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Quick stats
  const activeCount = coupons.filter(c => c.is_active).length;
  const totalUses = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);
  const totalSavings = coupons.reduce((sum, c) => sum + ((c.used_count || 0) * (c.discount_type === 'fixed' ? c.discount_value : 120)), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Ticket className="w-6 h-6 text-white" />
              Discount & Coupon Manager
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Create and manage promotional discount codes, usage limits, and product/category restrictions.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-neutral-200 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Coupon
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Active Coupons</span>
              <Ticket className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{activeCount} <span className="text-xs text-neutral-500 font-normal">/ {coupons.length} total</span></div>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Total Redemptions</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{totalUses}</div>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Est. Customer Savings</span>
              <Tag className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">৳{totalSavings.toLocaleString()}</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-neutral-900/40 p-3 rounded-xl border border-neutral-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search coupon code or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div className="text-xs text-neutral-400 self-end sm:self-center">
            Showing {filteredCoupons.length} of {coupons.length} coupons
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-neutral-500 text-sm">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-neutral-600 border-t-white mb-2" />
              <p>Loading coupons...</p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="py-20 text-center text-neutral-500 text-sm">
              <Ticket className="w-10 h-10 mx-auto text-neutral-700 mb-2" />
              <p className="text-neutral-400 font-medium">No coupons found</p>
              <p className="text-xs text-neutral-600 mt-1">Click &quot;Create Coupon&quot; to make your first promotional discount.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/80 text-xs text-neutral-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Conditions</th>
                    <th className="py-3 px-4">Redemptions</th>
                    <th className="py-3 px-4">Validity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredCoupons.map((coupon) => {
                    const isExpired = coupon.end_date && new Date(coupon.end_date) < new Date();
                    return (
                      <tr key={coupon.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white tracking-wider bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded text-xs">
                              {coupon.code}
                            </span>
                            <button
                              onClick={() => copyToClipboard(coupon.code)}
                              className="text-neutral-500 hover:text-white transition-colors"
                              title="Copy code"
                            >
                              {copiedCode === coupon.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {coupon.description && (
                            <p className="text-xs text-neutral-400 mt-1 truncate max-w-xs">{coupon.description}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-white">
                            {coupon.discount_type === 'percentage' 
                              ? `${coupon.discount_value}% OFF`
                              : `৳${coupon.discount_value} OFF`}
                          </span>
                          {coupon.max_discount_value && coupon.discount_type === 'percentage' && (
                            <p className="text-xs text-neutral-500">Up to ৳{coupon.max_discount_value}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-neutral-400">
                          {coupon.min_order_value ? (
                            <div>Min: <span className="text-neutral-200">৳{coupon.min_order_value}</span></div>
                          ) : (
                            <div className="text-neutral-500">No minimum</div>
                          )}
                          {coupon.applicable_categories && coupon.applicable_categories.length > 0 && (
                            <div className="text-neutral-400 mt-0.5">{coupon.applicable_categories.length} categories</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-white">{coupon.used_count || 0}</span>
                          <span className="text-neutral-500 text-xs"> / {coupon.usage_limit ?? '∞'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-neutral-400">
                          {isExpired ? (
                            <span className="text-rose-400 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Expired
                            </span>
                          ) : coupon.end_date ? (
                            <span className="text-neutral-300">Until {coupon.end_date.substring(0, 10)}</span>
                          ) : (
                            <span className="text-neutral-500">No expiry</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleStatus(coupon)}
                            className="flex items-center gap-1.5 focus:outline-none"
                            title={coupon.is_active ? 'Click to deactivate' : 'Click to activate'}
                          >
                            {coupon.is_active ? (
                              <>
                                <ToggleRight className="w-6 h-6 text-emerald-400" />
                                <span className="text-xs text-emerald-400 font-medium">Active</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-6 h-6 text-neutral-600" />
                                <span className="text-xs text-neutral-500">Inactive</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(coupon)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                              title="Delete"
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

        {/* Modal: Create/Edit Coupon */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 my-8 text-white relative shadow-2xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                <Ticket className="w-5 h-5 text-white" />
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>
              <p className="text-xs text-neutral-400 mb-5">
                Configure promotional rules and discount settings.
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveCoupon} className="space-y-4 text-sm">
                {/* Code Generator & Input */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Coupon Code <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. FLASH20"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-neutral-600"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-white font-medium rounded-lg transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                {/* Discount Type & Value */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Discount Type
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neutral-600"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (৳)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Discount Value <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="1"
                        step="any"
                        placeholder={formData.discount_type === 'percentage' ? 'e.g. 15' : 'e.g. 100'}
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-3 pr-8 py-2 text-white focus:outline-none focus:border-neutral-600"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">
                        {formData.discount_type === 'percentage' ? '%' : '৳'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Min Order & Max Discount */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Min Order Value (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 500"
                      value={formData.min_order_value}
                      onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Max Discount Limit (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Optional cap for %"
                      disabled={formData.discount_type === 'fixed'}
                      value={formData.max_discount_value}
                      onChange={(e) => setFormData({ ...formData, max_discount_value: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neutral-600 disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Usage Limit */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Leave blank for unlimited uses"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neutral-600"
                    />
                  </div>
                </div>

                {/* Category Restrictions */}
                {categories.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Restrict to Categories (Optional)
                    </label>
                    <div className="max-h-24 overflow-y-auto border border-neutral-800 rounded-lg p-2 bg-neutral-950 space-y-1">
                      {categories.map((c) => {
                        const isChecked = formData.applicable_categories.includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center gap-2 text-xs text-neutral-300 hover:text-white cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, applicable_categories: [...formData.applicable_categories, c.id] });
                                } else {
                                  setFormData({ ...formData, applicable_categories: formData.applicable_categories.filter(id => id !== c.id) });
                                }
                              }}
                              className="rounded border-neutral-700 bg-neutral-900 text-white focus:ring-0"
                            />
                            <span>{c.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Internal Note / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Black Friday exclusive promotional discount"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveCheckbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-neutral-700 bg-neutral-900 text-white focus:ring-0"
                  />
                  <label htmlFor="isActiveCheckbox" className="text-xs text-neutral-300 cursor-pointer">
                    Enable coupon immediately upon saving
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
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