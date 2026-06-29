import React, { useEffect } from 'react';
import { Bed, Bath, Eye, AlertTriangle, MapPin } from 'lucide-react';
import PaymentButton from './PaymentButton';
import { API_BASE_URL } from '../config';

const R2_BASE = 'https://pub-580c3d172e3f4533b065d241e61ee132.r2.dev';

const ListingCard = ({ listing, onUnlock, token, currentUser }) => {
  const images = (listing.images || []).map(img => 
    img.startsWith('http') ? img : `${R2_BASE}/${img.replace(/^\//, '')}`
  );

  const isPremium = listing.tier === 'premium';
  const isOwner = currentUser && listing.ownerId === currentUser.uid;

  const handleReport = async (e) => {
    e.stopPropagation(); 
    const reason = prompt("Please provide a reason for reporting this listing:");
    if (!reason) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/${listing.id}/report`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
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
    // FIX: Explicitly forces full width sizing on mobile and iOS engines while maintaining maximum container boundaries
    <div className="flex flex-col text-slate-200 w-full max-w-md mx-auto bg-slate-900/40 rounded-2xl border border-slate-800/60 overflow-hidden shadow-xl mb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-white flex items-center gap-1">
              KIWI-list Verified Agent 
              {isPremium && <span className="bg-amber-500 text-[9px] px-1.5 py-0.5 rounded text-white font-black uppercase">Premium</span>}
            </p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <MapPin size={10} /> {listing.address || 'Location Hidden'}
            </p>
          </div>
        </div>
        <AlertTriangle 
          size={16} 
          className="text-slate-600 hover:text-red-500 cursor-pointer shrink-0" 
          onClick={handleReport}
        />
      </div>

      {/* Media Display */}
      {images.length > 0 && (
        // FIX: Structural 4/3 containment enforcing perfect fluid width coverage without iOS background alignment gaps
        <div className="relative aspect-[4/3] w-full bg-black overflow-hidden select-none">
          <img 
            src={images[0]} 
            alt="Property"
            // FIX: "w-full h-full object-cover" ensures native viewport fills without breaking layout structures
            className="w-full h-full object-cover object-center transform scale-100 touch-pan-y"
          />
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] px-2.5 py-1 rounded-full backdrop-blur-md border border-white/5 font-bold">
              + {images.length - 1} more
            </div>
          )}
        </div>
      )}

      {/* Details */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white">₦{listing.price?.toLocaleString()}</h2>
          <div className="flex items-center gap-1 text-xs font-medium text-slate-400"><Eye size={14} /> {listing.views || 0}</div>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{listing.title}</p>
          <p className="text-xs text-slate-300 leading-relaxed break-words">{listing.description}</p>
        </div>
        
        <div className="flex gap-4 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Bed size={14} /> {listing.beds} Beds</div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Bath size={14} /> {listing.baths} Baths</div>
        </div>

        {/* Payment / Contact Logic */}
        <div className="pt-1">
          {isPremium && !isOwner ? (
            <PaymentButton onUnlock={onUnlock} />
          ) : (
            <div className="w-full py-3 bg-slate-800 text-slate-400 text-xs text-center font-bold uppercase rounded-xl border border-slate-700/60 shadow-inner">
              Contact: {listing.contactDetails?.phone || 'Available'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;