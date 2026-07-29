// Firebase Messaging Service Worker
// This file must be at the root of the public folder

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Firebase configuration
firebase.initializeApp({
  apiKey: "AIzaSyA-pEBojzKelfbwKRWaaVNrnvFsosJ4fLQ",
  authDomain: "mawashi-bh.firebaseapp.com",
  projectId: "mawashi-bh",
  storageBucket: "mawashi-bh.firebasestorage.app",
  messagingSenderId: "318610579508",
  appId: "1:318610579508:web:a74494672650bf116f2a61"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'طلب جديد!';
  const notificationOptions = {
    body: payload.notification?.body || 'لديك طلب جديد في المتجر',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'mawashi-notification',
    renotify: true,
    requireInteraction: true,
    data: payload.data,
    dir: 'rtl',
    lang: 'ar',
    actions: [
      { action: 'view', title: 'عرض الطلب' },
      { action: 'dismiss', title: 'تجاهل' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Notification click:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/admin/orders')
    );
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If there's already a window open, focus it
        for (const client of clientList) {
          if (client.url.includes('/admin') && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow('/admin');
        }
      })
    );
  }
});
