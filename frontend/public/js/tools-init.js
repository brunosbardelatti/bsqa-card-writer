import { loadCommonComponents, loadThemeFromConfig } from './main.js';
import { initJiraAuth } from './jira-auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadCommonComponents();
  loadThemeFromConfig();
  initJiraAuth(); // Botão de usuário no header (sem redirect; Tools não exige Jira)
});

