import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const deal = await db.getDealPageBySlug(slug);

    if (!deal) {
      return NextResponse.json({ error: 'Deal page not found' }, { status: 404 });
    }

    // Resolve products with live catalog details
    const allProductsResult = await db.getProducts({ includeInactive: true });
    const allProducts = allProductsResult.products;

    const resolvedProducts = (deal.products || []).map(dp => {
      const product = allProducts.find(p => p.id === dp.product_id);
      if (!product) return null;

      const originalPrice = product.price;
      let dealPrice = originalPrice;
      let savings = 0;
      let discountPercent = 0;

      if (dp.discount_type === 'percentage') {
        savings = Math.round((originalPrice * dp.discount_value) / 100);
        dealPrice = Math.max(1, originalPrice - savings);
        discountPercent = dp.discount_value;
      } else {
        savings = dp.discount_value;
        dealPrice = Math.max(1, originalPrice - savings);
        discountPercent = Math.round((savings / originalPrice) * 100);
      }

      return {
        ...dp,
        product,
        deal_price: dealPrice,
        original_price: originalPrice,
        savings,
        discount_percent: discountPercent,
        discount_badge: dp.discount_type === 'percentage' 
          ? `${dp.discount_value}% OFF` 
          : `SAVE ৳${savings.toLocaleString()}`
      };
    }).filter(Boolean);

    return NextResponse.json({
      ...deal,
      resolved_products: resolvedProducts
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch deal details' }, { status: 500 });
  }
}
