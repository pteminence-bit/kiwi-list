import express from 'express';
import { db } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to check if user is admin
const verifyAdmin = async (req, res, next) => {
  const userRef = await db.collection('users').doc(req.user.uid).get();
  if (userRef.exists && userRef.data().role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: "Admin access required" });
  }
};

// Get all flagged or pending listings for review
router.get('/review-queue', verifyUser, verifyAdmin, async (req, res) => {
  try {
    const flagged = await db.collection('listings').where('isFlagged', '==', true).get();
    const pending = await db.collection('listings').where('status', '==', 'needs_review').get();

    const queue = [...flagged.docs, ...pending.docs].map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin action: Approve or Delete
router.post('/moderate', verifyUser, verifyAdmin, async (req, res) => {
  const { listingId, action } = req.body; // action: 'approve' or 'delete'

  try {
    const docRef = db.collection('listings').doc(listingId);
    
    if (action === 'approve') {
      await docRef.update({ isFlagged: false, status: 'active' });
    } else {
      await docRef.delete();
    }

    res.json({ message: `Listing ${action}d successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
