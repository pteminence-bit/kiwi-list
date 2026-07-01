import axios from 'axios';
import { db } from '../config/firebase.js';
import dotenv from 'dotenv';

dotenv.config();

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

// Helper to match custom user document format
const getKiwiUserId = (email) => {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const sanitizedEmail = cleanEmail.replace(/[@.]/g, '-');
  return `kiwi-user-${sanitizedEmail}`;
};

// --- INITIALIZE WALLET DEPOSIT ---
export const initializePayment = async (req, res) => {
  const amount = Number(req.body.amount); 
  const userEmail = req.user?.email;

  if (!userEmail) return res.status(400).json({ error: "Auth missing identity context." });
  if (!amount || amount <= 100) return res.status(400).json({ error: "Deposit amount must be greater than the ₦100 processing fee." });

  const tx_ref = `kiwi-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    // Request checkout link from Flutterwave for a wallet deposit
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref,
        amount,
        currency: 'NGN',
        redirect_url: `${process.env.BASE_URL}/success?reference=${tx_ref}`, // Ensure your frontend handles this route
        customer: {
          email: userEmail,
        },
        customizations: {
          title: 'KIWI Wallet Top-up',
          description: `Fund your KIWI wallet with ₦${amount}`,
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
      return res.json({ checkoutUrl: response.data.data.link });
    } else {
      return res.status(400).json({ error: 'Flutterwave initialization failed' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.response?.data?.message || error.message });
  }
};

// --- VERIFY & CREDIT WALLET (FALLBACK / MANUAL RETRIEVAL) ---
export const verifyPayment = async (req, res) => {
  const { reference } = req.query; // This is the tx_ref or transaction_id returned by FLW redirect
  if (!reference) return res.status(400).json({ error: "Missing transaction reference." });

  try {
    // 1. Verify payment status directly with Flutterwave
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
      { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
    );

    const flwData = response.data?.data;
    if (response.data.status !== 'success' || flwData?.status !== 'successful') {
      return res.status(400).json({ error: 'Transaction was not successful' });
    }

    const { tx_ref, amount, customer } = flwData;
    const kiwiUserId = getKiwiUserId(customer?.email);

    if (!kiwiUserId) return res.status(400).json({ error: "Customer payload email missing." });

    // 2. Safe ledger matching logic to prevent double spending
    let walletUpdated = false;

    await db.runTransaction(async (t) => {
      const txLogRef = db.collection('processed_payments').doc(`flw-${tx_ref}`);
      const txLog = await t.get(txLogRef);
      
      // If already processed by webhook or previous verify hit, exit early
      if (txLog.exists) return; 

      const userRef = db.collection('users').doc(kiwiUserId);
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("Target user profile not found.");

      const currentBalance = userDoc.data().walletBalance ?? 0;
      const depositAmount = parseFloat(amount);
      const netDeposit = depositAmount - 100; // Deduct the flat ₦100 deposit processing fee

      if (netDeposit <= 0) throw new Error("Deposit amount too low to cover transaction fees.");

      // Atomic balance update
      t.update(userRef, { walletBalance: currentBalance + netDeposit });
      t.set(txLogRef, { processedAt: new Date().toISOString(), amount: depositAmount, netAmount: netDeposit });

      const transactionRef = db.collection('users').doc(kiwiUserId).collection('transactions').doc();
      t.set(transactionRef, {
        userId: kiwiUserId,
        amount: netDeposit,
        description: `Flutterwave Deposit (Ref: ${tx_ref}) - ₦100 fee applied`,
        type: 'deposit',
        createdAt: new Date().toISOString()
      });

      walletUpdated = true;
    });

    if (walletUpdated) {
      return res.json({ status: 'verified', message: "Wallet successfully funded." });
    } else {
      return res.json({ status: 'verified', message: "Payment was already applied to wallet balance." });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};