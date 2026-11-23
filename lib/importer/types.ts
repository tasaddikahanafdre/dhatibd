// lib/importer/types.ts

export type JobStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type JobType = 'full_catalog' | 'category_scan' | 'batch_import' | 'file_import';
export type MarkupType = 'none' | 'fixed' | 'percentage';

export interface ImportConfig {
  markup_type: MarkupType;
  markup_value: number; // e.g. 100 for 100 BDT or 15 for 15%
  auto_publish: boolean; // default false (draft)
  default_status: 'draft' | 'published';
  download_images: boolean;
  category_mappings: Record<string, string>; // supplier_category_name -> dhati_category_id
}

export interface SupplierProductRaw {
  supplier_product_id: string;
  name: string;
  sku?: string;
  original_url?: string;
  supplier_price: number;
  discount_price?: number;
  category_name?: string;
  main_image_url: string;
  additional_images?: string[];
  description?: string;
  short_description?: string;
  specifications?: Record<string, any>;
  variations?: any[];
  stock_status?: string;
}

export interface ImportJob {
  id: string;
  supplier_id: string;
  job_type: JobType;
  status: JobStatus;
  total_discovered: number;
  total_imported: number;
  total_updated: number;
  total_skipped: number;
  total_failed: number;
  images_downloaded: number;
  current_batch: number;
  total_batches: number;
  progress_percent: number;
  checkpoint?: {
    last_processed_index?: number;
    last_page?: number;
    cursor?: string;
  };
  config: ImportConfig;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface ImportJobItem {
  id: string;
  job_id: string;
  supplier_product_id: string;
  name: string;
  status: 'pending' | 'processing' | 'imported' | 'updated' | 'skipped' | 'failed';
  error_message?: string | null;
  created_at: string;
}

export interface SupplierConnectionStatus {
  supplier_id: string;
  name: string;
  url: string;
  status: 'connected' | 'challenge_gated' | 'offline' | 'unknown';
  limitation_code?: string;
  limitation_message?: string;
  http_status?: number;
  latency_ms?: number;
  last_checked_at: string;
}
