// ============================================================================
// 🧠 SION - Service Worker v4.0
// Gerencia cache, modo offline e atualizações automáticas
// ============================================================================

const CACHE_NAME = 'sion-v4.0';
const RUNTIME_CACHE = 'sion-runtime-v4.0';

// Recursos essenciais para cache
const ESSENTIAL_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/style.css',
  '/app.js',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://i.imgur.com/EMs0V3G.png'
];

// Recursos da API que NÃO devem ser cacheados
const NO_CACHE_URLS = ['api.mistral.ai', 'api.openai.com', 'clarity.ms'];

// ============================================================================
// INSTALAÇÃO
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('⚙️ Sion: Instalando Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ESSENTIAL_RESOURCES))
      .then(() => self.skipWaiting())
      .catch((error) => console.error('❌ Sion: Erro ao instalar', error))
  );
});

// ============================================================================
// ATIVAÇÃO
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('⚙️ Sion: Ativando e limpando caches antigos...');

  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== RUNTIME_CACHE) {
            console.log('🧹 Sion: Removendo cache antigo:', name);
            return caches.delete(name);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ============================================================================
// FETCH - NETWORK FIRST
// ============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (shouldNotCache(url)) return event.respondWith(fetch(request));

  if (request.method === 'GET') {
    event.respondWith(networkFirstStrategy(request));
  }
});

// ============================================================================
// FUNÇÕES DE CACHE
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
    if (cachedResponse) return cachedResponse;
    if (request.destination === 'document') return caches.match('/');
    throw error;
  }
}

function shouldNotCache(url) {
  return NO_CACHE_URLS.some(domain => url.hostname.includes(domain));
}

// ============================================================================
// MENSAGENS DO CLIENTE
// ============================================================================
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      clearAllCaches(event);
      break;

    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;

    case 'CHECK_UPDATES':
      checkForUpdates(true);
      break;
  }
});

async function clearAllCaches(event) {
  await caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
  event.ports[0].postMessage({ success: true });
}

// ============================================================================
// AUTO-UPDATE E DETECÇÃO DE NOVA VERSÃO
// ============================================================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-check') {
    event.waitUntil(checkForUpdates());
  }
});

async function checkForUpdates(showNotification = false) {
  try {
    const registration = await self.registration.update();

    if (registration.waiting) {
      console.log('🔁 Sion: Nova versão detectada!');
      if (showNotification) {
        registration.showNotification('Atualização disponível 🚀', {
          body: 'Uma nova versão do Sion está pronta. Clique para atualizar.',
          icon: 'https://i.imgur.com/EMs0V3G.png',
          badge: 'https://i.imgur.com/EMs0V3G.png',
          vibrate: [100, 50, 100],
          tag: 'sion-update',
        });
      }
    }
  } catch (err) {
    console.error('❌ Sion: Erro ao verificar atualizações', err);
  }
}

// ============================================================================
// CLIQUE NA NOTIFICAÇÃO DE UPDATE
// ============================================================================
self.addEventListener('notificationclick', (event) => {
  const tag = event.notification.tag;
  event.notification.close();

  if (tag === 'sion-update') {
    event.waitUntil(
      self.skipWaiting().then(() =>
        clients.matchAll({ type: 'window', includeUncontrolled: true })
          .then((clientList) => {
            clientList.forEach((client) => client.navigate(client.url));
          })
      )
    );
  }
});

// ============================================================================
// NOTIFICAÇÕES PUSH (Mensagens gerais)
// ============================================================================
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Sion';
  const options = {
    body: data.body || 'Nova atualização disponível.',
    icon: 'https://i.imgur.com/EMs0V3G.png',
    badge: 'https://i.imgur.com/EMs0V3G.png',
    vibrate: [200, 100, 200],
    tag: 'sion-general',
    data
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ============================================================================
// ERROS GLOBAIS
// ============================================================================
self.addEventListener('error', (event) => {
  console.error('❌ Sion: Erro global', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('⚠️ Sion: Promise rejeitada', event.reason);
});

console.log('🧠 Sion Service Worker v4.0 carregado com suporte a auto-update!');