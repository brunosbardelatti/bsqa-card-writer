from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.api.routes_analyze import router as analyze_router
from backend.api.routes_config import router as config_router
from dotenv import load_dotenv
import os

# Carregar variáveis de ambiente
# Tenta carregar do caminho relativo (desenvolvimento) ou do caminho absoluto (produção)
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, 'config', '.env')

# Tenta carregar o .env se existir, mas não falha se não existir
# (em produção, as variáveis de ambiente são configuradas diretamente no Railway)
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    # Em produção, carrega variáveis de ambiente do sistema
    load_dotenv()

app = FastAPI(title="BSQA Card Writer API", version="1.1.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas da API
app.include_router(analyze_router)
app.include_router(config_router)

# Servir arquivos estáticos do frontend
# Usa caminho absoluto para funcionar em produção
frontend_path = os.path.join(base_dir, 'frontend', 'public')

if os.path.exists(frontend_path):
    # Montar arquivos estáticos (CSS, JS, imagens, etc.)
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")
    app.mount("/js", StaticFiles(directory=os.path.join(frontend_path, "js")), name="js")
    app.mount("/components", StaticFiles(directory=os.path.join(frontend_path, "components")), name="components")
    app.mount("/docs", StaticFiles(directory=os.path.join(frontend_path, "docs")), name="docs")
    
    # Rotas para as páginas HTML principais
    @app.get("/")
    async def read_root():
        return FileResponse(os.path.join(frontend_path, "index.html"))
    
    @app.get("/index.html")
    async def read_index():
        return FileResponse(os.path.join(frontend_path, "index.html"))
    
    @app.get("/chat.html")
    async def read_chat():
        return FileResponse(os.path.join(frontend_path, "chat.html"))
    
    @app.get("/config.html")
    async def read_config():
        return FileResponse(os.path.join(frontend_path, "config.html"))
    
    @app.get("/docs.html")
    async def read_docs():
        return FileResponse(os.path.join(frontend_path, "docs.html"))
