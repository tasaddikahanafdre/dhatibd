import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/category`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const productsResult = await db.getProducts({ limit: 1000 });
    const products = Array.isArray(productsResult) ? productsResult : (productsResult?.products || []);
    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: new Date(p.created_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    const categories = await db.getCategories();
    const categoryRoutes: MetadataRoute.Sitemap = (categories || []).map((c) => ({
      url: `${baseUrl}/category/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const dealPages = await db.getDealPages(false);
    const dealRoutes: MetadataRoute.Sitemap = (dealPages || []).map((d) => ({
      url: `${baseUrl}/deal/${d.slug}`,
      lastModified: new Date(d.created_at || Date.now()),
      changeFrequency: 'daily',
      priority: 0.85,
    }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...dealRoutes];
  } catch {
    return staticRoutes;
  }
}
