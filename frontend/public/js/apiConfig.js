// apiConfig.js - Configuração dinâmica da API baseURL

/**
 * Verifica se está em ambiente de desenvolvimento
 * @returns {boolean} True se estiver em desenvolvimento
 */
function isDevelopment() {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Log seguro - apenas em desenvolvimento
 * @param {...any} args - Argumentos para log
 */
function safeLog(...args) {
  if (isDevelopment()) {
    console.log(...args);
  }
}

/**
 * Detecta automaticamente a baseURL da API baseado no ambiente
 * @returns {string} A baseURL da API
 */
function getApiBaseUrl() {
  // Se há uma variável global definida, usar ela (para override manual)
  if (window.API_BASE_URL) {
    return window.API_BASE_URL;
  }
  
  // Detectar baseado no hostname atual
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  
  // Ambiente de desenvolvimento local
  if (isDevelopment()) {
    return `${protocol}//${hostname}:8000`;
  }
  
  // Ambiente de produção ou outros
  // Assume que a API está no mesmo domínio, porta padrão
  return `${protocol}//${hostname}`;
}

/**
 * Constrói URL completa para chamada da API
 * @param {string} endpoint - O endpoint da API (ex: '/analyze', '/config')
 * @returns {string} A URL completa
 */
function buildApiUrl(endpoint) {
  const baseUrl = getApiBaseUrl();
  // Garante que o endpoint comece com /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;
  
  // Log seguro apenas em desenvolvimento (sem expor URL completa)
  if (isDevelopment()) {
    safeLog(`[ApiConfig] Construindo URL: ${cleanEndpoint} -> ${fullUrl}`);
  }
  
  return fullUrl;
}

// Exportar as funções
window.ApiConfig = {
  getBaseUrl: getApiBaseUrl,
  buildUrl: buildApiUrl
};

// Log da configuração detectada (apenas em development, sem expor URL completa)
if (isDevelopment()) {
  safeLog(`[API Config] Base URL detectada: ${getApiBaseUrl()}`);
} 