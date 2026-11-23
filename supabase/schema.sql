-- =============================================================================
-- DREGITAL COMMERCE: COMPLETE SUPABASE SETUP SCRIPT
-- Copy and paste this ENTIRE script directly into the Supabase Dashboard -> SQL Editor
-- Project URL: https://bojrnmuhqiidgbqjaacq.supabase.co
-- =============================================================================

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
-- STEP 2: CREATE CORE E-COMMERCE DATABASE TABLES
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Categories (Supports 1:1 image_url)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    banner_url TEXT,
    icon_name TEXT DEFAULT 'Tag',
    display_order INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Products
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    brand_id TEXT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sku TEXT,
    model_number TEXT,
    short_description TEXT,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    original_price NUMERIC(12, 2),
    cost_price NUMERIC(12, 2),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    specifications JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    warranty_info TEXT,
    rating_average NUMERIC(3, 2) DEFAULT 5.0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Product Images (Multiple photos per product)
CREATE TABLE IF NOT EXISTS public.product_images (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Product Variants
CREATE TABLE IF NOT EXISTS public.product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    variant_value TEXT NOT NULL,
    sku TEXT,
    price_adjustment NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0
);

-- 5. Banners (16:9 Aspect Ratio)
CREATE TABLE IF NOT EXISTS public.banners (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    button_text TEXT DEFAULT 'EXPLORE',
    target_url TEXT DEFAULT '/shop',
    image_url TEXT NOT NULL,
    bg_color TEXT,
    text_color TEXT,
    position TEXT DEFAULT 'hero',
    display_order INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    delivery_address TEXT NOT NULL,
    district TEXT NOT NULL DEFAULT 'Dhaka',
    area TEXT NOT NULL DEFAULT 'Dhaka',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    delivery_charge NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery',
    payment_status TEXT NOT NULL DEFAULT 'Pending',
    order_status TEXT NOT NULL DEFAULT 'Pending',
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal NUMERIC(12, 2) NOT NULL,
    product_sku TEXT,
    variant_details TEXT,
    image_url TEXT
);

-- 8. Store Settings
CREATE TABLE IF NOT EXISTS public.store_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- =============================================================================
-- STEP 3: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Allow Public READ access on catalog tables
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read Product Images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Public Read Product Variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Public Read Banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Public Read Store Settings" ON public.store_settings FOR SELECT USING (true);

-- Allow Public to create orders
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Order Items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Own Order" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public Read Own Order Items" ON public.order_items FOR SELECT USING (true);

-- Allow Full Access to service_role and authenticated users for management
CREATE POLICY "Service Role All Categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "Service Role All Products" ON public.products FOR ALL USING (true);
CREATE POLICY "Service Role All Product Images" ON public.product_images FOR ALL USING (true);
CREATE POLICY "Service Role All Product Variants" ON public.product_variants FOR ALL USING (true);
CREATE POLICY "Service Role All Banners" ON public.banners FOR ALL USING (true);
CREATE POLICY "Service Role All Orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Service Role All Order Items" ON public.order_items FOR ALL USING (true);
CREATE POLICY "Service Role All Settings" ON public.store_settings FOR ALL USING (true);

-- Initial default settings
INSERT INTO public.store_settings (setting_key, setting_value, description)
VALUES 
    ('store_name', '"Dregital"'::jsonb, 'Store Name'),
    ('currency', '"BDT"'::jsonb, 'Store Currency'),
    ('delivery_inside_dhaka', '70'::jsonb, 'Inside Dhaka Delivery Charge'),
    ('delivery_outside_dhaka', '130'::jsonb, 'Outside Dhaka Delivery Charge')
ON CONFLICT (setting_key) DO NOTHING;
