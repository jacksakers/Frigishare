import React, { useState } from 'react';
import { Check, X, StickyNote, Edit, ArrowUpDown } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { getCategoryEmoji, getCategoryLabel, getCategorySortOrder, CATEGORIES, generateItemId, saveToPreviousItems, getPreviousItem } from '../utils/helpers';
import EditShoppingItemModal from './EditShoppingItemModal';

const ShoppingListView = ({ shoppingList, setShoppingList, onAddToFridge }) => {
  const { householdId } = useAuth();
  const [sortBy, setSortBy] = useState('default'); // default, category, name
  const [editingItem, setEditingItem] = useState(null);
  // State for the import feature
  const [pastedText, setPastedText] = useState('');

  /**
   * Parses and imports items from pasted text.
   */
  const handleImport = async () => {
    if (!householdId || !pastedText) return;

    const lines = pastedText.split('\n').map(line => line.trim()).filter(line => line);
    let importedCount = 0;
    let failedCount = 0;

    for (const line of lines) {
      // Regex to capture status ([ ] or [v]) and the item name after trimming whitespace.
      const match = line.match(/^\[\s*([ ]|v)\s*\]\s*(.*)$/);
      if (!match) {
        console.warn('Skipping invalid line format:', line);
        failedCount++;
        continue;
      }

      const isChecked = match[1] === 'v'; // True if matched [v], False if matched [ ]
      const itemName = match[2].trim();

      if (!itemName) {
        console.warn('Skipping line with no item name.');
        failedCount++;
        continue;
      }

      try {
        // Check if we have this item in previous items (for category/notes)
        const previousItem = await getPreviousItem(db, householdId, itemName);
        
        const shoppingRef = collection(db, 'households', householdId, 'shopping_list');
        // Check if the item already exists in Firestore to prevent duplicates/errors
        // A simple check based on name for now, assuming names are unique enough or we handle updates.
        const existingDocs = await getDocs(query(shoppingRef, where("name", "==", itemName)));

        if (existingDocs.empty) {
          // Item does not exist, create a new record
          await addDoc(shoppingRef, {
            name: itemName,
            checked: isChecked, // Set initial checked status based on paste
            autoAdded: true,
            category: previousItem?.category || 'other',
            note: previousItem?.note || '',
            source: 'Import'
          });
        } else {
          // Item exists, update its status (checked/unchecked) and potentially category/notes if needed
          for (const docSnap of existingDocs.docs) {
            const itemRef = doc(db, 'households', householdId, 'shopping_list', docSnap.id);
            await updateDoc(itemRef, {
              checked: isChecked,
              // We could also update category/note here if the imported item differs significantly from stored data
            });
          }
        }
        importedCount++;
      } catch (error) {
        console.error('Error importing item:', error);
        failedCount++;
      }
    }

    // Clear the input field and notify user
    setPastedText('');
    alert(`Import complete! Successfully imported ${importedCount} items. Failed to import ${failedCount} items.`);
  };

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
        
        // Check for previous item data to get purchase amount
        const previousItem = await getPreviousItem(db, householdId, item.name);
        const purchaseAmount = previousItem?.purchaseAmount || 1;
        
        if (existingDoc.exists()) {
          // Item exists in fridge, increment quantity by purchase amount
          const existingData = existingDoc.data();
          await updateDoc(itemRef, {
            qty: Math.max(0, existingData.qty + purchaseAmount)
          });
        } else {
          // New item, add to fridge with saved location or default to middle shelf
          await setDoc(itemRef, {
            name: item.name,
            location: previousItem?.location || 'fridge',
            subLocation: previousItem?.subLocation || 'Middle Shelf',
            category: item.category || previousItem?.category || 'other',
            qty: purchaseAmount,
            unit: previousItem?.unit || 'servings',
            weeklyUsage: previousItem?.weeklyUsage || 0,
            minThreshold: previousItem?.minThreshold || 1,
            purchaseAmount: purchaseAmount,
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

  const sortedList = getSortedList();
  const groupedList = getGroupedList();


  // Helper component for displaying a single item in the list
  const ShoppingItem = ({ item, onToggleChecked, onRemove, onEdit }) => {
    const categoryEmoji = getCategoryEmoji(item.category);

    return (
      <div className="flex items-center py-3 border-b last:border-b-0">
        {/* Checkbox */}
        <input 
          type="checkbox" 
          checked={item.checked} 
          onChange={() => onToggleChecked(item.id, item.checked, item)}
          className="mr-3 h-5 w-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />

        {/* Item Name */}
        <div className={`flex-grow ${item.checked ? 'line-through text-gray-500' : 'text-gray-800'}`}>
          <span className="font-semibold">{item.name}</span>
        </div>

        {/* Category/Notes (Optional) */}
        <div className="flex flex-col items-end text-sm mr-4">
          <span className={`text-${item.category === 'dairy' ? 'blue' : item.category === 'produce' ? 'green' : 'gray'}-600`}>
            {categoryEmoji} {getCategoryLabel(item.category)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button 
            onClick={() => onEdit(item)}
            className="p-1 text-gray-500 hover:text-indigo-600 transition duration-150"
            aria-label={`Edit ${item.name}`}
          >
            <Edit className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onRemove(item.id)}
            className="p-1 text-gray-500 hover:text-red-600 transition duration-150"
            aria-label={`Remove ${item.name}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // Helper component for the modal form
  const ItemForm = ({ onSubmit, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [category, setCategory] = useState(initialData?.category || 'other');
    const [note, setNote] = useState(initialData?.note || '');

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({ name, category, note });
    };

    return (
      <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm bg-white space-y-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Item Name</label>
          <input 
            id="name" 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" 
            required
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <select 
            id="category" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {Object.keys(CATEGORIES).map(cat => (
              <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea 
            id="note" 
            rows="2" 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>
        <button 
          type="submit" 
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Changes
        </button>
      </form>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Shopping List</h1>

      {/* Import Section */}
      <div className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-indigo-800 mb-3 flex items-center">
          Import Items <span className="ml-2 text-sm">(Paste list below)</span>
        </h2>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          placeholder="Example: [ ] Milk\n[v] Apples\n[ ] Bread"
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          rows="4"
        />
        <button 
          onClick={handleImport}
          disabled={!householdId || !pastedText}
          className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 disabled:opacity-50 transition duration-150"
        >
          Import List
        </button>
      </div>

      {/* Sorting/Filtering Controls */}
      <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex space-x-2 text-sm font-medium text-gray-700">
          <span>Sort by:</span>
          {/* Dropdown for sorting */}
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="p-1 border rounded cursor-pointer focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="default">Default</option>
            <option value="category">Category</option>
            <option value="name">Name</option>
          </select>
        </div>
        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button 
            onClick={() => handleClearChecked()}
            disabled={shoppingList.filter(item => item.checked).length === 0}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-md shadow hover:bg-red-600 disabled:opacity-50 transition duration-150"
          >
            Clear Checked Items
          </button>
        </div>
      </div>

      {/* Shopping List Display */}
      <div className="bg-white border rounded-xl shadow-lg divide-y divide-gray-100">
        <div className="p-4 bg-indigo-50/50 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Shopping List ({shoppingList.length} items)</h2>
            {/* Add Item Input */}
            <div className="flex space-x-2">
                <input 
                    type="text"
                    className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 flex-grow"
                    placeholder="Add item name (e.g., Milk)"
                    value={editingItem ? '' : ''} // Clear input when editing, or if no edit is active
                    onChange={(e) => {
                        // If we are not in an edit modal, just set the value for submission
                        if (!editingItem) {
                            // We handle state change via submit button click listener logic below
                        }
                    }}
                    onKeyDown={handleAddItem} // Use onKeyDown to capture Enter key press
                />
                <button 
                    onClick={(e) => {
                        // Manually trigger add item if the input field is focused and has text
                         if(e.key === 'Enter' && e.currentTarget.value) {
                             handleAddItem(e);
                         } else {
                            // If not pressing enter, just rely on the Enter key handler above
                         }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition duration-150"
                >
                    Add
                </button>
            </div>
        </div>

        {/* Grouped List Rendering */}
        {groupedList.map((group, groupIndex) => (
          <div key={group.category} className="divide-y divide-gray-200">
            {/* Category Header */}
            <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
                <h3 className="text-lg font-bold text-indigo-700 flex items-center">
                    <span className={`mr-2 text-${group.category === 'dairy' ? 'blue' : group.category === 'produce' ? 'green' : 'gray'}-500`}>
                        {getCategoryEmoji(group.category)}
                    </span>
                    {getCategoryLabel(group.category)}
                </h3>
                <span className="text-sm font-medium text-gray-500">{group.items.length} items</span>
            </div>

            {/* Items in the group */}
            {group.items.map((item) => (
              <div key={item.id}>
                <ShoppingItem 
                    item={item} 
                    onToggleChecked={handleToggleChecked} 
                    onRemove={handleRemoveItem} 
                    onEdit={(editItem) => {
                        setEditingItem(editItem);
                    }}
                />
              </div>
            ))}
          </div>
        ))}

      </div>

      {/* Edit Modal/Form */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Edit Item: {editingItem.name}</h3>
                <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className='p-6'>
              <ItemForm 
                onSubmit={handleUpdateItem} 
                initialData={editingItem} 
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShoppingListView;