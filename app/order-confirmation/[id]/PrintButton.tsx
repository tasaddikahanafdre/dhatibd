'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export default function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-neutral-300 bg-white text-neutral-800 px-5 py-3 rounded-xl text-xs font-semibold hover:bg-neutral-100 transition-colors shadow-xs"
    >
      <Printer className="w-4 h-4 text-neutral-600" />
      <span>Print Order Receipt</span>
    </button>
  );
}
