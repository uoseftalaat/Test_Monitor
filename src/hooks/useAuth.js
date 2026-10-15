import { useState, useEffect, useCallback } from 'react';
import { subscribeToAuthChanges, logout as firebaseLogout, signInWithEmail } from '../firebase/authService';
import { isFirebaseConfigured } from '../firebase/config';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bypassAuthForFallback, setBypassAuthForFallback] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        setShowAuthModal(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    return await signInWithEmail(email, password);
  }, []);

  const logout = useCallback(async () => {
    try {
      await firebaseLogout();
      setBypassAuthForFallback(false);
      setShowAuthModal(false);
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  }, []);

  const enableFallbackBypass = useCallback(() => {
    setBypassAuthForFallback(true);
    setShowAuthModal(false);
  }, []);

  const disableFallbackBypass = useCallback(() => {
    setBypassAuthForFallback(false);
  }, []);

  const requiresAuth = !currentUser && !bypassAuthForFallback;

  return {
    currentUser,
    authLoading,
    firebaseReady,
    bypassAuthForFallback,
    showAuthModal,
    setShowAuthModal,
    requiresAuth,
    login,
    logout,
    enableFallbackBypass,
    disableFallbackBypass
  };
}

export default useAuth;
