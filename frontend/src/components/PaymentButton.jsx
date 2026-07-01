import React, { useState, useEffect } from 'react';
import { Loader2, Lock, Unlock } from 'lucide-react';
import { auth } from '../firebase';

const PaymentButton = ({ onClick }) => {
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

  const handleActionIntercept = async (e) => {
    e.stopPropagation();
    if (loading || !accessToken) return;

    setLoading(true);
    try {
      if (onClick) {
        await onClick();
      }
    } catch (error) {
      console.error("Payment pipeline interception failure:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      disabled={loading || !accessToken}
      onClick={handleActionIntercept}
      className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-2 tracking-wider"
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin text-slate-950" size={14} />
          Securing Handshake...
        </>
      ) : !accessToken ? (
        <>
          <Lock size={14} className="text-slate-500" />
          Sign In To Unlock
        </>
      ) : (
        <>
          <Unlock size={14} className="text-slate-950" />
          Unlock Contact & Chat (₦500)
        </>
      )}
    </button>
  );
};

export default PaymentButton;