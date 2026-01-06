# Makefile para automação do ThinkTest AI

.DEFAULT_GOAL := help

.PHONY: help setup backend frontend db-up db-down db-init db-logs db-reset

help: ## Exibe esta ajuda com os comandos disponíveis
	@echo "---------------------------------------------"
	@echo "QA card Writer BSQA"
	@echo "---------------------------------------------"
	@awk -F ":.*##" '/:.*##/ && ! /\t/ {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST) | sort
	@echo ""
	@echo "Para desenvolvimento local completo:"
	@echo "  1. make db-up      # Inicia o PostgreSQL"
	@echo "  2. make db-init    # Inicializa o banco"
	@echo "  3. make back       # Inicia o backend"
	@echo "  4. make front      # Inicia o frontend"
	@echo ""

# Setup do ambiente virtual e instalação de dependências
setup: ## Cria o ambiente virtual e instala as dependências
	python3 -m venv .venv
	.venv/Scripts/pip.exe install -r config/requirements.txt || .venv/bin/pip install -r config/requirements.txt

# Rodar o backend (FastAPI)
back: ## Inicia o servidor backend
	.venv/Scripts/python.exe -m uvicorn backend.main:app --reload || .venv/bin/python -m uvicorn backend.main:app --reload
	@echo "\n---"
	@echo "Backend rodando!"
	@echo "Acesse a documentação da API: http://localhost:8000/docs"
	@echo "A API está ativa e respondendo em: http://localhost:8000/analyze"
	@echo "---\n"

# Rodar o frontend (servidor Python)
front: ## Inicia o servidor frontend
	cd frontend/public && (python -m http.server 8501 || python3 -m http.server 8501)
	@echo "\n---"
	@echo "Frontend rodando!"
	@echo "Acesse o chat em: http://localhost:8501/index.html"
	@echo "---\n"

.PHONY: stop-back
stop-back:
	@echo "Finalizando todos os processos do backend (uvicorn)..."
	-pkill -f "uvicorn.*backend.main:app" || true

.PHONY: stop-front
stop-front:
	@echo "Finalizando todos os servidores http.server do frontend..."
	-pkill -f "http.server" || true

.PHONY: stop-all
stop-all: stop-back stop-front
	@echo "Todos os processos de backend e frontend foram finalizados."

.PHONY: chat
chat:
	@echo "Iniciando backend e frontend, Projeto iniciando..."
	$(MAKE) back &
	$(MAKE) front &
	wait
	@echo "\n---"
	@echo "Projeto rodando!"
	@echo "Acesse a documentação da API: http://localhost:8000/docs"
	@echo "Acesse o chat em: http://localhost:8501/index.html"
	@echo "A API está ativa e respondendo em: http://localhost:8000/analyze"
	@echo "---\n"

# ============================================
# COMANDOS DO BANCO DE DADOS (PostgreSQL via Docker)
# ============================================

db-up: ## Inicia o container PostgreSQL
	@echo "🐘 Iniciando PostgreSQL via Docker..."
	docker-compose up -d postgres
	@echo "⏳ Aguardando PostgreSQL ficar pronto..."
	@timeout /t 5 >nul 2>&1 || sleep 5
	@echo "✅ PostgreSQL iniciado!"
	@echo "   Host: localhost"
	@echo "   Port: 5432"
	@echo "   Database: bsqa_dev"
	@echo "   User: bsqa_user"
	@echo "   Password: bsqa_dev_password"
	@echo ""
	@echo "📝 Não esqueça de executar 'make db-init' para criar as tabelas!"

db-down: ## Para o container PostgreSQL
	@echo "🛑 Parando PostgreSQL..."
	docker-compose down
	@echo "✅ PostgreSQL parado!"

db-logs: ## Mostra os logs do PostgreSQL
	docker-compose logs -f postgres

db-init: ## Inicializa o banco de dados (cria tabelas e admin)
	@echo "🔧 Inicializando banco de dados..."
	@echo "📋 Certifique-se de que o arquivo config/.env está configurado!"
	@echo ""
	.venv/Scripts/python.exe backend/database/init_db.py || .venv/bin/python backend/database/init_db.py
	@echo ""
	@echo "✅ Banco de dados inicializado!"

db-reset: ## Para o banco, apaga dados e reinicia
	@echo "⚠️  ATENÇÃO: Isso irá apagar TODOS os dados do banco!"
	@echo "Pressione Ctrl+C para cancelar ou aguarde 5 segundos..."
	@timeout /t 5 >nul 2>&1 || sleep 5
	@echo "🗑️  Parando e removendo containers e volumes..."
	docker-compose down -v
	@echo "🚀 Iniciando novamente..."
	$(MAKE) db-up
	@echo ""
	@echo "📝 Execute 'make db-init' para recriar as tabelas!"

db-shell: ## Acessa o shell do PostgreSQL (psql)
	@echo "🐘 Acessando PostgreSQL shell..."
	@echo "Comandos úteis:"
	@echo "  \dt          - Lista todas as tabelas"
	@echo "  \d users     - Descreve a tabela users"
	@echo "  \q           - Sair"
	@echo ""
	docker exec -it bsqa_postgres_dev psql -U bsqa_user -d bsqa_dev

pgadmin-up: ## Inicia o pgAdmin (administração web)
	@echo "🌐 Iniciando pgAdmin..."
	docker-compose --profile tools up -d pgadmin
	@echo "✅ pgAdmin iniciado!"
	@echo "   Acesse: http://localhost:5050"
	@echo "   Email: admin@bsqa.com"
	@echo "   Password: admin"
	@echo ""
	@echo "Para conectar ao banco no pgAdmin:"
	@echo "   Host: postgres"
	@echo "   Port: 5432"
	@echo "   Database: bsqa_dev"
	@echo "   User: bsqa_user"
	@echo "   Password: bsqa_dev_password"

pgadmin-down: ## Para o pgAdmin
	@echo "🛑 Parando pgAdmin..."
	docker-compose --profile tools down
	@echo "✅ pgAdmin parado!"

dev-full: ## Setup completo para desenvolvimento (DB + Backend + Frontend)
	@echo "🚀 Iniciando ambiente de desenvolvimento completo..."
	@echo ""
	@echo "1️⃣ Verificando ambiente virtual..."
	@if not exist ".venv" ($(MAKE) setup)
	@echo ""
	@echo "2️⃣ Iniciando PostgreSQL..."
	$(MAKE) db-up
	@echo ""
	@echo "3️⃣ Inicializando banco de dados..."
	$(MAKE) db-init
	@echo ""
	@echo "4️⃣ Iniciando Backend e Frontend..."
	@echo ""
	@echo "⚠️  Abra 2 terminais separados e execute:"
	@echo "   Terminal 1: make back"
	@echo "   Terminal 2: make front"
	@echo ""
	@echo "Ou use: make chat (inicia ambos no mesmo terminal)"