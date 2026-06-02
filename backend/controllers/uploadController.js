import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/r2.js";
import crypto from 'crypto';

export const uploadImagesToR2 = async (req, res) => {
  if (!req.files || req.files.length < 2) {
    return res.status(400).json({ error: "Minimum 2 images required." });
  }

  try {
    const uploadPromises = req.files.map(async (file) => {
      // Create a unique filename: user_id + random_hex
      const fileKey = `${req.user.uid}/${crypto.randomBytes(8).toString('hex')}-${file.originalname}`;
      
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);

      // Return the public URL (or your custom domain URL)
      return `${process.env.R2_PUBLIC_URL}/${fileKey}`;
    });

    const imageUrls = await Promise.all(uploadPromises);
    res.json({ urls: imageUrls });
  } catch (error) {
    res.status(500).json({ error: "Upload failed: " + error.message });
  }
};
