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
