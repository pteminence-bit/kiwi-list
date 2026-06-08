// backend/routes/uploadRoutes.js
import express from 'express';
import multer from 'multer';
import { verifyUser } from '../middleware/authMiddleware.js';
import { uploadImagesToR2 } from '../controllers/uploadController.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } 
});

// FIXED: Context normalization middleware to bridge Firebase's req.user.uid with the upload controller's expected req.user.id format
const ensureUserContext = (req, res, next) => {
  if (req.user) {
    if (req.user.uid && !req.user.id) req.user.id = req.user.uid;
    if (req.user.id && !req.user.uid) req.user.uid = req.user.id;
  }
  next();
};

// 1. Multiple images upload route for marketplace listings (expects 'images' array)
router.post('/listings', verifyUser, ensureUserContext, upload.array('images', 4), uploadImagesToR2);

// 2. Single file upload root route (expects 'file' key)
router.post('/', verifyUser, ensureUserContext, upload.single('file'), uploadImagesToR2);

// 3. Explicit named endpoint to safeguard direct frontend POST requests to "/api/upload/file"
router.post('/file', verifyUser, ensureUserContext, upload.single('file'), uploadImagesToR2);

// FIXED: Comprehensive error interception layer to catch both Multer AND controller logic faults
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error(`❌ Multer Upload Engine Error: ${err.message} | Field received: ${err.field}`);
    return res.status(400).json({
      success: false,
      error: `Upload parsing failed: ${err.message}`,
      hint: `Ensure your frontend FormData key matches exactly. Expected 'file' or 'images'. Received: '${err.field}'`
    });
  }
  
  // Catches runtime TypeErrors or properties breakdown from the uploadController logic
  console.error("❌ Runtime Controller Upload Crash Log:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server processing error during R2 asset streaming."
  });
});

export default router;