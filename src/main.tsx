import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './pwaRegistration';

// Safe Progressive Web App service worker initialization
registerServiceWorker();

// Catch development-only HMR WebSocket closures to prevent unhandled promise rejections
if (import.meta.env.DEV) {
  window.addEventListener('unhandledrejection', (event) => {
    const errorMsg = event.reason?.message || String(event.reason || '');
    if (
      errorMsg.includes('WebSocket closed without') ||
      errorMsg.includes('vite:ws:disconnect')
    ) {
      event.preventDefault();
      console.warn('[vite] Dev HMR WebSocket disconnected cleanly:', errorMsg);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
