import React from 'react';
import WalletCard from '../components/WalletCard';

const WalletPage = ({ token }) => {
  return (
    <div className="p-8 bg-slate-50 min-h-screen ml-64">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Financial Overview</h1>
        <p className="text-sm text-slate-500">Manage your earnings, view transaction history, and withdraw funds.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <WalletCard token={token} />
        
        {/* Placeholder for Transaction History Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Recent Transactions</h3>
          <p className="text-sm text-slate-400 italic">No recent transactions found.</p>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;

