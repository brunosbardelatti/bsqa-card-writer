import os
import json
from dotenv import load_dotenv

CONFIG_FILE = "config/user_config.json"
ENV_FILE = "config/.env"

def migrate_old_config(old):
    # Detecta se já está no novo formato
    if 'user' in old and 'preferences' in old and 'ia' in old:
        return old
    # Migração do formato antigo para o novo
    return {
        "user": {
            "name": old.get("userName", ""),
            "email": old.get("userEmail", ""),
            "company": old.get("userCompany", "")
        },
        "preferences": {
            "defaultAI": old.get("defaultAI", "openai"),
            "defaultAnalyseType": old.get("defaultAnalyseType", "card_QA_writer"),
            "autoCopy": old.get("autoCopy", False),
            "clearAfterSuccess": old.get("clearAfterSuccess", True),
            "theme": old.get("theme", "dark")
        },
        "ia": {
            "openai": {
                "enabled": old.get("enableOpenAI", True),
                "maxTokens": old.get("maxTokens", 1000)
            },
            "stackspot": {
                "enabled": old.get("enableStackSpot", True),
                "streaming": old.get("streaming", False),
                "stackspotKnowledge": old.get("stackspotKnowledge", False),
                "returnKsInResponse": old.get("returnKsInResponse", False)
            }
        }
    }

def load_user_config():
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                data = migrate_old_config(data)
                return data
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
        "user": {
            "name": "",
            "email": "",
            "company": ""
        },
        "preferences": {
            "defaultAI": "openai",
            "defaultAnalyseType": "card_QA_writer",
            "autoCopy": False,
            "clearAfterSuccess": True,
            "theme": "dark"
        },
        "ia": {
            "openai": {
                "enabled": True,
                "maxTokens": 1000
            },
            "stackspot": {
                "enabled": True,
                "streaming": False,
                "stackspotKnowledge": False,
                "returnKsInResponse": False
            }
        }
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
        # Recarregar variáveis de ambiente
        load_dotenv(dotenv_path=ENV_FILE, override=True)
        return True
    except Exception as e:
        print(f"Erro ao salvar configurações .env: {e}")
        return False 