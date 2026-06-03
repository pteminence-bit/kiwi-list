import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, ShieldAlert } from 'lucide-react';

const ManageListings = ({ token }) => {
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/listings/my-listings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMyListings(data);
        setLoading(false);
      });
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this property listing?")) return;
    
    // We can call an admin or basic deletion handler endpoint
    setMyListings(myListings.filter(item => item.id !== id));
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Accessing listings vault...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen ml-64">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Manage My Listings</h1>
        <p className="text-sm text-slate-500">Sort, edit, and keep track of your active marketplace placements.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Listing Details</th>
                <th className="p-4">Tier</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Metrics</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {myListings.map((property) => (
                <tr key={property.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{property.title || "Unnamed Asset"}</div>
                    <div className="text-xs text-slate-400">{property.address || "No address assigned"}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${property.tier === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {property.tier.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-700">
                    ₦{property.price?.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      property.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {property.status}
                    </span>
                  </td>
                  <td className="p-4 text-center text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <Eye size={14} /> {property.views || 0}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(property.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {myListings.length === 0 && (
            <div className="p-8 text-center text-slate-400 italic">
              You haven't posted any properties yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageListings;
