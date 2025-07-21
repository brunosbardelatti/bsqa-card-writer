from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes_analyze import router as analyze_router
from backend.api.routes_config import router as config_router
from dotenv import load_dotenv
import os

# Carregar variáveis de ambiente
env_path = os.getenv('DOTENV_PATH', 'config/.env')
load_dotenv(env_path)

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(analyze_router)
app.include_router(config_router)
