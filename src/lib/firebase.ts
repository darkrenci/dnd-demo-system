import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with the exact firestoreDatabaseId from firebase-applet-config.json
export const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(firebaseApp);

let isAuthInitialized = false;
let currentFirebaseUser: User | null = null;

export const ensureFirebaseAuth = async (): Promise<User | null> => {
  if (currentFirebaseUser) return currentFirebaseUser;

  return new Promise((resolve) => {
    // Wait for initial auth state or sign in anonymously
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        currentFirebaseUser = user;
        isAuthInitialized = true;
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          currentFirebaseUser = cred.user;
          isAuthInitialized = true;
          resolve(cred.user);
        } catch (err) {
          console.warn('[Firebase Auth] Anonymous sign-in not available, continuing with public guest mode:', err);
          isAuthInitialized = true;
          resolve(null);
        }
      }
    });
  });
};

// Validate connection per Firebase Skill
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Successfully validated connection to Firestore database:', firebaseConfig.firestoreDatabaseId);
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    } else {
      console.log('[Firebase] Connection probe returned (database reachable):', error?.code || error?.message);
    }
    return false;
  }
};
