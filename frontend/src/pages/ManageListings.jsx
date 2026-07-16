import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const ManageListings = ({ token }) => {
  const navigate = useNavigate();
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch listings associated with the authenticated user
  useEffect(() => {
    const fetchMyListings = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/listings/my-listings`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch listings');
        const data = await response.json();
        setMyListings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyListings();
  }, [token]);

  const handleEdit = (id) => navigate(`/edit-listing/${id}`);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this property listing?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete');
      setMyListings(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert("Could not remove the listing.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-500 text-xs font-bold uppercase tracking-widest gap-2">
        <Loader2 className="animate-spin" size={18} /> Accessing listings vault...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-black text-white">Manage My Listings</h1>
          <p className="text-sm text-slate-400">Track and edit your active property placements.</p>
        </header>

        {/* TABLE VIEW (Desktop) */}
        <div className="hidden md:block w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950/40 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Listing</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Metrics</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-200">
              {myListings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500">No property listings found.</td>
                </tr>
              ) : (
                myListings.map((property) => (
                  <tr key={property.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{property.title}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px]">{property.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${property.tier === 'premium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>
                        {property.tier || 'free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">₦{property.price?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase ${property.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {property.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <Eye size={14} className="text-slate-500" /> {property.views || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(property.id)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(property.id)} className="p-2 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CARD VIEW (Mobile) */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {myListings.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-500 text-sm">No property listings found.</div>
          ) : (
            myListings.map((property) => (
              <div key={property.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <div className="mb-2 flex justify-between items-start">
                  <h3 className="font-bold text-white text-base leading-snug">{property.title}</h3>
                  <span className={`shrink-0 ml-2 px-2 py-0.5 rounded text-[10px] font-black uppercase ${property.tier === 'premium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>
                    {property.tier || 'free'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">{property.address}</p>
                <div className="flex items-center justify-between border-t border-slate-800/60 pt-4">
                  <span className="font-black text-white text-lg">₦{property.price?.toLocaleString()}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Eye size={14} /> {property.views || 0}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(property.id)} className="p-2 bg-slate-950 rounded-lg text-slate-300"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(property.id)} className="p-2 bg-red-950/40 rounded-lg text-red-400"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageListings;