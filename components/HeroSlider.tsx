'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Banner } from '@/lib/types';

interface HeroSliderProps {
  banners: Banner[];
}

export default function HeroSlider({ banners }: HeroSliderProps) {
  const activeBanners = banners && banners.length > 0 
    ? banners.filter(b => b.is_active !== false)
    : [];

  // Default fallback banners matching Dhati's high-fashion aesthetic
  const fallbackRight: Banner = {
    id: 'default-hero-right',
    title: 'Dhati Festive & Contemporary Collections',
    image_url: '/banners/hero_main.jpg',
    target_url: '/shop',
    position: 'hero',
    display_order: 1,
    is_active: true
  };

  const fallbackLeft1: Banner = {
    id: 'default-promo-1',
    title: 'Heritage Sarees & Festive Panjabis',
    image_url: '/banners/promo_1.jpg',
    target_url: '/category/saree',
    position: 'hero',
    display_order: 2,
    is_active: true
  };

  const fallbackLeft2: Banner = {
    id: 'default-promo-2',
    title: 'Contemporary Western & Streetwear',
    image_url: '/banners/promo_2.jpg',
    target_url: '/category/western-wear',
    position: 'hero',
    display_order: 3,
    is_active: true
  };

  // Assign the 3 homepage hero banner slots:
  // Slot 1 (Right): Large 4:3 Hero Banner
  // Slot 2 (Left Top): Promotional Banner 1
  // Slot 3 (Left Bottom): Promotional Banner 2
  const rightBanner = activeBanners.find(b => b.position === 'hero_main' || b.id === 'b-hero-main' || b.display_order === 1) 
    || activeBanners[0] 
    || fallbackRight;

  const leftTopBanner = activeBanners.find(b => b.position === 'promo_1' || b.id === 'b-promo-1' || b.display_order === 2) 
    || (activeBanners.length > 1 ? activeBanners[1] : null) 
    || fallbackLeft1;

  const leftBottomBanner = activeBanners.find(b => b.position === 'promo_2' || b.id === 'b-promo-2' || b.display_order === 3) 
    || (activeBanners.length > 2 ? activeBanners[2] : null) 
    || fallbackLeft2;

  const rightBanners = [rightBanner];

  return (
    <div className="w-full">
      {/* 
        Hero Section:
        - Desktop & Mobile: Left column with two stacked promotional banners, 
                            Right column with one large 4:3 image banner.
        - Absolute purity: No text, buttons, or overlays on top of any banners.
      */}
      <div className="grid grid-cols-12 gap-2 sm:gap-4 lg:gap-5 items-stretch w-full">
        
        {/* Left Column: Two smaller image-only promotional banners stacked vertically */}
        <div className="col-span-5 flex flex-col justify-between gap-2 sm:gap-4 lg:gap-5">
          
          {/* Left Top Banner */}
          <div className="flex-1 w-full rounded-lg sm:rounded-2xl lg:rounded-3xl overflow-hidden bg-neutral-100 shadow-xs relative group">
            <Link 
              href={leftTopBanner.target_url || '/shop'}
              className="block w-full h-full relative"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={leftTopBanner.image_url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="eager"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = 'true';
                    target.src = '/banners/promo_1.jpg';
                  }
                }}
              />
            </Link>
          </div>

          {/* Left Bottom Banner */}
          <div className="flex-1 w-full rounded-lg sm:rounded-2xl lg:rounded-3xl overflow-hidden bg-neutral-100 shadow-xs relative group">
            <Link 
              href={leftBottomBanner.target_url || '/shop'}
              className="block w-full h-full relative"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={leftBottomBanner.image_url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="eager"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = 'true';
                    target.src = '/banners/promo_2.jpg';
                  }
                }}
              />
            </Link>
          </div>

        </div>

        {/* Right Column: One large 4:3 image banner */}
        <div className="col-span-7 w-full aspect-[4/3] rounded-lg sm:rounded-2xl lg:rounded-3xl overflow-hidden bg-neutral-100 shadow-xs relative group">
          <Link 
            href={rightBanner.target_url || '/shop'}
            className="block w-full h-full relative"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={rightBanner.image_url || '/banners/hero_main.jpg'}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="eager"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.fallback) {
                  target.dataset.fallback = 'true';
                  target.src = '/banners/hero_main.jpg';
                }
              }}
            />
          </Link>
        </div>

      </div>
    </div>
  );
}
