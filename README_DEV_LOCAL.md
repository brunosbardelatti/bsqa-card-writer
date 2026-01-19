# 🚀 Guia de Desenvolvimento Local - BSQA Card Writer

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- ✅ **Python 3.9+**
- ✅ **Docker Desktop** (para PostgreSQL)
- ✅ **Make** (geralmente já vem no Git Bash ou WSL)

## 🐳 Configuração do Banco de Dados (PostgreSQL via Docker)

### 1. Iniciar PostgreSQL

O projeto usa Docker Compose para simplificar o PostgreSQL local:

```bash
make db-up
```

**Resultado esperado:**
```
🐘 Iniciando PostgreSQL via Docker...
✅ PostgreSQL iniciado!
   Host: localhost
   Port: 5432
   Database: bsqa_dev
   User: bsqa_user
   Password: bsqa_dev_password

📝 Não esqueça de executar 'make db-init' para criar as tabelas!
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp config/env.local.example config/.env

# Editar config/.env se necessário
# Por padrão já vem configurado para o PostgreSQL local
```

### 3. Inicializar Banco de Dados

```bash
make db-init
```

**Resultado esperado:**
```
🔧 Inicializando banco de dados...
============================================================
🔧 INICIALIZANDO BANCO DE DADOS
============================================================

1️⃣ Testando conexão com banco de dados...
✅ Conexão com banco de dados OK

2️⃣ Criando tabelas no banco de dados...
✅ Tabelas criadas com sucesso!
   - users
   - sessions

3️⃣ Verificando usuário administrador...
👤 Criando usuário administrador padrão...
✅ Usuário administrador criado com sucesso!
   Username: admin
   Email: admin@bsqa.com
   Senha: Admin@123456

   ⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!

============================================================
✅ INICIALIZAÇÃO CONCLUÍDA COM SUCESSO!
============================================================
```

---

## 🖥️ Executar Backend e Frontend

### Opção 1: Terminais Separados (Recomendado)

**Terminal 1 - Backend:**
```bash
make back
```

**Terminal 2 - Frontend:**
```bash
make front
```

### Opção 2: Mesmo Terminal

```bash
make chat
```

---

## 🌐 Acessar Aplicação

Após iniciar backend e frontend:

- 🏠 **Frontend**: http://localhost:8501/index.html
- 🔐 **Login**: http://localhost:8501/login.html
- 📡 **API Docs**: http://localhost:8000/docs
- 📚 **ReDoc**: http://localhost:8000/redoc

**Credenciais padrão:**
- Username: `admin`
- Senha: `Admin@123456`

---

## 📝 Comandos Make Disponíveis

### Banco de Dados

```bash
make db-up          # Inicia PostgreSQL
make db-down        # Para PostgreSQL
make db-init        # Cria tabelas e admin
make db-reset       # Apaga tudo e recria (⚠️ CUIDADO!)
make db-logs        # Mostra logs do PostgreSQL
make db-shell       # Acessa psql interativo
```

### pgAdmin (Administração Web do Banco)

```bash
make pgadmin-up     # Inicia pgAdmin (http://localhost:5050)
make pgadmin-down   # Para pgAdmin
```

**Credenciais pgAdmin:**
- Email: `admin@bsqa.com`
- Senha: `admin`

**Conexão no pgAdmin:**
- Host: `postgres`
- Port: `5432`
- Database: `bsqa_dev`
- User: `bsqa_user`
- Password: `bsqa_dev_password`

### Aplicação

```bash
make setup          # Cria venv e instala dependências
make back           # Inicia backend (FastAPI)
make front          # Inicia frontend (servidor estático)
make chat           # Inicia back + front juntos
make stop-all       # Para back + front
```

### Setup Completo

```bash
make dev-full       # Setup completo automático
```

---

## 🔧 Fluxo de Desenvolvimento Completo

### Primeira Vez (Setup Inicial)

```bash
# 1. Clonar repositório (se ainda não fez)
git clone <repo-url>
cd bsqa-card-writer

# 2. Setup automático completo
make dev-full

# 3. Abrir 2 terminais:
# Terminal 1:
make back

# Terminal 2:
make front

# 4. Acessar: http://localhost:8501/login.html
```

### Desenvolvimento Diário

```bash
# 1. Iniciar PostgreSQL (se não estiver rodando)
make db-up

# 2. Verificar se banco está OK (opcional)
make db-logs

# 3. Iniciar backend e frontend
# Terminal 1:
make back

# Terminal 2:
make front

# 4. Desenvolver! 🚀
```

### Resetar Banco (Limpar Dados)

```bash
# ⚠️ CUIDADO: Apaga TODOS os dados!
make db-reset

# Recriar tabelas
make db-init
```

### Parar Tudo

```bash
# Parar backend e frontend
make stop-all

# Parar PostgreSQL
make db-down
```

---

## 🐛 Troubleshooting

### Erro: "Port 5432 is already in use"

**Solução 1:** Outro PostgreSQL está rodando
```bash
# Windows: Parar serviço PostgreSQL
net stop postgresql-x64-15

# Ou verificar processos
netstat -ano | findstr :5432
taskkill /PID <PID> /F
```

**Solução 2:** Mudar porta no docker-compose.yml
```yaml
ports:
  - "5433:5432"  # Use porta 5433 no host
```

Atualizar `config/.env`:
```env
DATABASE_URL=postgresql://bsqa_user:bsqa_dev_password@localhost:5433/bsqa_dev
```

### Erro: "Docker not found"

```bash
# Instalar Docker Desktop
# https://www.docker.com/products/docker-desktop/

# Verificar instalação
docker --version
docker-compose --version
```

### Erro: "Connection refused" ao conectar no banco

```bash
# Verificar se container está rodando
docker ps

# Ver logs do PostgreSQL
make db-logs

# Reiniciar container
make db-down
make db-up
```

### Erro: "make: command not found" (Windows)

**Opção 1:** Usar Git Bash (recomendado)
```bash
# Instalar Git Bash
# https://git-scm.com/downloads

# Executar comandos no Git Bash
```

**Opção 2:** Instalar Make no Windows
```bash
# Via Chocolatey
choco install make

# Via Scoop
scoop install make
```

**Opção 3:** Executar comandos manualmente
```bash
# Ao invés de: make db-up
docker-compose up -d postgres

# Ao invés de: make db-init
python backend/database/init_db.py

# Ao invés de: make back
uvicorn backend.main:app --reload
```

### Erro: "No module named 'passlib'"

```bash
# Instalar dependências
make setup

# Ou manualmente
pip install -r requirements.txt
```

### Erro: "SECRET_KEY não configurada"

```bash
# Verificar se arquivo .env existe
ls config/.env

# Se não existir, copiar do exemplo
cp config/env.local.example config/.env

# Gerar nova SECRET_KEY (opcional)
python -c "import secrets; print(secrets.token_hex(32))"

# Adicionar ao config/.env
SECRET_KEY=<chave_gerada>
```

---

## 📊 Verificar Status

### PostgreSQL

```bash
# Via Docker
docker ps | grep bsqa_postgres

# Via psql
make db-shell
# Dentro do psql:
\dt          # Listar tabelas
\d users     # Descrever tabela users
SELECT * FROM users;  # Ver usuários
\q           # Sair
```

### Backend

```bash
# Verificar se está rodando
curl http://localhost:8000/health

# Resultado esperado:
# {"status":"ok","message":"API is running"}
```

### Frontend

```bash
# Verificar se está rodando
curl http://localhost:8501/index.html

# Ou abrir no navegador:
# http://localhost:8501/index.html
```

---

## 🔐 Dados de Desenvolvimento

### Admin Padrão

```
Username: admin
Email: admin@bsqa.com
Senha: Admin@123456
Perfil: admin
```

### Usuário de Teste (criar via interface)

```
Nome: João Silva
Username: joao.silva
Email: joao@empresa.com
Empresa: Empresa Teste
CPF: 12345678900
Senha: Teste@123
Perfil: user
```

---

## 📁 Estrutura de Arquivos Docker

```
bsqa-card-writer/
├── docker-compose.yml          # Configuração Docker
├── config/
│   ├── .env                    # Variáveis (não versionado)
│   └── env.local.example       # Exemplo para dev local
└── Makefile                    # Comandos automatizados
```

---

## 🎯 Comandos Rápidos (Cheat Sheet)

```bash
# Setup inicial (primeira vez)
make dev-full

# Dia a dia
make db-up && make back  # Terminal 1
make front               # Terminal 2

# Resetar banco
make db-reset && make db-init

# Ver logs
make db-logs

# Parar tudo
make stop-all && make db-down

# Administrar banco (web)
make pgadmin-up
# Acesse: http://localhost:5050
```

---

## 🚀 Próximos Passos

Após configurar o ambiente local:

1. ✅ Fazer login: http://localhost:8501/login.html
2. ✅ Criar usuários de teste
3. ✅ Testar funcionalidades
4. ✅ Desenvolver novas features
5. ✅ Deploy no Railway (quando pronto)

---

## 📚 Documentação Adicional

- 📖 **IMPLEMENTACAO_COMPLETA.md** - Manual completo do sistema
- 📖 **autenticacao.md** - Guia de implementação original
- 📖 **stepatual.md** - Progresso detalhado
- 🌐 **API Docs** - http://localhost:8000/docs (quando backend rodando)

---

## 💡 Dicas

1. **Use 2 terminais:** Um para backend, outro para frontend
2. **Mantenha PostgreSQL rodando:** Use `make db-up` uma vez e deixe rodando
3. **Logs são seus amigos:** Use `make db-logs` para debug
4. **pgAdmin é útil:** Use `make pgadmin-up` para visualizar dados
5. **Resetar quando necessário:** `make db-reset` + `make db-init` limpa tudo

---

**Dúvidas?** Consulte a documentação completa em `IMPLEMENTACAO_COMPLETA.md`

*Última atualização: 06/01/2026*

