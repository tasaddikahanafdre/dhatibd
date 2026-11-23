// app/api/importer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkSupplierConnection } from '@/lib/importer/scraper';
import { getImporterState, saveImporterState } from '@/lib/importer/state';
import { processProductsBatch } from '@/lib/importer/processor';
import { ImportJob, SupplierProductRaw } from '@/lib/importer/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Curated verified sample products from Mohasagor supplier catalogue for testing
const SAMPLE_MOHASAGOR_PRODUCTS: SupplierProductRaw[] = [
  {
    supplier_product_id: 'MS-8801',
    name: 'Aukey 65W GaN Dual Port Fast Wall Charger',
    sku: 'MOH-CHG-65W',
    original_url: 'https://www.dropbazarbd.com/product/aukey-65w-gan-charger',
    supplier_price: 1850,
    discount_price: 2450,
    category_name: 'Tech',
    main_image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    additional_images: [
      'https://images.unsplash.com/photo-1622445268462-337f1688c49a?auto=format&fit=crop&w=800&q=80'
    ],
    short_description: 'Ultra-compact 65W GaN III fast charger with dual Type-C and USB-A power delivery.',
    description: 'Next-generation Gallium Nitride (GaN) fast charger offering up to 65W ultra-high speed charging for laptops, tablets, and smartphones. Dual-port intelligent power allocation ensures safe, cool, and efficient operation.',
    stock_status: 'in_stock'
  },
  {
    supplier_product_id: 'MS-8802',
    name: 'Haylou Solar Pro Smartwatch AMOLED Bluetooth Calling',
    sku: 'MOH-WTH-HAYLOU',
    original_url: 'https://www.dropbazarbd.com/product/haylou-solar-pro-smartwatch',
    supplier_price: 3200,
    discount_price: 4200,
    category_name: 'Tech',
    main_image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    additional_images: [
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80'
    ],
    short_description: '1.43-inch HD AMOLED display with Bluetooth calling, IP68 waterproof and 100+ sports modes.',
    description: 'Premium metal bezel smartwatch featuring an ultra-crisp Always-On AMOLED screen, dedicated speaker and microphone for crystal clear Bluetooth voice calls, comprehensive heart rate and SpO2 monitoring, and 7-day battery life.',
    stock_status: 'in_stock'
  },
  {
    supplier_product_id: 'MS-8803',
    name: 'Baseus Bowie M2+ ANC True Wireless Earbuds',
    sku: 'MOH-AUD-BOWIE',
    original_url: 'https://www.dropbazarbd.com/product/baseus-bowie-m2-anc-earbuds',
    supplier_price: 2650,
    discount_price: 3500,
    category_name: 'Tech',
    main_image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    additional_images: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80'
    ],
    short_description: '-42dB Hybrid Active Noise Cancellation wireless earbuds with dual-channel low latency.',
    description: 'Equipped with hybrid active noise cancellation technology, the Baseus Bowie M2+ eliminates ambient distractions up to -42dB. 4-mic ENC system ensures studio-grade voice clarity during calls. Bluetooth 5.2 with 30-hour total playback.',
    stock_status: 'in_stock'
  },
  {
    supplier_product_id: 'MS-8804',
    name: 'Minimalist Weatherproof Roll-top Laptop Backpack 20L',
    sku: 'MOH-BAG-ROLLTOP',
    original_url: 'https://www.dropbazarbd.com/product/minimalist-rolltop-backpack',
    supplier_price: 1950,
    discount_price: 2800,
    category_name: 'Clothing',
    main_image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    additional_images: [
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80'
    ],
    short_description: 'Water-resistant Oxford fabric urban commuter backpack with padded 15.6" laptop compartment.',
    description: 'Sleek matte black roll-top design engineered for modern city commuters. Features high-density water-repellent exterior, ergonomic breathable back padding, hidden anti-theft rear pocket, and dedicated shockproof laptop compartment.',
    stock_status: 'in_stock'
  },
  {
    supplier_product_id: 'MS-8805',
    name: 'Keychron K3 Ultra-Slim Wireless Mechanical Keyboard',
    sku: 'MOH-KEY-K3V2',
    original_url: 'https://www.dropbazarbd.com/product/keychron-k3-wireless-keyboard',
    supplier_price: 6800,
    discount_price: 8500,
    category_name: 'Tech',
    main_image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    additional_images: [
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80'
    ],
    short_description: 'Low profile optical hot-swappable switches with white LED backlight for Mac and Windows.',
    description: 'World-renowned ultra-slim wireless mechanical keyboard featuring low-profile optical switches. Connects with up to 3 devices via Bluetooth 5.1 or Type-C wired mode. Compatible with both macOS and Windows layouts.',
    stock_status: 'in_stock'
  }
];

export async function GET() {
  try {
    const state = await getImporterState();
    const categories = await db.getCategories(true);

    return NextResponse.json({
      success: true,
      state,
      categories
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch importer state' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || (body.items ? 'legacy_items' : 'unknown');
    const state = await getImporterState();

    switch (action) {
      // 1. Check Supplier Connectivity
      case 'check_supplier': {
        const liveStatus = await checkSupplierConnection();
        state.supplier_status = liveStatus;
        await saveImporterState(state);
        return NextResponse.json({ success: true, supplier_status: liveStatus });
      }

      // 2. Update Configuration (Pricing & Mappings)
      case 'update_config': {
        if (body.pricing_config) {
          state.pricing_config = {
            ...state.pricing_config,
            ...body.pricing_config
          };
        }
        if (body.category_mappings) {
          state.category_mappings = {
            ...state.category_mappings,
            ...body.category_mappings
          };
        }
        await saveImporterState(state);
        return NextResponse.json({ success: true, state });
      }

      // 3. Pause Active Job
      case 'pause_job': {
        if (state.active_job) {
          state.active_job.status = 'paused';
          state.active_job.updated_at = new Date().toISOString();
          await saveImporterState(state);
        }
        return NextResponse.json({ success: true, active_job: state.active_job });
      }

      // 4. Resume Active Job
      case 'resume_job': {
        if (state.active_job && state.active_job.status === 'paused') {
          state.active_job.status = 'running';
          state.active_job.updated_at = new Date().toISOString();
          await saveImporterState(state);
        }
        return NextResponse.json({ success: true, active_job: state.active_job });
      }

      // 5. Cancel Active Job
      case 'cancel_job': {
        if (state.active_job) {
          state.active_job.status = 'cancelled';
          state.active_job.completed_at = new Date().toISOString();
          state.history.unshift(state.active_job);
          state.active_job = null;
          await saveImporterState(state);
        }
        return NextResponse.json({ success: true, active_job: null });
      }

      // 6. Test Import (Sample batch of 5 items)
      case 'test_sample': {
        const testJob: ImportJob = {
          id: `job-test-${Date.now()}`,
          supplier_id: 'sup-mohasagor',
          job_type: 'batch_import',
          status: 'running',
          total_discovered: SAMPLE_MOHASAGOR_PRODUCTS.length,
          total_imported: 0,
          total_updated: 0,
          total_skipped: 0,
          total_failed: 0,
          images_downloaded: 0,
          current_batch: 1,
          total_batches: 1,
          progress_percent: 0,
          config: {
            markup_type: state.pricing_config.markup_type,
            markup_value: state.pricing_config.markup_value,
            auto_publish: state.pricing_config.auto_publish,
            default_status: state.pricing_config.auto_publish ? 'published' : 'draft',
            download_images: true,
            category_mappings: state.category_mappings
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        state.active_job = testJob;
        await saveImporterState(state);

        // Process batch
        const result = await processProductsBatch(
          testJob.id,
          SAMPLE_MOHASAGOR_PRODUCTS,
          testJob.config
        );

        // Finalize test job
        testJob.status = 'completed';
        testJob.total_imported = result.importedCount;
        testJob.total_updated = result.updatedCount;
        testJob.total_skipped = result.skippedCount;
        testJob.total_failed = result.failedCount;
        testJob.images_downloaded = result.imagesCount;
        testJob.progress_percent = 100;
        testJob.completed_at = new Date().toISOString();

        state.history.unshift(testJob);
        state.active_job = null;
        await saveImporterState(state);

        return NextResponse.json({
          success: true,
          result,
          job: testJob
        });
      }

      // 7. Bulk Upload / Catalog Import
      case 'upload_catalog': {
        const rawProducts: SupplierProductRaw[] = Array.isArray(body.products) ? body.products : [];

        if (rawProducts.length === 0) {
          return NextResponse.json({ success: false, error: 'No valid products provided' }, { status: 400 });
        }

        const importJob: ImportJob = {
          id: `job-bulk-${Date.now()}`,
          supplier_id: 'sup-mohasagor',
          job_type: 'file_import',
          status: 'running',
          total_discovered: rawProducts.length,
          total_imported: 0,
          total_updated: 0,
          total_skipped: 0,
          total_failed: 0,
          images_downloaded: 0,
          current_batch: 1,
          total_batches: Math.ceil(rawProducts.length / 10),
          progress_percent: 0,
          config: {
            markup_type: state.pricing_config.markup_type,
            markup_value: state.pricing_config.markup_value,
            auto_publish: state.pricing_config.auto_publish,
            default_status: state.pricing_config.auto_publish ? 'published' : 'draft',
            download_images: body.download_images !== false,
            category_mappings: state.category_mappings
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        state.active_job = importJob;
        await saveImporterState(state);

        // Process items
        const result = await processProductsBatch(
          importJob.id,
          rawProducts,
          importJob.config
        );

        importJob.status = 'completed';
        importJob.total_imported = result.importedCount;
        importJob.total_updated = result.updatedCount;
        importJob.total_skipped = result.skippedCount;
        importJob.total_failed = result.failedCount;
        importJob.images_downloaded = result.imagesCount;
        importJob.progress_percent = 100;
        importJob.completed_at = new Date().toISOString();

        state.history.unshift(importJob);
        state.active_job = null;
        await saveImporterState(state);

        return NextResponse.json({
          success: true,
          result,
          job: importJob
        });
      }

      // 8. Retry Failed Products
      case 'retry_failed': {
        const itemsToRetry = state.failed_items;
        if (itemsToRetry.length === 0) {
          return NextResponse.json({ success: true, message: 'No failed products to retry' });
        }

        const retryProducts: SupplierProductRaw[] = itemsToRetry.map(item => ({
          supplier_product_id: item.supplier_product_id,
          name: item.name,
          supplier_price: 1000,
          main_image_url: ''
        }));

        const retryJob: ImportJob = {
          id: `job-retry-${Date.now()}`,
          supplier_id: 'sup-mohasagor',
          job_type: 'batch_import',
          status: 'running',
          total_discovered: retryProducts.length,
          total_imported: 0,
          total_updated: 0,
          total_skipped: 0,
          total_failed: 0,
          images_downloaded: 0,
          current_batch: 1,
          total_batches: 1,
          progress_percent: 0,
          config: {
            markup_type: state.pricing_config.markup_type,
            markup_value: state.pricing_config.markup_value,
            auto_publish: state.pricing_config.auto_publish,
            default_status: state.pricing_config.auto_publish ? 'published' : 'draft',
            download_images: true,
            category_mappings: state.category_mappings
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const result = await processProductsBatch(
          retryJob.id,
          retryProducts,
          retryJob.config,
          true
        );

        retryJob.status = 'completed';
        retryJob.total_imported = result.importedCount;
        retryJob.total_updated = result.updatedCount;
        retryJob.total_skipped = result.skippedCount;
        retryJob.total_failed = result.failedCount;
        retryJob.images_downloaded = result.imagesCount;
        retryJob.progress_percent = 100;
        retryJob.completed_at = new Date().toISOString();

        state.history.unshift(retryJob);
        state.active_job = null;
        await saveImporterState(state);

        return NextResponse.json({
          success: true,
          result,
          remaining_failed: state.failed_items.length
        });
      }

      // Legacy support for direct items payload
      case 'legacy_items': {
        const rawProducts: SupplierProductRaw[] = (body.items || []).map((item: any, idx: number) => ({
          supplier_product_id: item.supplier_product_id || item.id || `LEGACY-${idx}`,
          name: item.name || item.title || 'Untitled',
          sku: item.sku,
          supplier_price: Number(item.price || item.selling_price || item.cost_price || 0),
          discount_price: item.original_price ? Number(item.original_price) : undefined,
          category_name: item.category || item.category_name,
          main_image_url: item.image_url || item.image || (Array.isArray(item.images) ? item.images[0] : ''),
          additional_images: Array.isArray(item.images) ? item.images.slice(1) : [],
          short_description: item.short_description,
          description: item.description
        }));

        const result = await processProductsBatch(
          `job-legacy-${Date.now()}`,
          rawProducts,
          {
            markup_type: state.pricing_config.markup_type,
            markup_value: state.pricing_config.markup_value,
            auto_publish: true,
            default_status: 'published',
            download_images: true,
            category_mappings: state.category_mappings
          }
        );

        return NextResponse.json({ success: true, result });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Error in importer API route:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error occurred' },
      { status: 500 }
    );
  }
}
