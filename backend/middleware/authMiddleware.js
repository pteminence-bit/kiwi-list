import { auth, db } from '../config/firebase.js';

export const verifyUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;

    if (!decodedToken.email) {
      return res.status(400).json({ error: "User email missing from authorization payload token." });
    }

    // Convert raw token email into the matching internal custom string structure
    const sanitizedEmail = decodedToken.email.toLowerCase().trim().replace(/[@.]/g, '-');
    const kiwiUserId = `kiwi-user-${sanitizedEmail}`;

    // Target the customized document ID format instead of the raw decodedToken.uid
    const userRef = db.collection('users').doc(kiwiUserId);
    const doc = await userRef.get();

    if (!doc.exists) {
      // Use set with specific fields to guarantee initialization for new accounts
      await userRef.set({
        id: kiwiUserId,
        email: decodedToken.email || "",
        displayName: decodedToken.name || "User",
        walletBalance: 0,
        totalEarned: 0,
        role: 'user',
        isPayoutBlocked: false, // Explicit initialization to prevent undefined errors
        verificationStatus: 'unverified', // Explicit initialization
        createdAt: new Date().toISOString()
      }, { merge: true });
    } else {
      const userData = doc.data();
      
      // Admin suspension check
      if (userData.isDisabled === true) {
        return res.status(403).json({ error: "Your account has been suspended by an administrator." });
      }

      // DATA MIGRATION: Ensure missing fields exist for older accounts
      if (userData.walletBalance === undefined || userData.verificationStatus === undefined) {
        await userRef.update({
          walletBalance: userData.walletBalance ?? 0,
          totalEarned: userData.totalEarned ?? 0,
          verificationStatus: userData.verificationStatus ?? 'unverified',
          isPayoutBlocked: userData.isPayoutBlocked ?? false
        });
      }
    }

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(403).json({ error: "Invalid or expired token" });
  }
};