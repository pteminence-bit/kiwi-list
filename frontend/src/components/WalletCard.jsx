import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ShieldAlert, X } from 'lucide-react';

const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const WalletCard = ({ token }) => {
  const [wallet, setWallet] = useState({ balance: 0, totalEarned: 0 });
  const [loading, setLoading] = useState(true);
  const [userProfileData, setUserProfileData] = useState({
    isPayoutBlocked: false,
    isVerified: false,
    accountNumber: '',
    bankName: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchAllData = async () => {
      try {
        const [walletRes, profileRes] = await Promise.all([
          fetch(`${BACKEND_BASE_URL}/api/users/me/wallet/`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${BACKEND_BASE_URL}/api/users/me/`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!walletRes.ok || !profileRes.ok) throw new Error("Failed to fetch user data");

        const walletData = await walletRes.json();
        const profileData = await profileRes.json();

        setWallet({
          balance: Number(walletData.walletBalance) || 0,
          totalEarned: Number(walletData.totalEarned) || 0
        });

        setUserProfileData({
          isPayoutBlocked: walletData.isPayoutBlocked === true,
          isVerified: walletData.verificationStatus === 'verified',
          accountNumber: profileData.accountNumber || '',
          bankName: profileData.bankName || ''
        });
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [token]);

  const handleWithdrawal = async () => {
    const numericAmount = parseFloat(amount);
    
    if (numericAmount < 1000) {
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
          account_number: userProfileData.accountNumber,
          bank_name: userProfileData.bankName
        })
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Withdrawal failed");

      alert('Withdrawal request processed successfully.');
      setWallet(prev => ({ ...prev, balance: prev.balance - numericAmount }));
      setShowModal(false);
      setAmount('');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500 min-h-screen w-full flex items-center justify-center bg-slate-50">Accessing secured ledger...</div>;

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen w-full flex flex-col items-center justify-start">
      <div className="w-full max-w-md mt-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl w-full">
          <div className="text-4xl font-black tracking-tight mb-6">₦{wallet.balance.toLocaleString()}</div>
          <button 
            disabled={userProfileData.isPayoutBlocked || wallet.balance <= 0 || !userProfileData.isVerified}
            onClick={() => setShowModal(true)}
            className="w-full py-3 bg-blue-600 rounded-lg font-bold disabled:opacity-50"
          >
            {userProfileData.isPayoutBlocked ? "Withdrawals Paused" : "Withdraw Funds"}
          </button>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-4 text-black">Withdraw Funds</h2>
            <input type="number" className="w-full p-3 border rounded-lg mb-6 text-black" placeholder="₦0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button onClick={handleWithdrawal} disabled={isProcessing} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg">{isProcessing ? 'Processing...' : 'Confirm'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletCard;