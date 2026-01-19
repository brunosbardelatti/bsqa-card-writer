# backend/api/routes_jira.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing import Optional, List
import re

from backend.services.issue_tracker_factory import get_issue_tracker
from backend.services.ia_factory import get_ia_service
from backend.utils.prompt_loader import load_prompt_template
from backend.utils.jira_utils import validate_card_number, parse_ia_response

router = APIRouter(prefix="/jira", tags=["Jira Integration"])

# ============================================
# SCHEMAS
# ============================================

class CardQueryRequest(BaseModel):
    card_number: str = Field(..., description="Número do card (ex: PKGS-1104)")
    fields: Optional[List[str]] = Field(
        default=["summary", "description"],
        description="Campos a retornar"
    )
    
    @validator('card_number')
    def validate_card_format(cls, v):
        if not validate_card_number(v):
            raise ValueError('Formato inválido. Use: PROJETO-NUMERO (ex: PKGS-1104)')
        return v.upper().strip()

class CardWithAIRequest(BaseModel):
    card_number: str = Field(..., description="Número do card (ex: PKGS-1104)")
    fields: Optional[List[str]] = Field(
        default=["summary", "description"],
        description="Campos a retornar"
    )
    ai_service: str = Field(..., description="Serviço de IA (openai ou stackspot)")
    create_subtask: bool = Field(default=True, description="Criar subtask automaticamente")
    
    @validator('card_number')
    def validate_card_format(cls, v):
        if not validate_card_number(v):
            raise ValueError('Formato inválido. Use: PROJETO-NUMERO (ex: PKGS-1104)')
        return v.upper().strip()
    
    @validator('ai_service')
    def validate_ai_service(cls, v):
        if v.lower() not in ['openai', 'stackspot']:
            raise ValueError('Serviço de IA deve ser "openai" ou "stackspot"')
        return v.lower()

# ============================================
# ENDPOINTS
# ============================================

@router.get("/fields")
async def get_available_fields():
    """Retorna os campos disponíveis para consulta no Jira."""
    try:
        jira = get_issue_tracker("jira")
        return {"fields": jira.get_available_fields()}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/card")
async def query_card(request: CardQueryRequest):
    """Consulta um card no Jira pelo número."""
    try:
        jira = get_issue_tracker("jira")
        data = jira.get_issue(request.card_number, request.fields)
        return {"success": True, "data": data}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao consultar card: {str(e)}")

@router.post("/card-with-ai")
async def query_card_with_ai(request: CardWithAIRequest):
    """Consulta card, envia para IA, e cria subtask automaticamente."""
    result = {
        "success": True,
        "steps": {
            "jira_query": {"success": False},
            "ia_analysis": {"success": False},
            "subtask_created": {"success": False}
        }
    }
    
    try:
        # Step 1: Consultar card no Jira
        jira = get_issue_tracker("jira")
        card_data = jira.get_issue(request.card_number, request.fields)
        result["steps"]["jira_query"] = {"success": True, "data": card_data}
        
    except Exception as e:
        result["success"] = False
        result["steps"]["jira_query"] = {
            "success": False,
            "error": "Erro ao consultar Jira",
            "detail": str(e)
        }
        return result
    
    try:
        # Step 2: Enviar para IA (usar template Card QA Writer)
        prompt_template = load_prompt_template("card_QA_writer")
        
        # Montar conteúdo para a IA
        card_content = f"""
Título: {card_data['fields'].get('summary', 'N/A')}

Descrição:
{card_data['fields'].get('description', 'N/A')}
"""
        
        prompt = prompt_template.format(requirements=card_content)
        
        ia_service = get_ia_service(request.ai_service)
        ia_result = ia_service.generate_response(prompt)
        
        # Extrair mensagem se for dict (StackSpot)
        if isinstance(ia_result, dict):
            ia_result = ia_result.get("message", str(ia_result))
        
        # Separar título e descrição
        title, description = parse_ia_response(ia_result, request.card_number)
        
        result["steps"]["ia_analysis"] = {
            "success": True,
            "result": ia_result,
            "parsed": {
                "title": title,
                "description": description
            }
        }
        
    except Exception as e:
        result["success"] = False
        result["steps"]["ia_analysis"] = {
            "success": False,
            "error": "Erro ao processar com IA",
            "detail": str(e)
        }
        return result
    
    # Step 3: Criar subtask (se solicitado)
    if request.create_subtask:
        try:
            subtask_data = jira.create_subtask(
                parent_key=request.card_number,
                summary=title,
                description=description
            )
            result["steps"]["subtask_created"] = {"success": True, "data": subtask_data}
            
        except Exception as e:
            result["success"] = False
            result["steps"]["subtask_created"] = {
                "success": False,
                "error": "Erro ao criar subtask",
                "detail": str(e)
            }
    else:
        result["steps"]["subtask_created"] = {
            "success": True,
            "skipped": True,
            "message": "Criação de subtask não solicitada"
        }
    
    return result

@router.post("/test-connection")
async def test_jira_connection():
    """Testa a conexão com o Jira."""
    try:
        jira = get_issue_tracker("jira")
        return jira.test_connection()
    except RuntimeError as e:
        return {
            "success": False,
            "error": "Configuração incompleta",
            "detail": str(e)
        }
    except Exception as e:
        return {
            "success": False,
            "error": "Erro inesperado",
            "detail": str(e)
        }
