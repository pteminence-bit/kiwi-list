import { auth, db } from '../config/firebase.js';

export const verifyUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    
    // Use standard Firebase UID throughout the engine
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    // Target the standard Firebase UID for Firestore operations
    const userRef = db.collection('users').doc(req.user.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        uid: req.user.uid,
        email: decodedToken.email.toLowerCase().trim() || "",
        displayName: decodedToken.name || "User",
        walletBalance: 0,
        totalEarned: 0,
        role: 'user',
        isDisabled: false,
        isPayoutBlocked: false,
        verificationStatus: 'unverified',
        createdAt: new Date().toISOString()
      }, { merge: true });
    } else {
      const userData = doc.data();
      
      // Admin suspension check
      if (userData.isDisabled === true) {
        return res.status(403).json({ error: "Your account has been suspended by an administrator." });
      }

      // Auto-repair data schema
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