/**
 * jira-auth.js - Módulo compartilhado de autenticação Jira (conta, sessionStorage).
 * Configuração de credenciais é feita na página config.html; sem modal duplicado.
 */

let _onLoginSuccess = null;
let _onLogout = null;
let _showSuccessFn = null;

function _escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function _defaultShowSuccess(message) {
  const existing = document.querySelector('.success-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.innerHTML = `<span>✅ ${_escapeHtml(message)}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export const JiraAuth = {
  STORAGE_KEY: 'jira_auth',

  save(baseUrl, email, token, userDisplayName, userEmail) {
    const data = { baseUrl, email, token };
    if (userDisplayName != null) data.userDisplayName = userDisplayName;
    if (userEmail != null) data.userEmail = userEmail;
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  get() {
    const stored = sessionStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  clear() {
    sessionStorage.removeItem(this.STORAGE_KEY);
  },

  isAuthenticated() {
    return this.get() !== null;
  },

  getAuthHeader() {
    const creds = this.get();
    if (!creds) return null;
    return btoa(`${creds.email}:${creds.token}`);
  },

  getBaseUrl() {
    const creds = this.get();
    return creds?.baseUrl || null;
  },

  getHeaders() {
    const auth = this.getAuthHeader();
    const baseUrl = this.getBaseUrl();
    const headers = { 'Content-Type': 'application/json' };
    if (auth) headers['X-Jira-Auth'] = auth;
    if (baseUrl) headers['X-Jira-Base-Url'] = baseUrl;
    return headers;
  },

  /**
   * Retorna apenas os headers de autenticação Jira (sem Content-Type).
   * Use em requisições com FormData, onde o browser define Content-Type.
   */
  getAuthOnlyHeaders() {
    const auth = this.getAuthHeader();
    const baseUrl = this.getBaseUrl();
    const headers = {};
    if (auth) headers['X-Jira-Auth'] = auth;
    if (baseUrl) headers['X-Jira-Base-Url'] = baseUrl;
    return headers;
  },
};

if (typeof window !== 'undefined') {
  window.JiraAuth = JiraAuth;
}

export function getInstanceNameFromBaseUrl(baseUrl) {
  if (!baseUrl || typeof baseUrl !== 'string') return '';
  try {
    const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
    const host = url.hostname || '';
    const match = host.match(/^([^.]+)(\.atlassian\.net)?/i);
    const slug = match ? match[1] : host.split('.')[0] || '';
    const words = slug.replace(/-/g, ' ').split(/\s+/).filter(Boolean);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || slug;
  } catch {
    return '';
  }
}

/** Redireciona para config.html (substitui o antigo modal de login/conta). */
export function showLoginModal() {
  window.location.href = 'config.html';
}

export function setupAccountButton() {
  const headerNav = document.querySelector('#header .header-nav');
  if (!headerNav) return;
  const wrap = document.createElement('div');
  wrap.className = 'dashboard-account-wrap';
  wrap.innerHTML = `
    <button type="button" class="dashboard-account-btn" id="dashboardAccountBtn" title="Conta Jira" aria-expanded="false" aria-haspopup="true">
      <span class="account-icon">👤</span>
      <span class="account-label" id="dashboardAccountLabel">Conectar</span>
    </button>
    <div class="dashboard-account-dropdown" id="dashboardAccountDropdown" role="menu" aria-hidden="true">
      <div class="dropdown-user-summary" id="dashboardDropdownUserSummary" aria-hidden="false">
        <div class="dropdown-summary-row">
          <span class="dropdown-summary-label">Instância</span>
          <span class="dropdown-summary-value" id="dashboardDropdownInstance">—</span>
        </div>
        <div class="dropdown-summary-row">
          <span class="dropdown-summary-label">Usuário</span>
          <span class="dropdown-summary-value" id="dashboardDropdownUserName">—</span>
        </div>
        <div class="dropdown-summary-row">
          <span class="dropdown-summary-label">Email</span>
          <span class="dropdown-summary-value" id="dashboardDropdownEmail">—</span>
        </div>
      </div>
      <a href="config.html" class="dropdown-item" id="dashboardConfigLink" role="menuitem">⚙️ Ir para Config</a>
      <button type="button" class="dropdown-item" id="dashboardExportBtn" role="menuitem">📤 Exportar configurações</button>
      <button type="button" class="dropdown-item" id="dashboardLogoutBtn" role="menuitem">🚪 Sair</button>
      <p class="dropdown-hint">O arquivo exportado contém dados sensíveis. Guarde com segurança.</p>
    </div>
  `;
  headerNav.appendChild(wrap);
  const btn = document.getElementById('dashboardAccountBtn');
  const dropdown = document.getElementById('dashboardAccountDropdown');
  const logoutBtn = document.getElementById('dashboardLogoutBtn');
  const exportBtn = document.getElementById('dashboardExportBtn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!JiraAuth.isAuthenticated()) {
      window.location.href = 'config.html';
      return;
    }
    const isOpen = dropdown.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
    dropdown.setAttribute('aria-hidden', !isOpen);
    if (isOpen) {
      requestAnimationFrame(() => {
        setTooltipIfTruncated(document.getElementById('dashboardDropdownInstance'));
        setTooltipIfTruncated(document.getElementById('dashboardDropdownUserName'));
        setTooltipIfTruncated(document.getElementById('dashboardDropdownEmail'));
      });
    }
  });
  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    dropdown.setAttribute('aria-hidden', 'true');
  });
  dropdown.addEventListener('click', (e) => e.stopPropagation());
  logoutBtn.addEventListener('click', handleLogout);
  exportBtn.addEventListener('click', handleExportCredentials);
}

/**
 * Define title (tooltip) no elemento apenas quando o texto está truncado (ellipsis).
 * Se o conteúdo estiver completo, remove o title para não exibir tooltip.
 */
function setTooltipIfTruncated(el) {
  if (!el) return;
  const text = (el.textContent || '').trim();
  if (!text || text === '—') {
    el.removeAttribute('title');
    return;
  }
  if (el.scrollWidth > el.clientWidth) {
    el.title = text;
  } else {
    el.removeAttribute('title');
  }
}

export function refreshAccountButton() {
  const btn = document.getElementById('dashboardAccountBtn');
  const label = document.getElementById('dashboardAccountLabel');
  const dropdown = document.getElementById('dashboardAccountDropdown');
  if (!btn || !label) return;
  if (JiraAuth.isAuthenticated()) {
    const creds = JiraAuth.get();
    let displayName = '';
    let instanceName = '';
    let userEmail = '';
    try {
      const config = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
      const user = config.user || {};
      displayName = (user.name && String(user.name).trim()) || '';
      userEmail = (user.email && String(user.email).trim()) || creds?.email || creds?.userEmail || '';
      instanceName = (user.company && String(user.company).trim()) || '';
    } catch (_) {}
    if (!displayName) displayName = creds?.userDisplayName || creds?.displayName || creds?.email || '';
    if (!instanceName && creds?.baseUrl) instanceName = getInstanceNameFromBaseUrl(creds.baseUrl) || '';
    label.textContent = displayName.length > 24 ? displayName.slice(0, 21) + '...' : displayName || 'Conectado';
    btn.style.display = '';
    if (dropdown) {
      const summaryEl = dropdown.querySelector('#dashboardDropdownUserSummary');
      const instanceEl = document.getElementById('dashboardDropdownInstance');
      const nameEl = document.getElementById('dashboardDropdownUserName');
      const emailEl = document.getElementById('dashboardDropdownEmail');
      if (summaryEl) summaryEl.style.display = '';
      if (instanceEl) instanceEl.textContent = instanceName || '—';
      if (nameEl) nameEl.textContent = displayName || '—';
      if (emailEl) emailEl.textContent = userEmail || creds?.email || '—';
      const logoutBtn = dropdown.querySelector('#dashboardLogoutBtn');
      const exportBtn = dropdown.querySelector('#dashboardExportBtn');
      if (logoutBtn) logoutBtn.style.display = '';
      if (exportBtn) exportBtn.style.display = '';
    }
  } else {
    label.textContent = 'Conectar';
    btn.style.display = '';
    if (dropdown) {
      dropdown.classList.remove('open');
      const summaryEl = dropdown.querySelector('#dashboardDropdownUserSummary');
      if (summaryEl) summaryEl.style.display = 'none';
      const logoutBtn = dropdown.querySelector('#dashboardLogoutBtn');
      const exportBtn = dropdown.querySelector('#dashboardExportBtn');
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (exportBtn) exportBtn.style.display = 'none';
    }
  }
}

/** Mensagem única de confirmação para limpar configurações (dropdown e página Config). */
export const CLEAR_CONFIG_CONFIRM_MSG = 'Limpar todas as configurações e credenciais do navegador? Esta ação não pode ser desfeita.';

/**
 * Limpa todas as configurações e credenciais no navegador (localStorage + sessionStorage).
 * Usado pelo botão "Sair" do dropdown e pelo "Sair / Limpar configurações" na página Config.
 */
export function clearAllConfig() {
  localStorage.removeItem('bsqaConfig');
  JiraAuth.clear();
  localStorage.setItem('bsqaThemeChanged', Date.now().toString());
}

function handleLogout() {
  if (!confirm(CLEAR_CONFIG_CONFIRM_MSG)) return;
  clearAllConfig();
  const dropdown = document.getElementById('dashboardAccountDropdown');
  if (dropdown) dropdown.classList.remove('open');
  const isConfigPage = typeof document !== 'undefined' && !!document.getElementById('configSairBtn');
  if (isConfigPage) {
    window.location.reload();
  } else {
    refreshAccountButton();
  }
  _onLogout?.();
}

/**
 * Monta o payload completo bsqa-config e dispara o download.
 * Usado pelo botão "Exportar configurações" do dropdown e pela página Config.
 * @param {Object} [configFromForm] - Se fornecido (página Config), usa este objeto; senão monta a partir de localStorage + JiraAuth.
 */
export function exportFullConfig(configFromForm) {
  let payload;
  if (configFromForm && typeof configFromForm === 'object') {
    payload = { ...configFromForm };
  } else {
    const config = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
    const creds = JiraAuth.get();
    const jira = config.integrations?.jira || {};
    payload = {
      user: config.user || { name: '', email: '', company: '' },
      preferences: config.preferences || { defaultAI: 'openai', defaultAnalyseType: 'card_QA_writer', autoCopy: false, clearAfterSuccess: true, theme: 'dark' },
      integrations: {
        jira: {
          enabled: !!jira.enabled,
          baseUrl: creds?.baseUrl ?? jira.baseUrl ?? '',
          email: creds?.email ?? jira.email ?? '',
          token: creds?.token ?? jira.token ?? '',
          subtaskIssueTypeId: jira.subtaskIssueTypeId ?? '10003',
          bugIssueTypeId: jira.bugIssueTypeId ?? '10004',
          subBugIssueTypeId: jira.subBugIssueTypeId ?? '10271',
          requestTimeout: jira.requestTimeout ?? 30
        }
      },
      ia: config.ia || {
        openai: { enabled: false, maxTokens: 1000, apiKey: '' },
        stackspot: { enabled: false, streaming: false, stackspotKnowledge: false, returnKsInResponse: false, clientId: '', clientSecret: '', realm: '', agentId: '' }
      }
    };
  }
  payload._exportedAt = new Date().toISOString();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bsqa-config.json';
  a.click();
  URL.revokeObjectURL(url);
  const dropdown = document.getElementById('dashboardAccountDropdown');
  if (dropdown) dropdown.classList.remove('open');
  (_showSuccessFn || _defaultShowSuccess)('Configurações exportadas (bsqa-config.json)');
}

function handleExportCredentials() {
  exportFullConfig();
}

/**
 * Inicializa o módulo de auth Jira: botão de conta no header e eventos.
 * @param {Object} options - { onLoginSuccess, onLogout, showSuccess, redirectIfUnauthenticated }
 *   redirectIfUnauthenticated: se true e usuário não autenticado, redireciona para config.html
 */
export function initJiraAuth(options = {}) {
  _onLoginSuccess = options.onLoginSuccess ?? null;
  _onLogout = options.onLogout ?? null;
  _showSuccessFn = options.showSuccess ?? null;
  setupAccountButton();
  refreshAccountButton();
  if (options.redirectIfUnauthenticated && !JiraAuth.isAuthenticated()) {
    window.location.href = 'config.html';
  }
}
