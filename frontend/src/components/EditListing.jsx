import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Landmark, Loader2, ArrowLeft, Save } from 'lucide-react';

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
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
      
      if (response.ok) {
        navigate("/manage");
      } else {
        const data = await response.json();
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
        <p className="text-sm font-bold tracking-widest uppercase">Fetching details...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-950 flex items-center gap-3">
            <Landmark className="w-8 h-8 text-blue-600 bg-blue-50 p-1.5 rounded-xl" /> Edit Property
          </h2>
          <button 
            onClick={() => navigate('/manage')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} /> Cancel
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Listing Title</label>
            <input name="title" type="text" value={formData.title} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:border-blue-500 outline-none transition" required />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium h-32 focus:border-blue-500 outline-none transition resize-none" />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Location Address</label>
            <input name="address" type="text" value={formData.address} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:border-blue-500 outline-none transition" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['price', 'beds', 'baths'].map((field) => (
              <div key={field}>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider capitalize">{field}</label>
                <input name={field} type="number" value={formData[field]} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:border-blue-500 outline-none transition" />
              </div>
            ))}
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
            {saving ? 'Updating...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditListing;