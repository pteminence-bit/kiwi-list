import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const ManageListings = ({ token }) => {
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/listings/my-listings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setMyListings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchMyListings();
  }, [token]);

  const handleEdit = (id) => {
    window.location.href = `/edit-listing/${id}`;
  };

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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-400 text-sm font-medium animate-pulse">
        Accessing listings vault...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Manage My Listings</h1>
          <p className="text-sm text-slate-500">Track and edit your active property placements.</p>
        </header>

        {/* TABLE VIEW (Desktop) */}
        <div className="hidden md:block w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Listing</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Metrics</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {myListings.map((property) => (
                <tr key={property.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{property.title}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[200px]">{property.address}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${property.tier === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {property.tier || 'free'}
                    </span>
                  </td>
                  {/* FIXED: Explicitly set text color to slate-900 to ensure visibility */}
                  <td className="px-6 py-4 font-bold text-slate-900">₦{property.price?.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase ${property.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {property.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-500 flex items-center justify-center gap-1">
                    <Eye size={14} /> {property.views || 0}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(property.id)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(property.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CARD VIEW (Mobile) */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {myListings.map((property) => (
            <div key={property.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex justify-between items-start">
                <h3 className="font-bold text-slate-900 text-base leading-snug">{property.title}</h3>
                <span className={`shrink-0 ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${property.tier === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                  {property.tier || 'free'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">{property.address}</p>
              
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="font-black text-slate-900 text-lg">₦{property.price?.toLocaleString()}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><Eye size={16} /> {property.views}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(property.id)} className="h-12 w-12 flex items-center justify-center bg-slate-50 rounded-xl text-slate-600 active:bg-slate-100"><Edit size={20} /></button>
                    <button onClick={() => handleDelete(property.id)} className="h-12 w-12 flex items-center justify-center bg-red-50 rounded-xl text-red-600 active:bg-red-100"><Trash2 size={20} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {myListings.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
            No listings found. Start by creating your first property asset.
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageListings;import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const ManageListings = ({ token }) => {
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/listings/my-listings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setMyListings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchMyListings();
  }, [token]);

  const handleEdit = (id) => {
    window.location.href = `/edit-listing/${id}`;
  };

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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-400 text-sm font-medium animate-pulse">
        Accessing listings vault...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Manage My Listings</h1>
          <p className="text-sm text-slate-500">Track and edit your active property placements.</p>
        </header>

        {/* TABLE VIEW (Desktop) */}
        <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Listing</th>
                <th className="px-6 py-4 whitespace-nowrap">Tier</th>
                <th className="px-6 py-4 whitespace-nowrap">Price</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Metrics</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {myListings.map((property) => (
                <tr key={property.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{property.title}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[200px]">{property.address}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${property.tier === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {property.tier || 'free'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">₦{property.price?.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase ${property.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {property.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-500 flex items-center justify-center gap-1">
                    <Eye size={14} /> {property.views || 0}
                  </td>
                  {/* FIXED: Added min-w-full to action cell to prevent collapsing */}
                  <td className="px-6 py-4 text-right min-w-[120px]">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(property.id)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(property.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CARD VIEW (Mobile) */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {myListings.map((property) => (
            <div key={property.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex justify-between items-start">
                <h3 className="font-bold text-slate-900 text-base leading-snug">{property.title}</h3>
                <span className={`shrink-0 ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${property.tier === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                  {property.tier || 'free'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">{property.address}</p>
              
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="font-black text-slate-900 text-lg">₦{property.price?.toLocaleString()}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><Eye size={16} /> {property.views}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(property.id)} className="h-12 w-12 flex items-center justify-center bg-slate-50 rounded-xl text-slate-600 active:bg-slate-100"><Edit size={20} /></button>
                    <button onClick={() => handleDelete(property.id)} className="h-12 w-12 flex items-center justify-center bg-red-50 rounded-xl text-red-600 active:bg-red-100"><Trash2 size={20} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageListings;