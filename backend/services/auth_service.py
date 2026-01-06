"""
Serviço de Autenticação
Contém a lógica de negócio para login, logout e validação de credenciais
"""
from sqlalchemy.orm import Session
from backend.models.user import User
from backend.schemas.auth_schema import LoginRequest, TokenResponse
from backend.utils.security import verify_password, create_access_token
from datetime import datetime, timedelta
from fastapi import HTTPException, status
import os

# Tempo de expiração do token (em minutos)
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

class AuthService:
    """
    Serviço de autenticação
    """
    
    @staticmethod
    def login(db: Session, login_data: LoginRequest) -> TokenResponse:
        """
        Realiza login do usuário
        
        Args:
            db: Sessão do banco de dados
            login_data: Dados de login (username, senha)
        
        Returns:
            TokenResponse: Token JWT e dados do usuário
        
        Raises:
            HTTPException 401: Credenciais inválidas
            HTTPException 403: Usuário inativo
        
        Exemplo:
            >>> login_data = LoginRequest(username="admin", senha="Admin@123")
            >>> response = AuthService.login(db, login_data)
            >>> print(response.access_token)
        """
        # Buscar usuário por username (case-insensitive)
        user = db.query(User).filter(
            User.username == login_data.username.lower()
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário ou senha incorretos",
            )
        
        # Verificar senha
        if not verify_password(login_data.senha, user.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário ou senha incorretos",
            )
        
        # Verificar se usuário está ativo
        if not user.ativo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuário inativo. Entre em contato com o administrador.",
            )
        
        # Atualizar último login
        user.ultimo_login = datetime.utcnow()
        db.commit()
        
        # Criar token JWT
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "user_id": str(user.id),
                "username": user.username,
                "perfil": user.perfil.value
            },
            expires_delta=access_token_expires
        )
        
        # Retornar resposta com token e dados do usuário
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # em segundos
            user={
                "id": str(user.id),
                "username": user.username,
                "nome_completo": user.nome_completo,
                "email": user.email,
                "perfil": user.perfil.value,
            }
        )
    
    @staticmethod
    def logout(db: Session, user: User):
        """
        Logout do usuário
        
        Nota: Por padrão, o logout é feito no frontend removendo o token.
        Se estiver usando a tabela de sessões para controle adicional,
        implemente a revogação do token aqui.
        
        Args:
            db: Sessão do banco de dados
            user: Usuário que está fazendo logout
        
        Exemplo:
            >>> AuthService.logout(db, current_user)
        """
        # Implementação básica: logout é feito no frontend
        # Se desejar implementar revogação de token:
        # 1. Buscar sessão ativa do usuário
        # 2. Marcar como revogada
        # 3. Adicionar token a uma blacklist
        pass
    
    @staticmethod
    def verify_credentials(db: Session, username: str, senha: str) -> bool:
        """
        Verifica se as credenciais são válidas
        
        Args:
            db: Sessão do banco de dados
            username: Username do usuário
            senha: Senha em texto plano
        
        Returns:
            bool: True se credenciais válidas, False caso contrário
        
        Exemplo:
            >>> is_valid = AuthService.verify_credentials(db, "admin", "Admin@123")
            >>> print(is_valid)  # True
        """
        user = db.query(User).filter(
            User.username == username.lower()
        ).first()
        
        if not user:
            return False
        
        return verify_password(senha, user.senha_hash)
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> User:
        """
        Busca usuário por username
        
        Args:
            db: Sessão do banco de dados
            username: Username do usuário
        
        Returns:
            User: Objeto do usuário
        
        Raises:
            HTTPException 404: Usuário não encontrado
        
        Exemplo:
            >>> user = AuthService.get_user_by_username(db, "admin")
            >>> print(user.nome_completo)
        """
        user = db.query(User).filter(
            User.username == username.lower()
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )
        
        return user

