import { loadCommonComponents, convertMarkdownToHtml, loadThemeFromConfig, applySyntaxHighlighting } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Carregar componentes comuns
  await loadCommonComponents();
  
  // Carregar tema
  loadThemeFromConfig();
  
  // Carregar documentação
  await loadDocumentation();
});

async function loadDocumentation() {
  try {
    // ✅ CARREGA DO ARQUIVO .md - MANTÉM CENTRALIZAÇÃO
    const response = await fetch('docs/software-requirements.md');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const markdown = await response.text();
    
    // Converter markdown para HTML usando função existente
    const html = convertMarkdownToHtml(markdown);
    
    // Exibir na página
    document.getElementById('docsContent').innerHTML = html;
    
    // Aplicar estilos específicos para documentação
    applyDocumentationStyles();
    
    // Aplicar syntax highlighting
    applySyntaxHighlighting();
    
  } catch (error) {
    console.error('Erro ao carregar documentação:', error);
    document.getElementById('docsContent').innerHTML = `
      <div class="error-message">
        <h2>❌ Erro ao carregar documentação</h2>
        <p>Não foi possível carregar o arquivo de documentação.</p>
        <p><strong>Erro:</strong> ${error.message}</p>
        <button onclick="window.location.reload()" class="retry-btn">
          🔄 Tentar novamente
        </button>
      </div>
    `;
  }
}

function applyDocumentationStyles() {
  // Adicionar classes CSS para melhor formatação da documentação
  const content = document.getElementById('docsContent');
  
  // Melhorar espaçamento de listas
  const lists = content.querySelectorAll('ul, ol');
  lists.forEach(list => {
    list.style.marginBottom = '1rem';
  });
  
  // Melhorar formatação de código
  const codeBlocks = content.querySelectorAll('pre code');
  codeBlocks.forEach(code => {
    code.style.display = 'block';
    code.style.padding = '1rem';
    code.style.backgroundColor = 'var(--bg-secondary)';
    code.style.borderRadius = '6px';
    code.style.overflow = 'auto';
  });
  
  // Melhorar formatação de títulos
  const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    heading.style.marginTop = '2rem';
    heading.style.marginBottom = '1rem';
    heading.style.borderBottom = '2px solid var(--accent-color)';
    heading.style.paddingBottom = '0.5rem';
  });
}

// Navegação por teclado para acessibilidade
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    window.location.href = 'index.html';
  }
}); 