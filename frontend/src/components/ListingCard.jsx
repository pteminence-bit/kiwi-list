import React, { useState } from 'react';
import { MapPin, Bed, Bath, Lock, Eye, AlertTriangle, ChevronLeft, ChevronRight, Phone } from 'lucide-react';

const ListingCard = ({ listing, onUnlock, onReport }) => {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const isPremium = listing.tier === 'premium';
  const isUnlocked = listing.isUnlocked || !isPremium;
  const images = listing.images || [];

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 overflow-hidden relative group transition-all duration-300 flex flex-col h-full">
      
      {/* Top Floating Actions Area */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-20">
        {/* Report Button (Smooth Fade-in on Hover) */}
        <button 
          onClick={() => onReport(listing.id)}
          className="p-2 bg-white/90 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
          title="Report Listing"
        >
          <AlertTriangle size={16} />
        </button>

        {/* Dynamic Views Pill */}
        <div className="flex items-center gap-1 bg-slate-900/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-lg ml-auto shadow-sm">
          <Eye size={13} /> 
          <span>{listing.views || 0}</span>
        </div>
      </div>

      {/* Premium Badge Corner Ribbon */}
      {isPremium && (
        <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none z-20">
          <div className="absolute top-4 right-[-28px] bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black tracking-wider py-1 px-8 rotate-45 shadow-sm text-center uppercase">
            Premium
          </div>
        </div>
      )}

      {/* Modern Dynamic Carousel Image Container */}
      <div className="relative h-56 w-full bg-slate-900 overflow-hidden group/carousel select-none">
        {images.length > 0 ? (
          <img 
            src={images[currentImgIdx]} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            alt={`${listing.title || 'Property'} - ${currentImgIdx + 1}`} 
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
            No Images Available
          </div>
        )}

        {/* Carousel Navigation Arrows (Only show if multiple images exist) */}
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-800 shadow opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-800 shadow opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200"
            >
              <ChevronRight size={16} />
            </button>

            {/* Pagination Dots Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImgIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Card Information Body */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Price Header */}
          <div className="mb-1">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              ₦{listing.price?.toLocaleString()}
            </span>
          </div>

          {/* Title / Mini-Description */}
          <h4 className="text-sm font-semibold text-slate-700 truncate mb-2">
            {listing.title || 'Standard Listing Asset'}
          </h4>

          {/* Location Vector Info Line */}
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4 font-medium">
            <MapPin size={14} className="text-blue-500 shrink-0" /> 
            <span className="truncate">{listing.address || 'Address hidden'}</span>
          </p>

          {/* Property Core Feature Bed/Bath Badges */}
          <div className="flex gap-4 mb-5 border-t border-slate-100 pt-3">
            <span className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
              <Bed size={15} className="text-slate-400" /> 
              <strong>{listing.beds || 0}</strong> Beds
            </span>
            <span className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
              <Bath size={15} className="text-slate-400" /> 
              <strong>{listing.baths || 0}</strong> Baths
            </span>
          </div>
        </div>

        {/* Dynamic Interactive Financial Lock State Actions */}
        {isUnlocked ? (
          <div className="bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-xl flex items-center gap-3 transition-all duration-300 animate-fadeIn">
            <div className="p-2 bg-emerald-500 text-white rounded-lg shadow-sm">
              <Phone size={16} />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider mb-0.5">Verified Contact</p>
              <p className="text-sm font-bold text-slate-900 truncate">
                {listing.contactDetails?.phone || 'Contact Info Available'}
              </p>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => onUnlock(listing.id)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.99] transition-all duration-200"
          >
            <Lock size={15} className="animate-pulse" /> 
            <span>Unlock Contact Card (₦500)</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ListingCard;