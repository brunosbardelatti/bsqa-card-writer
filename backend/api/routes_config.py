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

# Chaves Jira não são mais expostas nem gravadas via api-config; credenciais ficam no navegador (sessionStorage).
JIRA_KEYS = {"JIRA_BASE_URL", "JIRA_USER_EMAIL", "JIRA_API_TOKEN", "JIRA_SUBTASK_ISSUE_TYPE_ID", "JIRA_REQUEST_TIMEOUT", "JIRA_BUG_ISSUE_TYPE_ID", "JIRA_SUB_BUG_ISSUE_TYPE_ID"}


@router.get("/api-config")
async def get_api_config():
    env = load_env_config()
    return {k: v for k, v in env.items() if k not in JIRA_KEYS}


@router.post("/api-config")
async def update_api_config(api_config: dict):
    # Não gravar Jira no .env; credenciais Jira ficam apenas no navegador (sessionStorage).
    filtered = {k: v for k, v in api_config.items() if k not in JIRA_KEYS}
    if save_env_config(filtered):
        return {"success": True, "message": "Configurações de API salvas com sucesso"}
    else:
        raise HTTPException(status_code=500, detail="Erro ao salvar configurações de API")

@router.post("/test-api-config")
async def test_api_config():
    try:
        return test_api_services()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao testar configurações: {str(e)}") 