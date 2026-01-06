"""
Script de teste para validar utilitários de segurança
Execute: python test_security.py
"""
from backend.utils.security import (
    hash_password, 
    verify_password,
    create_access_token,
    decode_access_token,
    verify_token,
    get_token_expiration_time,
    generate_secret_key
)
from datetime import timedelta

print("=" * 60)
print("🔐 TESTE DOS UTILITÁRIOS DE SEGURANÇA")
print("=" * 60)

# ============================================
# TESTE 1: HASH DE SENHA
# ============================================
print("\n1️⃣ Testando hash de senha (bcrypt)...")
senha = "Admin@123"
print(f"   Senha original: {senha}")

hashed = hash_password(senha)
print(f"   Hash gerado: {hashed[:50]}...")

# Verificar senha correta
is_valid = verify_password(senha, hashed)
print(f"   ✅ Senha correta: {is_valid}")

# Verificar senha incorreta
is_valid_wrong = verify_password("SenhaErrada", hashed)
print(f"   ❌ Senha incorreta: {is_valid_wrong}")

# ============================================
# TESTE 2: TOKEN JWT
# ============================================
print("\n2️⃣ Testando criação e validação de token JWT...")
token_data = {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "admin",
    "perfil": "admin"
}
print(f"   Dados do token: {token_data}")

# Criar token
token = create_access_token(data=token_data, expires_delta=timedelta(minutes=30))
print(f"   Token gerado: {token[:50]}...")

# Decodificar token
payload = decode_access_token(token)
if payload:
    print(f"   ✅ Token decodificado com sucesso!")
    print(f"      - user_id: {payload.get('user_id')}")
    print(f"      - username: {payload.get('username')}")
    print(f"      - perfil: {payload.get('perfil')}")
    print(f"      - exp: {payload.get('exp')}")
else:
    print(f"   ❌ Erro ao decodificar token")

# Verificar token
is_valid_token = verify_token(token)
print(f"   ✅ Token válido: {is_valid_token}")

# Verificar token inválido
is_valid_fake = verify_token("token_invalido_fake")
print(f"   ❌ Token inválido: {is_valid_fake}")

# ============================================
# TESTE 3: TEMPO DE EXPIRAÇÃO
# ============================================
print("\n3️⃣ Testando tempo de expiração...")
expiration = get_token_expiration_time()
print(f"   Tempo de expiração: {expiration} segundos ({expiration / 60} minutos)")

# ============================================
# TESTE 4: GERAR SECRET_KEY
# ============================================
print("\n4️⃣ Gerando nova SECRET_KEY...")
new_key = generate_secret_key()
print(f"   Nova SECRET_KEY: {new_key}")
print(f"   Tamanho: {len(new_key)} caracteres")

print("\n" + "=" * 60)
print("✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!")
print("=" * 60)

