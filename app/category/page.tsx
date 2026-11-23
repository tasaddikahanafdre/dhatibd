import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { db } from '@/lib/db';
import { getCategoryIconUrl } from '@/lib/categoryIcons';
import CategoryCardImage from '@/components/CategoryCardImage';

export const revalidate = 0;

export const metadata = {
  title: 'Categories — Dhati',
  description: 'Browse all official product categories on Dhati Bangladesh.',
};

export default async function CategoriesPage() {
  const categories = (await db.getCategories(false)) || [];

  return (
    <div className="w-full bg-white text-black min-h-screen py-6 sm:py-12">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-neutral-400 flex items-center gap-2">
          <Link href="/" className="hover:text-black uppercase tracking-wider">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-black font-semibold uppercase tracking-wider">Categories</span>
        </nav>

        {/* Section Heading */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-widest text-black">
            CATEGORY
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-light max-w-md mx-auto">
            Explore authentic curated fashion across all official Dhati collections.
          </p>
        </div>

        {/* 3x3 Grid Layout (3 Columns across mobile and desktop) */}
        {categories.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-neutral-200 rounded-2xl">
            <p className="text-sm text-neutral-500">No categories found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8 pt-2 pb-10">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group flex flex-col items-center text-center focus:outline-hidden"
              >
                {/* 1:1 Aspect Ratio Square Photo Container (No border, clean edge-to-edge photography) */}
                <div className="w-full aspect-square bg-neutral-100 rounded-xl sm:rounded-2xl overflow-hidden relative shadow-sm group-hover:scale-105 transition-all">
                  <CategoryCardImage
                    src={category.image_url || getCategoryIconUrl(category)}
                    alt={category.name}
                  />
                </div>

                {/* Category Label */}
                <span className="mt-2 sm:mt-3 block text-center text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider text-black group-hover:opacity-70 transition-opacity">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
