// ============================================
// SERVICE WORKER - CICI PWA/TWA
// Versão: 2.0.0
// Desenvolvido por AmplaAI
// Play Store Ready
// ============================================

const APP_VERSION = '2.0.0';
const CACHE_NAME = `cici-app-v${APP_VERSION}`;
const RUNTIME_CACHE = 'cici-runtime-v1';
const OFFLINE_CACHE = 'cici-offline-v1';

// Recursos para cache inicial (app shell)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/offline.html',
  '/css/app.css',
  '/js/app.js'
];

// Recursos para cache dinâmico (API responses, etc.)
const DYNAMIC_CACHE_URLS = [
  '/api/config',
  '/api/user/profile',
  '/images/logo.svg'
];

// Domínios externos para cache (opcional)
const EXTERNAL_CACHE = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdn.jsdelivr.net'
];

// ============================================
// CONFIGURAÇÕES DO APP
// ============================================
const APP_CONFIG = {
  name: 'Cici - AmplaAI',
  short_name: 'Cici',
  theme_color: '#4F46E5',
  background_color: '#FFFFFF',
  display: 'standalone',
  orientation: 'portrait',
  scope: '/',
  start_url: '/'
};

// ============================================
// INSTALAÇÃO DO SERVICE WORKER
// ============================================
self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Instalando Cici v${APP_VERSION}`);
  
  self.skipWaiting();
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('[Service Worker] Cacheando app shell');
          return cache.addAll(PRECACHE_URLS);
        }),
      caches.open(OFFLINE_CACHE)
        .then(cache => {
          console.log('[Service Worker] Cacheando recursos offline');
          return cache.addAll([
            '/offline.html',
            '/css/offline.css',
            '/icons/icon-192x192.png'
          ]);
        })
    ])
    .then(() => {
      console.log('[Service Worker] Instalação completa');
      return self.skipWaiting();
    })
    .catch(error => {
      console.error('[Service Worker] Erro na instalação:', error);
    })
  );
});

// ============================================
// ATIVAÇÃO E LIMPEZA
// ============================================
self.addEventListener('activate', (event) => {
  console.log(`[Service Worker] Ativando Cici v${APP_VERSION}`);
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (![CACHE_NAME, RUNTIME_CACHE, OFFLINE_CACHE].includes(cacheName)) {
              console.log('[Service Worker] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim clients
      self.clients.claim(),
      
      // Registrar periodic sync se suportado
      registerPeriodicSync(),
      
      // Verificar atualizações
      checkForUpdates()
    ])
    .then(() => {
      console.log('[Service Worker] Ativação completa');
      sendMessageToAllClients({ type: 'APP_UPDATED', version: APP_VERSION });
    })
  );
});

// ============================================
// ESTRATÉGIA DE CACHE AVANÇADA
// ============================================
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // Estratégias diferentes para diferentes tipos de recursos
  if (isAppShellRequest(event.request)) {
    event.respondWith(cacheFirstStrategy(event));
  } else if (isAPIRequest(event.request)) {
    event.respondWith(networkFirstStrategy(event));
  } else if (isExternalResource(event.request)) {
    event.respondWith(staleWhileRevalidateStrategy(event));
  } else {
    event.respondWith(networkFirstStrategy(event));
  }
});

// ============================================
// ESTRATÉGIAS DE CACHE
// ============================================
async function cacheFirstStrategy(event) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(event.request);
  
  if (cachedResponse) {
    // Atualizar em background
    fetchAndCache(event.request, cache);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(event.request);
    if (networkResponse.ok) {
      cache.put(event.request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return offlineFallback();
  }
}

async function networkFirstStrategy(event) {
  try {
    const networkResponse = await fetch(event.request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(event.request, networkResponse.clone());
      
      // Pré-cache recursos relacionados se for API
      if (isAPIRequest(event.request)) {
        preCacheRelatedResources(networkResponse.clone());
      }
      
      return networkResponse;
    }
    throw new Error('Network response not OK');
  } catch (error) {
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) return cachedResponse;
    
    // Fallback específico para APIs
    if (isAPIRequest(event.request)) {
      return new Response(JSON.stringify({
        error: 'offline',
        message: 'Você está offline. Tente novamente quando estiver conectado.',
        timestamp: Date.now()
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return offlineFallback();
  }
}

async function staleWhileRevalidateStrategy(event) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(event.request);
  
  const fetchPromise = fetch(event.request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse || networkResponse);
  
  return cachedResponse ? cachedResponse : await fetchPromise;
}

// ============================================
// NOTIFICAÇÕES PUSH AVANÇADAS
// ============================================
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Cici - AmplaAI',
      body: event.data.text() || 'Nova mensagem!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png'
    };
  }

  const options = {
    body: data.body || 'Nova notificação',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      id: data.id || Math.random().toString(36).substr(2, 9)
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icons/open-72x72.png'
      },
      {
        action: 'dismiss',
        title: 'Fechar',
        icon: '/icons/close-72x72.png'
      }
    ],
    tag: 'cici-notification',
    requireInteraction: false,
    silent: false,
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Cici', options)
  );
});

// ============================================
// HANDLERS DE NOTIFICAÇÃO
// ============================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // Verificar se já existe uma janela aberta
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Se não existir, abrir nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  // Log analytics para notificação fechada
  console.log('[Service Worker] Notificação fechada:', event.notification.data.id);
});

// ============================================
// BACKGROUND SYNC
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Sync:', event.tag);

  switch (event.tag) {
    case 'sync-messages':
      event.waitUntil(syncMessages());
      break;
    case 'sync-data':
      event.waitUntil(syncUserData());
      break;
    case 'sync-analytics':
      event.waitUntil(syncAnalytics());
      break;
  }
});

async function syncMessages() {
  const db = await openMessageDB();
  const pending = await getAllPendingMessages(db);
  
  for (const message of pending) {
    try {
      await sendMessageToAPI(message);
      await markMessageAsSent(db, message.id);
    } catch (error) {
      console.error('[Service Worker] Erro ao sincronizar mensagem:', error);
    }
  }
}

// ============================================
// PERIODIC BACKGROUND SYNC
// ============================================
async function registerPeriodicSync() {
  if ('periodicSync' in self.registration) {
    try {
      await self.registration.periodicSync.register('update-content', {
        minInterval: 24 * 60 * 60 * 1000 // 24 horas
      });
      console.log('[Service Worker] Periodic Sync registrado');
    } catch (error) {
      console.warn('[Service Worker] Periodic Sync não suportado:', error);
    }
  }
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  try {
    // Atualizar dados do app
    const responses = await Promise.allSettled([
      fetch('/api/content/latest').then(r => r.json()),
      fetch('/api/config').then(r => r.json()),
      fetch('/api/notifications').then(r => r.json())
    ]);

    // Cachear respostas
    const cache = await caches.open(RUNTIME_CACHE);
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled') {
        const urls = ['/api/content/latest', '/api/config', '/api/notifications'];
        cache.put(urls[index], new Response(JSON.stringify(response.value)));
      }
    });

    // Enviar notificação se houver novo conteúdo
    const content = responses[0];
    if (content.status === 'fulfilled' && content.value.hasNewContent) {
      await self.registration.showNotification('Cici - Novo Conteúdo', {
        body: 'Temos novas atualizações para você!',
        icon: '/icons/icon-192x192.png',
        tag: 'content-update'
      });
    }

  } catch (error) {
    console.error('[Service Worker] Erro ao atualizar conteúdo:', error);
  }
}

// ============================================
// GERENCIAMENTO DE ATUALIZAÇÕES
// ============================================
async function checkForUpdates() {
  try {
    const response = await fetch('/version.json?' + Date.now());
    const data = await response.json();
    
    if (data.version !== APP_VERSION) {
      console.log('[Service Worker] Nova versão disponível:', data.version);
      
      // Notificar clientes sobre atualização
      sendMessageToAllClients({
        type: 'UPDATE_AVAILABLE',
        version: data.version,
        changelog: data.changelog
      });
      
      // Pré-cachear nova versão
      await preCacheNewVersion(data);
    }
  } catch (error) {
    console.log('[Service Worker] Não foi possível verificar atualizações');
  }
}

// ============================================
// BACKGROUND FETCH (downloads grandes)
// ============================================
self.addEventListener('backgroundfetchsuccess', (event) => {
  console.log('[Service Worker] Background Fetch completo:', event.registration.id);
  
  event.updateUI({ title: 'Download completo!' });
  
  event.waitUntil(
    (async () => {
      const records = await event.registration.matchAll();
      const cache = await caches.open('background-fetch');
      
      for (const record of records) {
        const response = await record.responseReady;
        await cache.put(record.request, response);
      }
    })()
  );
});

self.addEventListener('backgroundfetchfail', (event) => {
  console.log('[Service Worker] Background Fetch falhou:', event.registration.id);
  event.updateUI({ title: 'Download falhou. Tente novamente.' });
});

// ============================================
// MENSAGENS DO CLIENTE
// ============================================
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Mensagem do cliente:', event.data);

  switch (event.data?.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo().then(info => {
        event.ports[0].postMessage(info);
      });
      break;
      
    case 'CHECK_UPDATE':
      checkForUpdates();
      break;
      
    case 'FORCE_UPDATE':
      forceUpdate();
      break;
      
    case 'SETTINGS_CHANGED':
      updateServiceWorkerSettings(event.data.settings);
      break;
  }
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
function isAppShellRequest(request) {
  const url = new URL(request.url);
  return PRECACHE_URLS.some(precacheUrl => 
    url.pathname === new URL(precacheUrl, self.location).pathname
  );
}

function isAPIRequest(request) {
  return request.url.includes('/api/') || 
         request.headers.get('Content-Type')?.includes('application/json');
}

function isExternalResource(request) {
  const url = new URL(request.url);
  return url.origin !== self.location.origin && 
         EXTERNAL_CACHE.some(domain => url.href.includes(domain));
}

async function offlineFallback() {
  const cache = await caches.open(OFFLINE_CACHE);
  const fallback = await cache.match('/offline.html');
  return fallback || new Response('Offline', { status: 503 });
}

async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
  } catch (error) {
    // Silenciar erro - já temos cache
  }
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[Service Worker] Todos os caches limpos');
}

async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    info[name] = requests.length;
  }
  
  return info;
}

async function sendMessageToAllClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// ============================================
// INDEXEDDB PARA DADOS OFFLINE
// ============================================
function openMessageDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cici-messages', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending')) {
        const store = db.createObjectStore('pending', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// ============================================
// LOG INICIAL
// ============================================
console.log(`
╔══════════════════════════════════════════════════════════╗
║               Service Worker Cici v${APP_VERSION}                ║
║                   Play Store Ready                        ║
║                                                        ║
║  ✅ Cache Estratégico      ✅ Notificações Push         ║
║  ✅ Background Sync        ✅ Offline First             ║
║  ✅ Auto-Update            ✅ Analytics                 ║
║                                                        ║
║        Desenvolvido com 💜 por AmplaAI                ║
╚══════════════════════════════════════════════════════════╝
`);

// ============================================
// MANIFEST DINÂMICO (opcional)
// ============================================
self.addEventListener('fetch', (event) => {
  if (event.request.url.endsWith('/manifest.json')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        
        if (cached) {
          const manifest = await cached.json();
          manifest.version = APP_VERSION;
          manifest.theme_color = APP_CONFIG.theme_color;
          
          return new Response(JSON.stringify(manifest), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return fetch(event.request);
      })()
    );
  }
});