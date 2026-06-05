import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Trash2, ShieldX } from 'lucide-react';

const AdminPortal = ({ token }) => {
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/review-queue', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch queue');
      }
      return data;
    })
    .then((data) => {
      // Ensure data is strictly an array before setting state
      setQueue(Array.isArray(data) ? data : []);
      setLoading(false);
    })
    .catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  }, [token]);

  const handleAction = async (listingId, action) => {
    try {
      const res = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ listingId, action })
      });
      if (res.ok) {
        setQueue(queue.filter(item => item.id !== listingId));
      }
    } catch (err) {
      console.error("Moderation execution error:", err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Admin Review Vault...</div>;

  if (error) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen ml-64 flex flex-col items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center max-w-md shadow-sm">
          <ShieldX className="mx-auto mb-3 text-red-500" size={40} />
          <h3 className="font-bold text-lg mb-1">Access Denied</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <p className="text-xs text-slate-400">Make sure your Firestore user document has <code className="bg-slate-200 px-1 rounded text-red-600">role: "admin"</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen ml-64">
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
                <p className="text-xs text-slate-500">{item.title || "Untitled Property"} - ₦{item.price?.toLocaleString()}</p>
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