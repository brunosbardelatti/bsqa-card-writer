# 🤖📋 QA Card Writer BSQA

**QA Card Writer BSQA** é uma aplicação moderna que utiliza um Hub de IA para analisar requisitos de software e gerar casos de teste estruturados, com interface web intuitiva e validações robustas.

---

## 🚀 Funcionalidades

### ✨ Principais Recursos
- **📝 Análise de Requisitos**: Gera casos de teste detalhados a partir de requisitos
- **📄 Suporte a Arquivos**: Upload de arquivos PDF e TXT
- **🤖 Múltiplas IAs**: Suporte para OpenAI e StackSpot AI
- **⚙️ Configuração Totalmente Parametrizável**: Interface web para configurar todas as APIs
- **🎨 Temas**: Suporte a tema escuro, claro e automático
- **📋 Copiar Resultado**: Botão para copiar resultados para área de transferência
- **💾 Configurações Persistentes**: Salva preferências do usuário

### 🔧 Configuração de APIs
O sistema agora oferece uma interface completa para configurar todas as APIs necessárias:

#### 🔑 OpenAI
- **API Key**: Configure sua chave da OpenAI diretamente na interface
- **Tokens**: Ajuste o número máximo de tokens para respostas

#### 🔑 StackSpot AI
- **Client ID**: ID do cliente StackSpot
- **Client Secret**: Chave secreta do cliente StackSpot  
- **Realm**: Realm do StackSpot
- **Agent ID**: ID do agente StackSpot
- **Configurações Avançadas**:
  - Streaming (resposta em tempo real)
  - Usar conhecimento StackSpot
  - Retornar KS na resposta

#### 🧪 Teste de Configurações
- Botão para testar as configurações de API
- Validação automática das credenciais
- Feedback visual do status das configurações

---

## 📁 Estrutura do Projeto

```
BSQA-card-Writer/
├── 📁 backend/
│   └── main.py                    # Backend FastAPI
├── 📁 frontend/
│   ├── 📁 public/
│   │   ├── index.html             # Interface principal
│   │   ├── config.html            # Página de configurações
│   │   └── assets/                # Recursos estáticos
│   └── 📁 docs/
│       └── software-requirements.md # Documentação técnica
├── 📁 config/
│   ├── requirements.txt           # Dependências Python
│   ├── env.example               # Exemplo de variáveis de ambiente
│   ├── user_config.example.json  # Exemplo de configurações
│   └── 📁 prompts/
│       ├── prompt_template_open_ai.txt
│       └── prompt_template_stackspot_ai.txt
├── README.md                      # Documentação principal
├── Makefile                       # Automação de comandos
└── .gitignore                     # Arquivos ignorados pelo Git
```

### **🎯 Organização e Benefícios**

#### **📁 Separação Clara de Responsabilidades**
- **`backend/`**: Lógica do servidor e API
- **`frontend/`**: Interface do usuário e documentação
- **`config/`**: Configurações, templates e dependências
- **`README.md`**: Documentação principal na raiz

#### **📋 Estrutura Lógica**
- **`frontend/public/`**: Arquivos servidos pelo servidor web
- **`frontend/docs/`**: Documentação específica do frontend
- **`config/prompts/`**: Templates de IA organizados
- **`config/`**: Configurações centralizadas

#### **🚀 Vantagens da Organização**
- ✅ **Clareza**: Cada pasta tem propósito específico
- ✅ **Manutenibilidade**: Fácil navegação e manutenção
- ✅ **Escalabilidade**: Estrutura preparada para crescimento
- ✅ **Padrões**: Segue convenções da indústria

---

## 🔐 Configuração das APIs

### **OpenAI**
Crie o arquivo `config/.env` com:
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **StackSpot AI (Opcional)**
Adicione ao `config/.env`:
```env
Client_ID_stackspot=xxxxxxxx
Client_Key_stackspot=xxxxxxxx
Realm_stackspot=xxxxxxxx
STACKSPOT_AGENT_ID=xxxxxxxx
```

### **📋 Arquivos de Configuração**
- **`config/env.example`**: Exemplo de variáveis de ambiente
- **`config/user_config.example.json`**: Exemplo de configurações do usuário
- **`config/prompts/`**: Templates de prompts para as IAs

---

## 🚀 Instalação e Configuração

### **📋 Pré-requisitos**
- Python 3.8+
- Navegador web moderno
- Conexão com internet

### **⚙️ Setup Rápido**

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/brunosbardelatti/BSQA-card-Writer.git
   cd BSQA-card-Writer
   ```

2. **Instale as dependências:**
   ```bash
   make setup
   ```

3. **Execute o projeto:**
   ```bash
   make chat
   ```

4. **Configure as APIs via interface web:**
   - Acesse: http://localhost:8501/index.html
   - Clique no botão ⚙️ (configurações)
   - Configure suas chaves de API (OpenAI e/ou StackSpot)
   - Use o botão "🧪 Testar Configurações" para validar

### **🔧 Configuração Manual (Opcional)**
Se preferir configurar manualmente:
1. Copie `config/env.example` para `config/.env`
2. Preencha suas chaves de API
3. Execute `make chat`

### **🌐 Acessos**
- **Frontend**: http://localhost:8501/index.html
- **Backend**: http://localhost:8000
- **Documentação API**: http://localhost:8000/docs