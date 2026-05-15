importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyCPSsxifbE92WqEa2VsGdSqaJIRTPkZiLQ",
  authDomain:        "exglobal21.firebaseapp.com",
  projectId:         "exglobal21",
  storageBucket:     "exglobal21.firebasestorage.app",
  messagingSenderId: "461652919348",
  appId:             "1:461652919348:web:08b88b4ebc0bd893d73661"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const n = payload.notification || {};
  self.registration.showNotification(n.title || 'EX GLOBAL', {
    body:  n.body  || '',
    icon:  n.icon  || '/logo.png',
    badge: '/logo.png',
    tag:   'exglobal-push'
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const open = list.find(c => c.url.includes('exglobal.online') || c.url.includes('exrabbi.github.io'));
      return open ? open.focus() : clients.openWindow('/');
    })
  );
});
