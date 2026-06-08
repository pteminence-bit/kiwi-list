import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { MapPin, Bed, Bath, Lock, Eye, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../firebase'; 

// FIXED: Define your public Cloudflare R2 bucket endpoint base URL here
const R2_PUBLIC_BUCKET_URL = 'https://pub-580c3d172e3f4533b065d241e61ee132.r2.dev'; 
// Note: Replace this string with your custom R2 sub-domain if you are serving directly from R2,
// e.g., 'https://pub-<unique-id>.r2.dev'

const ListingCard = ({ listing, onUnlock, onReport }) => {
  const isPremium = listing.tier === 'premium';
  const isUnlocked = listing.isUnlocked || !isPremium;
  
  const [liveViews, setLiveViews] = useState(listing.views || 0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const rawImages = listing.images || [];
 // FIXED: Bulletproof image reference mapping to block any stringified "undefined" routes
  const images = rawImages.map(img => {
    if (!img) return '/fallback-placeholder.png';
    
    // If it's already an absolute cloud URL, bypass modifications
    if (img.startsWith('http')) return img;
    
    // Explicit hard fallback boundary check for the R2 base domain
    const fallbackBaseUrl = 'https://pub-580c3d172e3f4533b065d241e61ee132.r2.dev';
    const baseUrl = (typeof R2_PUBLIC_BUCKET_URL !== 'undefined' && R2_PUBLIC_BUCKET_URL) 
      ? R2_PUBLIC_BUCKET_URL 
      : fallbackBaseUrl;

    // Clean up double-slashes if a filename incorrectly prefixes one
    const sanitizedFileName = img.startsWith('/') ? img.slice(1) : img;
    
    return `${baseUrl}/${sanitizedFileName}`;
  });  const scrollContainerRef = useRef(null);

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
    <div className="bg-white rounded-none md:rounded-xl border border-slate-200 overflow-hidden w-full md:max-w-xl lg:max-w-4xl mx-auto shadow-sm flex flex-col h-full">
      
      {/* Card Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-amber-500 p-[2px]">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-black text-xs text-slate-800">
              KW
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              Verified Agent
              {isPremium && <span className="w-2 h-2 rounded-full bg-amber-500" />}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">{listing.address?.split(',').pop() || 'Nigeria'}</p>
          </div>
        </div>
        
        <button 
          onClick={() => onReport && onReport(listing.id)}
          className="p-1.5 text-slate-400 hover:text-red-600 rounded-full transition"
        >
          <AlertTriangle size={18} />
        </button>
      </div>

      {/* Media Canvas Area */}
      <div className="relative w-full aspect-[4/5] sm:aspect-square overflow-hidden bg-slate-100 shrink-0 group isolate pointer-events-auto">
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
                className="w-full h-full object-cover select-none cursor-pointer transition-transform duration-500 hover:scale-102" 
                alt="Property View Portfolio" 
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); executeScrollTo(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-slate-800 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex z-10"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); executeScrollTo(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-slate-800 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex z-10"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {isPremium && (
          <span className="absolute top-4 right-4 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-950 bg-amber-400 rounded-full shadow-md z-10">
            Premium
          </span>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 px-2 py-1 rounded-full backdrop-blur-xs">
            {images.map((_, i) => (
              <span 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${i === currentImageIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Analytics Bar */}
      <div className="px-4 pt-4 pb-1 flex items-center justify-end shrink-0">
        <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-full">
          <Eye size={14} className="text-slate-700" /> {liveViews.toLocaleString()} real-time views
        </div>
      </div>

      {/* Detail Overlays */}
      <div className="px-4 pb-4 space-y-3 flex-grow flex flex-col justify-between">
        <div className="space-y-2">
          <div className="font-black text-slate-900 text-xl pt-1">
            ₦{listing.price?.toLocaleString()}
          </div>

          <p className="text-sm text-slate-800 leading-snug">
            <span className="font-extrabold mr-2">{listing.title || 'Spacious Unit'}</span>
            Marketed by authenticated broker networks.
          </p>

          <div className="flex flex-wrap gap-2 text-slate-600 text-xs pt-1">
            <span className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-md font-semibold">
              <Bed size={13} className="text-slate-800" /> {listing.beds || 0} Beds
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-md font-semibold">
              <Bath size={13} className="text-slate-800" /> {listing.baths || 0} Baths
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-md font-semibold truncate max-w-[240px]">
              <MapPin size={13} className="text-slate-800 shrink-0" /> {listing.address || 'Lagos'}
            </span>
          </div>
        </div>

        <div className="pt-4">
          {isUnlocked ? (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
              <p className="text-[10px] text-blue-600 font-extrabold tracking-wider uppercase mb-0.5">Contact Line</p>
              <a href={`tel:${listing.contactDetails?.phone}`} className="text-sm font-black text-blue-800 hover:underline">
                {listing.contactDetails?.phone || '0803 123 4567'}
              </a>
            </div>
          ) : (
            <button 
              onClick={() => onUnlock(listing.id)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg flex items-center justify-center gap-2 tracking-wide uppercase transition"
            >
              <Lock size={14} /> Unlock Contact (₦500)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;