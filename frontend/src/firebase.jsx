import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvy_Qr-4yryox-tChNzuaVKA4tnl_smHg",
  authDomain: "kiwi-list-78172.firebaseapp.com",
  projectId: "kiwi-list-78172",
  storageBucket: "kiwi-list-78172.firebasestorage.app",
  messagingSenderId: "804700642603",
  appId: "1:804700642603:web:40a6b08b0aeba5488f396e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);