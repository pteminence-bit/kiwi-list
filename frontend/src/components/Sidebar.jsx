import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import MarketplaceFeed from './pages/MarketplaceFeed';
import ManageListings from './pages/ManageListings';
import AdminPortal from './pages/AdminPortal';
import { useAuth } from './context/AuthContext'; // Access your auth context
import { Menu } from 'lucide-react'; // For mobile view toggles

function App() {
  const { user, token, loading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Session...</div>;

  // Determine if the user is an admin dynamically based on Firestore data profiles
  const isAdminUser = user && user.role === 'admin';

  return (
    <Router>
      <div className="flex bg-slate-50 min-h-screen">
        
        {/* Mobile Header Menu Button Bar */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 bg-slate-900 text-white rounded-md shadow-md"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* SIDEBAR COMPONENT LINKED HERE WITH DYNAMIC VALUES */}
        <Sidebar 
          isAdmin={isAdminUser} 
          isOpen={isMobileSidebarOpen} 
          setIsOpen={setIsMobileSidebarOpen} 
        />
        
        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<MarketplaceFeed token={token} />} />
            <Route path="/manage" element={<ManageListings token={token} />} />
            
            {/* Secure Route Rendering Safeguard */}
            {isAdminUser && (
              <Route path="/admin" element={<AdminPortal token={token} />} />
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;