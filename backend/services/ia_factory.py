from backend.services.openai_service import OpenAIService
from backend.services.stackspot_service import StackSpotService
import os
from openai import OpenAI
from typing import Optional, Dict, Any

SERVICES = {
    "openai": OpenAIService,
    "stackspot": StackSpotService,
}

def _normalize_credentials(credentials: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Accept frontend ia_credentials shape: openai: { api_key }, stackspot: { client_id, client_secret, realm, agent_id }."""
    if not credentials:
        return None
    return credentials

def get_ia_service(service_name: str, credentials: Optional[Dict[str, Any]] = None):
    service_name = service_name.lower()
    if service_name not in SERVICES:
        raise ValueError(f"Serviço de IA '{service_name}' não suportado.")
    creds = _normalize_credentials(credentials)
    if service_name == "openai":
        api_key = None
        if creds and isinstance(creds.get("openai"), dict):
            api_key = creds["openai"].get("api_key")
        return OpenAIService(api_key=api_key)
    if service_name == "stackspot":
        ss = creds.get("stackspot") if creds else None
        if isinstance(ss, dict):
            return StackSpotService(
                client_id=ss.get("client_id"),
                client_secret=ss.get("client_secret"),
                realm=ss.get("realm"),
                agent_id=ss.get("agent_id"),
            )
        return StackSpotService()
    return SERVICES[service_name]()


def test_api_services(credentials: Optional[Dict[str, Any]] = None):
    """
    Testa apenas as IAs que tiverem credenciais enviadas (flag enabled + chave no front).
    credentials: { "openai": { "api_key": "..." } | null, "stackspot": { "client_id", ... } | null }
    Se openai for null ou sem api_key, não testa OpenAI. Se stackspot for null ou incompleto, não testa StackSpot.
    """
    results = []
    creds = _normalize_credentials(credentials)

    # Só testar OpenAI se creds tiver openai com api_key (IA habilitada e configurada no front)
    openai_creds = creds.get("openai") if creds else None
    if isinstance(openai_creds, dict) and (openai_creds.get("api_key") or "").strip():
        openai_key = openai_creds["api_key"].strip()
        try:
            client = OpenAI(api_key=openai_key)
            client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": "Teste de configuração - responda apenas 'OK' se receber esta mensagem."}],
                max_tokens=10,
                temperature=0,
            )
            results.append({"service": "OpenAI", "status": "success", "message": "Configurações OpenAI testadas com sucesso"})
        except Exception as e:
            results.append({"service": "OpenAI", "status": "error", "message": f"Erro ao testar OpenAI: {str(e)}"})

    # Só testar StackSpot se creds tiver stackspot com todos os campos (IA habilitada e configurada no front)
    ss = creds.get("stackspot") if creds else None
    if isinstance(ss, dict) and all([
        (ss.get("client_id") or "").strip(),
        (ss.get("client_secret") or "").strip(),
        (ss.get("realm") or "").strip(),
        (ss.get("agent_id") or "").strip(),
    ]):
        stackspot_vars = [ss["client_id"].strip(), ss["client_secret"].strip(), ss["realm"].strip(), ss["agent_id"].strip()]
        try:
            stackspot = StackSpotService(
                client_id=stackspot_vars[0],
                client_secret=stackspot_vars[1],
                realm=stackspot_vars[2],
                agent_id=stackspot_vars[3],
            )
            _ = stackspot.get_jwt()
            results.append({"service": "StackSpot", "status": "success", "message": "Configurações StackSpot testadas com sucesso"})
        except Exception as e:
            results.append({"service": "StackSpot", "status": "error", "message": f"Erro ao testar StackSpot: {str(e)}"})

    if not results:
        return {"success": False, "message": "Nenhuma IA habilitada para teste. Habilite e preencha pelo menos uma IA (OpenAI ou StackSpot) e clique em Testar.", "results": []}
    successful_tests = [r for r in results if r["status"] == "success"]
    if successful_tests:
        return {"success": True, "message": f"Testes concluídos: {len(successful_tests)}/{len(results)} IAs funcionando", "results": results}
    return {"success": False, "message": "Todas as IAs testadas falharam", "results": results} 