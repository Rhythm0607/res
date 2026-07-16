/// <reference types="vite/client" />

export const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Ensure the API URL is always correctly prefixed with /api/v1
export const API_URL = BACKEND_URL.endsWith('/api/v1') 
  ? BACKEND_URL 
  : `${BACKEND_URL}/api/v1`;
