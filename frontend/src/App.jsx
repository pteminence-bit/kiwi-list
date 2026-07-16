import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase'; 

import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AdminUpdates from './components/AdminUpdates';

import MarketplaceFeed from './pages/MarketplaceFeed';
import CreateListing from './pages/CreateListing'; 
import EditListing from './components/EditListing';
import ManageListings from './pages/ManageListings';
import AdminPortal from './pages/AdminPortal';
import WalletCard from './components/WalletCard';
import Settings from './pages/Settings'; 
import AuthPage from './pages/AuthPage';
import PaymentSuccess from './pages/PaymentSuccess'; 
import Inventory from './components/Inventory';
import ChatsPage from './pages/ChatsPage';
import Dashboard from './pages/Dashboard';

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user?.uid) {
        try {
          // --- ALIGNED: Standard Firebase UID usage ---
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setIsAdmin(userDocSnap.data().role === 'admin');
          }
        } catch (error) {
          console.error("DashboardLayout Admin Check Error: ", error);
        }
      }
    };
    
    if (!loading && user) checkAdminStatus();
  }, [user, loading]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />; 

  // Firebase Auth standard property
  if (!user.emailVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 w-full p-6 text-center text-white">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl">
          <h2 className="text-xl font-black mb-2">Account Not Verified</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Please check your email inbox and click the verification link.
          </p>
          <button onClick={() => window.location.reload()} className="w-full bg-blue-600 hover:bg-blue-700 text-xs font-bold px-5 py-3 rounded-lg transition">
            I've verified my email, refresh page
          </button>
        </div>
      </div>
    );
  }

  const isChatRoute = location.pathname.startsWith('/chats') || location.pathname.startsWith('/chat/');

  return (
    <div className="flex w-full min-h-screen bg-slate-950 text-white">
      <Sidebar isAdmin={isAdmin} isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />

      <div className="flex-1 lg:ml-64 flex min-h-screen">
        <div className="lg:hidden fixed top-4 right-4 z-40">
           <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-slate-900 border border-slate-800 rounded-lg shadow-lg">
             <Menu size={24} />
           </button>
        </div>

        <main className={`flex-1 w-full mx-auto pt-8 px-4 md:px-6 ${isChatRoute ? 'max-w-5xl' : 'max-w-2xl'}`}>
          <Routes>
            <Route path="/" element={<MarketplaceFeed token={user.accessToken} />} />
            <Route path="/add" element={<CreateListing token={user.accessToken} />} />
            <Route path="/manage" element={<ManageListings token={user.accessToken} />} />
            <Route path="/admin" element={isAdmin ? <AdminPortal token={user.accessToken} /> : <Navigate to="/" />} />
            <Route path="/wallet" element={<WalletCard token={user.accessToken} />} />
            <Route path="/settings" element={<Settings token={user.accessToken} />} />
            <Route path="/chats" element={<ChatsPage token={user.accessToken} />} />
            <Route path="/chat/:chatId" element={<ChatsPage token={user.accessToken} />} />
            <Route path="/updates" element={<div className="p-4"><AdminUpdates /></div>} />
            <Route path="/success" element={<PaymentSuccess />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/edit-listing/:id" element={<EditListing token={user.accessToken} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/kyc" element={<KYC token={token} isVerified={user.isVerified} />} />
          </Routes>
        </main>

        {!isChatRoute && (
          <aside className="hidden xl:block w-80 border-l border-slate-800 p-6 shrink-0">
            <div className="sticky top-8">
              <h2 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">KIWI-list Latest</h2>
              <AdminUpdates />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/*" element={<DashboardLayout />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;