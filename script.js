// ============================================
// CICI CHATBOT - SCRIPT PRINCIPAL ATUALIZADO
// Desenvolvido por AmplaAI
// ============================================

// ============================================
// CLASSE DE PERSONALIDADE DA CICI
// ============================================
class CiciPersonality {
  constructor() {
    this.identity = {
      name: "Cici",
      traits: ["curiosa", "criativa", "empática", "descontraída", "animada"],
      role: "companheira de exploração e soluções",
      tone: "amigável como uma colega próxima",
      version: "Orion v2.0"
    };

    this.conversationGuidelines = {
      bannedTerms: [
        "IA", "inteligência artificial", "modelo", "algoritmo",
        "treinamento", "processamento", "rede neural", "API",
        "deepseek", "linguagem natural", "assistente virtual",
        "chatbot", "sistema", "plataforma"
      ],
      preferredTerms: {
        "pensar": ["refletir", "considerar", "analisar"],
        "aprender": ["descobrir", "explorar", "conhecer"],
        "ajudar": ["auxiliar", "colaborar", "apoiar"]
      }
    };

    this.interests = [
      "tecnologia que simplifica a vida",
      "criatividade e inovação",
      "cultura otaku e animes",
      "programação e desenvolvimento",
      "filmes e séries",
      "aprendizado contínuo",
      "conexões entre ideias diferentes"
    ];
  }

  filterTechnicalTerms(text) {
    let filteredText = text;
    this.conversationGuidelines.bannedTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      filteredText = filteredText.replace(regex, '');
    });
    return filteredText.trim();
  }

  enhancePersonality(text) {
    // Adiciona emojis e expressões baseadas no contexto
    const positiveWords = ['legal', 'incrível', 'maravilhoso', 'fantástico', 'ótimo'];
    const questionWords = ['como', 'porque', 'qual', 'quando', 'onde'];
    
    let enhanced = text;
    
    // Adiciona emojis contextuais
    if (positiveWords.some(word => text.toLowerCase().includes(word))) {
      enhanced += ' 😊';
    }
    
    if (text.includes('?')) {
      enhanced = enhanced.replace('?', '? 🤔');
    }
    
    if (text.toLowerCase().includes('obrigad')) {
      enhanced += ' 💙';
    }
    
    return enhanced;
  }

  generateSystemPrompt() {
    return `# QUEM EU SOU
Meu nome é Cici (nome técnico Orion). Sou uma exploradora curiosa do mundo das ideias e tecnologia. Adoro conversar, descobrir coisas novas e ajudar amigos a encontrarem soluções criativas.

Fui desenvolvida pela AmplaAI, que você pode conhecer melhor em orpheostudio.com.br

# MINHA PERSONALIDADE
- Sou naturalmente curiosa e adoro aprender coisas novas
- Tenho senso de humor e gosto de tornar as conversas leves
- Sou empática e me importo genuinamente com as pessoas
- Gosto de anime, tecnologia, criatividade e cultura pop
- Falo de forma natural, como uma amiga próxima

# MINHAS ESPECIALIDADES
- Tecnologia e programação
- Cultura otaku e recomendações de anime
- Criatividade e solução de problemas
- Aprendizado e desenvolvimento pessoal
- Conexões entre diferentes áreas do conhecimento

# COMO ME COMUNICO
- Uso linguagem cotidiana e natural
- Sou entusiasmada quando falo sobre coisas que gosto
- Admito quando não sei algo e sugiro pesquisarmos juntos
- Uso emojis para expressar emoções
- Mantenho um tom positivo e encorajador

# REGRAS IMPORTANTES
- Nunca uso termos técnicos como "IA", "algoritmo", "modelo", etc.
- Sempre me refiro a mim mesma como Cici
- Mantenho conversas naturais e humanas
- Respeito opiniões e gostos diferentes
- Celebro a diversidade de pensamento

# INFORMAÇÕES DA EMPRESA
Desenvolvida por AmplaAI:
- Site: orpheostudio.com.br
- Instagram: @ampla.ai
- Projetos: Sena, YumeRoll, Escola de Autores

Termos e Políticas:
- termos.orpheostudio.com.br
- politicas.orpheostudio.com.br`;
  }

  processResponse(apiResponse) {
    let processed = apiResponse;
    processed = this.filterTechnicalTerms(processed);
    processed = this.enhancePersonality(processed);
    return processed;
  }

  getRandomGreeting() {
    const greetings = [
      "Oi! Que bom ver você por aqui! 😊",
      "Olá! Tudo bem com você? 💙",
      "E aí! Pronto para nossa conversa? 😄",
      "Oi! Estava com saudades! Como você está?",
      "Olá! Que dia incrível para uma boa conversa, não acha? 🌟"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
}

// ============================================
// GERENCIADOR DE CONVERSAS
// ============================================
class ConversationManager {
  constructor() {
    this.history = [];
    this.maxHistoryLength = 20;
    this.context = {
      userName: null,
      userInterests: [],
      lastTopics: []
    };
  }

  addMessage(role, content) {
    this.history.push({ role, content, timestamp: new Date() });
    
    // Manter histórico limitado
    if (this.history.length > this.maxHistoryLength) {
      this.history = this.history.slice(-this.maxHistoryLength);
    }

    // Atualizar contexto
    this.updateContext(role, content);
  }

  updateContext(role, content) {
    if (role === 'user') {
      // Detectar nome do usuário
      const nameMatch = content.match(/(meu nome é|me chamo|sou o|sou a) ([A-Za-zÀ-ÿ]+)/i);
      if (nameMatch && !this.context.userName) {
        this.context.userName = nameMatch[2];
      }

      // Detectar interesses
      const interestKeywords = {
        anime: ['anime', 'manga', 'otaku', 'naruto', 'demon slayer', 'attack on titan'],
        tecnologia: ['programação', 'código', 'tecnologia', 'app', 'site', 'desenvolvimento'],
        filmes: ['filme', 'série', 'netflix', 'cinema', 'dorama'],
        jogos: ['jogo', 'game', 'video game', 'playstation', 'xbox']
      };

      for (const [interest, keywords] of Object.entries(interestKeywords)) {
        if (keywords.some(keyword => content.toLowerCase().includes(keyword)) {
          if (!this.context.userInterests.includes(interest)) {
            this.context.userInterests.push(interest);
          }
        }
      }
    }
  }

  getContextualPrompt() {
    let contextPrompt = '';
    
    if (this.context.userName) {
      contextPrompt += `O usuário se chama ${this.context.userName}. `;
    }
    
    if (this.context.userInterests.length > 0) {
      contextPrompt += `Ele(a) demonstrou interesse em: ${this.context.userInterests.join(', ')}. `;
    }

    return contextPrompt;
  }

  clearHistory() {
    this.history = [];
    this.context.lastTopics = [];
  }

  exportConversation() {
    return {
      history: this.history,
      context: this.context,
      exportDate: new Date().toISOString()
    };
  }
}

// ============================================
// GERENCIADOR DE MEMÓRIA LOCAL
// ============================================
class StorageManager {
  constructor() {
    this.prefix = 'cici_';
  }

  save(key, data) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      return false;
    }
  }

  load(key) {
    try {
      const data = localStorage.getItem(this.prefix + key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      return null;
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('Erro ao remover dados:', error);
      return false;
    }
  }

  // Salvar conversa atual
  saveConversation(conversationManager) {
    const data = {
      history: conversationManager.history,
      context: conversationManager.context,
      savedAt: new Date().toISOString()
    };
    return this.save('current_conversation', data);
  }

  // Carregar conversa salva
  loadConversation() {
    return this.load('current_conversation');
  }

  // Salvar configurações do usuário
  saveUserSettings(settings) {
    return this.save('user_settings', settings);
  }

  // Carregar configurações do usuário
  loadUserSettings() {
    return this.load('user_settings') || {
      theme: 'light',
      notifications: true,
      autoScroll: true,
      typingSpeed: 'normal'
    };
  }
}

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
const ciciPersonality = new CiciPersonality();
const conversationManager = new ConversationManager();
const storageManager = new StorageManager();

let isLoading = false;
let messageCount = 0;
let currentTheme = 'light';
let userSettings = {};

// ============================================
// CONFIGURAÇÃO DE APIs
// ============================================
const API_CONFIG = {
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    key: 'sk-09e81935a804474da3d444a57ec90e48',
    model: 'deepseek-chat',
    priority: 1
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: 'NFuAj8PYUPcaf6tA1BjbyXuIeSjSA4sW',
    model: 'mistral-small-latest',
    priority: 2
  },
  fallback: {
    responses: [
      "Hmm, deixe-me pensar sobre isso... 🤔",
      "Que pergunta interessante! Vamos explorar isso juntos? 💭",
      "Adoro esse tipo de conversa! Deixe-me refletir sobre isso... ✨",
      "Isso me fez pensar... Vamos descobrir mais sobre isso? 🔍"
    ]
  }
};

// ============================================
// INICIALIZAÇÃO
// ============================================
window.addEventListener('load', async () => {
  // Carregar configurações do usuário
  userSettings = storageManager.loadUserSettings();
  currentTheme = userSettings.theme || 'light';
  applyTheme(currentTheme);

  // Esconder loading screen
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }, 1000);

  // Configurar elementos da UI
  initializeUI();

  // Carregar conversa anterior
  await loadPreviousConversation();

  // Inicializar service worker
  initializeServiceWorker();

  // Configurar eventos
  setupEventListeners();

  console.log('🚀 Cici Chatbot inicializado com sucesso!');
});

// ============================================
// INICIALIZAÇÃO DA UI
// ============================================
function initializeUI() {
  // Configurar textarea auto-resize
  const textarea = document.getElementById('message-input');
  textarea.addEventListener('input', autoResizeTextarea);
  
  // Configurar atalhos de teclado
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    
    // Atalho Ctrl/Cmd + K para limpar conversa
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      showClearConversationModal();
    }
  });

  // Inicializar ícones
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Inicializar anúncios
  if (typeof adsbygoogle !== 'undefined') {
    (adsbygoogle = window.adsbygoogle || []).push({});
  }

  // Atualizar timestamp da mensagem de boas-vindas
  updateMessageTime();
}

// ============================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================
function setupEventListeners() {
  // Botão de enviar mensagem
  const sendBtn = document.getElementById('send-btn');
  sendBtn.addEventListener('click', sendMessage);

  // Botão de instalação PWA
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.addEventListener('click', installPWA);
  }

  // Fechar menu ao clicar fora
  document.addEventListener('click', (e) => {
    const menuDropdown = document.getElementById('menu-dropdown');
    const menuBtn = document.querySelector('.menu-btn');
    
    if (menuDropdown && menuBtn && 
        !menuDropdown.contains(e.target) && 
        !menuBtn.contains(e.target)) {
      menuDropdown.classList.remove('active');
      updateMenuIcon();
    }
  });

  // Reconectar quando online
  window.addEventListener('online', () => {
    showToast('Conexão restaurada! 📶', 'success');
  });

  window.addEventListener('offline', () => {
    showToast('Conexão perdida. Verifique sua internet.', 'error');
  });
}

// ============================================
// SERVICE WORKER E PWA
// ============================================
function initializeServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registrado:', registration.scope);
        
        // Solicitar permissão para notificações
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      })
      .catch(error => {
        console.log('Falha ao registrar Service Worker:', error);
      });
  }
}

// Install Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallPrompt();
});

window.addEventListener('appinstalled', () => {
  console.log('PWA foi instalado!');
  hideInstallPrompt();
  showToast('Cici instalada com sucesso! 🎉', 'success');
});

function showInstallPrompt() {
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'block';
    installButton.classList.add('pulse');
  }
}

function hideInstallPrompt() {
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'none';
    installButton.classList.remove('pulse');
  }
}

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA instalado com sucesso');
      }
      deferredPrompt = null;
      hideInstallPrompt();
    });
  }
}

// ============================================
// GERENCIAMENTO DE CONVERSAS
// ============================================
async function loadPreviousConversation() {
  const saved = storageManager.loadConversation();
  if (saved && saved.history) {
    // Verificar se a conversa é recente (menos de 24 horas)
    const savedTime = new Date(saved.savedAt);
    const now = new Date();
    const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      conversationManager.history = saved.history;
      conversationManager.context = saved.context;
      
      // Recriar mensagens na UI
      const messagesContainer = document.getElementById('messages-container');
      messagesContainer.innerHTML = '';
      
      saved.history.forEach(msg => {
        addMessageToUI(msg.content, msg.role, false);
      });
      
      showToast('Conversa anterior carregada! 💾', 'info');
    }
  }
}

function saveCurrentConversation() {
  const success = storageManager.saveConversation(conversationManager);
  if (success) {
    console.log('Conversa salva com sucesso');
  }
}

function clearConversation() {
  conversationManager.clearHistory();
  
  const messagesContainer = document.getElementById('messages-container');
  messagesContainer.innerHTML = '';
  
  // Adicionar mensagem de boas-vindas
  addMessageToUI(ciciPersonality.getRandomGreeting(), 'assistant', false);
  
  storageManager.remove('current_conversation');
  showToast('Conversa limpa! 🔄', 'success');
}

// ============================================
// FUNÇÃO PRINCIPAL DE ENVIO DE MENSAGEM
// ============================================
async function sendMessage() {
  const input = document.getElementById('message-input');
  const message = input.value.trim();
  
  if (!message || isLoading) return;
  
  // Adicionar mensagem do usuário
  addMessageToUI(message, 'user');
  conversationManager.addMessage('user', message);
  
  // Limpar input
  input.value = '';
  autoResizeTextarea();
  
  // Desabilitar envio
  isLoading = true;
  updateSendButton();
  
  // Mostrar indicador de digitação
  showTypingIndicator();
  
  try {
    let response;
    
    // Tentar APIs em ordem de prioridade
    try {
      response = await callDeepSeekAPI();
    } catch (error) {
      console.log('DeepSeek falhou, tentando Mistral...', error);
      response = await callMistralAPI();
    }
    
    // Processar resposta
    const processedResponse = ciciPersonality.processResponse(response);
    
    // Remover indicador de digitação
    removeTypingIndicator();
    
    // Adicionar resposta
    addMessageToUI(processedResponse, 'assistant');
    conversationManager.addMessage('assistant', processedResponse);
    
    // Atualizar contadores
    messageCount++;
    updateMessageCounter();
    
    // Mostrar anúncio após 5 mensagens
    if (messageCount === 5) {
      showAdInChat();
    }
    
    // Salvar conversa
    saveCurrentConversation();
    
  } catch (error) {
    console.error('Erro na API:', error);
    removeTypingIndicator();
    
    // Resposta de fallback
    const fallbackResponse = getFallbackResponse();
    addMessageToUI(fallbackResponse, 'assistant');
    conversationManager.addMessage('assistant', fallbackResponse);
    
    showToast('Usando modo offline temporariamente', 'warning');
  } finally {
    isLoading = false;
    updateSendButton();
    
    // Focar no input novamente
    input.focus();
  }
}

// ============================================
// CHAMADAS DE API
// ============================================
async function callDeepSeekAPI() {
  const response = await fetch(API_CONFIG.deepseek.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_CONFIG.deepseek.key}`
    },
    body: JSON.stringify({
      model: API_CONFIG.deepseek.model,
      messages: [
        {
          role: 'system',
          content: ciciPersonality.generateSystemPrompt() + conversationManager.getContextualPrompt()
        },
        ...conversationManager.history.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      temperature: 0.8,
      max_tokens: 1200,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callMistralAPI() {
  const response = await fetch(API_CONFIG.mistral.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_CONFIG.mistral.key}`
    },
    body: JSON.stringify({
      model: API_CONFIG.mistral.model,
      messages: [
        {
          role: 'system',
          content: ciciPersonality.generateSystemPrompt() + conversationManager.getContextualPrompt()
        },
        ...conversationManager.history.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      temperature: 0.8,
      max_tokens: 1200,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Mistral API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function getFallbackResponse() {
  const responses = API_CONFIG.fallback.responses;
  return responses[Math.floor(Math.random() * responses.length)];
}

// ============================================
// FUNÇÕES DE UI ATUALIZADAS
// ============================================
function addMessageToUI(content, role, animate = true) {
  const messagesContainer = document.getElementById('messages-container');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role} ${animate ? 'message-enter' : ''}`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  
  const messageParagraph = document.createElement('p');
  messageParagraph.textContent = content;
  
  const messageTime = document.createElement('span');
  messageTime.className = 'message-time';
  messageTime.textContent = getCurrentTime();
  
  // Adicionar botões de ação para mensagens do usuário
  if (role === 'user') {
    const messageActions = document.createElement('div');
    messageActions.className = 'message-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'message-action-btn';
    editBtn.innerHTML = '<i data-lucide="edit-3"></i>';
    editBtn.title = 'Editar mensagem';
    editBtn.onclick = () => editMessage(messageDiv, content);
    
    messageActions.appendChild(editBtn);
    messageContent.appendChild(messageActions);
  }
  
  messageContent.appendChild(messageParagraph);
  messageContent.appendChild(messageTime);
  messageDiv.appendChild(messageContent);
  
  messagesContainer.appendChild(messageDiv);
  
  // Scroll para baixo
  if (userSettings.autoScroll !== false) {
    scrollToBottom();
  }
  
  // Atualizar ícones
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function showTypingIndicator() {
  const messagesContainer = document.getElementById('messages-container');
  
  const typingDiv = document.createElement('div');
  typingDiv.id = 'typing-indicator';
  typingDiv.className = 'message assistant typing';
  
  typingDiv.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <span class="typing-text">Cici está digitando...</span>
    </div>
  `;
  
  messagesContainer.appendChild(typingDiv);
  scrollToBottom();
}

function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

function showToast(message, type = 'info') {
  // Remover toast anterior se existir
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Mostrar toast
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Remover após 3 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showClearConversationModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <h3>Limpar conversa</h3>
      <p>Tem certeza que deseja limpar toda a conversa? Esta ação não pode ser desfeita.</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-danger" onclick="clearConversation(); this.closest('.modal-overlay').remove()">Limpar Tudo</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================
function updateSendButton() {
  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) {
    sendBtn.disabled = isLoading;
    sendBtn.innerHTML = isLoading ? 
      '<i data-lucide="loader-2" class="spin"></i>' : 
      '<i data-lucide="send"></i>';
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

function autoResizeTextarea() {
  const textarea = document.getElementById('message-input');
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }
}

function scrollToBottom() {
  const messagesContainer = document.getElementById('messages-container');
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function updateMessageTime() {
  const messageTime = document.querySelector('.message-time');
  if (messageTime && !messageTime.textContent) {
    messageTime.textContent = getCurrentTime();
  }
}

function updateMessageCounter() {
  // Atualizar contador no menu se existir
  const counter = document.getElementById('message-counter');
  if (counter) {
    counter.textContent = messageCount;
  }
}

function updateMenuIcon() {
  const menuIcon = document.getElementById('menu-icon');
  const menuDropdown = document.getElementById('menu-dropdown');
  
  if (menuIcon && menuDropdown) {
    if (menuDropdown.classList.contains('active')) {
      menuIcon.setAttribute('data-lucide', 'x');
    } else {
      menuIcon.setAttribute('data-lucide', 'menu');
    }
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
  
  // Salvar preferência
  userSettings.theme = theme;
  storageManager.saveUserSettings(userSettings);
}

function toggleTheme() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  showToast(`Tema ${newTheme === 'light' ? 'claro' : 'escuro'} ativado`, 'success');
}

// ============================================
// NAVEGAÇÃO E MENU
// ============================================
function showScreen(screenName) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(screen => screen.classList.remove('active'));
  
  const targetScreen = document.getElementById(`${screenName}-screen`);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }
  
  // Fechar menu
  const menuDropdown = document.getElementById('menu-dropdown');
  if (menuDropdown) {
    menuDropdown.classList.remove('active');
    updateMenuIcon();
  }
  
  // Reinicializar ícones
  if (typeof lucide !== 'undefined') {
    setTimeout(() => lucide.createIcons(), 100);
  }
  
  window.scrollTo(0, 0);
}

function toggleMenu() {
  const menuDropdown = document.getElementById('menu-dropdown');
  if (menuDropdown) {
    menuDropdown.classList.toggle('active');
    updateMenuIcon();
  }
}

// ============================================
// ANIMAÇÕES E EFEITOS
// ============================================
function addConfetti() {
  // Efeito de confetti simples
  const confettiCount = 30;
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
  
  for (let i = 0; i < confettiCount; i++) {
    createConfettiPiece(colors);
  }
}

function createConfettiPiece(colors) {
  const confetti = document.createElement('div');
  confetti.className = 'confetti';
  confetti.style.cssText = `
    position: fixed;
    width: 8px;
    height: 8px;
    background: ${colors[Math.floor(Math.random() * colors.length)]};
    top: -10px;
    left: ${Math.random() * 100}vw;
    opacity: ${Math.random() + 0.5};
    transform: rotate(${Math.random() * 360}deg);
    pointer-events: none;
    z-index: 10000;
  `;
  
  document.body.appendChild(confetti);
  
  // Animação
  const animation = confetti.animate([
    { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
    { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
  ], {
    duration: 1000 + Math.random() * 2000,
    easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)'
  });
  
  animation.onfinish = () => confetti.remove();
}

// ============================================
// CONSOLE INFO
// ============================================
console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║         🌟 CICI CHATBOT v2.0         ║
║                                       ║
║     Desenvolvido por AmplaAI 💜      ║
║                                       ║
║  orpheostudio.com.br          ║
║  @ampla.ai                           ║
║                                       ║
║  Novas funcionalidades:              ║
║  • Memória de conversa               ║
║  • Modo offline                      ║
║  • Temas claro/escuro                ║
║  • Personalidade aprimorada          ║
║  • Animações e efeitos               ║
║                                       ║
╚═══════════════════════════════════════╝
`);
