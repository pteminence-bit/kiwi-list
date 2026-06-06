import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { MapPin, Bed, Bath, Lock, Eye, AlertTriangle, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
// IMPORT FIXED HERE: Point this path directly to where your frontend initialized firebase "db" object is saved
import { db } from '../firebase'; 

const ListingCard = ({ listing, onUnlock, onReport, currentUserId }) => {
  const isPremium = listing.tier === 'premium';
  const isUnlocked = listing.isUnlocked || !isPremium;
  
  // Real-time synchronization states
  const [liveMetrics, setLiveMetrics] = useState({ views: listing.views || 0, likes: listing.likesCount || 0 });
  const [isLiked, setIsLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = listing.images || [];
  const scrollContainerRef = useRef(null);

  // 1. Establish Real-Time Listener connection to Firestore for views & likes
  useEffect(() => {
    if (!listing.id) return;

    const docRef = doc(db, 'listings', listing.id);
    
    // Listen for data shifts instantly
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setLiveMetrics({
          views: data.views || 0,
          likes: data.likesCount || 0
        });
        
        // Track if this explicit authenticated user has liked this asset before
        if (currentUserId && data.likedBy) {
          setIsLiked(data.likedBy.includes(currentUserId));
        }
      }
    });

    // Auto-increment public counter view tally via server-side updates on component init
    updateDoc(docRef, { views: increment(1) }).catch(err => console.error(err));

    return () => unsubscribe();
  }, [listing.id, currentUserId]);

  // 2. Handle Real-time Likes Mutation updates atomically
  const handleLikeToggle = async (e) => {
    e.stopPropagation();
    if (!currentUserId) return alert("Please log in to save listings.");
    
    const docRef = doc(db, 'listings', listing.id);
    try {
      if (isLiked) {
        await updateDoc(docRef, {
          likesCount: increment(-1),
          likedBy: arrayRemove(currentUserId)
        });
      } else {
        await updateDoc(docRef, {
          likesCount: increment(1),
          likedBy: arrayUnion(currentUserId)
        });
      }
    } catch (err) {
      console.error("Failed to update like metrics gracefully:", err);
    }
  };

  // 3. Keep Desktop carousel sync dots updated during responsive swipe transitions
  const handleMobileScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const newIndex = Math.round(scrollLeft / clientWidth);
    setCurrentImageIndex(newIndex);
  };

  const executeScrollTo = (index) => {
    if (!scrollContainerRef.current) return;
    const clientWidth = scrollContainerRef.current.clientWidth;
    scrollContainerRef.current.scrollTo({
      left: index * clientWidth,
      behavior: 'smooth'
    });
    setCurrentImageIndex(index);
  };

  return (
    <div className="bg-white rounded-none md:rounded-xl border border-slate-200 overflow-hidden w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto shadow-sm flex flex-col h-full">
      
      {/* Card Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-amber-500 p-[2px]">
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
          onClick={() => onReport(listing.id)}
          className="p-1 text-slate-400 hover:text-red-600 rounded-full transition"
        >
          <AlertTriangle size={18} />
        </button>
      </div>

      {/* Media Canvas Area: Touch Swipe Carousel Engine */}
      <div className="relative aspect-square w-full bg-slate-950 group shrink-0">
        <div 
          ref={scrollContainerRef}
          onScroll={handleMobileScroll}
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {images.map((img, idx) => (
            <div key={idx} className="w-full h-full flex-shrink-0 snap-start snap-always">
              <img 
                src={img} 
                className="w-full h-full object-cover pointer-events-none select-none" 
                alt="Property View Portfolio" 
              />
            </div>
          ))}
        </div>

        {/* Desktop Explicit Navigation Chevrons */}
        {images.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); executeScrollTo(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 text-slate-800 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex z-10"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); executeScrollTo(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 text-slate-800 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex z-10"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {isPremium && (
          <span className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-950 bg-amber-400 rounded-full shadow-md z-10">
            Premium
          </span>
        )}

        {/* Carousel Position Tracking Indicator Dots */}
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

      {/* Simplified Analytics Bar (Stripped Comment/Share) */}
      <div className="px-3 pt-3 pb-1 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={handleLikeToggle} className="hover:opacity-70 transition p-1">
            <Heart size={24} className={isLiked ? "fill-red-500 text-red-500" : "text-slate-800"} />
          </button>
          <span className="text-xs font-bold text-slate-700">{liveMetrics.likes.toLocaleString()} likes</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-full">
          <Eye size={14} className="text-slate-700" /> {liveMetrics.views.toLocaleString()} views
        </div>
      </div>

      {/* Technical Detail Overlays */}
      <div className="px-3 pb-4 space-y-2 flex-grow flex flex-col justify-between">
        <div className="space-y-2">
          <div className="font-black text-slate-900 text-lg pt-1">
            ₦{listing.price?.toLocaleString()}
          </div>

          <p className="text-sm text-slate-800 leading-snug">
            <span className="font-extrabold mr-2">{listing.title || 'Spacious Unit'}</span>
            Marketed by authenticated broker networks.
          </p>

          <div className="flex flex-wrap gap-2 text-slate-600 text-xs pt-1">
            <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md font-semibold">
              <Bed size={13} className="text-slate-800" /> {listing.beds || 0} Beds
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md font-semibold">
              <Bath size={13} className="text-slate-800" /> {listing.baths || 0} Baths
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md font-semibold truncate max-w-[180px]">
              <MapPin size={13} className="text-slate-800 shrink-0" /> {listing.address || 'Lagos'}
            </span>
          </div>
        </div>

        {/* Contact Access Management Footer Panel */}
        <div className="pt-4">
          {isUnlocked ? (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-blue-600 font-extrabold tracking-wider uppercase mb-0.5">Contact Line</p>
              <a href={`tel:${listing.contactDetails?.phone}`} className="text-sm font-black text-blue-800 hover:underline">
                {listing.contactDetails?.phone || '0803 123 4567'}
              </a>
            </div>
          ) : (
            <button 
              onClick={() => onUnlock(listing.id)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg flex items-center justify-center gap-2 tracking-wide uppercase transition"
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