// ui.js - Gerenciamento de interface e utilidades

class UIManager {
    constructor() {
        this.userPreferences = [];
    }

    init() {
        this.setupEventListeners();
        this.checkCookieConsent();
        this.loadUserPreferences();
        this.initAdSense();
    }

    setupEventListeners() {
        // Cookie consent
        const acceptCookies = document.getElementById('acceptCookies');
        const rejectCookies = document.getElementById('rejectCookies');

        if (acceptCookies) {
            acceptCookies.addEventListener('click', () => this.handleCookieAccept());
        }

        if (rejectCookies) {
            rejectCookies.addEventListener('click', () => this.handleCookieReject());
        }

        // Navegação de autenticação
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');

        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }

        // Auth0 login
        const auth0LoginBtn = document.getElementById('auth0LoginBtn');
        if (auth0LoginBtn) {
            auth0LoginBtn.addEventListener('click', () => {
                authManager.loginWithAuth0();
            });
        }

        // Personalização
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleAvatarChange(e));
        });

        document.querySelectorAll('.preference-tag').forEach(tag => {
            tag.addEventListener('click', (e) => this.handlePreferenceToggle(e));
        });

        // Menu e modais
        const userAvatar = document.getElementById('userAvatar');
        const closeProfile = document.getElementById('closeProfile');
        const closeProjects = document.getElementById('closeProjects');
        const upgradeCard = document.getElementById('upgradeCard');
        const logoutBtn = document.getElementById('logoutBtn');
        const profileModal = document.getElementById('profileModal');
        const projectsModal = document.getElementById('projectsModal');

        if (userAvatar) {
            userAvatar.addEventListener('click', () => {
                profileModal.classList.add('active');
            });
        }

        if (closeProfile) {
            closeProfile.addEventListener('click', () => {
                profileModal.classList.remove('active');
            });
        }

        if (closeProjects) {
            closeProjects.addEventListener('click', () => {
                projectsModal.classList.remove('active');
            });
        }

        if (upgradeCard) {
            upgradeCard.addEventListener('click', () => this.handleUpgrade());
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Botões do menu
        const helpBtn = document.getElementById('helpBtn');
        const aboutYumeBtn = document.getElementById('aboutYumeBtn');
        const statsBtn = document.getElementById('statsBtn');
        const termsBtn = document.getElementById('termsBtn');
        const projectsBtn = document.getElementById('projectsBtn');
        const upgradeBtn = document.getElementById('upgradeBtn');

        if (helpBtn) helpBtn.addEventListener('click', () => this.showHelp());
        if (aboutYumeBtn) aboutYumeBtn.addEventListener('click', () => this.showAbout());
        if (statsBtn) statsBtn.addEventListener('click', () => this.showStats());
        if (termsBtn) termsBtn.addEventListener('click', () => this.showTerms());
        if (projectsBtn) projectsBtn.addEventListener('click', () => this.showProjects());
        if (upgradeBtn) upgradeBtn.addEventListener('click', () => this.handleUpgrade());

        // Fechar modais ao clicar fora
        if (profileModal) {
            profileModal.addEventListener('click', (e) => {
                if (e.target === profileModal) {
                    profileModal.classList.remove('active');
                }
            });
        }

        if (projectsModal) {
            projectsModal.addEventListener('click', (e) => {
                if (e.target === projectsModal) {
                    projectsModal.classList.remove('active');
                }
            });
        }
    }

    checkCookieConsent() {
        const cookiesAccepted = localStorage.getItem('yumeCookiesAccepted');
        if (cookiesAccepted === null) {
            setTimeout(() => {
                const cookieBanner = document.getElementById('cookieBanner');
                if (cookieBanner) {
                    cookieBanner.classList.add('show');
                }
            }, 2000);
        }
    }

    handleCookieAccept() {
        localStorage.setItem('yumeCookiesAccepted', 'true');
        const cookieBanner = document.getElementById('cookieBanner');
        if (cookieBanner) {
            cookieBanner.classList.remove('show');
        }
        showToast('Preferências de cookies salvas! 🌸');
        
        // Inicializar tracking apenas após aceitar
        this.initTracking();
    }

    handleCookieReject() {
        localStorage.setItem('yumeCookiesAccepted', 'false');
        const cookieBanner = document.getElementById('cookieBanner');
        if (cookieBanner) {
            cookieBanner.classList.remove('show');
        }
        showToast('Preferências salvas. Recursos de análise desativados.');
    }

    initTracking() {
        const cookiesAccepted = localStorage.getItem('yumeCookiesAccepted');
        if (cookiesAccepted === 'true') {
            // Microsoft Clarity já está carregado no HTML
            // Google Analytics pode ser adicionado aqui se necessário
            console.log('Tracking inicializado');
        }
    }

    initAdSense() {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (error) {
            console.error('Erro ao inicializar AdSense:', error);
        }
    }

    showLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm && registerForm) {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        }
    }

    showRegisterForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm && registerForm) {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
    }

    showAuthScreen() {
        const authScreen = document.getElementById('authScreen');
        const chatScreen = document.getElementById('chatScreen');
        
        if (authScreen && chatScreen) {
            authScreen.classList.remove('hidden');
            chatScreen.classList.add('hidden');
        }

        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
        
        this.showLoginForm();
    }

    showChatScreen() {
        const authScreen = document.getElementById('authScreen');
        const chatScreen = document.getElementById('chatScreen');
        
        if (authScreen && chatScreen) {
            authScreen.classList.add('hidden');
            chatScreen.classList.remove('hidden');
        }

        const chatInput = document.getElementById('userInput');
        if (chatInput) {
            chatInput.focus();
        }

        // Carregar avatar e preferências
        this.loadUserAvatar();
        this.loadUserPreferences();
    }

    loadUserAvatar() {
        const savedAvatar = localStorage.getItem('yumeAvatar') || 'default';
        this.updateUserAvatar(savedAvatar);
    }

    updateUserAvatar(avatarType) {
        const userAvatar = document.getElementById('userAvatar');
        if (!userAvatar) return;

        const avatarColors = {
            'default': 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            'avatar1': 'linear-gradient(135deg, #F59E0B, #EAB308)',
            'avatar2': 'linear-gradient(135deg, #EC4899, #DB2777)',
            'avatar3': 'linear-gradient(135deg, #10B981, #059669)'
        };

        const avatarIcons = {
            'default': 'fa-user',
            'avatar1': 'fa-smile',
            'avatar2': 'fa-star',
            'avatar3': 'fa-heart'
        };

        userAvatar.style.background = avatarColors[avatarType] || avatarColors.default;
        userAvatar.innerHTML = `<i class="fas ${avatarIcons[avatarType] || 'fa-user'}"></i>`;
    }

    handleAvatarChange(e) {
        const element = e.currentTarget;
        
        document.querySelectorAll('.avatar-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        element.classList.add('selected');
        const avatarType = element.getAttribute('data-avatar');
        
        this.updateUserAvatar(avatarType);
        localStorage.setItem('yumeAvatar', avatarType);

        // Atualizar no Supabase
        authManager.updateUserInSupabase({ avatar: avatarType });

        showToast('Avatar atualizado! ✨');
    }

    loadUserPreferences() {
        const savedPreferences = localStorage.getItem('yumePreferences');
        if (savedPreferences) {
            this.userPreferences = JSON.parse(savedPreferences);
            
            document.querySelectorAll('.preference-tag').forEach(tag => {
                const pref = tag.getAttribute('data-pref');
                if (this.userPreferences.includes(pref)) {
                    tag.classList.add('selected');
                }
            });
        }
    }

    handlePreferenceToggle(e) {
        const element = e.currentTarget;
        element.classList.toggle('selected');
        
        const preference = element.getAttribute('data-pref');

        if (element.classList.contains('selected')) {
            if (!this.userPreferences.includes(preference)) {
                this.userPreferences.push(preference);
            }
        } else {
            this.userPreferences = this.userPreferences.filter(p => p !== preference);
        }

        localStorage.setItem('yumePreferences', JSON.stringify(this.userPreferences));

        // Atualizar no Supabase
        authManager.updateUserInSupabase({ preferences: this.userPreferences });

        showToast('Preferências atualizadas! 🌟');
    }

    handleUpgrade() {
        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            profileModal.classList.remove('active');
        }
        
        showToast('Redirecionando para doação...');
        
        if (chatManager) {
            chatManager.addMessage(
                "💖 Doando para o projeto você ajuda:\n\n" +
                "• Manter o projeto vivo\n" +
                "• Atualizações com novas funções\n" +
                "• Suporte 24/7\n" +
                "• Recursos avançados\n\n" +
                "Entre em contato para fazer sua doação:\n\n" +
                "📧 E-mail: sac.studiotsukiyo@outlook.com",
                'assistant'
            );
        }
    }

    async handleLogout() {
        await authManager.logout();
        
        if (chatManager) {
            chatManager.clearHistory();
        }
        
        this.userPreferences = [];
        this.showAuthScreen();
        
        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            profileModal.classList.remove('active');
        }
        
        showToast('Logout realizado com sucesso');
    }

    showHelp() {
        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            profileModal.classList.remove('active');
        }
        
        showToast('Abrindo ajuda...');
        
        if (chatManager) {
            chatManager.addMessage(
                "🌸 Como posso ajudar você?\n\n" +
                "• Responder perguntas\n" +
                "• Explicar conceitos\n" +
                "• Auxiliar com tarefas\n" +
                "• Conversar sobre diversos temas\n" +
                "• Recomendar animes e mangás\n" +
                "• Ajudar com tecnologia\n\n" +
                "O que você gostaria de saber?",
                'assistant'
            );
        }
    }

    showAbout() {
        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            profileModal.classList.remove('active');
        }
        
        showToast('Sobre a Yume');
        
        if (chatManager) {
            chatManager.addMessage(
                "🌸 Sobre mim\n\n" +
                "Oiê~ 🌙✨ Eu sou a Yume!\n" +
                "Fui criada pela ORPHEO Platforms para te ajudar no dia a dia.\n\n" +
                "💬 O que eu posso fazer:\n" +
                "• Recomendar animes, mangás e light novels 💫\n" +
                "• Ajudar com tecnologia 💻\n" +
                "• Conversar sobre diversos assuntos 💕\n" +
                "• Te fazer companhia 🌷\n\n" +
                "💎 Doações:\n" +
                "Seu apoio ajuda a manter o projeto vivo!\n\n" +
                "📜 Privacidade:\n" +
                "Seus dados são protegidos conforme nossos Termos de Uso.\n\n" +
                "Obrigada por estar aqui comigo~ 💕",
                'assistant'
            );
        }
    }

    showStats() {
        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            profileModal.classList.remove('active');
        }
        
        const user = authManager.getCurrentUser();
        const messageCount = chatManager ? chatManager.getMessageCount() : 0;
        
        showToast('Estatísticas do usuário');
        
        if (chatManager && user) {
            chatManager.addMessage(
                `📊 Suas Estatísticas\n\n` +
                `• Usuário: ${user.name}\n` +
                `• E-mail: ${user.email}\n` +
                `• Mensagens nesta sessão: ${messageCount}\n` +
                `• Preferências: ${this.userPreferences.join(', ') || 'Nenhuma'}\n` +
                `• Status: Ativo ✅\n` +
                `• Método de auth: ${user.authMethod || 'tradicional'}\n` +
                `• Domínio: yume.orpheostudio.com.br`,
                'assistant'
            );
        }
    }

    showTerms() {
        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            profileModal.classList.remove('active');
        }
        
        showToast('Abrindo Termos de Uso...');
        
        if (chatManager) {
            chatManager.addMessage(
                "📜 Termos de Uso e Política de Privacidade\n\n" +
                "Para visualizar nossos Termos completos:\n\n" +
                "🔗 https://termos.orpheostudio.com.br\n\n" +
                "Resumidamente:\n" +
                "• Coleta de dados para melhorar o serviço\n" +
                "• Armazenamento seguro de informações\n" +
                "• Uso responsável da plataforma\n" +
                "• Respeito às diretrizes\n\n" +
                "Dúvidas? Entre em contato:\n" +
                "📧 sac.studiotsukiyo@outlook.com",
                'assistant'
            );
        }
    }

    showProjects() {
        const profileModal = document.getElementById('profileModal');
        const projectsModal = document.getElementById('projectsModal');
        
        if (profileModal) {
            profileModal.classList.remove('active');
        }
        
        if (projectsModal) {
            projectsModal.classList.add('active');
        }
    }
}

// Funções auxiliares globais
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        if (show) {
            loadingOverlay.classList.remove('hidden');
        } else {
            loadingOverlay.classList.add('hidden');
        }
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// Instância global
const uiManager = new UIManager();