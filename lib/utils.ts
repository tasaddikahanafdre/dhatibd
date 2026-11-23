import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Bangladeshi Taka (BDT / ৳)
 */
export function formatPrice(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '৳0';
  }
  const numeric = Math.round(Number(amount));
  return `৳${numeric.toLocaleString('en-IN')}`;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(price: number, originalPrice?: number | null): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * Slugify a string for clean URL paths
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Generate a sequential, human-friendly Bangladeshi order number
 * Example: DRG-202611-8492
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `DRG-${year}${month}-${random}`;
}

/**
 * Format ISO date string into readable format
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Safely resolves the primary thumbnail/image URL for any product record,
 * supporting string image_url, ProductImage[] objects with is_primary flags,
 * string arrays, relative paths, and clean fallback placeholder.
 */
export function getProductPrimaryImage(product?: any): string {
  if (!product) return '/placeholder.svg';

  // 1. Direct product.image_url string
  if (typeof product.image_url === 'string' && product.image_url.trim()) {
    const url = product.image_url.trim();
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
      return url;
    }
    return `/${url}`;
  }

  // 2. Images array
  if (Array.isArray(product.images) && product.images.length > 0) {
    // 2a. Check for explicitly marked primary image object
    const primaryObj = product.images.find((img: any) => img && typeof img === 'object' && img.is_primary);
    if (primaryObj?.image_url && typeof primaryObj.image_url === 'string' && primaryObj.image_url.trim()) {
      const url = primaryObj.image_url.trim();
      return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') ? url : `/${url}`;
    }

    // 2b. Check first entry
    const first = product.images[0];
    if (typeof first === 'string' && first.trim()) {
      const url = first.trim();
      return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') ? url : `/${url}`;
    }
    if (first && typeof first === 'object') {
      const rawUrl = first.image_url || first.url;
      if (typeof rawUrl === 'string' && rawUrl.trim()) {
        const url = rawUrl.trim();
        return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') ? url : `/${url}`;
      }
    }
  }

  return '/placeholder.svg';
}
