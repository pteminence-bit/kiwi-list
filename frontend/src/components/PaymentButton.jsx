import React from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

const PaymentButton = ({ amount, email, name, onSuccess }) => {
  const config = {
    public_key: 'YOUR_PUBLIC_KEY_HERE', // Replace with your Public Key
    tx_ref: Date.now().toString(),
    amount: amount,
    currency: 'NGN', // Change if necessary
    payment_options: 'card,banktransfer,ussd',
    customer: {
      email: email,
      name: name,
    },
    customizations: {
      title: 'Unlock Listing',
      description: 'Payment for premium listing access',
      logo: 'https://your-logo-url.png',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  return (
    <button
      className="bg-blue-600 text-white px-4 py-2 rounded"
      onClick={() => {
        handleFlutterPayment({
          callback: (response) => {
            console.log(response);
            onSuccess(response); // Handle logic after success
            closePaymentModal(); // Close the modal
          },
          onClose: () => {
            console.log("Payment modal closed");
          },
        });
      }}
    >
      Pay Now
    </button>
  );
};

export default PaymentButton;
