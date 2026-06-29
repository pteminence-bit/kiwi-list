import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    // 💡 Fix: Monitor the auth lifecycle rather than assuming auth.currentUser is populated on mount
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Force token refresh to pass up-to-date sanitized email claims to the backend mid-session
        const token = await user.getIdToken(true); 

        const timestamp = new Date().getTime();
        // Pointing cleanly to your unified API route layout: /api/users + /me/inventory
        const url = `${API_BASE_URL}/api/users/me/inventory?t=${timestamp}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (response.status === 403) {
          console.error("Access forbidden: Account state validation or tier rules check failed.");
          return;
        }

        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Inventory fetch error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400 font-medium">
        Loading your inventory...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-black text-slate-900 mb-6">My Inventory</h1>
      
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div 
              key={item.id} 
              className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm cursor-pointer hover:shadow-md transition hover:bg-slate-50/50"
              onClick={() => setSelectedItem(item)}
            >
              {item.images?.[0] && (
                <img 
                  src={item.images[0]} 
                  alt={item.title} 
                  className="w-full h-40 object-cover rounded-lg mb-3 bg-slate-100" 
                />
              )}
              <h3 className="font-bold text-slate-800 line-clamp-1">{item.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">{item.address}</p>
              
              <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-2">
                Unlocked: {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <p className="text-slate-500 font-medium">No items found in your inventory yet.</p>
        </div>
      )}

      {/* Detail Modal View */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" 
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-white p-6 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-black text-slate-900 mb-3">{selectedItem.title}</h2>
            {selectedItem.images?.[0] && (
              <img 
                src={selectedItem.images[0]} 
                alt="Property" 
                className="w-full h-56 object-cover rounded-xl mb-4 bg-slate-100" 
              />
            )}
            <p className="text-sm text-slate-500 mb-1 font-semibold">{selectedItem.address}</p>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 max-h-36 overflow-y-auto pr-1">
              {selectedItem.description || "No description provided for this listing."}
            </p>
            <div className="flex justify-end">
              <button 
                onClick={() => setSelectedItem(null)} 
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;