import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// 1. Load your secure Firebase Admin Service Account JSON file.
// Make sure this file actually exists on your backend container and is hidden via .gitignore
const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("../firebase-service-account.json", import.meta.url))
);

// 2. Initialize the Admin SDK app, embedding the web API Key 
// so that `db.app.options.apiKey` resolves correctly in your login route!
const adminApp = initializeApp({
  credential: cert(serviceAccount),
  // Paste your extracted Web API Key here:
  apiKey: "AIzaSyBvy_Qr-4yryox-tChNzuaVKA4tnl_smHg" 
});

export const auth = getAuth(adminApp);
export const db = getFirestore(adminApp);