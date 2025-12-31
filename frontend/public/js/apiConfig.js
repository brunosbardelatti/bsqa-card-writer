/**
 * Sistema de Configuração Dinâmica de API
 * 
 * Este módulo fornece configuração automática de URLs da API baseada no ambiente.
 * Suporta detecção automática entre desenvolvimento (localhost) e produção,
 * com possibilidade de override manual via window.API_BASE_URL.
 * 
 * Funcionalidades:
 * - 🏠 Desenvolvimento: http://localhost:8000 (auto-detectado)
 * - 🌐 Produção: https://domain.com (auto-detectado baseado no hostname)
 * - ⚙️ Override manual: window.API_BASE_URL
 * - 🔧 Zero configuração necessária para deployments padrão
 */

class ApiConfig {
    constructor() {
        this.baseUrl = this.detectEnvironment();
        console.log(`[ApiConfig] Ambiente detectado: ${this.baseUrl}`);
    }

    /**
     * Detecta automaticamente o ambiente baseado no hostname atual
     * @returns {string} URL base da API
     */
    detectEnvironment() {
        // Permite override manual via window.API_BASE_URL
        if (window.API_BASE_URL) {
            console.log(`[ApiConfig] Usando override manual: ${window.API_BASE_URL}`);
            return window.API_BASE_URL;
        }

        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // Ambiente de desenvolvimento (localhost)
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8000';
        }
        
        // Ambiente de produção - usa o mesmo protocolo e hostname
        const port = window.location.port;
        const baseUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
        
        // Se estiver rodando em uma porta específica diferente de 80/443, assume que é desenvolvimento
        if (port && port !== '80' && port !== '443' && port !== '8080') {
            return `${baseUrl.replace(':' + port, '')}:8000`;
        }
        
        return baseUrl;
    }

    /**
     * Constrói uma URL completa para um endpoint da API
     * @param {string} endpoint - O endpoint da API (ex: '/config', '/analyze')
     * @returns {string} URL completa para o endpoint
     */
    buildUrl(endpoint) {
        // Remove barra inicial duplicada se existir
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
        const fullUrl = `${this.baseUrl}${cleanEndpoint}`;
        
        console.log(`[ApiConfig] Construindo URL: ${endpoint} -> ${fullUrl}`);
        return fullUrl;
    }

    /**
     * Retorna a URL base atual
     * @returns {string} URL base da API
     */
    getBaseUrl() {
        return this.baseUrl;
    }

    /**
     * Permite alterar a URL base manualmente (útil para testes)
     * @param {string} newBaseUrl - Nova URL base
     */
    setBaseUrl(newBaseUrl) {
        this.baseUrl = newBaseUrl;
        console.log(`[ApiConfig] URL base alterada para: ${newBaseUrl}`);
    }

    /**
     * Verifica se a configuração atual é para ambiente de desenvolvimento
     * @returns {boolean} true se for ambiente de desenvolvimento
     */
    isDevelopment() {
        return this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1');
    }

    /**
     * Verifica se a configuração atual é para ambiente de produção
     * @returns {boolean} true se for ambiente de produção
     */
    isProduction() {
        return !this.isDevelopment();
    }
}

// Instância global para uso em toda a aplicação
window.apiConfig = new ApiConfig();

// Exporta para uso como módulo ES6 se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiConfig;
}

// Log de inicialização
console.log(`[ApiConfig] Sistema inicializado - Base URL: ${window.apiConfig.getBaseUrl()}`);
console.log(`[ApiConfig] Ambiente: ${window.apiConfig.isDevelopment() ? 'Desenvolvimento' : 'Produção'}`); 