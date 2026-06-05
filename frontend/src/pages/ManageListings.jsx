import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const ManageListings = ({ token }) => {
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/listings/my-listings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setMyListings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch error:", err);
        setMyListings([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchMyListings();
    else setLoading(false);
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this property listing?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete on server');
      setMyListings(prevListings => prevListings.filter(item => item.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Could not remove the listing from the server. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500 min-h-screen w-full md:pl-72 flex items-center justify-center">
        Accessing listings vault...
      </div>
    );
  }

  return (
    // Fixed ml-64 to a responsive padding-left: md:pl-72
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen w-full md:pl-72 pt-20 md:pt-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Manage My Listings</h1>
        <p className="text-xs md:text-sm text-slate-500">Sort, edit, and keep track of your active marketplace placements.</p>
      </div>

      {/* --- DESKTOP VIEW: Visible only on Medium screens and up --- */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                      {(property.tier || 'free').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-700">
                    ₦{property.price ? property.price.toLocaleString() : '0'}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      property.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {property.status || 'pending'}
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
        </div>
      </div>

      {/* --- MOBILE VIEW: Visible only on small screens --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {myListings.map((property) => (
          <div key={property.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{property.title || "Unnamed Asset"}</h3>
                <p className="text-xs text-slate-400">{property.address || "No address assigned"}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${property.tier === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                {(property.tier || 'free').toUpperCase()}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-sm">
              <span className="font-bold text-slate-700">₦{property.price ? property.price.toLocaleString() : '0'}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${property.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {property.status || 'pending'}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Eye size={14} /> {property.views || 0} views
              </span>
              <div className="flex gap-2">
                <button className="p-2 text-slate-600 bg-slate-100 rounded-lg"><Edit size={14} /></button>
                <button onClick={() => handleDelete(property.id)} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {myListings.length === 0 && (
        <div className="p-12 text-center text-slate-400 italic">
          You haven't posted any properties yet.
        </div>
      )}
    </div>
  );
};

export default ManageListings;