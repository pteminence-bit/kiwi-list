import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react';

const AdminPortal = ({ token }) => {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    fetch('/api/admin/review-queue', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setQueue);
  }, [token]);

  const handleAction = async (listingId, action) => {
    await fetch('/api/admin/moderate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ listingId, action })
    });
    setQueue(queue.filter(item => item.id !== listingId));
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Moderate Activities</h2>
      <div className="space-y-4">
        {queue.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Flagged Listing #{item.id.slice(0,5)}</p>
                <p className="text-xs text-slate-500">{item.title} - ₦{item.price}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAction(item.id, 'approve')} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition">
                Approve
              </button>
              <button onClick={() => handleAction(item.id, 'delete')} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition">
                Delete
              </button>
            </div>
          </div>
        ))}
        {queue.length === 0 && <p className="text-slate-400 italic">No items pending review.</p>}
      </div>
    </div>
  );
};

export default AdminPortal;
