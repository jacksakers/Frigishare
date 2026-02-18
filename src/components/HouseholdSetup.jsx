import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, Plus, LogIn, Copy, Check } from 'lucide-react';

const HouseholdSetup = () => {
  const [mode, setMode] = useState('choose'); // choose, create, join
  const [householdName, setHouseholdName] = useState('');
  const [householdCode, setHouseholdCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { createHousehold, joinHousehold } = useAuth();

  const handleCreateHousehold = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const code = await createHousehold(householdName);
      setGeneratedCode(code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHousehold = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await joinHousehold(householdCode.trim().toUpperCase());
    } catch (err) {
      setError('Household not found. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (generatedCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="inline-block bg-emerald-100 p-4 rounded-2xl mb-4">
            <Check size={48} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Household Created!</h2>
          <p className="text-slate-600 mb-6">Share this code with your family members so they can join:</p>
          
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 mb-6">
            <p className="text-4xl font-bold text-emerald-600 tracking-widest mb-2">{generatedCode}</p>
            <button 
              onClick={copyToClipboard}
              className="text-sm text-slate-500 hover:text-emerald-600 flex items-center justify-center gap-2 mx-auto"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy Code
                </>
              )}
            </button>
          </div>
          
          <p className="text-xs text-slate-400 mb-6">You can find this code later in your household settings.</p>
          
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition"
          >
            Continue to FridgeSync
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'choose') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-emerald-100 p-4 rounded-2xl mb-4">
              <Home size={48} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Set Up Your Household</h2>
            <p className="text-slate-600">Create a new household or join an existing one</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-between group shadow-lg"
            >
              <span className="flex items-center gap-3">
                <Plus size={24} />
                Create New Household
              </span>
              <span className="text-emerald-200">→</span>
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full bg-white border-2 border-slate-300 text-slate-700 p-4 rounded-xl font-bold hover:bg-slate-50 transition flex items-center justify-between group"
            >
              <span className="flex items-center gap-3">
                <LogIn size={24} />
                Join Existing Household
              </span>
              <span className="text-slate-400">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
          <button 
            onClick={() => setMode('choose')}
            className="text-slate-500 hover:text-slate-700 mb-4"
          >
            ← Back
          </button>

          <div className="text-center mb-8">
            <div className="inline-block bg-emerald-100 p-4 rounded-2xl mb-4">
              <Plus size={48} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Create Household</h2>
            <p className="text-slate-600">Give your household a name</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateHousehold} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">
                Household Name
              </label>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                required
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="The Smith Family"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Creating...' : 'Create Household'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
          <button 
            onClick={() => setMode('choose')}
            className="text-slate-500 hover:text-slate-700 mb-4"
          >
            ← Back
          </button>

          <div className="text-center mb-8">
            <div className="inline-block bg-blue-100 p-4 rounded-2xl mb-4">
              <LogIn size={48} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Join Household</h2>
            <p className="text-slate-600">Enter the 6-character code shared by your family</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleJoinHousehold} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">
                Household Code
              </label>
              <input
                type="text"
                value={householdCode}
                onChange={(e) => setHouseholdCode(e.target.value.trim().toUpperCase())}
                required
                maxLength="6"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-center text-2xl font-bold tracking-widest uppercase"
                placeholder="ABC123"
              />
            </div>

            <button
              type="submit"
              disabled={loading || householdCode.length !== 6}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Joining...' : 'Join Household'}
            </button>
          </form>
        </div>
      </div>
    );
  }
};

export default HouseholdSetup;
