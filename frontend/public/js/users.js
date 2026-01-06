/**
 * Módulo de Gestão de Usuários
 * Gerencia CRUD de usuários para administradores
 */

import { loadCommonComponents } from './main.js';
import { authenticatedFetch, getAuthUser } from './auth.js';

const API_BASE_URL = window.location.origin;

// ============================================
// ESTADO DA APLICAÇÃO
// ============================================

let allUsers = [];
let currentEditingUserId = null;

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadCommonComponents();
  await loadUsers();
  await loadStats();
  bindEvents();
});

// ============================================
// EVENTOS
// ============================================

function bindEvents() {
  // Botão Novo Usuário
  document.getElementById('btnNewUser')?.addEventListener('click', openNewUserModal);
  
  // Botão Refresh
  document.getElementById('btnRefresh')?.addEventListener('click', () => {
    loadUsers();
    loadStats();
  });
  
  // Filtros
  document.getElementById('filterStatus')?.addEventListener('change', filterUsers);
  document.getElementById('filterPerfil')?.addEventListener('change', filterUsers);
  document.getElementById('searchInput')?.addEventListener('input', filterUsers);
  
  // Modal
  document.getElementById('closeModal')?.addEventListener('click', closeModal);
  document.getElementById('btnCancelModal')?.addEventListener('click', closeModal);
  document.getElementById('userForm')?.addEventListener('submit', handleSaveUser);
  
  // Formatação de CPF
  document.getElementById('cpf')?.addEventListener('input', formatCpfInput);
  
  // Fechar modal ao clicar fora
  document.getElementById('userModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'userModal') {
      closeModal();
    }
  });
}

// ============================================
// CARREGAMENTO DE DADOS
// ============================================

async function loadUsers() {
  const loadingDiv = document.getElementById('loadingUsers');
  const errorDiv = document.getElementById('errorUsers');
  const tableBody = document.getElementById('usersTableBody');
  const emptyDiv = document.getElementById('emptyUsers');
  
  try {
    loadingDiv.style.display = 'flex';
    errorDiv.style.display = 'none';
    emptyDiv.style.display = 'none';
    
    const response = await authenticatedFetch(`${API_BASE_URL}/users/`);
    
    if (!response.ok) {
      throw new Error('Erro ao carregar usuários');
    }
    
    allUsers = await response.json();
    
    loadingDiv.style.display = 'none';
    
    if (allUsers.length === 0) {
      emptyDiv.style.display = 'block';
    } else {
      renderUsers(allUsers);
    }
  } catch (error) {
    loadingDiv.style.display = 'none';
    errorDiv.textContent = error.message || 'Erro ao carregar usuários';
    errorDiv.style.display = 'block';
    console.error('Erro ao carregar usuários:', error);
  }
}

async function loadStats() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/users/stats/count`);
    
    if (!response.ok) {
      throw new Error('Erro ao carregar estatísticas');
    }
    
    const stats = await response.json();
    
    document.getElementById('statTotal').textContent = stats.total_users || 0;
    document.getElementById('statActive').textContent = stats.active_users || 0;
    document.getElementById('statInactive').textContent = stats.inactive_users || 0;
    
    // Contar admins manualmente
    const admins = allUsers.filter(u => u.perfil === 'admin' && u.ativo).length;
    document.getElementById('statAdmins').textContent = admins;
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

// ============================================
// RENDERIZAÇÃO
// ============================================

function renderUsers(users) {
  const tableBody = document.getElementById('usersTableBody');
  const currentUser = getAuthUser();
  
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  users.forEach(user => {
    const row = document.createElement('tr');
    row.className = user.ativo ? '' : 'inactive-user';
    
    const isCurrentUser = currentUser && currentUser.id === user.id;
    
    row.innerHTML = `
      <td>
        <span class="badge badge-${user.perfil}">
          ${user.perfil === 'admin' ? '👑 Admin' : '👤 User'}
        </span>
      </td>
      <td>${escapeHtml(user.nome_completo)}</td>
      <td>${escapeHtml(user.username)}${isCurrentUser ? ' <span class="badge-you">(você)</span>' : ''}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.empresa || '-')}</td>
      <td>${formatCpf(user.cpf)}</td>
      <td>
        <span class="badge badge-${user.ativo ? 'active' : 'inactive'}">
          ${user.ativo ? '✅ Ativo' : '❌ Inativo'}
        </span>
      </td>
      <td>${formatDate(user.ultimo_login)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit" onclick="window.editUser('${user.id}')" title="Editar">
            ✏️
          </button>
          <button class="btn-action btn-password" onclick="window.resetPassword('${user.id}')" title="Resetar Senha">
            🔑
          </button>
          ${!isCurrentUser ? `
            <button class="btn-action btn-${user.ativo ? 'deactivate' : 'activate'}" 
                    onclick="window.toggleUserStatus('${user.id}', ${user.ativo})" 
                    title="${user.ativo ? 'Desativar' : 'Ativar'}">
              ${user.ativo ? '🔒' : '🔓'}
            </button>
          ` : ''}
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// ============================================
// FILTROS
// ============================================

function filterUsers() {
  const statusFilter = document.getElementById('filterStatus')?.value;
  const perfilFilter = document.getElementById('filterPerfil')?.value;
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  
  let filtered = [...allUsers];
  
  // Filtro de status
  if (statusFilter !== '') {
    const isActive = statusFilter === 'true';
    filtered = filtered.filter(u => u.ativo === isActive);
  }
  
  // Filtro de perfil
  if (perfilFilter) {
    filtered = filtered.filter(u => u.perfil === perfilFilter);
  }
  
  // Filtro de busca
  if (searchTerm) {
    filtered = filtered.filter(u => 
      u.nome_completo.toLowerCase().includes(searchTerm) ||
      u.username.toLowerCase().includes(searchTerm) ||
      u.email.toLowerCase().includes(searchTerm)
    );
  }
  
  renderUsers(filtered);
  
  const emptyDiv = document.getElementById('emptyUsers');
  if (filtered.length === 0) {
    emptyDiv.style.display = 'block';
  } else {
    emptyDiv.style.display = 'none';
  }
}

// ============================================
// MODAL
// ============================================

function openNewUserModal() {
  currentEditingUserId = null;
  
  document.getElementById('modalTitle').textContent = '➕ Novo Usuário';
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  
  // Mostrar campos de senha
  document.getElementById('senhaRow').style.display = 'flex';
  document.getElementById('senha').required = true;
  document.getElementById('confirmarSenha').required = true;
  
  // Padrões
  document.getElementById('perfil').value = 'user';
  document.getElementById('ativo').value = 'true';
  
  document.getElementById('formError').style.display = 'none';
  document.getElementById('userModal').style.display = 'flex';
}

function openEditUserModal(userId) {
  const user = allUsers.find(u => u.id === userId);
  
  if (!user) {
    alert('Usuário não encontrado');
    return;
  }
  
  currentEditingUserId = userId;
  
  document.getElementById('modalTitle').textContent = '✏️ Editar Usuário';
  document.getElementById('userId').value = user.id;
  document.getElementById('nomeCompleto').value = user.nome_completo;
  document.getElementById('username').value = user.username;
  document.getElementById('email').value = user.email;
  document.getElementById('empresa').value = user.empresa || '';
  document.getElementById('cpf').value = formatCpf(user.cpf);
  document.getElementById('perfil').value = user.perfil;
  document.getElementById('ativo').value = user.ativo.toString();
  
  // Esconder campos de senha na edição
  document.getElementById('senhaRow').style.display = 'none';
  document.getElementById('senha').required = false;
  document.getElementById('confirmarSenha').required = false;
  document.getElementById('senha').value = '';
  document.getElementById('confirmarSenha').value = '';
  
  document.getElementById('formError').style.display = 'none';
  document.getElementById('userModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('userModal').style.display = 'none';
  document.getElementById('userForm').reset();
  currentEditingUserId = null;
}

// ============================================
// OPERAÇÕES CRUD
// ============================================

async function handleSaveUser(event) {
  event.preventDefault();
  
  const formError = document.getElementById('formError');
  const btnSaveText = document.getElementById('btnSaveText');
  const btnSaveLoading = document.getElementById('btnSaveLoading');
  const btnSave = document.getElementById('btnSaveUser');
  
  formError.style.display = 'none';
  
  // Validação de senhas (apenas na criação)
  if (!currentEditingUserId) {
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    
    if (senha !== confirmarSenha) {
      formError.textContent = 'As senhas não coincidem';
      formError.style.display = 'block';
      return;
    }
  }
  
  // Preparar dados
  const userData = {
    nome_completo: document.getElementById('nomeCompleto').value,
    username: document.getElementById('username').value,
    email: document.getElementById('email').value,
    empresa: document.getElementById('empresa').value || null,
    cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
    perfil: document.getElementById('perfil').value
  };
  
  // Adicionar senha apenas na criação
  if (!currentEditingUserId) {
    userData.senha = document.getElementById('senha').value;
  } else {
    // Na edição, adicionar o status ativo
    userData.ativo = document.getElementById('ativo').value === 'true';
  }
  
  try {
    btnSaveText.style.display = 'none';
    btnSaveLoading.style.display = 'inline';
    btnSave.disabled = true;
    
    let response;
    
    if (currentEditingUserId) {
      // Atualizar usuário existente
      response = await authenticatedFetch(`${API_BASE_URL}/users/${currentEditingUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
    } else {
      // Criar novo usuário
      response = await authenticatedFetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao salvar usuário');
    }
    
    // Sucesso
    closeModal();
    await loadUsers();
    await loadStats();
    
    alert(currentEditingUserId ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
  } catch (error) {
    formError.textContent = error.message;
    formError.style.display = 'block';
    console.error('Erro ao salvar usuário:', error);
  } finally {
    btnSaveText.style.display = 'inline';
    btnSaveLoading.style.display = 'none';
    btnSave.disabled = false;
  }
}

async function toggleUserStatus(userId, currentStatus) {
  const action = currentStatus ? 'desativar' : 'ativar';
  
  if (!confirm(`Deseja realmente ${action} este usuário?`)) {
    return;
  }
  
  try {
    const endpoint = currentStatus ? 'deactivate' : 'activate';
    const response = await authenticatedFetch(`${API_BASE_URL}/users/${userId}/${endpoint}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao ${action} usuário`);
    }
    
    await loadUsers();
    await loadStats();
    
    alert(`Usuário ${action === 'desativar' ? 'desativado' : 'ativado'} com sucesso!`);
  } catch (error) {
    alert(error.message);
    console.error(`Erro ao ${action} usuário:`, error);
  }
}

async function resetPassword(userId) {
  const newPassword = prompt('Digite a nova senha para este usuário:\n(Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial)');
  
  if (!newPassword) {
    return;
  }
  
  // Validação básica de senha
  if (newPassword.length < 8) {
    alert('A senha deve ter no mínimo 8 caracteres');
    return;
  }
  
  if (!/[A-Z]/.test(newPassword)) {
    alert('A senha deve conter pelo menos uma letra maiúscula');
    return;
  }
  
  if (!/[a-z]/.test(newPassword)) {
    alert('A senha deve conter pelo menos uma letra minúscula');
    return;
  }
  
  if (!/[0-9]/.test(newPassword)) {
    alert('A senha deve conter pelo menos um número');
    return;
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
    alert('A senha deve conter pelo menos um caractere especial');
    return;
  }
  
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/users/${userId}/reset-password?new_password=${encodeURIComponent(newPassword)}`,
      {
        method: 'POST'
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao resetar senha');
    }
    
    alert('Senha resetada com sucesso!');
  } catch (error) {
    alert(error.message);
    console.error('Erro ao resetar senha:', error);
  }
}

// ============================================
// UTILITÁRIOS
// ============================================

function formatCpf(cpf) {
  if (!cpf) return '-';
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length === 11) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
}

function formatCpfInput(event) {
  let value = event.target.value.replace(/\D/g, '');
  if (value.length > 11) {
    value = value.slice(0, 11);
  }
  event.target.value = formatCpf(value);
}

function formatDate(dateString) {
  if (!dateString) return 'Nunca';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================

window.editUser = openEditUserModal;
window.toggleUserStatus = toggleUserStatus;
window.resetPassword = resetPassword;

