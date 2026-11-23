// lib/adminAuth.ts
// Secure Admin Session Management using Web Crypto API (compatible with Edge Middleware & Node.js)

export const ADMIN_COOKIE_NAME = 'dhati_admin_session';

// The requested admin passcode
export const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || process.env.ADMIN_PASSWORD || '201126Dre2812';

// Secret used to sign session cookies
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'dhati_passcode_session_secret_2026_x89a_9921';

// Session lifetime: 24 hours absolute maximum
const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;

// Configurable inactivity timeout (e.g. 15 minutes of inactivity)
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

interface SessionPayload {
  role: 'admin';
  iat: number;
  exp: number;
  nonce: string;
}

/**
 * Convert string to Uint8Array
 */
function stringToBuffer(str: string): BufferSource {
  return new TextEncoder().encode(str) as unknown as BufferSource;
}

/**
 * Convert ArrayBuffer to Hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Base64 encode for URL/Cookie safety
 */
function base64UrlEncode(str: string): string {
  if (typeof btoa === 'function') {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return Buffer.from(str, 'utf-8').toString('base64url');
}

/**
 * Base64 decode
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  if (typeof atob === 'function') {
    return atob(base64);
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Import HMAC key
 */
async function getCryptoKey(): Promise<CryptoKey> {
  const keyData = stringToBuffer(SESSION_SECRET);
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Creates a cryptographically signed admin session token
 */
export async function createAdminSessionToken(): Promise<string> {
  const now = Date.now();
  const payload: SessionPayload = {
    role: 'admin',
    iat: now,
    exp: now + SESSION_LIFETIME_MS,
    nonce: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
  };

  const payloadString = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(payloadString);

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    stringToBuffer(encodedPayload)
  );

  const signatureHex = bufferToHex(signatureBuffer);
  return `${encodedPayload}.${signatureHex}`;
}

/**
 * Verifies the admin session token
 */
export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [encodedPayload, providedSignature] = parts;

  try {
    const key = await getCryptoKey();
    const expectedSignatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      stringToBuffer(encodedPayload)
    );
    const expectedSignatureHex = bufferToHex(expectedSignatureBuffer);

    // Constant-time length and equality check
    if (providedSignature.length !== expectedSignatureHex.length) {
      return false;
    }

    let diff = 0;
    for (let i = 0; i < providedSignature.length; i++) {
      diff |= providedSignature.charCodeAt(i) ^ expectedSignatureHex.charCodeAt(i);
    }
    if (diff !== 0) return false;

    // Decode and check payload expiration
    const payloadStr = base64UrlDecode(encodedPayload);
    const payload: SessionPayload = JSON.parse(payloadStr);

    if (payload.role !== 'admin') return false;
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}
