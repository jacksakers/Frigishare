import React from 'react';
import { AlertCircle } from 'lucide-react';

const ConsumptionModal = ({ isOpen, onClose, onConfirm, inventory }) => {
  if (!isOpen) return null;

  const itemsWithUsage = inventory.filter(i => i.weeklyUsage > 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-90">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Weekly Check-in</h2>
        </div>
        
        <p className="text-slate-600 mb-6">
          Based on your usual habits, we think you might have used these items. Did you?
        </p>

        <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto">
          {itemsWithUsage.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <p className="font-bold text-slate-700">{item.name}</p>
                <p className="text-xs text-slate-500">Usually use {item.weeklyUsage} {item.unit}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-500">-{item.weeklyUsage}</p>
                <p className="text-[10px] text-slate-400">New Qty: {Math.max(0, item.qty - item.weeklyUsage)}</p>
              </div>
            </div>
          ))}
          {itemsWithUsage.length === 0 && (
            <p className="italic text-slate-400 text-center">No items have a weekly usage set.</p>
          )}
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-300 font-bold text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700"
          >
            Yes, Update Fridge
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsumptionModal;
