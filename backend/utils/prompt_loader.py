def load_prompt_template(analyse_type: str) -> str:
    # Mapeamento entre analyse_type e arquivo de prompt
    prompt_files = {
        "card_QA_writer": "config/prompts/prompt_template_card_QA_writer.txt.txt",
        "test_case_flow_classifier": "config/prompts/prompt_template_test_case_flow_classifier.txt",
        "swagger_postman": "config/prompts/prompt_template_swagger_postman.txt",
        "swagger_python": "config/prompts/prompt_template_swagger_python.txt",
        "robot_api_generator": "config/prompts/prompt_template_robot_API_generator.txt",
        "swagger_robot_generator": "config/prompts/prompt_template_swagger_robot_generator.txt",
        "code_review_diff": "config/prompts/prompt_template_code_review_diff.txt",
        "sub_bug_writer": "config/prompts/prompt_template_sub_bug_writer.txt",
    }
    path = prompt_files.get(analyse_type)
    if not path:
        raise ValueError(f"Tipo de análise '{analyse_type}' não suportado.")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def get_available_analysis_types():
    """Retorna os tipos de análise disponíveis com suas descrições"""
    return {
        "card_QA_writer": "Card QA Writer",
        "test_case_flow_classifier": "Test Case Flow Generator", 
        "swagger_postman": "Swagger Postman Generator",
        "swagger_python": "Swagger Python Generator",
        "robot_api_generator": "Curl Robot API Generator",
        "swagger_robot_generator": "Swagger Robot Generator",
        "code_review_diff": "Code Review Analyzer",
        "sub_bug_writer": "Sub-Bug Writer",
    }

def get_analysis_placeholders():
    """Retorna os placeholders específicos para cada tipo de análise"""
    return {
        "card_QA_writer": "Digite os dados do card de PM/PO para análise. Inclua informações como:\n• Título do card\n• Descrição dos requisitos\n• Critérios de aceitação\n• User stories\n• Dependências\n• Estimativas",
        "test_case_flow_classifier": "Digite seus requisitos aqui ou selecione um arquivo",
        "swagger_postman": "Faça upload do arquivo JSON do Swagger/OpenAPI para gerar coleção do Postman. O arquivo deve conter a especificação da API.",
        "swagger_python": "Faça upload do arquivo JSON do Swagger/OpenAPI para gerar código Python. O arquivo deve conter a especificação da API.",
        "robot_api_generator": "Digite o comando cURL (e opcionalmente a resposta) para gerar uma estrutura completa de automação de teste de API com Robot Framework, seguindo um padrão modular e reutilizável.",
        "swagger_robot_generator": "Faça upload do arquivo JSON do Swagger/OpenAPI para gerar uma estrutura completa de automação de testes em Robot Framework. O retorno incluirá keywords reutilizáveis, requests e casos de teste prontos.",
        "code_review_diff": "Insira abaixo o diff do Git gerado entre a sua branch e a main. O conteúdo será analisado com foco técnico, e você receberá feedback em português sobre possíveis erros, violações de boas práticas, oportunidades de melhoria e riscos de segurança.",
        "sub_bug_writer": "Digite os dados do bug encontrado. Inclua informações como:\n• Contexto da funcionalidade\n• Passos para reproduzir\n• Resultado esperado vs observado\n• Severidade/Prioridade\n• Ambiente onde foi encontrado\n• Logs e evidências (screenshots, vídeos, logs)",
    } 