# backend/utils/jql_builder.py

"""
Montagem padronizada de JQL para o Dashboard QA.
Escopo: Bug e Sub-Bug no período (created entre start_date e end_date);
Status Time: issues que já passaram por QA (exclui backlog/dev).
"""

# Status excluídos da JQL Status Time (issues ainda em backlog/dev não entram)
STATUS_TIME_EXCLUDED = [
    "Tarefas pendentes",
    "Code review",
    "In Product Discovery",
    "Tech refinement",
    "Ready to Dev",
    "In Development",
    "Product Backlog",
    "Business refinement",
    "Backlog",
    "PRIORITIZED",
]


def build_defects_base_jql(project_key: str, start_date: str, end_date: str) -> str:
    """
    Retorna JQL base para buscar issues Bug e Sub-Bug criadas no período.
    Datas no formato YYYY-MM-DD. Não filtra por status (agregação no backend).
    """
    # Garantir que project_key não tenha caracteres que quebrem JQL
    pk = str(project_key).strip().upper()
    # Escapar aspas em datas (já são seguras se YYYY-MM-DD)
    start = start_date.strip()[:10]
    end = end_date.strip()[:10]
    return (
        f'project = {pk} '
        f'AND issuetype in (Bug, "Sub-Bug") '
        f'AND created >= "{start}" '
        f'AND created <= "{end}" '
        f'ORDER BY created ASC'
    )


def build_status_time_jql(project_key: str, start_date: str, end_date: str) -> str:
    """
    JQL para Status Time: issues que já passaram por QA (exclui Sub-task e
    status de backlog/dev). Datas no formato YYYY-MM-DD.
    """
    pk = str(project_key).strip().upper()
    start = start_date.strip()[:10]
    end = end_date.strip()[:10]
    not_in = ", ".join(f'"{s}"' for s in STATUS_TIME_EXCLUDED)
    return (
        f'project = {pk} '
        f'AND issuetype != Sub-task '
        f'AND status NOT IN ({not_in}) '
        f'AND created >= "{start}" '
        f'AND created <= "{end}" '
        f'ORDER BY created ASC'
    )
