import React from 'react';

const PaymentButton = ({ onUnlock }) => {
  return (
    <button
      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase py-2.5 rounded-lg transition-colors"
      onClick={(e) => {
        e.stopPropagation(); // Prevents bubbling
        onUnlock();
      }}
    >
      Unlock Contact
    </button>
  );
};

export default PaymentButton;