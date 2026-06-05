import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  ListPlus, 
  Settings, 
  LogOut, 
  ShieldCheck,
  Home
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isAdmin }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { icon: <Home size={20}/>, label: 'Marketplace', path: '/' },
    { icon: <LayoutDashboard size={20}/>, label: 'My Listings', path: '/manage' },
    { icon: <Wallet size={20}/>, label: 'My Wallet', path: '/wallet' },
    { icon: <ListPlus size={20}/>, label: 'Post Property', path: '/add' },
    { icon: <Settings size={20}/>, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="w-64 h-screen bg-[#0f172a] text-white flex flex-col p-4 fixed left-0 top-0 z-50">
      <div className="text-2xl font-bold text-blue-400 mb-10 px-4 tracking-tight">
        KIWI-list
      </div>
      
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.label} 
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon} 
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <div className="mt-8 pt-8 border-t border-slate-800">
            <p className="text-[10px] uppercase text-slate-500 font-bold px-4 mb-2 tracking-widest">Admin Control</p>
            <Link 
              to="/admin"
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                location.pathname === '/admin' 
                  ? 'bg-orange-600 text-white' 
                  : 'text-orange-400 hover:bg-orange-950/30'
              }`}
            >
              <ShieldCheck size={20}/> 
              <span className="font-medium">Moderate Activities</span>
            </Link>
          </div>
        )}
      </nav>

      <button 
        onClick={logout} 
        className="flex items-center gap-3 p-3 text-slate-400 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-all mt-auto"
      >
        <LogOut size={20}/> 
        <span className="font-medium">Logout</span>
      </button>
    </div>
  );
};

// CRITICAL: This was likely missing or misspelled
export default Sidebar;