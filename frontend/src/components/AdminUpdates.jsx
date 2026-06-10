// components/AdminUpdates.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Megaphone } from 'lucide-react';

const AdminUpdates = () => {
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'adminUpdates'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUpdates(updatesData);
    });

    return () => unsubscribe();
  }, []);

  if (updates.length === 0) {
    return (
      <div className="p-4 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-center">
        <p className="text-[11px] text-slate-500 font-medium italic">No active system updates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {updates.map((update) => (
        <div 
          key={update.id} 
          className="bg-[#1e293b] border-l-4 border-l-blue-500 p-4 rounded-r-lg shadow-md transition-all hover:bg-[#253246]"
        >
          <div className="flex items-center gap-2 mb-2 text-blue-400">
            <Megaphone size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">System Update</span>
          </div>
          
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {update.text || update.message}
          </p>
          
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              {update.timestamp?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminUpdates;