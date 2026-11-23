-- =============================================================================
-- ALL-IN-ONE SUPABASE DATABASE INITIALIZATION SCRIPT
-- Project URL: https://bojrnmuhqiidgbqjaacq.supabase.co
-- Run this entire script in Supabase Dashboard -> SQL Editor
-- =============================================================================

-- STEP 1: CONFIGURE SUPABASE STORAGE ('image' BUCKET)
-- =============================================================================

-- 1. Create or update 'image' storage bucket to be public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'image', 
    'image', 
    true, 
    52428800, -- 50 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif']
)
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];

-- 2. Storage Policies for 'image' bucket (Public Read, Unrestricted Upload/Update)
DROP POLICY IF EXISTS "Public Access image bucket" ON storage.objects;
CREATE POLICY "Public Access image bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'image');

DROP POLICY IF EXISTS "Allow uploads to image bucket" ON storage.objects;
CREATE POLICY "Allow uploads to image bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'image');

DROP POLICY IF EXISTS "Allow updates to image bucket" ON storage.objects;
CREATE POLICY "Allow updates to image bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'image');

DROP POLICY IF EXISTS "Allow deletes in image bucket" ON storage.objects;
CREATE POLICY "Allow deletes in image bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'image');


-- =============================================================================


-- =============================================================================
-- DREGITAL COMMERCE: ALL-IN-ONE SUPABASE FULL SETUP SCRIPT
-- Paste this entire script into your Supabase Dashboard SQL Editor
-- =============================================================================

-- =============================================================================
-- DREGITAL COMMERCE: SUPABASE POSTGRESQL INITIAL SCHEMA
-- Production Schema for Dregital E-Commerce Platform (Bangladesh)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Profiles (Customers & Staff)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'admin', 'customer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Customer Delivery Addresses
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    district TEXT NOT NULL,
    area TEXT NOT NULL,
    address_line TEXT NOT NULL,
    postal_code TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Categories & Subcategories (Unlimited Hierarchical Nesting)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    banner_url TEXT,
    icon_name TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- 4. Brands
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sku TEXT UNIQUE,
    model_number TEXT,
    short_description TEXT,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(12, 2) CHECK (original_price IS NULL OR original_price >= price),
    cost_price NUMERIC(12, 2),
    stock_quantity INTEGER NOT NULL DEFAULT 10 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    specifications JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    warranty_info TEXT DEFAULT 'Standard Brand Warranty',
    rating_average NUMERIC(3, 2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);

-- 6. Product Images (Multiple Images with Ordering & Primary flag)
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_product_images_prod ON public.product_images(product_id);

-- 7. Product Multi-Category Mapping (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.product_categories (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- 8. Product Variants (Color, Storage, Size, etc.)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    variant_value TEXT NOT NULL,
    sku TEXT,
    price_adjustment NUMERIC(10, 2) DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Delivery Zones & Configuration (Bangladesh)
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g. "Inside Dhaka", "Outside Dhaka", "Express Dhaka"
    delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 60.00,
    estimated_delivery TEXT DEFAULT '24-48 Hours',
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    delivery_address TEXT NOT NULL,
    district TEXT NOT NULL,
    area TEXT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery' CHECK (payment_method IN ('Cash on Delivery', 'bKash', 'Nagad', 'Online Payment')),
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
    order_status TEXT NOT NULL DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
    tracking_number TEXT,
    delivery_zone_id UUID REFERENCES public.delivery_zones(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);

-- 11. Order Items (Preserving Snapshots of Product Name and Price)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(12, 2) NOT NULL,
    product_sku TEXT,
    variant_details TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 12. Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    transaction_id TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed', 'Cancelled')),
    gateway_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. Shopping Carts (Database-Backed for Authenticated Users)
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_cart_item UNIQUE (cart_id, product_id)
);

-- 14. Wishlists
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_wishlist_item UNIQUE (user_id, product_id)
);

-- 15. Reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 16. Banners (Hero & Promotional)
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    button_text TEXT DEFAULT 'SHOP NOW',
    target_url TEXT DEFAULT '/shop',
    image_url TEXT NOT NULL,
    bg_color TEXT DEFAULT '#0A0A0A',
    text_color TEXT DEFAULT '#FFFFFF',
    position TEXT DEFAULT 'hero_slider',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 17. Store Settings & CMS (Key-Value Configuration)
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 18. Policy & CMS Pages
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    is_published BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 19. Contact Messages (Inquiries)
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Unread' CHECK (status IN ('Unread', 'Read', 'Replied')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 20. Updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =============================================================================
-- DREGITAL COMMERCE: ROW LEVEL SECURITY POLICIES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Helper function: Is Admin?
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public Read Policies for Storefront
CREATE POLICY "Public categories are viewable by everyone" 
ON public.categories FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Public products are viewable by everyone" 
ON public.products FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Product images are viewable by everyone" 
ON public.product_images FOR SELECT USING (true);

CREATE POLICY "Product variants are viewable by everyone" 
ON public.product_variants FOR SELECT USING (true);

CREATE POLICY "Brands are viewable by everyone" 
ON public.brands FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Banners are viewable by everyone" 
ON public.banners FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Delivery zones are viewable by everyone" 
ON public.delivery_zones FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Store settings are viewable by everyone" 
ON public.store_settings FOR SELECT USING (true);

CREATE POLICY "Pages are viewable by everyone" 
ON public.pages FOR SELECT USING (is_published = true OR is_admin(auth.uid()));

CREATE POLICY "Approved reviews are viewable by everyone" 
ON public.product_reviews FOR SELECT USING (is_approved = true OR is_admin(auth.uid()));

-- Profile Policies
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id OR is_admin(auth.uid()));

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Address Policies
CREATE POLICY "Users can manage own addresses" 
ON public.addresses FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Cart & Wishlist Policies
CREATE POLICY "Users can manage own cart" 
ON public.carts FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can manage own cart items" 
ON public.cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()) 
    OR is_admin(auth.uid())
);

CREATE POLICY "Users can manage own wishlist" 
ON public.wishlists FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Orders Policies
CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT USING (auth.uid() = customer_id OR is_admin(auth.uid()));

CREATE POLICY "Anyone can create an order" 
ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Order items viewable by owner or admin" 
ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.customer_id = auth.uid() OR is_admin(auth.uid())))
);

CREATE POLICY "Anyone can insert order items on order placement" 
ON public.order_items FOR INSERT WITH CHECK (true);

-- Contact messages
CREATE POLICY "Anyone can submit a contact message" 
ON public.contact_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view and manage contact messages" 
ON public.contact_messages FOR ALL USING (is_admin(auth.uid()));

-- Admin Full Access Policies for Store Administration
CREATE POLICY "Admins have full access to categories" 
ON public.categories FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to products" 
ON public.products FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to product_images" 
ON public.product_images FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to product_variants" 
ON public.product_variants FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to orders" 
ON public.orders FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to order_items" 
ON public.order_items FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to banners" 
ON public.banners FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to store_settings" 
ON public.store_settings FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to pages" 
ON public.pages FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to delivery_zones" 
ON public.delivery_zones FOR ALL USING (is_admin(auth.uid()));


-- =============================================================================
-- DREGITAL COMMERCE: COMPREHENSIVE SEED DATA
-- Authentic Products, Hierarchical Categories, Store Settings, Banners & Policies
-- =============================================================================

-- 1. Store Settings
INSERT INTO public.store_settings (setting_key, setting_value, description)
VALUES
('general', '{
    "store_name": "Dhati",
    "tagline": "Exclusive Fashion, Traditional Weaves & Contemporary Apparel in Bangladesh",
    "contact_email": "support@dregital.com",
    "contact_phone": "+880 1711 000000",
    "hotline": "09612-000000",
    "address": "House #14, Road #6, Dhanmondi, Dhaka-1205, Bangladesh",
    "currency_code": "BDT",
    "currency_symbol": "৳",
    "announcement_bar": "⚡ FREE DELIVERY in Dhaka on orders above ৳3,000! Official brand warranty on all genuine tech items."
}'::jsonb, 'General store identity and contact information'),
('shipping', '{
    "inside_dhaka_charge": 60,
    "outside_dhaka_charge": 120,
    "free_shipping_threshold": 3000,
    "estimated_delivery_dhaka": "24-48 Hours",
    "estimated_delivery_outside": "3-5 Business Days",
    "cod_enabled": true
}'::jsonb, 'Delivery fees, threshold, and operational settings'),
('payment_gateways', '{
    "cod": { "enabled": true, "title": "Cash on Delivery (COD)" },
    "bkash": { "enabled": true, "merchant_number": "+8801700000000", "mode": "manual_or_gateway" },
    "nagad": { "enabled": true, "merchant_number": "+8801800000000", "mode": "manual_or_gateway" }
}'::jsonb, 'Available Bangladesh payment method configurations'),
('social_links', '{
    "facebook": "https://facebook.com/dregitalbd",
    "instagram": "https://instagram.com/dregitalbd",
    "youtube": "https://youtube.com/@dregitalbd",
    "whatsapp": "+8801711000000"
}'::jsonb, 'Official social media handles and WhatsApp business contact')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- 2. Delivery Zones
INSERT INTO public.delivery_zones (id, name, delivery_charge, estimated_delivery, is_active, display_order)
VALUES
('d1000000-0000-0000-0000-000000000001', 'Inside Dhaka', 60.00, '24-48 Hours', true, 1),
('d1000000-0000-0000-0000-000000000002', 'Outside Dhaka (All Bangladesh)', 120.00, '2-4 Days', true, 2),
('d1000000-0000-0000-0000-000000000003', 'Express Same-Day Dhaka', 150.00, 'Same Day (Order before 12 PM)', true, 3)
ON CONFLICT (id) DO NOTHING;

-- 3. Top-Level Categories
INSERT INTO public.categories (id, parent_id, name, slug, icon_name, display_order, is_active, is_featured, description)
VALUES
('c1000000-0000-0000-0000-000000000001', NULL, 'Audio & Earbuds', 'audio-earbuds', 'Headphones', 1, true, true, 'Wireless earbuds, studio noise-cancelling headphones, and sound equipment.'),
('c1000000-0000-0000-0000-000000000002', NULL, 'Smart Gadgets & Wearables', 'smart-gadgets', 'Watch', 2, true, true, 'Smartwatches, fitness bands, Bluetooth tracking tags, and smart accessories.'),
('c1000000-0000-0000-0000-000000000003', NULL, 'Computer & Laptop Accessories', 'computer-accessories', 'Laptop', 3, true, true, 'Mechanical keyboards, wireless precision mice, USB hubs, and docks.'),
('c1000000-0000-0000-0000-000000000004', NULL, 'Smartphones & GaN Chargers', 'smartphones-accessories', 'Zap', 4, true, true, 'GaN high-speed chargers, magnetic wireless power banks, and smartphone gear.'),
('c1000000-0000-0000-0000-000000000005', NULL, 'Smart Home & Security', 'smart-home-security', 'Camera', 5, true, true, 'Wi-Fi security cameras, motion sensor lights, and smart household devices.'),
('c1000000-0000-0000-0000-000000000006', NULL, 'Car Accessories', 'car-accessories', 'Car', 6, true, true, 'Car vacuums, high-power dual car chargers, and automotive key hangers.'),
('c1000000-0000-0000-0000-000000000007', NULL, 'Personal Care & Grooming', 'personal-care', 'Smile', 7, true, true, 'Multi-function hair trimmers, grooming kits, and health gadgets.'),
('c1000000-0000-0000-0000-000000000008', NULL, 'Daily Tech Essentials', 'daily-tech-essentials', 'BatteryCharging', 8, true, true, 'USB-C rechargeable lithium batteries, cables, and daily power adapters.'),
('c1000000-0000-0000-0000-000000000009', NULL, 'Laptops & MacBooks', 'laptops-macbooks', 'Cpu', 9, true, true, 'Flagship ultrabooks, Apple MacBooks, and high-performance gaming laptops.'),
('c1000000-0000-0000-0000-000000000010', NULL, 'Deals & Offers', 'deals-offers', 'Tag', 10, true, true, 'Exclusive promotional tech bundles and limited-time savings.')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Subcategories (Parent-Child Hierarchy)
INSERT INTO public.categories (id, parent_id, name, slug, display_order, is_active, is_featured, description)
VALUES
('c2000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'TWS Wireless Earbuds', 'tws-earbuds', 1, true, true, 'True wireless Bluetooth earbuds with ENC and low latency.'),
('c2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Studio Over-Ear Headphones', 'studio-headphones', 2, true, true, 'Premium active noise-cancelling over-ear headphones.'),
('c2000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'Smart Watches', 'smart-watches', 1, true, true, 'AMOLED Bluetooth calling smartwatches with heart rate tracking.'),
('c2000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', 'Smart Trackers & Tags', 'smart-trackers', 2, true, true, 'Apple Find My compatible smart locator tags.'),
('c2000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000003', 'Mechanical Keyboards', 'mechanical-keyboards', 1, true, true, 'Hot-swappable tactile and linear mechanical keyboards.'),
('c2000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000003', 'Ergonomic Mice', 'ergonomic-mice', 2, true, true, 'High-DPI wireless precision productivity mice.'),
('c2000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000004', 'Fast GaN Chargers', 'fast-chargers', 1, true, true, 'GaN high-wattage multi-port wall adapters.'),
('c2000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000004', 'Power Banks', 'power-banks', 2, true, true, 'Magnetic wireless and high-capacity portable power banks.')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 4. Brands
INSERT INTO public.brands (id, name, slug, is_featured, is_active, description)
VALUES
('b1000000-0000-0000-0000-000000000001', 'CYXG', 'cyxg', true, true, 'High-fidelity audio and innovative wireless audio solutions.'),
('b1000000-0000-0000-0000-000000000002', 'Kemei', 'kemei', true, true, 'Professional personal grooming and precision hair styling clippers.'),
('b1000000-0000-0000-0000-000000000003', 'V380 Pro', 'v380-pro', true, true, 'Intelligent Wi-Fi home surveillance cameras and smart monitoring.'),
('b1000000-0000-0000-0000-000000000004', 'MiLi', 'mili', true, true, 'Apple Find My licensed tracking tags and smart travel essentials.'),
('b1000000-0000-0000-0000-000000000005', 'Anker', 'anker', true, true, 'World-renowned GaN fast chargers, cables, and power banks.'),
('b1000000-0000-0000-0000-000000000006', 'Sony', 'sony', true, true, 'Industry standard noise-cancelling acoustics and personal audio.'),
('b1000000-0000-0000-0000-000000000007', 'Logitech', 'logitech', true, true, 'Ergonomic workspace peripherals and precision computer mice.'),
('b1000000-0000-0000-0000-000000000008', 'Apple', 'apple', true, true, 'MacBook Pro, Silicon processors, and premium computing ecosystems.'),
('b1000000-0000-0000-0000-000000000009', 'ASUS', 'asus', true, true, 'ROG Zephyrus gaming laptops, high refresh rate displays, and hardware.')
ON CONFLICT (slug) DO NOTHING;

-- 5. Products & Product Images
-- Product 1: CYXG Q102 Wireless Earbuds
INSERT INTO public.products (
    id, category_id, brand_id, name, slug, sku, model_number,
    short_description, description, price, original_price, cost_price,
    stock_quantity, low_stock_threshold, is_active, is_featured, is_bestseller,
    specifications, warranty_info
) VALUES (
    'p1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'CYXG Q102 Wireless Earbuds',
    'cyxg-q102-wireless-earbuds',
    'DRG-CYXG-Q102',
    'Q102',
    'High-fidelity graphene dynamic drivers, environmental noise cancellation (ENC) and 32-hour battery life.',
    'Engineered for immersive audio fidelity with dynamic graphene acoustic drivers, environmental noise cancellation (ENC), ultra-low 45ms gaming latency, and up to 32 hours of uninterrupted battery reserve with USB-C quick recharge. Features touch controls, auto-pairing, and IPX5 splash resistance.',
    1850.00,
    2450.00,
    1400.00,
    45,
    5,
    true,
    true,
    true,
    '{"Bluetooth Version": "5.3", "Battery Life": "Up to 32 Hours with Case", "Driver": "13mm Graphene", "Charging Port": "USB Type-C", "Water Resistance": "IPX5", "Latency": "45ms Low Latency Mode"}'::jsonb,
    '6 Months Replacement Warranty'
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, original_price = EXCLUDED.original_price;

INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', 'CYXG Q102 Wireless Earbuds Front', true, 1),
('p1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&auto=format&fit=crop&q=80', 'CYXG Q102 Earbuds in Charging Case', false, 2)
ON CONFLICT DO NOTHING;

-- Product 2: Kemei KM-6330 Grooming Kit
INSERT INTO public.products (
    id, category_id, brand_id, name, slug, sku, model_number,
    short_description, description, price, original_price, cost_price,
    stock_quantity, low_stock_threshold, is_active, is_featured, is_bestseller,
    specifications, warranty_info
) VALUES (
    'p1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000007',
    'b1000000-0000-0000-0000-000000000002',
    'Kemei KM-6330 Grooming Kit',
    'kemei-km-6330-grooming-kit',
    'DRG-KEM-6330',
    'KM-6330',
    'Multi-functional professional 3-in-1 rechargeable grooming kit for beard trimming and precision hair cutting.',
    'Multi-functional professional 3-in-1 rechargeable grooming kit featuring high precision titanium alloy carbon steel blades, ergonomic grip, USB fast charging, and up to 60 minutes of cordless runtime. Includes nose trimmer, precision beard head, and comb attachments.',
    1250.00,
    1650.00,
    900.00,
    30,
    4,
    true,
    true,
    false,
    '{"Blade Material": "Carbon Steel & Titanium", "Battery Runtime": "60 Minutes", "Charging Time": "2 Hours Fast Charge", "Attachment Heads": "3 Interchangeable Heads", "Power": "5W Motor"}'::jsonb,
    '1 Year Brand Warranty'
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price;

INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&auto=format&fit=crop&q=80', 'Kemei KM-6330 Precision Trimmer', true, 1)
ON CONFLICT DO NOTHING;

-- Product 3: AS-228 Mini Vacuum Cleaner
INSERT INTO public.products (
    id, category_id, brand_id, name, slug, sku, model_number,
    short_description, description, price, original_price, cost_price,
    stock_quantity, low_stock_threshold, is_active, is_featured, is_bestseller,
    specifications, warranty_info
) VALUES (
    'p1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000006',
    NULL,
    'AS-228 Mini Vacuum Cleaner',
    'as-228-mini-vacuum-cleaner',
    'DRG-VAC-AS228',
    'AS-228',
    'Compact heavy-duty cordless handheld car vacuum cleaner with 8000Pa suction power and washable HEPA filter.',
    'Compact, heavy-duty handheld wireless vacuum cleaner designed for automotive interiors and home workspaces. Delivers 8000Pa strong cyclone suction, washable reusable HEPA filtration, built-in LED workspace lighting, and USB-C fast charging.',
    1550.00,
    1950.00,
    1100.00,
    25,
    3,
    true,
    false,
    true,
    '{"Suction Power": "8000Pa Cyclone", "Battery Capacity": "4000mAh", "Filter Type": "Washable HEPA", "Charging Port": "Type-C", "Weight": "365g"}'::jsonb,
    '6 Months Service Warranty'
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price;

INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80', 'AS-228 Mini Handheld Vacuum', true, 1)
ON CONFLICT DO NOTHING;

-- Product 4: V380 Pro IP Camera
INSERT INTO public.products (
    id, category_id, brand_id, name, slug, sku, model_number,
    short_description, description, price, original_price, cost_price,
    stock_quantity, low_stock_threshold, is_active, is_featured, is_bestseller,
    specifications, warranty_info
) VALUES (
    'p1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000005',
    'b1000000-0000-0000-0000-000000000003',
    'V380 Pro IP Camera',
    'v380-pro-ip-camera',
    'DRG-CAM-V380P',
    'V380 Pro FHD',
    '1080p FHD Wi-Fi security camera with 360-degree pan-tilt rotation, infrared night vision and 2-way audio.',
    'Smart 1080p FHD Wi-Fi security camera equipped with 360-degree pan-tilt surveillance, crystal-clear infrared night vision, intelligent PIR motion tracking, two-way intercom audio, and cloud/microSD card storage support. Controlled directly from Android/iOS apps.',
    1750.00,
    2200.00,
    1250.00,
    40,
    5,
    true,
    true,
    true,
    '{"Resolution": "1080p FHD (1920x1080)", "Field of View": "360° Horizontal Pan / 90° Tilt", "Night Vision": "Infrared up to 10m", "Storage": "MicroSD up to 128GB & Cloud", "Audio": "Two-Way Microphone & Speaker"}'::jsonb,
    '1 Year Official Warranty'
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price;

INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80', 'V380 Pro Wi-Fi Smart Security Camera', true, 1)
ON CONFLICT DO NOTHING;

-- Product 5: MiLi MiTag Smart Bluetooth Tracker
INSERT INTO public.products (
    id, category_id, brand_id, name, slug, sku, model_number,
    short_description, description, price, original_price, cost_price,
    stock_quantity, low_stock_threshold, is_active, is_featured, is_bestseller,
    specifications, warranty_info
) VALUES (
    'p1000000-0000-0000-0000-000000000005',
    'c1000000-0000-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000004',
    'MiLi MiTag Smart Bluetooth Tracker',
    'mili-mitag-smart-bluetooth-tracker',
    'DRG-MIL-MITAG',
    'HD-P16',
    'Apple Find My certified smart tracking locator tag for keys, luggage, wallets, and backpacks.',
    'Apple Find My certified smart tracking locator tag. Easily locate your keys, wallet, backpack, or pets globally using Apple Find My network without any monthly subscription fees. Features IP67 water resistance, replaceble CR2032 battery with 1-year battery life, and loud 120dB speaker.',
    1450.00,
    1850.00,
    1050.00,
    50,
    8,
    true,
    true,
    true,
    '{"Compatibility": "Apple Find My (iOS/iPadOS/macOS)", "Battery": "CR2032 Replaceable (1 Year Life)", "Waterproof": "IP67 Rating", "Sound": "120dB Loud Ring"}'::jsonb,
    '1 Year Replacement Warranty'
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price;

INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1627989580065-de6d84029ad7?w=800&auto=format&fit=crop&q=80', 'MiLi MiTag Bluetooth Locator', true, 1)
ON CONFLICT DO NOTHING;

-- Product 6: USB Type-C Rechargeable AA Batteries (4-Pack)
INSERT INTO public.products (
    id, category_id, brand_id, name, slug, sku, model_number,
    short_description, description, price, original_price, cost_price,
    stock_quantity, low_stock_threshold, is_active, is_featured, is_bestseller,
    specifications, warranty_info
) VALUES (
    'p1000000-0000-0000-0000-000000000006',
    'c1000000-0000-0000-0000-000000000008',
    NULL,
    'USB Type-C Rechargeable AA Batteries (4-Pack)',
    'usb-type-c-rechargeable-aa-batteries-4-pack',
    'DRG-BAT-AA4P',
    'AA-TYC-2600',
    'Constant 1.5V lithium rechargeable AA batteries with direct USB-C ports on each cell. 1200+ cycles.',
    'Revolutionary 1.5V constant voltage lithium rechargeable AA batteries featuring built-in direct USB-C charging ports on each cell. Eliminates bulky dedicated battery docks. Delivers 2600mWh high capacity, 1.5-hour quick recharge, and over 1,200 lifetime recharge cycles.',
    1950.00,
    2500.00,
    1400.00,
    35,
    5,
    true,
    false,
    true,
    '{"Voltage": "Constant 1.5V", "Capacity": "2600mWh per cell", "Recharge Cycles": "1200+ Times", "Charging Time": "1.5 Hours", "Charging Port": "Built-in USB Type-C"}'::jsonb,
    '6 Months Warranty'
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price;

INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=800&auto=format&fit=crop&q=80', 'USB Type-C Rechargeable AA Batteries 4-Pack', true, 1)
ON CONFLICT DO NOTHING;

-- Product 7: KeyCraft Pro 75% Mechanical Wireless Keyboard
INSERT INTO public.products (
    id, category_id, brand_id, name, slug, sku, model_number,
    short_description, description, price, original_price, cost_price,
    stock_quantity, low_stock_threshold, is_active, is_featured, is_bestseller,
    specifications, warranty_info
) VALUES (
    'p1000000-0000-0000-0000-000000000007',
    'c1000000-0000-0000-0000-000000000003',
    NULL,
    'KeyCraft Pro 75% Mechanical Wireless Keyboard',
    'keycraft-pro-75-mechanical-keyboard',
    'DRG-KB-KC75',
    'KC-75P',
    'Gasket-mounted hot-swappable mechanical keyboard with CNC aluminum frame, RGB backlighting and tri-mode connectivity.',
    'Gasket-mounted hot-swappable mechanical keyboard with CNC aluminum top frame, sound-dampening silicone poron foam, factory-lubed pre-lubricated linear switches, south-facing per-key RGB backlighting, and tri-mode Bluetooth 5.1 / 2.4GHz wireless / USB-C wired connection.',
    3850.00,
    4500.00,
    2900.00,
    18,
    3,
    true,
    true,
    true,
    '{"Layout": "75% Compact (82 Keys)", "Connectivity": "Bluetooth 5.1 / 2.4GHz / Type-C Wired", "Switches": "Hot-swappable Pre-lubed Linear", "Structure": "Gasket Mount with Poron Foam", "Battery": "4000mAh Lithium"}'::jsonb,
    '1 Year Brand Warranty'
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price;

INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80', 'KeyCraft Pro 75% Mechanical Keyboard', true, 1)
ON CONFLICT DO NOTHING;

-- Product 8: Chronos Ultra Titanium Smartwatch
INSERT INTO public.products (
    id, category_id, brand_id, name, slug, sku, model_number,
    short_description, description, price, original_price, cost_price,
    stock_quantity, low_stock_threshold, is_active, is_featured, is_bestseller,
    specifications, warranty_info
) VALUES (
    'p1000000-0000-0000-0000-000000000008',
    'c1000000-0000-0000-0000-000000000002',
    NULL,
    'Chronos Ultra Titanium Smartwatch',
    'chronos-ultra-titanium-smartwatch',
    'DRG-WATCH-CHRU',
    'CH-ULTRA',
    'Rugged aerospace-grade titanium smartwatch with 1.96-inch AMOLED display, Bluetooth calling and multi-sport GPS.',
    'Rugged aerospace-grade titanium smartwatch featuring 1.96-inch AMOLED sapphire crystal display, Bluetooth HD voice calling, continuous 24/7 heart rate / SpO2 oxygen / sleep telemetry, 100+ precision sports modes, and up to 10 days of battery endurance.',
    4200.00,
    5500.00,
    3100.00,
    22,
    4,
    true,
    true,
    false,
    '{"Case Material": "Aerospace Titanium Alloy", "Display": "1.96-inch HD AMOLED 410x502", "Calling": "Bluetooth HD Calling with Speaker", "Sensors": "Heart Rate, SpO2, Sleep, Pedometer", "Battery": "Up to 10 Days Typical"}'::jsonb,
    '1 Year Official Warranty'
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price;

INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80', 'Chronos Ultra Titanium Smartwatch', true, 1)
ON CONFLICT DO NOTHING;

-- Product 9: VoltFlow 65W GaN Fast Charger
INSERT INTO public.products (
    id, category_id, brand_id, name, slug, sku, model_number,
    short_description, description, price, original_price, cost_price,
    stock_quantity, low_stock_threshold, is_active, is_featured, is_bestseller,
    specifications, warranty_info
) VALUES (
    'p1000000-0000-0000-0000-000000000009',
    'c1000000-0000-0000-0000-000000000004',
    NULL,
    'VoltFlow 65W GaN Fast Charger',
    'voltflow-65w-gan-fast-charger',
    'DRG-CHG-VF65W',
    'VF-65W',
    'Ultra-compact 65W GaN III technology multi-port wall charger for MacBooks, laptops, iPhones and Samsung devices.',
    'Ultra-compact 65W GaN III technology multi-port wall charger. Powers laptops, MacBooks, iPads, iPhones, and Android devices at peak speed. Dual USB-C and single USB-A ports with dynamic power allocation and built-in thermal protection.',
    1950.00,
    2400.00,
    1450.00,
    30,
    5,
    true,
    false,
    true,
    '{"Total Output": "65W Max", "Ports": "2x USB-C + 1x USB-A", "Technology": "Gallium Nitride (GaN III)", "Protection": "Over-voltage, Over-temp, Short-circuit", "Dimensions": "52 x 52 x 31 mm"}'::jsonb,
    '1 Year Replacement Warranty'
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price;

INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1000000-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80', 'VoltFlow 65W GaN Fast Charger', true, 1)
ON CONFLICT DO NOTHING;

-- Product 10: MagPower 10,000mAh Magnetic Wireless Power Bank
INSERT INTO public.products (
    id, category_id, brand_id, name, slug, sku, model_number,
    short_description, description, price, original_price, cost_price,
    stock_quantity, low_stock_threshold, is_active, is_featured, is_bestseller,
    specifications, warranty_info
) VALUES (
    'p1000000-0000-0000-0000-000000000010',
    'c1000000-0000-0000-0000-000000000004',
    NULL,
    'MagPower 10,000mAh Magnetic Wireless Power Bank',
    'magpower-10000mah-magnetic-power-bank',
    'DRG-PB-MP10K',
    'MP-10K',
    'Sleek metallic 15W wireless magnetic power bank with integrated foldable kickstand and 20W PD wired fast charging.',
    'Sleek metallic 15W wireless magnetic power bank with integrated kickstand. Snaps securely onto iPhone MagSafe models and magnetic phone cases. Provides 10,000mAh capacity to fully recharge your smartphone 2+ times with 20W USB-C bidirectional fast charging.',
    2450.00,
    2950.00,
    1800.00,
    28,
    4,
    true,
    true,
    false,
    '{"Capacity": "10,000mAh / 38.5Wh", "Wireless Output": "15W Max Magnetic", "Wired Output": "20W Power Delivery USB-C", "Stand": "Foldable Aluminum Kickstand", "Weight": "210g"}'::jsonb,
    '1 Year Replacement Warranty'
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price;

INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=800&auto=format&fit=crop&q=80', 'MagPower 10,000mAh Magnetic Power Bank', true, 1)
ON CONFLICT DO NOTHING;

-- Product 11: Apple MacBook Pro 14" M3 Pro Chip (18GB / 512GB SSD)
INSERT INTO public.products (
    id, category_id, brand_id, name, slug, sku, model_number,
    short_description, description, price, original_price, cost_price,
    stock_quantity, low_stock_threshold, is_active, is_featured, is_bestseller,
    specifications, warranty_info
) VALUES (
    'p1000000-0000-0000-0000-000000000011',
    'c1000000-0000-0000-0000-000000000009',
    'b1000000-0000-0000-0000-000000000008',
    'Apple MacBook Pro 14" M3 Pro Chip (18GB RAM, 512GB SSD) - Space Black',
    'apple-macbook-pro-14-m3-pro-space-black',
    'DRG-MBP-14-M3P',
    'MRX33LL/A',
    'Liquid Retina XDR 120Hz ProMotion display, Apple M3 Pro 11-core CPU / 14-core GPU and up to 18 hours battery.',
    'Apple MacBook Pro 14-inch delivers groundbreaking performance for professional workflows. Featuring the M3 Pro chip with an 11-core CPU and 14-core GPU, Liquid Retina XDR display with ProMotion 120Hz, up to 18 hours of battery life, and high-speed Wi-Fi 6E.',
    269000.00,
    285000.00,
    240000.00,
    14,
    3,
    true,
    true,
    true,
    '{"Processor": "Apple M3 Pro (11-core CPU, 14-core GPU)", "Memory": "18GB Unified RAM", "Storage": "512GB PCIe NVMe SSD", "Display": "14.2-inch Liquid Retina XDR (3024x1964) 120Hz ProMotion", "Battery": "Up to 18 Hours Video Playback", "Color": "Space Black", "Weight": "1.61 kg"}'::jsonb,
    '1 Year Apple Official International Warranty'
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price;

INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1000000-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80', 'Apple MacBook Pro 14 Space Black', true, 1)
ON CONFLICT DO NOTHING;

-- Product 12: Sony WH-1000XM5 Wireless Noise Cancelling Headphones
INSERT INTO public.products (
    id, category_id, brand_id, name, slug, sku, model_number,
    short_description, description, price, original_price, cost_price,
    stock_quantity, low_stock_threshold, is_active, is_featured, is_bestseller,
    specifications, warranty_info
) VALUES (
    'p1000000-0000-0000-0000-000000000012',
    'c1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000006',
    'Sony WH-1000XM5 Wireless Noise Cancelling Headphones - Midnight Black',
    'sony-wh-1000xm5-wireless-noise-cancelling-headphones-black',
    'DRG-SNY-WHXM5',
    'WH1000XM5/B',
    'Industry-leading active noise cancellation with 8 microphones, Auto NC Optimizer, and LDAC High-Resolution audio.',
    'Sony flagship WH-1000XM5 wireless over-ear headphones rewrite the rules for distraction-free listening. Featuring two processors controlling 8 microphones, Auto NC Optimizer, specially engineered 30mm carbon fiber driver unit, 30-hour battery life with 3-minute quick charging.',
    38500.00,
    42000.00,
    33500.00,
    18,
    3,
    true,
    true,
    true,
    '{"Driver Unit": "30mm Carbon Fiber Soft Edge", "Noise Cancelling": "Dual Processors (V1 + QN1) with 8 Microphones", "Battery Life": "Up to 30 Hours (NC On) / 40 Hours (NC Off)", "Hi-Res Audio": "LDAC, DSEE Extreme", "Weight": "250g"}'::jsonb,
    '1 Year Official Warranty'
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price;

INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1000000-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80', 'Sony WH-1000XM5 Headphones', true, 1)
ON CONFLICT DO NOTHING;

-- Product 13: Logitech MX Master 3S Wireless Performance Mouse
INSERT INTO public.products (
    id, category_id, brand_id, name, slug, sku, model_number,
    short_description, description, price, original_price, cost_price,
    stock_quantity, low_stock_threshold, is_active, is_featured, is_bestseller,
    specifications, warranty_info
) VALUES (
    'p1000000-0000-0000-0000-000000000013',
    'c1000000-0000-0000-0000-000000000003',
    'b1000000-0000-0000-0000-000000000007',
    'Logitech MX Master 3S Wireless Performance Mouse - Graphite',
    'logitech-mx-master-3s-wireless-mouse-graphite',
    'DRG-LOG-MX3S',
    '910-006556',
    'Quiet Clicks, 8,000 DPI any-surface track-on-glass sensor, and MagSpeed electromagnetic scroll wheel.',
    'Logitech MX Master 3S is an iconic masterwork for coders, designers, and creators. Equipped with 8K DPI track-on-glass sensor, 90% quieter clicks, MagSpeed electromagnetic wheel scrolling 1,000 lines per second, and multi-computer Flow control across Windows and macOS.',
    11500.00,
    13500.00,
    9800.00,
    26,
    4,
    true,
    true,
    true,
    '{"Sensor": "Darkfield High Precision (8,000 DPI)", "Buttons": "7 Programmable Buttons + Gesture Button", "Scroll Wheel": "MagSpeed Electromagnetic with SmartShift", "Battery": "Up to 70 Days on Full Charge", "Connectivity": "Bluetooth Low Energy + Logi Bolt USB"}'::jsonb,
    '1 Year Official Warranty'
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price;

INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1000000-0000-0000-0000-000000000013', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1000&q=80', 'Logitech MX Master 3S Mouse', true, 1)
ON CONFLICT DO NOTHING;

-- Product 14: Anker Prime 100W GaN Wall Charger
INSERT INTO public.products (
    id, category_id, brand_id, name, slug, sku, model_number,
    short_description, description, price, original_price, cost_price,
    stock_quantity, low_stock_threshold, is_active, is_featured, is_bestseller,
    specifications, warranty_info
) VALUES (
    'p1000000-0000-0000-0000-000000000014',
    'c1000000-0000-0000-0000-000000000004',
    'b1000000-0000-0000-0000-000000000005',
    'Anker Prime 100W GaN Wall Charger (3-Port Fast Charger for Laptops & Phones)',
    'anker-prime-100w-gan-wall-charger',
    'DRG-ANK-P100W',
    'A2668',
    '3-Port 100W fast charger powered by GaNPrime technology with ActiveShield 2.0 real-time temperature monitoring.',
    'Anker Prime 100W GaN wall charger powers 3 devices simultaneously at maximum velocity. Delivers up to 100W single-port output to fast-charge a 16-inch MacBook Pro or gaming laptop, with ActiveShield 2.0 temperature monitoring 3 million times per day.',
    8500.00,
    9800.00,
    7100.00,
    20,
    3,
    true,
    true,
    false,
    '{"Maximum Wattage": "100W Max", "Ports": "2x USB-C + 1x USB-A", "Technology": "GaNPrime with PowerIQ 4.0", "Safety": "ActiveShield 2.0 Dynamic Temperature Monitoring", "Compatibility": "MacBook, Dell XPS, iPhone 15/16, Galaxy S24"}'::jsonb,
    '18 Months Anker Official Warranty'
) ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price;

INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1000000-0000-0000-0000-000000000014', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80', 'Anker Prime 100W GaN Charger', true, 1)
ON CONFLICT DO NOTHING;

-- 6. Promotional Banners
INSERT INTO public.banners (title, subtitle, button_text, target_url, image_url, bg_color, text_color, position, display_order, is_active)
VALUES
('Dhati Festive & Contemporary Collections', '', '', '/shop', '/banners/hero_main.jpg', '#0A0A0A', '#FFFFFF', 'hero', 1, true),
('Heritage Sarees & Festive Panjabis', '', '', '/category/saree', '/banners/promo_1.jpg', '#0A0A0A', '#FFFFFF', 'hero', 2, true),
('Contemporary Western & Streetwear', '', '', '/category/western-wear', '/banners/promo_2.jpg', '#0A0A0A', '#FFFFFF', 'hero', 3, true)
ON CONFLICT DO NOTHING;

-- 7. Policy and CMS Pages
INSERT INTO public.pages (slug, title, content, meta_description, is_published)
VALUES
(
    'about-us',
    'About Dregital',
    '### Who We Are

Welcome to **Dregital**, Bangladesh''s premier online destination for genuine consumer technology, smart gadgets, high-performance computing hardware, and everyday lifestyle essentials.

Founded with a commitment to authenticity and customer satisfaction, Dregital bridges the gap between international innovation and Bangladeshi technology enthusiasts. We believe that shopping for electronics should be transparent, dependable, and enjoyable.

### Our Promise

- **100% Genuine Products**: Every product in our catalog is sourced from authorized distributors and verified suppliers.
- **Fast Nationwide Delivery**: Safe and reliable delivery across all 64 districts of Bangladesh.
- **Dedicated After-Sales Support**: Clear warranty terms and hassle-free service assistance.
- **Fair Pricing**: Competitive pricing in Bangladeshi Taka (BDT) with no hidden fees.',
    'Learn about Dregital, Bangladesh''s trusted destination for genuine technology, gadgets, and everyday lifestyle essentials.',
    true
),
(
    'privacy-policy',
    'Privacy Policy',
    '### Privacy Commitment

At Dregital, we respect your privacy and are committed to protecting your personal information. This Privacy Policy outlines our data handling practices.

### Information We Collect

- **Account Information**: Name, email address, phone number, and delivery address.
- **Order Information**: Products purchased, delivery addresses, and payment method details.
- **Communications**: Inquiries submitted through our contact forms or support channels.

### How We Use Your Information

- To process and deliver your orders accurately.
- To communicate order updates, shipping notifications, and receipts.
- To prevent fraud and ensure platform security.

We **never** sell, rent, or trade your personal data to third parties.',
    'Read Dregital''s Privacy Policy to understand how we protect and manage your personal data.',
    true
),
(
    'terms-conditions',
    'Terms & Conditions',
    '### 1. Introduction

By accessing or placing an order on Dregital, you agree to comply with and be bound by these Terms and Conditions.

### 2. Pricing and Availability

All prices listed on Dregital are in Bangladeshi Taka (BDT). Prices and stock availability are subject to change without prior notice. In the event of a technical pricing error, we reserve the right to cancel the order and provide a full refund.

### 3. Order Confirmation

An order is considered confirmed once our customer service team verifies the delivery details with you via phone or SMS.

### 4. Warranty

Warranty terms vary by product and brand. Please refer to individual product detail pages for specific warranty coverage.',
    'Review the official Terms & Conditions for ordering and shopping on Dregital.',
    true
),
(
    'return-refund-policy',
    'Return & Refund Policy',
    '### 7-Day Return Policy

We want you to be completely satisfied with your purchase. Dregital offers a **7-Day Return Policy** for eligible products.

### Return Eligibility

- The item must be in its original packaging with all included accessories, manuals, and warranty cards intact.
- Physical damage, liquid damage, or unauthorized repairs void return eligibility.
- For damaged or defective items received upon delivery, please inform our support team within 24 hours of receiving the parcel.

### Refund Process

- Once the returned item is inspected at our fulfillment hub, refunds are processed within 3 to 7 business days via bKash, Nagad, or original payment method.',
    'Understand Dregital''s simple and customer-friendly 7-day return and refund procedures.',
    true
),
(
    'shipping-delivery-policy',
    'Shipping & Delivery Policy',
    '### Delivery Zones & Timelines

Dregital delivers to every district, thana, and union across Bangladesh.

- **Inside Dhaka**: 24 to 48 Hours. Standard delivery charge is ৳60.
- **Outside Dhaka**: 2 to 4 Business Days. Standard delivery charge is ৳120.
- **Express Same-Day (Dhaka)**: Order before 12:00 PM for same-day evening delivery (৳150).
- **Free Delivery**: Tech orders above ৳3,000 qualify for FREE standard delivery all across Dhaka.

### Parcel Inspection

You may inspect the exterior of the package upon delivery before signing the courier receipt.',
    'Detailed delivery rates, delivery zones, and fulfillment timelines across Bangladesh.',
    true
),
(
    'faq',
    'Frequently Asked Questions (FAQ)',
    '### Frequently Asked Questions

#### 1. How do I place an order?
Browse our catalog, select your items, click **Add to Cart** or **Buy Now**, and proceed to checkout. Enter your phone number and address, select your payment method (Cash on Delivery, bKash, or Nagad), and confirm your order.

#### 2. Do you offer Cash on Delivery (COD)?
Yes! Cash on Delivery is available across all 64 districts in Bangladesh.

#### 3. How can I track my order?
Visit our **Track Order** page and enter your unique Order Number (e.g., DRG-202611-XXXX) and registered phone number to view live parcel status.

#### 4. Are your products original and authentic?
Yes, 100%. Dregital guarantees authentic products with manufacturer warranties.',
    'Find answers to common questions about shopping, shipping, payments, and warranties on Dregital.',
    true
)
ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, title = EXCLUDED.title;



-- ==============================================================================
-- DREGITAL — MOHASAGOR PRODUCT IMPORTER SCHEMA MIGRATION
-- Migration: 003_mohasagor_importer.sql
-- ==============================================================================

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    limitation_reason TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed default Mohasagor supplier
INSERT INTO public.suppliers (id, name, url, status, config)
VALUES (
    'sup-mohasagor',
    'Mohasagor',
    'https://dregital.mohasagor.com/',
    'active',
    '{"currency": "BDT", "rate_limit_ms": 1500, "batch_size": 10}'::jsonb
) ON CONFLICT (id) DO UPDATE 
SET url = EXCLUDED.url, updated_at = timezone('utc'::text, now());

-- 2. Supplier Products Table (Raw & Normalised Supplier Catalog Cache)
CREATE TABLE IF NOT EXISTS public.supplier_products (
    id TEXT PRIMARY KEY, -- e.g. mohasagor-{supplier_product_id}
    supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    supplier_product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    sku TEXT,
    original_url TEXT,
    supplier_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_price NUMERIC(12, 2),
    currency TEXT NOT NULL DEFAULT 'BDT',
    category_name TEXT,
    mapped_category_id TEXT,
    main_image_url TEXT,
    additional_images JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    short_description TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    variations JSONB DEFAULT '[]'::jsonb,
    stock_status TEXT DEFAULT 'in_stock',
    raw_data JSONB DEFAULT '{}'::jsonb,
    dregital_product_id TEXT,
    sync_status TEXT NOT NULL DEFAULT 'pending', -- pending, imported, updated, skipped, failed
    error_message TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON public.supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_sku ON public.supplier_products(sku);
CREATE INDEX IF NOT EXISTS idx_supplier_products_sync ON public.supplier_products(sync_status);

-- 3. Import Jobs (Persistent Background Job Queue)
CREATE TABLE IF NOT EXISTS public.import_jobs (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL DEFAULT 'full_catalog', -- full_catalog, category_scan, batch_import, file_import
    status TEXT NOT NULL DEFAULT 'pending', -- pending, running, paused, completed, failed, cancelled
    total_discovered INTEGER NOT NULL DEFAULT 0,
    total_imported INTEGER NOT NULL DEFAULT 0,
    total_updated INTEGER NOT NULL DEFAULT 0,
    total_skipped INTEGER NOT NULL DEFAULT 0,
    total_failed INTEGER NOT NULL DEFAULT 0,
    images_downloaded INTEGER NOT NULL DEFAULT 0,
    current_batch INTEGER NOT NULL DEFAULT 0,
    total_batches INTEGER NOT NULL DEFAULT 0,
    progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    checkpoint JSONB DEFAULT '{}'::jsonb,
    config JSONB DEFAULT '{
        "markup_type": "none",
        "markup_value": 0,
        "auto_publish": false,
        "default_status": "draft",
        "download_images": true
    }'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_supplier ON public.import_jobs(supplier_id);

-- 4. Import Job Items (Itemized Tracking for Retries & Audits)
CREATE TABLE IF NOT EXISTS public.import_job_items (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
    supplier_product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, imported, skipped, failed
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_job_items_job ON public.import_job_items(job_id);
CREATE INDEX IF NOT EXISTS idx_job_items_status ON public.import_job_items(status);

-- 5. Import Logs (Real-time Execution & Audit Trail)
CREATE TABLE IF NOT EXISTS public.import_logs (
    id TEXT PRIMARY KEY,
    job_id TEXT REFERENCES public.import_jobs(id) ON DELETE CASCADE,
    log_level TEXT NOT NULL DEFAULT 'info', -- info, warn, error
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_import_logs_job ON public.import_logs(job_id);
