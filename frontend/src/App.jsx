import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MarketplaceFeed from './pages/MarketplaceFeed';
import ManageListings from './pages/ManageListings';
import WalletCard from './components/WalletCard';
import ImageUploader from './components/ImageUploader';
import AdminPortal from './pages/AdminPortal';
import Settings from './pages/Settings';
import { AuthProvider, useAuth } from './context/AuthContext';

const DashboardLayout = () => {
  const { user, loading } = useAuth();

  // 1. Wait for Firebase to check auth status
  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Loading session...</div>;
  }

  // 2. Redirect to Login if not authenticated
  if (!user) {
    return <Navigate to="/login" />; 
  }

  // Note: user.accessToken is standard for Firebase User objects
  const token = user.accessToken;

  return (
    <div className="flex bg-slate-950 min-h-screen text-white">
      {/* Sidebar remains fixed */}
      <Sidebar isAdmin={true} /> 
      
      {/* Main content area shifted to the right to accommodate sidebar */}
      <main className="flex-1 ml-64 p-8">
        <Routes>
          <Route path="/" element={<MarketplaceFeed token={token} />} />
          <Route path="/manage" element={<ManageListings token={token} />} />
          <Route path="/admin" element={<AdminPortal token={token} />} />
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* If you add a dedicated login page later, it goes right here: */}
          {/* <Route path="/login" element={<Login />} /> */}
          <Route path="/*" element={<DashboardLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;