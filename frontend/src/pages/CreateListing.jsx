import React, { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import { API_BASE_URL } from '../config';
import { Landmark, ShieldCheck } from 'lucide-react';

const CreateListing = ({ token }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', address: '', beds: '', baths: '', tier: 'free', phone: '', email: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Note: The R2 upload component (uploadImagesToR2) enforces this minimum
    if (images.length < 2) {
      alert("Marketplace gallery listings require a minimum of 2 images to display effectively.");
      return;
    }

    if (!token) {
      alert("Authentication session lost. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const listingPayload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        address: formData.address,
        beds: Number(formData.beds),
        baths: Number(formData.baths),
        tier: formData.tier,
        images: images, 
        contactDetails: { 
          phone: formData.phone, 
          email: formData.email 
        }
      };

      const listingResponse = await fetch(`${API_BASE_URL}/api/listings/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(listingPayload)
      });

      const listingData = await listingResponse.json();
      if (!listingResponse.ok) throw new Error(listingData.error || "Failed to create listing.");

      if (formData.tier === 'premium') {
        initializePremiumPayment(listingData.id);
      } else {
        alert("Published successfully!");
        window.location.href = "/";
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializePremiumPayment = async (listingId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: 3000, purpose: 'premium_listing', listingId })
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || "Could not spin up payment processor.");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="w-full px-4 py-8 flex flex-col items-center min-h-screen bg-slate-950">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-slate-200">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl shadow-inner">
            <Landmark size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Create Listing</h2>
            <p className="text-xs text-slate-400 font-medium tracking-wide">POST PROPERTY</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">Title</label>
              <input required type="text" name="title" onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-white outline-none transition-colors" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">Description</label>
              <textarea required name="description" onChange={handleInputChange} rows={4} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-white outline-none transition-colors resize-none" />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">Price (₦)</label>
              <input required type="number" name="price" onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-white outline-none transition-colors" />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">Listing Tier</label>
              <select name="tier" onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-white outline-none transition-colors">
                <option value="free">Free</option>
                <option value="premium">Premium (₦3,000)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">Full Address</label>
              <input required type="text" name="address" onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-white outline-none transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:col-span-2">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">Beds</label>
                <input required type="number" name="beds" onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-white outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">Baths</label>
                <input required type="number" name="baths" onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-white outline-none transition-colors" />
              </div>
            </div>

            <div className="sm:col-span-2 p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-[10px] font-black text-blue-400 tracking-widest flex items-center gap-2 uppercase">
                <ShieldCheck size={16} /> Contact Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required type="tel" name="phone" onChange={handleInputChange} placeholder="Phone" className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-blue-500" />
                <input required type="email" name="email" onChange={handleInputChange} placeholder="Email" className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[11px] font-black uppercase text-slate-500">Property Images (2+ required)</label>
            <ImageUploader onImagesSelected={setImages} />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-lg active:scale-[0.98]"
          >
            {loading ? "PROCESSING..." : "PUBLISH ASSET TO MARKET"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;