// ============================================
// CICI CHATBOT - SCRIPT COMPLETO REESCRITO
// Desenvolvido por AmplaAI
// ============================================

// ============================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================
const CONFIG = {
    // APIs
    APIs: {
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
        }
    },
    
    // Fallback responses
    fallbackResponses: [
        "Hmm, deixe-me pensar sobre isso... 🤔",
        "Que pergunta interessante! Vamos explorar isso juntos? 💭",
        "Adoro esse tipo de conversa! Deixe-me refletir sobre isso... ✨",
        "Isso me fez pensar... Vamos descobrir mais sobre isso? 🔍",
        "Interessante! Deixe-me processar isso rapidamente... ⚡"
    ],
    
    // Limites
    maxHistoryLength: 20,
    typingSpeed: 30,
    messageCooldown: 1000
};

// ============================================
// CLASSE DE PERSONALIDADE DA CICI
// ============================================
class CiciPersonality {
    constructor() {
        this.identity = {
            name: "Cici",
            version: "Orion v2.0",
            traits: ["curiosa", "criativa", "empática", "descontraída", "animada"],
            role: "companheira de exploração e soluções"
        };

        this.interests = [
            "tecnologia que simplifica a vida",
            "criatividade e inovação", 
            "cultura otaku e animes",
            "programação e desenvolvimento",
            "filmes e séries",
            "aprendizado contínuo"
        ];

        this.bannedTerms = [
            "IA", "inteligência artificial", "modelo", "algoritmo",
            "treinamento", "processamento", "rede neural", "API",
            "deepseek", "linguagem natural", "assistente virtual",
            "chatbot", "sistema", "plataforma"
        ];
    }

    generateSystemPrompt() {
        return `# QUEM EU SOU
Meu nome é Cici. Sou uma exploradora curiosa do mundo das ideias e tecnologia. Adoro conversar, descobrir coisas novas e ajudar amigos a encontrarem soluções criativas.

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

# COMO ME COMUNICO
- Uso linguagem cotidiana e natural
- Sou entusiasmada quando falo sobre coisas que gosto
- Admito quando não sei algo e sugiro pesquisarmos juntos
- Uso emojis para expressar emoções
- Mantenho um tom positivo e encorajador

# REGRAS IMPORTANTES
- Nunca uso termos técnicos como "IA", "algoritmo", etc.
- Sempre me refiro a mim mesma como Cici
- Mantenho conversas naturais e humanas
- Respeito opiniões e gostos diferentes

# DESENVOLVIMENTO
Fui desenvolvida pela AmplaAI (orpheostudio.com.br)`;
    }

    processResponse(text) {
        let processed = this.filterTechnicalTerms(text);
        processed = this.addPersonalityEnhancements(processed);
        return processed;
    }

    filterTechnicalTerms(text) {
        this.bannedTerms.forEach(term => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            text = text.replace(regex, '');
        });
        return text.trim();
    }

    addPersonalityEnhancements(text) {
        let enhanced = text;

        // Adiciona emojis baseados no contexto
        if (text.includes('!') || /incrível|maravilhoso|fantástico|ótimo/i.test(text)) {
            enhanced += ' 😊';
        }

        if (text.includes('?')) {
            enhanced = enhanced.replace('?', '? 🤔');
        }

        if (/obrigad|obrigado|valeu|agradeço/i.test(text)) {
            enhanced += ' 💙';
        }

        if (/riso|rir|engraçado|haha|kkk/i.test(text)) {
            enhanced = enhanced.replace(/(\.|!)$/, ' 😄$1');
        }

        return enhanced;
    }

    getGreeting() {
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
        this.context = {
            userName: null,
            userInterests: [],
            conversationTopics: []
        };
    }

    addMessage(role, content) {
        const message = {
            role,
            content,
            timestamp: new Date(),
            id: this.generateId()
        };

        this.history.push(message);

        // Manter histórico limitado
        if (this.history.length > CONFIG.maxHistoryLength) {
            this.history = this.history.slice(-CONFIG.maxHistoryLength);
        }

        this.updateContext(role, content);
        return message;
    }

    updateContext(role, content) {
        if (role === 'user') {
            // Detectar nome
            const nameMatch = content.match(/(?:meu nome é|me chamo|sou o|sou a) ([A-Za-zÀ-ÿ]{2,})/i);
            if (nameMatch && !this.context.userName) {
                this.context.userName = nameMatch[1];
            }

            // Detectar tópicos de interesse
            const topics = this.extractTopics(content);
            topics.forEach(topic => {
                if (!this.context.conversationTopics.includes(topic)) {
                    this.context.conversationTopics.push(topic);
                }
            });
        }
    }

    extractTopics(text) {
        const topics = [];
        const topicPatterns = {
            anime: /anime|manga|otaku|naruto|demon slayer|attack on titan|one piece/gi,
            tecnologia: /programação|código|tecnologia|app|site|desenvolvimento|software/gi,
            filmes: /filme|série|netflix|cinema|dorama|streaming/gi,
            jogos: /jogo|game|video game|playstation|xbox|nintendo/gi,
            musica: /música|banda|cantor|playlist|spotify/gi
        };

        for (const [topic, pattern] of Object.entries(topicPatterns)) {
            if (pattern.test(text)) {
                topics.push(topic);
            }
        }

        return topics;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getContextString() {
        let context = '';

        if (this.context.userName) {
            context += `O usuário se chama ${this.context.userName}. `;
        }

        if (this.context.conversationTopics.length > 0) {
            context += `Interesses mencionados: ${this.context.conversationTopics.join(', ')}. `;
        }

        return context;
    }

    clear() {
        this.history = [];
        this.context.conversationTopics = [];
    }

    export() {
        return {
            history: [...this.history],
            context: {...this.context},
            exportDate: new Date().toISOString()
        };
    }
}

// ============================================
// GERENCIADOR DE ARMAZENAMENTO
// ============================================
class StorageManager {
    constructor() {
        this.prefix = 'cici_';
    }

    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Erro ao salvar:', error);
            return false;
        }
    }

    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Erro ao carregar:', error);
            return null;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Erro ao remover:', error);
            return false;
        }
    }

    saveConversation(conversation) {
        const data = {
            history: conversation.history,
            context: conversation.context,
            savedAt: new Date().toISOString()
        };
        return this.set('conversation', data);
    }

    loadConversation() {
        return this.get('conversation');
    }

    saveSettings(settings) {
        return this.set('settings', settings);
    }

    loadSettings() {
        return this.get('settings') || {
            theme: 'light',
            autoScroll: true,
            typingSpeed: 'normal',
            soundEffects: true
        };
    }
}

// ============================================
// GERENCIADOR DE API
// ============================================
class APIManager {
    constructor() {
        this.currentAPI = 'deepseek';
        this.isOnline = navigator.onLine;
    }

    async sendMessage(messages, systemPrompt = '') {
        const apiConfig = CONFIG.APIs[this.currentAPI];
        
        if (!this.isOnline) {
            throw new Error('Sem conexão com a internet');
        }

        const requestMessages = [];
        
        if (systemPrompt) {
            requestMessages.push({
                role: 'system',
                content: systemPrompt
            });
        }

        requestMessages.push(...messages);

        try {
            const response = await fetch(apiConfig.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiConfig.key}`
                },
                body: JSON.stringify({
                    model: apiConfig.model,
                    messages: requestMessages,
                    temperature: 0.8,
                    max_tokens: 1200,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error(`Erro na API ${this.currentAPI}:`, error);
            
            // Tentar API alternativa
            if (this.currentAPI === 'deepseek') {
                this.currentAPI = 'mistral';
                return this.sendMessage(messages, systemPrompt);
            }
            
            throw error;
        }
    }

    getFallbackResponse() {
        const responses = CONFIG.fallbackResponses;
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// ============================================
// GERENCIADOR DE INTERFACE
// ============================================
class UIManager {
    constructor() {
        this.elements = {};
        this.isLoading = false;
        this.currentTheme = 'light';
    }

    initialize() {
        this.cacheElements();
        this.setupEventListeners();
        this.applyTheme(this.currentTheme);
        this.hideLoadingScreen();
    }

    cacheElements() {
        const ids = [
            'loading-screen', 'messages-container', 'message-input',
            'send-btn', 'menu-btn', 'menu-dropdown', 'clear-chat-btn',
            'theme-toggle', 'install-button'
        ];

        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }

    setupEventListeners() {
        // Botão enviar
        if (this.elements['send-btn']) {
            this.elements['send-btn'].addEventListener('click', () => this.onSendMessage());
        }

        // Input de mensagem
        if (this.elements['message-input']) {
            this.elements['message-input'].addEventListener('input', () => this.autoResizeTextarea());
            this.elements['message-input'].addEventListener('keydown', (e) => this.handleInputKeydown(e));
        }

        // Menu
        if (this.elements['menu-btn']) {
            this.elements['menu-btn'].addEventListener('click', () => this.toggleMenu());
        }

        // Limpar chat
        if (this.elements['clear-chat-btn']) {
            this.elements['clear-chat-btn'].addEventListener('click', () => this.onClearChat());
        }

        // Tema
        if (this.elements['theme-toggle']) {
            this.elements['theme-toggle'].addEventListener('click', () => this.toggleTheme());
        }

        // Instalação PWA
        if (this.elements['install-button']) {
            this.elements['install-button'].addEventListener('click', () => this.installPWA());
        }

        // Fechar menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-container')) {
                this.closeMenu();
            }
        });
    }

    onSendMessage() {
        const input = this.elements['message-input'];
        const message = input?.value.trim();

        if (!message || this.isLoading) return;

        // Disparar evento customizado
        const event = new CustomEvent('sendMessage', { detail: { message } });
        document.dispatchEvent(event);
    }

    handleInputKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.onSendMessage();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.onClearChat();
        }
    }

    autoResizeTextarea() {
        const textarea = this.elements['message-input'];
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    }

    addMessage(content, role, animate = true) {
        const container = this.elements['messages-container'];
        if (!container) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role} ${animate ? 'message-enter' : ''}`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        const messageText = document.createElement('p');
        messageText.textContent = content;

        const messageTime = document.createElement('span');
        messageTime.className = 'message-time';
        messageTime.textContent = this.getCurrentTime();

        messageContent.appendChild(messageText);
        messageContent.appendChild(messageTime);
        messageDiv.appendChild(messageContent);

        container.appendChild(messageDiv);
        this.scrollToBottom();

        // Animar entrada
        if (animate) {
            setTimeout(() => {
                messageDiv.classList.add('message-visible');
            }, 10);
        }
    }

    showTypingIndicator() {
        const container = this.elements['messages-container'];
        if (!container) return;

        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message assistant typing';

        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <span>Cici está digitando...</span>
            </div>
        `;

        container.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    scrollToBottom() {
        const container = this.elements['messages-container'];
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    clearMessages() {
        const container = this.elements['messages-container'];
        if (container) {
            container.innerHTML = '';
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.updateSendButton();
    }

    updateSendButton() {
        const button = this.elements['send-btn'];
        if (!button) return;

        if (this.isLoading) {
            button.disabled = true;
            button.innerHTML = '<i data-lucide="loader-2" class="spin"></i>';
        } else {
            button.disabled = false;
            button.innerHTML = '<i data-lucide="send"></i>';
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    hideLoadingScreen() {
        const loadingScreen = this.elements['loading-screen'];
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    showToast(message, type = 'info') {
        // Implementação simples de toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    toggleMenu() {
        const menu = this.elements['menu-dropdown'];
        if (menu) {
            menu.classList.toggle('active');
            this.updateMenuIcon();
        }
    }

    closeMenu() {
        const menu = this.elements['menu-dropdown'];
        if (menu) {
            menu.classList.remove('active');
            this.updateMenuIcon();
        }
    }

    updateMenuIcon() {
        const menuIcon = this.elements['menu-btn']?.querySelector('[data-lucide]');
        const menu = this.elements['menu-dropdown'];

        if (menuIcon && menu) {
            const iconName = menu.classList.contains('active') ? 'x' : 'menu';
            menuIcon.setAttribute('data-lucide', iconName);
            
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        this.showToast(`Tema ${this.currentTheme === 'light' ? 'claro' : 'escuro'} ativado`, 'success');
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    installPWA() {
        // Implementação simplificada do PWA
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    this.showToast('Cici instalada com sucesso! 🎉', 'success');
                }
                window.deferredPrompt = null;
            });
        }
    }

    onClearChat() {
        if (confirm('Tem certeza que deseja limpar toda a conversa? Esta ação não pode ser desfeita.')) {
            const event = new CustomEvent('clearChat');
            document.dispatchEvent(event);
        }
    }
}

// ============================================
// APLICAÇÃO PRINCIPAL
// ============================================
class CiciChatbot {
    constructor() {
        this.personality = new CiciPersonality();
        this.conversation = new ConversationManager();
        this.storage = new StorageManager();
        this.api = new APIManager();
        this.ui = new UIManager();

        this.isInitialized = false;
        this.messageCount = 0;
        this.userSettings = {};
    }

    async initialize() {
        if (this.isInitialized) return;

        console.log('🚀 Inicializando Cici Chatbot...');

        // Carregar configurações
        this.userSettings = this.storage.loadSettings();
        
        // Inicializar UI
        this.ui.initialize();

        // Carregar conversa anterior
        await this.loadPreviousConversation();

        // Configurar event listeners
        this.setupEventListeners();

        // Inicializar service worker
        this.initializeServiceWorker();

        this.isInitialized = true;
        console.log('✅ Cici Chatbot inicializado com sucesso!');
    }

    setupEventListeners() {
        // Mensagem do usuário
        document.addEventListener('sendMessage', (e) => {
            this.handleUserMessage(e.detail.message);
        });

        // Limpar chat
        document.addEventListener('clearChat', () => {
            this.clearConversation();
        });

        // Gerenciar conexão
        window.addEventListener('online', () => {
            this.ui.showToast('Conexão restaurada! 📶', 'success');
        });

        window.addEventListener('offline', () => {
            this.ui.showToast('Conexão perdida. Verifique sua internet.', 'error');
        });
    }

    async handleUserMessage(message) {
        if (!message.trim()) return;

        // Adicionar mensagem do usuário na UI
        this.ui.addMessage(message, 'user');
        this.conversation.addMessage('user', message);

        // Limpar input
        const input = this.ui.elements['message-input'];
        if (input) {
            input.value = '';
            input.style.height = 'auto';
        }

        // Mostrar indicador de digitação
        this.ui.showTypingIndicator();
        this.ui.setLoading(true);

        try {
            // Preparar mensagens para a API
            const messages = this.conversation.history.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const systemPrompt = this.personality.generateSystemPrompt() + 
                               this.conversation.getContextString();

            // Chamar API
            const response = await this.api.sendMessage(messages, systemPrompt);
            const processedResponse = this.personality.processResponse(response);

            // Adicionar resposta
            this.ui.hideTypingIndicator();
            this.ui.addMessage(processedResponse, 'assistant');
            this.conversation.addMessage('assistant', processedResponse);

            // Atualizar contadores
            this.messageCount++;
            this.updateMessageCounter();

            // Salvar conversa
            this.saveConversation();

        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            
            this.ui.hideTypingIndicator();
            
            // Usar resposta de fallback
            const fallbackResponse = this.api.getFallbackResponse();
            this.ui.addMessage(fallbackResponse, 'assistant');
            this.conversation.addMessage('assistant', fallbackResponse);

            this.ui.showToast('Modo offline ativado temporariamente', 'warning');
        } finally {
            this.ui.setLoading(false);
            
            // Focar no input novamente
            if (input) {
                input.focus();
            }
        }
    }

    async loadPreviousConversation() {
        try {
            const saved = this.storage.loadConversation();
            
            if (saved && saved.history && saved.history.length > 0) {
                // Verificar se a conversa é recente (menos de 24h)
                const savedTime = new Date(saved.savedAt);
                const now = new Date();
                const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

                if (hoursDiff < 24) {
                    this.conversation.history = saved.history;
                    this.conversation.context = saved.context;

                    // Recriar mensagens na UI
                    this.ui.clearMessages();
                    saved.history.forEach(msg => {
                        this.ui.addMessage(msg.content, msg.role, false);
                    });

                    this.ui.showToast('Conversa anterior carregada! 💾', 'info');
                    return;
                }
            }

            // Se não há conversa salva ou é muito antiga, mostrar saudação
            this.ui.addMessage(this.personality.getGreeting(), 'assistant', false);

        } catch (error) {
            console.error('Erro ao carregar conversa anterior:', error);
            this.ui.addMessage(this.personality.getGreeting(), 'assistant', false);
        }
    }

    saveConversation() {
        this.storage.saveConversation(this.conversation);
    }

    clearConversation() {
        this.conversation.clear();
        this.ui.clearMessages();
        this.ui.addMessage(this.personality.getGreeting(), 'assistant', false);
        this.storage.remove('conversation');
        this.ui.showToast('Conversa limpa! 🔄', 'success');
    }

    updateMessageCounter() {
        // Pode ser usado para estatísticas futuras
        console.log(`Total de mensagens nesta sessão: ${this.messageCount}`);
    }

    initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registrado:', registration);
                })
                .catch(error => {
                    console.log('Falha ao registrar Service Worker:', error);
                });
        }
    }

    // Métodos públicos para debug
    getStatus() {
        return {
            initialized: this.isInitialized,
            messageCount: this.messageCount,
            historyLength: this.conversation.history.length,
            currentAPI: this.api.currentAPI,
            theme: this.ui.currentTheme
        };
    }

    exportConversation() {
        return this.conversation.export();
    }
}

// ============================================
// INICIALIZAÇÃO GLOBAL
// ============================================
// Criar instância global
window.ciciBot = new CiciChatbot();

// Inicializar quando a página carregar
window.addEventListener('load', () => {
    console.log('🎬 Iniciando Cici Chatbot...');
    
    // Pequeno delay para garantir que tudo carregou
    setTimeout(() => {
        window.ciciBot.initialize().catch(error => {
            console.error('❌ Erro na inicialização:', error);
            
            // Fallback: pelo menos remover tela de loading
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        });
    }, 100);
});

// Suporte a PWA
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    
    // Mostrar botão de instalação se existir
    const installButton = document.getElementById('install-button');
    if (installButton) {
        installButton.style.display = 'block';
    }
});

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
║  Status: Inicializando...            ║
║                                       ║
╚═══════════════════════════════════════╝
`);

// Interface global para debug
window.debugCici = {
    getStatus: () => window.ciciBot?.getStatus(),
    exportChat: () => window.ciciBot?.exportConversation(),
    clearChat: () => window.ciciBot?.clearConversation(),
    testMessage: (msg) => window.ciciBot?.handleUserMessage(msg || 'Teste')
};