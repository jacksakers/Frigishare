import React, { useState } from 'react';
import { Check, X, StickyNote, Edit, ArrowUpDown } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { getCategoryEmoji, generateItemId } from '../utils/helpers';
import EditShoppingItemModal from './EditShoppingItemModal';

const ShoppingListView = ({ shoppingList, setShoppingList, onAddToFridge }) => {
  const { householdId } = useAuth();
  const [sortBy, setSortBy] = useState('default'); // default, category, name
  const [editingItem, setEditingItem] = useState(null);

  const handleToggleChecked = async (id, currentChecked, item) => {
    if (!householdId) return;
    
    try {
      // If checking the item (buying it), add to fridge automatically and mark as checked
      if (!currentChecked) {
        const itemId = generateItemId(item.name);
        const itemRef = doc(db, 'households', householdId, 'items', itemId);
        const existingDoc = await getDoc(itemRef);
        
        if (existingDoc.exists()) {
          // Item exists in fridge, increment quantity
          const existingData = existingDoc.data();
          await updateDoc(itemRef, {
            qty: existingData.qty + 1
          });
        } else {
          // New item, add to middle shelf in fridge
          await setDoc(itemRef, {
            name: item.name,
            location: 'fridge',
            subLocation: 'Middle Shelf',
            category: item.category || 'other',
            qty: 1,
            unit: 'servings',
            weeklyUsage: 0,
            minThreshold: 1,
            note: item.note || ''
          });
        }
        
        // Mark as checked in shopping list
        const shoppingItemRef = doc(db, 'households', householdId, 'shopping_list', id);
        await updateDoc(shoppingItemRef, { checked: true });
      } else {
        // Unchecking - just update the checked status
        const itemRef = doc(db, 'households', householdId, 'shopping_list', id);
        await updateDoc(itemRef, { checked: false });
      }
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

  const handleClearChecked = async () => {
    if (!householdId) return;
    
    try {
      const checkedItems = shoppingList.filter(item => item.checked);
      for (const item of checkedItems) {
        const itemRef = doc(db, 'households', householdId, 'shopping_list', item.id);
        await deleteDoc(itemRef);
      }
    } catch (error) {
      console.error('Error clearing checked items:', error);
    }
  };

  const handleUpdateItem = async (updatedItem) => {
    if (!householdId) return;
    
    try {
      const itemRef = doc(db, 'households', householdId, 'shopping_list', updatedItem.id);
      await updateDoc(itemRef, {
        name: updatedItem.name,
        category: updatedItem.category,
        note: updatedItem.note
      });
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
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
          autoAdded: false,
          category: 'other',
          note: ''
        });
        e.currentTarget.value = '';
      } catch (error) {
        console.error('Error adding item:', error);
      }
    }
  };

  const getSortedList = () => {
    let sorted = [...shoppingList];
    
    if (sortBy === 'category') {
      const categoryOrder = ['dairy', 'produce', 'meat', 'grains', 'beverages', 'snacks', 'condiments', 'other'];
      sorted.sort((a, b) => {
        const catA = categoryOrder.indexOf(a.category || 'other');
        const catB = categoryOrder.indexOf(b.category || 'other');
        return catA - catB;
      });
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Unchecked items first
    sorted.sort((a, b) => (a.checked === b.checked) ? 0 : a.checked ? 1 : -1);
    
    return sorted;
  };

  const cycleSortMode = () => {
    const modes = ['default', 'category', 'name'];
    const currentIndex = modes.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % modes.length;
    setSortBy(modes[nextIndex]);
  };

  const sortedList = getSortedList();
  const checkedCount = shoppingList.filter(item => item.checked).length;

  return (
    <>
      <div className="max-w-md mx-auto bg-white min-h-[60vh] rounded-xl shadow-lg p-6 relative">
        {/* Skeuomorphic Notebook Spiral */}
        <div className="absolute top-0 left-0 w-full h-8 flex justify-evenly">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-4 h-8 bg-slate-300 rounded-full -mt-4 shadow-inner border border-slate-400"></div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-8 mt-4 pb-4 border-b-2 border-slate-100">
          <h2 className="text-2xl font-handwriting text-slate-600">
            Shopping List
          </h2>
          <div className="flex items-center gap-2">
            {checkedCount > 0 && (
              <button 
                onClick={handleClearChecked}
                className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-full text-red-600 font-medium"
                title="Clear checked items"
              >
                Clear ({checkedCount})
              </button>
            )}
            <button 
              onClick={cycleSortMode}
              className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full text-slate-600"
              title="Sort by"
            >
              <ArrowUpDown size={12} />
              {sortBy === 'category' && 'By Category'}
              {sortBy === 'name' && 'A-Z'}
              {sortBy === 'default' && 'Default'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {sortedList.map(item => (
            <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg group">
              <button 
                onClick={() => handleToggleChecked(item.id, item.checked, item)}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition flex-shrink-0 mt-0.5 ${item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}
              >
                {item.checked && <Check size={16} className="text-white" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  {item.category && item.category !== 'other' && (
                    <span className="text-lg flex-shrink-0">{getCategoryEmoji(item.category)}</span>
                  )}
                  <span className={`flex-1 text-lg ${item.checked ? 'line-through text-slate-300' : 'text-slate-700'}`}>
                    {item.name}
                  </span>
                  {item.note && !item.checked && (
                    <div className="relative group/note flex-shrink-0">
                      <StickyNote size={16} className="text-yellow-500" />
                      <div className="absolute right-0 top-6 bg-yellow-100 border border-yellow-300 rounded-lg p-2 text-xs text-slate-700 w-48 shadow-lg z-10 hidden group-hover/note:block">
                        {item.note}
                      </div>
                    </div>
                  )}
                </div>
                {item.autoAdded && !item.checked && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full inline-block mt-1">
                    Auto-Added
                  </span>
                )}
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                <button 
                  onClick={() => setEditingItem(item)}
                  className="text-blue-400 hover:text-blue-600 p-1"
                  title="Edit item"
                >
                  <Edit size={16}/>
                </button>
                <button 
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-400 hover:text-red-600 p-1"
                  title="Remove item"
                >
                  <X size={16}/>
                </button>
              </div>
            </div>
          ))}
          {shoppingList.length === 0 && (
            <div className="text-center py-10 text-slate-400">Everything is stocked!</div>
          )}
        </div>
        
        <div className="mt-8 pt-4 border-t border-slate-100">
          <input 
            type="text" 
            placeholder="Add item... (press Enter)" 
            className="w-full bg-slate-50 border-b border-slate-300 p-2 outline-none focus:border-slate-500"
            onKeyDown={handleAddItem}
          />
        </div>
      </div>

      <EditShoppingItemModal 
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onUpdate={handleUpdateItem}
      />
    </>
  );
};

export default ShoppingListView;
