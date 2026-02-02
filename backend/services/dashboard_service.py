# backend/services/dashboard_service.py

import logging
import time as time_module
from collections import defaultdict
from datetime import date, datetime
from typing import List, Optional

from backend.services.issue_tracker_factory import get_issue_tracker
from dateutil.parser import parse as dateutil_parse

from backend.utils.date_range_utils import resolve_period, list_days, TIMEZONE
from backend.utils.jql_builder import build_defects_base_jql, build_status_time_jql

logger = logging.getLogger(__name__)

# Nomes exatos do Jira para classificação
ISSUE_TYPE_BUG = "Bug"
ISSUE_TYPE_SUB_BUG = "Sub-Bug"
STATUS_CANCELED = "Cancelado"  # Status em português no Jira

# Status considerados "fechados" para contagem de breakdown
STATUS_CLOSED = [
    "Applied in production",
    "Concluído",
    "Done",
    "Resolved",
    "Closed",
]

# Status Time: statuses em que acumulamos tempo (Ready to test, In Test)
STATUS_TIME_TARGET = ["Ready to test", "In Test"]
MAX_ISSUES_STATUS_TIME = 100


def _created_to_day_br(created_iso: str) -> Optional[str]:
    """Converte created (ISO do Jira) para data YYYY-MM-DD no timezone America/Sao_Paulo."""
    if not created_iso or not created_iso.strip():
        return None
    try:
        dt = dateutil_parse(created_iso.strip())
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=TIMEZONE)
        else:
            dt = dt.astimezone(TIMEZONE)
        return dt.date().isoformat()
    except Exception:
        return None


def _parse_iso_to_ms(iso_str: str) -> Optional[int]:
    """Converte string ISO do Jira para timestamp em ms; retorna None se inválido."""
    if not iso_str or not str(iso_str).strip():
        return None
    try:
        dt = dateutil_parse(iso_str.strip())
        return int(dt.timestamp() * 1000)
    except Exception:
        return None


def _calc_time_in_statuses(
    created_iso: str,
    changelog_parsed: list,
    target_statuses: List[str],
) -> dict:
    """
    Calcula tempo (em ms) que a issue passou em cada status alvo, com base no changelog.
    changelog_parsed: lista de { "created", "items" } (items com field, from, to).
    Retorna dict status_name -> ms (apenas para status em target_statuses).
    """
    totals = {s: 0 for s in target_statuses}
    created_ms = _parse_iso_to_ms(created_iso)
    if created_ms is None:
        return totals

    # Extrair transições de status em ordem cronológica
    status_changes = []
    for history in changelog_parsed or []:
        created_at = history.get("created") or ""
        at_ms = _parse_iso_to_ms(created_at)
        if at_ms is None:
            continue
        for item in history.get("items") or []:
            if (item.get("field") or "").strip().lower() != "status":
                continue
            from_str = (item.get("from") or "").strip()
            to_str = (item.get("to") or "").strip()
            status_changes.append({"at": at_ms, "from": from_str, "to": to_str})
    status_changes.sort(key=lambda x: x["at"])

    if not status_changes:
        return totals

    current_status = status_changes[0]["from"]
    interval_start = created_ms
    now_ms = int(datetime.now(TIMEZONE).timestamp() * 1000)

    for change in status_changes:
        interval_end = change["at"]
        if current_status in target_statuses:
            totals[current_status] = totals.get(current_status, 0) + (interval_end - interval_start)
        current_status = change["to"]
        interval_start = interval_end

    if current_status in target_statuses:
        totals[current_status] = totals.get(current_status, 0) + (now_ms - interval_start)

    return totals


class DashboardService:
    """Serviço de lógica de negócio do Dashboard de Performance QA."""

    def get_projects(self) -> List[dict]:
        """
        Retorna lista de projetos disponíveis para o usuário (não arquivados).
        Ordenação alfabética por name é feita no jira_service.
        """
        jira = get_issue_tracker("jira")
        projects = jira.project_search_all()
        return [{"id": p["id"], "key": p["key"], "name": p["name"]} for p in projects]

    def get_dashboard_period(
        self,
        project_key: str,
        period_type: str,
        custom_start: Optional[str] = None,
        custom_end: Optional[str] = None,
    ) -> dict:
        """
        Resolve o período (start/end) conforme type e retorna payload mínimo:
        project + period (timezone, startDate, endDate, source, sprint?).
        Raises ValueError para período inválido ou sprint indisponível.
        """
        jira = get_issue_tracker("jira")

        def get_sprint_dates(pk: str):
            return jira.get_sprint_current_dates(pk)

        def get_sprint_previous_dates(pk: str):
            return jira.get_sprint_previous_dates(pk)

        start_date, end_date, meta = resolve_period(
            period_type=period_type,
            custom_start=custom_start,
            custom_end=custom_end,
            project_key=project_key,
            get_sprint_dates=get_sprint_dates,
            get_sprint_previous_dates=get_sprint_previous_dates,
        )

        period_payload = {
            "type": period_type,
            "timezone": meta.get("timezone", "America/Sao_Paulo"),
            "startDate": start_date,
            "endDate": end_date,
            "source": meta.get("source", period_type),
        }
        if "sprint" in meta:
            period_payload["sprint"] = meta["sprint"]

        return {
            "project": {"key": project_key},
            "period": period_payload,
        }

    def get_dashboard(
        self,
        project_key: str,
        period_type: str,
        custom_start: Optional[str] = None,
        custom_end: Optional[str] = None,
    ) -> dict:
        """
        Retorna DTO completo do dashboard: project, period, metrics, series, meta.
        Uma única busca JQL paginada; agregação e cálculos no backend.
        """
        import time
        t0 = time.perf_counter()
        jira = get_issue_tracker("jira")

        def get_sprint_dates(pk: str):
            return jira.get_sprint_current_dates(pk)

        def get_sprint_previous_dates(pk: str):
            return jira.get_sprint_previous_dates(pk)

        start_date_str, end_date_str, meta = resolve_period(
            period_type=period_type,
            custom_start=custom_start,
            custom_end=custom_end,
            project_key=project_key,
            get_sprint_dates=get_sprint_dates,
            get_sprint_previous_dates=get_sprint_previous_dates,
        )

        period_payload = {
            "type": period_type,
            "timezone": meta.get("timezone", "America/Sao_Paulo"),
            "startDate": start_date_str,
            "endDate": end_date_str,
            "source": meta.get("source", period_type),
        }
        if "sprint" in meta:
            period_payload["sprint"] = meta["sprint"]

        jql = build_defects_base_jql(project_key, start_date_str, end_date_str)
        issues = jira.search_issues_paginated(jql, ["issuetype", "status", "created"])

        start_d = date.fromisoformat(start_date_str)
        end_d = date.fromisoformat(end_date_str)
        days = list_days(start_d, end_d)

        production_bugs_valid = 0
        total_defects_valid = 0
        total_reported = 0
        sub_bugs_valid = 0
        bugs_valid = 0
        
        # Contadores para breakdown (fechados/abertos)
        sub_bugs_closed = 0
        sub_bugs_open = 0
        bugs_closed = 0
        bugs_open = 0

        daily_prod_bugs: dict[str, int] = defaultdict(int)
        daily_total_valid: dict[str, int] = defaultdict(int)
        daily_valid: dict[str, int] = defaultdict(int)
        daily_reported: dict[str, int] = defaultdict(int)

        days_set = set(days)
        for issue in issues:
            it = (issue.get("issuetype") or "").strip()
            st = (issue.get("status") or "").strip()
            created = issue.get("created") or ""
            day = _created_to_day_br(created)
            is_bug = it == ISSUE_TYPE_BUG
            is_sub_bug = it == ISSUE_TYPE_SUB_BUG
            if not (is_bug or is_sub_bug):
                continue
            is_valid = st != STATUS_CANCELED
            is_closed = st in STATUS_CLOSED
            total_reported += 1
            if day and day in days_set:
                daily_reported[day] += 1
            if is_valid:
                total_defects_valid += 1
                if day and day in days_set:
                    daily_total_valid[day] += 1
                    daily_valid[day] += 1
            if is_bug and is_valid:
                production_bugs_valid += 1
                bugs_valid += 1
                if is_closed:
                    bugs_closed += 1
                else:
                    bugs_open += 1
                if day and day in days_set:
                    daily_prod_bugs[day] += 1
            if is_sub_bug and is_valid:
                sub_bugs_valid += 1
                if is_closed:
                    sub_bugs_closed += 1
                else:
                    sub_bugs_open += 1

        rate_leakage = (production_bugs_valid / total_defects_valid * 100) if total_defects_valid else 0.0
        rate_valid = (total_defects_valid / total_reported * 100) if total_reported else 0.0
        ratio = (sub_bugs_valid / bugs_valid) if bugs_valid else None

        metrics = {
            "defectLeakage": {
                "productionBugs": production_bugs_valid,
                "totalDefectsValid": total_defects_valid,
                "ratePercent": round(rate_leakage, 2),
            },
            "defectValidRate": {
                "validDefects": total_defects_valid,
                "totalReported": total_reported,
                "ratePercent": round(rate_valid, 2),
            },
            "defectsRatio": {
                "subBugsValid": sub_bugs_valid,
                "bugsValid": bugs_valid,
                "ratio": round(ratio, 2) if ratio is not None else None,
            },
            "defectsBreakdown": {
                "closed": sub_bugs_closed,
                "open": sub_bugs_open,
                "total": sub_bugs_valid,
            },
            "bugsBreakdown": {
                "closed": bugs_closed,
                "open": bugs_open,
                "total": bugs_valid,
            },
        }

        leakage_values = []
        leakage_prod = []
        leakage_total = []
        valid_rate_values = []
        valid_valid = []
        valid_reported = []
        for d in days:
            tv = daily_total_valid.get(d, 0)
            pb = daily_prod_bugs.get(d, 0)
            leakage_total.append(tv)
            leakage_prod.append(pb)
            leakage_values.append(round((pb / tv * 100) if tv else 0.0, 2))
            tr = daily_reported.get(d, 0)
            vd = daily_valid.get(d, 0)
            valid_reported.append(tr)
            valid_valid.append(vd)
            valid_rate_values.append(round((vd / tr * 100) if tr else 0.0, 2))

        series = {
            "defectLeakageDaily": {
                "labels": days,
                "valuesPercent": leakage_values,
                "productionBugs": leakage_prod,
                "totalDefectsValid": leakage_total,
            },
            "defectValidRateDaily": {
                "labels": days,
                "valuesPercent": valid_rate_values,
                "validDefects": valid_valid,
                "totalReported": valid_reported,
            },
        }

        generated_at = datetime.now(TIMEZONE).strftime("%Y-%m-%dT%H:%M:%S%z")
        if len(generated_at) == 22 and generated_at[-5] in "+-":
            generated_at = generated_at[:-2] + ":" + generated_at[-2:]
        meta_payload = {
            "generatedAt": generated_at,
            "source": "jira",
            "notes": [
                "IssueType Bug = Produção; Sub-Bug (sub-task) = Desenvolvimento",
                "Status inválido removido: Cancelado",
                "Cálculos realizados no backend; front apenas renderiza",
            ],
        }

        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        logger.info(
            "[dashboard] project=%s period=%s start=%s end=%s issues=%s durationMs=%s",
            project_key, period_type, start_date_str, end_date_str, len(issues), elapsed_ms,
        )

        project_info = jira.get_project(project_key)
        return {
            "project": project_info,
            "period": period_payload,
            "metrics": metrics,
            "series": series,
            "meta": meta_payload,
        }

    def get_status_time(
        self,
        project_key: str,
        period_type: str,
        custom_start: Optional[str] = None,
        custom_end: Optional[str] = None,
    ) -> dict:
        """
        Retorna DTO para Status Time: issues que passaram por QA com tempo em
        Ready to test e In Test. Limita a MAX_ISSUES_STATUS_TIME issues;
        para cada uma faz GET com changelog e calcula intervalos.
        """
        t0 = time_module.perf_counter()
        jira = get_issue_tracker("jira")

        def get_sprint_dates(pk: str):
            return jira.get_sprint_current_dates(pk)

        def get_sprint_previous_dates(pk: str):
            return jira.get_sprint_previous_dates(pk)

        start_date_str, end_date_str, meta = resolve_period(
            period_type=period_type,
            custom_start=custom_start,
            custom_end=custom_end,
            project_key=project_key,
            get_sprint_dates=get_sprint_dates,
            get_sprint_previous_dates=get_sprint_previous_dates,
        )

        period_payload = {
            "type": period_type,
            "timezone": meta.get("timezone", "America/Sao_Paulo"),
            "startDate": start_date_str,
            "endDate": end_date_str,
            "source": meta.get("source", period_type),
        }
        if "sprint" in meta:
            period_payload["sprint"] = meta["sprint"]

        jql = build_status_time_jql(project_key, start_date_str, end_date_str)
        issues_from_search = jira.search_issues_paginated(
            jql, ["summary", "status", "created", "issuetype"], max_results_per_page=MAX_ISSUES_STATUS_TIME
        )
        issues_slice = issues_from_search[:MAX_ISSUES_STATUS_TIME]

        rows = []
        totals_ready = 0
        totals_in_test = 0

        for item in issues_slice:
            key = item.get("key")
            if not key:
                continue
            
            # Pegar issuetype da busca inicial (já parseado como string)
            issue_type = item.get("issuetype") or "-"
            
            try:
                full = jira.get_issue(key, fields=["summary", "created", "status", "changelog"])
            except Exception as e:
                logger.warning("[statusTime] skip issue %s: %s", key, e)
                continue
            fields = full.get("fields") or {}
            summary = (fields.get("summary") or "").strip() or "-"
            status_obj = fields.get("status")
            current_status = status_obj.get("name", "-") if isinstance(status_obj, dict) else "-"
            
            # Ignorar issues canceladas - não passaram pelo fluxo de testes
            if current_status == STATUS_CANCELED:
                continue
            
            created_iso = fields.get("created") or ""
            changelog = fields.get("changelog") or []

            # changelog do get_issue vem como lista de { created, items }; ordenar por created asc
            changelog_sorted = sorted(changelog, key=lambda h: h.get("created") or "")
            totals_ms = _calc_time_in_statuses(created_iso, changelog_sorted, STATUS_TIME_TARGET)
            ready_ms = totals_ms.get("Ready to test", 0)
            in_test_ms = totals_ms.get("In Test", 0)
            total_ms = ready_ms + in_test_ms

            ready_h = round(ready_ms / (1000 * 60 * 60), 2)
            in_test_h = round(in_test_ms / (1000 * 60 * 60), 2)
            total_h = round(total_ms / (1000 * 60 * 60), 2)

            totals_ready += ready_ms
            totals_in_test += in_test_ms
            rows.append({
                "key": key,
                "issueType": issue_type,
                "summary": summary,
                "currentStatus": current_status,
                "readyToTestHours": ready_h,
                "inTestHours": in_test_h,
                "totalHours": total_h,
            })

        count = len(rows)
        total_ready_h = round(totals_ready / (1000 * 60 * 60), 2)
        total_in_test_h = round(totals_in_test / (1000 * 60 * 60), 2)
        total_all_h = round((totals_ready + totals_in_test) / (1000 * 60 * 60), 2)
        avg_ready = round(total_ready_h / count, 2) if count else 0
        avg_in_test = round(total_in_test_h / count, 2) if count else 0

        project_info = jira.get_project(project_key)
        generated_at = datetime.now(TIMEZONE).strftime("%Y-%m-%dT%H:%M:%S%z")
        if len(generated_at) == 22 and generated_at[-5] in "+-":
            generated_at = generated_at[:-2] + ":" + generated_at[-2:]

        elapsed_ms = int((time_module.perf_counter() - t0) * 1000)
        logger.info(
            "[statusTime] project=%s period=%s issues=%s durationMs=%s",
            project_key, period_type, count, elapsed_ms,
        )

        return {
            "project": project_info,
            "period": period_payload,
            "issues": rows,
            "summary": {
                "count": count,
                "totalReadyToTestHours": total_ready_h,
                "totalInTestHours": total_in_test_h,
                "totalHours": total_all_h,
                "avgReadyToTestHours": avg_ready,
                "avgInTestHours": avg_in_test,
            },
            "meta": {
                "generatedAt": generated_at,
                "notes": [
                    "Tempo em 'Ready to test' e 'In Test' calculado a partir do changelog.",
                    "Issues com status 'Cancelado' são excluídas do cálculo.",
                    f"Máximo de {MAX_ISSUES_STATUS_TIME} issues processadas.",
                ],
            },
        }
