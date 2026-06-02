import { LayoutDashboard, Wallet, ListPlus, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isAdmin }) => {
  const { logout } = useAuth();

  const menuItems = [
    { icon: <LayoutDashboard size={20}/>, label: 'Dashboard', path: '/' },
    { icon: <Wallet size={20}/>, label: 'My Wallet', path: '/wallet' },
    { icon: <ListPlus size={20}/>, label: 'Add New Listing', path: '/add' },
    { icon: <Settings size={20}/>, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="w-64 h-screen bg-[#0f172a] text-white flex flex-col p-4 fixed">
      <div className="text-2xl font-bold text-blue-400 mb-10 px-2">KIWI-list</div>
      
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3 p-3 hover:bg-blue-600 rounded-lg cursor-pointer transition">
            {item.icon} <span>{item.label}</span>
          </div>
        ))}
        {isAdmin && (
          <div className="mt-8 pt-8 border-t border-slate-700">
            <div className="flex items-center gap-3 p-3 text-orange-400 hover:bg-slate-800 rounded-lg cursor-pointer">
              <ShieldCheck size={20}/> <span>Admin Portal</span>
            </div>
          </div>
        )}
      </nav>

      <button onClick={logout} className="flex items-center gap-3 p-3 text-red-400 hover:bg-red-900/20 rounded-lg transition">
        <LogOut size={20}/> <span>Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;
