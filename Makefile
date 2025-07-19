# Makefile para automação do ThinkTest AI

.DEFAULT_GOAL := help

.PHONY: help setup backend frontend

help: ## Exibe esta ajuda com os comandos disponíveis
	@echo "---------------------------------------------"
	@echo "QA card Writer BSQA"
	@echo "---------------------------------------------"
	@awk -F ":.*##" '/:.*##/ && ! /\t/ {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST) | sort

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