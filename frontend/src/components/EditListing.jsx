import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import { API_BASE_URL } from '../config';
import { Landmark, Loader2 } from 'lucide-react';

const EditListing = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate(); // Hook for state-preserving redirects
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '', 
    description: '', 
    price: '', 
    address: '', 
    beds: '', 
    baths: ''
  });

  // Fetch current listing data
  useEffect(() => {
    if (!token) return;
    const fetchListing = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/listings/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
          setFormData({
            title: data.title || '',
            description: data.description || '',
            price: data.price || '',
            address: data.address || '',
            beds: data.beds || '',
            baths: data.baths || ''
          });
        } else {
          throw new Error(data.error || "Failed to load listing");
        }
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, token]);

  // Optimized single change handler for all inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Strips structural fields (like tier or ownerId) to safely pass Firestore Security Rules
      const updatePayload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        address: formData.address,
        beds: Number(formData.beds),
        baths: Number(formData.baths)
      };

      const response = await fetch(`${API_BASE_URL}/api/listings/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(updatePayload)
      });
      
      const data = await response.json();

      if (response.ok) {
        alert("Listing updated successfully!");
        navigate("/manage"); // Soft SPA routing redirect
      } else {
        throw new Error(data.error || "Update failed");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mr-2" /> Loading listing details...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto text-white bg-slate-950 rounded-2xl border border-slate-900 mt-6">
      <h2 className="text-xl font-black mb-6 flex items-center gap-2 border-b border-slate-900 pb-4">
        <Landmark className="w-6 h-6 text-blue-500" /> Edit Listing
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-400">Title</label>
          <input 
            name="title" 
            type="text"
            value={formData.title || ''} 
            onChange={handleChange} 
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500 transition" 
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-400">Description</label>
          <textarea 
            name="description" 
            value={formData.description || ''} 
            onChange={handleChange} 
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white h-28 outline-none focus:border-blue-500 transition resize-none" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-400">Address</label>
          <input 
            name="address" 
            type="text"
            value={formData.address || ''} 
            onChange={handleChange} 
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500 transition" 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Price (NGN)</label>
            <input 
              name="price" 
              type="number" 
              value={formData.price || ''} 
              onChange={handleChange} 
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500 transition" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Beds</label>
            <input 
              name="beds" 
              type="number" 
              value={formData.beds || ''} 
              onChange={handleChange} 
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500 transition" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Baths</label>
            <input 
              name="baths" 
              type="number" 
              value={formData.baths || ''} 
              onChange={handleChange} 
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500 transition" 
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-900 flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold transition flex items-center gap-2"
          >
            {saving && <Loader2 className="animate-spin" size={16} />} Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditListing;