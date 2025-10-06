require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Iniciando configuração do banco de dados...\n');

        // Create Users Table
        console.log('📊 Criando tabela de usuários...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                age_range VARCHAR(50),
                terms_accepted BOOLEAN DEFAULT false,
                preferences JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabela users criada\n');

        // Create Conversations Table
        console.log('📊 Criando tabela de conversas...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                response TEXT NOT NULL,
                sentiment VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabela conversations criada\n');

        // Create User Stats Table
        console.log('📊 Criando tabela de estatísticas...');
        await client.query(`
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
        `);
        console.log('✅ Tabela user_stats criada\n');

        // Create Recommendations Table
        console.log('📊 Criando tabela de recomendações...');
        await client.query(`
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
        `);
        console.log('✅ Tabela recommendations criada\n');

        // Create Indexes
        console.log('📊 Criando índices para otimização...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
            CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_stats(user_id);
            CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id);
            CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(type);
        `);
        console.log('✅ Índices criados\n');

        // Create Triggers for updated_at
        console.log('📊 Criando triggers...');
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at 
                BEFORE UPDATE ON users 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
        `);
        console.log('✅ Triggers criados\n');

        // Insert sample data for testing (optional)
        if (process.argv.includes('--with-sample-data')) {
            console.log('📊 Inserindo dados de exemplo...');
            const bcrypt = require('bcrypt');
            const samplePassword = await bcrypt.hash('senha123', 10);
            
            await client.query(`
                INSERT INTO users (name, email, password_hash, age_range, terms_accepted)
                VALUES 
                    ('Usuário Teste', 'teste@exemplo.com', $1, '50-59', true)
                ON CONFLICT (email) DO NOTHING;
            `, [samplePassword]);
            
            console.log('✅ Dados de exemplo inseridos\n');
            console.log('   Email: teste@exemplo.com');
            console.log('   Senha: senha123\n');
        }

        // Verify tables
        console.log('🔍 Verificando tabelas criadas...');
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        console.log('📋 Tabelas existentes:');
        result.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        console.log();

        console.log('✅ Banco de dados configurado com sucesso!');
        console.log('🚀 Você pode iniciar o servidor agora com: npm start\n');

    } catch (error) {
        console.error('❌ Erro ao configurar banco de dados:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Execute initialization
initializeDatabase()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Falha na inicialização:', error);
        process.exit(1);
    });