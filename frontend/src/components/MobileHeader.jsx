import React from 'react';
import { Menu } from 'lucide-react';

const MobileHeader = ({ setIsOpen }) => {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-slate-950/95 text-white flex items-center justify-between px-4 z-30 lg:hidden shadow-md border-b border-slate-800/80 backdrop-blur-sm">
      <div className="text-lg font-black text-white flex items-center gap-2">
        <span className="w-2 h-6 bg-blue-500 rounded-full" /> KIWI-list
      </div>
      <button 
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-900 active:scale-95 transition-all duration-200"
      >
        <Menu size={24} />
      </button>
    </div>
  );
};

export default MobileHeader;