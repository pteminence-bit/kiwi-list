import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import ListingCard from '../components/ListingCard';

const MarketplaceFeed = ({ token }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

// Inside MarketplaceFeed.jsx
const fetchFeed = () => {
  fetch('/api/listings/feed', { // This will now be proxied to http://localhost:5000/api/listings/feed
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    }
  })
  .then(res => {
    if (!res.ok) throw new Error('Server responded with an error');
    return res.json();
  })
  .then(data => {
    setListings(data);
    setLoading(false);
  })
  .catch(err => console.error("Error loading feed:", err));
};

  useEffect(() => {
    fetchFeed();
  }, [token]);

  const handleUnlockContact = async (listingId) => {
    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: 500,
          purpose: 'unlock_contact',
          listingId: listingId
        })
      });
      
      const data = await response.json();
      if (data.checkoutUrl) {
        // Redirect user to Flutterwave checkout secure payment page
        window.location.href = data.checkoutUrl;
      } else {
        alert("Could not initialize unlock payment.");
      }
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading KIWI-list Feed...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen ml-64">
      {/* Top Search & Filter Bar mimicking image layouts */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by location, property type, or keywords..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
          <SlidersHorizontal size={16} /> Filter By
        </button>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map(listing => (
          <ListingCard 
            key={listing.id} 
            listing={listing} 
            onUnlock={handleUnlockContact} 
          />
        ))}
      </div>
    </div>
  );
};

export default MarketplaceFeed;
