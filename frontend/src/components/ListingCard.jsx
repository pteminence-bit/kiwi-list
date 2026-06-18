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

  const handleReport = async () => {
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
    <div className="flex flex-col text-slate-200 w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500" />
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
          className="text-slate-600 hover:text-red-500 cursor-pointer" 
          onClick={handleReport}
        />
      </div>

      {/* Media Display */}
      {images.length > 0 && (
        <div className="relative aspect-[4/3] w-full bg-black">
          <img 
            src={images[0]} 
            alt="Property"
            className="w-full h-full object-contain"
          />
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
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
          <p className="text-xs text-slate-500 font-bold uppercase">{listing.title}</p>
          <p className="text-xs text-slate-300 leading-relaxed">{listing.description}</p>
        </div>
        
        <div className="flex gap-4 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Bed size={14} /> {listing.beds} Beds</div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Bath size={14} /> {listing.baths} Baths</div>
        </div>

        {/* Payment / Contact Logic */}
        {isPremium && !isOwner ? (
          <PaymentButton 
            amount={listing.price}
            email={currentUser?.email || 'user@example.com'}
            name={currentUser?.displayName || 'User'}
            onSuccess={(paymentData) => {
              // The backend/webhook will handle the DB entry;
              // we call onUnlock to update the UI state immediately
              onUnlock(listing.id); 
            }}
          />
        ) : (
          <div className="mt-2 py-2.5 bg-slate-800 text-slate-400 text-[10px] text-center font-bold uppercase rounded-lg border border-slate-700">
            Contact: {listing.contactDetails?.phone || 'Available'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingCard;