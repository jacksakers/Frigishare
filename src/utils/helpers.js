// Helper function to generate a consistent ID from item name
// This ensures that "Greek Yogurt" always gets the same ID
export const generateItemId = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Helper function to round to nearest 0.5
export const roundToHalf = (num) => {
  return Math.round(num * 2) / 2;
};

// ============================================
// CATEGORY SYSTEM - Single Source of Truth
// ============================================

export const CATEGORIES = [
  { value: 'dairy', label: 'Dairy', emoji: '🥛' },
  { value: 'produce', label: 'Produce', emoji: '🥬' },
  { value: 'meat', label: 'Meat', emoji: '🍖' },
  { value: 'grains', label: 'Grains', emoji: '🌾' },
  { value: 'beverages', label: 'Beverages', emoji: '🧃' },
  { value: 'snacks', label: 'Snacks', emoji: '🍪' },
  { value: 'condiments', label: 'Condiments', emoji: '🧂' },
  { value: 'other', label: 'Other', emoji: '📦' }
];

// Get category emoji by value
export const getCategoryEmoji = (cat) => {
  const category = CATEGORIES.find(c => c.value === cat);
  if (category) return category.emoji;
  
  // Legacy categories (for backward compatibility)
  switch(cat) {
    case 'fruit': return '🍎';
    case 'veg': return '🥕';
    case 'grain': return '🍞';
    case 'drink': return '🧃';
    case 'condiment': return '🥫';
    default: return '📦';
  }
};

// Get category label by value
export const getCategoryLabel = (cat) => {
  const category = CATEGORIES.find(c => c.value === cat);
  return category ? category.label : 'Other';
};

// Get the proper sort order for categories
export const getCategorySortOrder = () => {
  return CATEGORIES.map(c => c.value);
};
