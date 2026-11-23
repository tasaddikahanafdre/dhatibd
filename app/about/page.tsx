import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { ShieldCheck, Truck, Headphones, CheckCircle2 } from 'lucide-react';

export const revalidate = 60;

export default async function AboutPage() {
  const page = await db.getPage('about-us');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full">
          About Dhati
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-black uppercase tracking-tight mt-3">
          Bridging Innovation & Bangladesh
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-3 leading-relaxed">
          An all-in-one destination for genuine technology, premium audio, daily gadgets, and lifestyle essentials.
        </p>
      </div>

      {/* Grid Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-black uppercase mb-1">100% Authentic Gear</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Every product in our catalog is rigorously verified and backed by brand warranties.
          </p>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center mb-4">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-black uppercase mb-1">Nationwide Reach</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Fast, secure parcel shipping covering all 64 districts with Cash on Delivery options.
          </p>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center mb-4">
            <Headphones className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-black uppercase mb-1">Dedicated Support</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Our hotline and support agents assist you before, during, and after your purchase.
          </p>
        </div>
      </div>

      {/* Content Body */}
      {page && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 sm:p-12 shadow-xs space-y-6 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          {page.content.split('\n\n').map((paragraph, index) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={index} className="text-base font-bold text-black mt-6 mb-2">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('- ')) {
              return (
                <ul key={index} className="list-disc pl-5 space-y-1.5 my-2">
                  {paragraph.split('\n').map((item, itemIdx) => (
                    <li key={itemIdx}>{item.replace('- ', '')}</li>
                  ))}
                </ul>
              );
            }
            return <p key={index}>{paragraph}</p>;
          })}
        </div>
      )}

    </div>
  );
}
