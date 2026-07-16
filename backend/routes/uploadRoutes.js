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

// Because this is mounted at '/api/upload' in server.js:
// 1. POST /api/upload (Multi-image)
router.post('/', verifyUser, upload.array('images', 4), uploadImagesToR2);

// 2. POST /api/upload/file (Single file)
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