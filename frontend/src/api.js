// Single source of truth for the backend URL (override with VITE_API_URL)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
