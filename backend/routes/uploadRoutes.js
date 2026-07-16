import express from 'express';
import multer from 'multer';
import { verifyUser } from '../middleware/authMiddleware.js';
import { uploadImagesToR2 } from '../controllers/uploadController.js';

const router = express.Router();

// --- MULTER STORAGE CONFIGURATION ---
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB file size limit
});

// --- ROUTES ---

// Multi-image upload for listings
// Uses req.user.uid provided by the verifyUser middleware (Firebase standard)
router.post('/listings', verifyUser, upload.array('images', 4), uploadImagesToR2);

// Single file upload route for KYC documents or general assets
// Uses req.user.uid provided by the verifyUser middleware (Firebase standard)
router.post('/file', verifyUser, upload.single('file'), uploadImagesToR2);

// --- GLOBAL ERROR INTERCEPTION LAYER ---
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error(`❌ Multer Upload Engine Error: ${err.message} | Field: ${err.field}`);
    return res.status(400).json({
      success: false,
      error: `Upload parsing failed: ${err.message}`,
      hint: `Ensure your frontend FormData key matches exactly. Expected 'file' or 'images'.`
    });
  }
  
  console.error("❌ Runtime Controller Upload Crash Log:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server processing error during R2 asset streaming."
  });
});

export default router;