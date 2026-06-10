const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ... (keep your existing useEffect for role checking)

  return (
    <div className="flex w-full min-h-screen bg-slate-950 text-white">
      {/* Sidebar: Fixed, always present on desktop, drawer on mobile */}
      <Sidebar isAdmin={isAdmin} isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex">
        {/* Mobile menu trigger: Only visible on mobile */}
        <div className="lg:hidden fixed top-4 right-4 z-40">
           <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-slate-900 rounded-lg"><Menu /></button>
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
            {/* Added a route for mobile updates page if needed */}
            <Route path="/updates" element={<div className="p-8"><AdminUpdates /></div>} />
          </Routes>
        </main>

        {/* Right Admin Updates: Hidden on mobile */}
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

export default App;