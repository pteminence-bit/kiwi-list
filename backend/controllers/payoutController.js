import { db } from '../config/firebase.js';
import axios from 'axios';
import crypto from 'crypto';

// 1. Request Withdrawal
export const requestWithdrawal = async (req, res) => {
  const { amount, account_number, account_bank, bank_name } = req.body;
  const userId = req.user.uid;

  try {
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists || userDoc.data().balance < amount) {
        throw new Error("Insufficient funds");
      }

      // Deduct balance
      transaction.update(userRef, { balance: userDoc.data().balance - amount });

      // Create pending payout
      const payoutRef = db.collection('payouts').doc();
      transaction.set(payoutRef, {
        userId, amount, status: 'pending', account_number, 
        account_bank, bank_name, createdAt: new Date().toISOString()
      });
    });

    res.status(200).json({ message: "Withdrawal request submitted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 2. Webhook Listener
export const handlePayoutWebhook = async (req, res) => {
  const signature = req.headers["verif-hash"];
  if (signature !== process.env.FLW_SECRET_HASH) return res.status(401).send();

  const { event, data } = req.body;

  if (event === 'transfer.completed') {
    await db.collection('payouts').where('reference', '==', data.reference)
      .get().then(snapshot => snapshot.forEach(doc => doc.ref.update({ status: 'completed' })));
  } else if (event === 'transfer.failed') {
    // Rollback: Refund user
    const payout = await db.collection('payouts').where('reference', '==', data.reference).get();
    if (!payout.empty) {
      const p = payout.docs[0].data();
      await db.collection('users').doc(p.userId).update({
        balance: db.FieldValue.increment(p.amount)
      });
      await payout.docs[0].ref.update({ status: 'failed' });
    }
  }
  res.status(200).send();
};