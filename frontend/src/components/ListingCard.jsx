import React, { useState } from 'react';
import { MapPin, Bed, Bath, Lock, Eye, AlertTriangle, ChevronLeft, ChevronRight, Heart, MessageCircle, Send } from 'lucide-react';

const ListingCard = ({ listing, onUnlock, onReport }) => {
  const isPremium = listing.tier === 'premium';
  const isUnlocked = listing.isUnlocked || !isPremium;
  
  // State to track active carousel slide index
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const images = listing.images || [];

  const handlePrevSlide = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextSlide = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-white rounded-none md:rounded-xl border border-slate-200 overflow-hidden max-w-md mx-auto w-full shadow-sm">
      
      {/* 1. Card Header: Owner Info & Report Action Trigger */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-blue-500 p-[2px]">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-black text-xs text-slate-800">
              KIWI
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              Verified Agent
              {isPremium && (
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500" title="Premium User Placement" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Lagos, Nigeria</p>
          </div>
        </div>
        
        <button 
          onClick={() => onReport(listing.id)}
          className="p-1 text-slate-400 hover:text-red-600 rounded-full transition"
          title="Report Listing"
        >
          <AlertTriangle size={18} />
        </button>
      </div>

      {/* 2. Card Media Canvas: Full Carousel with Interactive Elements */}
      <div className="relative aspect-square w-full bg-slate-950 group">
        {images.length > 0 ? (
          <img 
            src={images[currentImageIndex]} 
            className="w-full h-full object-cover transition-all duration-300" 
            alt={`Property visual view ${currentImageIndex + 1}`} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900 text-sm">
            No Images Available
          </div>
        )}

        {/* Desktop Navigation Swipe Chevrons (Shows cleanly on container container hover state) */}
        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 text-slate-800 hover:bg-white shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={handleNextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 text-slate-800 hover:bg-white shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Custom Premium Badge overlay flag */}
        {isPremium && (
          <span className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-950 bg-amber-400 rounded-full shadow-md z-10">
            Premium Post
          </span>
        )}

        {/* Carousel indicator tracking dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, i) => (
              <span 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-white scale-110' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Social Interaction Bar Action Ribbons */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4 text-slate-800">
          <button onClick={() => setIsLiked(!isLiked)} className="hover:opacity-60 transition">
            <Heart size={24} className={isLiked ? "fill-red-500 text-red-500" : ""} />
          </button>
          <button className="hover:opacity-60 transition" onClick={() => !isUnlocked && onUnlock(listing.id)}>
            <MessageCircle size={24} />
          </button>
          <button className="hover:opacity-60 transition">
            <Send size={24} />
          </button>
        </div>
        <div className="flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-100 px-2 py-1 rounded-full">
          <Eye size={14} className="text-slate-700" /> {listing.views || 0} views
        </div>
      </div>

      {/* 4. Captions & Real Estate Parameters Content Block */}
      <div className="px-3 pb-4 space-y-2">
        <div>
          <span className="font-black text-slate-900 text-base">
            ₦{listing.price?.toLocaleString()}
          </span>
        </div>

        <p className="text-sm text-slate-800 leading-snug">
          <span className="font-extrabold mr-2">{listing.title || 'Spacious Apartment'}</span>
          Discover premium dwelling selections tailored for comfort.
        </p>

        {/* Property Structure Badges */}
        <div className="flex gap-3 text-slate-600 text-xs pt-1">
          <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md font-semibold">
            <Bed size={14} className="text-slate-800" /> {listing.beds || 0} Beds
          </span>
          <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md font-semibold">
            <Bath size={14} className="text-slate-800" /> {listing.baths || 0} Baths
          </span>
          <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md font-semibold truncate max-w-[150px]">
            <MapPin size={14} className="text-slate-800 shrink-0" /> {listing.address || 'Lagos'}
          </span>
        </div>

        {/* 5. Clean Instagram Feed Contact Paywall Hook integration */}
        <div className="pt-2">
          {isUnlocked ? (
            <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-center">
              <p className="text-[10px] text-blue-600 font-extrabold tracking-wider uppercase mb-0.5">Unlocked Contact Access</p>
              <a href={`tel:${listing.contactDetails?.phone}`} className="text-sm font-black text-blue-800 hover:underline">
                {listing.contactDetails?.phone || '0803 123 4567'}
              </a>
            </div>
          ) : (
            <button 
              onClick={() => onUnlock(listing.id)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg flex items-center justify-center gap-2 tracking-wide uppercase shadow-sm transition"
            >
              <Lock size={14} /> Unlock Contact Information (₦500)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;