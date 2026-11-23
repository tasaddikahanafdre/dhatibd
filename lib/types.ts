export interface Category {
  id: string;
  parent_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  banner_url?: string | null;
  icon_name?: string | null;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  created_at?: string;
  children?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
  is_featured: boolean;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string | null;
  display_order: number;
  is_primary: boolean;
}

export interface ProductOption {
  name: string; // e.g. "Color", "Size", "Storage", "Edition"
  values: string[]; // e.g. ["Matte Black", "Silver", "Midnight Blue"]
}

export interface ProductVariant {
  id: string;
  product_id?: string;
  variant_name: string;
  variant_value: string;
  sku?: string | null;
  price_adjustment?: number;
  stock_quantity?: number;
  image_url?: string | null;
}

export interface Product {
  id: string;
  category_id?: string | null;
  brand_id?: string | null;
  name: string;
  slug: string;
  sku?: string | null;
  model_number?: string | null;
  short_description?: string | null;
  description?: string | null;
  price: number;
  original_price?: number | null;
  cost_price?: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  specifications?: Record<string, string> | null;
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  warranty_info?: string | null;
  rating_average?: number;
  rating_count?: number;
  created_at?: string;
  updated_at?: string;
  category?: Category | null;
  brand?: Brand | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  options?: ProductOption[];
  image_url?: string; // convenient primary image accessor
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  product_sku?: string | null;
  variant_details?: string | null;
  image_url?: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';
export type PaymentMethod = 'Cash on Delivery' | 'bKash' | 'Nagad' | 'Online Payment';

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_address?: string;
  shipping_address?: string;
  district?: string;
  shipping_city?: string;
  shipping_district?: string;
  area?: string;
  subtotal: number;
  delivery_charge: number;
  discount?: number;
  discount_amount?: number;
  total?: number;
  total_amount?: number;
  payment_method: PaymentMethod | string;
  payment_status: PaymentStatus | string;
  order_status: OrderStatus | string;
  tracking_number?: string | null;
  delivery_zone_id?: string | null;
  notes?: string | null;
  customer_notes?: string | null;
  admin_notes?: string | null;
  dropbazar_order_id?: string | number | null;
  dropbazar_order_number?: string | null;
  dropbazar_status?: string | null;
  dropbazar_forwarded_at?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface DeliveryZone {
  id: string;
  name: string;
  delivery_charge?: number;
  charge?: number;
  estimated_delivery?: string | null;
  estimated_days?: string | null;
  is_active: boolean;
  display_order?: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  button_text?: string | null;
  target_url?: string | null;
  image_url: string;
  bg_color?: string | null;
  text_color?: string | null;
  position?: string;
  display_order: number;
  is_active: boolean;
}

export interface StoreSetting {
  id?: string;
  setting_key: string;
  setting_value: any;
  description?: string | null;
}

export interface PageContent {
  id?: string;
  slug: string;
  title: string;
  content: string;
  meta_description?: string | null;
  is_published?: boolean;
  updated_at?: string;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status?: 'Unread' | 'Read' | 'Replied';
  is_read?: boolean;
  created_at?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  variant?: ProductVariant | null;
  selected_options?: Record<string, string>;
  deal_info?: {
    deal_id: string;
    deal_slug: string;
    deal_title: string;
    deal_price: number;
    original_price: number;
    discount_text: string;
  };
}

// 1. DISCOUNT & COUPONS
export interface Coupon {
  id: string;
  code: string; // e.g. "EID2026", "SAVE10"
  description?: string;
  discount_type: 'percentage' | 'fixed'; // percentage (%) or fixed BDT (৳)
  discount_value: number; // e.g. 15 or 250
  min_order_amount?: number; // minimum subtotal required
  max_discount_amount?: number | null; // maximum discount cap for percentage
  start_date?: string | null;
  end_date?: string | null;
  max_uses?: number | null; // total usage cap
  used_count: number;
  is_active: boolean;
  applicable_category_ids?: string[]; // category restrictions
  applicable_product_ids?: string[]; // product restrictions
  created_at: string;
  updated_at?: string;
}

// 2. DEAL PAGE MAKER
export interface DealProduct {
  product_id: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number; // e.g. 20 (percent) or 300 (BDT)
  deal_price: number; // calculated promotional price
  display_order?: number;
}

export interface DealPage {
  id: string;
  title: string;
  slug: string; // e.g. "flash-sale", "weekend-deals"
  subtitle?: string | null;
  description?: string | null;
  banner_url?: string | null;
  bg_color?: string | null;
  text_color?: string | null;
  badge_text?: string | null; // e.g. "LIMITED TIME DEAL"
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  products: DealProduct[];
  created_at: string;
  updated_at?: string;
}

// 3. SEO MANAGEMENT
export interface SEOMetadata {
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  image_alt?: string;
  no_index?: boolean;
}

export interface GlobalSEOSettings {
  site_title_default: string;
  site_title_template: string; // e.g. "%s | Dhati"
  meta_description: string;
  keywords: string;
  canonical_base_url: string;
  og_image: string;
  robots_indexing: boolean;
  google_site_verification?: string;
  custom_header_tags?: string;
  entity_overrides?: Record<string, SEOMetadata>; // key: 'prod:xyz', 'cat:xyz', 'page:slug'
}

// 4. ANALYTICS & EXPENSES
export interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  category: 'packaging' | 'courier_extra' | 'marketing' | 'software' | 'inventory' | 'other';
  date: string;
  notes?: string;
  created_at?: string;
}
