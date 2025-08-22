// service-worker.js

const CACHE_NAME = 'sophia-v11-cache';
const FILES_TO_CACHE = [
  '/',
  'index.html',
  // Adicione aqui os caminhos para seus ícones
  'icon-192x192.png',
  'icon-512x512.png',
  'maskable-icon.png',
  // Adicione aqui outros recursos estáticos que você queira que funcionem offline
  // Por exemplo, se você tivesse um arquivo style.css separado:
  // 'style.css' 
];

// Evento de Instalação: Salva os arquivos essenciais no cache.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Colocando arquivos essenciais no cache');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Evento de Ativação: Limpa caches antigos.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removendo cache antigo', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Evento de Fetch: Intercepta as requisições de rede.
// Estratégia: "Cache first" - Tenta pegar do cache primeiro. Se falhar, vai para a rede.
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET (como as de APIs)
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request)
        .then((response) => {
          // Se encontrar no cache, retorna do cache.
          // Se não, vai para a rede, pega o recurso, salva no cache e retorna.
          return response || fetch(event.request).then((fetchResponse) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
    })
  );
});
