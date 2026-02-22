import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Plus, Minus } from 'lucide-react';
import { CATEGORIES, roundToHalf, getPreviousItem } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';

const AddToFridgeModal = ({ item, isOpen, onClose, onConfirm }) => {
  const { householdId } = useAuth();
  const [location, setLocation] = useState('fridge');
  const [subLocation, setSubLocation] = useState('Top Shelf');
  const [category, setCategory] = useState('other');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('servings');

  // Fetch previous item data to get purchase amount as default
  useEffect(() => {
    if (isOpen && item && householdId) {
      const loadDefaults = async () => {
        const previousItem = await getPreviousItem(db, householdId, item.name);
        if (previousItem) {
          setQty(previousItem.purchaseAmount || 1);
          setLocation(previousItem.location || 'fridge');
          setSubLocation(previousItem.subLocation || 'Top Shelf');
          setCategory(previousItem.category || 'other');
          setUnit(previousItem.unit || 'servings');
        } else {
          // Reset to defaults if no previous data
          setQty(1);
          setLocation('fridge');
          setSubLocation('Top Shelf');
          setCategory('other');
          setUnit('servings');
        }
      };
      loadDefaults();
    }
  }, [isOpen, item, householdId]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      name: item.name,
      location,
      subLocation,
      category: item.category || category,
      qty: parseFloat(qty),
      unit,
      note: item.note || '',
      weeklyUsage: 0,
      minThreshold: 1
    });
    onClose();
  };

  const subLocations = location === 'fridge' 
    ? ['Top Shelf', 'Middle Shelf', 'Crisper', 'Door']
    : ['Top Shelf', 'Middle Shelf', 'Bottom Shelf'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-90">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Add to Inventory</h2>
              <p className="text-sm text-slate-500">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Quantity</label>
              <div className="flex items-center justify-between border border-slate-300 rounded-lg p-2">
                <button 
                  type="button"
                  onClick={() => setQty(Math.max(0, roundToHalf(parseFloat(qty) - 0.5)))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600"
                >
                  <Minus size={16} />
                </button>
                
                <span className="text-lg font-bold text-slate-700">{qty}</span>
                
                <button 
                  type="button"
                  onClick={() => setQty(roundToHalf(parseFloat(qty) + 0.5))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Unit</label>
              <input 
                type="text" 
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="oz, lbs, units..."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Location</label>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setLocation('fridge')}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  location === 'fridge' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Fridge
              </button>
              <button 
                type="button"
                onClick={() => setLocation('pantry')}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  location === 'pantry' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pantry
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Shelf</label>
            <select 
              value={subLocation}
              onChange={(e) => setSubLocation(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {subLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {!item.category && (
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-300 font-bold text-slate-500 hover:bg-slate-50"
            >
              Skip
            </button>
            <button 
              type="submit"
              className="flex-[2] py-3 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700"
            >
              Add to {location === 'fridge' ? 'Fridge' : 'Pantry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToFridgeModal;
