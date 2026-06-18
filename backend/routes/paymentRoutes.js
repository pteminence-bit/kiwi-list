import express from 'express';
import { initializePayment, verifyPayment } from '../controllers/paymentController.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/initialize', verifyUser, initializePayment);
router.get('/verify', verifyUser, verifyPayment);

export default router;