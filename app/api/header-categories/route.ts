import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [headerCategories, headerIds, allCategories] = await Promise.all([
      db.getHeaderFeaturedCategories(),
      db.getHeaderFeaturedCategoryIds(),
      db.getCategories(false)
    ]);

    return NextResponse.json({
      header_categories: headerCategories,
      header_ids: headerIds,
      all_categories: allCategories
    });
  } catch (error) {
    console.error('Error fetching header categories:', error);
    return NextResponse.json({ error: 'Failed to fetch header categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category_ids } = body;

    if (!Array.isArray(category_ids)) {
      return NextResponse.json({ error: 'category_ids must be an array' }, { status: 400 });
    }

    const updated = await db.setHeaderFeaturedCategories(category_ids);
    const ids = await db.getHeaderFeaturedCategoryIds();

    return NextResponse.json({
      success: true,
      header_categories: updated,
      header_ids: ids
    });
  } catch (error) {
    console.error('Error updating header categories:', error);
    return NextResponse.json({ error: 'Failed to update header categories' }, { status: 500 });
  }
}
