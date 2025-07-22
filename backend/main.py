from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes_analyze import router as analyze_router
from backend.api.routes_config import router as config_router
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../config/.env'))

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
