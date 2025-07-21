from backend.services.openai_service import OpenAIService
from backend.services.stackspot_service import StackSpotService
import os
from openai import OpenAI
from backend.utils.config_utils import load_user_config

SERVICES = {
    "openai": OpenAIService,
    "stackspot": StackSpotService,
}

def get_ia_service(service_name: str):
    service_name = service_name.lower()
    if service_name not in SERVICES:
        raise ValueError(f"Serviço de IA '{service_name}' não suportado.")
    return SERVICES[service_name]()


def test_api_services():
    results = []
    user_config = load_user_config()
    ia_config = user_config.get("ia", {})
    # Testa apenas as IAs habilitadas
    for service_name, service_class in SERVICES.items():
        service_conf = ia_config.get(service_name, {})
        if not service_conf.get("enabled", False):
            continue  # pula se não estiver habilitada
        if service_name == "openai":
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if openai_api_key:
                try:
                    client = OpenAI(api_key=openai_api_key)
                    response = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[{"role": "user", "content": "Teste de configuração - responda apenas 'OK' se receber esta mensagem."}],
                        max_tokens=10,
                        temperature=0,
                    )
                    results.append({"service": "OpenAI", "status": "success", "message": "Configurações OpenAI testadas com sucesso"})
                except Exception as e:
                    results.append({"service": "OpenAI", "status": "error", "message": f"Erro ao testar OpenAI: {str(e)}"})
            else:
                results.append({"service": "OpenAI", "status": "error", "message": "OPENAI_API_KEY não configurada."})
        elif service_name == "stackspot":
            stackspot_vars = [os.getenv("Client_ID_stackspot"), os.getenv("Client_Key_stackspot"), os.getenv("Realm_stackspot"), os.getenv("STACKSPOT_AGENT_ID")]
            if all(stackspot_vars):
                try:
                    stackspot = StackSpotService()
                    _ = stackspot.get_jwt()
                    results.append({"service": "StackSpot", "status": "success", "message": "Configurações StackSpot testadas com sucesso"})
                except Exception as e:
                    results.append({"service": "StackSpot", "status": "error", "message": f"Erro ao testar StackSpot: {str(e)}"})
            else:
                results.append({"service": "StackSpot", "status": "error", "message": "Variáveis de ambiente do StackSpot não configuradas."})
    if not results:
        return {"success": False, "message": "Nenhuma IA habilitada para teste", "results": []}
    successful_tests = [r for r in results if r["status"] == "success"]
    if successful_tests:
        return {"success": True, "message": f"Testes concluídos: {len(successful_tests)}/{len(results)} IAs funcionando", "results": results}
    else:
        return {"success": False, "message": "Todas as IAs habilitadas falharam no teste", "results": results} 