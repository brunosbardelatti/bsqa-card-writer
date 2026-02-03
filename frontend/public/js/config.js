import { loadCommonComponents, loadThemeFromConfig, applyTheme, generateAnalysisOptionsHTML, getAnalysisPlaceholder } from './main.js';
import { JiraAuth, getInstanceNameFromBaseUrl, initJiraAuth, refreshAccountButton, exportFullConfig, clearAllConfig, CLEAR_CONFIG_CONFIRM_MSG } from './jira-auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadCommonComponents();
  loadThemeFromConfig();
  initJiraAuth(); // Botão de conta no header (config não redireciona)
  loadConfig();
  await loadAnalysisTypes(); // Carregar tipos de análise disponíveis
  bindConfigEvents();
  checkUrlAnchor();
});

let initialConfigSnapshot = null;
let isDirty = false;

function getCurrentConfigSnapshot() {
  return JSON.stringify({
    user: {
      name: document.getElementById('userName').value,
      email: document.getElementById('userEmail').value,
      company: document.getElementById('userCompany').value
    },
    preferences: {
      defaultAI: document.getElementById('defaultAI').value,
      defaultAnalyseType: document.getElementById('defaultAnalyseType').value,
      autoCopy: document.getElementById('autoCopy').checked,
      clearAfterSuccess: document.getElementById('clearAfterSuccess').checked,
      theme: document.getElementById('theme').value
    },
    integrations: {
      jira: {
        enabled: document.getElementById('jiraEnabled').checked,
        baseUrl: document.getElementById('jiraBaseUrl').value,
        userEmail: document.getElementById('jiraUserEmail').value,
        apiToken: document.getElementById('jiraApiToken').value,
        subtaskIssueTypeId: document.getElementById('jiraSubtaskIssueTypeId').value,
        bugIssueTypeId: document.getElementById('jiraBugIssueTypeId')?.value || '10004',
        subBugIssueTypeId: document.getElementById('jiraSubBugIssueTypeId')?.value || '10271',
        requestTimeout: parseInt(document.getElementById('jiraRequestTimeout').value) || 30
      }
    },
    ia: {
      openai: {
        enabled: document.getElementById('openaiEnabled').checked,
        maxTokens: parseInt(document.getElementById('maxTokens').value) || 1000,
        apiKey: document.getElementById('openaiApiKey').value
      },
      stackspot: {
        enabled: document.getElementById('stackspotEnabled').checked,
        streaming: document.getElementById('streaming').checked,
        stackspotKnowledge: document.getElementById('stackspotKnowledge').checked,
        returnKsInResponse: document.getElementById('returnKsInResponse').checked,
        clientId: document.getElementById('stackspotClientId').value,
        clientSecret: document.getElementById('stackspotClientSecret').value,
        realm: document.getElementById('stackspotRealm').value,
        agentId: document.getElementById('stackspotAgentId').value
      }
    }
  });
}

function setSaveButtonsEnabled(enabled) {
  document.getElementById('saveBtn').disabled = !enabled;
}

function markDirty() {
  isDirty = true;
  setSaveButtonsEnabled(true);
}

function markClean() {
  isDirty = false;
  setSaveButtonsEnabled(false);
}

function setupDirtyTracking() {
  const fields = [
    'userName', 'userEmail', 'userCompany',
    'defaultAI', 'defaultAnalyseType', 'autoCopy', 'clearAfterSuccess', 'theme',
    'jiraEnabled', 'jiraBaseUrl', 'jiraUserEmail', 'jiraApiToken', 'jiraSubtaskIssueTypeId', 'jiraBugIssueTypeId', 'jiraSubBugIssueTypeId', 'jiraRequestTimeout',
    'openaiEnabled', 'maxTokens',
    'stackspotEnabled', 'streaming', 'stackspotKnowledge', 'returnKsInResponse',
    'openaiApiKey', 'stackspotClientId', 'stackspotClientSecret', 'stackspotRealm', 'stackspotAgentId'
  ];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', onConfigFieldChange);
      el.addEventListener('change', onConfigFieldChange);
    }
  });
}

function onConfigFieldChange() {
  const current = getCurrentConfigSnapshot();
  if (current !== initialConfigSnapshot) {
    markDirty();
  } else {
    markClean();
  }
}

window.addEventListener('beforeunload', function(e) {
  if (isDirty) {
    e.preventDefault();
    e.returnValue = 'Existem configurações não salvas. Deseja sair sem salvar?';
    return e.returnValue;
  }
});

function setupLeaveWarning() {
  const links = document.querySelectorAll('a,button');
  links.forEach(link => {
    if (link.id === 'saveBtn' || link.id === 'configSairBtn') return;
    // Testar conexão Jira e Testar conexão com IA não saem da página; não exibir aviso
    const onclick = link.getAttribute('onclick') || '';
    if (onclick.includes('testJiraConnection') || onclick.includes('testApiConfig')) return;
    link.addEventListener('click', function(e) {
      if (isDirty) {
        const confirmLeave = confirm('Existem configurações não salvas. Deseja descartar as alterações e sair?');
        if (!confirmLeave) {
          e.preventDefault();
        }
      }
    });
  });
}

async function loadConfig() {
  try {
    const localConfig = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
    applyConfigToFields(localConfig);
    applyJiraAuthToFields(localConfig);
    applyFieldStates();
    checkDefaultAIEnabled();
    initialConfigSnapshot = getCurrentConfigSnapshot();
    markClean();
    setupDirtyTracking();
    setupLeaveWarning();
  } catch (error) {
    const localConfig = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
    applyConfigToFields(localConfig);
    applyJiraAuthToFields(localConfig);
    applyFieldStates();
    checkDefaultAIEnabled();
    initialConfigSnapshot = getCurrentConfigSnapshot();
    markClean();
    setupDirtyTracking();
    setupLeaveWarning();
  }
}

/**
 * Preenche seção Jira a partir de JiraAuth.get() quando autenticado;
 * preenche Informações Pessoais (userName, userEmail, userCompany) quando vazios.
 */
function applyJiraAuthToFields(localConfig) {
  if (!JiraAuth.isAuthenticated()) return;
  const creds = JiraAuth.get();
  if (!creds) return;

  document.getElementById('jiraEnabled').checked = true;
  if (creds.baseUrl) {
    document.getElementById('jiraBaseUrl').value = creds.baseUrl;
    originalJiraConfig.jiraBaseUrl = creds.baseUrl;
  }
  if (creds.email) {
    document.getElementById('jiraUserEmail').value = creds.email;
    originalJiraConfig.jiraUserEmail = creds.email;
  }
  if (creds.token) {
    document.getElementById('jiraApiToken').value = creds.token;
    originalJiraConfig.jiraApiToken = creds.token;
  }
  const jiraConf = (localConfig.integrations || {}).jira || {};
  const subtaskId = jiraConf.subtaskIssueTypeId || '10003';
  const bugId = jiraConf.bugIssueTypeId || '10004';
  const subBugId = jiraConf.subBugIssueTypeId || '10271';
  const timeout = jiraConf.requestTimeout != null ? String(jiraConf.requestTimeout) : '30';
  document.getElementById('jiraSubtaskIssueTypeId').value = subtaskId;
  const bugEl = document.getElementById('jiraBugIssueTypeId');
  const subBugEl = document.getElementById('jiraSubBugIssueTypeId');
  if (bugEl) { bugEl.value = bugId; originalJiraConfig.jiraBugIssueTypeId = bugId; }
  if (subBugEl) { subBugEl.value = subBugId; originalJiraConfig.jiraSubBugIssueTypeId = subBugId; }
  document.getElementById('jiraRequestTimeout').value = timeout;
  originalJiraConfig.jiraSubtaskIssueTypeId = subtaskId;
  originalJiraConfig.jiraRequestTimeout = timeout;

  const userNameEl = document.getElementById('userName');
  const userEmailEl = document.getElementById('userEmail');
  const userCompanyEl = document.getElementById('userCompany');
  if (!userNameEl.value?.trim() && (creds.userDisplayName || creds.displayName)) {
    userNameEl.value = creds.userDisplayName || creds.displayName || '';
  }
  if (!userEmailEl.value?.trim() && (creds.userEmail || creds.email)) {
    userEmailEl.value = creds.userEmail || creds.email || '';
  }
  if (!userCompanyEl.value?.trim() && creds.baseUrl) {
    userCompanyEl.value = getInstanceNameFromBaseUrl(creds.baseUrl) || '';
  }
}

function applyConfigToFields(config) {
  const preferences = config.preferences || {};
  const ia = config.ia || {};
  const openai = ia.openai || {};
  const stackspot = ia.stackspot || {};
  const jiraConf = (config.integrations || {}).jira || {};
  if (preferences.defaultAI) document.getElementById('defaultAI').value = preferences.defaultAI;
  if (preferences.defaultAnalyseType) document.getElementById('defaultAnalyseType').value = preferences.defaultAnalyseType;
  if (preferences.autoCopy !== undefined) document.getElementById('autoCopy').checked = preferences.autoCopy;
  else document.getElementById('autoCopy').checked = false;
  if (preferences.clearAfterSuccess !== undefined) document.getElementById('clearAfterSuccess').checked = preferences.clearAfterSuccess;
  if (preferences.theme) {
    document.getElementById('theme').value = preferences.theme;
    applyTheme(preferences.theme);
  }
  document.getElementById('jiraEnabled').checked = !!jiraConf.enabled;
  document.getElementById('jiraSubtaskIssueTypeId').value = (jiraConf.subtaskIssueTypeId ?? '10003').toString();
  const bugEl = document.getElementById('jiraBugIssueTypeId');
  const subBugEl = document.getElementById('jiraSubBugIssueTypeId');
  if (bugEl) bugEl.value = (jiraConf.bugIssueTypeId ?? '10004').toString();
  if (subBugEl) subBugEl.value = (jiraConf.subBugIssueTypeId ?? '10271').toString();
  document.getElementById('jiraRequestTimeout').value = String(jiraConf.requestTimeout != null ? jiraConf.requestTimeout : 30);
  originalJiraConfig.jiraSubtaskIssueTypeId = (jiraConf.subtaskIssueTypeId ?? '10003').toString();
  originalJiraConfig.jiraBugIssueTypeId = (jiraConf.bugIssueTypeId ?? '10004').toString();
  originalJiraConfig.jiraSubBugIssueTypeId = (jiraConf.subBugIssueTypeId ?? '10271').toString();
  originalJiraConfig.jiraRequestTimeout = String(jiraConf.requestTimeout != null ? jiraConf.requestTimeout : 30);
  document.getElementById('openaiEnabled').checked = openai.enabled === true;
  if (openai.maxTokens !== undefined) {
    document.getElementById('maxTokens').value = openai.maxTokens;
    originalOpenAIConfig.maxTokens = openai.maxTokens;
  } else {
    document.getElementById('maxTokens').value = 1000;
    originalOpenAIConfig.maxTokens = 1000;
  }
  if (openai.apiKey != null) {
    document.getElementById('openaiApiKey').value = openai.apiKey;
    originalOpenAIConfig.openaiApiKey = openai.apiKey;
  }
  document.getElementById('stackspotEnabled').checked = stackspot.enabled === true;
  document.getElementById('streaming').checked = stackspot.streaming === true;
  originalStackSpotConfig.streaming = stackspot.streaming === true;
  document.getElementById('stackspotKnowledge').checked = stackspot.stackspotKnowledge === true;
  originalStackSpotConfig.stackspotKnowledge = stackspot.stackspotKnowledge === true;
  document.getElementById('returnKsInResponse').checked = stackspot.returnKsInResponse === true;
  originalStackSpotConfig.returnKsInResponse = stackspot.returnKsInResponse === true;
  if (stackspot.clientId != null) { document.getElementById('stackspotClientId').value = stackspot.clientId; originalStackSpotConfig.stackspotClientId = stackspot.clientId; }
  if (stackspot.clientSecret != null) { document.getElementById('stackspotClientSecret').value = stackspot.clientSecret; originalStackSpotConfig.stackspotClientSecret = stackspot.clientSecret; }
  if (stackspot.realm != null) { document.getElementById('stackspotRealm').value = stackspot.realm; originalStackSpotConfig.stackspotRealm = stackspot.realm; }
  if (stackspot.agentId != null) { document.getElementById('stackspotAgentId').value = stackspot.agentId; originalStackSpotConfig.stackspotAgentId = stackspot.agentId; }
}

// Variáveis para armazenar dados originais
let originalJiraConfig = {};
let originalOpenAIConfig = {};
let originalStackSpotConfig = {};

// Aplica collapse/expand das seções Jira, OpenAI e StackSpot conforme as flags "Habilitar"
function applySectionCollapse() {
  const jiraEnabled = document.getElementById('jiraEnabled').checked;
  const openaiEnabled = document.getElementById('openaiEnabled').checked;
  const stackspotEnabled = document.getElementById('stackspotEnabled').checked;

  const jiraBody = document.getElementById('jiraConfigBody');
  const openaiBody = document.getElementById('openaiConfigBody');
  const stackspotBody = document.getElementById('stackspotConfigBody');

  if (jiraBody) jiraBody.classList.toggle('collapsed', !jiraEnabled);
  if (openaiBody) openaiBody.classList.toggle('collapsed', !openaiEnabled);
  if (stackspotBody) stackspotBody.classList.toggle('collapsed', !stackspotEnabled);
}

// Função para aplicar o estado dos campos baseado nos checkboxes habilitados
function applyFieldStates() {
  applySectionCollapse();

  const jiraEnabled = document.getElementById('jiraEnabled').checked;
  const openaiEnabled = document.getElementById('openaiEnabled').checked;
  const stackspotEnabled = document.getElementById('stackspotEnabled').checked;

  // Aplicar estado dos campos Jira
  const jiraFields = ['jiraBaseUrl', 'jiraUserEmail', 'jiraApiToken', 'jiraSubtaskIssueTypeId', 'jiraBugIssueTypeId', 'jiraSubBugIssueTypeId', 'jiraRequestTimeout'];
  const jiraDefaults = { jiraRequestTimeout: '30', jiraBugIssueTypeId: '10004', jiraSubBugIssueTypeId: '10271' };
  jiraFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.disabled = !jiraEnabled;
    if (!jiraEnabled) {
      if (field.value) originalJiraConfig[fieldId] = field.value;
      field.value = jiraDefaults[fieldId] || '';
    } else {
      const val = originalJiraConfig[fieldId];
      if (val !== undefined && val !== null && val !== '') {
        field.value = String(val);
      }
    }
  });
  
  // Aplicar estado dos campos OpenAI
  const openaiFields = ['openaiApiKey', 'maxTokens'];
  openaiFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    field.disabled = !openaiEnabled;
    if (!openaiEnabled) {
      // Salvar valor atual antes de limpar
      if (field.value) {
        originalOpenAIConfig[fieldId] = field.value;
      }
      field.value = '';
    } else {
      // Restaurar valor original se existir
      if (originalOpenAIConfig[fieldId]) {
        field.value = originalOpenAIConfig[fieldId];
      }
    }
  });
  
  // Aplicar estado dos campos StackSpot
  const stackspotFields = [
    'stackspotClientId',
    'stackspotClientSecret',
    'stackspotRealm',
    'stackspotAgentId',
    'streaming',
    'stackspotKnowledge',
    'returnKsInResponse'
  ];
  stackspotFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    field.disabled = !stackspotEnabled;
    if (!stackspotEnabled) {
      if (field.type === 'text' || field.type === 'password') {
        // Salvar valor atual antes de limpar
        if (field.value) {
          originalStackSpotConfig[fieldId] = field.value;
        }
        field.value = '';
      } else if (field.type === 'checkbox') {
        // Salvar estado atual antes de desmarcar
        originalStackSpotConfig[fieldId] = field.checked;
        field.checked = false;
      }
    } else {
      // Restaurar valor original se existir
      if (originalStackSpotConfig[fieldId] !== undefined) {
        if (field.type === 'text' || field.type === 'password') {
          field.value = originalStackSpotConfig[fieldId];
        } else if (field.type === 'checkbox') {
          field.checked = originalStackSpotConfig[fieldId];
        }
      }
    }
  });
  
  // Verificar se houve mudanças após aplicar os estados
  setTimeout(() => {
    onConfigFieldChange();
  }, 0);
}

function bindConfigEvents() {
  document.getElementById('theme').addEventListener('change', function() {
    const selectedTheme = this.value;
    applyTheme(selectedTheme);
  });
  document.getElementById('jiraEnabled').addEventListener('change', function() {
    applyFieldStates();
  });
  document.getElementById('openaiEnabled').addEventListener('change', function() {
    applyFieldStates();
    // Se desabilitou OpenAI, limpar dados originais APENAS se salvou
    // Os dados originais são preservados para restauração
  });
  document.getElementById('stackspotEnabled').addEventListener('change', function() {
    applyFieldStates();
    // Se desabilitou StackSpot, limpar dados originais APENAS se salvou
    // Os dados originais são preservados para restauração
  });
  document.getElementById('defaultAI').addEventListener('change', checkDefaultAIEnabled);
  document.getElementById('openaiEnabled').addEventListener('change', checkDefaultAIEnabled);
  document.getElementById('stackspotEnabled').addEventListener('change', checkDefaultAIEnabled);
  window.addEventListener('DOMContentLoaded', checkDefaultAIEnabled);
      document.getElementById('saveBtn').addEventListener('click', saveConfig);
  // Corrigir apenas os botões específicos de "Voltar ao QA Card Writer"
      document.querySelectorAll('button[onclick*="window.location.href=\'chat.html\'"]').forEach(btn => {
      btn.onclick = () => { window.location.href = 'chat.html'; };
    });
  document.querySelector('button[onclick*="testApiConfig"]').onclick = testApiConfig;
  window.saveConfig = saveConfig;
  window.testJiraConnection = testJiraConnection;

  const exportBtn = document.getElementById('configExportBtn');
  const importBtn = document.getElementById('configImportBtn');
  const importFile = document.getElementById('configImportFile');
  if (exportBtn) exportBtn.addEventListener('click', exportConfig);
  if (importBtn) importBtn.addEventListener('click', () => importFile?.click());
  if (importFile) importFile.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          importConfigFromJson(ev.target?.result);
        } finally {
          e.target.value = '';
        }
      };
      reader.readAsText(file);
    }
  });
  const sairBtn = document.getElementById('configSairBtn');
  if (sairBtn) sairBtn.addEventListener('click', clearConfig);
}

function clearConfig() {
  if (!confirm(CLEAR_CONFIG_CONFIRM_MSG)) return;
  clearAllConfig();
  originalJiraConfig = {};
  originalOpenAIConfig = {};
  originalStackSpotConfig = {};
  document.getElementById('theme').value = 'dark';
  applyTheme('dark');
  window.location.reload();
}

function exportConfig() {
  const baseUrl = document.getElementById('jiraBaseUrl').value?.trim();
  const email = document.getElementById('jiraUserEmail').value?.trim();
  const token = document.getElementById('jiraApiToken').value?.trim();
  const fromAuth = JiraAuth.get();
  const payload = {
    user: {
      name: document.getElementById('userName').value?.trim() || '',
      email: document.getElementById('userEmail').value?.trim() || '',
      company: document.getElementById('userCompany').value?.trim() || ''
    },
    preferences: {
      defaultAI: document.getElementById('defaultAI').value || 'openai',
      defaultAnalyseType: document.getElementById('defaultAnalyseType').value || 'card_QA_writer',
      autoCopy: document.getElementById('autoCopy').checked,
      clearAfterSuccess: document.getElementById('clearAfterSuccess').checked,
      theme: document.getElementById('theme').value || 'dark'
    },
    integrations: {
      jira: {
        enabled: document.getElementById('jiraEnabled').checked,
        baseUrl: baseUrl || fromAuth?.baseUrl || '',
        email: email || fromAuth?.email || '',
        token: token || fromAuth?.token || '',
        subtaskIssueTypeId: document.getElementById('jiraSubtaskIssueTypeId').value || '10003',
        bugIssueTypeId: document.getElementById('jiraBugIssueTypeId')?.value || '10004',
        subBugIssueTypeId: document.getElementById('jiraSubBugIssueTypeId')?.value || '10271',
        requestTimeout: parseInt(document.getElementById('jiraRequestTimeout').value) || 30
      }
    },
    ia: {
      openai: {
        enabled: document.getElementById('openaiEnabled').checked,
        maxTokens: parseInt(document.getElementById('maxTokens').value) || 1000,
        apiKey: document.getElementById('openaiApiKey').value || ''
      },
      stackspot: {
        enabled: document.getElementById('stackspotEnabled').checked,
        streaming: document.getElementById('streaming').checked,
        stackspotKnowledge: document.getElementById('stackspotKnowledge').checked,
        returnKsInResponse: document.getElementById('returnKsInResponse').checked,
        clientId: document.getElementById('stackspotClientId').value || '',
        clientSecret: document.getElementById('stackspotClientSecret').value || '',
        realm: document.getElementById('stackspotRealm').value || '',
        agentId: document.getElementById('stackspotAgentId').value || ''
      }
    }
  };
  exportFullConfig(payload);
}

function validateBsqaConfigSchema(data) {
  return data && typeof data === 'object' &&
    data.user != null && typeof data.user === 'object' &&
    data.preferences != null && typeof data.preferences === 'object' &&
    data.integrations != null && typeof data.integrations === 'object' &&
    data.ia != null && typeof data.ia === 'object';
}

function importConfigFromJson(jsonStr) {
  if (!jsonStr || typeof jsonStr !== 'string') return;
  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    alert('Arquivo JSON inválido.');
    return;
  }
  if (!validateBsqaConfigSchema(data)) {
    alert('Formato inválido. Renove seu arquivo de configuração (use o padrão bsqa-config com user, preferences, integrations e ia).');
    return;
  }
  const user = data.user || {};
  const preferences = data.preferences || {};
  const jira = data.integrations?.jira || {};
  const ia = data.ia || {};
  const openai = ia.openai || {};
  const stackspot = ia.stackspot || {};

  document.getElementById('userName').value = user.name != null ? String(user.name) : '';
  document.getElementById('userEmail').value = user.email != null ? String(user.email) : '';
  document.getElementById('userCompany').value = user.company != null ? String(user.company) : '';

  if (preferences.defaultAI) document.getElementById('defaultAI').value = preferences.defaultAI;
  if (preferences.defaultAnalyseType) document.getElementById('defaultAnalyseType').value = preferences.defaultAnalyseType;
  if (preferences.autoCopy !== undefined) document.getElementById('autoCopy').checked = preferences.autoCopy;
  if (preferences.clearAfterSuccess !== undefined) document.getElementById('clearAfterSuccess').checked = preferences.clearAfterSuccess;
  if (preferences.theme) {
    document.getElementById('theme').value = preferences.theme;
    applyTheme(preferences.theme);
  }

  const baseUrl = (jira.baseUrl ?? '').toString().trim();
  const email = (jira.email ?? '').toString().trim();
  const token = (jira.token ?? '').toString().trim();
  const hasJira = baseUrl && email && token;
  document.getElementById('jiraEnabled').checked = !!jira.enabled;
  document.getElementById('jiraBaseUrl').value = baseUrl;
  document.getElementById('jiraUserEmail').value = email;
  document.getElementById('jiraApiToken').value = token;
  document.getElementById('jiraSubtaskIssueTypeId').value = (jira.subtaskIssueTypeId ?? '10003').toString();
  const bugEl = document.getElementById('jiraBugIssueTypeId');
  const subBugEl = document.getElementById('jiraSubBugIssueTypeId');
  if (bugEl) bugEl.value = (jira.bugIssueTypeId ?? '10004').toString();
  if (subBugEl) subBugEl.value = (jira.subBugIssueTypeId ?? '10271').toString();
  document.getElementById('jiraRequestTimeout').value = String(jira.requestTimeout != null ? Number(jira.requestTimeout) : 30);

  originalJiraConfig.jiraBaseUrl = baseUrl;
  originalJiraConfig.jiraUserEmail = email;
  originalJiraConfig.jiraApiToken = token;
  originalJiraConfig.jiraSubtaskIssueTypeId = (jira.subtaskIssueTypeId ?? '10003').toString();
  originalJiraConfig.jiraBugIssueTypeId = (jira.bugIssueTypeId ?? '10004').toString();
  originalJiraConfig.jiraSubBugIssueTypeId = (jira.subBugIssueTypeId ?? '10271').toString();
  originalJiraConfig.jiraRequestTimeout = String(jira.requestTimeout != null ? Number(jira.requestTimeout) : 30);
  if (hasJira) JiraAuth.save(baseUrl, email, token);

  document.getElementById('openaiEnabled').checked = !!openai.enabled;
  document.getElementById('maxTokens').value = String(openai.maxTokens != null ? openai.maxTokens : 1000);
  document.getElementById('openaiApiKey').value = openai.apiKey != null ? String(openai.apiKey) : '';
  originalOpenAIConfig.maxTokens = document.getElementById('maxTokens').value;
  originalOpenAIConfig.openaiApiKey = document.getElementById('openaiApiKey').value;

  document.getElementById('stackspotEnabled').checked = !!stackspot.enabled;
  document.getElementById('streaming').checked = !!stackspot.streaming;
  document.getElementById('stackspotKnowledge').checked = !!stackspot.stackspotKnowledge;
  document.getElementById('returnKsInResponse').checked = !!stackspot.returnKsInResponse;
  document.getElementById('stackspotClientId').value = stackspot.clientId != null ? String(stackspot.clientId) : '';
  document.getElementById('stackspotClientSecret').value = stackspot.clientSecret != null ? String(stackspot.clientSecret) : '';
  document.getElementById('stackspotRealm').value = stackspot.realm != null ? String(stackspot.realm) : '';
  document.getElementById('stackspotAgentId').value = stackspot.agentId != null ? String(stackspot.agentId) : '';
  originalStackSpotConfig.stackspotClientId = document.getElementById('stackspotClientId').value;
  originalStackSpotConfig.stackspotClientSecret = document.getElementById('stackspotClientSecret').value;
  originalStackSpotConfig.stackspotRealm = document.getElementById('stackspotRealm').value;
  originalStackSpotConfig.stackspotAgentId = document.getElementById('stackspotAgentId').value;
  originalStackSpotConfig.streaming = document.getElementById('streaming').checked;
  originalStackSpotConfig.stackspotKnowledge = document.getElementById('stackspotKnowledge').checked;
  originalStackSpotConfig.returnKsInResponse = document.getElementById('returnKsInResponse').checked;

  applyFieldStates();
  // Salvar imediatamente para evitar necessidade de clicar em Salvar e risco de sair sem salvar
  persistConfigFromForm();
  checkDefaultAIEnabled();
}

function buildConfigFromForm() {
  return {
    user: {
      name: document.getElementById('userName').value,
      email: document.getElementById('userEmail').value,
      company: document.getElementById('userCompany').value
    },
    preferences: {
      defaultAI: document.getElementById('defaultAI').value,
      defaultAnalyseType: document.getElementById('defaultAnalyseType').value,
      autoCopy: document.getElementById('autoCopy').checked,
      clearAfterSuccess: document.getElementById('clearAfterSuccess').checked,
      theme: document.getElementById('theme').value
    },
    integrations: {
      jira: {
        enabled: document.getElementById('jiraEnabled').checked,
        subtaskIssueTypeId: document.getElementById('jiraSubtaskIssueTypeId').value || '10003',
        bugIssueTypeId: document.getElementById('jiraBugIssueTypeId')?.value || '10004',
        subBugIssueTypeId: document.getElementById('jiraSubBugIssueTypeId')?.value || '10271',
        requestTimeout: parseInt(document.getElementById('jiraRequestTimeout').value) || 30
      }
    },
    ia: {
      openai: {
        enabled: document.getElementById('openaiEnabled').checked,
        maxTokens: parseInt(document.getElementById('maxTokens').value) || 1000,
        apiKey: document.getElementById('openaiApiKey').value || ''
      },
      stackspot: {
        enabled: document.getElementById('stackspotEnabled').checked,
        streaming: document.getElementById('streaming').checked,
        stackspotKnowledge: document.getElementById('stackspotKnowledge').checked,
        returnKsInResponse: document.getElementById('returnKsInResponse').checked,
        clientId: document.getElementById('stackspotClientId').value || '',
        clientSecret: document.getElementById('stackspotClientSecret').value || '',
        realm: document.getElementById('stackspotRealm').value || '',
        agentId: document.getElementById('stackspotAgentId').value || ''
      }
    }
  };
}

function persistConfigFromForm() {
  const config = buildConfigFromForm();
  const jiraEnabled = document.getElementById('jiraEnabled').checked;
  const openaiEnabled = document.getElementById('openaiEnabled').checked;
  const stackspotEnabled = document.getElementById('stackspotEnabled').checked;
  if (jiraEnabled) {
    JiraAuth.save(
      document.getElementById('jiraBaseUrl').value,
      document.getElementById('jiraUserEmail').value,
      document.getElementById('jiraApiToken').value
    );
  }
  localStorage.setItem('bsqaConfig', JSON.stringify(config));
  localStorage.setItem('bsqaThemeChanged', Date.now().toString());
  if (!jiraEnabled) originalJiraConfig = {};
  if (!openaiEnabled) originalOpenAIConfig = {};
  if (!stackspotEnabled) originalStackSpotConfig = {};
  markClean();
  initialConfigSnapshot = getCurrentConfigSnapshot();
  refreshAccountButton();
}

async function saveConfig() {
  const saveBtn = document.getElementById('saveBtn');
  const originalText = saveBtn.textContent;
  const defaultAI = document.getElementById('defaultAI').value;
  const openaiEnabled = document.getElementById('openaiEnabled').checked;
  const stackspotEnabled = document.getElementById('stackspotEnabled').checked;
  if ((defaultAI === 'openai' && !openaiEnabled) || (defaultAI === 'stackspot' && !stackspotEnabled)) {
    alert('A IA selecionada como padrão não está habilitada. Habilite-a para usá-la como padrão.');
    return;
  }
  try {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';
    persistConfigFromForm();
    saveBtn.textContent = 'Salvo! ✅';
    setTimeout(() => { saveBtn.textContent = originalText; }, 3000);
  } catch (error) {
    saveBtn.textContent = originalText;
    alert('Erro ao salvar: ' + (error.message || 'Erro desconhecido'));
  } finally {
    saveBtn.disabled = false;
  }
}

async function testApiConfig() {
  const testResult = document.getElementById('testResult');
  testResult.style.display = 'block';
          testResult.innerHTML = '<div data-testid="config-test-loading">🔄 Testando configurações...</div>';
  testResult.style.background = 'rgba(255, 193, 7, 0.2)';
  testResult.style.color = '#ffc107';
  testResult.style.border = '1px solid #ffc107';
  try {
    const ia_credentials = {
      openai: document.getElementById('openaiEnabled').checked
        ? { api_key: document.getElementById('openaiApiKey').value }
        : null,
      stackspot: document.getElementById('stackspotEnabled').checked
        ? {
            client_id: document.getElementById('stackspotClientId').value,
            client_secret: document.getElementById('stackspotClientSecret').value,
            realm: document.getElementById('stackspotRealm').value,
            agent_id: document.getElementById('stackspotAgentId').value
          }
        : null
    };
    const testResponse = await fetch(window.ApiConfig.buildUrl('/test-api-config'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ia_credentials })
    });
    const testData = await testResponse.json().catch(() => ({}));
    if (testResponse.ok && testData.success) {
      let resultHtml = `✅ ${testData.message || 'Conexão OK'}<br><br>`;
      if (testData.results && testData.results.length > 0) {
        resultHtml += '<strong>Detalhes dos testes:</strong><br>';
        testData.results.forEach(result => {
          const icon = result.status === 'success' ? '✅' : '❌';
          const color = result.status === 'success' ? '#4caf50' : '#f44336';
          resultHtml += `<span style="color: ${color};">${icon} ${result.service}: ${result.message}</span><br>`;
        });
      }
      testResult.innerHTML = `<div data-testid="config-test-success">${resultHtml}</div>`;
      testResult.style.background = 'rgba(76, 175, 80, 0.2)';
      testResult.style.color = '#4caf50';
      testResult.style.border = '1px solid #4caf50';
    } else {
      const msg = testData.message || testData.detail || 'Falha ao testar';
      let resultHtml = `❌ ${msg}<br><br>`;
      if (testData.results && testData.results.length > 0) {
        resultHtml += '<strong>Detalhes dos testes:</strong><br>';
        testData.results.forEach(result => {
          const icon = result.status === 'success' ? '✅' : '❌';
          const color = result.status === 'success' ? '#4caf50' : '#f44336';
          resultHtml += `<span style="color: ${color};">${icon} ${result.service}: ${result.message}</span><br>`;
        });
      }
      testResult.innerHTML = `<div data-testid="config-test-error">${resultHtml}</div>`;
      testResult.style.background = 'rgba(244, 67, 54, 0.2)';
      testResult.style.color = '#f44336';
      testResult.style.border = '1px solid #f44336';
    }
  } catch (error) {
    testResult.innerHTML = `<div data-testid="config-test-error-general">❌ Erro ao testar configurações: ${error.message}</div>`;
    testResult.style.background = 'rgba(244, 67, 54, 0.2)';
    testResult.style.color = '#f44336';
    testResult.style.border = '1px solid #f44336';
  }
}

function checkDefaultAIEnabled() {
  const defaultAI = document.getElementById('defaultAI').value;
  const openaiEnabled = document.getElementById('openaiEnabled').checked;
  const stackspotEnabled = document.getElementById('stackspotEnabled').checked;
  const warning = document.getElementById('defaultAIWarning');
  const saveBtn = document.getElementById('saveBtn');
  let hasError = false;
  if ((defaultAI === 'openai' && !openaiEnabled) || (defaultAI === 'stackspot' && !stackspotEnabled)) {
    warning.style.display = 'block';
    warning.textContent = 'A IA selecionada como padrão não está habilitada. Habilite-a para usá-la como padrão.';
    hasError = true;
  } else {
    warning.style.display = 'none';
    warning.textContent = '';
  }
  saveBtn.disabled = hasError;
}

// Carregar tipos de análise disponíveis do backend
async function loadAnalysisTypes() {
  try {
    const response = await fetch(window.ApiConfig.buildUrl('/analysis-types'));
    const data = await response.json();
    const defaultAnalyseTypeSelect = document.getElementById('defaultAnalyseType');
    
    // Limpar opções existentes
    defaultAnalyseTypeSelect.innerHTML = '';
    
    // Adicionar opções dinamicamente
    Object.entries(data.analysis_types).forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      option.setAttribute('data-testid', `config-option-analysis-${value}`);
      defaultAnalyseTypeSelect.appendChild(option);
    });
    
    // Aplicar configuração salva se existir
    const config = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
    if (config.preferences && config.preferences.defaultAnalyseType) {
      defaultAnalyseTypeSelect.value = config.preferences.defaultAnalyseType;
    }
  } catch (error) {
    if (window.safeErrorLog) {
      window.safeErrorLog('Erro ao carregar tipos de análise:', error);
    }
    // Fallback para opções padrão em caso de erro
    const defaultAnalyseTypeSelect = document.getElementById('defaultAnalyseType');
    defaultAnalyseTypeSelect.innerHTML = generateAnalysisOptionsHTML('', 'config-option-analysis');
  }
}

// Função para verificar âncora na URL e focar em seções específicas
function checkUrlAnchor() {
  const hash = window.location.hash;
  
  if (hash) {
    // Aguardar um pouco para garantir que a página foi carregada
    setTimeout(() => {
      const targetElement = document.querySelector(hash);
      if (targetElement) {
        // Scroll suave para o elemento
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Adicionar efeito visual para destacar a seção
        targetElement.style.border = '2px solid var(--accent-color)';
        targetElement.style.borderRadius = '8px';
        targetElement.style.padding = '1rem';
        targetElement.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        
        // Remover o efeito após alguns segundos
        setTimeout(() => {
          targetElement.style.border = '';
          targetElement.style.borderRadius = '';
          targetElement.style.padding = '';
          targetElement.style.backgroundColor = '';
        }, 3000);
      }
    }, 500);
  }
}

// Função para testar conexão com Jira (usa credenciais do form via headers; não grava no backend)
async function testJiraConnection() {
  const testResult = document.getElementById('testJiraResult');
  testResult.style.display = 'block';
  testResult.innerHTML = '<div data-testid="config-test-jira-loading">🔄 Testando conexão com Jira...</div>';
  testResult.style.background = 'rgba(255, 193, 7, 0.2)';
  testResult.style.color = '#ffc107';
  testResult.style.border = '1px solid #ffc107';

  const baseUrl = (document.getElementById('jiraBaseUrl').value || '').trim();
  const email = (document.getElementById('jiraUserEmail').value || '').trim();
  const token = (document.getElementById('jiraApiToken').value || '').trim();
  if (!baseUrl || !email || !token) {
    testResult.innerHTML = '<div data-testid="config-test-jira-error">❌ Preencha URL, email e token do Jira.</div>';
    testResult.style.background = 'rgba(244, 67, 54, 0.2)';
    testResult.style.color = '#f44336';
    testResult.style.border = '1px solid #f44336';
    return;
  }

  const authHeader = btoa(`${email}:${token}`);
  const headers = {
    'Content-Type': 'application/json',
    'X-Jira-Auth': authHeader,
    'X-Jira-Base-Url': baseUrl
  };

  try {
    const testResponse = await fetch(window.ApiConfig.buildUrl('/jira/test-connection'), {
      method: 'POST',
      headers
    });

    const testData = await testResponse.json().catch(() => ({}));
    if (testResponse.ok && testData.success) {
      const user = testData.user || {};
      JiraAuth.save(baseUrl, email, token, user.displayName, user.emailAddress);
      const userNameEl = document.getElementById('userName');
      const userEmailEl = document.getElementById('userEmail');
      const userCompanyEl = document.getElementById('userCompany');
      if (user.displayName && !userNameEl.value?.trim()) userNameEl.value = user.displayName;
      if (user.emailAddress && !userEmailEl.value?.trim()) userEmailEl.value = user.emailAddress;
      if (!userCompanyEl.value?.trim()) userCompanyEl.value = getInstanceNameFromBaseUrl(baseUrl) || '';
      testResult.innerHTML = `<div data-testid="config-test-jira-success">✅ ${testData.message}</div>`;
      testResult.style.background = 'rgba(76, 175, 80, 0.2)';
      testResult.style.color = '#4caf50';
      testResult.style.border = '1px solid #4caf50';
    } else {
      const msg = testData.error || testData.detail || testData.message || 'Falha ao conectar com Jira';
      testResult.innerHTML = `<div data-testid="config-test-jira-error">❌ ${msg}</div>`;
      testResult.style.background = 'rgba(244, 67, 54, 0.2)';
      testResult.style.color = '#f44336';
      testResult.style.border = '1px solid #f44336';
    }
  } catch (error) {
    testResult.innerHTML = `<div data-testid="config-test-jira-error-general">❌ Erro ao testar conexão: ${error.message}</div>`;
    testResult.style.background = 'rgba(244, 67, 54, 0.2)';
    testResult.style.color = '#f44336';
    testResult.style.border = '1px solid #f44336';
  }
} 