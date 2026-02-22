import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { CATEGORIES, getPreviousItem } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';

const AddItemModal = ({ isOpen, onClose, onSubmit, currentLocation, selectedShelf }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [itemName, setItemName] = useState('');
  const [previousItemData, setPreviousItemData] = useState(null);
  const { householdId } = useAuth();
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setItemName('');
      setPreviousItemData(null);
      setShowAdvanced(false);
    }
  }, [isOpen]);
  
  // Check for previous item when name changes
  const handleNameChange = async (e) => {
    const name = e.target.value;
    setItemName(name);
    
    if (name.trim().length > 2) {
      const previous = await getPreviousItem(db, householdId, name);
      if (previous) {
        setPreviousItemData(previous);
      } else {
        setPreviousItemData(null);
      }
    } else {
      setPreviousItemData(null);
    }
  };
  
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
                value={itemName}
                onChange={handleNameChange}
                className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1" 
                placeholder="e.g. Greek Yogurt" 
              />
              {previousItemData && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <span>✓</span> Found in history - defaults loaded
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Quantity</label>
                <input 
                  required 
                  name="qty" 
                  type="number" 
                  step="0.5" 
                  min="0"
                  className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1" 
                  defaultValue="1" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Unit</label>
                <select 
                  name="unit" 
                  className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1"
                  defaultValue={previousItemData?.unit || "servings"}
                  key={previousItemData?.unit || "default"}
                >
                  <option value="servings">servings</option>
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
                defaultValue={previousItemData?.subLocation || selectedShelf || (currentLocation === 'fridge' ? 'Middle Shelf' : 'Top Shelf')}
                key={previousItemData ? `subloc-${previousItemData.subLocation}` : 'default-subloc'}
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
                      defaultChecked={(previousItemData?.location || currentLocation) === 'fridge'}
                      className="mr-2"
                      key={previousItemData ? `loc-fridge-${previousItemData.location}` : 'default-loc-fridge'}
                    />
                    <span className="text-sm">Fridge</span>
                  </label>
                  <label className="flex-1 p-2 border border-slate-200 rounded cursor-pointer hover:bg-slate-50 flex items-center">
                    <input 
                      type="radio" 
                      name="location" 
                      value="pantry" 
                      defaultChecked={(previousItemData?.location || currentLocation) === 'pantry'}
                      className="mr-2"
                      key={previousItemData ? `loc-pantry-${previousItemData.location}` : 'default-loc-pantry'}
                    />
                    <span className="text-sm">Pantry</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <select 
                  name="category" 
                  className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1"
                  defaultValue={previousItemData?.category || 'other'}
                  key={previousItemData?.category || 'default-cat'}
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
                <input 
                  name="weeklyUsage" 
                  type="number" 
                  step="0.5" 
                  className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1" 
                  defaultValue={previousItemData?.weeklyUsage || "0"}
                  key={previousItemData ? `weekly-${previousItemData.weeklyUsage}` : 'default-weekly'}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Min Threshold</label>
                <input 
                  name="minThreshold" 
                  type="number" 
                  step="0.5" 
                  className="w-full p-2 bg-slate-50 rounded border border-slate-200 mt-1" 
                  defaultValue={previousItemData?.minThreshold || "1"}
                  key={previousItemData ? `threshold-${previousItemData.minThreshold}` : 'default-threshold'}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Sticky Note</label>
                <input 
                  name="note" 
                  className="w-full p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 mt-1" 
                  placeholder="e.g. For Jerry"
                  defaultValue={previousItemData?.note || ""}
                  key={previousItemData ? `note-${previousItemData.note}` : 'default-note'}
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
