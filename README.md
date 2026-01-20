# 🤖📋 BSQA Card Writer

**BSQA Card Writer** é uma aplicação moderna que utiliza IA para analisar requisitos de software e gerar casos de teste estruturados, automação de testes e análise de código. Com interface web intuitiva, múltiplas IAs integradas, 7 tipos diferentes de análise e integração completa com Jira para consulta de cards e criação automática de subtasks de QA.

---

## 🚀 Funcionalidades

### ✨ **Principais Recursos**
- **📝 7 Tipos de Análise**: Card QA Writer, Test Case Flow Generator, Swagger Generators, Code Review Analyzer
- **🎫 Integração Jira**: Consulta de cards e criação automática de subtasks de QA
- **📄 Suporte a Arquivos**: Upload de arquivos PDF, TXT e JSON
- **🤖 Múltiplas IAs**: OpenAI e StackSpot AI integradas
- **⚙️ Configuração Totalmente Parametrizável**: Interface web para configurar todas as APIs
- **🎨 Temas**: Suporte a tema escuro, claro e automático
- **📋 Copiar Resultado**: Botão para copiar resultados para área de transferência
- **💾 Configurações Persistentes**: Salva preferências do usuário
- **🏠 Interface Moderna**: Home page com cards interativos e navegação intuitiva

### 🔧 **Tipos de Análise Disponíveis**

#### **🎯 Card QA Writer**
- Análise de cards de PM/PO para geração de casos de teste estruturados
- Formato BDD/Gherkin com cenários detalhados
- Critérios de aceitação e user stories

#### **🔄 Test Case Flow Generator**
- Classificação de casos de teste por fluxo
- Separação em Fluxo Principal, Alternativo e Exceção
- Estruturação automática de cenários

#### **📡 Swagger Postman Generator**
- Geração de coleções Postman a partir de Swagger/OpenAPI
- Testes implementados automaticamente
- Estrutura organizada e reutilizável

#### **🐍 Swagger Python Generator**
- Geração de testes Python/pytest para APIs
- Código pronto para execução
- Padrões de teste automatizados

#### **🤖 Curl Robot API Generator**
- Automação de testes em Robot Framework
- A partir de comandos cURL
- Estrutura modular e reutilizável

#### **🔧 Swagger Robot Generator**
- Geração completa de automação Robot Framework
- Keywords reutilizáveis e casos de teste prontos
- A partir de especificações Swagger/OpenAPI

#### **🔍 Code Review Analyzer**
- Análise técnica de diffs do Git
- Feedback em português sobre erros e melhorias
- Identificação de riscos de segurança

#### **🎫 Integração Jira**
- **Consulta de Cards**: Busca informações detalhadas de cards do Jira
- **Campos Personalizáveis**: Selecione quais campos consultar (Título, Descrição, Status, Prioridade, Responsáveis, TAG, etc.)
- **Criação Automática de Subtasks**: Gera subtasks de QA com casos de teste usando IA
- **Visualização Organizada**: Exibição hierárquica e cognitiva dos dados do card
- **Cópia de Dados**: Copie informações do card em formato estruturado
- **Layout Responsivo**: Interface otimizada para diferentes tamanhos de tela

### 🔧 **Configuração de APIs**
O sistema oferece interface completa para configurar todas as APIs necessárias:

#### **🔑 OpenAI**
- **API Key**: Configure sua chave da OpenAI diretamente na interface
- **Tokens**: Ajuste o número máximo de tokens para respostas

#### **🔑 StackSpot AI**
- **Client ID**: ID do cliente StackSpot
- **Client Secret**: Chave secreta do cliente StackSpot  
- **Realm**: Realm do StackSpot
- **Agent ID**: ID do agente StackSpot
- **Configurações Avançadas**:
  - Streaming (resposta em tempo real)
  - Usar conhecimento StackSpot
  - Retornar KS na resposta

#### **🎫 Jira (Integração)**
- **Base URL**: URL base da instância Jira (ex: https://seu-dominio.atlassian.net)
- **User Email**: Email do usuário Jira
- **API Token**: Token de API do Jira (gerado em https://id.atlassian.com/manage-profile/security/api-tokens)
- **Request Timeout**: Timeout para requisições (padrão: 30 segundos)
- **Subtask Issue Type ID**: ID do tipo de issue para subtasks (padrão: 5)

#### **🧪 Teste de Configurações**
- Botão para testar as configurações de API (OpenAI, StackSpot e Jira)
- Validação automática das credenciais
- Feedback visual do status das configurações

---

## 📁 Estrutura do Projeto

```
BSQA-card-Writer/
├── 📁 backend/
│   ├── 📁 api/
│   │   ├── routes_analyze.py      # Rotas de análise
│   │   └── routes_config.py       # Rotas de configuração
│   ├── 📁 services/
│   │   ├── ia_factory.py          # Factory pattern para IAs
│   │   ├── ia_base.py             # Interface base
│   │   ├── openai_service.py      # Serviço OpenAI
│   │   ├── stackspot_service.py   # Serviço StackSpot
│   │   └── jira_service.py        # Serviço de integração Jira
│   ├── 📁 utils/
│   │   ├── config_utils.py        # Gerenciamento de configurações
│   │   ├── file_utils.py          # Manipulação de arquivos
│   │   └── prompt_loader.py       # Carregamento de templates
│   └── main.py                    # Aplicação FastAPI
├── 📁 frontend/
│   └── 📁 public/
│       ├── index.html             # Home page
│       ├── chat.html              # Interface de chat
│       ├── card.html              # Integração Jira (consulta e criação de subtasks)
│       ├── config.html            # Página de configurações
│       ├── 📁 assets/
│       │   ├── style.css          # Estilos globais
│       │   └── favicon.ico        # Ícone
│       ├── 📁 js/
│       │   ├── main.js            # Utilitários globais
│       │   ├── index.js           # Lógica da home
│       │   ├── chat.js            # Lógica do chat
│       │   ├── card.js            # Lógica da integração Jira
│       │   └── config.js          # Lógica de configurações
│       └── 📁 components/
│           ├── header.html        # Header reutilizável
│           └── footer.html        # Footer reutilizável
├── 📁 config/
│   ├── requirements.txt           # Dependências Python
│   ├── user_config.json          # Configurações do usuário
│   └── 📁 prompts/
│       ├── prompt_template_card_QA_writer.txt.txt
│       ├── prompt_template_test_case_flow_classifier.txt
│       ├── prompt_template_swagger_postman.txt
│       ├── prompt_template_swagger_python.txt
│       ├── prompt_template_robot_API_generator.txt
│       ├── prompt_template_swagger_robot_generator.txt
│       └── prompt_template_code_review_diff.txt
├── 📁 release-notes/
│   └── releasenotes-V1.1.1.md    # Notas de release
├── README.md                      # Documentação principal
├── Makefile                       # Automação de comandos
└── .gitignore                     # Arquivos ignorados pelo Git
```

### **🎯 Organização e Benefícios**

#### **📁 Separação Clara de Responsabilidades**
- **`backend/`**: Lógica do servidor e API com arquitetura modular
- **`frontend/`**: Interface do usuário com componentes reutilizáveis
- **`config/`**: Configurações, templates e dependências
- **`release-notes/`**: Histórico de versões e funcionalidades

#### **📋 Estrutura Lógica**
- **`frontend/public/`**: Arquivos servidos pelo servidor web
- **`frontend/docs/`**: Documentação específica do frontend
- **`config/prompts/`**: 7 templates de IA organizados
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

### **🎫 Jira (Integração)**
Adicione ao `config/.env`:
```env
JIRA_BASE_URL=https://seu-dominio.atlassian.net
JIRA_USER_EMAIL=seu-email@exemplo.com
JIRA_API_TOKEN=seu-token-api-jira
JIRA_REQUEST_TIMEOUT=30
JIRA_SUBTASK_ISSUE_TYPE_ID=5
```

**Como obter o API Token do Jira:**
1. Acesse: https://id.atlassian.com/manage-profile/security/api-tokens
2. Clique em "Create API token"
3. Copie o token gerado e use no `.env`

### **📋 Arquivos de Configuração**
- **`config/user_config.json`**: Configurações do usuário
- **`config/prompts/`**: 7 templates de prompts para as IAs

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
   - Configure suas chaves de API (OpenAI, StackSpot e/ou Jira)
   - Use o botão "🧪 Testar Configurações" para validar cada API

### **🔧 Configuração Manual (Opcional)**
Se preferir configurar manualmente:
1. Copie `config/env.example` para `config/.env`
2. Preencha suas chaves de API
3. Execute `make chat`

### **🌐 Acessos**
- **Home**: http://localhost:8501/index.html
- **Chat**: http://localhost:8501/chat.html
- **Card Jira**: http://localhost:8501/card.html
- **Configurações**: http://localhost:8501/config.html
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🎯 **Comandos Disponíveis**

### **🚀 Desenvolvimento**
```bash
make chat          # Inicia backend + frontend
make back          # Apenas backend
make front         # Apenas frontend
```

### **⚙️ Setup**
```bash
make setup         # Instala dependências
```

### **🛑 Controle de Processos**
```bash
make stop-all      # Para todos os processos
make stop-back     # Para apenas o backend
make stop-front    # Para apenas o frontend
```

---

## 🎨 **Interface Moderna**

### **🏠 Home Page**
- **Cards Interativos**: Navegação direta para funcionalidades
- **Hero Features**: Chat Inteligente, Configurações, Múltiplas IAs, Templates
- **Tipos de Análise**: Cards clicáveis com pré-seleção automática
- **Design Responsivo**: Adapta-se a qualquer dispositivo

### **💬 Chat Page**
- **Upload Drag & Drop**: Interface intuitiva para arquivos
- **7 Tipos de Análise**: Seleção dinâmica com placeholders específicos
- **Feedback Visual**: Loading states e resultados formatados
- **Copiar Resultado**: Botão sticky para copiar respostas

### **🎫 Card Jira Page**
- **Consulta de Cards**: Busque cards do Jira por número (ex: PKGS-280)
- **Seleção de Campos**: Escolha quais campos consultar (Título, Descrição, Status, Prioridade, Responsáveis, TAG, QA Responsável)
- **Selecionar Todos**: Checkbox para marcar/desmarcar todos os campos opcionais
- **Visualização Organizada**: 
  - Header compacto com card key e nome do projeto
  - Título destacado com label descritivo
  - Badges coloridos para Prioridade, Status e TAG's
  - Grid de responsáveis (Dev e QA)
  - Descrição com scroll funcional
- **Criação de Subtasks**: Gere subtasks de QA automaticamente usando IA
- **Cópia de Dados**: Botão sticky para copiar informações do card
- **Layout Responsivo**: Adapta-se a diferentes tamanhos de tela

#### **📖 Como Usar a Integração Jira**

**1. Consultar Card:**
   - Acesse a página "Card Jira"
   - Insira o número do card (ex: PKGS-280)
   - Selecione os campos desejados (ou use "Selecionar todos os campos")
   - Clique em "🔍 Consultar Card"
   - Visualize os dados organizados hierarquicamente

**2. Criar Subtask de QA:**
   - Consulte um card primeiro
   - Selecione a funcionalidade "🚀 Criar Subtask baseado no card consultado"
   - Escolha o serviço de IA (OpenAI ou StackSpot)
   - O sistema irá:
     1. Consultar o card no Jira
     2. Enviar os dados para a IA gerar casos de teste
     3. Criar automaticamente a subtask no Jira com os casos de teste
   - Receba o link da subtask criada

**3. Campos Disponíveis:**
   - **Obrigatórios**: Título do Card, Descrição
   - **Opcionais**: Status, Prioridade, Responsável, TAG, QA Responsável
   - **Selecionar Todos**: Marca/desmarca todos os campos opcionais de uma vez

### **⚙️ Configurações**
- **Interface Completa**: Todas as configurações em uma página
- **Teste de APIs**: Validação automática das credenciais
- **Temas**: Escuro, claro e automático
- **Persistência**: Configurações salvas automaticamente


---

## 🔧 **Arquitetura Técnica**

### **🏗️ Backend (FastAPI)**
- **Arquitetura Modular**: API routes, services, utils
- **Factory Pattern**: Serviços de IA dinâmicos
- **Integração Jira**: Serviço completo para consulta e criação de subtasks
- **Validação Robusta**: Entrada validada em todas as rotas
- **Processamento de Arquivos**: PDF, TXT, JSON com encoding automático
- **Atlassian Document Format**: Conversão automática de descrições ADF para texto

### **🎨 Frontend (HTML/CSS/JS)**
- **Componentes Reutilizáveis**: Header, footer, modais
- **Sistema de Temas**: CSS variables para dark/light/auto
- **JavaScript Modular**: ES6 modules organizados por funcionalidade
- **Responsividade**: Layout adaptativo para mobile e desktop

### **⚙️ Configurações**
- **Híbrido**: Servidor + localStorage para performance
- **Sincronização**: Automática com fallback offline
- **Validação**: Configurações testadas antes de salvar

---

## 📊 **Estatísticas do Projeto**

- **📁 Arquivos**: 30+ arquivos organizados
- **🎯 Funcionalidades**: 7 tipos de análise + Integração Jira
- **🤖 IAs Integradas**: 2 (OpenAI + StackSpot)
- **🎫 Integrações**: Jira Cloud (REST API v3)
- **🎨 Temas**: 3 (Escuro, Claro, Automático)
- **📱 Responsividade**: Mobile + Desktop
- **🔧 APIs**: 10+ endpoints REST
- **📋 Templates**: 7 prompts especializados

---

## 🚀 **Roadmap Futuro**

### **✅ Funcionalidades Implementadas**
- ✅ **7 Tipos de Análise**: Todos funcionais
- ✅ **Múltiplas IAs**: OpenAI e StackSpot
- ✅ **Integração Jira**: Consulta de cards e criação de subtasks
- ✅ **Interface Moderna**: Home page com cards interativos
- ✅ **Sistema de Temas**: Dark/light/auto
- ✅ **Configurações Avançadas**: Interface completa (APIs + Jira)
- ✅ **Responsividade**: Mobile e desktop
- ✅ **Layout Otimizado**: Visualização hierárquica e cognitiva dos dados

### **🔄 Próximas Funcionalidades**
- 🔄 **Histórico de Análises**: Visualizar e reutilizar análises anteriores
- 🔄 **Exportação**: PDF, Word, Excel
- 🔄 **Templates Customizáveis**: Criar templates próprios
- 🔄 **Múltiplos Usuários**: Sistema de autenticação
- 🔄 **Backup Automático**: Sincronização com nuvem
- 🔄 **Métricas**: Dashboard de uso e performance

---

*Projeto desenvolvido com ❤️ pela equipe BSQA* 🎯