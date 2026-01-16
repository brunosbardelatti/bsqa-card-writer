import { loadCommonComponents, loadThemeFromConfig, applyTheme, generateAnalysisOptionsHTML, getAnalysisPlaceholder } from './main.js';
import { authenticatedFetch } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadCommonComponents();
  loadThemeFromConfig();
  loadConfig();
  await loadAnalysisTypes(); // Carregar tipos de análise disponíveis
  bindConfigEvents();
  
  // Verificar se há âncora na URL para focar em seções específicas
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
    if (link.id === 'saveBtn') return;
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
    const response = await authenticatedFetch(window.ApiConfig.buildUrl('/config'));
    if (response.ok) {
      const serverConfig = await response.json();
      const mergedConfig = { ...localConfig, ...serverConfig };
      applyConfigToFields(mergedConfig);
      localStorage.setItem('bsqaConfig', JSON.stringify(mergedConfig));
    } else {
      applyConfigToFields(localConfig);
    }
    await loadApiConfig();
    // Aplicar estado final dos campos após carregar todas as configurações
    applyFieldStates();
    checkDefaultAIEnabled();
    initialConfigSnapshot = getCurrentConfigSnapshot();
    markClean();
    setupDirtyTracking();
    setupLeaveWarning();
  } catch (error) {
    const localConfig = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
    applyConfigToFields(localConfig);
    await loadApiConfig();
    // Aplicar estado final dos campos após carregar todas as configurações
    applyFieldStates();
    checkDefaultAIEnabled();
    initialConfigSnapshot = getCurrentConfigSnapshot();
    markClean();
    setupDirtyTracking();
    setupLeaveWarning();
  }
}

async function loadApiConfig() {
  try {
    const response = await authenticatedFetch(window.ApiConfig.buildUrl('/api-config'));
    if (response.ok) {
      const apiConfig = await response.json();
      applyApiConfigToFields(apiConfig);
    }
  } catch (error) {}
}

function applyApiConfigToFields(apiConfig) {
  const openaiEnabled = document.getElementById('openaiEnabled');
  const openaiApiKey = document.getElementById('openaiApiKey');
  if (apiConfig.OPENAI_API_KEY) {
    openaiEnabled.checked = true;
    openaiApiKey.value = apiConfig.OPENAI_API_KEY;
    // Inicializar dados originais OpenAI
    originalOpenAIConfig.openaiApiKey = apiConfig.OPENAI_API_KEY;
  } else {
    openaiEnabled.checked = false;
  }
  
  const stackspotEnabled = document.getElementById('stackspotEnabled');
  const hasStackspotConfig = apiConfig.Client_ID_stackspot && apiConfig.Client_Key_stackspot && apiConfig.Realm_stackspot && apiConfig.STACKSPOT_AGENT_ID;
  if (hasStackspotConfig) {
    stackspotEnabled.checked = true;
    if (apiConfig.Client_ID_stackspot) {
      document.getElementById('stackspotClientId').value = apiConfig.Client_ID_stackspot;
      originalStackSpotConfig.stackspotClientId = apiConfig.Client_ID_stackspot;
    }
    if (apiConfig.Client_Key_stackspot) {
      document.getElementById('stackspotClientSecret').value = apiConfig.Client_Key_stackspot;
      originalStackSpotConfig.stackspotClientSecret = apiConfig.Client_Key_stackspot;
    }
    if (apiConfig.Realm_stackspot) {
      document.getElementById('stackspotRealm').value = apiConfig.Realm_stackspot;
      originalStackSpotConfig.stackspotRealm = apiConfig.Realm_stackspot;
    }
    if (apiConfig.STACKSPOT_AGENT_ID) {
      document.getElementById('stackspotAgentId').value = apiConfig.STACKSPOT_AGENT_ID;
      originalStackSpotConfig.stackspotAgentId = apiConfig.STACKSPOT_AGENT_ID;
    }
  } else {
    stackspotEnabled.checked = false;
  }
}

function applyConfigToFields(config) {
  const user = config.user || {};
  const preferences = config.preferences || {};
  const ia = config.ia || {};
  const openai = ia.openai || {};
  const stackspot = ia.stackspot || {};
  if (user.name) document.getElementById('userName').value = user.name;
  if (user.email) document.getElementById('userEmail').value = user.email;
  if (user.company) document.getElementById('userCompany').value = user.company;
  if (preferences.defaultAI) document.getElementById('defaultAI').value = preferences.defaultAI;
  if (preferences.defaultAnalyseType) document.getElementById('defaultAnalyseType').value = preferences.defaultAnalyseType;
  if (preferences.autoCopy !== undefined) document.getElementById('autoCopy').checked = preferences.autoCopy;
  else document.getElementById('autoCopy').checked = false;
  if (preferences.clearAfterSuccess !== undefined) document.getElementById('clearAfterSuccess').checked = preferences.clearAfterSuccess;
  if (preferences.theme) {
    document.getElementById('theme').value = preferences.theme;
    applyTheme(preferences.theme);
  }
  document.getElementById('openaiEnabled').checked = openai.enabled === true;
  if (openai.maxTokens !== undefined) {
    document.getElementById('maxTokens').value = openai.maxTokens;
    originalOpenAIConfig.maxTokens = openai.maxTokens;
  } else {
    document.getElementById('maxTokens').value = 1000;
    originalOpenAIConfig.maxTokens = 1000;
  }
  document.getElementById('stackspotEnabled').checked = stackspot.enabled === true;
  document.getElementById('streaming').checked = stackspot.streaming === true;
  originalStackSpotConfig.streaming = stackspot.streaming === true;
  document.getElementById('stackspotKnowledge').checked = stackspot.stackspotKnowledge === true;
  originalStackSpotConfig.stackspotKnowledge = stackspot.stackspotKnowledge === true;
  document.getElementById('returnKsInResponse').checked = stackspot.returnKsInResponse === true;
  originalStackSpotConfig.returnKsInResponse = stackspot.returnKsInResponse === true;
}

// Variáveis para armazenar dados originais
let originalOpenAIConfig = {};
let originalStackSpotConfig = {};

// Função para aplicar o estado dos campos baseado nos checkboxes habilitados
function applyFieldStates() {
  const openaiEnabled = document.getElementById('openaiEnabled').checked;
  const stackspotEnabled = document.getElementById('stackspotEnabled').checked;
  
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
    const config = {
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
      ia: {
        openai: {
          enabled: document.getElementById('openaiEnabled').checked,
          ...(document.getElementById('openaiEnabled').checked && {
            maxTokens: parseInt(document.getElementById('maxTokens').value) || 1000
          })
        },
        stackspot: {
          enabled: document.getElementById('stackspotEnabled').checked,
          ...(document.getElementById('stackspotEnabled').checked && {
            streaming: document.getElementById('streaming').checked,
            stackspotKnowledge: document.getElementById('stackspotKnowledge').checked,
            returnKsInResponse: document.getElementById('returnKsInResponse').checked
          })
        }
      }
    };
    const apiConfig = {
      ...(document.getElementById('openaiEnabled').checked && {
        OPENAI_API_KEY: document.getElementById('openaiApiKey').value
      }),
      ...(document.getElementById('stackspotEnabled').checked && {
        Client_ID_stackspot: document.getElementById('stackspotClientId').value,
        Client_Key_stackspot: document.getElementById('stackspotClientSecret').value,
        Realm_stackspot: document.getElementById('stackspotRealm').value,
        STACKSPOT_AGENT_ID: document.getElementById('stackspotAgentId').value
      })
    };
    const response = await authenticatedFetch(window.ApiConfig.buildUrl('/config'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const apiResponse = await authenticatedFetch(window.ApiConfig.buildUrl('/api-config'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiConfig)
    });
    if (response.ok && apiResponse.ok) {
      localStorage.setItem('bsqaConfig', JSON.stringify(config));
      // Sinalizar para outras abas/páginas que o tema foi alterado
      localStorage.setItem('bsqaThemeChanged', Date.now().toString());
      
      // Limpar dados originais se IA foi desabilitada
      if (!openaiEnabled) {
        originalOpenAIConfig = {};
      }
      if (!stackspotEnabled) {
        originalStackSpotConfig = {};
      }
      saveBtn.textContent = 'Salvo! ✅';
      setTimeout(() => {
        saveBtn.textContent = originalText;
      }, 3000);
      markClean();
      initialConfigSnapshot = getCurrentConfigSnapshot();
    } else {
      throw new Error('Erro ao salvar no servidor');
    }
  } catch (error) {
    localStorage.setItem('bsqaConfig', JSON.stringify(config));
    saveBtn.textContent = 'Salvo (local) ⚠️';
    setTimeout(() => {
      saveBtn.textContent = originalText;
      // Não reabilite os botões aqui!
    }, 3000);
    markClean();
    initialConfigSnapshot = getCurrentConfigSnapshot();
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
    const apiConfig = {
      ...(document.getElementById('openaiEnabled').checked && {
        OPENAI_API_KEY: document.getElementById('openaiApiKey').value
      }),
      ...(document.getElementById('stackspotEnabled').checked && {
        Client_ID_stackspot: document.getElementById('stackspotClientId').value,
        Client_Key_stackspot: document.getElementById('stackspotClientSecret').value,
        Realm_stackspot: document.getElementById('stackspotRealm').value,
        STACKSPOT_AGENT_ID: document.getElementById('stackspotAgentId').value
      })
    };
    const response = await authenticatedFetch(window.ApiConfig.buildUrl('/api-config'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiConfig)
    });
    if (response.ok) {
      const testResponse = await authenticatedFetch(window.ApiConfig.buildUrl('/test-api-config'), { method: 'POST' });
      if (testResponse.ok) {
        const testData = await testResponse.json();
        if (testData.success) {
          let resultHtml = `✅ ${testData.message}<br><br>`;
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
          let resultHtml = `❌ ${testData.message}<br><br>`;
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
      } else {
        const errorData = await testResponse.json();
        testResult.innerHTML = `<div data-testid="config-test-error-api">❌ Erro ao testar configurações: ${errorData.detail}</div>`;
        testResult.style.background = 'rgba(244, 67, 54, 0.2)';
        testResult.style.color = '#f44336';
        testResult.style.border = '1px solid #f44336';
      }
    } else {
      testResult.innerHTML = '<div data-testid="config-test-error-save">❌ Erro ao salvar configurações de API</div>';
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
    const response = await authenticatedFetch(window.ApiConfig.buildUrl('/analysis-types'));
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