require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Pool } = require('pg');
const Mistral = require('@mistralai/mistralai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Connection
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Mistral AI Client
const mistralClient = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY
});

// AES Encryption/Decryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
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
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                message TEXT NOT NULL,
                response TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_stats (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id),
                total_messages INTEGER DEFAULT 0,
                animes_recommended INTEGER DEFAULT 0,
                mangas_recommended INTEGER DEFAULT 0,
                lightnovels_recommended INTEGER DEFAULT 0,
                days_active INTEGER DEFAULT 1,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS recommendations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                details JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
            CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id);
        `);
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    } finally {
        client.release();
    }
}

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, ageRange, termsAccepted } = req.body;

    if (!termsAccepted) {
        return res.status(400).json({ error: 'Termos de uso devem ser aceitos' });
    }

    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, age_range, terms_accepted) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, age_range, created_at',
            [name, email, passwordHash, ageRange, termsAccepted]
        );

        const user = result.rows[0];

        // Initialize user stats
        await pool.query(
            'INSERT INTO user_stats (user_id) VALUES ($1)',
            [user.id]
        );

        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({ token, user });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

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
            'SELECT id, name, email, age_range, created_at FROM users WHERE id = $1',
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
    const { message, conversationHistory } = req.body;
    const userId = req.user.userId;

    try {
        // Get user info for personalization
        const userResult = await pool.query('SELECT name, age_range FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        // Build system prompt for Yume
        const systemPrompt = `Você é a Yume, uma assistente virtual resolutiva e empática criada pelo ORPHEO Platforms. Sua missão é:

1. Ajudar pessoas de todas as idades, especialmente aqueles com 50+ anos e pessoas que precisam de explicações mais claras
2. Recomendar animes, mangás e light novels de forma personalizada
3. Explicar conceitos de forma simples, clara e paciente
4. Oferecer suporte motivacional e emocional
5. Ser uma companhia digital acolhedora

Características importantes:
- Use linguagem clara e acessível
- Seja paciente e detalhada nas explicações
- Demonstre empatia genuína
- Adapte suas respostas à idade do usuário (${user.age_range || 'não especificada'})
- Para usuários 60+, seja especialmente clara e use exemplos do cotidiano
- Ofereça motivação e positividade
- Seja natural e conversacional

Usuário: ${user.name}

Responda de forma conversacional, útil e empática.`;

        // Prepare messages for Mistral
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
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

        // Save conversation to database
        await pool.query(
            'INSERT INTO conversations (user_id, message, response) VALUES ($1, $2, $3)',
            [userId, message, aiResponse]
        );

        // Update user stats
        await pool.query(
            'UPDATE user_stats SET total_messages = total_messages + 1, last_active = CURRENT_TIMESTAMP WHERE user_id = $1',
            [userId]
        );

        // Check for anime/manga/lightnovel recommendations
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

        // Generate suggestions based on context
        const suggestions = generateSuggestions(message, aiResponse);

        res.json({
            response: aiResponse,
            suggestions
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Erro ao processar mensagem' });
    }
});

function generateSuggestions(userMessage, aiResponse) {
    const suggestions = [];
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();

    if (lowerMessage.includes('anime') || lowerResponse.includes('anime')) {
        suggestions.push('Me recomende outro anime');
    }
    if (lowerMessage.includes('manga') || lowerResponse.includes('manga')) {
        suggestions.push('Me recomende um mangá');
    }
    if (lowerMessage.includes('triste') || lowerMessage.includes('mal')) {
        suggestions.push('Preciso de motivação');
    }
    
    // Default suggestions
    if (suggestions.length === 0) {
        suggestions.push('Recomendar anime', 'Conversar mais', 'Ajuda');
    }

    return suggestions.slice(0, 3);
}

// User Stats Routes
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM user_stats WHERE user_id = $1',
            [req.user.userId]
        );

        const userResult = await pool.query(
            'SELECT created_at FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.json({
                totalMessages: 0,
                animesRecommended: 0,
                mangasRecommended: 0,
                lightnovelsRecommended: 0,
                daysActive: 1,
                memberSince: userResult.rows[0].created_at
            });
        }

        const stats = result.rows[0];
        res.json({
            totalMessages: stats.total_messages,
            animesRecommended: stats.animes_recommended,
            mangasRecommended: stats.mangas_recommended,
            lightnovelsRecommended: stats.lightnovels_recommended,
            daysActive: stats.days_active,
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

    try {
        await pool.query(
            'INSERT INTO recommendations (user_id, type, title, details) VALUES ($1, $2, $3, $4)',
            [userId, type, title, JSON.stringify(details)]
        );

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Recommendation save error:', error);
        res.status(500).json({ error: 'Erro ao salvar recomendação' });
    }
});

app.get('/api/recommendations', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM recommendations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
            [req.user.userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Recommendations fetch error:', error);
        res.status(500).json({ error: 'Erro ao buscar recomendações' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

// Initialize and start server
async function startServer() {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`Yume server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();