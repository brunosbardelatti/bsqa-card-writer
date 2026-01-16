"""
Script para inicializar o banco de dados
Cria todas as tabelas e o usuário admin padrão
"""
import os
import sys
import uuid

# Adicionar o diretório raiz ao PYTHONPATH
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from dotenv import load_dotenv
from backend.database.connection import engine, Base, SessionLocal, test_connection
from backend.models.user import User, PerfilEnum
from backend.models.session import Session

# Carregar variáveis de ambiente
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'config', '.env')
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

def init_database():
    """
    Inicializa o banco de dados e cria usuário admin padrão
    """
    print("=" * 60)
    print("🔧 INICIALIZANDO BANCO DE DADOS")
    print("=" * 60)
    
    # Testar conexão
    print("\n1️⃣ Testando conexão com banco de dados...")
    if not test_connection():
        print("❌ Falha na conexão. Verifique DATABASE_URL no .env")
        return False
    
    # Criar tabelas
    print("\n2️⃣ Criando tabelas no banco de dados...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas criadas com sucesso!")
        print("   - users")
        print("   - sessions")
    except Exception as e:
        print(f"❌ Erro ao criar tabelas: {e}")
        return False
    
    # Criar usuário admin padrão
    print("\n3️⃣ Verificando usuário administrador...")
    db = SessionLocal()
    try:
        # Verificar se já existe admin
        admin_exists = db.query(User).filter(User.perfil == PerfilEnum.ADMIN).first()
        
        if admin_exists:
            print("ℹ️  Usuário administrador já existe:")
            print(f"   Username: {admin_exists.username}")
            print(f"   Email: {admin_exists.email}")
            print(f"   Nome: {admin_exists.nome_completo}")
        else:
            print("👤 Criando usuário administrador padrão...")
            
            # Importar hash_password aqui para evitar erro circular
            from backend.utils.security import hash_password
            
            # Senha com limite de 72 bytes (limite do bcrypt)
            admin_password = os.getenv("ADMIN_PASSWORD", "Admin@123456")[:72]
            
            admin = User(
                id=str(uuid.uuid4()),
                nome_completo=os.getenv("ADMIN_NOME", "Administrador"),
                username=os.getenv("ADMIN_USERNAME", "admin"),
                email=os.getenv("ADMIN_EMAIL", "admin@bsqa.com"),
                empresa=os.getenv("ADMIN_EMPRESA", "BSQA"),
                cpf=os.getenv("ADMIN_CPF", "00000000000"),
                senha_hash=hash_password(admin_password),
                perfil=PerfilEnum.ADMIN,
                ativo=True
            )
            
            db.add(admin)
            db.commit()
            db.refresh(admin)
            
            print("✅ Usuário administrador criado com sucesso!")
            print(f"   Username: {admin.username}")
            print(f"   Email: {admin.email}")
            print(f"   Senha: {os.getenv('ADMIN_PASSWORD', 'Admin@123456')}")
            print("\n   ⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!")
    
    except Exception as e:
        print(f"❌ Erro ao criar usuário admin: {e}")
        db.rollback()
        return False
    finally:
        db.close()
    
    print("\n" + "=" * 60)
    print("✅ INICIALIZAÇÃO CONCLUÍDA COM SUCESSO!")
    print("=" * 60)
    return True

def drop_all_tables():
    """
    Remove todas as tabelas (cuidado! use apenas em desenvolvimento)
    """
    print("⚠️  ATENÇÃO: Removendo todas as tabelas do banco de dados...")
    Base.metadata.drop_all(bind=engine)
    print("✅ Tabelas removidas")

if __name__ == "__main__":
    # Executar inicialização quando rodar o script diretamente
    init_database()

