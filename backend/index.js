// backend/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { db } from './config/firebase.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import paymentController from './routes/paymentRoutes.js'; // create small router hook wrapper mapped to controller

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/listings', listingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
// Flutterwave recommends webhooks hit unparsed or standard root routing early
app.use('/api/webhooks', webhookRoutes); 
app.use('/api/payments', paymentController);


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
