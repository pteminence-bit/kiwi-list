import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // Added state to track selected item for detail view
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        if (!auth.currentUser) return;
        const token = await auth.currentUser.getIdToken(true); 

        const timestamp = new Date().getTime();
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

        if (response.status === 403) return;

        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Inventory fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  if (loading) return <div>Loading your inventory...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">My Inventory</h1>
      
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map(item => (
            <div 
              key={item.id} 
              className="p-4 border rounded-xl bg-white shadow-sm cursor-pointer hover:bg-gray-50"
              onClick={() => setSelectedItem(item)}
            >
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.address}</p>
              {/* Displaying Unlock Time */}
              <p className="text-xs text-gray-400 mt-2">
                Unlocked: {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">No items found in your inventory yet.</p>
      )}

      {/* Basic Detail Modal View */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white p-6 rounded-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">{selectedItem.title}</h2>
            <img src={selectedItem.images?.[0]} alt="Property" className="w-full h-48 object-cover rounded-lg mb-4" />
            <p className="text-gray-600 mb-4">{selectedItem.description}</p>
            <button onClick={() => setSelectedItem(null)} className="bg-blue-600 text-white px-4 py-2 rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;