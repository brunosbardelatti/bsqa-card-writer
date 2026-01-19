# backend/utils/jira_utils.py

import re
from typing import Tuple, Optional

def validate_card_number(card_number: str) -> bool:
    """
    Valida o formato do número do card.
    
    Args:
        card_number: Número do card (ex: PKGS-1104)
        
    Returns:
        True se válido, False caso contrário
    """
    pattern = r'^[A-Z]+-\d+$'
    return bool(re.match(pattern, card_number.upper().strip()))

def extract_project_key(card_number: str) -> str:
    """
    Extrai a chave do projeto do número do card.
    
    Args:
        card_number: Ex: "PKGS-1104"
        
    Returns:
        Ex: "PKGS"
    """
    return card_number.upper().strip().split('-')[0]

def parse_ia_response(ia_response: str, parent_key: str) -> Tuple[str, str]:
    """
    Separa título e descrição da resposta da IA.
    
    A IA retorna tudo como uma única string. Esta função tenta
    extrair um título adequado e a descrição completa.
    
    Args:
        ia_response: Resposta completa da IA
        parent_key: Chave do card pai (para montar o título)
        
    Returns:
        Tupla (título, descrição)
    """
    # Título padrão para subtask de QA
    default_title = f"[QA] Validar cenários + evidências - {parent_key}"
    
    # Tentar extrair título se a IA retornou em formato estruturado
    lines = ia_response.strip().split('\n')
    
    # Verificar se a primeira linha parece um título
    first_line = lines[0].strip() if lines else ""
    
    # Se a primeira linha começar com # (markdown) ou for curta, usar como título
    if first_line.startswith('#'):
        title = first_line.lstrip('#').strip()
        description = '\n'.join(lines[1:]).strip()
    elif len(first_line) < 100 and not first_line.startswith('-'):
        # Linha curta que pode ser um título
        title = first_line
        description = '\n'.join(lines[1:]).strip()
    else:
        # Usar título padrão
        title = default_title
        description = ia_response.strip()
    
    # Remover prefixo "Title:" ou "Título:" se presente
    title = re.sub(r'^(Title|Título)\s*:\s*', '', title, flags=re.IGNORECASE).strip()
    
    # Garantir que o título não seja muito longo (limite Jira: 255 chars)
    if len(title) > 250:
        title = title[:247] + "..."
    
    return title, description

def format_subtask_summary(parent_key: str, custom_prefix: Optional[str] = None) -> str:
    """
    Formata o summary da subtask de QA.
    
    Args:
        parent_key: Chave do card pai
        custom_prefix: Prefixo customizado (default: "[QA] Validar cenários + evidências")
        
    Returns:
        Summary formatado
    """
    prefix = custom_prefix or "[QA] Validar cenários + evidências"
    return f"{prefix} - {parent_key}"
