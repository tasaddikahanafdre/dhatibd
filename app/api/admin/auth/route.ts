import { NextRequest, NextResponse } from 'next/server';
import { 
  ADMIN_COOKIE_NAME, 
  ADMIN_PASSCODE, 
  createAdminSessionToken, 
  verifyAdminSessionToken 
} from '@/lib/adminAuth';

// In-memory rate limiting for brute force mitigation
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown-ip';
}

/**
 * Check current admin authentication status
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isValid = await verifyAdminSessionToken(token);
    return NextResponse.json({ authenticated: isValid });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

/**
 * Authenticate with admin passcode
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const now = Date.now();
    const clientRecord = failedAttempts.get(ip);

    // Rate-limit check: lock out for 2 minutes after 8 failed attempts
    if (clientRecord && clientRecord.lockedUntil > now) {
      const waitSeconds = Math.ceil((clientRecord.lockedUntil - now) / 1000);
      return NextResponse.json(
        { error: `Too many failed attempts. Please wait ${waitSeconds}s before trying again.` },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const inputPasscode = (body.passcode || body.password || '').toString();

    // Verify passcode against server environment
    if (!inputPasscode || inputPasscode !== ADMIN_PASSCODE) {
      const currentFailures = (clientRecord?.count || 0) + 1;
      const lockedUntil = currentFailures >= 8 ? now + 2 * 60 * 1000 : 0;
      failedAttempts.set(ip, { count: currentFailures, lockedUntil });

      return NextResponse.json(
        { error: 'Incorrect passcode. Please try again.' },
        { status: 401 }
      );
    }

    // Reset failed attempts on success
    failedAttempts.delete(ip);

    // Generate cryptographically signed token
    const sessionToken = await createAdminSessionToken();

    const response = NextResponse.json({
      success: true,
      message: 'Dashboard unlocked successfully'
    });

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Authentication error' },
      { status: 500 }
    );
  }
}

/**
 * Logout / Lock Dashboard: clear session cookie
 */
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Dashboard locked'
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0)
  });

  return response;
}
