// lib/importer/state.ts
import fs from 'fs';
import path from 'path';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { ImportConfig, ImportJob, ImportJobItem, SupplierConnectionStatus } from './types';

const STATE_FILE = path.join(process.cwd(), 'data', 'importer_state.json');

export interface ImporterState {
  supplier_status: SupplierConnectionStatus;
  active_job: ImportJob | null;
  history: ImportJob[];
  failed_items: ImportJobItem[];
  pricing_config: {
    markup_type: 'none' | 'fixed' | 'percentage';
    markup_value: number;
    auto_publish: boolean;
  };
  category_mappings: Record<string, string>; // supplier_category_name -> dhati_category_id
}

const defaultState: ImporterState = {
  supplier_status: {
    supplier_id: 'sup-dropbazar',
    name: 'DropBazar BD (dropbazarbd.com)',
    url: 'https://www.dropbazarbd.com/',
    status: 'connected',
    http_status: 200,
    latency_ms: 120,
    last_checked_at: new Date().toISOString()
  },
  active_job: null,
  history: [],
  failed_items: [],
  pricing_config: {
    markup_type: 'none',
    markup_value: 0,
    auto_publish: false
  },
  category_mappings: {
    'Tech': 'cat-tech-001',
    'Electronics': 'cat-tech-001',
    'Gadgets': 'cat-tech-001',
    'Food': 'cat-food-002',
    'Grocery': 'cat-food-002',
    'Clothing': 'cat-clothing-003',
    'Fashion': 'cat-clothing-003',
    'Kids': 'cat-kids-004',
    'Toys': 'cat-kids-004',
    'Home': 'cat-home-005',
    'Living': 'cat-home-005',
    'Other': 'cat-other-006'
  }
};

let memoryCache: ImporterState | null = null;
let lastCloudSync = 0;

export async function getImporterState(): Promise<ImporterState> {
  const now = Date.now();
  if (memoryCache && (now - lastCloudSync < 3000)) {
    return memoryCache;
  }

  // 1. Check Supabase store_settings
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('setting_value')
        .eq('setting_key', 'dhati_importer_state')
        .maybeSingle();

      if (!error && data?.setting_value && typeof data.setting_value === 'object') {
        memoryCache = {
          ...defaultState,
          ...data.setting_value,
          pricing_config: { ...defaultState.pricing_config, ...(data.setting_value.pricing_config || {}) },
          category_mappings: { ...defaultState.category_mappings, ...(data.setting_value.category_mappings || {}) }
        };
        lastCloudSync = now;
        return memoryCache;
      }
    } catch (e) {
      console.error('Error loading importer state from Supabase:', e);
    }
  }

  // 2. Check local file
  if (fs.existsSync(STATE_FILE)) {
    try {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryCache = {
        ...defaultState,
        ...parsed,
        pricing_config: { ...defaultState.pricing_config, ...(parsed.pricing_config || {}) },
        category_mappings: { ...defaultState.category_mappings, ...(parsed.category_mappings || {}) }
      };
      return memoryCache;
    } catch (e) {
      console.error('Error loading local importer state:', e);
    }
  }

  memoryCache = defaultState;
  return defaultState;
}

export async function saveImporterState(newState: ImporterState): Promise<void> {
  memoryCache = newState;
  lastCloudSync = Date.now();

  // Save locally
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save local importer state:', e);
  }

  // Save to Supabase
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      await supabase.from('store_settings').upsert({
        setting_key: 'dhati_importer_state',
        setting_value: newState,
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });
    } catch (e) {
      console.error('Failed to sync importer state to Supabase:', e);
    }
  }
}
