# 🤖📋 QA Card Writer BSQA

**QA Card Writer BSQA** é uma aplicação moderna que utiliza um Hub de IA para analisar requisitos de software e gerar casos de teste estruturados, com interface web intuitiva e validações robustas.

---

## 🚀 Funcionalidades Principais

### **📄 Entrada de Dados**
- **Upload de arquivos**: PDF e TXT (drag & drop)
- **Digitação manual**: Campo de texto expandido
- **Validação automática**: Tipo, tamanho e conteúdo
- **Feedback visual**: Quantidade de arquivos selecionados

### **🤖 Integração com IAs**
- **OpenAI GPT-4o-mini**: Análise avançada de requisitos
- **StackSpot AI**: Alternativa com autenticação JWT
- **Templates dinâmicos**: Prompts específicos por serviço

### **📋 Geração de Casos de Teste**
- **Main Flow**: Comportamento típico e esperado
- **Alternative Flow**: Variações válidas do fluxo principal
- **Exception Flow**: Erros, entradas inválidas, falhas do sistema

### **🎨 Interface Moderna**
- **Design responsivo**: Adaptável para desktop e mobile
- **Tema escuro**: Interface moderna e profissional
- **Loading states**: Feedback visual durante processamento
- **Botão copiar**: Copia resposta com scroll acompanhante
- **Documentação integrada**: Modal de ajuda com regras completas

---

## 📁 Estrutura do Projeto
```
├── backend/
│   └── main.py                    # Backend FastAPI
├── .frontend/
│   └── public/
│       ├── index.html             # Frontend principal
│       └── software-requirements.md # Documentação técnica
├── config/
│   ├── .env                       # Chaves das APIs
│   ├── requirements.txt           # Dependências Python
│   ├── prompt_template_open_ai.txt
│   └── prompt_template_stackspot_ai.txt
├── README.md
├── Makefile
└── .gitignore
```

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

---

## 📦 Instalação e Setup

### **Usando Makefile (Recomendado)**
```bash
# Setup completo
make setup

# Rodar projeto completo
make chat

# Rodar apenas backend
make back

# Rodar apenas frontend
make front
```

### **Instalação Manual**
```bash
# Criar ambiente virtual
python3 -m venv .venv

# Ativar ambiente
# Linux/Mac:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Instalar dependências
pip install -r config/requirements.txt

# Rodar backend
uvicorn backend.main:app --reload

# Rodar frontend (novo terminal)
cd .frontend/public
python -m http.server 8501
```

---

## 🧪 Como Usar

### **1. Acesse a Aplicação**
- URL: [http://localhost:8501/index.html](http://localhost:8501/index.html)
- Documentação API: [http://localhost:8000/docs](http://localhost:8000/docs)

### **2. Envie Requisitos**
- **Arraste e solte** arquivo PDF/TXT
- **Ou digite** requisitos no campo de texto
- **Selecione** OpenAI ou StackSpot AI

### **3. Receba Casos de Teste**
- Casos organizados por fluxo
- Botão copiar para clipboard
- Limpeza automática para novo input

---

## 🛡️ Validações Implementadas

### **Frontend**
- ✅ Tipos de arquivo: PDF e TXT apenas
- ✅ Tamanho máximo: 100MB
- ✅ Entrada obrigatória: Arquivo OU texto
- ✅ Feedback visual: Loading, sucesso, erro

### **Backend**
- ✅ Validação server-side robusta
- ✅ Processamento seguro de arquivos
- ✅ Tratamento de erros HTTP
- ✅ Integração com múltiplas IAs

---

## 🎯 Recursos Avançados

### **Interface Intuitiva**
- **Drag & drop** para upload de arquivos
- **Feedback visual** em tempo real
- **Botão remover** arquivo selecionado
- **Scroll acompanhante** no botão copiar
- **Modal de documentação** integrada

### **Experiência do Usuário**
- **Loading states** durante processamento
- **Limpeza automática** após sucesso
- **Responsividade** para diferentes telas
- **Acessibilidade** com tooltips e navegação

### **Desenvolvimento**
- **Makefile** cross-platform
- **Hot reload** no backend
- **CORS** habilitado
- **Logs** detalhados

---

## 📚 Documentação Técnica

Para informações detalhadas sobre:
- **Validações e regras**
- **Funcionalidades implementadas**
- **Requisitos técnicos**
- **Testes realizados**

📋 **[Ver Documentação Completa](.frontend/public/software-requirements.md)**

---

## 🧰 Desenvolvimento

### **Comandos Úteis**
```bash
make help          # Ver todos os comandos
make setup         # Setup inicial
make chat          # Rodar projeto completo
make stop-all      # Parar todos os processos
```

### **Arquivos Importantes**
- **Backend**: `backend/main.py`
- **Frontend**: `.frontend/public/index.html`
- **Configuração**: `config/.env`
- **Dependências**: `config/requirements.txt`

---

## ❓ Dúvidas Frequentes

**Q: Posso usar apenas uma das IAs?**
A: Sim! Configure apenas as chaves da API desejada no `.env`.

**Q: O projeto funciona offline?**
A: Não, requer conexão com internet para acessar as APIs de IA.

**Q: Posso adicionar novos tipos de arquivo?**
A: Sim, edite as validações em `backend/main.py` e `index.html`.

**Q: Como personalizar os prompts?**
A: Edite os arquivos em `config/prompt_template_*.txt`.

---

## 🚀 Roadmap

- [ ] Suporte a mais formatos de arquivo
- [ ] Integração com outras IAs
- [ ] Exportação de casos de teste
- [ ] Histórico de análises
- [ ] Interface administrativa

---

### 👩‍💻 Criado por Bruno Sbardelatti

**BSQA QUALIDADE DE SOFTWARE LTDA**

*Projeto em constante evolução - Contribuições são bem-vindas!*