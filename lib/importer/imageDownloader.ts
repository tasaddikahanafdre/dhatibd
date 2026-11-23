// lib/importer/imageDownloader.ts
import { getSupabaseAdminClient } from '@/lib/supabase';

const BUCKET_NAME = 'image';

// In-memory cache for downloaded URLs to avoid duplicate uploads
const uploadedImagesCache = new Map<string, string>();

/**
 * Downloads an external image and stores it permanently in Supabase Storage.
 */
export async function downloadAndStoreProductImage(
  imageUrl: string,
  productId: string,
  index: number = 0
): Promise<string> {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return '';
  }

  // Already a Supabase-stored image
  if (imageUrl.includes('supabase.co/storage/v1/object/public/')) {
    return imageUrl;
  }

  // Check cache
  if (uploadedImagesCache.has(imageUrl)) {
    return uploadedImagesCache.get(imageUrl)!;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return imageUrl; // Fallback to source URL if Supabase is not configured
  }

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        throw new Error('Empty image payload received');
      }

      // Extension deduction
      let ext = 'jpg';
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';
      else if (contentType.includes('gif')) ext = 'gif';

      const sanitizedId = productId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const storagePath = `products/mohasagor/${sanitizedId}_${index}_${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, buffer, {
        contentType,
        upsert: true
      });

      if (error) {
        throw error;
      }

      const { data: pubData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      if (pubData?.publicUrl) {
        uploadedImagesCache.set(imageUrl, pubData.publicUrl);
        return pubData.publicUrl;
      }

      return imageUrl;
    } catch (err: any) {
      if (attempt >= maxAttempts) {
        console.warn(`[ImageDownloader] Failed to store image after ${maxAttempts} attempts: ${imageUrl} (${err?.message})`);
        return imageUrl; // Graceful fallback to original URL
      }
      // Exponential backoff: 500ms, 1000ms
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
    }
  }

  return imageUrl;
}
