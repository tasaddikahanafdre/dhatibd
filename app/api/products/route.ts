import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const featured = searchParams.get('featured') === 'true';
    const bestseller = searchParams.get('bestseller') === 'true';
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const sortBy = (searchParams.get('sortBy') as any) || 'newest';
    const isAll = searchParams.get('all') === 'true';
    const limit = isAll ? undefined : (searchParams.get('limit') ? Number(searchParams.get('limit')) : 24);
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;

    const result = await db.getProducts({
      categorySlug,
      search,
      featured,
      bestseller,
      includeInactive,
      minPrice,
      maxPrice,
      sortBy,
      limit,
      offset
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Products GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || body.price === undefined || body.price === null) {
      return NextResponse.json({ error: 'Product name and price are required' }, { status: 400 });
    }

    const product = await db.createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('API Products POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
