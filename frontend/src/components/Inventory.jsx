import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { auth } from '../config/firebase'; // Added import for auth

const Inventory = () => { // Removed 'token' prop since we fetch it directly
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        // --- NEW IMPLEMENTATION: Force refresh the token ---
        if (!auth.currentUser) return; // Exit if no user
        const token = await auth.currentUser.getIdToken(true); 

        const response = await fetch(`${API_BASE_URL}/api/users/me/inventory`, {
          method: 'GET', // Explicitly set GET method
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 403) {
          console.error("Auth failed: Token rejected by backend.");
          return;
        }

        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Inventory fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []); // Dependency array empty as we get auth state directly from Firebase

  if (loading) return <div>Loading your inventory...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">My Inventory</h1>
      
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="p-4 border rounded-xl bg-white shadow-sm">
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.address}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">No items found in your inventory yet.</p>
      )}
    </div>
  );
};

export default Inventory;