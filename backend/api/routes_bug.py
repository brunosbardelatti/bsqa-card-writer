# backend/api/routes_bug.py

import json
from base64 import b64decode
from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, List
import re

from backend.services.issue_tracker_factory import get_issue_tracker
from backend.services.ia_factory import get_ia_service
from backend.utils.prompt_loader import load_prompt_template
from backend.utils.jira_utils import validate_card_number

router = APIRouter(prefix="/bug", tags=["Bug Creation"])


def decode_jira_auth(auth_header: Optional[str], base_url_header: Optional[str] = None) -> Optional[dict]:
    """Decodifica o header X-Jira-Auth (Base64 de email:token) e retorna dict de credenciais."""
    if not auth_header:
        return None
    try:
        decoded = b64decode(auth_header).decode("utf-8")
        if ":" not in decoded:
            return None
        email, api_token = decoded.split(":", 1)
        return {
            "base_url": base_url_header.rstrip("/") if base_url_header else None,
            "email": email,
            "api_token": api_token,
        }
    except Exception:
        return None


# ============================================
# SCHEMAS
# ============================================

class BugCreationRequest(BaseModel):
    issue_type: str = Field(..., description="Tipo: 'bug' ou 'sub_bug'")
    project_key: str = Field(..., description="Chave do projeto (ex: PKGS)")
    description: str = Field(..., description="Descrição livre do problema")
    parent_key: Optional[str] = Field(None, description="Chave da issue pai (obrigatório para sub_bug)")
    ai_service: str = Field(..., description="Serviço de IA (openai ou stackspot)")
    
    @validator('issue_type')
    def validate_issue_type(cls, v):
        if v.lower() not in ['bug', 'sub_bug']:
            raise ValueError('issue_type deve ser "bug" ou "sub_bug"')
        return v.lower()
    
    @validator('parent_key')
    def validate_parent_key(cls, v, values):
        if values.get('issue_type') == 'sub_bug' and not v:
            raise ValueError('parent_key é obrigatório para sub_bug')
        if v and not validate_card_number(v):
            raise ValueError('Formato inválido de parent_key. Use: PROJETO-NUMERO')
        return v.upper().strip() if v else None
    
    @validator('project_key')
    def validate_project_key(cls, v):
        if not re.match(r'^[A-Z]+$', v):
            raise ValueError('project_key deve conter apenas letras maiúsculas')
        return v.upper().strip()

# ============================================
# ENDPOINTS
# ============================================

@router.post("/create")
async def create_bug(
    issue_type: str = Form(...),
    project_key: str = Form(...),
    description: str = Form(...),
    parent_key: Optional[str] = Form(None),
    ai_service: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    ia_credentials: Optional[str] = Form(None),
    x_jira_auth: Optional[str] = Header(None, alias="X-Jira-Auth"),
    x_jira_base_url: Optional[str] = Header(None, alias="X-Jira-Base-Url"),
):
    """
    Cria um Bug ou Sub-Bug no Jira com descrição organizada por IA.
    Credenciais via headers X-Jira-Auth e X-Jira-Base-Url ou .env.
    Processo em 4 etapas:
    1. Validar parent_key (se Sub-Bug) - verificar se existe
    2. Enviar descrição para IA organizar
    3. Criar issue no Jira
    4. Fazer upload de anexos (se houver)
    """
    result = {
        "success": True,
        "steps": {
            "parent_validation": {"success": False},
            "ia_organization": {"success": False},
            "issue_created": {"success": False},
            "attachments_uploaded": {"success": False}
        }
    }

    # Validar dados usando o schema
    try:
        request = BugCreationRequest(
            issue_type=issue_type,
            project_key=project_key,
            description=description,
            parent_key=parent_key,
            ai_service=ai_service
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    credentials = decode_jira_auth(x_jira_auth, x_jira_base_url)
    jira = get_issue_tracker("jira", skip_env_validation=True) if credentials else get_issue_tracker("jira")

    # Step 1: Validar parent_key se for Sub-Bug
    if request.issue_type == "sub_bug":
        try:
            # Validar se a issue pai existe
            parent_issue = jira.get_issue(request.parent_key, ["summary"], credentials=credentials) if credentials else jira.get_issue(request.parent_key, ["summary"])
            result["steps"]["parent_validation"] = {
                "success": True,
                "data": {
                    "key": parent_issue["key"],
                    "summary": parent_issue["fields"].get("summary", "")
                }
            }
        except Exception as e:
            result["success"] = False
            result["steps"]["parent_validation"] = {
                "success": False,
                "error": "Issue pai não encontrada ou inválida",
                "detail": str(e)
            }
            return JSONResponse(status_code=400, content=result)
    
    credentials_ia = None
    if ia_credentials and ia_credentials.strip():
        try:
            credentials_ia = json.loads(ia_credentials)
        except json.JSONDecodeError:
            pass
    try:
        # Step 2: Organizar descrição com IA
        prompt_template = load_prompt_template("sub_bug_writer")
        prompt = prompt_template.format(requirements=request.description)
        
        ia_service = get_ia_service(request.ai_service, credentials=credentials_ia)
        ia_result = ia_service.generate_response(prompt)
        
        # Extrair mensagem se for dict (StackSpot)
        if isinstance(ia_result, dict):
            ia_result = ia_result.get("message", str(ia_result))
        
        # Extrair título e descrição do resultado da IA
        # A IA retorna o formato completo, precisamos extrair título e descrição
        organized_data = parse_ia_bug_response(ia_result)
        
        result["steps"]["ia_organization"] = {
            "success": True,
            "result": ia_result,
            "parsed": organized_data
        }
        
    except Exception as e:
        result["success"] = False
        result["steps"]["ia_organization"] = {
            "success": False,
            "error": "Erro ao processar com IA",
            "detail": str(e)
        }
        return JSONResponse(status_code=500, content=result)
    
    try:
        # Step 3: Criar issue no Jira
        issue_data = jira.create_bug(
            project_key=request.project_key,
            summary=organized_data["summary"],
            description=organized_data["description"],
            issue_type=request.issue_type,
            parent_key=request.parent_key,
            credentials=credentials,
        )
        
        result["steps"]["issue_created"] = {
            "success": True,
            "data": issue_data
        }
        
    except Exception as e:
        result["success"] = False
        result["steps"]["issue_created"] = {
            "success": False,
            "error": "Erro ao criar issue no Jira",
            "detail": str(e)
        }
        return JSONResponse(status_code=500, content=result)
    
    # Step 4: Upload de anexos (se houver)
    if files and len(files) > 0:
        try:
            # Preparar arquivos para upload
            files_data = []
            for file in files:
                content = await file.read()
                files_data.append((
                    file.filename,
                    content,
                    file.content_type or "application/octet-stream"
                ))
            
            attachments = jira.upload_attachments(
                issue_key=issue_data["key"],
                files=files_data,
                credentials=credentials,
            )
            
            result["steps"]["attachments_uploaded"] = {
                "success": True,
                "count": len(attachments),
                "attachments": attachments
            }
            
        except Exception as e:
            # Não falhar se upload de anexos falhar, apenas registrar
            result["steps"]["attachments_uploaded"] = {
                "success": False,
                "error": "Erro ao fazer upload de anexos",
                "detail": str(e)
            }
    else:
        result["steps"]["attachments_uploaded"] = {
            "success": True,
            "skipped": True,
            "message": "Nenhum anexo enviado"
        }
    
    return result

def parse_ia_bug_response(ia_result: str) -> dict:
    """
    Extrai título e descrição do resultado formatado pela IA.
    A IA retorna o formato completo do Sub-Bug conforme template, precisamos extrair:
    - Título: Linha que começa com "Title of the Card:" (remover prefixo e colchetes se houver)
    - Descrição: Todo o restante do conteúdo (incluindo Description:, Context, Reproduction, etc.)
    
    Formato esperado da IA:
    Title of the Card: [Feature] - Descrição curta
    Description:
    Context: ...
    Reproduction: ...
    ...
    """
    lines = ia_result.split('\n')
    
    summary = ""
    description_lines = []
    found_title = False
    skip_empty_after_title = True
    
    for i, line in enumerate(lines):
        # Procurar por "Title of the Card:" ou "Title:"
        if line.startswith("Title of the Card:") or line.startswith("Title:"):
            # Extrair título (remover prefixo)
            title_text = line.split(":", 1)[1].strip()
            # Remover colchetes se houver (ex: "[Feature] - Descrição" -> "Feature - Descrição")
            # Mas manter o formato se não tiver colchetes
            summary = title_text
            found_title = True
            skip_empty_after_title = True
        elif found_title:
            # Pular linha vazia logo após o título (se houver)
            if skip_empty_after_title and not line.strip():
                skip_empty_after_title = False
                continue
            skip_empty_after_title = False
            # Tudo após o título é descrição (incluindo "Description:", "Context:", etc.)
            description_lines.append(line)
    
    # Se não encontrou título, usar primeira linha ou "Bug encontrado"
    if not summary:
        summary = lines[0].strip() if lines else "[BUG] Bug encontrado"
        description_lines = lines[1:] if len(lines) > 1 else []
    
    description = "\n".join(description_lines).strip()
    
    # Se descrição estiver vazia, usar o resultado completo como fallback
    if not description:
        description = ia_result.strip()
    
    return {
        "summary": summary,
        "description": description
    }
