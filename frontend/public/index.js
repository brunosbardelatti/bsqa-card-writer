import { loadCommonComponents, loadThemeFromConfig, openConfig, applyTheme } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadCommonComponents();
  loadThemeFromConfig();
  loadDefaultAI();
  bindFormEvents();
  await loadAnalysisTypes(); // Carregar tipos de análise disponíveis
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
    submitBtn.disabled = true;
    output.innerHTML = '<div class="loading">Processando requisição...</div>';
    const file = fileInput.files[0];
    const requirements = document.getElementById('requirements').value;
    const service = document.getElementById('service').value;
    const analyse_type = document.getElementById('analyse_type').value;
    const formData = new FormData();

    if (file && requirements.trim()) {
      output.innerHTML = '<div class="error">Use apenas um método de entrada: arquivo ou texto.</div>';
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
        output.innerHTML = '<div class="error">Tipos de arquivo aceitos: <b>PDF (.pdf)</b>, <b>TXT (.txt)</b> e <b>JSON (.json)</b>. Outros formatos não são suportados.</div>';
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        output.innerHTML = '<div class="error">Arquivo maior que o tamanho de 100MB suportado. Tente com outro arquivo.</div>';
        return;
      }
      formData.append('file', file);
    } else if (requirements.trim()) {
      formData.append('requirements', requirements);
    }
    formData.append('service', service);
    formData.append('analyse_type', analyse_type);
    if (service === 'stackspot') {
      const config = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
      formData.append('streaming', config.streaming || false);
      formData.append('stackspot_knowledge', config.stackspotKnowledge || false);
      formData.append('return_ks_in_response', config.returnKsInResponse || false);
    }
    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        output.innerHTML = `<div class="error">${data.detail}</div>`;
      } else {
        let message = data.result && data.result.message ? data.result.message : data.result;
        output.innerHTML = `
          <div class="result-container">
            <button class="copy-btn" onclick="copyToClipboard(this)" data-text="${encodeURIComponent(message)}" title="Copiar resposta">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 4h6a2 2 0 012 2v6a2 2 0 01-2 2h-8a2 2 0 01-2-2v-6a2 2 0 012-2z"/>
              </svg>
            </button>
            <div class="result">${message.replace(/\n/g, '<br>')}</div>
          </div>
        `;
        fileInput.value = '';
        document.getElementById('requirements').value = '';
        updateDropFeedback();
      }
    } catch (err) {
      output.innerHTML = `<div class="error">${err}</div>`;
    } finally {
      submitBtn.disabled = false;
    }
  };
}

function loadDefaultAI() {
  try {
    const config = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
    const preferences = config.preferences || {};
    if (preferences.defaultAI) {
      document.getElementById('service').value = preferences.defaultAI;
    }
    if (preferences.defaultAnalyseType) {
      document.getElementById('analyse_type').value = preferences.defaultAnalyseType;
    }
  } catch (error) {
    console.log('Erro ao carregar IA padrão:', error);
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

// Ajuda
window.openHelp = function() {
  const modal = document.getElementById('helpModal');
  const content = document.getElementById('helpContent');
  const config = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
  if (config.theme) {
    applyTheme(config.theme);
  }
  fetch('docs/software-requirements.md')
    .then(response => response.text())
    .then(text => {
      const html = convertMarkdownToHtml(text);
      content.innerHTML = html;
    })
    .catch(err => {
      content.innerHTML = `
        <h2>❌ Erro ao carregar documentação</h2>
        <p>Não foi possível carregar o arquivo de documentação.</p>
        <p><strong>Erro:</strong> ${err.message}</p>
      `;
    });
  modal.style.display = 'block';
};
window.closeHelp = function() {
  document.getElementById('helpModal').style.display = 'none';
};

function convertMarkdownToHtml(markdown) {
  let html = markdown;
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, function(match, lang, code) {
    const language = lang || '';
    return `<pre><code class="language-${language}">${code.trim()}</code></pre>`;
  });
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^✅ (.*$)/gim, '<li style="color: #4caf50;">✅ $1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
    if (line.trim() === '' || line.match(/^<[h|p|li|pre|code|ul|ol|hr]/)) {
      return line;
    } else if (line.trim() !== '') {
      return `<p>${line}</p>`;
    }
    return line;
  });
  html = processedLines.join('\n');
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><h/g, '<h');
  html = html.replace(/<\/h[1-6]><\/p>/g, '</h$1>');
  return html;
}

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
  const modal = document.getElementById('helpModal');
  if (event.target === modal) {
    window.closeHelp();
  }
};

window.addEventListener('storage', (event) => {
  if (event.key === 'bsqaThemeChanged') {
    loadThemeFromConfig();
  }
}); 

// Carregar tipos de análise disponíveis do backend
async function loadAnalysisTypes() {
  try {
    const response = await fetch('/analysis-types');
    const data = await response.json();
    const analyseTypeSelect = document.getElementById('analyse_type');
    
    // Limpar opções existentes
    analyseTypeSelect.innerHTML = '';
    
    // Adicionar opções dinamicamente
    Object.entries(data.analysis_types).forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      analyseTypeSelect.appendChild(option);
    });
    
    // Aplicar configuração padrão se existir
    const config = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
    if (config.preferences && config.preferences.defaultAnalyseType) {
      analyseTypeSelect.value = config.preferences.defaultAnalyseType;
    }
  } catch (error) {
    console.error('Erro ao carregar tipos de análise:', error);
    // Fallback para opções padrão em caso de erro
    const analyseTypeSelect = document.getElementById('analyse_type');
    analyseTypeSelect.innerHTML = `
      <option value="card_QA_writer">Card QA Writer</option>
      <option value="test_case_flow_classifier">Test Case Flow Classifier</option>
      <option value="swagger_postman">Swagger Postman</option>
      <option value="swagger_python">Swagger Python</option>
    `;
  }
} 