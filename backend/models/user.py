"""
Modelo de Usuário para o sistema de autenticação
"""
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.sql import func
from backend.database.connection import Base
import uuid
import enum

class PerfilEnum(str, enum.Enum):
    """
    Enum para perfis de usuário
    """
    ADMIN = "admin"
    USER = "user"

class User(Base):
    """
    Modelo de Usuário
    
    Campos:
    - id: UUID único do usuário
    - nome_completo: Nome completo do usuário
    - username: Nome de usuário (único, usado para login)
    - email: Email do usuário (único)
    - empresa: Nome da empresa do usuário
    - cpf: CPF do usuário (único, 11 dígitos)
    - senha_hash: Hash bcrypt da senha
    - perfil: Perfil do usuário (admin ou user)
    - ativo: Se o usuário está ativo no sistema
    - data_criacao: Data de criação do usuário
    - data_atualizacao: Data da última atualização
    - ultimo_login: Data do último login
    - criado_por: ID do usuário que criou este usuário (admin)
    """
    __tablename__ = "users"

    # ID único (UUID para compatibilidade entre SQLite e PostgreSQL)
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Informações pessoais
    nome_completo = Column(String(200), nullable=False, comment="Nome completo do usuário")
    username = Column(String(50), unique=True, nullable=False, index=True, comment="Username para login")
    email = Column(String(255), unique=True, nullable=False, index=True, comment="Email do usuário")
    empresa = Column(String(200), nullable=False, comment="Empresa do usuário")
    cpf = Column(String(11), unique=True, nullable=False, index=True, comment="CPF do usuário (11 dígitos)")
    
    # Autenticação
    senha_hash = Column(String(255), nullable=False, comment="Hash bcrypt da senha")
    perfil = Column(Enum(PerfilEnum), nullable=False, default=PerfilEnum.USER, comment="Perfil do usuário")
    
    # Status e controle
    ativo = Column(Boolean, default=True, nullable=False, comment="Se o usuário está ativo")
    data_criacao = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="Data de criação")
    data_atualizacao = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False, comment="Data de atualização")
    ultimo_login = Column(DateTime(timezone=True), nullable=True, comment="Data do último login")
    
    # Rastreabilidade
    criado_por = Column(String(36), ForeignKey("users.id"), nullable=True, comment="ID do usuário que criou")

    def __repr__(self):
        return f"<User {self.username} ({self.perfil.value})>"

    def to_dict(self):
        """
        Converte o usuário para dicionário (sem senha)
        """
        return {
            "id": self.id,
            "nome_completo": self.nome_completo,
            "username": self.username,
            "email": self.email,
            "empresa": self.empresa,
            "cpf": self.cpf,
            "perfil": self.perfil.value,
            "ativo": self.ativo,
            "data_criacao": self.data_criacao.isoformat() if self.data_criacao else None,
            "data_atualizacao": self.data_atualizacao.isoformat() if self.data_atualizacao else None,
            "ultimo_login": self.ultimo_login.isoformat() if self.ultimo_login else None,
        }

