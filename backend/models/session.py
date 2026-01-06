"""
Modelo de Sessão para controle de tokens JWT (opcional)
Útil para rastreabilidade e revogação de tokens
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.database.connection import Base
import uuid

class Session(Base):
    """
    Modelo de Sessão/Token
    
    Permite rastrear e revogar tokens JWT ativos
    Útil para:
    - Logout em todos os dispositivos
    - Rastreamento de acessos
    - Segurança adicional
    
    Campos:
    - id: UUID único da sessão
    - user_id: ID do usuário dono da sessão
    - token: Token JWT (hash para economia de espaço)
    - ip_address: IP do cliente
    - user_agent: User-Agent do navegador
    - criado_em: Data de criação da sessão
    - expira_em: Data de expiração
    - revogado: Se o token foi revogado manualmente
    """
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True, comment="ID do usuário")
    token = Column(String(500), unique=True, nullable=False, index=True, comment="Token JWT (hash)")
    ip_address = Column(String(45), nullable=True, comment="IP do cliente")
    user_agent = Column(String(500), nullable=True, comment="User-Agent do navegador")
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="Data de criação")
    expira_em = Column(DateTime(timezone=True), nullable=False, comment="Data de expiração")
    revogado = Column(Boolean, default=False, nullable=False, comment="Se foi revogado")

    def __repr__(self):
        return f"<Session {self.id} - User {self.user_id} - Revogado: {self.revogado}>"

    def to_dict(self):
        """
        Converte a sessão para dicionário
        """
        return {
            "id": self.id,
            "user_id": self.user_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "criado_em": self.criado_em.isoformat() if self.criado_em else None,
            "expira_em": self.expira_em.isoformat() if self.expira_em else None,
            "revogado": self.revogado
        }

