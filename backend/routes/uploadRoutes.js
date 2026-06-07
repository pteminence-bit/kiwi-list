import express from 'express';
import multer from 'multer';
import { verifyUser } from '../middleware/authMiddleware.js';
import { uploadImagesToR2 } from '../controllers/uploadController.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB aggregate chunk allocation boundary
});

// 1. Multiple images upload route for marketplace listings (keeps its standalone identity)
router.post('/listings', verifyUser, upload.array('images', 4), uploadImagesToR2);

// 2. FIXED: Refactored to accept 1-2 images/files for KYC document packages
// Changed from upload.single('file') to upload.array('files', 2)
router.post('/', verifyUser, upload.array('files', 2), uploadImagesToR2);

export default router;