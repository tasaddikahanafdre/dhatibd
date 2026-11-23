'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ShoppingBag, 
  Layers, 
  Settings, 
  LogOut, 
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  Lock,
  Image as ImageIcon,
  DownloadCloud,
  Sparkles,
  BarChart3,
  Ticket,
  Flame,
  Globe
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Configurable inactivity timeout (15 minutes)
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Lock / Logout
  const handleLockDashboard = useCallback(async (reason?: 'timeout') => {
    if (isLocking) return;
    setIsLocking(true);

    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch {
      // ignore
    } finally {
      if (reason === 'timeout') {
        window.location.href = `/admin/login?reason=timeout&from=${encodeURIComponent(pathname)}`;
      } else {
        window.location.href = '/admin/login';
      }
    }
  }, [isLocking, pathname]);

  // Activity detection & Inactivity timer
  useEffect(() => {
    if (pathname === '/admin/login') return;

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    // Periodic check every 15 seconds
    timerRef.current = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime >= INACTIVITY_TIMEOUT_MS) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleLockDashboard('timeout');
      }
    }, 15000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pathname, handleLockDashboard]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Featured (3×3 & Nav)', href: '/admin/featured', icon: Sparkles },
    { name: 'Coupons & Discounts', href: '/admin/coupons', icon: Ticket },
    { name: 'Deal Page Maker', href: '/admin/deals', icon: Flame },
    { name: 'SEO Manager', href: '/admin/seo', icon: Globe },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Product Importer', href: '/admin/importer', icon: DownloadCloud },
    { name: 'Categories', href: '/admin/categories', icon: FolderTree },
    { name: 'Banners (16:9)', href: '/admin/banners', icon: ImageIcon },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Inventory', href: '/admin/inventory', icon: Layers },
    { name: 'Store Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col lg:flex-row font-sans">
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between">
        <Link href="/admin" className="text-base font-black tracking-tight text-white uppercase">
          DHATI <span className="text-[#eb5a00] text-xs font-bold">ADMIN</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLockDashboard()}
            className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors"
            title="Lock Dashboard"
            aria-label="Lock Dashboard"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-neutral-400 hover:text-white"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between p-5 z-40 transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div>
              <Link href="/admin" className="text-xl font-black tracking-tight text-white uppercase block">
                DHATI<span className="text-[#eb5a00]">.</span>
              </Link>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Control Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive 
                      ? 'bg-white text-black font-bold shadow-sm' 
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-neutral-800 space-y-2 text-xs">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => handleLockDashboard()}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors text-left cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Lock Dashboard</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-neutral-950 p-4 sm:p-8 lg:p-10 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}
