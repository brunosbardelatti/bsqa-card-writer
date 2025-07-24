# Software Requirements - BSQA Card Writer

## Visão Geral
Sistema de geração de casos de teste usando IA, com interface web moderna para upload de requisitos e integração com OpenAI e StackSpot AI. Inclui 7 tipos diferentes de análise, sistema de configurações avançado, home page interativa e documentação completa.

---

## **🏠 Home Page (index.html) - Interface Moderna**

### **Hero Features**
- ✅ **4 Cards Principais**: Chat Inteligente, Configurações, Múltiplas IAs, Templates
- ✅ **Cards Interativos**: Hover effects e navegação direta
- ✅ **Design Responsivo**: 2x2 grid em desktop, 1 coluna em mobile
- ✅ **Altura Uniforme**: Cards com altura padronizada independente do conteúdo
- ✅ **Navegação Direta**: Links para funcionalidades específicas

### **Tipos de Análise**
- ✅ **7 Cards Clicáveis**: Todos os tipos de análise disponíveis
- ✅ **Pré-seleção Automática**: URL parameters (?type=) para pré-seleção
- ✅ **Placeholders Específicos**: Cada tipo tem descrição única
- ✅ **Navegação Intuitiva**: Cards direcionam para chat.html com tipo pré-selecionado

### **Interface Moderna**
- ✅ **Breadcrumbs**: Navegação clara (Home)
- ✅ **Header Consistente**: Menu em todas as páginas
- ✅ **Animações**: Hover effects e transições suaves
- ✅ **Responsividade**: Adapta-se a qualquer dispositivo

---

## **💬 Chat Page (chat.html) - Validações e Funcionalidades**

### **Validação de Arquivos**
- ✅ Aceita apenas arquivos **PDF (.pdf)**, **TXT (.txt)** e **JSON (.json)**
- ✅ Rejeita arquivos maiores que **100MB**
- ✅ Exibe mensagem de erro clara: *"Tipos de arquivo aceitos: PDF (.pdf), TXT (.txt) e JSON (.json). Outros formatos não são suportados."*
- ✅ Exibe mensagem de erro para arquivos grandes: *"Arquivo maior que o tamanho de 100MB suportado. Tente com outro arquivo."*

### **Validação de Entrada**
- ✅ **Mutual exclusividade**: Não permite arquivo E texto simultaneamente
- ✅ **Campo obrigatório**: Exige pelo menos um método de entrada (arquivo OU texto)
- ✅ **Arquivo vazio**: Rejeita arquivos sem conteúdo
- ✅ **Encoding automático**: Detecta encoding de arquivos automaticamente

### **7 Tipos de Análise**
- ✅ **Card QA Writer**: Análise de cards de PM/PO para casos de teste
- ✅ **Test Case Flow Generator**: Classificação por fluxo (Principal/Alternativo/Exceção)
- ✅ **Swagger Postman Generator**: Geração de coleções Postman
- ✅ **Swagger Python Generator**: Geração de testes Python/pytest
- ✅ **Curl Robot API Generator**: Automação Robot Framework a partir de cURL
- ✅ **Swagger Robot Generator**: Automação completa Robot Framework
- ✅ **Code Review Analyzer**: Análise técnica de diffs Git

### **Feedback Visual**
- ✅ **Loading spinner**: Exibe "Processando requisição..." durante o envio
- ✅ **Botão desabilitado**: Previne múltiplos envios simultâneos
- ✅ **Feedback de arquivo**: Mostra quantidade de arquivos selecionados
- ✅ **Botão remover**: Permite excluir arquivo selecionado (ícone "X")
- ✅ **Breadcrumbs**: Navegação clara (Home > Chat)

### **Experiência do Usuário**
- ✅ **Limpeza automática**: Remove arquivo/texto após sucesso
- ✅ **Botão copiar**: Copia resposta para clipboard com feedback visual
- ✅ **Posição sticky**: Botão copiar acompanha scroll da resposta
- ✅ **Responsividade**: Layout adaptável para diferentes telas
- ✅ **Configurações dinâmicas**: Aplica configurações do usuário automaticamente
- ✅ **Pré-seleção de tipo**: URL parameters para pré-selecionar tipo de análise

### **Interface**
- ✅ **Layout simétrico**: Textarea e drop-zone com mesma largura
- ✅ **Textarea não redimensionável**: Com scroll vertical automático
- ✅ **10 linhas para input**: Campo de texto expandido
- ✅ **15 linhas para resposta**: Com scroll quando necessário
- ✅ **Botões de ação**: Help (❓) e Configurações (⚙️) fixos no canto superior direito

### **Sistema de Configurações**
- ✅ **Integração StackSpot**: Envia configurações do usuário para o backend
- ✅ **Cache local**: Usa localStorage como cache temporário
- ✅ **Sincronização**: Automática entre cliente e servidor
- ✅ **Fallback**: Funciona offline usando cache local
- ✅ **Flag de controle**: Gerenciamento correto da flag pageReloaded

---

## **⚙️ Página de Configurações (config.html)**

### **Informações Pessoais**
- ✅ **Nome do usuário**: Com tooltip explicativo
- ✅ **Email**: Com tooltip explicativo
- ✅ **Empresa**: Com tooltip explicativo

### **Configurações de IA**
- ✅ **IA Padrão**: Seleção entre OpenAI e StackSpot AI
- ✅ **Máximo de Tokens**: Configurável com tooltip explicativo
- ✅ **Tipo de Análise Padrão**: Seleção do tipo de análise padrão
- ✅ **Configurações StackSpot**:
  - **Streaming**: Resposta em tempo real (default: false)
  - **StackSpot Knowledge**: Usar conhecimento específico (default: false)
  - **Return KS**: Incluir KS na resposta (default: false)

### **Preferências de Saída**
- ✅ **Auto Copy**: Copiar automaticamente (default: false)
- ✅ **Clear After Success**: Limpar campos após sucesso (default: true)
- ✅ **Show History**: Funcionalidade em desenvolvimento (desabilitado)

### **Configurações de Interface**
- ✅ **Tema**: Escuro/Claro/Automático (default: dark)

### **Tooltips Informativos**
- ✅ **Ícones ⓘ**: Em todas as opções com explicações detalhadas
- ✅ **Cursor help**: Indica informações disponíveis
- ✅ **Explicações claras**: Descrição do que cada opção faz

### **Sistema de Salvamento**
- ✅ **Salvamento híbrido**: Servidor + localStorage
- ✅ **Feedback visual**: Botão com estados (Salvando... → Salvo! ✅)
- ✅ **Fallback**: Salva localmente se servidor indisponível
- ✅ **Indicadores**: Diferencia salvamento local vs servidor

### **Teste de APIs**
- ✅ **Botão de teste**: "🧪 Testar conexão com IA"
- ✅ **Validação automática**: Testa credenciais antes de salvar
- ✅ **Feedback visual**: Mostra resultado do teste
- ✅ **Layout otimizado**: Botões lado a lado com largura padronizada

### **Navegação por Anchors**
- ✅ **Seções específicas**: #ai-config, #template-config
- ✅ **Scroll automático**: Navegação para seções específicas
- ✅ **Highlight temporário**: Destaque visual da seção
- ✅ **URL parameters**: Suporte a anchors na URL

---

## **📋 Página de Documentação (docs.html)**

### **Carregamento de Conteúdo**
- ✅ **Markdown renderizado**: Conversão automática para HTML
- ✅ **Software Requirements**: Documentação técnica completa
- ✅ **Navegação**: Menu header consistente
- ✅ **Breadcrumbs**: Navegação clara (Home > Documentação)

### **Interface**
- ✅ **Layout limpo**: Sem botões redundantes
- ✅ **Conteúdo dinâmico**: Carregamento via JavaScript
- ✅ **Responsividade**: Adapta-se a diferentes telas
- ✅ **Navegação por teclado**: Suporte a Escape para voltar

---

## **🏗️ Backend (main.py) - Validações e Funcionalidades**

### **Validação de Arquivos**
- ✅ Aceita apenas tipos MIME: `application/pdf`, `text/plain`, `text/utf-8`, `text/txt`, `application/txt`, `application/json`
- ✅ Rejeita arquivos maiores que **100MB**
- ✅ Validação de arquivo vazio após extração
- ✅ **Encoding automático**: Detecção inteligente com chardet

### **Validação de Entrada**
- ✅ **Mutual exclusividade**: Valida que não há arquivo E texto simultaneamente
- ✅ **Campo obrigatório**: Exige pelo menos um método de entrada
- ✅ **Tratamento de erros**: HTTP 400 com mensagens descritivas
- ✅ **7 tipos de análise**: Validação de tipos suportados

### **Processamento de Arquivos**
- ✅ **Extração PDF**: Usa PyPDF2 para extrair texto de PDFs
- ✅ **Extração TXT**: Decodifica arquivos de texto com encoding automático
- ✅ **Extração JSON**: Processa arquivos JSON para Swagger
- ✅ **Tratamento de exceções**: Captura erros de processamento
- ✅ **Encoding robusto**: Suporte a UTF-8, Latin-1, CP1252, ISO-8859-1

### **7 Tipos de Análise Suportados**

#### **1. Card QA Writer**
```json
{
  "analyse_type": "card_QA_writer",
  "requirements": "Dados do card de PM/PO...",
  "service": "openai"
}
```

#### **2. Test Case Flow Generator**
```json
{
  "analyse_type": "test_case_flow_classifier",
  "requirements": "Requisitos para classificação...",
  "service": "openai"
}
```

#### **3. Swagger Postman Generator**
```json
{
  "analyse_type": "swagger_postman",
  "file": "swagger.json",
  "service": "openai"
}
```

#### **4. Swagger Python Generator**
```json
{
  "analyse_type": "swagger_python",
  "file": "swagger.json",
  "service": "openai"
}
```

#### **5. Curl Robot API Generator**
```json
{
  "analyse_type": "robot_api_generator",
  "requirements": "curl -X GET https://api.example.com/users",
  "service": "openai"
}
```

#### **6. Swagger Robot Generator**
```json
{
  "analyse_type": "swagger_robot_generator",
  "file": "swagger.json",
  "service": "openai"
}
```

#### **7. Code Review Analyzer**
```json
{
  "analyse_type": "code_review_diff",
  "requirements": "diff --git a/file.py b/file.py...",
  "service": "openai"
}
```

### **Exemplos de Configuração**

#### **Configuração JSON do Usuário**
```json
{
  "user": {
    "name": "João Silva",
    "email": "joao@empresa.com",
    "company": "Empresa XYZ"
  },
  "preferences": {
    "autoCopy": true,
    "clearAfterSuccess": true,
    "theme": "dark"
  },
  "ai": {
    "default": "openai",
    "defaultAnalyseType": "card_QA_writer",
    "openai": {
      "enabled": true,
      "maxTokens": 1000
    },
    "stackspot": {
      "enabled": false,
      "streaming": false,
      "knowledge": false,
      "returnKs": false
    }
  }
}
```

#### **Exemplo de Requisição API**
```javascript
// Requisição para análise de requisitos
const response = await fetch('/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    requirements: 'Dados do card de PM/PO...',
    service: 'openai',
    analyse_type: 'card_QA_writer'
  })
});

const result = await response.json();
console.log('Análise gerada:', result);
```

#### **Exemplo de Script Python**
```python
# Exemplo de processamento de arquivo PDF
import PyPDF2
from pathlib import Path

def extract_pdf_text(file_path):
    """Extrai texto de arquivo PDF"""
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
        return text
    except Exception as e:
        print(f"Erro ao processar PDF: {e}")
        return None

# Uso da função
pdf_path = Path("requisitos.pdf")
texto_extraido = extract_pdf_text(pdf_path)
```

#### **Exemplo de Comando Bash**
```bash
# Script para iniciar o servidor
#!/bin/bash

echo "🚀 Iniciando BSQA Card Writer..."

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado"
    exit 1
fi

# Instalar dependências
pip install -r requirements.txt

# Iniciar servidor
python main.py

echo "✅ Servidor iniciado em http://localhost:8000"
```

### **Integração com IAs**
- ✅ **OpenAI**: Suporte completo com GPT-4o-mini
- ✅ **StackSpot AI**: Suporte completo com autenticação JWT
- ✅ **Templates dinâmicos**: Carrega 7 prompts específicos por serviço
- ✅ **Configurações dinâmicas**: Aplica configurações do usuário no StackSpot
- ✅ **Factory Pattern**: Arquitetura modular para serviços de IA

### **Sistema de Configurações**
- ✅ **Arquivo JSON**: `config/user_config.json` para persistência
- ✅ **Endpoints**: `GET /config` e `POST /config`
- ✅ **Valores padrão**: Configurações sensatas para novos usuários
- ✅ **Tratamento de erros**: Fallback para configurações padrão
- ✅ **Teste de APIs**: Validação de credenciais antes de salvar

### **Segurança e Performance**
- ✅ **CORS habilitado**: Permite requisições cross-origin
- ✅ **Validação de tamanho**: Previne uploads excessivos
- ✅ **Tratamento de erros**: HTTP 500 para erros internos
- ✅ **Respostas JSON**: Formato padronizado para frontend
- ✅ **Gitignore**: Arquivo de configurações não versionado
- ✅ **Encoding robusto**: Suporte a múltiplos encodings

---

## **🚀 Funcionalidades Integradas**

### **Fluxo Completo**
1. **Upload/Input** → Validação frontend → Envio
2. **Processamento** → Validação backend → IA (com configurações)
3. **Resposta** → Formatação → Exibição
4. **Limpeza** → Campos resetados → Pronto para novo input

### **Sistema de Configurações**
1. **Carregamento**: Servidor → Cache local → Aplicação
2. **Salvamento**: Aplicação → Servidor → Cache local
3. **Sincronização**: Automática com fallback offline
4. **Validação**: Teste de APIs antes de salvar

### **Tratamento de Erros**
- ✅ **Frontend**: Validação preventiva com feedback visual
- ✅ **Backend**: Validação robusta com mensagens claras
- ✅ **Integração**: Tratamento de erros de rede e API
- ✅ **Configurações**: Fallback para valores padrão
- ✅ **Encoding**: Detecção automática e fallbacks

### **Experiência do Usuário**
- ✅ **Feedback contínuo**: Loading, sucesso, erro
- ✅ **Interface intuitiva**: Drag & drop, validação em tempo real
- ✅ **Funcionalidades avançadas**: Copiar, remover, scroll acompanhante
- ✅ **Configurações persistentes**: Sobrevive a reinicializações
- ✅ **Tooltips informativos**: Ajuda contextual em todas as opções
- ✅ **Navegação moderna**: Home page com cards interativos
- ✅ **Breadcrumbs**: Navegação clara em todas as páginas

---

## **📊 Requisitos Técnicos**

### **Frontend**
- **Tecnologias**: HTML5, CSS3, JavaScript ES6+
- **Compatibilidade**: Navegadores modernos (Chrome, Firefox, Safari, Edge)
- **Responsividade**: Layout adaptável para desktop e mobile
- **Acessibilidade**: Tooltips, feedback visual, navegação por teclado
- **Armazenamento**: localStorage + sincronização com servidor
- **Componentes**: Header, footer, breadcrumbs reutilizáveis

### **Backend**
- **Framework**: FastAPI (Python 3.8+)
- **Dependências**: uvicorn, openai, requests, PyPDF2, python-dotenv, chardet
- **Porta**: 8000 (configurável)
- **CORS**: Habilitado para desenvolvimento
- **Configurações**: Sistema de arquivo JSON persistente
- **Arquitetura**: Factory pattern, interface abstrata, modular

### **Integração**
- **API Endpoint**: `POST /analyze`
- **Configurações**: `GET /config`, `POST /config`
- **Formato**: multipart/form-data, application/json
- **Resposta**: JSON com campo `result`
- **Timeout**: Configurável (padrão: sem limite)
- **7 Tipos**: Análise especializada por tipo

---

## **⚙️ Sistema de Configurações**

### **Arquitetura Híbrida**
- **Servidor**: Fonte da verdade (persistente)
- **localStorage**: Cache temporário (performance)
- **Sincronização**: Automática entre cliente e servidor
- **Validação**: Teste de APIs antes de salvar

### **Arquivos de Configuração**
- **`config/user_config.json`**: Configurações do usuário (não versionado)
- **`config/user_config.example.json`**: Exemplo de estrutura
- **`config/env.example`**: Exemplo de variáveis de ambiente

### **Configurações Disponíveis**
```json
{
  "userName": "Nome do usuário",
  "userEmail": "Email para contato",
  "userCompany": "Empresa",
  "defaultAI": "openai|stackspot",
  "defaultAnalyseType": "card_QA_writer|test_case_flow_classifier|...",
  "maxTokens": 1000,
  "autoCopy": false,
  "clearAfterSuccess": true,
  "theme": "dark|light|auto",
  "streaming": false,
  "stackspotKnowledge": false,
  "returnKsInResponse": false
}
```

### **Vantagens do Sistema**
- ✅ **Persistente**: Sobrevive a reinicializações
- ✅ **Portável**: Funciona em qualquer computador
- ✅ **Backup**: Pode ser versionado (sem dados pessoais)
- ✅ **Offline**: Funciona mesmo sem servidor
- ✅ **Performance**: Cache local para carregamento rápido
- ✅ **Validação**: Teste de APIs integrado

---

## **📋 Limitações Conhecidas**

### **Arquivos**
- Tamanho máximo: 100MB
- Tipos suportados: PDF, TXT, JSON
- Codificação: UTF-8, Latin-1, CP1252, ISO-8859-1 (detecção automática)

### **IA**
- OpenAI: Limite de tokens configurável
- StackSpot: Depende de credenciais válidas
- Timeout: Varia conforme serviço
- 7 tipos: Especializados por funcionalidade

### **Interface**
- Upload único: Apenas um arquivo por vez
- Texto: Sem limite de caracteres (prático)
- Resposta: Scroll automático após 15 linhas
- Cards: Altura uniforme em home page

### **Configurações**
- Arquivo único: Configurações compartilhadas entre usuários
- Backup manual: Usuário deve copiar arquivo para backup
- Sincronização: Requer servidor ativo para sincronização completa
- Validação: Teste de APIs antes de salvar

---

## **🔧 Configurações**

### **Variáveis de Ambiente**
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Client_ID_stackspot=xxxxxxxx
Client_Key_stackspot=xxxxxxxx
Realm_stackspot=xxxxxxxx
STACKSPOT_AGENT_ID=xxxxxxxx
```

### **Portas**
- **Backend**: 8000
- **Frontend**: 8501

### **Comandos**
```bash
# Desenvolvimento
make chat          # Inicia backend + frontend
make back          # Apenas backend
make front         # Apenas frontend

# Setup
make setup         # Instala dependências

# Controle
make stop-all      # Para todos os processos
make stop-back     # Para apenas o backend
make stop-front    # Para apenas o frontend
```

---

## **🧪 Testes Implementados**

### **Validação de Arquivos**
- ✅ PDF válido (sucesso)
- ✅ TXT válido (sucesso)
- ✅ JSON válido (sucesso)
- ✅ Arquivo inválido (erro)
- ✅ Arquivo grande >100MB (erro)
- ✅ Arquivo vazio (erro)
- ✅ Encoding automático (sucesso)

### **Validação de Entrada**
- ✅ Apenas texto (sucesso)
- ✅ Apenas arquivo (sucesso)
- ✅ Texto + arquivo (erro)
- ✅ Nenhum input (erro)
- ✅ 7 tipos de análise (sucesso)

### **Integração IA**
- ✅ OpenAI (sucesso)
- ✅ StackSpot (sucesso)
- ✅ StackSpot com configurações (sucesso)
- ✅ Erro de API (tratamento)
- ✅ 7 templates (funcionando)

### **Sistema de Configurações**
- ✅ Carregamento do servidor (sucesso)
- ✅ Salvamento no servidor (sucesso)
- ✅ Fallback para localStorage (sucesso)
- ✅ Valores padrão (sucesso)
- ✅ Tooltips informativos (funcionando)
- ✅ Teste de APIs (funcionando)

### **Interface**
- ✅ Upload drag & drop
- ✅ Remoção de arquivo
- ✅ Copiar resposta
- ✅ Loading states
- ✅ Responsividade
- ✅ Botões de ação (Help/Config)
- ✅ Página de configurações
- ✅ Home page interativa
- ✅ Breadcrumbs
- ✅ Cards clicáveis

### **Navegação**
- ✅ Header consistente
- ✅ Breadcrumbs dinâmicos
- ✅ URL parameters
- ✅ Anchors (#ai-config, #template-config)
- ✅ Pré-seleção de tipos

---

## **🚀 Roadmap Futuro**

### **✅ Funcionalidades Implementadas**
- ✅ **7 Tipos de Análise**: Todos funcionais e especializados
- ✅ **Múltiplas IAs**: OpenAI e StackSpot integradas
- ✅ **Interface Moderna**: Home page com cards interativos
- ✅ **Sistema de Temas**: Dark/light/auto com persistência
- ✅ **Configurações Avançadas**: Interface completa com validação
- ✅ **Responsividade**: Mobile e desktop otimizados
- ✅ **Documentação**: Completa e atualizada
- ✅ **Breadcrumbs**: Navegação clara em todas as páginas
- ✅ **Encoding Automático**: Detecção inteligente de encoding
- ✅ **Teste de APIs**: Validação de credenciais
- ✅ **URL Parameters**: Pré-seleção de tipos de análise
- ✅ **Anchors**: Navegação para seções específicas

### **🔄 Próximas Funcionalidades**
- 🔄 **Histórico de Análises**: Visualizar e reutilizar análises anteriores
- 🔄 **Exportação**: PDF, Word, Excel
- 🔄 **Templates Customizáveis**: Criar templates próprios
- 🔄 **Múltiplos Usuários**: Sistema de autenticação
- 🔄 **Backup Automático**: Sincronização com nuvem
- 🔄 **Métricas**: Dashboard de uso e performance
- 🔄 **Notificações**: Sistema de notificações para o usuário
- 🔄 **Tema claro**: Implementação completa do tema claro
- 🔄 **Cache avançado**: Redis para melhor performance
- 🔄 **Logs estruturados**: Sistema de logging completo
- 🔄 **Testes automatizados**: Suite completa de testes
- 🔄 **CI/CD**: Pipeline de deploy automático

---

## **📊 Estatísticas do Projeto**

### **Funcionalidades**
- **📁 Arquivos**: 25+ arquivos organizados
- **🎯 Tipos de Análise**: 7 especializados
- **🤖 IAs Integradas**: 2 (OpenAI + StackSpot)
- **🎨 Temas**: 3 (Escuro, Claro, Automático)
- **📱 Responsividade**: Mobile + Desktop
- **🔧 APIs**: 8 endpoints REST
- **📋 Templates**: 7 prompts especializados

### **Interface**
- **🏠 Páginas**: 4 (Home, Chat, Config, Docs)
- **🎨 Componentes**: Header, Footer, Breadcrumbs
- **📱 Responsividade**: 3 breakpoints
- **🎯 Cards Interativos**: 11 cards clicáveis

### **Backend**
- **🏗️ Arquitetura**: Factory Pattern + Interface
- **📁 Módulos**: API, Services, Utils
- **🔧 Padrões**: SOLID, Clean Architecture
- **📄 Formatos**: PDF, TXT, JSON

---

*Documento atualizado em: Janeiro 2025*
*Versão: 3.0*
*Projeto: BSQA Card Writer*
*Funcionalidades: 7 tipos de análise + Interface moderna* 