"""
Schemas Pydantic para validação de dados de usuário
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum

class PerfilEnum(str, Enum):
    """
    Enum para perfis de usuário
    """
    ADMIN = "admin"
    USER = "user"

class UserBase(BaseModel):
    """
    Schema base com campos comuns de usuário
    """
    nome_completo: str = Field(..., min_length=3, max_length=200, description="Nome completo do usuário")
    username: str = Field(..., min_length=3, max_length=50, description="Username para login")
    email: EmailStr = Field(..., description="Email válido")
    empresa: str = Field(..., min_length=2, max_length=200, description="Nome da empresa")
    cpf: str = Field(..., min_length=11, max_length=11, description="CPF com 11 dígitos")
    perfil: PerfilEnum = Field(default=PerfilEnum.USER, description="Perfil do usuário")

    @validator('username')
    def username_valido(cls, v):
        """
        Valida formato do username
        """
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Username deve conter apenas letras, números, underscore (_) ou hífen (-)')
        return v.lower()

    @validator('cpf')
    def cpf_valido(cls, v):
        """
        Valida CPF brasileiro
        """
        # Remove caracteres não numéricos
        cpf = ''.join(filter(str.isdigit, v))
        
        if len(cpf) != 11:
            raise ValueError('CPF deve conter exatamente 11 dígitos')
        
        # Verifica se todos os dígitos são iguais (CPF inválido)
        if cpf == cpf[0] * 11:
            raise ValueError('CPF inválido')
        
        # Validação matemática dos dígitos verificadores
        def calcular_digito(cpf_parcial):
            soma = sum((len(cpf_parcial) + 1 - i) * int(d) for i, d in enumerate(cpf_parcial))
            resto = soma % 11
            return '0' if resto < 2 else str(11 - resto)
        
        if calcular_digito(cpf[:9]) != cpf[9] or calcular_digito(cpf[:10]) != cpf[10]:
            raise ValueError('CPF inválido (dígitos verificadores incorretos)')
        
        return cpf

class UserCreate(UserBase):
    """
    Schema para criação de usuário
    Inclui senha que será validada
    """
    senha: str = Field(..., min_length=8, max_length=100, description="Senha forte")

    @validator('senha')
    def senha_forte(cls, v):
        """
        Valida força da senha
        Requisitos:
        - Mínimo 8 caracteres
        - Pelo menos 1 letra maiúscula
        - Pelo menos 1 letra minúscula
        - Pelo menos 1 número
        - Pelo menos 1 caractere especial
        """
        import re
        
        if len(v) < 8:
            raise ValueError('Senha deve ter no mínimo 8 caracteres')
        
        if not re.search(r'[A-Z]', v):
            raise ValueError('Senha deve conter pelo menos uma letra maiúscula')
        
        if not re.search(r'[a-z]', v):
            raise ValueError('Senha deve conter pelo menos uma letra minúscula')
        
        if not re.search(r'\d', v):
            raise ValueError('Senha deve conter pelo menos um número')
        
        if not re.search(r'[@$!%*?&#]', v):
            raise ValueError('Senha deve conter pelo menos um caractere especial (@$!%*?&#)')
        
        return v

class UserUpdate(BaseModel):
    """
    Schema para atualização de usuário
    Todos os campos são opcionais
    """
    nome_completo: Optional[str] = Field(None, min_length=3, max_length=200)
    email: Optional[EmailStr] = None
    empresa: Optional[str] = Field(None, min_length=2, max_length=200)
    perfil: Optional[PerfilEnum] = None
    ativo: Optional[bool] = None

class UserChangePassword(BaseModel):
    """
    Schema para alteração de senha
    """
    senha_atual: str = Field(..., min_length=1, description="Senha atual do usuário")
    senha_nova: str = Field(..., min_length=8, max_length=100, description="Nova senha")

    @validator('senha_nova')
    def senha_forte(cls, v):
        """
        Valida força da nova senha
        """
        import re
        
        if len(v) < 8:
            raise ValueError('Senha deve ter no mínimo 8 caracteres')
        
        if not re.search(r'[A-Z]', v):
            raise ValueError('Senha deve conter pelo menos uma letra maiúscula')
        
        if not re.search(r'[a-z]', v):
            raise ValueError('Senha deve conter pelo menos uma letra minúscula')
        
        if not re.search(r'\d', v):
            raise ValueError('Senha deve conter pelo menos um número')
        
        if not re.search(r'[@$!%*?&#]', v):
            raise ValueError('Senha deve conter pelo menos um caractere especial (@$!%*?&#)')
        
        return v

class UserResponse(BaseModel):
    """
    Schema para resposta com dados do usuário
    Nunca inclui senha_hash!
    """
    id: str
    nome_completo: str
    username: str
    email: str
    empresa: str
    cpf: str
    perfil: PerfilEnum
    ativo: bool
    data_criacao: datetime
    data_atualizacao: datetime
    ultimo_login: Optional[datetime]

    class Config:
        orm_mode = True  # Permite criar a partir de modelos SQLAlchemy

class UserBasicInfo(BaseModel):
    """
    Schema para informações básicas do usuário
    Usado em respostas de autenticação
    """
    id: str
    username: str
    nome_completo: str
    email: str
    perfil: PerfilEnum
    
    class Config:
        orm_mode = True

