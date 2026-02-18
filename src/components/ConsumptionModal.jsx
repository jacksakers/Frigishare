import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Minus } from 'lucide-react';

const ConsumptionModal = ({ isOpen, onClose, onConfirm, consumptionItems, daysSinceLastCheckIn }) => {
  const [adjustedItems, setAdjustedItems] = useState([]);

  useEffect(() => {
    if (consumptionItems && consumptionItems.length > 0) {
      setAdjustedItems(consumptionItems);
    }
  }, [consumptionItems]);

  if (!isOpen) return null;

  const handleAdjustUsage = (itemId, delta) => {
    setAdjustedItems(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          const newUsage = Math.max(0, Math.min(item.qty, item.actualUsage + delta));
          return { ...item, actualUsage: Math.round(newUsage * 100) / 100 };
        }
        return item;
      })
    );
  };

  const handleConfirm = () => {
    onConfirm(adjustedItems);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-90">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Check-in Time!</h2>
        </div>
        
        <p className="text-slate-600 mb-2">
          It's been <span className="font-bold text-blue-600">{daysSinceLastCheckIn} days</span> since your last check-in.
        </p>
        <p className="text-slate-500 text-sm mb-6">
          Based on your usual habits, we estimated consumption. Adjust if needed:
        </p>

        <div className="space-y-3 mb-8 max-h-[45vh] overflow-y-auto pr-2">
          {adjustedItems.map(item => (
            <div key={item.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-slate-700">{item.name}</p>
                  <p className="text-xs text-slate-500">Weekly usage: {item.weeklyUsage} {item.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Current: {item.qty} {item.unit}</p>
                  <p className="text-xs text-slate-400">New: {Math.max(0, item.qty - item.actualUsage)} {item.unit}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-slate-200">
                <button 
                  onClick={() => handleAdjustUsage(item.id, -0.5)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  <Minus size={16} />
                </button>
                
                <div className="text-center">
                  <p className="text-lg font-bold text-red-500">-{item.actualUsage}</p>
                  <p className="text-[10px] text-slate-400">consumed</p>
                </div>
                
                <button 
                  onClick={() => handleAdjustUsage(item.id, 0.5)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
          {adjustedItems.length === 0 && (
            <p className="italic text-slate-400 text-center py-4">No items have a weekly usage set.</p>
          )}
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-300 font-bold text-slate-500 hover:bg-slate-50"
          >
            Skip
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700"
          >
            Confirm & Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsumptionModal;
