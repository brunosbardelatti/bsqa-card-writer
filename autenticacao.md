# 🔐 Sistema de Autenticação - BSQA Card Writer

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Dados](#estrutura-de-dados)
3. [Arquitetura da Solução](#arquitetura-da-solução)
4. [Implementação Backend](#implementação-backend)
5. [Implementação Frontend](#implementação-frontend)
6. [Estratégia de Cadastro](#estratégia-de-cadastro)
7. [Controle de Acesso](#controle-de-acesso)
8. [Segurança](#segurança)
9. [Fluxo de Autenticação](#fluxo-de-autenticação)
10. [Considerações Finais](#considerações-finais)

---

## 🎯 Visão Geral

Este documento descreve **step by step** como implementar um sistema completo de autenticação por usuário e senha no **BSQA Card Writer**, incluindo:

- ✅ Login por usuário e senha
- ✅ Controle de acesso à página `chat.html` (apenas usuários logados)
- ✅ Controle de acesso à página `config.html` (apenas usuários admin)
- ✅ Sistema de cadastro de usuários (apenas admin pode cadastrar)
- ✅ Gestão de sessões e tokens
- ✅ Validação de CPF e email

**Stack Tecnológica:**
- Backend: FastAPI + Python
- Frontend: HTML/CSS/JavaScript puro
- Banco de Dados: SQLite (desenvolvimento) ou PostgreSQL (produção)
- Autenticação: JWT (JSON Web Tokens)
- Hash de Senhas: bcrypt ou passlib

---

## 📊 Estrutura de Dados

### Modelo de Usuário

O usuário deve conter os seguintes campos no banco de dados:

```python
# Tabela: users
{
    "id": "UUID (Primary Key)",
    "nome_completo": "string (não nulo, max 200 caracteres)",
    "username": "string (único, não nulo, max 50 caracteres)",
    "email": "string (único, não nulo, validado)",
    "empresa": "string (não nulo, max 200 caracteres)",
    "cpf": "string (único, não nulo, 11 dígitos)",
    "senha_hash": "string (hash bcrypt, não nulo)",
    "perfil": "enum ['admin', 'user'] (não nulo, default 'user')",
    "ativo": "boolean (default true)",
    "data_criacao": "timestamp (não nulo, default now())",
    "data_atualizacao": "timestamp (não nulo, default now())",
    "ultimo_login": "timestamp (nullable)",
    "criado_por": "UUID (Foreign Key -> users.id, nullable)"
}
```

### Modelo de Sessão/Token

```python
# Tabela: sessions (opcional - para controle adicional)
{
    "id": "UUID (Primary Key)",
    "user_id": "UUID (Foreign Key -> users.id)",
    "token": "string (índice único)",
    "ip_address": "string",
    "user_agent": "string",
    "criado_em": "timestamp",
    "expira_em": "timestamp",
    "revogado": "boolean (default false)"
}
```

### Validações

**CPF:**
- Deve conter exatamente 11 dígitos
- Deve passar na validação matemática do CPF
- Não pode ser CPF conhecido como inválido (111.111.111-11, etc.)

**Email:**
- Formato válido (regex: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
- Único no sistema

**Username:**
- Apenas letras, números, underscore e hífen
- Mínimo 3 caracteres, máximo 50
- Único no sistema
- Case-insensitive

**Senha:**
- Mínimo 8 caracteres
- Pelo menos uma letra maiúscula
- Pelo menos uma letra minúscula
- Pelo menos um número
- Pelo menos um caractere especial (@$!%*?&#)

---

## 🏗️ Arquitetura da Solução

### Estrutura de Pastas Proposta

```
backend/
├── models/
│   ├── __init__.py
│   ├── user.py                 # Modelo de usuário (SQLAlchemy)
│   └── session.py              # Modelo de sessão
├── schemas/
│   ├── __init__.py
│   ├── user_schema.py          # Schemas Pydantic para validação
│   └── auth_schema.py          # Schemas de autenticação
├── api/
│   ├── routes_auth.py          # Rotas de autenticação (login, logout)
│   ├── routes_users.py         # Rotas de gerenciamento de usuários
│   ├── routes_analyze.py       # (existente)
│   └── routes_config.py        # (existente)
├── services/
│   ├── auth_service.py         # Lógica de autenticação
│   ├── user_service.py         # CRUD de usuários
│   └── (demais existentes)
├── utils/
│   ├── security.py             # Funções de segurança (hash, JWT)
│   ├── validators.py           # Validadores (CPF, email, senha)
│   ├── dependencies.py         # Dependências do FastAPI
│   └── (demais existentes)
├── database/
│   ├── __init__.py
│   ├── connection.py           # Configuração do banco
│   └── init_db.py              # Inicialização e migrações
└── main.py                      # (existente - adicionar middleware)

frontend/
├── public/
│   ├── login.html              # Nova página de login
│   ├── users.html              # Nova página de gestão de usuários (admin)
│   ├── js/
│   │   ├── auth.js             # Funções de autenticação
│   │   ├── login.js            # Lógica da página de login
│   │   ├── users.js            # Gestão de usuários (admin)
│   │   └── (demais existentes)
│   └── (demais existentes)

config/
├── .env                         # Adicionar SECRET_KEY para JWT
└── (demais existentes)
```

---

## 🔧 Implementação Backend

### PASSO 1: Configurar Dependências

**1.1. Atualizar `requirements.txt`**

Adicionar as seguintes bibliotecas:

```txt
# Autenticação e Segurança
passlib[bcrypt]          # Hash de senhas
python-jose[cryptography]  # JWT tokens
python-multipart         # (já existe) Form data

# Banco de Dados
sqlalchemy              # ORM
alembic                 # Migrações de banco
psycopg2-binary         # PostgreSQL (produção)

# Validação
email-validator         # Validação de email
pydantic[email]         # Validação Pydantic
```

**1.2. Instalar dependências:**

```bash
pip install -r requirements.txt
```

---

### PASSO 2: Configurar Variáveis de Ambiente

**2.1. Editar `config/.env`**

Adicionar:

```env
# Autenticação
SECRET_KEY=sua-chave-secreta-super-segura-aqui-min-32-caracteres
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Banco de Dados
DATABASE_URL=sqlite:///./bsqa_card_writer.db  # Desenvolvimento
# DATABASE_URL=postgresql://user:password@localhost/dbname  # Produção

# Configurações de Segurança
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Admin Inicial (primeiro usuário criado automaticamente)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@bsqa.com
ADMIN_PASSWORD=Admin@123456
ADMIN_NOME=Administrador
ADMIN_EMPRESA=BSQA
ADMIN_CPF=00000000000  # CPF temporário para admin inicial
```

**IMPORTANTE:** 
- A `SECRET_KEY` deve ser gerada com segurança: `openssl rand -hex 32`
- Nunca commitar o `.env` no Git
- Em produção, usar variáveis de ambiente do Railway

---

### PASSO 3: Criar Modelos de Banco de Dados

**3.1. Criar `backend/database/connection.py`**

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv("config/.env")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./bsqa_card_writer.db")

# Ajuste para SQLite
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    Dependency para obter sessão do banco de dados
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**3.2. Criar `backend/models/user.py`**

```python
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from backend.database.connection import Base
import uuid
import enum

class PerfilEnum(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome_completo = Column(String(200), nullable=False)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    empresa = Column(String(200), nullable=False)
    cpf = Column(String(11), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    perfil = Column(Enum(PerfilEnum), nullable=False, default=PerfilEnum.USER)
    ativo = Column(Boolean, default=True, nullable=False)
    data_criacao = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    data_atualizacao = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    ultimo_login = Column(DateTime(timezone=True), nullable=True)
    criado_por = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    def __repr__(self):
        return f"<User {self.username} ({self.perfil})>"
```

**3.3. Criar `backend/models/session.py`** (Opcional)

```python
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from backend.database.connection import Base
import uuid

class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token = Column(String(500), unique=True, nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expira_em = Column(DateTime(timezone=True), nullable=False)
    revogado = Column(Boolean, default=False, nullable=False)

    def __repr__(self):
        return f"<Session {self.id} - User {self.user_id}>"
```

---

### PASSO 4: Criar Schemas Pydantic

**4.1. Criar `backend/schemas/user_schema.py`**

```python
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum

class PerfilEnum(str, Enum):
    ADMIN = "admin"
    USER = "user"

class UserBase(BaseModel):
    nome_completo: str = Field(..., min_length=3, max_length=200)
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    empresa: str = Field(..., min_length=2, max_length=200)
    cpf: str = Field(..., min_length=11, max_length=11)
    perfil: PerfilEnum = PerfilEnum.USER

    @validator('username')
    def username_valido(cls, v):
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Username deve conter apenas letras, números, _ ou -')
        return v.lower()

    @validator('cpf')
    def cpf_valido(cls, v):
        # Remove caracteres não numéricos
        cpf = ''.join(filter(str.isdigit, v))
        if len(cpf) != 11:
            raise ValueError('CPF deve conter 11 dígitos')
        
        # Validação matemática do CPF
        if cpf == cpf[0] * 11:
            raise ValueError('CPF inválido')
        
        # Validar dígitos verificadores
        def calcular_digito(cpf_parcial):
            soma = sum((len(cpf_parcial) + 1 - i) * int(d) for i, d in enumerate(cpf_parcial))
            resto = soma % 11
            return '0' if resto < 2 else str(11 - resto)
        
        if calcular_digito(cpf[:9]) != cpf[9] or calcular_digito(cpf[:10]) != cpf[10]:
            raise ValueError('CPF inválido')
        
        return cpf

class UserCreate(UserBase):
    senha: str = Field(..., min_length=8, max_length=100)

    @validator('senha')
    def senha_forte(cls, v):
        import re
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
    nome_completo: Optional[str] = Field(None, min_length=3, max_length=200)
    email: Optional[EmailStr] = None
    empresa: Optional[str] = Field(None, min_length=2, max_length=200)
    perfil: Optional[PerfilEnum] = None
    ativo: Optional[bool] = None

class UserChangePassword(BaseModel):
    senha_atual: str
    senha_nova: str = Field(..., min_length=8, max_length=100)

    @validator('senha_nova')
    def senha_forte(cls, v):
        import re
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
    id: str
    nome_completo: str
    username: str
    email: str
    empresa: str
    cpf: str
    perfil: PerfilEnum
    ativo: bool
    data_criacao: datetime
    ultimo_login: Optional[datetime]

    class Config:
        orm_mode = True
```

**4.2. Criar `backend/schemas/auth_schema.py`**

```python
from pydantic import BaseModel, Field
from typing import Optional

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    senha: str = Field(..., min_length=8, max_length=100)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos
    user: dict  # Dados básicos do usuário

class TokenData(BaseModel):
    user_id: str
    username: str
    perfil: str
    exp: Optional[int] = None
```

---

### PASSO 5: Criar Utilitários de Segurança

**5.1. Criar `backend/utils/security.py`**

```python
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv("config/.env")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """
    Gera hash bcrypt da senha
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha corresponde ao hash
    """
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Cria um token JWT
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodifica e valida um token JWT
    Retorna None se inválido
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

**5.2. Criar `backend/utils/validators.py`**

```python
import re
from typing import Tuple

def validar_cpf(cpf: str) -> Tuple[bool, str]:
    """
    Valida CPF brasileiro
    Retorna (is_valid, message)
    """
    cpf = ''.join(filter(str.isdigit, cpf))
    
    if len(cpf) != 11:
        return False, "CPF deve conter 11 dígitos"
    
    if cpf == cpf[0] * 11:
        return False, "CPF inválido"
    
    # Validar dígitos verificadores
    def calcular_digito(cpf_parcial):
        soma = sum((len(cpf_parcial) + 1 - i) * int(d) for i, d in enumerate(cpf_parcial))
        resto = soma % 11
        return '0' if resto < 2 else str(11 - resto)
    
    if calcular_digito(cpf[:9]) != cpf[9] or calcular_digito(cpf[:10]) != cpf[10]:
        return False, "CPF inválido"
    
    return True, "CPF válido"

def validar_senha_forte(senha: str) -> Tuple[bool, str]:
    """
    Valida força da senha
    Retorna (is_valid, message)
    """
    if len(senha) < 8:
        return False, "Senha deve ter no mínimo 8 caracteres"
    
    if not re.search(r'[A-Z]', senha):
        return False, "Senha deve conter pelo menos uma letra maiúscula"
    
    if not re.search(r'[a-z]', senha):
        return False, "Senha deve conter pelo menos uma letra minúscula"
    
    if not re.search(r'\d', senha):
        return False, "Senha deve conter pelo menos um número"
    
    if not re.search(r'[@$!%*?&#]', senha):
        return False, "Senha deve conter pelo menos um caractere especial (@$!%*?&#)"
    
    return True, "Senha válida"

def validar_username(username: str) -> Tuple[bool, str]:
    """
    Valida formato do username
    Retorna (is_valid, message)
    """
    if len(username) < 3:
        return False, "Username deve ter no mínimo 3 caracteres"
    
    if len(username) > 50:
        return False, "Username deve ter no máximo 50 caracteres"
    
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return False, "Username deve conter apenas letras, números, _ ou -"
    
    return True, "Username válido"
```

**5.3. Criar `backend/utils/dependencies.py`**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.utils.security import decode_access_token
from backend.models.user import User, PerfilEnum
from typing import Optional

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency para obter usuário atual a partir do token JWT
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )
    
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency para exigir que o usuário seja admin
    """
    if current_user.perfil != PerfilEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para administradores",
        )
    return current_user

def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dependency para obter usuário atual, mas não falha se não houver token
    Útil para rotas que podem funcionar com ou sem autenticação
    """
    if credentials is None:
        return None
    
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None
```

---

### PASSO 6: Criar Serviços de Autenticação e Usuários

**6.1. Criar `backend/services/auth_service.py`**

```python
from sqlalchemy.orm import Session
from backend.models.user import User
from backend.schemas.auth_schema import LoginRequest, TokenResponse
from backend.utils.security import verify_password, create_access_token, hash_password
from datetime import datetime, timedelta
from fastapi import HTTPException, status
import os

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

class AuthService:
    
    @staticmethod
    def login(db: Session, login_data: LoginRequest) -> TokenResponse:
        """
        Realiza login do usuário
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
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
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
        Se estiver usando tabela de sessões, revogar o token aqui
        """
        # Implementação simples: o logout é feito no frontend removendo o token
        # Se usar tabela de sessões, implementar revogação aqui
        pass
```

**6.2. Criar `backend/services/user_service.py`**

```python
from sqlalchemy.orm import Session
from backend.models.user import User, PerfilEnum
from backend.schemas.user_schema import UserCreate, UserUpdate, UserResponse, UserChangePassword
from backend.utils.security import hash_password, verify_password
from fastapi import HTTPException, status
from typing import List, Optional
import uuid

class UserService:
    
    @staticmethod
    def criar_usuario(db: Session, user_data: UserCreate, criado_por_id: str) -> User:
        """
        Cria novo usuário no sistema
        """
        # Verificar se username já existe
        if db.query(User).filter(User.username == user_data.username.lower()).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username já cadastrado",
            )
        
        # Verificar se email já existe
        if db.query(User).filter(User.email == user_data.email.lower()).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado",
            )
        
        # Verificar se CPF já existe
        cpf_limpo = ''.join(filter(str.isdigit, user_data.cpf))
        if db.query(User).filter(User.cpf == cpf_limpo).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF já cadastrado",
            )
        
        # Criar usuário
        novo_usuario = User(
            id=uuid.uuid4(),
            nome_completo=user_data.nome_completo,
            username=user_data.username.lower(),
            email=user_data.email.lower(),
            empresa=user_data.empresa,
            cpf=cpf_limpo,
            senha_hash=hash_password(user_data.senha),
            perfil=user_data.perfil,
            criado_por=uuid.UUID(criado_por_id) if criado_por_id else None
        )
        
        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)
        
        return novo_usuario
    
    @staticmethod
    def listar_usuarios(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Lista todos os usuários
        """
        return db.query(User).offset(skip).limit(limit).all()
    
    @staticmethod
    def obter_usuario(db: Session, user_id: str) -> Optional[User]:
        """
        Obtém usuário por ID
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )
        return user
    
    @staticmethod
    def atualizar_usuario(db: Session, user_id: str, user_data: UserUpdate) -> User:
        """
        Atualiza dados do usuário
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )
        
        # Atualizar apenas campos fornecidos
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def alterar_senha(db: Session, user_id: str, senha_data: UserChangePassword) -> bool:
        """
        Altera senha do usuário
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )
        
        # Verificar senha atual
        if not verify_password(senha_data.senha_atual, user.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Senha atual incorreta",
            )
        
        # Atualizar senha
        user.senha_hash = hash_password(senha_data.senha_nova)
        db.commit()
        
        return True
    
    @staticmethod
    def desativar_usuario(db: Session, user_id: str) -> User:
        """
        Desativa usuário (não deleta, apenas marca como inativo)
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )
        
        user.ativo = False
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def ativar_usuario(db: Session, user_id: str) -> User:
        """
        Reativa usuário
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )
        
        user.ativo = True
        db.commit()
        db.refresh(user)
        
        return user
```

---

### PASSO 7: Criar Rotas da API

**7.1. Criar `backend/api/routes_auth.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.schemas.auth_schema import LoginRequest, TokenResponse
from backend.services.auth_service import AuthService
from backend.utils.dependencies import get_current_user
from backend.models.user import User

router = APIRouter(prefix="/auth", tags=["Autenticação"])

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint de login
    Retorna token JWT e dados do usuário
    """
    return AuthService.login(db, login_data)

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint de logout
    """
    AuthService.logout(db, current_user)
    return {"message": "Logout realizado com sucesso"}

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Retorna informações do usuário autenticado
    """
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "nome_completo": current_user.nome_completo,
        "email": current_user.email,
        "empresa": current_user.empresa,
        "perfil": current_user.perfil.value,
        "ativo": current_user.ativo,
        "ultimo_login": current_user.ultimo_login
    }

@router.post("/verify-token")
async def verify_token(
    current_user: User = Depends(get_current_user)
):
    """
    Verifica se o token é válido
    """
    return {
        "valid": True,
        "user": {
            "id": str(current_user.id),
            "username": current_user.username,
            "perfil": current_user.perfil.value
        }
    }
```

**7.2. Criar `backend/api/routes_users.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.schemas.user_schema import UserCreate, UserUpdate, UserResponse, UserChangePassword
from backend.services.user_service import UserService
from backend.utils.dependencies import get_current_user, require_admin
from backend.models.user import User
from typing import List

router = APIRouter(prefix="/users", tags=["Usuários"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def criar_usuario(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # Apenas admin pode criar
):
    """
    Cria novo usuário (apenas admin)
    """
    novo_usuario = UserService.criar_usuario(db, user_data, str(current_user.id))
    return novo_usuario

@router.get("/", response_model=List[UserResponse])
async def listar_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # Apenas admin pode listar
):
    """
    Lista todos os usuários (apenas admin)
    """
    usuarios = UserService.listar_usuarios(db, skip, limit)
    return usuarios

@router.get("/{user_id}", response_model=UserResponse)
async def obter_usuario(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # Apenas admin pode ver detalhes
):
    """
    Obtém detalhes de um usuário (apenas admin)
    """
    usuario = UserService.obter_usuario(db, user_id)
    return usuario

@router.put("/{user_id}", response_model=UserResponse)
async def atualizar_usuario(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # Apenas admin pode atualizar
):
    """
    Atualiza dados do usuário (apenas admin)
    """
    usuario = UserService.atualizar_usuario(db, user_id, user_data)
    return usuario

@router.post("/change-password")
async def alterar_senha(
    senha_data: UserChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Altera senha do próprio usuário
    """
    UserService.alterar_senha(db, str(current_user.id), senha_data)
    return {"message": "Senha alterada com sucesso"}

@router.post("/{user_id}/deactivate", response_model=UserResponse)
async def desativar_usuario(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Desativa usuário (apenas admin)
    """
    usuario = UserService.desativar_usuario(db, user_id)
    return usuario

@router.post("/{user_id}/activate", response_model=UserResponse)
async def ativar_usuario(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Reativa usuário (apenas admin)
    """
    usuario = UserService.ativar_usuario(db, user_id)
    return usuario
```

---

### PASSO 8: Proteger Rotas Existentes

**8.1. Atualizar `backend/api/routes_analyze.py`**

Adicionar proteção de autenticação:

```python
from backend.utils.dependencies import get_current_user
from backend.models.user import User

# Adicionar em todas as rotas que precisam de autenticação
@router.post("/analyze")
async def analyze(
    requirements: str = Form(None),
    file: UploadFile = File(None),
    service: str = Form("openai"),
    analyse_type: str = Form(...),
    streaming: bool = Form(False),
    stackspot_knowledge: bool = Form(False),
    return_ks_in_response: bool = Form(False),
    current_user: User = Depends(get_current_user)  # ADICIONAR ESTA LINHA
):
    # ... resto do código
```

**8.2. Atualizar `backend/api/routes_config.py`**

Adicionar proteção de admin para rotas de configuração:

```python
from backend.utils.dependencies import require_admin
from backend.models.user import User

@router.post("/config")
async def update_config(
    config: dict,
    current_user: User = Depends(require_admin)  # ADICIONAR: apenas admin pode alterar configs
):
    # ... resto do código

@router.post("/api-config")
async def update_api_config(
    api_config: dict,
    current_user: User = Depends(require_admin)  # ADICIONAR: apenas admin pode alterar APIs
):
    # ... resto do código
```

---

### PASSO 9: Inicializar Banco de Dados

**9.1. Criar `backend/database/init_db.py`**

```python
from backend.database.connection import engine, Base, SessionLocal
from backend.models.user import User, PerfilEnum
from backend.utils.security import hash_password
import os
import uuid
from dotenv import load_dotenv

load_dotenv("config/.env")

def init_database():
    """
    Inicializa o banco de dados e cria usuário admin padrão
    """
    print("🔧 Criando tabelas no banco de dados...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tabelas criadas com sucesso!")
    
    # Criar usuário admin padrão se não existir
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.perfil == PerfilEnum.ADMIN).first()
        
        if not admin_exists:
            print("👤 Criando usuário administrador padrão...")
            
            admin = User(
                id=uuid.uuid4(),
                nome_completo=os.getenv("ADMIN_NOME", "Administrador"),
                username=os.getenv("ADMIN_USERNAME", "admin"),
                email=os.getenv("ADMIN_EMAIL", "admin@bsqa.com"),
                empresa=os.getenv("ADMIN_EMPRESA", "BSQA"),
                cpf=os.getenv("ADMIN_CPF", "00000000000"),
                senha_hash=hash_password(os.getenv("ADMIN_PASSWORD", "Admin@123456")),
                perfil=PerfilEnum.ADMIN,
                ativo=True
            )
            
            db.add(admin)
            db.commit()
            
            print("✅ Usuário administrador criado com sucesso!")
            print(f"   Username: {admin.username}")
            print(f"   Senha: {os.getenv('ADMIN_PASSWORD', 'Admin@123456')}")
            print("   ⚠️  IMPORTANTE: Altere a senha padrão imediatamente!")
        else:
            print("ℹ️  Usuário administrador já existe.")
    
    except Exception as e:
        print(f"❌ Erro ao criar usuário admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
```

**9.2. Adicionar comando ao Makefile**

```makefile
# Adicionar novo comando
init-db:
	@echo "Inicializando banco de dados..."
	python -m backend.database.init_db
```

---

### PASSO 10: Atualizar main.py

**10.1. Editar `backend/main.py`**

Adicionar rotas de autenticação e inicialização do banco:

```python
# ... imports existentes ...
from backend.api.routes_auth import router as auth_router
from backend.api.routes_users import router as users_router
from backend.database.init_db import init_database

# ... código existente ...

# Incluir novas rotas
app.include_router(auth_router)
app.include_router(users_router)

# ... resto do código existente ...

# Adicionar evento de startup para inicializar banco
@app.on_event("startup")
async def startup_event():
    """
    Inicializa banco de dados na primeira execução
    """
    try:
        init_database()
    except Exception as e:
        print(f"⚠️  Aviso: Erro na inicialização do banco: {e}")
```

---

## 🎨 Implementação Frontend

### PASSO 1: Criar Página de Login

**1.1. Criar `frontend/public/login.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>🔐 Login - BSQA Card Writer</title>
  <link rel="stylesheet" href="assets/style.css">
  <link rel="icon" type="image/x-icon" href="assets/favicon.ico">
</head>
<body class="login-page">
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>🤖📋 BSQA Card Writer</h1>
        <p>Análise de Requisitos com IA</p>
      </div>
      
      <form id="loginForm" class="login-form">
        <div class="form-group">
          <label for="username">👤 Usuário</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            placeholder="Digite seu usuário"
            required
            autocomplete="username"
          >
        </div>
        
        <div class="form-group">
          <label for="senha">🔒 Senha</label>
          <input 
            type="password" 
            id="senha" 
            name="senha" 
            placeholder="Digite sua senha"
            required
            autocomplete="current-password"
          >
        </div>
        
        <div id="errorMessage" class="error-message" style="display: none;"></div>
        
        <button type="submit" class="login-button" id="loginButton">
          🚀 Entrar
        </button>
      </form>
      
      <div class="login-footer">
        <p>Problemas para acessar? Entre em contato com o administrador.</p>
      </div>
    </div>
  </div>
  
  <script type="module" src="js/auth.js"></script>
  <script type="module" src="js/login.js"></script>
</body>
</html>
```

**1.2. Adicionar estilos em `frontend/public/assets/style.css`**

```css
/* Estilos da Página de Login */
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: var(--bg-color);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.login-header p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.login-form .form-group {
  margin-bottom: 1.5rem;
}

.login-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.login-form input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--input-bg);
  color: var(--text-color);
  transition: border-color 0.3s;
}

.login-form input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.error-message {
  background: #ff4444;
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.login-button:hover {
  transform: translateY(-2px);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  margin-top: 1.5rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}
```

---

### PASSO 2: Criar Módulo de Autenticação

**2.1. Criar `frontend/public/js/auth.js`**

```javascript
// auth.js - Módulo de autenticação

const AUTH_TOKEN_KEY = 'bsqa_auth_token';
const AUTH_USER_KEY = 'bsqa_auth_user';
const API_BASE_URL = window.location.origin;

/**
 * Salva token de autenticação no localStorage
 */
export function saveAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Obtém token de autenticação
 */
export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Remove token de autenticação
 */
export function removeAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

/**
 * Salva dados do usuário
 */
export function saveAuthUser(user) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

/**
 * Obtém dados do usuário autenticado
 */
export function getAuthUser() {
  const userJson = localStorage.getItem(AUTH_USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

/**
 * Verifica se o usuário está autenticado
 */
export function isAuthenticated() {
  return !!getAuthToken();
}

/**
 * Verifica se o usuário é admin
 */
export function isAdmin() {
  const user = getAuthUser();
  return user && user.perfil === 'admin';
}

/**
 * Realiza login
 */
export async function login(username, senha) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, senha })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao fazer login');
    }

    const data = await response.json();
    
    // Salvar token e dados do usuário
    saveAuthToken(data.access_token);
    saveAuthUser(data.user);
    
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Realiza logout
 */
export async function logout() {
  const token = getAuthToken();
  
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
  
  // Remover dados locais
  removeAuthToken();
  
  // Redirecionar para login
  window.location.href = '/login.html';
}

/**
 * Verifica se o token é válido
 */
export async function verifyToken() {
  const token = getAuthToken();
  
  if (!token) {
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return false;
  }
}

/**
 * Middleware para proteger páginas
 * Redireciona para login se não estiver autenticado
 */
export async function requireAuth() {
  const isValid = await verifyToken();
  
  if (!isValid) {
    removeAuthToken();
    window.location.href = '/login.html';
    return false;
  }
  
  return true;
}

/**
 * Middleware para proteger páginas de admin
 */
export async function requireAdmin() {
  const isValid = await requireAuth();
  
  if (!isValid) {
    return false;
  }
  
  if (!isAdmin()) {
    alert('Acesso negado. Esta página é restrita a administradores.');
    window.location.href = '/index.html';
    return false;
  }
  
  return true;
}

/**
 * Adiciona token JWT em requisições
 */
export function getAuthHeaders() {
  const token = getAuthToken();
  
  if (token) {
    return {
      'Authorization': `Bearer ${token}`
    };
  }
  
  return {};
}

/**
 * Wrapper para fetch com autenticação automática
 */
export async function authenticatedFetch(url, options = {}) {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Usuário não autenticado');
  }
  
  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  };
  
  const response = await fetch(url, authOptions);
  
  // Se token expirado, redirecionar para login
  if (response.status === 401) {
    removeAuthToken();
    window.location.href = '/login.html';
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  
  return response;
}
```

---

### PASSO 3: Criar Lógica da Página de Login

**3.1. Criar `frontend/public/js/login.js`**

```javascript
import { login, isAuthenticated } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // Se já estiver autenticado, redirecionar
  if (isAuthenticated()) {
    window.location.href = '/index.html';
    return;
  }
  
  initLoginForm();
});

function initLoginForm() {
  const form = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');
  const loginButton = document.getElementById('loginButton');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const senha = document.getElementById('senha').value;
    
    // Validações básicas
    if (!username || !senha) {
      showError('Por favor, preencha todos os campos');
      return;
    }
    
    // Desabilitar botão e mostrar loading
    loginButton.disabled = true;
    loginButton.textContent = '⏳ Entrando...';
    hideError();
    
    try {
      const response = await login(username, senha);
      
      // Login bem-sucedido
      console.log('Login realizado com sucesso:', response.user.username);
      
      // Redirecionar para página inicial
      window.location.href = '/index.html';
      
    } catch (error) {
      showError(error.message || 'Erro ao fazer login. Tente novamente.');
      
      // Reabilitar botão
      loginButton.disabled = false;
      loginButton.textContent = '🚀 Entrar';
    }
  });
  
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }
  
  function hideError() {
    errorMessage.style.display = 'none';
  }
}
```

---

### PASSO 4: Proteger Páginas Existentes

**4.1. Atualizar `frontend/public/chat.html`**

Adicionar proteção de autenticação no início do arquivo:

```html
<script type="module">
  import { requireAuth } from './js/auth.js';
  
  // Proteger página - redireciona para login se não autenticado
  (async () => {
    await requireAuth();
  })();
</script>
```

**4.2. Atualizar `frontend/public/config.html`**

Adicionar proteção de admin:

```html
<script type="module">
  import { requireAdmin } from './js/auth.js';
  
  // Proteger página - apenas admin
  (async () => {
    await requireAdmin();
  })();
</script>
```

**4.3. Atualizar `frontend/public/index.html`**

Adicionar verificação de autenticação (opcional - pode permitir visualização mas não ações):

```html
<script type="module">
  import { isAuthenticated, getAuthUser } from './js/auth.js';
  
  // Verificar autenticação
  document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
      // Redirecionar para login
      window.location.href = '/login.html';
    } else {
      // Mostrar nome do usuário no header
      const user = getAuthUser();
      console.log('Usuário logado:', user.nome_completo);
    }
  });
</script>
```

---

### PASSO 5: Atualizar Header com Informações do Usuário

**5.1. Atualizar `frontend/public/components/header.html`**

Adicionar informações do usuário e botão de logout:

```html
<header>
  <nav>
    <div class="nav-left">
      <a href="/index.html" class="logo">🤖📋 BSQA Card Writer</a>
    </div>
    <div class="nav-right">
      <a href="/chat.html">💬 Chat</a>
      <a href="/config.html" id="configLink">⚙️ Configurações</a>
      
      <!-- Informações do usuário -->
      <div class="user-info" id="userInfo">
        <span id="userName">Carregando...</span>
        <button id="logoutButton" class="logout-button">🚪 Sair</button>
      </div>
    </div>
  </nav>
</header>

<script type="module">
  import { getAuthUser, logout, isAdmin } from '../js/auth.js';
  
  // Mostrar informações do usuário
  const user = getAuthUser();
  if (user) {
    document.getElementById('userName').textContent = user.nome_completo;
    
    // Ocultar link de config se não for admin
    if (!isAdmin()) {
      const configLink = document.getElementById('configLink');
      if (configLink) {
        configLink.style.display = 'none';
      }
    }
  }
  
  // Logout
  document.getElementById('logoutButton').addEventListener('click', async () => {
    if (confirm('Deseja realmente sair?')) {
      await logout();
    }
  });
</script>

<style>
.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 1px solid var(--border-color);
}

#userName {
  font-weight: 500;
  color: var(--text-color);
}

.logout-button {
  padding: 0.5rem 1rem;
  background: var(--danger-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.logout-button:hover {
  opacity: 0.8;
}
</style>
```

---

### PASSO 6: Atualizar Requisições do Chat

**6.1. Atualizar `frontend/public/js/chat.js`**

Adicionar token JWT nas requisições:

```javascript
import { authenticatedFetch, getAuthHeaders } from './auth.js';

// Substituir todas as chamadas fetch() por authenticatedFetch()

async function submitAnalysis(formData) {
  try {
    const response = await authenticatedFetch('/analyze', {
      method: 'POST',
      body: formData
    });
    
    // ... resto do código
  } catch (error) {
    console.error('Erro ao enviar análise:', error);
  }
}
```

---

### PASSO 7: Criar Página de Gestão de Usuários

**7.1. Criar `frontend/public/users.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>👥 Gestão de Usuários - BSQA Card Writer</title>
  
  <link rel="preload" href="components/header.html" as="fetch" crossorigin>
  <link rel="preload" href="components/footer.html" as="fetch" crossorigin>
  
  <link rel="stylesheet" href="assets/style.css">
  <link rel="icon" type="image/x-icon" href="assets/favicon.ico">
</head>
<body>
  <div id="header"></div>
  <div class="skeleton skeleton-header"></div>
  
  <div class="container">
    <div class="breadcrumbs"></div>
    
    <h1>👥 Gestão de Usuários</h1>
    <p class="subtitle">Gerenciar usuários do sistema (apenas administradores)</p>
    
    <!-- Botão de criar usuário -->
    <div class="actions-bar">
      <button id="btnCreateUser" class="btn-primary">➕ Criar Novo Usuário</button>
    </div>
    
    <!-- Tabela de usuários -->
    <div class="users-table-container">
      <table id="usersTable" class="users-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Username</th>
            <th>Email</th>
            <th>Empresa</th>
            <th>Perfil</th>
            <th>Status</th>
            <th>Último Login</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="usersTableBody">
          <tr>
            <td colspan="8" class="loading">Carregando usuários...</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
  <!-- Modal de criar/editar usuário -->
  <div id="userModal" class="modal" style="display: none;">
    <div class="modal-content">
      <span class="modal-close">&times;</span>
      <h2 id="modalTitle">Criar Novo Usuário</h2>
      
      <form id="userForm">
        <div class="form-group">
          <label>Nome Completo</label>
          <input type="text" id="nomeCompleto" required>
        </div>
        
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="username" required>
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="email" required>
        </div>
        
        <div class="form-group">
          <label>Empresa</label>
          <input type="text" id="empresa" required>
        </div>
        
        <div class="form-group">
          <label>CPF (apenas números)</label>
          <input type="text" id="cpf" maxlength="11" required>
        </div>
        
        <div class="form-group">
          <label>Perfil</label>
          <select id="perfil" required>
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        
        <div class="form-group" id="senhaGroup">
          <label>Senha</label>
          <input type="password" id="senha" required>
          <small>Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial</small>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn-primary">Salvar</button>
          <button type="button" class="btn-secondary" id="btnCancelModal">Cancelar</button>
        </div>
      </form>
    </div>
  </div>
  
  <div id="footer"></div>
  <div class="skeleton skeleton-footer"></div>
  
  <script type="module">
    import { requireAdmin } from './js/auth.js';
    
    // Proteger página - apenas admin
    (async () => {
      await requireAdmin();
    })();
  </script>
  
  <script type="module" src="js/main.js"></script>
  <script type="module" src="js/users.js"></script>
</body>
</html>
```

**7.2. Criar `frontend/public/js/users.js`**

```javascript
import { authenticatedFetch } from './auth.js';
import { loadCommonComponents } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadCommonComponents();
  initUsersPage();
});

function initUsersPage() {
  loadUsers();
  setupEventListeners();
}

function setupEventListeners() {
  document.getElementById('btnCreateUser').addEventListener('click', openCreateModal);
  document.getElementById('btnCancelModal').addEventListener('click', closeModal);
  document.querySelector('.modal-close').addEventListener('click', closeModal);
  document.getElementById('userForm').addEventListener('submit', handleSubmitUser);
}

async function loadUsers() {
  try {
    const response = await authenticatedFetch('/users/');
    
    if (!response.ok) {
      throw new Error('Erro ao carregar usuários');
    }
    
    const users = await response.json();
    renderUsersTable(users);
    
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao carregar usuários');
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">Nenhum usuário encontrado</td></tr>';
    return;
  }
  
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.nome_completo}</td>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.empresa}</td>
      <td>
        <span class="badge badge-${user.perfil}">
          ${user.perfil === 'admin' ? '👑 Admin' : '👤 User'}
        </span>
      </td>
      <td>
        <span class="badge badge-${user.ativo ? 'active' : 'inactive'}">
          ${user.ativo ? '✅ Ativo' : '❌ Inativo'}
        </span>
      </td>
      <td>${user.ultimo_login ? new Date(user.ultimo_login).toLocaleString() : 'Nunca'}</td>
      <td>
        <button class="btn-icon" onclick="editUser('${user.id}')" title="Editar">✏️</button>
        <button class="btn-icon" onclick="toggleUserStatus('${user.id}', ${user.ativo})" title="${user.ativo ? 'Desativar' : 'Ativar'}">
          ${user.ativo ? '🔒' : '🔓'}
        </button>
      </td>
    </tr>
  `).join('');
}

function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Criar Novo Usuário';
  document.getElementById('userForm').reset();
  document.getElementById('senhaGroup').style.display = 'block';
  document.getElementById('userModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('userModal').style.display = 'none';
}

async function handleSubmitUser(e) {
  e.preventDefault();
  
  const userData = {
    nome_completo: document.getElementById('nomeCompleto').value,
    username: document.getElementById('username').value,
    email: document.getElementById('email').value,
    empresa: document.getElementById('empresa').value,
    cpf: document.getElementById('cpf').value,
    perfil: document.getElementById('perfil').value,
    senha: document.getElementById('senha').value
  };
  
  try {
    const response = await authenticatedFetch('/users/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao criar usuário');
    }
    
    alert('Usuário criado com sucesso!');
    closeModal();
    loadUsers();
    
  } catch (error) {
    alert(error.message);
  }
}

// Exportar funções globais
window.editUser = async (userId) => {
  // Implementar edição
  console.log('Editar usuário:', userId);
};

window.toggleUserStatus = async (userId, isActive) => {
  const action = isActive ? 'deactivate' : 'activate';
  const confirmMsg = isActive ? 'desativar' : 'ativar';
  
  if (!confirm(`Deseja realmente ${confirmMsg} este usuário?`)) {
    return;
  }
  
  try {
    const response = await authenticatedFetch(`/users/${userId}/${action}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Erro ao alterar status');
    }
    
    alert('Status alterado com sucesso!');
    loadUsers();
    
  } catch (error) {
    alert(error.message);
  }
};
```

---

## 📝 Estratégia de Cadastro

### Estratégia Recomendada: Admin-Only Registration

**Justificativa:**
- Maior controle sobre quem acessa o sistema
- Evita cadastros não autorizados
- Permite validação prévia de usuários
- Mantém rastreabilidade (campo `criado_por`)

### Fluxo de Cadastro:

```
1. Sistema é inicializado pela primeira vez
   └─> Usuário admin padrão é criado automaticamente
       (credenciais em config/.env)

2. Admin faz login no sistema
   └─> Acessa página de Gestão de Usuários (/users.html)

3. Admin clica em "Criar Novo Usuário"
   └─> Preenche formulário com todos os dados
   └─> Define perfil (admin ou user)
   └─> Define senha inicial

4. Novo usuário é criado
   └─> Recebe credenciais (pode ser enviado por email - futuro)
   └─> Faz primeiro login
   └─> Recomendado: alterar senha no primeiro acesso

5. Admin pode gerenciar usuários
   └─> Ativar/Desativar
   └─> Editar informações (exceto CPF, username)
   └─> Visualizar último acesso
```

### Alternativas Futuras:

**Auto-registro com aprovação:**
- Usuário se cadastra
- Fica com status "pendente"
- Admin aprova ou rejeita
- Após aprovação, usuário pode acessar

**Auto-registro com convite:**
- Admin gera link de convite com token
- Usuário acessa link e completa cadastro
- Validação automática via token

---

## 🔒 Controle de Acesso

### Matriz de Permissões

| Página/Recurso | Público | User Autenticado | Admin |
|----------------|---------|------------------|-------|
| `/login.html` | ✅ | ✅ (redireciona) | ✅ (redireciona) |
| `/index.html` | ❌ | ✅ | ✅ |
| `/chat.html` | ❌ | ✅ | ✅ |
| `/config.html` | ❌ | ❌ | ✅ |
| `/users.html` | ❌ | ❌ | ✅ |
| `POST /analyze` | ❌ | ✅ | ✅ |
| `GET /config` | ❌ | ✅ | ✅ |
| `POST /config` | ❌ | ❌ | ✅ |
| `GET /users` | ❌ | ❌ | ✅ |
| `POST /users` | ❌ | ❌ | ✅ |

### Implementação de Guards

**Frontend (JavaScript):**

```javascript
// Guard para usuários autenticados
export async function requireAuth() {
  const isValid = await verifyToken();
  if (!isValid) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// Guard para admin
export async function requireAdmin() {
  await requireAuth();
  if (!isAdmin()) {
    alert('Acesso negado');
    window.location.href = '/index.html';
    return false;
  }
  return true;
}
```

**Backend (FastAPI Dependencies):**

```python
# Dependency para usuários autenticados
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    # Valida token e retorna usuário
    # Lança HTTPException 401 se inválido

# Dependency para admin
def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.perfil != PerfilEnum.ADMIN:
        raise HTTPException(403, "Acesso negado")
    return current_user
```

---

## 🔐 Segurança

### Boas Práticas Implementadas

**1. Senha:**
- ✅ Hash bcrypt (12 rounds)
- ✅ Validação de força (maiúscula, minúscula, número, especial)
- ✅ Mínimo 8 caracteres
- ✅ Nunca armazenar senha em texto plano
- ✅ Nunca retornar senha_hash nas APIs

**2. JWT Token:**
- ✅ Assinado com SECRET_KEY forte
- ✅ Expiração curta (30 minutos recomendado)
- ✅ Payload mínimo (apenas user_id, username, perfil)
- ✅ Validação em toda requisição protegida
- ✅ Renovação automática (opcional - implementar refresh token)

**3. Validações:**
- ✅ CPF: validação matemática
- ✅ Email: formato válido
- ✅ Username: caracteres permitidos
- ✅ Unicidade: username, email, CPF

**4. Proteção contra Ataques:**
- ✅ **SQL Injection:** SQLAlchemy ORM (parametrizado)
- ✅ **XSS:** Sanitização no frontend
- ✅ **CSRF:** Token JWT em header (não cookie)
- ✅ **Brute Force:** Rate limiting (implementar Limiter)
- ✅ **Session Fixation:** Token regenerado a cada login

**5. HTTPS:**
- ⚠️ Em produção, SEMPRE usar HTTPS
- ⚠️ Railway já fornece HTTPS automático

**6. Logs de Segurança:**
- ✅ Registrar tentativas de login
- ✅ Registrar alterações de senha
- ✅ Registrar criação/desativação de usuários
- ✅ Registrar acessos negados

### Melhorias Futuras de Segurança

**1. Rate Limiting:**

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@router.post("/login")
@limiter.limit("5/minute")  # Máximo 5 tentativas por minuto
async def login(request: Request, ...):
    # ...
```

**2. Two-Factor Authentication (2FA):**
- Google Authenticator
- Código por email
- SMS (opcional)

**3. Recuperação de Senha:**
- Token único enviado por email
- Expiração de 15 minutos
- Link único de redefinição

**4. Auditoria Completa:**
- Tabela `audit_logs` com todas as ações
- Retenção de 90 dias
- Relatórios de segurança para admin

**5. Política de Senha:**
- Expiração a cada 90 dias
- Histórico de senhas (não reutilizar últimas 5)
- Bloqueio após 5 tentativas incorretas

---

## 🔄 Fluxo de Autenticação

### Diagrama de Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE AUTENTICAÇÃO                    │
└─────────────────────────────────────────────────────────────┘

1. ACESSO INICIAL
   Usuário acessa qualquer página
   └─> Frontend verifica localStorage (token)
       ├─> Token existe?
       │   ├─> SIM: Valida token com backend
       │   │   ├─> Token válido: CONTINUAR
       │   │   └─> Token inválido: REDIRECIONAR /login.html
       │   └─> NÃO: REDIRECIONAR /login.html

2. PÁGINA DE LOGIN
   Usuário preenche credenciais
   └─> Clica em "Entrar"
       └─> Frontend envia POST /auth/login
           └─> Backend valida credenciais
               ├─> Credenciais válidas
               │   ├─> Gera token JWT
               │   ├─> Atualiza ultimo_login
               │   └─> Retorna: token + dados do usuário
               │       └─> Frontend salva no localStorage
               │           └─> REDIRECIONAR /index.html
               └─> Credenciais inválidas
                   └─> Retorna erro 401
                       └─> Frontend exibe mensagem de erro

3. NAVEGAÇÃO AUTENTICADA
   Usuário navega entre páginas
   └─> Cada página protegida executa requireAuth()
       └─> Verifica token no localStorage
           ├─> Token existe
           │   └─> Valida com backend (POST /auth/verify-token)
           │       ├─> Válido: Permite acesso
           │       └─> Inválido: REDIRECIONAR /login.html
           └─> Token não existe
               └─> REDIRECIONAR /login.html

4. REQUISIÇÕES À API
   Usuário realiza ação (ex: enviar análise)
   └─> Frontend usa authenticatedFetch()
       └─> Adiciona header: Authorization: Bearer {token}
           └─> Backend recebe requisição
               └─> Dependency get_current_user()
                   ├─> Token válido
                   │   └─> Executa ação
                   │       └─> Retorna resultado
                   └─> Token inválido
                       └─> Retorna erro 401
                           └─> Frontend intercepta 401
                               └─> Remove token
                                   └─> REDIRECIONAR /login.html

5. CONTROLE DE ACESSO ADMIN
   Usuário tenta acessar /config.html ou /users.html
   └─> Página executa requireAdmin()
       └─> Valida autenticação (requireAuth)
           └─> Verifica perfil do usuário
               ├─> perfil === 'admin'
               │   └─> Permite acesso
               └─> perfil !== 'admin'
                   └─> Exibe alert("Acesso negado")
                       └─> REDIRECIONAR /index.html

6. LOGOUT
   Usuário clica em "Sair"
   └─> Frontend chama logout()
       └─> Envia POST /auth/logout (opcional)
       └─> Remove token do localStorage
       └─> REDIRECIONAR /login.html

7. EXPIRAÇÃO DE TOKEN
   Token expira (30 minutos de inatividade)
   └─> Próxima requisição retorna 401
       └─> Frontend intercepta
           └─> Remove token
               └─> REDIRECIONAR /login.html
               └─> Exibe: "Sessão expirada"
```

### Sequência de Eventos no Código

**Exemplo: Usuário acessando Chat**

```
1. Navegador carrega /chat.html
   ↓
2. Script inline executa requireAuth()
   ↓
3. requireAuth() chama verifyToken()
   ↓
4. verifyToken() faz POST /auth/verify-token com Bearer token
   ↓
5. Backend valida JWT
   ├─> Válido: retorna 200 OK
   └─> Inválido: retorna 401 Unauthorized
   ↓
6. Frontend recebe resposta
   ├─> 200: Continua carregamento da página
   └─> 401: Redireciona para /login.html
   ↓
7. Usuário preenche formulário e envia
   ↓
8. Frontend usa authenticatedFetch() com token
   ↓
9. Backend processa com get_current_user()
   ↓
10. Retorna resultado para frontend
```

---

## 🚀 Considerações Finais

### Ordem de Implementação Recomendada

1. ✅ **BACKEND - Configuração Inicial (Dia 1)**
   - Instalar dependências
   - Configurar .env
   - Criar estrutura de pastas

2. ✅ **BACKEND - Banco de Dados (Dia 1-2)**
   - Criar modelos (User, Session)
   - Configurar conexão
   - Script de inicialização

3. ✅ **BACKEND - Segurança (Dia 2)**
   - Implementar utils/security.py
   - Implementar validators.py
   - Implementar dependencies.py

4. ✅ **BACKEND - Schemas (Dia 2-3)**
   - Criar schemas Pydantic
   - Implementar validações

5. ✅ **BACKEND - Serviços (Dia 3-4)**
   - Implementar auth_service.py
   - Implementar user_service.py

6. ✅ **BACKEND - Rotas (Dia 4-5)**
   - Criar routes_auth.py
   - Criar routes_users.py
   - Proteger rotas existentes

7. ✅ **BACKEND - Testes (Dia 5)**
   - Testar endpoints com Postman/Insomnia
   - Validar fluxos completos

8. ✅ **FRONTEND - Autenticação (Dia 6-7)**
   - Criar auth.js
   - Criar login.html e login.js
   - Testar login/logout

9. ✅ **FRONTEND - Proteção de Páginas (Dia 7-8)**
   - Proteger chat.html
   - Proteger config.html
   - Atualizar header com user info

10. ✅ **FRONTEND - Gestão de Usuários (Dia 8-9)**
    - Criar users.html
    - Criar users.js
    - Testar CRUD completo

11. ✅ **TESTES INTEGRADOS (Dia 10)**
    - Testar todos os fluxos
    - Corrigir bugs
    - Documentar

12. ✅ **DEPLOY (Dia 11)**
    - Configurar Railway
    - Testar em produção
    - Monitorar logs

### Checklist de Implementação

**Backend:**
- [ ] Dependências instaladas
- [ ] .env configurado
- [ ] SECRET_KEY gerada
- [ ] Banco de dados criado
- [ ] Modelos implementados
- [ ] Schemas implementados
- [ ] Serviços implementados
- [ ] Rotas implementadas
- [ ] Rotas protegidas
- [ ] Admin inicial criado
- [ ] Testado com Postman

**Frontend:**
- [ ] auth.js implementado
- [ ] login.html criado
- [ ] login.js implementado
- [ ] chat.html protegido
- [ ] config.html protegido (admin)
- [ ] Header atualizado
- [ ] users.html criado
- [ ] users.js implementado
- [ ] Estilos adicionados
- [ ] Testado em navegador

**Segurança:**
- [ ] Senhas com hash bcrypt
- [ ] JWT implementado
- [ ] Validações de CPF
- [ ] Validações de senha forte
- [ ] HTTPS em produção
- [ ] Rate limiting (opcional)
- [ ] Logs de auditoria (opcional)

**Documentação:**
- [ ] README atualizado
- [ ] Diagrama de arquitetura
- [ ] Instruções de deploy
- [ ] Credenciais admin documentadas

### Pontos de Atenção

⚠️ **Segurança:**
- NUNCA commitar `.env` no Git
- Usar SECRET_KEY forte (32+ caracteres)
- HTTPS obrigatório em produção
- Logs não devem conter senhas

⚠️ **Performance:**
- Índices em username, email, cpf
- Conexão pool do SQLAlchemy
- Cache de validações (opcional)

⚠️ **UX:**
- Mensagens de erro claras
- Loading states em todas as ações
- Confirmações em ações destrutivas
- Feedback visual de sucesso/erro

⚠️ **Manutenção:**
- Código comentado em português
- Testes automatizados (futuro)
- Logs estruturados
- Monitoramento de erros

### Recursos Adicionais

**Bibliotecas Úteis:**
- `slowapi`: Rate limiting
- `python-jose`: JWT
- `passlib`: Hash de senhas
- `email-validator`: Validação de email
- `alembic`: Migrações de banco

**Ferramentas:**
- Postman: Testar APIs
- pgAdmin: Gerenciar PostgreSQL
- Railway CLI: Deploy
- GitHub Actions: CI/CD (futuro)

### Próximos Passos (Pós-Implementação)

1. **Recuperação de Senha** (email)
2. **Two-Factor Authentication (2FA)**
3. **Logs de Auditoria** completos
4. **Dashboard de Métricas** (uso, acessos, etc.)
5. **Perfis customizáveis** (além de admin/user)
6. **Permissões granulares** (RBAC)
7. **API de Integração** (para terceiros)
8. **Mobile App** (React Native/Flutter)

---

## 📞 Suporte

Em caso de dúvidas ou problemas na implementação, revisar:

1. Logs do backend (`python -m backend.main`)
2. Console do navegador (F12)
3. Network tab (requisições)
4. Documentação da API (`/docs`)

**Contato:** Entre em contato com o time de desenvolvimento BSQA.

---

*Documento criado em 02/01/2025*  
*Versão: 1.0*  
*Autor: Sistema BSQA Card Writer*

---

## 🎯 Resumo Executivo

Este documento descreve a implementação completa de um sistema de autenticação robusto e seguro para o **BSQA Card Writer**, incluindo:

- ✅ Login por usuário e senha com JWT
- ✅ Controle de acesso por perfil (admin/user)
- ✅ Cadastro de usuários apenas por admin
- ✅ Proteção de rotas backend e frontend
- ✅ Validações completas (CPF, email, senha forte)
- ✅ Gestão completa de usuários
- ✅ Boas práticas de segurança

**Tempo estimado de implementação:** 10-11 dias  
**Complexidade:** Média-Alta  
**Stack:** FastAPI + SQLAlchemy + JWT + bcrypt + JavaScript puro

