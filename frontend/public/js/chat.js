import { loadCommonComponents, loadThemeFromConfig, applyTheme, generateAnalysisOptionsHTML, getAnalysisPlaceholder, buildIaCredentialsForRequest } from './main.js';
import { initJiraAuth } from './jira-auth.js';

// Flag para controlar se a página foi recarregada
window.pageReloaded = true;

document.addEventListener('DOMContentLoaded', async () => {
  await loadCommonComponents();
  loadThemeFromConfig();
  initJiraAuth({ redirectIfUnauthenticated: true }); // Redireciona para config se credenciais Jira não configuradas
  await loadDefaultAI(true); // Aplicar configurações padrão no carregamento inicial
  bindFormEvents();
  await loadAnalysisTypes(); // Carregar tipos de análise disponíveis
  
  // Verificar se há parâmetro de tipo na URL
  checkUrlTypeParameter();
});

function bindFormEvents() {
  const form = document.getElementById('reqForm');
  const output = document.getElementById('output');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const dropFeedback = document.getElementById('dropFeedback');
  const dropRemoveBtn = document.getElementById('dropRemoveBtn');

  if (!form) return;

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      updateDropFeedback();
    }
  });

  fileInput.addEventListener('change', updateDropFeedback);
  dropRemoveBtn.addEventListener('click', removeFile);

  function removeFile() {
    fileInput.value = '';
    updateDropFeedback();
  }

  function updateDropFeedback() {
    if (fileInput.files && fileInput.files.length > 0) {
      dropFeedback.style.display = 'block';
      dropRemoveBtn.style.display = 'flex';
      dropFeedback.textContent = `${fileInput.files.length} arquivo${fileInput.files.length > 1 ? 's' : ''} selecionado${fileInput.files.length > 1 ? 's' : ''}`;
    } else {
      dropFeedback.style.display = 'none';
      dropRemoveBtn.style.display = 'none';
      dropFeedback.textContent = '';
    }
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    output.innerHTML = '';
    const submitBtn = document.querySelector('button[type="submit"]');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    // Desabilitar elementos de upload
    submitBtn.disabled = true;
    dropZone.style.pointerEvents = 'none';
    dropZone.style.opacity = '0.6';
    fileInput.disabled = true;
    
    // Desabilitar textarea
    const requirementsTextarea = document.getElementById('requirements');
    requirementsTextarea.disabled = true;
    
    // Desabilitar botão de remover arquivo
    const dropRemoveBtn = document.getElementById('dropRemoveBtn');
    if (dropRemoveBtn) {
      dropRemoveBtn.disabled = true;
      dropRemoveBtn.style.pointerEvents = 'none';
      dropRemoveBtn.style.opacity = '0.6';
    }
    
    // Desabilitar selects
    const serviceSelect = document.getElementById('service');
    const analyseTypeSelect = document.getElementById('analyse_type');
    serviceSelect.disabled = true;
    analyseTypeSelect.disabled = true;
    
    output.innerHTML = '<div class="loading" data-testid="chat-loading-message">Processando requisição...</div>';
    const file = fileInput.files[0];
    const requirements = document.getElementById('requirements').value;
    const service = document.getElementById('service').value;
    const analyse_type = document.getElementById('analyse_type').value;
    const formData = new FormData();

    if (file && requirements.trim()) {
      output.innerHTML = '<div class="error" data-testid="chat-error-message">Use apenas um método de entrada: arquivo ou texto.</div>';
      // Reabilitar elementos em caso de erro
      submitBtn.disabled = false;
      dropZone.style.pointerEvents = 'auto';
      dropZone.style.opacity = '1';
      fileInput.disabled = false;
      requirementsTextarea.disabled = false;
      serviceSelect.disabled = false;
      analyseTypeSelect.disabled = false;
      if (dropRemoveBtn) {
        dropRemoveBtn.disabled = false;
        dropRemoveBtn.style.pointerEvents = 'auto';
        dropRemoveBtn.style.opacity = '1';
      }
      return;
    }
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'text/utf-8',
        'text/txt',
        'application/txt',
        'application/json',
      ];
      const fileType = file.type;
      const fileName = file.name.toLowerCase();
      const isAllowed = allowedTypes.includes(fileType) || fileName.endsWith('.pdf') || fileName.endsWith('.txt') || fileName.endsWith('.json');
      if (!isAllowed) {
        output.innerHTML = '<div class="error" data-testid="chat-error-message">Tipos de arquivo aceitos: <b>PDF (.pdf)</b>, <b>TXT (.txt)</b> e <b>JSON (.json)</b>. Outros formatos não são suportados.</div>';
        // Reabilitar elementos em caso de erro
        submitBtn.disabled = false;
        dropZone.style.pointerEvents = 'auto';
        dropZone.style.opacity = '1';
        fileInput.disabled = false;
        requirementsTextarea.disabled = false;
        serviceSelect.disabled = false;
        analyseTypeSelect.disabled = false;
        if (dropRemoveBtn) {
          dropRemoveBtn.disabled = false;
          dropRemoveBtn.style.pointerEvents = 'auto';
          dropRemoveBtn.style.opacity = '1';
        }
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        output.innerHTML = '<div class="error" data-testid="chat-error-message">Arquivo maior que o tamanho de 100MB suportado. Tente com outro arquivo.</div>';
        // Reabilitar elementos em caso de erro
        submitBtn.disabled = false;
        dropZone.style.pointerEvents = 'auto';
        dropZone.style.opacity = '1';
        fileInput.disabled = false;
        requirementsTextarea.disabled = false;
        serviceSelect.disabled = false;
        analyseTypeSelect.disabled = false;
        if (dropRemoveBtn) {
          dropRemoveBtn.disabled = false;
          dropRemoveBtn.style.pointerEvents = 'auto';
          dropRemoveBtn.style.opacity = '1';
        }
        return;
      }
      formData.append('file', file);
    } else if (requirements.trim()) {
      formData.append('requirements', requirements);
    }
    formData.append('service', service);
    formData.append('analyse_type', analyse_type);
    const config = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
    const ia = config.ia || {};
    if (service === 'stackspot') {
      formData.append('streaming', (ia.stackspot && ia.stackspot.streaming) || false);
      formData.append('stackspot_knowledge', (ia.stackspot && ia.stackspot.stackspotKnowledge) || false);
      formData.append('return_ks_in_response', (ia.stackspot && ia.stackspot.returnKsInResponse) || false);
    }
    const iaCredentials = buildIaCredentialsForRequest(config);
    if (iaCredentials) {
      formData.append('ia_credentials', JSON.stringify(iaCredentials));
    }
    try {
      const res = await fetch(window.ApiConfig.buildUrl('/analyze'), {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        output.innerHTML = `<div class="error" data-testid="chat-error-message">${data.detail}</div>`;
      } else {
        let message = data.result && data.result.message ? data.result.message : data.result;
        
        // Limpar espaços em branco no início da resposta
        message = message.replace(/^\s+/, ''); // Remove espaços no início
        
        output.innerHTML = `
          <div class="result-container" data-testid="chat-result-container">
            <button class="copy-btn" onclick="copyToClipboard(this)" data-text="${encodeURIComponent(message)}" title="Copiar resposta" style="position: sticky !important; top: 0.5rem !important; right: 0.5rem !important; left: auto !important; float: right !important; margin: 0.5rem !important; z-index: 10 !important;" data-testid="chat-copy-result-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 4h6a2 2 0 012 2v6a2 2 0 01-2 2h-8a2 2 0 01-2-2v-6a2 2 0 012-2z"/>
              </svg>
            </button>
            <div class="result" data-testid="chat-result-text">${message.replace(/\n/g, '<br>')}</div>
          </div>
        `;
        fileInput.value = '';
        document.getElementById('requirements').value = '';
        updateDropFeedback();
      }
    } catch (err) {
      output.innerHTML = `<div class="error" data-testid="chat-error-message">${err}</div>`;
    } finally {
      submitBtn.disabled = false;
      // Reabilitar elementos de upload
      dropZone.style.pointerEvents = 'auto';
      dropZone.style.opacity = '1';
      fileInput.disabled = false;
      
      // Reabilitar textarea
      requirementsTextarea.disabled = false;
      
      // Reabilitar selects
      serviceSelect.disabled = false;
      analyseTypeSelect.disabled = false;
      
      // Reabilitar botão de remover arquivo
      if (dropRemoveBtn) {
        dropRemoveBtn.disabled = false;
        dropRemoveBtn.style.pointerEvents = 'auto';
        dropRemoveBtn.style.opacity = '1';
      }
    }
  };
}

async function loadDefaultAI(applyDefaults = true) {
  try {
    const config = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
    const preferences = config.preferences || {};
    const ia = config.ia || {};
    
    // Determinar quais IAs estão habilitadas (apenas localStorage bsqaConfig)
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
    const serviceSelect = document.getElementById('service');
    serviceSelect.innerHTML = '';
    
    if (enabledAIs.length === 0) {
      // Nenhuma IA configurada
      serviceSelect.innerHTML = '<option value="">❌ Nenhuma IA configurada</option>';
      serviceSelect.disabled = true;
      
      // Desabilitar botão de envio
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⚠️ Configure uma IA primeiro';
      }
      
      // Mostrar mensagem de aviso
      const warningDiv = document.createElement('div');
      warningDiv.style.cssText = 'background: rgba(244, 67, 54, 0.1); color: #f44336; padding: 1rem; border-radius: 6px; margin-top: 1rem; border: 1px solid #f44336;';
      warningDiv.setAttribute('data-testid', 'chat-warning-no-ai-configured');
      warningDiv.innerHTML = `
        <strong>⚠️ Nenhuma IA configurada</strong><br>
        Para usar o BSQA Card Writer, você precisa configurar pelo menos uma IA nas configurações.
        <br><br>
        <a href="config.html" style="color: #f44336; text-decoration: underline;" data-testid="chat-link-go-to-config">→ Ir para Configurações</a>
      `;
      
      // Inserir aviso após o formulário
      const form = document.getElementById('reqForm');
      if (form && !document.getElementById('noAIConfiguredWarning')) {
        warningDiv.id = 'noAIConfiguredWarning';
        form.parentNode.insertBefore(warningDiv, form.nextSibling);
      }
      
      return;
    }
    
    // Adicionar opções das IAs habilitadas
    enabledAIs.forEach(ai => {
      const option = document.createElement('option');
      option.value = ai.value;
      option.textContent = ai.label;
      option.setAttribute('data-testid', `chat-option-ia-${ai.value}`);
      serviceSelect.appendChild(option);
    });
    
    // Definir IA padrão apenas se for um recarregamento real da página E applyDefaults for true
    if (window.pageReloaded && applyDefaults) {
      if (preferences.defaultAI) {
        const defaultAIExists = enabledAIs.some(ai => ai.value === preferences.defaultAI);
        if (defaultAIExists) {
          serviceSelect.value = preferences.defaultAI;
        } else if (enabledAIs.length > 0) {
          // Se a IA padrão não estiver habilitada, usar a primeira disponível
          serviceSelect.value = enabledAIs[0].value;
        }
      } else if (enabledAIs.length > 0) {
        // Se não houver IA padrão, usar a primeira disponível
        serviceSelect.value = enabledAIs[0].value;
      }
    }
    
    // Definir tipo de análise padrão apenas se for um recarregamento real da página E applyDefaults for true
    if (window.pageReloaded && applyDefaults && preferences.defaultAnalyseType) {
      document.getElementById('analyse_type').value = preferences.defaultAnalyseType;
    }
    
    // Resetar a flag apenas se applyDefaults for true
    if (window.pageReloaded && applyDefaults) {
      window.pageReloaded = false;
    }
    
    // Remover aviso se existir
    const warningDiv = document.getElementById('noAIConfiguredWarning');
    if (warningDiv) {
      warningDiv.remove();
    }
    
    // Reabilitar botão de envio
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 Enviar';
    }
    
  } catch (error) {
    if (window.safeErrorLog) {
      window.safeErrorLog('Erro ao carregar IA padrão:', error);
    }
  }
}

// Copiar para área de transferência
window.copyToClipboard = function(button) {
  const text = decodeURIComponent(button.getAttribute('data-text'));
  navigator.clipboard.writeText(text).then(() => {
    const originalHTML = button.innerHTML;
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
    button.classList.add('copied');
    button.title = 'Copiado!';
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('copied');
      button.title = 'Copiar resposta';
    }, 2000);
  }).catch(err => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      const originalHTML = button.innerHTML;
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
      button.classList.add('copied');
      button.title = 'Copiado!';
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.classList.remove('copied');
        button.title = 'Copiar resposta';
      }, 2000);
    } catch (fallbackErr) {
      alert('Erro ao copiar texto. Tente novamente.');
    }
  });
};

// Função convertMarkdownToHtml movida para main.js para reutilização

window.addEventListener('storage', (event) => {
  if (event.key === 'bsqaThemeChanged') {
    loadThemeFromConfig();
  }
});

// Atualizar IAs quando voltar da página de configuração
window.addEventListener('focus', async () => {
  // Verificar se as configurações mudaram
  const currentConfig = localStorage.getItem('bsqaConfig');
  if (currentConfig !== window.lastConfigCheck) {
    window.lastConfigCheck = currentConfig;
    await loadDefaultAI(false); // Não reaplicar configurações padrão
  }
});

// Flag já é inicializada como true no início do arquivo
// Não precisamos do evento load pois a flag já está correta

// Carregar tipos de análise disponíveis do backend
async function loadAnalysisTypes() {
  try {
    const response = await fetch(window.ApiConfig.buildUrl('/analysis-types'));
    const data = await response.json();
    const analyseTypeSelect = document.getElementById('analyse_type');
    
    // Limpar opções existentes
    analyseTypeSelect.innerHTML = '';
    
    // Adicionar opções dinamicamente
    Object.entries(data.analysis_types).forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      option.setAttribute('data-testid', `chat-option-analysis-type-${value}`);
      analyseTypeSelect.appendChild(option);
    });
    
    // Armazenar placeholders globalmente para uso posterior
    window.analysisPlaceholders = data.placeholders || {};
    
    // Aplicar configuração padrão apenas se for um recarregamento real da página
    const config = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
    if (window.pageReloaded && config.preferences && config.preferences.defaultAnalyseType) {
      analyseTypeSelect.value = config.preferences.defaultAnalyseType;
      // Não resetar a flag aqui, pois ela será resetada em loadDefaultAI()
    }
    
    // Atualizar placeholder inicial
    updatePlaceholder();
    
    // Adicionar listener para mudanças no tipo de análise
    analyseTypeSelect.addEventListener('change', updatePlaceholder);
  } catch (error) {
    if (window.safeErrorLog) {
      window.safeErrorLog('Erro ao carregar tipos de análise:', error);
    }
    // Fallback para opções padrão em caso de erro
    const analyseTypeSelect = document.getElementById('analyse_type');
    analyseTypeSelect.innerHTML = generateAnalysisOptionsHTML('', 'chat-option-analysis-type');
    
    // Placeholders de fallback
    window.analysisPlaceholders = ANALYSIS_PLACEHOLDERS;
    
    // Atualizar placeholder inicial e adicionar listener
    updatePlaceholder();
    analyseTypeSelect.addEventListener('change', updatePlaceholder);
  }
}

// Função para atualizar o placeholder do textarea baseado no tipo de análise selecionado
function updatePlaceholder() {
  const analyseTypeSelect = document.getElementById('analyse_type');
  const requirementsTextarea = document.getElementById('requirements');
  
  if (!analyseTypeSelect || !requirementsTextarea) return;
  
  const selectedType = analyseTypeSelect.value;
  
  // Usar placeholders do backend (ou fallback se não disponível)
  const placeholders = window.analysisPlaceholders || {};
  
  // Aplicar placeholder específico ou usar o padrão
  requirementsTextarea.placeholder = placeholders[selectedType] || 'Digite seus requisitos aqui ou selecione um arquivo';
}

// Função para verificar parâmetro de tipo na URL
function checkUrlTypeParameter() {
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');
  
  if (type) {
    const analyseTypeSelect = document.getElementById('analyse_type');
    if (analyseTypeSelect) {
      // Aguardar um pouco para garantir que os tipos foram carregados
      setTimeout(() => {
        analyseTypeSelect.value = type;
        updatePlaceholder();
        
        // Adicionar efeito visual para mostrar que foi pré-selecionado
        analyseTypeSelect.style.borderColor = 'var(--accent-color)';
        analyseTypeSelect.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.2)';
        
        // Remover o efeito após alguns segundos
        setTimeout(() => {
          analyseTypeSelect.style.borderColor = '';
          analyseTypeSelect.style.boxShadow = '';
        }, 3000);
      }, 500);
    }
  }
} 