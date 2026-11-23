import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const possiblePaths = [
    { p: path.join(process.cwd(), 'public', 'logo', 'logo.png'), mime: 'image/png' },
    { p: path.join(process.cwd(), 'public', 'logo', 'logo.PNG'), mime: 'image/png' },
    { p: path.join(process.cwd(), 'public', 'logo', 'logo.jpg'), mime: 'image/jpeg' },
    { p: path.join(process.cwd(), 'public', 'logo', 'logo.jpeg'), mime: 'image/jpeg' },
    { p: path.join(process.cwd(), 'public', 'logo', 'logo.webp'), mime: 'image/webp' },
    { p: path.join(process.cwd(), 'public', 'logo', 'logo.svg'), mime: 'image/svg+xml' },
    { p: path.join(process.cwd(), 'public', 'logo.png'), mime: 'image/png' },
    { p: path.join(process.cwd(), 'public', 'logo.PNG'), mime: 'image/png' },
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
        console.error('Failed to read logo file:', e);
      }
    }
  }

  return NextResponse.json({ exists: false }, { status: 404 });
}
