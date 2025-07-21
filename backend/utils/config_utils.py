import os
import json

CONFIG_FILE = "config/user_config.json"
ENV_FILE = "config/.env"

def load_user_config():
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return get_default_config()
    except Exception as e:
        print(f"Erro ao carregar configurações: {e}")
        return get_default_config()

def save_user_config(config):
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erro ao salvar configurações: {e}")
        return False

def get_default_config():
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

def load_env_config():
    try:
        env_config = {}
        if os.path.exists(ENV_FILE):
            with open(ENV_FILE, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env_config[key.strip()] = value.strip()
        return env_config
    except Exception as e:
        print(f"Erro ao carregar configurações .env: {e}")
        return {}

def save_env_config(env_config):
    try:
        os.makedirs(os.path.dirname(ENV_FILE), exist_ok=True)
        with open(ENV_FILE, 'w', encoding='utf-8') as f:
            for key, value in env_config.items():
                f.write(f"{key}={value}\n")
        return True
    except Exception as e:
        print(f"Erro ao salvar configurações .env: {e}")
        return False 