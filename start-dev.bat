@echo off
REM Script de inicialização rápida para desenvolvimento local (Windows)
REM Uso: start-dev.bat

echo ============================================
echo 🚀 BSQA Card Writer - Desenvolvimento Local
echo ============================================
echo.

REM Verificar Docker
echo 1️⃣ Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não encontrado. Por favor, instale o Docker Desktop.
    echo    https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo ✅ Docker OK
echo.

REM Verificar Python
echo 2️⃣ Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado. Por favor, instale Python 3.9+
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✅ Python OK: %PYTHON_VERSION%
echo.

REM Verificar ambiente virtual
echo 3️⃣ Verificando ambiente virtual...
if not exist ".venv" (
    echo ⚠️  Ambiente virtual não encontrado. Criando...
    make setup
    echo ✅ Ambiente virtual criado!
) else (
    echo ✅ Ambiente virtual OK
)
echo.

REM Verificar arquivo .env
echo 4️⃣ Verificando arquivo de configuração...
if not exist "config\.env" (
    echo ⚠️  Arquivo config\.env não encontrado. Copiando do exemplo...
    copy config\env.local.example config\.env >nul
    echo ✅ Arquivo config\.env criado!
    echo    📝 Edite config\.env se necessário (chaves de API, etc)
) else (
    echo ✅ Arquivo config\.env OK
)
echo.

REM Iniciar PostgreSQL
echo 5️⃣ Iniciando PostgreSQL...
docker-compose up -d postgres
echo ✅ PostgreSQL iniciado!
echo.

REM Aguardar PostgreSQL ficar pronto
echo 6️⃣ Aguardando PostgreSQL ficar pronto...
timeout /t 5 /nobreak >nul
echo.

REM Verificar se precisa inicializar banco
echo 7️⃣ Verificando banco de dados...
docker exec bsqa_postgres_dev psql -U bsqa_user -d bsqa_dev -c "\dt users" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Banco não inicializado. Criando tabelas e admin...
    make db-init
    echo ✅ Banco inicializado!
) else (
    echo ✅ Banco já inicializado!
)
echo.

REM Resumo
echo ============================================
echo ✅ AMBIENTE PRONTO!
echo ============================================
echo.
echo 📋 Próximos passos:
echo.
echo   Abra 2 terminais e execute:
echo.
echo   Terminal 1:
echo     make back
echo.
echo   Terminal 2:
echo     make front
echo.
echo   Ou execute em um único terminal:
echo     make chat
echo.
echo 🌐 URLs:
echo   Frontend: http://localhost:8501/login.html
echo   Backend:  http://localhost:8000/docs
echo   pgAdmin:  make pgadmin-up (depois http://localhost:5050)
echo.
echo 🔐 Login padrão:
echo   Username: admin
echo   Senha:    Admin@123456
echo.
echo 📚 Comandos úteis:
echo   make help       - Ver todos os comandos
echo   make db-logs    - Ver logs do PostgreSQL
echo   make db-shell   - Acessar PostgreSQL (psql)
echo   make db-reset   - Resetar banco (apaga dados)
echo   make stop-all   - Parar backend e frontend
echo   make db-down    - Parar PostgreSQL
echo.
echo ============================================
echo 🚀 Bom desenvolvimento!
echo ============================================
echo.
pause

