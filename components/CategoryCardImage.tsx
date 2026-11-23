'use client';

import React from 'react';

interface CategoryCardImageProps {
  src: string;
  alt: string;
}

export default function CategoryCardImage({ src, alt }: CategoryCardImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      onError={(e) => {
        const target = e.currentTarget;
        if (!target.dataset.fallback) {
          target.dataset.fallback = 'true';
          target.src = '/icons/categories/other.svg';
        }
      }}
    />
  );
}
