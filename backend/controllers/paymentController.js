import axios from 'axios';
import { db } from '../config/firebase.js';
import dotenv from 'dotenv';
import { randomBytes } from 'crypto';

dotenv.config();

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

// Aligned: Custom Transaction ID Generator
const generateTxId = () => `kiwi-tx-${randomBytes(4).toString('hex')}`;

// --- INITIALIZE WALLET DEPOSIT ---
export const initializePayment = async (req, res) => {
  const amount = Number(req.body.amount); 
  const userEmail = req.user?.email;

  if (!userEmail) return res.status(400).json({ error: "Auth missing identity context." });
  if (!amount || amount <= 100) return res.status(400).json({ error: "Deposit amount must be greater than the ₦100 processing fee." });

  const tx_ref = `kiwi-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref,
        amount,
        currency: 'NGN',
        redirect_url: `${process.env.BASE_URL}/success?reference=${tx_ref}`,
        customer: { email: userEmail },
        customizations: {
          title: 'KIWI Wallet Top-up',
          description: `Fund your KIWI wallet with ₦${amount}`,
        },
      },
      {
        headers: { Authorization: `Bearer ${FLW_SECRET_KEY}`, 'Content-Type': 'application/json' },
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

// --- VERIFY & CREDIT WALLET ---
export const verifyPayment = async (req, res) => {
  const { reference } = req.query;
  const uid = req.user?.uid;
  
  if (!reference) return res.status(400).json({ error: "Missing transaction reference." });
  if (!uid) return res.status(400).json({ error: "Auth context missing." });

  try {
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
      { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
    );

    const flwData = response.data?.data;
    if (response.data.status !== 'success' || flwData?.status !== 'successful') {
      return res.status(400).json({ error: 'Transaction was not successful' });
    }

    const { tx_ref, amount } = flwData;
    let walletUpdated = false;

    await db.runTransaction(async (t) => {
      const txLogRef = db.collection('processed_payments').doc(`flw-${tx_ref}`);
      const txLog = await t.get(txLogRef);
      
      if (txLog.exists) return; 

      const userRef = db.collection('users').doc(uid);
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("Target user profile not found.");

      const currentBalance = userDoc.data().walletBalance ?? 0;
      const depositAmount = parseFloat(amount);
      const netDeposit = depositAmount - 100;

      if (netDeposit <= 0) throw new Error("Deposit amount too low.");

      t.update(userRef, { walletBalance: currentBalance + netDeposit });
      t.set(txLogRef, { processedAt: new Date().toISOString(), amount: depositAmount, netAmount: netDeposit });

      // Aligned: Using the custom transaction ID helper
      const transactionRef = db.collection('users').doc(uid).collection('transactions').doc(generateTxId());
      t.set(transactionRef, {
        userId: uid,
        amount: netDeposit,
        description: `Flutterwave Deposit (Ref: ${tx_ref}) - ₦100 fee applied`,
        type: 'deposit',
        createdAt: new Date().toISOString()
      });

      walletUpdated = true;
    });

    return res.json({ 
      status: 'verified', 
      message: walletUpdated ? "Wallet successfully funded." : "Payment already applied." 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};