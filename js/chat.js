// chat.js - Gerenciamento do chat e mensagens

class ChatManager {
    constructor() {
        this.messageCount = 0;
        this.conversationHistory = [];
        this.recognition = null;
        this.isListening = false;
    }

    init() {
        this.initVoiceRecognition();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const inputArea = document.getElementById('inputArea');
        const voiceButton = document.getElementById('voiceButton');
        const fileButton = document.getElementById('fileButton');
        const fileInput = document.getElementById('fileInput');

        if (inputArea) {
            inputArea.addEventListener('submit', (e) => this.handleSendMessage(e));
        }

        if (voiceButton) {
            voiceButton.addEventListener('click', () => this.toggleVoiceRecognition());
        }

        if (fileButton) {
            fileButton.addEventListener('click', () => fileInput.click());
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Quick replies
        document.querySelectorAll('.quick-reply').forEach(button => {
            button.addEventListener('click', function() {
                const message = this.getAttribute('data-message');
                const chatInput = document.getElementById('userInput');
                if (chatInput) {
                    chatInput.value = message;
                    const form = document.getElementById('inputArea');
                    if (form) {
                        form.dispatchEvent(new Event('submit'));
                    }
                }
            });
        });
    }

    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'pt-BR';

            this.recognition.onstart = () => {
                this.isListening = true;
                const voiceButton = document.getElementById('voiceButton');
                if (voiceButton) {
                    voiceButton.classList.add('listening');
                }
                showToast('Ouvindo...');
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const chatInput = document.getElementById('userInput');
                if (chatInput) {
                    chatInput.value = transcript;
                }
                this.isListening = false;
                const voiceButton = document.getElementById('voiceButton');
                if (voiceButton) {
                    voiceButton.classList.remove('listening');
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Erro no reconhecimento de voz:', event.error);
                this.isListening = false;
                const voiceButton = document.getElementById('voiceButton');
                if (voiceButton) {
                    voiceButton.classList.remove('listening');
                }
                showToast('Erro no reconhecimento de voz');
            };

            this.recognition.onend = () => {
                this.isListening = false;
                const voiceButton = document.getElementById('voiceButton');
                if (voiceButton) {
                    voiceButton.classList.remove('listening');
                }
            };
        } else {
            const voiceButton = document.getElementById('voiceButton');
            if (voiceButton) {
                voiceButton.style.display = 'none';
            }
        }
    }

    toggleVoiceRecognition() {
        if (!this.isListening && this.recognition) {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Erro ao iniciar reconhecimento:', error);
                showToast('Erro ao iniciar reconhecimento de voz');
            }
        } else if (this.isListening) {
            this.recognition.stop();
        }
    }

    async handleSendMessage(e) {
        e.preventDefault();
        
        const chatInput = document.getElementById('userInput');
        const message = chatInput.value.trim();
        
        if (!message) return;

        // Adicionar mensagem do usuário
        this.addMessage(message, 'user');
        chatInput.value = '';

        // Esconder UI de boas-vindas
        const assistantUI = document.getElementById('assistantUI');
        if (assistantUI && !assistantUI.classList.contains('hidden')) {
            assistantUI.classList.add('hidden');
        }

        // Adicionar ao histórico
        this.conversationHistory.push({
            role: 'user',
            content: message
        });

        // Salvar mensagem no Supabase
        await this.saveMessageToSupabase(message, 'user');

        // Mostrar loading
        showLoading(true);

        try {
            const response = await fetch(CONFIG.mistral.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.mistral.apiKey}`
                },
                body: JSON.stringify({
                    model: CONFIG.mistral.model,
                    messages: this.conversationHistory.slice(-10), // Últimas 10 mensagens
                    max_tokens: CONFIG.mistral.maxTokens,
                    temperature: CONFIG.mistral.temperature
                })
            });

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            // Adicionar resposta ao histórico
            this.conversationHistory.push({
                role: 'assistant',
                content: aiResponse
            });

            // Adicionar resposta da IA
            this.addMessage(aiResponse, 'assistant');
            await this.saveMessageToSupabase(aiResponse, 'assistant');

        } catch (error) {
            console.error('Erro:', error);
            const fallbackResponse = "Desculpe, estou tendo problemas técnicos no momento. Por favor, tente novamente em alguns instantes. 🌸";
            
            this.conversationHistory.push({
                role: 'assistant',
                content: fallbackResponse
            });
            
            this.addMessage(fallbackResponse, 'assistant');
            await this.saveMessageToSupabase(fallbackResponse, 'assistant');
        } finally {
            showLoading(false);
        }
    }

    addMessage(text, sender, file = null) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        if (file) {
            const fileType = file.type.split('/')[0];
            let fileIcon = 'fa-file';
            if (fileType === 'image') fileIcon = 'fa-image';
            else if (fileType === 'audio') fileIcon = 'fa-music';

            messageDiv.innerHTML = `
                <div>${this.escapeHtml(text)}</div>
                <div class="file-attachment">
                    <i class="fas ${fileIcon}"></i>
                    <span>${this.escapeHtml(file.name)}</span>
                </div>
            `;
        } else {
            messageDiv.textContent = text;

            // Sintetizar voz para respostas da Yume
            if (sender === 'assistant' && 'speechSynthesis' in window) {
                setTimeout(() => {
                    try {
                        const utterance = new SpeechSynthesisUtterance(text);
                        utterance.lang = 'pt-BR';
                        utterance.rate = 1.0;
                        utterance.pitch = 1.0;
                        speechSynthesis.speak(utterance);
                    } catch (error) {
                        console.error('Erro na síntese de voz:', error);
                    }
                }, 500);
            }
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        this.messageCount++;

        // Scroll suave
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    async saveMessageToSupabase(content, sender) {
        const user = authManager.getCurrentUser();
        if (!user?.id) return;

        try {
            const { error } = await supabase
                .from('messages')
                .insert([{
                    user_id: user.id,
                    content: content,
                    sender: sender,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Erro ao salvar mensagem:', error);
        }
    }

    async handleFileUpload(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const fileType = file.type.split('/')[0];
            let message = '';

            if (fileType === 'image') {
                message = `Enviei uma imagem: ${file.name}`;
            } else if (fileType === 'audio') {
                message = `Enviei um arquivo de áudio: ${file.name}`;
            } else {
                message = `Enviei um documento: ${file.name}`;
            }

            this.addMessage(message, 'user', file);
            await this.saveMessageToSupabase(message, 'user');

            // Simular resposta
            setTimeout(() => {
                let response = '';
                if (fileType === 'image') {
                    response = "Que imagem interessante! Obrigada por compartilhar. Posso ajudar com algo relacionado a esta imagem? 🌸";
                } else if (fileType === 'audio') {
                    response = "Obrigada pelo arquivo de áudio! Posso ajudar com informações sobre música ou áudio. 🎵";
                } else {
                    response = "Documento recebido! Posso ajudar a analisar o conteúdo ou responder perguntas sobre ele. 📄";
                }

                this.addMessage(response, 'assistant');
                this.saveMessageToSupabase(response, 'assistant');
            }, 1000);

            // Limpar input
            e.target.value = '';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getMessageCount() {
        return this.messageCount;
    }

    clearHistory() {
        this.conversationHistory = [];
        this.messageCount = 0;
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        const assistantUI = document.getElementById('assistantUI');
        if (assistantUI) {
            assistantUI.classList.remove('hidden');
        }
    }
}

// Instância global
const chatManager = new ChatManager();