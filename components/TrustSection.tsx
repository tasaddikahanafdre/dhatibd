import React from 'react';
import { Truck, ShieldCheck, RefreshCw, CreditCard } from 'lucide-react';

export default function TrustSection() {
  const benefits = [
    {
      icon: Truck,
      title: 'Nationwide Delivery',
      desc: 'Swift shipping across all 64 districts in Bangladesh'
    },
    {
      icon: ShieldCheck,
      title: '100% Genuine Products',
      desc: 'Authentic tech sourced directly with official warranty'
    },
    {
      icon: RefreshCw,
      title: '7-Day Return Policy',
      desc: 'Hassle-free replacement for defective or damaged items'
    },
    {
      icon: CreditCard,
      title: 'Cash on Delivery & bKash',
      desc: 'Pay at your doorstep or securely via bKash and Nagad'
    }
  ];

  return (
    <section className="bg-neutral-50 border-y border-neutral-200 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="flex items-start gap-3.5 p-2">
                <div className="w-10 h-10 rounded-lg bg-neutral-200/70 flex items-center justify-center shrink-0 text-black">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mb-0.5">{b.title}</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
