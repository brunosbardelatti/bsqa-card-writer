/**
 * jira-auth.js - Módulo compartilhado de autenticação Jira (modal, conta, sessionStorage).
 * Usado por dashboard, card e bug para credenciais via headers em vez de .env.
 */

const JIRA_MODAL_HTML = `
  <div id="jiraLoginModal" class="modal" data-testid="jira-login-modal">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="modal-close-btn" id="jiraLoginModalCloseBtn" title="Fechar" aria-label="Fechar">&times;</button>
        <h2 id="jiraLoginModalTitle">Conectar ao Jira</h2>
        <p class="modal-subtitle" id="jiraLoginModalSubtitle">Informe suas credenciais para acessar o Dashboard</p>
      </div>
      <div id="jiraLoginUserSummary" class="jira-login-user-summary hidden" aria-hidden="true">
        <div class="jira-summary-row">
          <span class="jira-summary-label">Instância</span>
          <span class="jira-summary-instance">—</span>
        </div>
        <div class="jira-summary-row">
          <span class="jira-summary-label">Usuário</span>
          <span class="jira-summary-name">—</span>
        </div>
        <div class="jira-summary-row">
          <span class="jira-summary-label">Email</span>
          <span class="jira-summary-email">—</span>
        </div>
      </div>
      <form id="jiraLoginForm" class="modal-form">
        <fieldset class="modal-form-section">
          <legend class="modal-form-legend">Credenciais</legend>
          <div class="form-group">
            <label for="jiraBaseUrl">URL do Jira *</label>
            <input type="url" id="jiraBaseUrl" placeholder="https://sua-empresa.atlassian.net" />
            <small class="field-hint">Ex: https://sua-empresa.atlassian.net</small>
          </div>
          <div class="form-group">
            <label for="jiraEmail">Email do Jira *</label>
            <input type="email" id="jiraEmail" placeholder="seu.email@empresa.com" />
          </div>
          <div class="form-group">
            <label for="jiraToken">Token de API *</label>
            <input type="password" id="jiraToken" placeholder="Seu token de API" />
            <small class="field-hint">
              <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener">Gerar token no Atlassian</a>
            </small>
          </div>
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="rememberSession" checked />
              <span>Lembrar durante esta sessão</span>
            </label>
          </div>
        </fieldset>
        <fieldset class="modal-form-section import-credentials">
          <legend class="import-credentials-legend">
            <span class="import-credentials-title">Importar credenciais</span>
          </legend>
          <input type="file" id="jiraImportFile" accept=".json,application/json" hidden />
          <div class="import-paste-area">
            <textarea id="jiraImportJson" placeholder='Cole o JSON (padrão bsqa-credentials ou baseUrl, email, token) e clique em Conectar' rows="3"></textarea>
            <button type="button" class="import-submit-btn" id="jiraImportFileBtn" title="Selecionar arquivo JSON">Importar</button>
          </div>
        </fieldset>
        <div id="jiraLoginError" class="error-message" style="display: none;"></div>
        <div class="modal-form-actions">
          <button type="submit" class="submit-btn" id="jiraLoginBtn" data-testid="jira-login-submit">
            <span class="btn-text">Conectar</span>
            <span class="btn-loading" style="display: none;">Conectando...</span>
          </button>
        </div>
      </form>
      <div class="modal-footer">
        <small>Suas credenciais são armazenadas apenas no seu navegador e não são enviadas para nosso servidor.</small>
      </div>
    </div>
  </div>
`;

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

export function ensureModalInDOM() {
  if (document.getElementById('jiraLoginModal')) return;
  document.body.insertAdjacentHTML('afterbegin', JIRA_MODAL_HTML);
}

export function showLoginModal() {
  const modal = document.getElementById('jiraLoginModal');
  if (!modal) return;
  const creds = JiraAuth.get();
  const isLoggedIn = JiraAuth.isAuthenticated() && creds;
  const summaryEl = document.getElementById('jiraLoginUserSummary');
  const titleEl = document.getElementById('jiraLoginModalTitle');
  const subtitleEl = document.getElementById('jiraLoginModalSubtitle');
  if (summaryEl) {
    if (isLoggedIn && (creds.userDisplayName || creds.email)) {
      summaryEl.classList.remove('hidden');
      summaryEl.setAttribute('aria-hidden', 'false');
      const instanceEl = summaryEl.querySelector('.jira-summary-instance');
      const nameEl = summaryEl.querySelector('.jira-summary-name');
      const emailEl = summaryEl.querySelector('.jira-summary-email');
      if (instanceEl) instanceEl.textContent = getInstanceNameFromBaseUrl(creds.baseUrl) || 'Jira';
      if (nameEl) nameEl.textContent = creds.userDisplayName || creds.displayName || creds.email || '—';
      if (emailEl) emailEl.textContent = creds.userEmail || creds.email || '—';
    } else {
      summaryEl.classList.add('hidden');
      summaryEl.setAttribute('aria-hidden', 'true');
    }
  }
  if (titleEl) titleEl.textContent = isLoggedIn ? 'Conta Jira' : 'Conectar ao Jira';
  if (subtitleEl) subtitleEl.textContent = isLoggedIn ? 'Altere as credenciais ou importe de outro ambiente.' : 'Informe suas credenciais para acessar o Dashboard';
  modal.classList.add('open');
  setTimeout(() => document.getElementById('jiraBaseUrl')?.focus(), 100);
}

export function hideLoginModal() {
  const modal = document.getElementById('jiraLoginModal');
  if (modal) modal.classList.remove('open');
}

export function closeLoginModalOrRedirect() {
  if (JiraAuth.isAuthenticated()) {
    hideLoginModal();
  } else {
    window.location.href = 'index.html';
  }
}

function showLoginError(message) {
  const errorEl = document.getElementById('jiraLoginError');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function hideLoginError() {
  const errorEl = document.getElementById('jiraLoginError');
  if (errorEl) errorEl.style.display = 'none';
}

function setLoginLoading(loading) {
  const btn = document.getElementById('jiraLoginBtn');
  const btnText = btn?.querySelector('.btn-text');
  const btnLoading = btn?.querySelector('.btn-loading');
  if (btn) btn.disabled = loading;
  if (btnText) btnText.style.display = loading ? 'none' : 'inline';
  if (btnLoading) btnLoading.style.display = loading ? 'inline' : 'none';
}

/**
 * Padrão único de documento (compatível com config.html):
 * { user: { name, email, company }, integrations: { jira: { enabled, baseUrl, email, token, subtaskIssueTypeId, requestTimeout } }, _exportedAt? }
 * Ou formato plano legado: { baseUrl, email, token }
 */
function getJiraCredsFromImport(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const jira = obj.integrations?.jira || obj.jira || obj;
  const baseUrl = (jira.baseUrl ?? obj.baseUrl ?? '').toString().trim();
  const email = (jira.email ?? obj.email ?? '').toString().trim();
  const token = (jira.token ?? obj.token ?? '').toString().trim();
  return baseUrl && email && token ? { baseUrl, email, token } : null;
}

function validateImportedCreds(obj) {
  const creds = getJiraCredsFromImport(obj);
  return creds !== null && creds.baseUrl.startsWith('https://');
}

function applyImportedCreds(baseUrl, email, token, user) {
  baseUrl = (baseUrl || '').trim();
  email = (email || '').trim();
  token = (token || '').trim();
  if (!baseUrl || !email || !token) {
    showLoginError('JSON deve conter baseUrl, email e token (não vazios).');
    return false;
  }
  if (!baseUrl.startsWith('https://')) {
    showLoginError('baseUrl deve começar com https://');
    return false;
  }
  const userDisplayName = user?.displayName;
  const userEmail = user?.emailAddress;
  JiraAuth.save(baseUrl, email, token, userDisplayName, userEmail);
  hideLoginModal();
  (_showSuccessFn || _defaultShowSuccess)('Credenciais importadas.');
  refreshAccountButton();
  _onLoginSuccess?.();
  return true;
}

async function testAndApplyImportedCreds(baseUrl, email, token) {
  try {
    const response = await fetch(window.ApiConfig.buildUrl('/jira/test-connection'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Jira-Auth': btoa(`${email}:${token}`),
        'X-Jira-Base-Url': baseUrl
      }
    });
    const data = await response.json();
    if (!data.success) {
      showLoginError(data.detail || data.error || 'Credenciais inválidas.');
      return null;
    }
    return data;
  } catch (err) {
    showLoginError(err.message || 'Erro ao testar conexão.');
    return null;
  }
}

async function handleImportFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  hideLoginError();
  try {
    const text = await file.text();
    const obj = JSON.parse(text);
    const creds = getJiraCredsFromImport(obj);
    if (!creds || !validateImportedCreds(obj)) {
      showLoginError('Arquivo inválido. Use o padrão bsqa-credentials (user + integrations.jira) ou baseUrl, email e token.');
      return;
    }
    const data = await testAndApplyImportedCreds(creds.baseUrl, creds.email, creds.token);
    if (data) applyImportedCreds(creds.baseUrl, creds.email, creds.token, data.user);
  } catch (err) {
    showLoginError(err.message || 'Arquivo JSON inválido.');
  }
  e.target.value = '';
}

async function handleJiraLogin(e) {
  e.preventDefault();
  let baseUrl, email, token;
  const jsonRaw = document.getElementById('jiraImportJson')?.value?.trim();
  if (jsonRaw) {
    try {
      const obj = JSON.parse(jsonRaw);
      const creds = getJiraCredsFromImport(obj);
      if (!creds || !validateImportedCreds(obj)) {
        showLoginError('JSON inválido. Use o padrão bsqa-credentials ou baseUrl, email e token.');
        return;
      }
      baseUrl = creds.baseUrl;
      email = creds.email;
      token = creds.token;
    } catch {
      showLoginError('JSON inválido. Verifique o formato.');
      return;
    }
  } else {
    baseUrl = document.getElementById('jiraBaseUrl')?.value?.trim();
    email = document.getElementById('jiraEmail')?.value?.trim();
    token = document.getElementById('jiraToken')?.value?.trim();
    if (!baseUrl || !email || !token) {
      showLoginError('Preencha todos os campos obrigatórios ou cole um JSON.');
      return;
    }
  }
  if (!baseUrl.startsWith('https://')) {
    showLoginError('URL deve começar com https://');
    return;
  }
  hideLoginError();
  setLoginLoading(true);
  try {
    const response = await fetch(window.ApiConfig.buildUrl('/jira/test-connection'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Jira-Auth': btoa(`${email}:${token}`),
        'X-Jira-Base-Url': baseUrl
      }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.detail || data.error || 'Credenciais inválidas');
    const userDisplayName = data.user?.displayName;
    const userEmail = data.user?.emailAddress;
    JiraAuth.save(baseUrl, email, token, userDisplayName, userEmail);
    hideLoginModal();
    const userName = userDisplayName || email;
    (_showSuccessFn || _defaultShowSuccess)(`Conectado como ${userName}`);
    if (jsonRaw) document.getElementById('jiraImportJson').value = '';
    refreshAccountButton();
    _onLoginSuccess?.();
  } catch (error) {
    showLoginError(error.message || 'Erro ao conectar. Verifique suas credenciais.');
  } finally {
    setLoginLoading(false);
  }
}

export function bindLoginEvents() {
  const form = document.getElementById('jiraLoginForm');
  if (form) form.addEventListener('submit', handleJiraLogin);
  const modal = document.getElementById('jiraLoginModal');
  const closeBtn = document.getElementById('jiraLoginModalCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeLoginModalOrRedirect);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLoginModalOrRedirect();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const m = document.getElementById('jiraLoginModal');
      if (m && m.classList.contains('open')) closeLoginModalOrRedirect();
    }
  });
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
      <button type="button" class="dropdown-item" id="dashboardAlterarContaBtn" role="menuitem">✏️ Alterar conta</button>
      <button type="button" class="dropdown-item" id="dashboardExportBtn" role="menuitem">📤 Exportar credenciais</button>
      <button type="button" class="dropdown-item" id="dashboardLogoutBtn" role="menuitem">🚪 Sair</button>
      <p class="dropdown-hint">O arquivo exportado contém dados sensíveis. Guarde com segurança.</p>
    </div>
  `;
  headerNav.appendChild(wrap);
  const btn = document.getElementById('dashboardAccountBtn');
  const dropdown = document.getElementById('dashboardAccountDropdown');
  const alterarContaBtn = document.getElementById('dashboardAlterarContaBtn');
  const logoutBtn = document.getElementById('dashboardLogoutBtn');
  const exportBtn = document.getElementById('dashboardExportBtn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!JiraAuth.isAuthenticated()) {
      showLoginModal();
      return;
    }
    const isOpen = dropdown.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
    dropdown.setAttribute('aria-hidden', !isOpen);
  });
  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    dropdown.setAttribute('aria-hidden', 'true');
  });
  dropdown.addEventListener('click', (e) => e.stopPropagation());
  if (alterarContaBtn) {
    alterarContaBtn.addEventListener('click', () => {
      dropdown.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      dropdown.setAttribute('aria-hidden', 'true');
      showLoginModal();
    });
  }
  logoutBtn.addEventListener('click', handleLogout);
  exportBtn.addEventListener('click', handleExportCredentials);
}

export function refreshAccountButton() {
  const btn = document.getElementById('dashboardAccountBtn');
  const label = document.getElementById('dashboardAccountLabel');
  const dropdown = document.getElementById('dashboardAccountDropdown');
  if (!btn || !label) return;
  if (JiraAuth.isAuthenticated()) {
    const creds = JiraAuth.get();
    const displayName = creds?.userDisplayName || creds?.displayName || creds?.email || '';
    label.textContent = displayName.length > 24 ? displayName.slice(0, 21) + '...' : displayName || 'Conectado';
    btn.style.display = '';
    if (dropdown) {
      const logoutBtn = dropdown.querySelector('#dashboardLogoutBtn');
      const exportBtn = dropdown.querySelector('#dashboardExportBtn');
      const alterarBtn = dropdown.querySelector('#dashboardAlterarContaBtn');
      if (logoutBtn) logoutBtn.style.display = '';
      if (exportBtn) exportBtn.style.display = '';
      if (alterarBtn) alterarBtn.style.display = '';
    }
  } else {
    label.textContent = 'Conectar';
    btn.style.display = '';
    if (dropdown) {
      dropdown.classList.remove('open');
      const logoutBtn = dropdown.querySelector('#dashboardLogoutBtn');
      const exportBtn = dropdown.querySelector('#dashboardExportBtn');
      const alterarBtn = dropdown.querySelector('#dashboardAlterarContaBtn');
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (exportBtn) exportBtn.style.display = 'none';
      if (alterarBtn) alterarBtn.style.display = 'none';
    }
  }
}

function handleLogout() {
  JiraAuth.clear();
  const dropdown = document.getElementById('dashboardAccountDropdown');
  if (dropdown) dropdown.classList.remove('open');
  refreshAccountButton();
  showLoginModal();
  _onLogout?.();
}

function handleExportCredentials() {
  const creds = JiraAuth.get();
  if (!creds) return;
  const payload = {
    user: {
      name: creds.userDisplayName || creds.displayName || '',
      email: creds.userEmail || creds.email || '',
      company: getInstanceNameFromBaseUrl(creds.baseUrl) || ''
    },
    integrations: {
      jira: {
        enabled: true,
        baseUrl: creds.baseUrl,
        email: creds.email,
        token: creds.token,
        subtaskIssueTypeId: '10003',
        requestTimeout: 30
      }
    },
    _exportedAt: new Date().toISOString()
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bsqa-credentials.json';
  a.click();
  URL.revokeObjectURL(url);
  const dropdown = document.getElementById('dashboardAccountDropdown');
  if (dropdown) dropdown.classList.remove('open');
  (_showSuccessFn || _defaultShowSuccess)('Credenciais exportadas (bsqa-credentials.json)');
}

export function bindImportEvents() {
  const fileInput = document.getElementById('jiraImportFile');
  const importFileBtn = document.getElementById('jiraImportFileBtn');
  if (fileInput && importFileBtn) {
    importFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImportFile);
  }
}

/**
 * Inicializa o módulo de auth Jira: injeta modal se necessário, botão de conta, eventos.
 * @param {Object} options - { onLoginSuccess, onLogout, showSuccess }
 */
export function initJiraAuth(options = {}) {
  _onLoginSuccess = options.onLoginSuccess ?? null;
  _onLogout = options.onLogout ?? null;
  _showSuccessFn = options.showSuccess ?? null;
  ensureModalInDOM();
  setupAccountButton();
  refreshAccountButton();
  bindLoginEvents();
  bindImportEvents();
}
