# backend/services/issue_tracker_base.py

from abc import ABC, abstractmethod
from typing import Optional

class IssueTrackerBase(ABC):
    """Interface abstrata para Issue Trackers (Jira, Azure DevOps, GitHub, etc.)"""
    
    @abstractmethod
    def get_issue(self, issue_key: str, fields: Optional[list[str]] = None) -> dict:
        """
        Busca uma issue pelo identificador.
        
        Args:
            issue_key: Identificador da issue (ex: PKGS-1104)
            fields: Lista de campos a retornar (opcional)
            
        Returns:
            dict com dados da issue
        """
        pass
    
    @abstractmethod
    def create_subtask(
        self, 
        parent_key: str, 
        summary: str, 
        description: str
    ) -> dict:
        """
        Cria uma subtask vinculada a uma issue pai.
        
        Args:
            parent_key: Chave da issue pai
            summary: Título da subtask
            description: Descrição completa
            
        Returns:
            dict com dados da subtask criada
        """
        pass
    
    @abstractmethod
    def get_available_fields(self) -> list[dict]:
        """
        Retorna campos disponíveis para consulta.
        
        Returns:
            Lista de dicts com id e name dos campos
        """
        pass
    
    @abstractmethod
    def test_connection(self) -> dict:
        """
        Testa a conexão com o serviço.
        
        Returns:
            dict com status da conexão
        """
        pass
    
    @staticmethod
    def extract_project_key(issue_key: str) -> str:
        """
        Extrai a chave do projeto do identificador da issue.
        
        Args:
            issue_key: Ex: "PKGS-1104"
            
        Returns:
            Ex: "PKGS"
        """
        return issue_key.split('-')[0].upper()
