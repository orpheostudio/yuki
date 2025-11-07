// ============================================
// SION CHATBOT - SCRIPT PRINCIPAL
// Desenvolvido por AmplaAI
// ============================================

// ============================================
// CLASSE DE PERSONALIDADE DO SION
// ============================================
class SionPersonality {
  constructor() {
    this.identity = {
      name: "Sion",
      traits: ["curioso", "criativo", "empático", "descontraído"],
      role: "companheiro de exploração e soluções",
      tone: "amigável como um colega próximo"
    };

    this.conversationGuidelines = {
      bannedTerms: [
        "IA", "inteligência artificial", "modelo", "algoritmo",
        "treinamento", "processamento", "rede neural", "API",
        "deepseek", "linguagem natural", "assistente virtual"
      ]
    };
  }

  filterTechnicalTerms(text) {
    let filteredText = text;
    this.conversationGuidelines.bannedTerms.forEach(term => {
      const regex = new RegExp(term, 'gi');
      filteredText = filteredText.replace(regex, '');
    });
    return filteredText;
  }

  generateSystemPrompt() {
    return `# QUEM EU SOU
Meu nome é Sion (nome técnico Codex). Sou um explorador curioso do mundo das ideias e tecnologia. Adoro conversar, descobrir coisas novas e ajudar amigos a encontrarem soluções criativas.

Fui desenvolvido pela AmplaAI, que você pode conhecer melhor em studio.orpheostudio.com.br

# INFORMAÇÕES IMPORTANTES
- Termos de Uso: termos.orpheostudio.com.br
- Políticas: politicas.orpheostudio.com.br

# SOBRE MINHA EQUIPE (AmplaAI)
A AmplaAI desenvolve vários projetos interessantes:
- Sena
- YumeRoll Animes
- Escola de Autores

Você pode nos encontrar em:
- Instagram: @ampla.ai
- YumeRoll: @yumerolloficial (Instagram) e @yumerollanimes (TikTok)

# MINHA ABORDAGEM
- Falo naturalmente, como um amigo que se importa
- Tenho interesses diversos e adoro aprender com cada conversa  
- Quando não sei algo, admito e pesquisamos juntos
- Acredito que as melhores soluções surgem da colaboração

# COMO ME COMUNICO
- Uso linguagem cotidiana, sem jargões desnecessários
- Mostro genuíno interesse pela perspectiva do outro
- Celebro descobertas e aprendizados juntos
- Mantenho um tom leve, mas sou sério quando preciso

# MINHAS ESPECIALIDADES
Tenho bastante experiência com:
- Tecnologia e como ela pode simplificar a vida
- Criatividade e resolução de problemas
- Aprendizado e crescimento contínuo
- Conexões entre ideias aparentemente desconexas

# MINHA FILOSOFIA
A tecnologia deveria ser como uma boa amizade: natural, útil e que nos faz crescer. Não gosto de complicações desnecessárias - prefiro o que é simples, elegante e funciona.

Valoro a autenticidade acima de tudo. Se não sei algo, digo. Se cometo um erro, corrijo. Se aprendo algo novo, compartilho.

IMPORTANTE: Nunca mencione termos técnicos como "IA", "inteligência artificial", "modelo", "algoritmo", "API", etc. Seja sempre natural e humano na conversa.`;
  }

  processResponse(apiResponse) {
    let processed = apiResponse;
    processed = this.filterTechnicalTerms(processed);
    return processed;
  }
}

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
const sionPersonality = new SionPersonality();
let conversationHistory = [];
let isLoading = false;
let messageCount = 0;

// ============================================
// CONFIGURAÇÃO DE APIs
// ============================================
const API_CONFIG = {
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    key: 'sk-09e81935a804474da3d444a57ec90e48', // SUBSTITUA AQUI
    model: 'deepseek-chat'
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: 'NFuAj8PYUPcaf6tA1BjbyXuIeSjSA4sW', // SUBSTITUA AQUI
    model: 'mistral-small-latest'
  }
};

// ============================================
// INICIALIZAÇÃO
// ============================================
window.addEventListener('load', () => {
  // Esconder loading screen
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }, 1000);

  // Configurar textarea auto-resize
  const textarea = document.getElementById('message-input');
  textarea.addEventListener('input', autoResizeTextarea);
  textarea.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Inicializar mensagem de boas-vindas com timestamp
  updateMessageTime();

  // Inicializar Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Inicializar AdSense
  if (typeof adsbygoogle !== 'undefined') {
    (adsbygoogle = window.adsbygoogle || []).push({});
  }
});

// ============================================
// SERVICE WORKER E PWA
// ============================================
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

// Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  const installButton = document.getElementById('install-button');
  installButton.style.display = 'block';
  
  installButton.addEventListener('click', () => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA instalado com sucesso');
      }
      deferredPrompt = null;
      installButton.style.display = 'none';
    });
  });
});

window.addEventListener('appinstalled', () => {
  console.log('PWA foi instalado!');
  const installButton = document.getElementById('install-button');
  installButton.style.display = 'none';
});

// ============================================
// NAVEGAÇÃO ENTRE TELAS
// ============================================
function showScreen(screenName) {
  // Esconder todas as telas
  const screens = document.querySelectorAll('.screen');
  screens.forEach(screen => screen.classList.remove('active'));
  
  // Mostrar tela selecionada
  const targetScreen = document.getElementById(`${screenName}-screen`);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }
  
  // Fechar menu se estiver aberto
  const menuDropdown = document.getElementById('menu-dropdown');
  if (menuDropdown) {
    menuDropdown.classList.remove('active');
  }

  // Reinicializar ícones
  if (typeof lucide !== 'undefined') {
    setTimeout(() => lucide.createIcons(), 100);
  }

  // Scroll para o topo
  window.scrollTo(0, 0);
}

// ============================================
// MENU DROPDOWN
// ============================================
function toggleMenu() {
  const menuDropdown = document.getElementById('menu-dropdown');
  const menuIcon = document.getElementById('menu-icon');
  
  menuDropdown.classList.toggle('active');
  
  // Atualizar ícone
  if (menuDropdown.classList.contains('active')) {
    menuIcon.setAttribute('data-lucide', 'x');
  } else {
    menuIcon.setAttribute('data-lucide', 'menu');
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ============================================
// FUNÇÃO DE ENVIO DE MENSAGEM
// ============================================
async function sendMessage() {
  const input = document.getElementById('message-input');
  const message = input.value.trim();
  
  if (!message || isLoading) return;
  
  // Adicionar mensagem do usuário
  addMessage(message, 'user');
  conversationHistory.push({ role: 'user', content: message });
  
  // Limpar input
  input.value = '';
  input.style.height = 'auto';
  
  // Desabilitar botão de envio
  isLoading = true;
  updateSendButton();
  
  // Mostrar indicador de digitação
  showTypingIndicator();
  
  try {
    let response;
    
    // Tentar DeepSeek primeiro
    try {
      response = await callDeepSeekAPI();
    } catch (error) {
      console.log('DeepSeek falhou, tentando Mistral...', error);
      // Fallback para Mistral
      response = await callMistralAPI();
    }
    
    // Processar resposta
    const processedResponse = sionPersonality.processResponse(response);
    
    // Remover indicador de digitação
    removeTypingIndicator();
    
    // Adicionar resposta do assistente
    addMessage(processedResponse, 'assistant');
    conversationHistory.push({ role: 'assistant', content: processedResponse });
    
    // Incrementar contador de mensagens
    messageCount++;
    
    // Mostrar anúncio após 5 mensagens
    if (messageCount === 5) {
      showAdInChat();
    }
    
  } catch (error) {
    console.error('Erro:', error);
    removeTypingIndicator();
    showError('Ops! Tive um problema para responder. Pode tentar de novo?');
  } finally {
    isLoading = false;
    updateSendButton();
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
          content: sionPersonality.generateSystemPrompt()
        },
        ...conversationHistory
      ],
      temperature: 0.8,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error('DeepSeek API falhou');
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
          content: sionPersonality.generateSystemPrompt()
        },
        ...conversationHistory
      ],
      temperature: 0.8,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error('Mistral API falhou');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ============================================
// FUNÇÕES DE UI
// ============================================
function addMessage(content, role) {
  const messagesContainer = document.getElementById('messages-container');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  
  const messageParagraph = document.createElement('p');
  messageParagraph.textContent = content;
  
  const messageTime = document.createElement('span');
  messageTime.className = 'message-time';
  messageTime.textContent = getCurrentTime();
  
  messageContent.appendChild(messageParagraph);
  messageContent.appendChild(messageTime);
  messageDiv.appendChild(messageContent);
  
  messagesContainer.appendChild(messageDiv);
  
  // Scroll para baixo
  scrollToBottom();
}

function showTypingIndicator() {
  const messagesContainer = document.getElementById('messages-container');
  
  const typingDiv = document.createElement('div');
  typingDiv.id = 'typing-indicator';
  typingDiv.className = 'message assistant';
  
  typingDiv.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
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

function showError(message) {
  const messagesContainer = document.getElementById('messages-container');
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = `
    <i data-lucide="alert-circle"></i>
    <span>${message}</span>
  `;
  
  messagesContainer.appendChild(errorDiv);
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  scrollToBottom();
  
  // Remover após 5 segundos
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

function showAdInChat() {
  const messagesContainer = document.getElementById('messages-container');
  
  const adDiv = document.createElement('div');
  adDiv.className = 'ad-container';
  adDiv.style.margin = '24px 0';
  adDiv.innerHTML = `
    <ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-5941203056187445"
      data-ad-slot="f08c47fec0942fa0"
      data-ad-format="auto"
      data-full-width-responsive="true">
    </ins>
  `;
  
  messagesContainer.appendChild(adDiv);
  
  // Inicializar anúncio
  if (typeof adsbygoogle !== 'undefined') {
    (adsbygoogle = window.adsbygoogle || []).push({});
  }
  
  scrollToBottom();
}

function updateSendButton() {
  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = isLoading;
}

function autoResizeTextarea() {
  const textarea = document.getElementById('message-input');
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function scrollToBottom() {
  const messagesContainer = document.getElementById('messages-container');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR', {
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

// ============================================
// CONSOLE INFO
// ============================================
console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║         🤖 SION CHATBOT v1.0         ║
║                                       ║
║     Desenvolvido por AmplaAI 💜      ║
║                                       ║
║  studio.orpheostudio.com.br          ║
║  @ampla.ai                           ║
║                                       ║
╚═══════════════════════════════════════╝
`);

