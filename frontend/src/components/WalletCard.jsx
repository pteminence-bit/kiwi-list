import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ShieldAlert, X } from 'lucide-react';

const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const WalletCard = ({ token }) => {
  const [wallet, setWallet] = useState({ balance: 0, totalEarned: 0 });
  const [loading, setLoading] = useState(true);
  const [userProfileData, setUserProfileData] = useState({
    isPayoutBlocked: false,
    isVerified: false,
    bankDetails: { accountNumber: '', bankCode: '', bankName: '' } // Added bankDetails state
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchWalletData = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/users/me/wallet/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to fetch wallet");

        const data = await res.json();
        
        // Fetch full profile to get bank details for withdrawal
        const profileRes = await fetch(`${BACKEND_BASE_URL}/api/users/me/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();

        setWallet({
          balance: Number(data.walletBalance) || 0,
          totalEarned: Number(data.totalEarned) || 0
        });

        setUserProfileData({
          isPayoutBlocked: data.isPayoutBlocked === true,
          isVerified: data.verificationStatus === 'verified',
          bankDetails: {
            accountNumber: profileData.accountNumber || '',
            bankCode: profileData.account_bank || '', // Ensure this matches backend field
            bankName: profileData.bankName || ''
          }
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
    const numericAmount = parseFloat(amount);
    if (numericAmount < 1000) { // Updated to match backend min 1000
      alert('Minimum withdrawal amount is ₦1,000.');
      return;
    }
    if (numericAmount > wallet.balance) {
      alert('Insufficient balance.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/me/withdraw`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          amount: numericAmount,
          account_number: userProfileData.bankDetails.accountNumber,
          account_bank: userProfileData.bankDetails.bankCode,
          bank_name: userProfileData.bankDetails.bankName
        })
      });
      
      const result = await res.json();
      if (res.ok) {
        alert('Withdrawal request processed successfully.');
        setWallet(prev => ({ ...prev, balance: prev.balance - numericAmount }));
        setShowModal(false);
        setAmount('');
      } else {
        console.error("Backend Error:", result.error);
        alert(result.error || 'Withdrawal failed.');
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      alert('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4 text-black">
              <h2 className="font-bold text-lg">Withdraw Funds</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <p className="text-black text-sm mb-4">Enter amount to withdraw (Min: ₦1,000)</p>
            <input
              type="number"
              className="w-full p-3 border border-gray-300 rounded-lg mb-6 text-black"
              placeholder="₦0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button
              onClick={handleWithdrawal}
              disabled={isProcessing}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg"
            >
              {isProcessing ? 'Processing...' : 'Confirm Withdrawal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletCard;