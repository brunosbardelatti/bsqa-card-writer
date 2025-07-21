import os
from openai import OpenAI
from backend.services.ia_base import IAServiceBase

class OpenAIService(IAServiceBase):
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise RuntimeError("OpenAI API key not configured.")
        self.client = OpenAI(api_key=self.api_key)

    def generate_response(self, prompt: str, **kwargs):
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a Senior QA Engineer with extensive experience."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=1000,
            temperature=0.7,
        )
        return response.choices[0].message.content 