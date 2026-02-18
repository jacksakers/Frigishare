// Helper function for category emojis
export const getCategoryEmoji = (cat) => {
  switch(cat) {
    case 'fruit': return '🍎';
    case 'veg': return '🥕';
    case 'dairy': return '🥛';
    case 'meat': return '🥩';
    case 'grain': return '🍞';
    case 'condiment': return '🥫';
    case 'drink': return '🧃';
    default: return '📦';
  }
};
