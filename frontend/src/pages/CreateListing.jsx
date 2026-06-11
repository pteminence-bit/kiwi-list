import React, { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import { API_BASE_URL } from '../config';
import { FilePlus, Landmark, ShieldCheck } from 'lucide-react';

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
    
    // Constraint maintained: 2 to 4 images
    if (images.length < 2 || images.length > 4) {
      alert("Please upload between 2 and 4 images of the property.");
      return;
    }

    setLoading(true);
    try {
      const filePayload = new FormData();
      images.forEach(file => filePayload.append('images', file));

      const uploadResponse = await fetch(`${API_BASE_URL}/api/upload/listings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: filePayload
      });
      
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadData.error || "Image deployment failed");

      // 👇 EXACT REPLACEMENT BLOCK START
      const listingPayload = {
        title: formData.title,
        description: formData.description, // Ensure this matches your backend schema
        price: Number(formData.price),
        address: formData.address,
        beds: Number(formData.beds),
        baths: Number(formData.baths),
        tier: formData.tier,
        images: uploadData.urls, 
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
      // 👆 EXACT REPLACEMENT BLOCK END

      const listingData = await listingResponse.json();
      if (listingResponse.ok) {
        formData.tier === 'premium' ? initializePremiumPayment(listingData.id) : (alert("Published successfully!"), window.location.href = "/");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializePremiumPayment = async (listingId) => {
    const res = await fetch(`${API_BASE_URL}/api/payments/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ amount: 3000, purpose: 'premium_listing', listingId })
    });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
  };

  return (
    <div className="w-full px-4 py-8 flex flex-col items-center min-h-screen">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm text-slate-800">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-inner">
            <Landmark size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Create Listing</h2>
            <p className="text-xs text-slate-500 font-medium tracking-wide">SUBMIT PROPERTY ASSET CONFIGURATION</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Property Title</label>
              <input required type="text" name="title" onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Detailed Description</label>
              <textarea required name="description" onChange={handleInputChange} rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Price (₦)</label>
              <input required type="number" name="price" onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Placement Tier</label>
              <select name="tier" onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="free">Free Tier</option>
                <option value="premium">Premium (₦3,000)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Full Address</label>
              <input required type="text" name="address" onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:col-span-2">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Beds</label>
                <input required type="number" name="beds" onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Baths</label>
                <input required type="number" name="baths" onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="sm:col-span-2 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
              <h3 className="text-[10px] font-black text-blue-800 tracking-widest flex items-center gap-2 uppercase">
                <ShieldCheck size={16} /> Secure Contact Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required type="tel" name="phone" onChange={handleInputChange} placeholder="Phone" className="px-4 py-3 border border-blue-100 rounded-xl text-sm outline-none" />
                <input required type="email" name="email" onChange={handleInputChange} placeholder="Email" className="px-4 py-3 border border-blue-100 rounded-xl text-sm outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[11px] font-black uppercase text-slate-400">Property Imagery (2-4 required)</label>
            <ImageUploader onImagesSelected={setImages} />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black text-sm rounded-xl transition-all shadow-lg active:scale-[0.98]"
          >
            {loading ? "PROCESSING..." : "PUBLISH ASSET TO MARKET"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;