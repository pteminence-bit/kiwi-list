import axios from 'axios';
import { db } from '../config/firebase.js';
import dotenv from 'dotenv';

dotenv.config();

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

export const initializePayment = async (req, res) => {
  const { amount, purpose, listingId } = req.body; 
  const userEmail = req.user.email;
  const userId = req.user.uid;
  const tx_ref = `kiwi-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    // 1. Create a pending transaction record in Firestore
    await db.collection('transactions').doc(tx_ref).set({
      tx_ref,
      userId,
      listingId: listingId || null,
      amount,
      purpose,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // 2. Request checkout link from Flutterwave
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref,
        amount,
        currency: 'NGN',
        redirect_url: `${process.env.BASE_URL}/success?reference=${tx_ref}`,
        customer: {
          email: userEmail,
        },
        customizations: {
          title: 'KIWI-list Marketplace',
          description: purpose === 'premium_listing' ? 'Payment for Premium Listing Placement' : 'Unlock Contact Information',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status === 'success') {
      res.json({ checkoutUrl: response.data.data.link });
    } else {
      res.status(400).json({ error: 'Flutterwave initialization failed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
};

// --- NEW VERIFICATION FUNCTION ---
export const verifyPayment = async (req, res) => {
  const { reference } = req.query;

  try {
    // 1. Verify with Flutterwave
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${reference}/verify`,
      { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
    );

    if (response.data.status === 'success' && response.data.data.status === 'successful') {
      // 2. Update Firestore transaction status
      await db.collection('transactions').doc(reference).update({
        status: 'completed',
        updatedAt: new Date().toISOString()
      });

      // 3. Logic to 'unlock' listing or mark as premium here
      res.json({ status: 'verified' });
    } else {
      res.status(400).json({ error: 'Transaction not successful' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};