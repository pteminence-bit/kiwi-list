// backend/routes/chatRoutes.js
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

/**
 * @route   POST /api/chats/initialize
 * @desc    Creates a secure chat room window context between a buyer and owner
 * @access  Protected (Verified Users Only)
 */
router.post('/initialize', verifyUser, async (req, res) => {
  const { listingId } = req.body;
  
  try {
    if (!listingId) return res.status(400).json({ error: "Listing ID target is required." });
    if (!req.user?.email) return res.status(400).json({ error: "Auth context missing identity." });

    const buyerKiwiId = getKiwiUserId(req.user.email);

    // 1. Fetch the Target Asset Listing Details
    const listingDoc = await db.collection('listings').doc(listingId).get();
    if (!listingDoc.exists) return res.status(404).json({ error: "Target listing not found." });
    
    const listingData = listingDoc.data();
    const ownerKiwiId = listingData.ownerId;

    if (buyerKiwiId === ownerKiwiId) {
      return res.status(400).json({ error: "You cannot initiate a chat with your own listing." });
    }

    // 2. Structural Firewall Check: Verify premium unlocks if tier is premium
    if (listingData.tier === 'premium') {
      const unlockDoc = await db.collection('users').doc(buyerKiwiId).collection('unlocks').doc(listingId).get();
      if (!unlockDoc.exists) {
        return res.status(403).json({ 
          error: "This is a Premium Listing. You must unlock it via your wallet balance before initiating a chat." 
        });
      }
    }

    // 3. Generate a deterministic room identifier to prevent duplicate rooms
    const chatId = `${listingId}_${buyerKiwiId}`;
    const chatRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      await chatRef.set({
        id: chatId,
        listingId,
        listingTitle: listingData.title || "Premium Asset",
        ownerId: ownerKiwiId,
        buyerId: buyerKiwiId,
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        lastMessageText: "Chat initialized."
      });
    }

    return res.status(200).json({ message: "Chat handshake verified.", chatId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/chats/inbox
 * @desc    Retrieves all conversation windows where the current user is a buyer or an owner
 * @access  Protected (Verified Users Only)
 */
router.get('/inbox', verifyUser, async (req, res) => {
  try {
    if (!req.user?.email) return res.status(400).json({ error: "Auth context missing identity." });
    const kiwiUserId = getKiwiUserId(req.user.email);

    // Query active streams where user acts as either the prospective buyer or asset creator
    const buyerQuery = db.collection('chats').where('buyerId', '==', kiwiUserId).get();
    const ownerQuery = db.collection('chats').where('ownerId', '==', kiwiUserId).get();

    const [buyerSnap, ownerSnap] = await Promise.all([buyerQuery, ownerQuery]);

    const chats = [
      ...buyerSnap.docs.map(doc => doc.data()),
      ...ownerSnap.docs.map(doc => doc.data())
    ].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    return res.json(chats);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;