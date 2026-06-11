import express from 'express';
import { db } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- CREATE LISTING ---
router.post('/create', verifyUser, async (req, res) => {
  // FIXED: Destructured 'description'
  const { title, description, price, tier, images, contactDetails, address, beds, baths } = req.body;

  try {
    const sanitizedImages = (images || []).map(img => {
      if (!img || typeof img !== 'string') return img;
      return img.replace(/^(\/?undefined\/)/, '');
    });

    const listingData = {
      ownerId: req.user.uid,
      title,
      description, // FIXED: Added description
      price,
      address,
      beds,
      baths,
      tier,
      images: sanitizedImages,
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

// --- UPDATE LISTING ---
router.put('/:id', verifyUser, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const listingRef = db.collection('listings').doc(id);
    const doc = await listingRef.get();

    if (!doc.exists || doc.data().ownerId !== req.user.uid) {
      return res.status(403).json({ error: "Unauthorized or not found" });
    }

    await listingRef.update(updates);
    res.json({ message: "Listing updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GET MARKETPLACE FEED ---
router.get('/feed', async (req, res) => {
  try {
    const listingsSnapshot = await db.collection('listings')
      .where('status', '==', 'active')
      .get();

    const listings = listingsSnapshot.docs.map(doc => {
      const data = doc.data();
      const listingId = doc.id;
      
      const responseData = { ...data, id: listingId };

      if (data.tier === 'premium') {
        delete responseData.contactDetails; 
        responseData.address = "Unlock to view location";
      }

      return responseData;
    });

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

// --- DELETE OWNED LISTING ---
router.delete('/:id', verifyUser, async (req, res) => {
  const { id } = req.params;

  try {
    const listingRef = db.collection('listings').doc(id);
    const doc = await listingRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (doc.data().ownerId !== req.user.uid) {
      return res.status(403).json({ error: "Unauthorized. You do not own this listing." });
    }

    await listingRef.delete();
    res.json({ message: "Listing successfully removed from KIWI-list." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/users/submit-kyc', verifyUser, async (req, res) => {
  const { kycDocumentUrl } = req.body;
  try {
    await db.collection('users').doc(req.user.uid).update({
      verificationStatus: 'pending',
      kycDocumentUrl: kycDocumentUrl,
      kycSubmittedAt: new Date().toISOString()
    });
    res.json({ message: "KYC submitted successfully, Reviewing." });
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