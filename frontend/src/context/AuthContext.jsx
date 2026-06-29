import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Added: Store Firestore user metadata
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch Token
        const idToken = await currentUser.getIdToken(true);
        setToken(idToken);

        // Compute the expected "kiwi-user-..." custom document ID using user email
        const targetEmail = currentUser.email;
        const kiwiUserId = targetEmail ? `kiwi-user-${targetEmail.toLowerCase().trim()}` : currentUser.uid;

        // Fetch User Profile from Firestore to sync verification status
        try {
          // FIX: Queries document ID using the custom identifier pattern, matching backend structure
          const userDoc = await getDoc(doc(db, 'users', kiwiUserId));
          if (userDoc.exists()) {
            setProfile(userDoc.data());
          } else {
            console.warn(`Profile document not found at: users/${kiwiUserId}`);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      } else {
        setUser(null);
        setProfile(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, token, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);