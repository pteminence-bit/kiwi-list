import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import MarketplaceFeed from './pages/MarketplaceFeed';
// ... other imports

function App() {
  return (
    <AuthProvider> 
      {/* Everything inside here can now "hear" the Auth broadcast */}
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          {/* Your Routes or Pages go here */}
          <MarketplaceFeed />
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;