// components/ListingCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { MapPin, Bed, Bath, Lock, Eye, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../firebase'; 

// FIXED: Define your public Cloudflare R2 bucket endpoint base URL here
const R2_PUBLIC_BUCKET_URL = 'https://pub-580c3d172e3f4533b065d241e61ee132.r2.dev';

const ListingCard = ({ listing, onUnlock, onReport }) => {
  const isPremium = listing.tier === 'premium';
  const isUnlocked = listing.isUnlocked || !isPremium;
  
  const [liveViews, setLiveViews] = useState(listing.views || 0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const rawImages = listing.images || [];
  const scrollContainerRef = useRef(null);

  // FIXED: Bulletproof image reference mapping to intercept and strip out legacy stringified "undefined" path variables
  const images = rawImages.map(img => {
    if (!img) return '/fallback-placeholder.png';
    
    // If it's already an absolute cloud URL, bypass modifications
    if (img.startsWith('http')) return img;
    
    // Explicit hard fallback boundary check for the R2 base domain
    const fallbackBaseUrl = 'https://pub-580c3d172e3f4533b065d241e61ee132.r2.dev';
    const baseUrl = (typeof R2_PUBLIC_BUCKET_URL !== 'undefined' && R2_PUBLIC_BUCKET_URL) 
      ? R2_PUBLIC_BUCKET_URL 
      : fallbackBaseUrl;

    // EMERGENCY SANITIZER: Automatically strips out "undefined/" or "/undefined/" if parsed from legacy documents
    let sanitizedFileName = img.replace(/^(\/?undefined\/)/, '');

    // Clean up double-slashes or structural leading characters if a filename incorrectly prefixes one
    sanitizedFileName = sanitizedFileName.startsWith('/') ? sanitizedFileName.slice(1) : sanitizedFileName;
    
    return `${baseUrl}/${sanitizedFileName}`;
  });

  useEffect(() => {
    if (!listing.id) return;

    const docRef = doc(db, 'listings', listing.id);
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setLiveViews(data.views || 0);
      }
    });

    updateDoc(docRef, { views: increment(1) }).catch(err => console.error(err));

    return () => unsubscribe();
  }, [listing.id]);

  const handleMobileScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft } = scrollContainerRef.current;
    const clientWidth = scrollContainerRef.current.getBoundingClientRect().width || scrollContainerRef.current.clientWidth;
    if (clientWidth <= 0) return;
    
    const newIndex = Math.round(scrollLeft / clientWidth);
    if (newIndex !== currentImageIndex && newIndex >= 0 && newIndex < images.length) {
      setCurrentImageIndex(newIndex);
    }
  };

  const executeScrollTo = (index) => {
    if (!scrollContainerRef.current) return;
    const clientWidth = scrollContainerRef.current.getBoundingClientRect().width || scrollContainerRef.current.clientWidth;
    
    scrollContainerRef.current.scrollTo({
      left: index * clientWidth,
      behavior: 'smooth'
    });
    setCurrentImageIndex(index);
  };

  return (
    <div className="bg-white w-full mx-auto flex flex-col h-full text-slate-950">
      
      {/* Card Header: Instagram Style Profile Row */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-[2px] shadow-sm">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-black text-[10px] text-slate-800 tracking-tight">
              KW
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
              Verified Agent
              {isPremium && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
            </div>
            <p className="text-[10px] text-slate-500 font-medium">{listing.address?.split(',').pop()?.trim() || 'Nigeria'}</p>
          </div>
        </div>
        
        <button 
          onClick={() => onReport && onReport(listing.id)}
          className="p-1.5 text-slate-400 hover:text-red-600 rounded-full transition active:scale-95"
        >
          <AlertTriangle size={16} />
        </button>
      </div>

      {/* Media Canvas Area: Instagram Strict Square / 4:5 Bleed Dimensions */}
      <div className="relative w-full aspect-square sm:aspect-[4/5] overflow-hidden bg-slate-50 shrink-0 group isolate pointer-events-auto">
        <div 
          ref={scrollContainerRef}
          onScroll={handleMobileScroll}
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {images.map((img, idx) => (
            <div key={idx} className="w-full h-full flex-shrink-0 snap-start snap-always relative overflow-hidden">
              <img 
                src={img} 
                className="w-full h-full object-cover select-none cursor-pointer" 
                alt="Property View Portfolio" 
              />
            </div>
          ))}
        </div>

        {/* Carousel Navigation Arrow Controls */}
        {images.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); executeScrollTo(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 backdrop-blur-xs text-slate-800 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); executeScrollTo(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 backdrop-blur-xs text-slate-800 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex z-10"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Premium Badge Tag Overlay */}
        {isPremium && (
          <span className="absolute top-3 right-3 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-950 bg-amber-400 rounded-md shadow-sm z-10">
            Premium
          </span>
        )}

        {/* Floating Pagination Slider Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/30 px-2 py-1 rounded-full backdrop-blur-xs">
            {images.map((_, i) => (
              <span 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${i === currentImageIndex ? 'bg-white scale-110' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Analytics Engagement Metric Bar directly under media node */}
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 text-slate-900 text-xs font-bold tracking-tight">
          <Eye size={15} className="text-slate-900 stroke-[2.5]" /> 
          <span>{liveViews.toLocaleString()} views</span>
        </div>
      </div>

      {/* Detail Content Layout Section */}
      <div className="px-3 pb-4 space-y-3 flex-grow flex flex-col justify-between">
        <div className="space-y-2">
          {/* Main Price Header Tag Block */}
          <div className="font-black text-slate-900 text-lg tracking-tight">
            ₦{listing.price?.toLocaleString()}
          </div>

          {/* Inline Caption / Description Block */}
          <div className="text-xs text-slate-800 leading-relaxed">
            <span className="font-bold text-slate-950 mr-1.5">{listing.title || 'Spacious Unit'}</span>
            Marketed via authenticated broker networks. Secure property documentation parameters verified.
          </div>

          {/* Horizontal Metric Utility Tags */}
          <div className="flex flex-wrap gap-1.5 text-slate-700 text-[11px] pt-1">
            <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md font-semibold">
              <Bed size={12} className="text-slate-900" /> {listing.beds || 0} Beds
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md font-semibold">
              <Bath size={12} className="text-slate-900" /> {listing.baths || 0} Baths
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md font-semibold truncate max-w-[200px]">
              <MapPin size={12} className="text-slate-900 shrink-0" /> {listing.address || 'Lagos'}
            </span>
          </div>
        </div>

        {/* Action Button Segment */}
        <div className="pt-2">
          {isUnlocked ? (
            <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2.5 text-center">
              <p className="text-[9px] text-blue-600 font-extrabold tracking-wider uppercase mb-0.5">Contact Line Active</p>
              <a href={`tel:${listing.contactDetails?.phone}`} className="text-xs font-black text-blue-800 hover:underline tracking-wide">
                {listing.contactDetails?.phone || '0803 123 4567'}
              </a>
            </div>
          ) : (
            <button 
              onClick={() => onUnlock(listing.id)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-md flex items-center justify-center gap-1.5 tracking-wide transition active:scale-[0.99]"
            >
              <Lock size={13} /> Unlock Broker Details (₦500)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;