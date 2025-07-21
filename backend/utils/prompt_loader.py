def load_prompt_template(service: str) -> str:
    if service.lower() == "stackspot":
        path = "config/prompts/prompt_template_stackspot_ai.txt"
    else:
        path = "config/prompts/prompt_template_open_ai.txt"
    with open(path, "r", encoding="utf-8") as f:
        return f.read() 