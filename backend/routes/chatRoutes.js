import express from 'express';
import { db } from '../config/firebase.js';
import { verifyUser } from '../middleware/authMiddleware.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = express.Router();

// --- HELPER FOR ID SANITIZATION ALIGNMENT ---
const getKiwiUserId = (email) => {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const sanitizedEmail = cleanEmail.replace(/[@.]/g, '-');
  return `kiwi-user-${sanitizedEmail}`;
};

// --- CHAT ID GENERATOR ---
const generateChatId = async () => {
  const counterRef = db.collection('metadata').doc('chat_counter');
  const counterDoc = await counterRef.get();
  
  const currentCount = counterDoc.exists ? counterDoc.data().count : 0;
  const nextCount = currentCount + 1;
  
  await counterRef.set({ count: nextCount });
  return `kiwi-chat-${nextCount}`;
};

/**
 * @route   POST /api/chats/initialize
 */
router.post('/initialize', verifyUser, async (req, res) => {
  const { listingId } = req.body;
  
  try {
    if (!listingId) return res.status(400).json({ error: "Listing ID target is required." });
    const buyerKiwiId = getKiwiUserId(req.user.email);

    const listingDoc = await db.collection('listings').doc(listingId).get();
    if (!listingDoc.exists) return res.status(404).json({ error: "Target listing not found." });
    
    const listingData = listingDoc.data();
    const ownerKiwiId = listingData.ownerId;

    if (buyerKiwiId === ownerKiwiId) {
      return res.status(400).json({ error: "Cannot chat with own listing." });
    }

    if (listingData.tier === 'premium') {
      const unlockDoc = await db.collection('users').doc(buyerKiwiId).collection('unlocks').doc(listingId).get();
      if (!unlockDoc.exists) {
        return res.status(403).json({ error: "Premium listing requires unlock." });
      }
    }

    // Check for existing room to avoid duplicate chats for same listing
    const existingChat = await db.collection('chats')
      .where('listingId', '==', listingId)
      .where('buyerId', '==', buyerKiwiId)
      .limit(1)
      .get();

    if (!existingChat.empty) {
      return res.status(200).json({ message: "Chat exists.", chatId: existingChat.docs[0].id });
    }

    // Generate new custom ID
    const chatId = await generateChatId();
    await db.collection('chats').doc(chatId).set({
      id: chatId,
      listingId,
      listingTitle: listingData.title || "Premium Asset",
      ownerId: ownerKiwiId,
      buyerId: buyerKiwiId,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      lastMessageText: "Chat initialized."
    });

    return res.status(200).json({ message: "Chat handshake verified.", chatId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/chats/inbox
 */
router.get('/inbox', verifyUser, async (req, res) => {
  try {
    const kiwiUserId = getKiwiUserId(req.user.email);

    const [buyerSnap, ownerSnap] = await Promise.all([
      db.collection('chats').where('buyerId', '==', kiwiUserId).get(),
      db.collection('chats').where('ownerId', '==', kiwiUserId).get()
    ]);

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