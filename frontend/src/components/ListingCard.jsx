import React from 'react';
import { MapPin, Bed, Bath, Lock, Eye, AlertTriangle } from 'lucide-react';

const ListingCard = ({ listing, onUnlock, onReport }) => {
  const isPremium = listing.tier === 'premium';
  // Check if contact is unlocked (if premium) or if it's a free post
  const isUnlocked = listing.isUnlocked || !isPremium;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative group">
      {/* Report Button (Visible on Hover) */}
      <button 
        onClick={() => onReport(listing.id)}
        className="absolute top-4 left-4 p-2 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full shadow-sm z-20 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Report Listing"
      >
        <AlertTriangle size={16} />
      </button>

      {/* Premium Ribbon */}
      {isPremium && (
        <div className="absolute top-4 right-[-35px] bg-amber-500 text-white text-[10px] font-bold py-1 px-10 rotate-45 shadow-md z-10">
          PREMIUM
        </div>
      )}

      {/* Image Gallery Grid */}
      <div className="grid grid-cols-2 gap-1 h-48 bg-slate-100">
        {listing.images && listing.images.slice(0, 4).map((img, i) => (
          <img key={i} src={img} className="w-full h-full object-cover" alt="property" />
        ))}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-slate-800">₦{listing.price?.toLocaleString()}</h3>
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <Eye size={14} /> {listing.views || 0}
          </div>
        </div>

        <p className="text-sm text-slate-600 flex items-center gap-1 mb-4">
          <MapPin size={14} /> {listing.address || 'Address hidden'}
        </p>

        <div className="flex gap-4 mb-6 border-y border-slate-50 py-2">
          <span className="text-xs text-slate-500 flex items-center gap-1"><Bed size={14}/> {listing.beds || 0} Beds</span>
          <span className="text-xs text-slate-500 flex items-center gap-1"><Bath size={14}/> {listing.baths || 0} Baths</span>
        </div>

        {/* Paywall Logic Block */}
        {isUnlocked ? (
          <div className="bg-slate-50 p-3 rounded-lg border border-dashed border-blue-200">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Contact Details</p>
            <p className="text-sm font-semibold text-blue-600">{listing.contactDetails?.phone || 'Contact Info Available'}</p>
          </div>
        ) : (
          <button 
            onClick={() => onUnlock(listing.id)}
            className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition"
          >
            <Lock size={16} /> Unlock Contact (₦500)
          </button>
        )}
      </div>
    </div>
  );
};

export default ListingCard;