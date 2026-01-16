"""
Configuração de conexão com o banco de dados PostgreSQL/SQLite
"""
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'config', '.env')
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# Obter URL do banco de dados
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./bsqa_card_writer.db")

# Ajuste para SQLite (desenvolvimento local)
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    print("🔧 Usando SQLite (desenvolvimento)")
else:
    # PostgreSQL (produção - Railway)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verificar conexão antes de usar
        pool_size=10,         # Tamanho do pool de conexões
        max_overflow=20       # Conexões extras permitidas
    )
    print("🔧 Usando PostgreSQL (produção)")

# Criar SessionLocal para gerenciar sessões do banco
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos SQLAlchemy
Base = declarative_base()

def get_db():
    """
    Dependency para obter sessão do banco de dados
    Uso: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_connection():
    """
    Testa a conexão com o banco de dados
    """
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.commit()
        db.close()
        print("✅ Conexão com banco de dados OK")
        return True
    except Exception as e:
        print(f"❌ Erro ao conectar com banco de dados: {e}")
        return False

