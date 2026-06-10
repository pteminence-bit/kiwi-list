import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Megaphone } from 'lucide-react';

const AdminUpdates = () => {
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'admin_announcements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUpdates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-4">
      {updates.map(update => (
        <div key={update.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Megaphone size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Admin Notice</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{update.text}</p>
          <span className="text-[9px] text-slate-500 mt-2 block">
            {update.createdAt?.toDate().toLocaleDateString()}
          </span>
        </div>
      ))}
      {updates.length === 0 && <p className="text-xs text-slate-600 italic">No active admin notices.</p>}
    </div>
  );
};

export default AdminUpdates;