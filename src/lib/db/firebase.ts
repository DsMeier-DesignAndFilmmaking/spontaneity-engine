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

// Validate environment variable
const firebaseApiKey = process.env.FIREBASE_API_KEY;

if (!firebaseApiKey) {
  throw new Error('Missing FIREBASE_API_KEY environment variable');
}

/**
 * Firebase configuration object.
 * 
 * In a production setup, you would typically include additional configuration
 * such as project ID, auth domain, etc. For now, we're using the API key
 * from environment variables.
 * 
 * TODO: Add additional Firebase config values to .env.local when Firebase project is created
 */
const firebaseConfig = {
  apiKey: firebaseApiKey,
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
 */
let firebaseApp: FirebaseApp;

if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
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
 * @example
 * ```ts
 * import { db } from '@/lib/db/firebase';
 * import { collection, addDoc } from 'firebase/firestore';
 * await addDoc(collection(db, 'usage_logs'), { ... });
 * ```
 */
export const db: Firestore = getFirestore(firebaseApp);

/**
 * Firebase app instance (exported for advanced use cases)
 */
export { firebaseApp };

