import { loadCommonComponents, loadThemeFromConfig } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadCommonComponents();
  loadThemeFromConfig();
});

