import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Shield, Award, CheckCircle } from 'lucide-react';
import { db } from '@/lib/db';
import ProductDetailView from '@/components/ProductDetailView';
import ProductCard from '@/components/ProductCard';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await db.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Get related products from the same category
  const relatedResult = await db.getProducts({
    categorySlug: product.category?.slug,
    limit: 5
  });
  const relatedProducts = relatedResult.products.filter(p => p.id !== product.id).slice(0, 4);

  const images = (product.images && product.images.length > 0)
    ? product.images
    : product.image_url
      ? [{ image_url: product.image_url, is_primary: true, display_order: 1 }]
      : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Breadcrumb */}
      <nav className="text-xs text-neutral-400 mb-8 flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-black">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/shop" className="hover:text-black">Shop</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/category/${product.category.slug}`} className="hover:text-black">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-black font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Interactive Product Showcase (Interactive Gallery & Variation Selectors) */}
      <ProductDetailView product={product} />

      {/* Technical Specifications & Description Tabs */}
      <div className="border-t border-neutral-200 pt-12 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Detailed Description */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-black text-black uppercase tracking-wider pb-2 border-b border-neutral-200">
              Product Overview & Details
            </h2>
            <div className="text-xs sm:text-sm text-neutral-700 leading-relaxed space-y-3 pt-2">
              <p>{product.description || product.short_description}</p>
            </div>
          </div>

          {/* Specifications Table */}
          <div>
            <h2 className="text-base font-black text-black uppercase tracking-wider pb-2 border-b border-neutral-200 mb-4">
              Technical Specifications
            </h2>
            {product.specifications && Object.keys(product.specifications).length > 0 ? (
              <div className="border border-neutral-200 rounded-lg overflow-hidden divide-y divide-neutral-200 text-xs">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex p-3 bg-white even:bg-neutral-50">
                    <span className="font-semibold text-neutral-800 w-2/5 shrink-0 pr-2">{key}</span>
                    <span className="text-neutral-600 w-3/5">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500">Standard manufacturer specifications apply.</p>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-neutral-200 pt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-neutral-900 uppercase tracking-tight">
              You May Also Like
            </h2>
            {product.category && (
              <Link 
                href={`/category/${product.category.slug}`}
                className="text-xs font-bold text-black hover:underline"
              >
                View all in {product.category.name}
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
