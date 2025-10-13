// chat.js - Sistema de chat com voz e integração Supabase (produção)

// Importa o cliente Supabase do config.js
import { supabase } from './config.js';

class ChatManager {
    constructor() {
        this.messageCount = 0;
        this.conversationHistory = [];
        this.recognition = null;
        this.isListening = false;
        this.voiceEnabled = true; // controle global do modo voz
    }

    async init() {
        await this.ensureAuth();
        this.initVoiceRecognition();
        this.setupEventListeners();
        console.log('[Yume Chat] Chat inicializado com sucesso.');
    }

    // Verifica sessão autenticada no Supabase
    async ensureAuth() {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            console.warn('[Yume Chat] Usuário não autenticado. Redirecionando para login...');
            window.location.href = '/login.html';
        } else {
            console.log(`[Yume Chat] Sessão ativa para ${session.user.email}`);
        }
    }

    setupEventListeners() {
        const form = document.getElementById('inputArea');
        const input = document.getElementById('userInput');
        const voiceButton = document.getElementById('voiceButton');
        const fileButton = document.getElementById('fileButton');
        const fileInput = document.getElementById('fileInput');
        const toggleVoiceBtn = document.getElementById('toggleVoiceBtn');

        if (form) {
            form.addEventListener('submit', (e) => this.handleSendMessage(e, input));
        }

        if (voiceButton) {
            voiceButton.addEventListener('click', () => this.toggleVoiceRecognition());
        }

        if (toggleVoiceBtn) {
            toggleVoiceBtn.addEventListener('click', () => this.toggleVoiceEnabled());
        }

        if (fileButton) {
            fileButton.addEventListener('click', () => fileInput.click());
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Quick replies
        document.querySelectorAll('.quick-reply').forEach(button => {
            button.addEventListener('click', () => {
                const message = button.dataset.message;
                if (input) {
                    input.value = message;
                    form.dispatchEvent(new Event('submit'));
                }
            });
        });
    }

    // Inicialização do reconhecimento de voz
    initVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('[Yume Chat] Reconhecimento de voz não suportado.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'pt-BR';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;

        this.recognition.onstart = () => {
            this.isListening = true;
            console.log('[Yume Chat] Escutando...');
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById('userInput');
            if (input) input.value = transcript;
        };

        this.recognition.onend = () => {
            this.isListening = false;
            console.log('[Yume Chat] Reconhecimento de voz encerrado.');
        };
    }

    // Enviar mensagem para o chat
    async handleSendMessage(event, input) {
        event.preventDefault();
        const message = input.value.trim();
        if (!message) return;

        this.messageCount++;
        this.displayMessage('user', message);

        // Grava no banco de dados (sem simulação)
        await supabase.from('chat_logs').insert({
            user_message: message,
            timestamp: new Date()
        });

        // Aqui você pode integrar com a IA real (Mistral, OpenAI, etc)
        const reply = await this.fetchAIResponse(message);

        this.displayMessage('ai', reply);

        input.value = '';
    }

    // Enviar arquivo
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(`chat_files/${file.name}`, file);

        if (error) {
            console.error('[Yume Chat] Erro ao enviar arquivo:', error.message);
        } else {
            console.log('[Yume Chat] Arquivo enviado com sucesso:', data.path);
            this.displayMessage('system', `📁 Arquivo enviado: ${file.name}`);
        }
    }

    // Muda o estado do reconhecimento de voz
    toggleVoiceRecognition() {
        if (!this.voiceEnabled || !this.recognition) return;

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    // Liga/desliga totalmente o modo voz
    toggleVoiceEnabled() {
        this.voiceEnabled = !this.voiceEnabled;
        const status = this.voiceEnabled ? 'ativado' : 'desativado';
        this.displayMessage('system', `🎙️ Modo voz ${status}.`);
        console.log(`[Yume Chat] Modo voz ${status}.`);
    }

    // Exibir mensagens no chat
    displayMessage(sender, text) {
        const chatBox = document.getElementById('chatBox');
        if (!chatBox) return;

        const msgElement = document.createElement('div');
        msgElement.className = `message ${sender}`;
        msgElement.innerText = text;

        chatBox.appendChild(msgElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Chamada para IA (API real)
    async fetchAIResponse(message) {
        try {
            const response = await fetch(CONFIG.mistral.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.mistral.apiKey}`
                },
                body: JSON.stringify({
                    model: CONFIG.mistral.model,
                    messages: [{ role: 'user', content: message }],
                    max_tokens: CONFIG.mistral.maxTokens,
                    temperature: CONFIG.mistral.temperature
                })
            });

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content || 'Erro ao processar resposta.';
            return reply;
        } catch (err) {
            console.error('[Yume Chat] Erro na IA:', err);
            return 'Desculpe, ocorreu um erro ao tentar responder.';
        }
    }
}

// Inicializa o chat
document.addEventListener('DOMContentLoaded', () => {
    const chat = new ChatManager();
    chat.init();
});