import React, { useState } from 'react';
import { MapPin, Bed, Bath, Lock, Eye, AlertTriangle, ChevronLeft, ChevronRight, Heart, MessageCircle, Send } from 'lucide-react';

const ListingCard = ({ listing, onUnlock, onReport }) => {
  const isPremium = listing.tier === 'premium';
  const isUnlocked = listing.isUnlocked || !isPremium;
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  
  // State variables to track touch points for mobile swiping
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const images = listing.images || [];

  const handlePrevSlide = (e) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextSlide = (e) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // --- SWIPE LOGIC HANDLERS ---
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNextSlide();
    } else if (isRightSwipe) {
      handlePrevSlide();
    }
  };

  return (
    <div className="bg-white rounded-none md:rounded-xl border border-slate-200 overflow-hidden w-full mx-auto shadow-sm max-w-md lg:max-w-4xl flex flex-col lg:flex-row">
      
      {/* LEFT COLUMN / TOP SECTION: Media Canvas (Swipeable) */}
      <div className="w-full lg:w-1/2 flex flex-col bg-slate-950 relative">
        
        {/* Mobile Header (Hidden on Desktop split view) */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-white lg:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-blue-500 p-[2px]">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-black text-xs text-slate-800">
                KIWI
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                Verified Agent
                {isPremium && <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Lagos, Nigeria</p>
            </div>
          </div>
          <button onClick={() => onReport(listing.id)} className="p-1 text-slate-400 hover:text-red-600 rounded-full transition">
            <AlertTriangle size={18} />
          </button>
        </div>

        {/* Swipe Container Canvas */}
        <div 
          className="relative aspect-square w-full bg-slate-950 group overflow-hidden flex-1"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {images.length > 0 ? (
            <img 
              src={images[currentImageIndex]} 
              className="w-full h-full object-cover transition-all duration-300 select-none" 
              alt={`Property visual view ${currentImageIndex + 1}`} 
              draggable="false"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900 text-sm">
              No Images Available
            </div>
          )}

          {/* Desktop Chevron Toggles */}
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

          {/* Premium Badge Flag overlay */}
          {isPremium && (
            <span className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-950 bg-amber-400 rounded-full shadow-md z-10">
              Premium Post
            </span>
          )}

          {/* Carousel Tracking Dots */}
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
      </div>

      {/* RIGHT COLUMN: Details & Interactions Content Block (Fits desktop screens) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-4 bg-white">
        <div>
          {/* Desktop Exclusive Layout Header */}
          <div className="hidden lg:flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-blue-500 p-[2px]">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-black text-xs text-slate-800">
                  KIWI
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  Verified Agent
                  {isPremium && <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Lagos, Nigeria</p>
              </div>
            </div>
            <button onClick={() => onReport(listing.id)} className="p-1 text-slate-400 hover:text-red-600 rounded-full transition">
              <AlertTriangle size={18} />
            </button>
          </div>

          {/* Pricing & Metric Rows */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-black text-slate-900 text-xl tracking-tight">
              ₦{listing.price?.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-full">
              <Eye size={14} className="text-slate-700" /> {listing.views || 0} views
            </div>
          </div>

          {/* Structural Descriptions */}
          <p className="text-sm text-slate-800 leading-relaxed mb-4">
            <span className="font-extrabold mr-2">{listing.title || 'Spacious Apartment'}</span>
            Discover premium dwelling selections tailored for comfort and modern lifestyle living dynamics.
          </p>

          {/* Property Structural Parameter Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-md font-semibold text-xs text-slate-700">
              <Bed size={14} className="text-slate-800" /> {listing.beds || 0} Beds
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-md font-semibold text-xs text-slate-700">
              <Bath size={14} className="text-slate-800" /> {listing.baths || 0} Baths
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-md font-semibold text-xs text-slate-700 truncate max-w-full">
              <MapPin size={14} className="text-slate-800 shrink-0" /> {listing.address || 'Lagos'}
            </span>
          </div>
        </div>

        {/* Interaction Ribbons & Paywalls Footer Wrapper */}
        <div className="space-y-4 border-t border-slate-100 pt-4">
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

          {/* Native Monetized Paywall Access Action Area */}
          <div>
            {isUnlocked ? (
              <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-center">
                <p className="text-[10px] text-blue-600 font-extrabold tracking-wider uppercase mb-0.5">Unlocked Contact Access</p>
                <a href={`tel:${listing.contactDetails?.phone}`} className="text-base font-black text-blue-800 hover:underline">
                  {listing.contactDetails?.phone || '0803 123 4567'}
                </a>
              </div>
            ) : (
              <button 
                onClick={() => onUnlock(listing.id)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg flex items-center justify-center gap-2 tracking-wide uppercase shadow-sm transition"
              >
                <Lock size={14} /> Unlock Contact Information (₦500)
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ListingCard;