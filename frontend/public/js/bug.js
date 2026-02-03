// bug.js - Lógica da página de criação de Bug/Sub-Bug
import { loadCommonComponents, loadThemeFromConfig, generateBreadcrumbs, buildIaCredentialsForRequest } from './main.js';
import { JiraAuth, showLoginModal, initJiraAuth } from './jira-auth.js';

// Flag para controlar se a página foi recarregada
window.pageReloaded = true;

document.addEventListener('DOMContentLoaded', async () => {
  await loadCommonComponents();
  loadThemeFromConfig();
  initJiraAuth({ redirectIfUnauthenticated: true });
  await loadEnabledAIs();
  bindFormEvents();
  generateBreadcrumbs([
    { name: 'Home', url: 'index.html' },
    { name: 'Bug', url: 'bug.html', active: true }
  ]);
});

/**
 * Carrega IAs habilitadas (mesma lógica do card.js)
 */
async function loadEnabledAIs() {
  const aiSelect = document.getElementById('ai_service');
  if (!aiSelect) return;

  try {
    const config = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
    const ia = config.ia || {};
    const enabledAIs = [];
    if (ia.openai && ia.openai.enabled && (ia.openai.apiKey || '').trim()) {
      enabledAIs.push({ value: 'openai', label: 'OpenAI' });
    }
    if (ia.stackspot && ia.stackspot.enabled &&
        (ia.stackspot.clientId || '').trim() && (ia.stackspot.clientSecret || '').trim() &&
        (ia.stackspot.realm || '').trim() && (ia.stackspot.agentId || '').trim()) {
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
  const form = document.getElementById('bugForm');
  const issueTypeSelect = document.getElementById('issue_type');
  const parentKeyGroup = document.getElementById('parent-key-group');
  const parentKeyInput = document.getElementById('parent_key');
  const projectKeyInput = document.getElementById('project_key');

  if (!form) return;

  // Formatar input do project_key para maiúsculas e permitir apenas letras
  projectKeyInput.addEventListener('input', (e) => {
    // Remover números, símbolos e caracteres especiais, mantendo apenas letras
    let value = e.target.value.replace(/[^A-Za-z]/g, '');
    // Converter para maiúsculas
    e.target.value = value.toUpperCase();
  });

  // Formatar input do parent_key para maiúsculas (mesmo comportamento do card_number)
  parentKeyInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  // Toggle Issue Pai baseado no tipo
  issueTypeSelect.addEventListener('change', () => toggleParentKeyField(parentKeyGroup, parentKeyInput));
  
  // Inicializar estado
  toggleParentKeyField(parentKeyGroup, parentKeyInput);

  // Upload de anexos
  bindAttachmentEvents();

  // Submit do formulário
  form.addEventListener('submit', handleFormSubmit);
}

/**
 * Mostra/oculta campo Issue Pai baseado no tipo selecionado
 */
function toggleParentKeyField(parentKeyGroup, parentKeyInput) {
  const issueType = document.getElementById('issue_type').value;
  
  if (issueType === 'sub_bug') {
    parentKeyGroup.style.display = 'block';
    parentKeyInput.required = true;
  } else {
    parentKeyGroup.style.display = 'none';
    parentKeyInput.required = false;
    parentKeyInput.value = '';
  }
}

/**
 * Vincula eventos de upload de anexos
 */
function bindAttachmentEvents() {
  const dropZone = document.getElementById('attachmentsDropZone');
  const fileInput = document.getElementById('attachmentsInput');
  const feedback = document.getElementById('attachmentsFeedback');
  const removeBtn = document.getElementById('attachmentsRemoveBtn');
  
  if (!dropZone || !fileInput) return;
  
  // Click para abrir seletor de arquivos
  dropZone.addEventListener('click', () => fileInput.click());
  
  // Drag & Drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      // Adicionar arquivos ao input (suporta múltiplos)
      const dt = new DataTransfer();
      // Manter arquivos existentes
      for (let file of fileInput.files) {
        dt.items.add(file);
      }
      // Adicionar novos arquivos
      for (let file of e.dataTransfer.files) {
        dt.items.add(file);
      }
      fileInput.files = dt.files;
      updateAttachmentsFeedback();
    }
  });
  
  fileInput.addEventListener('change', updateAttachmentsFeedback);
  
  removeBtn.addEventListener('click', () => {
    fileInput.value = '';
    updateAttachmentsFeedback();
  });
  
  function updateAttachmentsFeedback() {
    const files = fileInput.files;
    if (files && files.length > 0) {
      feedback.style.display = 'block';
      removeBtn.style.display = 'flex';
      const fileList = Array.from(files).map(f => `${f.name} (${formatFileSize(f.size)})`).join(', ');
      feedback.textContent = `${files.length} arquivo(s): ${fileList}`;
    } else {
      feedback.style.display = 'none';
      removeBtn.style.display = 'none';
    }
  }
}

/**
 * Formata tamanho de arquivo
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Handler de submit do formulário
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  if (!JiraAuth.isAuthenticated()) {
    showLoginModal();
    return;
  }

  const formData = new FormData();
  const issueType = document.getElementById('issue_type').value;
  const projectKey = document.getElementById('project_key').value.toUpperCase();
  const description = document.getElementById('description').value;
  const aiService = document.getElementById('ai_service').value;
  const parentKey = document.getElementById('parent_key').value;
  const attachments = document.getElementById('attachmentsInput').files;
  
  // Validações
  if (issueType === 'sub_bug' && !parentKey) {
    showError('Issue Pai é obrigatório para Sub-Bug');
    return;
  }
  
  if (!projectKey || !/^[A-Z]+$/.test(projectKey)) {
    showError('Projeto deve conter apenas letras maiúsculas');
    return;
  }
  
  // Preparar FormData
  formData.append('issue_type', issueType);
  formData.append('project_key', projectKey);
  formData.append('description', description);
  formData.append('ai_service', aiService);
  const config = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
  const iaCreds = buildIaCredentialsForRequest(config);
  if (iaCreds) {
    formData.append('ia_credentials', JSON.stringify(iaCreds));
  }
  
  if (parentKey) {
    formData.append('parent_key', parentKey.toUpperCase());
  }
  
  // Anexos (opcionais)
  if (attachments && attachments.length > 0) {
    for (let file of attachments) {
      // Validar tamanho (100MB por arquivo)
      if (file.size > 100 * 1024 * 1024) {
        showError(`Arquivo ${file.name} excede 100MB`);
        return;
      }
      formData.append('files', file);
    }
  }
  
  // Desabilitar form
  disableForm(true);
  
  // Mostrar loading
  const output = document.getElementById('output');
  output.innerHTML = '<div class="loading" data-testid="bug-loading-message">Processando...</div>';
  
  try {
    const response = await fetch(window.ApiConfig.buildUrl('/bug/create'), {
      method: 'POST',
      headers: JiraAuth.getAuthOnlyHeaders(),
      body: formData
    });

    const data = await response.json();

    if (response.status === 401) {
      showLoginModal();
      showError('Sessão expirada. Faça login novamente.');
      return;
    }
    if (data.success) {
      displaySuccessResult(data);
    } else {
      showError('Erro ao criar Bug/Sub-Bug: ' + (data.error || 'Erro desconhecido'));
    }
  } catch (error) {
    showError('Erro ao processar requisição: ' + error.message);
  } finally {
    disableForm(false);
  }
}

/**
 * Desabilita/habilita formulário
 */
function disableForm(disabled) {
  const form = document.getElementById('bugForm');
  const elements = form.querySelectorAll('input, select, textarea, button');
  elements.forEach(el => {
    el.disabled = disabled;
  });
}

/**
 * Mostra mensagem de erro
 */
function showError(message) {
  const output = document.getElementById('output');
  output.innerHTML = `<div class="error" data-testid="bug-error-message">${escapeHtml(message)}</div>`;
  disableForm(false);
}

/**
 * Exibe resultado de sucesso
 */
function displaySuccessResult(data) {
  const output = document.getElementById('output');
  const steps = data.steps;
  
  let html = '<div class="result-container">';
  
  // Step 1: Validação Parent (apenas se Sub-Bug)
  if (steps.parent_validation) {
    html += renderStep(
      '1. Validação Issue Pai',
      steps.parent_validation,
      () => {
        if (!steps.parent_validation.success) return '';
        const parent = steps.parent_validation.data;
        return `<p>✅ Issue pai validada: <strong>${escapeHtml(parent.key)}</strong> - ${escapeHtml(parent.summary)}</p>`;
      }
    );
  }
  
  // Step 2: IA
  const stepNumber = steps.parent_validation ? '2' : '1';
  html += renderStep(
    `${stepNumber}. Organização com IA`,
    steps.ia_organization,
    () => {
      if (!steps.ia_organization.success) return '';
      return `<pre>${escapeHtml(steps.ia_organization.result)}</pre>`;
    }
  );
  
  // Step 3: Issue Criada
  const stepNumber2 = steps.parent_validation ? '3' : '2';
  html += renderStep(
    `${stepNumber2}. Issue Criada no Jira`,
    steps.issue_created,
    () => {
      if (!steps.issue_created.success) return '';
      const issue = steps.issue_created.data;
      return `
        <div class="issue-info">
          <p><strong>🎫 Issue:</strong> <a href="${issue.url}" target="_blank">${escapeHtml(issue.key)}</a></p>
          <button class="copy-btn" onclick="copyIssueLink('${escapeHtml(issue.url)}')" title="Copiar link da issue" data-testid="bug-button-copy-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 4h6a2 2 0 012 2v6a2 2 0 01-2 2h-8a2 2 0 01-2-2v-6a2 2 0 012-2z"/>
            </svg>
          </button>
        </div>
      `;
    }
  );
  
  // Step 4: Anexos
  const stepNumber3 = steps.parent_validation ? '4' : '3';
  html += renderStep(
    `${stepNumber3}. Anexos Enviados`,
    steps.attachments_uploaded,
    () => {
      if (!steps.attachments_uploaded.success || steps.attachments_uploaded.skipped) {
        return steps.attachments_uploaded.message || 'Nenhum anexo enviado';
      }
      return `<p>✅ ${steps.attachments_uploaded.count} anexo(s) enviado(s) com sucesso</p>`;
    }
  );
  
  html += '</div>';
  output.innerHTML = html;
}

/**
 * Renderiza um step do processo
 */
function renderStep(title, stepData, contentFn) {
  const success = stepData.success;
  const icon = success ? '✅' : '❌';
  const statusClass = success ? 'success' : 'error';
  
  let html = `
    <div class="step-container step-${statusClass}" data-testid="bug-step-${title.toLowerCase().replace(/\s+/g, '-')}">
      <h4>${icon} ${escapeHtml(title)}</h4>
  `;
  
  if (success) {
    html += contentFn();
  } else {
    html += `
      <div class="error-message">
        <p><strong>Erro:</strong> ${escapeHtml(stepData.error || 'Erro desconhecido')}</p>
        ${stepData.detail ? `<p>${escapeHtml(stepData.detail)}</p>` : ''}
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}

/**
 * Copia link da issue para clipboard
 */
function copyIssueLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    alert('Link copiado para a área de transferência!');
  }).catch(err => {
    console.error('Erro ao copiar:', err);
    alert('Erro ao copiar link. Tente novamente.');
  });
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Exportar função para uso global
window.copyIssueLink = copyIssueLink;
