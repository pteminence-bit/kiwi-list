import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  ListPlus, 
  Settings, 
  LogOut, 
  ShieldCheck,
  Search
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isAdmin }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: <Search size={20}/>, label: 'Marketplace', path: '/' },
    { icon: <LayoutDashboard size={20}/>, label: 'Manage Posts', path: '/manage' },
    { icon: <Wallet size={20}/>, label: 'My Wallet', path: '/wallet' },
    { icon: <ListPlus size={20}/>, label: 'Create New', path: '/add' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="w-64 h-screen bg-[#0f172a] text-slate-300 flex flex-col p-4 fixed left-0 top-0 border-r border-slate-800 shadow-2xl z-50">
      {/* Logo Section */}
      <div className="flex items-center gap-2 px-2 mb-10 mt-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
        <span className="text-xl font-extrabold text-white tracking-tight">KIWI-list</span>
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 space-y-1">
        <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}

        {/* Admin Section - Only visible if isAdmin is true */}
        {isAdmin && (
          <div className="mt-8 pt-8 border-t border-slate-800">
            <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Administration</p>
            <button
              onClick={() => navigate('/admin')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                location.pathname === '/admin' 
                  ? 'bg-orange-600 text-white' 
                  : 'hover:bg-slate-800 text-orange-400 hover:text-orange-300'
              }`}
            >
              <ShieldCheck size={20}/>
              <span className="font-medium text-sm">Review Portal</span>
            </button>
          </div>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="pt-4 border-t border-slate-800">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all mb-2">
          <Settings size={20}/>
          <span className="font-medium text-sm">Settings</span>
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all"
        >
          <LogOut size={20}/>
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; // CRITICAL: This fixes your SyntaxError