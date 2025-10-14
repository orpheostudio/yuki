// ==========================================
// CONFIGURAÇÃO DA API MISTRAL
// ==========================================
const API_CONFIG = {
    API_KEY: "NFuAj8PYUPcaf6tA1BjbyXuIeSjSA4sW",
    API_URL: "https://api.mistral.ai/v1/chat/completions",
    MODEL: "mistral-tiny", // Opções: mistral-tiny, mistral-small, mistral-medium
    TEMPERATURE: 0.7,
    MAX_TOKENS: 1000
};

// ==========================================
// ESTADO DA APLICAÇÃO
// ==========================================
const appState = {
    darkMode: false,
    isListening: false,
    recognition: null,
    conversationHistory: [],
    cookiesAccepted: false,
    currentFile: null,
    currentUser: null,
    isAuthenticated: false
};

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    showCookieBanner();
});

function initializeApp() {
    setupEventListeners();
    setupSpeechRecognition();
    setupAuthForms();
    updateGreeting();
    
    // Inicializar Google AdSense
    if (window.adsbygoogle) {
        (adsbygoogle = window.adsbygoogle || []).push({});
    }
}

// ==========================================
// SETUP DE EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    const chatInput = document.getElementById('chatInput');
    
    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Enter para enviar (Shift+Enter para nova linha)
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const signupPassword = document.getElementById('signupPassword');

    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    
    if (signupPassword) {
        signupPassword.addEventListener('input', checkPasswordStrength);
    }
}

function setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        appState.recognition = new SpeechRecognition();
        appState.recognition.continuous = false;
        appState.recognition.interimResults = false;
        appState.recognition.lang = 'pt-BR';

        appState.recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('chatInput').value = transcript;
            stopVoiceRecognition();
            showToast('Texto reconhecido!', 'success');
        };

        appState.recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            stopVoiceRecognition();
            showToast('Erro no reconhecimento de voz', 'error');
        };

        appState.recognition.onend = function() {
            stopVoiceRecognition();
        };
    }
}

// ==========================================
// AUTENTICAÇÃO
// ==========================================
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!isValidEmail(email)) {
        showToast('Por favor, insira um e-mail válido', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Senha muito curta', 'error');
        return;
    }

    showLoading('Fazendo login...');

    try {
        // AQUI VOCÊ DEVE IMPLEMENTAR SUA LÓGICA REAL DE AUTENTICAÇÃO
        // Exemplo de chamada para sua API:
        // const response = await fetch('YOUR_API_URL/login', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email, password })
        // });
        // const data = await response.json();
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        appState.currentUser = {
            email: email,
            name: email.split('@')[0]
        };
        appState.isAuthenticated = true;

        hideLoading();
        showToast('Login realizado com sucesso!', 'success');
        showChatScreen();
    } catch (error) {
        hideLoading();
        showToast('Erro no login: ' + error.message, 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const termsAgree = document.getElementById('termsAgree').checked;

    if (!isValidEmail(email)) {
        showToast('Por favor, insira um e-mail válido', 'error');
        return;
    }

    if (password.length < 8) {
        showToast('A senha deve ter no mínimo 8 caracteres', 'error');
        return;
    }

    if (!termsAgree) {
        showToast('Você precisa aceitar os termos de serviço', 'error');
        return;
    }

    showLoading('Criando conta...');

    try {
        // AQUI VOCÊ DEVE IMPLEMENTAR SUA LÓGICA REAL DE CADASTRO
        // Exemplo de chamada para sua API:
        // const response = await fetch('YOUR_API_URL/signup', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ name, email, password })
        // });
        // const data = await response.json();
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        appState.currentUser = {
            email: email,
            name: name
        };
        appState.isAuthenticated = true;

        hideLoading();
        showToast('Conta criada com sucesso!', 'success');
        showChatScreen();
    } catch (error) {
        hideLoading();
        showToast('Erro no cadastro: ' + error.message, 'error');
    }
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        appState.currentUser = null;
        appState.isAuthenticated = false;
        appState.conversationHistory = [];
        document.getElementById('chatMessages').innerHTML = '';
        document.getElementById('assistantUI').style.display = 'flex';
        showAuthScreen();
        hideMenuModal();
        showToast('Logout realizado com sucesso', 'success');
    }
}

function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
}

function showSignupForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
}

function showAuthScreen() {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('chatScreen').classList.add('hidden');
}

function showChatScreen() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('chatScreen').classList.remove('hidden');
    updateGreeting();
}

function checkPasswordStrength() {
    const password = document.getElementById('signupPassword').value;
    const strengthBar = document.getElementById('passwordStrength');

    if (!strengthBar) return;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;

    strengthBar.className = 'password-strength-bar';
    
    if (password.length === 0) {
        strengthBar.style.width = '0%';
    } else if (strength <= 1) {
        strengthBar.classList.add('weak');
    } else if (strength <= 3) {
        strengthBar.classList.add('medium');
    } else {
        strengthBar.classList.add('strong');
    }
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ==========================================
// SISTEMA DE MENSAGENS
// ==========================================
async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message && !appState.currentFile) return;

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;

    if (message) {
        addMessage(message, 'user');
        appState.conversationHistory.push({ role: 'user', content: message });
    }

    if (appState.currentFile) {
        addMessage(`📎 Arquivo: ${appState.currentFile.name}`, 'user');
    }

    chatInput.value = '';
    chatInput.style.height = 'auto';
    appState.currentFile = null;

    const assistantUI = document.getElementById('assistantUI');
    if (assistantUI) {
        assistantUI.style.display = 'none';
    }

    showTypingIndicator();

    try {
        const response = await callMistralAPI(message);
        hideTypingIndicator();
        addMessage(response, 'assistant');
        appState.conversationHistory.push({ role: 'assistant', content: response });
    } catch (error) {
        hideTypingIndicator();
        const errorMsg = "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.";
        addMessage(errorMsg, 'assistant');
        showToast('Erro ao enviar mensagem', 'error');
        console.error('Error:', error);
    } finally {
        sendBtn.disabled = false;
    }
}

async function callMistralAPI(message) {
    const messages = [
        {
            role: "system",
            content: "Você é Yume, uma assistente virtual inteligente, amigável e prestativa. Responda de forma clara, concisa e em português do Brasil."
        },
        ...appState.conversationHistory.slice(-10),
        {
            role: "user",
            content: message
        }
    ];

    const response = await fetch(API_CONFIG.API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_CONFIG.API_KEY}`
        },
        body: JSON.stringify({
            model: API_CONFIG.MODEL,
            messages: messages,
            temperature: API_CONFIG.TEMPERATURE,
            max_tokens: API_CONFIG.MAX_TOKENS
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

function sendQuickReply(text) {
    document.getElementById('chatInput').value = text;
    sendMessage();
}

function addMessage(text, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const timestamp = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
        <div class="message-content">${formatMessage(text)}</div>
        <div class="message-time">${timestamp}</div>
    `;

    chatMessages.appendChild(messageDiv);
    
    const chatBody = document.getElementById('chatBody');
    setTimeout(() => {
        chatBody.scrollTo({
            top: chatBody.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
}

function formatMessage(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatMessages.appendChild(typingDiv);
    
    const chatBody = document.getElementById('chatBody');
    chatBody.scrollTop = chatBody.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function clearConversation() {
    if (confirm('Deseja realmente limpar a conversa?')) {
        appState.conversationHistory = [];
        document.getElementById('chatMessages').innerHTML = '';
        document.getElementById('assistantUI').style.display = 'flex';
        hideMenuModal();
        showToast('Conversa limpa com sucesso', 'success');
    }
}

// ==========================================
// RECONHECIMENTO DE VOZ
// ==========================================
function toggleVoiceRecognition() {
    if (!appState.recognition) {
        showToast('Reconhecimento de voz não suportado neste navegador', 'error');
        return;
    }

    if (!appState.isListening) {
        startVoiceRecognition();
    } else {
        stopVoiceRecognition();
    }
}

function startVoiceRecognition() {
    try {
        appState.recognition.start();
        appState.isListening = true;
        const voiceButton = document.getElementById('voiceButton');
        voiceButton.classList.add('listening');
        showToast('🎤 Ouvindo...', 'success');
    } catch (error) {
        console.error('Error starting recognition:', error);
        showToast('Erro ao iniciar reconhecimento de voz', 'error');
    }
}

function stopVoiceRecognition() {
    if (appState.recognition && appState.isListening) {
        appState.recognition.stop();
        appState.isListening = false;
        const voiceButton = document.getElementById('voiceButton');
        voiceButton.classList.remove('listening');
    }
}

// ==========================================
// UPLOAD DE ARQUIVOS
// ==========================================
function triggerFileInput() {
    document.getElementById('fileInput').click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showToast('Arquivo muito grande. Máximo 10MB', 'error');
            return;
        }
        appState.currentFile = file;
        showToast(`📎 Arquivo selecionado: ${file.name}`, 'success');
    }
}

// ==========================================
// COOKIES
// ==========================================
function showCookieBanner() {
    if (!appState.cookiesAccepted) {
        setTimeout(() => {
            document.getElementById('cookieBanner').classList.add('show');
        }, 1500);
    }
}

function acceptCookies() {
    appState.cookiesAccepted = true;
    document.getElementById('cookieBanner').classList.remove('show');
    showToast('Cookies aceitos', 'success');
}

function rejectCookies() {
    appState.cookiesAccepted = false;
    document.getElementById('cookieBanner').classList.remove('show');
    showToast('Cookies rejeitados', 'success');
}

// ==========================================
// MODAIS
// ==========================================
function showMenuModal() {
    document.getElementById('menuModal').classList.add('active');
}

function hideMenuModal() {
    document.getElementById('menuModal').classList.remove('active');
}

function showHelpModal() {
    hideMenuModal();
    document.getElementById('helpModal').classList.add('active');
}

function hideHelpModal() {
    document.getElementById('helpModal').classList.remove('active');
}

function showBugReportModal() {
    hideHelpModal();
    document.getElementById('bugReportModal').classList.add('active');
    
    const form = document.getElementById('bugReportForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        sendBugReport();
    };
}

function hideBugReportModal() {
    document.getElementById('bugReportModal').classList.remove('active');
}

function showPremiumModal() {
    document.getElementById('premiumModal').classList.add('active');
}

function hidePremiumModal() {
    document.getElementById('premiumModal').classList.remove('active');
}

function showAboutModal() {
    hideMenuModal();
    showToast('Yume AI v2.1.0 - Assistente Virtual Inteligente', 'success');
}

function closeModalOnOverlay(event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.classList.remove('active');
    }
}

// ==========================================
// FUNÇÕES DE AJUDA
// ==========================================
function openFeedback() {
    hideHelpModal();
    window.open('https://forms.gle/d5su3c9xcQ9EBpLG7', '_blank');
    showToast('Abrindo formulário de feedback...', 'success');
}

function sendBugReport() {
    const title = document.getElementById('bugTitle').value;
    const description = document.getElementById('bugDescription').value;
    const category = document.getElementById('bugCategory').value;
    
    const emailSubject = encodeURIComponent(`[Bug Report] ${title}`);
    const emailBody = encodeURIComponent(
        `Título: ${title}\n\n` +
        `Categoria: ${category}\n\n` +
        `Descrição:\n${description}\n\n` +
        `---\n` +
        `Enviado por: ${appState.currentUser ? appState.currentUser.email : 'Usuário não autenticado'}\n` +
        `Data: ${new Date().toLocaleString('pt-BR')}`
    );
    
    window.location.href = `mailto:sac.studiotsukiyo@outlook.com?subject=${emailSubject}&body=${emailBody}`;
    
    hideBugReportModal();
    showToast('Abrindo cliente de e-mail...', 'success');
    
    // Limpar formulário
    document.getElementById('bugReportForm').reset();
}

function openSupport() {
    hideHelpModal();
    window.location.href = 'mailto:sac.studiotsukiyo@outlook.com';
    showToast('Abrindo cliente de e-mail...', 'success');
}

// ==========================================
// FUNÇÕES PREMIUM
// ==========================================
function copyPixKey() {
    const pixKey = document.getElementById('pixKey').value;
    
    navigator.clipboard.writeText(pixKey).then(() => {
        showToast('Chave PIX copiada com sucesso!', 'success');
    }).catch(err => {
        // Fallback para navegadores que não suportam clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = pixKey;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Chave PIX copiada com sucesso!', 'success');
        } catch (err) {
            showToast('Erro ao copiar chave PIX', 'error');
        }
        document.body.removeChild(textArea);
    });
}

// ==========================================
// TEMA ESCURO
// ==========================================
function toggleDarkMode() {
    appState.darkMode = !appState.darkMode;
    document.body.classList.toggle('dark-mode', appState.darkMode);
    
    const icon = document.querySelector('.theme-toggle i');
    icon.className = appState.darkMode ? 'fas fa-sun' : 'fas fa-moon';
    
    showToast(appState.darkMode ? '🌙 Tema escuro ativado' : '☀️ Tema claro ativado', 'success');
    
    if (document.getElementById('menuModal').classList.contains('active')) {
        hideMenuModal();
    }
}

// ==========================================
// SAUDAÇÃO PERSONALIZADA
// ==========================================
function updateGreeting() {
    const hour = new Date().getHours();
    const greetingText = document.getElementById('greetingText');
    const helpText = document.getElementById('helpText');

    let greeting = '';
    let emoji = '';
    
    if (hour < 12) {
        greeting = 'Bom dia';
        emoji = '🌅';
    } else if (hour < 18) {
        greeting = 'Boa tarde';
        emoji = '☀️';
    } else {
        greeting = 'Boa noite';
        emoji = '🌙';
    }

    if (appState.currentUser) {
        const firstName = appState.currentUser.name.split(' ')[0];
        greetingText.textContent = `${greeting}, ${firstName}! ${emoji}`;
        helpText.textContent = 'Como posso ajudar você hoje?';
    } else {
        greetingText.textContent = `${greeting}! Sou a Yume ${emoji}`;
        helpText.textContent = 'Como posso ajudar você hoje?';
    }
}

// ==========================================
// UTILITÁRIOS
// ==========================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showLoading(text = 'Processando...') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = loadingOverlay.querySelector('.loading-text');
    loadingText.textContent = text;
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}