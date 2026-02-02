# backend/utils/date_range_utils.py

"""
Utilitários para resolução e validação de períodos do Dashboard QA.
Timezone: America/Sao_Paulo.
"""

from datetime import date, datetime
from typing import Optional, Tuple, List, Any, Callable
from zoneinfo import ZoneInfo

from dateutil.relativedelta import relativedelta

TIMEZONE = ZoneInfo("America/Sao_Paulo")


def _today() -> date:
    """Data de hoje no timezone America/Sao_Paulo."""
    return datetime.now(TIMEZONE).date()


def validate_custom_range(
    start_date: date,
    end_date: date,
    limit_months: int = 3
) -> None:
    """
    Valida intervalo personalizado: start <= end, período máximo de limit_months meses (calendário)
    e período sempre no passado (endDate não pode ser data futura).
    Regra: end deve ser estritamente anterior a start + limit_months (ex: start 2026-01-15 → end <= 2026-04-14).
    Raises:
        ValueError: se start > end, período exceder limit_months ou endDate for data futura.
    """
    if start_date > end_date:
        raise ValueError("startDate deve ser menor ou igual a endDate.")
    today = _today()
    if end_date > today:
        raise ValueError(
            f"Período não pode incluir datas futuras. endDate deve ser menor ou igual à data atual ({today.isoformat()})."
        )
    limit_end = start_date + relativedelta(months=limit_months)
    if end_date >= limit_end:
        raise ValueError(
            f"Período personalizado excede o limite de {limit_months} meses. "
            f"startDate={start_date.isoformat()} permite endDate até {(limit_end - relativedelta(days=1)).isoformat()}."
        )


def list_days(start_date: date, end_date: date) -> List[str]:
    """Retorna lista de dias no intervalo [start_date, end_date] (inclusive) no formato YYYY-MM-DD."""
    if start_date > end_date:
        return []
    days: List[str] = []
    current = start_date
    while current <= end_date:
        days.append(current.isoformat())
        current += relativedelta(days=1)
    return days


def resolve_month_current() -> Tuple[str, str, dict]:
    """
    Retorna (start_date, end_date, meta) para o mês atual.
    startDate = primeiro dia do mês, endDate = hoje (America/Sao_Paulo).
    """
    today = _today()
    start = today.replace(day=1)
    return (
        start.isoformat(),
        today.isoformat(),
        {"source": "month_current", "timezone": "America/Sao_Paulo"}
    )


def resolve_custom(start_date_str: str, end_date_str: str) -> Tuple[str, str, dict]:
    """
    Valida e retorna (start_date, end_date, meta) para período custom.
    Raises ValueError se exceder 3 meses ou start > end.
    Aceita datas no formato YYYY-MM-DD ou ISO com hora (usa apenas a parte da data).
    """
    start = date.fromisoformat(start_date_str.strip()[:10])
    end = date.fromisoformat(end_date_str.strip()[:10])
    validate_custom_range(start, end, limit_months=3)
    return (
        start.isoformat(),
        end.isoformat(),
        {"source": "custom", "timezone": "America/Sao_Paulo"}
    )


def resolve_sprint_current(
    project_key: str,
    get_sprint_dates: Callable[[str], Tuple[str, str, Any]]
) -> Tuple[str, str, dict]:
    """
    Obtém (start_date, end_date, meta) para sprint atual do projeto.
    get_sprint_dates(project_key) deve retornar (start_str, end_str, sprint_info) ou levantar exceção.
    """
    start_str, end_str, sprint_info = get_sprint_dates(project_key)
    meta = {"source": "jira_sprint_active", "timezone": "America/Sao_Paulo", "sprint": sprint_info}
    return (start_str, end_str, meta)


def resolve_sprint_previous(
    project_key: str,
    get_sprint_previous_dates: Callable[[str], Tuple[str, str, Any]]
) -> Tuple[str, str, dict]:
    """
    Obtém (start_date, end_date, meta) para última sprint fechada do projeto.
    get_sprint_previous_dates(project_key) deve retornar (start_str, end_str, sprint_info) ou levantar exceção.
    """
    start_str, end_str, sprint_info = get_sprint_previous_dates(project_key)
    meta = {"source": "jira_sprint_closed", "timezone": "America/Sao_Paulo", "sprint": sprint_info}
    return (start_str, end_str, meta)


def resolve_period(
    period_type: str,
    custom_start: Optional[str] = None,
    custom_end: Optional[str] = None,
    project_key: Optional[str] = None,
    get_sprint_dates: Optional[Callable[[str], Tuple[str, str, Any]]] = None,
    get_sprint_previous_dates: Optional[Callable[[str], Tuple[str, str, Any]]] = None
) -> Tuple[str, str, dict]:
    """
    Resolve período conforme type.
    - month_current: ignora custom e project_key.
    - custom: exige custom_start e custom_end; valida até 3 meses.
    - sprint_current: exige project_key e get_sprint_dates; chama get_sprint_dates(project_key).
    - sprint_previous: exige project_key e get_sprint_previous_dates; última sprint fechada.

    Returns:
        (start_date_str, end_date_str, meta_dict).

    Raises:
        ValueError: para custom inválido ou sprint indisponível.
    """
    if period_type == "month_current":
        return resolve_month_current()
    if period_type == "custom":
        if not custom_start or not custom_end:
            raise ValueError("startDate e endDate são obrigatórios para período custom.")
        return resolve_custom(custom_start, custom_end)
    if period_type == "sprint_current":
        if not project_key or not get_sprint_dates:
            raise ValueError("projectKey e get_sprint_dates são necessários para sprint_current.")
        return resolve_sprint_current(project_key, get_sprint_dates)
    if period_type == "sprint_previous":
        if not project_key or not get_sprint_previous_dates:
            raise ValueError("projectKey e get_sprint_previous_dates são necessários para sprint_previous.")
        return resolve_sprint_previous(project_key, get_sprint_previous_dates)
    raise ValueError(f"Tipo de período inválido: {period_type}. Use month_current, custom, sprint_current ou sprint_previous.")
