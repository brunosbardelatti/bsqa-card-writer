"""
Rotas de Autenticação
Endpoints: login, logout, verificação de token
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.schemas.auth_schema import (
    LoginRequest, 
    TokenResponse, 
    VerifyTokenResponse,
    LogoutResponse
)
from backend.services.auth_service import AuthService
from backend.utils.dependencies import get_current_user
from backend.models.user import User

# Criar router com prefixo e tag
router = APIRouter(prefix="/auth", tags=["Autenticação"])

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    ## 🔐 Endpoint de Login
    
    Realiza autenticação do usuário e retorna token JWT.
    
    ### Parâmetros:
    - **username**: Username do usuário
    - **senha**: Senha do usuário
    
    ### Retorna:
    - **access_token**: Token JWT para autenticação
    - **token_type**: Tipo do token (bearer)
    - **expires_in**: Tempo de expiração em segundos
    - **user**: Dados básicos do usuário
    
    ### Erros:
    - **401**: Credenciais inválidas
    - **403**: Usuário inativo
    
    ### Exemplo de uso:
    ```json
    {
        "username": "admin",
        "senha": "Admin@123456"
    }
    ```
    """
    return AuthService.login(db, login_data)

@router.post("/logout", response_model=LogoutResponse, status_code=status.HTTP_200_OK)
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ## 🚪 Endpoint de Logout
    
    Realiza logout do usuário.
    
    **Requer autenticação** (token JWT no header Authorization)
    
    ### Headers necessários:
    - **Authorization**: Bearer {token}
    
    ### Retorna:
    - **message**: Mensagem de confirmação
    
    ### Erros:
    - **401**: Token inválido ou expirado
    """
    AuthService.logout(db, current_user)
    return LogoutResponse(message="Logout realizado com sucesso")

@router.get("/me", status_code=status.HTTP_200_OK)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    ## 👤 Obter Dados do Usuário Atual
    
    Retorna informações do usuário autenticado.
    
    **Requer autenticação** (token JWT no header Authorization)
    
    ### Headers necessários:
    - **Authorization**: Bearer {token}
    
    ### Retorna:
    - Dados completos do usuário (exceto senha)
    
    ### Erros:
    - **401**: Token inválido ou expirado
    - **403**: Usuário inativo
    """
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "nome_completo": current_user.nome_completo,
        "email": current_user.email,
        "empresa": current_user.empresa,
        "cpf": current_user.cpf,
        "perfil": current_user.perfil.value,
        "ativo": current_user.ativo,
        "data_criacao": current_user.data_criacao,
        "data_atualizacao": current_user.data_atualizacao,
        "ultimo_login": current_user.ultimo_login
    }

@router.post("/verify-token", response_model=VerifyTokenResponse, status_code=status.HTTP_200_OK)
async def verify_token(
    current_user: User = Depends(get_current_user)
):
    """
    ## ✅ Verificar Token JWT
    
    Verifica se o token JWT é válido e retorna dados do usuário.
    
    Útil para verificação de autenticação no frontend.
    
    ### Headers necessários:
    - **Authorization**: Bearer {token}
    
    ### Retorna:
    - **valid**: Se o token é válido (sempre True se não lançar erro)
    - **user**: Dados básicos do usuário
    
    ### Erros:
    - **401**: Token inválido ou expirado
    - **403**: Usuário inativo
    """
    return VerifyTokenResponse(
        valid=True,
        user={
            "id": str(current_user.id),
            "username": current_user.username,
            "nome_completo": current_user.nome_completo,
            "perfil": current_user.perfil.value
        }
    )

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    ## 🏥 Health Check
    
    Verifica se o serviço de autenticação está funcionando.
    
    Endpoint público (não requer autenticação).
    
    ### Retorna:
    - **status**: Status do serviço
    - **message**: Mensagem informativa
    """
    return {
        "status": "ok",
        "message": "Serviço de autenticação operacional"
    }

