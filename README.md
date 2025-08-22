# ✦Ｓσρђɪα✦ v11.0 - Assistente Pessoal PWA

![Status](https://img.shields.io/badge/status-ativo-brightgreen)
![Versão](https://img.shields.io/badge/versão-11.0-blueviolet)
![Licença](https://img.shields.io/badge/licença-MIT-blue)

**Sophia é uma assistente pessoal avançada, projetada como um Progressive Web App (PWA) totalmente autossuficiente. Ela possui memória persistente, capacidade de aprendizado, personalidades duplas e se integra com APIs externas, tudo isso rodando diretamente no seu navegador, garantindo total privacidade e funcionamento offline.**

---

### [➡️ ACESSE A DEMONSTRAÇÃO AO VIVO AQUI ⬅️](https://naotodev1.github.io/Sophia-PWA/) 
*(Substitua pelo link do seu GitHub Pages)*

![Screenshot da Sophia v11.0](https://i.imgur.com/link-para-sua-imagem.png) 
*(Recomendado: tire um screenshot da interface e suba para um site como o imgur.com para colocar o link aqui)*

---

### ✨ Principais Funcionalidades

*   **Progressive Web App (PWA):** Instale a Sophia na sua área de trabalho ou tela inicial do celular para uma experiência de aplicativo nativo e com acesso offline.
*   **Personalidade Dupla:** Alterne entre **Sophia**, a assistente prestativa e profissional, e **KAI**, o especialista técnico com uma interface de terminal.
*   **Memória Persistente:** Sophia lembra do seu nome, preferências e tudo o que você a ensina entre as sessões, usando o `localStorage` do navegador.
*   **Aprendizado Ativo:** Ensine novos conceitos à Sophia com o comando `lembre-se que...` e construa sua base de conhecimento pessoal.
*   **Conexão com o Mundo Real:**
    *   📰 **Notícias:** Busca as últimas notícias sobre qualquer tópico via GNews API.
    *   📖 **Dicionário:** Fornece definições de palavras em português.
*   **Gerenciamento de Dados do Usuário:**
    *   📥 **Exportar Dados:** Baixe um arquivo `.json` com toda a memória da Sophia.
    *   ❌ **Excluir Conta:** Apague completamente seus dados do navegador com um único comando.
*   **Ferramentas de Produtividade:** Defina alarmes, crie lembretes e gere senhas seguras.
*   **Interface Moderna e Responsiva:** Um design limpo e elegante que se adapta perfeitamente a qualquer tamanho de tela, de desktops a celulares.

---

### 🛠️ Tecnologias Utilizadas

*   **Frontend:** HTML5, CSS3, JavaScript (ES6+)
*   **PWA:** Service Worker, Web App Manifest
*   **APIs Externas:** GNews API, Dictionary API
*   **Hospedagem:** GitHub Pages

---

### 🚀 Como Usar e Instalar

A Sophia foi projetada para ser acessível a todos, sem necessidade de instalação complexa.

1.  **Acesse o Link:** Simplesmente abra o link da [Demonstração Ao Vivo](https://naotodev1.github.io/aria/).
2.  **Comece a Conversar:** Aceite os termos de uso e comece a interagir.
3.  **(Opcional) Instale o App:**
    *   **No Desktop (Chrome/Edge):** Um ícone de instalação (um monitor com uma seta para baixo) aparecerá na barra de endereço. Clique nele para "instalar" a Sophia como um aplicativo na sua área de trabalho.
    *   **No Celular (Android/iOS):** Use a opção "Adicionar à tela de início" no menu do seu navegador.

A instalação permite que a Sophia funcione em sua própria janela e fique acessível mesmo quando você estiver offline.

---

### 🤖 Guia de Comandos

Explore o menu lateral para descobrir as funcionalidades ou use os comandos de texto abaixo.

#### **Sophia (Assistente Pessoal)**
*   **Aprendizado:** `lembre-se que [conceito] é [definição]`
*   **Consulta:** `o que é [conceito]?`
*   **Notícias:** `notícias sobre tecnologia`
*   **Dicionário:** `o que significa semântica`
*   **Alarme:** `alarme para 15:30`
*   **Lembrete:** `me lembre de fazer uma pausa em 10 minutos`
*   **Senha:** `gere uma senha`
*   **Sistema:** `limpar memória`, `renomear para [novo nome]`

#### **KAI (Terminal Técnico)**
*   Primeiro, ative o modo com: `ativar modo kai`
*   **Código:** `gere um html básico`
*   **Documentação:** `doc javascript map`
*   **RPG:** `role 2d20`
*   **Citações:** `citação nerd`
*   Para voltar, digite: `sair do modo kai`

---

### 🔧 Configuração Essencial

Para que a funcionalidade de notícias funcione na sua própria versão do projeto, você precisa de uma chave de API gratuita do GNews.

1.  Obtenha sua chave em [gnews.io](https://gnews.io/).
2.  Abra o arquivo `index.html`.
3.  Encontre a linha: `const NEWS_API_KEY = 'SUA_CHAVE_DE_API_AQUI';`
4.  Substitua `'SUA_CHAVE_DE_API_AQUI'` pela sua chave real.

---

### 🔮 O Futuro da Sophia

A v11.0 é uma base sólida. Os próximos passos exploram uma inteligência ainda mais profunda:
*   **Migração do Cérebro:** Mover a lógica principal para um backend em Python/Node.js para permitir processamento de linguagem natural (PLN) real.
*   **Integração com LLMs:** Conectar a Sophia a modelos de linguagem locais (`.gguf`) ou via API (GPT, Gemini) para conversas verdadeiramente dinâmicas.
*   **Integração com Google Workspace:** Permitir que a Sophia crie eventos no seu Google Calendar ou resuma Google Docs.

---

Desenvolvido por **Naoto Dev**.
