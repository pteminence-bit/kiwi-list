import express from 'express';
import { db } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- MIDDLEWARE: VERIFY ADMIN ROLE ---
const verifyAdmin = async (req, res, next) => {
  try {
    // Aligned: Targeting the Firestore ID consistently using Firebase UID
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
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
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(200).json({
        message: "Auth token valid, but Firestore document not found.",
        authenticated: true,
        firestoreDocumentFound: false,
        uid: req.user.uid
      });
    }

    const userData = userDoc.data();
    res.json({
      message: "Handshake successful!",
      authenticated: true,
      uid: req.user.uid,
      firestoreRole: userData.role || "No role assigned",
      fullFirestorePayload: userData
    });
  } catch (error) {
    res.status(500).json({ error: "Debug error: " + error.message });
  }
});

// --- GET ALL ADMINISTRATIVE REVIEW QUEUES ---
router.get('/review-queue', verifyUser, verifyAdmin, async (req, res) => {
  try {
    const [flagged, pending, kyc, flaggedReviews] = await Promise.all([
      db.collection('listings').where('isFlagged', '==', true).get(),
      db.collection('listings').where('status', '==', 'needs_review').get(),
      db.collection('users').where('verificationStatus', '==', 'pending').get(),
      db.collection('user_reviews').where('status', '==', 'pending_moderation').get()
    ]);

    res.json({
      properties: [...flagged.docs, ...pending.docs].map(d => ({ id: d.id, queueType: 'property', ...d.data() })),
      kyc: kyc.docs.map(d => ({ id: d.id, queueType: 'kyc', userId: d.id, ...d.data() })),
      reviews: flaggedReviews.docs.map(d => ({ id: d.id, queueType: 'review', ...d.data() }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- COMPREHENSIVE MODERATION DECISION PORTAL ---
router.post('/moderate', verifyUser, verifyAdmin, async (req, res) => {
  const { targetId, queueType, action } = req.body; 

  try {
    const batch = db.batch();

    switch (queueType) {
      case 'property':
        const listingRef = db.collection('listings').doc(targetId);
        action === 'approve' ? batch.update(listingRef, { isFlagged: false, status: 'active' }) : batch.delete(listingRef);
        break;
        
      case 'kyc':
        const userRef = db.collection('users').doc(targetId);
        const statusUpdate = action === 'approve' 
          ? { verificationStatus: 'verified', isVerifiedAgent: true, role: 'agent', kycReviewedAt: new Date().toISOString() }
          : { verificationStatus: 'declined', kycReviewedAt: new Date().toISOString() };
        batch.update(userRef, statusUpdate);
        break;

      case 'review':
        const reviewRef = db.collection('user_reviews').doc(targetId);
        action === 'approve' ? batch.update(reviewRef, { status: 'active' }) : batch.delete(reviewRef);
        break;

      case 'user':
        const uRef = db.collection('users').doc(targetId);
        const userActions = {
          'disable': { isDisabled: true },
          'enable': { isDisabled: false },
          'block_payout': { isPayoutBlocked: true },
          'unblock_payout': { isPayoutBlocked: false }
        };
        if (userActions[action]) batch.update(uRef, userActions[action]);
        break;
    }

    await batch.commit();
    res.json({ message: `Action '${action}' performed on '${queueType}' entity.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;