import React from 'react';

// The Skeuomorphic Shelf Component
const Shelf = ({ title, children, type = 'fridge' }) => {
  const shelfStyles = type === 'fridge' 
    ? "bg-white/80 border-b-8 border-slate-200 shadow-inner rounded-lg" // Plastic/Glass look
    : "bg-[#e8d5b5] border-b-8 border-[#cbb389] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] rounded-sm"; // Wood look

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 ml-2">{title}</h3>
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
