import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Suppress transient Axios "Network Error" from triggering the React dev error overlay.
// These occur during backend hot-reload cycles (uvicorn --reload) and are safely caught
// by individual component try/catch blocks. Without this handler, the CRA overlay
// intercepts the unhandled rejection before Axios can propagate it to .catch().
window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason;
  if (err?.isAxiosError && err?.message === 'Network Error') {
    event.preventDefault(); // Suppress the CRA error overlay
    console.warn('[Network] Transient network error suppressed:', err.config?.url);
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
