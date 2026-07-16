import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, X, History, Plus } from 'lucide-react';

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
  const [showFundModal, setShowFundModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchAllData = async () => {
      try {
        const [walletRes, profileRes, txRes] = await Promise.all([
          fetch(`${BACKEND_BASE_URL}/api/listings/me/wallet`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${BACKEND_BASE_URL}/api/listings/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${BACKEND_BASE_URL}/api/listings/me/transactions`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!walletRes.ok || !profileRes.ok) throw new Error("Failed to fetch user ledger from engine");

        const walletData = await walletRes.json();
        const profileData = await profileRes.json();
        const txData = txRes.ok ? await txRes.json() : [];

        setWallet({
          walletBalance: Number(walletData.walletBalance) || 0,
          totalEarned: Number(walletData.totalEarned) || 0
        });

        setUserProfileData({
          isPayoutBlocked: walletData.isPayoutBlocked === true || profileData.isPayoutBlocked === true,
          isVerified: walletData.verificationStatus === 'verified' || profileData.verificationStatus === 'verified',
          accountNumber: profileData.accountNumber || walletData.accountNumber || '',
          bankName: profileData.bankName || walletData.bankName || ''
        });
        setTransactions(txData);
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
    const totalDeduction = numericAmount + 150; 

    if (!numericAmount || numericAmount <= 0) { alert('Please enter a valid amount.'); return; }
    if (numericAmount < 2000) { alert('Minimum withdrawal amount is ₦2,000.'); return; }
    if (totalDeduction > wallet.walletBalance) { alert(`Insufficient balance to cover withdrawal amount + ₦150 processing fee.`); return; }
    if (!userProfileData.accountNumber || !userProfileData.bankName) {
      alert('Please set up your Payout Bank details in settings before attempting a withdrawal.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/listings/me/withdraw`, {
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

      alert('Withdrawal request submitted successfully.');
      setShowModal(false);
      setAmount('');
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Network communication error.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFunding = async () => {
    const numericAmount = parseFloat(fundAmount);
    if (!numericAmount || numericAmount < 1000) { alert('Minimum funding amount is ₦1,000.'); return; }

    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/listings/me/fund`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ amount: numericAmount })
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Funding request failed");

      if (result.checkout_url) window.location.href = result.checkout_url;
      else window.location.reload();
    } catch (err) {
      alert(err.message || 'Network communication error.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-400 min-h-screen w-full flex items-center justify-center bg-slate-950">Accessing secured ledger...</div>;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-md">
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

          <div className="flex gap-3">
            {!userProfileData.isVerified ? (
              <button className="w-full py-3.5 bg-slate-800 text-slate-500 font-semibold rounded-xl cursor-not-allowed text-sm" disabled>Verification Required</button>
            ) : (
              <>
                <button
                  disabled={userProfileData.isPayoutBlocked || wallet.walletBalance <= 2150}
                  onClick={() => setShowModal(true)}
                  className={`flex-1 py-3.5 px-6 rounded-xl text-white font-bold tracking-wide transition ${userProfileData.isPayoutBlocked || wallet.walletBalance <= 2150 ? 'bg-slate-800 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  Withdraw
                </button>
                <button
                  onClick={() => setShowFundModal(true)}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wide transition flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Fund
                </button>
              </>
            )}
          </div>
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
                  <p className="text-slate-500 text-[10px] mt-0.5 uppercase">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`font-mono font-bold text-sm ${tx.amount < 0 ? "text-rose-500" : "text-emerald-400"}`}>
                  {tx.amount < 0 ? '-' : '+'}₦{Math.abs(tx.amount).toLocaleString()}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
              <h3 className="font-bold text-lg">Transaction Details</h3>
              <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-white transition"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-sm font-medium text-slate-300">
              <p><b className="text-slate-500">Description:</b> {selectedTx.description || selectedTx.type}</p>
              <p><b className="text-slate-500">Amount:</b> ₦{Math.abs(selectedTx.amount).toLocaleString()}</p>
              <p><b className="text-slate-500">Type:</b> <span className="capitalize font-semibold">{selectedTx.type}</span></p>
              <p><b className="text-slate-500">Date:</b> {new Date(selectedTx.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-white">Withdraw Funds</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition"><X size={20} /></button>
            </div>
            <div className="mb-4 text-xs text-slate-400 bg-slate-950 p-3 border border-slate-800 rounded-lg">
              Payout will transfer straight to <span className="text-white font-bold">{userProfileData.bankName}</span> account ending in <span className="text-white font-bold">{userProfileData.accountNumber.slice(-4)}</span>. Note: a <span className="text-rose-400 font-bold">₦150 flat fee</span> applies.
            </div>
            <input type="number" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg mb-6 text-white outline-none focus:border-blue-500 font-mono" placeholder="₦2,000.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button onClick={handleWithdrawal} disabled={isProcessing} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg transition">
              {isProcessing ? 'Processing Transaction...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      {showFundModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-white">Fund Wallet</h2>
              <button onClick={() => setShowFundModal(false)} className="text-slate-400 hover:text-white transition"><X size={20} /></button>
            </div>
            <div className="mb-4 text-xs text-slate-400 bg-slate-950 p-3 border border-slate-800 rounded-lg">
              Add balance to your wallet for platform transactions. A <span className="text-emerald-400 font-bold">₦100 flat fee</span> applies to all deposits.
            </div>
            <input type="number" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg mb-6 text-white outline-none focus:border-blue-500 font-mono" placeholder="₦1,000.00" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
            <button onClick={handleFunding} disabled={isProcessing} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition">
              {isProcessing ? 'Redirecting to Payment...' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletCard;