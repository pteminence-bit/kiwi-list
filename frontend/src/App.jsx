import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MarketplaceFeed from './pages/MarketplaceFeed';
import ManageListings from './pages/ManageListings';
import WalletCard from './components/WalletCard';
import ImageUploader from './components/ImageUploader';
import AdminPortal from './pages/AdminPortal';
import Settings from './pages/Settings';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Firebase Client SDK SDK drivers
import { signInWithEmailAndPassword } from 'firebase/auth'; 
import { auth } from './firebase'; 

// --- PRODUCTION LOGIN VIEW ---
const LoginPage = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // If the user logs in successfully, immediately bounce them out to the feed
  if (user) {
    return <Navigate to="/" />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Authentication Error:", err.code);
      // Clean fallback human error mapping responses
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password credential credentials.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please format your email address correctly.');
      } else {
        setError('Failed to securely establish connection session.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-blue-400">KIWI-list</h2>
          <p className="text-sm text-slate-400 mt-2">Real Estate Marketplace Portal</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-200" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-200" 
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 font-medium rounded-lg transition mt-6 flex items-center justify-center"
          >
            {loading ? "Authenticating Session Vault..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- CORE DASHBOARD LAYOUT HULL ---
const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult(true);
          setIsAdmin(!!idTokenResult.claims.admin);
        } catch (error) {
          console.error("Error checking admin claims:", error);
          setIsAdmin(false);
        }
      }
      setCheckingRole(false);
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading]);

  if (loading || checkingRole) {
    return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />; 
  }

  // Access user's active session web token directly via the payload instance property
  const token = user.accessToken;

  return (
    <div className="flex bg-slate-950 min-h-screen text-white">
      <Sidebar isAdmin={isAdmin} /> 
      <main className="flex-1 ml-64 p-8">
        <Routes>
          <Route path="/" element={<MarketplaceFeed token={token} />} />
          <Route path="/manage" element={<ManageListings token={token} />} />
          <Route path="/admin" element={isAdmin ? <AdminPortal token={token} /> : <Navigate to="/" replace />} />
          <Route path="/wallet" element={<WalletCard token={token} />} />
          <Route path="/settings" element={<Settings token={token} />} />
          <Route path="/add" element={
            <div className="max-w-2xl bg-slate-900 rounded-xl shadow-xl border border-slate-800 p-6">
              <h2 className="text-xl font-bold mb-4">Create Listing</h2>
              <ImageUploader token={token} />
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

// --- MAIN ROUTER ENTRY POINT ---
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<DashboardLayout />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;