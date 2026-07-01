import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../firebase'; 
import { onAuthStateChanged } from 'firebase/auth'; 
import { API_BASE_URL } from '../config'; 

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const reference = searchParams.get('reference');
  
  // Execution loop firewall guard flag
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!reference) {
      navigate('/');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Return early if state is loading, or if execution guard is already locked
      if (!user || hasChecked.current) return;

      try {
        hasChecked.current = true;
        
        // Securely unhook listener immediately to prevent subsequent session loop ticks
        unsubscribe();

        const token = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}/api/payments/verify?reference=${reference}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          setVerifying(false);
        } else {
          console.error("Payment verification failed:", data.error);
          alert(data.error || "Verification failed. Please contact support.");
          navigate('/');
        }
      } catch (err) {
        console.error("Network error during verification:", err);
        alert("A network connection error occurred during verification.");
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [reference, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        {verifying ? (
          <div className="space-y-4">
            <Loader2 size={48} className="text-blue-500 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-white">Verifying Payment...</h2>
            <p className="text-sm text-slate-400">Please wait while we confirm your transaction securely.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 flex items-center justify-center rounded-full">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Payment Successful!</h2>
              <p className="text-sm text-slate-400 mt-2">Your listing unlock status is now live and updated across our data systems.</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
            >
              Go to Marketplace <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;