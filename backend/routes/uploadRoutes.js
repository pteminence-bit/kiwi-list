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

// --- USER CONTEXT NORMALIZATION ---
// Matches the exact lowercase, trim, and sanitation logic used in the wallet route
const ensureUserContext = (req, res, next) => {
  if (req.user?.email) {
    const cleanEmail = req.user.email.toLowerCase().trim();
    const sanitizedEmail = cleanEmail.replace(/[@.]/g, '-');
    const kiwiUserId = `kiwi-user-${sanitizedEmail}`;
    
    // Cross-bridge keys so both req.user.id and req.user.uid match the wallet system
    req.user.uid = kiwiUserId;
    req.user.id = kiwiUserId;
  } else if (!req.user) {
    return res.status(401).json({ error: "Auth missing identity context." });
  }
  next();
};

// --- ROUTES ---

// Multi-image upload for premium listings (expects 'images' array field, max 4 files)
router.post('/listings', verifyUser, ensureUserContext, upload.array('images', 4), uploadImagesToR2);

// Single file upload route for KYC documents or general assets (expects 'file' field)
router.post('/file', verifyUser, ensureUserContext, upload.single('file'), uploadImagesToR2);


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