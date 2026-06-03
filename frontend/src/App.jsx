import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MarketplaceFeed from './pages/MarketplaceFeed';
import ManageListings from './pages/ManageListings';
import AdminPortal from './pages/AdminPortal';
import { AuthProvider } from './context/AuthContext';

function App() {
  // Assume we get the token from our AuthContext
  const token = "YOUR_FIREBASE_TOKEN"; 

  return (
    <AuthProvider>
      <Router>
        <div className="flex bg-slate-50 min-h-screen">
          <Sidebar isAdmin={true} /> {/* Pass actual admin status from auth */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<MarketplaceFeed token={token} />} />
              <Route path="/manage" element={<ManageListings token={token} />} />
              <Route path="/admin" element={<AdminPortal token={token} />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;