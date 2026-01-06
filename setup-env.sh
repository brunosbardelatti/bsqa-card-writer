#!/bin/bash

# Script para criar o arquivo config/.env automaticamente
# Uso: ./setup-env.sh

echo "============================================"
echo "🔧 Configurando arquivo .env para WSL/Linux"
echo "============================================"
echo ""

# Verificar se já existe
if [ -f "config/.env" ]; then
    echo "⚠️  Arquivo config/.env já existe!"
    read -p "Deseja sobrescrever? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Operação cancelada."
        exit 0
    fi
fi

# Criar diretório config se não existir
mkdir -p config

# Criar arquivo .env
cat > config/.env << 'EOF'
# ============================================
# AMBIENTE DE DESENVOLVIMENTO LOCAL (WSL/Linux)
# ============================================

# ============================================
# DATABASE (PostgreSQL Local via Docker)
# ============================================
DATABASE_URL=postgresql://bsqa_user:bsqa_dev_password@localhost:5432/bsqa_dev

# ============================================
# SECURITY
# ============================================
# IMPORTANTE: Gere uma nova chave para produção!
# Para gerar: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=dev_secret_key_change_in_production_12345678901234567890
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ============================================
# ADMIN PADRÃO (Desenvolvimento)
# ============================================
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@bsqa.com
ADMIN_PASSWORD=Admin@123456
ADMIN_NOME=Administrador BSQA
ADMIN_EMPRESA=BSQA
ADMIN_CPF=00000000000

# ============================================
# AMBIENTE
# ============================================
APP_ENV=development

# ============================================
# API KEYS (OpenAI e StackSpot)
# ============================================
# Adicione suas chaves de API abaixo
OPENAI_API_KEY=
STACKSPOT_CLIENT_ID=
STACKSPOT_CLIENT_SECRET=
STACKSPOT_SLUG=
EOF

echo "✅ Arquivo config/.env criado com sucesso!"
echo ""
echo "📝 Conteúdo criado:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat config/.env
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Pronto! Agora você pode executar:"
echo "   make db-init"
echo ""

