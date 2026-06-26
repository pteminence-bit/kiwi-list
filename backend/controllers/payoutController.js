import { db } from '../config/firebase.js'; // Ensure your Firebase config is correct

export const requestWithdrawal = async (req, res) => {
  const { amount, accountDetails } = req.body;
  const userId = req.user.uid;

  try {
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) throw new Error("User not found");
      if ((userDoc.data().balance || 0) < amount) throw new Error("Insufficient funds");

      // Deduct balance
      transaction.update(userRef, { balance: userDoc.data().balance - amount });

      // Create pending payout record
      const payoutRef = db.collection('payouts').doc();
      transaction.set(payoutRef, {
        userId,
        amount,
        accountDetails,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    });

    res.status(200).json({ message: "Withdrawal request submitted successfully" });
  } catch (error) {
    console.error("Withdrawal Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};