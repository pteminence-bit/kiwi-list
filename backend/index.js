import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { db } from './config/firebase.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import chatRoutes from './routes/chatRoutes.js'; // Added to support your new secure chats subsystem

dotenv.config();

const app = express();

// --- CORS POLICY DEFINITION ---
const allowedOrigins = [
  'https://kiwi-list-ifnr.onrender.com',
  'http://localhost:5173'
];

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

// --- PARSERS CONFIGURATION ---
// Combined and streamlined duplicate JSON definitions to prevent payload evaluation crashes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- BASE STATUS GETTER ---
app.get('/', (req, res) => {
  res.json({ 
    status: "active", 
    engine: "Kiwi-List Core API", 
    documentation: "Append /api/health or target specific endpoints for operational queries." 
  });
});

// --- 🔐 STANDALONE AUTH PASS-THROUGH ROUTING ---
// Maps root /auth/login and /auth/signup entries directly
app.use('/', userRoutes); 

// --- ROUTER ENGINE MOUNTING LINES ---
app.use('/api/listings', listingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);     // Handles profile, settings, and kyc under /api/users
app.use('/api/payments', paymentRoutes);
app.use('/api/chats', chatRoutes);       // Mounted secure premium/free listing chat ecosystem

// --- HEALTH & DATABASE TESTING CHECKS ---
app.get('/api/health', (req, res) => {
  res.json({ status: "Kiwi-List API is up and running smoothly" });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const testRef = db.collection('system_logs').doc('health_check');
    await testRef.set({ last_check: new Date().toISOString() });
    res.json({ message: "Firebase Connected Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CATCH-ALL 404 UNMATCHED ROUTE ROUTING ---
app.use((req, res, next) => {
  console.log(`Incoming Unmatched Request: ${req.method} ${req.url}`);
  res.status(404).json({
    error: `Route not found on engine.`,
    requestedPath: req.url,
    requestedMethod: req.method,
    hint: "Verify if your endpoint prefix matches the engine's target routing tree tables."
  });
});

// --- CENTRAL OP CRASH GUARD / ERROR INTERCEPTOR ---
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