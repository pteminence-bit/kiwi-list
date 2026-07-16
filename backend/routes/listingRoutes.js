import express from 'express';
import { db } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';
import { FieldValue } from 'firebase-admin/firestore';
import { randomBytes } from 'crypto';

const router = express.Router();

// --- SYSTEM HELPER MAPPING ---
const generateTxId = () => `kiwi-tx-${randomBytes(4).toString('hex')}`;

// --- CREATE LISTING ---
router.post('/create', verifyUser, async (req, res) => {
  const { title, description, price, tier, images, contactDetails, address, beds, baths } = req.body;

  try {
    const uid = req.user.uid;
    const isPremium = tier === 'premium';
    const premiumCost = 3000;

    const sanitizedImages = (images || []).map(img => {
      if (!img || typeof img !== 'string') return img;
      return img.replace(/^(\/?undefined\/)/, '');
    });

    const listingData = {
      ownerId: uid,
      title, 
      description, 
      price, 
      address, 
      beds, 
      baths, 
      tier,
      images: sanitizedImages,
      contactDetails,
      status: isPremium ? 'pending_payment' : 'active',
      isFlagged: false,
      views: 0,
      createdAt: new Date().toISOString()
    };

    if (isPremium) {
      let operationSuccess = false;
      let generatedId = null;

      await db.runTransaction(async (t) => {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new Error("Account context not found.");

        const currentBalance = userDoc.data().walletBalance ?? 0;
        if (currentBalance < premiumCost) throw new Error(`Insufficient funds.`);

        t.update(userRef, { walletBalance: currentBalance - premiumCost });

        const transactionRef = db.collection('users').doc(uid).collection('transactions').doc(generateTxId());
        t.set(transactionRef, {
          userId: uid,
          amount: -premiumCost,
          description: `Premium Listing Placement Fee for: ${title}`,
          type: 'premium_listing',
          createdAt: new Date().toISOString()
        });

        listingData.status = 'active';
        const newListingRef = db.collection('listings').doc();
        generatedId = newListingRef.id;
        t.set(newListingRef, listingData);
        operationSuccess = true;
      });

      if (operationSuccess) {
        return res.status(201).json({ id: generatedId, status: 'active', message: "Premium placement active." });
      }
    } else {
      const docRef = await db.collection('listings').add(listingData);
      return res.status(201).json({ id: docRef.id, status: 'active', message: "Post active." });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// --- GET FEED ---
router.get('/feed', async (req, res) => {
  try {
    const listingsSnapshot = await db.collection('listings').where('status', '==', 'active').get();
    const listings = listingsSnapshot.docs.map(doc => {
      const data = doc.data();
      const responseData = { ...data, id: doc.id };
      if (data.tier === 'premium') {
        delete responseData.contactDetails; 
        responseData.address = "Unlock to view location";
      }
      return responseData;
    });
    return res.json(listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// --- GET USER OWNED LISTINGS ---
router.get('/my-listings', verifyUser, async (req, res) => {
  try {
    const snapshots = await db.collection('listings').where('ownerId', '==', req.user.uid).get();
    return res.json(snapshots.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// --- GET SINGLE LISTING ---
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('listings').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Listing not found" });
    const data = doc.data();
    if (data.tier === 'premium') {
        delete data.contactDetails;
        data.address = "Unlock to view location";
    }
    return res.json({ id: doc.id, ...data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// --- UPDATE LISTING ---
router.put('/:id', verifyUser, async (req, res) => {
  try {
    const listingRef = db.collection('listings').doc(req.params.id);
    const doc = await listingRef.get();
    if (!doc.exists || doc.data().ownerId !== req.user.uid) return res.status(403).json({ error: "Unauthorized" });
    
    const { ownerId, tier, ...updates } = req.body;
    await listingRef.update(updates);
    return res.json({ message: "Updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// --- DELETE LISTING ---
router.delete('/:id', verifyUser, async (req, res) => {
  try {
    const listingRef = db.collection('listings').doc(req.params.id);
    const doc = await listingRef.get();
    if (!doc.exists || doc.data().ownerId !== req.user.uid) return res.status(403).json({ error: "Unauthorized" });
    
    await listingRef.delete();
    return res.json({ message: "Removed successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// --- FLAG/REPORT ---
router.patch('/:id/report', verifyUser, async (req, res) => {
  try {
    await db.collection('listings').doc(req.params.id).update({
      isFlagged: true,
      reportReason: req.body.reason || "No reason",
      reportedBy: req.user.uid,
      reportedAt: new Date().toISOString()
    });
    return res.json({ message: "Reported." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// --- INCREMENT VIEW ---
router.patch('/:id/view', async (req, res) => {
  try {
    await db.collection('listings').doc(req.params.id).update({ views: FieldValue.increment(1) });
    return res.status(200).json({ message: "View updated" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to increment view" });
  }
});

export default router;