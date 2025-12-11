/**
 * firebase.ts
 * Firebase and Firestore initialization.
 * 
 * This module is primarily configured for scalable usage logging (Goal #3).
 * Firestore provides excellent scalability for high-volume logging operations
 * and analytics data collection.
 * 
 * Note: This is separate from Supabase to allow for independent scaling
 * of authentication/database (Supabase) and logging/analytics (Firestore).
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Get environment variable (may be undefined during build)
const firebaseApiKey = process.env.FIREBASE_API_KEY || '';

/**
 * Firebase configuration object.
 * 
 * In a production setup, you would typically include additional configuration
 * such as project ID, auth domain, etc. For now, we're using the API key
 * from environment variables.
 * 
 * Note: Environment variables are validated at runtime when the client is used,
 * not at module load time, to allow Next.js builds to complete successfully.
 * 
 * TODO: Add additional Firebase config values to .env.local when Firebase project is created
 */
const firebaseConfig = {
  apiKey: firebaseApiKey || 'placeholder-key',
  // Add additional config properties as needed:
  // projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  // messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  // appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Initialize Firebase app instance.
 * 
 * Uses getApps() to prevent multiple initializations in development
 * (Next.js hot reload can cause multiple initializations).
 * 
 * Only initializes if API key is available to prevent build errors.
 */
let firebaseApp: FirebaseApp | null = null;

if (firebaseApiKey && firebaseApiKey !== '') {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }
}

/**
 * Firestore database instance.
 * 
 * This instance is optimized for scalable usage logging and analytics.
 * Use this for:
 * - User activity logging
 * - Analytics data collection
 * - High-volume event tracking
 * - Performance metrics
 * 
 * Note: This will be null if Firebase is not configured. Validate using
 * validateFirebaseConfig() before use.
 * 
 * @example
 * ```ts
 * import { db, validateFirebaseConfig } from '@/lib/db/firebase';
 * validateFirebaseConfig(); // Throws if not configured
 * import { collection, addDoc } from 'firebase/firestore';
 * await addDoc(collection(db, 'usage_logs'), { ... });
 * ```
 */
export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;

/**
 * Validates that Firebase environment variables are configured.
 * Call this function before using the Firestore client in runtime code.
 * 
 * @throws Error if environment variables are missing
 */
export function validateFirebaseConfig(): void {
  if (!firebaseApiKey || firebaseApiKey === '') {
    throw new Error('Missing FIREBASE_API_KEY environment variable');
  }
  if (!firebaseApp || !db) {
    throw new Error('Firebase is not initialized. Check FIREBASE_API_KEY environment variable.');
  }
}

/**
 * Firebase app instance (exported for advanced use cases)
 */
export { firebaseApp };

