import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase'; 
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AdminUpdates from './components/AdminUpdates';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) setIsAdmin(snap.data().role === 'admin');
      }
    };
    if (user) checkAdminStatus();
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex w-full min-h-screen bg-slate-950 text-white">
      {/* Fixed Sidebar - No top bar here */}
      <Sidebar isAdmin={isAdmin} isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />

      {/* Main Container - The lg:ml-64 creates the desktop sidebar space */}
      <div className="flex-1 lg:ml-64 flex min-h-screen">
        
        {/* Mobile-only Menu Button */}
        <div className="lg:hidden fixed top-4 right-4 z-40">
           <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-slate-900 rounded-lg"><Menu size={24} /></button>
        </div>

        {/* Middle Feed */}
        <main className="flex-1 w-full max-w-2xl mx-auto pt-8 px-4">
          <Routes>
            <Route path="/" element={<MarketplaceFeed token={user.accessToken} />} />
            <Route path="/add" element={<CreateListing token={user.accessToken} />} />
            <Route path="/manage" element={<ManageListings token={user.accessToken} />} />
            <Route path="/admin" element={isAdmin ? <AdminPortal token={user.accessToken} /> : <Navigate to="/" />} />
            <Route path="/wallet" element={<WalletCard token={user.accessToken} />} />
            <Route path="/settings" element={<Settings token={user.accessToken} />} />
            <Route path="/updates" element={<div className="p-4"><AdminUpdates /></div>} />
          </Routes>
        </main>

        {/* Right Admin Updates */}
        <aside className="hidden xl:block w-80 border-l border-slate-800 p-6">
          <div className="sticky top-8">
            <h2 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">Admin Updates</h2>
            <AdminUpdates />
          </div>
        </aside>
      </div>
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
