import React from 'react';
import { StickyNote } from 'lucide-react';
import { getCategoryEmoji } from '../utils/helpers';

// The Food Item Card Component
const FoodItem = ({ item, onEdit }) => {
  const isLow = item.qty <= item.minThreshold;

  return (
    <div 
      onClick={() => onEdit(item)}
      className={`
        relative group flex-shrink-0 w-32 h-36 bg-white rounded-xl shadow-md border-2 
        flex flex-col items-center justify-center p-2 cursor-pointer transition-transform hover:-translate-y-1
        ${isLow ? 'border-red-300 bg-red-50' : 'border-slate-100'}
      `}
    >
      {/* Sticky Note Indicator */}
      {item.note && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-200 shadow-sm rotate-12 flex items-center justify-center rounded-sm z-10" title={item.note}>
          <StickyNote size={14} className="text-yellow-700" />
        </div>
      )}

      {/* Icon Placeholder based on Category */}
      <div className="text-3xl mb-2">
        {getCategoryEmoji(item.category)}
      </div>

      <div className="text-center w-full">
        <p className="font-bold text-slate-700 text-sm truncate w-full">{item.name}</p>
        <p className="text-xs text-slate-400">{item.qty} {item.unit}</p>
      </div>

      {/* Auto-Use Indicator */}
      {item.weeklyUsage > 0 && (
        <div className="mt-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="font-bold">-{item.weeklyUsage}</span>/wk
        </div>
      )}
    </div>
  );
};

export default FoodItem;
