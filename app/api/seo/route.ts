import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [seoSettings, productsResult, categories] = await Promise.all([
      db.getSEOSettings(),
      db.getProducts({ includeInactive: true, limit: 100 }),
      db.getCategories(true)
    ]);

    return NextResponse.json({
      settings: seoSettings,
      products: productsResult.products,
      categories: categories
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch SEO settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings, entityKey, entitySEO } = body;

    if (entityKey && entitySEO) {
      await db.setEntitySEO(entityKey, entitySEO);
      return NextResponse.json({ success: true, entityKey, entitySEO });
    }

    if (settings) {
      const updated = await db.updateSEOSettings(settings);
      return NextResponse.json({ success: true, settings: updated });
    }

    return NextResponse.json({ error: 'Invalid SEO payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update SEO settings' }, { status: 500 });
  }
}
