def load_prompt_template(analyse_type: str) -> str:
    # Mapeamento entre analyse_type e arquivo de prompt
    prompt_files = {
        "card_QA_writer": "config/prompts/prompt_template_card_QA_writer.txt.txt",
        "test_case_flow_classifier": "config/prompts/prompt_template_test_case_flow_classifier.txt",
        "swagger_postman": "config/prompts/prompt_template_swagger_postman.txt",
        "swagger_python": "config/prompts/prompt_template_swagger_python.txt",
        "robot_api_generator": "config/prompts/prompt_template_robot_API_generator.txt",
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
        "test_case_flow_classifier": "Test Case Flow Classifier", 
        "swagger_postman": "Swagger Postman",
        "swagger_python": "Swagger Python",
        "robot_api_generator": "Robot API Generator",
    }

def get_analysis_placeholders():
    """Retorna os placeholders específicos para cada tipo de análise"""
    return {
        "card_QA_writer": "Digite os dados do card de PM/PO para análise. Inclua informações como:\n• Título do card\n• Descrição dos requisitos\n• Critérios de aceitação\n• User stories\n• Dependências\n• Estimativas",
        "test_case_flow_classifier": "Digite seus requisitos aqui ou selecione um arquivo",
        "swagger_postman": "Faça upload do arquivo JSON do Swagger/OpenAPI para gerar coleção do Postman. O arquivo deve conter a especificação da API.",
        "swagger_python": "Faça upload do arquivo JSON do Swagger/OpenAPI para gerar código Python. O arquivo deve conter a especificação da API.",
        "robot_api_generator": "Digite o comando cURL (e opcionalmente a resposta) para gerar uma estrutura completa de automação de teste de API com Robot Framework, seguindo um padrão modular e reutilizável.",
    } 