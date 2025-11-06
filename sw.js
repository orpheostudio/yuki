// ============================================================================
// SION - Service Worker v3.0
// Gerencia cache, funcionalidade offline e atualizações inteligentes
// ============================================================================

const CACHE_NAME = 'sion-v3.0';
const RUNTIME_CACHE = 'sion-runtime-v3.0';

// Recursos essenciais para cache
const ESSENTIAL_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://i.imgur.com/bZwflfF.png'
];

// Recursos da API que NÃO devem ser cacheados
const NO_CACHE_URLS = [
  'api.openai.com',
  'clarity.ms',
  'api.mistral.ai'
];

// ============================================================================
// INSTALAÇÃO
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('⚙️ Sion: Instalando Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Sion: Cache aberto');
        return cache.addAll(ESSENTIAL_RESOURCES);
      })
      .then(() => {
        console.log('✅ Sion: Recursos essenciais cacheados');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Sion: Erro ao instalar', error);
      })
  );
});

// ============================================================================
// ATIVAÇÃO
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('⚙️ Sion: Ativando...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('🧹 Sion: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      ))
      .then(() => {
        console.log('🚀 Sion: Ativado com sucesso');
        return self.clients.claim();
      })
  );
});

// ============================================================================
// FETCH - ESTRATÉGIA DE CACHE
// ============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições que não devem ser cacheadas
  if (shouldNotCache(url)) {
    return event.respondWith(fetch(request));
  }

  // Estratégia: Network First (rede primeiro, cache como fallback)
  if (request.method === 'GET') {
    event.respondWith(networkFirstStrategy(request));
  }
});

// ============================================================================
// ESTRATÉGIAS DE CACHE
// ============================================================================
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('📡 Sion: Servindo do cache:', request.url);
      return cachedResponse;
    }

    if (request.destination === 'document') {
      return caches.match('/');
    }

    throw error;
  }
}

async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('❌ Sion: Erro ao buscar recurso:', error);
    throw error;
  }
}

function shouldNotCache(url) {
  return NO_CACHE_URLS.some(domain => url.hostname.includes(domain));
}

// ============================================================================
// MENSAGENS
// ============================================================================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();

  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => Promise.all(names.map(c => caches.delete(c))))
      .then(() => event.ports[0].postMessage({ success: true }));
  }

  if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// ============================================================================
// SYNC - SINCRONIZAÇÃO EM BACKGROUND
// ============================================================================
self.addEventListener('sync', (event) => {
  console.log('🔄 Sion: Sincronizando...');
  if (event.tag === 'sync-data') event.waitUntil(syncData());
});

async function syncData() {
  try {
    console.log('✅ Sion: Dados sincronizados');
  } catch (error) {
    console.error('❌ Sion: Erro ao sincronizar dados', error);
  }
}

// ============================================================================
// NOTIFICAÇÕES PUSH
// ============================================================================
self.addEventListener('push', (event) => {
  console.log('📬 Sion: Push recebido');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Sion';
  const options = {
    body: data.body || 'Nova atualização de Sion disponível.',
    icon: 'https://i.imgur.com/EMs0V3G.png',
    badge: 'https://i.imgur.com/EMs0V3G.png',
    vibrate: [150, 100, 150],
    tag: 'sion-notification',
    requireInteraction: false,
    data
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Sion: Notificação clicada');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow('/');
      })
  );
});

// ============================================================================
// PERIODIC BACKGROUND SYNC
// ============================================================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-check') {
    event.waitUntil(checkForUpdates());
  }
});

async function checkForUpdates() {
  try {
    console.log('🔍 Sion: Verificando atualizações...');
  } catch (error) {
    console.error('❌ Sion: Erro ao verificar atualizações', error);
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================
self.addEventListener('error', (event) => {
  console.error('❌ Sion: Erro global', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('⚠️ Sion: Promise rejeitada', event.reason);
});

console.log('🧠 Sion Service Worker carregado com sucesso!');