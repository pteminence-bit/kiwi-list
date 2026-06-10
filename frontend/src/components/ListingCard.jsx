// components/ListingCard.jsx
import React, { useState } from 'react';
import { Bed, Bath, Eye, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';

const R2_PUBLIC_BUCKET_URL = 'https://pub-580c3d172e3f4533b065d241e61ee132.r2.dev';

const ListingCard = ({ listing }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  // Ensure we use the R2 base URL for all image paths
  const images = (listing.images || []).map(img => 
    img.startsWith('http') ? img : `${R2_PUBLIC_BUCKET_URL}/${img}`
  );

  return (
    <div className="flex flex-col text-slate-200 w-full">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div>
            <p className="text-xs font-bold text-white">Verified Agent</p>
            <p className="text-[10px] text-slate-400">{listing.address?.split(',').pop()}</p>
          </div>
        </div>
        <AlertTriangle size={16} className="text-slate-600 hover:text-red-500 cursor-pointer" />
      </div>

      <div className="relative aspect-[4/3] bg-black overflow-hidden group flex items-center justify-center">
        <img 
          src={images[currentIdx]} 
          className="w-full h-full object-contain" 
          alt="Listing" 
          onError={(e) => { e.target.src = '/fallback-placeholder.png'; }}
        />
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => (prev === 0 ? images.length - 1 : prev - 1)); }} className="absolute left-2 top-1/2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 text-white"><ChevronLeft size={20} /></button>
            <button onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => (prev === images.length - 1 ? 0 : prev + 1)); }} className="absolute right-2 top-1/2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 text-white"><ChevronRight size={20} /></button>
          </>
        )}
      </div>

      <div className="p-4 space-y-3 bg-slate-900">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white">₦{listing.price?.toLocaleString()}</h2>
          <div className="flex items-center gap-1 text-xs font-medium text-slate-400"><Eye size={14} /> {listing.views || 0}</div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">{listing.title}</p>
        <div className="flex gap-4 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Bed size={14} /> {listing.beds} Beds</div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Bath size={14} /> {listing.baths} Baths</div>
        </div>
      </div>
    </div>
  );
};
export default ListingCard;