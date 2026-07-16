import express from 'express';
import { db, auth } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';
import axios from 'axios';
import { randomBytes } from 'crypto';

const router = express.Router();

// --- HELPERS ---
const generateTxId = () => `kiwi-tx-${randomBytes(4).toString('hex')}`;

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

// --- AUTHENTICATION ---
router.post('/auth/signup', async (req, res) => {
  const { email, password, displayName } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({ email, password, displayName: displayName || "" });
    
    // Generate email verification link
    const verificationLink = await auth.generateEmailVerificationLink(email);

    // Save user to Firestore using the Firebase Auth UID
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email.toLowerCase().trim(),
      displayName: displayName || "",
      walletBalance: 0,
      totalEarned: 0,
      role: "user",
      verificationStatus: "unverified",
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({ 
      message: "Registered. Please verify your email.", 
      uid: userRecord.uid,
      verificationLink // In production, send this via Email Service (e.g., SendGrid/Nodemailer)
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const authResponse = await axios.post(signInUrl, { email, password, returnSecureToken: true });
    
    // Check if email is verified
    const user = await auth.getUser(authResponse.data.localId);
    if (!user.emailVerified) {
      return res.status(403).json({ error: "Please verify your email address before logging in." });
    }

    return res.status(200).json({ token: authResponse.data.idToken, uid: authResponse.data.localId });
  } catch (error) {
    return res.status(401).json({ error: "Invalid credentials." });
  }
});

// --- FLUTTERWAVE WEBHOOK ---
router.post('/flw-webhook', async (req, res) => {
  const { event, data } = req.body;
  if (event === 'charge.completed' && data?.status === 'successful') {
    // We use the email to find the UID if needed, but Flutterwave ideally passes metadata
    const userSnapshot = await db.collection('users').where('email', '==', data.customer.email).limit(1).get();
    if (userSnapshot.empty) return res.status(404).end();
    
    const userDoc = userSnapshot.docs[0];
    const userRef = userDoc.ref;

    await db.runTransaction(async (t) => {
      const currentData = await t.get(userRef);
      const txId = generateTxId();
      t.update(userRef, { walletBalance: (currentData.data().walletBalance ?? 0) + (data.amount - 100) });
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

// --- PROFILE & SOCIAL ---
router.get('/profile/:uid', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
    
    const userData = userDoc.data();
    // Add bluetick logic: only show if verificationStatus is 'verified'
    const profile = {
      ...userData,
      isVerified: userData.verificationStatus === 'verified',
      bluetick: userData.verificationStatus === 'verified' ? '✓' : null
    };
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- TRANSACTIONS & WITHDRAWALS ---
router.post('/me/withdraw', verifyUser, async (req, res) => {
  const { amount, account_number, bank_name } = req.body;
  const uid = req.user.uid; 
  const totalDeduction = parseFloat(amount) + 150;

  try {
    const account_bank = await getBankCode(bank_name);
    await db.runTransaction(async (t) => {
      const userRef = db.collection('users').doc(uid);
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
  const userDoc = await db.collection('users').doc(req.user.uid).get();
  res.json(userDoc.exists ? userDoc.data() : { error: "User not found" });
});

router.put('/settings', verifyUser, async (req, res) => {
  const { displayName, phoneNumber, bio, bankName, accountNumber } = req.body;
  await db.collection('users').doc(req.user.uid).set({ 
    displayName, phoneNumber, bio, bankName, accountNumber, updatedAt: new Date().toISOString() 
  }, { merge: true });
  return res.json({ message: "Settings updated." });
});

router.post('/submit-kyc', verifyUser, async (req, res) => {
  await db.collection('users').doc(req.user.uid).set({
    verificationStatus: 'pending', kycSubmittedAt: new Date().toISOString()
  }, { merge: true });
  return res.json({ message: "KYC submitted." });
});

router.get('/me/wallet', verifyUser, async (req, res) => {
  const userDoc = await db.collection('users').doc(req.user.uid).get();
  res.json(userDoc.data());
});

router.get('/me/transactions', verifyUser, async (req, res) => {
  const snapshot = await db.collection('users').doc(req.user.uid).collection('transactions').orderBy('createdAt', 'desc').get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

export default router;