// components/ListingCard.jsx
import React from 'react';
import { MapPin, Bed, Bath, Eye, AlertTriangle } from 'lucide-react';

// Centralized R2 Config
const R2_BASE = 'https://pub-580c3d172e3f4533b065d241e61ee132.r2.dev';

const ListingCard = ({ listing }) => {
  // Ensure we map paths to the full R2 URL
  const images = (listing.images || []).map(img => 
    img.startsWith('http') ? img : `${R2_BASE}/${img.replace(/^\//, '')}`
  );

  return (
    <div className="flex flex-col text-slate-200 w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500" />
          <div>
            <p className="text-xs font-bold text-white">Verified Agent</p>
            <p className="text-[10px] text-slate-400">{listing.address?.split(',').pop()}</p>
          </div>
        </div>
        <AlertTriangle size={16} className="text-slate-600 hover:text-red-500 cursor-pointer" />
      </div>

      {/* Grid Display: Automatically adjusts to image shapes */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-black">
        {images.map((url, idx) => (
          <img 
            key={idx} 
            src={url} 
            alt={`Property view ${idx}`}
            className="w-full h-auto object-cover rounded-sm"
          />
        ))}
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white">₦{listing.price?.toLocaleString()}</h2>
          <div className="flex items-center gap-1 text-xs font-medium text-slate-400"><Eye size={14} /> {listing.views || 0}</div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{listing.title}</p>
        <div className="flex gap-4 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Bed size={14} /> {listing.beds} Beds</div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Bath size={14} /> {listing.baths} Baths</div>
        </div>
      </div>
    </div>
  );
};
export default ListingCard;