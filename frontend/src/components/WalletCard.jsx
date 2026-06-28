import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ShieldAlert, X, History, Info } from 'lucide-react';

const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const WalletCard = ({ token }) => {
  const [wallet, setWallet] = useState({ walletBalance: 0, totalEarned: 0 });
  const [loading, setLoading] = useState(true);
  const [userProfileData, setUserProfileData] = useState({ isPayoutBlocked: false, isVerified: false, accountNumber: '', bankName: '' });
  const [transactions, setTransactions] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null); // State for transaction details
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

        const walletData = await walletRes.json();
        const profileData = await profileRes.json();
        const txData = txRes.ok ? await txRes.json() : [];

        // Filter: Only show withdrawals and unlock earnings (exclude 3000 listing fee)
        const filtered = txData.filter(t => t.type === 'withdrawal' || t.type === 'unlock_earning');

        setWallet({ walletBalance: Number(walletData.walletBalance) || 0, totalEarned: Number(walletData.totalEarned) || 0 });
        setUserProfileData({
          isPayoutBlocked: walletData.isPayoutBlocked === true,
          isVerified: walletData.verificationStatus === 'verified',
          accountNumber: profileData.accountNumber || '',
          bankName: profileData.bankName || ''
        });
        setTransactions(filtered);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchAllData();
  }, [token]);

  const handleWithdrawal = async () => {
    const numericAmount = parseFloat(amount);
    if (numericAmount < 2000) { alert('Minimum ₦2,000.'); return; }
    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/me/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: numericAmount, account_number: userProfileData.accountNumber, bank_name: userProfileData.bankName })
      });
      if (!res.ok) throw new Error("Withdrawal failed");
      alert('Success!');
      window.location.reload();
    } catch (err) { alert(err.message); } finally { setIsProcessing(false); }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen w-full flex flex-col items-center">
      <div className="w-full max-w-md mt-4">
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
          <div className="text-sm text-slate-400 mb-2">My Wallet Balance</div>
          <div className="text-4xl font-black mb-6">₦{wallet.walletBalance.toLocaleString()}</div>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-5">
            <div>
              <div className="text-xs text-slate-500 mb-1">Lifetime Earned</div>
              <div className="text-lg font-bold">₦{wallet.totalEarned.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Premium Split</div>
              <div className="text-lg font-bold text-amber-400">70% Payout</div>
            </div>
          </div>
          {userProfileData.isVerified ? (
            <button onClick={() => setShowModal(true)} className="w-full mt-6 py-3 bg-blue-600 rounded-xl font-bold">Withdraw Funds</button>
          ) : (
            <button disabled className="w-full mt-6 py-3 bg-slate-800 text-slate-500 rounded-xl font-bold">Verification Required</button>
          )}
        </div>
      </div>

      <div className="w-full max-w-md mt-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-2">Transaction Ledger</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
          {transactions.map(tx => (
            <button key={tx.id} onClick={() => setShowDetailModal(tx)} className="w-full flex justify-between items-center px-4 py-3 border-b last:border-0 border-slate-50 hover:bg-slate-50 text-left">
              <div>
                <p className="font-medium text-sm">{tx.type === 'withdrawal' ? 'Withdrawal' : 'Unlock Earning'}</p>
                <p className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`font-bold text-sm ${tx.type === 'withdrawal' ? "text-red-600" : "text-emerald-600"}`}>
                {tx.type === 'withdrawal' ? '-' : '+'}₦{Math.abs(tx.amount).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg">Transaction Details</h2>
              <button onClick={() => setShowDetailModal(null)}><X size={20}/></button>
            </div>
            <div className="space-y-3 text-sm">
              {Object.entries(showDetailModal).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b pb-1">
                  <span className="text-slate-500 capitalize">{k.replace('_', ' ')}</span>
                  <span className="font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-4">Withdraw</h2>
            <input type="number" className="w-full p-3 border rounded-lg mb-4" value={amount} onChange={e => setAmount(e.target.value)} />
            <button onClick={handleWithdrawal} className="w-full py-3 bg-blue-600 text-white rounded-lg">{isProcessing ? '...' : 'Confirm'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletCard;