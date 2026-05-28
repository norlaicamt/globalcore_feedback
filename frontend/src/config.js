// frontend/src/config.js

/**
 * Centralized configuration for the Feedback System.
 * 
 * REACT_APP_API_URL should be set in the environment (Vercel/Render).
 * Local development fallback: http://localhost:8000
 */

const getApiBase = () => {
  let url = process.env.REACT_APP_API_URL;
  
  if (url) {
    url = url.trim().replace(/\/$/, ""); 
    // Ensure protocol is present
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Default to https for production-like domains
      const protocol = (url.includes('localhost') || url.includes('127.0.0.1')) ? 'http://' : 'https://';
      url = protocol + url;
    }
    return url;
  }
  
  // Fallback for local development
  return `http://${window.location.hostname}:8000`;
};

export const API_BASE = getApiBase();

console.log("[CONFIG] API Base URL initialized as:", API_BASE);
