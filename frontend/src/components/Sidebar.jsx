import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // 1. Added useNavigate
import { getAuth, signOut } from 'firebase/auth'; // 2. Imported Firebase Auth methods
import { LayoutDashboard, Wallet, Building2, ClipboardList, Settings, LogOut, X } from 'lucide-react';

const Sidebar = ({ isAdmin, isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate(); // Hook to redirect user after logging out

  const navigationItems = [
    { name: 'Marketplace', path: '/', icon: LayoutDashboard },
    { name: 'My Listings', path: '/manage', icon: Building2 },
    { name: 'My Wallet', path: '/wallet', icon: Wallet },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (isAdmin) {
    navigationItems.splice(1, 0, { name: 'Admin Portal', path: '/admin', icon: ClipboardList });
  }

  const isActive = (path) => location.pathname === path;

  // 3. Handle Logout Trigger Event
  const handleLogout = async () => {
    const auth = getAuth();
    try {
      if (window.confirm("Are you sure you want to log out of KIWI-list?")) {
        await signOut(auth);
        setIsOpen(false); // Close mobile menu drawer if open
        navigate('/');    // Redirect back to home page or login screen
      }
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to close session securely. Please try again.");
    }
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backing */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Navigation Container */}
      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 p-4 transform transition-transform duration-200 flex flex-col justify-between
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between pl-2 pb-6 border-b border-slate-800 mb-6">
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full" /> KIWI-list
            </span>
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
              <X size={20} />
            </button>
          </div>

          {/* Navigation Route Map Links */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold tracking-wide uppercase transition-all duration-150 ${
                    active 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions block section */}
        <div className="pt-4 border-t border-slate-800">
          {/* 4. Connected the handler function to the click action */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold tracking-wide uppercase text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;