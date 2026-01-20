# backend/services/jira_service.py

import os
import requests
from base64 import b64encode
from typing import Optional
from backend.services.issue_tracker_base import IssueTrackerBase

class JiraService(IssueTrackerBase):
    """Implementação do Issue Tracker para Jira Cloud."""
    
    # Campos disponíveis para consulta
    AVAILABLE_FIELDS = [
        {"id": "summary", "name": "Resumo", "required": True},
        {"id": "description", "name": "Descrição", "required": True},
        {"id": "status", "name": "Status", "required": False},
        {"id": "priority", "name": "Prioridade", "required": False},
        {"id": "assignee", "name": "Responsável", "required": False},
        {"id": "reporter", "name": "Relator", "required": False},
        {"id": "created", "name": "Data de Criação", "required": False},
        {"id": "updated", "name": "Última Atualização", "required": False},
        {"id": "labels", "name": "Labels", "required": False},
        {"id": "components", "name": "Componentes", "required": False},
        {"id": "issuetype", "name": "Tipo de Issue", "required": False},
        {"id": "changelog", "name": "Histórico", "required": False},
    ]
    
    def __init__(self):
        self.base_url = os.getenv("JIRA_BASE_URL")
        self.email = os.getenv("JIRA_USER_EMAIL")
        self.api_token = os.getenv("JIRA_API_TOKEN")
        self.subtask_type_id = os.getenv("JIRA_SUBTASK_ISSUE_TYPE_ID", "10003")
        self.timeout = int(os.getenv("JIRA_REQUEST_TIMEOUT", "30"))
        
        if not all([self.base_url, self.email, self.api_token]):
            raise RuntimeError(
                "Configurações do Jira incompletas. "
                "Verifique JIRA_BASE_URL, JIRA_USER_EMAIL e JIRA_API_TOKEN."
            )
        
        # Montar header de autenticação Basic
        credentials = f"{self.email}:{self.api_token}"
        self.auth_header = b64encode(credentials.encode()).decode()
    
    def _get_headers(self) -> dict:
        """Retorna headers padrão para requests."""
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Basic {self.auth_header}"
        }
    
    def get_issue(self, issue_key: str, fields: Optional[list[str]] = None) -> dict:
        """Busca uma issue no Jira."""
        if fields is None:
            fields = ["summary", "description"]
        
        # Verificar se changelog foi solicitado
        include_changelog = "changelog" in fields
        # Remover changelog da lista de fields (não é um field real)
        fields = [f for f in fields if f != "changelog"]
        
        # Sempre incluir 'project' nos campos solicitados para obter nome completo
        if "project" not in fields:
            fields = fields + ["project"]
        
        fields_param = ",".join(fields)
        url = f"{self.base_url}/rest/api/3/issue/{issue_key}?fields={fields_param}"
        
        # Adicionar expand=changelog se solicitado
        if include_changelog:
            url += "&expand=changelog"
        
        response = requests.get(
            url,
            headers=self._get_headers(),
            timeout=self.timeout
        )
        
        if response.status_code == 404:
            raise ValueError(f"Card {issue_key} não encontrado.")
        if response.status_code == 401:
            raise PermissionError("Token de API do Jira inválido ou expirado.")
        if response.status_code == 403:
            raise PermissionError(f"Sem permissão para acessar o card {issue_key}.")
        
        response.raise_for_status()
        
        data = response.json()
        parsed_fields = self._parse_fields(data.get("fields", {}))
        
        # Processar changelog se presente
        if include_changelog and "changelog" in data:
            parsed_fields["changelog"] = self._parse_changelog(data.get("changelog", {}))
        
        # Garantir que campos solicitados sempre apareçam, mesmo se vazios
        for field in fields:
            if field not in parsed_fields:
                parsed_fields[field] = None
        
        # Garantir changelog se foi solicitado
        if include_changelog:
            if "changelog" not in parsed_fields:
                parsed_fields["changelog"] = []
        
        # Obter nome completo do projeto (se disponível) ou usar código como fallback
        project_data = data.get("fields", {}).get("project", {})
        project_name = project_data.get("name") if project_data else None
        project_key = self.extract_project_key(data["key"])
        
        return {
            "key": data["key"],
            "project": project_name if project_name else project_key,  # Nome completo ou código
            "project_key": project_key,  # Sempre manter código disponível
            "fields": parsed_fields
        }
    
    def _parse_fields(self, fields: dict) -> dict:
        """Processa campos retornados pelo Jira."""
        parsed = {}
        
        for field_id, value in fields.items():
            if field_id == "description":
                # Converter Atlassian Document Format para texto
                # Sempre retornar, mesmo se vazio (campo obrigatório)
                parsed[field_id] = self._adf_to_text(value) if value else ""
            elif field_id == "status" and value:
                parsed[field_id] = value  # Manter objeto completo para compatibilidade
            elif field_id == "priority" and value:
                parsed[field_id] = value  # Manter objeto completo para compatibilidade
            elif field_id == "assignee" and value:
                parsed[field_id] = value  # Manter objeto completo
            elif field_id == "reporter" and value:
                parsed[field_id] = value.get("displayName", "")
            elif field_id == "issuetype" and value:
                parsed[field_id] = value.get("name", "")
            elif field_id == "project" and value:
                # Manter objeto completo do projeto (tem name, key, etc)
                parsed[field_id] = value
            elif field_id == "labels":
                parsed[field_id] = value if value else []
            elif field_id == "components":
                parsed[field_id] = [c.get("name", "") for c in (value or [])]
            else:
                parsed[field_id] = value
        
        return parsed
    
    def _parse_changelog(self, changelog_data: dict) -> list:
        """
        Processa o changelog retornado pelo Jira.
        Retorna lista de históricos ordenados do mais novo ao mais velho.
        """
        if not changelog_data or "histories" not in changelog_data:
            return []
        
        histories = changelog_data.get("histories", [])
        parsed_histories = []
        
        for history in histories:
            author = history.get("author", {})
            created = history.get("created", "")
            items = history.get("items", [])
            
            parsed_items = []
            for item in items:
                parsed_items.append({
                    "field": item.get("field", ""),
                    "fieldtype": item.get("fieldtype", ""),
                    "from": item.get("fromString") or item.get("from", ""),
                    "to": item.get("toString") or item.get("to", "")
                })
            
            parsed_histories.append({
                "id": history.get("id", ""),
                "author": {
                    "displayName": author.get("displayName", "Desconhecido"),
                    "emailAddress": author.get("emailAddress", "")
                },
                "created": created,
                "items": parsed_items
            })
        
        # Ordenar do mais novo ao mais velho (decrescente por data)
        # A data vem no formato ISO 8601, então podemos ordenar diretamente
        parsed_histories.sort(key=lambda x: x["created"], reverse=True)
        
        return parsed_histories
    
    def _adf_to_text(self, adf: dict) -> str:
        """Converte Atlassian Document Format para texto plano."""
        if not isinstance(adf, dict):
            return str(adf) if adf else ""
        
        def extract_text(node):
            if isinstance(node, str):
                return node
            if isinstance(node, dict):
                if node.get("type") == "text":
                    return node.get("text", "")
                content = node.get("content", [])
                return "\n".join(extract_text(c) for c in content)
            if isinstance(node, list):
                return "\n".join(extract_text(c) for c in node)
            return ""
        
        return extract_text(adf).strip()
    
    def create_subtask(
        self, 
        parent_key: str, 
        summary: str, 
        description: str
    ) -> dict:
        """Cria uma subtask no Jira."""
        project_key = self.extract_project_key(parent_key)
        
        # Converter descrição para Atlassian Document Format
        adf_description = self._text_to_adf(description)
        
        payload = {
            "fields": {
                "project": {"key": project_key},
                "parent": {"key": parent_key},
                "issuetype": {"id": self.subtask_type_id},
                "summary": summary,
                "description": adf_description
            }
        }
        
        url = f"{self.base_url}/rest/api/3/issue"
        
        response = requests.post(
            url,
            headers=self._get_headers(),
            json=payload,
            timeout=self.timeout
        )
        
        if response.status_code == 400:
            error_data = response.json()
            errors = error_data.get("errors", {})
            error_messages = error_data.get("errorMessages", [])
            raise ValueError(f"Erro ao criar subtask: {errors or error_messages}")
        if response.status_code == 401:
            raise PermissionError("Token de API do Jira inválido ou expirado.")
        if response.status_code == 403:
            raise PermissionError("Sem permissão para criar issues neste projeto.")
        
        response.raise_for_status()
        
        data = response.json()
        return {
            "key": data["key"],
            "id": data["id"],
            "self": data["self"],
            "url": f"{self.base_url}/browse/{data['key']}"
        }
    
    def _text_to_adf(self, text: str) -> dict:
        """Converte texto plano para Atlassian Document Format."""
        paragraphs = text.split("\n\n") if "\n\n" in text else [text]
        
        content = []
        for para in paragraphs:
            if para.strip():
                content.append({
                    "type": "paragraph",
                    "content": [{"type": "text", "text": para.strip()}]
                })
        
        return {
            "type": "doc",
            "version": 1,
            "content": content or [{"type": "paragraph", "content": []}]
        }
    
    def get_available_fields(self) -> list[dict]:
        """Retorna campos disponíveis para consulta."""
        return self.AVAILABLE_FIELDS
    
    def test_connection(self) -> dict:
        """Testa a conexão com o Jira."""
        url = f"{self.base_url}/rest/api/3/myself"
        
        try:
            response = requests.get(
                url,
                headers=self._get_headers(),
                timeout=self.timeout
            )
            
            if response.status_code == 401:
                return {
                    "success": False,
                    "error": "Falha na autenticação",
                    "detail": "Verifique o email e token de API do Jira."
                }
            
            response.raise_for_status()
            
            data = response.json()
            return {
                "success": True,
                "message": "Conexão com Jira estabelecida com sucesso",
                "user": {
                    "displayName": data.get("displayName", ""),
                    "emailAddress": data.get("emailAddress", "")
                }
            }
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Timeout",
                "detail": f"Conexão expirou após {self.timeout} segundos."
            }
        except requests.exceptions.ConnectionError:
            return {
                "success": False,
                "error": "Erro de conexão",
                "detail": "Não foi possível conectar ao Jira. Verifique a URL."
            }
