import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

const Inventory = ({ token }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users/me/inventory`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setItems(data));
  }, [token]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">My Inventory</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="p-4 border rounded-xl bg-white shadow-sm">
            <h3 className="font-bold">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.address}</p>
            <div className="mt-4 p-2 bg-blue-50 rounded text-xs">
              <p>Phone: {item.contactDetails?.phone}</p>
              <p>Email: {item.contactDetails?.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inventory;