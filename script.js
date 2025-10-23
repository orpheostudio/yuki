            static createChatInterface() {
                return `
                    <div class="chat-interface" id="chatInterface">
                        <div class="chat-header">
                            <div class="header-left">
                                <button class="icon-btn" onclick="app.toggleSidebar()">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                                    </svg>
                                </button>
                                <div class="header-info">
                                    <img src="https://i.imgur.com/5watJQF.png" alt="Sena" class="header-avatar">
                                    <div class="header-text">
                                        <h2 class="header-name">Sena</h2>
                                        <div class="header-status">
                                            <span class="status-dot"></span>
                                            <span class="status-text">Online</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="header-right">
                                <button class="icon-btn" onclick="app.toggleTheme()" title="Alternar tema">
                                    <svg class="theme-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                                    </svg>
                                </button>
                                <button class="icon-btn" onclick="app.showInfo()" title="Informações">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div class="chat-messages" id="chatMessages">
                            <!-- Messages here -->
                        </div>
                        
                        <div class="chat-disclaimer">
                            <svg class="disclaimer-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                            <span>Sena pode cometer erros. Verifique informações importantes.</span>
                        </div>
                        
                        <div class="chat-input-container">
                            <div class="voice-indicator hidden" id="voiceIndicator">
                                <div class="voice-bars">
                                    <span class="voice-bar"></span>
                                    <span class="voice-bar"></span>
                                    <span class="voice-bar"></span>
                                    <span class="voice-bar"></span>
                                </div>
                                <span class="voice-text">Escutando...</span>
                            </div>
                            
                            <form class="chat-input-form" id="messageForm">
                                <button type="button" class="icon-btn voice-btn" onclick="app.toggleVoice()">
                                    <svg id="micIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                                    </svg>
                                </button>
                                
                                <input 
                                    type="text" 
                                    class="chat-input" 
                                    id="messageInput" 
                                    placeholder="Digite sua mensagem..."
                                    autocomplete="off"
                                    maxlength="4000"
                                />
                                
                                <button type="submit" class="btn-send" id="sendBtn">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    <div class="sidebar" id="sidebar">
                        <div class="sidebar-header">
                            <h3>Menu</h3>
                            <button class="icon-btn" onclick="app.toggleSidebar()">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="sidebar-content">
                            <div class="sidebar-section">
                                <h4>Chat</h4>
                                <button class="sidebar-item" onclick="app.clearChat()">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                    <span>Nova Conversa</span>
                                </button>
                            </div>
                            
                            <div class="sidebar-section">
                                <h4>Ferramentas</h4>
                                <button class="sidebar-item" onclick="app.tools.textSummary()">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <span>Resumo de Texto</span>
                                </button>
                                <button class="sidebar-item" onclick="app.tools.qrGenerator()">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                                    </svg>
                                    <span>Gerador QR Code</span>
                                </button>
                                <button class="sidebar-item" onclick="app.tools.passwordGenerator()">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                    </svg>
                                    <span>Gerar Senha Forte</span>
                                </button>
                            </div>
                            
                            <div class="sidebar-section">
                                <h4>Informações</h4>
                                <button class="sidebar-item" onclick="window.open('https://termos.orpheostudio.com.br', '_blank')">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <span>Termos de Uso</span>
                                </button>
                                <button class="sidebar-item" onclick="window.open('https://politicas.orpheostudio.com.br', '_blank')">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                    </svg>
                                    <span>Políticas de Privacidade</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="sidebar-footer">
                            <p>MiraAI by Orpheo Studio 🌸</p>
                            <p class="version">v5.0 Aurora</p>
                        </div>
                    </div>
                    
                    <div class="sidebar-overlay" id="sidebarOverlay" onclick="app.toggleSidebar()"></div>
                `;
            }
        }
        
        // ==================== MAIN APPLICATION ====================
        
        class SenaApp {
            constructor() {
                this.state = new StateManager();
                this.api = new MistralAPI(CONFIG.API.mistral);
                this.recognition = null;
                
                this.init();
            }
            
            async init() {
                try {
                    console.log('🌸 Initializing SENA v5.0...');
                    
                    // Setup
                    this.setupDOM();
                    this.setupEventListeners();
                    this.setupSpeechRecognition();
                    this.setupStateSubscriptions();
                    
                    // Apply saved theme
                    this.applyTheme(this.state.getState('theme'));
                    
                    // Hide loading
                    await Utils.sleep(1500);
                    document.getElementById('loadingScreen').classList.add('hidden');
                    
                    console.log('✅ SENA initialized successfully');
                } catch (error) {
                    ErrorHandler.handle(error, 'app_initialization');
                }
            }
            
            setupDOM() {
                const app = document.getElementById('app');
                app.innerHTML = UIComponents.createSplashScreen();
            }
            
            setupEventListeners() {
                // Form submit
                document.addEventListener('submit', (e) => {
                    if (e.target.id === 'messageForm') {
                        e.preventDefault();
                        this.handleSubmit();
                    }
                });
                
                // Keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        const sidebar = document.getElementById('sidebar');
                        if (sidebar && sidebar.classList.contains('active')) {
                            this.toggleSidebar();
                        }
                    }
                    
                    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                        e.preventDefault();
                        document.getElementById('messageInput')?.focus();
                    }
                    
                    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                        e.preventDefault();
                        this.clearChat();
                    }
                });
                
                // Online/Offline detection
                window.addEventListener('online', () => {
                    this.showNotification('Conexão restaurada! 🌐', 'success');
                });
                
                window.addEventListener('offline', () => {
                    this.showNotification('Sem conexão com a internet ⚠️', 'warning');
                });
            }
            
            setupStateSubscriptions() {
                this.state.subscribe('theme', (theme) => {
                    this.applyTheme(theme);
                });
                
                this.state.subscribe('conversationHistory', (history) => {
                    if (history.length > CONFIG.LIMITS.maxHistory) {
                        const trimmed = history.slice(-CONFIG.LIMITS.maxHistory);
                        this.state.setState('conversationHistory', trimmed);
                    }
                });
            }
            
            setupSpeechRecognition() {
                if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    this.recognition = new SpeechRecognition();
                    this.recognition.lang = 'pt-BR';
                    this.recognition.continuous = false;
                    this.recognition.interimResults = false;
                    
                    this.recognition.onresult = (e) => {
                        const transcript = e.results[0][0].transcript;
                        const input = document.getElementById('messageInput');
                        if (input) {
                            input.value = transcript;
                            input.focus();
                        }
                        this.state.setState('isListening', false);
                        this.updateVoiceUI();
                    };
                    
                    this.recognition.onerror = (e) => {
                        console.error('Speech recognition error:', e.error);
                        this.state.setState('isListening', false);
                        this.updateVoiceUI();
                        
                        if (e.error !== 'no-speech') {
                            ErrorHandler.handle(new Error(e.error), 'speech_recognition');
                        }
                    };
                    
                    this.recognition.onend = () => {
                        this.state.setState('isListening', false);
                        this.updateVoiceUI();
                    };
                }
            }
            
            startChat() {
                const app = document.getElementById('app');
                app.innerHTML = UIComponents.createChatInterface();
                
                this.addMessage('bot', 'Olá! Sou a Sena 🌸\n\nComo posso ajudar você hoje?');
                this.showQuickActions();
                
                // Re-setup listeners for new DOM
                this.setupEventListeners();
            }
            
            showQuickActions() {
                const container = document.getElementById('chatMessages');
                const actions = document.createElement('div');
                actions.className = 'quick-actions';
                actions.innerHTML = `
                    <button class="quick-action-btn" onclick="app.selectQuickAction('O que você pode fazer?')">
                        💡 O que você faz?
                    </button>
                    <button class="quick-action-btn" onclick="app.selectQuickAction('Me recomende um anime')">
                        🎌 Recomende anime
                    </button>
                    <button class="quick-action-btn" onclick="app.selectQuickAction('Explique tecnologia 5G')">
                        📡 O que é 5G?
                    </button>
                `;
                container.appendChild(actions);
                this.scrollToBottom();
            }
            
            selectQuickAction(text) {
                const input = document.getElementById('messageInput');
                if (input) {
                    input.value = text;
                    this.handleSubmit();
                }
            }
            
            async handleSubmit() {
                const input = document.getElementById('messageInput');
                const message = input?.value.trim();
                
                if (!message || this.state.getState('isSending')) return;
                
                try {
                    this.state.setState('isSending', true);
                    this.disableSendButton(true);
                    
                    input.value = '';
                    
                    // Add user message
                    this.addMessage('user', message);
                    
                    // Update history
                    const history = this.state.getState('conversationHistory');
                    history.push({ role: 'user', content: message });
                    this.state.setState('conversationHistory', history);
                    
                    // Check NLP first
                    const nlpResponse = NLPProcessor.process(message);
                    
                    if (nlpResponse) {
                        await Utils.sleep(300);
                        this.addMessage('bot', nlpResponse);
                        history.push({ role: 'assistant', content: nlpResponse });
                        this.state.setState('conversationHistory', history);
                    } else {
                        // Use API
                        this.showTyping();
                        
                        const messages = [
                            { role: 'system', content: this.api.getSystemPrompt() },
                            ...history.slice(-10)
                        ];
                        
                        const response = await this.api.call(messages);
                        
                        this.hideTyping();
                        this.addMessage('bot', response);
                        history.push({ role: 'assistant', content: response });
                        this.state.setState('conversationHistory', history);
                    }
                    
                } catch (error) {
                    this.hideTyping();
                    const errorMsg = ErrorHandler.handle(error, 'message_send');
                    this.addMessage('error', errorMsg);
                } finally {
                    this.state.setState('isSending', false);
                    this.disableSendButton(false);
                    input?.focus();
                }
            }
            
            addMessage(type, text) {
                const container = document.getElementById('chatMessages');
                if (!container) return;
                
                const messageDiv = document.createElement('div');
                messageDiv.className = `message message-${type}`;
                
                if (type === 'error') {
                    messageDiv.innerHTML = `
                        <div class="message-error">
                            <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>${Utils.escapeHtml(text)}</span>
                        </div>
                    `;
                } else {
                    const avatar = type === 'user' ? '' : `
                        <img src="https://i.imgur.com/5watJQF.png" alt="Sena" class="message-avatar">
                    `;
                    
                    messageDiv.innerHTML = `
                        ${avatar}
                        <div class="message-bubble">
                            <p>${Utils.escapeHtml(text)}</p>
                            <span class="message-time">${Utils.formatTime()}</span>
                        </div>
                    `;
                }
                
                container.appendChild(messageDiv);
                this.scrollToBottom();
            }
            
            showTyping() {
                const container = document.getElementById('chatMessages');
                if (!container) return;
                
                const typing = document.createElement('div');
                typing.id = 'typingIndicator';
                typing.className = 'message message-bot';
                typing.innerHTML = `
                    <img src="https://i.imgur.com/5watJQF.png" alt="Sena" class="message-avatar">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                `;
                container.appendChild(typing);
                this.scrollToBottom();
            }
            
            hideTyping() {
                document.getElementById('typingIndicator')?.remove();
            }
            
            disableSendButton(disabled) {
                const btn = document.getElementById('sendBtn');
                if (btn) btn.disabled = disabled;
            }
            
            scrollToBottom() {
                const container = document.getElementById('chatMessages');
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            }
            
            clearChat() {
                if (confirm('Deseja limpar a conversa?')) {
                    this.state.setState('conversationHistory', []);
                    const container = document.getElementById('chatMessages');
                    if (container) {
                        container.innerHTML = '';
                        this.addMessage('bot', 'Olá! Sou a Sena 🌸\n\nComo posso ajudar você hoje?');
                        this.showQuickActions();
                    }
                    this.toggleSidebar();
                }
            }
            
            toggleTheme() {
                const current = this.state.getState('theme');
                const newTheme = current === 'light' ? 'dark' : 'light';
                this.state.setState('theme', newTheme);
            }
            
            applyTheme(theme) {
                if (theme === 'dark') {
                    document.body.classList.add('dark');
                } else {
                    document.body.classList.remove('dark');
                }
            }
            
            toggleSidebar() {
                const sidebar = document.getElementById('sidebar');
                const overlay = document.getElementById('sidebarOverlay');
                
                if (sidebar && overlay) {
                    sidebar.classList.toggle('active');
                    overlay.classList.toggle('active');
                }
            }
            
            toggleVoice() {
                if (!this.recognition) {
                    this.showNotification('Seu navegador não suporta reconhecimento de voz', 'error');
                    return;
                }
                
                const isListening = this.state.getState('isListening');
                
                if (isListening) {
                    this.recognition.stop();
                } else {
                    try {
                        this.recognition.start();
                        this.state.setState('isListening', true);
                        this.updateVoiceUI();
                    } catch (error) {
                        ErrorHandler.handle(error, 'voice_start');
                    }
                }
            }
            
            updateVoiceUI() {
                const indicator = document.getElementById('voiceIndicator');
                const micIcon = document.getElementById('micIcon');
                const isListening = this.state.getState('isListening');
                
                if (indicator && micIcon) {
                    if (isListening) {
                        indicator.classList.remove('hidden');
                        micIcon.classList.add('listening');
                    } else {
                        indicator.classList.add('hidden');
                        micIcon.classList.remove('listening');
                    }
                }
            }
            
            showInfo() {
                this.addMessage('bot', `✨ SENA v5.0 Aurora\n\n🌸 Assistente inteligente com MiraAI\n💜 Orpheo Studio\n📱 @orpheostudio\n💰 PIX: sac.studiotsukiyo@outlook.com`);
            }
            
            showNotification(message, type = 'info') {
                // Simple toast notification (can be enhanced)
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
            
            // Tools
            tools = {
                async textSummary() {
                    app.toggleSidebar();
                    const text = prompt('📝 Cole o texto para resumir:');
                    
                    if (text && text.trim()) {
                        app.addMessage('user', `Resumir: ${Utils.truncate(text, 100)}`);
                        app.showTyping();
                        
                        try {
                            const messages = [
                                { role: 'system', content: app.api.getSystemPrompt() },
                                { role: 'user', content: `Faça um resumo objetivo deste texto (máx 3 parágrafos): ${text}` }
                            ];
                            
                            const response = await app.api.call(messages);
                            app.hideTyping();
                            app.addMessage('bot', response);
                        } catch (error) {
                            app.hideTyping();
                            app.addMessage('error', ErrorHandler.handle(error, 'text_summary'));
                        }
                    }
                },
                
                qrGenerator() {
                    app.toggleSidebar();
                    const url = prompt('🔗 Digite o link ou texto:');
                    
                    if (url && url.trim()) {
                        app.addMessage('user', `Gerar QR Code: ${url}`);
                        
                        setTimeout(() => {
                            const container = document.getElementById('chatMessages');
                            const qrDiv = document.createElement('div');
                            qrDiv.className = 'message message-bot';
                            qrDiv.innerHTML = `
                                <img src="https://i.imgur.com/5watJQF.png" alt="Sena" class="message-avatar">
                                <div class="message-bubble qr-bubble">
                                    <p>QR Code gerado! 📱</p>
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}" alt="QR Code" class="qr-image">
                                    <p class="qr-instruction">Escaneie com a câmera</p>
                                </div>
                            `;
                            container.appendChild(qrDiv);
                            app.scrollToBottom();
                        }, 300);
                    }
                },
                
                passwordGenerator() {
                    app.toggleSidebar();
                    
                    const length = 16;
                    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
                    let password = '';
                    
                    for (let i = 0; i < length; i++) {
                        password += charset.charAt(Math.floor(Math.random() * charset.length));
                    }
                    
                    app.addMessage('user', 'Gerar senha forte');
                    
                    setTimeout(() => {
                        const container = document.getElementById('chatMessages');
                        const pwdDiv = document.createElement('div');
                        pwdDiv.className = 'message message-bot';
                        pwdDiv.innerHTML = `
                            <img src="https://i.imgur.com/5watJQF.png" alt="Sena" class="message-avatar">
                            <div class="message-bubble password-bubble">
                                <p>Senha forte gerada! 🔐</p>
                                <div class="password-display">${password}</div>
                                <div class="password-info">
                                    <span>✓ 16 caracteres</span>
                                    <span>✓ Letras e números</span>
                                    <span>✓ Símbolos especiais</span>
                                </div>
                                <button class="btn-copy" onclick="app.copyPassword('${password}')">
                                    Copiar Senha
                                </button>
                            </div>
                        `;
                        container.appendChild(pwdDiv);
                        app.scrollToBottom();
                    }, 300);
                }
            };
            
            async copyPassword(password) {
                try {
                    await Utils.copyToClipboard(password);
                    this.showNotification('✅ Senha copiada!', 'success');
                } catch (error) {
                    this.showNotification('❌ Erro ao copiar', 'error');
                }
            }
        }

        // ==================== STYLES COMPLETION ====================

        const styles = `
            /* Complete CSS Styles */
            .app-container {
                width: 100%;
                height: 100vh;
                display: flex;
                flex-direction: column;
                position: relative;
            }

            /* Chat Interface */
            .chat-interface {
                flex: 1;
                display: flex;
                flex-direction: column;
                height: 100vh;
                background: var(--bg-light);
                position: relative;
            }

            body.dark .chat-interface {
                background: var(--bg-dark);
            }

            /* Header */
            .chat-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem 1.5rem;
                background: var(--surface-light);
                border-bottom: 1px solid var(--border-light);
                backdrop-filter: blur(20px);
                position: sticky;
                top: 0;
                z-index: 100;
            }

            body.dark .chat-header {
                background: var(--surface-dark);
                border-bottom-color: var(--border-dark);
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .header-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .header-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid var(--primary);
            }

            .header-text h2 {
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--text-light);
                margin: 0;
            }

            body.dark .header-text h2 {
                color: var(--text-dark);
            }

            .header-status {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 0.25rem;
            }

            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #10B981;
                animation: pulse 2s infinite;
            }

            .status-text {
                font-size: 0.75rem;
                color: #6B7280;
            }

            body.dark .status-text {
                color: #9CA3AF;
            }

            .header-right {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            /* Icon Buttons */
            .icon-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border: none;
                background: transparent;
                border-radius: 10px;
                color: var(--text-light);
                cursor: pointer;
                transition: all var(--transition-base);
                position: relative;
            }

            .icon-btn:hover {
                background: var(--primary-light);
                color: white;
                transform: translateY(-2px);
            }

            .icon-btn svg {
                width: 20px;
                height: 20px;
            }

            body.dark .icon-btn {
                color: var(--text-dark);
            }

            /* Messages Area */
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 1.5rem;
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                scroll-behavior: smooth;
            }

            /* Message Styles */
            .message {
                display: flex;
                gap: 0.75rem;
                max-width: 85%;
                animation: fadeIn 0.3s ease-out;
            }

            .message-user {
                align-self: flex-end;
                flex-direction: row-reverse;
            }

            .message-bot {
                align-self: flex-start;
            }

            .message-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                object-fit: cover;
                flex-shrink: 0;
            }

            .message-bubble {
                background: var(--surface-light);
                padding: 1rem 1.25rem;
                border-radius: 18px;
                box-shadow: var(--shadow-sm);
                position: relative;
                border: 1px solid var(--border-light);
            }

            .message-user .message-bubble {
                background: var(--primary);
                color: white;
                border-bottom-right-radius: 4px;
            }

            .message-bot .message-bubble {
                background: var(--surface-light);
                color: var(--text-light);
                border-bottom-left-radius: 4px;
            }

            body.dark .message-bot .message-bubble {
                background: var(--surface-dark);
                color: var(--text-dark);
                border-color: var(--border-dark);
            }

            .message-bubble p {
                margin: 0;
                line-height: 1.5;
                white-space: pre-wrap;
                word-wrap: break-word;
            }

            .message-time {
                font-size: 0.75rem;
                opacity: 0.7;
                margin-top: 0.5rem;
                display: block;
            }

            /* Error Message */
            .message-error {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 1rem;
                background: #FEF2F2;
                border: 1px solid #FECACA;
                border-radius: 12px;
                color: #DC2626;
                max-width: 100%;
            }

            body.dark .message-error {
                background: #1F1315;
                border-color: #7F1D1D;
                color: #EF4444;
            }

            .error-icon {
                width: 20px;
                height: 20px;
                flex-shrink: 0;
            }

            /* Typing Indicator */
            .typing-indicator {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 1rem;
            }

            .typing-indicator span {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--primary);
                animation: typing 1.4s infinite ease-in-out;
            }

            .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
            .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

            @keyframes typing {
                0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }

            /* Quick Actions */
            .quick-actions {
                display: flex;
                gap: 0.75rem;
                flex-wrap: wrap;
                justify-content: center;
                margin: 1rem 0;
            }

            .quick-action-btn {
                padding: 0.75rem 1.25rem;
                background: var(--surface-light);
                border: 1px solid var(--border-light);
                border-radius: 12px;
                color: var(--text-light);
                cursor: pointer;
                transition: all var(--transition-base);
                font-size: 0.875rem;
                font-weight: 500;
            }

            .quick-action-btn:hover {
                background: var(--primary);
                color: white;
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
            }

            body.dark .quick-action-btn {
                background: var(--surface-dark);
                border-color: var(--border-dark);
                color: var(--text-dark);
            }

            /* Disclaimer */
            .chat-disclaimer {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 1rem;
                background: var(--surface-light);
                border-top: 1px solid var(--border-light);
                font-size: 0.75rem;
                color: #6B7280;
            }

            body.dark .chat-disclaimer {
                background: var(--surface-dark);
                border-top-color: var(--border-dark);
                color: #9CA3AF;
            }

            .disclaimer-icon {
                width: 16px;
                height: 16px;
                flex-shrink: 0;
            }

            /* Input Area */
            .chat-input-container {
                padding: 1.5rem;
                background: var(--surface-light);
                border-top: 1px solid var(--border-light);
                position: relative;
            }

            body.dark .chat-input-container {
                background: var(--surface-dark);
                border-top-color: var(--border-dark);
            }

            .voice-indicator {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                padding: 1rem;
                background: var(--primary);
                color: white;
                border-radius: 12px;
                margin-bottom: 1rem;
                animation: slideIn 0.3s ease-out;
            }

            .voice-bars {
                display: flex;
                align-items: center;
                gap: 3px;
            }

            .voice-bar {
                width: 3px;
                height: 20px;
                background: currentColor;
                border-radius: 2px;
                animation: voiceBar 1s infinite ease-in-out;
            }

            .voice-bar:nth-child(1) { animation-delay: 0.1s; }
            .voice-bar:nth-child(2) { animation-delay: 0.2s; }
            .voice-bar:nth-child(3) { animation-delay: 0.3s; }
            .voice-bar:nth-child(4) { animation-delay: 0.4s; }

            @keyframes voiceBar {
                0%, 100% { transform: scaleY(0.3); }
                50% { transform: scaleY(1); }
            }

            .voice-text {
                font-weight: 500;
            }

            .chat-input-form {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                background: var(--bg-light);
                border: 2px solid var(--border-light);
                border-radius: 16px;
                padding: 0.5rem;
                transition: all var(--transition-base);
            }

            .chat-input-form:focus-within {
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }

            body.dark .chat-input-form {
                background: var(--bg-dark);
                border-color: var(--border-dark);
            }

            .chat-input {
                flex: 1;
                border: none;
                background: transparent;
                padding: 0.75rem;
                font-size: 1rem;
                color: var(--text-light);
                outline: none;
                resize: none;
                max-height: 120px;
            }

            body.dark .chat-input {
                color: var(--text-dark);
            }

            .chat-input::placeholder {
                color: #9CA3AF;
            }

            .voice-btn, .btn-send {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border: none;
                border-radius: 10px;
                background: transparent;
                color: var(--text-light);
                cursor: pointer;
                transition: all var(--transition-base);
            }

            .voice-btn:hover, .btn-send:hover {
                background: var(--primary);
                color: white;
            }

            .voice-btn svg, .btn-send svg {
                width: 20px;
                height: 20px;
            }

            .btn-send:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .btn-send:disabled:hover {
                background: transparent;
                color: var(--text-light);
            }

            body.dark .voice-btn, body.dark .btn-send {
                color: var(--text-dark);
            }

            /* Listening State */
            .listening {
                color: var(--secondary) !important;
                animation: pulse 1s infinite;
            }

            /* Sidebar */
            .sidebar {
                position: fixed;
                top: 0;
                left: -320px;
                width: 320px;
                height: 100vh;
                background: var(--surface-light);
                border-right: 1px solid var(--border-light);
                z-index: 1000;
                transition: left var(--transition-base);
                display: flex;
                flex-direction: column;
                box-shadow: var(--shadow-xl);
            }

            .sidebar.active {
                left: 0;
            }

            body.dark .sidebar {
                background: var(--surface-dark);
                border-right-color: var(--border-dark);
            }

            .sidebar-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.5rem;
                border-bottom: 1px solid var(--border-light);
            }

            body.dark .sidebar-header {
                border-bottom-color: var(--border-dark);
            }

            .sidebar-header h3 {
                margin: 0;
                color: var(--text-light);
                font-weight: 600;
            }

            body.dark .sidebar-header h3 {
                color: var(--text-dark);
            }

            .sidebar-content {
                flex: 1;
                overflow-y: auto;
                padding: 1rem 0;
            }

            .sidebar-section {
                margin-bottom: 2rem;
            }

            .sidebar-section h4 {
                padding: 0 1.5rem 0.75rem;
                margin: 0;
                color: var(--text-light);
                font-size: 0.875rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            body.dark .sidebar-section h4 {
                color: var(--text-dark);
            }

            .sidebar-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                width: 100%;
                padding: 0.75rem 1.5rem;
                border: none;
                background: transparent;
                color: var(--text-light);
                cursor: pointer;
                transition: all var(--transition-base);
                font-size: 0.875rem;
            }

            .sidebar-item:hover {
                background: var(--primary-light);
                color: white;
            }

            .sidebar-item svg {
                width: 18px;
                height: 18px;
                flex-shrink: 0;
            }

            body.dark .sidebar-item {
                color: var(--text-dark);
            }

            .sidebar-footer {
                padding: 1.5rem;
                border-top: 1px solid var(--border-light);
                text-align: center;
            }

            body.dark .sidebar-footer {
                border-top-color: var(--border-dark);
            }

            .sidebar-footer p {
                margin: 0.25rem 0;
                font-size: 0.75rem;
                color: var(--text-light);
            }

            body.dark .sidebar-footer p {
                color: var(--text-dark);
            }

            .version {
                opacity: 0.7;
            }

            .sidebar-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999;
                opacity: 0;
                visibility: hidden;
                transition: all var(--transition-base);
            }

            .sidebar-overlay.active {
                opacity: 1;
                visibility: visible;
            }

            /* Tool Specific Styles */
            .qr-bubble {
                text-align: center;
            }

            .qr-image {
                max-width: 200px;
                height: auto;
                margin: 1rem auto;
                border-radius: 8px;
                box-shadow: var(--shadow-md);
            }

            .qr-instruction {
                font-size: 0.875rem;
                opacity: 0.7;
                margin: 0.5rem 0 0;
            }

            .password-bubble {
                text-align: center;
            }

            .password-display {
                background: var(--bg-light);
                border: 1px solid var(--border-light);
                border-radius: 8px;
                padding: 1rem;
                margin: 1rem 0;
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.875rem;
                word-break: break-all;
                color: var(--text-light);
            }

            body.dark .password-display {
                background: var(--bg-dark);
                border-color: var(--border-dark);
                color: var(--text-dark);
            }

            .password-info {
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin: 1rem 0;
                flex-wrap: wrap;
            }

            .password-info span {
                font-size: 0.75rem;
                color: #10B981;
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }

            .btn-copy {
                background: var(--primary);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: all var(--transition-base);
                width: 100%;
            }

            .btn-copy:hover {
                background: var(--primary-dark);
                transform: translateY(-2px);
            }

            /* Hidden Utility */
            .hidden {
                display: none !important;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .chat-header {
                    padding: 1rem;
                }

                .chat-messages {
                    padding: 1rem;
                }

                .message {
                    max-width: 95%;
                }

                .sidebar {
                    width: 280px;
                    left: -280px;
                }

                .quick-actions {
                    flex-direction: column;
                    align-items: stretch;
                }

                .quick-action-btn {
                    text-align: center;
                }
            }

            @media (max-width: 480px) {
                .header-text h2 {
                    font-size: 1rem;
                }

                .chat-input-container {
                    padding: 1rem;
                }

                .message-bubble {
                    padding: 0.75rem 1rem;
                }
            }
        `;

        // Inject styles
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        // ==================== INITIALIZATION ====================

        // Create global app instance
        window.app = new SenaApp();

        // Service Worker Registration (PWA)
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }

        // PWA Install Prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button opportunity
            setTimeout(() => {
                if (deferredPrompt && confirm('Deseja instalar o SENA em seu dispositivo?')) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('User accepted install');
                        }
                        deferredPrompt = null;
                    });
                }
            }, 30000);
        });

        console.log('🚀 SENA v5.0 Aurora - Production Ready');
    </script>
</body>
</html>
