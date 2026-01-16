"""
Funções de segurança (hash de senha, JWT)
"""
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'config', '.env')
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# Configurações JWT
SECRET_KEY = os.getenv("SECRET_KEY", "sua-chave-secreta-super-segura-aqui-minimo-32-caracteres")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Verificar se SECRET_KEY foi configurada
if SECRET_KEY == "sua-chave-secreta-super-segura-aqui-minimo-32-caracteres":
    print("⚠️  AVISO: SECRET_KEY não configurada! Use uma chave segura em produção.")
    print("   Gere uma com: openssl rand -hex 32")

# Configurar contexto de criptografia (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============================================
# FUNÇÕES DE HASH DE SENHA (BCRYPT)
# ============================================

def hash_password(password: str) -> str:
    """
    Gera hash bcrypt da senha
    
    Args:
        password: Senha em texto plano
    
    Returns:
        str: Hash bcrypt da senha
    
    Exemplo:
        >>> hash_password("Admin@123")
        "$2b$12$..."
    """
    # Bcrypt tem limite de 72 bytes - truncar se necessário
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha corresponde ao hash
    
    Args:
        plain_password: Senha em texto plano
        hashed_password: Hash bcrypt armazenado
    
    Returns:
        bool: True se a senha corresponde, False caso contrário
    
    Exemplo:
        >>> hashed = hash_password("Admin@123")
        >>> verify_password("Admin@123", hashed)
        True
        >>> verify_password("SenhaErrada", hashed)
        False
    """
    return pwd_context.verify(plain_password, hashed_password)

# ============================================
# FUNÇÕES DE TOKEN JWT
# ============================================

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Cria um token JWT
    
    Args:
        data: Dados a serem codificados no token (ex: user_id, username, perfil)
        expires_delta: Tempo até expiração (opcional)
    
    Returns:
        str: Token JWT assinado
    
    Exemplo:
        >>> token = create_access_token(
        ...     data={"user_id": "123", "username": "admin", "perfil": "admin"}
        ... )
        >>> print(token)
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    """
    to_encode = data.copy()
    
    # Definir tempo de expiração
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Adicionar timestamp de expiração ao payload
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow()  # issued at
    })
    
    # Codificar e assinar o token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodifica e valida um token JWT
    
    Args:
        token: Token JWT a ser decodificado
    
    Returns:
        Optional[Dict]: Payload do token se válido, None se inválido ou expirado
    
    Exemplo:
        >>> token = create_access_token({"user_id": "123"})
        >>> payload = decode_access_token(token)
        >>> print(payload["user_id"])
        "123"
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        print(f"❌ Erro ao decodificar token: {e}")
        return None

def verify_token(token: str) -> bool:
    """
    Verifica se um token JWT é válido
    
    Args:
        token: Token JWT a ser verificado
    
    Returns:
        bool: True se válido, False se inválido ou expirado
    
    Exemplo:
        >>> token = create_access_token({"user_id": "123"})
        >>> verify_token(token)
        True
        >>> verify_token("token_invalido")
        False
    """
    payload = decode_access_token(token)
    return payload is not None

def get_token_expiration_time() -> int:
    """
    Retorna o tempo de expiração do token em segundos
    
    Returns:
        int: Tempo em segundos
    
    Exemplo:
        >>> get_token_expiration_time()
        1800  # 30 minutos
    """
    return ACCESS_TOKEN_EXPIRE_MINUTES * 60

# ============================================
# FUNÇÕES AUXILIARES
# ============================================

def extract_token_from_header(authorization: str) -> Optional[str]:
    """
    Extrai token do header Authorization
    
    Args:
        authorization: Header Authorization (ex: "Bearer eyJhbGci...")
    
    Returns:
        Optional[str]: Token extraído ou None se formato inválido
    
    Exemplo:
        >>> extract_token_from_header("Bearer eyJhbGci...")
        "eyJhbGci..."
        >>> extract_token_from_header("InvalidFormat")
        None
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    return authorization.replace("Bearer ", "").strip()

def generate_secret_key() -> str:
    """
    Gera uma SECRET_KEY aleatória (32 bytes em hex)
    
    Returns:
        str: Chave secreta em formato hexadecimal
    
    Exemplo:
        >>> key = generate_secret_key()
        >>> len(key)
        64  # 32 bytes = 64 caracteres hex
    """
    import secrets
    return secrets.token_hex(32)

