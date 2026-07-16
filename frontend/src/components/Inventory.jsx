import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Package, MapPin, ExternalLink, Calendar, ChevronRight } from 'lucide-react';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken(true); 
        const timestamp = new Date().getTime();
        const url = `${API_BASE_URL}/api/users/me/inventory?t=${timestamp}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json'
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Securing your unlocked assets...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Inventory</h1>
        <p className="text-slate-500 mt-1">Manage and view properties you've successfully unlocked.</p>
      </div>
      
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div 
              key={item.id} 
              className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              <div className="relative h-48 overflow-hidden">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center"><Package className="text-slate-300" size={40} /></div>
                )}
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg uppercase tracking-wider">Unlocked</div>
              </div>
              
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-2">
                  <MapPin size={14} />
                  <span className="line-clamp-1">{item.address || 'Location Hidden'}</span>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar size={13} />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                  <span className="flex items-center gap-1 text-blue-600 font-bold text-xs uppercase tracking-wide">
                    View Details <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
          <Package size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Inventory Empty</h3>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto">Unlock premium property listings to store them safely in your inventory.</p>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedItem(null)}>
          <div className="bg-white p-6 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-slate-900 mb-4">{selectedItem.title}</h2>
            {selectedItem.images?.[0] && (
              <img src={selectedItem.images[0]} alt="Property" className="w-full h-64 object-cover rounded-2xl mb-6 shadow-md" />
            )}
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Address</p>
                <p className="text-sm font-semibold text-slate-800">{selectedItem.address}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Description</p>
                <p className="text-sm text-slate-600 leading-relaxed h-24 overflow-y-auto pr-2">{selectedItem.description || "No description provided."}</p>
              </div>
            </div>
            <button onClick={() => setSelectedItem(null)} className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition">Close View</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;