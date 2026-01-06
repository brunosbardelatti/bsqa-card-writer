"""
Funções auxiliares de validação
"""
import re
from typing import Tuple

def validar_cpf(cpf: str) -> Tuple[bool, str]:
    """
    Valida CPF brasileiro
    
    Args:
        cpf: String com CPF (pode conter pontos e hífen)
    
    Returns:
        Tuple[bool, str]: (is_valid, message)
    
    Exemplos:
        >>> validar_cpf("12345678909")
        (True, "CPF válido")
        >>> validar_cpf("111.111.111-11")
        (False, "CPF inválido")
    """
    # Remove caracteres não numéricos
    cpf = ''.join(filter(str.isdigit, cpf))
    
    if len(cpf) != 11:
        return False, "CPF deve conter 11 dígitos"
    
    # Verifica se todos os dígitos são iguais
    if cpf == cpf[0] * 11:
        return False, "CPF inválido"
    
    # Validação matemática dos dígitos verificadores
    def calcular_digito(cpf_parcial):
        soma = sum((len(cpf_parcial) + 1 - i) * int(d) for i, d in enumerate(cpf_parcial))
        resto = soma % 11
        return '0' if resto < 2 else str(11 - resto)
    
    if calcular_digito(cpf[:9]) != cpf[9] or calcular_digito(cpf[:10]) != cpf[10]:
        return False, "CPF inválido (dígitos verificadores incorretos)"
    
    return True, "CPF válido"

def validar_senha_forte(senha: str) -> Tuple[bool, str]:
    """
    Valida força da senha
    
    Requisitos:
    - Mínimo 8 caracteres
    - Pelo menos 1 letra maiúscula
    - Pelo menos 1 letra minúscula
    - Pelo menos 1 número
    - Pelo menos 1 caractere especial (@$!%*?&#)
    
    Args:
        senha: String com a senha
    
    Returns:
        Tuple[bool, str]: (is_valid, message)
    
    Exemplos:
        >>> validar_senha_forte("Admin@123")
        (True, "Senha válida")
        >>> validar_senha_forte("senha123")
        (False, "Senha deve conter pelo menos uma letra maiúscula")
    """
    if len(senha) < 8:
        return False, "Senha deve ter no mínimo 8 caracteres"
    
    if not re.search(r'[A-Z]', senha):
        return False, "Senha deve conter pelo menos uma letra maiúscula"
    
    if not re.search(r'[a-z]', senha):
        return False, "Senha deve conter pelo menos uma letra minúscula"
    
    if not re.search(r'\d', senha):
        return False, "Senha deve conter pelo menos um número"
    
    if not re.search(r'[@$!%*?&#]', senha):
        return False, "Senha deve conter pelo menos um caractere especial (@$!%*?&#)"
    
    return True, "Senha válida"

def validar_username(username: str) -> Tuple[bool, str]:
    """
    Valida formato do username
    
    Requisitos:
    - Mínimo 3 caracteres
    - Máximo 50 caracteres
    - Apenas letras, números, underscore (_) e hífen (-)
    
    Args:
        username: String com o username
    
    Returns:
        Tuple[bool, str]: (is_valid, message)
    
    Exemplos:
        >>> validar_username("admin")
        (True, "Username válido")
        >>> validar_username("ab")
        (False, "Username deve ter no mínimo 3 caracteres")
    """
    if len(username) < 3:
        return False, "Username deve ter no mínimo 3 caracteres"
    
    if len(username) > 50:
        return False, "Username deve ter no máximo 50 caracteres"
    
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return False, "Username deve conter apenas letras, números, underscore (_) ou hífen (-)"
    
    return True, "Username válido"

def validar_email(email: str) -> Tuple[bool, str]:
    """
    Valida formato de email
    
    Args:
        email: String com o email
    
    Returns:
        Tuple[bool, str]: (is_valid, message)
    
    Exemplos:
        >>> validar_email("admin@bsqa.com")
        (True, "Email válido")
        >>> validar_email("email_invalido")
        (False, "Email inválido")
    """
    # Regex básico para validação de email
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_regex, email):
        return False, "Email inválido"
    
    return True, "Email válido"

def formatar_cpf(cpf: str) -> str:
    """
    Formata CPF para exibição (###.###.###-##)
    
    Args:
        cpf: String com CPF (apenas números)
    
    Returns:
        str: CPF formatado
    
    Exemplos:
        >>> formatar_cpf("12345678909")
        "123.456.789-09"
    """
    cpf = ''.join(filter(str.isdigit, cpf))
    return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}"

def limpar_cpf(cpf: str) -> str:
    """
    Remove formatação do CPF (retorna apenas números)
    
    Args:
        cpf: String com CPF (pode estar formatado)
    
    Returns:
        str: CPF sem formatação
    
    Exemplos:
        >>> limpar_cpf("123.456.789-09")
        "12345678909"
    """
    return ''.join(filter(str.isdigit, cpf))

