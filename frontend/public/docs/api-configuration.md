# Configuração Dinâmica de API

## 🔧 Solução Implementada

### 1. Arquivo `apiConfig.js`
Criado sistema de detecção automática de ambiente:

```javascript
// Detecção automática
function getApiBaseUrl() {
  // Override manual (se definido)
  if (window.API_BASE_URL) {
    return window.API_BASE_URL;
  }
  
  // Desenvolvimento local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:8000`;
  }
  
  // Produção (mesmo domínio)
  return `${protocol}//${hostname}`;
}
```

### 2. API Unificada
```javascript
// Usar em vez de URLs hardcoded
window.ApiConfig.buildUrl('/analyze')
window.ApiConfig.buildUrl('/config')
window.ApiConfig.buildUrl('/api-config')
```

## 🌍 Ambientes Suportados

| Ambiente | Base URL | Detecção |
|----------|----------|----------|
| **Desenvolvimento** | `http://localhost:8000` | `hostname === 'localhost'` |
| **Produção** | `https://app.exemplo.com` | Detecção automática |
| **Override Manual** | `window.API_BASE_URL` | Variável global |

## 📁 Arquivos Modificados

- ✅ `js/apiConfig.js` - **Novo arquivo**
- ✅ `js/config.js` - 7 URLs corrigidas
- ✅ `js/chat.js` - 3 URLs corrigidas  
- ✅ `config.html` - Script adicionado
- ✅ `chat.html` - Script adicionado

## 🚀 Como Usar

### Para Override Manual:
```html
<script>
  // Definir antes de carregar apiConfig.js
  window.API_BASE_URL = 'https://api.custom.com';
</script>
<script src="js/apiConfig.js"></script>
```

### Para Desenvolvimento:
```javascript
// Detecção automática para localhost:8000
// Nenhuma configuração necessária
```

### Para Produção:
```javascript
// Detecção automática para mesmo domínio
// Ex: https://app.com → API em https://app.com
```

## ✅ Benefícios

1. **✅ Portabilidade**: Funciona em qualquer ambiente
2. **✅ Segurança**: Elimina URLs hardcoded
3. **✅ Manutenibilidade**: Configuração centralizada
4. **✅ Flexibilidade**: Override manual disponível
5. **✅ Zero Config**: Detecção automática

## 🔍 Validação

Para verificar se não há mais URLs hardcoded:
```bash
grep -r "localhost:8000" frontend/public/js/
# Deve retornar vazio
``` 