import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const banners = await db.getBanners(includeInactive);
    return NextResponse.json(banners, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch banners' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Banners array required' }, { status: 400 });
    }
    const updated = await db.updateBanners(body);

    // Instant purge of Next.js static / ISR caches
    try {
      revalidatePath('/', 'page');
      revalidatePath('/', 'layout');
      revalidatePath('/admin/banners');
      revalidatePath('/shop');
    } catch (e) {
      console.error('Revalidation error:', e);
    }

    return NextResponse.json(updated, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update banners' }, { status: 500 });
  }
}
