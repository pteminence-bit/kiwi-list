import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/api/health', (req, res) => {
  res.json({ status: "Kiwi-List API is up and running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
