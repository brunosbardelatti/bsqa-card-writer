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
        self.bug_type_id = os.getenv("JIRA_BUG_ISSUE_TYPE_ID", "10004")
        self.sub_bug_type_id = os.getenv("JIRA_SUB_BUG_ISSUE_TYPE_ID", "10271")
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
    
    def create_bug(
        self,
        project_key: str,
        summary: str,
        description: str,
        issue_type: str = "bug",  # "bug" ou "sub_bug"
        parent_key: Optional[str] = None
    ) -> dict:
        """
        Cria um Bug ou Sub-Bug no Jira com estrutura mínima.
        
        Args:
            project_key: Chave do projeto (ex: "PKGS")
            summary: Título do bug (extraído da IA)
            description: Descrição completa em formato ADF (formatada pela IA)
            issue_type: "bug" ou "sub_bug"
            parent_key: Chave da issue pai (obrigatório se issue_type="sub_bug")
        
        Returns:
            dict com dados da issue criada (key, id, self, url)
        """
        # Determinar Issue Type ID
        if issue_type == "sub_bug":
            if not parent_key:
                raise ValueError("parent_key é obrigatório para Sub-Bug")
            # Para Sub-Bug, tentar buscar o Issue Type ID do parent primeiro
            # Isso garante compatibilidade, pois Sub-Bug geralmente usa o mesmo tipo do parent
            try:
                parent_issue = self.get_issue(parent_key, ["issuetype"])
                parent_issuetype = parent_issue["fields"].get("issuetype", {})
                # Usar o mesmo Issue Type ID do parent (geralmente funciona para subtasks)
                issuetype_id = parent_issuetype.get("id")
                if not issuetype_id:
                    # Fallback para o ID configurado se não conseguir do parent
                    issuetype_id = self.sub_bug_type_id
            except Exception:
                # Se falhar ao buscar parent, usar ID configurado
                issuetype_id = self.sub_bug_type_id
        else:
            issuetype_id = self.bug_type_id
        
        # Converter descrição para ADF se for string
        if isinstance(description, str):
            adf_description = self._text_to_adf(description)
        else:
            adf_description = description
        
        # Montar payload mínimo (sem campos opcionais)
        payload = {
            "fields": {
                "project": {"key": project_key},
                "issuetype": {"id": issuetype_id},
                "summary": summary,
                "description": adf_description
            }
        }
        
        # Adicionar parent se for Sub-Bug
        if issue_type == "sub_bug" and parent_key:
            payload["fields"]["parent"] = {"key": parent_key}
        
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
            
            # Melhorar mensagem de erro se for problema com Issue Type
            error_detail = errors or error_messages
            
            if isinstance(errors, dict) and "issuetype" in errors:
                issuetype_error = errors.get("issuetype", "")
                if isinstance(issuetype_error, str):
                    # Mensagem mais amigável para erro de Issue Type
                    if issue_type == "sub_bug":
                        error_detail = (
                            f"O projeto '{project_key}' não aceita criar Sub-Bug com o Issue Type ID '{issuetype_id}'. "
                            f"Este projeto pode aceitar apenas o tipo padrão de 'Subtarefa'. "
                            f"Erro do Jira: {issuetype_error}. "
                            f"Verifique se o Issue Type está configurado corretamente no .env (JIRA_SUB_BUG_ISSUE_TYPE_ID) "
                            f"ou se o projeto aceita esse tipo de issue."
                        )
                    else:
                        error_detail = (
                            f"O projeto '{project_key}' não aceita criar Bug com o Issue Type ID '{issuetype_id}'. "
                            f"Erro do Jira: {issuetype_error}. "
                            f"Verifique se o Issue Type está configurado corretamente no .env (JIRA_BUG_ISSUE_TYPE_ID)."
                        )
                else:
                    error_detail = f"Issue Type ID '{issuetype_id}' inválido para o projeto '{project_key}'. Erro: {issuetype_error}"
            
            raise ValueError(f"Erro ao criar {issue_type}: {error_detail}")
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
    
    def upload_attachments(
        self,
        issue_key: str,
        files: list[tuple[str, bytes, str]]
    ) -> list[dict]:
        """
        Faz upload de anexos para uma issue do Jira.
        
        Args:
            issue_key: Chave da issue (ex: "PKGS-1234")
            files: Lista de tuplas (filename, file_content, content_type)
        
        Returns:
            Lista de dicts com informações dos anexos enviados
        """
        if not files:
            return []
        
        url = f"{self.base_url}/rest/api/3/issue/{issue_key}/attachments"
        
        # Headers específicos para upload de anexos
        headers = {
            "Accept": "application/json",
            "X-Atlassian-Token": "no-check",  # Obrigatório para bypass XSRF
            "Authorization": f"Basic {self.auth_header}"
        }
        
        # Preparar FormData
        files_data = []
        for filename, content, content_type in files:
            files_data.append(
                ("file", (filename, content, content_type))
            )
        
        response = requests.post(
            url,
            headers=headers,
            files=files_data,
            timeout=self.timeout
        )
        
        if response.status_code == 400:
            error_data = response.json()
            errors = error_data.get("errors", {})
            error_messages = error_data.get("errorMessages", [])
            raise ValueError(f"Erro ao fazer upload de anexos: {errors or error_messages}")
        if response.status_code == 401:
            raise PermissionError("Token de API do Jira inválido ou expirado.")
        if response.status_code == 403:
            raise PermissionError("Sem permissão para anexar arquivos nesta issue.")
        
        response.raise_for_status()
        
        return response.json()
    
    def search_subtasks(
        self,
        parent_key: str,
        fields: Optional[list[str]] = None,
        max_results: int = 100
    ) -> dict:
        """
        Busca todas as subtasks de uma issue pai usando JQL.
        
        Args:
            parent_key: Chave da issue pai (ex: "PKGS-1160")
            fields: Lista de campos a retornar (default: ["issuetype", "summary", "assignee", "status"])
            max_results: Número máximo de resultados (default: 100)
        
        Returns:
            dict com:
            - issues: Lista de subtasks encontradas
            - total: Total de subtasks encontradas
            - maxResults: Número máximo de resultados solicitados
        """
        if fields is None:
            fields = ["issuetype", "summary", "assignee", "status"]
        
        # Montar JQL query
        jql = f"parent = {parent_key} ORDER BY created ASC"
        
        # Montar payload
        payload = {
            "jql": jql,
            "fields": fields,
            "maxResults": max_results
        }
        
        url = f"{self.base_url}/rest/api/3/search/jql"
        
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
            raise ValueError(f"Erro na busca JQL: {errors or error_messages}")
        if response.status_code == 401:
            raise PermissionError("Token de API do Jira inválido ou expirado.")
        if response.status_code == 403:
            raise PermissionError("Sem permissão para buscar issues neste projeto.")
        
        response.raise_for_status()
        
        data = response.json()
        
        # Processar issues retornadas
        processed_issues = []
        for issue in data.get("issues", []):
            processed_issue = {
                "key": issue.get("key"),
                "self": issue.get("self"),
                "url": f"{self.base_url}/browse/{issue.get('key')}",
                "fields": self._parse_subtask_fields(issue.get("fields", {}))
            }
            processed_issues.append(processed_issue)
        
        return {
            "issues": processed_issues,
            "total": data.get("total", 0),
            "maxResults": data.get("maxResults", max_results)
        }
    
    def _parse_subtask_fields(self, fields: dict) -> dict:
        """
        Processa campos de uma subtask retornada pela busca JQL.
        
        Args:
            fields: Dict com campos brutos do Jira
        
        Returns:
            Dict com campos processados
        """
        parsed = {}
        
        # Issue Type
        if "issuetype" in fields:
            issuetype = fields["issuetype"]
            parsed["issuetype"] = issuetype.get("name", "N/A") if isinstance(issuetype, dict) else str(issuetype)
        
        # Summary
        if "summary" in fields:
            parsed["summary"] = fields["summary"] or "Sem título"
        
        # Assignee
        if "assignee" in fields:
            assignee = fields["assignee"]
            if assignee:
                parsed["assignee"] = {
                    "displayName": assignee.get("displayName", "N/A"),
                    "emailAddress": assignee.get("emailAddress", "")
                }
            else:
                parsed["assignee"] = None
        
        # Status
        if "status" in fields:
            status = fields["status"]
            parsed["status"] = status.get("name", "N/A") if isinstance(status, dict) else str(status)
        
        return parsed
    
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
