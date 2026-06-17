import express from 'express';
import admin from 'firebase-admin';
import { db } from '../config/firebase.js';

const router = express.Router();

router.post('/flutterwave', async (req, res) => {
  // Verify Flutterwave signature secret
  const secretHash = req.headers['verif-hash'];
  if (!secretHash || secretHash !== process.env.FLW_WEBHOOK_HASH) {
    return res.status(401).send('Unauthorized webhook signature');
  }

  const payload = req.body;
  
  // FIXED: Flutterwave webhooks nest the transaction info inside 'data'
  const txData = payload.data || payload; 
  const status = txData.status;

  console.log("DEBUG PAYLOAD:", JSON.stringify(payload, null, 2));
  
  if (status === 'successful') {
    const txRef = txData.tx_ref;
    const txDocRef = db.collection('transactions').doc(txRef);
    const txSnapshot = await txDocRef.get();

    if (!txSnapshot.exists) return res.status(404).send('Transaction not found');
    const transaction = txSnapshot.data();

    if (transaction.status === 'completed') {
      return res.status(200).send('Already processed');
    }

    const batch = db.batch();

    console.log("Processing purpose:", transaction.purpose);
    
    if (transaction.purpose === 'premium_listing') {
      if (!transaction.listingId) {
        console.error("Critical: transaction missing listingId", txRef);
        return res.status(400).send('Invalid listing reference');
      }
      const listingRef = db.collection('listings').doc(transaction.listingId);
      batch.update(listingRef, { status: 'active' });
    } 
    
    else if (transaction.purpose === 'unlock_contact') {
      const listingRef = db.collection('listings').doc(transaction.listingId);
      const listingSnap = await listingRef.get();
      
      if (listingSnap.exists) {
        const listing = listingSnap.data();
        const ownerId = listing.ownerId;
        
        const ownerEarnings = transaction.amount * 0.70;

        const ownerUserRef = db.collection('users').doc(ownerId);
        batch.update(ownerUserRef, {
          walletBalance: admin.firestore.FieldValue.increment(ownerEarnings),
          totalEarned: admin.firestore.FieldValue.increment(ownerEarnings)
        });

        const unlockRef = db.collection('unlocks').doc(`${transaction.userId}_${transaction.listingId}`);
        batch.set(unlockRef, {
          userId: transaction.userId,
          listingId: transaction.listingId,
          unlockedAt: new Date().toISOString()
        });
      }
    }

    batch.update(txDocRef, { status: 'completed', flw_id: txData.id });
    await batch.commit();

    return res.status(200).send('Webhook handled and balanced successfully');
  }

  res.status(200).send('Transaction unhandled or failed');
});

export default router;