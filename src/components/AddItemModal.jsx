import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

const AddItemModal = ({ isOpen, onClose, onSubmit, currentLocation }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="bg-emerald-500 p-4 text-white flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-bold text-lg">Add Grocery</h3>
          <button onClick={onClose}><X/></button>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-4">
          {/* Main Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
              <input 
                required 
                name="name" 
                className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1" 
                placeholder="e.g. Greek Yogurt" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Quantity</label>
                <input 
                  required 
                  name="qty" 
                  type="number" 
                  step="0.1" 
                  className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1" 
                  defaultValue="1" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Unit</label>
                <select 
                  name="unit" 
                  className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1"
                >
                  <option value="count">count</option>
                  <option value="oz">oz</option>
                  <option value="lbs">lbs</option>
                  <option value="gallon">gal</option>
                  <option value="bottle">bottle</option>
                  <option value="carton">carton</option>
                  <option value="bag">bag</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Shelf Location</label>
              <select 
                name="subLocation" 
                className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1"
                defaultValue={currentLocation === 'fridge' ? 'Middle Shelf' : 'Top Shelf'}
              >
                {currentLocation === 'fridge' ? (
                  <>
                    <option>Top Shelf</option>
                    <option>Middle Shelf</option>
                    <option>Crisper</option>
                    <option>Door</option>
                  </>
                ) : (
                  <>
                    <option>Top Shelf</option>
                    <option>Middle Shelf</option>
                    <option>Bottom Shelf</option>
                  </>
                )}
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
                      defaultChecked={currentLocation === 'fridge'}
                      className="mr-2"
                    />
                    <span className="text-sm">Fridge</span>
                  </label>
                  <label className="flex-1 p-2 border border-slate-200 rounded cursor-pointer hover:bg-slate-50 flex items-center">
                    <input 
                      type="radio" 
                      name="location" 
                      value="pantry" 
                      defaultChecked={currentLocation === 'pantry'}
                      className="mr-2"
                    />
                    <span className="text-sm">Pantry</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <select name="category" className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1">
                  <option value="fruit">Fruit</option>
                  <option value="veg">Vegetable</option>
                  <option value="dairy">Dairy/Egg</option>
                  <option value="meat">Meat</option>
                  <option value="grain">Grain/Bread</option>
                  <option value="condiment">Condiment</option>
                  <option value="drink">Beverage</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                  <span>Weekly Consumption</span>
                  <span className="text-slate-400 font-normal normal-case">How much you use/week</span>
                </label>
                <input 
                  name="weeklyUsage" 
                  type="number" 
                  step="0.5" 
                  className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1" 
                  defaultValue="0" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Min Threshold</label>
                <input 
                  name="minThreshold" 
                  type="number" 
                  step="0.5" 
                  className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1" 
                  defaultValue="1" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Sticky Note</label>
                <input 
                  name="note" 
                  className="w-full p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 mt-1" 
                  placeholder="e.g. For Jerry" 
                />
              </div>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-emerald-500 text-white p-3 rounded-lg font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 mt-6"
          >
            Add to {currentLocation === 'fridge' ? 'Fridge' : 'Pantry'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
