import express from 'express';
import { db } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', verifyUser, async (req, res) => {
  const { title, price, tier, images, contactDetails } = req.body;

  try {
    const listingData = {
      ownerId: req.user.uid,
      title,
      price,
      tier, // 'free' or 'premium'
      images, // R2 URLs
      contactDetails,
      status: tier === 'premium' ? 'pending_payment' : 'active',
      isFlagged: false,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('listings').add(listingData);
    
    // If premium, return a Flutterwave payment link (to be built next)
    res.status(201).json({ 
      id: docRef.id, 
      message: tier === 'premium' ? "Payment required" : "Post active" 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
