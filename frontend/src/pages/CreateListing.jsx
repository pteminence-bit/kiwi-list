import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, Bed, Bath, CreditCard, CheckCircle } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';

const CreateListing = ({ token }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    address: '',
    beds: 1,
    baths: 1,
    tier: 'free',
    phone: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length < 2) return alert("Please upload at least 2 images.");
    setLoading(true);

    try {
      // 1. Upload Images to R2 first
      const imageFormData = new FormData();
      selectedFiles.forEach(file => imageFormData.append('images', file));

      const uploadRes = await fetch('/api/upload/listings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: imageFormData
      });
      const { urls } = await uploadRes.json();

      // 2. Create the Listing in Firestore
      const listingRes = await fetch('/api/listings/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formData,
          images: urls,
          contactDetails: { phone: formData.phone }
        })
      });
      const listingData = await listingRes.json();

      // 3. If Premium, redirect to payment
      if (formData.tier === 'premium') {
        const payRes = await fetch('/api/payments/initialize', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            amount: 3000,
            purpose: 'premium_listing',
            listingId: listingData.id
          })
        });
        const payData = await payRes.json();
        window.location.href = payData.checkoutUrl;
      } else {
        navigate('/manage');
      }
    } catch (err) {
      console.error(err);
      alert("Error creating listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen ml-64">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Post</h1>
        <p className="text-slate-500 mb-8">List your property on KIWI-list. Choose between free or premium placement.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Details Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Home size={20}/> Basic Info</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700">Listing Title</label>
              <input type="text" required className="mt-1 w-full p-2 border rounded-lg" placeholder="e.g. Modern 3-Bedroom Apartment" 
                onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Price (₦)</label>
                <input type="number" required className="mt-1 w-full p-2 border rounded-lg" placeholder="5000000"
                  onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Contact Phone</label>
                <input type="text" required className="mt-1 w-full p-2 border rounded-lg" placeholder="080..."
                  onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Media Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4">Property Images (2-4)</h2>
            <ImageUploader onImagesSelected={setSelectedFiles} />
          </div>

          {/* Tier Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => setFormData({...formData, tier: 'free'})}
              className={`p-4 rounded-xl border-2 cursor-pointer transition ${formData.tier === 'free' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">Free Post</span>
                {formData.tier === 'free' && <CheckCircle className="text-blue-500" size={18}/>}
              </div>
              <p className="text-xs text-slate-500">Standard visibility. Contact info public to everyone.</p>
            </div>

            <div 
              onClick={() => setFormData({...formData, tier: 'premium'})}
              className={`p-4 rounded-xl border-2 cursor-pointer transition ${formData.tier === 'premium' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-amber-700">Premium Post (₦3,000)</span>
                {formData.tier === 'premium' && <CheckCircle className="text-amber-500" size={18}/>}
              </div>
              <p className="text-xs text-slate-600">Priority feed placement. Contacts hidden behind paywall (Earn 70%).</p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            {loading ? "Processing..." : <><CreditCard size={20}/> Publish Listing</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
