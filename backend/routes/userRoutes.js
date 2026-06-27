import express from 'express';
import { db } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';
import axios from 'axios';

const router = express.Router();

const BANK_CODES = {
  "access bank": "044", "citibank": "023", "diamond bank": "063", "ecobank": "050",
  "fidelity bank": "070", "first bank": "011", "fcmb": "214", "gtbank": "058",
  "heritage bank": "030", "jaiz bank": "301", "keystone bank": "082", "opay": "999991",
  "palmpay": "999992", "polaris bank": "076", "providus bank": "101", "stanbic ibtc": "221",
  "standard chartered": "068", "sterling bank": "232", "suntrust bank": "100", "union bank": "032",
  "united bank for africa": "033", "unity bank": "215", "wema bank": "035", "zenith bank": "057",
  "lotus bank": "303", "titan trust": "102", "paystack-titan": "103", "kuda bank": "50211",
  "moniepoint": "50515", "premiumtrust": "105"
};

const resolveAccount = async (account_number, account_bank) => {
  const response = await axios.post('https://api.flutterwave.com/v3/accounts/resolve', {
    account_number, account_bank
  }, { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } });
  return response.data.data;
};

router.post('/me/withdraw', verifyUser, async (req, res) => {
  const { amount, account_number, bank_name } = req.body;
  try {
    const account_bank = BANK_CODES[bank_name?.toLowerCase().trim()];
    if (!account_bank) throw new Error("Unsupported bank name.");
    
    const resolved = await resolveAccount(account_number, account_bank);
    if (!resolved?.account_name) throw new Error("Bank details verification failed.");

    await db.runTransaction(async (t) => {
      const userRef = db.collection('users').doc(req.user.uid);
      const user = await t.get(userRef);
      if ((user.data().balance ?? 0) < amount) throw new Error("Insufficient funds.");
      t.update(userRef, { balance: user.data().balance - amount });
      t.set(db.collection('payouts').doc(), {
        userId: req.user.uid, amount, status: 'pending', account_number, account_bank, bank_name, createdAt: new Date().toISOString()
      });
    });
    res.json({ message: "Withdrawal request submitted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- EXISTING ROUTES ---
router.get('/me/inventory', verifyUser, async (req, res) => {
  try {
    const unlockSnapshot = await db.collection('unlocks').where('userId', '==', req.user.uid).get();
    const listingIds = unlockSnapshot.docs.map(doc => doc.data().listingId);
    if (listingIds.length === 0) return res.json([]);

    const listings = await Promise.all(
      listingIds.map(async (id) => {
        const doc = await db.collection('listings').doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
      })
    );
    res.json(listings.filter(item => item !== null));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me/wallet', verifyUser, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
    const userData = userDoc.data();
    res.json({
      walletBalance: userData.balance ?? userData.walletBalance ?? 0,
      totalEarned: userData.totalEarned ?? 0,
      platformTier: userData.platformTier || "KIWI Premium Split",
      verificationStatus: userData.verificationStatus || 'unverified',
      isPayoutBlocked: userData.isPayoutBlocked === true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me/transactions', verifyUser, async (req, res) => {
  try {
    const snapshot = await db.collection('transactions').where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').get();
    const txs = snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, description: data.description || "Platform Transaction", timestamp: data.timestamp || data.createdAt || new Date().toISOString(), type: data.type || "earning", amount: data.amount || 0 };
    });
    res.json(txs);
  } catch (error) {
    if (error.message.includes("FAILED_PRECONDITION")) {
      const fallbackSnapshot = await db.collection('transactions').where('userId', '==', req.user.uid).get();
      const fallbackTxs = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(fallbackTxs.sort((a,b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)));
    }
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', verifyUser, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "Account data not found" });
    res.json(userDoc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', verifyUser, async (req, res) => {
  const { displayName, phoneNumber, bio, bankName, accountNumber } = req.body;
  try {
    const userRef = db.collection('users').doc(req.user.uid);
    await userRef.set({ displayName, phoneNumber, bio, bankName, accountNumber, updatedAt: new Date().toISOString() }, { merge: true });
    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/submit-kyc', verifyUser, async (req, res) => {
  const { fullName, idType, idNumber, documentUrl } = req.body;
  try {
    if (!documentUrl) return res.status(400).json({ error: "Document URL is required." });
    await db.collection('users').doc(req.user.uid).set({
      verificationStatus: 'pending', legalFullName: fullName, kycIdType: idType, kycIdNumber: idNumber, kycDocumentUrl: documentUrl, kycSubmittedAt: new Date().toISOString()
    }, { merge: true });
    res.json({ message: "KYC submitted." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;