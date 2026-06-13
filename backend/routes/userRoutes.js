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

    res.json({
      walletBalance: userData.balance ?? userData.walletBalance ?? 0,
      totalEarned: userData.totalEarned ?? 0,
      platformTier: userData.platformTier || "KIWI Premium Split",
      // FIXED: Ensure verificationStatus is explicitly passed to the frontend
      verificationStatus: userData.verificationStatus || 'unverified',
      isPayoutBlocked: userData.isPayoutBlocked === true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GET CURRENT USER'S TRANSACTION HISTORY ---
router.get('/me/transactions', verifyUser, async (req, res) => {
  try {
    const snapshot = await db.collection('transactions')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
      
    const txs = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        description: data.description || "Platform Transaction",
        timestamp: data.timestamp || data.createdAt || new Date().toISOString(),
        type: data.type || "earning", 
        amount: data.amount || 0
      };
    });
    
    res.json(txs);
  } catch (error) {
    console.error("Transaction Fetch Error:", error.message);
    if (error.message.includes("FAILED_PRECONDITION")) {
      const fallbackSnapshot = await db.collection('transactions').where('userId', '==', req.user.uid).get();
      const fallbackTxs = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(fallbackTxs.sort((a,b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)));
    }
    res.status(500).json({ error: error.message });
  }
});

// --- GET DETAILED ACCOUNT METADATA ---
router.get('/me', verifyUser, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "Account data not found" });
    res.json(userDoc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- TARGET PROFILE SAVE PIPELINE ---
router.put('/settings', verifyUser, async (req, res) => {
  const { displayName, phoneNumber, bio, bankName, accountNumber } = req.body;

  try {
    const userRef = db.collection('users').doc(req.user.uid);
    const updateData = { updatedAt: new Date().toISOString() };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (bio !== undefined) updateData.bio = bio;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;

    await userRef.set(updateData, { merge: true });
    res.json({ message: "Settings and profile metrics updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SUBMIT KYC CREDENTIALS PIPELINE ---
router.post('/submit-kyc', verifyUser, async (req, res) => {
  const { fullName, idType, idNumber, documentUrl } = req.body;

  try {
    if (!documentUrl || typeof documentUrl !== 'string') {
      return res.status(400).json({ error: "A single valid verification document file URL is required." });
    }

    // Update User KYC
    await db.collection('users').doc(req.user.uid).set({
      verificationStatus: 'pending',
      legalFullName: fullName,
      kycIdType: idType,
      kycIdNumber: idNumber,
      kycDocumentUrl: documentUrl,
      kycSubmittedAt: new Date().toISOString()
    }, { merge: true });
    
    res.json({ message: "KYC credentials packet queued successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;