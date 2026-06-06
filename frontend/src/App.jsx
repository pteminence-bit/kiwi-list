import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase'; // Ensure this points to your client-side firebase config initialization file

// Context & Component Imports
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

// Pages/Views Imports
import MarketplaceFeed from './pages/MarketplaceFeed';
import CreateListing from './pages/CreateListing'; 
import ManageListings from './pages/ManageListings';
import AdminPortal from './pages/AdminPortal';
import WalletCard from './components/WalletCard';
import Settings from './pages/SettingsPage'; 
import AuthPage from './pages/AuthPage'; 

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // New dynamic security verification hook state
  const [checkingRole, setCheckingRole] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          // Fetch directly from Firestore users collection to find role field mutations instantly
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            
            // Check Admin Status
            if (userData.role === 'admin') {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }

            // Check Identity Verification Status
            if (userData.isVerifiedAgent === true || userData.role === 'agent') {
              setIsVerified(true);
            } else {
              setIsVerified(false);
            }
          } else {
            setIsAdmin(false);
            setIsVerified(false);
          }
        } catch (error) {
          console.error("Error checking Firestore admin role status field configuration:", error);
          setIsAdmin(false);
          setIsVerified(false);
        }
      }
      setCheckingRole(false);
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading]);

  if (loading || checkingRole) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />; 
  }

  const token = user.accessToken;

  return (
    <div className="flex bg-slate-950 min-h-screen text-white flex-col lg:flex-row">
      {/* Top Mobile Navbar Header Panel */}
      <header className="lg:hidden w-full bg-[#0f172a] border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="text-xl font-bold text-blue-400 tracking-tight">KIWI-list</div>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-slate-400 hover:text-white"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Passing State Hooks into Sidebar Instance */}
      <Sidebar isAdmin={isAdmin} isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} /> 

      {/* Responsive Content Workspace Window Wrapper */}
      <main className="flex-1 lg:ml-64 p-4 md:p-8">
        <Routes>
          <Route path="/" element={<MarketplaceFeed token={token} />} />
          <Route path="/add" element={<CreateListing token={token} />} />
          <Route path="/manage" element={<ManageListings token={token} />} />
          <Route path="/admin" element={isAdmin ? <AdminPortal token={token} /> : <Navigate to="/" replace />} />
          <Route path="/wallet" element={<WalletCard token={token} isVerified={isVerified} />} />
          <Route path="/settings" element={<Settings token={token} isVerified={isVerified} />} />
          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

// Main App Wrapper to provide Auth Context and Router boundaries
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Handled standalone login route wrapper mapping directly to AuthPage */}
          <Route path="/login" element={<AuthPage />} />
          
          {/* All dashboard views match inside DashboardLayout */}
          <Route path="/*" element={<DashboardLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}