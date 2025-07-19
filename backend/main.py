from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from openai import OpenAI
import requests
import PyPDF2
import io
import os
import json
from pathlib import Path

# Load environment variables
env_path = os.getenv('DOTENV_PATH', 'config/.env')
load_dotenv(env_path)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI configuration
openai_api_key = os.getenv("OPENAI_API_KEY")

# StackSpot AI configuration
stackspot_client_id = os.getenv("Client_ID_stackspot")
stackspot_client_secret = os.getenv("Client_Key_stackspot")
stackspot_realm = os.getenv("Realm_stackspot")
stackspot_agent_id = os.getenv("STACKSPOT_AGENT_ID")

# Helper to extract text from uploaded files
def extract_text_from_pdf(pdf_file: io.BytesIO) -> str:
    reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text


def extract_text_from_file(uploaded_file: UploadFile) -> str:
    if uploaded_file.content_type == "application/pdf":
        return extract_text_from_pdf(io.BytesIO(uploaded_file.file.read()))
    return uploaded_file.file.read().decode("utf-8")

# Prompt template loaders
def load_openai_prompt_template(path: str = "config/prompt_template_open_ai.txt") -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def load_stackspot_prompt_template(path: str = "config/prompt_template_stackspot_ai.txt") -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

# OpenAI invocation
def call_openai(prompt: str) -> str:
    if not openai_api_key:
        raise RuntimeError("OpenAI API key not configured.")
    client = OpenAI(api_key=openai_api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a Senior QA Engineer with extensive experience."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=1000,
        temperature=0.7,
    )
    return response.choices[0].message.content

# StackSpot AI invocation
def get_stackspot_jwt() -> str:
    if not all([stackspot_client_id, stackspot_client_secret, stackspot_realm]):
        raise RuntimeError("StackSpot credentials not configured.")
    token_url = f"https://idm.stackspot.com/{stackspot_realm}/oidc/oauth/token"
    resp = requests.post(
        token_url,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "grant_type": "client_credentials",
            "client_id": stackspot_client_id,
            "client_secret": stackspot_client_secret,
        }
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def call_stackspot(prompt: str, streaming: bool = False, stackspot_knowledge: bool = False, return_ks_in_response: bool = False) -> dict:
    jwt = get_stackspot_jwt()
    chat_url = f"https://genai-inference-app.stackspot.com/v1/agent/{stackspot_agent_id}/chat"
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

# API endpoint supporting both services
@app.post("/analyze")
async def analyze(
    requirements: str = Form(None),
    file: UploadFile = File(None),
    service: str = Form("openai"),  # 'openai' or 'stackspot'
    streaming: bool = Form(False),
    stackspot_knowledge: bool = Form(False),
    return_ks_in_response: bool = Form(False)
):
    # Validate input
    if file and requirements:
        raise HTTPException(status_code=400, detail="Use only one input method: file or text.")
    if file:
        # Validação de tipo de arquivo
        allowed_types = ["application/pdf", "text/plain", "text/utf-8", "text/txt", "application/txt"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Tipos de arquivo aceitos: PDF (.pdf) e TXT (.txt). Outros formatos não são suportados.")
        # Validação de tamanho de arquivo (100MB)
        file.file.seek(0, 2)  # Move para o final do arquivo
        file_size = file.file.tell()
        file.file.seek(0)  # Volta para o início
        if file_size > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Arquivo maior que o tamanho de 100MB suportado. Tente com outro arquivo.")
        try:
            content = extract_text_from_file(file)
            if not content.strip():
                raise ValueError("Uploaded file is empty.")
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif requirements and requirements.strip():
        content = requirements
    else:
        raise HTTPException(status_code=400, detail="Provide requirements via file or text.")

    # Load appropriate prompt template
    if service.lower() == "stackspot":
        prompt_template = load_stackspot_prompt_template()
    else:
        prompt_template = load_openai_prompt_template()
    prompt = prompt_template.format(requirements=content)

    try:
        if service.lower() == "stackspot":
            result = call_stackspot(prompt, streaming=streaming, stackspot_knowledge=stackspot_knowledge, return_ks_in_response=return_ks_in_response)
        else:
            result = call_openai(prompt)
        return JSONResponse(content={"result": result})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {e}")

# Configurações do usuário
CONFIG_FILE = "config/user_config.json"

def load_user_config():
    """Carrega configurações do usuário do arquivo JSON"""
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return get_default_config()
    except Exception as e:
        print(f"Erro ao carregar configurações: {e}")
        return get_default_config()

def save_user_config(config):
    """Salva configurações do usuário no arquivo JSON"""
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erro ao salvar configurações: {e}")
        return False

def get_default_config():
    """Retorna configurações padrão"""
    return {
        "userName": "",
        "userEmail": "",
        "userCompany": "",
        "defaultAI": "openai",
        "maxTokens": 1000,
        "autoCopy": False,
        "clearAfterSuccess": True,
        "theme": "dark",
        "streaming": False,
        "stackspotKnowledge": False,
        "returnKsInResponse": False
    }

@app.get("/config")
async def get_config():
    """Endpoint para obter configurações do usuário"""
    return load_user_config()

@app.post("/config")
async def update_config(config: dict):
    """Endpoint para atualizar configurações do usuário"""
    current_config = load_user_config()
    current_config.update(config)
    
    if save_user_config(current_config):
        return {"success": True, "message": "Configurações salvas com sucesso"}
    else:
        raise HTTPException(status_code=500, detail="Erro ao salvar configurações")
