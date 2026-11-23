'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle, Phone, ArrowRight } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: 'Are your products original and authentic?',
    a: 'Yes, 100%. Dhati guarantees genuine branded products with official manufacturer warranties. We source directly from verified brand distributors.'
  },
  {
    q: 'How does Cash on Delivery (COD) work in Bangladesh?',
    a: 'With Cash on Delivery, you pay cash to the delivery rider once your parcel arrives at your address. COD is supported across all 64 districts in Bangladesh.'
  },
  {
    q: 'What are the delivery charges and delivery times?',
    a: 'Inside Dhaka, delivery is ৳60 (taking 24 to 48 hours). For orders above ৳3,000, Dhaka delivery is completely FREE. Outside Dhaka across all divisions, delivery is ৳120 (taking 2 to 4 business days).'
  },
  {
    q: 'How can I track my order once placed?',
    a: 'Navigate to the "Track Order" page in our top menu, enter your Order Number (e.g., DRG-202611-XXXX) and your mobile number to view live progress: Confirmed, Processing, Shipped, or Delivered.'
  },
  {
    q: 'What is your return and warranty policy?',
    a: 'We provide a 7-Day Replacement Policy for manufacturing defects. All products also carry official warranty coverage specified on their product page.'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept Cash on Delivery (COD) nationwide across Bangladesh. You pay cash only when the courier hands your package to you at your doorstep.'
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto mb-12">
        <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-black mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-xs text-neutral-500 mt-2">
          Everything you need to know about shopping, shipping, payments, and warranties on Dhati.
        </p>
      </div>

      {/* Accordion */}
      <div className="space-y-3 mb-12">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div 
              key={idx}
              className="bg-white border border-neutral-200 rounded-xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-neutral-900 hover:text-black focus:outline-none"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-black' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still need help callout */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 sm:p-8 text-center max-w-xl mx-auto">
        <h3 className="text-sm font-bold text-black uppercase mb-1">Still have questions?</h3>
        <p className="text-xs text-neutral-500 mb-4">Our support team is ready to help you with your order.</p>
        <div className="flex justify-center gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 bg-[#eb5a00] text-white px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#d04f00] transition-colors"
          >
            <span>Contact Support</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <a
            href="tel:09612000000"
            className="inline-flex items-center gap-1.5 border border-neutral-300 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-neutral-100 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-neutral-600" />
            <span>09612-000000</span>
          </a>
        </div>
      </div>

    </div>
  );
}
