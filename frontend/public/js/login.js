/**
 * Lógica da Página de Login
 */
import { login, isAuthenticated } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Se já estiver autenticado, redirecionar
    if (isAuthenticated()) {
        window.location.href = '/index.html';
        return;
    }
    
    initLoginForm();
});

function initLoginForm() {
    const form = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const loginButton = document.getElementById('loginButton');
    const usernameInput = document.getElementById('username');
    const senhaInput = document.getElementById('senha');
    
    // Focus no campo username
    usernameInput.focus();
    
    // Adicionar event listener para Enter
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });
    
    // Limpar erro ao digitar
    usernameInput.addEventListener('input', () => hideError());
    senhaInput.addEventListener('input', () => hideError());
    
    async function handleLogin() {
        const username = usernameInput.value.trim();
        const senha = senhaInput.value;
        
        // Validações básicas
        if (!username) {
            showError('Por favor, informe seu usuário');
            usernameInput.focus();
            return;
        }
        
        if (!senha) {
            showError('Por favor, informe sua senha');
            senhaInput.focus();
            return;
        }
        
        // Desabilitar botão e mostrar loading
        setLoading(true);
        hideError();
        
        try {
            const response = await login(username, senha);
            
            // Login bem-sucedido
            console.log('Login realizado com sucesso:', response.user.username);
            
            // Mostrar mensagem de sucesso (brevemente)
            showSuccess(`Bem-vindo, ${response.user.nome_completo}!`);
            
            // Aguardar um pouco para o usuário ver a mensagem
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Redirecionar para página inicial
            window.location.href = '/index.html';
            
        } catch (error) {
            // Tratar erros específicos
            let errorMsg = 'Erro ao fazer login. Tente novamente.';
            
            if (error.message.includes('Usuário ou senha incorretos')) {
                errorMsg = 'Usuário ou senha incorretos';
            } else if (error.message.includes('inativo')) {
                errorMsg = 'Usuário inativo. Entre em contato com o administrador.';
            } else if (error.message.includes('Network')) {
                errorMsg = 'Erro de conexão. Verifique sua internet.';
            }
            
            showError(errorMsg);
            
            // Reabilitar botão
            setLoading(false);
            
            // Limpar senha
            senhaInput.value = '';
            senhaInput.focus();
        }
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.className = 'message error-message';
        errorMessage.style.display = 'block';
    }
    
    function showSuccess(message) {
        errorMessage.textContent = message;
        errorMessage.className = 'message success-message';
        errorMessage.style.display = 'block';
    }
    
    function hideError() {
        errorMessage.style.display = 'none';
    }
    
    function setLoading(loading) {
        if (loading) {
            loginButton.disabled = true;
            loginButton.textContent = '⏳ Entrando...';
            usernameInput.disabled = true;
            senhaInput.disabled = true;
        } else {
            loginButton.disabled = false;
            loginButton.textContent = '🚀 Entrar';
            usernameInput.disabled = false;
            senhaInput.disabled = false;
        }
    }
}

