import React from 'react';
import { Refrigerator, Archive, ShoppingCart } from 'lucide-react';

const BottomNav = ({ view, setView, shoppingListCount }) => {
  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40 text-slate-400">
      <button 
        onClick={() => setView('fridge')}
        className={`flex flex-col items-center gap-1 ${view === 'fridge' ? 'text-emerald-600' : 'hover:text-emerald-400'}`}
      >
        <Refrigerator size={24} />
        <span className="text-xs font-medium">Fridge</span>
      </button>
      <button 
        onClick={() => setView('pantry')}
        className={`flex flex-col items-center gap-1 ${view === 'pantry' ? 'text-orange-600' : 'hover:text-orange-400'}`}
      >
        <Archive size={24} />
        <span className="text-xs font-medium">Pantry</span>
      </button>
      <button 
        onClick={() => setView('list')}
        className={`flex flex-col items-center gap-1 ${view === 'list' ? 'text-blue-600' : 'hover:text-blue-400'}`}
      >
        <div className="relative">
          <ShoppingCart size={24} />
          {shoppingListCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {shoppingListCount}
            </span>
          )}
        </div>
        <span className="text-xs font-medium">Shop</span>
      </button>
    </nav>
  );
};

export default BottomNav;
