import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { LayoutDashboard, Wallet, Building2, ClipboardList, Settings, LogOut, X, PlusCircle } from 'lucide-react';

const Sidebar = ({ isAdmin, isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { name: 'Marketplace', path: '/', icon: LayoutDashboard },
    { name: 'Create Listing', path: '/add', icon: PlusCircle },
    { name: 'My Listings', path: '/manage', icon: Building2 },
    { name: 'My Wallet', path: '/wallet', icon: Wallet },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (isAdmin) {
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
      {/* Mobile Drawer Overlay Backing */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Topbar Layout Core Structure Component Container */}
      <aside className={`fixed left-0 top-0 z-40 bg-slate-900 text-slate-300 border-slate-800 transition-transform duration-200 flex flex-col justify-between
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        w-64 bottom-0 border-r p-4
        lg:translate-x-0 lg:w-full lg:h-16 lg:bottom-auto lg:border-b lg:border-r-0 lg:px-8 lg:py-0 lg:flex-row lg:items-center`}
      >
        
        {/* Brand Header Wrap */}
        <div className="flex items-center justify-between pl-2 pb-6 border-b border-slate-800 mb-6 lg:p-0 lg:m-0 lg:border-0 lg:flex-initial">
          <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full" /> KIWI-list
          </span>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Maps Link List Wrapper */}
        <nav className="space-y-1 flex-1 lg:flex lg:space-y-0 lg:gap-1 lg:justify-center lg:px-4 h-full lg:items-center">
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

        {/* Footer Actions / Logout anchor element */}
        <div className="pt-4 border-t border-slate-800 lg:p-0 lg:m-0 lg:border-0 lg:flex-initial lg:flex lg:items-center">
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