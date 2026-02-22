import React from 'react';
import { Plus } from 'lucide-react';

// The Skeuomorphic Shelf Component
const Shelf = ({ title, children, type = 'fridge', onAddItem }) => {
  const shelfStyles = type === 'fridge' 
    ? "bg-white/80 border-b-8 border-slate-200 shadow-inner rounded-lg" // Plastic/Glass look
    : "bg-[#e8d5b5] border-b-8 border-[#cbb389] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] rounded-sm"; // Wood look

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1 ml-2">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
        {onAddItem && (
          <button
            onClick={() => onAddItem(title)}
            className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full p-1 transition"
            title={`Add item to ${title}`}
          >
            <Plus size={18} />
          </button>
        )}
      </div>
      <div className={`min-h-[140px] p-4 flex gap-4 overflow-x-auto ${shelfStyles}`}>
        {children}
        {React.Children.count(children) === 0 && (
          <div className="w-full flex items-center justify-center text-slate-300 italic text-sm">
            Empty Shelf
          </div>
        )}
      </div>
    </div>
  );
};

export default Shelf;
