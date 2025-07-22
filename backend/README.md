# 🏗️ Estrutura do Backend - BSQA Card Writer

## 🎯 **Arquitetura Geral**

O backend é construído com **FastAPI** seguindo princípios de **Clean Architecture** e **SOLID**, implementando padrões como **Factory Pattern** e **Dependency Injection**.

## 📁 **Organização dos Arquivos**

```
backend/
├── 📄 main.py                 # Aplicação FastAPI principal
├── 📄 __init__.py             # Inicialização do módulo
├── 📁 api/                    # Camada de API (Rotas)
│   ├── 📄 routes_analyze.py   # Rotas de análise de requisitos
│   ├── 📄 routes_config.py    # Rotas de configuração do usuário
│   └── 📄 __init__.py
├── 📁 services/               # Camada de Serviços (Lógica de Negócio)
│   ├── 📄 ia_factory.py       # Factory pattern para serviços de IA
│   ├── 📄 ia_base.py          # Interface base para serviços de IA
│   ├── 📄 openai_service.py   # Implementação do serviço OpenAI
│   ├── 📄 stackspot_service.py # Implementação do serviço StackSpot
│   └── 📄 __init__.py
└── 📁 utils/                  # Camada de Utilitários (Infraestrutura)
    ├── 📄 config_utils.py     # Gerenciamento de configurações
    ├── 📄 file_utils.py       # Manipulação de arquivos (PDF, JSON, TXT)
    ├── 📄 prompt_loader.py    # Carregamento de templates de prompt
    └── 📄 __init__.py
```

## 🏛️ **Arquitetura em Camadas**

### **📄 Camada de Aplicação (main.py):**
- **Responsabilidade**: Configuração da aplicação FastAPI
- **Funcionalidades**: CORS, middlewares, registro de rotas
- **Características**: Ponto de entrada limpo e desacoplado

### **📁 Camada de API (api/):**
- **Responsabilidade**: Endpoints REST da aplicação
- **Funcionalidades**: 
  - `routes_analyze.py`: Análise de requisitos e tipos disponíveis
  - `routes_config.py`: Gerenciamento de configurações do usuário
- **Características**: Validação de entrada, tratamento de erros

### **📁 Camada de Serviços (services/):**
- **Responsabilidade**: Lógica de negócio e integração com IAs
- **Funcionalidades**:
  - `ia_factory.py`: Factory pattern para criação dinâmica de serviços
  - `ia_base.py`: Interface abstrata para padronização
  - `openai_service.py`: Integração com OpenAI GPT
  - `stackspot_service.py`: Integração com StackSpot AI
- **Características**: Polimorfismo, extensibilidade, testabilidade

### **📁 Camada de Utilitários (utils/):**
- **Responsabilidade**: Funções auxiliares e infraestrutura
- **Funcionalidades**:
  - `config_utils.py`: Persistência e migração de configurações
  - `file_utils.py`: Extração de texto de PDF, JSON, TXT
  - `prompt_loader.py`: Carregamento dinâmico de templates
- **Características**: Reutilização, modularidade

## 🔧 **Padrões Arquiteturais Implementados**

### **✅ Factory Pattern:**
```python
# services/ia_factory.py
SERVICES = {
    "openai": OpenAIService,
    "stackspot": StackSpotService,
}

def get_ia_service(service_name: str):
    return SERVICES[service_name]()
```

### **✅ Interface Abstrata:**
```python
# services/ia_base.py
class IAServiceBase(ABC):
    @abstractmethod
    def generate_response(self, prompt: str, **kwargs):
        pass
```

### **✅ Injeção de Dependência:**
- Configurações via variáveis de ambiente
- Templates carregados dinamicamente
- Serviços criados sob demanda

### **✅ Separação de Responsabilidades:**
- **API**: Validação e roteamento
- **Serviços**: Lógica de negócio
- **Utilitários**: Infraestrutura

## 🚀 **Endpoints da API**

### **📋 Análise de Requisitos:**
- `GET /analysis-types` - Lista tipos de análise disponíveis
- `POST /analyze` - Analisa requisitos com IA

### **⚙️ Configurações:**
- `GET /config` - Carrega configurações do usuário
- `POST /config` - Salva configurações do usuário
- `GET /api-config` - Carrega configurações de API
- `POST /api-config` - Salva configurações de API
- `POST /test-api-config` - Testa configurações de IA

## 🔄 **Fluxo de Dados**

```
Frontend → API Routes → Services → Utils → External APIs
    ↑         ↓           ↓         ↓
    ← JSON Response ← ← ← ← ← ← ← ← ←
```

## 🛠️ **Tecnologias Utilizadas**

- **FastAPI**: Framework web moderno e rápido
- **PyPDF2**: Extração de texto de PDFs
- **OpenAI**: Integração com GPT-4
- **Requests**: Comunicação HTTP com StackSpot
- **Python-dotenv**: Gerenciamento de variáveis de ambiente

## 📊 **Características Técnicas**

### **✅ Performance:**
- **Async/Await**: Operações assíncronas
- **Streaming**: Suporte a respostas em tempo real
- **Cache**: Configurações persistidas

### **✅ Segurança:**
- **Validação**: Entrada validada em todas as rotas
- **Sanitização**: Arquivos processados com segurança
- **CORS**: Configurado para frontend

### **✅ Escalabilidade:**
- **Modular**: Fácil adição de novos serviços
- **Extensível**: Factory pattern permite novos IAs
- **Manutenível**: Código organizado e documentado

### **✅ Robustez:**
- **Tratamento de Erros**: Exceções capturadas e tratadas
- **Fallbacks**: Configurações padrão em caso de erro
- **Logging**: Rastreamento de operações

## 🎯 **Como Executar**

### **Desenvolvimento:**
```bash
cd backend
uvicorn main:app --reload
```

### **Produção:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 📝 **Convenções**

- **Rotas**: Organizadas por funcionalidade
- **Serviços**: Implementam interface IAServiceBase
- **Utilitários**: Funções puras e reutilizáveis
- **Configurações**: Estrutura hierárquica JSON
- **Templates**: Padronizados com {requirements}

---

*Arquitetura robusta e escalável para integração com múltiplas IAs* 🎯 