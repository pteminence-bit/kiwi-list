import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';

const AdminUpdates = () => {
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    // Replace 'admin_updates' with your actual Firestore collection name
    const q = query(collection(db, 'adminUpdates'), orderBy('createdAt', 'desc'), limit(5));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUpdates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-4">
      {updates.length === 0 ? (
        <p className="text-xs text-slate-600 italic">No current updates.</p>
      ) : (
        updates.map((update) => (
          <div key={update.id} className="bg-[#0f172a] border border-slate-800 p-3 rounded-lg">
            <h4 className="text-sm font-bold text-blue-400 mb-1">{update.title}</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">{update.content}</p>
            <span className="text-[9px] text-slate-500 mt-2 block">
              {update.createdAt?.toDate().toLocaleDateString()}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminUpdates;