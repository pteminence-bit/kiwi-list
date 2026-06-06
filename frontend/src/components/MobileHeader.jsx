import React from 'react';
import { Menu } from 'lucide-react';

const MobileHeader = ({ setIsOpen }) => {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-[#0f172a] text-white flex items-center justify-between px-4 z-30 lg:hidden shadow-md">
      <div className="text-xl font-bold text-blue-400 tracking-tight">KIWI-list</div>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
      >
        <Menu size={24} />
      </button>
    </div>
  );
};

export default MobileHeader;
