import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let serviceAccount;

try {
  // Parse the secure credentials directly from Render's environment manager
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable.");
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error.message);
  process.exit(1);
}

const adminApp = initializeApp({
  credential: cert(serviceAccount),
  apiKey: process.env.FIREBASE_WEB_API_KEY || "AIzaSyBvy_Qr-4yryox-tChNzuaVKA4tnl_smHg"
});

export const auth = getAuth(adminApp);
export const db = getFirestore(adminApp);