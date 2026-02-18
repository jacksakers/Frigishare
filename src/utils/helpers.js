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
