# backend/api/routes_dashboard.py

from typing import Optional, Literal

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator

from backend.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard QA"])

# ============================================
# SCHEMAS
# ============================================


class PeriodPayload(BaseModel):
    """Período para filtro do dashboard."""
    type: Literal["month_current", "sprint_current", "custom"] = Field(
        ..., description="Tipo de período"
    )
    startDate: Optional[str] = Field(None, description="Data inicial (obrigatório se type=custom)")
    endDate: Optional[str] = Field(None, description="Data final (obrigatório se type=custom)")

    @validator("startDate")
    def start_required_for_custom(cls, v, values):
        if values.get("type") == "custom" and not v:
            raise ValueError("startDate é obrigatório quando period.type=custom")
        return v

    @validator("endDate")
    def end_required_for_custom(cls, v, values):
        if values.get("type") == "custom" and not v:
            raise ValueError("endDate é obrigatório quando period.type=custom")
        return v


class DashboardRequest(BaseModel):
    """Request do endpoint POST /dashboard."""
    action: Literal["projects", "dashboard"] = Field(..., description="Ação: projects ou dashboard")
    projectKey: Optional[str] = Field(None, description="Chave do projeto (obrigatório se action=dashboard)")
    period: Optional[PeriodPayload] = Field(None, description="Período (obrigatório se action=dashboard)")

    @validator("projectKey", always=True)
    def validate_project_key_for_dashboard(cls, v, values):
        if values.get("action") == "dashboard" and not v:
            raise ValueError("projectKey é obrigatório quando action=dashboard")
        return v

    @validator("period", always=True)
    def validate_period_for_dashboard(cls, v, values):
        if values.get("action") == "dashboard" and not v:
            raise ValueError("period é obrigatório quando action=dashboard")
        return v


# ============================================
# ENDPOINTS
# ============================================


def _error_response(code: str, message: str, status_code: int = 400, details: Optional[dict] = None):
    """Resposta padronizada de erro."""
    body = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            **({"details": details} if details else {})
        }
    }
    return JSONResponse(status_code=status_code, content=body)


@router.post("")
async def dashboard_post(request: DashboardRequest):
    """
    POST /dashboard — Endpoint único.
    - action=projects: retorna lista de projetos para dropdown (ordenada por name).
    - action=dashboard: retorna métricas e séries do dashboard (implementado em fase posterior).
    """
    if request.action == "projects":
        try:
            service = DashboardService()
            projects = service.get_projects()
            return {
                "success": True,
                "data": {"projects": projects}
            }
        except PermissionError as e:
            return _error_response(
                "PROJECT_NOT_ACCESSIBLE",
                str(e),
                status_code=401
            )
        except RuntimeError as e:
            return _error_response(
                "JIRA_CONFIG_ERROR",
                str(e),
                status_code=500
            )
        except Exception as e:
            return _error_response(
                "UNEXPECTED_ERROR",
                f"Erro ao listar projetos: {str(e)}",
                status_code=500
            )

    if request.action == "dashboard":
        period = request.period
        try:
            service = DashboardService()
            payload = service.get_dashboard(
                project_key=request.projectKey or "",
                period_type=period.type,
                custom_start=period.startDate,
                custom_end=period.endDate,
            )
            return {
                "success": True,
                "data": payload,
            }
        except ValueError as e:
            msg = str(e)
            if "Sprint" in msg or "sprint" in msg:
                return _error_response(
                    "SPRINT_NOT_AVAILABLE",
                    "Sprint atual indisponível para o projeto informado.",
                    status_code=422,
                    details={"detail": msg},
                )
            return _error_response(
                "INVALID_PERIOD",
                msg,
                status_code=422,
            )
        except PermissionError as e:
            return _error_response("PROJECT_NOT_ACCESSIBLE", str(e), status_code=401)
        except RuntimeError as e:
            return _error_response("JIRA_CONFIG_ERROR", str(e), status_code=500)
        except Exception as e:
            return _error_response(
                "UNEXPECTED_ERROR",
                f"Erro no dashboard: {str(e)}",
                status_code=500,
            )

    return _error_response("INVALID_ACTION", "action deve ser 'projects' ou 'dashboard'", status_code=400)


# ============================================
# POST /dashboard/status-time (e /dashboard/statusTime para compatibilidade)
# ============================================


class StatusTimeRequest(BaseModel):
    """Request do endpoint POST /dashboard/status-time."""
    projectKey: str = Field(..., description="Chave do projeto")
    period: PeriodPayload = Field(..., description="Período (month_current, sprint_current ou custom)")


@router.post("/status-time")
@router.post("/statusTime")
async def dashboard_status_time(request: StatusTimeRequest):
    """
    POST /dashboard/status-time — Dados para tabela e resumo Status Time.
    Issues que já passaram por QA; tempo em Ready to test e In Test (changelog).
    Chamar apenas quando o usuário abrir a seção Status Time (pode ser lento).
    """
    try:
        service = DashboardService()
        payload = service.get_status_time(
            project_key=request.projectKey,
            period_type=request.period.type,
            custom_start=request.period.startDate,
            custom_end=request.period.endDate,
        )
        return {
            "success": True,
            "data": payload,
        }
    except ValueError as e:
        msg = str(e)
        if "Sprint" in msg or "sprint" in msg:
            return _error_response(
                "SPRINT_NOT_AVAILABLE",
                "Sprint atual indisponível para o projeto informado.",
                status_code=422,
                details={"detail": msg},
            )
        return _error_response("INVALID_PERIOD", msg, status_code=422)
    except PermissionError as e:
        return _error_response("PROJECT_NOT_ACCESSIBLE", str(e), status_code=401)
    except RuntimeError as e:
        return _error_response("JIRA_CONFIG_ERROR", str(e), status_code=500)
    except Exception as e:
        return _error_response(
            "UNEXPECTED_ERROR",
            f"Erro no Status Time: {str(e)}",
            status_code=500,
        )
