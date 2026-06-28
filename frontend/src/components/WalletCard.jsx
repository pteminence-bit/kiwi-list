import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ShieldAlert, X, History } from 'lucide-react';

const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const WalletCard = ({ token }) => {
  // FIXED: Consistent use of walletBalance
  const [wallet, setWallet] = useState({ walletBalance: 0, totalEarned: 0 });
  const [loading, setLoading] = useState(true);
  const [userProfileData, setUserProfileData] = useState({
    isPayoutBlocked: false,
    isVerified: false,
    accountNumber: '',
    bankName: ''
  });
  const [transactions, setTransactions] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchAllData = async () => {
      try {
        const [walletRes, profileRes, txRes] = await Promise.all([
          fetch(`${BACKEND_BASE_URL}/api/users/me/wallet/`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${BACKEND_BASE_URL}/api/users/me/`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${BACKEND_BASE_URL}/api/users/me/transactions/`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!walletRes.ok || !profileRes.ok) throw new Error("Failed to fetch user data");

        const walletData = await walletRes.json();
        const profileData = await profileRes.json();
        const txData = txRes.ok ? await txRes.json() : [];

        setWallet({
          walletBalance: Number(walletData.walletBalance) || 0,
          totalEarned: Number(walletData.totalEarned) || 0
        });

        setUserProfileData({
          isPayoutBlocked: walletData.isPayoutBlocked === true,
          isVerified: walletData.verificationStatus === 'verified',
          accountNumber: profileData.accountNumber || '',
          bankName: profileData.bankName || ''
        });
        setTransactions(txData);
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
    if (numericAmount < 2000) { alert('Minimum withdrawal amount is ₦2,000.'); return; }
    if (numericAmount > wallet.walletBalance) { alert('Insufficient balance.'); return; }

    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/me/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: numericAmount, account_number: userProfileData.accountNumber, bank_name: userProfileData.bankName })
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Withdrawal failed");

      alert('Withdrawal request processed successfully.');
      
      // Refresh wallet balance from server
      const walletRes = await fetch(`${BACKEND_BASE_URL}/api/users/me/wallet/`, { headers: { 'Authorization': `Bearer ${token}` } });
      const freshWalletData = await walletRes.json();
      setWallet({
        walletBalance: Number(freshWalletData.walletBalance) || 0,
        totalEarned: Number(freshWalletData.totalEarned) || 0
      });

      setShowModal(false);
      setAmount('');
    } catch (err) {
      alert(err.message || 'Network error.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500 min-h-screen w-full flex items-center justify-center bg-slate-50">Accessing secured ledger...</div>;

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen w-full flex flex-col items-center justify-start">
      <div className="w-full max-w-md mt-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl"><Wallet size={24} /></div>
              <span className="text-sm text-slate-400 font-medium">My Wallet Balance</span>
            </div>
          </div>
          {/* FIXED: Rendering using walletBalance */}
          <div className="text-4xl font-black tracking-tight mb-6 text-white">₦{wallet.walletBalance.toLocaleString()}</div>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-5 mb-6">
            <div>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><ArrowUpRight size={14} className="text-emerald-500" /> Lifetime Earned</div>
              <div className="text-lg font-bold text-slate-200">₦{wallet.totalEarned.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1 text-amber-500">Premium Split</div>
              <div className="text-lg font-bold text-amber-400">70% Payout</div>
            </div>
          </div>

          {!userProfileData.isVerified ? (
            <button className="w-full py-3.5 bg-slate-800 text-slate-500 font-semibold rounded-xl cursor-not-allowed text-sm" disabled>Verification Required</button>
          ) : (
            <button
              disabled={userProfileData.isPayoutBlocked || wallet.walletBalance <= 0}
              onClick={() => setShowModal(true)}
              className={`w-full py-3 px-6 rounded-lg text-white font-bold tracking-wide transition ${userProfileData.isPayoutBlocked || wallet.walletBalance <= 0 ? 'bg-slate-800 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {userProfileData.isPayoutBlocked ? "Withdrawals Paused" : "Withdraw Funds"}
            </button>
          )}
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="w-full max-w-md mt-6">
        <h3 className="flex items-center gap-2 text-slate-700 font-bold mb-3"><History size={18} /> Recent Ledger</h3>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          {transactions.slice(0, 5).map(tx => (
            <div key={tx.id} className="flex justify-between py-2 border-b last:border-0 border-slate-100 text-sm">
              <span className="text-slate-600">{tx.description}</span>
              <span className={tx.amount < 0 ? "text-red-500" : "text-emerald-600"}>₦{Math.abs(tx.amount).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-bold text-lg mb-4 text-black">Withdraw Funds</h2>
            <input type="number" className="w-full p-3 border border-gray-300 rounded-lg mb-6 text-black" placeholder="₦0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button onClick={handleWithdrawal} disabled={isProcessing} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg">{isProcessing ? 'Processing...' : 'Confirm'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletCard;