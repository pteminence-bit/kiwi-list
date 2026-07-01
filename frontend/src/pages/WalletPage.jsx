import React from 'react';
import WalletCard from '../components/WalletCard';

const WalletPage = ({ token }) => {
  return (
    <div className="p-4 md:p-8 bg-slate-950 min-h-screen lg:ml-64 transition-all duration-300">
      <div className="mb-6 max-w-md mx-auto text-left">
        <h1 className="text-2xl font-black tracking-tight text-white">Financial Ledger</h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor life earnings, view processing history states, and initiate direct network withdrawals.
        </p>
      </div>
      
      <div className="w-full flex flex-col items-center">
        <WalletCard token={token} />
      </div>
    </div>
  );
};

export default WalletPage;
