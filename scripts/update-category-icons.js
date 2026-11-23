// scripts/update-category-icons.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const DATA_FILE = path.join(__dirname, '..', 'data', 'store_data.json');

// Exact matching icons for all categories
const CATEGORY_ICON_MAPPING = {
  'tech': { iconUrl: '/icons/categories/tech.svg', iconName: 'Laptop' },
  'food': { iconUrl: '/icons/categories/food.svg', iconName: 'Utensils' },
  'clothing': { iconUrl: '/icons/categories/clothing.svg', iconName: 'Shirt' },
  'kids': { iconUrl: '/icons/categories/kids.svg', iconName: 'Smile' },
  'home': { iconUrl: '/icons/categories/home.svg', iconName: 'Home' },
  'other': { iconUrl: '/icons/categories/other.svg', iconName: 'Package' },
  'mens-fashion': { iconUrl: '/icons/categories/mens-fashion.svg', iconName: 'Shirt' },
  "men's fashion": { iconUrl: '/icons/categories/mens-fashion.svg', iconName: 'Shirt' },
  'mens-accessories': { iconUrl: '/icons/categories/accessories.svg', iconName: 'Glasses' },
  "men's accessories": { iconUrl: '/icons/categories/accessories.svg', iconName: 'Glasses' },
  'home-and-lifestyle': { iconUrl: '/icons/categories/lifestyle.svg', iconName: 'Home' },
  'home & lifestyle': { iconUrl: '/icons/categories/lifestyle.svg', iconName: 'Home' },
  'watches': { iconUrl: '/icons/categories/watches.svg', iconName: 'Watch' },
  'shirts': { iconUrl: '/icons/categories/shirts.svg', iconName: 'Shirt' },
};

function matchIcon(name, slug) {
  const cleanName = (name || '').toLowerCase().trim();
  const cleanSlug = (slug || '').toLowerCase().trim();

  if (CATEGORY_ICON_MAPPING[cleanSlug]) return CATEGORY_ICON_MAPPING[cleanSlug];
  if (CATEGORY_ICON_MAPPING[cleanName]) return CATEGORY_ICON_MAPPING[cleanName];

  if (cleanName.includes('watch')) return { iconUrl: '/icons/categories/watches.svg', iconName: 'Watch' };
  if (cleanName.includes('shirt')) return { iconUrl: '/icons/categories/shirts.svg', iconName: 'Shirt' };
  if (cleanName.includes('accessory') || cleanName.includes('accessories')) return { iconUrl: '/icons/categories/accessories.svg', iconName: 'Glasses' };
  if (cleanName.includes('men') && cleanName.includes('fashion')) return { iconUrl: '/icons/categories/mens-fashion.svg', iconName: 'Shirt' };
  if (cleanName.includes('lifestyle')) return { iconUrl: '/icons/categories/lifestyle.svg', iconName: 'Home' };
  if (cleanName.includes('home')) return { iconUrl: '/icons/categories/home.svg', iconName: 'Home' };
  if (cleanName.includes('tech') || cleanName.includes('electronic')) return { iconUrl: '/icons/categories/tech.svg', iconName: 'Laptop' };
  if (cleanName.includes('cloth') || cleanName.includes('apparel')) return { iconUrl: '/icons/categories/clothing.svg', iconName: 'Shirt' };
  if (cleanName.includes('food')) return { iconUrl: '/icons/categories/food.svg', iconName: 'Utensils' };
  if (cleanName.includes('kid')) return { iconUrl: '/icons/categories/kids.svg', iconName: 'Smile' };

  return { iconUrl: '/icons/categories/other.svg', iconName: 'Package' };
}

async function run() {
  console.log('--- UPDATING CATEGORY ICONS ---');

  let local = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  let cloud = null;
  if (supabase) {
    const { data: set } = await supabase.from('store_settings').select('setting_value').eq('setting_key', 'dregital_store_dataset').maybeSingle();
    cloud = set?.setting_value;
  }

  const dataset = cloud || local;
  const categories = dataset.categories || [];

  console.log(`Found ${categories.length} categories.`);

  categories.forEach((cat, index) => {
    // Clean up accidental long slug for Men's Fashion
    if (cat.name === "Men's Fashion" && cat.slug.length > 30) {
      cat.slug = 'mens-fashion';
    }

    const matched = matchIcon(cat.name, cat.slug);
    cat.image_url = matched.iconUrl;
    cat.icon_name = matched.iconName;

    console.log(`[${index + 1}] ${cat.name} -> icon: ${cat.image_url} (name: ${cat.icon_name})`);
  });

  dataset.categories = categories;

  // Save locally
  fs.writeFileSync(DATA_FILE, JSON.stringify(dataset, null, 2), 'utf-8');
  console.log('Saved to data/store_data.json');

  // Save to Supabase
  if (supabase) {
    const { error } = await supabase.from('store_settings').upsert({
      setting_key: 'dregital_store_dataset',
      setting_value: dataset,
      updated_at: new Date().toISOString()
    }, { onConflict: 'setting_key' });

    if (error) {
      console.error('Supabase update error:', error);
    } else {
      console.log('Successfully synced category icons to Supabase!');
    }
  }

  console.log('--- ALL CATEGORY ICONS SUCCESSFULLY UPDATED ---');
}

run().catch(console.error);
