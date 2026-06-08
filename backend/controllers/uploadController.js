// backend/controllers/uploadController.js
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/r2.js";
import crypto from 'crypto';

export const uploadImagesToR2 = async (req, res, next) => {
  try {
    let filesToProcess = [];
    const isSingleUpload = !!req.file; 

    if (req.file) {
      filesToProcess = [req.file];
    } else if (req.files) {
      filesToProcess = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    }

    if (filesToProcess.length === 0) {
      return res.status(400).json({ 
        error: "No image files detected in the incoming payload request metadata." 
      });
    }

    // 👇 BULLETPROOF CHECK: Explicitly find out if this is a listing submission
    // It is ONLY a listing route if the URL contains 'listings' OR if the frontend used the 'images' form key field
    const isListingRoute = 
      (req.originalUrl && req.originalUrl.includes('/listings')) || 
      (req.files && Array.isArray(req.files) && req.files.length > 0 && req.files[0].fieldname === 'images');

    // ONLY enforce the 2-image minimum for marketplace gallery listings
    if (isListingRoute && filesToProcess.length < 2) {
      return res.status(400).json({ 
        error: "Marketplace gallery listings require a minimum of 2 images to display effectively." 
      });
    }

    // Process filesToProcess up to R2
    const uploadPromises = filesToProcess.map(async (file) => {
      const fileExtension = file.originalname.split('.').pop();
      const uniqueHash = crypto.randomBytes(4).toString('hex');
      const fileName = `${Date.now()}-${uniqueHash}.${fileExtension}`;
      
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);
      return `${process.env.R2_PUBLIC_CUSTOM_DOMAIN}/${fileName}`;
    });

    const uploadedUrls = await Promise.all(uploadPromises);

    // If it came from a single upload or upload payload is a flat element, return object wrapped URL
    if (isSingleUpload || !isListingRoute) {
      return res.json({ 
        success: true, 
        url: uploadedUrls[0],
        imageUrl: uploadedUrls[0] 
      });
    }

    return res.json({ success: true, urls: uploadedUrls });

  } catch (error) {
    console.error("R2 Engine Upload Pipeline Breakdown:", error);
    next(error);
  }
};