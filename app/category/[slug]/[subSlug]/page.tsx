import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import CategoryProductsView from '@/components/CategoryProductsView';

interface Props {
  params: Promise<{ slug: string; subSlug: string }>;
}

export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subSlug } = await params;
  const subCat = await db.getCategoryBySlug(subSlug);
  if (!subCat) return { title: 'Subcategory Not Found | Dhati' };
  return {
    title: `${subCat.name} | Dhati`,
    description: subCat.description || `Browse authentic ${subCat.name} collections on Dhati with cash on delivery.`,
  };
}

export default async function SubcategoryPage({ params }: Props) {
  const { slug, subSlug } = await params;
  const [parentCat, subCat] = await Promise.all([
    db.getCategoryBySlug(slug),
    db.getCategoryBySlug(subSlug)
  ]);

  if (!parentCat || !subCat) {
    notFound();
  }

  // Preload initial 48 products
  const productsResult = await db.getProducts({ categorySlug: subSlug, limit: 48, offset: 0 });

  return (
    <CategoryProductsView
      category={subCat}
      parentCategory={parentCat}
      initialProducts={productsResult.products}
      initialTotal={productsResult.total}
      pageSize={48}
    />
  );
}
