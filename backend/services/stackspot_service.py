import os
import requests
from backend.services.ia_base import IAServiceBase

class StackSpotService(IAServiceBase):
    def __init__(self):
        self.client_id = os.getenv("Client_ID_stackspot")
        self.client_secret = os.getenv("Client_Key_stackspot")
        self.realm = os.getenv("Realm_stackspot")
        self.agent_id = os.getenv("STACKSPOT_AGENT_ID")
        if not all([self.client_id, self.client_secret, self.realm, self.agent_id]):
            raise RuntimeError("StackSpot credentials not configured.")

    def get_jwt(self):
        token_url = f"https://idm.stackspot.com/{self.realm}/oidc/oauth/token"
        resp = requests.post(
            token_url,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            }
        )
        resp.raise_for_status()
        return resp.json()["access_token"]

    def generate_response(self, prompt: str, streaming: bool = False, stackspot_knowledge: bool = False, return_ks_in_response: bool = False, **kwargs):
        jwt = self.get_jwt()
        chat_url = f"https://genai-inference-app.stackspot.com/v1/agent/{self.agent_id}/chat"
        payload = {
            "streaming": streaming,
            "user_prompt": prompt,
            "stackspot_knowledge": stackspot_knowledge,
            "return_ks_in_response": return_ks_in_response,
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {jwt}",
        }
        resp = requests.post(chat_url, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json() 