# 🏗️ Estrutura do Backend - BSQA Card Writer

## 🎯 **Arquitetura Geral**

O backend é construído com **FastAPI** seguindo princípios de **Clean Architecture** e **SOLID**, implementando padrões como **Factory Pattern** e **Dependency Injection**. Suporta 7 tipos diferentes de análise e integração com múltiplas IAs.

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
  - `routes_analyze.py`: Análise de requisitos e 7 tipos de análise
  - `routes_config.py`: Gerenciamento de configurações do usuário
- **Características**: Validação de entrada, tratamento de erros

### **📁 Camada de Serviços (services/):**
- **Responsabilidade**: Lógica de negócio e integração com IAs
- **Funcionalidades**:
  - `ia_factory.py`: Factory pattern para criação dinâmica de serviços
  - `ia_base.py`: Interface abstrata para padronização
  - `openai_service.py`: Integração com OpenAI GPT-4o-mini
  - `stackspot_service.py`: Integração com StackSpot AI
- **Características**: Polimorfismo, extensibilidade, testabilidade

### **📁 Camada de Utilitários (utils/):**
- **Responsabilidade**: Funções auxiliares e infraestrutura
- **Funcionalidades**:
  - `config_utils.py`: Persistência e migração de configurações
  - `file_utils.py`: Extração de texto de PDF, JSON, TXT com encoding automático
  - `prompt_loader.py`: Carregamento dinâmico de 7 templates
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
- `GET /analysis-types` - Lista 7 tipos de análise disponíveis
- `POST /analyze` - Analisa requisitos com IA

### **⚙️ Configurações:**
- `GET /config` - Carrega configurações do usuário
- `POST /config` - Salva configurações do usuário
- `GET /api-config` - Carrega configurações de API
- `POST /api-config` - Salva configurações de API
- `POST /test-api-config` - Testa configurações de IA

## 🎯 **7 Tipos de Análise Suportados**

### **1. Card QA Writer**
- **Template**: `prompt_template_card_QA_writer.txt.txt`
- **Função**: Análise de cards de PM/PO para geração de casos de teste
- **Formato**: BDD/Gherkin com cenários detalhados

### **2. Test Case Flow Generator**
- **Template**: `prompt_template_test_case_flow_classifier.txt`
- **Função**: Classificação de casos de teste por fluxo
- **Categorias**: Principal, Alternativo, Exceção

### **3. Swagger Postman Generator**
- **Template**: `prompt_template_swagger_postman.txt`
- **Função**: Geração de coleções Postman
- **Entrada**: Arquivo JSON Swagger/OpenAPI

### **4. Swagger Python Generator**
- **Template**: `prompt_template_swagger_python.txt`
- **Função**: Geração de testes Python/pytest
- **Entrada**: Arquivo JSON Swagger/OpenAPI

### **5. Curl Robot API Generator**
- **Template**: `prompt_template_robot_API_generator.txt`
- **Função**: Automação Robot Framework a partir de cURL
- **Entrada**: Comando cURL e resposta opcional

### **6. Swagger Robot Generator**
- **Template**: `prompt_template_swagger_robot_generator.txt`
- **Função**: Automação completa Robot Framework
- **Entrada**: Arquivo JSON Swagger/OpenAPI

### **7. Code Review Analyzer**
- **Template**: `prompt_template_code_review_diff.txt`
- **Função**: Análise técnica de diffs Git
- **Saída**: Feedback em português sobre erros e melhorias

## 🔄 **Fluxo de Dados**

```
Frontend → API Routes → Services → Utils → External APIs
    ↑         ↓           ↓         ↓
    ← JSON Response ← ← ← ← ← ← ← ← ←
```

## 🛠️ **Tecnologias Utilizadas**

- **FastAPI**: Framework web moderno e rápido
- **PyPDF2**: Extração de texto de PDFs
- **OpenAI**: Integração com GPT-4o-mini
- **Requests**: Comunicação HTTP com StackSpot
- **Python-dotenv**: Gerenciamento de variáveis de ambiente
- **Chardet**: Detecção automática de encoding

## 📊 **Características Técnicas**

### **✅ Performance:**
- **Async/Await**: Operações assíncronas
- **Streaming**: Suporte a respostas em tempo real
- **Cache**: Configurações persistidas
- **Encoding Automático**: Detecção inteligente de encoding

### **✅ Segurança:**
- **Validação**: Entrada validada em todas as rotas
- **Sanitização**: Arquivos processados com segurança
- **CORS**: Configurado para frontend
- **Tratamento de Erros**: Exceções capturadas e tratadas

### **✅ Escalabilidade:**
- **Modular**: Fácil adição de novos serviços
- **Extensível**: Factory pattern permite novos IAs
- **Manutenível**: Código organizado e documentado
- **7 Templates**: Sistema flexível de prompts

### **✅ Robustez:**
- **Tratamento de Erros**: Exceções capturadas e tratadas
- **Fallbacks**: Configurações padrão em caso de erro
- **Logging**: Rastreamento de operações
- **Encoding**: Suporte a múltiplos encodings

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

### **Com Makefile:**
```bash
make back          # Inicia apenas o backend
make chat          # Inicia backend + frontend
```

## 📝 **Convenções**

### **Rotas:**
- Organizadas por funcionalidade
- Validação de entrada em todos os endpoints
- Respostas JSON padronizadas
- Tratamento de erros consistente

### **Serviços:**
- Implementam interface IAServiceBase
- Factory pattern para criação dinâmica
- Configurações aplicadas automaticamente
- Suporte a múltiplas IAs

### **Utilitários:**
- Funções puras e reutilizáveis
- Processamento de arquivos robusto
- Carregamento dinâmico de templates
- Sistema de configurações persistente

### **Templates:**
- Padronizados com {requirements}
- 7 tipos especializados
- Carregamento dinâmico
- Placeholders específicos

## 🔧 **Configurações de IA**

### **OpenAI:**
```python
# Configuração via variáveis de ambiente
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **StackSpot AI:**
```python
# Configuração via variáveis de ambiente
Client_ID_stackspot=xxxxxxxx
Client_Key_stackspot=xxxxxxxx
Realm_stackspot=xxxxxxxx
STACKSPOT_AGENT_ID=xxxxxxxx
```

### **Configurações Avançadas:**
- **Streaming**: Resposta em tempo real
- **StackSpot Knowledge**: Usar conhecimento específico
- **Return KS**: Incluir KS na resposta
- **Max Tokens**: Limite configurável

## 📊 **Estatísticas do Backend**

- **📁 Arquivos**: 12 arquivos organizados
- **🎯 Endpoints**: 8 endpoints REST
- **🤖 IAs**: 2 serviços integrados
- **📋 Templates**: 7 prompts especializados
- **📄 Formatos**: PDF, TXT, JSON suportados
- **🔧 Padrões**: Factory, Interface, Dependency Injection

## 🚀 **Melhorias Implementadas**

### **✅ Arquitetura Modular:**
- Separação clara de responsabilidades
- Factory pattern para serviços
- Interface abstrata para IAs
- Utilitários organizados

### **✅ 7 Tipos de Análise:**
- Templates especializados
- Carregamento dinâmico
- Placeholders específicos
- Validação robusta

### **✅ Processamento de Arquivos:**
- Suporte a PDF, TXT, JSON
- Detecção automática de encoding
- Tratamento de erros robusto
- Validação de tamanho e tipo

### **✅ Configurações Avançadas:**
- Sistema híbrido (servidor + localStorage)
- Teste de APIs integrado
- Validação de credenciais
- Persistência automática

---

*Arquitetura robusta e escalável para integração com múltiplas IAs e 7 tipos de análise* 🎯 