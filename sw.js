// ============================================
// SERVICE WORKER - SION PWA
// Desenvolvido por AmplaAI
// ============================================

const CACHE_NAME = 'cici-v1.0.0';
const RUNTIME_CACHE = 'cici-runtime';

// Recursos para cache inicial
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  'https://i.imgur.com/z2hCety.jpeg',
  'https://unpkg.com/lucide@latest'
];

// ============================================
// INSTALAÇÃO DO SERVICE WORKER
// ============================================
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache aberto');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error('[Service Worker] Erro ao cachear recursos:', error);
      })
  );
});

// ============================================
// ATIVAÇÃO E LIMPEZA DE CACHES ANTIGOS
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
      })
      .then(cachesToDelete => {
        return Promise.all(
          cachesToDelete.map(cacheToDelete => {
            console.log('[Service Worker] Deletando cache antigo:', cacheToDelete);
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ============================================
// ESTRATÉGIA DE CACHE - NETWORK FIRST
// ============================================
self.addEventListener('fetch', (event) => {
  // Pular requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Pular APIs externas (DeepSeek, Mistral, Google Ads, Clarity)
  const skipCacheUrls = [
    'deepseek.com',
    'mistral.ai',
    'googlesyndication.com',
    'googleadservices.com',
    'doubleclick.net',
    'clarity.ms',
    'google-analytics.com'
  ];

  if (skipCacheUrls.some(url => event.request.url.includes(url))) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Se houver cache, retornar e atualizar em background
        if (cachedResponse) {
          // Atualizar cache em background
          fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                caches.open(RUNTIME_CACHE).then(cache => {
                  cache.put(event.request, response.clone());
                });
              }
            })
            .catch(() => {
              // Falhou ao atualizar, mas já temos cache
            });
          
          return cachedResponse;
        }

        // Se não houver cache, buscar da rede e cachear
        return fetch(event.request)
          .then(response => {
            // Verificar se é uma resposta válida
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clonar resposta
            const responseToCache = response.clone();

            caches.open(RUNTIME_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Se falhar, tentar retornar página offline
            return caches.match('/index.html');
          });
      })
  );
});

// ============================================
// SINCRONIZAÇÃO EM BACKGROUND
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sincronização em background:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  console.log('[Service Worker] Sincronizando mensagens...');

  try {
    const pendingMessages = await getPendingMessages(); // busca no IndexedDB

    if (!pendingMessages.length) {
      console.log('[Service Worker] Nenhuma mensagem pendente.');
      return;
    }

    for (const msg of pendingMessages) {
      const sent = await sendMessageToAPI(msg);

      if (sent) {
        await deletePendingMessage(msg.id); 
        console.log('[Service Worker] Mensagem sincronizada e removida:', msg.id);
      } else {
        console.log('[Service Worker] Falha ao enviar mensagem:', msg.id);
      }
    }

  } catch (err) {
    console.error('[Service Worker] Erro ao sincronizar mensagens:', err);
  }
}

// ============================================
// NOTIFICAÇÕES PUSH
// ============================================
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Notificação push recebida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova mensagem da Cici!',
    icon: 'https://i.imgur.com/z2hCety.png',
    badge: 'https://i.imgur.com/z2hCety.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: 'https://i.imgur.com/z2hCety.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: 'https://i.imgur.com/z2hCety.png'
      }
    ],
    tag: 'sion-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Cici - AmplaAI', options)
  );
});

// ============================================
// CLIQUE EM NOTIFICAÇÃO
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Clique na notificação:', event.action);
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// ============================================
// MENSAGENS DO CLIENTE
// ============================================
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

// ============================================
// BACKGROUND FETCH (para downloads grandes)
// ============================================
self.addEventListener('backgroundfetchsuccess', (event) => {
  console.log('[Service Worker] Background fetch bem-sucedido:', event.registration.id);
});

self.addEventListener('backgroundfetchfail', (event) => {
  console.log('[Service Worker] Background fetch falhou:', event.registration.id);
});

// ============================================
// PERIODIC SYNC (sincronização periódica)
// ============================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  console.log('[Service Worker] Atualizando conteúdo...');
  // ============================================
// PERIODIC SYNC (sincronização periódica)
// ============================================

self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  console.log('[Service Worker] Atualizando conteúdo...');

  try {
 const apiKey = 'GuhXW35v32u4idYAyhxV9yhdIdRMigJb'; // pleaase não deixe isso aqui na versão final
    const endpoint = 'https://api.mistral.ai/v1/chat/completions';

    const body = {
      model: 'mistral-large-latest', // ou o modelo que você quiser
      messages: [
        { role: 'system', content: 'Você é a Cici, uma IA fofinha.' },
        { role: 'user', content: 'Atualize o conteúdo para sincronização.' }
      ]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    }):
    const response = await fetch('/api/cici/atualizar');

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados (${response.status})`);
    }

    const data = await response.json();

    // Salvando no cache (opcional mas recomendável)
    const cache = await caches.open('cici-cache-v1');
    await cache.put('/cici-data.json', new Response(JSON.stringify(data)));

    console.log('[Service Worker] Conteúdo atualizado com sucesso.');

  } catch (error) {
    console.error('[Service Worker] Erro ao atualizar conteúdo:', error);
  }
}
}

// ============================================
// LOG DE VERSÃO
// ============================================
console.log(`
╔═══════════════════════════════════════╗
║   Service Worker Cici v1.0.0         ║
║   Desenvolvido por AmplaAI 💜        ║
╚═══════════════════════════════════════╝
`);
