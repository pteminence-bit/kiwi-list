import React, { useState, useEffect } from 'react';
import { Loader2, Lock, Unlock } from 'lucide-react';
import { auth } from '../firebase';

/**
 * PaymentButton
 * Handles secure engagement for premium property assets.
 * Triggering this initiates the ₦500 'unlock_contact' payment flow.
 */
const PaymentButton = ({ onClick }) => {
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Monitor auth state to determine if user can initiate payment
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsReady(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleActionIntercept = async (e) => {
    e.stopPropagation();
    if (loading || !isReady) return;

    setLoading(true);
    try {
      if (onClick) {
        await onClick();
      }
    } catch (error) {
      console.error("Payment pipeline interception failure:", error);
    } finally {
      // Keep loading true if redirecting to payment gateway
    }
  };

  return (
    <button
      disabled={loading || !isReady}
      onClick={handleActionIntercept}
      className={`w-full font-black text-xs uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-2 tracking-wider ${
        !isReady 
          ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
          : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={14} />
          Securing Handshake...
        </>
      ) : !isReady ? (
        <>
          <Lock size={14} />
          Sign In To Unlock
        </>
      ) : (
        <>
          <Unlock size={14} />
          Unlock Contact & Chat (₦500)
        </>
      )}
    </button>
  );
};

export default PaymentButton;