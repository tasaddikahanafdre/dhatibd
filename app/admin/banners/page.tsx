'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  Upload, 
  Loader2, 
  Image as ImageIcon, 
  Check, 
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { Banner } from '@/lib/types';

interface HeroBannerSlot {
  slotKey: 'hero_main' | 'promo_1' | 'promo_2';
  title: string;
  badge: string;
  aspectDesc: string;
  defaultId: string;
  defaultImg: string;
  defaultTarget: string;
  order: number;
}

const HERO_SLOTS: HeroBannerSlot[] = [
  {
    slotKey: 'hero_main',
    title: 'Right Hero Banner (Main)',
    badge: 'Slot 1 • Right Large (4:3)',
    aspectDesc: 'Recommended: 1200x900 or 1600x1200 (4:3 Ratio)',
    defaultId: 'b-hero-main',
    defaultImg: '/banners/hero_main.jpg',
    defaultTarget: '/shop',
    order: 1
  },
  {
    slotKey: 'promo_1',
    title: 'Top-Left Promotional Banner',
    badge: 'Slot 2 • Left Top (Horizontal)',
    aspectDesc: 'Recommended: 1200x600 or 800x450 (Horizontal)',
    defaultId: 'b-promo-1',
    defaultImg: '/banners/promo_1.jpg',
    defaultTarget: '/category/saree',
    order: 2
  },
  {
    slotKey: 'promo_2',
    title: 'Bottom-Left Promotional Banner',
    badge: 'Slot 3 • Left Bottom (Horizontal)',
    aspectDesc: 'Recommended: 1200x600 or 800x450 (Horizontal)',
    defaultId: 'b-promo-2',
    defaultImg: '/banners/promo_2.jpg',
    defaultTarget: '/category/western-wear',
    order: 3
  }
];

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  // Editable slot state
  const [slotData, setSlotData] = useState<Record<string, { image_url: string; target_url: string; title: string }>>({
    hero_main: { image_url: '/banners/hero_main.jpg', target_url: '/shop', title: 'Dhati Main 4:3 Hero' },
    promo_1: { image_url: '/banners/promo_1.jpg', target_url: '/category/saree', title: 'Top Promo Banner' },
    promo_2: { image_url: '/banners/promo_2.jpg', target_url: '/category/western-wear', title: 'Bottom Promo Banner' }
  });

  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/banners?includeInactive=true', { cache: 'no-store' });
      const data: Banner[] = await res.json();
      if (Array.isArray(data)) {
        setBanners(data);

        // Find each slot
        const main = data.find(b => b.position === 'hero_main' || b.id === 'b-hero-main' || b.display_order === 1) || data[0];
        const p1 = data.find(b => b.position === 'promo_1' || b.id === 'b-promo-1' || b.display_order === 2) || (data.length > 1 ? data[1] : null);
        const p2 = data.find(b => b.position === 'promo_2' || b.id === 'b-promo-2' || b.display_order === 3) || (data.length > 2 ? data[2] : null);

        setSlotData({
          hero_main: {
            image_url: main?.image_url || '/banners/hero_main.jpg',
            target_url: main?.target_url || '/shop',
            title: main?.title || 'Dhati Festive & Contemporary Collections'
          },
          promo_1: {
            image_url: p1?.image_url || '/banners/promo_1.jpg',
            target_url: p1?.target_url || '/category/saree',
            title: p1?.title || 'Heritage Sarees & Festive Panjabis'
          },
          promo_2: {
            image_url: p2?.image_url || '/banners/promo_2.jpg',
            target_url: p2?.target_url || '/category/western-wear',
            title: p2?.title || 'Contemporary Western & Streetwear'
          }
        });
      }
    } catch {
      alert('Failed to load current banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const persistBanners = async (slotsToSave: typeof slotData) => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updatedBanners: Banner[] = [
        {
          id: 'b-hero-main',
          title: slotsToSave.hero_main.title || 'Dhati Festive & Contemporary Collections',
          image_url: slotsToSave.hero_main.image_url,
          target_url: slotsToSave.hero_main.target_url || '/shop',
          position: 'hero_main',
          display_order: 1,
          is_active: true
        },
        {
          id: 'b-promo-1',
          title: slotsToSave.promo_1.title || 'Heritage Sarees & Festive Panjabis',
          image_url: slotsToSave.promo_1.image_url,
          target_url: slotsToSave.promo_1.target_url || '/category/saree',
          position: 'promo_1',
          display_order: 2,
          is_active: true
        },
        {
          id: 'b-promo-2',
          title: slotsToSave.promo_2.title || 'Contemporary Western & Streetwear',
          image_url: slotsToSave.promo_2.image_url,
          target_url: slotsToSave.promo_2.target_url || '/category/western-wear',
          position: 'promo_2',
          display_order: 3,
          is_active: true
        }
      ];

      const extraBanners = banners.filter(b => 
        b.id !== 'b-hero-main' && 
        b.id !== 'b-promo-1' && 
        b.id !== 'b-promo-2' && 
        b.position !== 'hero_main' && 
        b.position !== 'promo_1' && 
        b.position !== 'promo_2' &&
        b.display_order > 3
      );

      const finalBannersList = [...updatedBanners, ...extraBanners];

      const res = await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalBannersList)
      });

      if (res.ok) {
        const saved = await res.json();
        setBanners(saved);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 5000);
        return true;
      } else {
        alert('Failed to save banners to server');
        return false;
      }
    } catch {
      alert('Network error while saving banners');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSlotUpload = async (slotKey: 'hero_main' | 'promo_1' | 'promo_2', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlot(slotKey);
    try {
      const body = new FormData();
      body.append('folder', 'banners');
      body.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body
      });
      const data = await res.json();

      if (data.url) {
        const updated = {
          ...slotData,
          [slotKey]: {
            ...slotData[slotKey],
            image_url: data.url
          }
        };
        setSlotData(updated);
        // Automatically save immediately so storefront updates right away!
        await persistBanners(updated);
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleSaveAll = async () => {
    await persistBanners(slotData);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-6xl pb-16">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                Homepage Hero Banners
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#eb5a00]/20 text-[#eb5a00] border border-[#eb5a00]/30 font-bold uppercase">
                Live Storefront
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Easily change, upload, and update the 3 homepage hero banner photos directly from here.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#eb5a00] hover:bg-[#d04f00] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#eb5a00]/20 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save All Banners'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 flex items-center justify-between animate-fade-in shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Homepage Banners Updated Successfully!</p>
                <p className="text-[11px] text-emerald-300">The storefront homepage has been refreshed with the new banner photos.</p>
              </div>
            </div>
            <a 
              href="/" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-emerald-400 transition-colors"
            >
              <span>View Homepage</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Visual Layout Mockup */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#eb5a00]" />
              Storefront Live Banner Arrangement Preview
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              Left 2 Promos + Right 4:3 Banner
            </span>
          </div>

          <div className="grid grid-cols-12 gap-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800/80 items-stretch">
            {/* Left Column Preview */}
            <div className="col-span-5 flex flex-col justify-between gap-3">
              {/* Promo 1 */}
              <div className="flex-1 w-full rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 relative group aspect-[16/9]">
                {slotData.promo_1.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slotData.promo_1.image_url} alt="Promo 1" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600 uppercase font-mono">Top-Left Banner</div>
                )}
                <div className="absolute bottom-1.5 left-1.5 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-neutral-300">
                  Left Top
                </div>
              </div>

              {/* Promo 2 */}
              <div className="flex-1 w-full rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 relative group aspect-[16/9]">
                {slotData.promo_2.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slotData.promo_2.image_url} alt="Promo 2" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600 uppercase font-mono">Bottom-Left Banner</div>
                )}
                <div className="absolute bottom-1.5 left-1.5 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-neutral-300">
                  Left Bottom
                </div>
              </div>
            </div>

            {/* Right Column Preview */}
            <div className="col-span-7 aspect-[4/3] rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 relative group">
              {slotData.hero_main.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slotData.hero_main.image_url} alt="Main Hero" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600 uppercase font-mono">Right Main 4:3 Banner</div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/80 px-2.5 py-1 rounded text-[10px] font-mono text-neutral-300">
                Right Main 4:3 Banner
              </div>
            </div>
          </div>
        </div>

        {/* 3 Banner Slot Editors */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#eb5a00]" />
            <span className="text-xs">Loading homepage banner configuration...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {HERO_SLOTS.map((slot) => {
              const currentData = slotData[slot.slotKey];
              const isUploading = uploadingSlot === slot.slotKey;

              return (
                <div
                  key={slot.slotKey}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl"
                >
                  {/* Slot Header */}
                  <div className="p-4 border-b border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{slot.title}</h3>
                      <span className="text-[10px] text-[#eb5a00] font-mono font-semibold uppercase">{slot.badge}</span>
                    </div>
                  </div>

                  {/* Banner Image Preview Container */}
                  <div className="p-4 space-y-4">
                    <div className={`w-full ${slot.slotKey === 'hero_main' ? 'aspect-[4/3]' : 'aspect-[16/9]'} bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 relative flex items-center justify-center group shadow-inner`}>
                      {currentData.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={currentData.image_url}
                          alt={slot.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-neutral-600 gap-1">
                          <ImageIcon className="w-8 h-8 stroke-1" />
                          <span className="text-[10px] font-mono uppercase tracking-wider">No Photo</span>
                        </div>
                      )}

                      {/* Overlay badge with aspect info */}
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-mono text-neutral-300 border border-neutral-700/50">
                        {slot.slotKey === 'hero_main' ? '4:3 Ratio' : 'Horizontal'}
                      </div>
                    </div>

                    {/* Photo Upload & Change Buttons */}
                    <div className="space-y-3">
                      <label className="border border-dashed border-neutral-700 hover:border-[#eb5a00] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors bg-neutral-950/60 hover:bg-neutral-950 group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSlotUpload(slot.slotKey, e)}
                          disabled={isUploading}
                          className="hidden"
                        />
                        {isUploading ? (
                          <div className="flex items-center gap-2 text-neutral-300 py-1.5">
                            <Loader2 className="w-4 h-4 animate-spin text-[#eb5a00]" />
                            <span className="text-xs font-medium">Uploading image...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 py-1 text-center">
                            <Upload className="w-4 h-4 text-neutral-400 group-hover:text-[#eb5a00] transition-colors" />
                            <span className="text-xs font-semibold text-neutral-200 group-hover:text-white">
                              Upload Photo From PC
                            </span>
                          </div>
                        )}
                      </label>

                      {/* Direct Image URL input */}
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">
                          Or Image URL:
                        </label>
                        <input
                          type="text"
                          value={currentData.image_url}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSlotData(prev => ({
                              ...prev,
                              [slot.slotKey]: { ...prev[slot.slotKey], image_url: val }
                            }));
                          }}
                          placeholder="https://... or /banners/..."
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs placeholder-neutral-600 focus:outline-hidden focus:border-[#eb5a00]"
                        />
                      </div>

                      {/* Target Click Link input */}
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1 flex items-center gap-1">
                          <LinkIcon className="w-3 h-3 text-neutral-500" />
                          Destination Link:
                        </label>
                        <input
                          type="text"
                          value={currentData.target_url}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSlotData(prev => ({
                              ...prev,
                              [slot.slotKey]: { ...prev[slot.slotKey], target_url: val }
                            }));
                          }}
                          placeholder="/shop or /category/saree"
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs placeholder-neutral-600 focus:outline-hidden focus:border-[#eb5a00]"
                        />
                      </div>

                      <p className="text-[10px] text-neutral-500 leading-tight">
                        {slot.aspectDesc}
                      </p>
                    </div>
                  </div>

                  {/* Slot Footer Save */}
                  <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex justify-end">
                    <button
                      onClick={handleSaveAll}
                      disabled={saving}
                      className="w-full py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Banner</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
