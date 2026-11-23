'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  Settings, 
  Megaphone, 
  Truck, 
  Phone, 
  CreditCard, 
  Save, 
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  Trash2
} from 'lucide-react';
import { Banner } from '@/lib/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Editable fields
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [insideDhakaCharge, setInsideDhakaCharge] = useState('60');
  const [outsideDhakaCharge, setOutsideDhakaCharge] = useState('120');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('3000');
  const [contactPhone, setContactPhone] = useState('+880 1711 000000');
  const [hotline, setHotline] = useState('09612-000000');
  const [contactEmail, setContactEmail] = useState('support@dhati.com');
  const [address, setAddress] = useState('House #14, Road #6, Dhanmondi, Dhaka-1205, Bangladesh');

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(r => r.json()),
      fetch('/api/banners').then(r => r.json())
    ])
      .then(([settingsData, bannersData]) => {
        if (settingsData) {
          setSettings(settingsData);
          if (settingsData.general) {
            setAnnouncementText(settingsData.general.announcement_bar || '');
            setAnnouncementEnabled(settingsData.general.announcement_enabled !== false);
            setContactPhone(settingsData.general.contact_phone || '+880 1711 000000');
            setHotline(settingsData.general.hotline || '09612-000000');
            setContactEmail(settingsData.general.contact_email || 'support@dhati.com');
            setAddress(settingsData.general.address || '');
          }
          if (settingsData.shipping) {
            setInsideDhakaCharge(String(settingsData.shipping.inside_dhaka_charge || 60));
            setOutsideDhakaCharge(String(settingsData.shipping.outside_dhaka_charge || 120));
            setFreeShippingThreshold(String(settingsData.shipping.free_shipping_threshold || 3000));
          }
        }
        if (Array.isArray(bannersData)) {
          setBanners(bannersData);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'general',
          value: {
            ...settings?.general,
            announcement_bar: announcementText,
            announcement_enabled: announcementEnabled,
            contact_phone: contactPhone,
            hotline,
            contact_email: contactEmail,
            address
          }
        })
      });

      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'shipping',
          value: {
            ...settings?.shipping,
            inside_dhaka_charge: Number(insideDhakaCharge),
            outside_dhaka_charge: Number(outsideDhakaCharge),
            free_shipping_threshold: Number(freeShippingThreshold)
          }
        })
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      alert('Failed to save store settings');
    }
  };

  const handleSaveBanners = async () => {
    try {
      const res = await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banners)
      });
      if (res.ok) {
        alert('Homepage banners updated successfully!');
      }
    } catch {
      alert('Failed to update banners');
    }
  };

  const updateBannerField = (index: number, field: keyof Banner, value: any) => {
    const updated = [...banners];
    (updated[index] as any)[field] = value;
    setBanners(updated);
  };

  const addBanner = () => {
    const newBanner: Banner = {
      id: `ban-${Date.now()}`,
      title: 'New Promotional Offer',
      subtitle: 'Exclusive technology savings in Bangladesh',
      button_text: 'SHOP NOW',
      target_url: '/shop',
      image_url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600',
      display_order: banners.length + 1,
      is_active: true
    };
    setBanners([...banners, newBanner]);
  };

  const removeBanner = (index: number) => {
    setBanners(banners.filter((_, i) => i !== index));
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-800">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              Website & Store Settings
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Configure announcement bars, Bangladesh delivery fees, contact lines, and banners
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved successfully</span>
            </div>
          )}
        </div>

        {/* 1. Announcement Bar Form */}
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-neutral-800">
              <Megaphone className="w-4 h-4 text-neutral-400" />
              <span>Top Announcement Bar</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1.5">Announcement Message</label>
                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={announcementEnabled}
                  onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-700 text-white"
                />
                <span className="text-neutral-300 font-semibold">Enable Announcement Bar on Storefront</span>
              </label>
            </div>
          </div>

          {/* 2. Bangladesh Delivery Charges */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-neutral-800">
              <Truck className="w-4 h-4 text-neutral-400" />
              <span>Nationwide Delivery Charges (Bangladesh)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1.5">Inside Dhaka (BDT)</label>
                <input
                  type="number"
                  value={insideDhakaCharge}
                  onChange={(e) => setInsideDhakaCharge(e.target.value)}
                  className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1.5">Outside Dhaka (BDT)</label>
                <input
                  type="number"
                  value={outsideDhakaCharge}
                  onChange={(e) => setOutsideDhakaCharge(e.target.value)}
                  className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1.5">Free Dhaka Delivery Threshold (BDT)</label>
                <input
                  type="number"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(e.target.value)}
                  className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          {/* 3. Contact & Store Identity */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-neutral-800">
              <Phone className="w-4 h-4 text-neutral-400" />
              <span>Contact & Store Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1.5">Primary Mobile</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1.5">Customer Hotline</label>
                <input
                  type="text"
                  value={hotline}
                  onChange={(e) => setHotline(e.target.value)}
                  className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1.5">Support Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="text-neutral-300 font-semibold block mb-1.5">Office / Dispatch Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Store Information</span>
              </button>
            </div>
          </div>
        </form>

        {/* 4. Homepage Banners Carousel Manager */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-neutral-400" />
              <span>Homepage Hero Banners ({banners.length})</span>
            </h2>
            <button
              onClick={addBanner}
              className="inline-flex items-center gap-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg border border-neutral-700 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Banner</span>
            </button>
          </div>

          <div className="space-y-4">
            {banners.map((ban, idx) => (
              <div key={ban.id || idx} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-400 uppercase text-[10px]">
                    Banner #{idx + 1}
                  </span>
                  <button
                    onClick={() => removeBanner(idx)}
                    className="text-neutral-500 hover:text-red-400 p-1"
                    title="Remove banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-400 block mb-1">Headline</label>
                    <input
                      type="text"
                      value={ban.title}
                      onChange={(e) => updateBannerField(idx, 'title', e.target.value)}
                      className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">Target Link URL</label>
                    <input
                      type="text"
                      value={ban.target_url || ''}
                      onChange={(e) => updateBannerField(idx, 'target_url', e.target.value)}
                      className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Supporting Subtitle</label>
                  <input
                    type="text"
                    value={ban.subtitle || ''}
                    onChange={(e) => updateBannerField(idx, 'subtitle', e.target.value)}
                    className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Image URL</label>
                  <input
                    type="url"
                    value={ban.image_url}
                    onChange={(e) => updateBannerField(idx, 'image_url', e.target.value)}
                    className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveBanners}
              className="px-6 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Update Homepage Banners</span>
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
