import React from 'react';
import { MapPin, Bed, Bath, Lock, Eye, AlertTriangle, ChevronRight, Heart, MessageCircle, Send } from 'lucide-react';

const ListingCard = ({ listing, onUnlock, onReport }) => {
  const isPremium = listing.tier === 'premium';
  const isUnlocked = listing.isUnlocked || !isPremium;

  return (
    <div className="bg-white max-w-md mx-auto border border-slate-200 rounded-sm mb-6 shadow-sm overflow-hidden relative">
      
      {/* Instagram Header Style */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Avatar Placeholder */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center p-[2px]">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-xs font-bold text-black">
              KW
            </div>
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5 text-slate-900">
              {listing.title || 'Property Post'}
              {isPremium && (
                <span className="bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-wide">
                  PREMIUM
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 flex items-center gap-0.5">
              <MapPin size={10} /> {listing.address || 'Nigeria'}
            </p>
          </div>
        </div>

        {/* Flag Option */}
        <button 
          onClick={() => onReport(listing.id)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1"
          title="Report Listing"
        >
          <AlertTriangle size={16} />
        </button>
      </div>

      {/* Instagram Carousel Style Image Area */}
      <div className="relative aspect-square w-full bg-slate-900 flex items-center overflow-x-auto snap-x snap-mandatory scrollbar-none">
        {listing.images && listing.images.length > 0 ? (
          listing.images.map((img, i) => (
            <div key={i} className="w-full h-full flex-shrink-0 snap-start snap-always">
              <img 
                src={img} 
                className="w-full h-full object-cover select-none" 
                alt={`Property view ${i + 1}`} 
              />
            </div>
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
            No Images Provided
          </div>
        )}

        {/* Swipe Hint indicator overlay if multiple images present */}
        {listing.images && listing.images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full font-bold pointer-events-none tracking-wider">
            1/{listing.images.length} Swipe
          </div>
        )}
      </div>

      {/* Social Interaction Row */}
      <div className="p-3 pb-1 flex justify-between items-center text-slate-800">
        <div className="flex gap-4 items-center">
          <Heart size={22} className="cursor-pointer hover:text-red-500 transition-colors" />
          <MessageCircle size={22} className="cursor-pointer hover:text-blue-500 transition-colors" />
          <Send size={21} className="cursor-pointer hover:text-slate-600 transition-colors" />
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-full">
          <Eye size={14} /> {listing.views || 0} views
        </div>
      </div>

      {/* Instagram Caption & Property Metadata Details Area */}
      <div className="p-3 pt-1 space-y-2">
        <div>
          <span className="text-sm font-black text-black mr-2">
            ₦{listing.price?.toLocaleString()}
          </span>
        </div>

        {/* Core Specs chips bar */}
        <div className="flex gap-3 text-xs font-bold text-slate-600 py-1">
          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
            <Bed size={13} className="text-slate-900" /> {listing.beds || 0} Beds
          </span>
          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
            <Bath size={13} className="text-slate-900" /> {listing.baths || 0} Baths
          </span>
        </div>

        {/* Dynamic Paywall / Contact Content Drawer */}
        <div className="mt-3 pt-2 border-t border-slate-100">
          {isUnlocked ? (
            <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-lg text-center">
              <p className="text-[10px] text-emerald-800 uppercase font-black tracking-widest mb-0.5">
                Verified Contact Channel
              </p>
              <p className="text-sm font-extrabold text-emerald-900">
                {listing.contactDetails?.phone || 'Contact Info Verified'}
              </p>
            </div>
          ) : (
            <button 
              onClick={() => onUnlock(listing.id)}
              className="w-full py-2.5 bg-black hover:bg-slate-900 text-white rounded-md text-xs font-black tracking-wide flex items-center justify-center gap-2 active:scale-[0.99] transition"
            >
              <Lock size={13} className="text-amber-400 fill-amber-400" /> 
              Unlock Secure Contact Form (₦500)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;