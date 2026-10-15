import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

export async function signInWithEmail(email, password) {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase credentials are not configured yet. Check your .env.local file.');
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    return result.user;
  } catch (error) {
    console.error('Email Sign-In Error:', error);
    throw error;
  }
}

export async function logout() {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

export function subscribeToAuthChanges(callback) {
  if (!isFirebaseConfigured() || !auth) {
    // If not configured, immediately inform subscriber that there is no active user
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
