# Software Requirements - BSQA Card Writer

## Visão Geral
Sistema de geração de casos de teste usando IA, com interface web para upload de requisitos e integração com OpenAI e StackSpot AI. Inclui sistema de configurações do usuário, tooltips informativos e armazenamento persistente.

---

## **Frontend (index.html) - Validações e Funcionalidades**

### **Validação de Arquivos**
- ✅ Aceita apenas arquivos **PDF (.pdf)** e **TXT (.txt)**
- ✅ Rejeita arquivos maiores que **100MB**
- ✅ Exibe mensagem de erro clara: *"Tipos de arquivo aceitos: PDF (.pdf) e TXT (.txt). Outros formatos não são suportados."*
- ✅ Exibe mensagem de erro para arquivos grandes: *"Arquivo maior que o tamanho de 100MB suportado. Tente com outro arquivo."*

### **Validação de Entrada**
- ✅ **Mutual exclusividade**: Não permite arquivo E texto simultaneamente
- ✅ **Campo obrigatório**: Exige pelo menos um método de entrada (arquivo OU texto)
- ✅ **Arquivo vazio**: Rejeita arquivos sem conteúdo

### **Feedback Visual**
- ✅ **Loading spinner**: Exibe "Processando requisição..." durante o envio
- ✅ **Botão desabilitado**: Previne múltiplos envios simultâneos
- ✅ **Feedback de arquivo**: Mostra quantidade de arquivos selecionados
- ✅ **Botão remover**: Permite excluir arquivo selecionado (ícone "X")

### **Experiência do Usuário**
- ✅ **Limpeza automática**: Remove arquivo/texto após sucesso
- ✅ **Botão copiar**: Copia resposta para clipboard com feedback visual
- ✅ **Posição sticky**: Botão copiar acompanha scroll da resposta
- ✅ **Responsividade**: Layout adaptável para diferentes telas
- ✅ **Configurações dinâmicas**: Aplica configurações do usuário automaticamente

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

---

## **Página de Configurações (config.html)**

### **Informações Pessoais**
- ✅ **Nome do usuário**: Com tooltip explicativo
- ✅ **Email**: Com tooltip explicativo
- ✅ **Empresa**: Com tooltip explicativo

### **Configurações de IA**
- ✅ **IA Padrão**: Seleção entre OpenAI e StackSpot AI
- ✅ **Máximo de Tokens**: Configurável com tooltip explicativo
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

---

## **Backend (main.py) - Validações e Funcionalidades**

### **Validação de Arquivos**
- ✅ Aceita apenas tipos MIME: `application/pdf`, `text/plain`, `text/utf-8`, `text/txt`, `application/txt`
- ✅ Rejeita arquivos maiores que **100MB**
- ✅ Validação de arquivo vazio após extração

### **Validação de Entrada**
- ✅ **Mutual exclusividade**: Valida que não há arquivo E texto simultaneamente
- ✅ **Campo obrigatório**: Exige pelo menos um método de entrada
- ✅ **Tratamento de erros**: HTTP 400 com mensagens descritivas

### **Processamento de Arquivos**
- ✅ **Extração PDF**: Usa PyPDF2 para extrair texto de PDFs
- ✅ **Extração TXT**: Decodifica arquivos de texto UTF-8
- ✅ **Tratamento de exceções**: Captura erros de processamento

### **Integração com IAs**
- ✅ **OpenAI**: Suporte completo com GPT-4o-mini
- ✅ **StackSpot AI**: Suporte completo com autenticação JWT
- ✅ **Templates dinâmicos**: Carrega prompts específicos por serviço
- ✅ **Configurações dinâmicas**: Aplica configurações do usuário no StackSpot

### **Sistema de Configurações**
- ✅ **Arquivo JSON**: `config/user_config.json` para persistência
- ✅ **Endpoints**: `GET /config` e `POST /config`
- ✅ **Valores padrão**: Configurações sensatas para novos usuários
- ✅ **Tratamento de erros**: Fallback para configurações padrão

### **Segurança e Performance**
- ✅ **CORS habilitado**: Permite requisições cross-origin
- ✅ **Validação de tamanho**: Previne uploads excessivos
- ✅ **Tratamento de erros**: HTTP 500 para erros internos
- ✅ **Respostas JSON**: Formato padronizado para frontend
- ✅ **Gitignore**: Arquivo de configurações não versionado

---

## **Funcionalidades Integradas**

### **Fluxo Completo**
1. **Upload/Input** → Validação frontend → Envio
2. **Processamento** → Validação backend → IA (com configurações)
3. **Resposta** → Formatação → Exibição
4. **Limpeza** → Campos resetados → Pronto para novo input

### **Sistema de Configurações**
1. **Carregamento**: Servidor → Cache local → Aplicação
2. **Salvamento**: Aplicação → Servidor → Cache local
3. **Sincronização**: Automática com fallback offline

### **Tratamento de Erros**
- ✅ **Frontend**: Validação preventiva com feedback visual
- ✅ **Backend**: Validação robusta com mensagens claras
- ✅ **Integração**: Tratamento de erros de rede e API
- ✅ **Configurações**: Fallback para valores padrão

### **Experiência do Usuário**
- ✅ **Feedback contínuo**: Loading, sucesso, erro
- ✅ **Interface intuitiva**: Drag & drop, validação em tempo real
- ✅ **Funcionalidades avançadas**: Copiar, remover, scroll acompanhante
- ✅ **Configurações persistentes**: Sobrevive a reinicializações
- ✅ **Tooltips informativos**: Ajuda contextual em todas as opções

---

## **Requisitos Técnicos**

### **Frontend**
- **Tecnologias**: HTML5, CSS3, JavaScript ES6+
- **Compatibilidade**: Navegadores modernos (Chrome, Firefox, Safari, Edge)
- **Responsividade**: Layout adaptável para desktop e mobile
- **Acessibilidade**: Tooltips, feedback visual, navegação por teclado
- **Armazenamento**: localStorage + sincronização com servidor

### **Backend**
- **Framework**: FastAPI (Python 3.8+)
- **Dependências**: uvicorn, openai, requests, PyPDF2, python-dotenv
- **Porta**: 8000 (configurável)
- **CORS**: Habilitado para desenvolvimento
- **Configurações**: Sistema de arquivo JSON persistente

### **Integração**
- **API Endpoint**: `POST /analyze`
- **Configurações**: `GET /config`, `POST /config`
- **Formato**: multipart/form-data, application/json
- **Resposta**: JSON com campo `result`
- **Timeout**: Configurável (padrão: sem limite)

---

## **Sistema de Configurações**

### **Arquitetura Híbrida**
- **Servidor**: Fonte da verdade (persistente)
- **localStorage**: Cache temporário (performance)
- **Sincronização**: Automática entre cliente e servidor

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

---

## **Limitações Conhecidas**

### **Arquivos**
- Tamanho máximo: 100MB
- Tipos suportados: PDF, TXT
- Codificação: UTF-8 obrigatória

### **IA**
- OpenAI: Limite de tokens configurável
- StackSpot: Depende de credenciais válidas
- Timeout: Varia conforme serviço

### **Interface**
- Upload único: Apenas um arquivo por vez
- Texto: Sem limite de caracteres (prático)
- Resposta: Scroll automático após 15 linhas

### **Configurações**
- Arquivo único: Configurações compartilhadas entre usuários
- Backup manual: Usuário deve copiar arquivo para backup
- Sincronização: Requer servidor ativo para sincronização completa

---

## **Configurações**

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
```

---

## **Testes Implementados**

### **Validação de Arquivos**
- ✅ PDF válido (sucesso)
- ✅ TXT válido (sucesso)
- ✅ Arquivo inválido (erro)
- ✅ Arquivo grande >100MB (erro)
- ✅ Arquivo vazio (erro)

### **Validação de Entrada**
- ✅ Apenas texto (sucesso)
- ✅ Apenas arquivo (sucesso)
- ✅ Texto + arquivo (erro)
- ✅ Nenhum input (erro)

### **Integração IA**
- ✅ OpenAI (sucesso)
- ✅ StackSpot (sucesso)
- ✅ StackSpot com configurações (sucesso)
- ✅ Erro de API (tratamento)

### **Sistema de Configurações**
- ✅ Carregamento do servidor (sucesso)
- ✅ Salvamento no servidor (sucesso)
- ✅ Fallback para localStorage (sucesso)
- ✅ Valores padrão (sucesso)
- ✅ Tooltips informativos (funcionando)

### **Interface**
- ✅ Upload drag & drop
- ✅ Remoção de arquivo
- ✅ Copiar resposta
- ✅ Loading states
- ✅ Responsividade
- ✅ Botões de ação (Help/Config)
- ✅ Página de configurações

---

## **Roadmap Futuro**

### **Funcionalidades Planejadas**
- 🔄 **Histórico de análises**: Visualizar e reutilizar análises anteriores
- 🔄 **Tema claro**: Implementação completa do tema claro
- 🔄 **Notificações**: Sistema de notificações para o usuário
- 🔄 **Múltiplos usuários**: Sistema de autenticação e perfis
- 🔄 **Backup automático**: Sincronização com nuvem
- 🔄 **Exportação**: PDF, Word, Excel
- 🔄 **Templates**: Casos de teste pré-definidos

### **Melhorias Técnicas**
- 🔄 **Cache avançado**: Redis para melhor performance
- 🔄 **Logs estruturados**: Sistema de logging completo
- 🔄 **Métricas**: Monitoramento de uso e performance
- 🔄 **Testes automatizados**: Suite completa de testes
- 🔄 **CI/CD**: Pipeline de deploy automático

---

*Documento atualizado em: 18/07/2025*
*Versão: 2.0*
*Projeto: BSQA Card Writer* 