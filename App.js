// app.js - Inicialização principal da aplicação Yume (produção)

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌸 Yume iniciando...');

    try {
        // ===== Inicialização dos módulos principais =====
        uiManager.init();
        console.log('✅ UI Manager inicializado');

        await authManager.init();
        console.log('✅ Auth Manager inicializado');

        chatManager.init();
        console.log('✅ Chat Manager inicializado');

        // ===== Autenticação =====
        const isAuthenticated = authManager.isAuthenticated();

        if (isAuthenticated) {
            uiManager.showChatScreen();
            console.log('✅ Usuário autenticado');
        } else {
            uiManager.showAuthScreen();
            console.log('ℹ️ Usuário não autenticado');
        }

        // Configura listeners de login/registro/logout
        setupAuthListeners();

        console.log('🌸 Yume pronta e funcional!');
    } catch (error) {
        console.error('❌ Erro crítico na inicialização:', error);
        showToast('Erro ao inicializar a aplicação. Tente novamente mais tarde.');
    }
});

/**
 * Configura eventos dos formulários de autenticação
 */
function setupAuthListeners() {
    // ===== Login =====
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail')?.value.trim();
            const password = document.getElementById('loginPassword')?.value.trim();

            try {
                showLoading(true);
                await authManager.loginWithSupabase(email, password);
                uiManager.showChatScreen();
                showToast('Login realizado com sucesso! 🌸');
            } catch (error) {
                console.error('Erro no login:', error);
                showToast(error.message || 'Falha ao realizar login.');
            } finally {
                showLoading(false);
            }
        });
    }

    // ===== Registro =====
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('registerName')?.value.trim();
            const email = document.getElementById('registerEmail')?.value.trim();
            const password = document.getElementById('registerPassword')?.value.trim();
            const acceptTerms = document.getElementById('acceptTerms')?.checked;

            try {
                if (!acceptTerms) {
                    throw new Error('Você precisa aceitar os Termos de Uso.');
                }

                showLoading(true);
                await authManager.registerWithSupabase(name, email, password);
                uiManager.showChatScreen();
                showToast('Conta criada com sucesso! 🌸');
            } catch (error) {
                console.error('Erro no registro:', error);
                showToast(error.message || 'Falha ao criar conta.');
            } finally {
                showLoading(false);
            }
        });
    }

    // ===== Logout =====
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await authManager.logout();
                uiManager.showAuthScreen();
                showToast('Sessão encerrada com sucesso. Até logo! 👋');
            } catch (error) {
                console.error('Erro no logout:', error);
                showToast('Erro ao encerrar sessão.');
            }
        });
    }
}

/**
 * Exibe ou oculta o loading global
 */
function showLoading(show = true) {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Exibe um toast rápido
 */
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 50);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, duration);
}