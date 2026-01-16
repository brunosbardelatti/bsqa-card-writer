#!/bin/bash

echo "🔧 Atualizando bcrypt e passlib..."
echo ""

# Ativar ambiente virtual se existir
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Desinstalar versões antigas
pip uninstall -y bcrypt passlib

# Instalar versões compatíveis (bcrypt 4.x, NÃO 5.x!)
pip install "bcrypt==4.1.3" "passlib[bcrypt]>=1.7.4"

echo ""
echo "✅ Pacotes atualizados!"
echo ""
echo "Versões instaladas:"
pip show bcrypt | grep Version
pip show passlib | grep Version
echo ""
echo "Agora execute: make db-init"

