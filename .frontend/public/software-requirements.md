# Software Requirements - BSQA Card Writer

## Visão Geral
Sistema de geração de casos de teste usando IA, com interface web para upload de requisitos e integração com OpenAI e StackSpot AI.

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

### **Interface**
- ✅ **Layout simétrico**: Textarea e drop-zone com mesma largura
- ✅ **Textarea não redimensionável**: Com scroll vertical automático
- ✅ **10 linhas para input**: Campo de texto expandido
- ✅ **15 linhas para resposta**: Com scroll quando necessário

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

### **Segurança e Performance**
- ✅ **CORS habilitado**: Permite requisições cross-origin
- ✅ **Validação de tamanho**: Previne uploads excessivos
- ✅ **Tratamento de erros**: HTTP 500 para erros internos
- ✅ **Respostas JSON**: Formato padronizado para frontend

---

## **Funcionalidades Integradas**

### **Fluxo Completo**
1. **Upload/Input** → Validação frontend → Envio
2. **Processamento** → Validação backend → IA
3. **Resposta** → Formatação → Exibição
4. **Limpeza** → Campos resetados → Pronto para novo input

### **Tratamento de Erros**
- ✅ **Frontend**: Validação preventiva com feedback visual
- ✅ **Backend**: Validação robusta com mensagens claras
- ✅ **Integração**: Tratamento de erros de rede e API

### **Experiência do Usuário**
- ✅ **Feedback contínuo**: Loading, sucesso, erro
- ✅ **Interface intuitiva**: Drag & drop, validação em tempo real
- ✅ **Funcionalidades avançadas**: Copiar, remover, scroll acompanhante

---

## **Requisitos Técnicos**

### **Frontend**
- **Tecnologias**: HTML5, CSS3, JavaScript ES6+
- **Compatibilidade**: Navegadores modernos (Chrome, Firefox, Safari, Edge)
- **Responsividade**: Layout adaptável para desktop e mobile
- **Acessibilidade**: Tooltips, feedback visual, navegação por teclado

### **Backend**
- **Framework**: FastAPI (Python 3.8+)
- **Dependências**: uvicorn, openai, requests, PyPDF2, python-dotenv
- **Porta**: 8000 (configurável)
- **CORS**: Habilitado para desenvolvimento

### **Integração**
- **API Endpoint**: `POST /analyze`
- **Formato**: multipart/form-data
- **Resposta**: JSON com campo `result`
- **Timeout**: Configurável (padrão: sem limite)

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
- ✅ Erro de API (tratamento)

### **Interface**
- ✅ Upload drag & drop
- ✅ Remoção de arquivo
- ✅ Copiar resposta
- ✅ Loading states
- ✅ Responsividade

---

*Documento gerado em: $(date)*
*Versão: 1.0*
*Projeto: BSQA Card Writer* 