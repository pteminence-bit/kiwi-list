import { auth, db } from '../config/firebase.js';

export const verifyUser = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;

    // Auto-create wallet/user profile if it doesn't exist
    const userRef = db.collection('users').doc(decodedToken.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        email: decodedToken.email,
        walletBalance: 0,
        totalEarned: 0,
        role: 'user',
        createdAt: new Date().toISOString()
      });
    } else {
      // NEW PROTECTION CHECK: If the user document exists and has been disabled by admin, drop request
      const userData = doc.data();
      if (userData.isDisabled === true) {
        return res.status(403).json({ error: "Your account has been suspended by an administrator." });
      }
    }

    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
  }
};