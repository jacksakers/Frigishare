import React from 'react';
import { Refrigerator } from 'lucide-react';

const Header = ({ onSimulateWeek }) => {
  return (
    <header className="bg-white p-4 shadow-sm sticky top-0 z-20 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="bg-emerald-500 p-2 rounded-lg text-white">
          <Refrigerator size={24} />
        </div>
        <h1 className="font-bold text-xl tracking-tight text-slate-700">FridgeSync</h1>
      </div>
      
      {/* Sim Button for Demo */}
      <button 
        onClick={onSimulateWeek}
        className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium hover:bg-indigo-200 transition"
      >
        Simulate Week Pass
      </button>
    </header>
  );
};

export default Header;
