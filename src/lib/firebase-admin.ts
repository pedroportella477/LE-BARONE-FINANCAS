
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// Ensure your service account key JSON file is correctly referenced
// and that GOOGLE_APPLICATION_CREDENTIALS environment variable is set
// OR initialize with cert directly.

if (!admin.apps.length) {
  try {
    // Check if GOOGLE_APPLICATION_CREDENTIALS is set (e.g., in Vercel or Google Cloud)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON) {
        // Fallback to direct JSON key if GOOGLE_APPLICATION_CREDENTIALS is not set
        // Useful for local dev if you don't want to set the env var system-wide
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } else {
        // For local development, you might point to a local file path.
        // This is NOT recommended for production.
        // Create a serviceAccountKey.json file in your project root (and add to .gitignore)
        // from Firebase Project Settings > Service accounts
        // const serviceAccount = require('../../serviceAccountKey.json'); // Adjust path as needed
        // admin.initializeApp({
        //   credential: admin.credential.cert(serviceAccount)
        // });
        console.warn(
            "Firebase Admin SDK not initialized. " +
            "For local development, ensure 'FIREBASE_SERVICE_ACCOUNT_KEY_JSON' env var is set with the JSON key content, " +
            "or 'GOOGLE_APPLICATION_CREDENTIALS' env var points to the service account key file. " +
            "Alternatively, for very specific local setups, you can load it via require('../../serviceAccountKey.json')."
        );
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
  }
}

export default admin;
