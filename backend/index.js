import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { db } from './config/firebase.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import chatRoutes from './routes/chatRoutes.js'; 

dotenv.config();

const app = express();

// --- CORS POLICY ---
const allowedOrigins = [
  'https://kiwi-list-ifnr.onrender.com',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) || /^http:\/\/(192|10)\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(origin);
    if (isAllowed) callback(null, true);
    else callback(new Error('Not allowed by CORS policy'));
  },
  credentials: true
}));

// --- PARSERS ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- ROUTES ---
app.get('/', (req, res) => res.json({ status: "active", engine: "Kiwi-List Core API" }));

// Auth Routes (Signup/Login)
app.use('/auth', userRoutes); 

// Core Engine Routers
app.use('/api/listings', listingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);     
app.use('/api/payments', paymentRoutes);
app.use('/api/chats', chatRoutes);       

// --- HEALTH & CRASH GUARDS ---
app.get('/api/health', (req, res) => res.json({ status: "Kiwi-List API is running" }));

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  console.error("❌ Engine Error:", err.message);
  res.status(err.status || 500).json({ success: false, error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Kiwi-List Engine live on port ${PORT}`));