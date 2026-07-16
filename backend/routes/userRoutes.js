import express from 'express';
import { db, auth } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';
import axios from 'axios';
import { randomBytes } from 'crypto';

const router = express.Router();

// --- HELPERS ---
const generateTxId = () => `kiwi-tx-${randomBytes(4).toString('hex')}`;
// For chat IDs, consider tracking the last incrementing number in a 'metadata' collection
const generateChatId = (count) => `kiwi-chat-${count}`;

const getBankCode = async (bankName) => {
  try {
    const response = await axios.get('https://api.flutterwave.com/v3/banks/NG', {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` }
    });
    const bank = response.data?.data?.find(b => 
      b.name?.toLowerCase().trim() === bankName.toLowerCase().trim()
    );
    return bank ? bank.code : null;
  } catch (error) {
    console.error("FLW Bank List Retrieval Error:", error.message);
    return null;
  }
};

const resolveAccount = async (account_number, account_bank) => {
  const response = await axios.post('https://api.flutterwave.com/v3/accounts/resolve', {
    account_number, account_bank
  }, { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } });
  return response.data.data;
};

const getKiwiUserId = (email) => {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const sanitizedEmail = cleanEmail.replace(/[@.]/g, '-');
  return `kiwi-user-${sanitizedEmail}`;
};

// --- AUTHENTICATION ---
router.post('/auth/signup', async (req, res) => {
  const { email, password, displayName } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
    const cleanEmail = email.toLowerCase().trim();

    // Firebase Auth handles UID creation
    const userRecord = await auth.createUser({ email: cleanEmail, password, displayName: displayName || "" });
    const kiwiUserId = getKiwiUserId(cleanEmail);

    await db.collection('users').doc(kiwiUserId).set({
      id: kiwiUserId,
      email: cleanEmail,
      displayName: displayName || "",
      walletBalance: 0,
      totalEarned: 0,
      role: "user",
      verificationStatus: "unverified",
      createdAt: new Date().toISOString()
    }, { merge: true });

    return res.status(201).json({ message: "Registered.", uid: userRecord.uid });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const cleanEmail = email.toLowerCase().trim();
    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const authResponse = await axios.post(signInUrl, { email: cleanEmail, password, returnSecureToken: true });
    
    return res.status(200).json({ token: authResponse.data.idToken, uid: authResponse.data.localId });
  } catch (error) {
    return res.status(401).json({ error: "Invalid credentials." });
  }
});

// --- FLUTTERWAVE WEBHOOK ---
router.post('/flw-webhook', async (req, res) => {
  const { event, data } = req.body;
  if (event === 'charge.completed' && data?.status === 'successful') {
    const kiwiUserId = getKiwiUserId(data.customer.email);
    
    await db.runTransaction(async (t) => {
      const userRef = db.collection('users').doc(kiwiUserId);
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) return;

      const txId = generateTxId();
      t.update(userRef, { walletBalance: (userDoc.data().walletBalance ?? 0) + (data.amount - 100) });
      t.set(userRef.collection('transactions').doc(txId), {
        amount: data.amount - 100,
        type: 'deposit',
        description: `Flutterwave Deposit (Ref: ${data.tx_ref})`,
        createdAt: new Date().toISOString()
      });
    });
    return res.status(200).end();
  }
  res.status(200).end();
});

// --- TRANSACTIONS & WITHDRAWALS ---
router.post('/me/withdraw', verifyUser, async (req, res) => {
  const { amount, account_number, bank_name } = req.body;
  const kiwiUserId = getKiwiUserId(req.user.email);
  const totalDeduction = parseFloat(amount) + 150;

  try {
    const account_bank = await getBankCode(bank_name);
    await db.runTransaction(async (t) => {
      const userRef = db.collection('users').doc(kiwiUserId);
      const userDoc = await t.get(userRef);
      if (userDoc.data().walletBalance < totalDeduction) throw new Error("Insufficient funds.");
      
      t.update(userRef, { walletBalance: userDoc.data().walletBalance - totalDeduction });
      t.set(userRef.collection('transactions').doc(generateTxId()), {
        amount: -totalDeduction,
        type: 'withdrawal',
        description: `Withdrawal to ${bank_name}`,
        createdAt: new Date().toISOString()
      });
    });
    return res.json({ message: "Withdrawal submitted." });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// --- PROFILE, LEDGER, & SETTINGS ---
router.get('/me', verifyUser, async (req, res) => {
  const userDoc = await db.collection('users').doc(getKiwiUserId(req.user.email)).get();
  res.json(userDoc.exists ? userDoc.data() : { error: "User not found" });
});

router.put('/settings', verifyUser, async (req, res) => {
  const { displayName, phoneNumber, bio, bankName, accountNumber } = req.body;
  await db.collection('users').doc(getKiwiUserId(req.user.email)).set({ 
    displayName, phoneNumber, bio, bankName, accountNumber, updatedAt: new Date().toISOString() 
  }, { merge: true });
  return res.json({ message: "Settings updated." });
});

router.post('/submit-kyc', verifyUser, async (req, res) => {
  await db.collection('users').doc(getKiwiUserId(req.user.email)).set({
    verificationStatus: 'pending', kycSubmittedAt: new Date().toISOString()
  }, { merge: true });
  return res.json({ message: "KYC submitted." });
});

router.get('/me/wallet', verifyUser, async (req, res) => {
  const userDoc = await db.collection('users').doc(getKiwiUserId(req.user.email)).get();
  res.json(userDoc.data());
});

router.get('/me/transactions', verifyUser, async (req, res) => {
  const snapshot = await db.collection('users').doc(getKiwiUserId(req.user.email)).collection('transactions').orderBy('createdAt', 'desc').get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

export default router;