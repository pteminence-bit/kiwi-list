import express from 'express';
import multer from 'multer';
import { verifyUser } from '../middleware/authMiddleware.js';
import { uploadImagesToR2 } from '../controllers/uploadController.js';

const router = express.Router();

// Memory storage is best for small batches (2-4 images) before pushing to R2
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per document/image
});

// 1. Multiple images upload route for marketplace listings
router.post('/listings', verifyUser, upload.array('images', 4), uploadImagesToR2);

// 2. Single file upload route for Profile Pictures & KYC Verification Documents
// This fixes the Multer field name mismatch by explicitly listening for the 'file' key
router.post('/', verifyUser, upload.single('file'), uploadImagesToR2);

export default router;