const CACHE_NAME = 'livia-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://i.imgur.com/ZN77gnE.png'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});

// Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Sincronizar mensagens offline
  const messages = await getOfflineMessages();
  
  for (const message of messages) {
    try {
      await sendMessageToServer(message);
      await deleteOfflineMessage(message.id);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    }
  }
}

// Push Notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: 'https://i.imgur.com/ZN77gnE.png',
    badge: 'https://i.imgur.com/ZN77gnE.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'respond',
        title: 'Responder',
        icon: 'https://i.imgur.com/ZN77gnE.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: 'https://i.imgur.com/ZN77gnE.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Valora', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'respond') {
    clients.openWindow('/?respond=true');
  } else {
    clients.openWindow('/');
  }
});