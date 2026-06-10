import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase'; 

import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AdminUpdates from './components/AdminUpdates'; // Ensure you have this component created

import MarketplaceFeed from './pages/MarketplaceFeed';
import CreateListing from './pages/CreateListing'; 
import ManageListings from './pages/ManageListings';
import AdminPortal from './pages/AdminPortal';
import WalletCard from './components/WalletCard';
import Settings from './pages/Settings'; 
import AuthPage from './pages/AuthPage'; 

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerified, setIsVerified] = useState(false); 
  const [checkingRole, setCheckingRole] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setIsAdmin(userData.role === 'admin');
            setIsVerified(userData.isVerifiedAgent === true || userData.role === 'agent');
          }
        } catch (error) {
          console.error(error);
        }
      }
      setCheckingRole(false);
    };
    if (!loading) checkAdminStatus();
  }, [user, loading]);

  if (loading || checkingRole) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />; 

  const token = user.accessToken;

  return (
    <div className="flex w-full min-h-screen bg-slate-950 text-white">
      {/* Mobile Header */}
      <header className="lg:hidden w-full bg-[#0f172a] border-b border-slate-800 p-4 flex items-center justify-between fixed top-0 z-30">
        <div className="text-xl font-bold text-blue-400">KIWI-list</div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2"><Menu size={24} /></button>
      </header>

      {/* DESKTOP LAYOUT STRUCTURE */}
      {/* 1. LEFT: Navigation */}
      <div className="hidden lg:block w-64 border-r border-slate-800 shrink-0">
        <Sidebar isAdmin={isAdmin} isOpen={true} setIsOpen={() => {}} />
      </div>

      {/* 2. MIDDLE: Marketplace Feed / Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto pt-20 lg:pt-8 px-4">
        <Routes>
          <Route path="/" element={<MarketplaceFeed token={token} />} />
          <Route path="/add" element={<CreateListing token={token} />} />
          <Route path="/manage" element={<ManageListings token={token} />} />
          <Route path="/admin" element={isAdmin ? <AdminPortal token={token} /> : <Navigate to="/" replace />} />
          <Route path="/wallet" element={<WalletCard token={token} isVerified={isVerified} />} />
          <Route path="/settings" element={<Settings token={token} isVerified={isVerified} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* 3. RIGHT: Admin Updates (Only visible on large screens) */}
      <aside className="hidden xl:block w-80 border-l border-slate-800 p-6 shrink-0">
        <div className="sticky top-8">
          <h2 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Admin Updates</h2>
          <AdminUpdates />
        </div>
      </aside>

      {/* Mobile Sidebar Trigger */}
      <Sidebar isAdmin={isAdmin} isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/*" element={<DashboardLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}