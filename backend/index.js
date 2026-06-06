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
  'https://kiwi-list-ifnr.onrender.com', // Your live frontend URL
  'http://localhost:5173'                 // Keep local development working
];

// FIXED: Properly closed the CORS middleware block
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true
}));

app.options('(.*)', cors());

app.use(express.json());

// Routes
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Kiwi-List Engine live on port ${PORT}`));