// ============================================================================
// SENA - Service Worker v3.0
// Gerencia cache e funcionalidade offline
// ============================================================================

const CACHE_NAME = 'sena-v3.0';
const RUNTIME_CACHE = 'sena-runtime-v3.0';

// Recursos essenciais para cache
const ESSENTIAL_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://i.imgur.com/5watJQF.png'
];

// Recursos da API que NÃO devem ser cacheados
const NO_CACHE_URLS = [
  'api.mistral.ai',
  'clarity.ms'
];

// ============================================================================
// INSTALAÇÃO
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('✓ Service Worker: Instalando...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✓ Service Worker: Cache aberto');
        return cache.addAll(ESSENTIAL_RESOURCES);
      })
      .then(() => {
        console.log('✓ Service Worker: Recursos essenciais cacheados');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('✗ Service Worker: Erro ao instalar', error);
      })
  );
});

// ============================================================================
// ATIVAÇÃO
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('✓ Service Worker: Ativando...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('✓ Service Worker: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✓ Service Worker: Ativado');
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

  // Estratégia: Network First, com fallback para Cache
  if (request.method === 'GET') {
    event.respondWith(networkFirstStrategy(request));
  }
});

// ============================================================================
// ESTRATÉGIAS DE CACHE
// ============================================================================

/**
 * Network First: Tenta buscar da rede primeiro, depois do cache
 */
async function networkFirstStrategy(request) {
  try {
    // Tentar buscar da rede
    const networkResponse = await fetch(request);

    // Se sucesso, atualizar cache
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Se falhar, tentar buscar do cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('✓ Service Worker: Servindo do cache:', request.url);
      return cachedResponse;
    }

    // Se não houver cache, retornar página offline
    if (request.destination === 'document') {
      return caches.match('/');
    }

    throw error;
  }
}

/**
 * Cache First: Busca do cache primeiro, depois da rede
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('✗ Service Worker: Erro ao buscar:', error);
    throw error;
  }
}

/**
 * Verifica se URL não deve ser cacheada
 */
function shouldNotCache(url) {
  return NO_CACHE_URLS.some(domain => url.hostname.includes(domain));
}

// ============================================================================
// MENSAGENS
// ============================================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// ============================================================================
// SYNC - SINCRONIZAÇÃO EM BACKGROUND
// ============================================================================
self.addEventListener('sync', (event) => {
  console.log('✓ Service Worker: Sincronizando...');

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  try {
    // Implementar lógica de sincronização se necessário
    console.log('✓ Service Worker: Mensagens sincronizadas');
  } catch (error) {
    console.error('✗ Service Worker: Erro ao sincronizar', error);
  }
}

// ============================================================================
// NOTIFICAÇÕES PUSH
// ============================================================================
self.addEventListener('push', (event) => {
  console.log('✓ Service Worker: Push recebido');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'SENA';
  const options = {
    body: data.body || 'Nova mensagem da SENA',
    icon: 'https://i.imgur.com/5watJQF.png',
    badge: 'https://i.imgur.com/5watJQF.png',
    vibrate: [200, 100, 200],
    tag: 'sena-notification',
    requireInteraction: false,
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('✓ Service Worker: Notificação clicada');

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já houver uma janela aberta, focar nela
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
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
    console.log('✓ Service Worker: Verificando atualizações...');
    // Implementar lógica de verificação de updates
  } catch (error) {
    console.error('✗ Service Worker: Erro ao verificar atualizações', error);
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================
self.addEventListener('error', (event) => {
  console.error('✗ Service Worker: Erro global', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('✗ Service Worker: Promise rejeitada', event.reason);
});

console.log('✓ Service Worker: Script carregado');