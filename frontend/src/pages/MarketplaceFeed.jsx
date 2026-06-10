import React from 'react';
import { Bed, Bath, Eye, AlertTriangle } from 'lucide-react';

const R2_BASE = 'https://pub-580c3d172e3f4533b065d241e61ee132.r2.dev';

const ListingCard = ({ listing }) => {
  const images = (listing.images || []).map(img => 
    img.startsWith('http') ? img : `${R2_BASE}/${img.replace(/^\//, '')}`
  );

  return (
    <div className="flex flex-col text-slate-200 w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-slate-700">
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

      {/* Primary Image: Encoded with gallery data for the parent Lightbox */}
      {images.length > 0 && (
        <div className="relative aspect-[4/3] w-full bg-black cursor-pointer group">
          <img 
            src={images[0]} 
            alt="Property primary"
            className="w-full h-full object-cover"
            data-full-gallery={JSON.stringify(images)}
          />
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-3 py-1 rounded-full">
              {images.length} Photos
            </div>
          )}
        </div>
      )}

      {/* Details */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white">₦{listing.price?.toLocaleString()}</h2>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400"><Eye size={14} /> {listing.views || 0}</div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{listing.title}</p>
        <div className="flex gap-6 pt-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Bed size={16} /> {listing.beds}</div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Bath size={16} /> {listing.baths}</div>
        </div>
      </div>
    </div>
  );
};
export default ListingCard;