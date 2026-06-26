// frontend/src/pages/SuccessPage.jsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const SuccessPage = ({ token }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get('reference');

  useEffect(() => {
    const verify = async () => {
      if (!reference) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/payments/verify?reference=${reference}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          alert("Payment verified successfully!");
          navigate('/dashboard'); // Redirect user to their dashboard or feed
        } else {
          alert("Verification failed.");
        }
      } catch (err) {
        console.error("Verification error:", err);
      }
    };
    verify();
  }, [reference, token, navigate]);

  return <div>Verifying your payment...</div>;
};

export default SuccessPage;
