// card.js - Lógica da página de integração Jira
import { loadCommonComponents, loadThemeFromConfig, generateBreadcrumbs } from './main.js';

// Flag para controlar se a página foi recarregada
window.pageReloaded = true;

document.addEventListener('DOMContentLoaded', async () => {
  await loadCommonComponents();
  loadThemeFromConfig();
  await loadEnabledAIs();
  bindFormEvents();
  updateSelectAllState(); // Inicializar estado do "Selecionar todos"
  generateBreadcrumbs([
    { name: 'Home', url: 'index.html' },
    { name: 'Card Jira', url: 'card.html', active: true }
  ]);
});

/**
 * Carrega IAs habilitadas (mesma lógica do chat.js)
 */
async function loadEnabledAIs() {
  const aiSelect = document.getElementById('ai_service');
  if (!aiSelect) return;

  try {
    // Carregar configurações do localStorage
    const config = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
    const ia = config.ia || {};
    
    // Carregar configurações de API do servidor
    let apiConfig = {};
    try {
      const response = await fetch(window.ApiConfig.buildUrl('/api-config'));
      if (response.ok) {
        apiConfig = await response.json();
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de API:', error);
    }
    
    // Determinar quais IAs estão habilitadas
    const enabledAIs = [];
    
    // Verificar OpenAI
    if (ia.openai && ia.openai.enabled && apiConfig.OPENAI_API_KEY) {
      enabledAIs.push({ value: 'openai', label: 'OpenAI' });
    }
    
    // Verificar StackSpot
    if (ia.stackspot && ia.stackspot.enabled && 
        apiConfig.Client_ID_stackspot && apiConfig.Client_Key_stackspot && 
        apiConfig.Realm_stackspot && apiConfig.STACKSPOT_AGENT_ID) {
      enabledAIs.push({ value: 'stackspot', label: 'StackSpot AI' });
    }
    
    // Atualizar select de IAs
    if (enabledAIs.length === 0) {
      aiSelect.innerHTML = '<option value="">❌ Nenhuma IA configurada</option>';
      aiSelect.disabled = true;
      return;
    }
    
    // Gerar options
    aiSelect.innerHTML = enabledAIs
      .map(ai => `<option value="${ai.value}">${ai.label}</option>`)
      .join('');
    
    // Selecionar primeira IA disponível
    if (enabledAIs.length > 0) {
      aiSelect.value = enabledAIs[0].value;
    }
    
    aiSelect.disabled = false;

  } catch (error) {
    console.error('Erro ao carregar IAs:', error);
    aiSelect.innerHTML = '<option value="">Erro ao carregar IAs</option>';
    aiSelect.disabled = true;
  }
}

/**
 * Vincula eventos do formulário
 */
function bindFormEvents() {
  const form = document.getElementById('cardForm');
  const cardFunctionSelect = document.getElementById('card_function');
  const aiSelectorGroup = document.getElementById('ai-selector-group');
  const submitBtn = document.getElementById('submitBtn');
  const clearBtn = document.getElementById('clearBtn');
  const cardNumberInput = document.getElementById('card_number');

  if (!form) return;

  // Ao mudar a funcionalidade selecionada
  cardFunctionSelect.addEventListener('change', (e) => {
    if (e.target.value === 'query_and_create') {
      // Mostrar seletor de IA
      aiSelectorGroup.style.display = 'block';
      submitBtn.innerHTML = '🚀 Consultar e Criar Subtask';
    } else {
      // Ocultar seletor de IA
      aiSelectorGroup.style.display = 'none';
      submitBtn.innerHTML = '🔍 Consultar Card';
    }
  });

  // Formatar input do card number para maiúsculas
  cardNumberInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  // Botão de limpar
  clearBtn.addEventListener('click', () => {
    clearForm();
  });

  // Checkbox "Selecionar todos os campos"
  const selectAllCheckbox = document.getElementById('select-all-fields');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
      // Não executar se o checkbox estiver desabilitado
      if (e.target.disabled) return;
      
      const optionalCheckboxes = document.querySelectorAll('input[name="fields"]:not([disabled])');
      optionalCheckboxes.forEach(cb => {
        cb.checked = e.target.checked;
      });
    });

    // Atualizar estado do "Selecionar todos" quando campos individuais mudam
    // Apenas se o checkbox "Selecionar todos" não estiver desabilitado
    const allCheckboxes = document.querySelectorAll('input[name="fields"]');
    allCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const selectAll = document.getElementById('select-all-fields');
        if (selectAll && !selectAll.disabled) {
          updateSelectAllState();
        }
      });
    });
  }

  // Submissão do formulário
  form.onsubmit = async (e) => {
    e.preventDefault();
    await handleFormSubmit();
  };
}

/**
 * Atualiza o estado do checkbox "Selecionar todos"
 */
function updateSelectAllState() {
  const selectAllCheckbox = document.getElementById('select-all-fields');
  if (!selectAllCheckbox || selectAllCheckbox.disabled) return;

  const optionalCheckboxes = document.querySelectorAll('input[name="fields"]:not([disabled])');
  const checkedOptional = Array.from(optionalCheckboxes).filter(cb => cb.checked);
  
  // Marcar "Selecionar todos" apenas se todos os campos opcionais estiverem marcados
  selectAllCheckbox.checked = optionalCheckboxes.length > 0 && checkedOptional.length === optionalCheckboxes.length;
  selectAllCheckbox.indeterminate = checkedOptional.length > 0 && checkedOptional.length < optionalCheckboxes.length;
}

/**
 * Valida o formato do número do card
 */
function validateCardNumber(value) {
  const pattern = /^[A-Z]+-\d+$/;
  return pattern.test(value.toUpperCase().trim());
}

/**
 * Coleta os campos selecionados
 */
function getSelectedFields() {
  const checkboxes = document.querySelectorAll('input[name="fields"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * Processa o submit do formulário
 */
async function handleFormSubmit() {
  const output = document.getElementById('output');
  const submitBtn = document.getElementById('submitBtn');
  const cardNumber = document.getElementById('card_number').value.toUpperCase().trim();
  const cardFunction = document.getElementById('card_function').value;
  const aiService = document.getElementById('ai_service').value;

  // Limpar output anterior
  output.innerHTML = '';

  // Validar formato do card
  if (!validateCardNumber(cardNumber)) {
    showError('Formato inválido. Use: PROJETO-NUMERO (ex: PKGS-1104)');
    return;
  }

  // Desabilitar form durante processamento
  disableForm(true);
  
  // Mostrar loading
  output.innerHTML = '<div class="loading" data-testid="card-loading-message">Processando requisição...</div>';

  try {
    // Determinar endpoint baseado na funcionalidade
    const endpoint = cardFunction === 'query_card' 
      ? '/jira/card' 
      : '/jira/card-with-ai';

    // Montar payload
    const payload = {
      card_number: cardNumber,
      fields: getSelectedFields()
    };

    // Adicionar campos específicos para query_and_create
    if (cardFunction === 'query_and_create') {
      payload.ai_service = aiService;
      payload.create_subtask = true;
    }

    // Fazer request
    const response = await fetch(window.ApiConfig.buildUrl(endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Erro ao processar requisição');
    }

    // Exibir resultado
    displayResult(data, cardFunction);
    
    // Ocultar botão submit e mostrar botão nova consulta
    showNewQueryButton();
    
    // NÃO reabilitar formulário aqui - campos devem permanecer bloqueados
    // até que o usuário clique em "Nova Consulta"
    // O formulário será reabilitado apenas em clearForm()

  } catch (error) {
    console.error('Erro:', error);
    showError(error.message || 'Erro ao processar requisição');
    
    // Mostrar botão nova consulta mesmo em caso de erro
    showNewQueryButton();
    
    // Reabilitar formulário apenas em caso de erro (para permitir nova tentativa)
    disableForm(false);
  }
}

/**
 * Mostra botão de nova consulta e oculta botão submit
 */
function showNewQueryButton() {
  const submitBtn = document.getElementById('submitBtn');
  const clearBtn = document.getElementById('clearBtn');
  
  submitBtn.style.display = 'none';
  clearBtn.style.display = 'block';
}

/**
 * Desabilita/habilita elementos do formulário
 */
function disableForm(disabled) {
  const submitBtn = document.getElementById('submitBtn');
  const cardNumberInput = document.getElementById('card_number');
  const cardFunctionSelect = document.getElementById('card_function');
  const aiServiceSelect = document.getElementById('ai_service');
  const selectAllCheckbox = document.getElementById('select-all-fields');
  
  // Pegar checkboxes ANTES de desabilitá-los (para não perder referência)
  const checkboxes = disabled 
    ? document.querySelectorAll('input[name="fields"]:not([disabled])')
    : document.querySelectorAll('input[name="fields"]');

  submitBtn.disabled = disabled;
  cardNumberInput.disabled = disabled;
  cardFunctionSelect.disabled = disabled;
  aiServiceSelect.disabled = disabled;
  
  // Desabilitar/habilitar checkbox "Selecionar todos"
  // Preservar estado (checked/indeterminate) ao desabilitar
  if (selectAllCheckbox) {
    if (disabled) {
      // Ao desabilitar: apenas desabilitar, preservar estado atual
      selectAllCheckbox.disabled = true;
    } else {
      // Ao reabilitar: reabilitar e atualizar estado
      selectAllCheckbox.disabled = false;
      updateSelectAllState();
    }
  }
  
  // Não desabilitar checkboxes obrigatórios (summary e description)
  checkboxes.forEach(cb => {
    if (cb.value !== 'summary' && cb.value !== 'description') {
      cb.disabled = disabled;
    }
  });
}

/**
 * Limpa o formulário e permite nova consulta
 */
function clearForm() {
  const output = document.getElementById('output');
  const cardNumberInput = document.getElementById('card_number');
  const cardFunctionSelect = document.getElementById('card_function');
  const aiSelectorGroup = document.getElementById('ai-selector-group');
  const submitBtn = document.getElementById('submitBtn');
  const clearBtn = document.getElementById('clearBtn');
  
  // Limpar output
  output.innerHTML = '';
  
  // Limpar e reabilitar input do card
  cardNumberInput.value = '';
  cardNumberInput.disabled = false;
  
  // Resetar funcionalidade para "Consultar Card"
  cardFunctionSelect.value = 'query_card';
  cardFunctionSelect.disabled = false;
  aiSelectorGroup.style.display = 'none';
  submitBtn.innerHTML = '🔍 Consultar Card';
  submitBtn.disabled = false;
  
  // Desmarcar e habilitar checkboxes opcionais
  const checkboxes = document.querySelectorAll('input[name="fields"]');
  const selectAllCheckbox = document.getElementById('select-all-fields');
  
  checkboxes.forEach(cb => {
    if (cb.value === 'summary' || cb.value === 'description') {
      cb.checked = true;
      // Manter disabled para campos obrigatórios
    } else {
      cb.checked = false;
      cb.disabled = false; // Habilitar checkboxes opcionais
    }
  });
  
  // Reabilitar checkbox "Selecionar todos"
  if (selectAllCheckbox) {
    selectAllCheckbox.disabled = false;
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  }
  
  // Atualizar estado do "Selecionar todos"
  updateSelectAllState();
  
  // Mostrar botão submit e ocultar botão de limpar
  submitBtn.style.display = 'block';
  clearBtn.style.display = 'none';
  
  // Limpar dados armazenados
  window.currentCardData = null;
  window.currentIAResult = null;
  
  // Focar no input do card
  cardNumberInput.focus();
}

/**
 * Exibe mensagem de erro
 */
function showError(message) {
  const output = document.getElementById('output');
  output.innerHTML = `
    <div class="error-message" data-testid="card-error-message">
      <h3>❌ Erro</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

/**
 * Exibe o resultado da requisição
 */
function displayResult(data, cardFunction) {
  const output = document.getElementById('output');
  
  if (cardFunction === 'query_card') {
    // Exibir resultado simples de consulta
    displayQueryResult(data);
  } else {
    // Exibir resultado com steps (query + IA + subtask)
    displayQueryWithAIResult(data);
  }
}

/**
 * Helper para converter TAG em array
 */
function formatTagsAsArray(tagValue) {
  if (Array.isArray(tagValue)) {
    return tagValue.map(item => item.value || item);
  }
  if (typeof tagValue === 'object' && tagValue && tagValue.value) {
    return [tagValue.value];
  }
  if (tagValue) {
    return [String(tagValue)];
  }
  return [];
}

/**
 * Retorna classe CSS para prioridade
 */
function getPriorityClass(priority) {
  if (!priority) return 'priority-default';
  
  const priorityLower = priority.toLowerCase();
  const map = {
    'highest': 'priority-highest',
    'high': 'priority-high',
    'alta': 'priority-high',
    'medium': 'priority-medium',
    'média': 'priority-medium',
    'low': 'priority-low',
    'baixa': 'priority-low',
    'lowest': 'priority-lowest'
  };
  
  return map[priorityLower] || 'priority-default';
}

/**
 * Retorna classe CSS para status
 */
function getStatusClass(status) {
  if (!status) return 'status-default';
  
  const statusLower = status.toLowerCase();
  const map = {
    'to do': 'status-todo',
    'a fazer': 'status-todo',
    'in progress': 'status-inprogress',
    'em progresso': 'status-inprogress',
    'done': 'status-done',
    'concluído': 'status-done',
    'resolved': 'status-done',
    'resolvido': 'status-done'
  };
  
  return map[statusLower] || 'status-default';
}

/**
 * Exibe resultado de consulta simples
 */
function displayQueryResult(data) {
  const output = document.getElementById('output');
  const cardData = data.data;
  
  let html = `
    <div class="result-container" data-testid="card-result-container">
      <button class="copy-btn" onclick="copyCardData()" title="Copiar dados do card" data-testid="card-button-copy">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 4h6a2 2 0 012 2v6a2 2 0 01-2 2h-8a2 2 0 01-2-2v-6a2 2 0 012-2z"/>
        </svg>
      </button>
      <div class="result-header">
        <h3>✅ Card Encontrado</h3>
      </div>
      
      <!-- Header Compacto -->
      <div class="card-header-compact">
        <span class="card-key-large">🎫 ${escapeHtml(cardData.key)}</span>
        <span class="card-project">📁 ${escapeHtml(cardData.project || cardData.project_key || 'N/A')}</span>
      </div>
      
      <!-- Título (Destaque) -->
      <div class="card-title-section">
        <div class="title-label">Título:</div>
        <h2 class="card-title">${escapeHtml(cardData.fields.summary || 'N/A')}</h2>
      </div>
      
      <!-- Badges de Metadados -->
      <div class="badges-container">
  `;
  
  // Renderizar badges de metadados com labels
  const badges = [];
  
  if (cardData.fields.priority) {
    const priorityClass = getPriorityClass(cardData.fields.priority.name);
    badges.push({
      label: 'Prioridade:',
      badge: `<span class="badge badge-priority ${priorityClass}">⚡ ${escapeHtml(cardData.fields.priority.name)}</span>`
    });
  }
  
  if (cardData.fields.status) {
    const statusClass = getStatusClass(cardData.fields.status.name);
    badges.push({
      label: 'Status:',
      badge: `<span class="badge badge-status ${statusClass}">🔄 ${escapeHtml(cardData.fields.status.name)}</span>`
    });
  }
  
  // TAGs como badges
  if (cardData.fields.customfield_10068) {
    const tags = formatTagsAsArray(cardData.fields.customfield_10068);
    if (tags.length > 0) {
      const tagBadges = tags.map(tag => 
        `<span class="badge badge-tag">🏷️ ${escapeHtml(tag)}</span>`
      ).join('');
      badges.push({
        label: 'TAG\'s:',
        badge: tagBadges
      });
    }
  }
  
  // Renderizar badges com labels
  badges.forEach(({ label, badge }) => {
    html += `
      <div class="badge-group">
        <span class="badge-label">${label}</span>
        <span class="badge-items">${badge}</span>
      </div>
    `;
  });
  
  html += `</div>`;
  
  // Responsáveis (se existirem)
  const hasResponsaveis = cardData.fields.assignee || cardData.fields.customfield_10380;
  if (hasResponsaveis) {
    html += `
      <div class="field-group field-group-responsaveis">
        <h4 class="group-title">👥 Responsáveis</h4>
        <div class="responsaveis-grid">
    `;
    
    if (cardData.fields.assignee) {
      html += `
        <div class="responsavel-card">
          <div class="responsavel-label">👤 Dev Responsável</div>
          <div class="responsavel-name">${escapeHtml(cardData.fields.assignee.displayName || cardData.fields.assignee.name || 'N/A')}</div>
          ${cardData.fields.assignee.emailAddress ? `<div class="responsavel-email">${escapeHtml(cardData.fields.assignee.emailAddress)}</div>` : ''}
        </div>
      `;
    }
    
    if (cardData.fields.customfield_10380) {
      html += `
        <div class="responsavel-card responsavel-qa">
          <div class="responsavel-label">👨‍💻 QA Responsável</div>
          <div class="responsavel-name">${escapeHtml(cardData.fields.customfield_10380.displayName || cardData.fields.customfield_10380.name || 'N/A')}</div>
          ${cardData.fields.customfield_10380.emailAddress ? `<div class="responsavel-email">${escapeHtml(cardData.fields.customfield_10380.emailAddress)}</div>` : ''}
        </div>
      `;
    }
    
    html += `
        </div>
      </div>
    `;
  }
  
  // Descrição (por último) - sempre exibir se o campo foi solicitado
  // description é campo obrigatório, então sempre deve estar presente
  if (cardData.fields.hasOwnProperty('description')) {
    html += `
      <div class="field-group field-group-description">
        <h4 class="group-title">📄 Descrição</h4>
        <div class="description-content">
          ${formatFieldValue('description', cardData.fields.description)}
        </div>
      </div>
    `;
  }
  
  // Histórico (exibir apenas se presente e solicitado)
  if (cardData.fields.changelog && Array.isArray(cardData.fields.changelog) && cardData.fields.changelog.length > 0) {
    html += `
      <div class="field-group field-group-history">
        <h4 class="group-title">📜 Histórico</h4>
        <div class="history-content">
          ${formatFieldValue('changelog', cardData.fields.changelog)}
        </div>
      </div>
    `;
  }
  
  html += `</div>`;
  
  output.innerHTML = html;
  
  // Armazenar dados para copiar
  window.currentCardData = formatCardDataForCopy(cardData);
}

/**
 * Exibe resultado com steps (query + IA + subtask)
 */
function displayQueryWithAIResult(data) {
  const output = document.getElementById('output');
  const steps = data.steps;
  
  let html = '<div class="result-container" data-testid="card-result-container-with-ai">';
  
  // Step 1: Consulta Jira
  html += renderStep(
    '1. Consulta ao Jira',
    steps.jira_query,
    () => {
      if (!steps.jira_query.success) return '';
      const cardData = steps.jira_query.data;
      return `
        <div class="card-info">
          <div class="info-item">
            <strong>🎫 Card:</strong> <span class="card-key">${escapeHtml(cardData.key)}</span>
          </div>
          <div class="info-item">
            <strong>📝 Título do Card:</strong> ${escapeHtml(cardData.fields.summary || 'N/A')}
          </div>
        </div>
      `;
    }
  );
  
  // Step 2: Análise IA
  html += renderStep(
    '2. Análise com IA',
    steps.ia_analysis,
    () => {
      if (!steps.ia_analysis.success) return '';
      const parsed = steps.ia_analysis.parsed;
      // Armazenar resultado para copiar
      window.currentIAResult = steps.ia_analysis.result;
      
      return `
        <div class="ia-result">
          <button class="copy-btn" onclick="copyIAResult()" title="Copiar resultado da IA" style="position: sticky !important; top: 0.5rem !important; right: 0.5rem !important; left: auto !important; float: right !important; margin: 0.5rem !important; z-index: 10 !important;" data-testid="card-button-copy-ia">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 4h6a2 2 0 012 2v6a2 2 0 01-2 2h-8a2 2 0 01-2-2v-6a2 2 0 012-2z"/>
            </svg>
          </button>
          <div class="info-item">
            <strong>📌 Título da Subtask:</strong>
            <div class="field-value">${escapeHtml(parsed.title)}</div>
          </div>
          <div class="info-item">
            <strong>📝 Descrição Gerada:</strong>
            <div class="field-value ia-description">${escapeHtml(parsed.description).replace(/\n/g, '<br>')}</div>
          </div>
        </div>
      `;
    }
  );
  
  // Step 3: Criação de Subtask
  html += renderStep(
    '3. Criação de Subtask',
    steps.subtask_created,
    () => {
      if (steps.subtask_created.skipped) {
        return '<p>⏭️ Criação de subtask não solicitada</p>';
      }
      if (!steps.subtask_created.success) return '';
      
      const subtaskData = steps.subtask_created.data;
      // Armazenar URL para função de copiar
      window.currentSubtaskUrl = subtaskData.url;
      
      return `
        <div class="subtask-created">
          <div class="info-item">
            <strong>🎫 Subtask Criada:</strong> <a href="${escapeHtml(subtaskData.url)}" target="_blank" class="card-key">${escapeHtml(subtaskData.key)} 🔗</a>
            <button onclick="copySubtaskLink()" class="copy-link-btn" title="Copiar link da subtask" data-testid="card-button-copy-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 4h6a2 2 0 012 2v6a2 2 0 01-2 2h-8a2 2 0 01-2-2v-6a2 2 0 012-2z"/>
              </svg>
            </button>
          </div>
          <div class="success-message">
            ✅ Subtask criada com sucesso no Jira!
          </div>
        </div>
      `;
    }
  );
  
  html += '</div>';
  
  output.innerHTML = html;
}

/**
 * Renderiza um step do processo
 */
function renderStep(title, stepData, contentRenderer) {
  const statusIcon = stepData.success ? '✅' : '❌';
  const statusClass = stepData.success ? 'step-success' : 'step-error';
  
  let html = `
    <div class="step-container ${statusClass}">
      <h4>${statusIcon} ${title}</h4>
  `;
  
  if (stepData.success) {
    html += contentRenderer();
  } else {
    html += `
      <div class="error-details">
        <strong>Erro:</strong> ${escapeHtml(stepData.error || 'Erro desconhecido')}
        ${stepData.detail ? `<br><small>${escapeHtml(stepData.detail)}</small>` : ''}
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}

/**
 * Retorna o nome de exibição do campo
 */
function getFieldDisplayName(fieldName) {
  const names = {
    summary: '📝 Título do Card',
    description: '📄 Descrição',
    status: '🔄 Status',
    priority: '⚡ Prioridade',
    assignee: '👤 Responsável',
    reporter: '📢 Relator',
    created: '📅 Data de Criação',
    updated: '🔄 Última Atualização',
    components: '🧩 Componentes',
    issuetype: '📋 Tipo de Issue',
    customfield_10068: '🏷️ TAG',
    customfield_10380: '👨‍💻 QA Responsável',
    changelog: '📜 Histórico'
  };
  return names[fieldName] || fieldName;
}

/**
 * Formata o valor do campo para exibição
 */
function formatFieldValue(fieldName, value) {
  if (value === null || value === undefined || value === '') {
    return '<em>Não informado</em>';
  }
  
  // Tratamento específico para TAG (customfield_10068)
  if (fieldName === 'customfield_10068') {
    // TAG - pode ser array ou string
    if (Array.isArray(value)) {
      if (value.length === 0) return '<em>Nenhuma TAG</em>';
      // Se for array de objetos com propriedade 'value'
      if (value[0]?.value) {
        return value.map(item => `<span class="tag">${escapeHtml(item.value)}</span>`).join(' ');
      }
      // Se for array de strings
      return value.map(item => `<span class="tag">${escapeHtml(item)}</span>`).join(' ');
    }
    // Se for objeto com propriedade 'value'
    if (typeof value === 'object' && value.value) {
      return `<span class="tag">${escapeHtml(value.value)}</span>`;
    }
    return escapeHtml(String(value));
  }
  
  // Tratamento específico para QA Responsável (customfield_10380)
  if (fieldName === 'customfield_10380') {
    // QA Responsável - deve ser um user object
    if (typeof value === 'object') {
      if (value.displayName) {
        return `${escapeHtml(value.displayName)}${value.emailAddress ? ` (${escapeHtml(value.emailAddress)})` : ''}`;
      }
      if (value.name) {
        return escapeHtml(value.name);
      }
    }
    return escapeHtml(String(value));
  }
  
  // Tratamento específico para Histórico (changelog)
  if (fieldName === 'changelog') {
    if (!Array.isArray(value) || value.length === 0) {
      return '<em>Nenhum histórico disponível</em>';
    }
    
    // Formatar cada entrada do histórico
    return formatChangelog(value);
  }
  
  // Arrays (components, etc)
  if (Array.isArray(value)) {
    if (value.length === 0) return '<em>Nenhum</em>';
    return value.map(v => `<span class="tag">${escapeHtml(v)}</span>`).join(' ');
  }
  
  // Descrição (preservar quebras de linha)
  if (fieldName === 'description') {
    return escapeHtml(value).replace(/\n/g, '<br>');
  }
  
  return escapeHtml(String(value));
}

/**
 * Formata o histórico (changelog) para exibição
 * @param {Array} changelog - Array de históricos ordenados (mais novo primeiro)
 * @returns {string} HTML formatado
 */
function formatChangelog(changelog) {
  if (!Array.isArray(changelog) || changelog.length === 0) {
    return '<em>Nenhum histórico disponível</em>';
  }
  
  let html = '<div class="changelog-container">';
  
  changelog.forEach((history, index) => {
    const author = history.author?.displayName || 'Desconhecido';
    const email = history.author?.emailAddress || '';
    const created = formatDate(history.created);
    const items = history.items || [];
    
    html += `
      <div class="changelog-entry" data-testid="changelog-entry-${index}">
        <div class="changelog-header">
          <span class="changelog-author">👤 ${escapeHtml(author)}${email ? ` (${escapeHtml(email)})` : ''}</span>
          <span class="changelog-date">📅 ${escapeHtml(created)}</span>
        </div>
        <div class="changelog-items">
    `;
    
    items.forEach((item, itemIndex) => {
      const fieldName = formatFieldName(item.field);
      const fromValue = item.from || '<em>vazio</em>';
      const toValue = item.to || '<em>vazio</em>';
      
      html += `
        <div class="changelog-item" data-testid="changelog-item-${index}-${itemIndex}">
          <span class="changelog-field">${escapeHtml(fieldName)}:</span>
          <span class="changelog-change">
            ${fromValue} → ${toValue}
          </span>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

/**
 * Formata nome do campo para exibição amigável
 * @param {string} fieldId - ID do campo (ex: "status", "assignee")
 * @returns {string} Nome amigável
 */
function formatFieldName(fieldId) {
  const fieldNames = {
    'status': 'Status',
    'priority': 'Prioridade',
    'assignee': 'Responsável',
    'summary': 'Título',
    'description': 'Descrição',
    'labels': 'Labels',
    'components': 'Componentes',
    'issuetype': 'Tipo de Issue',
    'resolution': 'Resolução',
    'customfield_10068': 'TAG',
    'customfield_10380': 'QA Responsável'
  };
  return fieldNames[fieldId] || fieldId;
}

/**
 * Formata data ISO 8601 para formato legível
 * @param {string} isoDate - Data no formato ISO 8601
 * @returns {string} Data formatada (ex: "15/01/2024 10:30")
 */
function formatDate(isoDate) {
  if (!isoDate) return 'Data não disponível';
  
  try {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return isoDate; // Retornar original se falhar
  }
}

/**
 * Formata dados do card para cópia seguindo ordem lógica
 * Ordem: Card → Projeto → Título → Metadados → Responsáveis → Descrição
 */
function formatCardDataForCopy(cardData) {
  let text = `Card: ${cardData.key}\n`;
  text += `Projeto: ${cardData.project || cardData.project_key || 'N/A'}\n\n`;
  
  // Título
  if (cardData.fields.summary) {
    text += `Título: ${cardData.fields.summary}\n\n`;
  }
  
  // Metadados (Prioridade, Status, TAG)
  const metadata = [];
  
  if (cardData.fields.priority) {
    const priorityName = typeof cardData.fields.priority === 'object' 
      ? cardData.fields.priority.name 
      : cardData.fields.priority;
    if (priorityName) {
      metadata.push(`Prioridade: ${priorityName}`);
    }
  }
  
  if (cardData.fields.status) {
    const statusName = typeof cardData.fields.status === 'object' 
      ? cardData.fields.status.name 
      : cardData.fields.status;
    if (statusName) {
      metadata.push(`Status: ${statusName}`);
    }
  }
  
  if (cardData.fields.customfield_10068) {
    const tags = formatTagsAsArray(cardData.fields.customfield_10068);
    if (tags.length > 0) {
      metadata.push(`TAG: ${tags.join(', ')}`);
    }
  }
  
  if (metadata.length > 0) {
    text += metadata.join('\n') + '\n\n';
  }
  
  // Responsáveis (Responsável, QA Responsável)
  const responsaveis = [];
  
  if (cardData.fields.assignee) {
    const assignee = cardData.fields.assignee;
    const assigneeText = assignee.displayName || assignee.name || 'N/A';
    const assigneeEmail = assignee.emailAddress ? ` (${assignee.emailAddress})` : '';
    responsaveis.push(`Dev Responsável: ${assigneeText}${assigneeEmail}`);
  }
  
  if (cardData.fields.customfield_10380) {
    const qa = cardData.fields.customfield_10380;
    const qaText = qa.displayName || qa.name || 'N/A';
    const qaEmail = qa.emailAddress ? ` (${qa.emailAddress})` : '';
    responsaveis.push(`QA Responsável: ${qaText}${qaEmail}`);
  }
  
  if (responsaveis.length > 0) {
    text += responsaveis.join('\n') + '\n\n';
  }
  
  // Descrição (por último)
  if (cardData.fields.description) {
    // Remover HTML tags se houver e preservar quebras de linha
    const description = typeof cardData.fields.description === 'string' 
      ? cardData.fields.description.replace(/<[^>]*>/g, '').trim()
      : String(cardData.fields.description || '').trim();
    
    if (description) {
      text += `Descrição:\n${description}\n\n`;
    }
  }
  
  // Histórico (após descrição, se presente)
  if (cardData.fields.changelog && Array.isArray(cardData.fields.changelog) && cardData.fields.changelog.length > 0) {
    text += `Histórico:\n`;
    cardData.fields.changelog.forEach((history, index) => {
      const author = history.author?.displayName || 'Desconhecido';
      const email = history.author?.emailAddress || '';
      const created = formatDate(history.created);
      const items = history.items || [];
      
      text += `\n[${index + 1}] ${author}${email ? ` (${email})` : ''} - ${created}\n`;
      
      items.forEach(item => {
        const fieldName = formatFieldName(item.field);
        const fromValue = item.from || 'vazio';
        const toValue = item.to || 'vazio';
        text += `  • ${fieldName}: ${fromValue} → ${toValue}\n`;
      });
    });
    text += '\n';
  }

  return text;
}

/**
 * Copia dados do card para clipboard
 */
window.copyCardData = function() {
  if (!window.currentCardData) return;
  
  navigator.clipboard.writeText(window.currentCardData).then(() => {
    showCopyFeedback('Dados copiados!');
  }).catch(err => {
    console.error('Erro ao copiar:', err);
    showCopyFeedback('Erro ao copiar', true);
  });
};

/**
 * Copia resultado da IA para clipboard
 */
window.copyIAResult = function() {
  if (!window.currentIAResult) return;
  
  navigator.clipboard.writeText(window.currentIAResult).then(() => {
    showCopyFeedback('Resultado da IA copiado!');
  }).catch(err => {
    console.error('Erro ao copiar:', err);
    showCopyFeedback('Erro ao copiar', true);
  });
};

/**
 * Copia link da subtask para clipboard
 */
window.copySubtaskLink = function() {
  if (!window.currentSubtaskUrl) return;
  
  navigator.clipboard.writeText(window.currentSubtaskUrl).then(() => {
    showCopyFeedback('Link da subtask copiado!');
  }).catch(err => {
    console.error('Erro ao copiar:', err);
    showCopyFeedback('Erro ao copiar', true);
  });
};

/**
 * Mostra feedback de cópia
 */
function showCopyFeedback(message, isError = false) {
  const feedback = document.createElement('div');
  feedback.className = `copy-feedback ${isError ? 'error' : 'success'}`;
  feedback.textContent = message;
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${isError ? '#ff4444' : '#4CAF50'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => feedback.remove(), 300);
  }, 2000);
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
