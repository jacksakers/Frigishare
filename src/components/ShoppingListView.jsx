import React from 'react';
import { Check, X } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const ShoppingListView = ({ shoppingList, setShoppingList }) => {
  const { householdId } = useAuth();

  const handleToggleChecked = async (id, currentChecked) => {
    if (!householdId) return;
    
    try {
      const itemRef = doc(db, 'households', householdId, 'shopping_list', id);
      await updateDoc(itemRef, { checked: !currentChecked });
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  const handleRemoveItem = async (id) => {
    if (!householdId) return;
    
    try {
      const itemRef = doc(db, 'households', householdId, 'shopping_list', id);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleAddItem = async (e) => {
    if(e.key === 'Enter' && e.currentTarget.value) {
      if (!householdId) return;

      try {
        const shoppingRef = collection(db, 'households', householdId, 'shopping_list');
        await addDoc(shoppingRef, {
          name: e.currentTarget.value,
          checked: false,
          autoAdded: false
        });
        e.currentTarget.value = '';
      } catch (error) {
        console.error('Error adding item:', error);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-[60vh] rounded-xl shadow-lg p-6 relative">
      {/* Skeuomorphic Notebook Spiral */}
      <div className="absolute top-0 left-0 w-full h-8 flex justify-evenly">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="w-4 h-8 bg-slate-300 rounded-full -mt-4 shadow-inner border border-slate-400"></div>
        ))}
      </div>

      <h2 className="text-2xl font-handwriting text-center mb-8 mt-4 text-slate-600 border-b-2 border-slate-100 pb-4">
        Shopping List
      </h2>

      <div className="space-y-3">
        {shoppingList.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg group">
            <button 
              onClick={() => handleToggleChecked(item.id, item.checked)}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}
            >
              {item.checked && <Check size={16} className="text-white" />}
            </button>
            <span className={`flex-1 text-lg ${item.checked ? 'line-through text-slate-300' : 'text-slate-700'}`}>
              {item.name}
            </span>
            {item.autoAdded && !item.checked && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                Auto-Added
              </span>
            )}
            <button 
              onClick={() => handleRemoveItem(item.id)}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
            >
              <X size={18}/>
            </button>
          </div>
        ))}
        {shoppingList.length === 0 && (
          <div className="text-center py-10 text-slate-400">Everything is stocked!</div>
        )}
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-100">
        <input 
          type="text" 
          placeholder="Add item..." 
          className="w-full bg-slate-50 border-b border-slate-300 p-2 outline-none focus:border-slate-500"
          onKeyDown={handleAddItem}
        />
      </div>
    </div>
  );
};

export default ShoppingListView;
