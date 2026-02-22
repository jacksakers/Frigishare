import React, { useState } from 'react';
import { Edit, X, StickyNote } from 'lucide-react';
import { CATEGORIES } from '../utils/helpers';

const EditShoppingItemModal = ({ item, isOpen, onClose, onUpdate }) => {
  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState(item?.category || 'other');
  const [note, setNote] = useState(item?.note || '');

  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      ...item,
      name,
      category,
      note
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-90">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Edit size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Edit Item</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Item Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., Milk, Eggs, Bread..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
              <StickyNote size={16} />
              Note (Optional)
            </label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="e.g., Get the organic one, 2%, etc."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-300 font-bold text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditShoppingItemModal;
