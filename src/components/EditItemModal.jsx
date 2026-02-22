import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, ShoppingCart, Plus, Minus } from 'lucide-react';
import { CATEGORIES, roundToHalf } from '../utils/helpers';

const EditItemModal = ({ item, onClose, onSubmit, onDelete, onAddToCart }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [qty, setQty] = useState(0);
  const [weeklyUsage, setWeeklyUsage] = useState(0);
  const [minThreshold, setMinThreshold] = useState(0);
  
  // Update state when item changes
  useEffect(() => {
    if (item) {
      setQty(item.qty || 0);
      setWeeklyUsage(item.weeklyUsage || 0);
      setMinThreshold(item.minThreshold || 0);
    }
  }, [item]);
  
  if (!item) return null;

  const handleSubmitWithState = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.set('qty', qty.toString());
    formData.set('weeklyUsage', weeklyUsage.toString());
    formData.set('minThreshold', minThreshold.toString());
    
    // Create a new event with the updated form data
    const newEvent = {
      ...e,
      target: e.target,
      preventDefault: () => {}
    };
    Object.defineProperty(newEvent.target, 'elements', {
      value: e.target.elements,
      writable: false
    });
    
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-700 p-4 text-white flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-bold text-lg">Edit {item.name}</h3>
          <button onClick={onClose}><X/></button>
        </div>
        <form onSubmit={handleSubmitWithState} className="p-4 space-y-4">
          {/* Main Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
              <input 
                required 
                name="name" 
                defaultValue={item.name} 
                className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Quantity</label>
                <input type="hidden" name="qty" value={qty} />
                <div className="flex items-center justify-between bg-slate-50 rounded border border-slate-200 p-2 mt-1">
                  <button 
                    type="button"
                    onClick={() => setQty(Math.max(0, roundToHalf(qty - 0.5)))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600"
                  >
                    <Minus size={16} />
                  </button>
                  
                  <span className="text-lg font-bold text-slate-700">{qty}</span>
                  
                  <button 
                    type="button"
                    onClick={() => setQty(roundToHalf(qty + 0.5))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Unit</label>
                <input 
                  name="unit" 
                  defaultValue={item.unit} 
                  className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Shelf Location</label>
              <select 
                name="subLocation" 
                defaultValue={item.subLocation} 
                className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1"
              >
                <option>Top Shelf</option>
                <option>Middle Shelf</option>
                <option>Bottom Shelf</option>
                <option>Crisper</option>
                <option>Door</option>
              </select>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button 
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-3 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition"
          >
            <span className="text-sm font-bold">Advanced Settings</span>
            {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {/* Advanced Settings Section */}
          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Storage Location</label>
                <div className="flex gap-2 mt-1">
                  <label className="flex-1 p-2 border border-slate-200 rounded cursor-pointer hover:bg-slate-50 flex items-center">
                    <input 
                      type="radio" 
                      name="location" 
                      value="fridge" 
                      defaultChecked={item.location === 'fridge'}
                      className="mr-2"
                    />
                    <span className="text-sm">Fridge</span>
                  </label>
                  <label className="flex-1 p-2 border border-slate-200 rounded cursor-pointer hover:bg-slate-50 flex items-center">
                    <input 
                      type="radio" 
                      name="location" 
                      value="pantry" 
                      defaultChecked={item.location === 'pantry'}
                      className="mr-2"
                    />
                    <span className="text-sm">Pantry</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <select 
                  name="category" 
                  defaultValue={item.category} 
                  className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                  <span>Weekly Consumption</span>
                  <span className="text-slate-400 font-normal normal-case">How much you use/week</span>
                </label>
                <input type="hidden" name="weeklyUsage" value={weeklyUsage} />
                <div className="flex items-center justify-between bg-slate-50 rounded border border-slate-200 p-2 mt-1">
                  <button 
                    type="button"
                    onClick={() => setWeeklyUsage(Math.max(0, roundToHalf(weeklyUsage - 0.5)))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600"
                  >
                    <Minus size={16} />
                  </button>
                  
                  <span className="text-lg font-bold text-slate-700">{weeklyUsage}</span>
                  
                  <button 
                    type="button"
                    onClick={() => setWeeklyUsage(roundToHalf(weeklyUsage + 0.5))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Min Threshold</label>
                <input type="hidden" name="minThreshold" value={minThreshold} />
                <div className="flex items-center justify-between bg-slate-50 rounded border border-slate-200 p-2 mt-1">
                  <button 
                    type="button"
                    onClick={() => setMinThreshold(Math.max(0, roundToHalf(minThreshold - 0.5)))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600"
                  >
                    <Minus size={16} />
                  </button>
                  
                  <span className="text-lg font-bold text-slate-700">{minThreshold}</span>
                  
                  <button 
                    type="button"
                    onClick={() => setMinThreshold(roundToHalf(minThreshold + 0.5))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Sticky Note</label>
                <input 
                  name="note" 
                  defaultValue={item.note} 
                  className="w-full p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 mt-1" 
                  placeholder="e.g. For Jerry" 
                />
              </div>
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <button 
              type="button" 
              onClick={() => onDelete(item.id)} 
              className="flex-1 bg-red-100 text-red-600 p-3 rounded-lg font-bold hover:bg-red-200"
            >
              Delete
            </button>
            {onAddToCart && (
              <button 
                type="button" 
                onClick={() => {
                  onAddToCart(item);
                  onClose();
                }} 
                className="flex-1 bg-blue-100 text-blue-600 p-3 rounded-lg font-bold hover:bg-blue-200 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                Cart
              </button>
            )}
            <button 
              type="submit" 
              className="flex-[2] bg-slate-800 text-white p-3 rounded-lg font-bold hover:bg-slate-900"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;
