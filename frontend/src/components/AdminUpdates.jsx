// components/AdminUpdates.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Ensure 'auth' is imported to verify sessions client-side
import { onAuthStateChanged } from 'firebase/auth';
import { Megaphone } from 'lucide-react';

const AdminUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    // Monitor auth state to prevent listening to protected paths while request.auth is null
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
          console.warn("Firestore Rule Intercept for Admin Updates:", error.message);
          setLoading(false);
        });
      } else {
        // If logged out, clear active broadcast records and close open listener pipelines
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
      <div className="p-4 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-center animate-pulse">
        <p className="text-[11px] text-slate-500 font-medium italic">Checking broadcasts...</p>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="p-4 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-center">
        <p className="text-[11px] text-slate-500 font-medium italic">No active updates.</p>
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
            <span className="text-[9px] font-black uppercase tracking-widest">Updates</span>
          </div>
          
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {update.text || update.message}
          </p>
          
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              {update.timestamp?.toDate ? update.timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
            </span>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminUpdates;