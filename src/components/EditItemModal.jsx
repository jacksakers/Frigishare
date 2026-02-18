import React from 'react';
import { X } from 'lucide-react';

const EditItemModal = ({ item, onClose, onSubmit, onDelete }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="bg-slate-700 p-4 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg">Edit {item.name}</h3>
          <button onClick={onClose}><X/></button>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
              <input 
                required 
                name="name" 
                defaultValue={item.name} 
                className="w-full p-2 bg-slate-50 rounded border border-slate-200" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Qty</label>
              <input 
                required 
                name="qty" 
                type="number" 
                step="0.1" 
                defaultValue={item.qty} 
                className="w-full p-2 bg-slate-50 rounded border border-slate-200" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Unit</label>
              <input 
                name="unit" 
                defaultValue={item.unit} 
                className="w-full p-2 bg-slate-50 rounded border border-slate-200" 
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Shelf / Location</label>
              <select 
                name="subLocation" 
                defaultValue={item.subLocation} 
                className="w-full p-2 bg-slate-50 rounded border border-slate-200"
              >
                <option>Top Shelf</option>
                <option>Middle Shelf</option>
                <option>Bottom Shelf</option>
                <option>Crisper</option>
                <option>Door</option>
              </select>
            </div>
            
            {/* Hidden fields for simplicity in demo */}
            <input type="hidden" name="category" value={item.category} />
            <input type="hidden" name="weeklyUsage" value={item.weeklyUsage} />
            <input type="hidden" name="minThreshold" value={item.minThreshold} />

            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Sticky Note</label>
              <input 
                name="note" 
                defaultValue={item.note} 
                className="w-full p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800" 
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => onDelete(item.id)} 
              className="flex-1 bg-red-100 text-red-600 p-3 rounded-lg font-bold hover:bg-red-200"
            >
              Delete
            </button>
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
