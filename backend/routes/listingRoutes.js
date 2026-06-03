import express from 'express';
import { db } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- CREATE LISTING ---
router.post('/create', verifyUser, async (req, res) => {
  const { title, price, tier, images, contactDetails, address, beds, baths } = req.body;

  try {
    const listingData = {
      ownerId: req.user.uid,
      title,
      price,
      address,
      beds,
      baths,
      tier, // 'free' or 'premium'
      images, // Array of R2 URLs
      contactDetails,
      status: tier === 'premium' ? 'pending_payment' : 'active',
      isFlagged: false,
      views: 0,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('listings').add(listingData);
    
    res.status(201).json({ 
      id: docRef.id, 
      status: listingData.status,
      message: tier === 'premium' ? "Payment required" : "Post active" 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GET MARKETPLACE FEED ---
router.get('/feed', async (req, res) => {
  try {
    // Firestore requires an index for multiple where/orderBy clauses. 
    // For now, we'll fetch active posts and sort them.
    const listingsSnapshot = await db.collection('listings')
      .where('status', '==', 'active')
      .get();

    const listings = listingsSnapshot.docs.map(doc => {
      const data = doc.data();
      const listingId = doc.id;
      
      // Deep clone to avoid mutating original data
      const responseData = { ...data, id: listingId };

      // Logic: Hide contact details for premium posts in the general feed
      if (data.tier === 'premium') {
        delete responseData.contactDetails; 
      }

      return responseData;
    });

    // Sort: Premium first, then by date
    const sortedListings = listings.sort((a, b) => {
      if (a.tier === 'premium' && b.tier !== 'premium') return -1;
      if (a.tier !== 'premium' && b.tier === 'premium') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(sortedListings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/my-listings', verifyUser, async (req, res) => {
  try {
    const snapshots = await db.collection('listings')
      .where('ownerId', '==', req.user.uid)
      .get();

    const myListings = snapshots.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(myListings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- FLAG/REPORT A LISTING ---
router.patch('/:id/report', verifyUser, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const listingRef = db.collection('listings').doc(id);
    
    await listingRef.update({
      isFlagged: true,
      reportReason: reason || "No reason provided",
      reportedBy: req.user.uid,
      reportedAt: new Date().toISOString()
    });

    res.json({ message: "Listing has been reported to admins for review." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
