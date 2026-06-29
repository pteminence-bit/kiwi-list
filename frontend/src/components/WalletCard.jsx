import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ShieldAlert, X, History } from 'lucide-react';

const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const WalletCard = ({ token }) => {
  const [wallet, setWallet] = useState({ walletBalance: 0, totalEarned: 0 });
  const [loading, setLoading] = useState(true);
  const [userProfileData, setUserProfileData] = useState({
    isPayoutBlocked: false,
    isVerified: false,
    accountNumber: '',
    bankName: ''
  });
  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchAllData = async () => {
      try {
        // FIX: Removed training slashes from the end of endpoints to match Express routes cleanly
        const [walletRes, profileRes, txRes] = await Promise.all([
          fetch(`${BACKEND_BASE_URL}/api/users/me/wallet`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${BACKEND_BASE_URL}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${BACKEND_BASE_URL}/api/users/me/transactions`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!walletRes.ok || !profileRes.ok) throw new Error("Failed to fetch user data from engine");

        const walletData = await walletRes.json();
        const profileData = await profileRes.json();
        const txData = txRes.ok ? await txRes.json() : [];

        // Filter: Only show withdrawals and unlock earnings (exclude premium listing)
        const filteredTx = txData.filter(tx => 
          tx.type === 'withdrawal' || tx.type === 'unlock_earning'
        );

        setWallet({
          walletBalance: Number(walletData.walletBalance) || 0,
          totalEarned: Number(walletData.totalEarned) || 0
        });

        setUserProfileData({
          isPayoutBlocked: walletData.isPayoutBlocked === true || profileData.isPayoutBlocked === true,
          // Sync verificationStatus accurately against backend fields
          isVerified: walletData.verificationStatus === 'verified' || profileData.verificationStatus === 'verified',
          accountNumber: profileData.accountNumber || walletData.accountNumber || '',
          bankName: profileData.bankName || walletData.bankName || ''
        });
        setTransactions(filteredTx);
      } catch (err) {
        console.error("Fetch operational ledger error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [token]);

  const handleWithdrawal = async () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) { alert('Please enter a valid amount.'); return; }
    if (numericAmount < 2000) { alert('Minimum withdrawal amount is ₦2,000.'); return; }
    if (numericAmount > wallet.walletBalance) { alert('Insufficient balance.'); return; }
    if (!userProfileData.accountNumber || !userProfileData.bankName) {
      alert('Please set up your Payout Bank Setup in settings before attempting withdrawals.');
      return;
    }

    setIsProcessing(true);
    try {
      // FIX: Matches exact route: /api/users/me/withdraw
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
      if (!res.ok) throw new Error(result.error || "Withdrawal request failed");

      alert('Withdrawal request processed successfully.');
      setShowModal(false);
      setAmount('');
      
      // Live reload/refresh data states
      setWallet(prev => ({ ...prev, walletBalance: prev.walletBalance - numericAmount }));
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Network communication error.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-400 min-h-screen w-full flex items-center justify-center bg-slate-950">Accessing secured ledger...</div>;

  return (
    <div className="p-4 md:p-8 bg-slate-950 min-h-screen w-full flex flex-col items-center justify-start">
      <div className="w-full max-w-md mt-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl"><Wallet size={24} /></div>
              <span className="text-sm text-slate-400 font-medium">My Wallet Balance</span>
            </div>
          </div>
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
              className={`w-full py-3.5 px-6 rounded-xl text-white font-bold tracking-wide transition ${userProfileData.isPayoutBlocked || wallet.walletBalance <= 0 ? 'bg-slate-800 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {userProfileData.isPayoutBlocked ? "Withdrawals Paused" : "Withdraw Funds"}
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-md mt-8">
        <h3 className="flex items-center gap-2 text-slate-400 font-bold mb-4 uppercase tracking-wider text-xs border-b pb-2 border-slate-800">
          <History size={16} /> Transaction Ledger
        </h3>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-sm overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500">No applicable ledger streams found.</div>
          ) : (
            transactions.map(tx => (
              <button key={tx.id} onClick={() => setSelectedTx(tx)} className="w-full flex justify-between items-center px-4 py-3 border-b last:border-0 border-slate-800/50 hover:bg-slate-800/30 transition text-left">
                <div>
                  <p className="text-slate-200 font-medium text-sm">{tx.description || tx.type}</p>
                  <p className="text-slate-500 text-[10px] mt-0.5 uppercase">{new Date(tx.timestamp || tx.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`font-mono font-bold text-sm ${tx.type === 'withdrawal' ? "text-rose-500" : "text-emerald-400"}`}>
                  {tx.type === 'withdrawal' ? '-' : '+'}₦{Math.abs(tx.amount).toLocaleString()}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
              <h3 className="font-bold text-lg">Transaction Details</h3>
              <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-white transition"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-sm font-medium text-slate-300">
              {selectedTx.type === 'withdrawal' ? (
                <>
                  <p><b className="text-slate-500">Description:</b> {selectedTx.description}</p>
                  <p><b className="text-slate-500">Account:</b> {selectedTx.account_number || 'N/A'}</p>
                  <p><b className="text-slate-500">Amount:</b> ₦{Math.abs(selectedTx.amount).toLocaleString()}</p>
                  <p><b className="text-slate-500">Bank:</b> {selectedTx.bank_name || 'N/A'}</p>
                  <p><b className="text-slate-500">Date:</b> {new Date(selectedTx.timestamp || selectedTx.createdAt).toLocaleString()}</p>
                  <p><b className="text-slate-500">Status:</b> <span className="text-amber-400 capitalize">{selectedTx.status || 'Pending'}</span></p>
                </>
              ) : (
                <>
                  <p><b className="text-slate-500">Amount:</b> ₦{selectedTx.amount.toLocaleString()}</p>
                  <p><b className="text-slate-500">Date:</b> {new Date(selectedTx.timestamp || selectedTx.createdAt).toLocaleString()}</p>
                  <p><b className="text-slate-500">FLW ID:</b> {selectedTx.flw_id || 'N/A'}</p>
                  <p><b className="text-slate-500">Listing ID:</b> {selectedTx.listingId || 'N/A'}</p>
                  <p><b className="text-slate-500">Status:</b> <span className="text-emerald-400 capitalize">{selectedTx.status || 'Success'}</span></p>
                  <p><b className="text-slate-500">TX Ref:</b> {selectedTx.tx_ref || 'N/A'}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-white">Withdraw Funds</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition"><X size={20} /></button>
            </div>
            <div className="mb-4 text-xs text-slate-400 bg-slate-950 p-3 border border-slate-800 rounded-lg">
              Payout will transfer straight to <span className="text-white font-bold">{userProfileData.bankName}</span> account ending in <span className="text-white font-bold">{userProfileData.accountNumber.slice(-4)}</span>.
            </div>
            <input type="number" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg mb-6 text-white outline-none focus:border-blue-500 font-mono" placeholder="₦0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button onClick={handleWithdrawal} disabled={isProcessing} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg transition">
              {isProcessing ? 'Processing Transaction...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletCard;