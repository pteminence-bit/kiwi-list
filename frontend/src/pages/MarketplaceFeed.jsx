import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Maximize2 } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { API_BASE_URL } from '../config';

const MarketplaceFeed = ({ token }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);

  const shuffleArray = (array) => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

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
      const randomizedData = shuffleArray(data || []);
      setListings(randomizedData);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error loading feed:", err);
      setLoading(false);
    });
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
        body: JSON.stringify({ amount: 500, purpose: 'unlock_contact', listingId })
      });
      const data = await response.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  // 👇 ADDED: Handle flagging/reporting scam or bad listings
  const handleReportListing = async (listingId) => {
    const reason = window.prompt("Reason for reporting this listing (e.g., Fake Agent, Incorrect Price, Sold):");
    if (!reason) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/listings/${listingId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        alert("Thank you. This listing has been flagged for admin moderation review.");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  const handleImageLightboxCapture = (e) => {
    if (e.target.tagName === 'IMG' && e.target.src) {
      setActiveImage(e.target.src);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500 min-h-screen w-full flex items-center justify-center bg-slate-50">
        <span className="font-medium animate-pulse text-xs tracking-wider uppercase text-slate-400">Loading KIWI-list Feed...</span>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-4 md:p-6 bg-white sm:bg-slate-50 min-h-screen w-full flex flex-col items-center">
      <div className="w-full max-w-md space-y-4 sm:space-y-6 pt-2 sm:pt-0">
        
        {/* Top Search & Filter Bar */}
        <div className="px-4 sm:px-0">
          <div className="flex items-center gap-2 bg-slate-100 sm:bg-white p-2 rounded-full sm:rounded-xl border-none sm:border border-slate-200 w-full">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search location or keywords..." 
                className="w-full pl-9 pr-4 py-1.5 bg-transparent sm:bg-slate-50 border-none rounded-full focus:outline-none text-xs text-slate-800 font-medium"
              />
            </div>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-white sm:bg-transparent border border-slate-200 sm:border-none rounded-full text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition shrink-0">
              <SlidersHorizontal size={12} /> Filter
            </button>
          </div>
        </div>

        {/* Vertical Feed Track */}
        <div 
          onClick={handleImageLightboxCapture} 
          className="flex flex-col gap-1 sm:gap-6 w-full pb-24 border-t border-slate-100 sm:border-none"
        >
          {listings.map(listing => (
            <div 
              key={listing.id} 
              className="w-full relative group bg-white sm:border sm:border-slate-200 sm:rounded-xl overflow-hidden sm:shadow-xs transition"
            >
              <div className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur-md text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-200 hidden sm:block">
                <Maximize2 size={12} />
              </div>
              
              {/* FIXED: Passed handleReportListing prop cleanly here */}
              <ListingCard 
                listing={listing} 
                onUnlock={handleUnlockContact} 
                onReport={handleReportListing} 
              />
            </div>
          ))}
          
          {listings.length === 0 && (
            <div className="p-12 text-center text-slate-400 bg-white sm:rounded-xl border border-slate-200 text-xs font-medium italic shadow-xs w-full">
              No real estate properties listed on the market matching this view.
            </div>
          )}
        </div>
      </div>

      {/* Immersive Instagram Style Lightbox Modal */}
      {activeImage && (
        <div 
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between py-6 px-4"
          onClick={() => setActiveImage(null)}
        >
          <div className="w-full max-w-lg flex items-center justify-between text-white z-10 px-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Kiwi-List Media Asset</span>
            <button onClick={() => setActiveImage(null)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition border border-white/5">
              <X size={18} />
            </button>
          </div>

          <div 
            className="relative w-full max-w-md aspect-[4/5] sm:max-h-[75vh] flex items-center justify-center bg-zinc-950/40 rounded-2xl overflow-hidden shadow-2xl border border-zinc-900" 
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={() => setActiveImage(null)}
          >
            <img src={activeImage} alt="Enlarged View" className="w-full h-full object-cover select-none cursor-zoom-out" />
          </div>

          <div className="w-full text-center text-[10px] font-bold tracking-wide text-zinc-500 select-none z-10">
            Double tap canvas framework or tap backdrop context spaces to return to feed layout
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceFeed;