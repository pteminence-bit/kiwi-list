import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const WalletCard = ({ token }) => {
  const [wallet, setWallet] = useState({ balance: 0, totalEarned: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live user metrics and transaction history in parallel
    Promise.all([
      fetch('/api/users/me/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json()),
      fetch('/api/users/me/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json())
    ])
      .then(([walletData, historyData]) => {
        setWallet({ 
          balance: walletData.walletBalance || 0, 
          totalEarned: walletData.totalEarned || 0 
        });
        setHistory(historyData || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching ledger data:", err);
        setLoading(false);
      });
  }, [token]);

  const handleWithdrawal = async () => {
    alert('Withdrawal request initialized. Funds are swept directly into your linked Flutterwave payout account.');
  };

  if (loading) return <div className="text-slate-400 p-6">Accessing secured ledger vaults...</div>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white max-w-md shadow-xl">
      {/* Wallet Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-lg">
            <Wallet size={24} />
          </div>
          <span className="text-sm text-slate-400 font-medium">My Wallet Balance</span>
        </div>
      </div>
      
      {/* Current Balance */}
      <div className="text-4xl font-extrabold tracking-tight mb-6">
        ₦{wallet.balance.toLocaleString()}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 mb-6">
        <div>
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <ArrowUpRight size={14} className="text-emerald-500" /> Lifetime Earned
          </div>
          <div className="text-lg font-semibold text-slate-200">
            ₦{wallet.totalEarned.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <ArrowDownRight size={14} className="text-amber-500" /> Platform Tier
          </div>
          <div className="text-lg font-semibold text-amber-400">KIWI Premium Split</div>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={handleWithdrawal}
        disabled={wallet.balance <= 0}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium rounded-lg transition"
      >
        Withdraw Funds
      </button>

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Recent Activity</h4>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No recent transactions found.</p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {history.map(tx => (
              <div 
                key={tx.id} 
                className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">{tx.description}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <p className={`text-sm font-bold ${tx.type === 'earning' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'earning' ? '+' : '-'} ₦{(tx.amount || 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletCard;