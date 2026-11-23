'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Package, Heart, MapPin, LogOut, ArrowRight, Truck } from 'lucide-react';
import { useWishlist } from '@/lib/WishlistContext';

export default function AccountPage() {
  const { wishlistCount } = useWishlist();
  const [phoneSearch, setPhoneSearch] = useState('');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      
      {/* Account Overview Header */}
      <div className="bg-neutral-900 text-white rounded-2xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center font-black text-xl">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight">Customer Portal</h1>
            <p className="text-xs text-neutral-400 mt-0.5">Welcome to your Dhati shopping dashboard</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Quick Card 1: Track Orders */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-black">
            <Package className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-black uppercase">My Orders & Tracking</h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Find your order status and shipping history using your order number and mobile phone.
          </p>
          <Link
            href="/track-order"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-black hover:underline"
          >
            <span>Track Live Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quick Card 2: Wishlist */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-black">
            <Heart className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-black uppercase">Saved Wishlist</h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            You currently have <strong className="text-black">{wishlistCount} items</strong> saved in your favorites list.
          </p>
          <Link
            href="/account/wishlist"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-black hover:underline"
          >
            <span>View Saved Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quick Card 3: Support & Help */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-black">
            <Truck className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-black uppercase">Delivery & Assistance</h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Need help with an exchange, return, or courier delivery? Our hotline is available 6 days a week.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-black hover:underline"
          >
            <span>Contact Help Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

    </div>
  );
}
