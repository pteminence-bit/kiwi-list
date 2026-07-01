import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Landmark, Loader2, ArrowLeft } from 'lucide-react';

const EditListing = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
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
    if (!token || !id) return;
    
    const fetchListing = async () => {
      try {
        setError(null);
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
          throw new Error(data.error || "Failed to load listing details");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchListing();
  }, [id, token]);

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
    setError(null);
    
    try {
      // Clean up inputs to pass native primitives rather than string states
      const updatePayload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        address: formData.address.trim(),
        beds: parseInt(formData.beds, 10),
        baths: parseInt(formData.baths, 10)
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
        navigate("/manage");
      } else {
        throw new Error(data.error || "Update failed");
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <p className="text-sm font-medium tracking-wide">Loading listing details...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto text-white bg-slate-950 rounded-2xl border border-slate-900 mt-6 shadow-xl">
      <div className="flex items-center justify-between mb-6 border-b border-slate-900 pb-4">
        <h2 className="text-xl font-black flex items-center gap-2">
          <Landmark className="w-6 h-6 text-blue-500" /> Edit Listing
        </h2>
        <button 
          onClick={() => navigate('/manage')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Back to Management
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-sm font-medium leading-relaxed">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-400">Title</label>
          <input 
            name="title" 
            type="text"
            value={formData.title} 
            onChange={handleChange} 
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500 transition" 
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-400">Description</label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white h-28 outline-none focus:border-blue-500 transition resize-none" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-400">Address</label>
          <input 
            name="address" 
            type="text"
            value={formData.address} 
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
              value={formData.price} 
              onChange={handleChange} 
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500 transition" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Beds</label>
            <input 
              name="beds" 
              type="number" 
              value={formData.beds} 
              onChange={handleChange} 
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500 transition" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Baths</label>
            <input 
              name="baths" 
              type="number" 
              value={formData.baths} 
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