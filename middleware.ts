import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from './lib/adminAuth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow login page and public assets
  if (pathname === '/admin/login') {
    const sessionToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (sessionToken && (await verifyAdminSessionToken(sessionToken))) {
      // Already authenticated, redirect to /admin dashboard
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // 2. Protect all other /admin routes
  if (pathname.startsWith('/admin')) {
    const sessionToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isValid = await verifyAdminSessionToken(sessionToken);

    if (!isValid) {
      // Redirect to /admin/login preserving intended destination
      const loginUrl = new URL('/admin/login', request.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('from', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
