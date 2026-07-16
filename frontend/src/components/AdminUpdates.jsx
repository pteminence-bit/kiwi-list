import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { Megaphone, BellRing, Clock } from 'lucide-react';

/**
 * AdminUpdates
 * Retrieves real-time broadcast messages from the 'adminUpdates' collection.
 * Provides critical platform information to users.
 */
const AdminUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(collection(db, 'adminUpdates'), orderBy('timestamp', 'desc'));
        
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const updatesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setUpdates(updatesData);
          setLoading(false);
        }, (error) => {
          console.error("Firestore Error in AdminUpdates:", error.message);
          setLoading(false);
        });
      } else {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        setUpdates([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-center">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">Syncing broadcasts...</p>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
        <BellRing size={24} className="text-slate-300 mx-auto mb-2" />
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No active updates</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => (
        <div 
          key={update.id} 
          className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-blue-600">
              <Megaphone size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">System Broadcast</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
              <Clock size={10} />
              {update.timestamp?.toDate ? update.timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
            </div>
          </div>
          
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {update.text || update.message}
          </p>
          
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-[9px] font-bold text-slate-400 uppercase">Live Update</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminUpdates;