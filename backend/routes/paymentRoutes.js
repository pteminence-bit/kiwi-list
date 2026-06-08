// backend/routes/paymentRoutes.js
import express from 'express';
import { initializePayment } from '../controllers/paymentController.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Initialize payment endpoint (₦3000 premium fee or ₦500 contact unlock)
router.post('/initialize', verifyUser, initializePayment);

export default router;