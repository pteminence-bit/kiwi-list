import express from 'express';
import { db } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to check if user is admin
const verifyAdmin = async (req, res, next) => {
  try {
    const userRef = await db.collection('users').doc(req.user.uid).get();
    if (userRef.exists && userRef.data().role === 'admin') {
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
    const userRef = await db.collection('users').doc(req.user.uid).get();
    
    if (!userRef.exists) {
      return res.status(200).json({
        message: "Firebase authentication token is valid, but no corresponding user document was found in your Firestore 'users' collection.",
        authenticated: true,
        firestoreDocumentFound: false,
        uid: req.user.uid,
        email: req.user.email
      });
    }

    const userData = userRef.data();

    res.json({
      message: "Authentication and database handshake successful!",
      authenticated: true,
      firestoreDocumentFound: true,
      firebaseUid: req.user.uid,
      firestoreRole: userData.role || "No role assigned",
      isVerifiedAgent: userData.isVerifiedAgent || false,
      fullFirestorePayload: userData
    });
  } catch (error) {
    res.status(500).json({ error: "Debug engine route error: " + error.message });
  }
});

// --- GET ALL ADMINISTRATIVE REVIEW QUEUES (PROPERTIES, KYC, & USER REVIEWS) ---
router.get('/review-queue', verifyUser, verifyAdmin, async (req, res) => {
  try {
    const flaggedListings = await db.collection('listings').where('isFlagged', '==', true).get();
    const pendingListings = await db.collection('listings').where('status', '==', 'needs_review').get();
    const kycRequests = await db.collection('kyc_submissions').where('status', '==', 'pending').get();
    const flaggedReviews = await db.collection('user_reviews').where('status', '==', 'pending_moderation').get();

    const propertiesQueue = [...flaggedListings.docs, ...pendingListings.docs].map(doc => ({
      id: doc.id,
      queueType: 'property',
      ...doc.data()
    }));

    const kycQueue = kycRequests.docs.map(doc => ({
      id: doc.id,
      queueType: 'kyc',
      ...doc.data()
    }));

    const reviewsQueue = flaggedReviews.docs.map(doc => ({
      id: doc.id,
      queueType: 'review',
      ...doc.data()
    }));

    res.json({
      properties: propertiesQueue,
      kyc: kycQueue,
      reviews: reviewsQueue
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

    if (queueType === 'property') {
      const docRef = db.collection('listings').doc(targetId);
      if (action === 'approve') {
        batch.update(docRef, { isFlagged: false, status: 'active' });
      } else {
        batch.delete(docRef);
      }
    } 
    else if (queueType === 'kyc') {
      const kycRef = db.collection('kyc_submissions').doc(targetId);
      const kycSnap = await kycRef.get();
      
      if (kycSnap.exists) {
        const { userId } = kycSnap.data();
        const userRef = db.collection('users').doc(userId);
        
        if (action === 'approve') {
          batch.update(kycRef, { status: 'verified', reviewedAt: new Date().toISOString() });
          batch.update(userRef, { isVerifiedAgent: true, role: 'agent' });
        } else {
          batch.update(kycRef, { status: 'declined', reviewedAt: new Date().toISOString() });
        }
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

    await batch.commit();
    res.json({ message: `Target entity action executed: ${action} on type: ${queueType}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SUBMIT KYC PROOF PIPELINE ---
router.post('/submit-kyc', verifyUser, async (req, res) => {
  const { fullName, idType, idNumber, documentUrl } = req.body;

  try {
    const kycDocRef = db.collection('kyc_submissions').doc(req.user.uid);
    await kycDocRef.set({
      userId: req.user.uid,
      fullName,
      idType,
      idNumber,
      documentUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ message: "KYC documentation securely routed to admin validation queues." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
