// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

class YumeAssistant {
    constructor() {
        this.token = localStorage.getItem('yume_token');
        this.user = null;
        this.conversationHistory = [];
        this.isProcessing = false;

        this.elements = {
            authScreen: document.getElementById('authScreen'),
            chatScreen: document.getElementById('chatScreen'),
            loginForm: document.getElementById('loginForm'),
            registerForm: document.getElementById('registerForm'),
            showRegister: document.getElementById('showRegister'),
            showLogin: document.getElementById('showLogin'),
            chatMessages: document.getElementById('chatMessages'),
            quickReplyArea: document.getElementById('quickReplyArea'),
            inputArea: document.getElementById('inputArea'),
            userInput: document.getElementById('userInput'),
            micBtn: document.getElementById('micBtn'),
            menuBtn: document.getElementById('menuBtn'),
            closeMenu: document.getElementById('closeMenu'),
            menuOverlay: document.getElementById('menuOverlay'),
            logoutBtn: document.getElementById('logoutBtn'),
            helpBtn: document.getElementById('helpBtn'),
            aboutYumeBtn: document.getElementById('aboutYumeBtn'),
            statsBtn: document.getElementById('statsBtn'),
            profileBtn: document.getElementById('profileBtn'),
            darkModeToggle: document.getElementById('darkModeToggle'),
            voiceToggle: document.getElementById('voiceToggle'),
            assistantUI: document.getElementById('assistantUI'),
            greetingName: document.getElementById('greetingName'),
            orb: document.getElementById('orb'),
            toast: document.getElementById('toast'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            userAvatar: document.getElementById('userAvatar')
        };

        this.voiceEnabled = localStorage.getItem('yume_voice') === 'true';
        this.init();
    }

    init() {
        // Check if user is already logged in
        if (this.token) {
            this.validateToken();
        }

        // Auth form handlers
        this.elements.showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            this.elements.loginForm.classList.add('hidden');
            this.elements.registerForm.classList.remove('hidden');
        });

        this.elements.showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            this.elements.registerForm.classList.add('hidden');
            this.elements.loginForm.classList.remove('hidden');
        });

        this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.elements.registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        // Chat handlers
        this.elements.inputArea.addEventListener('submit', (e) => this.handleUserInput(e));
        this.elements.micBtn.addEventListener('click', () => this.toggleVoiceRecognition());
        this.elements.menuBtn.addEventListener('click', () => this.elements.menuOverlay.classList.add('active'));
        this.elements.closeMenu.addEventListener('click', () => this.elements.menuOverlay.classList.remove('active'));
        this.elements.menuOverlay.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.elements.menuOverlay.classList.remove('active');
        });

        // Menu buttons
        this.elements.logoutBtn.addEventListener('click', () => this.logout());
        this.elements.helpBtn.addEventListener('click', () => this.showHelp());
        this.elements.aboutYumeBtn.addEventListener('click', () => this.showAboutYume());
        this.elements.statsBtn.addEventListener('click', () => this.showStats());
        this.elements.profileBtn.addEventListener('click', () => this.showProfile());

        // Settings
        this.elements.darkModeToggle.addEventListener('change', () => this.toggleTheme());
        this.elements.voiceToggle.addEventListener('change', () => this.toggleVoice());

        // Initialize settings
        if (localStorage.getItem('yume_theme') === 'dark') {
            document.body.classList.add('dark-mode');
            this.elements.darkModeToggle.checked = true;
        }

        this.elements.voiceToggle.checked = this.voiceEnabled;
        this.initializeSpeech();
    }

    // Authentication Methods
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        this.showLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('yume_token', this.token);
                this.showChatScreen();
                this.showToast('Login realizado com sucesso!');
            } else {
                this.showToast(data.error || 'Erro ao fazer login');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Erro ao conectar com o servidor');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const ageRange = document.getElementById('registerAge').value;
        const termsAccept = document.getElementById('termsAccept').checked;

        if (!termsAccept) {
            this.showToast('Você precisa aceitar os termos de uso');
            return;
        }

        if (password.length < 8) {
            this.showToast('A senha deve ter pelo menos 8 caracteres');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, ageRange, termsAccepted: true })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('yume_token', this.token);
                this.showChatScreen();
                this.showToast('Conta criada com sucesso!');
            } else {
                this.showToast(data.error || 'Erro ao criar conta');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showToast('Erro ao conectar com o servidor');
        } finally {
            this.showLoading(false);
        }
    }

    async validateToken() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/validate`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.showChatScreen();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Token validation error:', error);
            this.logout();
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        this.conversationHistory = [];
        localStorage.removeItem('yume_token');
        this.elements.chatScreen.classList.add('hidden');
        this.elements.authScreen.classList.remove('hidden');
        this.elements.chatMessages.innerHTML = '';
        this.elements.menuOverlay.classList.remove('active');
        this.showToast('Logout realizado com sucesso');
    }

    showChatScreen() {
        this.elements.authScreen.classList.add('hidden');
        this.elements.chatScreen.classList.remove('hidden');
        this.elements.greetingName.textContent = this.user.name;
        this.updateUserAvatar();
        this.startConversation();
    }

    updateUserAvatar() {
        const initial = this.user.name.charAt(0).toUpperCase();
        this.elements.userAvatar.innerHTML = initial;
    }

    // Chat Methods
    async startConversation() {
        setTimeout(() => {
            const greeting = this.getPersonalizedGreeting();
            this.addMessage([
                greeting,
                "Como posso ajudar você hoje?",
                "Posso recomendar animes, mangás, light novels, ou simplesmente conversar! 😊"
            ], false, true);
            this.showQuickReplies(['Recomendar anime', 'Recomendar mangá', 'Ajuda', 'Conversar']);
        }, 500);
    }

    getPersonalizedGreeting() {
        const hour = new Date().getHours();
        let timeGreeting = 'Olá';
        
        if (hour >= 5 && hour < 12) timeGreeting = 'Bom dia';
        else if (hour >= 12 && hour < 18) timeGreeting = 'Boa tarde';
        else timeGreeting = 'Boa noite';

        return `${timeGreeting}, **${this.user.name}**! ✨`;
    }

    async handleUserInput(e) {
        if (e) e.preventDefault();
        
        const text = this.elements.userInput.value.trim();
        if (!text || this.isProcessing) return;

        this.addMessage(text, true);
        this.elements.userInput.value = '';
        this.elements.quickReplyArea.innerHTML = '';

        this.isProcessing = true;
        this.setOrbState('thinking');
        
        await this.sendToAI(text);
        
        this.isProcessing = false;
        this.setOrbState('idle');
    }

    async sendToAI(message) {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    message,
                    conversationHistory: this.conversationHistory
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.conversationHistory.push(
                    { role: 'user', content: message },
                    { role: 'assistant', content: data.response }
                );
                
                this.addMessage(data.response, false, true);
                
                if (data.suggestions && data.suggestions.length > 0) {
                    this.showQuickReplies(data.suggestions);
                }
            } else {
                this.addMessage('Desculpe, tive um problema para processar sua mensagem. Pode tentar novamente?', false);
            }
        } catch (error) {
            console.error('AI request error:', error);
            this.addMessage('Desculpe, estou com dificuldades para me conectar. Tente novamente em alguns instantes.', false);
        }
    }

    addMessage(content, isUser = false, showReactions = false) {
        this.transitionToChatView();

        if (!isUser) {
            this.showTypingIndicator();
            setTimeout(() => {
                this.hideTypingIndicator();
                this.createMessageBubble(content, isUser, showReactions);
            }, 1000 + Math.random() * 500);
        } else {
            this.createMessageBubble(content, isUser, showReactions);
        }
    }

    createMessageBubble(content, isUser, showReactions) {
        const messageGroup = document.createElement('div');
        messageGroup.className = `message-group ${isUser ? 'user' : ''}`;

        if (!isUser) {
            messageGroup.innerHTML = `<div class="bot-avatar"><img src="https://i.imgur.com/orvGJOL.png" alt="Avatar"></div>`;
        }

        const bubblesContainer = document.createElement('div');
        bubblesContainer.className = 'message-bubbles';
        const messages = Array.isArray(content) ? content : [content];

        messages.forEach(msg => {
            const bubble = document.createElement('div');
            bubble.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
            bubble.innerHTML = this.parseMarkdown(msg);

            const timestamp = document.createElement('div');
            timestamp.className = 'message-timestamp';
            timestamp.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            bubble.appendChild(timestamp);

            bubblesContainer.appendChild(bubble);
        });

        messageGroup.appendChild(bubblesContainer);
        this.elements.chatMessages.appendChild(messageGroup);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;

        if (!isUser && this.voiceEnabled) {
            const textToSpeak = messages.join(' ').replace(/<[^>]*>/g, '').replace(/\*\*/g, '');
            this.speak(textToSpeak);
        }
    }

    parseMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message-group typing-indicator-group';
        indicator.innerHTML = `
            <div class="bot-avatar"><img src="https://i.imgur.com/orvGJOL.png" alt="Avatar"></div>
            <div class="message bot-message typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        this.elements.chatMessages.appendChild(indicator);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = this.elements.chatMessages.querySelector('.typing-indicator-group');
        if (indicator) indicator.remove();
    }

    showQuickReplies(replies) {
        this.elements.quickReplyArea.innerHTML = replies.map(reply => 
            `<button class="quick-reply">${reply}</button>`
        ).join('');
        
        document.querySelectorAll('.quick-reply').forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.userInput.value = btn.textContent;
                this.handleUserInput();
            });
        });
    }

    transitionToChatView() {
        this.elements.assistantUI.classList.add('hidden');
        this.elements.chatMessages.classList.add('active');
    }

    // Menu Actions
    showHelp() {
        this.elements.menuOverlay.classList.remove('active');
        this.addMessage([
            "🆘 **Central de Ajuda da Yume**",
            "",
            "**O que posso fazer por você:**",
            "• Recomendar animes, mangás e light novels",
            "• Conversar sobre seus assuntos favoritos",
            "• Ajudar com dúvidas e explicações simples",
            "• Oferecer motivação e apoio emocional",
            "• Ser sua companhia digital",
            "",
            "**Dicas de uso:**",
            "• Fale naturalmente comigo, como se conversasse com um amigo",
            "• Peça recomendações personalizadas",
            "• Não hesite em pedir que eu explique algo de forma mais simples",
            "",
            "💡 **Exemplo:** \"Me recomende um anime tranquilo\" ou \"Explique o que é streaming de forma simples\""
        ], false, true);
    }

    showAboutYume() {
        this.elements.menuOverlay.classList.remove('active');
        this.addMessage([
            "🤖 **Sobre a Yume**",
            "",
            "Olá! Eu sou a Yume, sua assistente virtual resolutiva. 💙",
            "",
            "🎯 **Minha missão:**",
            "Ajudar pessoas de todas as idades, especialmente aqueles com 50+ anos e pessoas que precisam de explicações mais claras e detalhadas.",
            "",
            "✨ **Como posso ajudar:**",
            "• Recomendo animes, mangás e light novels adaptados ao seu gosto",
            "• Explico conceitos de forma simples e paciente",
            "• Ofereço suporte motivacional e emocional",
            "• Converso sobre diversos assuntos",
            "• Auxilio com dificuldades de compreensão",
            "",
            "💻 **Criada com ❤️ por:** Naoto Dev",
            "🏢 **ORPHEO Platforms**",
            "",
            "Sempre evoluindo para te atender melhor! 🌟"
        ], false, true);
    }

    async showStats() {
        this.elements.menuOverlay.classList.remove('active');
        
        try {
            const response = await fetch(`${API_BASE_URL}/user/stats`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const stats = await response.json();
                
                this.addMessage([
                    "📊 **Suas Estatísticas**",
                    "",
                    `<div class="stats-container">
                        <div class="stat-card">
                            <div class="stat-number">${stats.totalMessages || 0}</div>
                            <div class="stat-label">Mensagens</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.animesRecommended || 0}</div>
                            <div class="stat-label">Animes</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.mangasRecommended || 0}</div>
                            <div class="stat-label">Mangás</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.daysActive || 1}</div>
                            <div class="stat-label">Dias Ativos</div>
                        </div>
                    </div>`,
                    "",
                    `📅 **Membro desde:** ${new Date(stats.memberSince).toLocaleDateString('pt-BR')}`,
                    "",
                    "Continue conversando para aumentar suas estatísticas! 🚀"
                ], false, true);
            }
        } catch (error) {
            console.error('Stats error:', error);
            this.showToast('Erro ao carregar estatísticas');
        }
    }

    showProfile() {
        this.elements.menuOverlay.classList.remove('active');
        this.addMessage([
            "👤 **Seu Perfil**",
            "",
            `**Nome:** ${this.user.name}`,
            `**Email:** ${this.user.email}`,
            `**Faixa Etária:** ${this.user.ageRange || 'Não informado'}`,
            `**Membro desde:** ${new Date(this.user.createdAt).toLocaleDateString('pt-BR')}`,
            "",
            "Para atualizar suas informações, entre em contato conosco."
        ], false, true);
    }

    // Speech & Voice
    initializeSpeech() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.elements.micBtn.style.display = 'none';
            return;
        }

        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.lang = 'pt-BR';
        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = false;

        this.speechRecognition.onstart = () => {
            this.setOrbState('listening');
            this.elements.micBtn.classList.add('active-mic');
            this.showToast('🎤 Escutando...');
        };

        this.speechRecognition.onend = () => {
            this.setOrbState('idle');
            this.elements.micBtn.classList.remove('active-mic');
        };

        this.speechRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.elements.userInput.value = transcript;
            this.showToast(`Entendi: "${transcript}"`);
            setTimeout(() => this.handleUserInput(), 500);
        };

        this.speechRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.setOrbState('idle');
            this.elements.micBtn.classList.remove('active-mic');
            this.showToast('❌ Erro no reconhecimento de voz');
        };
    }

    toggleVoiceRecognition() {
        if (this.speechRecognition) {
            this.speechRecognition.start();
        } else {
            this.showToast('❌ Reconhecimento de voz não disponível');
        }
    }

    speak(text) {
        if ('speechSynthesis' in window && this.voiceEnabled) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.85; // Slower for better comprehension
            utterance.pitch = 1.1;
            speechSynthesis.speak(utterance);
        }
    }

    // UI Helpers
    setOrbState(state) {
        this.elements.orb.classList.remove('thinking', 'listening');
        if (state === 'thinking') {
            this.elements.orb.classList.add('thinking');
        } else if (state === 'listening') {
            this.elements.orb.classList.add('listening');
        }
    }

    showToast(message) {
        this.elements.toast.textContent = message;
        this.elements.toast.classList.add('show');
        setTimeout(() => this.elements.toast.classList.remove('show'), 3000);
    }

    showLoading(show) {
        if (show) {
            this.elements.loadingOverlay.classList.remove('hidden');
        } else {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('yume_theme', theme);
        this.showToast(`Tema ${theme === 'dark' ? 'escuro' : 'claro'} ativado`);
    }

    toggleVoice() {
        this.voiceEnabled = this.elements.voiceToggle.checked;
        localStorage.setItem('yume_voice', this.voiceEnabled);
        this.showToast(`Voz da Yume ${this.voiceEnabled ? 'ativada' : 'desativada'}`);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new YumeAssistant();
});
