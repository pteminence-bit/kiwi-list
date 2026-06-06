import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Maximize2 } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { API_BASE_URL } from '../config';

const MarketplaceFeed = ({ token }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lightbox Modal State management tracking variables
  const [activeImage, setActiveImage] = useState(null);

  // Fisher-Yates Randomization Shuffling Algorithm Function
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
      // Randomizes listing positions cleanly before mapping into state arrays
      const randomizedData = shuffleArray(data || []);
      setListings(randomizedData);
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

  // Safe Interception catch for image element pointer selection clicks inside feed tracks
  const handleImageLightboxCapture = (e) => {
    if (e.target.tagName === 'IMG' && e.target.src) {
      setActiveImage(e.target.src);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading KIWI-list Feed...</div>;

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen w-full md:pl-72 flex flex-col items-center">
      
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Top Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 w-full">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search listings by location, price, or keywords..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition w-full sm:w-auto shrink-0">
            <SlidersHorizontal size={16} /> Filter By
          </button>
        </div>

        {/* Instagram-Style Feed Track (With Event Listener Delegation Added for Image Click Interceptions) */}
        <div onClick={handleImageLightboxCapture} className="flex flex-col gap-6 w-full pb-12 cursor-pointer">
          {listings.map(listing => (
            <div key={listing.id} className="w-full relative group">
              {/* Contextual indicator to signal image expandability on hover */}
              <div className="absolute top-4 right-4 z-10 bg-slate-900/60 backdrop-blur-xs text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-200">
                <Maximize2 size={14} />
              </div>
              <ListingCard 
                listing={listing} 
                onUnlock={handleUnlockContact} 
              />
            </div>
          ))}
          
          {listings.length === 0 && (
            <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 italic">
              No real estate properties listed on the market matching this view.
            </div>
          )}
        </div>

      </div>

      {/* --- LIVE LIGHTBOX ENLARGEMENT PORTAL OVERLAY --- */}
      {activeImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4 transition-all duration-300 backdrop-blur-sm"
          onClick={() => setActiveImage(null)} // Dismiss when background is clicked
        >
          {/* Top Control Bar Ribbon */}
          <div className="absolute top-4 right-4 flex items-center gap-4">
            <button 
              onClick={() => setActiveImage(null)}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition shadow-lg border border-white/10"
            >
              <X size={20} />
            </button>
          </div>

          {/* High-Res Scale Enlarge Container Box Frame */}
          <div className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={activeImage} 
              alt="Enlarged Showcase View" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200" 
            />
          </div>
          
          <p className="mt-4 text-xs text-slate-400 font-medium select-none tracking-wide">
            Click outside the image window container timeline boundaries to slide down/close portal frame.
          </p>
        </div>
      )}

    </div>
  );
};

export default MarketplaceFeed;