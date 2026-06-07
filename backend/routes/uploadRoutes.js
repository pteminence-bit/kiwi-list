// backend/routes/uploadRoutes.js
import express from 'express';
import multer from 'multer';
import { verifyUser } from '../middleware/authMiddleware.js';
import { uploadImagesToR2 } from '../controllers/uploadController.js';

const router = express.Router();

// Configure in-memory buffers safely
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB headroom for high-res mobile captures/PDFs
});

// 1. Multiple images upload route for marketplace listings (expects 'images' array)
router.post('/listings', verifyUser, upload.array('images', 4), uploadImagesToR2);

// 2. Single file upload root route (expects 'file' key)
// This catches POST requests to "/api/upload/"
router.post('/', verifyUser, upload.single('file'), uploadImagesToR2);

// 3. FIXED: Explicit named endpoint to safeguard direct frontend POST requests to "/api/upload"
// This eliminates ambiguity when browsers strip trailing slashes or drop multi-part boundary parameters
router.post('/file', verifyUser, upload.single('file'), uploadImagesToR2);

// Catch-all route inside the upload router to debug field mismatch errors immediately
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error(`❌ Multer Upload Engine Error: ${err.message} | Field received: ${err.field}`);
    return res.status(400).json({
      success: false,
      error: `Upload parsing failed: ${err.message}`,
      hint: `Ensure your frontend FormData key matches exactly. Expected 'file' or 'images'. Received: '${err.field}'`
    });
  }
  next(err);
});

export default router;