import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { syncCustomFavicon } from '@/lib/faviconSync';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // 1. Sync custom favicon across public files
  syncCustomFavicon();

  // 2. Ordered resolution list
  const possiblePaths = [
    // Primary: user pastes fav.png in public/logo/
    { p: path.join(process.cwd(), 'public', 'logo', 'fav.png'), mime: 'image/png' },
    { p: path.join(process.cwd(), 'public', 'logo', 'fav.PNG'), mime: 'image/png' },
    { p: path.join(process.cwd(), 'public', 'logo', 'fav.jpg'), mime: 'image/jpeg' },
    { p: path.join(process.cwd(), 'public', 'logo', 'fav.jpeg'), mime: 'image/jpeg' },
    { p: path.join(process.cwd(), 'public', 'logo', 'fav.webp'), mime: 'image/webp' },
    { p: path.join(process.cwd(), 'public', 'logo', 'fav.svg'), mime: 'image/svg+xml' },
    { p: path.join(process.cwd(), 'public', 'logo', 'fav.ico'), mime: 'image/x-icon' },
    { p: path.join(process.cwd(), 'public', 'logo', 'favicon.png'), mime: 'image/png' },
    { p: path.join(process.cwd(), 'public', 'logo', 'favicon.ico'), mime: 'image/x-icon' },

    // Fallbacks
    { p: path.join(process.cwd(), 'public', 'favicon.ico'), mime: 'image/x-icon' },
    { p: path.join(process.cwd(), 'public', 'favicon.png'), mime: 'image/png' },
    { p: path.join(process.cwd(), 'public', 'fav.png'), mime: 'image/png' },
    { p: path.join(process.cwd(), 'app', 'icon.png'), mime: 'image/png' },
  ];

  for (const item of possiblePaths) {
    if (fs.existsSync(item.p)) {
      try {
        const fileBuffer = fs.readFileSync(item.p);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': item.mime,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      } catch (e) {
        console.error('Failed to read favicon:', e);
      }
    }
  }

  return NextResponse.json({ exists: false }, { status: 404 });
}

export async function HEAD() {
  const customFavPng = path.join(process.cwd(), 'public', 'logo', 'fav.png');
  const customFavPNG = path.join(process.cwd(), 'public', 'logo', 'fav.PNG');
  if (fs.existsSync(customFavPng) || fs.existsSync(customFavPNG)) {
    return new NextResponse(null, { status: 200 });
  }
  return new NextResponse(null, { status: 404 });
}
