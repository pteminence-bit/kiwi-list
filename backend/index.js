// backend/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { db } from './config/firebase.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import paymentController from './routes/paymentRoutes.js'; 
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();

// Whitelist configuration
const allowedOrigins = [
  'https://kiwi-list-ifnr.onrender.com', // Frontend instance URL
  'http://localhost:5173'                // Local Vite development environment
];

// FIXED: Added regex matching to automatically allow local network Wi-Fi IPs for mobile testing
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.indexOf(origin) !== -1;
    const isLocalNetwork = /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/.test(origin) || /^http:\/\/10\.\d{1,3}\.\d{1,3}:\d+$/.test(origin);

    if (isAllowed || isLocalNetwork) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true
}));

// FIXED: Increased data thresholds to 50MB to handle large mobile image uploads and payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Core API Root Gateway ---
// FIXED: Added root route handler to safely catch Render instance wake-up pings (GET/HEAD /)
app.get('/', (req, res) => {
  res.json({ 
    status: "active", 
    engine: "Kiwi-List Core API", 
    documentation: "Append /api/health or target specific endpoints for operational queries." 
  });
});

// --- API Routes ---
app.use('/api/listings', listingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/webhooks', webhookRoutes); 
app.use('/api/payments', paymentController);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: "Kiwi-List API is up and running smoothly" });
});

// Test route to verify database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const testRef = db.collection('system_logs').doc('health_check');
    await testRef.set({ last_check: new Date().toISOString() });
    res.json({ message: "Firebase Connected Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 Route Not Found Handling
app.use((req, res, next) => {
  console.log(`Incoming Unmatched Request: ${req.method} ${req.url}`);
  res.status(404).json({
    error: `Route not found on engine.`,
    requestedPath: req.url,
    requestedMethod: req.method,
    hint: "Verify if your endpoint prefix matches the route router mapping."
  });
});

// FIXED: Catch-All Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("❌ Engine Error Intercepted:", err.message);
  
  const statusCode = err.status || (err.message.includes('CORS') ? 403 : 500);
  
  res.status(statusCode).json({
    success: false,
    error: err.message || "An unhandled engine operational failure occurred.",
    code: err.code || "BACKEND_CRASH_GUARD"
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Kiwi-List Engine live on port ${PORT}`));