import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ShieldAlert, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const WalletCard = ({ token }) => {
  const [wallet, setWallet] = useState({ balance: 0, totalEarned: 0 });
  const [loading, setLoading] = useState(true);
  const [userProfileData, setUserProfileData] = useState({ 
    isPayoutBlocked: false,
    isVerified: false
  });
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  useEffect(() => {
    if (!token) return;
    const fetchWalletData = async () => {
      try {
        const res = await fetch('https://kiwi-list-api.onrender.com/api/users/me/wallet', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to fetch wallet");
        
        const data = await res.json();
        
        setWallet({ 
            balance: Number(data.walletBalance) || 0, 
            totalEarned: Number(data.totalEarned) || 0 
        });
        
        setUserProfileData({
          isPayoutBlocked: data.isPayoutBlocked === true,
          isVerified: data.verificationStatus === 'verified'
        });
      } catch (err) {
        console.error("Wallet fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWalletData();
  }, [token]);

  const handleWithdrawal = async () => {
    const amount = Number(withdrawAmount);
    if (amount < 1000) {
      setFeedback({ type: 'error', msg: 'Minimum withdrawal is ₦1,000' });
      return;
    }
    if (amount > wallet.balance) {
      setFeedback({ type: 'error', msg: 'Insufficient balance' });
      return;
    }

    try {
      const res = await fetch('https://kiwi-list-api.onrender.com/api/users/me/withdraw', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ amount })
      });

      const data = await res.json();

      if (res.ok) {
        setFeedback({ type: 'success', msg: 'Withdrawal request processed successfully.' });
        setWallet(prev => ({ ...prev, balance: prev.balance - amount }));
        setTimeout(() => { setShowModal(false); setFeedback({ type: '', msg: '' }); }, 2000);
      } else {
        setFeedback({ type: 'error', msg: data.error || 'Withdrawal failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Network error. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500 min-h-screen w-full flex items-center justify-center bg-slate-50">
        <span className="font-medium animate-pulse">Accessing secured ledger...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen w-full flex flex-col items-center justify-start">
      {/* Withdrawal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-slate-900">Withdraw Funds</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400"/></button>
            </div>
            <input 
              type="number" 
              placeholder="Enter amount (Min ₦1,000)"
              className="w-full p-3 border border-slate-200 rounded-lg mb-4 outline-none focus:border-blue-500"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            {feedback.msg && (
              <div className={`text-xs mb-4 p-2 rounded flex items-center gap-2 ${feedback.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {feedback.type === 'error' ? <ShieldAlert size={14}/> : <CheckCircle2 size={14}/>} {feedback.msg}
              </div>
            )}
            <button 
              onClick={handleWithdrawal}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              Confirm Withdrawal
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md mt-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl">
                <Wallet size={24} />
              </div>
              <span className="text-sm text-slate-400 font-medium">My Wallet Balance</span>
            </div>
          </div>
          
          <div className="text-4xl font-black tracking-tight mb-6 text-white">
            ₦{wallet.balance.toLocaleString()}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-5 mb-6">
            <div>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <ArrowUpRight size={14} className="text-emerald-500" /> Lifetime Earned
              </div>
              <div className="text-lg font-bold text-slate-200">₦{wallet.totalEarned.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1 text-amber-500">
                 Premium Split
              </div>
              <div className="text-lg font-bold text-amber-400">70% Payout</div>
            </div>
          </div>

          {!userProfileData.isVerified && (
            <div className="flex items-start gap-2.5 mb-5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400 leading-normal">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>Payouts locked. Complete your KYC Verification in Settings to withdraw.</span>
            </div>
          )}

          {!userProfileData.isVerified ? (
            <button 
              className="w-full py-3.5 bg-slate-800 text-slate-500 font-semibold rounded-xl cursor-not-allowed text-sm"
              disabled
            >
              Verification Required
            </button>
          ) : (
            <button 
              disabled={userProfileData.isPayoutBlocked || wallet.balance <= 0}
              onClick={() => setShowModal(true)}
              className={`w-full py-3 px-6 rounded-lg text-white font-bold tracking-wide transition ${
                userProfileData.isPayoutBlocked 
                  ? 'bg-slate-700 cursor-not-allowed opacity-60' 
                  : wallet.balance <= 0
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {userProfileData.isPayoutBlocked ? "Withdrawals Paused by Admin" : "Withdraw Funds"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletCard;