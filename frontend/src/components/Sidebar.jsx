import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase'; 
import { LayoutDashboard, X, LogOut, PlusCircle, MessageSquare, LayoutGrid, ClipboardList, Bell } from 'lucide-react';

const Sidebar = ({ isAdmin, isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigationItems = [
    { name: 'Marketplace', path: '/', icon: LayoutDashboard },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { name: 'Create Listing', path: '/add', icon: PlusCircle },
    { name: 'Inbox', path: '/chats', icon: MessageSquare },
  ];

  if (isAdmin) navigationItems.push({ name: 'Admin Portal', path: '/admin', icon: ClipboardList });
  if (isMobile) navigationItems.push({ name: 'Admin Updates', path: '/updates', icon: Bell });

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}
      <aside className={`fixed left-0 top-0 z-50 h-screen w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="flex items-center justify-between mb-8">
            <span className="text-lg font-black text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full" /> KIWI-list
            </span>
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400"><X size={20} /></button>
          </div>
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} to={item.path} onClick={() => setIsOpen(false)} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase transition ${location.pathname === item.path ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                  <Icon size={16} /> {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <button onClick={() => signOut(auth).then(() => navigate('/login'))} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 text-xs font-bold uppercase transition">
          <LogOut size={16} /> Logout
        </button>
      </aside>
    </>
  );
};
export default Sidebar;