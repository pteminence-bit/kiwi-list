import React, { useState, useEffect } from 'react';
import { Loader2, Lock, Unlock } from 'lucide-react';
import { auth } from '../firebase';

const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const PaymentButton = () => {
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    // 1. Check persistent localStorage string directly
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setAccessToken(savedToken);
    }

    // 2. Real-time Firebase observer fallback
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const liveToken = await user.getIdToken();
          setAccessToken(liveToken);
        } catch (err) {
          console.error("Failed to recover live token session:", err);
        }
      } else if (!localStorage.getItem('token')) {
        setAccessToken(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUnlock = async (e) => {
    e.stopPropagation(); // Prevents layout bubbling anomalies
    if (loading || !accessToken) return;

    const confirmUnlock = window.confirm("Unlock this contact details? The matching tier transaction debit will be applied to your balance.");
    if (!confirmUnlock) return;

    // Extracting the context listing ID directly out of the nearest structural interactive card tracking payload
    const parentCard = e.currentTarget.closest('[data-full-gallery]');
    let listingId = null;
    
    if (parentCard) {
      // Safely recover the layout identification key relative to the clicked context feed container
      const key = Object.keys(parentCard.__reactFiber$ || parentCard._reactRootContainer || {}).find(k => k.startsWith('__reactFiber'));
      if (key && parentCard[key]?.key) {
        listingId = parentCard[key].key;
      }
    }

    if (!listingId) {
      alert("Error: Unable to verify property reference signature context locally.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/payments/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ listingId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlock contact payload details.');
      }

      alert("Contact unlocked successfully!");
      window.location.reload(); // Instantly displays verified structural state update
      
    } catch (error) {
      console.error("Unlock error:", error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      disabled={loading || !accessToken}
      onClick={handleUnlock}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold uppercase py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 tracking-wider border border-transparent disabled:border-slate-800"
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={14} />
          Processing...
        </>
      ) : !accessToken ? (
        <>
          <Lock size={14} />
          Sign In To Unlock
        </>
      ) : (
        <>
          <Unlock size={14} />
          Unlock Contact
        </>
      )}
    </button>
  );
};

export default PaymentButton;