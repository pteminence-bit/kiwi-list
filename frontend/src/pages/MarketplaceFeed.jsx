// components/MarketplaceFeed.jsx
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
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
      setListings(shuffleArray(data || []));
      setLoading(false);
    })
    .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchFeed(); }, [token]);

  const handleImageLightboxCapture = (e) => {
    const target = e.target;
    if (target?.tagName === 'IMG' && target.src && !target.closest('button')) {
      setActiveImage(target.src);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">
        Loading Kiwi-List...
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto pb-12">
      {/* Search Bar - Fixed width center */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm p-4 mb-4 rounded-b-2xl border-b border-slate-800">
        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl">
          <Search className="text-slate-500 ml-2" size={18} />
          <input type="text" placeholder="Search location..." className="w-full bg-transparent outline-none text-sm text-white" />
          <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white"><SlidersHorizontal size={14} /> Filter</button>
        </div>
      </div>

      {/* Feed */}
      <div onClick={handleImageLightboxCapture} className="space-y-6 px-2">
        {listings.map(listing => (
          <div key={listing.id} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl transition-transform hover:border-slate-700">
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {activeImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setActiveImage(null)}>
          <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white"><X size={24} /></button>
          <img src={activeImage} className="max-h-[90vh] rounded-lg shadow-2xl" alt="View" />
        </div>
      )}
    </div>
  );
};
export default MarketplaceFeed;