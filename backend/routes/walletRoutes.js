import express from 'express';
import { db } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/withdraw', verifyUser, async (req, res) => {
  const { amount, bankCode, accountNumber } = req.body;
  const userRef = db.collection('users').doc(req.user.uid);

  try {
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const balance = userDoc.data().walletBalance;

      if (balance < amount) throw new Error("Insufficient funds");
      if (amount < 2000) throw new Error("Minimum withdrawal is ₦2,000");

      // Deduct immediately to prevent double-withdrawal
      t.update(userRef, { 
        walletBalance: admin.firestore.FieldValue.increment(-amount) 
      });

      // Log the request for Admin to process via Flutterwave Payouts
      const requestRef = db.collection('withdrawal_requests').doc();
      t.set(requestRef, {
        userId: req.user.uid,
        amount,
        bankCode,
        accountNumber,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    });

    res.json({ message: "Withdrawal request submitted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
