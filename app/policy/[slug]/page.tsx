import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const page = await db.getPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      
      {/* Breadcrumb */}
      <nav className="text-xs text-neutral-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-black">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-neutral-500">Legal & Policies</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black font-semibold">{page.title}</span>
      </nav>

      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tight">
          {page.title}
        </h1>
        {page.updated_at && (
          <p className="text-xs text-neutral-400 mt-2">
            Last Updated: {formatDate(page.updated_at)}
          </p>
        )}
      </div>

      {/* Policy Content */}
      <div className="prose prose-neutral max-w-none text-xs sm:text-sm text-neutral-700 leading-relaxed space-y-4">
        {page.content.split('\n\n').map((paragraph, index) => {
          if (paragraph.startsWith('### ')) {
            return (
              <h3 key={index} className="text-base font-bold text-black mt-6 mb-2">
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          if (paragraph.startsWith('#### ')) {
            return (
              <h4 key={index} className="text-sm font-bold text-neutral-900 mt-4 mb-1">
                {paragraph.replace('#### ', '')}
              </h4>
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

    </div>
  );
}
