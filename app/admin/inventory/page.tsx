'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Layers, AlertTriangle, Search, Plus, Minus, Check, RefreshCw } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProducts = () => {
    setLoading(true);
    fetch('/api/products?limit=300&includeInactive=true')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('filter') === 'low' || params.get('filter') === 'out') {
        setFilterLowStock(true);
      }
    }
  }, []);

  const adjustStock = async (product: Product, delta: number) => {
    const newQty = Math.max(0, product.stock_quantity + delta);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_quantity: newQty })
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock_quantity: newQty } : p));
      }
    } catch {
      alert('Failed to update stock');
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesLow = filterLowStock ? p.stock_quantity <= p.low_stock_threshold : true;
    return matchesSearch && matchesLow;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              Real-Time Inventory Manager
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Monitor warehouse stock levels, adjust unit quantities, and prevent stockouts
            </p>
          </div>

          <button
            onClick={loadProducts}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Stock</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search product or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500"
            />
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => setFilterLowStock(e.target.checked)}
              className="rounded bg-neutral-900 border-neutral-700 text-white"
            />
            <span className="text-amber-400">Show Low-Stock / Out of Stock Only</span>
          </label>
        </div>

        {/* Inventory Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Product Title</th>
                <th className="py-3 px-4 font-semibold">SKU</th>
                <th className="py-3 px-4 font-semibold">Price</th>
                <th className="py-3 px-4 font-semibold">Current Stock</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Quick Stock Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.map((prod) => {
                const isOut = prod.stock_quantity <= 0;
                const isLow = prod.stock_quantity <= prod.low_stock_threshold && !isOut;

                return (
                  <tr key={prod.id} className="hover:bg-neutral-800/40">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=80'}
                          alt={prod.name}
                          className="w-8 h-8 rounded object-cover border border-neutral-800"
                        />
                        <span className="font-bold text-white truncate max-w-xs">{prod.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400">{prod.sku || 'N/A'}</td>

                    <td className="py-3.5 px-4 font-semibold text-white">{formatPrice(prod.price)}</td>

                    <td className="py-3.5 px-4 font-black text-sm text-white">
                      {prod.stock_quantity}
                    </td>

                    <td className="py-3.5 px-4">
                      {isOut ? (
                        <span className="bg-red-950 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="bg-amber-950 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          Low Stock
                        </span>
                      ) : (
                        <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          In Stock
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 border border-neutral-800 bg-neutral-950 p-1 rounded-lg">
                        <button
                          onClick={() => adjustStock(prod, -5)}
                          className="px-2 py-1 text-[11px] font-bold text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                          title="Reduce 5 units"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => adjustStock(prod, -1)}
                          className="px-2 py-1 text-[11px] font-bold text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                          title="Reduce 1 unit"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => adjustStock(prod, +1)}
                          className="px-2 py-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 rounded hover:bg-neutral-800"
                          title="Add 1 unit"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => adjustStock(prod, +10)}
                          className="px-2 py-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 rounded hover:bg-neutral-800"
                          title="Add 10 units"
                        >
                          +10
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </AdminLayout>
  );
}
