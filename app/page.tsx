import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import CategorySlider from '@/components/CategorySlider';
import HeroSlider from '@/components/HeroSlider';

export const metadata: Metadata = {
  title: 'Dhati | Online Store',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Dynamic data for instant admin updates

export default async function HomePage() {
  const [categories, featuredProducts, banners] = await Promise.all([
    db.getCategories(false),
    db.getFeaturedProducts(),
    db.getBanners(false)
  ]);

  const products = featuredProducts;

  return (
    <div className="w-full bg-white text-black min-h-screen flex flex-col justify-between overflow-x-hidden">
      <div className="w-full max-w-5xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-8 space-y-6 sm:space-y-12">
        
        {/* 1. HERO SECTION: Two smaller image-only promotional banners stacked on the left, 
            one large 4:3 image banner on the right. No text, buttons, or overlays on top of any banners. */}
        <section className="w-full">
          <HeroSlider banners={banners} />
        </section>

        {/* 2. CATEGORY SECTION: Centered heading "CATEGORY", followed by rounded-square images */}
        <section className="w-full">
          <Link href="/category" className="block text-center hover:opacity-75 transition-opacity">
            <h2 className="text-xl sm:text-2xl font-black tracking-widest text-center text-black uppercase mb-4 sm:mb-8">
              CATEGORY
            </h2>
          </Link>

          <CategorySlider categories={categories} />
        </section>

        {/* 3. PRODUCT DISPLAY: Clean three-column grid */}
        <section className="w-full">
          {products.length === 0 ? (
            <div className="w-full border border-neutral-200 rounded-xl p-8 sm:p-20 text-center bg-white shadow-xs">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#eb5a00] text-white rounded-full mx-auto flex items-center justify-center mb-3 sm:mb-4">
                  <span className="text-base sm:text-lg font-black">*</span>
                </div>
                <h3 className="text-base sm:text-2xl font-bold tracking-tight text-black">
                  Something exciting is coming. Check back soon.
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
                  Our collections are currently being prepared. Once new products are published, they will appear here.
                </p>
                <div className="pt-3 sm:pt-4">
                  <Link
                    href="/shop"
                    className="inline-block bg-[#eb5a00] text-white text-xs font-bold uppercase tracking-widest px-5 sm:px-6 py-2 sm:py-2.5 rounded hover:bg-[#d04f00] transition-colors"
                  >
                    View Categories
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-6 lg:gap-8">
              {products.slice(0, 9).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* 4. MORE BUTTON: Centered vibrant orange button with white "MORE" text underneath the product grid */}
        <section className="w-full flex justify-center pt-2 pb-6">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center bg-[#eb5a00] hover:bg-[#d04f00] text-white text-xs sm:text-sm font-bold uppercase tracking-widest px-12 sm:px-16 py-3 sm:py-3.5 rounded-md shadow-xs transition-colors"
          >
            MORE
          </Link>
        </section>

      </div>
    </div>
  );
}
