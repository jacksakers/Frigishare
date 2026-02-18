import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [householdId, setHouseholdId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  const signup = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Sign in with email and password
  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Sign out
  const logout = async () => {
    setHouseholdId(null);
    return signOut(auth);
  };

  // Join or create household
  const joinHousehold = async (householdCode) => {
    if (!currentUser) throw new Error('Must be logged in');
    
    // Check if household exists
    const householdRef = doc(db, 'households', householdCode);
    const householdDoc = await getDoc(householdRef);
    
    if (householdDoc.exists()) {
      // Join existing household
      const householdData = householdDoc.data();
      if (!householdData.members.includes(currentUser.uid)) {
        await setDoc(householdRef, {
          ...householdData,
          members: [...householdData.members, currentUser.uid]
        });
      }
      setHouseholdId(householdCode);
      // Store household ID in user's local storage
      localStorage.setItem('householdId', householdCode);
      return householdCode;
    } else {
      throw new Error('Household not found');
    }
  };

  // Create new household
  const createHousehold = async (householdName) => {
    if (!currentUser) throw new Error('Must be logged in');
    
    // Generate a simple 6-character code
    const householdCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const householdRef = doc(db, 'households', householdCode);
    await setDoc(householdRef, {
      name: householdName,
      members: [currentUser.uid],
      createdAt: new Date(),
      createdBy: currentUser.uid
    });
    
    setHouseholdId(householdCode);
    localStorage.setItem('householdId', householdCode);
    return householdCode;
  };

  // Load household ID from localStorage on mount
  useEffect(() => {
    const storedHouseholdId = localStorage.getItem('householdId');
    if (storedHouseholdId) {
      setHouseholdId(storedHouseholdId);
    }
  }, [currentUser]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    householdId,
    signup,
    login,
    logout,
    signInWithGoogle,
    joinHousehold,
    createHousehold,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
