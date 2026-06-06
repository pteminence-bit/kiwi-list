// backend/config/r2.js
import { S3Client } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

dotenv.config();

// Ensure the endpoint doesn't end with a trailing slash which confuses the SDK
const sanitizedEndpoint = process.env.R2_ENDPOINT?.replace(/\/$/, "");

if (!sanitizedEndpoint || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  console.error("❌ CRITICAL: Storage driver keys are missing from environment variables!");
}

export const s3Client = new S3Client({
  region: "auto",
  endpoint: sanitizedEndpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});