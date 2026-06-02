// backend/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/firebase.js';
import listingRoutes from './routes/listingRoutes.js';
app.use('/api/listings', listingRoutes);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

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