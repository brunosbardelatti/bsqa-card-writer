"""
Schemas Pydantic para autenticação
"""
from pydantic import BaseModel, Field
from typing import Optional

class LoginRequest(BaseModel):
    """
    Schema para requisição de login
    """
    username: str = Field(..., min_length=3, max_length=50, description="Username do usuário")
    senha: str = Field(..., min_length=1, max_length=100, description="Senha do usuário")
    
    class Config:
        schema_extra = {
            "example": {
                "username": "admin",
                "senha": "Admin@123456"
            }
        }

class TokenResponse(BaseModel):
    """
    Schema para resposta de login (token JWT)
    """
    access_token: str = Field(..., description="Token JWT de acesso")
    token_type: str = Field(default="bearer", description="Tipo do token")
    expires_in: int = Field(..., description="Tempo de expiração em segundos")
    user: dict = Field(..., description="Dados básicos do usuário")
    
    class Config:
        schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 1800,
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "username": "admin",
                    "nome_completo": "Administrador",
                    "email": "admin@bsqa.com",
                    "perfil": "admin"
                }
            }
        }

class TokenData(BaseModel):
    """
    Schema para dados decodificados do token JWT
    """
    user_id: str = Field(..., description="ID do usuário")
    username: str = Field(..., description="Username do usuário")
    perfil: str = Field(..., description="Perfil do usuário (admin/user)")
    exp: Optional[int] = Field(None, description="Timestamp de expiração")

class VerifyTokenResponse(BaseModel):
    """
    Schema para resposta de verificação de token
    """
    valid: bool = Field(..., description="Se o token é válido")
    user: Optional[dict] = Field(None, description="Dados do usuário se válido")
    
    class Config:
        schema_extra = {
            "example": {
                "valid": True,
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "username": "admin",
                    "perfil": "admin"
                }
            }
        }

class LogoutResponse(BaseModel):
    """
    Schema para resposta de logout
    """
    message: str = Field(default="Logout realizado com sucesso")
    
    class Config:
        schema_extra = {
            "example": {
                "message": "Logout realizado com sucesso"
            }
        }

