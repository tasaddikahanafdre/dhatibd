// lib/importer/scraper.ts
import * as cheerio from 'cheerio';
import { SupplierConnectionStatus, SupplierProductRaw } from './types';

const MOHASAGOR_URL = 'https://www.dropbazarbd.com/';

/**
 * Checks the live connectivity and access control status of the supplier host
 */
export async function checkSupplierConnection(): Promise<SupplierConnectionStatus> {
  const startTime = Date.now();
  const last_checked_at = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(MOHASAGOR_URL, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(timeout);
    const latency_ms = Date.now() - startTime;

    const text = await res.text();
    const isCloudflareChallenge = 
      text.includes('Please wait while your request is being verified') ||
      text.includes('One moment, please...') ||
      text.includes('wsidchk') ||
      text.includes('cf-browser-verification') ||
      res.headers.get('server')?.toLowerCase().includes('cloudflare') && text.includes('challenge');

    if (isCloudflareChallenge) {
      return {
        supplier_id: 'sup-mohasagor',
        name: 'DropBazar BD (dropbazarbd.com)',
        url: MOHASAGOR_URL,
        status: 'challenge_gated',
        limitation_code: 'CLOUDFLARE_PROTECTED',
        limitation_message: 'Supplier host is protected by Cloudflare bot verification challenge. Automated extraction is stopped to comply with access control guidelines. You can use the Bulk Catalogue Upload (JSON/CSV) to import your supplier catalog directly without network blocks.',
        http_status: res.status,
        latency_ms,
        last_checked_at
      };
    }

    return {
      supplier_id: 'sup-mohasagor',
      name: 'DropBazar BD (dropbazarbd.com)',
      url: MOHASAGOR_URL,
      status: res.ok ? 'connected' : 'offline',
      http_status: res.status,
      latency_ms,
      last_checked_at
    };
  } catch (err: any) {
    return {
      supplier_id: 'sup-mohasagor',
      name: 'DropBazar BD (dropbazarbd.com)',
      url: MOHASAGOR_URL,
      status: 'offline',
      limitation_code: 'CONNECTION_ERROR',
      limitation_message: err?.message || 'Failed to establish connection to supplier',
      latency_ms: Date.now() - startTime,
      last_checked_at
    };
  }
}

/**
 * Parses raw HTML product cards or pages from Mohasagor
 */
export function parseMohasagorHtml(html: string): SupplierProductRaw[] {
  const $ = cheerio.load(html);
  const products: SupplierProductRaw[] = [];

  // Common ecommerce / Mohasagor product card selectors
  const selectors = ['.product-card', '.product-item', '.single-product', 'article.product', '.grid-item', '.item'];

  let matchedSelector = '';
  for (const s of selectors) {
    if ($(s).length > 0) {
      matchedSelector = s;
      break;
    }
  }

  if (!matchedSelector) {
    // Fallback: look for elements with links containing /product/
    $('a[href*="/product/"]').each((_, el) => {
      const container = $(el).closest('div');
      if (container.length) {
        const title = container.find('h2, h3, h4, .title, .name').text().trim() || $(el).text().trim();
        const priceText = container.find('.price, .regular-price, span:contains("৳")').text().trim();
        const img = container.find('img').attr('src') || '';
        const href = $(el).attr('href') || '';

        if (title && priceText && img) {
          const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
          const id = href.split('/').filter(Boolean).pop() || `mh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

          products.push({
            supplier_product_id: id,
            name: title,
            supplier_price: price,
            main_image_url: img.startsWith('http') ? img : new URL(img, MOHASAGOR_URL).toString(),
            original_url: href.startsWith('http') ? href : new URL(href, MOHASAGOR_URL).toString(),
            category_name: 'Tech'
          });
        }
      }
    });

    return products;
  }

  $(matchedSelector).each((idx, el) => {
    const $el = $(el);
    const title = $el.find('.product-title, .title, .name, h2, h3').text().trim();
    const priceText = $el.find('.price, .current-price, .amount').text().trim();
    const oldPriceText = $el.find('.old-price, .regular-price, del').text().trim();
    const imgUrl = $el.find('img').attr('src') || $el.find('img').attr('data-src') || '';
    const link = $el.find('a').attr('href') || '';
    const category = $el.find('.category, .tag').text().trim() || 'General';

    const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
    const oldPrice = parseFloat(oldPriceText.replace(/[^0-9.]/g, '')) || undefined;

    if (title && (price > 0 || imgUrl)) {
      const id = link ? link.split('/').filter(Boolean).pop() : `prod-${idx + 1}`;
      products.push({
        supplier_product_id: id || `item-${idx + 1}`,
        name: title,
        supplier_price: price,
        discount_price: oldPrice,
        main_image_url: imgUrl.startsWith('http') ? imgUrl : new URL(imgUrl, MOHASAGOR_URL).toString(),
        original_url: link ? (link.startsWith('http') ? link : new URL(link, MOHASAGOR_URL).toString()) : undefined,
        category_name: category
      });
    }
  });

  return products;
}
