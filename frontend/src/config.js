// frontend/src/config.js
export const API_BASE_URL = import.meta.env.PROD 
  ? 'https://kiwi-list-backend.onrender.com' // Your live Render backend URL
  : 'http://localhost:5000'; // Local fallback for development
