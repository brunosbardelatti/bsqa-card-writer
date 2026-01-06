from fastapi import APIRouter, HTTPException, Depends
from backend.utils.config_utils import load_user_config, save_user_config, load_env_config, save_env_config
from backend.services.ia_factory import test_api_services
from backend.utils.dependencies import get_current_user, require_admin
from backend.models.user import User

router = APIRouter(tags=["Configurações"])

@router.get("/config")
async def get_config(current_user: User = Depends(get_current_user)):
    """
    ## ⚙️ Obter Configurações do Usuário
    
    Retorna as configurações salvas do usuário.
    
    **Requer autenticação**
    
    ### Retorna:
    - Objeto com configurações do usuário
    
    ### Erros:
    - **401**: Token inválido ou expirado
    - **403**: Usuário inativo
    """
    return load_user_config()

@router.post("/config")
async def update_config(
    config: dict,
    current_user: User = Depends(require_admin)
):
    """
    ## 💾 Salvar Configurações do Usuário
    
    Atualiza as configurações do usuário.
    
    **Requer perfil ADMIN**
    
    ### Parâmetros:
    - **config**: Objeto com as novas configurações
    
    ### Retorna:
    - **success**: True se salvo com sucesso
    - **message**: Mensagem de confirmação
    
    ### Erros:
    - **401**: Token inválido ou expirado
    - **403**: Usuário não é admin
    - **500**: Erro ao salvar configurações
    """
    # Substituir completamente a configuração em vez de apenas atualizar
    # Isso garante que chaves não presentes no config sejam removidas
    if save_user_config(config):
        return {"success": True, "message": "Configurações salvas com sucesso"}
    else:
        raise HTTPException(status_code=500, detail="Erro ao salvar configurações")

@router.get("/api-config")
async def get_api_config(current_user: User = Depends(require_admin)):
    """
    ## 🔑 Obter Configurações de API
    
    Retorna as configurações de APIs (OpenAI, StackSpot).
    
    **Requer perfil ADMIN**
    
    ### Retorna:
    - Objeto com configurações de API
    
    ### Erros:
    - **401**: Token inválido ou expirado
    - **403**: Usuário não é admin
    """
    return load_env_config()

@router.post("/api-config")
async def update_api_config(
    api_config: dict,
    current_user: User = Depends(require_admin)
):
    """
    ## 🔐 Salvar Configurações de API
    
    Atualiza as configurações de APIs externas (OpenAI, StackSpot).
    
    **Requer perfil ADMIN**
    
    ### Parâmetros:
    - **api_config**: Objeto com as novas configurações de API
    
    ### Retorna:
    - **success**: True se salvo com sucesso
    - **message**: Mensagem de confirmação
    
    ### Erros:
    - **401**: Token inválido ou expirado
    - **403**: Usuário não é admin
    - **500**: Erro ao salvar configurações
    """
    # Substituir completamente a configuração em vez de apenas atualizar
    # Isso garante que chaves não presentes no api_config sejam removidas
    if save_env_config(api_config):
        return {"success": True, "message": "Configurações de API salvas com sucesso"}
    else:
        raise HTTPException(status_code=500, detail="Erro ao salvar configurações de API")

@router.post("/test-api-config")
async def test_api_config(current_user: User = Depends(require_admin)):
    """
    ## 🧪 Testar Configurações de API
    
    Testa a conexão com as APIs configuradas (OpenAI, StackSpot).
    
    **Requer perfil ADMIN**
    
    ### Retorna:
    - Resultado dos testes de cada API
    
    ### Erros:
    - **401**: Token inválido ou expirado
    - **403**: Usuário não é admin
    - **500**: Erro ao testar configurações
    """
    try:
        return test_api_services()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao testar configurações: {str(e)}") 