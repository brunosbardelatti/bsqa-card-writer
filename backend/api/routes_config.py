from typing import Optional
from fastapi import APIRouter, HTTPException, Body
from backend.utils.config_utils import load_user_config, load_env_config
from backend.services.ia_factory import test_api_services

router = APIRouter()

# Rotas /config e /api-config mantidas apenas por compatibilidade opcional.
# A configuração de usuário (preferências, IA, Jira) é gerenciada no navegador (localStorage/sessionStorage);
# o frontend não chama mais GET/POST /config nem GET/POST /api-config no fluxo de Config.

@router.get("/config")
async def get_config():
    return load_user_config()

@router.post("/config")
async def update_config(config: dict):
    # Config de usuário é gerenciada no navegador; não grava em user_config.json para evitar recriar o arquivo.
    return {"success": True, "message": "Configurações salvas com sucesso"}

JIRA_KEYS = {"JIRA_BASE_URL", "JIRA_USER_EMAIL", "JIRA_API_TOKEN", "JIRA_SUBTASK_ISSUE_TYPE_ID", "JIRA_REQUEST_TIMEOUT", "JIRA_BUG_ISSUE_TYPE_ID", "JIRA_SUB_BUG_ISSUE_TYPE_ID"}


@router.get("/api-config")
async def get_api_config():
    env = load_env_config()
    return {k: v for k, v in env.items() if k not in JIRA_KEYS}


@router.post("/api-config")
async def update_api_config(api_config: dict):
    # Credenciais de API são gerenciadas no navegador; não grava em .env para evitar recriar o arquivo.
    return {"success": True, "message": "Configurações de API salvas com sucesso"}

@router.post("/test-api-config")
async def test_api_config(body: Optional[dict] = Body(None)):
    """Aceita opcionalmente ia_credentials no body para testar sem .env."""
    try:
        credentials = (body or {}).get("ia_credentials")
        return test_api_services(credentials=credentials)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao testar configurações: {str(e)}") 