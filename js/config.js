// config.js — Configurações centralizadas de produção

// ===============================
// 🔧 DETECÇÃO DE AMBIENTE
// ===============================
const ENV = (() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development';
    if (hostname.includes('staging')) return 'staging';
    return 'production';
})();

// ===============================
// ⚙️ CONFIGURAÇÕES PRINCIPAIS
// ===============================
const CONFIG = {
    env: ENV,

    // ===============================
    // 🧠 SUPABASE — Autenticação e Banco
    // ===============================
    supabase: {
        url: 'https://onyhbarnwvoqpwveyvhc.supabase.co',
        anonKey:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueWhiYXJud3ZvcXB3dmV5dmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTY0NDQsImV4cCI6MjA3MzE3MjQ0NH0.2zqN73ZxkqxlWLp49Kmrg1CUau0YAi7dee2EIyhodoI'
    },

    // ===============================
    // 🤖 MISTRAL AI — Chat / Recomendações
    // ===============================
    mistral: {
        apiKey: 'NFuAj8PYUPcaf6tA1BjbyXuIeSjSA4sW',
        apiUrl: 'https://api.mistral.ai/v1/chat/completions',
        model: 'mistral-tiny',
        maxTokens: 500,
        temperature: 0.7
    },

    // ===============================
    // 📣 GOOGLE ADSENSE
    // ===============================
    adsense: {
        enabled: true,
        client: 'ca-pub-5941203056187445',
        slot: '1234567890' // substitua pelo slot correto
    },

    // ===============================
    // 📊 MICROSOFT CLARITY
    // ===============================
    clarity: {
        enabled: true,
        projectId: 'nfv8y3n7t6'
    },

    // ===============================
    // ☁️ CLOUDFLARE (CDN e Proteção)
    // ===============================
    cloudflare: {
        enabled: true,
        // Nenhum código extra é necessário — configurado via painel da Cloudflare
    },

    // ===============================
    // 💬 APP (dados gerais)
    // ===============================
    app: {
        name: 'Yume',
        version: '2.0.0',
        supportEmail: 'sac.studiotsukiyo@outlook.com',
        repo: 'https://github.com/OrpheoStudio/Yume',
        feedbackEmail: 'sac.studiotsukiyo@outlook.com'
    }
};

// ===============================
// 🔥 INICIALIZAÇÃO DO SUPABASE
// ===============================
let supabase;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    } else {
        console.error('⚠️ Supabase SDK não encontrado. Verifique se foi importado antes do config.js');
    }
} catch (error) {
    console.error('Erro ao inicializar o Supabase:', error);
}

// ===============================
// 🧩 FERRAMENTAS DE MONITORAMENTO
// ===============================

// Carrega Microsoft Clarity automaticamente (somente em produção)
if (CONFIG.clarity.enabled && CONFIG.env === 'production') {
    (function (c, l, a, r, i, t, y) {
        c[a] =
            c[a] ||
            function () {
                (c[a].q = c[a].q || []).push(arguments);
            };
        t = l.createElement(r);
        t.async = 1;
        t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0];
        y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CONFIG.clarity.projectId);
}

// Carrega Google AdSense (somente em produção)
if (CONFIG.adsense.enabled && CONFIG.env === 'production') {
    const adsenseScript = document.createElement('script');
    adsenseScript.setAttribute('data-ad-client', CONFIG.adsense.client);
    adsenseScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    adsenseScript.async = true;
    document.head.appendChild(adsenseScript);
}

// ===============================
// 🧠 FUNÇÕES AUXILIARES GLOBAIS
// ===============================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: type === 'error' ? '#e74c3c' : '#2ecc71',
        color: '#fff',
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        zIndex: 9999,
        transition: 'opacity 0.3s ease'
    });
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===============================
// 📦 EXPORTAÇÃO GLOBAL
// ===============================
window.CONFIG = CONFIG;
window.supabase = supabase;
window.showToast = showToast;

// Compatibilidade com Node.js (opcional, para SSR)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, supabase };
}