'use client';

import React, { useState } from 'react';
import { ProductImage } from '@/lib/types';

interface ProductGalleryProps {
  images: { id?: string; image_url: string; alt_text?: string | null }[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const displayImages = images.length > 0 ? images : [
    { image_url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800' }
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = displayImages[activeIndex] || displayImages[0];

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails strip */}
      {displayImages.length > 1 && (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[480px] shrink-0">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                activeIndex === idx ? 'border-black' : 'border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <img
                src={img.image_url}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Large Display Image */}
      <div className="flex-1 aspect-square bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden relative group">
        <img
          src={activeImage.image_url}
          alt={activeImage.alt_text || productName}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
      </div>
    </div>
  );
}
