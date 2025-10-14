// ========================================== // CONFIGURAÇÃO DA API MISTRAL // ========================================== const API_CONFIG = { API_KEY: "NFuAj8PYUPcaf6tA1BjbyXuIeSjSA4sW", API_URL: "https://api.mistral.ai/v1/chat/completions", MODEL: "mistral-tiny", // Opções: mistral-tiny, mistral-small, mistral-medium TEMPERATURE: 0.7, MAX_TOKENS: 1000 };

// ========================================== // ESTADO DA APLICAÇÃO // ========================================== const appState = { darkMode: false, isListening: false, recognition: null, conversationHistory: [], cookiesAccepted: false, currentFile: null, currentUser: null, isAuthenticated: false, // Novas prefs/telemetria usageTimeMinutes: 0, firstAccess: null };

// ========================================== // PREFERÊNCIAS E CACHE (localStorage) // ========================================== function savePrefs() { try { const toSave = { darkMode: appState.darkMode, cookiesAccepted: appState.cookiesAccepted, currentUser: appState.currentUser, firstAccess: appState.firstAccess, usageTimeMinutes: appState.usageTimeMinutes }; localStorage.setItem('yume_prefs', JSON.stringify(toSave)); } catch (e) { console.warn('Erro ao salvar prefs', e); } }

function loadPrefs() { try { const saved = localStorage.getItem('yume_prefs'); if (saved) { const parsed = JSON.parse(saved); if (typeof parsed.darkMode === 'boolean') appState.darkMode = parsed.darkMode; if (typeof parsed.cookiesAccepted === 'boolean') appState.cookiesAccepted = parsed.cookiesAccepted; if (parsed.currentUser) appState.currentUser = parsed.currentUser; if (parsed.firstAccess) appState.firstAccess = parsed.firstAccess; if (parsed.usageTimeMinutes) appState.usageTimeMinutes = parsed.usageTimeMinutes; } } catch (e) { console.warn('Erro ao carregar prefs', e); } }

// Conversas cache function cacheConversation() { try { localStorage.setItem('yume_conversation', JSON.stringify(appState.conversationHistory)); } catch (e) { console.warn('Erro ao salvar conversa', e); } }

function loadConversation() { try { const saved = localStorage.getItem('yume_conversation'); if (saved) { appState.conversationHistory = JSON.parse(saved); // Re-render mensagens const chatMessages = document.getElementById('chatMessages'); if (chatMessages) { chatMessages.innerHTML = ''; appState.conversationHistory.forEach(msg => addMessage(msg.content, msg.role, { skipCache: true })); } } } catch (e) { console.warn('Erro ao carregar conversa', e); } }

// ========================================== // TELEMETRIA / ESTATÍSTICAS // ========================================== let clickCount = 0; let messageCount = 0;

function initTelemetry() { // primeiro acesso if (!appState.firstAccess) { appState.firstAccess = new Date().toISOString(); savePrefs(); }

// contar tempo de uso (minutos)
setInterval(() => {
    appState.usageTimeMinutes = (appState.usageTimeMinutes || 0) + 1;
    localStorage.setItem('yume_usage_time', String(appState.usageTimeMinutes));
}, 60 * 1000);

// carregar contadores anteriores
const prevMessages = parseInt(localStorage.getItem('yume_message_count') || '0', 10);
messageCount = prevMessages;

}

function incrementMessages() { messageCount++; localStorage.setItem('yume_message_count', String(messageCount)); }

function showStats() { showToast(Cliques: ${clickCount} | Mensagens: ${messageCount} | Tempo (min): ${appState.usageTimeMinutes}, 'info'); }

// ========================================== // TOASTS (fila + animação) // ========================================== const toastQueue = []; let isToastVisible = false;

function showToast(message, type = 'info') { toastQueue.push({ message, type }); if (!isToastVisible) displayNextToast(); }

function displayNextToast() { if (toastQueue.length === 0) { isToastVisible = false; return; } isToastVisible = true; const { message, type } = toastQueue.shift();

const toast = document.createElement('div');
toast.className = `toast ${type}`;
toast.textContent = message;
Object.assign(toast.style, {
    position: 'fixed',
    right: '20px',
    bottom: '20px',
    zIndex: 9999,
    padding: '10px 14px',
    borderRadius: '8px',
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
    opacity: '0',
    transition: 'transform 0.25s ease, opacity 0.25s ease',
    transform: 'translateY(12px)'
});

document.body.appendChild(toast);

requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
});

setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => {
        toast.remove();
        isToastVisible = false;
        displayNextToast();
    }, 300);
}, 3000);

}

// ========================================== // DEBUG PANEL // ========================================== function showDebugPanel() { const panel = document.createElement('div'); panel.className = 'debug-panel'; panel.innerHTML = <h3 style="margin:0 0 8px 0">Yume Debug</h3> <p style="margin:4px 0">Usuário: ${appState.currentUser?.email || 'anônimo'}</p> <p style="margin:4px 0">DarkMode: ${appState.darkMode}</p> <p style="margin:4px 0">Mensagens: ${appState.conversationHistory.length}</p> <p style="margin:4px 0">Cliques: ${clickCount}</p> <button id="closeDebug">Fechar</button>; Object.assign(panel.style, { position: 'fixed', bottom: '10px', right: '10px', background: '#111', color: '#fff', padding: '12px', borderRadius: '8px', zIndex: '10000', minWidth: '200px' }); document.body.appendChild(panel); document.getElementById('closeDebug').addEventListener('click', () => panel.remove()); }

// ========================================== // INATIVIDADE (auto logout) // ========================================== let inactivityTimer; function resetInactivityTimer() { clearTimeout(inactivityTimer); if (appState.isAuthenticated) { inactivityTimer = setTimeout(() => { logout(); showToast('Sessão encerrada por inatividade', 'error'); }, 10 * 60 * 1000); // 10 minutos } } ['click', 'keydown', 'mousemove', 'touchstart'].forEach(evt => document.addEventListener(evt, () => { resetInactivityTimer(); }));

// ========================================== // INICIALIZAÇÃO // ========================================== document.addEventListener('DOMContentLoaded', function() { // carregar prefs e conversa antes de inicializar loadPrefs(); loadConversation(); initializeApp(); showCookieBanner(); initTelemetry(); });

function initializeApp() { setupEventListeners(); setupSpeechRecognition(); setupAuthForms(); updateGreeting();

// Inicializar Google AdSense
if (window.adsbygoogle) {
    (adsbygoogle = window.adsbygoogle || []).push({});
}

// aplicar tema salvo
document.body.classList.toggle('dark-mode', appState.darkMode);

// contadores de clique
document.addEventListener('click', () => clickCount++);

// online/offline
window.addEventListener('offline', () => showToast('Sem conexão com a internet', 'error'));
window.addEventListener('online', () => showToast('Conectado novamente!', 'success'));

// salvar prefs ao fechar
window.addEventListener('beforeunload', () => savePrefs());

}

// ========================================== // SETUP DE EVENT LISTENERS // ========================================== function setupEventListeners() { const chatInput = document.getElementById('chatInput');

if (chatInput) {
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

// Comandos secretos (Ctrl + /)
document.addEventListener('keydown', e => {
    if (e.key === '/' && e.ctrlKey && !e.repeat) {
        e.preventDefault();
        const cmd = prompt('Comando secreto:');
        if (!cmd) return;
        switch (cmd.toLowerCase()) {
            case 'dark':
            case 'darkmode':
                toggleDarkMode();
                break;
            case 'clear':
                clearConversation();
                break;
            case 'status':
                showToast(`Usuário: ${appState.currentUser?.email || 'anônimo'}`, 'info');
                break;
            case 'stats':
                showStats();
                break;
            case 'debug':
                showDebugPanel();
                break;
            default:
                showToast('Comando não reconhecido', 'error');
        }
    }
});

}

function setupAuthForms() { const loginForm = document.getElementById('loginForm'); const signupForm = document.getElementById('signupForm'); const signupPassword = document.getElementById('signupPassword');

if (loginForm) loginForm.addEventListener('submit', handleLogin);
if (signupForm) signupForm.addEventListener('submit', handleSignup);

if (signupPassword) {
    signupPassword.addEventListener('input', checkPasswordStrength);
}

}

function setupSpeechRecognition() { if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) { const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; appState.recognition = new SpeechRecognition(); appState.recognition.continuous = false; appState.recognition.interimResults = false; appState.recognition.lang = 'pt-BR';

appState.recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById('chatInput');
        if (input) input.value = transcript;
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

// ========================================== // AUTENTICAÇÃO // ========================================== async function handleLogin(e) { e.preventDefault();

const email = document.getElementById('loginEmail')?.value || '';
const password = document.getElementById('loginPassword')?.value || '';

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
    // simulação
    await new Promise(resolve => setTimeout(resolve, 1000));

    appState.currentUser = {
        email: email,
        name: email.split('@')[0]
    };
    appState.isAuthenticated = true;

    hideLoading();
    showToast('Login realizado com sucesso!', 'success');
    showChatScreen();
    savePrefs();
    resetInactivityTimer();
} catch (error) {
    hideLoading();
    showToast('Erro no login: ' + error.message, 'error');
}

}

async function handleSignup(e) { e.preventDefault();

const name = document.getElementById('signupName')?.value || '';
const email = document.getElementById('signupEmail')?.value || '';
const password = document.getElementById('signupPassword')?.value || '';
const termsAgree = document.getElementById('termsAgree')?.checked || false;

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
    await new Promise(resolve => setTimeout(resolve, 1000));

    appState.currentUser = {
        email: email,
        name: name
    };
    appState.isAuthenticated = true;

    hideLoading();
    showToast('Conta criada com sucesso!', 'success');
    showChatScreen();
    savePrefs();
    resetInactivityTimer();
} catch (error) {
    hideLoading();
    showToast('Erro no cadastro: ' + error.message, 'error');
}

}

function logout() { if (confirm('Deseja realmente sair?')) { appState.currentUser = null; appState.isAuthenticated = false; appState.conversationHistory = []; document.getElementById('chatMessages').innerHTML = ''; document.getElementById('assistantUI').style.display = 'flex'; showAuthScreen(); hideMenuModal(); showToast('Logout realizado com sucesso', 'success'); savePrefs(); } }

function showLoginForm() { document.getElementById('loginForm').classList.remove('hidden'); document.getElementById('signupForm').classList.add('hidden'); }

function showSignupForm() { document.getElementById('loginForm').classList.add('hidden'); document.getElementById('signupForm').classList.remove('hidden'); }

function showAuthScreen() { document.getElementById('authScreen').classList.remove('hidden'); document.getElementById('chatScreen').classList.add('hidden'); }

function showChatScreen() { document.getElementById('authScreen').classList.add('hidden'); document.getElementById('chatScreen').classList.remove('hidden'); updateGreeting(); }

function checkPasswordStrength() { const password = document.getElementById('signupPassword').value; const strengthBar = document.getElementById('passwordStrength');

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

function isValidEmail(email) { const re = /^[^\s@]+@[^\s@]+.[^\s@]+$/; return re.test(email); }

// ========================================== // SISTEMA DE MENSAGENS // ========================================== async function sendMessage() { const chatInput = document.getElementById('chatInput'); const message = chatInput ? chatInput.value.trim() : '';

if (!message && !appState.currentFile) return;

const sendBtn = document.getElementById('sendBtn');
if (sendBtn) sendBtn.disabled = true;

if (message) {
    addMessage(message, 'user');
    appState.conversationHistory.push({ role: 'user', content: message });
    incrementMessages();
    cacheConversation();
}

if (appState.currentFile) {
    addMessage(`📎 Arquivo: ${appState.currentFile.name}`, 'user');
}

if (chatInput) {
    chatInput.value = '';
    chatInput.style.height = 'auto';
}
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
    cacheConversation();
} catch (error) {
    hideTypingIndicator();
    const errorMsg = "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.";
    addMessage(errorMsg, 'assistant');
    showToast('Erro ao enviar mensagem', 'error');
    console.error('Error:', error);
} finally {
    if (sendBtn) sendBtn.disabled = false;
}

}

// Função auxiliar para tentar cache/resposta local quando offline async function callMistralAPI(message) { const messages = [ { role: "system", content: "Você é Yume, uma assistente virtual inteligente, amigável e prestativa. Responda de forma clara, concisa e em português do Brasil." }, ...appState.conversationHistory.slice(-10), { role: "user", content: message } ];

// offline fallback: tentar resposta em cache (simples)
if (!navigator.onLine) {
    const cached = localStorage.getItem('yume_last_response');
    if (cached) return JSON.parse(cached);
    throw new Error('Offline e sem cache');
}

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
const content = data.choices?.[0]?.message?.content || '--- Sem resposta ---';
try { localStorage.setItem('yume_last_response', JSON.stringify(content)); } catch (e) { /* ignore */ }
return content;

}

function sendQuickReply(text) { const input = document.getElementById('chatInput'); if (input) input.value = text; sendMessage(); }

function addMessage(text, sender, options = {}) { const chatMessages = document.getElementById('chatMessages'); if (!chatMessages) return; const messageDiv = document.createElement('div'); messageDiv.className = message ${sender}-message;

const timestamp = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
});

messageDiv.innerHTML = `
    <div class="message-content">${formatMessage(text)}</div>
    <div class="message-time">${timestamp}</div>
`;

// animação simples de entrada
messageDiv.style.opacity = '0';
messageDiv.style.transform = 'translateY(8px)';
messageDiv.style.transition = 'opacity 0.35s ease, transform 0.35s ease';

chatMessages.appendChild(messageDiv);
setTimeout(() => {
    messageDiv.style.opacity = '1';
    messageDiv.style.transform = 'translateY(0)';
}, 30);

// scroll suave
const chatBody = document.getElementById('chatBody');
setTimeout(() => {
    if (chatBody) chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
}, 120);

}

function formatMessage(text) { return String(text || '') .replace(/**(.?)**/g, '<strong>$1</strong>') .replace(/*(.?)*/g, '<em>$1</em>') .replace(/\n/g, '<br>') .replace(/(.*?)/g, '<code>$1</code>'); }

function showTypingIndicator() { const chatMessages = document.getElementById('chatMessages'); if (!chatMessages) return; const typingDiv = document.createElement('div'); typingDiv.className = 'typing-indicator'; typingDiv.id = 'typingIndicator'; typingDiv.innerHTML = <div class="typing-dot"></div> <div class="typing-dot"></div> <div class="typing-dot"></div>; chatMessages.appendChild(typingDiv);

const chatBody = document.getElementById('chatBody');
if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;

}

function hideTypingIndicator() { const typingIndicator = document.getElementById('typingIndicator'); if (typingIndicator) { typingIndicator.remove(); } }

function clearConversation() { if (confirm('Deseja realmente limpar a conversa?')) { appState.conversationHistory = []; document.getElementById('chatMessages').innerHTML = ''; document.getElementById('assistantUI').style.display = 'flex'; hideMenuModal(); showToast('Conversa limpa com sucesso', 'success'); cacheConversation(); } }

// ========================================== // RECONHECIMENTO DE VOZ // ========================================== function toggleVoiceRecognition() { if (!appState.recognition) { showToast('Reconhecimento de voz não suportado neste navegador', 'error'); return; }

if (!appState.isListening) {
    startVoiceRecognition();
} else {
    stopVoiceRecognition();
}

}

function startVoiceRecognition() { try { appState.recognition.start(); appState.isListening = true; const voiceButton = document.getElementById('voiceButton'); if (voiceButton) voiceButton.classList.add('listening'); showToast('🎤 Ouvindo...', 'success'); } catch (error) { console.error('Error starting recognition:', error); showToast('Erro ao iniciar reconhecimento de voz', 'error'); } }

function stopVoiceRecognition() { if (appState.recognition && appState.isListening) { appState.recognition.stop(); appState.isListening = false; const voiceButton = document.getElementById('voiceButton'); if (voiceButton) voiceButton.classList.remove('listening'); } }

// ========================================== // UPLOAD DE ARQUIVOS // ========================================== function triggerFileInput() { document.getElementById('fileInput').click(); }

function handleFileUpload(event) { const file = event.target.files[0]; if (file) { const maxSize = 10 * 1024 * 1024; // 10MB if (file.size > maxSize) { showToast('Arquivo muito grande. Máximo 10MB', 'error'); return; } appState.currentFile = file; showToast(📎 Arquivo selecionado: ${file.name}, 'success'); } }

// ========================================== // COOKIES // ========================================== function showCookieBanner() { if (!appState.cookiesAccepted) { setTimeout(() => { const el = document.getElementById('cookieBanner'); if (el) el.classList.add('show'); }, 1500); } }

function acceptCookies() { appState.cookiesAccepted = true; const el = document.getElementById('cookieBanner'); if (el) el.classList.remove('show'); showToast('Cookies aceitos', 'success'); savePrefs(); }

function rejectCookies() { appState.cookiesAccepted = false; const el = document.getElementById('cookieBanner'); if (el) el.classList.remove('show'); showToast('Cookies rejeitados', 'success'); savePrefs(); }

// ========================================== // MODAIS // ========================================== function showMenuModal() { const el = document.getElementById('menuModal'); if (el) el.classList.add('active'); }

function hideMenuModal() { const el = document.getElementById('menuModal'); if (el) el.classList.remove('active'); }

function showHelpModal() { hideMenuModal(); const el = document.getElementById('helpModal'); if (el) el.classList.add('active'); }

function hideHelpModal() { const el = document.getElementById('helpModal'); if (el) el.classList.remove('active'); }

function showBugReportModal() { hideHelpModal(); const el = document.getElementById('bugReportModal'); if (el) el.classList.add('active');

const form = document.getElementById('bugReportForm');
if (form) {
    form.onsubmit = function(e) {
        e.preventDefault();
        sendBugReport();
    };
}

}

function hideBugReportModal() { const el = document.getElementById('bugReportModal'); if (el) el.classList.remove('active'); }

function showPremiumModal() { const el = document.getElementById('premiumModal'); if (el) el.classList.add('active'); }

function hidePremiumModal() { const el = document.getElementById('premiumModal'); if (el) el.classList.remove('active'); }

function showAboutModal() { hideMenuModal(); showToast('Yume AI v2.1.0 - Assistente Virtual Inteligente', 'success'); }

function closeModalOnOverlay(event) { if (event.target.classList.contains('modal-overlay')) { event.target.classList.remove('active'); } }

// ========================================== // FUNÇÕES DE AJUDA // ========================================== function openFeedback() { hideHelpModal(); window.open('https://forms.gle/d5su3c9xcQ9EBpLG7', '_blank'); showToast('Abrindo formulário de feedback...', 'success'); }

function sendBugReport() { const title = document.getElementById('bugTitle').value; const description = document.getElementById('bugDescription').value; const category = document.getElementById('bugCategory').value;

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
const form = document.getElementById('bugReportForm');
if (form) form.reset();

}

function openSupport() { hideHelpModal(); window.location.href = 'mailto:sac.studiotsukiyo@outlook.com'; showToast('Abrindo cliente de e-mail...', 'success'); }

// ========================================== // FUNÇÕES PREMIUM // ========================================== function copyPixKey() { const pixKey = document.getElementById('pixKey').value;

navigator.clipboard.writeText(pixKey).then(() => {
    showToast('Chave PIX copiada com sucesso!', 'success');
}).catch(err => {
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

// ========================================== // TEMA ESCURO // ========================================== function toggleDarkMode() { appState.darkMode = !appState.darkMode; document.body.classList.toggle('dark-mode', appState.darkMode);

const icon = document.querySelector('.theme-toggle i');
if (icon) icon.className = appState.darkMode ? 'fas fa-sun' : 'fas fa-moon';

showToast(appState.darkMode ? '🌙 Tema escuro ativado' : '☀️ Tema claro ativado', 'success');

if (document.getElementById('menuModal')?.classList.contains('active')) {
    hideMenuModal();
}

savePrefs();

}

// ========================================== // SAUDAÇÃO PERSONALIZADA // ========================================== function updateGreeting() { const hour = new Date().getHours(); const greetingText = document.getElementById('greetingText'); const helpText = document.getElementById('helpText');

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
    if (greetingText) greetingText.textContent = `${greeting}, ${firstName}! ${emoji}`;
    if (helpText) helpText.textContent = 'Como posso ajudar você hoje?';
} else {
    if (greetingText) greetingText.textContent = `${greeting}! Sou a Yume ${emoji}`;
    if (helpText) helpText.textContent = 'Como posso ajudar você hoje?';
}

}

// ========================================== // UTILITÁRIOS // ========================================== function showLoading(text = 'Processando...') { const loadingOverlay = document.getElementById('loadingOverlay'); const loadingText = loadingOverlay?.querySelector('.loading-text'); if (loadingText) loadingText.textContent = text; if (loadingOverlay) loadingOverlay.classList.add('active'); }

function hideLoading() { const loadingOverlay = document.getElementById('loadingOverlay'); if (loadingOverlay) loadingOverlay.classList.remove('active'); }

// ========================================== // DEBUG / AJUSTES FINAIS // ========================================== // curto atalho para desenvolvedor: Alt + D abre painel document.addEventListener('keydown', e => { if (e.altKey && e.key.toLowerCase() === 'd') showDebugPanel(); });

// inicializar contadores locais document.addEventListener('click', () => clickCount++);

// expor algumas funções no scope global pra debug rápido (opcional) window.YUME = { showDebugPanel, showStats, showToast, savePrefs, loadPrefs };