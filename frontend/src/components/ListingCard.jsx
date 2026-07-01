import React, { useEffect, useState } from 'react';
import { Bed, Bath, Eye, AlertTriangle, MapPin, CheckCircle2 } from 'lucide-react';
import PaymentButton from './PaymentButton';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';

const R2_BASE = 'https://pub-580c3d172e3f4533b065d241e61ee132.r2.dev';

const ListingCard = ({ listing, onUnlock, token: propToken, currentUser }) => {
  const [activeToken, setActiveToken] = useState(propToken || null);

  useEffect(() => {
    if (propToken) {
      setActiveToken(propToken);
    } else {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            const liveToken = await user.getIdToken(true);
            setActiveToken(liveToken);
          } catch (err) {
            console.error("Error fetching live token:", err);
          }
        } else {
          setActiveToken(null);
        }
      });
      
      return () => unsubscribe();
    }
  }, [propToken]);

  const images = (listing.images || []).map(img => 
    img.startsWith('http') ? img : `${R2_BASE}/${img.replace(/^\//, '')}`
  );

  const isPremium = listing.tier === 'premium';
  
  const isOwner = currentUser && (
    listing.ownerId === currentUser.uid || 
    listing.ownerId === currentUser.id ||
    (listing.contactDetails?.email && currentUser.email && listing.contactDetails.email.toLowerCase() === currentUser.email.toLowerCase())
  );

  const handleReport = async (e) => {
    e.stopPropagation(); 
    const reason = prompt("Please provide a reason for reporting this listing:");
    if (!reason) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/${listing.id}/report`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}` 
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert("Listing reported successfully. Admin will review.");
      } else {
        alert("Failed to report listing.");
      }
    } catch (error) {
      console.error("Error reporting listing:", error);
    }
  };

  const handleView = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/listings/${listing.id}/view`, {
        method: 'PATCH'
      });
    } catch (err) {
      console.error("Failed to track view", err);
    }
  };

  useEffect(() => {
    handleView();
  }, [listing.id]);

  return (
    // FIX: Added data-listing-id natively to guarantee the DOM contains the identity signature
    <div data-listing-id={listing.id} className="flex flex-col text-slate-200 w-full max-w-md mx-auto bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl transition-all duration-300 hover:border-slate-700/60 mb-5 group">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md flex items-center justify-center font-bold text-white text-sm shrink-0">
            K
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-100 tracking-wide flex items-center gap-1">
                KIWI-list Agent 
              </p>
              <CheckCircle2 size={12} className="text-indigo-400 fill-indigo-400/10" />
              {isPremium && (
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-[9px] px-1.5 py-0.5 rounded-md text-slate-950 font-black tracking-wider uppercase shadow-sm">
                  Premium
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
              <MapPin size={11} className="text-slate-500" /> {listing.address || 'Location Hidden'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleReport}
          className="p-1.5 rounded-lg hover:bg-slate-800/60 text-slate-500 hover:text-red-400 transition-colors shrink-0"
          title="Report Listing"
        >
          <AlertTriangle size={15} />
        </button>
      </div>

      {/* Media Display */}
      {images.length > 0 && (
        <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden select-none border-y border-slate-900">
          <img 
            src={images[0]} 
            alt="Property"
            className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-500 group-hover:scale-[1.02] touch-pan-y"
          />
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-slate-950/80 text-slate-200 text-[10px] px-2.5 py-1 rounded-full backdrop-blur-md border border-white/5 font-bold tracking-wide shadow-lg">
              + {images.length - 1} more photos
            </div>
          )}
        </div>
      )}

      {/* Details */}
      <div className="p-4 space-y-3.5">
        <div className="flex justify-between items-baseline">
          <h2 className="text-2xl font-black text-white tracking-tight">
            ₦{listing.price?.toLocaleString()}
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 bg-slate-950/30 px-2 py-0.5 rounded-md border border-slate-800/40">
            <Eye size={12} className="text-slate-500" /> 
            {listing.views || 0} views
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">{listing.title}</p>
          <p className="text-xs text-slate-300 leading-relaxed font-normal break-words">{listing.description}</p>
        </div>
        
        <div className="flex gap-4 pt-0.5 border-t border-slate-800/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 pt-2">
            <Bed size={14} className="text-slate-500" /> {listing.beds} Beds
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 pt-2">
            <Bath size={14} className="text-slate-500" /> {listing.baths} Baths
          </div>
        </div>

        {/* Payment / Contact Logic */}
        <div className="pt-1">
          {isPremium && !isOwner ? (
            <PaymentButton />
          ) : (
            <div className="w-full py-3 bg-slate-800/40 text-slate-300 text-xs text-center font-bold tracking-wide uppercase rounded-xl border border-slate-700/40 shadow-sm backdrop-blur-sm">
              Contact: <span className="text-indigo-400">{listing.contactDetails?.phone || 'Available'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;