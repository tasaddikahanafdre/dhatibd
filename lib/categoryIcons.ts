// lib/categoryIcons.ts
import { Category } from './types';

/**
 * Semantic keyword rules to match any category name or slug to an orange vector line-art category icon
 */
const ICON_RULES: Array<{ keywords: string[]; iconUrl: string; iconName: string }> = [
  // 1. Saree & Ethnic Drapes
  {
    keywords: ['saree', 'sharee', 'sari', 'jamdani', 'silk saree', 'georgette', 'katand', 'chiffon', 'borkha', 'borka', 'hijab'],
    iconUrl: '/icons/categories/saree.svg',
    iconName: 'Saree'
  },
  // 2. Panjabi & Traditional Menswear
  {
    keywords: ['panjabi', 'punjabi', 'kurta', 'pajama', 'sherwani', 'koti', 'fatua'],
    iconUrl: '/icons/categories/panjabi.svg',
    iconName: 'Panjabi'
  },
  // 3. Men's Fashion & Button-down Shirts
  {
    keywords: ['men\'s fashion', 'mens fashion', 'mens-fashion', 'menswear', 'shirt', 'shirts', 't-shirt', 'tshirt', 'polo', 'suit', 'blazer', 'hoodie', 'formal shirt'],
    iconUrl: '/icons/categories/mens-fashion.svg',
    iconName: 'Shirt'
  },
  // 4. Women's Fashion & Dresses
  {
    keywords: ['women\'s fashion', 'womens fashion', 'womens-fashion', 'womenswear', 'three piece', 'kurti', 'gown', 'salwar', 'kameez', 'tunic', 'dress'],
    iconUrl: '/icons/categories/womens-fashion.svg',
    iconName: 'Dress'
  },
  // 5. Western Wear & Streetwear
  {
    keywords: ['western wear', 'western-wear', 'western', 'jacket', 'denim', 'jeans', 'streetwear', 'cardigan', 'sweater', 'trouser'],
    iconUrl: '/icons/categories/western-wear.svg',
    iconName: 'Jacket'
  },
  // 6. Kids' Clothing & Infant Wear
  {
    keywords: ['kid', 'kids', 'kids\' clothing', 'kids-clothing', 'baby', 'toddler', 'children', 'infant', 'romper', 'onesie'],
    iconUrl: '/icons/categories/kids-clothing.svg',
    iconName: 'Smile'
  },
  // 7. Footwear & Shoes
  {
    keywords: ['shoe', 'shoes', 'footwear', 'sneaker', 'sneakers', 'boot', 'boots', 'sandals', 'loafers', 'heels'],
    iconUrl: '/icons/categories/shoes.svg',
    iconName: 'Footprints'
  },
  // 8. Accessories & Eyewear
  {
    keywords: ['accessories', 'accessory', 'sunglasses', 'glasses', 'wallet', 'wallets', 'belt', 'belts', 'cufflinks', 'chains', 'bracelet', 'watch', 'watches'],
    iconUrl: '/icons/categories/accessories.svg',
    iconName: 'Glasses'
  },
  // 9. Seasonal Collections & Winter Wear
  {
    keywords: ['seasonal collections', 'seasonal-collections', 'seasonal', 'winter', 'festive', 'summer', 'shawl', 'coat', 'trench'],
    iconUrl: '/icons/categories/seasonal-collections.svg',
    iconName: 'Sparkles'
  },
  // 10. Bags & Luggage
  {
    keywords: ['bag', 'bags', 'backpack', 'backpacks', 'luggage', 'purse', 'handbag', 'briefcase'],
    iconUrl: '/icons/categories/bags.svg',
    iconName: 'ShoppingBag'
  },
  // 11. General Clothing
  {
    keywords: ['clothing', 'clothes', 'apparel', 'wear', 'fashion'],
    iconUrl: '/icons/categories/clothing.svg',
    iconName: 'Shirt'
  }
];

export const FALLBACK_CATEGORY_ICON = '/icons/categories/clothing.svg';

/**
 * Matches a category name or slug to its suitable SVG icon
 */
export function matchCategoryIcon(categoryNameOrSlug: string = ''): { iconUrl: string; iconName: string } {
  if (!categoryNameOrSlug || typeof categoryNameOrSlug !== 'string') {
    return { iconUrl: FALLBACK_CATEGORY_ICON, iconName: 'Shirt' };
  }

  const clean = categoryNameOrSlug.toLowerCase().trim();

  for (const rule of ICON_RULES) {
    for (const kw of rule.keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'i');
      if (clean.includes(kw) || regex.test(clean)) {
        return { iconUrl: rule.iconUrl, iconName: rule.iconName };
      }
    }
  }

  return { iconUrl: FALLBACK_CATEGORY_ICON, iconName: 'Shirt' };
}

/**
 * Returns the final image/icon URL for a category.
 * If category has a custom uploaded photo, returns it directly!
 * If category has no image or an SVG icon, returns a matching real high-fashion photograph!
 */
export function getCategoryIconUrl(category?: Partial<Category> | null): string {
  if (!category) return '/fashion/categories/saree.jpg';

  // 1. If category already has a custom uploaded photo from the user, use it directly!
  if (category.image_url && typeof category.image_url === 'string' && category.image_url.trim() !== '') {
    const url = category.image_url.trim();
    if (!url.startsWith('/icons/categories/')) {
      return url;
    }
  }

  // 2. Return matching real authentic photograph based on category:
  const text = `${category.name || ''} ${category.slug || ''}`.toLowerCase();
  if (text.includes('saree') || text.includes('sharee') || text.includes('sari')) return '/fashion/categories/saree.jpg';
  if (text.includes('panjabi') || text.includes('punjabi') || text.includes('kurta')) return '/fashion/categories/panjabi.jpg';
  if (text.includes('mens') || text.includes('men') || text.includes('shirt')) return '/fashion/categories/mens-fashion.jpg';
  if (text.includes('womens') || text.includes('women') || text.includes('dress') || text.includes('borka')) return '/fashion/categories/womens-fashion.jpg';
  if (text.includes('western') || text.includes('jacket') || text.includes('jeans') || text.includes('denim')) return '/fashion/categories/western-wear.jpg';
  if (text.includes('kid') || text.includes('baby') || text.includes('child')) return '/fashion/categories/kids-clothing.jpg';
  if (text.includes('shoe') || text.includes('sneaker') || text.includes('footwear')) return '/fashion/categories/shoes.jpg';
  if (text.includes('access') || text.includes('watch') || text.includes('glass')) return '/fashion/categories/accessories.jpg';
  if (text.includes('season') || text.includes('winter') || text.includes('hoodie')) return '/fashion/categories/seasonal-collections.jpg';

  return '/fashion/categories/saree.jpg';
}
