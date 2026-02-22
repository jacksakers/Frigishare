import React from 'react';
import { Refrigerator, LogOut, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ onSimulateWeek }) => {
  const { currentUser, householdId, logout } = useAuth();

  return (
    <header className="bg-white p-4 shadow-sm sticky top-0 z-20 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="bg-emerald-500 p-2 rounded-lg text-white">
          <Refrigerator size={24} />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tight text-slate-700">Frigishare</h1>
          {householdId && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Users size={12} />
              Code: {householdId}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Sim Button for Demo */}
        <button 
          onClick={onSimulateWeek}
          className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium hover:bg-indigo-200 transition"
        >
          Simulate Week Pass
        </button>

        {/* User info and logout */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-600 font-medium">{currentUser?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
