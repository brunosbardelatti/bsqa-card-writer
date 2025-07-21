def load_prompt_template(analyse_type: str) -> str:
    # Mapeamento entre analyse_type e arquivo de prompt
    prompt_files = {
        "card_QA_writer": "config/prompts/prompt_template_card_QA_writer.txt.txt",
        "test_case_flow_classifier": "config/prompts/prompt_template_test_case_flow_classifier.txt",
        "swagger_postman": "config/prompts/prompt_template_swagger_postman.txt",
        "swagger_python": "config/prompts/prompt_template_swagger_python.txt",
    }
    path = prompt_files.get(analyse_type)
    if not path:
        raise ValueError(f"Tipo de análise '{analyse_type}' não suportado.")
    with open(path, "r", encoding="utf-8") as f:
        return f.read() 