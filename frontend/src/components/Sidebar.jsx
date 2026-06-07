import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { LayoutDashboard, Wallet, Building2, ClipboardList, Settings, LogOut, X, PlusCircle } from 'lucide-react';

const Sidebar = ({ isAdmin, isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Added 'Create Listing' explicitly to the menu array mapping
  const navigationItems = [
    { name: 'Marketplace', path: '/', icon: LayoutDashboard },
    { name: 'Create Listing', path: '/create', icon: PlusCircle },
    { name: 'My Listings', path: '/manage', icon: Building2 },
    { name: 'My Wallet', path: '/wallet', icon: Wallet },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (isAdmin) {
    // Inserts Admin Portal option securely right after Marketplace
    navigationItems.splice(1, 0, { name: 'Admin Portal', path: '/admin', icon: ClipboardList });
  }

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      if (window.confirm("Are you sure you want to log out of KIWI-list?")) {
        await signOut(auth);
        setIsOpen(false);
        navigate('/');
      }
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to close session securely. Please try again.");
    }
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backing (Stays active only on smaller portrait ports) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 2. RESPONSIVE STRUCTURE: 
        - Mobile: Vertical Side Tray pinned to the left edge (fixed left-0 bottom-0 top-0 w-64)
        - Desktop: Horizontal Header pinned across the top (lg:top-0 lg:left-0 lg:right-0 lg:w-full lg:h-16 lg:flex-row)
      */}
      <aside className={`fixed left-0 top-0 z-40 bg-slate-900 text-slate-300 border-slate-800 transition-transform duration-200 flex flex-col justify-between
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        w-64 bottom-0 border-r p-4
        lg:translate-x-0 lg:w-full lg:h-16 lg:bottom-auto lg:border-b lg:border-r-0 lg:px-8 lg:py-0 lg:flex-row lg:items-center`}
      >
        
        {/* Brand/Header Wrap */}
        <div className="flex items-center justify-between pl-2 pb-6 border-b border-slate-800 mb-6 lg:p-0 lg:m-0 lg:border-0">
          <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full" /> KIWI-list
          </span>
          {/* Close button inside mobile menu drawer view */}
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Map List Route Wrapper */}
        <nav className="space-y-1 flex-1 lg:flex lg:space-y-0 lg:gap-1 lg:justify-center lg:px-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 lg:py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all duration-150 shrink-0 ${
                  active 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={15} className={active ? 'text-white' : 'text-slate-400'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions / Logout button anchor block */}
        <div className="pt-4 border-t border-slate-800 lg:p-0 lg:m-0 lg:border-0">
          <button 
            onClick={handleLogout}
            className="w-full lg:w-auto flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold tracking-wide uppercase text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;