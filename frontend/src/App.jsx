import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';

// Context & Component Imports
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

// Pages/Views Imports
import MarketplaceFeed from './pages/MarketplaceFeed';
import CreateListing from './pages/CreateListing'; // Ensure this file exists in your pages directory
import ManageListings from './pages/ManageListings';
import AdminPortal from './pages/AdminPortal';
import WalletCard from './components/WalletCard';
import Settings from './pages/Settings'; // Ensure this file exists in your pages directory
import AuthPage from './pages/AuthPage'; // Imported your authentication page component safely

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <Route path="/wallet" element={<WalletCard token={token} />} />
          <Route path="/settings" element={<Settings token={token} />} />
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