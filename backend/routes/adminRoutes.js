// backend/routes/adminRoutes.js
import express from 'express';
import { db } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- HELPER FOR ID SANITIZATION ALIGNMENT ---
const getKiwiUserId = (email) => {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const sanitizedEmail = cleanEmail.replace(/[@.]/g, '-');
  return `kiwi-user-${sanitizedEmail}`;
};

// --- MIDDLEWARE: VERIFY ADMIN ROLE ---
const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({ error: "Authentication context missing email." });
    }
    
    // Aligned to check the custom user document ID format instead of req.user.uid
    const kiwiUserId = getKiwiUserId(req.user.email);
    const userDoc = await db.collection('users').doc(kiwiUserId).get();
    
    if (userDoc.exists && userDoc.data().role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: "Admin access required" });
    }
  } catch (error) {
    res.status(500).json({ error: "Authorization loop failure: " + error.message });
  }
};

// --- ADMINISTRATIVE STATUS DEBUGGER ---
router.get('/debug-my-status', verifyUser, async (req, res) => {
  try {
    if (!req.user?.email) {
      return res.status(400).json({ error: "User email missing from authentication token." });
    }

    const kiwiUserId = getKiwiUserId(req.user.email);
    const userDoc = await db.collection('users').doc(kiwiUserId).get();
    
    if (!userDoc.exists) {
      return res.status(200).json({
        message: "Firebase authentication token is valid, but no corresponding user document was found in your Firestore 'users' collection.",
        authenticated: true,
        firestoreDocumentFound: false,
        uid: req.user.uid,
        kiwiUserId: kiwiUserId,
        email: req.user.email
      });
    }

    const userData = userDoc.data();

    res.json({
      message: "Authentication and database handshake successful!",
      authenticated: true,
      firestoreDocumentFound: true,
      firebaseUid: req.user.uid,
      kiwiUserId: kiwiUserId,
      firestoreRole: userData.role || "No role assigned",
      isVerifiedAgent: userData.isVerifiedAgent || false,
      fullFirestorePayload: userData
    });
  } catch (error) {
    res.status(500).json({ error: "Debug engine route error: " + error.message });
  }
});

// --- GET ALL ADMINISTRATIVE REVIEW QUEUES ---
router.get('/review-queue', verifyUser, verifyAdmin, async (req, res) => {
  try {
    const flaggedListings = await db.collection('listings').where('isFlagged', '==', true).get();
    const pendingListings = await db.collection('listings').where('status', '==', 'needs_review').get();
    
    const kycRequests = await db.collection('users').where('verificationStatus', '==', 'pending').get();
    const flaggedReviews = await db.collection('user_reviews').where('status', '==', 'pending_moderation').get();
    
    const allUsersList = await db.collection('users').get();

    const propertiesQueue = [...flaggedListings.docs, ...pendingListings.docs].map(doc => ({
      id: doc.id,
      queueType: 'property',
      ...doc.data()
    }));

    const kycQueue = kycRequests.docs.map(doc => ({
      id: doc.id,
      queueType: 'kyc',
      userId: doc.id, // This is correctly mapped to their kiwiUserId doc name
      ...doc.data()
    }));

    const reviewsQueue = flaggedReviews.docs.map(doc => ({
      id: doc.id,
      queueType: 'review',
      ...doc.data()
    }));

    const usersQueue = allUsersList.docs.map(doc => ({
      id: doc.id,
      queueType: 'user',
      ...doc.data()
    }));

    res.json({
      properties: propertiesQueue,
      kyc: kycQueue,
      reviews: reviewsQueue,
      users: usersQueue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- COMPREHENSIVE MODERATION DECISION PORTAL ---
router.post('/moderate', verifyUser, verifyAdmin, async (req, res) => {
  const { targetId, queueType, action } = req.body; // targetId for users must pass the kiwi-user-email string format

  try {
    const batch = db.batch();

    if (queueType === 'property') {
      const docRef = db.collection('listings').doc(targetId);
      if (action === 'approve') {
        batch.update(docRef, { isFlagged: false, status: 'active' });
      } else {
        batch.delete(docRef);
      }
    } 
    else if (queueType === 'kyc') {
      const userRef = db.collection('users').doc(targetId);
      
      if (action === 'approve') {
        batch.update(userRef, { 
          verificationStatus: 'verified', 
          isVerifiedAgent: true, 
          role: 'agent',
          kycReviewedAt: new Date().toISOString()
        });
      } else {
        batch.update(userRef, { 
          verificationStatus: 'declined',
          kycReviewedAt: new Date().toISOString()
        });
      }
    } 
    else if (queueType === 'review') {
      const reviewRef = db.collection('user_reviews').doc(targetId);
      if (action === 'approve') {
        batch.update(reviewRef, { status: 'active' });
      } else {
        batch.delete(reviewRef);
      }
    }
    else if (queueType === 'user') {
      const userRef = db.collection('users').doc(targetId);
      
      if (action === 'disable') {
        batch.update(userRef, { isDisabled: true });
      } else if (action === 'enable') {
        batch.update(userRef, { isDisabled: false });
      } else if (action === 'block_payout') {
        batch.update(userRef, { isPayoutBlocked: true });
      } else if (action === 'unblock_payout') {
        batch.update(userRef, { isPayoutBlocked: false });
      }
    }

    await batch.commit();
    res.json({ message: `Target entity action executed: ${action} on type: ${queueType}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;