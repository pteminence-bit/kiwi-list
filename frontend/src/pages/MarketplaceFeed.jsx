import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { API_BASE_URL } from '../config';

const MarketplaceFeed = ({ token }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGallery, setActiveGallery] = useState(null); // Changed from activeImage
  const [galleryIdx, setGalleryIdx] = useState(0);

  const fetchFeed = () => {
    fetch(`${API_BASE_URL}/api/listings/feed`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => { setListings(data || []); setLoading(false); })
    .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchFeed(); }, [token]);

  // Updated click handler to capture gallery data
  const handleImageLightboxCapture = (e) => {
    const galleryData = e.target.getAttribute('data-full-gallery');
    if (galleryData) {
      setActiveGallery(JSON.parse(galleryData));
      setGalleryIdx(0); // Reset to first image
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
            <div key={listing.id} onClick={handleImageLightboxCapture} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      </div>

      {/* Updated Lightbox to handle gallery swiping */}
      {activeGallery && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setActiveGallery(null)}>
          <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white z-50" onClick={() => setActiveGallery(null)}><X size={24} /></button>
          
          {activeGallery.length > 1 && (
            <button className="absolute left-4 p-2 bg-black/50 rounded-full text-white z-50" onClick={(e) => { e.stopPropagation(); setGalleryIdx(prev => (prev === 0 ? activeGallery.length - 1 : prev - 1)); }}><ChevronLeft size={30} /></button>
          )}
          
          <img src={activeGallery[galleryIdx]} className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" alt="Gallery View" />
          
          {activeGallery.length > 1 && (
            <button className="absolute right-4 p-2 bg-black/50 rounded-full text-white z-50" onClick={(e) => { e.stopPropagation(); setGalleryIdx(prev => (prev === activeGallery.length - 1 ? 0 : prev + 1)); }}><ChevronRight size={30} /></button>
          )}

          <div className="absolute bottom-6 text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full">
            {galleryIdx + 1} / {activeGallery.length}
          </div>
        </div>
      )}
    </div>
  );
};
export default MarketplaceFeed;