from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from backend.api.routes_analyze import router as analyze_router
from backend.api.routes_config import router as config_router
from dotenv import load_dotenv
import os
import sys

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

# Health check endpoint
@app.get("/health")
async def health_check():
    return JSONResponse({"status": "ok", "message": "API is running"})

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

# Log para debug (será visível nos logs do Railway)
print(f"[DEBUG] Base directory: {base_dir}")
print(f"[DEBUG] Frontend path: {frontend_path}")
print(f"[DEBUG] Frontend exists: {os.path.exists(frontend_path)}")
print(f"[DEBUG] Current working directory: {os.getcwd()}")
print(f"[DEBUG] Python path: {sys.path}")

try:
    if os.path.exists(frontend_path):
        # Montar arquivos estáticos (CSS, JS, imagens, etc.)
        assets_path = os.path.join(frontend_path, "assets")
        js_path = os.path.join(frontend_path, "js")
        components_path = os.path.join(frontend_path, "components")
        docs_path = os.path.join(frontend_path, "docs")
        
        if os.path.exists(assets_path):
            app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
        if os.path.exists(js_path):
            app.mount("/js", StaticFiles(directory=js_path), name="js")
        if os.path.exists(components_path):
            app.mount("/components", StaticFiles(directory=components_path), name="components")
        if os.path.exists(docs_path):
            app.mount("/docs", StaticFiles(directory=docs_path), name="docs")
        
        # Rotas para as páginas HTML principais
        @app.get("/")
        async def read_root():
            index_file = os.path.join(frontend_path, "index.html")
            if os.path.exists(index_file):
                return FileResponse(index_file)
            return JSONResponse({"error": "Frontend not found"}, status_code=404)
        
        @app.get("/index.html")
        async def read_index():
            index_file = os.path.join(frontend_path, "index.html")
            if os.path.exists(index_file):
                return FileResponse(index_file)
            return JSONResponse({"error": "Frontend not found"}, status_code=404)
        
        @app.get("/chat.html")
        async def read_chat():
            chat_file = os.path.join(frontend_path, "chat.html")
            if os.path.exists(chat_file):
                return FileResponse(chat_file)
            return JSONResponse({"error": "Frontend not found"}, status_code=404)
        
        @app.get("/config.html")
        async def read_config():
            config_file = os.path.join(frontend_path, "config.html")
            if os.path.exists(config_file):
                return FileResponse(config_file)
            return JSONResponse({"error": "Frontend not found"}, status_code=404)
        
        @app.get("/docs.html")
        async def read_docs():
            docs_file = os.path.join(frontend_path, "docs.html")
            if os.path.exists(docs_file):
                return FileResponse(docs_file)
            return JSONResponse({"error": "Frontend not found"}, status_code=404)
        
        print(f"[DEBUG] Frontend routes configured successfully")
    else:
        print(f"[WARNING] Frontend path does not exist: {frontend_path}")
        # Fallback: retornar JSON se frontend não existir
        @app.get("/")
        async def read_root_fallback():
            return JSONResponse({
                "message": "API is running",
                "frontend_path": frontend_path,
                "frontend_exists": False,
                "base_dir": base_dir
            })
except Exception as e:
    print(f"[ERROR] Error configuring frontend: {str(e)}")
    import traceback
    traceback.print_exc()
    # Ainda assim, a API deve funcionar
