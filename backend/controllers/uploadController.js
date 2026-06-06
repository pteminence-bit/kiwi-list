import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/r2.js";
import crypto from 'crypto';

export const uploadImagesToR2 = async (req, res) => {
  // Catch missing configurations before running AWS logic
  if (!process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
    console.error("CRITICAL ERROR: Missing R2 environment configurations on host environment.");
    return res.status(500).json({ error: "Storage driver misconfigured on server." });
  }

  if (!req.files || req.files.length < 2) {
    return res.status(400).json({ error: "Minimum 2 images required." });
  }

  try {
    const uploadPromises = req.files.map(async (file) => {
      const fileKey = `${req.user.uid}/${crypto.randomBytes(8).toString('hex')}-${file.originalname}`;
      
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);

      // Clean trailing slashes out of the final URL mapping string
      const baseUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, "");
      return `${baseUrl}/${fileKey}`;
    });

    const imageUrls = await Promise.all(uploadPromises);
    res.json({ urls: imageUrls });
  } catch (error) {
    console.error("AWS R2 SDK Runtime Upload Crash Error:", error);
    res.status(500).json({ error: "Upload execution failure: " + error.message });
  }
};