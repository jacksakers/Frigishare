import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Search, 
  Refrigerator, 
  Archive, 
  ShoppingCart, 
  ChefHat, 
  Trash2, 
  Save, 
  X,
  AlertCircle,
  StickyNote,
  Check
} from 'lucide-react';

// --- Components ---

// 1. The Skeuomorphic Shelf
const Shelf = ({ title, children, type = 'fridge' }) => {
  const shelfStyles = type === 'fridge' 
    ? "bg-white/80 border-b-8 border-slate-200 shadow-inner rounded-lg" // Plastic/Glass look
    : "bg-[#e8d5b5] border-b-8 border-[#cbb389] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] rounded-sm"; // Wood look

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 ml-2">{title}</h3>
      <div className={`min-h-[140px] p-4 flex gap-4 overflow-x-auto ${shelfStyles}`}>
        {children}
        {React.Children.count(children) === 0 && (
          <div className="w-full flex items-center justify-center text-slate-300 italic text-sm">
            Empty Shelf
          </div>
        )}
      </div>
    </div>
  );
};

// 2. The Food Item Card
const FoodItem = ({ item, onEdit, onDelete }) => {
  const isLow = item.qty <= item.minThreshold;

  return (
    <div 
      onClick={() => onEdit(item)}
      className={`
        relative group flex-shrink-0 w-32 h-36 bg-white rounded-xl shadow-md border-2 
        flex flex-col items-center justify-center p-2 cursor-pointer transition-transform hover:-translate-y-1
        ${isLow ? 'border-red-300 bg-red-50' : 'border-slate-100'}
      `}
    >
      {/* Sticky Note */}
      {item.note && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-200 shadow-sm rotate-12 flex items-center justify-center rounded-sm z-10" title={item.note}>
          <StickyNote size={14} className="text-yellow-700" />
        </div>
      )}

      {/* Icon Placeholder based on Category */}
      <div className="text-3xl mb-2">
        {getCategoryEmoji(item.category)}
      </div>

      <div className="text-center w-full">
        <p className="font-bold text-slate-700 text-sm truncate w-full">{item.name}</p>
        <p className="text-xs text-slate-400">{item.qty} {item.unit}</p>
      </div>

      {/* Auto-Use Indicator */}
      {item.weeklyUsage > 0 && (
        <div className="mt-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="font-bold">-{item.weeklyUsage}</span>/wk
        </div>
      )}
    </div>
  );
};

// Helper for emojis
const getCategoryEmoji = (cat) => {
  switch(cat) {
    case 'fruit': return '🍎';
    case 'veg': return '🥕';
    case 'dairy': return '🥛';
    case 'meat': return '🥩';
    case 'grain': return '🍞';
    case 'condiment': return '🥫';
    case 'drink': return '🧃';
    default: return '📦';
  }
};

// --- Main Application ---

export default function App() {
  const [view, setView] = useState('fridge'); // fridge, pantry, list, plan
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  
  // -- State: Mock Data --
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Bagels', location: 'fridge', subLocation: 'Middle Shelf', category: 'grain', qty: 6, unit: 'count', weeklyUsage: 3, minThreshold: 2, note: "Jerry's - don't touch" },
    { id: 2, name: 'Milk', location: 'fridge', subLocation: 'Door', category: 'dairy', qty: 0.5, unit: 'gallon', weeklyUsage: 0.5, minThreshold: 0.2, note: '' },
    { id: 3, name: 'Carrots', location: 'fridge', subLocation: 'Crisper', category: 'veg', qty: 5, unit: 'whole', weeklyUsage: 2, minThreshold: 2, note: '' },
    { id: 4, name: 'Pasta Sauce', location: 'pantry', subLocation: 'Top Shelf', category: 'condiment', qty: 2, unit: 'jars', weeklyUsage: 0, minThreshold: 1, note: '' },
    { id: 5, name: 'Rice', location: 'pantry', subLocation: 'Bottom Shelf', category: 'grain', qty: 10, unit: 'lbs', weeklyUsage: 0, minThreshold: 2, note: '' },
  ]);

  const [shoppingList, setShoppingList] = useState([
    { id: 101, name: 'Butter', checked: false, autoAdded: false }
  ]);

  // -- Logic: Shopping List Generator --
  useEffect(() => {
    // Whenever inventory changes, check for low stock
    const lowItems = inventory.filter(i => i.qty <= i.minThreshold);
    
    setShoppingList(prevList => {
      const newList = [...prevList];
      lowItems.forEach(item => {
        // If item not already in list, add it
        if (!newList.find(li => li.name.toLowerCase() === item.name.toLowerCase() && !li.checked)) {
          newList.push({
            id: Date.now() + Math.random(),
            name: item.name,
            checked: false,
            autoAdded: true
          });
        }
      });
      return newList;
    });
  }, [inventory]);

  // -- Logic: Consumption Simulator --
  const triggerWeeklyConsumption = () => {
    setShowConsumptionModal(true);
  };

  const confirmConsumption = () => {
    setInventory(prev => prev.map(item => {
      if (item.weeklyUsage > 0) {
        // Ensure we don't go below 0
        const newQty = Math.max(0, item.qty - item.weeklyUsage);
        return { ...item, qty: parseFloat(newQty.toFixed(2)) };
      }
      return item;
    }));
    setShowConsumptionModal(false);
  };

  // -- Handlers --
  const handleAddItem = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newItem = {
      id: Date.now(),
      name: formData.get('name'),
      location: view === 'pantry' ? 'pantry' : 'fridge',
      subLocation: formData.get('subLocation'),
      category: formData.get('category'),
      qty: parseFloat(formData.get('qty')),
      unit: formData.get('unit'),
      weeklyUsage: parseFloat(formData.get('weeklyUsage') || 0),
      minThreshold: parseFloat(formData.get('minThreshold') || 0),
      note: formData.get('note')
    };
    
    setInventory([...inventory, newItem]);
    setIsAddModalOpen(false);
  };

  const handleUpdateItem = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setInventory(inventory.map(i => i.id === editingItem.id ? {
      ...i,
      name: formData.get('name'),
      subLocation: formData.get('subLocation'),
      category: formData.get('category'),
      qty: parseFloat(formData.get('qty')),
      unit: formData.get('unit'),
      weeklyUsage: parseFloat(formData.get('weeklyUsage') || 0),
      minThreshold: parseFloat(formData.get('minThreshold') || 0),
      note: formData.get('note')
    } : i));
    setEditingItem(null);
  };

  const handleDelete = (id) => {
    setInventory(inventory.filter(i => i.id !== id));
    setEditingItem(null);
  };

  // --- Render Helpers ---
  const renderShelves = (currentLoc) => {
    // Group items by subLocation (Shelf)
    const items = inventory.filter(i => i.location === currentLoc);
    // Get unique shelves + defaults
    const defaultShelves = currentLoc === 'fridge' 
      ? ['Top Shelf', 'Middle Shelf', 'Crisper', 'Door'] 
      : ['Top Shelf', 'Middle Shelf', 'Bottom Shelf'];
    
    // Merge actual data shelves with defaults to ensure order
    const usedShelves = [...new Set(items.map(i => i.subLocation))];
    const allShelves = [...new Set([...defaultShelves, ...usedShelves])];

    return allShelves.map(shelfName => (
      <Shelf key={shelfName} title={shelfName} type={currentLoc}>
        {items.filter(i => i.subLocation === shelfName).map(item => (
          <FoodItem 
            key={item.id} 
            item={item} 
            onEdit={setEditingItem} 
          />
        ))}
      </Shelf>
    ));
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-24">
      
      {/* --- Header --- */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-2 rounded-lg text-white">
            <Refrigerator size={24} />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-700">Frigishare</h1>
        </div>
        
        {/* Sim Button for Demo */}
        <button 
          onClick={triggerWeeklyConsumption}
          className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium hover:bg-indigo-200 transition"
        >
          Simulate Week Pass
        </button>
      </header>

      {/* --- Main Content Area --- */}
      <main className="p-4 max-w-2xl mx-auto">
        
        {view === 'fridge' && (
          <div className="animate-fade-in">
             <div className="flex justify-between items-end mb-4">
               <h2 className="text-2xl font-bold text-slate-700">My Fridge</h2>
               <span className="text-sm text-slate-400">{inventory.filter(i => i.location === 'fridge').length} items</span>
             </div>
             <div className="bg-slate-200 p-4 rounded-3xl shadow-xl border-4 border-slate-300">
                {/* The Fridge Body */}
                <div className="bg-white rounded-xl p-2 min-h-[60vh]">
                  {renderShelves('fridge')}
                </div>
             </div>
          </div>
        )}

        {view === 'pantry' && (
          <div className="animate-fade-in">
             <div className="flex justify-between items-end mb-4">
               <h2 className="text-2xl font-bold text-orange-800">My Pantry</h2>
               <span className="text-sm text-orange-400">{inventory.filter(i => i.location === 'pantry').length} items</span>
             </div>
             <div className="bg-[#dcbfa3] p-4 rounded-sm shadow-xl border-4 border-[#bca083]">
                {/* The Pantry Body */}
                <div className="bg-[#fcf5e9] rounded-sm p-2 min-h-[60vh]">
                  {renderShelves('pantry')}
                </div>
             </div>
          </div>
        )}

        {view === 'list' && (
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
                    onClick={() => setShoppingList(sl => sl.map(i => i.id === item.id ? {...i, checked: !i.checked} : i))}
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
                    onClick={() => setShoppingList(sl => sl.filter(i => i.id !== item.id))}
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
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && e.currentTarget.value) {
                    setShoppingList([...shoppingList, { id: Date.now(), name: e.currentTarget.value, checked: false, autoAdded: false }]);
                    e.currentTarget.value = '';
                  }
                }}
               />
            </div>
          </div>
        )}

      </main>

      {/* --- Floating Action Button --- */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center hover:scale-110 transition z-30"
      >
        <Plus size={28} />
      </button>

      {/* --- Bottom Navigation --- */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40 text-slate-400">
        <button 
          onClick={() => setView('fridge')}
          className={`flex flex-col items-center gap-1 ${view === 'fridge' ? 'text-emerald-600' : 'hover:text-emerald-400'}`}
        >
          <Refrigerator size={24} />
          <span className="text-xs font-medium">Fridge</span>
        </button>
        <button 
          onClick={() => setView('pantry')}
          className={`flex flex-col items-center gap-1 ${view === 'pantry' ? 'text-orange-600' : 'hover:text-orange-400'}`}
        >
          <Archive size={24} />
          <span className="text-xs font-medium">Pantry</span>
        </button>
        <button 
          onClick={() => setView('list')}
          className={`flex flex-col items-center gap-1 ${view === 'list' ? 'text-blue-600' : 'hover:text-blue-400'}`}
        >
          <div className="relative">
             <ShoppingCart size={24} />
             {shoppingList.filter(i => !i.checked).length > 0 && (
               <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                 {shoppingList.filter(i => !i.checked).length}
               </span>
             )}
          </div>
          <span className="text-xs font-medium">Shop</span>
        </button>
      </nav>

      {/* --- Modals --- */}
      
      {/* 1. Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-500 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Add Grocery</h3>
              <button onClick={() => setIsAddModalOpen(false)}><X/></button>
            </div>
            <form onSubmit={handleAddItem} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
                   <input required name="name" className="w-full p-2 bg-slate-50 rounded border border-slate-200" placeholder="e.g. Greek Yogurt" />
                 </div>
                 
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Qty</label>
                   <div className="flex">
                      <input required name="qty" type="number" step="0.1" className="w-1/2 p-2 bg-slate-50 rounded-l border border-slate-200" defaultValue="1" />
                      <select name="unit" className="w-1/2 p-2 bg-slate-100 rounded-r border-y border-r border-slate-200 text-sm">
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
                    <input name="weeklyUsage" type="number" step="0.5" className="w-full p-2 bg-slate-50 rounded border border-slate-200" defaultValue="0" />
                 </div>

                 <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Sticky Note</label>
                    <input name="note" className="w-full p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800" placeholder="e.g. For Jerry" />
                 </div>

                 <input type="hidden" name="subLocation" value={view === 'fridge' ? 'Middle Shelf' : 'Top Shelf'} />
              </div>
              <button className="w-full bg-emerald-500 text-white p-3 rounded-lg font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600">Add to {view === 'fridge' ? 'Fridge' : 'Pantry'}</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-slate-700 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Edit {editingItem.name}</h3>
              <button onClick={() => setEditingItem(null)}><X/></button>
            </div>
            <form onSubmit={handleUpdateItem} className="p-4 space-y-4">
              {/* Same fields as Add, pre-filled */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
                   <input required name="name" defaultValue={editingItem.name} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Qty</label>
                   <input required name="qty" type="number" step="0.1" defaultValue={editingItem.qty} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Unit</label>
                    <input name="unit" defaultValue={editingItem.unit} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
                 </div>
                 <div className="col-span-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Shelf / Location</label>
                   <select name="subLocation" defaultValue={editingItem.subLocation} className="w-full p-2 bg-slate-50 rounded border border-slate-200">
                      <option>Top Shelf</option>
                      <option>Middle Shelf</option>
                      <option>Bottom Shelf</option>
                      <option>Crisper</option>
                      <option>Door</option>
                   </select>
                 </div>
                 
                 {/* Hidden fields for simplicity in demo */}
                 <input type="hidden" name="category" value={editingItem.category} />
                 <input type="hidden" name="weeklyUsage" value={editingItem.weeklyUsage} />
                 <input type="hidden" name="minThreshold" value={editingItem.minThreshold} />

                 <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Sticky Note</label>
                    <input name="note" defaultValue={editingItem.note} className="w-full p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800" />
                 </div>
              </div>
              
              <div className="flex gap-2">
                 <button type="button" onClick={() => handleDelete(editingItem.id)} className="flex-1 bg-red-100 text-red-600 p-3 rounded-lg font-bold hover:bg-red-200">Delete</button>
                 <button type="submit" className="flex-[2] bg-slate-800 text-white p-3 rounded-lg font-bold hover:bg-slate-900">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Weekly Consumption Check-in Modal */}
      {showConsumptionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
           <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-90">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                  <AlertCircle size={24} />
               </div>
               <h2 className="text-xl font-bold text-slate-800">Weekly Check-in</h2>
             </div>
             
             <p className="text-slate-600 mb-6">
               Based on your usual habits, we think you might have used these items. Did you?
             </p>

             <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto">
               {inventory.filter(i => i.weeklyUsage > 0).map(item => (
                 <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-700">{item.name}</p>
                      <p className="text-xs text-slate-500">Usually use {item.weeklyUsage} {item.unit}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-red-500">-{item.weeklyUsage}</p>
                       <p className="text-[10px] text-slate-400">New Qty: {Math.max(0, item.qty - item.weeklyUsage)}</p>
                    </div>
                 </div>
               ))}
               {inventory.filter(i => i.weeklyUsage > 0).length === 0 && (
                 <p className="italic text-slate-400 text-center">No items have a weekly usage set.</p>
               )}
             </div>

             <div className="flex gap-3">
               <button 
                onClick={() => setShowConsumptionModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-300 font-bold text-slate-500 hover:bg-slate-50"
               >
                 Cancel
               </button>
               <button 
                onClick={confirmConsumption}
                className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700"
               >
                 Yes, Update Fridge
               </button>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}