import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, X, Plus, MessageSquareText, LayoutGrid, ShieldAlert, Bell, Compass } from 'lucide-react';
import { useScrollVisibility } from '../hooks/useScrollVisibility';

const Sidebar = ({ isAdmin, isOpen, setIsOpen }) => {
  const location = useLocation();
  const isVisible = useScrollVisibility();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigationItems = [
    { name: 'Explore', path: '/', icon: Compass },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { name: 'Post', path: '/add', icon: Plus },
    { name: 'Inbox', path: '/chats', icon: MessageSquareText },
  ];

  if (isAdmin) navigationItems.push({ name: 'Admin', path: '/admin', icon: ShieldAlert });
  if (isMobile) navigationItems.push({ name: 'Updates', path: '/updates', icon: Bell });

  const shouldHide = isMobile && !isVisible && !isOpen;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsOpen(false)} />}
      
      <aside className={`fixed z-50 bg-slate-950 border-slate-800 transition-all duration-300 ease-in-out
        lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:flex lg:flex-col lg:translate-x-0
        bottom-0 left-0 w-full border-t flex flex-row justify-around items-center px-2 py-3 lg:p-6
        ${shouldHide ? 'translate-y-full' : 'translate-y-0'}
      `}>
        {/* Desktop Branding */}
        <div className="hidden lg:flex items-center justify-between mb-8 w-full">
          <div className="text-lg font-black text-white flex items-center gap-3">
            <div className="w-2 h-6 bg-blue-600 rounded-full" /> 
            <span>KIWI<span className="text-blue-500">list</span></span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-row lg:flex-col w-full justify-around lg:justify-start lg:gap-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.name} to={item.path} 
                className={`flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3 p-2 lg:px-4 lg:py-3 rounded-xl text-[9px] lg:text-xs font-black uppercase tracking-widest transition-all duration-200 
                ${active 
                  ? 'text-white bg-blue-600/10 lg:bg-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-300'
                }`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} /> 
                <span className="hidden lg:block">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;