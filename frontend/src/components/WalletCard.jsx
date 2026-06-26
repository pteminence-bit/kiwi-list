import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ShieldAlert } from 'lucide-react';

const WalletCard = ({ token }) => {
  const [wallet, setWallet] = useState({ balance: 0, totalEarned: 0 });
  const [loading, setLoading] = useState(true);
  const [userProfileData, setUserProfileData] = useState({ 
    isPayoutBlocked: false,
    isVerified: false
  });

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
    // Re-check verification and constraints
    if (!userProfileData.isVerified || userProfileData.isPayoutBlocked || wallet.balance <= 0) return;

    try {
      const res = await fetch('https://kiwi-list-api.onrender.com/api/users/me/withdraw', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ amount: wallet.balance })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Withdrawal request processed successfully.');
        // Refresh wallet state after withdrawal
        setWallet(prev => ({ ...prev, balance: 0 }));
      } else {
        alert(data.error || 'Withdrawal failed. Please contact support.');
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      alert('Network error. Please try again.');
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
              onClick={handleWithdrawal}
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