// lib/importer/processor.ts
import { db } from '@/lib/db';
import { Product } from '@/lib/types';
import { downloadAndStoreProductImage } from './imageDownloader';
import { getImporterState, saveImporterState, ImporterState } from './state';
import { ImportConfig, ImportJob, ImportJobItem, SupplierProductRaw } from './types';

/**
 * Creates a slug from a product title
 */
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Calculates selling price based on pricing markup rules
 */
export function calculateSellingPrice(
  supplierPrice: number,
  config: { markup_type: 'none' | 'fixed' | 'percentage'; markup_value: number },
  existingSellingPrice?: number
): number {
  // RULE: Never overwrite manually adjusted Dhati selling prices for existing products
  if (existingSellingPrice !== undefined && existingSellingPrice > 0) {
    return existingSellingPrice;
  }

  const base = Math.max(0, Number(supplierPrice) || 0);

  if (config.markup_type === 'fixed') {
    return Math.round(base + (Number(config.markup_value) || 0));
  } else if (config.markup_type === 'percentage') {
    const pct = Number(config.markup_value) || 0;
    return Math.round(base * (1 + pct / 100));
  }

  return Math.round(base);
}

/**
 * Processes a list of raw supplier products in batches
 */
export async function processProductsBatch(
  jobId: string,
  rawProducts: SupplierProductRaw[],
  config: ImportConfig,
  isRetry: boolean = false
): Promise<{
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  imagesCount: number;
}> {
  const state = await getImporterState();
  const allExistingProducts = (await db.getProducts({ includeInactive: true, limit: 10000 })).products;
  const categories = await db.getCategories(true);

  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let imagesCount = 0;

  const total = rawProducts.length;

  for (let i = 0; i < total; i++) {
    const raw = rawProducts[i];
    const currentProgressPercent = Math.round(((i + 1) / total) * 100);

    try {
      // 1. Validation
      if (!raw.name || typeof raw.name !== 'string' || raw.name.trim().length === 0) {
        throw new Error('Missing or empty product name');
      }

      const supplierPrice = Number(raw.supplier_price);
      if (isNaN(supplierPrice) || supplierPrice < 0) {
        throw new Error(`Invalid supplier price: ${raw.supplier_price}`);
      }

      // 2. Identify duplicates
      const supplierSku = raw.sku || `MOH-${raw.supplier_product_id}`;
      const existing = allExistingProducts.find(
        p => (p.sku && p.sku.toLowerCase() === supplierSku.toLowerCase()) ||
             (p.name.toLowerCase().trim() === raw.name.toLowerCase().trim())
      );

      // 3. Category Mapping
      let categoryId = 'cat-other-006'; // default
      if (raw.category_name) {
        const mapped = state.category_mappings[raw.category_name] || 
                       state.category_mappings[raw.category_name.toLowerCase()] ||
                       config.category_mappings?.[raw.category_name];
        if (mapped) {
          categoryId = mapped;
        } else {
          // Attempt exact or slug match in existing categories
          const catMatch = categories.find(
            c => c.name.toLowerCase() === raw.category_name?.toLowerCase() ||
                 c.slug.toLowerCase() === raw.category_name?.toLowerCase()
          );
          if (catMatch) categoryId = catMatch.id;
        }
      }

      // 4. Calculate Selling Price
      const finalPrice = calculateSellingPrice(
        supplierPrice,
        config,
        existing ? existing.price : undefined
      );

      // Publishing status: default is draft, unless auto_publish is explicitly enabled AND price is valid
      const isValidPrice = finalPrice > 0;
      const shouldPublish = config.auto_publish && isValidPrice;

      // 5. Download & Store Images in Supabase Storage
      let mainImageUrl = raw.main_image_url || '';
      let additionalImages: string[] = [];

      if (config.download_images && mainImageUrl) {
        try {
          const storedMain = await downloadAndStoreProductImage(
            mainImageUrl,
            raw.supplier_product_id || `prod-${Date.now()}`,
            0
          );
          if (storedMain) {
            mainImageUrl = storedMain;
            imagesCount++;
          }
        } catch (imgErr) {
          console.warn(`Could not upload main image to Supabase:`, imgErr);
        }

        if (Array.isArray(raw.additional_images)) {
          for (let imgIdx = 0; imgIdx < raw.additional_images.length; imgIdx++) {
            const addImg = raw.additional_images[imgIdx];
            try {
              const storedAdd = await downloadAndStoreProductImage(
                addImg,
                raw.supplier_product_id || `prod-${Date.now()}`,
                imgIdx + 1
              );
              if (storedAdd) {
                additionalImages.push(storedAdd);
                imagesCount++;
              }
            } catch {
              additionalImages.push(addImg);
            }
          }
        }
      }

      // 6. Database Upsert
      if (existing) {
        // Update supplier data without overwriting manual price changes
        await db.updateProduct(existing.id, {
          name: existing.name, // Keep existing title if customized
          cost_price: supplierPrice,
          category_id: existing.category_id || categoryId,
          description: raw.description || existing.description,
          short_description: raw.short_description || existing.short_description,
          images: [mainImageUrl, ...additionalImages].filter(Boolean),
          stock_quantity: raw.stock_status === 'out_of_stock' ? 0 : (existing.stock_quantity || 15),
          updated_at: new Date().toISOString()
        });
        updatedCount++;
      } else {
        // Create new imported product
        const newProduct = await db.createProduct({
          name: raw.name.trim(),
          sku: supplierSku,
          slug: `${createSlug(raw.name)}-${raw.supplier_product_id || Math.random().toString(36).slice(2, 6)}`,
          category_id: categoryId,
          price: finalPrice,
          cost_price: supplierPrice,
          original_price: raw.discount_price && raw.discount_price > supplierPrice ? raw.discount_price : undefined,
          stock_quantity: raw.stock_status === 'out_of_stock' ? 0 : 20,
          short_description: raw.short_description || raw.name,
          description: raw.description || `Authentic ${raw.name} sourced directly from verified supplier.`,
          images: [mainImageUrl, ...additionalImages].filter(Boolean),
          is_active: shouldPublish, // Draft if false, published if true
          is_featured: false,
          is_bestseller: false,
          rating_average: 4.8,
          rating_count: 5
        });
        allExistingProducts.push(newProduct);
        importedCount++;
      }

      // If this was a retry, remove it from failed items
      if (isRetry) {
        state.failed_items = state.failed_items.filter(
          item => item.supplier_product_id !== raw.supplier_product_id
        );
      }
    } catch (err: any) {
      failedCount++;
      const failedItem: ImportJobItem = {
        id: `fail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        job_id: jobId,
        supplier_product_id: raw.supplier_product_id || `unknown-${i}`,
        name: raw.name || 'Unnamed Product',
        status: 'failed',
        error_message: err?.message || 'Unknown processing error',
        created_at: new Date().toISOString()
      };

      // Add to failed items list (deduplicating by supplier_product_id)
      state.failed_items = [
        ...state.failed_items.filter(f => f.supplier_product_id !== failedItem.supplier_product_id),
        failedItem
      ];
    }

    // Checkpoint progress update every 5 items or at the end
    if (i % 5 === 0 || i === total - 1) {
      if (state.active_job && state.active_job.id === jobId) {
        state.active_job.total_imported += importedCount;
        state.active_job.total_updated += updatedCount;
        state.active_job.total_skipped += skippedCount;
        state.active_job.total_failed += failedCount;
        state.active_job.images_downloaded += imagesCount;
        state.active_job.progress_percent = currentProgressPercent;
        state.active_job.updated_at = new Date().toISOString();
        state.active_job.checkpoint = {
          last_processed_index: i,
          last_page: 1
        };
      }
      await saveImporterState(state);
    }
  }

  return { importedCount, updatedCount, skippedCount, failedCount, imagesCount };
}
