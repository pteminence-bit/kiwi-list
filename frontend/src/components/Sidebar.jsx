import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, ListPlus, Settings, LogOut, ShieldCheck } from 'lucide-react';

const Sidebar = ({ isAdmin }) => {
  const location = useLocation(); // Helps us highlight the active tab

  const menuItems = [
    { icon: <LayoutDashboard size={20}/>, label: 'Marketplace', path: '/' },
    { icon: <ListPlus size={20}/>, label: 'Manage Listings', path: '/manage' },
    { icon: <Wallet size={20}/>, label: 'My Wallet', path: '/wallet' },
  ];

  return (
    <div className="w-64 h-screen bg-[#0f172a] text-white flex flex-col p-4 fixed border-r border-slate-800">
      <div className="text-2xl font-bold text-blue-400 mb-10 px-2 italic">KIWI-list</div>
      
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <Link 
            key={item.label} 
            to={item.path} 
            className={`flex items-center gap-3 p-3 rounded-lg transition ${
              location.pathname === item.path ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            {item.icon} <span>{item.label}</span>
          </Link>
        ))}

        {isAdmin && (
          <Link to="/admin" className="flex items-center gap-3 p-3 mt-4 text-orange-400 hover:bg-orange-900/10 rounded-lg">
            <ShieldCheck size={20}/> <span>Admin Portal</span>
          </Link>
        )}
      </nav>
    </div>
  );
};
export default Sidebar;