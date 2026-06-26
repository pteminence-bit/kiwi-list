import axios from 'axios';
import { db } from '../config/firebase.js'; 
import admin from 'firebase-admin';

// 1. Helper: Resolve Account
const resolveBankAccount = async (account_number, account_bank) => {
  const response = await axios.post('https://api.flutterwave.com/v3/accounts/resolve', {
    account_number, account_bank
  }, { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } });
  return response.data.data;
};

// 2. Main Controller: Withdraw Funds
export const withdrawFunds = async (req, res) => {
  const { amount, bankCode, accountNumber } = req.body;
  const userId = req.user.uid;

  try {
    // Step A: Verify account name matches user (Security Layer)
    const accountDetails = await resolveBankAccount(accountNumber, bankCode);
    // Add logic here to compare accountDetails.account_name with req.user.kycName

    // Step B: Atomic Transaction + Audit Logging
    const txRef = `payout-${Date.now()}`;
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);
      const currentBalance = userDoc.data().walletBalance;

      if (currentBalance < amount) throw new Error("Insufficient funds");
      
      // Update User Balance
      transaction.update(userRef, { walletBalance: admin.firestore.FieldValue.increment(-amount) });
      
      // Create Pending Payout Record
      transaction.set(db.collection('payouts').doc(txRef), { 
        userId, amount, status: 'pending', createdAt: new Date() 
      });

      // Atomic Audit Log
      transaction.set(db.collection('audit_logs').doc(), {
        userId,
        txRef,
        action: 'WITHDRAWAL_INITIATED',
        previousBalance: currentBalance,
        newBalance: currentBalance - amount,
        changeAmount: -amount,
        createdAt: new Date()
      });
    });

    // Step C: Trigger API
    await axios.post('https://api.flutterwave.com/v3/transfers', { 
      amount,
      reference: txRef,
      currency: "NGN",
      bank_code: bankCode,
      account_number: accountNumber,
      narration: "Payout from KIWI-list"
    }, { 
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } 
    });
    
    res.json({ status: 'initiated', reference: txRef });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Webhook Handler
export const handlePayoutWebhook = async (req, res) => {
  // Signature verification and Firestore updates go here
  // ...
  res.status(200).send();
};

// 4. Export Alias to resolve the route import error without breaking existing code
export const requestWithdrawal = withdrawFunds;