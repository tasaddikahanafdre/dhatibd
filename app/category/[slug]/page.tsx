import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import CategoryProductsView from '@/components/CategoryProductsView';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.getCategoryBySlug(slug);
  if (!category) return { title: 'Category Not Found | Dhati' };
  return {
    title: `${category.name} | Dhati`,
    description: category.description || `Browse authentic ${category.name} on Dhati with cash on delivery across Bangladesh.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await db.getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  // Preload initial 48 products on server for instant SSR & SEO
  const [productsResult, allCategories] = await Promise.all([
    db.getProducts({ categorySlug: slug, limit: 48, offset: 0 }),
    db.getCategories(true)
  ]);

  const subcategories = allCategories.filter(c => c.parent_id === category.id);

  return (
    <CategoryProductsView
      category={category}
      subcategories={subcategories}
      initialProducts={productsResult.products}
      initialTotal={productsResult.total}
      pageSize={48}
    />
  );
}
