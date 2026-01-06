#!/bin/bash

# Script de inicialização rápida para desenvolvimento local
# Uso: ./start-dev.sh

set -e

echo "============================================"
echo "🚀 BSQA Card Writer - Desenvolvimento Local"
echo "============================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar Docker
echo -e "${BLUE}1️⃣ Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não encontrado. Por favor, instale o Docker Desktop.${NC}"
    echo "   https://www.docker.com/products/docker-desktop/"
    exit 1
fi
echo -e "${GREEN}✅ Docker OK${NC}"
echo ""

# Verificar Python
echo -e "${BLUE}2️⃣ Verificando Python...${NC}"
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python não encontrado. Por favor, instale Python 3.9+${NC}"
    exit 1
fi
PYTHON_CMD=$(command -v python3 || command -v python)
echo -e "${GREEN}✅ Python OK: $($PYTHON_CMD --version)${NC}"
echo ""

# Verificar ambiente virtual
echo -e "${BLUE}3️⃣ Verificando ambiente virtual...${NC}"
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}⚠️  Ambiente virtual não encontrado. Criando...${NC}"
    make setup
    echo -e "${GREEN}✅ Ambiente virtual criado!${NC}"
else
    echo -e "${GREEN}✅ Ambiente virtual OK${NC}"
fi
echo ""

# Verificar arquivo .env
echo -e "${BLUE}4️⃣ Verificando arquivo de configuração...${NC}"
if [ ! -f "config/.env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo config/.env não encontrado. Copiando do exemplo...${NC}"
    cp config/env.local.example config/.env
    echo -e "${GREEN}✅ Arquivo config/.env criado!${NC}"
    echo -e "${YELLOW}   📝 Edite config/.env se necessário (chaves de API, etc)${NC}"
else
    echo -e "${GREEN}✅ Arquivo config/.env OK${NC}"
fi
echo ""

# Iniciar PostgreSQL
echo -e "${BLUE}5️⃣ Iniciando PostgreSQL...${NC}"
docker-compose up -d postgres
echo -e "${GREEN}✅ PostgreSQL iniciado!${NC}"
echo ""

# Aguardar PostgreSQL ficar pronto
echo -e "${BLUE}6️⃣ Aguardando PostgreSQL ficar pronto...${NC}"
sleep 5

# Verificar se precisa inicializar banco
echo -e "${BLUE}7️⃣ Verificando banco de dados...${NC}"
DB_INITIALIZED=false

# Tentar verificar se tabela users existe
docker exec bsqa_postgres_dev psql -U bsqa_user -d bsqa_dev -c "\dt users" &> /dev/null && DB_INITIALIZED=true || DB_INITIALIZED=false

if [ "$DB_INITIALIZED" = false ]; then
    echo -e "${YELLOW}⚠️  Banco não inicializado. Criando tabelas e admin...${NC}"
    make db-init
    echo -e "${GREEN}✅ Banco inicializado!${NC}"
else
    echo -e "${GREEN}✅ Banco já inicializado!${NC}"
fi
echo ""

# Resumo
echo "============================================"
echo -e "${GREEN}✅ AMBIENTE PRONTO!${NC}"
echo "============================================"
echo ""
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo ""
echo "  Abra 2 terminais e execute:"
echo ""
echo -e "  ${YELLOW}Terminal 1:${NC}"
echo "    make back"
echo ""
echo -e "  ${YELLOW}Terminal 2:${NC}"
echo "    make front"
echo ""
echo "  Ou execute em um único terminal:"
echo "    make chat"
echo ""
echo -e "${BLUE}🌐 URLs:${NC}"
echo "  Frontend: http://localhost:8501/login.html"
echo "  Backend:  http://localhost:8000/docs"
echo "  pgAdmin:  make pgadmin-up (depois http://localhost:5050)"
echo ""
echo -e "${BLUE}🔐 Login padrão:${NC}"
echo "  Username: admin"
echo "  Senha:    Admin@123456"
echo ""
echo -e "${BLUE}📚 Comandos úteis:${NC}"
echo "  make help       - Ver todos os comandos"
echo "  make db-logs    - Ver logs do PostgreSQL"
echo "  make db-shell   - Acessar PostgreSQL (psql)"
echo "  make db-reset   - Resetar banco (apaga dados)"
echo "  make stop-all   - Parar backend e frontend"
echo "  make db-down    - Parar PostgreSQL"
echo ""
echo "============================================"
echo -e "${GREEN}🚀 Bom desenvolvimento!${NC}"
echo "============================================"

