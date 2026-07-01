import React, { useState, useEffect } from 'react';
import { Loader2, Lock, Unlock } from 'lucide-react';
import { auth } from '../firebase';

const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const PaymentButton = () => {
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setAccessToken(savedToken);
    }

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
    e.stopPropagation(); 
    if (loading || !accessToken) return;

    const confirmUnlock = window.confirm("Unlock this contact details? The matching tier transaction debit will be applied to your balance.");
    if (!confirmUnlock) return;

    // FIX: Uses standard DOM parsing to reliably extract the attribute we assigned above
    const parentCard = e.currentTarget.closest('[data-listing-id]');
    const listingId = parentCard ? parentCard.getAttribute('data-listing-id') : null;

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
      window.location.reload(); 
      
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