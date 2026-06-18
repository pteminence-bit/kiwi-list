import React from 'react';

const PaymentButton = ({ onUnlock }) => {
  return (
    <button
      className="bg-blue-600 text-white px-4 py-2 rounded"
      onClick={onUnlock}
    >
      Pay Now
    </button>
  );
};

export default PaymentButton;