import React, { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import { API_BASE_URL } from '../config';
import { FilePlus, Landmark, ShieldCheck } from 'lucide-react';

const CreateListing = ({ token }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    address: '',
    beds: '',
    baths: '',
    tier: 'free', 
    phone: '',
    email: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // UPDATED: Now allows 1 to 4 images
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

      const listingPayload = {
        title: formData.title,
        description: formData.description,
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

      const listingData = await listingResponse.json();
      
      if (listingResponse.ok) {
        if (formData.tier === 'premium') {
          initializePremiumPayment(listingData.id);
        } else {
          alert("Free Listing published live successfully!");
          window.location.href = "/";
        }
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: 3000,
          purpose: 'premium_listing',
          listingId: listingId
        })
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error("Payment routing error:", err);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-slate-800">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Landmark size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Create New Listing</h2>
            <p className="text-xs text-slate-500">Submit your property asset configuration specifications safely down onto KIWI-list.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Property Title</label>
              <input required type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., Luxury 3 Bedroom Apartment Lekki Phase 1" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:border-blue-500" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description</label>
              <textarea required name="description" value={formData.description} onChange={handleInputChange} rows={3} placeholder="Describe infrastructure details, amenities, service charges..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price (₦ Naira)</label>
              <input required type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="Total asset cost valuation" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Placement Tier Model</label>
              <select name="tier" value={formData.tier} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black bg-white focus:outline-none focus:border-blue-500">
                <option value="free" className="text-black">Free Tier Placement (Standard Feed Display)</option>
                <option value="premium" className="text-black">Premium Placement (₦3,000 - Prioritized & Paywalled Info)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Physical Address Location</label>
              <input required type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Full street or mapping node details" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Beds Counter</label>
              <input required type="number" name="beds" value={formData.beds} onChange={handleInputChange} placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Baths Counter</label>
              <input required type="number" name="baths" value={formData.baths} onChange={handleInputChange} placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:border-blue-500" />
            </div>

            <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-600 tracking-wider flex items-center gap-1.5 uppercase">
                <ShieldCheck size={14} className="text-blue-500" /> Secure Contact Card Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Owner Telephone Line</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+234..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Owner Email Box</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="user@domain.com" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Media Workspace Attachments</label>
            <ImageUploader onImagesSelected={setImages} />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow transition duration-200 disabled:bg-slate-300 flex items-center justify-center gap-2"
          >
            <FilePlus size={16} />
            {loading ? "Processing Asset Deployments..." : formData.tier === 'premium' ? "Proceed to Checkout (₦3,000)" : "Publish Free Listing"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;