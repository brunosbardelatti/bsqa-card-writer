// main.js - Funções utilitárias globais e carregamento de componentes

// Carregar componente HTML em um seletor
async function loadComponent(selector, url) {
  const el = document.querySelector(selector);
  if (el) {
    const resp = await fetch(url);
    el.innerHTML = await resp.text();
  }
}

// Carregar header, footer e modal se existirem na página
export async function loadCommonComponents() {
  await loadComponent('#header', 'components/header.html');
  await loadComponent('#footer', 'components/footer.html');
  await loadComponent('#modal', 'components/modal.html');
}

// Tema
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.style.setProperty('--bg-color', '#ffffff');
    root.style.setProperty('--text-color', '#333333');
    root.style.setProperty('--card-bg', '#f5f5f5');
    root.style.setProperty('--muted-text', '#666666');
    root.style.setProperty('--accent-color', '#2196f3');
    root.style.setProperty('--border-color', '#e0e0e0');
    root.style.setProperty('--result-bg', '#f8f9fa');
    root.style.setProperty('--result-text', '#333333');
    root.style.setProperty('--modal-bg', 'rgba(0, 0, 0, 0.5)');
    root.style.setProperty('--modal-content-bg', '#ffffff');
    root.style.setProperty('--modal-text', '#333333');
    root.style.setProperty('--code-bg', '#f1f3f4');
    root.style.setProperty('--code-text', '#333333');
  } else if (theme === 'dark') {
    root.style.setProperty('--bg-color', '#1a1a1a');
    root.style.setProperty('--text-color', '#ffffff');
    root.style.setProperty('--card-bg', '#2d2d2d');
    root.style.setProperty('--muted-text', '#cccccc');
    root.style.setProperty('--accent-color', '#4caf50');
    root.style.setProperty('--border-color', '#444444');
    root.style.setProperty('--result-bg', '#333333');
    root.style.setProperty('--result-text', '#ffffff');
    root.style.setProperty('--modal-bg', 'rgba(0, 0, 0, 0.8)');
    root.style.setProperty('--modal-content-bg', '#2d2d2d');
    root.style.setProperty('--modal-text', '#ffffff');
    root.style.setProperty('--code-bg', '#1a1a1a');
    root.style.setProperty('--code-text', '#ffffff');
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
    console.log('Erro ao carregar tema:', error);
  }
}

export function openConfig() {
  window.location.href = 'config.html';
}

export function openHelp() {
  // Implementação pode ser customizada em cada página
}

window.openConfig = openConfig; 