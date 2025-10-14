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
    isAuthenticated: false,
    isLoading: false // Novo estado para controle de loading
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
    const toggleAuthFormBtn = document.getElementById('toggleAuthForm');

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

    // Botão para alternar entre login e cadastro
    if (toggleAuthFormBtn) {
        toggleAuthFormBtn.addEventListener('click', function() {
            const isLoginVisible = document.getElementById('loginForm').classList.contains('hidden');
            if (isLoginVisible) {
                showLoginForm();
            } else {
                showSignupForm();
            }
        });
    }
}

function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const signupPassword = document.getElementById('signupPassword');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    if (signupPassword) {
        signupPassword.addEventListener('input', checkPasswordStrength);
    }
}

// ==========================================
// AUTENTICAÇÃO
// ==========================================
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');

    if (!isValidEmail(email)) {
        showToast('Por favor, insira um e-mail válido', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Senha muito curta', 'error');
        return;
    }

    // Feedback visual imediato
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

    try {
        // Simulação de requisição assíncrona (substituir por fetch real)
        await new Promise(resolve => setTimeout(resolve, 500));

        appState.currentUser = {
            email: email,
            name: email.split('@')[0]
        };
        appState.isAuthenticated = true;

        showToast('Login realizado com sucesso!', 'success');
        showChatScreen();
    } catch (error) {
        showToast('Erro no login: ' + error.message, 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Entrar';
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const termsAgree = document.getElementById('termsAgree').checked;
    const signupBtn = document.getElementById('signupBtn');

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

    // Feedback visual imediato
    signupBtn.disabled = true;
    signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';

    try {
        // Simulação de requisição assíncrona (substituir por fetch real)
        await new Promise(resolve => setTimeout(resolve, 500));

        appState.currentUser = {
            email: email,
            name: name
        };
        appState.isAuthenticated = true;

        showToast('Conta criada com sucesso!', 'success');
        showChatScreen();
    } catch (error) {
        showToast('Erro no cadastro: ' + error.message, 'error');
    } finally {
        signupBtn.disabled = false;
        signupBtn.textContent = 'Cadastrar';
    }
}

// ==========================================
// FUNÇÕES DE EXIBIÇÃO DE FORMULÁRIOS
// ==========================================
function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('toggleAuthForm').textContent = 'Cadastre-se';
}

function showSignupForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('toggleAuthForm').textContent = 'Login';
}

// ==========================================
// RESPONSIVIDADE PARA MOBILE
// ==========================================
function adjustForMobile() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        document.querySelectorAll('textarea, input').forEach(el => {
            el.style.fontSize = '14px';
        });
        document.querySelectorAll('button').forEach(el => {
            el.style.padding = '8px 12px';
        });
    }
}

// Chamar ao carregar e redimensionar
window.addEventListener('resize', adjustForMobile);
window.addEventListener('load', adjustForMobile);