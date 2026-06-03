import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MarketplaceFeed from './pages/MarketplaceFeed';
import ManageListings from './pages/ManageListings';
import AdminPortal from './pages/AdminPortal';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar isAdmin={true} />
        {/* Important: Add margin-left to the main content so it isn't hidden behind the fixed sidebar */}
        <main className="flex-1 ml-64"> 
          <Routes>
            <Route path="/" element={<MarketplaceFeed />} />
            <Route path="/manage" element={<ManageListings />} />
            <Route path="/admin" element={<AdminPortal />} />
            {/* If a route doesn't exist, show the feed */}
            <Route path="*" element={<MarketplaceFeed />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;