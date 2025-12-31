# Configuração Dinâmica de API

## Visão Geral

O sistema de configuração dinâmica de API foi implementado para resolver o problema crítico de URLs hardcoded que impediam o deployment em ambientes de produção. Este sistema detecta automaticamente o ambiente e configura as URLs da API de forma apropriada.

## Problema Resolvido

**Antes da implementação:**
- ❌ 10 URLs hardcoded (`http://localhost:8000`) espalhadas pelo código
- ❌ Impossibilidade de fazer deploy em produção
- ❌ Necessidade de modificação manual do código para cada ambiente

**Após a implementação:**
- ✅ URLs dinâmicas baseadas no ambiente atual
- ✅ Deploy automático em qualquer ambiente
- ✅ Zero configuração necessária para deployments padrão
- ✅ Backward compatible com funcionalidade existente

## Arquitetura

### Componentes

1. **`apiConfig.js`** - Módulo principal de configuração
2. **Detecção automática de ambiente** - Baseada no hostname atual
3. **Sistema de override manual** - Via `window.API_BASE_URL`
4. **Método `buildUrl()`** - Construção centralizada de URLs

### Fluxo de Funcionamento

```mermaid
graph TD
    A[Aplicação Carrega] --> B[apiConfig.js Inicializa]
    B --> C{window.API_BASE_URL existe?}
    C -->|Sim| D[Usar URL Manual]
    C -->|Não| E[Detectar Ambiente]
    E --> F{hostname é localhost?}
    F -->|Sim| G[http://localhost:8000]
    F -->|Não| H[URL baseada no hostname atual]
    D --> I[Instância Global window.apiConfig]
    G --> I
    H --> I
    I --> J[buildUrl() disponível globalmente]
```

## Ambientes Suportados

### 🏠 Desenvolvimento (Localhost)
- **Detecção:** `hostname === 'localhost'` ou `hostname === '127.0.0.1'`
- **URL Base:** `http://localhost:8000`
- **Uso:** Desenvolvimento local

### 🌐 Produção
- **Detecção:** Qualquer hostname que não seja localhost
- **URL Base:** `${protocol}//${hostname}${port}`
- **Uso:** Ambientes de produção, staging, etc.

### ⚙️ Override Manual
- **Configuração:** `window.API_BASE_URL = 'https://api.exemplo.com'`
- **Uso:** Configurações específicas ou testes

## Implementação Técnica

### Arquivos Modificados

#### 1. `js/apiConfig.js` (NOVO)
```javascript
// Sistema de configuração dinâmica
class ApiConfig {
    constructor() {
        this.baseUrl = this.detectEnvironment();
    }
    
    buildUrl(endpoint) {
        return `${this.baseUrl}${endpoint}`;
    }
}

window.apiConfig = new ApiConfig();
```

#### 2. `js/config.js` (7 URLs substituídas)
```javascript
// Antes
const response = await fetch('http://localhost:8000/config');

// Depois
const response = await fetch(window.apiConfig.buildUrl('/config'));
```

#### 3. `js/chat.js` (3 URLs substituídas)
```javascript
// Antes
const res = await fetch('http://localhost:8000/analyze', {

// Depois
const res = await fetch(window.apiConfig.buildUrl('/analyze'), {
```

#### 4. HTML Files (Scripts incluídos)
```html
<!-- chat.html e config.html -->
<script src="js/apiConfig.js"></script>
<script type="module" src="js/main.js"></script>
```

### URLs Substituídas

| Arquivo | Endpoint | Método | Função |
|---------|----------|--------|---------|
| config.js | `/config` | GET | Carregar configurações |
| config.js | `/api-config` | GET | Carregar config de API |
| config.js | `/config` | POST | Salvar configurações |
| config.js | `/api-config` | POST | Salvar config de API |
| config.js | `/api-config` | POST | Testar config de API |
| config.js | `/test-api-config` | POST | Validar conexão |
| config.js | `/analysis-types` | GET | Tipos de análise |
| chat.js | `/analyze` | POST | Processar análise |
| chat.js | `/api-config` | GET | Carregar config de API |
| chat.js | `/analysis-types` | GET | Tipos de análise |

## API do Sistema

### Classe `ApiConfig`

#### Métodos Públicos

```javascript
// Construir URL completa para endpoint
window.apiConfig.buildUrl('/endpoint')
// Retorna: 'http://localhost:8000/endpoint' (dev) ou 'https://domain.com/endpoint' (prod)

// Obter URL base atual
window.apiConfig.getBaseUrl()
// Retorna: 'http://localhost:8000' ou 'https://domain.com'

// Alterar URL base manualmente
window.apiConfig.setBaseUrl('https://api.custom.com')

// Verificar ambiente
window.apiConfig.isDevelopment() // boolean
window.apiConfig.isProduction()  // boolean
```

### Exemplos de Uso

#### Desenvolvimento Local
```javascript
// URL atual: http://localhost:3000
window.apiConfig.buildUrl('/config')
// Resultado: 'http://localhost:8000/config'
```

#### Produção
```javascript
// URL atual: https://app.exemplo.com
window.apiConfig.buildUrl('/analyze')
// Resultado: 'https://app.exemplo.com/analyze'
```

#### Override Manual
```javascript
// Configuração customizada
window.API_BASE_URL = 'https://api-staging.exemplo.com';
// Recarregar página para aplicar

window.apiConfig.buildUrl('/test')
// Resultado: 'https://api-staging.exemplo.com/test'
```

## Configuração para Deploy

### Desenvolvimento
- ✅ **Nenhuma configuração necessária**
- ✅ Detecção automática de localhost
- ✅ URLs apontam para `http://localhost:8000`

### Produção
- ✅ **Nenhuma configuração necessária**
- ✅ Detecção automática do hostname
- ✅ URLs adaptam-se ao domínio atual

### Staging/Custom
```javascript
// No HTML ou antes do carregamento dos scripts
<script>
    window.API_BASE_URL = 'https://api-staging.exemplo.com';
</script>
<script src="js/apiConfig.js"></script>
```

## Validação e Testes

### Verificação de URLs Hardcoded
```bash
# Verificar se ainda existem URLs hardcoded
grep -r "localhost:8000" frontend/public/js/
# Resultado esperado: nenhum resultado
```

### Teste de Funcionalidade
1. **Desenvolvimento:** Acessar `http://localhost:3000` - URLs devem apontar para `:8000`
2. **Produção:** Deploy em domínio - URLs devem apontar para o mesmo domínio
3. **Override:** Configurar `window.API_BASE_URL` - URLs devem usar a configuração manual

### Logs de Debug
O sistema gera logs no console para facilitar debugging:
```javascript
[ApiConfig] Ambiente detectado: http://localhost:8000
[ApiConfig] Sistema inicializado - Base URL: http://localhost:8000
[ApiConfig] Ambiente: Desenvolvimento
[ApiConfig] Construindo URL: /config -> http://localhost:8000/config
```

## Benefícios da Implementação

### 🚀 **Portabilidade**
- Deploy em qualquer ambiente sem modificação de código
- Suporte automático para desenvolvimento e produção

### 🔧 **Manutenibilidade**
- URLs centralizadas em um único local
- Fácil alteração da URL base quando necessário

### 🛡️ **Robustez**
- Detecção automática de ambiente
- Fallback para configuração manual
- Backward compatibility garantida

### 📈 **Escalabilidade**
- Suporte para múltiplos ambientes (dev, staging, prod)
- Configuração flexível via override

## Troubleshooting

### URLs Ainda Apontam para Localhost em Produção
```javascript
// Verificar se o apiConfig foi carregado
console.log(window.apiConfig);

// Verificar detecção de ambiente
console.log(window.apiConfig.getBaseUrl());
console.log(window.apiConfig.isDevelopment());
```

### Override Não Funciona
```javascript
// Configurar ANTES de carregar apiConfig.js
window.API_BASE_URL = 'https://sua-api.com';
// Recarregar página
```

### Erros de CORS em Produção
- Verificar se o backend está configurado para aceitar requests do domínio de produção
- Verificar se o protocolo (HTTP/HTTPS) está correto

## Conclusão

A implementação do sistema de configuração dinâmica de API resolve completamente o problema de URLs hardcoded, permitindo deployments automáticos em qualquer ambiente com zero configuração adicional. O sistema é robusto, flexível e mantém total compatibilidade com o código existente. 