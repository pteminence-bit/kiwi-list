import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, X, PlusCircle, MessageSquare, LayoutGrid, ClipboardList, Bell } from 'lucide-react';
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
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { name: 'Add', path: '/add', icon: PlusCircle },
    { name: 'Inbox', path: '/chats', icon: MessageSquare },
  ];

  if (isAdmin) navigationItems.push({ name: 'Admin', path: '/admin', icon: ClipboardList });
  if (isMobile) navigationItems.push({ name: 'News', path: '/updates', icon: Bell });

  // Mobile: Bottom bar hides on scroll. Desktop: Sidebar always visible.
  const shouldHide = isMobile && !isVisible && !isOpen;

  return (
    <>
      {/* Overlay for mobile menu */}
      {isOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}
      
      <aside className={`fixed z-50 bg-slate-900 border-slate-800 transition-all duration-300 ease-in-out
        lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:flex lg:flex-col lg:translate-x-0
        bottom-0 left-0 w-full border-t flex flex-row justify-around items-center p-2 lg:p-6
        ${shouldHide ? 'translate-y-full' : 'translate-y-0'}
      `}>
        {/* Desktop Logo - Hidden on Mobile */}
        <div className="hidden lg:flex items-center justify-between mb-8 w-full">
          <span className="text-lg font-black text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full" /> KIWI-list
          </span>
        </div>

        <nav className="flex flex-row lg:flex-col w-full justify-around lg:justify-start lg:space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.name} to={item.path} 
                className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-3 p-2 lg:px-4 lg:py-3 rounded-lg text-[10px] lg:text-xs font-bold uppercase transition ${active ? 'text-blue-500 lg:bg-blue-600 lg:text-white' : 'text-slate-400 hover:text-white'}`}>
                <Icon size={20} /> <span className="hidden lg:block">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
export default Sidebar;