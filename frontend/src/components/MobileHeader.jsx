import React from 'react';
import { Menu } from 'lucide-react';

const MobileHeader = ({ setIsOpen }) => {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-[#0f172a] text-white flex items-center justify-between px-4 z-30 lg:hidden shadow-md border-b border-slate-800/50 backdrop-blur-sm bg-opacity-95">
      <div className="text-xl font-black text-blue-500 tracking-wider">KIWI-list</div>
      <button 
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 active:scale-95 transition-all duration-200"
      >
        <Menu size={24} />
      </button>
    </div>
  );
};

export default MobileHeader;