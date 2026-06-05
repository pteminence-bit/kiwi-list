// backend/config/firebase.js
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  // Production environment configuration (Render)
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} else {
  // Local machine fallback development environment configuration
  serviceAccount = JSON.parse(
    await readFile(new URL('../firebase-service-account.json', import.meta.url))
  );
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const db = admin.firestore();
export const auth = admin.auth();