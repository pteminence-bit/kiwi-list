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

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading KIWI-list Feed...</div>;

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen w-full md:pl-72 flex flex-col items-center">
      
      {/* Container wrapper to keep everything perfectly aligned with the max-width layout */}
      <div className="w-full max-w-xl lg:max-w-4xl space-y-6">
        
        {/* Top Search & Filter Bar: Fully proportional */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 w-full">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search listings..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition w-full sm:w-auto shrink-0">
            <SlidersHorizontal size={16} /> Filter By
          </button>
        </div>

        {/* Clean, Uniform Feed: Formatted to fit the structural length of your display */}
        <div className="flex flex-col gap-6 w-full pb-12">
          {listings.map(listing => (
            <ListingCard 
              key={listing.id} 
              listing={listing} 
              onUnlock={handleUnlockContact} 
            />
          ))}
          {listings.length === 0 && (
            <div className="text-center py-12 text-slate-400 italic">
              No properties available in the marketplace right now.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MarketplaceFeed;