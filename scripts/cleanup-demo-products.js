const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables via Node --env-file=.env.local
// require('dotenv') not required in Node 20+

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const DATA_FILE = path.join(__dirname, '..', 'data', 'store_data.json');
const BACKUP_FILE = path.join(__dirname, '..', 'data', 'backup_demo_products.json');
const LOG_FILE = path.join(__dirname, '..', 'data', 'demo_cleanup_log.json');

async function runDemoCleanup() {
  console.log('--- STARTING CONTROLLED DEMO PRODUCT CLEANUP ---');

  // 1. Read existing dataset
  let localData = { categories: [], products: [], orders: [] };
  if (fs.existsSync(DATA_FILE)) {
    localData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }

  let cloudData = null;
  if (supabase) {
    const { data: set } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'dregital_store_dataset')
      .maybeSingle();
    cloudData = set?.setting_value;
  }

  const currentDataset = cloudData || localData;
  const currentProducts = currentDataset.products || [];
  const currentOrders = currentDataset.orders || [];

  console.log(`Found ${currentProducts.length} total products in dataset.`);
  console.log(`Found ${currentOrders.length} customer orders.`);

  // 2. Identify demo products
  const demoProductIds = new Set([
    'prod-aura-headphones',
    'prod-chronos-watch',
    'prod-ethiopian-coffee',
    'prod-organic-tee',
    'prod-ceramic-lamp',
    'prod-leather-folio',
    'prod-stormshield-jacket',
    'prod-beechwood-blocks',
    'prod-raw-honey',
    'prod-french-press',
    'prod-muslin-blanket',
    'prod-laptop-stand'
  ]);

  const removedDemoProducts = [];
  const preservedRealProducts = [];

  for (const product of currentProducts) {
    const isUnsplashDemo = typeof product.image_url === 'string' && product.image_url.includes('images.unsplash.com');
    const isKnownDemoId = demoProductIds.has(product.id);

    if (isKnownDemoId || isUnsplashDemo) {
      removedDemoProducts.push({
        id: product.id,
        name: product.name,
        price: product.price,
        category_id: product.category_id,
        image_url: product.image_url,
        reason: isKnownDemoId ? 'Known development demo product' : 'Placeholder Unsplash stock product'
      });
    } else {
      preservedRealProducts.push(product);
    }
  }

  console.log(`Identified ${removedDemoProducts.length} demo products to remove.`);
  console.log(`Preserving ${preservedRealProducts.length} real products.`);

  // 3. Backup removed products
  const backupData = {
    backup_timestamp: new Date().toISOString(),
    removed_count: removedDemoProducts.length,
    preserved_count: preservedRealProducts.length,
    demo_products: removedDemoProducts,
    full_previous_products: currentProducts
  };
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`Backup saved to ${BACKUP_FILE}`);

  // 4. Update dataset
  const updatedDataset = {
    ...currentDataset,
    products: preservedRealProducts
  };

  // 5. Save locally
  fs.writeFileSync(DATA_FILE, JSON.stringify(updatedDataset, null, 2), 'utf-8');
  console.log(`Updated local file: ${DATA_FILE}`);

  // 6. Save to Supabase
  if (supabase) {
    // Update store_settings dataset
    const { error: setErr } = await supabase.from('store_settings').upsert({
      setting_key: 'dregital_store_dataset',
      setting_value: updatedDataset,
      updated_at: new Date().toISOString()
    }, { onConflict: 'setting_key' });

    if (setErr) {
      console.error('Error saving updated dataset to Supabase store_settings:', setErr);
    } else {
      console.log('Successfully updated Supabase store_settings dataset.');
    }

    // Also remove from products table if any existed
    for (const demo of removedDemoProducts) {
      await supabase.from('products').delete().eq('id', demo.id);
    }
    console.log('Cleaned products table in Supabase.');
  }

  // 7. Write cleanup audit log
  const auditLog = {
    cleanup_date: new Date().toISOString(),
    status: 'COMPLETED_SUCCESSFULLY',
    summary: {
      demo_products_removed: removedDemoProducts.length,
      real_products_preserved: preservedRealProducts.length,
      categories_preserved: (updatedDataset.categories || []).length,
      customer_orders_preserved: currentOrders.length
    },
    removed_items: removedDemoProducts.map(p => ({ id: p.id, name: p.name, price: p.price }))
  };
  fs.writeFileSync(LOG_FILE, JSON.stringify(auditLog, null, 2), 'utf-8');
  console.log(`Audit log written to ${LOG_FILE}`);

  console.log('--- DEMO PRODUCT CLEANUP COMPLETED ---');
}

runDemoCleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
