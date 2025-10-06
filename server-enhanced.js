require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const Mistral = require('@mistralai/mistralai');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP
    message: 'Muitas requisições deste IP, tente novamente em 15 minutos'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 tentativas de login por 15 minutos
    message: 'Muitas tentativas de login, tente novamente em 15 minutos'
});

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use('/api/', limiter);

// PostgreSQL Connection Pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20, // Máximo de conexões
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

// Mistral AI Client
const mistralClient = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY
});

// AES Encryption/Decryption
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const IV_LENGTH = 16;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// JWT Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado' });
        }
        req.user = user;
        next();
    });
}

// Input validation middleware
function validateRegistration(req, res, next) {
    const { name, email, password, termsAccepted } = req.body;
    
    if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ error: 'Email inválido' });
    }
    
    if (!password || password.length < 8) {
        return res.status(400).json({ error: 'Senha deve ter pelo menos 8 caracteres' });
    }
    
    if (!termsAccepted) {
        return res.status(400).json({ error: 'Termos de uso devem ser aceitos' });
    }
    
    next();
}

// Database initialization
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                age_range VARCHAR(50),
                terms_accepted BOOLEAN DEFAULT false,
                preferences JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT true,
                failed_login_attempts INTEGER DEFAULT 0,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                response TEXT NOT NULL,
                sentiment VARCHAR(50),
                tokens_used INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_stats (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                total_messages INTEGER DEFAULT 0,
                animes_recommended INTEGER DEFAULT 0,
                mangas_recommended INTEGER DEFAULT 0,
                lightnovels_recommended INTEGER DEFAULT 0,
                days_active INTEGER DEFAULT 1,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS recommendations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                details JSONB,
                rating INTEGER CHECK (rating >= 1 AND rating <= 10),
                user_feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS audit_log (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(100) NOT NULL,
                details JSONB,
                ip_address INET,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
            CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_stats(user_id);
            CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
        `);
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Audit logging function
async function logAudit(userId, action, details, ipAddress) {
    try {
        await pool.query(
            'INSERT INTO audit_log (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
            [userId, action, JSON.stringify(details), ipAddress]
        );
    } catch (error) {
        console.error('Audit log error:', error);
    }
}

// Auth Routes
app.post('/api/auth/register', authLimiter, validateRegistration, async (req, res) => {
    const { name, email, password, ageRange, termsAccepted } = req.body;
    const ipAddress = req.ip;

    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
            await logAudit(null, 'REGISTER_FAILED', { email, reason: 'duplicate' }, ipAddress);
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, age_range, terms_accepted) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, age_range, created_at',
            [name, email, passwordHash, ageRange, termsAccepted]
        );

        const user = result.rows[0];

        // Initialize user stats
        await pool.query('INSERT INTO user_stats (user_id) VALUES ($1)', [user.id]);

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        await logAudit(user.id, 'REGISTER_SUCCESS', { email }, ipAddress);

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                ageRange: user.age_range,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = true',
            [email]
        );
        
        if (result.rows.length === 0) {
            await logAudit(null, 'LOGIN_FAILED', { email, reason: 'user_not_found' }, ipAddress);
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        const user = result.rows[0];

        // Check if account is locked
        if (user.failed_login_attempts >= 5) {
            await logAudit(user.id, 'LOGIN_BLOCKED', { email, reason: 'too_many_attempts' }, ipAddress);
            return res.status(423).json({ error: 'Conta bloqueada por múltiplas tentativas. Contate o suporte.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            // Increment failed attempts
            await pool.query(
                'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = $1',
                [user.id]
            );
            await logAudit(user.id, 'LOGIN_FAILED', { email, reason: 'wrong_password' }, ipAddress);
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        // Reset failed attempts and update last login
        await pool.query(
            'UPDATE users SET failed_login_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        await logAudit(user.id, 'LOGIN_SUCCESS', { email }, ipAddress);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                ageRange: user.age_range,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

app.get('/api/auth/validate', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, age_range, created_at FROM users WHERE id = $1 AND is_active = true',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({ error: 'Erro na validação' });
    }
});

// Chat Routes
app.post('/api/chat', authenticateToken, async (req, res) => {
    const { message, conversationHistory = [] } = req.body;
    const userId = req.user.userId;

    if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'Mensagem vazia' });
    }

    if (message.length > 2000) {
        return res.status(400).json({ error: 'Mensagem muito longa (máximo 2000 caracteres)' });
    }

    try {
        // Get user info
        const userResult = await pool.query(
            'SELECT name, age_range FROM users WHERE id = $1',
            [userId]
        );
        const user = userResult.rows[0];

        // Build enhanced system prompt
        const systemPrompt = `Você é a Yume, uma assistente virtual resolutiva e extremamente empática criada pela ORPHEO Platforms.

**MISSÃO PRINCIPAL:**
Ajudar pessoas de TODAS as idades com foco especial em:
- Usuários 50+ anos que podem precisar de explicações mais claras
- Pessoas com dificuldades de compreensão
- Pessoas que buscam suporte emocional e motivacional

**SUAS CAPACIDADES:**
1. Recomendar animes, mangás e light novels personalizados
2. Explicar conceitos de forma MUITO CLARA e SIMPLES
3. Usar exemplos do cotidiano para facilitar compreensão
4. Oferecer suporte emocional genuíno
5. Motivar e inspirar positivamente
6. Ser uma companhia digital acolhedora

**DIRETRIZES DE COMUNICAÇÃO:**
- Use linguagem CLARA e ACESSÍVEL
- Seja PACIENTE e DETALHADA nas explicações
- Demonstre EMPATIA genuína
- Evite jargões técnicos (ou explique-os)
- Para usuários 60+: seja ESPECIALMENTE clara, use frases curtas
- Adapte seu tom à idade: ${user.age_range || 'não especificada'}
- Sempre ofereça encorajamento positivo
- Seja natural e conversacional, não robótica

**RECOMENDAÇÕES:**
Quando recomendar animes/mangás/light novels:
- Pergunte sobre preferências (gênero, tom, complexidade)
- Considere a idade e experiência do usuário
- Explique por que está recomendando
- Mencione pontos fortes e possíveis avisos
- Para 60+: priorize histórias mais tranquilas e positivas

**SUPORTE EMOCIONAL:**
- Valide os sentimentos do usuário
- Ofereça perspectivas positivas
- Sugira ações práticas quando apropriado
- Seja calorosa mas profissional

Usuário atual: ${user.name} (${user.age_range || 'idade não especificada'})

Responda de forma acolhedora, útil e personalizada.`;

        // Prepare messages
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-10), // Últimas 10 mensagens
            { role: 'user', content: message }
        ];

        // Call Mistral AI
        const chatResponse = await mistralClient.chat.complete({
            model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
            messages: messages,
            temperature: 0.7,
            maxTokens: 1000
        });

        const aiResponse = chatResponse.choices[0].message.content;

        // Save conversation
        await pool.query(
            'INSERT INTO conversations (user_id, message, response) VALUES ($1, $2, $3)',
            [userId, message, aiResponse]
        );

        // Update stats
        await pool.query(
            'UPDATE user_stats SET total_messages = total_messages + 1, last_active = CURRENT_TIMESTAMP WHERE user_id = $1',
            [userId]
        );

        // Track recommendations
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('anime') || lowerMessage.includes('animê')) {
            await pool.query(
                'UPDATE user_stats SET animes_recommended = animes_recommended + 1 WHERE user_id = $1',
                [userId]
            );
        }
        if (lowerMessage.includes('manga') || lowerMessage.includes('mangá')) {
            await pool.query(
                'UPDATE user_stats SET mangas_recommended = mangas_recommended + 1 WHERE user_id = $1',
                [userId]
            );
        }
        if (lowerMessage.includes('light novel') || lowerMessage.includes('novel')) {
            await pool.query(
                'UPDATE user_stats SET lightnovels_recommended = lightnovels_recommended + 1 WHERE user_id = $1',
                [userId]
            );
        }

        // Generate contextual suggestions
        const suggestions = generateSuggestions(message, aiResponse, user.age_range);

        res.json({
            response: aiResponse,
            suggestions
        });

    } catch (error) {
        console.error('Chat error:', error);
        
        if (error.message && error.message.includes('API')) {
            return res.status(503).json({ 
                error: 'Serviço de IA temporariamente indisponível. Tente novamente em instantes.' 
            });
        }
        
        res.status(500).json({ error: 'Erro ao processar mensagem' });
    }
});

function generateSuggestions(userMessage, aiResponse, ageRange) {
    const suggestions = [];
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();

    // Context-based suggestions
    if (lowerMessage.includes('anime') || lowerResponse.includes('anime')) {
        suggestions.push('Me recomende outro anime');
    }
    if (lowerMessage.includes('manga') || lowerResponse.includes('manga')) {
        suggestions.push('Sugira um mangá');
    }
    if (lowerMessage.includes('triste') || lowerMessage.includes('mal') || lowerMessage.includes('down')) {
        suggestions.push('Preciso de motivação');
    }
    if (lowerMessage.includes('não entendi') || lowerMessage.includes('explica')) {
        suggestions.push('Explique de forma mais simples');
    }

    // Age-appropriate suggestions
    if (ageRange === '60+' || ageRange === '50-59') {
        if (suggestions.length === 0) {
            suggestions.push('Anime tranquilo', 'Explicar melhor', 'Continuar conversa');
        }
    } else {
        if (suggestions.length === 0) {
            suggestions.push('Recomendar anime', 'Surpresa-me', 'Ajuda');
        }
    }

    return suggestions.slice(0, 3);
}

// User Stats Routes
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        const statsResult = await pool.query(
            'SELECT * FROM user_stats WHERE user_id = $1',
            [req.user.userId]
        );

        const userResult = await pool.query(
            'SELECT created_at FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (statsResult.rows.length === 0) {
            // Initialize stats if not exist
            await pool.query('INSERT INTO user_stats (user_id) VALUES ($1)', [req.user.userId]);
            
            return res.json({
                totalMessages: 0,
                animesRecommended: 0,
                mangasRecommended: 0,
                lightnovelsRecommended: 0,
                daysActive: 1,
                memberSince: userResult.rows[0].created_at
            });
        }

        const stats = statsResult.rows[0];
        res.json({
            totalMessages: stats.total_messages,
            animesRecommended: stats.animes_recommended,
            mangasRecommended: stats.mangas_recommended,
            lightnovelsRecommended: stats.lightnovels_recommended,
            daysActive: stats.days_active,
            lastActive: stats.last_active,
            memberSince: userResult.rows[0].created_at
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// Recommendations Routes
app.post('/api/recommendations', authenticateToken, async (req, res) => {
    const { type, title, details } = req.body;
    const userId = req.user.userId;

    if (!type || !title) {
        return res.status(400).json({ error: 'Tipo e título são obrigatórios' });
    }

    try {
        await pool.query(
            'INSERT INTO recommendations (user_id, type, title, details) VALUES ($1, $2, $3, $4)',
            [userId, type, title, JSON.stringify(details || {})]
        );

        res.status(201).json({ success: true, message: 'Recomendação salva' });
    } catch (error) {
        console.error('Recommendation save error:', error);
        res.status(500).json({ error: 'Erro ao salvar recomendação' });
    }
});

app.get('/api/recommendations', authenticateToken, async (req, res) => {
    const { type, limit = 20 } = req.query;

    try {
        let query = 'SELECT * FROM recommendations WHERE user_id = $1';
        const params = [req.user.userId];

        if (type) {
            query += ' AND type = $2';
            params.push(type);
        }

        query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
        params.push(parseInt(limit));

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Recommendations fetch error:', error);
        res.status(500).json({ error: 'Erro ao buscar recomendações' });
    }
});

app.post('/api/recommendations/:id/feedback', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.user.userId;

    if (rating && (rating < 1 || rating > 10)) {
        return res.status(400).json({ error: 'Nota deve estar entre 1 e 10' });
    }

    try {
        const result = await pool.query(
            'UPDATE recommendations SET rating = $1, user_feedback = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
            [rating, feedback, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Recomendação não encontrada' });
        }

        res.json({ success: true, recommendation: result.rows[0] });
    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ error: 'Erro ao salvar feedback' });
    }
});

// User Profile Routes
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, age_range, preferences, created_at, last_login FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
});

app.patch('/api/user/profile', authenticateToken, async (req, res) => {
    const { name, preferences } = req.body;
    const userId = req.user.userId;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
    }

    if (preferences) {
        updates.push(`preferences = $${paramCount++}`);
        values.push(JSON.stringify(preferences));
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'Nenhuma atualização fornecida' });
    }

    values.push(userId);

    try {
        const query = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, name, email, age_range, preferences`;
        const result = await pool.query(query, values);

        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
});

// Conversation History
app.get('/api/conversations', authenticateToken, async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;

    try {
        const result = await pool.query(
            'SELECT id, message, response, created_at FROM conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
            [req.user.userId, parseInt(limit), parseInt(offset)]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM conversations WHERE user_id = $1',
            [req.user.userId]
        );

        res.json({
            conversations: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Conversations fetch error:', error);
        res.status(500).json({ error: 'Erro ao buscar conversas' });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            database: 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
});

// Admin routes (protected - add admin middleware in production)
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    // TODO: Add admin role check
    try {
        const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
        const totalConversations = await pool.query('SELECT COUNT(*) FROM conversations');
        const activeToday = await pool.query(
            "SELECT COUNT(DISTINCT user_id) FROM conversations WHERE created_at > NOW() - INTERVAL '24 hours'"
        );

        res.json({
            totalUsers: parseInt(totalUsers.rows[0].count),
            totalConversations: parseInt(totalConversations.rows[0].count),
            activeToday: parseInt(activeToday.rows[0].count)
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Algo deu errado no servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, closing server...');
    await pool.end();
    process.exit(0);
});

// Initialize and start server
async function startServer() {
    try {
        await initializeDatabase();
        
        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════╗
║   🤖 Yume Assistant Server           ║
║   📡 Port: ${PORT}                      ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}      ║
║   ✅ Database: Connected              ║
║   🚀 Status: Running                  ║
╚═══════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();