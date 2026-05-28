// frontend/src/config.js

/**
 * Centralized configuration for the Feedback System.
 * 
 * REACT_APP_API_URL should be set in the environment (Vercel/Render).
 * Local development fallback: http://localhost:8000
 */

const getApiBase = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, ""); // Remove trailing slash if present
  }
  
  // Fallback for local development
  return `http://${window.location.hostname}:8000`;
};

export const API_BASE = getApiBase();

console.log("[CONFIG] API Base URL initialized as:", API_BASE);
