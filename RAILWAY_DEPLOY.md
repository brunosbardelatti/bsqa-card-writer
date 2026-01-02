# 🚀 Guia de Deploy no Railway

Este guia explica como fazer deploy do **BSQA Card Writer** na plataforma Railway.com.

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Repositório Git (GitHub, GitLab, etc.)
3. Variáveis de ambiente configuradas (OpenAI e/ou StackSpot)

---

## 🔧 Configuração do Railway

### **Opção 1: Configuração Automática (Recomendada)**

O projeto já está configurado com os arquivos necessários:
- ✅ `requirements.txt` - Dependências Python (na raiz para detecção automática)
- ✅ `railway.json` - Configuração do Railway
- ✅ `railway.toml` - Configuração alternativa
- ✅ `railpack.toml` - Configuração do Railpack para forçar detecção Python
- ✅ `Procfile` - Comando de inicialização

O Railway detectará automaticamente que é um projeto Python através do `requirements.txt` na raiz e usará as configurações.

### **Opção 2: Configuração Manual no Dashboard**

Se preferir configurar manualmente:

1. **Root Directory**: Deixe vazio (raiz do projeto)
2. **Build Command**: `pip install -r config/requirements.txt`
3. **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

---

## 🔐 Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no Railway:

### **OpenAI (Obrigatório para usar OpenAI)**
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **StackSpot AI (Obrigatório para usar StackSpot)**
```
Client_ID_stackspot=xxxxxxxx
Client_Key_stackspot=xxxxxxxx
Realm_stackspot=xxxxxxxx
STACKSPOT_AGENT_ID=xxxxxxxx
```

### **Como Configurar no Railway:**
1. Acesse seu projeto no Railway
2. Vá em **Variables**
3. Adicione cada variável de ambiente
4. Clique em **Deploy** para aplicar

---

## 🚀 Passos para Deploy

### **1. Conectar Repositório**
1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Clique em **New Project**
3. Selecione **Deploy from GitHub repo** (ou GitLab)
4. Escolha o repositório `bsqa-card-writer`

### **2. Configurar Serviço**
O Railway detectará automaticamente:
- ✅ Linguagem: Python
- ✅ Builder: Railpack
- ✅ Comando de build: `pip install -r config/requirements.txt`
- ✅ Comando de start: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

### **3. Adicionar Variáveis de Ambiente**
Configure as variáveis de ambiente conforme descrito acima.

### **4. Deploy**
1. O Railway iniciará o build automaticamente
2. Aguarde o build completar
3. O serviço estará disponível na URL gerada pelo Railway

---

## 🌐 Acessos Após Deploy

Após o deploy bem-sucedido, você terá acesso a:

- **Home**: `https://seu-projeto.railway.app/`
- **Chat**: `https://seu-projeto.railway.app/chat.html`
- **Configurações**: `https://seu-projeto.railway.app/config.html`
- **Documentação**: `https://seu-projeto.railway.app/docs.html`
- **API Docs**: `https://seu-projeto.railway.app/docs` (Swagger UI)
- **API**: `https://seu-projeto.railway.app/analyze` (endpoint de análise)

---

## 🔍 Troubleshooting

### **Erro: "Railpack could not determine how to build the app"**

**Solução**: Verifique se os arquivos de configuração estão na raiz:
- ✅ `requirements.txt` (na raiz - obrigatório para detecção Python)
- ✅ `railway.json` ou `railway.toml`
- ✅ `railpack.toml` (configuração do Railpack)
- ✅ `Procfile`
- ✅ Arquivos Python em `backend/` (para detecção)

**Importante**: O `requirements.txt` DEVE estar na raiz do projeto para o Railpack detectar Python automaticamente.

### **Erro: "Module not found"**

**Solução**: Verifique se o `config/requirements.txt` está correto e todas as dependências estão listadas.

### **Erro: "Port already in use"**

**Solução**: O Railway fornece a porta via variável `$PORT`. Certifique-se de usar `--port $PORT` no comando de start.

### **Frontend não carrega**

**Solução**: 
1. Verifique se o caminho `frontend/public` existe
2. Verifique os logs do Railway para erros de caminho
3. Certifique-se de que o backend está servindo os arquivos estáticos

### **Erro 502 - Application failed to respond**

**Solução**:
1. **Verifique os logs de runtime** no Railway (não apenas os logs de build)
2. **Verifique o comando de start**: Deve ser `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
3. **Teste o endpoint `/health`**: Deve retornar `{"status": "ok"}` se a API estiver rodando
4. **Verifique se o frontend existe**: Os logs mostrarão `[DEBUG] Frontend exists: True/False`
5. **Verifique variáveis de ambiente**: Certifique-se de que `$PORT` está sendo usado (não um número fixo)
6. **Verifique imports**: Pode haver erro de importação de módulos Python

**Comandos úteis para debug**:
- Acesse `/health` para verificar se a API está respondendo
- Acesse `/docs` para ver a documentação Swagger (se a API estiver rodando)
- Verifique os logs de runtime no Railway Dashboard

### **API não responde**

**Solução**:
1. Verifique se as variáveis de ambiente estão configuradas
2. Verifique os logs do Railway (especialmente os logs de runtime, não apenas build)
3. Teste o endpoint `/health` primeiro, depois `/docs`
4. Verifique se há erros de importação nos logs

---

## 📝 Estrutura de Arquivos para Deploy

```
bsqa-card-writer/
├── backend/              # Código do backend
├── frontend/            # Arquivos estáticos do frontend
├── config/              # Configurações e dependências
│   ├── requirements.txt # Dependências Python (backup)
│   └── .env            # Variáveis de ambiente (não commitado)
├── requirements.txt     # Dependências Python (raiz - para detecção)
├── railway.json        # Configuração do Railway (raiz)
├── railway.toml        # Configuração alternativa (raiz)
├── railpack.toml       # Configuração do Railpack (raiz)
├── Procfile            # Comando de start (raiz)
└── README.md           # Documentação
```

---

## 🎯 Configurações Avançadas

### **Usar Python 3.11**
Adicione variável de ambiente:
```
RAILPACK_PYTHON_VERSION=3.11
```

### **Instalar Pacotes Adicionais**
Adicione variável de ambiente:
```
RAILPACK_PACKAGES=nodejs@20
```

### **Configurar Watch Paths**
No dashboard do Railway, configure **Watch Paths** para monitorar apenas mudanças no backend:
```
backend/**
config/**
```

---

## ✅ Checklist de Deploy

- [ ] Repositório conectado ao Railway
- [ ] Variáveis de ambiente configuradas (OpenAI e/ou StackSpot)
- [ ] Build completado com sucesso
- [ ] Serviço rodando e acessível
- [ ] Frontend carregando corretamente
- [ ] API respondendo em `/docs`
- [ ] Teste de análise funcionando

---

## 🔄 Atualizações Futuras

Para atualizar o projeto:
1. Faça push das alterações para o repositório
2. O Railway detectará automaticamente e iniciará novo deploy
3. Aguarde o build e deploy completarem

---

## 📚 Recursos Adicionais

- [Documentação Railway](https://docs.railway.app)
- [Railpack Docs](https://railpack.com)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

*Deploy configurado e pronto para produção! 🚀*

