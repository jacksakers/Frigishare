import React from 'react';
import { X } from 'lucide-react';

const AddItemModal = ({ isOpen, onClose, onSubmit, currentLocation }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-emerald-500 p-4 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg">Add Grocery</h3>
          <button onClick={onClose}><X/></button>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
              <input 
                required 
                name="name" 
                className="w-full p-2 bg-slate-50 rounded border border-slate-200" 
                placeholder="e.g. Greek Yogurt" 
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Qty</label>
              <div className="flex">
                <input 
                  required 
                  name="qty" 
                  type="number" 
                  step="0.1" 
                  className="w-1/2 p-2 bg-slate-50 rounded-l border border-slate-200" 
                  defaultValue="1" 
                />
                <select 
                  name="unit" 
                  className="w-1/2 p-2 bg-slate-100 rounded-r border-y border-r border-slate-200 text-sm"
                >
                  <option value="count">count</option>
                  <option value="oz">oz</option>
                  <option value="lbs">lbs</option>
                  <option value="gallon">gal</option>
                  <option value="bottle">bottle</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
              <select name="category" className="w-full p-2 bg-slate-50 rounded border border-slate-200">
                <option value="fruit">Fruit</option>
                <option value="veg">Vegetable</option>
                <option value="dairy">Dairy/Egg</option>
                <option value="meat">Meat</option>
                <option value="grain">Grain/Bread</option>
                <option value="condiment">Condiment</option>
                <option value="drink">Beverage</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                <span>Weekly Consumption</span>
                <span className="text-slate-400 font-normal normal-case">How much you use/week</span>
              </label>
              <input 
                name="weeklyUsage" 
                type="number" 
                step="0.5" 
                className="w-full p-2 bg-slate-50 rounded border border-slate-200" 
                defaultValue="0" 
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Min Threshold</label>
              <input 
                name="minThreshold" 
                type="number" 
                step="0.5" 
                className="w-full p-2 bg-slate-50 rounded border border-slate-200" 
                defaultValue="1" 
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Sticky Note</label>
              <input 
                name="note" 
                className="w-full p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800" 
                placeholder="e.g. For Jerry" 
              />
            </div>

            <input 
              type="hidden" 
              name="subLocation" 
              value={currentLocation === 'fridge' ? 'Middle Shelf' : 'Top Shelf'} 
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-emerald-500 text-white p-3 rounded-lg font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600"
          >
            Add to {currentLocation === 'fridge' ? 'Fridge' : 'Pantry'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
