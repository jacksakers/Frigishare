import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Shelf from './components/Shelf';
import FoodItem from './components/FoodItem';
import AddItemModal from './components/AddItemModal';
import EditItemModal from './components/EditItemModal';
import ConsumptionModal from './components/ConsumptionModal';
import ShoppingListView from './components/ShoppingListView';

export default function App() {
  const [view, setView] = useState('fridge'); // fridge, pantry, list
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
      <Header onSimulateWeek={triggerWeeklyConsumption} />

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
          <ShoppingListView 
            shoppingList={shoppingList} 
            setShoppingList={setShoppingList} 
          />
        )}

      </main>

      {/* --- Floating Action Button --- */}
      {(view === 'fridge' || view === 'pantry') && (
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center hover:scale-110 transition z-30"
        >
          <Plus size={28} />
        </button>
      )}

      {/* --- Bottom Navigation --- */}
      <BottomNav 
        view={view} 
        setView={setView} 
        shoppingListCount={shoppingList.filter(i => !i.checked).length}
      />

      {/* --- Modals --- */}
      <AddItemModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddItem}
        currentLocation={view}
      />

      <EditItemModal 
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSubmit={handleUpdateItem}
        onDelete={handleDelete}
      />

      <ConsumptionModal 
        isOpen={showConsumptionModal}
        onClose={() => setShowConsumptionModal(false)}
        onConfirm={confirmConsumption}
        inventory={inventory}
      />

    </div>
  );
}
