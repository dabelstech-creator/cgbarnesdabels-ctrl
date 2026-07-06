'use client';

import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  OAuthProvider,
  signOut,
  signInAnonymously,
  User
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync user data to Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            console.log(`[Auth] Creating initial user profile for ${firebaseUser.uid}`);
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email || 'anonymous@mock-workspace.com',
              displayName: firebaseUser.displayName || 'Mock Administrator',
              photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
              lastLogin: serverTimestamp(),
              isMock: firebaseUser.isAnonymous
            });
          } else {
            console.log(`[Auth] Updating lastLogin for ${firebaseUser.uid}`);
            await setDoc(userRef, { 
              lastLogin: serverTimestamp(),
              displayName: firebaseUser.displayName || userDoc.data()?.displayName || 'Mock Administrator',
              photoURL: firebaseUser.photoURL || userDoc.data()?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
            }, { merge: true });
          }
        } catch (err: any) {
          console.error("Error syncing user data:", err);
          console.error("Error code:", err.code);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithProvider = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new OAuthProvider('oidc.auth0');
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loginWithMock = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      setError(err.message);
      console.error("Mock login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, loginWithProvider, loginWithMock, logout };
}
