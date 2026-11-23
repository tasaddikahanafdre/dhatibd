// scripts/run-sample-import.ts
import { processProductsBatch } from '../lib/importer/processor';
import { getImporterState, saveImporterState } from '../lib/importer/state';
import { db } from '../lib/db';
import { SupplierProductRaw } from '../lib/importer/types';

const SAMPLE_PRODUCTS: SupplierProductRaw[] = [
  {
    supplier_product_id: 'MS-8801',
    name: 'Aukey 65W GaN Dual Port Fast Wall Charger',
    sku: 'MOH-CHG-65W',
    original_url: 'https://dregital.mohasagor.com/product/aukey-65w-gan-charger',
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
    original_url: 'https://dregital.mohasagor.com/product/haylou-solar-pro-smartwatch',
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
    original_url: 'https://dregital.mohasagor.com/product/baseus-bowie-m2-anc-earbuds',
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
    original_url: 'https://dregital.mohasagor.com/product/minimalist-rolltop-backpack',
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
    original_url: 'https://dregital.mohasagor.com/product/keychron-k3-wireless-keyboard',
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

async function main() {
  console.log('--- STARTING MOHASAGOR PRODUCT IMPORT ---');
  const state = await getImporterState();

  const config = {
    markup_type: 'none' as const,
    markup_value: 0,
    auto_publish: true,
    default_status: 'published' as const,
    download_images: true,
    category_mappings: state.category_mappings
  };

  const jobId = `job-cli-${Date.now()}`;
  console.log(`Executing batch import for ${SAMPLE_PRODUCTS.length} products with Supabase image sync...`);

  const result = await processProductsBatch(jobId, SAMPLE_PRODUCTS, config);
  console.log('Import results:', result);

  const productsInDb = await db.getProducts({ limit: 10 });
  console.log(`Total products currently active in Dregital store: ${productsInDb.products.length}`);
  productsInDb.products.forEach(p => {
    console.log(`- [${p.sku}] ${p.name} | Price: ৳${p.price} | Category: ${p.category?.name || p.category_id} | Active: ${p.is_active}`);
  });
}

main().catch(err => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
