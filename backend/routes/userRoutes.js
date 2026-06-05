import express from 'express';
import { db } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- GET CURRENT USER'S WALLET BALANCE ---
router.get('/me/wallet', verifyUser, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
    
    const userData = userDoc.data();

    // Map your database fields safely to match what the frontend expects
    res.json({
      walletBalance: userData.balance ?? userData.walletBalance ?? 0,
      totalEarned: userData.totalEarned ?? 0,
      platformTier: userData.platformTier || "KIWI Premium Split"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GET CURRENT USER'S TRANSACTION HISTORY ---
router.get('/me/transactions', verifyUser, async (req, res) => {
  try {
    // NOTE: If this fails, check your Node console for a Firebase Link to generate an index!
    const snapshot = await db.collection('transactions')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
      
    const txs = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        description: data.description || "Platform Transaction",
        // Map frontend "timestamp" to backend "createdAt"
        timestamp: data.timestamp || data.createdAt || new Date().toISOString(),
        type: data.type || "earning", 
        amount: data.amount || 0
      };
    });
    
    res.json(txs);
  } catch (error) {
    console.error("Transaction Fetch Error:", error.message);
    // Fallback: If index is missing, remove orderBy temporarily so your app doesn't break
    if (error.message.includes("FAILED_PRECONDITION")) {
      console.warn("⚠️ Missing Firestore Composite Index. Sorting client-side for now.");
      const fallbackSnapshot = await db.collection('transactions').where('userId', '==', req.user.uid).get();
      const fallbackTxs = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(fallbackTxs.sort((a,b) => b.createdAt - a.createdAt));
    }
    res.status(500).json({ error: error.message });
  }
});

// --- GET CURRENT USER SETTINGS ---
router.get('/settings', verifyUser, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User profile not found" });
    }
    res.json(userDoc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- UPDATE SETTINGS & PAYOUT BANK ---
router.put('/settings', verifyUser, async (req, res) => {
  const { displayName, phoneNumber, bankName, accountNumber } = req.body;

  try {
    const userRef = db.collection('users').doc(req.user.uid);
    
    const updateData = {
      updatedAt: new Date().toISOString()
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;

    // Fixed to use set with merge: true to guarantee the write commits seamlessly
    await userRef.set(updateData, { merge: true });
    res.json({ message: "Settings saved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;