import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Register main SW for PWA
      const swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('[SW] Registered:', swRegistration.scope);
      
      // Request notification permission after SW is ready
      if ('Notification' in window && Notification.permission === 'default') {
        // Don't auto-request, let the modal handle it
      }
    } catch (error) {
      console.error('[SW] Registration failed:', error);
    }
  });
  
  // Listen for messages from Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
  });
}

createRoot(document.getElementById('root')!).render(<App />);
