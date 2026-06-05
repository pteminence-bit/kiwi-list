import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const WalletCard = ({ token }) => {
  // --- ALL HOOKS MUST BE INSIDE HERE ---
  const [wallet, setWallet] = useState({ balance: 0, totalEarned: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchWalletData = async () => {
      try {
        const res = await fetch('/api/users/me/wallet', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setWallet({ 
          balance: data.walletBalance || 0, 
          totalEarned: data.totalEarned || 0 
        });
      } catch (err) {
        console.error("Wallet fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [token]);

  const handleWithdrawal = () => {
    alert('Withdrawal request initialized.');
  };

  if (loading) return <div className="text-slate-400 p-6">Accessing secured ledger...</div>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white max-w-md shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-lg">
            <Wallet size={24} />
          </div>
          <span className="text-sm text-slate-400 font-medium">My Wallet Balance</span>
        </div>
      </div>
      
      <div className="text-4xl font-extrabold tracking-tight mb-6">
        ₦{wallet.balance.toLocaleString()}
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 mb-6">
        <div>
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <ArrowUpRight size={14} className="text-emerald-500" /> Lifetime Earned
          </div>
          <div className="text-lg font-semibold text-slate-200">₦{wallet.totalEarned.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1 text-amber-500">
             Premium Split
          </div>
          <div className="text-lg font-semibold text-amber-400">70% Payout</div>
        </div>
      </div>

      <button 
        onClick={handleWithdrawal}
        disabled={wallet.balance <= 0}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium rounded-lg transition"
      >
        Withdraw Funds
      </button>
    </div>
  );
};

export default WalletCard;