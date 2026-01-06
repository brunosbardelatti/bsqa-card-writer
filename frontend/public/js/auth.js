/**
 * Módulo de Autenticação
 * Gerencia login, logout, tokens JWT e verificação de autenticação
 */

// ============================================
// CONSTANTES
// ============================================

const AUTH_TOKEN_KEY = 'bsqa_auth_token';
const AUTH_USER_KEY = 'bsqa_auth_user';
const API_BASE_URL = window.location.origin;

// ============================================
// GERENCIAMENTO DE TOKEN
// ============================================

/**
 * Salva token de autenticação no localStorage
 */
export function saveAuthToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Obtém token de autenticação
 */
export function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Remove token de autenticação
 */
export function removeAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
}

// ============================================
// GERENCIAMENTO DE USUÁRIO
// ============================================

/**
 * Salva dados do usuário
 */
export function saveAuthUser(user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

/**
 * Obtém dados do usuário autenticado
 */
export function getAuthUser() {
    const userJson = localStorage.getItem(AUTH_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
}

// ============================================
// VERIFICAÇÕES DE AUTENTICAÇÃO
// ============================================

/**
 * Verifica se o usuário está autenticado
 */
export function isAuthenticated() {
    return !!getAuthToken();
}

/**
 * Verifica se o usuário é admin
 */
export function isAdmin() {
    const user = getAuthUser();
    return user && user.perfil === 'admin';
}

// ============================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================

/**
 * Realiza login
 */
export async function login(username, senha) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, senha })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao fazer login');
        }

        const data = await response.json();
        
        // Salvar token e dados do usuário
        saveAuthToken(data.access_token);
        saveAuthUser(data.user);
        
        return data;
    } catch (error) {
        throw error;
    }
}

/**
 * Realiza logout
 */
export async function logout() {
    const token = getAuthToken();
    
    if (token) {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }
    
    // Remover dados locais
    removeAuthToken();
    
    // Redirecionar para login
    window.location.href = '/login.html';
}

/**
 * Verifica se o token é válido
 */
export async function verifyToken() {
    const token = getAuthToken();
    
    if (!token) {
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        return false;
    }
}

// ============================================
// MIDDLEWARES DE PROTEÇÃO
// ============================================

/**
 * Middleware para proteger páginas
 * Redireciona para login se não estiver autenticado
 */
export async function requireAuth() {
    const isValid = await verifyToken();
    
    if (!isValid) {
        removeAuthToken();
        window.location.href = '/login.html';
        return false;
    }
    
    return true;
}

/**
 * Middleware para proteger páginas de admin
 */
export async function requireAdmin() {
    const isValid = await requireAuth();
    
    if (!isValid) {
        return false;
    }
    
    if (!isAdmin()) {
        alert('Acesso negado. Esta página é restrita a administradores.');
        window.location.href = '/index.html';
        return false;
    }
    
    return true;
}

// ============================================
// HEADERS DE AUTENTICAÇÃO
// ============================================

/**
 * Adiciona token JWT em requisições
 */
export function getAuthHeaders() {
    const token = getAuthToken();
    
    if (token) {
        return {
            'Authorization': `Bearer ${token}`
        };
    }
    
    return {};
}

// ============================================
// FETCH AUTENTICADO
// ============================================

/**
 * Wrapper para fetch com autenticação automática
 */
export async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Usuário não autenticado');
    }
    
    const authOptions = {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    };
    
    const response = await fetch(url, authOptions);
    
    // Se token expirado, redirecionar para login
    if (response.status === 401) {
        removeAuthToken();
        window.location.href = '/login.html';
        throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    return response;
}

// ============================================
// INFORMAÇÕES DO USUÁRIO
// ============================================

/**
 * Obtém informações completas do usuário autenticado
 */
export async function getCurrentUserInfo() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/auth/me`);
        
        if (!response.ok) {
            throw new Error('Erro ao obter informações do usuário');
        }
        
        const userData = await response.json();
        
        // Atualizar dados salvos
        saveAuthUser({
            id: userData.id,
            username: userData.username,
            nome_completo: userData.nome_completo,
            email: userData.email,
            perfil: userData.perfil
        });
        
        return userData;
    } catch (error) {
        console.error('Erro ao obter informações do usuário:', error);
        throw error;
    }
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Formata nome de usuário para exibição
 */
export function formatUserName(user) {
    if (!user) return 'Usuário';
    return user.nome_completo || user.username || 'Usuário';
}

/**
 * Retorna ícone de perfil
 */
export function getProfileIcon(user) {
    if (!user) return '👤';
    return user.perfil === 'admin' ? '👑' : '👤';
}

/**
 * Verifica se a sessão está próxima de expirar
 * (baseado no tempo de expiração do token - 30 minutos)
 */
export function isSessionExpiringSoon() {
    // Implementação simples: verificar se faz mais de 25 minutos desde o último acesso
    const lastActivity = localStorage.getItem('bsqa_last_activity');
    if (!lastActivity) return false;
    
    const now = Date.now();
    const elapsed = now - parseInt(lastActivity);
    const minutes = elapsed / (1000 * 60);
    
    return minutes > 25; // 25 minutos = 5 minutos antes de expirar
}

/**
 * Atualiza timestamp da última atividade
 */
export function updateLastActivity() {
    localStorage.setItem('bsqa_last_activity', Date.now().toString());
}

// Atualizar última atividade em cada interação
if (isAuthenticated()) {
    updateLastActivity();
    
    // Atualizar a cada minuto se houver atividade
    setInterval(() => {
        if (isAuthenticated()) {
            updateLastActivity();
        }
    }, 60000); // 1 minuto
}

