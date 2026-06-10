// components/AdminUpdates.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Megaphone } from 'lucide-react';

const AdminUpdates = () => {
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    // Queries the collection sorted by your timestamp field
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
    return <div className="text-xs text-slate-600 italic">No active admin updates.</div>;
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => (
        <div key={update.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-blue-400">
            <Megaphone size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Update</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {update.text || update.message}
          </p>
          <div className="mt-3 text-[9px] text-slate-500 font-bold uppercase">
            {update.timestamp?.toDate().toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminUpdates;