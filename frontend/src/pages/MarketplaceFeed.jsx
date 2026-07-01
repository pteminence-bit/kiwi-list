import React, { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase'; // 👈 Direct Firebase instance check added as a reliable fallback

const MarketplaceFeed = ({ token }) => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGallery, setActiveGallery] = useState(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const isFetching = useRef(false);

  // Structural sanity wrapper matching your custom normalized string model layout
  const sanitizedUser = React.useMemo(() => {
    // Fallback to active client instance if context state is initializing
    const activeUser = user || auth.currentUser; 
    if (!activeUser || !activeUser.email) return activeUser;
    
    const sanitizedEmail = activeUser.email.toLowerCase().trim().replace(/[@.]/g, '-');
    return {
      ...activeUser,
      uid: `kiwi-user-${sanitizedEmail}` // Injects the sanitized version safely into client card parameters
    };
  }, [user]);

  const fetchFeed = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/listings/feed`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      const sortedData = (data || []).sort((a, b) => {
        if (a.tier === 'premium' && b.tier !== 'premium') return -1;
        if (a.tier !== 'premium' && b.tier === 'premium') return 1;
        return 0;
      });
      
      setListings(sortedData);
    } catch (err) {
      console.error("Error fetching feed:", err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [token]);

  useEffect(() => {
    const handleScroll = () => {
      // FIX: Employs standard documentElement measurements to reliably track infinite scroll triggers across responsive screens
      const threshold = 200;
      const totalHeight = document.documentElement.scrollHeight;
      const currentScroll = window.innerHeight + window.scrollY;

      if (totalHeight - currentScroll <= threshold) {
        fetchFeed();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleUnlockContact = async (listingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: 500, purpose: 'unlock_contact', listingId })
      });
      
      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl; 
      } else {
        console.error("Payment failed:", data.error);
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const handleImageLightboxCapture = (e) => {
    const galleryData = e.currentTarget.getAttribute('data-full-gallery');
    if (galleryData) {
      setActiveGallery(JSON.parse(galleryData));
      setGalleryIdx(0);
    }
  };

  if (loading && listings.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">
        Loading Kiwi-List Feed...
      </div>
    );
  }

  return (
    <div className="w-full h-full pb-12">
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm p-4 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl">
          <Search className="text-slate-500 ml-2" size={18} />
          <input type="text" placeholder="Search..." className="w-full bg-transparent outline-none text-sm text-white" />
          <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white"><SlidersHorizontal size={14} /> Filter</button>
        </div>
      </div>

      <div className="flex flex-col items-center px-2">
        <div className="w-full max-w-lg space-y-6">
          {listings.map(listing => (
            <div 
              key={listing.id} 
              onClick={handleImageLightboxCapture} 
              data-full-gallery={JSON.stringify((listing.images || []).map(img => img.startsWith('http') ? img : `https://pub-580c3d172e3f4533b065d241e61ee132.r2.dev/${img.replace(/^\//, '')}`))}
              className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl cursor-pointer"
            >
              <ListingCard 
                listing={listing} 
                token={token} 
                onUnlock={() => handleUnlockContact(listing.id)}
                currentUser={sanitizedUser} // 👈 Passes the corrected normalized UID layout cleanly
              />
            </div>
          ))}
        </div>
      </div>

      {activeGallery && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setActiveGallery(null)}>
          <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white z-50" onClick={() => setActiveGallery(null)}><X size={24} /></button>
          {activeGallery.length > 1 && (
            <button className="absolute left-4 p-2 bg-black/50 rounded-full text-white z-50" onClick={(e) => { e.stopPropagation(); setGalleryIdx(prev => (prev === 0 ? activeGallery.length - 1 : prev - 1)); }}><ChevronLeft size={30} /></button>
          )}
          <img src={activeGallery[galleryIdx]} className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" alt="Gallery View" />
          {activeGallery.length > 1 && (
            <button className="absolute right-4 p-2 bg-black/50 rounded-full text-white z-50" onClick={(e) => { e.stopPropagation(); setGalleryIdx(prev => (prev === activeGallery.length - 1 ? 0 : prev + 1)); }}><ChevronRight size={30} /></button>
          )}
          <div className="absolute bottom-6 text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full">
            {galleryIdx + 1} / {activeGallery.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceFeed;