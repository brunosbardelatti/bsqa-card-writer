from fastapi import APIRouter, HTTPException
from backend.utils.config_utils import load_user_config, save_user_config, load_env_config, save_env_config
from backend.services.ia_factory import test_api_services

router = APIRouter()

@router.get("/config")
async def get_config():
    return load_user_config()

@router.post("/config")
async def update_config(config: dict):
    # Substituir completamente a configuração em vez de apenas atualizar
    # Isso garante que chaves não presentes no config sejam removidas
    if save_user_config(config):
        return {"success": True, "message": "Configurações salvas com sucesso"}
    else:
        raise HTTPException(status_code=500, detail="Erro ao salvar configurações")

@router.get("/api-config")
async def get_api_config():
    return load_env_config()

@router.post("/api-config")
async def update_api_config(api_config: dict):
    # Fazer merge com configurações existentes para não sobrescrever outras configurações
    # As novas configurações são mescladas com as existentes no .env
    if save_env_config(api_config):
        return {"success": True, "message": "Configurações de API salvas com sucesso"}
    else:
        raise HTTPException(status_code=500, detail="Erro ao salvar configurações de API")

@router.post("/test-api-config")
async def test_api_config():
    try:
        return test_api_services()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao testar configurações: {str(e)}") 