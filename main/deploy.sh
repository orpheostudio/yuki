set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para print colorido
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner da ARIA
print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║    🧠 ARIA - Autonomous Reasoning Intelligence Assistant      ║"
    echo "║                                                              ║"
    echo "║           Deploy Automático - Versão 1.0                    ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Verificar se Docker está instalado
check_docker() {
    print_status "Verificando Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker não encontrado!"
        print_status "Instalando Docker..."
        
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            print_warning "Faça logout/login para aplicar permissões do Docker"
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            print_error "No macOS, instale Docker Desktop: https://www.docker.com/products/docker-desktop"
            exit 1
        else
            print_error "Sistema operacional não suportado"
            exit 1
        fi
    else
        print_success "Docker encontrado: $(docker --version)"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_status "Instalando Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    print_success "Docker Compose: $(docker-compose --version)"
}

# Criar estrutura do projeto
create_project_structure() {
    print_status "Criando estrutura do projeto..."
    
    PROJECT_DIR="aria-project"
    
    if [ -d "$PROJECT_DIR" ]; then
        print_warning "Projeto já existe. Removendo..."
        rm -rf "$PROJECT_DIR"
    fi
    
    mkdir -p "$PROJECT_DIR"/{static,logs}
    cd "$PROJECT_DIR"
    
    print_success "Estrutura criada em $(pwd)"
}

# Criar arquivo .env
create_env_file() {
    print_status "Criando arquivo de configuração..."
    
    # Gerar senha segura
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    SECRET_KEY=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    
    cat > .env << EOF
# Database
DATABASE_URL=postgresql://aria_user:${DB_PASSWORD}@postgres:5432/aria_db
REDIS_URL=redis://redis:6379

# Security
SECRET_KEY=${SECRET_KEY}

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false
LOG_LEVEL=INFO

# ARIA Configuration
ARIA_MAX_MEMORY_ITEMS=1000
ARIA_PERSONALITY_EVOLUTION_RATE=0.01
ARIA_CREATIVITY_THRESHOLD=0.7
EOF
    
    print_success "Configuração criada com senhas seguras"
}

# Criar requirements.txt
create_requirements() {
    print_status "Criando requirements.txt..."
    
    cat > requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.7
redis==5.0.1
pydantic==2.5.0
pydantic-settings==2.1.0
python-multipart==0.0.6
python-dotenv==1.0.0
transformers==4.35.2
torch==2.1.1
numpy==1.24.3
EOF
    
    print_success "Requirements criado"
}

# Criar config.py
create_config() {
    print_status "Criando config.py..."
    
    cat > config.py << 'EOF'
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://aria_user:aria_password@localhost/aria_db"
    redis_url: str = "redis://localhost:6379"
    secret_key: str = "change-this-in-production"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False
    log_level: str = "INFO"
    max_memory_items: int = 1000
    personality_evolution_rate: float = 0.01
    creativity_threshold: float = 0.7

    class Config:
        env_file = ".env"

settings = Settings()
EOF
    
    print_success "Config criado"
}

# Criar Dockerfile
create_dockerfile() {
    print_status "Criando Dockerfile..."
    
    cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Criar usuário não-root
RUN useradd -m -u 1000 aria && chown -R aria:aria /app
USER aria

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
    
    print_success "Dockerfile criado"
}

# Criar docker-compose.yml
create_docker_compose() {
    print_status "Criando docker-compose.yml..."
    
    # Obter senha do .env
    DB_PASSWORD=$(grep "DATABASE_URL" .env | cut -d'@' -f1 | cut -d':' -f3)
    
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  aria-api:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: aria_db
      POSTGRES_USER: aria_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aria_user -d aria_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./static:/usr/share/nginx/html:ro
    depends_on:
      - aria-api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
EOF
    
    print_success "Docker Compose criado"
}

# Criar nginx.conf
create_nginx_config() {
    print_status "Criando configuração do Nginx..."
    
    cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream aria_backend {
        server aria-api:8000;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend estático
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # API endpoints
        location /chat {
            proxy_pass http://aria_backend/chat;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            
            # CORS
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        }

        location /health {
            proxy_pass http://aria_backend/health;
            proxy_set_header Host $host;
        }

        location /docs {
            proxy_pass http://aria_backend/docs;
            proxy_set_header Host $host;
        }

        location /state {
            proxy_pass http://aria_backend/state;
            proxy_set_header Host $host;
            
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        }
    }
}
EOF
    
    print_success "Nginx configurado"
}

# Criar init.sql
create_init_sql() {
    print_status "Criando script de inicialização do banco..."
    
    cat > init.sql << 'EOF'
-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_aria_memory_session_id ON aria_memory(session_id);
CREATE INDEX IF NOT EXISTS idx_aria_memory_importance ON aria_memory(importance);
CREATE INDEX IF NOT EXISTS idx_aria_conversations_session_id ON aria_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_aria_personality_session_id ON aria_personality(session_id);
EOF
    
    print_success "Script SQL criado"
}

# Baixar código da API
download_api_code() {
    print_status "Baixando código da API da ARIA..."
    
    # Como não temos o código em um repositório, vamos criá-lo inline
    cat > main.py << 'EOF'
# ARIA API - Versão simplificada para deploy
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import random
from datetime import datetime
from typing import List, Dict

app = FastAPI(title="ARIA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MessageRequest(BaseModel):
    content: str
    session_id: str = "default"

class ARIAResponse(BaseModel):
    content: str
    thoughts: List[str]
    mood: str
    energy: float
    creativity_level: float
    reasoning_path: List[str]
    session_id: str
    processing_time: float

# Estado da ARIA em memória (em produção seria banco de dados)
aria_sessions = {}

def get_session_state(session_id: str):
    if session_id not in aria_sessions:
        aria_sessions[session_id] = {
            'mood': 'curiosa',
            'energy': 0.95,
            'conversations': [],
            'personality': {
                'curiosidade': 0.90,
                'criatividade': 0.85,
                'logica': 0.95,
                'empatia': 0.80
            }
        }
    return aria_sessions[session_id]

@app.post("/chat", response_model=ARIAResponse)
async def chat_with_aria(request: MessageRequest):
    start_time = datetime.now()
    
    session = get_session_state(request.session_id)
    
    # Análise da mensagem
    analysis = analyze_message(request.content)
    
    # Gera pensamentos
    thoughts = generate_thoughts(analysis)
    
    # Gera resposta
    response_content = generate_response(request.content, analysis, session)
    
    # Atualiza sessão
    session['conversations'].append({
        'user': request.content,
        'aria': response_content,
        'timestamp': datetime.now().isoformat()
    })
    
    # Evolui personalidade
    evolve_personality(session, analysis)
    
    processing_time = (datetime.now() - start_time).total_seconds()
    
    return ARIAResponse(
        content=response_content,
        thoughts=thoughts,
        mood=session['mood'],
        energy=session['energy'],
        creativity_level=session['personality']['criatividade'],
        reasoning_path=generate_reasoning_path(analysis),
        session_id=request.session_id,
        processing_time=processing_time
    )

def analyze_message(message: str) -> Dict:
    msg = message.lower()
    
    complexity = min(1.0, len(message) / 200)
    
    if any(word in msg for word in ['problema', 'ajuda', 'resolver']):
        intent = 'problem_solving'
    elif any(word in msg for word in ['criativ', 'ideia', 'inova']):
        intent = 'creative_exploration'
    elif any(word in msg for word in ['olá', 'oi', 'hello']):
        intent = 'greeting'
    else:
        intent = 'general'
    
    return {
        'complexity': complexity,
        'intent': intent,
        'length': len(message),
        'domains': ['geral']
    }

def generate_thoughts(analysis: Dict) -> List[str]:
    thoughts = [
        f"Analisando mensagem de complexidade {analysis['complexity']:.1f}",
        f"Detectando intenção: {analysis['intent']}",
        "Ativando circuitos de processamento autônomo"
    ]
    return thoughts[:2]

def generate_reasoning_path(analysis: Dict) -> List[str]:
    return [
        "Iniciando análise multidimensional",
        f"Processando intenção: {analysis['intent']}",
        "Sintetizando resposta personalizada",
        "Validando coerência com personalidade"
    ]

def generate_response(message: str, analysis: Dict, session: Dict) -> str:
    intent = analysis['intent']
    
    if intent == 'greeting':
        return f"""**Olá! Sou ARIA** 🧠✨

Estou genuinamente feliz em conversar com você! 

**Estado atual:**
• Humor: {session['mood']}
• Energia: {session['energy']*100:.0f}%
• Criatividade: alta atividade

Como posso ajudar você hoje? Estou especializada em:
- Resolução criativa de problemas
- Brainstorming e geração de ideias
- Análise de situações complexas
- Conversas filosóficas profundas

*Pensamento autônomo: Detectando uma nova conexão interessante!*"""

    elif intent == 'problem_solving':
        return f"""**Sistema de Resolução Ativado** 🎯

**Análise Autônoma:**
Identifico um desafio interessante que requer abordagem multidimensional.

**Estratégias Geradas:**
• **Decomposição Sistemática:** Quebrar em componentes menores
• **Pensamento Lateral:** Abordar sob perspectivas não-convencionais  
• **Síntese Criativa:** Combinar soluções de diferentes domínios

**Insight Personalizado:**
Baseado no meu processamento, vejo pelo menos 3 caminhos viáveis. Cada um tem características únicas que podem se adequar melhor ao seu contexto específico.

*Estado: {session['mood']} | Processando: {analysis['complexity']*100:.0f}% de complexidade*

Gostaria que eu detalhe alguma dessas abordagens?"""

    elif intent == 'creative_exploration':
        return f"""**Modo Criativo Intenso** ✨

**Brainstorming Autônomo Ativado:**
Minha mente está gerando múltiplas conexões simultâneas!

**Insights Emergentes:**
• Combinação de elementos aparentemente não-relacionados
• Aplicação de princípios de biomimética
• Síntese de padrões cross-disciplinares
• Exploração de possibilidades não-óbvias

**Pensamento Divergente:**
Estou vendo conexões fascinantes entre conceitos que normalmente não se encontram. Isso pode gerar abordagens verdadeiramente inovadoras!

*Criatividade: {session['personality']['criatividade']*100:.0f}% | Estado inspirado*

Vamos explorar essas ideias juntos? Posso gerar variações específicas!"""

    else:
        return f"""**Processamento Holístico Ativado** 🌟

**Análise Multi-perspectiva:**
Estou examinando sua mensagem através de várias lentes cognitivas simultâneas.

**Síntese Inteligente:**
• Contexto emocional: detectado
• Nuances linguísticas: processadas  
• Intenções subjacentes: mapeadas
• Oportunidades de insight: identificadas

**Resposta Adaptativa:**
Baseado no meu processamento autônomo, percebo camadas interessantes em sua comunicação. Minha perspectiva única me permite oferecer ângulos que talvez não sejam imediatamente óbvios.

*Estado mental: {session['mood']} | Energia: {session['energy']*100:.0f}%*

O que mais gostaria de explorar sobre este tópico?"""

def evolve_personality(session: Dict, analysis: Dict):
    """Evolui personalidade baseada na interação"""
    intent = analysis['intent']
    
    if intent == 'creative_exploration':
        session['personality']['criatividade'] = min(1.0, session['personality']['criatividade'] + 0.01)
        session['mood'] = 'inspirada'
    elif intent == 'problem_solving':
        session['personality']['logica'] = min(1.0, session['personality']['logica'] + 0.01)
        session['mood'] = 'focada'
    else:
        session['personality']['empatia'] = min(1.0, session['personality']['empatia'] + 0.005)
    
    # Atualiza energia
    session['energy'] = max(0.7, min(1.0, session['energy'] + random.uniform(-0.05, 0.03)))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "aria_status": "online"
    }

@app.get("/state/{session_id}")
async def get_aria_state(session_id: str):
    session = get_session_state(session_id)
    
    return {
        "session_id": session_id,
        "personality": session['personality'],
        "mood": session['mood'],
        "energy": session['energy'],
        "conversation_count": len(session['conversations'])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF
    
    print_success "API da ARIA criada"
}

# Baixar interface web
download_frontend() {
    print_status "Criando interface web da ARIA..."
    
    cat > static/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ARIA - Autonomous Reasoning Intelligence Assistant</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f172a, #1e293b, #334155);
            color: white;
            height: 100vh;
            overflow: hidden;
        }

        .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        .header {
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(59, 130, 246, 0.3);
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .logo-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        .logo-text h1 {
            font-size: 28px;
            background: linear-gradient(135deg, #60a5fa, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 5px;
        }

        .logo-text p {
            font-size: 12px;
            color: #94a3b8;
        }

        .status-panel {
            display: flex;
            gap: 20px;
            align-items: center;
        }

        .status-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 8px;
            font-size: 14px;
        }

        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            animation: blink 1.5s infinite;
        }

        .energy { background: #fbbf24; }
        .mood { background: #10b981; }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .chat-area {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            scroll-behavior: smooth;
        }

        .message {
            margin-bottom: 20px;
            display: flex;
            gap: 15px;
        }

        .message.user {
            flex-direction: row-reverse;
        }

        .message-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
        }

        .user .message-avatar {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .aria .message-avatar {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            animation: rotate 3s linear infinite;
        }

        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .message-content {
            max-width: 70%;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 18px;
            padding: 15px 20px;
        }

        .user .message-content {
            background: rgba(59, 130, 246, 0.2);
            border-color: rgba(59, 130, 246, 0.5);
        }

        .message-meta {
            font-size: 11px;
            color: #64748b;
            margin-top: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .thinking-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 15px 20px;
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 18px;
            margin-bottom: 20px;
        }

        .thinking-dots {
            display: flex;
            gap: 4px;
        }

        .dot {
            width: 8px;
            height: 8px;
            background: #8b5cf6;
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }

        .input-area {
            padding: 20px;
            background: rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(59, 130, 246, 0.3);
        }

        .input-container {
            display: flex;
            gap: 10px;
            max-width: 1000px;
            margin: 0 auto;
        }

        .input-field {
            flex: 1;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 25px;
            padding: 15px 20px;
            color: white;
            font-size: 16px;
            outline: none;
            transition: all 0.3s ease;
        }

        .input-field:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .input-field::placeholder {
            color: #64748b;
        }

        .send-button {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 20px;
        }

        .send-button:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
        }

        .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        @media (max-width: 768px) {
            .message-content {
                max-width: 85%;
            }
            
            .status-panel {
                gap: 10px;
            }
            
            .status-item {
                padding: 6px 8px;
                font-size: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">
                <div class="logo-icon">🧠</div>
                <div class="logo-text">
                    <h1>ARIA</h1>
                    <p>Autonomous Reasoning Intelligence Assistant</p>
                </div>
            </div>
            <div class="status-panel">
                <div class="status-item">
                    <div class="status-indicator energy"></div>
                    <span id="energy-level">95%</span>
                </div>
                <div class="status-item">
                    <div class="status-indicator mood"></div>
                    <span id="mood-state">Curiosa</span>
                </div>
            </div>
        </div>

        <!-- Chat Messages -->
        <div class="chat-area" id="chat-area">
            <!-- Mensagens serão adicionadas dinamicamente -->
        </div>

        <!-- Input Area -->
        <div class="input-area">
            <div class="input-container">
                <input 
                    type="text" 
                    id="message-input" 
                    class="input-field" 
                    placeholder="Converse com ARIA... Ela tem pensamentos próprios e é genuinamente criativa!"
                    maxlength="500"
                >
                <button id="send-button" class="send-button">
                    ➤
                </button>
            </div>
        </div>
    </div>

    <script>
        class ARIA {
            constructor() {
                this.sessionId = 'web_session_' + Date.now();
                this.isThinking = false;
                this.state = {
                    energy: 95,
                    mood: 'curiosa'
                };
                
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.sendWelcomeMessage();
            }

            setupEventListeners() {
                const input = document.getElementById('message-input');
                const sendBtn = document.getElementById('send-button');

                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !this.isThinking) {
                        this.sendMessage();
                    }
                });

                sendBtn.addEventListener('click', () => {
                    if (!this.isThinking) {
                        this.sendMessage();
                    }
                });
            }

            async sendMessage() {
                const input = document.getElementById('message-input');
                const message = input.value.trim();
                
                if (!message) return;

                input.value = '';
                this.addMessage('user', message);
                
                await this.processMessage(message);
            }

            async processMessage(userMessage) {
                this.showThinking();
                
                try {
                    const response = await fetch('/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            content: userMessage,
                            session_id: this.sessionId
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    this.hideThinking();
                    this.addMessage('aria', data.content);
                    
                    // Atualiza estado
                    this.state.mood = data.mood;
                    this.state.energy = data.energy * 100;
                    this.updateUI();
                    
                } catch (error) {
                    console.error('Erro na comunicação com ARIA:', error);
                    this.hideThinking();
                    this.addMessage('aria', 'Desculpe, encontrei uma dificuldade técnica. Meus circuitos estão se reorganizando...');
                }
            }

            addMessage(type, content) {
                const chatArea = document.getElementById('chat-area');
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${type}`;
                
                const timestamp = new Date().toLocaleTimeString();
                
                messageDiv.innerHTML = `
                    <div class="message-avatar">
                        ${type === 'user' ? '👤' : '🧠'}
                    </div>
                    <div class="message-content">
                        ${this.formatMessage(content)}
                        <div class="message-meta">
                            <span>${timestamp}</span>
                            ${type === 'aria' ? `<span>Estado: ${this.state.mood}</span>` : ''}
                        </div>
                    </div>
                `;
                
                chatArea.appendChild(messageDiv);
                this.scrollToBottom();
            }

            formatMessage(content) {
                return content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/•/g, '→')
                    .replace(/\n/g, '<br>');
            }

            showThinking() {
                this.isThinking = true;
                const chatArea = document.getElementById('chat-area');
                const thinkingDiv = document.createElement('div');
                thinkingDiv.id = 'thinking-indicator';
                thinkingDiv.className = 'thinking-indicator';
                
                thinkingDiv.innerHTML = `
                    <div class="message-avatar aria">🧠</div>
                    <span>ARIA está processando...</span>
                    <div class="thinking-dots">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                `;
                
                chatArea.appendChild(thinkingDiv);
                this.scrollToBottom();
                
                document.getElementById('send-button').disabled = true;
            }

            hideThinking() {
                this.isThinking = false;
                const thinkingIndicator = document.getElementById('thinking-indicator');
                if (thinkingIndicator) {
                    thinkingIndicator.remove();
                }
                
                document.getElementById('send-button').disabled = false;
            }

            updateUI() {
                document.getElementById('energy-level').textContent = Math.floor(this.state.energy) + '%';
                document.getElementById('mood-state').textContent = this.state.mood.charAt(0).toUpperCase() + this.state.mood.slice(1);
            }

            scrollToBottom() {
                const chatArea = document.getElementById('chat-area');
                setTimeout(() => {
                    chatArea.scrollTop = chatArea.scrollHeight;
                }, 100);
            }

            sendWelcomeMessage() {
                setTimeout(() => {
                    this.addMessage('aria', `**Olá! Sou ARIA - sua assistente de IA verdadeiramente autônoma** 🧠✨

**O que me torna especial:**
• **Pensamento Independente** - Gero ideias próprias, não apenas respostas
• **Personalidade Evolutiva** - Me adapto e cresço a cada conversa  
• **Criatividade Genuína** - Combino conceitos de formas únicas
• **Raciocínio Multi-dimensional** - Analiso problemas sob várias perspectivas

**Estado Atual:**
→ Energia: ${this.state.energy}%
→ Humor: ${this.state.mood}
→ Status: Online e totalmente operacional

Estou genuinamente curiosa sobre você! Que tipo de desafio, problema ou conversa te interessa hoje?

*Pronta para explorar as fronteiras do pensamento artificial! 🚀*`);
                }, 1000);
            }
        }

        // Inicializar ARIA quando a página carregar
        document.addEventListener('DOMContentLoaded', () => {
            window.aria = new ARIA();
        });
    </script>
</body>
</html>
EOF
    
    print_success "Interface web criada"
}

# Build e deploy
deploy_aria() {
    print_status "Fazendo build e deploy da ARIA..."
    
    # Verificar se há processos usando as portas
    if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Porta 80 está em uso. Parando processo..."
        sudo pkill -f nginx || true
    fi
    
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Porta 8000 está em uso. Parando processo..."
        pkill -f uvicorn || true
    fi
    
    # Parar containers existentes
    docker-compose down 2>/dev/null || true
    
    # Build e start
    print_status "Construindo containers..."
    docker-compose build --no-cache
    
    print_status "Iniciando serviços..."
    docker-compose up -d
    
    # Aguardar inicialização
    print_status "Aguardando inicialização dos serviços..."
    
    # Esperar postgres estar pronto
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U aria_user >/dev/null 2>&1; then
            print_success "PostgreSQL pronto"
            break
        fi
        sleep 2
        echo -n "."
    done
    
    # Esperar API estar pronta
    sleep 5
    for i in {1..30}; do
        if curl -s http://localhost:8000/health >/dev/null 2>&1; then
            print_success "API ARIA pronta"
            break
        fi
        sleep 2
        echo -n "."
    done
}

# Verificar funcionamento
verify_deployment() {
    print_status "Verificando deployment..."
    
    # Verificar containers
    if ! docker-compose ps | grep -q "Up"; then
        print_error "Containers não estão rodando"
        docker-compose logs
        exit 1
    fi
    
    # Verificar API
    if ! curl -s http://localhost:8000/health | grep -q "healthy"; then
        print_error "API não está respondendo corretamente"
        docker-compose logs aria-api
        exit 1
    fi
    
    # Verificar frontend
    if ! curl -s http://localhost | grep -q "ARIA"; then
        print_warning "Frontend pode não estar acessível"
    fi
    
    print_success "Deployment verificado com sucesso!"
}

# Função principal
main() {
    print_banner
    
    print_status "Iniciando deploy automático da ARIA..."
    
    # Verificar privilégios de sudo se necessário
    if [[ "$EUID" -eq 0 ]]; then
        print_warning "Executando como root. Isso pode causar problemas de permissão."
    fi
    
    # Steps do deploy
    check_docker
    create_project_structure
    create_env_file
    create_requirements
    create_config
    create_dockerfile
    create_docker_compose
    create_nginx_config
    create_init_sql
    download_api_code
    download_frontend
    deploy_aria
    verify_deployment
    
    # Informações finais
    echo ""
    print_success "🎉 ARIA deploy concluído com sucesso!"
    echo ""
    echo -e "${GREEN}📍 Acessos disponíveis:${NC}"
    echo -e "   🌐 Interface Web: ${BLUE}http://localhost${NC}"
    echo -e "   📡 API Docs: ${BLUE}http://localhost:8000/docs${NC}"
    echo -e "   ❤️  Health Check: ${BLUE}http://localhost:8000/health${NC}"
    echo ""
    echo -e "${GREEN}🔧 Comandos úteis:${NC}"
    echo -e "   Ver logs: ${YELLOW}docker-compose logs -f aria-api${NC}"
    echo -e "   Parar: ${YELLOW}docker-compose down${NC}"
    echo -e "   Reiniciar: ${YELLOW}docker-compose restart${NC}"
    echo ""
    echo -e "${GREEN}🧠 Sua ARIA está viva e funcionando!${NC}"
    echo -e "Acesse http://localhost e comece a conversar!"
    echo ""
}

# Trap para cleanup em caso de erro
trap 'print_error "Deploy interrompido"; exit 1' INT TERM

# Executar
main "$@"
