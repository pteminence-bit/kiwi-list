import express from 'express';
import { db, auth } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';
import axios from 'axios';

const router = express.Router();

const getBankCode = async (bankName) => {
  const response = await axios.get('https://api.flutterwave.com/v3/banks/NG', {
    headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` }
  });
  const bank = response.data.data.find(b => 
    b.name.toLowerCase().trim() === bankName.toLowerCase().trim()
  );
  return bank ? bank.code : null;
};

const resolveAccount = async (account_number, account_bank) => {
  const response = await axios.post('https://api.flutterwave.com/v3/accounts/resolve', {
    account_number, account_bank
  }, { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } });
  return response.data.data;
};

// --- AUTHENTICATION & SIGNUP CONTROL (Fixes delivery issue) ---
router.post('/auth/signup', async (req, res) => {
  const { email, password, displayName } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const sanitizedEmail = cleanEmail.replace(/[@.]/g, '-');
    const customUid = `kiwi-user-${sanitizedEmail}`;

    // 1. Create account with your clean custom layout string format
    const userRecord = await auth.createUser({
      uid: customUid,
      email: cleanEmail,
      password: password,
      displayName: displayName || "",
      emailVerified: false
    });

    // 2. Build the system document base
    await db.collection('users').doc(customUid).set({
      id: customUid,
      email: cleanEmail,
      displayName: displayName || "",
      walletBalance: 0,
      totalEarned: 0,
      role: "user",
      verificationStatus: "unverified",
      createdAt: new Date().toISOString()
    });

    // 3. Request Firebase Identity Engine to dispatch the verification email directly
    const apiKey = db.app.options.apiKey;
    if (!apiKey) {
      throw new Error("Firebase Web API Key is missing from your initialization config.");
    }

    const emailUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;
    await axios.post(emailUrl, {
      requestType: "VERIFY_EMAIL",
      email: cleanEmail
    });

    res.status(201).json({ 
      message: "User registered successfully. Verification email dispatched to your inbox.",
      uid: userRecord.uid 
    });
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error("SIGNUP PIPELINE ERROR:", errorMsg);
    res.status(400).json({ error: errorMsg });
  }
});

// --- AUTHENTICATION SIGN-IN CONTROL ---
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();

    const apiKey = db.app.options.apiKey; 
    if (!apiKey) {
      throw new Error("Firebase Web API Key is missing from your initialization config.");
    }

    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    
    const authResponse = await axios.post(signInUrl, {
      email: cleanEmail,
      password: password,
      returnSecureToken: true
    });

    const sanitizedEmail = cleanEmail.replace(/[@.]/g, '-');
    const customUid = `kiwi-user-${sanitizedEmail}`;

    const customToken = await db.app.auth().createCustomToken(customUid);

    res.status(200).json({
      message: "Login signature approved.",
      token: customToken,
      uid: customUid,
      emailVerified: authResponse.data.registered
    });
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error("LOGIN ROUTE ERROR:", errorMsg);

    if (errorMsg.includes("INVALID_PASSWORD") || errorMsg.includes("EMAIL_NOT_FOUND")) {
      return res.status(401).json({ error: "Invalid email or password credentials." });
    }
    res.status(500).json({ error: "Authentication system error." });
  }
});

// --- TRANSACTIONS & WITHDRAWALS ---
router.post('/me/withdraw', verifyUser, async (req, res) => {
  const { amount, account_number, bank_name } = req.body;
  try {
    if (!bank_name) throw new Error("Bank name is required.");
    if (!req.user?.email) throw new Error("Authenticated user email is required for custom ID routing.");
    
    const account_bank = await getBankCode(bank_name);
    if (!account_bank) throw new Error("Unsupported bank name. Please update your profile settings.");
    
    const resolved = await resolveAccount(account_number, account_bank);
    if (!resolved?.account_name) throw new Error("Bank details verification failed.");

    const sanitizedEmail = req.user.email.toLowerCase().trim().replace(/[@.]/g, '-');
    const kiwiUserId = `kiwi-user-${sanitizedEmail}`;

    await db.runTransaction(async (t) => {
      const userRef = db.collection('users').doc(kiwiUserId);
      const user = await t.get(userRef);
      const currentBalance = user.data().walletBalance ?? 0;
      
      if (!user.exists || currentBalance < amount) {
        throw new Error("Insufficient funds.");
      }
      
      t.update(userRef, { walletBalance: currentBalance - amount });
      
      const transactionRef = db.collection('users').doc(kiwiUserId).collection('transactions').doc();
      t.set(transactionRef, {
        userId: kiwiUserId, 
        amount: -amount, 
        description: `Withdrawal to ${bank_name}`, 
        type: 'withdrawal', 
        createdAt: new Date().toISOString()
      });
      
      const payoutRef = db.collection('users').doc(kiwiUserId).collection('payouts').doc();
      t.set(payoutRef, {
        userId: kiwiUserId, amount, status: 'pending', account_number, account_bank, bank_name, createdAt: new Date().toISOString()
      });
    });
    res.json({ message: "Withdrawal request submitted" });
  } catch (error) {
    const flwError = error.response?.data?.message || error.message;
    console.error("DETAILED FLUTTERWAVE ERROR:", flwError);
    res.status(400).json({ error: flwError });
  }
});

// --- EXISTING ROUTES ---
router.get('/me/inventory', verifyUser, async (req, res) => {
  try {
    if (!req.user?.email) return res.status(400).json({ error: "User email missing from authentication token." });
    const sanitizedEmail = req.user.email.toLowerCase().trim().replace(/[@.]/g, '-');
    const kiwiUserId = `kiwi-user-${sanitizedEmail}`;
    
    const unlockSnapshot = await db.collection('users').doc(kiwiUserId).collection('unlocks').get();
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
    if (!req.user?.email) return res.status(400).json({ error: "User email missing from authentication token." });
    const sanitizedEmail = req.user.email.toLowerCase().trim().replace(/[@.]/g, '-');
    const kiwiUserId = `kiwi-user-${sanitizedEmail}`;
    
    const userDoc = await db.collection('users').doc(kiwiUserId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
    const userData = userDoc.data();
    res.json({
      walletBalance: userData.walletBalance ?? userData.balance ?? 0,
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
    if (!req.user?.email) return res.status(400).json({ error: "User email missing from authentication token." });
    const sanitizedEmail = req.user.email.toLowerCase().trim().replace(/[@.]/g, '-');
    const kiwiUserId = `kiwi-user-${sanitizedEmail}`;
    
    const snapshot = await db.collection('users').doc(kiwiUserId).collection('transactions').orderBy('createdAt', 'desc').get();
    const txs = snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, description: data.description || "Platform Transaction", timestamp: data.createdAt || data.timestamp || new Date().toISOString(), type: data.type || "earning", amount: data.amount || 0 };
    });
    res.json(txs);
  } catch (error) {
    if (error.message.includes("FAILED_PRECONDITION")) {
      const sanitizedEmail = req.user.email.toLowerCase().trim().replace(/[@.]/g, '-');
      const kiwiUserId = `kiwi-user-${sanitizedEmail}`;
      const fallbackSnapshot = await db.collection('users').doc(kiwiUserId).collection('transactions').get();
      const fallbackTxs = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(fallbackTxs.sort((a,b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)));
    }
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', verifyUser, async (req, res) => {
  try {
    if (!req.user?.email) return res.status(400).json({ error: "User email missing from authentication token." });
    const sanitizedEmail = req.user.email.toLowerCase().trim().replace(/[@.]/g, '-');
    const kiwiUserId = `kiwi-user-${sanitizedEmail}`;
    
    const userDoc = await db.collection('users').doc(kiwiUserId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "Account data not found" });
    res.json(userDoc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', verifyUser, async (req, res) => {
  const { displayName, phoneNumber, bio, bankName, accountNumber } = req.body;
  try {
    if (!req.user?.email) return res.status(400).json({ error: "User email missing from authentication token." });
    const sanitizedEmail = req.user.email.toLowerCase().trim().replace(/[@.]/g, '-');
    const kiwiUserId = `kiwi-user-${sanitizedEmail}`;
    
    const userRef = db.collection('users').doc(kiwiUserId);
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
    if (!req.user?.email) return res.status(400).json({ error: "User email missing from authentication token." });
    const sanitizedEmail = req.user.email.toLowerCase().trim().replace(/[@.]/g, '-');
    const kiwiUserId = `kiwi-user-${sanitizedEmail}`;
    
    await db.collection('users').doc(kiwiUserId).set({
      verificationStatus: 'pending', legalFullName: fullName, kycIdType: idType, kycIdNumber: idNumber, kycDocumentUrl: documentUrl, kycSubmittedAt: new Date().toISOString()
    }, { merge: true });
    res.json({ message: "KYC submitted." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;