# backend/services/issue_tracker_factory.py

from backend.services.jira_service import JiraService
# Futuro: from backend.services.azure_devops_service import AzureDevOpsService
# Futuro: from backend.services.github_service import GitHubService

ISSUE_TRACKERS = {
    "jira": JiraService,
    # "azure_devops": AzureDevOpsService,  # Futuro
    # "github": GitHubService,              # Futuro
}

def get_issue_tracker(tracker_name: str = "jira"):
    """
    Factory para obter instância do Issue Tracker.
    
    Args:
        tracker_name: Nome do tracker (default: jira)
        
    Returns:
        Instância do Issue Tracker
        
    Raises:
        ValueError: Se tracker não suportado
    """
    tracker_name = tracker_name.lower()
    if tracker_name not in ISSUE_TRACKERS:
        raise ValueError(f"Issue Tracker '{tracker_name}' não suportado.")
    return ISSUE_TRACKERS[tracker_name]()

def get_available_trackers() -> list[dict]:
    """Retorna lista de Issue Trackers disponíveis."""
    return [
        {"id": "jira", "name": "Jira", "enabled": True},
        # {"id": "azure_devops", "name": "Azure DevOps", "enabled": False},
        # {"id": "github", "name": "GitHub Issues", "enabled": False},
    ]
