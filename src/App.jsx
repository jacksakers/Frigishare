import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { db } from './firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, getDoc, setDoc } from 'firebase/firestore';
import AuthPage from './components/AuthPage';
import HouseholdSetup from './components/HouseholdSetup';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Shelf from './components/Shelf';
import FoodItem from './components/FoodItem';
import AddItemModal from './components/AddItemModal';
import EditItemModal from './components/EditItemModal';
import ConsumptionModal from './components/ConsumptionModal';
import ShoppingListView from './components/ShoppingListView';
import { generateItemId, roundToHalf } from './utils/helpers';

export default function App() {
  const { currentUser, householdId } = useAuth();

  // Show auth page if not logged in
  if (!currentUser) {
    return <AuthPage />;
  }

  // Show household setup if logged in but no household
  if (!householdId) {
    return <HouseholdSetup />;
  }

  // Main app content (when authenticated and household is set)
  return <MainApp />;
}

function MainApp() {
  const { householdId } = useAuth();
  const [view, setView] = useState('fridge'); // fridge, pantry, list
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  
  // -- State: Firestore Data --
  const [inventory, setInventory] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [daysSinceLastCheckIn, setDaysSinceLastCheckIn] = useState(0);
  const [consumptionItems, setConsumptionItems] = useState([]);

  // -- Firestore: Real-time listener for inventory items --
  useEffect(() => {
    if (!householdId) return;

    const itemsRef = collection(db, 'households', householdId, 'items');
    const q = query(itemsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventory(items);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching items:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [householdId]);

  // -- Firestore: Real-time listener for shopping list --
  useEffect(() => {
    if (!householdId) return;

    const shoppingRef = collection(db, 'households', householdId, 'shopping_list');
    const q = query(shoppingRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShoppingList(items);
    }, (error) => {
      console.error('Error fetching shopping list:', error);
    });

    return () => unsubscribe();
  }, [householdId]);

  // -- Check Last Check-In Date --
  useEffect(() => {
    if (!householdId || inventory.length === 0) return;

    const checkLastCheckIn = async () => {
      try {
        const householdRef = doc(db, 'households', householdId);
        const householdDoc = await getDoc(householdRef);
        
        if (householdDoc.exists()) {
          const data = householdDoc.data();
          const lastCheckInDate = data.lastCheckIn?.toDate();
          
          if (lastCheckInDate) {
            const today = new Date();
            const daysDiff = Math.floor((today - lastCheckInDate) / (1000 * 60 * 60 * 24));
            
            setLastCheckIn(lastCheckInDate);
            setDaysSinceLastCheckIn(daysDiff);
            
            // If it's been 3 or more days, trigger consumption modal
            if (daysDiff >= 3) {
              const itemsWithUsage = inventory.filter(item => item.weeklyUsage > 0);
              if (itemsWithUsage.length > 0) {
                // Calculate adjusted consumption based on days passed
                const adjustedItems = itemsWithUsage.map(item => {
                  const dailyUsage = item.weeklyUsage / 7;
                  const estimatedUsage = roundToHalf(dailyUsage * daysDiff);
                  return {
                    ...item,
                    estimatedUsage,
                    actualUsage: estimatedUsage // Default to estimated
                  };
                });
                setConsumptionItems(adjustedItems);
                setShowConsumptionModal(true);
              }
            }
          } else {
            // First time - set current date
            await setDoc(householdRef, {
              ...data,
              lastCheckIn: new Date()
            });
            setLastCheckIn(new Date());
          }
        }
      } catch (error) {
        console.error('Error checking last check-in:', error);
      }
    };

    checkLastCheckIn();
  }, [householdId, inventory.length]);

  // -- Logic: Shopping List Generator --
  useEffect(() => {
    if (!householdId || inventory.length === 0) return;

    // Whenever inventory changes, check for low stock
    const lowItems = inventory.filter(i => i.qty <= i.minThreshold);
    
    // Check each low item against current shopping list
    lowItems.forEach(async (item) => {
      // If item not already in list, add it
      const exists = shoppingList.find(
        li => li.name.toLowerCase() === item.name.toLowerCase() && !li.checked
      );
      
      if (!exists) {
        try {
          const shoppingRef = collection(db, 'households', householdId, 'shopping_list');
          await addDoc(shoppingRef, {
            name: item.name,
            checked: false,
            autoAdded: true,
            category: item.category || 'other',
            note: ''
          });
        } catch (error) {
          console.error('Error adding to shopping list:', error);
        }
      }
    });
  }, [inventory, householdId, shoppingList]);

  // -- Logic: Consumption Simulator (for manual testing) --
  const triggerWeeklyConsumption = () => {
    const itemsWithUsage = inventory.filter(item => item.weeklyUsage > 0);
    if (itemsWithUsage.length > 0) {
      const adjustedItems = itemsWithUsage.map(item => ({
        ...item,
        estimatedUsage: roundToHalf(item.weeklyUsage),
        actualUsage: roundToHalf(item.weeklyUsage)
      }));
      setConsumptionItems(adjustedItems);
      setDaysSinceLastCheckIn(7); // Simulate 7 days
      setShowConsumptionModal(true);
    }
  };

  const confirmConsumption = async (adjustedConsumptionItems) => {
    if (!householdId) return;

    try {
      // Update each item with the user-confirmed consumption
      for (const item of adjustedConsumptionItems) {
        const newQty = Math.max(0, roundToHalf(item.qty - item.actualUsage));
        const itemRef = doc(db, 'households', householdId, 'items', item.id);
        await updateDoc(itemRef, {
          qty: newQty
        });
      }
      
      // Update last check-in date
      const householdRef = doc(db, 'households', householdId);
      await updateDoc(householdRef, {
        lastCheckIn: new Date()
      });
      
      setShowConsumptionModal(false);
      setConsumptionItems([]);
      setDaysSinceLastCheckIn(0);
    } catch (error) {
      console.error('Error updating consumption:', error);
    }
  };

  // -- Handlers --
  const handleQuickAddFromShelf = (shelfName) => {
    setSelectedShelf(shelfName);
    setIsAddModalOpen(true);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!householdId) return;

    const formData = new FormData(e.target);
    const itemName = formData.get('name');
    const itemId = generateItemId(itemName);
    const qty = roundToHalf(parseFloat(formData.get('qty')));
    const location = formData.get('location') || (view === 'pantry' ? 'pantry' : 'fridge');
    const subLocation = formData.get('subLocation') || selectedShelf;
    
    const newItem = {
      name: itemName,
      location: location,
      subLocation: subLocation,
      category: formData.get('category'),
      qty: qty,
      unit: formData.get('unit'),
      weeklyUsage: roundToHalf(parseFloat(formData.get('weeklyUsage') || 0)),
      minThreshold: roundToHalf(parseFloat(formData.get('minThreshold') || 0)),
      note: formData.get('note') || ''
    };
    
    try {
      const itemRef = doc(db, 'households', householdId, 'items', itemId);
      const existingDoc = await getDoc(itemRef);
      
      if (existingDoc.exists()) {
        // Item exists, merge quantities
        const existingData = existingDoc.data();
        await updateDoc(itemRef, {
          qty: roundToHalf(existingData.qty + qty),
          // Update other fields if needed
          note: newItem.note || existingData.note,
          subLocation: newItem.subLocation || existingData.subLocation
        });
      } else {
        // New item, create it
        await setDoc(itemRef, newItem);
      }
      
      setIsAddModalOpen(false);
      setSelectedShelf(null);
      e.target.reset(); // Reset form after submission
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!householdId || !editingItem) return;

    const formData = new FormData(e.target);
    const updatedData = {
      name: formData.get('name'),
      location: formData.get('location') || editingItem.location,
      subLocation: formData.get('subLocation'),
      category: formData.get('category'),
      qty: roundToHalf(parseFloat(formData.get('qty'))),
      unit: formData.get('unit'),
      weeklyUsage: roundToHalf(parseFloat(formData.get('weeklyUsage') || 0)),
      minThreshold: roundToHalf(parseFloat(formData.get('minThreshold') || 0)),
      note: formData.get('note') || ''
    };
    
    try {
      const itemRef = doc(db, 'households', householdId, 'items', editingItem.id);
      await updateDoc(itemRef, updatedData);
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!householdId) return;

    try {
      const itemRef = doc(db, 'households', householdId, 'items', id);
      await deleteDoc(itemRef);
      setEditingItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleAddToCart = async (item) => {
    if (!householdId) return;

    try {
      // Check if item already in shopping list
      const exists = shoppingList.find(
        li => li.name.toLowerCase() === item.name.toLowerCase() && !li.checked
      );
      
      if (!exists) {
        const shoppingRef = collection(db, 'households', householdId, 'shopping_list');
        await addDoc(shoppingRef, {
          name: item.name,
          checked: false,
          autoAdded: false,
          category: item.category || 'other',
          note: item.note || ''
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
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
      <Shelf key={shelfName} title={shelfName} type={currentLoc} onAddItem={handleQuickAddFromShelf}>
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

      {/* --- Loading State --- */}
      {loading && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Loading your fridge...</p>
          </div>
        </div>
      )}

      {/* --- Main Content Area --- */}
      {!loading && (
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
      )}

      {/* --- Floating Action Button --- */}
      {!loading && (view === 'fridge' || view === 'pantry') && (
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
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedShelf(null);
        }}
        onSubmit={handleAddItem}
        currentLocation={view}
        selectedShelf={selectedShelf}
      />

      <EditItemModal 
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSubmit={handleUpdateItem}
        onDelete={handleDelete}
        onAddToCart={handleAddToCart}
      />

      <ConsumptionModal 
        isOpen={showConsumptionModal}
        onClose={() => {
          setShowConsumptionModal(false);
          setConsumptionItems([]);
        }}
        onConfirm={confirmConsumption}
        consumptionItems={consumptionItems}
        daysSinceLastCheckIn={daysSinceLastCheckIn}
      />

    </div>
  );
}
