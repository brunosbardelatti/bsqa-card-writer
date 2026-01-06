"""
Dependencies do FastAPI para autenticação e autorização
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.utils.security import decode_access_token
from backend.models.user import User, PerfilEnum
from typing import Optional

# Configurar HTTPBearer security (JWT via header Authorization)
security = HTTPBearer()

# ============================================
# DEPENDENCY: OBTER USUÁRIO ATUAL
# ============================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency para obter usuário atual a partir do token JWT
    
    Uso nas rotas:
        @router.get("/protected")
        def protected_route(current_user: User = Depends(get_current_user)):
            return {"user": current_user.username}
    
    Lança:
        HTTPException 401: Token inválido ou expirado
        HTTPException 401: Usuário não encontrado
        HTTPException 403: Usuário inativo
    
    Retorna:
        User: Objeto do usuário autenticado
    """
    # Extrair token do header Authorization
    token = credentials.credentials
    
    # Decodificar token
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extrair user_id do payload
    user_id: str = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: user_id não encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar usuário no banco de dados
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar se usuário está ativo
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo. Entre em contato com o administrador.",
        )
    
    return user

# ============================================
# DEPENDENCY: EXIGIR PERFIL ADMIN
# ============================================

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency para exigir que o usuário seja admin
    
    Uso nas rotas:
        @router.post("/admin-only")
        def admin_only_route(current_user: User = Depends(require_admin)):
            return {"message": "Admin access granted"}
    
    Lança:
        HTTPException 403: Usuário não é admin
    
    Retorna:
        User: Objeto do usuário admin autenticado
    """
    if current_user.perfil != PerfilEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para administradores",
        )
    
    return current_user

# ============================================
# DEPENDENCY: USUÁRIO OPCIONAL
# ============================================

def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dependency para obter usuário atual, mas não falha se não houver token
    Útil para rotas que podem funcionar com ou sem autenticação
    
    Uso nas rotas:
        @router.get("/public-or-authenticated")
        def flexible_route(current_user: Optional[User] = Depends(get_optional_user)):
            if current_user:
                return {"message": f"Olá, {current_user.username}"}
            else:
                return {"message": "Olá, visitante"}
    
    Retorna:
        Optional[User]: Objeto do usuário se autenticado, None caso contrário
    """
    if credentials is None:
        return None
    
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None

# ============================================
# DEPENDENCY: VERIFICAR SE É O PRÓPRIO USUÁRIO OU ADMIN
# ============================================

def require_owner_or_admin(user_id: str):
    """
    Factory para criar dependency que verifica se o usuário é dono do recurso ou admin
    
    Uso nas rotas:
        @router.put("/users/{user_id}")
        def update_user(
            user_id: str,
            current_user: User = Depends(require_owner_or_admin(user_id))
        ):
            return {"message": "Updated"}
    
    Args:
        user_id: ID do usuário dono do recurso
    
    Retorna:
        Callable: Dependency function
    """
    def _check_owner_or_admin(current_user: User = Depends(get_current_user)) -> User:
        # Admin pode acessar qualquer recurso
        if current_user.perfil == PerfilEnum.ADMIN:
            return current_user
        
        # Usuário comum só pode acessar seus próprios recursos
        if str(current_user.id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: você só pode acessar seus próprios recursos",
            )
        
        return current_user
    
    return _check_owner_or_admin

# ============================================
# DEPENDENCY: VERIFICAR PERMISSÃO CUSTOMIZADA
# ============================================

def check_permission(required_permission: str):
    """
    Factory para criar dependency de permissão customizada
    (Para implementação futura de sistema RBAC mais complexo)
    
    Args:
        required_permission: Nome da permissão exigida
    
    Retorna:
        Callable: Dependency function
    """
    def _check_permission(current_user: User = Depends(get_current_user)) -> User:
        # Por enquanto, apenas admin tem todas as permissões
        if current_user.perfil != PerfilEnum.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permissão necessária: {required_permission}",
            )
        return current_user
    
    return _check_permission

