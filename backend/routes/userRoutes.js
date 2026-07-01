import express from 'express';
import { db, auth } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';
import axios from 'axios';

const router = express.Router();

// --- HELPERS ---
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

// --- AUTHENTICATION & SIGNUP CONTROL ---
router.post('/auth/signup', async (req, res) => {
  const { email, password, displayName } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const kiwiUserId = getKiwiUserId(cleanEmail);

    let userRecord;
    try {
      userRecord = await auth.createUser({
        uid: kiwiUserId,
        email: cleanEmail,
        password: password,
        displayName: displayName || "",
        emailVerified: false
      });
    } catch (createError) {
      if (createError.code === 'auth/uid-already-exists' || createError.code === 'auth/email-already-in-use') {
        userRecord = await auth.getUser(kiwiUserId);
      } else {
        throw createError;
      }
    }

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

    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) throw new Error("FIREBASE_WEB_API_KEY is missing.");

    const customToken = await auth.createCustomToken(kiwiUserId);

    const exchangeUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;
    const exchangeResponse = await axios.post(exchangeUrl, { token: customToken, returnSecureToken: true });
    const clientTargetIdToken = exchangeResponse.data.idToken;

    const emailUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;
    await axios.post(emailUrl, { requestType: "VERIFY_EMAIL", idToken: clientTargetIdToken });

    return res.status(201).json({ 
      message: "User registered successfully. Verification email dispatched.",
      token: customToken,
      uid: userRecord.uid 
    });
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error("SIGNUP PIPELINE ERROR:", errorMsg);
    return res.status(400).json({ error: errorMsg });
  }
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const apiKey = process.env.FIREBASE_WEB_API_KEY; 
    if (!apiKey) throw new Error("FIREBASE_WEB_API_KEY is missing.");

    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const authResponse = await axios.post(signInUrl, { email: cleanEmail, password, returnSecureToken: true });

    const kiwiUserId = getKiwiUserId(cleanEmail);
    const customToken = await auth.createCustomToken(kiwiUserId);

    return res.status(200).json({
      message: "Login signature approved.",
      token: customToken,
      uid: kiwiUserId,
      emailVerified: authResponse.data.registered
    });
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error("LOGIN ROUTE ERROR:", errorMsg);
    if (errorMsg.includes("INVALID_PASSWORD") || errorMsg.includes("EMAIL_NOT_FOUND")) {
      return res.status(401).json({ error: "Invalid email or password credentials." });
    }
    return res.status(500).json({ error: "Authentication system error." });
  }
});

// --- FLUTTERWAVE DIRECT WEBHOOK PAYMENT RECEIVER ---
router.post('/flw-webhook', async (req, res) => {
  const secretHash = process.env.FLW_SECRET_HASH;
  const signature = req.headers['verif-hash'];
  if (secretHash && signature !== secretHash) {
    return res.status(401).end();
  }

  const { event, data } = req.body;
  if (event === 'charge.completed' && data?.status === 'successful') {
    const { tx_ref, amount, customer } = data;
    if (!customer?.email) return res.status(400).json({ error: "Customer metadata missing." });
    
    const kiwiUserId = getKiwiUserId(customer.email);

    try {
      await db.runTransaction(async (t) => {
        const txLogRef = db.collection('processed_payments').doc(`flw-${tx_ref}`);
        const txLog = await t.get(txLogRef);
        
        if (txLog.exists) return; 

        const userRef = db.collection('users').doc(kiwiUserId);
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) return;

        const currentBalance = userDoc.data().walletBalance ?? 0;
        const depositAmount = parseFloat(amount);
        const netDeposit = depositAmount - 100; 

        if (netDeposit <= 0) throw new Error("Deposit amount too low to cover transaction fees.");

        t.update(userRef, { walletBalance: currentBalance + netDeposit });
        t.set(txLogRef, { processedAt: new Date().toISOString(), amount: depositAmount, netAmount: netDeposit });

        const transactionRef = db.collection('users').doc(kiwiUserId).collection('transactions').doc();
        t.set(transactionRef, {
          userId: kiwiUserId,
          amount: netDeposit,
          description: `Flutterwave Deposit (Ref: ${tx_ref}) - ₦100 fee applied`,
          type: 'deposit',
          createdAt: new Date().toISOString()
        });
      });
      return res.status(200).json({ message: "Webhook processed successfully" });
    } catch (err) {
      console.error("WEBHOOK TRANSACTION ERROR:", err.message);
      return res.status(500).json({ error: "Failed to process hook" });
    }
  }
  return res.status(200).end();
});

// --- REUSABLE WALLET DEBITS HANDLING SYSTEM ---
const processWalletDeduction = async (res, email, cost, description, transactionType, additionalMeta = {}) => {
  try {
    const kiwiUserId = getKiwiUserId(email);
    let operationSuccess = false;

    await db.runTransaction(async (t) => {
      const userRef = db.collection('users').doc(kiwiUserId);
      const user = await t.get(userRef);
      if (!user.exists) throw new Error("Account context not found.");

      const currentBalance = user.data().walletBalance ?? 0;
      if (currentBalance < cost) throw new Error("Insufficient wallet balance. Please top up your wallet.");

      t.update(userRef, { walletBalance: currentBalance - cost });

      const transactionRef = db.collection('users').doc(kiwiUserId).collection('transactions').doc();
      t.set(transactionRef, {
        userId: kiwiUserId,
        amount: -cost,
        description,
        type: transactionType,
        createdAt: new Date().toISOString()
      });

      if (transactionType === 'unlock') {
        const unlockRef = db.collection('users').doc(kiwiUserId).collection('unlocks').doc(additionalMeta.listingId);
        t.set(unlockRef, { listingId: additionalMeta.listingId, unlockedAt: new Date().toISOString() });
      }
      operationSuccess = true;
    });

    if (operationSuccess) {
      return res.json({ message: "Payment processed successfully via wallet funds." });
    } else {
      return res.status(400).json({ error: "Transaction aborted." });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// --- TRANSACTIONS & WITHDRAWALS ---
router.post('/me/withdraw', verifyUser, async (req, res) => {
  const { amount, account_number, bank_name } = req.body;
  const withdrawalFee = 150;
  const totalDeduction = parseFloat(amount) + withdrawalFee;

  try {
    if (!bank_name) throw new Error("Bank name is required.");
    if (!req.user?.email) throw new Error("Authenticated user email is required.");
    
    const account_bank = await getBankCode(bank_name);
    if (!account_bank) throw new Error("Unsupported bank name.");
    
    const resolved = await resolveAccount(account_number, account_bank);
    if (!resolved?.account_name) throw new Error("Bank details verification failed.");

    const kiwiUserId = getKiwiUserId(req.user.email);

    await db.runTransaction(async (t) => {
      const userRef = db.collection('users').doc(kiwiUserId);
      const user = await t.get(userRef);
      if (!user.exists) throw new Error("User document does not exist.");
      
      const currentBalance = user.data().walletBalance ?? 0;
      if (currentBalance < totalDeduction) {
        throw new Error(`Insufficient funds. You need ₦${totalDeduction} total (includes ₦150 fee).`);
      }
      
      t.update(userRef, { walletBalance: currentBalance - totalDeduction });
      
      const transactionRef = db.collection('users').doc(kiwiUserId).collection('transactions').doc();
      t.set(transactionRef, {
        userId: kiwiUserId, 
        amount: -totalDeduction, 
        description: `Withdrawal to ${bank_name} (Includes ₦150 processing fee)`, 
        type: 'withdrawal', 
        createdAt: new Date().toISOString()
      });
      
      const payoutRef = db.collection('users').doc(kiwiUserId).collection('payouts').doc();
      t.set(payoutRef, {
        userId: kiwiUserId, amount, fee: withdrawalFee, status: 'pending', account_number, account_bank, bank_name, createdAt: new Date().toISOString()
      });
    });
    return res.json({ message: "Withdrawal request submitted successfully" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// --- PROFILE, LEDGER & SETTINGS GETTERS ---
router.post('/me/spend/unlock', verifyUser, async (req, res) => {
  const { listingId } = req.body;
  if (!listingId) return res.status(400).json({ error: "Listing identity required." });
  if (!req.user?.email) return res.status(400).json({ error: "Auth missing identity context." });
  return await processWalletDeduction(res, req.user.email, 500, "Premium Unlock Fee", "unlock", { listingId });
});

router.post('/me/spend/listing', verifyUser, async (req, res) => {
  if (!req.user?.email) return res.status(400).json({ error: "Auth missing identity context." });
  return await processWalletDeduction(res, req.user.email, 3000, "Premium Listing Placement Fee", "premium_listing");
});

router.get('/me/inventory', verifyUser, async (req, res) => {
  try {
    if (!req.user?.email) return res.status(400).json({ error: "User email missing." });
    const kiwiUserId = getKiwiUserId(req.user.email);
    
    const unlockSnapshot = await db.collection('users').doc(kiwiUserId).collection('unlocks').get();
    const listingIds = unlockSnapshot.docs.map(doc => doc.data().listingId);
    if (listingIds.length === 0) return res.json([]);

    const listings = await Promise.all(
      listingIds.map(async (id) => {
        const doc = await db.collection('listings').doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
      })
    );
    return res.json(listings.filter(item => item !== null));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/me/wallet', verifyUser, async (req, res) => {
  try {
    if (!req.user?.email) return res.status(400).json({ error: "User email missing." });
    const kiwiUserId = getKiwiUserId(req.user.email);
    
    const userDoc = await db.collection('users').doc(kiwiUserId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
    const userData = userDoc.data();
    return res.json({
      walletBalance: userData.walletBalance ?? 0,
      totalEarned: userData.totalEarned ?? 0,
      platformTier: userData.platformTier || "KIWI Premium Split",
      verificationStatus: userData.verificationStatus || 'unverified',
      isPayoutBlocked: userData.isPayoutBlocked === true
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/me/transactions', verifyUser, async (req, res) => {
  try {
    if (!req.user?.email) return res.status(400).json({ error: "User email missing." });
    const kiwiUserId = getKiwiUserId(req.user.email);
    
    const snapshot = await db.collection('users').doc(kiwiUserId).collection('transactions').orderBy('createdAt', 'desc').get();
    return res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    if (error.message.includes("FAILED_PRECONDITION")) {
      const kiwiUserId = getKiwiUserId(req.user.email);
      const fallbackSnapshot = await db.collection('users').doc(kiwiUserId).collection('transactions').get();
      const fallbackTxs = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(fallbackTxs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }
    return res.status(500).json({ error: error.message });
  }
});

router.get('/me', verifyUser, async (req, res) => {
  try {
    if (!req.user?.email) return res.status(400).json({ error: "User email missing." });
    const userDoc = await db.collection('users').doc(getKiwiUserId(req.user.email)).get();
    if (!userDoc.exists) return res.status(404).json({ error: "Account data not found" });
    return res.json(userDoc.data());
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/settings', verifyUser, async (req, res) => {
  const { displayName, phoneNumber, bio, bankName, accountNumber } = req.body;
  try {
    if (!req.user?.email) return res.status(400).json({ error: "User email missing." });
    await db.collection('users').doc(getKiwiUserId(req.user.email)).set({ 
      displayName, phoneNumber, bio, bankName, accountNumber, updatedAt: new Date().toISOString() 
    }, { merge: true });
    return res.json({ message: "Settings updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/submit-kyc', verifyUser, async (req, res) => {
  const { fullName, idType, idNumber, documentUrl } = req.body;
  try {
    if (!documentUrl) return res.status(400).json({ error: "Document URL is required." });
    if (!req.user?.email) return res.status(400).json({ error: "User email missing." });
    
    await db.collection('users').doc(getKiwiUserId(req.user.email)).set({
      verificationStatus: 'pending', legalFullName: fullName, kycIdType: idType, kycIdNumber: idNumber, kycDocumentUrl: documentUrl, kycSubmittedAt: new Date().toISOString()
    }, { merge: true });
    return res.json({ message: "KYC submitted." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;