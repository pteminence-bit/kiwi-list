import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

const Inventory = ({ token }) => {
  // 1. Initialize with an empty array [] so .map() always works
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/me/inventory`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        // 2. Ensure data is actually an array before setting it
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Inventory fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [token]);

  if (loading) return <div>Loading your inventory...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">My Inventory</h1>
      
      {/* 3. Defensive check: only map if items exist and have length */}
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