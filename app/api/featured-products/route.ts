import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [featuredProducts, featuredIds, allProductsResult] = await Promise.all([
      db.getFeaturedProducts(),
      db.getFeaturedProductIds(),
      db.getProducts({ includeInactive: true })
    ]);

    return NextResponse.json({
      featured_products: featuredProducts,
      featured_ids: featuredIds,
      all_products: allProductsResult.products
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json({ error: 'Failed to fetch featured products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product_ids } = body;

    if (!Array.isArray(product_ids)) {
      return NextResponse.json({ error: 'product_ids must be an array' }, { status: 400 });
    }

    if (product_ids.length > 9) {
      return NextResponse.json({ error: 'Maximum 9 featured products allowed' }, { status: 400 });
    }

    const updated = await db.setFeaturedProducts(product_ids);
    const ids = await db.getFeaturedProductIds();

    return NextResponse.json({
      success: true,
      featured_products: updated,
      featured_ids: ids
    });
  } catch (error) {
    console.error('Error updating featured products:', error);
    return NextResponse.json({ error: 'Failed to update featured products' }, { status: 500 });
  }
}
