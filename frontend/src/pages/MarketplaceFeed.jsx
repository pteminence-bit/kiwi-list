import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { API_BASE_URL } from '../config';

const MarketplaceFeed = ({ token }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = () => {
    fetch(`${API_BASE_URL}/api/listings/feed`, {
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
      const response = await fetch(`${API_BASE_URL}/api/payments/initialize`, {
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
    // Fixed ml-64 to a responsive padding-left setup: md:pl-72
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen w-full md:pl-72 pt-20 md:pt-6">
      
      {/* Top Search & Filter Bar: Stacked on mobile, row layout on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search listings..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition w-full sm:w-auto">
          <SlidersHorizontal size={16} /> Filter By
        </button>
      </div>

      {/* Main Grid View: 1 column on mobile, 2 on tablets, 3 on wide desktop displays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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