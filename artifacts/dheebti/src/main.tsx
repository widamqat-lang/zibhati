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
      
      // Register Firebase Messaging SW
      const fcmSW = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('[FCM SW] Registered:', fcmSW.scope);
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
