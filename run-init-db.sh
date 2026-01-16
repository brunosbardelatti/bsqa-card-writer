#!/bin/bash

# Script helper para inicializar o banco de dados
# Garante que o PYTHONPATH está correto

# Ir para o diretório do projeto
cd "$(dirname "$0")"

# Ativar ambiente virtual se existir
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Exportar PYTHONPATH
export PYTHONPATH="$(pwd):$PYTHONPATH"

# Executar init_db.py
python backend/database/init_db.py

echo ""
echo "Finalizado!"

