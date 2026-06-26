import express from 'express';
import { requestWithdrawal, handlePayoutWebhook } from '../controllers/payoutController.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route mappings
router.post('/withdraw', verifyUser, requestWithdrawal);
router.post('/webhook', handlePayoutWebhook);

export default router;
