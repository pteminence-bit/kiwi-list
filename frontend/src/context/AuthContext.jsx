import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';

/**
 * AuthContext
 * Manages the global authentication state for the KIWI-list application.
 * Provides the user session, loading status, and logout functionality.
 */
const AuthContext = createContext({
  user: null,
  loading: true,
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes (login/logout/token refresh)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("AuthContext logout error:", error);
    }
  };

  const value = {
    user,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth hook
 * Provides a clean interface for child components to access auth state.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};