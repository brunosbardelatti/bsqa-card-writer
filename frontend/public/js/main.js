// main.js - Funções utilitárias globais e carregamento de componentes

/**
 * Verifica se está em ambiente de desenvolvimento
 * @returns {boolean} True se estiver em desenvolvimento
 */
function isDevelopment() {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Log seguro - apenas em desenvolvimento
 * Não expõe informações sensíveis em produção
 * @param {...any} args - Argumentos para log
 */
function safeLog(...args) {
  if (isDevelopment()) {
    console.log(...args);
  }
}

/**
 * Error log seguro - apenas em desenvolvimento
 * @param {...any} args - Argumentos para log de erro
 */
function safeErrorLog(...args) {
  if (isDevelopment()) {
    console.error(...args);
  }
}

// Exportar funções de log seguras
window.safeLog = safeLog;
window.safeErrorLog = safeErrorLog;
window.isDevelopment = isDevelopment;

// Carregar componente HTML em um seletor
async function loadComponent(selector, url) {
  const el = document.querySelector(selector);
  if (el) {
    const resp = await fetch(url);
    el.innerHTML = await resp.text();
  }
}

// Carregar header e footer se existirem na página
export async function loadCommonComponents() {
  await loadComponent('#header', 'components/header.html');
  await loadComponent('#footer', 'components/footer.html');
  
  // Destacar página ativa no menu
  highlightActivePage();
  
  // Adicionar breadcrumbs se existir container
  addBreadcrumbs();
}

// Destacar a página ativa no menu de navegação
function highlightActivePage() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navButtons = document.querySelectorAll('.nav-btn');
  
  navButtons.forEach(btn => {
    const href = btn.getAttribute('onclick');
    if (href) {
      const pageName = href.match(/href='([^']+)'/)?.[1];
      if (pageName === currentPage) {
        btn.classList.add('active');
      }
    }
  });
}

// Função para gerar breadcrumbs dinamicamente
export function generateBreadcrumbs(items) {
  const breadcrumbs = items.map((item, index) => {
    if (index === items.length - 1) {
      return `<span data-testid="breadcrumb-current">${item.text}</span>`;
    } else {
      return `<a href="${item.url}" data-testid="breadcrumb-link">${item.text}</a>`;
    }
  }).join(' > ');
  
  return `<div class="breadcrumbs" data-testid="breadcrumbs-container">${breadcrumbs}</div>`;
}

// Função para adicionar breadcrumbs baseado na página atual
export function addBreadcrumbs() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const breadcrumbsContainer = document.querySelector('.breadcrumbs');
  
  if (!breadcrumbsContainer) return;
  
  let breadcrumbItems = [];
  
  // Adicionar página atual baseado no nome do arquivo
  switch (currentPage) {
    case 'tools.html':
      breadcrumbItems = [
        { text: '🏠 Home', url: 'index.html' },
        { text: '🧰 Tools', url: 'tools.html' }
      ];
      break;
    case 'config.html':
      breadcrumbItems = [
        { text: 'Home', url: 'index.html' },
        { text: 'Configurações', url: '' }
      ];
      break;
    case 'chat.html':
      breadcrumbItems = [
        { text: 'Home', url: 'index.html' },
        { text: 'Chat', url: '' }
      ];
      break;
    case 'index.html':
      // Se estiver na home, mostrar apenas "Home"
      breadcrumbItems = [{ text: 'Home', url: '' }];
      break;
    default:
      breadcrumbItems = [
        { text: 'Home', url: 'index.html' },
        { text: 'Página', url: '' }
      ];
  }
  
  // Substituir o conteúdo do breadcrumb
  breadcrumbsContainer.innerHTML = breadcrumbItems.map((item, index) => {
    if (index === breadcrumbItems.length - 1) {
      return `<span data-testid="breadcrumb-current">${item.text}</span>`;
    } else {
      return `<a href="${item.url}" data-testid="breadcrumb-link">${item.text}</a>`;
    }
  }).join(' > ');
}

// Tema
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.style.setProperty('--bg-color', '#ffffff');
    root.style.setProperty('--text-color', '#1a1a1a');
    root.style.setProperty('--card-bg', '#f8f9fa');
    root.style.setProperty('--muted-text', '#4a4a4a');
    root.style.setProperty('--accent-color', '#1976d2');
    root.style.setProperty('--accent-color-rgb', '25, 118, 210');
    root.style.setProperty('--border-color', '#d1d5db');
    root.style.setProperty('--result-bg', '#ffffff');
    root.style.setProperty('--result-text', '#1a1a1a');
    root.style.setProperty('--modal-bg', 'rgba(0, 0, 0, 0.6)');
    root.style.setProperty('--modal-content-bg', '#ffffff');
    root.style.setProperty('--modal-text', '#1a1a1a');
    root.style.setProperty('--code-bg', '#f3f4f6');
    root.style.setProperty('--code-text', '#1a1a1a');
    // Syntax highlighting para tema claro
    root.style.setProperty('--syntax-string', '#d73a49');
    root.style.setProperty('--syntax-number', '#005cc5');
    root.style.setProperty('--syntax-keyword', '#d73a49');
    root.style.setProperty('--syntax-function', '#6f42c1');
    root.style.setProperty('--syntax-comment', '#6a737d');
    root.style.setProperty('--syntax-punctuation', '#24292e');
    root.style.setProperty('--syntax-tag', '#22863a');
    root.style.setProperty('--syntax-attribute', '#6f42c1');
    root.style.setProperty('--syntax-property', '#005cc5');
    root.style.setProperty('--syntax-value', '#032f62');
    root.style.setProperty('--syntax-selector', '#d73a49');
    // Card headers para tema claro
    root.style.setProperty('--card-header-bg', '#e3f2fd');
    root.style.setProperty('--card-header-secondary-bg', '#f5f5f5');
  } else if (theme === 'dark') {
    root.style.setProperty('--bg-color', '#0f0f0f');
    root.style.setProperty('--text-color', '#ffffff');
    root.style.setProperty('--card-bg', '#1e1e1e');
    root.style.setProperty('--muted-text', '#b0b0b0');
    root.style.setProperty('--accent-color', '#4caf50');
    root.style.setProperty('--accent-color-rgb', '76, 175, 80');
    root.style.setProperty('--border-color', '#404040');
    root.style.setProperty('--result-bg', '#2a2a2a');
    root.style.setProperty('--result-text', '#ffffff');
    root.style.setProperty('--modal-bg', 'rgba(0, 0, 0, 0.8)');
    root.style.setProperty('--modal-content-bg', '#1e1e1e');
    root.style.setProperty('--modal-text', '#ffffff');
    root.style.setProperty('--code-bg', '#1a1a1a');
    root.style.setProperty('--code-text', '#ffffff');
    // Syntax highlighting para tema escuro
    root.style.setProperty('--syntax-string', '#a8ff60');
    root.style.setProperty('--syntax-number', '#ff9d00');
    root.style.setProperty('--syntax-keyword', '#ff9d00');
    root.style.setProperty('--syntax-function', '#ff628c');
    root.style.setProperty('--syntax-comment', '#7c7c7c');
    root.style.setProperty('--syntax-punctuation', '#ffffff');
    root.style.setProperty('--syntax-tag', '#ff9d00');
    root.style.setProperty('--syntax-attribute', '#ff628c');
    root.style.setProperty('--syntax-property', '#ff628c');
    root.style.setProperty('--syntax-value', '#a8ff60');
    root.style.setProperty('--syntax-selector', '#ff9d00');
    // Card headers para tema escuro
    root.style.setProperty('--card-header-bg', '#252525');
    root.style.setProperty('--card-header-secondary-bg', '#2a2a2a');
  } else if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
    return;
  }
}

export function loadThemeFromConfig() {
  try {
    const config = JSON.parse(localStorage.getItem('bsqaConfig') || '{}');
    const preferences = config.preferences || {};
    if (preferences.theme) {
      applyTheme(preferences.theme);
    }
  } catch (error) {
    safeErrorLog('Erro ao carregar tema:', error);
  }
}

export function openConfig() {
  window.location.href = 'config.html';
}

export function openHelp() {
  // Implementação pode ser customizada em cada página
}

window.openConfig = openConfig;

// Tipos de análise centralizados
export const ANALYSIS_TYPES = {
  'card_QA_writer': 'Card QA Writer',
  'test_case_flow_classifier': 'Test Case Flow Generator',
  'swagger_postman': 'Swagger Postman Generator',
  'swagger_python': 'Swagger Python Generator',
  'robot_api_generator': 'Curl Robot API Generator',
  'swagger_robot_generator': 'Swagger Robot Generator',
  'code_review_diff': 'Code Review Analyzer'
};

// Placeholders centralizados
export const ANALYSIS_PLACEHOLDERS = {
  'card_QA_writer': 'Digite os dados do card de PM/PO para análise. Inclua informações como:\n• Título do card\n• Descrição dos requisitos\n• Critérios de aceitação\n• User stories\n• Dependências\n• Estimativas',
  'test_case_flow_classifier': 'Digite seus requisitos aqui ou selecione um arquivo',
  'swagger_postman': 'Faça upload do arquivo JSON do Swagger/OpenAPI para gerar coleção do Postman. O arquivo deve conter a especificação da API.',
  'swagger_python': 'Faça upload do arquivo JSON do Swagger/OpenAPI para gerar código Python. O arquivo deve conter a especificação da API.',
  'robot_api_generator': 'Digite o comando cURL (e opcionalmente a resposta) para gerar uma estrutura completa de automação de teste de API com Robot Framework, seguindo um padrão modular e reutilizável.',
  'swagger_robot_generator': 'Faça upload do arquivo JSON do Swagger/OpenAPI para gerar uma estrutura completa de automação de testes em Robot Framework. O retorno incluirá keywords reutilizáveis, requests e casos de teste prontos.',
  'code_review_diff': 'Insira abaixo o diff do Git gerado entre a sua branch e a main. O conteúdo será analisado com foco técnico, e você receberá feedback em português sobre possíveis erros, violações de boas práticas, oportunidades de melhoria e riscos de segurança.'
};

// Função para gerar HTML das opções de análise
export function generateAnalysisOptionsHTML(selectedValue = '', prefix = '') {
  const testIdPrefix = prefix || 'option-analysis';
  return Object.entries(ANALYSIS_TYPES)
    .map(([value, label]) => `<option value="${value}"${selectedValue === value ? ' selected' : ''} data-testid="${testIdPrefix}-${value}">${label}</option>`)
    .join('');
}

// Função para obter placeholder de um tipo específico
export function getAnalysisPlaceholder(type) {
  return ANALYSIS_PLACEHOLDERS[type] || 'Digite seus requisitos aqui ou selecione um arquivo';
}

// Função para converter markdown para HTML
export function convertMarkdownToHtml(markdown) {
  let html = markdown;
  
  // Separadores horizontais
  html = html.replace(/^---$/gm, '<hr>');
  
  // Títulos (processar do maior para o menor para evitar conflitos)
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Blocos de código com syntax highlighting e botão de cópia
  // Regex melhorada para capturar blocos de código
  html = html.replace(/```(\w+)?\r?\n([\s\S]*?)```/gim, function(match, lang, code) {
    const language = lang || '';
    const languageLabel = getLanguageLabel(language);
    const escapedCode = escapeHtml(code.trim());
    
    return `<div class="code-block" data-testid="code-block-${language}"><div class="code-header"><span class="code-language">${languageLabel}</span><button class="copy-btn" onclick="copyCode(this)" title="Copiar código" data-testid="code-copy-button-${language}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style="color: inherit;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" stroke-width="2"/></svg></button></div><pre><code class="language-${language}" data-language="${language}">${escapedCode}</code></pre></div>`;
  });
  
  // Código inline
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  // Listas com checkmarks
  html = html.replace(/^✅ (.*$)/gim, '<li class="checkmark-item">✅ $1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');
  
  // Formatação de texto
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Processar linhas para parágrafos
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
    if (line.trim() === '' || line.match(/^<[h|p|li|pre|code|ul|ol|hr|div|button|svg]/)) {
      return line;
    } else if (line.trim() !== '') {
      return `<p>${line}</p>`;
    }
    return line;
  });
  html = processedLines.join('\n');
  
  // Limpeza final
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><h/g, '<h');
  html = html.replace(/<\/h[1-6]><\/p>/g, '</h$1>');
  
  return html;
}

// Função para obter label da linguagem
function getLanguageLabel(language) {
  const labels = {
    'json': 'JSON',
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'python': 'Python',
    'py': 'Python',
    'bash': 'Bash',
    'shell': 'Shell',
    'sh': 'Shell',
    'html': 'HTML',
    'css': 'CSS',
    'xml': 'XML',
    'yaml': 'YAML',
    'yml': 'YAML',
    'markdown': 'Markdown',
    'md': 'Markdown',
    'sql': 'SQL',
    'java': 'Java',
    'csharp': 'C#',
    'cs': 'C#',
    'cpp': 'C++',
    'c': 'C',
    'php': 'PHP',
    'ruby': 'Ruby',
    'go': 'Go',
    'rust': 'Rust',
    'typescript': 'TypeScript',
    'ts': 'TypeScript'
  };
  return labels[language.toLowerCase()] || language || 'Texto';
}

// Função para escapar HTML
function escapeHtml(text) {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Função global para copiar código
window.copyCode = function(button) {
  const codeBlock = button.closest('.code-block');
  const codeElement = codeBlock.querySelector('code');
  const text = codeElement.textContent;
  
  navigator.clipboard.writeText(text).then(() => {
    // Feedback visual
    button.classList.add('copied');
    
    setTimeout(() => {
      button.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    safeErrorLog('Erro ao copiar:', err);
    // Fallback para navegadores antigos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  });
};

// Função para aplicar syntax highlighting básico
export function applySyntaxHighlighting() {
  const codeBlocks = document.querySelectorAll('.code-block code');
  
  codeBlocks.forEach(codeElement => {
    const language = codeElement.dataset.language;
    const text = codeElement.textContent;
    
    if (language === 'json') {
      codeElement.innerHTML = highlightJSON(text);
    } else if (language === 'javascript' || language === 'js') {
      codeElement.innerHTML = highlightJavaScript(text);
    } else if (language === 'python' || language === 'py') {
      codeElement.innerHTML = highlightPython(text);
    } else if (language === 'bash' || language === 'shell' || language === 'sh') {
      codeElement.innerHTML = highlightBash(text);
    } else if (language === 'html') {
      codeElement.innerHTML = highlightHTML(text);
    } else if (language === 'css') {
      codeElement.innerHTML = highlightCSS(text);
    }
  });
}

// Funções de syntax highlighting para diferentes linguagens
function highlightJSON(text) {
  return text
    .replace(/"([^"]+)":/g, '<span class="string">"$1"</span>:')
    .replace(/"([^"]+)"/g, '<span class="string">"$1"</span>')
    .replace(/\b(true|false|null)\b/g, '<span class="boolean">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>')
    .replace(/([{}[\],:])/g, '<span class="punctuation">$1</span>');
}

function highlightJavaScript(text) {
  return text
    .replace(/\b(function|var|let|const|if|else|for|while|return|class|import|export|default)\b/g, '<span class="keyword">$1</span>')
    .replace(/"([^"]+)"/g, '<span class="string">"$1"</span>')
    .replace(/'([^']+)'/g, '<span class="string">\'$1\'</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>')
    .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, '<span class="function">$1</span>(')
    .replace(/\/\/(.*)$/gm, '<span class="comment">//$1</span>');
}

function highlightPython(text) {
  return text
    .replace(/\b(def|class|if|else|elif|for|while|return|import|from|as|try|except|finally|with|in|is|None|True|False)\b/g, '<span class="keyword">$1</span>')
    .replace(/"([^"]+)"/g, '<span class="string">"$1"</span>')
    .replace(/'([^']+)'/g, '<span class="string">\'$1\'</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>')
    .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="function">$1</span>(')
    .replace(/#(.*)$/gm, '<span class="comment">#$1</span>');
}

function highlightBash(text) {
  return text
    .replace(/\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|export|source)\b/g, '<span class="keyword">$1</span>')
    .replace(/"([^"]+)"/g, '<span class="string">"$1"</span>')
    .replace(/'([^']+)'/g, '<span class="string">\'$1\'</span>')
    .replace(/#(.*)$/gm, '<span class="comment">#$1</span>');
}

function highlightHTML(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)/g, '$1<span class="tag">$2</span>')
    .replace(/([a-zA-Z-]+)=/g, '<span class="attribute">$1</span>=')
    .replace(/"([^"]+)"/g, '<span class="string">"$1"</span>');
}

function highlightCSS(text) {
  return text
    .replace(/([a-zA-Z-]+):/g, '<span class="property">$1</span>:')
    .replace(/"([^"]+)"/g, '<span class="string">"$1"</span>')
    .replace(/'([^']+)'/g, '<span class="string">\'$1\'</span>')
    .replace(/([a-zA-Z-]+)\s*{/g, '<span class="selector">$1</span>{')
    .replace(/([a-zA-Z-]+)\s*:/g, '<span class="property">$1</span>:');
} 