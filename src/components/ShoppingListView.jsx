import React, { useState } from 'react';
import { Check, X, StickyNote, Edit, ArrowUpDown } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { getCategoryEmoji, getCategoryLabel, getCategorySortOrder, CATEGORIES, generateItemId, saveToPreviousItems, getPreviousItem } from '../utils/helpers';
import EditShoppingItemModal from './EditShoppingItemModal';

const ShoppingListView = ({ shoppingList, setShoppingList, onAddToFridge }) => {
  const { householdId } = useAuth();
  const [sortBy, setSortBy] = useState('default'); // default, category, name
  const [editingItem, setEditingItem] = useState(null);

  const handleToggleChecked = async (id, currentChecked, item) => {
    if (!householdId) return;
    
    try {
      // First, verify the shopping list item exists
      const shoppingItemRef = doc(db, 'households', householdId, 'shopping_list', id);
      const shoppingItemDoc = await getDoc(shoppingItemRef);
      
      // If the shopping item doesn't exist, remove it from local state
      if (!shoppingItemDoc.exists()) {
        console.warn('Shopping list item no longer exists in Firestore, removing from local state');
        setShoppingList(prev => prev.filter(item => item.id !== id));
        return;
      }
      
      // If checking the item (buying it), add to fridge automatically and mark as checked
      if (!currentChecked) {
        const itemId = generateItemId(item.name);
        const itemRef = doc(db, 'households', householdId, 'items', itemId);
        const existingDoc = await getDoc(itemRef);
        
        if (existingDoc.exists()) {
          // Item exists in fridge, increment quantity
          const existingData = existingDoc.data();
          await updateDoc(itemRef, {
            qty: Math.max(0, existingData.qty + 1)
          });
        } else {
          // Check for previous item data to get better defaults
          const previousItem = await getPreviousItem(db, householdId, item.name);
          
          // New item, add to fridge with saved location or default to middle shelf
          await setDoc(itemRef, {
            name: item.name,
            location: previousItem?.location || 'fridge',
            subLocation: previousItem?.subLocation || 'Middle Shelf',
            category: item.category || previousItem?.category || 'other',
            qty: 1,
            unit: previousItem?.unit || 'servings',
            weeklyUsage: previousItem?.weeklyUsage || 0,
            minThreshold: previousItem?.minThreshold || 1,
            note: item.note || previousItem?.note || ''
          });
        }
        
        // Mark as checked in shopping list
        await updateDoc(shoppingItemRef, { checked: true });
      } else {
        // Unchecking - just update the checked status
        await updateDoc(shoppingItemRef, { checked: false });
      }
    } catch (error) {
      console.error('Error toggling item:', error);
      // If the error is about a missing document, clean up local state
      if (error.code === 'not-found') {
        console.warn('Document not found, removing from local state');
        setShoppingList(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  const handleRemoveItem = async (id) => {
    if (!householdId) return;
    
    try {
      // Save to previous items before deleting
      const itemToDelete = shoppingList.find(item => item.id === id);
      if (itemToDelete) {
        await saveToPreviousItems(db, householdId, itemToDelete);
      }
      
      const itemRef = doc(db, 'households', householdId, 'shopping_list', id);
      const docSnap = await getDoc(itemRef);
      
      // Only try to delete if it exists
      if (docSnap.exists()) {
        await deleteDoc(itemRef);
      } else {
        // Document doesn't exist, just clean up local state
        console.warn('Shopping list item already deleted, updating local state');
        setShoppingList(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Error removing item:', error);
      // Clean up local state even if there's an error
      if (error.code === 'not-found') {
        setShoppingList(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  const handleClearChecked = async () => {
    if (!householdId) return;
    
    try {
      const checkedItems = shoppingList.filter(item => item.checked);
      for (const item of checkedItems) {
        try {
          // Save to previous items before deleting
          await saveToPreviousItems(db, householdId, item);
          
          const itemRef = doc(db, 'households', householdId, 'shopping_list', item.id);
          const docSnap = await getDoc(itemRef);
          
          // Only delete if it exists
          if (docSnap.exists()) {
            await deleteDoc(itemRef);
          }
        } catch (itemError) {
          console.warn(`Could not delete item ${item.id}:`, itemError);
          // Continue with other items
        }
      }
    } catch (error) {
      console.error('Error clearing checked items:', error);
    }
  };

  const handleUpdateItem = async (updatedItem) => {
    if (!householdId) return;
    
    try {
      const itemRef = doc(db, 'households', householdId, 'shopping_list', updatedItem.id);
      const docSnap = await getDoc(itemRef);
      
      if (!docSnap.exists()) {
        console.warn('Shopping list item no longer exists, removing from local state');
        setShoppingList(prev => prev.filter(item => item.id !== updatedItem.id));
        setEditingItem(null);
        return;
      }
      
      await updateDoc(itemRef, {
        name: updatedItem.name,
        category: updatedItem.category,
        note: updatedItem.note
      });
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
      if (error.code === 'not-found') {
        setShoppingList(prev => prev.filter(item => item.id !== updatedItem.id));
        setEditingItem(null);
      }
    }
  };

  const handleAddItem = async (e) => {
    if(e.key === 'Enter' && e.currentTarget.value) {
      if (!householdId) return;

      try {
        const itemName = e.currentTarget.value;
        
        // Check if we have this item in previous items
        const previousItem = await getPreviousItem(db, householdId, itemName);
        
        const shoppingRef = collection(db, 'households', householdId, 'shopping_list');
        await addDoc(shoppingRef, {
          name: itemName,
          checked: false,
          autoAdded: false,
          category: previousItem?.category || 'other',
          note: previousItem?.note || ''
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
      const categoryOrder = getCategorySortOrder();
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

  // Group items by category for display (only when sorted by category)
  const getGroupedList = () => {
    if (sortBy !== 'category') {
      return [{ items: sortedList }];
    }

    const groups = [];
    const categoryMap = new Map();

    sortedList.forEach(item => {
      const category = item.category || 'other';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category).push(item);
    });

    // Create groups in the correct order
    getCategorySortOrder().forEach(catValue => {
      if (categoryMap.has(catValue) && categoryMap.get(catValue).length > 0) {
        groups.push({
          category: catValue,
          items: categoryMap.get(catValue)
        });
      }
    });

    return groups;
  };

  const cycleSortMode = () => {
    const modes = ['default', 'category', 'name'];
    const currentIndex = modes.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % modes.length;
    setSortBy(modes[nextIndex]);
  };

  const sortedList = getSortedList();
  const groupedList = getGroupedList();
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
          {groupedList.map((group, groupIndex) => (
            <div key={group.category || `group-${groupIndex}`}>
              {/* Category Header (only shown when sorted by category) */}
              {group.category && sortBy === 'category' && (
                <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
                  <span className="text-xl">{getCategoryEmoji(group.category)}</span>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                    {getCategoryLabel(group.category)}
                  </h3>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>
              )}
              
              {/* Items in this category/group */}
              {group.items.map(item => (
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
