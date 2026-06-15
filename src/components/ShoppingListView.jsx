    1 | import React, { useState } from 'react';
    2 | import { Check, X, StickyNote, Edit, ArrowUpDown } from 'lucide-react';
    3 | import { db } from '../firebase/config';
    4 | import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
    5 | import { useAuth } from '../context/AuthContext';
    6 | import { getCategoryEmoji, getCategoryLabel, getCategorySortOrder, CATEGORIES, generateItemId, saveToPreviousItems, getPreviousItem } from '../utils/helpers';
    7 | import EditShoppingItemModal from './EditShoppingItemModal';
    8 | 
    9 | const ShoppingListView = ({ shoppingList, setShoppingList, onAddToFridge }) => {
   10 |   const { householdId } = useAuth();
   11 |   const [sortBy, setSortBy] = useState('default'); // default, category, name
   12 |   const [editingItem, setEditingItem] = useState(null);
   13 |   // State for the import feature
   14 |   const [pastedText, setPastedText] = useState('');
   15 | 
   16 |   /**
   17 |    * Parses and imports items from pasted text.
   18 |    */
   19 |  const handleImport = async () => {
   20 |    if (!householdId || !pastedText) return;
   21 | 
   22 |    const lines = pastedText.split('\\n').map(line => line.trim()).filter(line => line);
   23 |    let importedCount = 0;
   24 |    let failedCount = 0;
   25 | 
   26 |    for (const line of lines) {
   27 |      // Regex to capture status ([ ] or [v]) and the item name after trimming whitespace.
   28 |      const match = line.match(/^\[\s*([ ]|v)\s*\]\s*(.*)$/);
   29 |      if (!match) {
   30 |        console.warn('Skipping invalid line format:', line);
   31 |        failedCount++;
   32 |        continue;
   33 |      }
   34 | 
   35 |      const isChecked = match[1] === 'v'; // True if matched [v], False if matched [ ]
   36 |      const itemName = match[2].trim();
   37 | 
   38 |      if (!itemName) {
   39 |        console.warn('Skipping line with no item name.');
   40 |        failedCount++;
   41 |        continue;
   42 |      }
   43 | 
   44 |      try {
   45 |        // Check if we have this item in previous items (for category/notes)
   46 |        const previousItem = await getPreviousItem(db, householdId, itemName);
   47 |        
   48 |        const shoppingRef = collection(db, 'households', householdId, 'shopping_list');
   49 |        // Check if the item already exists in Firestore to prevent duplicates/errors
   50 |        // A simple check based on name for now, assuming names are unique enough or we handle updates.
   51 |        const existingDocs = await getDocs(query(shoppingRef, where("name", "==", itemName)));
   52 | 
   53 |        if (existingDocs.empty) {
   54 |          // Item does not exist, create a new record
   55 |          await addDoc(shoppingRef, {
   56 |            name: itemName,
   57 |            checked: isChecked, // Set initial checked status based on paste
   58 |            autoAdded: true,
   59 |            category: previousItem?.category || 'other',
   60 |            note: previousItem?.note || '',
   61 |            source: 'Import'
   62 |          });
   63 |        } else {
   64 |          // Item exists, update its status (checked/unchecked) and potentially category/notes if needed
   65 |          for (const docSnap of existingDocs.docs) {
   66 |            const itemRef = doc(db, 'households', householdId, 'shopping_list', docSnap.id);
   67 |            await updateDoc(itemRef, {
   68 |              checked: isChecked,
   69 |              // We could also update category/note here if the imported item differs significantly from stored data
   70 |            });
   71 |          }
   72 |        }
   73 |        importedCount++;
   74 |      } catch (error) {
   75 |        console.error('Error importing item:', error);
   76 |        failedCount++;
   77 |      }
   80 |    }
   81 | 
   82 |    // Clear the input field and notify user
   83 |    setPastedText('');
   84 |    alert(`Import complete! Successfully imported ${importedCount} items. Failed to import ${failedCount} items.`);
   85 |  };
   86 | 
   87 |   const handleToggleChecked = async (id, currentChecked, item) => {
   88 |     if (!householdId) return;
   89 |     
   90 |     try {
   91 |       // First, verify the shopping list item exists
   92 |       const shoppingItemRef = doc(db, 'households', householdId, 'shopping_list', id);
   93 |       const shoppingItemDoc = await getDoc(shoppingItemRef);
   94 |       
   95 |       // If the shopping item doesn't exist, remove it from local state
   96 |       if (!shoppingItemDoc.exists()) {
   97 |         console.warn('Shopping list item no longer exists in Firestore, removing from local state');
   102 |         setShoppingList(prev => prev.filter(item => item.id !== id));
   103 |         return;
   104 |       }
   105 |       
   106 |       // If checking the item (buying it), add to fridge automatically and mark as checked
   107 |       if (!currentChecked) {
   108 |         const itemId = generateItemId(item.name);
   109 |         const itemRef = doc(db, 'households', householdId, 'items', itemId);
   110 |         const existingDoc = await getDoc(itemRef);
   111 |         
   112 | // Check for previous item data to get purchase amount
   113 |       const previousItem = await getPreviousItem(db, householdId, item.name);
   114 |       const purchaseAmount = previousItem?.purchaseAmount || 1;
   115 |       
   116 |       if (existingDoc.exists()) {
   117 |         // Item exists in fridge, increment quantity by purchase amount
   118 |         const existingData = existingDoc.data();
   119 |         await updateDoc(itemRef, {
   120 |           qty: Math.max(0, existingData.qty + purchaseAmount)
   121 |         });
   122 |       } else {
   123 |         // New item, add to fridge with saved location or default to middle shelf
   124 |         await setDoc(itemRef, {
   125 |           name: item.name,
   126 |           location: previousItem?.location || 'fridge',
   127 |           subLocation: previousItem?.subLocation || 'Middle Shelf',
   128 |           category: item.category || previousItem?.category || 'other',
   129 |           qty: purchaseAmount,
   130 |           unit: previousItem?.unit || 'servings',
   131 |           weeklyUsage: previousItem?.weeklyUsage || 0,
   132 |           minThreshold: previousItem?.minThreshold || 1,
   133 |           purchaseAmount: purchaseAmount,
   134 |             note: item.note || previousItem?.note || ''
   135 |           });
   136 |         }
   137 |         
   138 |         // Mark as checked in shopping list
   139 |         await updateDoc(shoppingItemRef, { checked: true });
   140 |       } else {
   141 |         // Unchecking - just update the checked status
   142 |         await updateDoc(shoppingItemRef, { checked: false });
   143 |       }
   144 |     } catch (error) {
   145 |       console.error('Error toggling item:', error);
   146 |       // If the error is about a missing document, clean up local state
   147 |       if (error.code === 'not-found') {
   148 |         console.warn('Document not found, removing from local state');
   149 |         setShoppingList(prev => prev.filter(item => item.id !== id));
   150 |       }
   151 |     }
   152 |   };
   153 | 
   154 |   const handleRemoveItem = async (id) => {
   155 |     if (!householdId) return;
   156 |     
   157 |     try {
   158 |       // Save to previous items before deleting
   159 |       const itemToDelete = shoppingList.find(item => item.id === id);
   160 |       if (itemToDelete) {
   161 |         await saveToPreviousItems(db, householdId, itemToDelete);
   162 |       }
   163 |       
   164 |       const itemRef = doc(db, 'households', householdId, 'shopping_list', id);
   165 |       const docSnap = await getDoc(itemRef);
   166 |       
   167 |       // Only try to delete if it exists
   168 |       if (docSnap.exists()) {
   169 |         await deleteDoc(itemRef);
   170 |       } else {
   171 |         // Document doesn't exist, just clean up local state
   172 |         console.warn('Shopping list item already deleted, updating local state');
   173 |         setShoppingList(prev => prev.filter(item => item.id !== id));
   174 |       }
   175 |     } catch (error) {
   176 |       console.error('Error removing item:', error);
   177 |       // Clean up local state even if there's an error
   178 |       if (error.code === 'not-found') {
   179 |         setShoppingList(prev => prev.filter(item => item.id !== id));
   180 |       }
   181 |     }
   182 |   };
   183 | 
   184 |   const handleClearChecked = async () => {
   185 |     if (!householdId) return;
   186 |     
   187 |     try {
   188 |       const checkedItems = shoppingList.filter(item => item.checked);
   189 |       for (const item of checkedItems) {
   190 |         try {
   191 |           // Save to previous items before deleting
   192 |           await saveToPreviousItems(db, householdId, item);
   193 |           
   194 |           const itemRef = doc(db, 'households', householdId, 'shopping_list', item.id);
   195 |           const docSnap = await getDoc(itemRef);
   196 |           
   197 |           // Only delete if it exists
   198 |           if (docSnap.exists()) {
   199 |             await deleteDoc(itemRef);
   200 |           }
   201 |         } catch (itemError) {
   202 |           console.warn(`Could not delete item ${item.id}:`, itemError);
   203 |           // Continue with other items
   204 |         }
   205 |       }
   206 |     } catch (error) {
   207 |       console.error('Error clearing checked items:', error);
   208 |     }
   209 |   };
  210 | 
  211 |   const handleUpdateItem = async (updatedItem) => {
  212 |     if (!householdId) return;
  213 |     
  214 |     try {
  215 |       const itemRef = doc(db, 'households', householdId, 'shopping_list', updatedItem.id);
  216 |       const docSnap = await getDoc(itemRef);
  217 |       
  218 |       if (!docSnap.exists()) {
  219 |         console.warn('Shopping list item no longer exists, removing from local state');
  220 |         setShoppingList(prev => prev.filter(item => item.id !== updatedItem.id));
  221 |         setEditingItem(null);
  222 |         return;
  223 |       }
  224 |       
  225 |       await updateDoc(itemRef, {
  226 |         name: updatedItem.name,
  227 |         category: updatedItem.category,
  228 |         note: updatedItem.note
  229 |       });
  230 |       setEditingItem(null);
  231 |     } catch (error) {
  232 |       console.error('Error updating item:', error);
  233 |       if (error.code === 'not-found') {
  234 |         setShoppingList(prev => prev.filter(item => item.id !== updatedItem.id));
  235 |         setEditingItem(null);
  236 |       }
  237 |     }
  238 |   };
  239 | 
  240 |   const handleAddItem = async (e) => {
  241 |     if(e.key === 'Enter' && e.currentTarget.value) {
  242 |       if (!householdId) return;
  243 | 
  244 |       try {
  245 |         const itemName = e.currentTarget.value;
  246 |         
  247 |         // Check if we have this item in previous items
  248 |         const previousItem = await getPreviousItem(db, householdId, itemName);
  249 |         
  250 |         const shoppingRef = collection(db, 'households', householdId, 'shopping_list');
  251 |         await addDoc(shoppingRef, {
  252 |           name: itemName,
  253 |           checked: false,
  254 |           autoAdded: false,
  255 |           category: previousItem?.category || 'other',
  256 |           note: previousItem?.note || ''
  257 |         });
  258 |         e.currentTarget.value = '';
  259 |       } catch (error) {
  260 |         console.error('Error adding item:', error);
  261 |       }
  262 |     }
  263 |   };
  264 | 
  265 |   const getSortedList = () => {
  266 |     let sorted = [...shoppingList];
  267 |     
  268 |     if (sortBy === 'category') {
  269 |       const categoryOrder = getCategorySortOrder();
  270 |       sorted.sort((a, b) => {
  271 |         const catA = categoryOrder.indexOf(a.category || 'other');
  272 |         const catB = categoryOrder.indexOf(b.category || 'other');
  273 |         return catA - catB;
  274 |       });
  275 |     } else if (sortBy === 'name') {
  276 |       sorted.sort((a, b) => a.name.localeCompare(b.name));
  277 |     }
  278 |     
  279 |     // Unchecked items first
  280 |     sorted.sort((a, b) => (a.checked === b.checked) ? 0 : a.checked ? 1 : -1);
  281 |     
  282 |     return sorted;
  283 |   };
  284 | 
  285 |   // Group items by category for display (only when sorted by category)
  286 |   const getGroupedList = () => {
  287 |     if (sortBy !== 'category') {
  288 |       return [{ items: sortedList }];
  289 |     }
  290 | 
  291 |     const groups = [];
  292 |     const categoryMap = new Map();
  293 | 
  294 |     sortedList.forEach(item => {
  295 |       const category = item.category || 'other';
  296 |       if (!categoryMap.has(category)) {
  297 |         categoryMap.set(category, []);
  298 |       }
  299 |       categoryMap.get(category).push(item);
  300 |     });
  301 | 
  302 |     // Create groups in the correct order
  303 |     getCategorySortOrder().forEach(catValue => {
  304 |       if (categoryMap.has(catValue) && categoryMap.get(catValue).length > 0) {
  305 |         groups.push({
  306 |           category: catValue,
  307 |           items: categoryMap.get(catValue)
  308 |         });
  309 |       }
  310 |     });
  311 | 
  312 |     return groups;
  313 |   };
  314 | 
  315 |   const cycleSortMode = () => {
  316 |     const modes = ['default', 'category', 'name'];
  317 |     const currentIndex = modes.indexOf(sortBy);
  318 |     const nextIndex = (currentIndex + 1) % modes.length;
  319 |     setSortBy(modes[nextIndex]);
  320 |   };
  321 | 
  322 |   const sortedList = getSortedList();
  323 |   const groupedList = getGroupedList();
  324 |   const checkedCount = shoppingList.filter(item => item.checked).length;
  325 | 
  326 |   return (
  327 |     <>
  328 |       <div className="max-w-md mx-auto bg-white min-h-[60vh] rounded-xl shadow-lg p-6 relative">
  329 |         {/* Skeuomorphic Notebook Spiral */}
  330 |         <div className="absolute top-0 left-0 w-full h-8 flex justify-evenly">
  331 |           {[...Array(10)].map((_, i) => (
  332 |             <div key={i} className="w-4 h-8 bg-slate-300 rounded-full -mt-4 shadow-inner border border-slate-400"></div>
  333 |           ))}
  334 |         </div>
  335 | 
  336 |         {/* Import Feature */}
  337 |         <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
  338 |           <h3 className="text-sm font-bold text-slate-600 mb-2 flex items-center gap-1"><ClipboardList size={16} /> Import List</h3>
  339 |           <p className="text-xs text-slate-500 mb-3">Paste list items in the format: <code>[ ] Item Name</code> or <code>[v] Item Name</code></p>
  340 |           <textarea
  341 |             className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-indigo-500 focus:border-indigo-500 resize-none"
  342 |             placeholder="Paste your shopping list here..."
  343 |             value={pastedText}
  344 |             onChange={(e) => setPastedText(e.target.value)}
  345 |             onKeyDown={(e) => { if (e.key === 'Enter' && e.shiftKey) { /* Handle multi-line */ } }}
  346 |         />
  347 |           <button
  348 |             onClick={handleImport}
  349 |             disabled={!pastedText || !householdId}
  350 |             className="mt-2 w-full py-2 px-4 text-sm rounded-lg transition duration-150 disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700 text-white"
  351 |           >
  352 |             Import List
  353 |           </button>
  354 |         </div>
  355 | 
  356 |         <div className="flex justify-between items-center mb-8 mt-4 pb-4 border-b-2 border-slate-100">
  357 |           <h2 className="text-2xl font-handwriting text-slate-600">
  358 |             Shopping List
  359 |           </h2>
  360 |           <div className="flex items-center gap-2">
  361 |             {checkedCount > 0 && (
  362 |               <button 
  363 |                 onClick={handleClearChecked}
  364 |                 className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-full text-red-600 font-medium"
  365 |                 title="Clear checked items"
  366 |               >
  367 |                 Clear ({checkedCount})
  368 |               </button>
  369 |             )}
  370 |             <button 
  371 |               onClick={cycleSortMode}
  372 |               className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full text-slate-600"
  373 |               title="Sort by"
  374 |             >
  375 |               <ArrowUpDown size={12} />
  376 |               {sortBy === 'category' && 'By Category'}
  377 |               {sortBy === 'name' && 'A-Z'}
  378 |               {sortBy === 'default' && 'Default'}
  379 |             </button>
  380 |           </div>
  381 |         </div>
  382 | 
  383 |         <div className="space-y-3">
  384 |           {groupedList.map((group, groupIndex) => (
  385 |             <div key={group.category || `group-${groupIndex}`}>
  386 |               {/* Category Header (only shown when sorted by category) */}
  387 |               {group.category && sortBy === 'category' && (
  388 |                 <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
  389 |                   <span className="text-xl">{getCategoryEmoji(group.category)}</span>
  390 |                   <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
  391 |                     {getCategoryLabel(group.category)}
  392 |                   </h3>
  393 |                   <div className="flex-1 h-px bg-slate-200"></div>
  394 |                 </div>
  395 |               )}
  396 |               
  397 |               {/* Items in this category/group */}
  398 |               {group.items.map(item => (
  399 |                 <div key={item.id} className={`flex items-center justify-between p-4 rounded-xl border transition duration-150 ${item.checked ? 'bg-green-50 border-green-200 opacity-70' : 'bg-white hover:shadow-sm border-slate-200'}`}>
  400 |                   <div className="flex items-center gap-3 flex-1 min-w-0">
  401 |                     {/* Checkbox and Status */}
  402 |                     <button
  403 |                       onClick={() => handleToggleChecked(item.id, item.checked, item)}
  404 |                       className={`flex items-center gap-2 p-1 rounded-full transition duration-150 ${item.checked ? 'bg-green-600 text-white' : 'hover:bg-slate-100'} focus:outline-none`}
  405 |                     aria-checked={item.checked}
  406 |                     title={item.checked ? "Bought (Add to Fridge)" : "Buy Item"}
  407 |                     disabled={!householdId}
  408 |                   >
  409 |                       <input
  410 |                         type="checkbox"
  411 |                         checked={item.checked}
  412 |                         readOnly
  413 |                         className="form-checkbox h-5 w-5 text-green-600 bg-gray-100 border-gray-300 cursor-pointer"
  414 |                       />
  415 |                       <span className={`text-sm ${item.checked ? 'line-through text-slate-500' : 'text-slate-800'} flex items-center`}>
  416 |                         {/* Item Name and Category */}
  417 |                         <div className="flex items-center gap-2">
  418 |                           <span className={`text-sm ${item.category ? 'text-indigo-500' : ''}`}>{getCategoryEmoji(item.category)}</span>
  419 |                           {item.name}
  420 |                         </div>
  421 |                         {/* Notes/Details */}
  422 |                         <span className="text-xs text-slate-400 ml-2">({item.note || 'No note'})</span>
  423 |                       </span>
  424 |                     </button>
  425 |                     
  426 |                     {/* Details/Category Info */}
  427 |                     <div className="flex flex-col text-sm min-w-0">
  428 |                         <span className={`text-xs font-medium uppercase ${item.checked ? 'text-green-500' : 'text-slate-600'} mb-1`}>
  429 |                           {item.category ? getCategoryLabel(item.category) : 'General'}
  430 |                         </span>
  431 |                         <p className="text-xs text-slate-500">{item.note || 'No notes'}</p>
  432 |                     </div>
  433 |                   </div>
  434 |                   
  435 |                   {/* Actions */}
  436 |                   <div className="flex items-center gap-2 flex-shrink-0">
  437 |                     <button 
  438 |                       onClick={() => setEditingItem(item)}
  439 |                       className="p-2 text-slate-400 hover:text-indigo-600 transition duration-150"
  440 |                       title="Edit Item"
  441 |                     >
  442 |                       <Edit size={18} />
  443 |                     </button>
  444 |                     <button 
  445 |                       onClick={() => handleRemoveItem(item.id)}
  446 |                       className="p-2 text-slate-400 hover:text-red-600 transition duration-150"
  447 |                       title="Delete Item"
  448 |                     >
  449 |                       <X size={18} />
  450 |                     </button>
  451 |                   </div>
  452 |                 </div>
  453 |             ))}
  454 |           {/* Empty State */}
  455 |           {!groupedList.length && (
  456 |             <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
  457 |               Your shopping list is empty. Add items manually or use the Import feature above!
  458 |             </div>
  459 |           )}
  460 |         </div>
  461 |       </div>
  462 |     </>
  463 |   );
  464 | };
  465 | 
  466 | export default ShoppingListView;