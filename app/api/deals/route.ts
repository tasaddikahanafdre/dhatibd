import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true';

    const deals = await db.getDealPages(includeInactive);
    return NextResponse.json(deals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch deals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Deal title is required' }, { status: 400 });
    }

    const newDeal = await db.createDealPage(body);
    return NextResponse.json(newDeal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create deal page' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    const updated = await db.updateDealPage(id, data);
    if (!updated) {
      return NextResponse.json({ error: 'Deal page not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update deal page' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    const deleted = await db.deleteDealPage(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete deal page' }, { status: 500 });
  }
}
