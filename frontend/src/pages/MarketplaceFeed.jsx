// components/MarketplaceFeed.jsx
import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { API_BASE_URL } from '../config';

const MarketplaceFeed = ({ token }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);

  const fetchFeed = () => {
    fetch(`${API_BASE_URL}/api/listings/feed`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => { setListings(data || []); setLoading(false); })
    .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchFeed(); }, [token]);

  return (
    <div className="w-full h-full pb-12">
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm p-4 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl">
          <Search className="text-slate-500 ml-2" size={18} />
          <input type="text" placeholder="Search..." className="w-full bg-transparent outline-none text-sm text-white" />
          <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white"><SlidersHorizontal size={14} /> Filter</button>
        </div>
      </div>

      <div className="flex flex-col items-center px-2">
        <div className="w-full max-w-lg space-y-6">
          {listings.map(listing => (
            <div key={listing.id} onClick={(e) => { if(e.target.tagName === 'IMG') setActiveImage(e.target.src); }} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      </div>

      {activeImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setActiveImage(null)}>
          <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white"><X size={24} /></button>
          <img src={activeImage} className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" alt="View" />
        </div>
      )}
    </div>
  );
};
export default MarketplaceFeed;