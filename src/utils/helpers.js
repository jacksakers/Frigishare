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

// Helper function for category emojis
export const getCategoryEmoji = (cat) => {
  switch(cat) {
    case 'dairy': return '🥛';
    case 'produce': return '🥬';
    case 'meat': return '🍖';
    case 'grains': return '🌾';
    case 'beverages': return '🧃';
    case 'snacks': return '🍪';
    case 'condiments': return '🧂';
    // Legacy categories (for backward compatibility)
    case 'fruit': return '🍎';
    case 'veg': return '🥕';
    case 'grain': return '🍞';
    case 'drink': return '🧃';
    case 'condiment': return '🥫';
    default: return '📦';
  }
};
