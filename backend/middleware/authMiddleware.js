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
      // Aligned with signup logic and admin control system
      await userRef.set({
        id: kiwiUserId,
        email: decodedToken.email.toLowerCase().trim() || "",
        displayName: decodedToken.name || "User",
        walletBalance: 0,
        totalEarned: 0,
        role: 'user',
        isDisabled: false, // Initialized explicitly to map with adminRoutes.js
        isPayoutBlocked: false, // Initialized explicitly to map with wallet/admin systems
        verificationStatus: 'unverified', 
        createdAt: new Date().toISOString()
      }, { merge: true });
    } else {
      const userData = doc.data();
      
      // Admin suspension check (matches adminRoutes.js 'disable' action)
      if (userData.isDisabled === true) {
        return res.status(403).json({ error: "Your account has been suspended by an administrator." });
      }

      // DATA MIGRATION: Auto-repair database structure anomalies for older records
      if (
        userData.walletBalance === undefined || 
        userData.verificationStatus === undefined || 
        userData.isDisabled === undefined ||
        userData.isPayoutBlocked === undefined
      ) {
        await userRef.update({
          walletBalance: userData.walletBalance ?? 0,
          totalEarned: userData.totalEarned ?? 0,
          verificationStatus: userData.verificationStatus ?? 'unverified',
          isPayoutBlocked: userData.isPayoutBlocked ?? false,
          isDisabled: userData.isDisabled ?? false
        });
      }
    }

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(403).json({ error: "Invalid or expired token" });
  }
};