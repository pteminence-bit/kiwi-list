import express from 'express';
import { db } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = express.Router();

// --- SYSTEM HELPER MAPPING ---
const getKiwiUserId = (email) => {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const sanitizedEmail = cleanEmail.replace(/[@.]/g, '-');
  return `kiwi-user-${sanitizedEmail}`;
};

// --- CREATE LISTING ---
router.post('/create', verifyUser, async (req, res) => {
  const { title, description, price, tier, images, contactDetails, address, beds, baths } = req.body;

  try {
    if (!req.user?.email) return res.status(400).json({ error: "Auth missing identity context." });
    const kiwiUserId = getKiwiUserId(req.user.email);
    const isPremium = tier === 'premium';
    const premiumCost = 3000;

    const sanitizedImages = (images || []).map(img => {
      if (!img || typeof img !== 'string') return img;
      return img.replace(/^(\/?undefined\/)/, '');
    });

    const listingData = {
      ownerId: kiwiUserId, // Aligned with sanitized email structure
      title,
      description,
      price,
      address,
      beds,
      baths,
      tier,
      images: sanitizedImages,
      contactDetails,
      status: isPremium ? 'pending_payment' : 'active', // Default status
      isFlagged: false,
      views: 0,
      createdAt: new Date().toISOString()
    };

    // --- TRANSACTION OVERLAY FOR PREMIUM WALLET SPEND ---
    if (isPremium) {
      let operationSuccess = false;
      let generatedId = null;

      await db.runTransaction(async (t) => {
        const userRef = db.collection('users').doc(kiwiUserId);
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new Error("Account context not found.");

        const currentBalance = userDoc.data().walletBalance ?? 0;
        if (currentBalance < premiumCost) {
          throw new Error(`Insufficient wallet balance. Premium placement requires ₦${premiumCost}.`);
        }

        // Deduct premium listing placement fee
        t.update(userRef, { walletBalance: currentBalance - premiumCost });

        // Log wallet deduction activity
        const transactionRef = db.collection('users').doc(kiwiUserId).collection('transactions').doc();
        t.set(transactionRef, {
          userId: kiwiUserId,
          amount: -premiumCost,
          description: `Premium Listing Placement Fee for: ${title}`,
          type: 'premium_listing',
          createdAt: new Date().toISOString()
        });

        // Set listing status directly to active because payment is settled
        listingData.status = 'active';
        
        const newListingRef = db.collection('listings').doc();
        generatedId = newListingRef.id;
        t.set(newListingRef, listingData);
        operationSuccess = true;
      });

      if (operationSuccess) {
        return res.status(201).json({ 
          id: generatedId, 
          status: 'active',
          message: "Premium placement active! Fee deducted via wallet balance." 
        });
      }
    } else {
      // Normal standard free active listing route pipeline
      const docRef = await db.collection('listings').add(listingData);
      return res.status(201).json({ 
        id: docRef.id, 
        status: 'active',
        message: "Post active on KIWI marketplace feed." 
      });
    }

  } catch (error) {
    return res.status(400).json({ error: error.message });
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
      const responseData = { ...data, id: doc.id };

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

    return res.json(sortedListings);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// --- GET USER OWNED LISTINGS ---
router.get('/my-listings', verifyUser, async (req, res) => {
  try {
    if (!req.user?.email) return res.status(400).json({ error: "User email missing." });
    const kiwiUserId = getKiwiUserId(req.user.email);

    const snapshots = await db.collection('listings')
      .where('ownerId', '==', kiwiUserId)
      .get();

    const myListings = snapshots.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.json(myListings);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// --- GET SINGLE LISTING BY ID ---
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection('listings').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const data = doc.data();
    const responseData = { ...data, id: doc.id };

    if (data.tier === 'premium') {
      delete responseData.contactDetails; 
      responseData.address = "Unlock to view location";
    }

    return res.json(responseData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// --- UPDATE LISTING ---
router.put('/:id', verifyUser, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (!req.user?.email) return res.status(400).json({ error: "User email missing." });
    const kiwiUserId = getKiwiUserId(req.user.email);
    const listingRef = db.collection('listings').doc(id);
    const doc = await listingRef.get();

    if (!doc.exists || doc.data().ownerId !== kiwiUserId) {
      return res.status(403).json({ error: "Unauthorized or not found" });
    }

    // Protect immutable identity flags 
    delete updates.ownerId;
    delete updates.tier;

    await listingRef.update(updates);
    return res.json({ message: "Listing updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// --- DELETE OWNED LISTING ---
router.delete('/:id', verifyUser, async (req, res) => {
  const { id } = req.params;

  try {
    if (!req.user?.email) return res.status(400).json({ error: "User email missing." });
    const kiwiUserId = getKiwiUserId(req.user.email);
    const listingRef = db.collection('listings').doc(id);
    const doc = await listingRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (doc.data().ownerId !== kiwiUserId) {
      return res.status(403).json({ error: "Unauthorized. You do not own this listing." });
    }

    await listingRef.delete();
    return res.json({ message: "Listing successfully removed from KIWI-list." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// --- FLAG/REPORT A LISTING ---
router.patch('/:id/report', verifyUser, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    if (!req.user?.email) return res.status(400).json({ error: "User email missing." });
    const kiwiUserId = getKiwiUserId(req.user.email);
    const listingRef = db.collection('listings').doc(id);
    
    await listingRef.update({
      isFlagged: true,
      reportReason: reason || "No reason provided",
      reportedBy: kiwiUserId,
      reportedAt: new Date().toISOString()
    });

    return res.json({ message: "Listing has been reported to admins for review." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// --- INCREMENT LISTING VIEWS ---
router.patch('/:id/view', async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('listings').doc(id).update({
      views: FieldValue.increment(1)
    });
    
    return res.status(200).json({ message: "View count updated" });
  } catch (error) {
    console.error("View update error:", error);
    return res.status(500).json({ error: "Failed to increment view" });
  }
});

export default router;