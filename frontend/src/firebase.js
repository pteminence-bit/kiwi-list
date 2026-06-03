// frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Replace these placeholders with your actual Web App credentials 
// found in your Firebase Console (Project Settings > General > Your Apps)
const firebaseConfig = {
  apiKey: "AIzaSyYourActualAPIKeyHere",
  authDomain: "kiwi-list.firebaseapp.com",
  projectId: "kiwi-list",
  storageBucket: "kiwi-list.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the Auth instance for your AuthContext to consume
export const auth = getAuth(app);
