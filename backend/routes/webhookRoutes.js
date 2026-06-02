import express from 'express';
import admin from 'firebase-admin';
import { db } from '../config/firebase.js';

const router = express.Router();

router.post('/flutterwave', async (req, res) => {
  // Verify Flutterwave signature secret to protect against fake hooks
  const secretHash = req.headers['verif-hash'];
  if (!secretHash || secretHash !== process.env.FLW_WEBHOOK_HASH) {
    return res.status(401).send('Unauthorized webhook signature');
  }

  const payload = req.body;
  
  if (payload.status === 'successful') {
    const txRef = payload.tx_ref;
    const txDocRef = db.collection('transactions').doc(txRef);
    const txSnapshot = await txDocRef.get();

    if (!txSnapshot.exists) return res.status(404).send('Transaction not found');
    const transaction = txSnapshot.data();

    if (transaction.status === 'completed') {
      return res.status(200).send('Already processed');
    }

    // Initialize an atomic Firestore transaction write batch
    const batch = db.batch();

    if (transaction.purpose === 'premium_listing') {
      // Upgrade the post from 'pending_payment' to 'active'
      const listingRef = db.collection('listings').doc(transaction.listingId);
      batch.update(listingRef, { status: 'active' });
    } 
    
    else if (transaction.purpose === 'unlock_contact') {
      const listingRef = db.collection('listings').doc(transaction.listingId);
      const listingSnap = await listingRef.get();
      
      if (listingSnap.exists) {
        const listing = listingSnap.data();
        const ownerId = listing.ownerId;
        
        // Calculate 70% earnings split for owner: ₦500 * 0.7 = ₦350
        const ownerEarnings = transaction.amount * 0.70;

        const ownerUserRef = db.collection('users').doc(ownerId);
        batch.update(ownerUserRef, {
          walletBalance: admin.firestore.FieldValue.increment(ownerEarnings),
          totalEarned: admin.firestore.FieldValue.increment(ownerEarnings)
        });

        // Track who has unlocked this specific contact card
        const unlockRef = db.collection('unlocks').doc(`${transaction.userId}_${transaction.listingId}`);
        batch.set(unlockRef, {
          userId: transaction.userId,
          listingId: transaction.listingId,
          unlockedAt: new Date().toISOString()
        });
      }
    }

    // Update global transaction state to completed
    batch.update(txDocRef, { status: 'completed', flw_id: payload.id });
    await batch.commit();

    return res.status(200).send('Webhook handled and balanced successfully');
  }

  res.status(200).send('Transaction unhandled or failed');
});

export default router;
