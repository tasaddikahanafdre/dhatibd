import fs from 'fs';
import path from 'path';
import { getSupabaseAdminClient } from './supabase';
import { 
  Product, 
  Category, 
  Order, 
  Banner, 
  StoreSetting, 
  PageContent, 
  DeliveryZone, 
  ContactMessage,
  Coupon,
  DealPage,
  GlobalSEOSettings,
  ExpenseRecord,
  SEOMetadata
} from './types';
import { getCategoryIconUrl, matchCategoryIcon } from './categoryIcons';

// Local persistence file path
const DATA_FILE = path.join(process.cwd(), 'data', 'store_data.json');

interface InitialData {
  categories: Category[];
  products: Product[];
  banners: Banner[];
  deliveryZones: DeliveryZone[];
  orders: Order[];
  pages: PageContent[];
  settings: Record<string, any>;
  contactMessages: ContactMessage[];
  featured_product_ids?: string[];
  featured_category_ids?: string[];
  coupons?: Coupon[];
  deal_pages?: DealPage[];
  seo_settings?: GlobalSEOSettings;
  expenses?: ExpenseRecord[];
}

const defaultSEOSettings: GlobalSEOSettings = {
  site_title_default: 'Dhati — Modern Online Store in Bangladesh',
  site_title_template: '%s | Dhati',
  meta_description: 'Shop authentic collections, clothing, fashion, accessories and lifestyle essentials in Bangladesh with cash on delivery and fast nationwide delivery.',
  keywords: 'Dhati, Bangladesh ecommerce, fashion, clothing, lifestyle, online store Dhaka',
  canonical_base_url: process.env.NEXT_PUBLIC_APP_URL || '',
  og_image: '/banner/banner.png',
  robots_indexing: true,
  entity_overrides: {}
};

const defaultDataset: InitialData = {
  featured_product_ids: ['prod-saree-jamdani', 'prod-saree-katan', 'prod-saree-georgette', 'prod-panjabi-embroidered', 'prod-panjabi-kabli', 'prod-women-anarkali'],
  featured_category_ids: ['cat-saree', 'cat-panjabi', 'cat-mens-fashion', 'cat-womens-fashion', 'cat-western-wear', 'cat-kids-clothing', 'cat-shoes', 'cat-accessories', 'cat-seasonal-collections'],
  coupons: [
    {
      id: 'cpn-welcome-10',
      code: 'WELCOME10',
      description: '10% off for first-time shoppers on orders over ৳1,000',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 1000,
      max_discount_amount: 500,
      max_uses: 1000,
      used_count: 0,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'cpn-save-200',
      code: 'DHATI200',
      description: 'Flat ৳200 discount on orders above ৳2,500',
      discount_type: 'fixed',
      discount_value: 200,
      min_order_amount: 2500,
      max_discount_amount: null,
      max_uses: 500,
      used_count: 0,
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  deal_pages: [
    {
      id: 'deal-flash-sale-01',
      title: 'Mega Flash Sale 2026',
      slug: 'flash-sale',
      subtitle: 'Exclusive discounts available only through this official deal page',
      description: 'Limited-time special prices on curated sarees, panjabis, festive wear and designer apparel. Order now before promotional stock runs out!',
      badge_text: 'LIMITED TIME FLASH SALE',
      banner_url: '/banners/hero_main.jpg',
      bg_color: '#000000',
      text_color: '#FFFFFF',
      is_active: true,
      products: [],
      created_at: new Date().toISOString()
    }
  ],
  seo_settings: defaultSEOSettings,
  expenses: [],
  categories: [
    {
      id: 'cat-saree',
      parent_id: null,
      name: 'Saree',
      slug: 'saree',
      description: 'Handcrafted traditional Jamdani, pure Katan silk, Banarasi, and georgette sarees.',
      icon_name: 'Clothing',
      image_url: '/fashion/categories/saree.jpg',
      display_order: 1,
      is_active: true,
      is_featured: true,
    },
    {
      id: 'cat-panjabi',
      parent_id: null,
      name: 'Panjabi',
      slug: 'panjabi',
      description: 'Premium embroidered, linen, silk, and festive Kabli Panjabi sets for men.',
      icon_name: 'Shirt',
      image_url: '/fashion/categories/panjabi.jpg',
      display_order: 2,
      is_active: true,
      is_featured: true,
    },
    {
      id: 'cat-mens-fashion',
      parent_id: null,
      name: "Men's Fashion",
      slug: 'mens-fashion',
      description: 'Executive cotton formal shirts, polo shirts, stretch chinos, and tailored apparel.',
      icon_name: 'Shirt',
      image_url: '/fashion/categories/mens-fashion.jpg',
      display_order: 3,
      is_active: true,
      is_featured: true,
    },
    {
      id: 'cat-womens-fashion',
      parent_id: null,
      name: "Women's Fashion",
      slug: 'womens-fashion',
      description: 'Flared Anarkali kurtis, three-piece cotton lawn suits, and festive ethnic wear.',
      icon_name: 'Clothing',
      image_url: '/fashion/categories/womens-fashion.jpg',
      display_order: 4,
      is_active: true,
      is_featured: true,
    },
    {
      id: 'cat-western-wear',
      parent_id: null,
      name: 'Western Wear',
      slug: 'western-wear',
      description: 'Vintage denim jackets, heavyweight oversized tees, and contemporary streetwear.',
      icon_name: 'Shirt',
      image_url: '/fashion/categories/western-wear.jpg',
      display_order: 5,
      is_active: true,
      is_featured: true,
    },
    {
      id: 'cat-kids-clothing',
      parent_id: null,
      name: "Kids' Clothing",
      slug: 'kids-clothing',
      description: 'Breathable cotton kurta sets, party frocks, and comfortable clothing for children.',
      icon_name: 'Smile',
      image_url: '/fashion/categories/kids-clothing.jpg',
      display_order: 6,
      is_active: true,
      is_featured: true,
    },
    {
      id: 'cat-shoes',
      parent_id: null,
      name: 'Shoes',
      slug: 'shoes',
      description: 'Handmade genuine calfskin leather loafers, dress shoes, and casual sneakers.',
      icon_name: 'Shoe',
      image_url: '/fashion/categories/shoes.jpg',
      display_order: 7,
      is_active: true,
      is_featured: true,
    },
    {
      id: 'cat-accessories',
      parent_id: null,
      name: 'Accessories',
      slug: 'accessories',
      description: 'Full-grain leather belts, artisan Kashmiri shawls, scarves, and fashion accessories.',
      icon_name: 'Glasses',
      image_url: '/fashion/categories/accessories.jpg',
      display_order: 8,
      is_active: true,
      is_featured: true,
    },
    {
      id: 'cat-seasonal-collections',
      parent_id: null,
      name: 'Seasonal Collections',
      slug: 'seasonal-collections',
      description: 'Curated festive Eid collections, summer linen releases, and tailored winter wear.',
      icon_name: 'Home',
      image_url: '/fashion/categories/seasonal-collections.jpg',
      display_order: 9,
      is_active: true,
      is_featured: true,
    }
  ],
  products: [],
  banners: [
    {
      id: 'b-hero-main',
      title: 'Dhati Festive & Contemporary Collections',
      subtitle: '',
      image_url: '/banners/hero_main.jpg',
      target_url: '/shop',
      button_text: '',
      display_order: 1,
      is_active: true,
    },
    {
      id: 'b-promo-1',
      title: 'Heritage Sarees & Festive Panjabis',
      subtitle: '',
      image_url: '/banners/promo_1.jpg',
      target_url: '/category/saree',
      button_text: '',
      display_order: 2,
      is_active: true,
    },
    {
      id: 'b-promo-2',
      title: 'Contemporary Western & Streetwear',
      subtitle: '',
      image_url: '/banners/promo_2.jpg',
      target_url: '/category/western-wear',
      button_text: '',
      display_order: 3,
      is_active: true,
    }
  ],
  deliveryZones: [
    {
      id: 'dz-inside-dhaka',
      name: 'Inside Dhaka',
      charge: 70,
      estimated_days: '24-48 Hours',
      is_active: true,
    },
    {
      id: 'dz-outside-dhaka',
      name: 'Outside Dhaka',
      charge: 130,
      estimated_days: '2-4 Days',
      is_active: true,
    }
  ],
  orders: [],
  pages: [
    {
      id: 'page-about',
      title: 'About Dhati',
      slug: 'about-us',
      content: 'Dhati is a premier fashion and clothing destination in Bangladesh offering handcrafted sarees, tailored panjabis, western wear, footwear, and festive collections with nationwide delivery.'
    },
    {
      id: 'page-terms',
      title: 'Terms & Conditions',
      slug: 'terms-and-conditions',
      content: 'Welcome to Dhati. By using our website and placing orders, you agree to comply with our store terms and purchasing conditions.'
    },
    {
      id: 'page-privacy',
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      content: 'Your privacy is paramount. We safeguard all personal data, shipping details, and transaction information in accordance with international security best practices.'
    },
    {
      id: 'page-shipping',
      title: 'Shipping Policy',
      slug: 'shipping-policy',
      content: 'We deliver nationwide across all 64 districts in Bangladesh with reliable courier partners. Inside Dhaka: 24-48 Hours. Outside Dhaka: 2-4 Days.'
    },
    {
      id: 'page-refund',
      title: 'Refund & Return Policy',
      slug: 'refund-policy',
      content: 'We offer an easy 7-day replacement warranty for verified manufacturing defects. Please contact support with your order number.'
    }
  ],
  settings: {
    store_name: 'Dhati',
    store_tagline: 'Festive & Contemporary Fashion',
    contact_phone: '+880 1711 000000',
    contact_email: 'support@dhati.com',
    free_shipping_threshold: 5000,
    currency_symbol: '৳',
    order_prefix: 'DHT'
  },
  contactMessages: []
};

function loadData(): InitialData {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        categories: Array.isArray(parsed.categories) ? parsed.categories : defaultDataset.categories,
        products: Array.isArray(parsed.products) ? parsed.products : [],
        banners: Array.isArray(parsed.banners) && parsed.banners.length > 0 ? parsed.banners : defaultDataset.banners,
        deliveryZones: Array.isArray(parsed.deliveryZones) ? parsed.deliveryZones : defaultDataset.deliveryZones,
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        pages: Array.isArray(parsed.pages) && parsed.pages.length > 0 ? parsed.pages : defaultDataset.pages,
        settings: { ...defaultDataset.settings, ...(parsed.settings || {}) },
        contactMessages: Array.isArray(parsed.contactMessages) ? parsed.contactMessages : [],
        featured_product_ids: Array.isArray(parsed.featured_product_ids)
          ? parsed.featured_product_ids
          : (Array.isArray(parsed.settings?.featured_product_ids) ? parsed.settings.featured_product_ids : []),
        featured_category_ids: Array.isArray(parsed.featured_category_ids)
          ? parsed.featured_category_ids
          : (Array.isArray(parsed.settings?.featured_category_ids) ? parsed.settings.featured_category_ids : defaultDataset.featured_category_ids),
        coupons: Array.isArray(parsed.coupons) ? parsed.coupons : defaultDataset.coupons || [],
        deal_pages: Array.isArray(parsed.deal_pages) ? parsed.deal_pages : defaultDataset.deal_pages || [],
        seo_settings: parsed.seo_settings && typeof parsed.seo_settings === 'object' ? { ...defaultSEOSettings, ...parsed.seo_settings } : defaultSEOSettings,
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      };
    } catch (e) {
      console.error('Error reading local data file, falling back to clean dataset', e);
    }
  }
  return { ...defaultDataset, products: [] };
}

function saveData(data: InitialData) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save local store data:', e);
  }
}


let cachedStoreData: InitialData | null = null;
let lastCloudFetchTime = 0;

async function loadDataAsync(): Promise<InitialData> {
  const now = Date.now();
  if (cachedStoreData && (now - lastCloudFetchTime < 3000)) {
    return cachedStoreData;
  }

  const local = loadData();

  // Fast cloud sync with strict 2.5s timeout so it never hangs or freezes requests
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const fetchPromise = supabase
        .from('store_settings')
        .select('setting_value')
        .in('setting_key', ['dhati_store_dataset'])
        .limit(1)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Supabase fetch timeout') }), 2500)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (!error && data?.setting_value && typeof data.setting_value === 'object') {
        const cloudData = data.setting_value;
        const cloudProducts = Array.isArray(cloudData.products) ? cloudData.products : [];

        // Merge cloud products on top of local catalog
        let productsToUse = local.products;
        if (cloudProducts.length > 0) {
          if (cloudProducts.length >= local.products.length) {
            productsToUse = cloudProducts;
          } else {
            const productMap = new Map<string, Product>();
            for (const p of local.products) {
              if (p && p.id) productMap.set(p.id, p);
            }
            for (const p of cloudProducts) {
              if (p && p.id) productMap.set(p.id, p);
            }
            productsToUse = Array.from(productMap.values());
          }
        }

        cachedStoreData = {
          categories: Array.isArray(cloudData.categories) && cloudData.categories.length > 0 ? cloudData.categories : local.categories,
          products: productsToUse,
          banners: Array.isArray(cloudData.banners) && cloudData.banners.length > 0 ? cloudData.banners : local.banners,
          deliveryZones: Array.isArray(cloudData.deliveryZones) ? cloudData.deliveryZones : local.deliveryZones,
          orders: Array.isArray(cloudData.orders) ? cloudData.orders : local.orders,
          pages: Array.isArray(cloudData.pages) && cloudData.pages.length > 0 ? cloudData.pages : local.pages,
          settings: { ...defaultDataset.settings, ...(local.settings || {}), ...(cloudData.settings || {}) },
          contactMessages: Array.isArray(cloudData.contactMessages) ? cloudData.contactMessages : local.contactMessages,
          featured_product_ids: Array.isArray(cloudData.featured_product_ids)
            ? cloudData.featured_product_ids
            : local.featured_product_ids,
          featured_category_ids: Array.isArray(cloudData.featured_category_ids)
            ? cloudData.featured_category_ids
            : local.featured_category_ids,
          coupons: Array.isArray(cloudData.coupons) ? cloudData.coupons : local.coupons,
          deal_pages: Array.isArray(cloudData.deal_pages) ? cloudData.deal_pages : local.deal_pages,
          seo_settings: cloudData.seo_settings && typeof cloudData.seo_settings === 'object' ? { ...defaultSEOSettings, ...cloudData.seo_settings } : local.seo_settings,
          expenses: Array.isArray(cloudData.expenses) ? cloudData.expenses : local.expenses,
        };
        lastCloudFetchTime = now;
        return cachedStoreData;
      }
    } catch (e) {
      console.warn('Falling back to local store dataset:', e);
    }
  }

  cachedStoreData = local;
  lastCloudFetchTime = now;
  return local;
}

async function saveDataAsync(data: InitialData): Promise<void> {
  cachedStoreData = data;
  lastCloudFetchTime = Date.now();
  saveData(data);

  // Sync to Supabase - awaited so serverless functions do not freeze before upload completes
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      await supabase.from('store_settings').upsert({
        setting_key: 'dhati_store_dataset',
        setting_value: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });
    } catch (e) {
      console.warn('Supabase sync notice:', e);
    }
  }
}

export const db = {
  // PRODUCTS
  async getProducts(options: {
    categorySlug?: string;
    search?: string;
    featured?: boolean;
    bestseller?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
    limit?: number;
    offset?: number;
    includeInactive?: boolean;
  } = {}): Promise<{ products: Product[]; total: number }> {
    const store = await loadDataAsync();
    let list = [...store.products];

    // Filter inactive products unless requested (e.g., in admin dashboard)
    if (!options.includeInactive) {
      list = list.filter(p => p.is_active !== false);
    }

    if (options.categorySlug) {
      const cat = store.categories.find(c => c.slug === options.categorySlug || c.id === options.categorySlug);
      if (cat) {
        const childCatIds = store.categories.filter(c => c.parent_id === cat.id).map(c => c.id);
        const matchIds = [cat.id, ...childCatIds];
        list = list.filter(p => matchIds.includes(p.category_id || ''));
      } else {
        list = [];
      }
    }

    if (options.featured) list = list.filter(p => p.is_featured);
    if (options.bestseller) list = list.filter(p => p.is_bestseller);
    if (options.minPrice !== undefined) list = list.filter(p => p.price >= options.minPrice!);
    if (options.maxPrice !== undefined) list = list.filter(p => p.price <= options.maxPrice!);

    if (options.search) {
      const q = options.search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    if (options.sortBy === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (options.sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (options.sortBy === 'popular') list.sort((a, b) => (b.rating_count || 0) - (a.rating_count || 0));
    else list.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

    // Populate category info
    const enrichedList = list.map(prod => ({
      ...prod,
      category: store.categories.find(c => c.id === prod.category_id) || null
    }));

    const total = enrichedList.length;
    const offset = options.offset || 0;
    const limit = options.limit || enrichedList.length;
    const paginated = enrichedList.slice(offset, offset + limit);

    return { products: paginated, total };
  },

  async getProductBySlug(slugOrId: string): Promise<Product | null> {
    const store = await loadDataAsync();
    const found = store.products.find(p => p.slug === slugOrId || p.id === slugOrId);
    if (!found) return null;
    const category = store.categories.find(c => c.id === found.category_id) || null;
    return { ...found, category };
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const store = await loadDataAsync();
    const id = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const baseSlug = (productData.name || 'product')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Check slug collision
    let finalSlug = productData.slug || baseSlug;
    if (store.products.some(p => p.slug === finalSlug)) {
      finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const newProd: Product = {
      id,
      name: productData.name?.trim() || 'Untitled Product',
      slug: finalSlug,
      sku: productData.sku?.trim() || `DRG-${Date.now().toString().slice(-6)}`,
      model_number: productData.model_number?.trim() || '',
      short_description: productData.short_description?.trim() || '',
      description: productData.description?.trim() || '',
      price: Number(productData.price) || 0,
      original_price: productData.original_price ? Number(productData.original_price) : null,
      cost_price: productData.cost_price ? Number(productData.cost_price) : null,
      stock_quantity: Number(productData.stock_quantity) >= 0 ? Number(productData.stock_quantity) : 0,
      low_stock_threshold: Number(productData.low_stock_threshold) || 5,
      category_id: productData.category_id || null,
      image_url: productData.image_url || '',
      images: Array.isArray(productData.images) && productData.images.length > 0 
        ? productData.images 
        : productData.image_url 
          ? [{ id: `img-${Date.now()}`, product_id: id, image_url: productData.image_url, display_order: 1, is_primary: true }]
          : [],
      specifications: productData.specifications || {},
      variants: Array.isArray(productData.variants) ? productData.variants : [],
      options: Array.isArray(productData.options) ? productData.options : [],
      is_active: productData.is_active !== undefined ? Boolean(productData.is_active) : true,
      is_featured: Boolean(productData.is_featured),
      is_bestseller: Boolean(productData.is_bestseller),
      warranty_info: productData.warranty_info || '',
      rating_average: 5.0,
      rating_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    store.products.unshift(newProd);
    await saveDataAsync(store);
    return newProd;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const store = await loadDataAsync();
    const index = store.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const current = store.products[index];
    const updated: Product = {
      ...current,
      ...updates,
      name: updates.name !== undefined ? updates.name.trim() : current.name,
      price: updates.price !== undefined ? Number(updates.price) : current.price,
      original_price: updates.original_price !== undefined ? (updates.original_price ? Number(updates.original_price) : null) : current.original_price,
      stock_quantity: updates.stock_quantity !== undefined ? Number(updates.stock_quantity) : current.stock_quantity,
      low_stock_threshold: updates.low_stock_threshold !== undefined ? Number(updates.low_stock_threshold) : current.low_stock_threshold,
      is_active: updates.is_active !== undefined ? Boolean(updates.is_active) : current.is_active,
      is_featured: updates.is_featured !== undefined ? Boolean(updates.is_featured) : current.is_featured,
      is_bestseller: updates.is_bestseller !== undefined ? Boolean(updates.is_bestseller) : current.is_bestseller,
      specifications: updates.specifications !== undefined ? updates.specifications : current.specifications,
      variants: updates.variants !== undefined ? updates.variants : current.variants,
      options: updates.options !== undefined ? updates.options : current.options,
      images: updates.images !== undefined ? updates.images : current.images,
      image_url: updates.image_url !== undefined ? updates.image_url : current.image_url,
      updated_at: new Date().toISOString()
    };

    store.products[index] = updated;
    await saveDataAsync(store);
    return updated;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const store = await loadDataAsync();
    const initialLen = store.products.length;
    store.products = store.products.filter(p => p.id !== id);
    await saveDataAsync(store);
    return store.products.length < initialLen;
  },

  // CATEGORIES
  async getCategories(includeInactive = false): Promise<Category[]> {
    const store = await loadDataAsync();
    let list = [...store.categories];
    if (!includeInactive) {
      list = list.filter(c => c.is_active !== false);
    }
    // Return category image if uploaded, or fallback to matching vector icon
    list = list.map(c => ({
      ...c,
      image_url: c.image_url && c.image_url.trim() !== '' ? c.image_url.trim() : getCategoryIconUrl(c)
    }));
    return list.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  },

  async getCategoryTree(): Promise<Category[]> {
    const all = await this.getCategories(false);
    const topLevel = all.filter(c => !c.parent_id);
    return topLevel.map(parent => ({
      ...parent,
      children: all.filter(c => c.parent_id === parent.id)
    }));
  },

  async getCategoryBySlug(slugOrId: string): Promise<Category | null> {
    const all = await this.getCategories(true);
    return all.find(c => c.slug === slugOrId || c.id === slugOrId) || null;
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    const store = await loadDataAsync();
    const id = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const baseSlug = (cat.name || 'category')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Match appropriate category icon automatically based on name and meaning if no image is uploaded
    const matched = matchCategoryIcon(`${cat.name || ''} ${cat.slug || ''}`);
    const resolvedIconUrl = cat.image_url && cat.image_url.trim() !== ''
      ? cat.image_url.trim()
      : matched.iconUrl;

    const newCat: Category = {
      id,
      name: cat.name?.trim() || 'New Category',
      slug: cat.slug?.trim() || baseSlug,
      parent_id: cat.parent_id || null,
      description: cat.description?.trim() || '',
      image_url: resolvedIconUrl,
      banner_url: cat.banner_url || null,
      icon_name: cat.icon_name && cat.icon_name !== 'Tag' ? cat.icon_name : matched.iconName,
      display_order: cat.display_order !== undefined ? Number(cat.display_order) : store.categories.length + 1,
      is_active: cat.is_active !== undefined ? Boolean(cat.is_active) : true,
      is_featured: Boolean(cat.is_featured),
      created_at: new Date().toISOString()
    };

    store.categories.push(newCat);
    await saveDataAsync(store);
    return newCat;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const store = await loadDataAsync();
    const index = store.categories.findIndex(c => c.id === id);
    if (index === -1) return null;

    let finalImageUrl = updates.image_url !== undefined ? updates.image_url : store.categories[index].image_url;
    if (!finalImageUrl || finalImageUrl.trim() === '') {
      finalImageUrl = getCategoryIconUrl({
        name: updates.name || store.categories[index].name,
        slug: updates.slug || store.categories[index].slug
      });
    }

    const updated: Category = {
      ...store.categories[index],
      ...updates,
      name: updates.name !== undefined ? updates.name.trim() : store.categories[index].name,
      slug: updates.slug !== undefined ? updates.slug.trim() : store.categories[index].slug,
      image_url: finalImageUrl,
      display_order: updates.display_order !== undefined ? Number(updates.display_order) : store.categories[index].display_order,
      is_active: updates.is_active !== undefined ? Boolean(updates.is_active) : store.categories[index].is_active,
    };

    store.categories[index] = updated;
    await saveDataAsync(store);
    return updated;
  },

  async deleteCategory(id: string, reassignTo: string | null = null): Promise<boolean> {
    const store = await loadDataAsync();
    const catToDelete = store.categories.find(c => c.id === id);
    if (!catToDelete) return false;

    // Reassign products if requested or nullify category_id
    store.products = store.products.map(p => {
      if (p.category_id === id) {
        return { ...p, category_id: reassignTo || null };
      }
      return p;
    });

    // Reassign child categories to root or to reassignTo
    store.categories = store.categories.map(c => {
      if (c.parent_id === id) {
        return { ...c, parent_id: reassignTo || null };
      }
      return c;
    });

    store.categories = store.categories.filter(c => c.id !== id);
    await saveDataAsync(store);
    return true;
  },

  // BANNERS
  async getBanners(includeInactive: boolean = false): Promise<Banner[]> {
    const store = await loadDataAsync();
    const list = store.banners || defaultDataset.banners;
    return includeInactive ? list : list.filter(b => b.is_active !== false);
  },

  async updateBanners(banners: Banner[]): Promise<Banner[]> {
    const store = await loadDataAsync();
    store.banners = banners;
    await saveDataAsync(store);
    return store.banners;
  },

  // DELIVERY ZONES
  async getDeliveryZones(): Promise<DeliveryZone[]> {
    const store = await loadDataAsync();
    return store.deliveryZones || defaultDataset.deliveryZones;
  },

  // ORDERS
  async getOrders(options: { search?: string; status?: string } = {}): Promise<Order[]> {
    const store = await loadDataAsync();
    let list = store.orders || [];
    if (options.status) {
      list = list.filter(o => o.order_status.toLowerCase() === options.status?.toLowerCase());
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      list = list.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q)
      );
    }
    return list;
  },

  async getOrderById(id: string): Promise<Order | null> {
    const store = await loadDataAsync();
    return store.orders.find(o => o.id === id || o.order_number === id) || null;
  },

  async getOrderByIdOrNumber(idOrNumber: string): Promise<Order | null> {
    const store = await loadDataAsync();
    return store.orders.find(o => o.id === idOrNumber || o.order_number === idOrNumber) || null;
  },

  async trackOrder(orderNumber: string, phone: string): Promise<Order | null> {
    const store = await loadDataAsync();
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    return store.orders.find(o => 
      o.order_number.toLowerCase() === orderNumber.toLowerCase().trim() &&
      o.customer_phone.replace(/\D/g, '').slice(-10) === cleanPhone
    ) || null;
  },

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const store = await loadDataAsync();
    const id = `ord-${Date.now()}`;
    const count = store.orders.length + 1001;
    const orderNumber = `DRG-${new Date().getFullYear()}-${count}`;

    const newOrder: Order = {
      id,
      order_number: orderNumber,
      customer_id: orderData.customer_id || null,
      customer_name: orderData.customer_name || 'Guest Customer',
      customer_phone: orderData.customer_phone || '',
      customer_email: orderData.customer_email || null,
      shipping_address: orderData.shipping_address || '',
      shipping_city: orderData.shipping_city || 'Dhaka',
      shipping_district: orderData.shipping_district || 'Dhaka',
      order_status: 'Pending',
      payment_method: orderData.payment_method || 'Cash on Delivery',
      payment_status: 'Pending',
      subtotal: Number(orderData.subtotal) || 0,
      delivery_charge: Number(orderData.delivery_charge) || 0,
      discount_amount: Number(orderData.discount_amount) || 0,
      total_amount: Number(orderData.total_amount) || 0,
      customer_notes: orderData.customer_notes || null,
      admin_notes: null,
      items: orderData.items || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Decrement stock for ordered items
    if (Array.isArray(newOrder.items)) {
      for (const item of newOrder.items) {
        const prodIndex = store.products.findIndex(p => p.id === item.product_id);
        if (prodIndex !== -1) {
          const currentQty = store.products[prodIndex].stock_quantity;
          store.products[prodIndex].stock_quantity = Math.max(0, currentQty - (item.quantity || 1));
        }
      }
    }

    // Increment coupon usage count if coupon applied
    const couponCode = (orderData as any).coupon_code;
    if (couponCode && typeof couponCode === 'string') {
      const cpn = (store.coupons || []).find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase());
      if (cpn) {
        cpn.used_count = (cpn.used_count || 0) + 1;
      }
    }

    store.orders.unshift(newOrder);
    await saveDataAsync(store);
    return newOrder;
  },

  async updateOrderStatus(id: string, order_status: any, payment_status_or_tracking?: any): Promise<Order | null> {
    const store = await loadDataAsync();
    const index = store.orders.findIndex(o => o.id === id || o.order_number === id);
    if (index === -1) return null;

    store.orders[index].order_status = order_status;
    if (payment_status_or_tracking) {
      if (['Pending', 'Paid', 'Failed', 'Refunded'].includes(payment_status_or_tracking)) {
        store.orders[index].payment_status = payment_status_or_tracking;
      } else {
        (store.orders[index] as any).tracking_number = payment_status_or_tracking;
      }
    }
    store.orders[index].updated_at = new Date().toISOString();

    await saveDataAsync(store);
    return store.orders[index];
  },

  // PAGES
  async getPage(slug: string): Promise<PageContent | null> {
    const store = await loadDataAsync();
    const found = (store.pages || defaultDataset.pages).find(p => p.slug === slug);
    if (found) return found;
    return defaultDataset.pages.find(p => p.slug === slug) || null;
  },

  // CONTACT MESSAGES
  async getContactMessages(): Promise<ContactMessage[]> {
    const store = await loadDataAsync();
    return store.contactMessages || [];
  },

  async saveContactMessage(msg: Partial<ContactMessage>): Promise<ContactMessage> {
    const store = await loadDataAsync();
    const newMsg: ContactMessage = {
      id: `msg-${Date.now()}`,
      name: msg.name || 'Anonymous',
      email: msg.email || '',
      phone: msg.phone || '',
      subject: msg.subject || 'Inquiry',
      message: msg.message || '',
      is_read: false,
      created_at: new Date().toISOString()
    };
    store.contactMessages.unshift(newMsg);
    await saveDataAsync(store);
    return newMsg;
  },

  // SETTINGS
  async getSettings(): Promise<Record<string, any>> {
    const store = await loadDataAsync();
    return store.settings || defaultDataset.settings;
  },

  async updateSettings(keyOrObj: any, value?: any): Promise<Record<string, any>> {
    const store = await loadDataAsync();
    if (typeof keyOrObj === 'string') {
      store.settings[keyOrObj] = value;
    } else if (typeof keyOrObj === 'object') {
      store.settings = { ...store.settings, ...keyOrObj };
    }
    await saveDataAsync(store);
    return store.settings;
  },

  // FEATURED PRODUCTS (3x3 Grid on Homepage - Up to 9 products)
  async getFeaturedProductIds(): Promise<string[]> {
    const store = await loadDataAsync();
    return Array.isArray(store.featured_product_ids) ? store.featured_product_ids.slice(0, 9) : [];
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const store = await loadDataAsync();
    const activeProducts = store.products.filter(p => p.is_active !== false);
    const featuredIds = (store.featured_product_ids || []).slice(0, 9);

    const orderedFeatured: Product[] = [];
    const seenIds = new Set<string>();

    // 1. Add explicitly configured featured products in their specified order
    for (const id of featuredIds) {
      const found = activeProducts.find(p => p.id === id);
      if (found && !seenIds.has(found.id)) {
        orderedFeatured.push(found);
        seenIds.add(found.id);
      }
    }

    // 2. Also check any products marked with is_featured === true that weren't in the list
    if (orderedFeatured.length < 9) {
      for (const p of activeProducts) {
        if (p.is_featured && !seenIds.has(p.id)) {
          orderedFeatured.push(p);
          seenIds.add(p.id);
          if (orderedFeatured.length >= 9) break;
        }
      }
    }

    // 3. If still fewer than 9 (e.g. no products selected yet), fill up to 9 with latest active products so 3x3 grid is complete
    if (orderedFeatured.length < 9) {
      for (const p of activeProducts) {
        if (!seenIds.has(p.id)) {
          orderedFeatured.push(p);
          seenIds.add(p.id);
          if (orderedFeatured.length >= 9) break;
        }
      }
    }

    return orderedFeatured.slice(0, 9);
  },

  async setFeaturedProducts(productIds: string[]): Promise<Product[]> {
    const store = await loadDataAsync();
    // Limit to at most 9 products
    const cleanIds = Array.from(new Set(productIds.filter(Boolean))).slice(0, 9);
    store.featured_product_ids = cleanIds;
    if (!store.settings) store.settings = {};
    store.settings.featured_product_ids = cleanIds;

    // Sync is_featured flag across all products
    const idSet = new Set(cleanIds);
    store.products = store.products.map(p => ({
      ...p,
      is_featured: idSet.has(p.id)
    }));

    await saveDataAsync(store);
    return this.getFeaturedProducts();
  },

  // FEATURED CATEGORIES (Header Navigation Bar Categories)
  // Crucial: Completely independent of homepage category animation (which uses getCategories(false))
  async getHeaderFeaturedCategoryIds(): Promise<string[]> {
    const store = await loadDataAsync();
    return Array.isArray(store.featured_category_ids) && store.featured_category_ids.length > 0
      ? store.featured_category_ids
      : defaultDataset.featured_category_ids || [];
  },

  async getHeaderFeaturedCategories(): Promise<Category[]> {
    const store = await loadDataAsync();
    const allActive = store.categories
      .filter(c => c.is_active !== false)
      .map(c => ({
        ...c,
        image_url: getCategoryIconUrl(c)
      } as Category));

    const headerIds = store.featured_category_ids || [];
    if (headerIds.length === 0) {
      // Default top 6 if not customized
      const defaultSlugs = ['tech', 'food', 'clothing', 'kids', 'home', 'other'];
      const defaults = defaultSlugs
        .map(s => allActive.find(c => c.slug === s || c.id === s))
        .filter((c): c is Category => Boolean(c));
      if (defaults.length > 0) return defaults;
      return allActive.slice(0, 6);
    }

    // Match configured order
    const result: Category[] = [];
    const seen = new Set<string>();
    for (const idOrSlug of headerIds) {
      const found = allActive.find(c => c.id === idOrSlug || c.slug === idOrSlug);
      if (found && !seen.has(found.id)) {
        result.push(found);
        seen.add(found.id);
      }
    }

    return result.length > 0 ? result : allActive.slice(0, 6);
  },

  async setHeaderFeaturedCategories(categoryIds: string[]): Promise<Category[]> {
    const store = await loadDataAsync();
    const cleanIds = Array.from(new Set(categoryIds.filter(Boolean)));
    store.featured_category_ids = cleanIds;
    if (!store.settings) store.settings = {};
    store.settings.featured_category_ids = cleanIds;

    await saveDataAsync(store);
    return this.getHeaderFeaturedCategories();
  },

  // --- 1. DISCOUNT & COUPONS ---
  async getCoupons(): Promise<Coupon[]> {
    const store = await loadDataAsync();
    return store.coupons || [];
  },

  async getCouponByCode(code: string): Promise<Coupon | null> {
    const store = await loadDataAsync();
    const clean = code.trim().toUpperCase();
    return (store.coupons || []).find(c => c.code.toUpperCase() === clean) || null;
  },

  async createCoupon(data: Partial<Coupon>): Promise<Coupon> {
    const store = await loadDataAsync();
    const id = `cpn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newCoupon: Coupon = {
      id,
      code: (data.code || `PROMO${Math.floor(Math.random() * 900 + 100)}`).trim().toUpperCase(),
      description: data.description || '',
      discount_type: data.discount_type === 'percentage' ? 'percentage' : 'fixed',
      discount_value: Number(data.discount_value) || 0,
      min_order_amount: data.min_order_amount ? Number(data.min_order_amount) : 0,
      max_discount_amount: data.max_discount_amount ? Number(data.max_discount_amount) : null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      max_uses: data.max_uses ? Number(data.max_uses) : null,
      used_count: 0,
      is_active: data.is_active !== false,
      applicable_category_ids: Array.isArray(data.applicable_category_ids) ? data.applicable_category_ids : [],
      applicable_product_ids: Array.isArray(data.applicable_product_ids) ? data.applicable_product_ids : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (!store.coupons) store.coupons = [];
    store.coupons.unshift(newCoupon);
    await saveDataAsync(store);
    return newCoupon;
  },

  async updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon | null> {
    const store = await loadDataAsync();
    if (!store.coupons) store.coupons = [];
    const index = store.coupons.findIndex(c => c.id === id);
    if (index === -1) return null;
    const existing = store.coupons[index];
    const updated: Coupon = {
      ...existing,
      ...data,
      code: data.code ? data.code.trim().toUpperCase() : existing.code,
      updated_at: new Date().toISOString()
    };
    store.coupons[index] = updated;
    await saveDataAsync(store);
    return updated;
  },

  async deleteCoupon(id: string): Promise<boolean> {
    const store = await loadDataAsync();
    if (!store.coupons) return false;
    const initialLen = store.coupons.length;
    store.coupons = store.coupons.filter(c => c.id !== id);
    await saveDataAsync(store);
    return store.coupons.length < initialLen;
  },

  async incrementCouponUsage(idOrCode: string): Promise<void> {
    const store = await loadDataAsync();
    if (!store.coupons) return;
    const coupon = store.coupons.find(c => c.id === idOrCode || c.code.toUpperCase() === idOrCode.toUpperCase());
    if (coupon) {
      coupon.used_count = (coupon.used_count || 0) + 1;
      coupon.updated_at = new Date().toISOString();
      await saveDataAsync(store);
    }
  },

  // --- 2. DEAL PAGE MAKER ---
  async getDealPages(includeInactive = true): Promise<DealPage[]> {
    const store = await loadDataAsync();
    const list = store.deal_pages || [];
    if (!includeInactive) {
      const now = new Date();
      return list.filter(d => {
        if (!d.is_active) return false;
        if (d.start_date && new Date(d.start_date) > now) return false;
        if (d.end_date && new Date(d.end_date) < now) return false;
        return true;
      });
    }
    return list;
  },

  async getDealPageBySlug(slugOrId: string): Promise<DealPage | null> {
    const store = await loadDataAsync();
    return (store.deal_pages || []).find(d => d.slug === slugOrId || d.id === slugOrId) || null;
  },

  async createDealPage(data: Partial<DealPage>): Promise<DealPage> {
    const store = await loadDataAsync();
    const id = `deal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const baseSlug = (data.title || 'deal')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-');
    let slug = data.slug?.trim() || baseSlug;
    if ((store.deal_pages || []).some(d => d.slug === slug)) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
    }

    const newDeal: DealPage = {
      id,
      title: data.title || 'Special Deal',
      slug,
      subtitle: data.subtitle || '',
      description: data.description || '',
      banner_url: data.banner_url || '/banner/banner.png',
      bg_color: data.bg_color || '#000000',
      text_color: data.text_color || '#FFFFFF',
      badge_text: data.badge_text || 'EXCLUSIVE DEAL',
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      is_active: data.is_active !== false,
      products: Array.isArray(data.products) ? data.products : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!store.deal_pages) store.deal_pages = [];
    store.deal_pages.unshift(newDeal);
    await saveDataAsync(store);
    return newDeal;
  },

  async updateDealPage(id: string, data: Partial<DealPage>): Promise<DealPage | null> {
    const store = await loadDataAsync();
    if (!store.deal_pages) store.deal_pages = [];
    const index = store.deal_pages.findIndex(d => d.id === id);
    if (index === -1) return null;
    const existing = store.deal_pages[index];
    const updated: DealPage = {
      ...existing,
      ...data,
      products: Array.isArray(data.products) ? data.products : existing.products,
      updated_at: new Date().toISOString()
    };
    store.deal_pages[index] = updated;
    await saveDataAsync(store);
    return updated;
  },

  async deleteDealPage(id: string): Promise<boolean> {
    const store = await loadDataAsync();
    if (!store.deal_pages) return false;
    const initialLen = store.deal_pages.length;
    store.deal_pages = store.deal_pages.filter(d => d.id !== id);
    await saveDataAsync(store);
    return store.deal_pages.length < initialLen;
  },

  // --- 3. SEO MANAGEMENT ---
  async getSEOSettings(): Promise<GlobalSEOSettings> {
    const store = await loadDataAsync();
    return store.seo_settings || defaultSEOSettings;
  },

  async updateSEOSettings(settings: Partial<GlobalSEOSettings>): Promise<GlobalSEOSettings> {
    const store = await loadDataAsync();
    const current = store.seo_settings || defaultSEOSettings;
    store.seo_settings = {
      ...current,
      ...settings,
      entity_overrides: {
        ...(current.entity_overrides || {}),
        ...(settings.entity_overrides || {})
      }
    };
    await saveDataAsync(store);
    return store.seo_settings;
  },

  async getEntitySEO(entityKey: string): Promise<SEOMetadata | null> {
    const store = await loadDataAsync();
    const seo = store.seo_settings?.entity_overrides;
    return seo?.[entityKey] || null;
  },

  async setEntitySEO(entityKey: string, metadata: SEOMetadata): Promise<void> {
    const store = await loadDataAsync();
    if (!store.seo_settings) store.seo_settings = { ...defaultSEOSettings };
    if (!store.seo_settings.entity_overrides) store.seo_settings.entity_overrides = {};
    store.seo_settings.entity_overrides[entityKey] = metadata;
    await saveDataAsync(store);
  },

  // --- 4. EXPENSES & ADVANCED ANALYTICS ---
  async getExpenses(): Promise<ExpenseRecord[]> {
    const store = await loadDataAsync();
    return store.expenses || [];
  },

  async createExpense(data: Partial<ExpenseRecord>): Promise<ExpenseRecord> {
    const store = await loadDataAsync();
    const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newExp: ExpenseRecord = {
      id,
      title: data.title || 'General Expense',
      amount: Number(data.amount) || 0,
      category: (data.category as any) || 'other',
      date: data.date || new Date().toISOString().split('T')[0],
      notes: data.notes || '',
      created_at: new Date().toISOString()
    };
    if (!store.expenses) store.expenses = [];
    store.expenses.unshift(newExp);
    await saveDataAsync(store);
    return newExp;
  },

  async deleteExpense(id: string): Promise<boolean> {
    const store = await loadDataAsync();
    if (!store.expenses) return false;
    const initialLen = store.expenses.length;
    store.expenses = store.expenses.filter(e => e.id !== id);
    await saveDataAsync(store);
    return store.expenses.length < initialLen;
  }
};
