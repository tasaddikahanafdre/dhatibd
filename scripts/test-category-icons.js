// scripts/test-category-icons.js
const { matchCategoryIcon, getCategoryIconUrl } = require('../lib/categoryIcons');

const testCases = [
  'Tech',
  'Food',
  'Clothing',
  'Kids',
  'Home',
  'Other',
  "Men's Fashion",
  "Men's Accessories",
  'Home & Lifestyle',
  'Watches',
  'Shirts',
  'Electronics & Gadgets',
  'Beauty & Skincare',
  'Sneakers & Footwear',
  'Backpacks',
  'Sports Equipment',
  'Gaming Consoles',
  'Diamond Rings',
  'Miscellaneous Curated'
];

console.log('--- TESTING CATEGORY ICON SYSTEM ---');
testCases.forEach(tc => {
  const matched = matchCategoryIcon(tc);
  console.log(tc.padEnd(25) + ' -> ' + matched.iconUrl + ' (' + matched.iconName + ')');
});
