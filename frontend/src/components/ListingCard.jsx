import React from 'react';
import { Bed, Bath, Eye, AlertTriangle, Maximize2 } from 'lucide-react';

// Centralized R2 Config
const R2_BASE = 'https://pub-580c3d172e3f4533b065d241e61ee132.r2.dev';

const ListingCard = ({ listing }) => {
  const images = (listing.images || []).map(img => 
    img.startsWith('http') ? img : `${R2_BASE}/${img.replace(/^\//, '')}`
  );

  return (
    <div className="flex flex-col text-slate-200 w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-shadow duration-300 hover:shadow-2xl">
      {/* Header: Fixed Height for consistency */}
      <div className="flex items-center justify-between p-4 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
            {listing.agentInitial || 'AG'}
          </div>
          <div>
            <p className="text-xs font-bold text-white">Verified Agent</p>
            <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{listing.address?.split(',').pop()}</p>
          </div>
        </div>
        <button className="p-2 text-slate-600 hover:text-red-500 transition-colors">
          <AlertTriangle size={16} />
        </button>
      </div>

      {/* Image Gallery Container */}
      {images.length > 0 && (
        <div className="relative aspect-[4/3] w-full bg-black overflow-hidden cursor-pointer group">
          <img 
            src={images[0]} 
            alt="Property primary view"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            data-full-gallery={JSON.stringify(images)} 
          />
          
          {/* Overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

          {/* Badge & Maximize Icon */}
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/50 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full border border-white/10 font-bold">
              <Maximize2 size={10} /> 1 / {images.length}
            </div>
          )}
        </div>
      )}

      {/* Details Section */}
      <div className="p-4 space-y-3 bg-slate-900">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-black text-white tracking-tight">
            ₦{listing.price?.toLocaleString()}
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
            <Eye size={12} /> {listing.views || 0}
          </div>
        </div>
        
        <p className="text-xs text-slate-300 leading-relaxed font-medium line-clamp-2">
          {listing.title}
        </p>

        <div className="flex gap-4 pt-2 border-t border-slate-800/50">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <Bed size={14} className="text-blue-500" /> {listing.beds} Beds
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <Bath size={14} className="text-blue-500" /> {listing.baths} Baths
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;