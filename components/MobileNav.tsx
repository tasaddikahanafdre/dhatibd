'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Search, ChevronRight, ChevronDown, ShoppingBag, Heart, Shield, Phone, MapPin } from 'lucide-react';
import { Category } from '@/lib/types';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

export default function MobileNav({ isOpen, onClose, categories }: MobileNavProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleCategory = (id: string) => {
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onClose();
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-4/5 max-w-sm bg-white h-full flex flex-col shadow-2xl z-10 overflow-y-auto">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <Link href="/" onClick={onClose} className="text-xl font-black tracking-tight text-black uppercase">
            DHATI<span className="text-[#eb5a00]">.</span>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-black rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Search Input */}
        <div className="p-4 border-b border-neutral-100">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products in Bangladesh..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white focus:border-black"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </form>
        </div>

        {/* Navigation Categories List */}
        <div className="flex-1 px-4 py-3 space-y-1">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
            Categories & Departments
          </div>

          <Link
            href="/shop"
            onClick={onClose}
            className="flex items-center justify-between py-2.5 text-sm font-semibold text-neutral-900 hover:text-black border-b border-neutral-100"
          >
            <span>All Products</span>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </Link>

          {categories.map((cat) => {
            const hasChildren = cat.children && cat.children.length > 0;
            const isExpanded = !!expandedCats[cat.id];

            return (
              <div key={cat.id} className="border-b border-neutral-50">
                <div className="flex items-center justify-between py-2 text-sm text-neutral-800">
                  <Link
                    href={`/category/${cat.slug}`}
                    onClick={onClose}
                    className="flex-1 font-medium hover:text-black"
                  >
                    {cat.name}
                  </Link>

                  {hasChildren && (
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="p-1 text-neutral-400 hover:text-black"
                      aria-label="Toggle subcategories"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Subcategories Accordion */}
                {hasChildren && isExpanded && (
                  <div className="pl-4 pb-2 space-y-1">
                    {cat.children!.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/category/${cat.slug}/${sub.slug}`}
                        onClick={onClose}
                        className="block py-1.5 text-xs text-neutral-600 hover:text-black"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support & Quick Links */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 space-y-2 text-xs">
          <Link
            href="/track-order"
            onClick={onClose}
            className="flex items-center gap-2 py-1.5 text-neutral-700 hover:text-black font-medium"
          >
            <Shield className="w-4 h-4 text-neutral-500" />
            <span>Track My Order</span>
          </Link>
          <Link
            href="/about"
            onClick={onClose}
            className="flex items-center gap-2 py-1.5 text-neutral-700 hover:text-black font-medium"
          >
            <span>About Us</span>
          </Link>
          <Link
            href="/contact"
            onClick={onClose}
            className="flex items-center gap-2 py-1.5 text-neutral-700 hover:text-black font-medium"
          >
            <Phone className="w-4 h-4 text-neutral-500" />
            <span>Customer Support (09612-000000)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
