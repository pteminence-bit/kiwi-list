// components/ListingCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { MapPin, Bed, Bath, Lock, Eye, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../firebase'; 

const R2_PUBLIC_BUCKET_URL = 'https://pub-580c3d172e3f4533b065d241e61ee132.r2.dev';

const ListingCard = ({ listing, onUnlock, onReport }) => {
  const isPremium = listing.tier === 'premium';
  const isUnlocked = listing.isUnlocked || !isPremium;
  const [liveViews, setLiveViews] = useState(listing.views || 0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const rawImages = listing.images || [];
  const scrollContainerRef = useRef(null);

  const images = rawImages.map(img => {
    if (!img) return '/fallback-placeholder.png';
    if (img.startsWith('http')) return img;
    const baseUrl = R2_PUBLIC_BUCKET_URL;
    let sanitizedFileName = img.replace(/^(\/?undefined\/)/, '');
    sanitizedFileName = sanitizedFileName.startsWith('/') ? sanitizedFileName.slice(1) : sanitizedFileName;
    return `${baseUrl}/${sanitizedFileName}`;
  });

  useEffect(() => {
    if (!listing.id) return;
    const docRef = doc(db, 'listings', listing.id);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) setLiveViews(snapshot.data().views || 0);
    });
    updateDoc(docRef, { views: increment(1) }).catch(console.error);
    return () => unsubscribe();
  }, [listing.id]);

  // Logic to handle reporting in Firebase
  const handleReport = async () => {
    const reason = window.prompt("Reason for reporting:");
    if (!reason) return;

    try {
      // 1. Add to reports collection for Admin Portal to see
      await addDoc(collection(db, 'reports'), {
        listingId: listing.id,
        listingTitle: listing.title || 'Untitled',
        reason: reason,
        reportedAt: serverTimestamp(),
        status: 'pending'
      });
      // 2. Mark listing as flagged
      await updateDoc(doc(db, 'listings', listing.id), { flagged: true });
      alert("Thank you. This listing has been flagged for admin review.");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white w-full mx-auto flex flex-col h-full text-slate-950">
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400">KW</div>
          <div>
            <div className="text-xs font-bold text-slate-900">Verified Agent</div>
            <p className="text-[10px] text-slate-500 font-medium">{listing.address?.split(',').pop()?.trim() || 'Nigeria'}</p>
          </div>
        </div>
        <button onClick={handleReport} className="p-1.5 text-slate-400 hover:text-red-600 transition active:scale-95">
          <AlertTriangle size={16} />
        </button>
      </div>

      <div className="relative w-full aspect-square sm:aspect-[4/5] bg-slate-50 group">
        <div ref={scrollContainerRef} className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none">
          {images.map((img, idx) => (
            <div key={idx} className="w-full h-full flex-shrink-0 snap-start"><img src={img} className="w-full h-full object-cover" alt="Property" /></div>
          ))}
        </div>
        {isPremium && <span className="absolute top-3 right-3 px-2.5 py-0.5 text-[9px] font-black uppercase text-amber-950 bg-amber-400 rounded-md z-10">Premium</span>}
      </div>

      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-1 text-slate-900 text-xs font-bold"><Eye size={15} /> <span>{liveViews.toLocaleString()} views</span></div>
      </div>

      <div className="px-3 pb-4 space-y-3 flex-grow flex flex-col">
        <div className="font-black text-slate-900 text-lg">₦{listing.price?.toLocaleString()}</div>
        <div className="text-xs text-slate-800 leading-relaxed"><span className="font-bold mr-1.5">{listing.title}</span></div>
        <div className="flex flex-wrap gap-1.5 text-[11px] pt-1">
          <span className="bg-slate-100 px-2.5 py-1 rounded-md font-semibold">{listing.beds || 0} Beds</span>
          <span className="bg-slate-100 px-2.5 py-1 rounded-md font-semibold">{listing.baths || 0} Baths</span>
        </div>
        <div className="pt-2">
          {isUnlocked ? (
            <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2.5 text-center"><a href={`tel:${listing.contactDetails?.phone}`} className="text-xs font-black text-blue-800">{listing.contactDetails?.phone}</a></div>
          ) : (
            <button onClick={() => onUnlock(listing.id)} className="w-full py-2.5 bg-blue-600 text-white text-[11px] font-bold rounded-md">Unlock Details</button>
          )}
        </div>
      </div>
    </div>
  );
};
export default ListingCard;