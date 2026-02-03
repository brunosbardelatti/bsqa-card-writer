// dashboard.js - Lógica do Dashboard de Métricas QA
import { loadCommonComponents, loadThemeFromConfig, generateBreadcrumbs } from './main.js';
import {
  JiraAuth,
  showLoginModal,
  refreshAccountButton,
  initJiraAuth
} from './jira-auth.js';

// Estado global do dashboard
let currentDashboardData = null;
let currentStatusTimeData = null;
let currentFilters = {
  projectKey: null,
  period: null
};

// Estado de ordenação da tabela Status Time
let statusTimeSort = {
  column: 'totalHours',
  direction: 'desc'
};

// Instâncias dos gráficos (para destruir ao recarregar)
let chartInstances = {
  leakagePie: null,
  validRatePie: null,
  leakageLine: null,
  validRateLine: null
};

// Callback de logout do dashboard: resetar projeto e validar botão
function dashboardOnLogout() {
  const projectDropdown = document.getElementById('projectDropdown');
  if (projectDropdown) {
    projectDropdown.innerHTML = '<div class="select-option disabled">Faça login para ver projetos</div>';
  }
  const projectSearch = document.getElementById('projectSearch');
  if (projectSearch) {
    projectSearch.value = '';
    projectSearch.disabled = true;
    projectSearch.placeholder = 'Faça login para buscar projetos';
  }
  const projectKeyEl = document.getElementById('projectKey');
  if (projectKeyEl) projectKeyEl.value = '';
  validateGenerateButton();
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadCommonComponents();
  loadThemeFromConfig();

  initJiraAuth({
    onLoginSuccess: () => loadProjects(),
    onLogout: dashboardOnLogout,
    showSuccess,
    redirectIfUnauthenticated: true
  });

  if (JiraAuth.isAuthenticated()) {
    await loadProjects();
  }

  bindFilterEvents();
  generateBreadcrumbs([
    { name: 'Home', url: 'index.html' },
    { name: 'Dashboard QA', url: 'dashboard.html', active: true }
  ]);
});

// ============================================
// CARREGAMENTO DE PROJETOS
// ============================================

let allProjects = [];

async function loadProjects() {
  const projectSearch = document.getElementById('projectSearch');
  const projectDropdown = document.getElementById('projectDropdown');
  const projectKey = document.getElementById('projectKey');
  
  if (!projectSearch || !projectDropdown) return;
  
  // Verificar autenticação
  if (!JiraAuth.isAuthenticated()) {
    projectDropdown.innerHTML = '<div class="select-option disabled">Faça login para ver projetos</div>';
    return;
  }

  try {
    projectSearch.disabled = true;
    projectSearch.placeholder = 'Carregando projetos...';
    projectDropdown.innerHTML = '<div class="select-option loading">Carregando projetos...</div>';

    const response = await fetch(window.ApiConfig.buildUrl('/dashboard'), {
      method: 'POST',
      headers: JiraAuth.getHeaders(),
      body: JSON.stringify({ action: 'projects' })
    });

    const data = await response.json();

    if (!data.success) {
      // Se erro de autenticação, mostrar modal de login
      if (data.error?.code === 'PROJECT_NOT_ACCESSIBLE' || response.status === 401) {
        JiraAuth.clear();
        showLoginModal();
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      throw new Error(data.error?.message || 'Erro ao carregar projetos');
    }

    allProjects = data.data?.projects || [];
    
    if (allProjects.length === 0) {
      projectDropdown.innerHTML = '<div class="select-option disabled">Nenhum projeto disponível</div>';
      return;
    }

    projectSearch.disabled = false;
    projectSearch.placeholder = 'Digite para buscar projeto...';
    renderProjectOptions(allProjects);
    initSearchableSelect();

  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    projectDropdown.innerHTML = `<div class="select-option error">Erro: ${escapeHtml(error.message)}</div>`;
  }
}

function renderProjectOptions(projects) {
  const projectDropdown = document.getElementById('projectDropdown');
  if (!projectDropdown) return;
  
  if (projects.length === 0) {
    projectDropdown.innerHTML = '<div class="select-option disabled">Nenhum projeto encontrado</div>';
    return;
  }
  
  projectDropdown.innerHTML = projects.map(p => `
    <div class="select-option" data-value="${escapeHtml(p.key)}" data-name="${escapeHtml(p.name)}">
      <span class="option-name">${escapeHtml(p.name)}</span>
      <span class="option-key">${escapeHtml(p.key)}</span>
    </div>
  `).join('');
}

function initSearchableSelect() {
  const projectSearch = document.getElementById('projectSearch');
  const projectDropdown = document.getElementById('projectDropdown');
  const projectKey = document.getElementById('projectKey');
  const container = projectSearch?.closest('.searchable-select');
  
  if (!projectSearch || !projectDropdown || !container) return;
  
  // Mostrar dropdown ao focar
  projectSearch.addEventListener('focus', () => {
    container.classList.add('open');
    renderProjectOptions(filterProjects(projectSearch.value));
  });
  
  // Filtrar ao digitar
  projectSearch.addEventListener('input', (e) => {
    const filtered = filterProjects(e.target.value);
    renderProjectOptions(filtered);
    container.classList.add('open');
  });
  
  // Selecionar opção ao clicar
  projectDropdown.addEventListener('click', (e) => {
    const option = e.target.closest('.select-option');
    if (option && !option.classList.contains('disabled') && !option.classList.contains('loading')) {
      selectProject(option.dataset.value, option.dataset.name);
    }
  });
  
  // Fechar dropdown ao clicar fora
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      container.classList.remove('open');
    }
  });
  
  // Navegação por teclado
  projectSearch.addEventListener('keydown', (e) => {
    const options = projectDropdown.querySelectorAll('.select-option:not(.disabled):not(.loading)');
    const currentIndex = Array.from(options).findIndex(opt => opt.classList.contains('highlighted'));
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
      highlightOption(options, nextIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
      highlightOption(options, prevIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const highlighted = projectDropdown.querySelector('.select-option.highlighted');
      if (highlighted) {
        selectProject(highlighted.dataset.value, highlighted.dataset.name);
      }
    } else if (e.key === 'Escape') {
      container.classList.remove('open');
      projectSearch.blur();
    }
  });
}

function filterProjects(searchTerm) {
  if (!searchTerm) return allProjects;
  const term = searchTerm.toLowerCase();
  return allProjects.filter(p => 
    p.name.toLowerCase().includes(term) || 
    p.key.toLowerCase().includes(term)
  );
}

function highlightOption(options, index) {
  options.forEach(opt => opt.classList.remove('highlighted'));
  if (options[index]) {
    options[index].classList.add('highlighted');
    options[index].scrollIntoView({ block: 'nearest' });
  }
}

function selectProject(key, name) {
  const projectSearch = document.getElementById('projectSearch');
  const projectKeyInput = document.getElementById('projectKey');
  const container = projectSearch?.closest('.searchable-select');
  
  if (projectSearch && projectKeyInput) {
    projectSearch.value = `${name} (${key})`;
    projectKeyInput.value = key;
    container?.classList.remove('open');
    container?.classList.add('selected');
    validateGenerateButton();
  }
}

// ============================================
// EVENTOS DOS FILTROS
// ============================================

function bindFilterEvents() {
  const form = document.getElementById('dashboardFilters');
  const periodSelect = document.getElementById('periodType');
  const generateBtn = document.getElementById('generateBtn');

  if (!form) return;

  // Toggle campos de data customizada
  periodSelect?.addEventListener('change', handlePeriodChange);
  periodSelect?.addEventListener('change', validateGenerateButton);

  // Submit do formulário
  form.addEventListener('submit', handleGenerateDashboard);

  // Inicializar estado
  handlePeriodChange();
  validateGenerateButton();
}

function handlePeriodChange() {
  const periodType = document.getElementById('periodType')?.value;
  const customDatesRow = document.getElementById('customDatesRow');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');

  if (periodType === 'custom') {
    customDatesRow.style.display = 'flex';
    startDateInput.required = true;
    endDateInput.required = true;
    
    // Definir valores padrão se vazios
    if (!startDateInput.value) {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      startDateInput.value = firstDay.toISOString().slice(0, 10);
    }
    if (!endDateInput.value) {
      endDateInput.value = new Date().toISOString().slice(0, 10);
    }
    
    // Limitar endDate para não ser no futuro
    endDateInput.max = new Date().toISOString().slice(0, 10);
  } else {
    customDatesRow.style.display = 'none';
    startDateInput.required = false;
    endDateInput.required = false;
  }
  
  validateGenerateButton();
}

function validateGenerateButton() {
  const projectKeyInput = document.getElementById('projectKey');
  const periodType = document.getElementById('periodType');
  const generateBtn = document.getElementById('generateBtn');
  
  const projectSelected = projectKeyInput?.value;
  const periodSelected = periodType?.value;
  
  let isValid = projectSelected && periodSelected;
  
  if (periodSelected === 'custom') {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    isValid = isValid && startDate && endDate;
  }
  
  if (generateBtn) {
    generateBtn.disabled = !isValid;
  }
}

// ============================================
// GERAÇÃO DO DASHBOARD
// ============================================

async function handleGenerateDashboard(e) {
  e.preventDefault();
  
  const projectKey = document.getElementById('projectKey').value;
  const periodType = document.getElementById('periodType').value;
  const includeStatusTime = document.getElementById('includeStatusTime').checked;
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  
  if (!projectKey) {
    showError('Selecione um projeto');
    return;
  }
  
  // Montar período
  const period = { type: periodType };
  if (periodType === 'custom') {
    if (!startDate || !endDate) {
      showError('Preencha as datas inicial e final');
      return;
    }
    period.startDate = startDate;
    period.endDate = endDate;
  }
  
  // Salvar filtros atuais
  currentFilters = { projectKey, period };
  
  // Mostrar loading
  showLoading('Carregando dashboard...');
  disableForm(true);
  
  try {
    // Verificar autenticação
    if (!JiraAuth.isAuthenticated()) {
      showLoginModal();
      throw new Error('Faça login para continuar');
    }
    
    // Buscar dados do dashboard
    const dashboardResponse = await fetch(window.ApiConfig.buildUrl('/dashboard'), {
      method: 'POST',
      headers: JiraAuth.getHeaders(),
      body: JSON.stringify({
        action: 'dashboard',
        projectKey,
        period
      })
    });
    
    const dashboardData = await dashboardResponse.json();
    
    if (!dashboardData.success) {
      // Se erro de autenticação, mostrar modal de login
      if (dashboardData.error?.code === 'PROJECT_NOT_ACCESSIBLE' || dashboardResponse.status === 401) {
        JiraAuth.clear();
        showLoginModal();
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      throw new Error(dashboardData.error?.message || 'Erro ao carregar dashboard');
    }
    
    currentDashboardData = dashboardData.data;
    currentStatusTimeData = null;
    
    // Buscar Status Time se checkbox marcado
    if (includeStatusTime) {
      try {
        showLoading('Carregando Status Time... (pode demorar alguns segundos)');
        const statusTimeResponse = await fetch(window.ApiConfig.buildUrl('/dashboard/status-time'), {
          method: 'POST',
          headers: JiraAuth.getHeaders(),
          body: JSON.stringify({ projectKey, period })
        });
        
        const statusTimeData = await statusTimeResponse.json();
        
        if (statusTimeData.success) {
          currentStatusTimeData = statusTimeData.data;
        }
      } catch (stError) {
        console.error('Erro ao carregar Status Time:', stError);
        // Continua sem Status Time
      }
    }
    
    // Renderizar dashboard
    renderDashboard();
    
    // Scroll para o cabeçalho do dashboard
    setTimeout(() => {
      const dashboardHeader = document.querySelector('[data-testid="dashboard-info"]');
      if (dashboardHeader) {
        dashboardHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
    
  } catch (error) {
    console.error('Erro ao gerar dashboard:', error);
    showError(error.message || 'Erro ao gerar dashboard');
  } finally {
    disableForm(false);
  }
}

// ============================================
// RENDERIZAÇÃO DO DASHBOARD
// ============================================

function renderDashboard() {
  const output = document.getElementById('dashboardOutput');
  if (!output || !currentDashboardData) return;
  
  const { project, period, metrics, series, meta } = currentDashboardData;
  const creds = JiraAuth.get();
  const generatedByUser = creds?.userDisplayName || creds?.displayName || creds?.email || '—';
  
  output.innerHTML = `
    <!-- Info do Projeto e Período -->
    <div class="dashboard-header-info" data-testid="dashboard-info">
      <div class="project-info">
        <h2>${escapeHtml(project.name || project.key)}</h2>
        <span class="project-key">${escapeHtml(project.key)}</span>
      </div>
      <div class="header-right">
        ${renderOverallStatusBadge(metrics)}
        <div class="period-info">
          <span class="period-label">${getPeriodLabel(period.type)}</span>
          <span class="period-dates">${formatDateBR(period.startDate)} a ${formatDateBR(period.endDate)}</span>
          ${period.sprint ? `<span class="sprint-info">Sprint: ${escapeHtml(period.sprint.name)}</span>` : ''}
        </div>
      </div>
    </div>
    
    <!-- Cards de Métricas -->
    <div class="metrics-cards" data-testid="dashboard-metrics-cards">
      ${renderMetricCard('Defect Leakage', metrics.defectLeakage.ratePercent, '%', 
        `${metrics.defectLeakage.productionBugs} / ${metrics.defectLeakage.totalDefectsValid} válidos`,
        'Taxa de Escape (Bugs Produção)', 'leakage')}
      ${renderMetricCard('Defect Valid Rate', metrics.defectValidRate.ratePercent, '%',
        `${metrics.defectValidRate.validDefects} / ${metrics.defectValidRate.totalReported} total`,
        'Taxa de Acerto', 'valid-rate')}
      ${renderDefectsRatioCard(metrics.defectsRatio)}
    </div>
    
    <!-- Cards Secundários (Breakdown) -->
    <div class="secondary-cards" data-testid="dashboard-secondary-cards">
      ${renderBreakdownCard('Defects (Desenvolvimento)', 'warning', 
        metrics.defectsBreakdown?.closed || 0, metrics.defectsBreakdown?.open || 0, 'sub-bug')}
      ${renderBreakdownCard('Bugs (Produção)', 'danger',
        metrics.bugsBreakdown?.closed || 0, metrics.bugsBreakdown?.open || 0, 'bug')}
      ${renderMTTRCard(currentStatusTimeData)}
    </div>
    
    <!-- Gráficos de Pizza -->
    <div class="charts-row" data-testid="dashboard-pie-charts">
      <div class="chart-container">
        <h3>Defect Leakage</h3>
        <canvas id="leakagePieChart"></canvas>
      </div>
      <div class="chart-container">
        <h3>Defect Valid Rate</h3>
        <canvas id="validRatePieChart"></canvas>
      </div>
    </div>
    
    <!-- Gráficos de Evolução -->
    <div class="charts-row" data-testid="dashboard-line-charts" id="chartsContainer">
      <div class="chart-container">
        <h3>Evolução Defect Leakage (%)</h3>
        <canvas id="leakageLineChart"></canvas>
      </div>
      <div class="chart-container">
        <h3>Evolução Defect Valid Rate (%)</h3>
        <canvas id="validRateLineChart"></canvas>
      </div>
    </div>
    
    <!-- Seção Status Time -->
    <div class="status-time-section" id="statusTimeSection" data-testid="dashboard-status-time-section">
      ${currentStatusTimeData ? renderStatusTimeTable() : renderStatusTimeButton()}
    </div>
    
    <!-- Resumo Executivo -->
    ${renderExecutiveSummary(metrics, currentStatusTimeData)}
    
    <!-- Botão PDF -->
    <div class="pdf-section" data-testid="dashboard-pdf-section">
      <button type="button" class="submit-btn btn-secondary" id="downloadPdfBtn" onclick="window.dashboardGeneratePDF()" data-testid="dashboard-btn-pdf">
        📄 Baixar Relatório PDF
      </button>
    </div>
    
    <!-- Meta info -->
    <div class="meta-info" data-testid="dashboard-meta-info">
      <small>Gerado em: ${escapeHtml(meta?.generatedAt || new Date().toISOString())}</small>
      <small class="meta-info-user">Usuário: ${escapeHtml(generatedByUser)}</small>
    </div>
  `;
  
  // Renderizar gráficos
  renderPieCharts(metrics);
  renderLineCharts(series);
}

function renderMetricCard(title, value, suffix, detail, description, type) {
  const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
  return `
    <div class="metric-card metric-${type}" data-testid="dashboard-metric-${type}">
      <div class="metric-title">${escapeHtml(title)}</div>
      <div class="metric-value">${escapeHtml(String(formattedValue))}${suffix}</div>
      <div class="metric-detail">${escapeHtml(detail)}</div>
      <div class="metric-description">${escapeHtml(description)}</div>
    </div>
  `;
}

function renderDefectsRatioCard(defectsRatio) {
  const { ratio, subBugsValid, bugsValid } = defectsRatio;
  
  let displayValue, description, statusClass, statusBadge;
  
  if (bugsValid === 0 && subBugsValid > 0) {
    // Cenário ideal: apenas defeitos de desenvolvimento, nenhum bug de produção
    displayValue = '∞:1';
    description = 'Nenhum bug de produção no período';
    statusClass = 'ratio-excellent';
    statusBadge = 'EXCELENTE';
  } else if (bugsValid === 0 && subBugsValid === 0) {
    // Sem defeitos
    displayValue = '-';
    description = 'Sem defeitos no período';
    statusClass = '';
    statusBadge = '';
  } else if (ratio !== null) {
    // Exibir no formato X:1
    displayValue = `${ratio.toFixed(1)}:1`;
    
    if (ratio >= 10) {
      description = 'Meta atingida! Excelente detecção no desenvolvimento';
      statusClass = 'ratio-good';
      statusBadge = 'META ATINGIDA';
    } else if (ratio >= 5) {
      description = 'Próximo da meta (objetivo: >10:1)';
      statusClass = 'ratio-warning';
      statusBadge = 'ATENÇÃO';
    } else {
      description = 'Abaixo da meta (objetivo: >10:1)';
      statusClass = 'ratio-critical';
      statusBadge = 'CRÍTICO';
    }
  } else {
    displayValue = 'N/A';
    description = 'Dados insuficientes para cálculo';
    statusClass = '';
    statusBadge = '';
  }
  
  return `
    <div class="metric-card metric-ratio ${statusClass}" data-testid="dashboard-metric-ratio">
      <div class="metric-title">Defects Ratio</div>
      ${statusBadge ? `<div class="metric-badge">${statusBadge}</div>` : ''}
      <div class="metric-value">${escapeHtml(displayValue)}</div>
      <div class="metric-detail">${subBugsValid} Sub-Bug : ${bugsValid} Bug</div>
      <div class="metric-description">${escapeHtml(description)}</div>
    </div>
  `;
}

function renderBreakdownCard(title, colorType, closed, open, iconType) {
  const total = closed + open;
  const icon = iconType === 'bug' ? '🐛' : '🔧';
  const typeLabel = iconType === 'bug' ? 'bugs' : 'defeitos';
  
  const tooltipFechados = `Issues com status final (Applied in production, Concluído, Done)`;
  const tooltipAbertos = `Issues ainda em andamento (In Test, Ready to test, etc.)`;
  const tooltipTotal = `Total de ${typeLabel} válidos no período (exclui cancelados)`;
  
  return `
    <div class="breakdown-card breakdown-${colorType}" data-testid="dashboard-breakdown-${iconType}">
      <div class="breakdown-header">
        <span class="breakdown-icon">${icon}</span>
        <span class="breakdown-title">${escapeHtml(title)}</span>
        <span class="breakdown-help" title="Contagem por status atual dos ${typeLabel}">ⓘ</span>
      </div>
      <div class="breakdown-body">
        <div class="breakdown-item" title="${tooltipFechados}">
          <span class="breakdown-value success">${closed}</span>
          <span class="breakdown-label">Fechados ⓘ</span>
        </div>
        <div class="breakdown-item" title="${tooltipAbertos}">
          <span class="breakdown-value ${colorType}">${open}</span>
          <span class="breakdown-label">Abertos ⓘ</span>
        </div>
      </div>
      <div class="breakdown-footer" title="${tooltipTotal}">
        <small>Total válidos: ${total}</small>
      </div>
    </div>
  `;
}

function renderMTTRCard(statusTimeData) {
  const tooltipMTTR = 'Mean Time To Resolution: tempo médio que uma issue leva desde "Ready to test" até ser concluída';
  const tooltipMeta = 'Meta recomendada para ciclo de testes ágeis';
  
  if (!statusTimeData || !statusTimeData.summary) {
    return `
      <div class="breakdown-card breakdown-info" data-testid="dashboard-mttr">
        <div class="breakdown-header">
          <span class="breakdown-icon">⏱️</span>
          <span class="breakdown-title">MTTR (Tempo Médio)</span>
          <span class="breakdown-help" title="${tooltipMTTR}">ⓘ</span>
        </div>
        <div class="breakdown-body mttr-body">
          <div class="mttr-value">-</div>
          <div class="mttr-label">Carregue Status Time para ver</div>
        </div>
      </div>
    `;
  }
  
  const { avgReadyToTestHours, avgInTestHours } = statusTimeData.summary;
  const mttr = (avgReadyToTestHours + avgInTestHours).toFixed(1);
  // Meta: 8h por status (Ready to Test + In Test) = 16h total
  const mttrStatus = mttr <= 16 ? 'success' : mttr <= 32 ? 'warning' : 'danger';
  
  return `
    <div class="breakdown-card breakdown-${mttrStatus}" data-testid="dashboard-mttr">
      <div class="breakdown-header">
        <span class="breakdown-icon">⏱️</span>
        <span class="breakdown-title">MTTR (Tempo Médio)</span>
        <span class="breakdown-help" title="${tooltipMTTR}">ⓘ</span>
      </div>
      <div class="breakdown-body mttr-body">
        <div class="mttr-value ${mttrStatus}">${mttr}h</div>
        <div class="mttr-label">
          Ready to Test + In Test 
          <span class="breakdown-help" title="Média: ${avgReadyToTestHours.toFixed(1)}h aguardando + ${avgInTestHours.toFixed(1)}h em teste">ⓘ</span>
        </div>
      </div>
      <div class="breakdown-footer" title="${tooltipMeta}">
        <small>Meta: &lt; 16h (8h por status)</small>
      </div>
    </div>
  `;
}

function calculateOverallStatus(metrics) {
  const leakage = metrics.defectLeakage?.ratePercent || 0;
  const validRate = metrics.defectValidRate?.ratePercent || 0;
  const bugsOpen = metrics.bugsBreakdown?.open || 0;
  
  // Critérios de avaliação
  if (leakage > 20 || validRate < 70 || bugsOpen > 5) {
    return { status: 'CRÍTICO', statusClass: 'danger' };
  }
  if (leakage > 10 || validRate < 85 || bugsOpen > 2) {
    return { status: 'ATENÇÃO', statusClass: 'warning' };
  }
  return { status: 'BOM', statusClass: 'success' };
}

function renderOverallStatusBadge(metrics) {
  const { status, statusClass } = calculateOverallStatus(metrics);
  return `
    <div class="overall-status">
      <span class="status-badge status-${statusClass}" data-testid="dashboard-status-badge">${status}</span>
    </div>
  `;
}

function renderExecutiveSummary(metrics, statusTimeData) {
  const positives = [];
  const concerns = [];
  
  // Análise de Valid Rate
  const validRate = metrics.defectValidRate?.ratePercent || 0;
  if (validRate >= 95) {
    positives.push('Excelente taxa de acerto (>95%)');
  } else if (validRate >= 90) {
    positives.push('Boa taxa de acerto (>90%)');
  } else if (validRate < 80) {
    concerns.push(`Taxa de acerto abaixo do esperado (${validRate.toFixed(1)}%)`);
  }
  
  // Análise de Leakage
  const leakage = metrics.defectLeakage?.ratePercent || 0;
  if (leakage <= 5) {
    positives.push('Taxa de escape dentro da meta (<5%)');
  } else if (leakage > 15) {
    concerns.push(`Taxa de escape crítica (${leakage.toFixed(1)}%)`);
  } else if (leakage > 10) {
    concerns.push(`Taxa de escape acima da meta (${leakage.toFixed(1)}%)`);
  }
  
  // Análise de Bugs em aberto
  const bugsOpen = metrics.bugsBreakdown?.open || 0;
  const bugsClosed = metrics.bugsBreakdown?.closed || 0;
  if (bugsOpen === 0 && bugsClosed > 0) {
    positives.push('Todos os bugs de produção foram fechados');
  } else if (bugsOpen > 3) {
    concerns.push(`${bugsOpen} bugs de produção ainda em aberto`);
  } else if (bugsOpen > 0) {
    concerns.push(`${bugsOpen} bug(s) de produção em aberto`);
  }
  
  // Análise de Defects em aberto
  const defectsOpen = metrics.defectsBreakdown?.open || 0;
  if (defectsOpen > 5) {
    concerns.push(`${defectsOpen} defeitos de desenvolvimento em aberto`);
  }
  
  // Análise de Defects Ratio
  const ratio = metrics.defectsRatio?.ratio;
  if (ratio !== null && ratio >= 10) {
    positives.push('Ratio Sub-Bug:Bug excelente (≥10:1)');
  } else if (ratio !== null && ratio < 3) {
    concerns.push('Ratio Sub-Bug:Bug abaixo do ideal (<3:1)');
  }
  
  // Análise de MTTR (se disponível)
  if (statusTimeData?.summary) {
    const mttr = statusTimeData.summary.avgReadyToTestHours + statusTimeData.summary.avgInTestHours;
    if (mttr <= 16) {
      positives.push('MTTR dentro da meta (<16h)');
    } else if (mttr > 32) {
      concerns.push(`MTTR muito alto (${mttr.toFixed(1)}h)`);
    }
  }
  
  // Se não há pontos positivos, adicionar um genérico
  if (positives.length === 0) {
    positives.push('Dados coletados para análise');
  }
  
  return `
    <div class="executive-summary" data-testid="dashboard-executive-summary">
      <div class="summary-header">
        <h3>📋 Resumo Executivo</h3>
      </div>
      <div class="summary-body">
        <div class="summary-column positives">
          <h4>✅ Pontos Positivos</h4>
          <ul>
            ${positives.map(p => `<li><span class="icon success">✓</span> ${escapeHtml(p)}</li>`).join('')}
          </ul>
        </div>
        <div class="summary-column concerns">
          <h4>⚠️ Pontos de Atenção</h4>
          <ul>
            ${concerns.length > 0 
              ? concerns.map(c => `<li><span class="icon warning">!</span> ${escapeHtml(c)}</li>`).join('')
              : '<li><span class="icon success">✓</span> Nenhum ponto de atenção identificado</li>'}
          </ul>
        </div>
      </div>
    </div>
  `;
}

function getPeriodLabel(type) {
  switch (type) {
    case 'month_current': return 'Mês Atual';
    case 'month_previous': return 'Mês Passado';
    case 'last_3_months': return 'Últimos 3 Meses';
    case 'sprint_current': return 'Sprint Atual';
    case 'sprint_previous': return 'Sprint Passada';
    case 'custom': return 'Período Personalizado';
    default: return type;
  }
}

// ============================================
// GRÁFICOS
// ============================================

function renderPieCharts(metrics) {
  // Destruir gráficos existentes
  if (chartInstances.leakagePie) chartInstances.leakagePie.destroy();
  if (chartInstances.validRatePie) chartInstances.validRatePie.destroy();
  
  const isDarkTheme = document.body.classList.contains('dark-theme') || 
    !document.body.classList.contains('light-theme');
  const textColor = isDarkTheme ? '#f4f4f4' : '#333333';
  
  // Gráfico Leakage
  const leakageCtx = document.getElementById('leakagePieChart')?.getContext('2d');
  if (leakageCtx) {
    const prodBugs = metrics.defectLeakage.productionBugs;
    const otherDefects = metrics.defectLeakage.totalDefectsValid - prodBugs;
    
    chartInstances.leakagePie = new Chart(leakageCtx, {
      type: 'pie',
      data: {
        labels: ['Bugs Produção', 'Outros Defeitos'],
        datasets: [{
          data: [prodBugs, otherDefects],
          backgroundColor: ['#ef4444', '#22c55e'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor } }
        }
      }
    });
  }
  
  // Gráfico Valid Rate
  const validRateCtx = document.getElementById('validRatePieChart')?.getContext('2d');
  if (validRateCtx) {
    const valid = metrics.defectValidRate.validDefects;
    const invalid = metrics.defectValidRate.totalReported - valid;
    
    chartInstances.validRatePie = new Chart(validRateCtx, {
      type: 'pie',
      data: {
        labels: ['Válidos', 'Cancelados'],
        datasets: [{
          data: [valid, invalid],
          backgroundColor: ['#22c55e', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor } }
        }
      }
    });
  }
}

function renderLineCharts(series) {
  // Destruir gráficos existentes
  if (chartInstances.leakageLine) chartInstances.leakageLine.destroy();
  if (chartInstances.validRateLine) chartInstances.validRateLine.destroy();
  
  const isDarkTheme = document.body.classList.contains('dark-theme') || 
    !document.body.classList.contains('light-theme');
  const textColor = isDarkTheme ? '#f4f4f4' : '#333333';
  const gridColor = isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
  const commonOptions = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { 
        ticks: { color: textColor, maxRotation: 45, minRotation: 45 },
        grid: { color: gridColor }
      },
      y: { 
        beginAtZero: true,
        max: 100,
        ticks: { color: textColor, callback: v => v + '%' },
        grid: { color: gridColor }
      }
    }
  };
  
  // Gráfico Leakage Line
  const leakageLineCtx = document.getElementById('leakageLineChart')?.getContext('2d');
  if (leakageLineCtx && series.defectLeakageDaily) {
    chartInstances.leakageLine = new Chart(leakageLineCtx, {
      type: 'line',
      data: {
        labels: series.defectLeakageDaily.labels,
        datasets: [{
          label: 'Defect Leakage %',
          data: series.defectLeakageDaily.valuesPercent,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: commonOptions
    });
  }
  
  // Gráfico Valid Rate Line
  const validRateLineCtx = document.getElementById('validRateLineChart')?.getContext('2d');
  if (validRateLineCtx && series.defectValidRateDaily) {
    chartInstances.validRateLine = new Chart(validRateLineCtx, {
      type: 'line',
      data: {
        labels: series.defectValidRateDaily.labels,
        datasets: [{
          label: 'Defect Valid Rate %',
          data: series.defectValidRateDaily.valuesPercent,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: commonOptions
    });
  }
}

// ============================================
// STATUS TIME
// ============================================

function renderStatusTimeButton() {
  return `
    <div class="status-time-placeholder">
      <h3>📊 Status Time</h3>
      <p>Tempo das issues em "Ready to test" e "In Test"</p>
      <button type="button" class="submit-btn btn-secondary" id="loadStatusTimeBtn" onclick="window.dashboardLoadStatusTime()" data-testid="dashboard-btn-load-statustime">
        ⏱️ Carregar Status Time
      </button>
    </div>
  `;
}

function renderStatusTimeTable() {
  if (!currentStatusTimeData) return renderStatusTimeButton();
  
  const { issues, summary } = currentStatusTimeData;
  
  // Ordenar conforme estado atual
  const sortedIssues = sortStatusTimeIssues([...issues]);
  
  // Helper para gerar ícone de ordenação
  const sortIcon = (col) => {
    if (statusTimeSort.column !== col) return '<span class="sort-icon">⇅</span>';
    return statusTimeSort.direction === 'asc' 
      ? '<span class="sort-icon active">▲</span>' 
      : '<span class="sort-icon active">▼</span>';
  };
  
  return `
    <div class="status-time-content">
      <h3>📊 Status Time</h3>
      
      <div class="status-time-summary" data-testid="dashboard-statustime-summary">
        <div class="summary-item"><span class="label">Issues analisadas:</span> <span class="value">${summary.count}</span></div>
        <div class="summary-item"><span class="label">Total Ready to test:</span> <span class="value">${summary.totalReadyToTestHours.toFixed(2)}h</span></div>
        <div class="summary-item"><span class="label">Total In Test:</span> <span class="value">${summary.totalInTestHours.toFixed(2)}h</span></div>
        <div class="summary-item"><span class="label">Total Geral:</span> <span class="value">${summary.totalHours.toFixed(2)}h</span></div>
        <div class="summary-item"><span class="label">Média Ready to test:</span> <span class="value">${summary.avgReadyToTestHours.toFixed(2)}h</span></div>
        <div class="summary-item"><span class="label">Média In Test:</span> <span class="value">${summary.avgInTestHours.toFixed(2)}h</span></div>
      </div>
      
      <div class="table-wrapper">
        <table class="status-time-table sortable" data-testid="dashboard-statustime-table">
          <thead>
            <tr>
              <th class="sortable-header" data-sort="key" onclick="window.sortStatusTimeBy('key')">Key ${sortIcon('key')}</th>
              <th class="sortable-header" data-sort="issueType" onclick="window.sortStatusTimeBy('issueType')">Tipo ${sortIcon('issueType')}</th>
              <th class="sortable-header" data-sort="summary" onclick="window.sortStatusTimeBy('summary')">Summary ${sortIcon('summary')}</th>
              <th class="sortable-header" data-sort="currentStatus" onclick="window.sortStatusTimeBy('currentStatus')">Status ${sortIcon('currentStatus')}</th>
              <th class="sortable-header" data-sort="readyToTestHours" onclick="window.sortStatusTimeBy('readyToTestHours')">Ready (h) ${sortIcon('readyToTestHours')}</th>
              <th class="sortable-header" data-sort="inTestHours" onclick="window.sortStatusTimeBy('inTestHours')">Test (h) ${sortIcon('inTestHours')}</th>
              <th class="sortable-header" data-sort="totalHours" onclick="window.sortStatusTimeBy('totalHours')">Total (h) ${sortIcon('totalHours')}</th>
            </tr>
          </thead>
          <tbody>
            ${sortedIssues.map(issue => `
              <tr>
                <td><a href="https://suprema-gaming.atlassian.net/browse/${escapeHtml(issue.key)}" target="_blank">${escapeHtml(issue.key)}</a></td>
                <td class="type-cell">${escapeHtml(issue.issueType || '-')}</td>
                <td class="summary-cell" title="${escapeHtml(issue.summary)}">${escapeHtml(truncate(issue.summary, 50))}</td>
                <td>${escapeHtml(issue.currentStatus)}</td>
                <td class="number-cell">${issue.readyToTestHours.toFixed(2)}</td>
                <td class="number-cell">${issue.inTestHours.toFixed(2)}</td>
                <td class="number-cell total-cell">${issue.totalHours.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function sortStatusTimeIssues(issues) {
  const { column, direction } = statusTimeSort;
  const multiplier = direction === 'asc' ? 1 : -1;
  
  return issues.sort((a, b) => {
    let valA = a[column];
    let valB = b[column];
    
    // Tratar valores nulos
    if (valA == null) valA = '';
    if (valB == null) valB = '';
    
    // Comparação numérica para colunas de horas
    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * multiplier;
    }
    
    // Comparação de strings
    return String(valA).localeCompare(String(valB), 'pt-BR', { sensitivity: 'base' }) * multiplier;
  });
}

function sortStatusTimeBy(column) {
  // Se já está ordenando por esta coluna, inverte a direção
  if (statusTimeSort.column === column) {
    statusTimeSort.direction = statusTimeSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    // Nova coluna: ordenar desc por padrão para números, asc para texto
    statusTimeSort.column = column;
    const numericColumns = ['readyToTestHours', 'inTestHours', 'totalHours'];
    statusTimeSort.direction = numericColumns.includes(column) ? 'desc' : 'asc';
  }
  
  // Re-renderizar a tabela
  const statusTimeSection = document.getElementById('statusTimeSection');
  if (statusTimeSection) {
    statusTimeSection.innerHTML = renderStatusTimeTable();
  }
}

// Expor função globalmente
window.sortStatusTimeBy = sortStatusTimeBy;

async function loadStatusTime() {
  if (!currentFilters.projectKey || !currentFilters.period) {
    showError('Gere o dashboard primeiro');
    return;
  }
  
  const statusTimeSection = document.getElementById('statusTimeSection');
  if (!statusTimeSection) return;
  
  // Mostrar loading
  statusTimeSection.innerHTML = `
    <div class="status-time-loading">
      <div class="loading-spinner"></div>
      <p>Carregando Status Time... pode levar alguns segundos</p>
    </div>
  `;
  
  try {
    // Verificar autenticação
    if (!JiraAuth.isAuthenticated()) {
      showLoginModal();
      throw new Error('Faça login para continuar');
    }
    
    const response = await fetch(window.ApiConfig.buildUrl('/dashboard/status-time'), {
      method: 'POST',
      headers: JiraAuth.getHeaders(),
      body: JSON.stringify({
        projectKey: currentFilters.projectKey,
        period: currentFilters.period
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      // Se erro de autenticação, mostrar modal de login
      if (data.error?.code === 'PROJECT_NOT_ACCESSIBLE' || response.status === 401) {
        JiraAuth.clear();
        showLoginModal();
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      throw new Error(data.error?.message || 'Erro ao carregar Status Time');
    }
    
    currentStatusTimeData = data.data;
    statusTimeSection.innerHTML = renderStatusTimeTable();
    
    // Atualizar o card MTTR e o Resumo Executivo com os novos dados
    updateMTTRCard();
    updateExecutiveSummary();
    
  } catch (error) {
    console.error('Erro ao carregar Status Time:', error);
    statusTimeSection.innerHTML = `
      <div class="status-time-error">
        <p>Erro ao carregar Status Time: ${escapeHtml(error.message)}</p>
        <button type="button" class="submit-btn btn-secondary" onclick="window.dashboardLoadStatusTime()">
          Tentar novamente
        </button>
      </div>
    `;
  }
}

function updateMTTRCard() {
  const mttrCard = document.querySelector('[data-testid="dashboard-mttr"]');
  if (mttrCard) {
    mttrCard.outerHTML = renderMTTRCard(currentStatusTimeData);
  }
}

function updateExecutiveSummary() {
  if (!currentDashboardData) return;
  
  const summarySection = document.querySelector('[data-testid="dashboard-executive-summary"]');
  if (summarySection) {
    summarySection.outerHTML = renderExecutiveSummary(currentDashboardData.metrics, currentStatusTimeData);
  }
}

// ============================================
// GERAÇÃO DE PDF
// ============================================

async function generatePDF() {
  if (!currentDashboardData) {
    alert('Gere o dashboard primeiro');
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const { project, period, metrics, meta } = currentDashboardData;
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = 15;
  
  // Cores
  const colors = {
    primary: [59, 130, 246],      // Azul
    success: [34, 197, 94],       // Verde
    warning: [245, 158, 11],      // Amarelo
    danger: [239, 68, 68],        // Vermelho
    gray: [100, 116, 139],        // Cinza
    lightGray: [226, 232, 240],   // Cinza claro
    dark: [30, 41, 59]            // Escuro
  };
  
  // Helper para desenhar box com título
  function drawSection(title, startY, height) {
    doc.setFillColor(...colors.primary);
    doc.rect(margin, startY, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, startY + 5.5);
    doc.setTextColor(...colors.dark);
    doc.setDrawColor(...colors.lightGray);
    doc.rect(margin, startY + 8, contentWidth, height - 8);
    return startY + 12;
  }
  
  // Helper para nova página se necessário
  function checkNewPage(requiredHeight) {
    if (yPos + requiredHeight > pageHeight - 20) {
      doc.addPage();
      yPos = 15;
      return true;
    }
    return false;
  }
  
  // Helper para status color
  function getStatusColor(status) {
    switch(status) {
      case 'BOM': return colors.success;
      case 'ATENÇÃO': return colors.warning;
      case 'CRÍTICO': return colors.danger;
      default: return colors.gray;
    }
  }
  
  // ========== HEADER ==========
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Métricas QA', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${project.name || project.key}`, pageWidth / 2, 24, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text(`${formatDateBR(period.startDate)} a ${formatDateBR(period.endDate)} | ${getPeriodLabel(period.type)}${period.sprint ? ' - ' + period.sprint.name : ''}`, pageWidth / 2, 31, { align: 'center' });
  
  yPos = 45;
  
  // ========== STATUS GERAL ==========
  const overallStatus = calculateOverallStatus(metrics);
  const statusColor = getStatusColor(overallStatus.status);
  
  doc.setFillColor(...statusColor);
  doc.roundedRect(margin, yPos, 50, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`STATUS: ${overallStatus.status}`, margin + 25, yPos + 7.5, { align: 'center' });
  
  doc.setTextColor(...colors.gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${meta?.generatedAt || new Date().toISOString()}`, pageWidth - margin, yPos + 7, { align: 'right' });
  const creds = JiraAuth.get();
  const generatedBy = creds?.userDisplayName || creds?.displayName || creds?.email || '—';
  doc.text(`Usuário: ${generatedBy}`, pageWidth - margin, yPos + 12, { align: 'right' });
  
  yPos += 20;
  
  // ========== MÉTRICAS PRINCIPAIS ==========
  const metricsHeight = 45;
  yPos = drawSection('MÉTRICAS PRINCIPAIS', yPos, metricsHeight);
  
  const colWidth = contentWidth / 3;
  const metricStartY = yPos;
  
  // Defect Leakage
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  doc.text('Defect Leakage', margin + 5, metricStartY);
  doc.setFontSize(16);
  doc.setTextColor(...colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text(`${metrics.defectLeakage.ratePercent.toFixed(1)}%`, margin + 5, metricStartY + 10);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.gray);
  doc.text(`${metrics.defectLeakage.productionBugs} bugs / ${metrics.defectLeakage.totalDefectsValid} válidos`, margin + 5, metricStartY + 16);
  
  // Defect Valid Rate
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  doc.text('Valid Rate', margin + colWidth + 5, metricStartY);
  doc.setFontSize(16);
  doc.setTextColor(...colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text(`${metrics.defectValidRate.ratePercent.toFixed(1)}%`, margin + colWidth + 5, metricStartY + 10);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.gray);
  doc.text(`${metrics.defectValidRate.validDefects} válidos / ${metrics.defectValidRate.totalReported} total`, margin + colWidth + 5, metricStartY + 16);
  
  // Defects Ratio
  const { ratio, subBugsValid, bugsValid } = metrics.defectsRatio;
  let ratioDisplay = 'N/A';
  if (bugsValid === 0 && subBugsValid > 0) {
    ratioDisplay = '∞:1';
  } else if (ratio !== null) {
    ratioDisplay = `${ratio.toFixed(1)}:1`;
  }
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  doc.text('Defects Ratio', margin + colWidth * 2 + 5, metricStartY);
  doc.setFontSize(16);
  doc.setTextColor(...colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text(ratioDisplay, margin + colWidth * 2 + 5, metricStartY + 10);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.gray);
  doc.text(`${subBugsValid} sub-bugs : ${bugsValid} bugs`, margin + colWidth * 2 + 5, metricStartY + 16);
  
  // Linha separadora vertical
  doc.setDrawColor(...colors.lightGray);
  doc.line(margin + colWidth, yPos - 4, margin + colWidth, yPos + 22);
  doc.line(margin + colWidth * 2, yPos - 4, margin + colWidth * 2, yPos + 22);
  
  yPos += metricsHeight - 8;
  
  // ========== BREAKDOWN ==========
  if (metrics.defectsBreakdown && metrics.bugsBreakdown) {
    yPos += 5;
    const breakdownHeight = 35;
    yPos = drawSection('DETALHAMENTO', yPos, breakdownHeight);
    
    const halfWidth = contentWidth / 2;
    
    // Defects (Desenvolvimento)
    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'bold');
    doc.text('Defects (Desenvolvimento)', margin + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.success);
    doc.text(`Fechados: ${metrics.defectsBreakdown.closed}`, margin + 5, yPos + 7);
    doc.setTextColor(...colors.warning);
    doc.text(`Abertos: ${metrics.defectsBreakdown.open}`, margin + 35, yPos + 7);
    doc.setTextColor(...colors.gray);
    doc.text(`Total: ${metrics.defectsBreakdown.total}`, margin + 60, yPos + 7);
    
    // Bugs (Produção)
    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'bold');
    doc.text('Bugs (Produção)', margin + halfWidth + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.success);
    doc.text(`Fechados: ${metrics.bugsBreakdown.closed}`, margin + halfWidth + 5, yPos + 7);
    doc.setTextColor(...colors.danger);
    doc.text(`Abertos: ${metrics.bugsBreakdown.open}`, margin + halfWidth + 35, yPos + 7);
    doc.setTextColor(...colors.gray);
    doc.text(`Total: ${metrics.bugsBreakdown.total}`, margin + halfWidth + 60, yPos + 7);
    
    // Linha separadora vertical
    doc.setDrawColor(...colors.lightGray);
    doc.line(margin + halfWidth, yPos - 4, margin + halfWidth, yPos + 15);
    
    yPos += breakdownHeight - 8;
  }
  
  // ========== GRÁFICOS ==========
  const chartsContainer = document.getElementById('chartsContainer');
  if (chartsContainer) {
    try {
      yPos += 5;
      checkNewPage(80);
      
      doc.setFillColor(...colors.primary);
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('EVOLUÇÃO DAS MÉTRICAS', margin + 3, yPos + 5.5);
      yPos += 10;
      
      const canvas = await html2canvas(chartsContainer, { 
        backgroundColor: '#ffffff',
        scale: 2
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (yPos + imgHeight > pageHeight - 20) {
        doc.addPage();
        yPos = 15;
      }
      
      doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 5;
    } catch (e) {
      console.error('Erro ao capturar gráficos:', e);
    }
  }
  
  // ========== STATUS TIME ==========
  if (currentStatusTimeData) {
    doc.addPage();
    yPos = 15;
    
    const { summary, issues } = currentStatusTimeData;
    const mttr = (summary.avgReadyToTestHours + summary.avgInTestHours);
    
    // Header da página
    doc.setFillColor(...colors.dark);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Status Time - Tempo em QA', pageWidth / 2, 16, { align: 'center' });
    
    yPos = 35;
    
    // Resumo em boxes
    const boxWidth = contentWidth / 4;
    const boxHeight = 25;
    
    const summaryData = [
      { label: 'Issues', value: summary.count, color: colors.primary },
      { label: 'Ready to Test', value: `${summary.totalReadyToTestHours.toFixed(1)}h`, color: colors.warning },
      { label: 'In Test', value: `${summary.totalInTestHours.toFixed(1)}h`, color: colors.success },
      { label: 'MTTR', value: `${mttr.toFixed(1)}h`, color: mttr <= 16 ? colors.success : colors.danger }
    ];
    
    summaryData.forEach((item, i) => {
      const x = margin + (boxWidth * i);
      doc.setFillColor(...item.color);
      doc.roundedRect(x + 2, yPos, boxWidth - 4, boxHeight, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text(item.label, x + (boxWidth / 2), yPos + 7, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(String(item.value), x + (boxWidth / 2), yPos + 18, { align: 'center' });
      doc.setFont('helvetica', 'normal');
    });
    
    yPos += boxHeight + 10;
    
    // Tabela de issues
    const tableHeaders = ['Key', 'Tipo', 'Ready (h)', 'Test (h)', 'Total (h)', 'Status'];
    const colWidths = [25, 30, 22, 22, 22, 50];
    
    // Header da tabela
    doc.setFillColor(...colors.lightGray);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setTextColor(...colors.dark);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    let xPos = margin + 2;
    tableHeaders.forEach((header, i) => {
      doc.text(header, xPos, yPos + 5.5);
      xPos += colWidths[i];
    });
    yPos += 10;
    
    // Linhas da tabela
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    const sortedIssues = [...issues].sort((a, b) => b.totalHours - a.totalHours);
    
    sortedIssues.forEach((issue, index) => {
      if (yPos > pageHeight - 15) {
        doc.addPage();
        yPos = 15;
        // Re-desenhar header
        doc.setFillColor(...colors.lightGray);
        doc.rect(margin, yPos, contentWidth, 8, 'F');
        doc.setTextColor(...colors.dark);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        xPos = margin + 2;
        tableHeaders.forEach((header, i) => {
          doc.text(header, xPos, yPos + 5.5);
          xPos += colWidths[i];
        });
        yPos += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }
      
      // Linha alternada
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPos - 3, contentWidth, 7, 'F');
      }
      
      doc.setTextColor(...colors.dark);
      xPos = margin + 2;
      
      doc.setTextColor(...colors.primary);
      doc.text(issue.key, xPos, yPos);
      xPos += colWidths[0];
      
      doc.setTextColor(...colors.gray);
      doc.text(truncate(issue.issueType || '-', 12), xPos, yPos);
      xPos += colWidths[1];
      
      doc.setTextColor(...colors.dark);
      doc.text(issue.readyToTestHours.toFixed(2), xPos, yPos);
      xPos += colWidths[2];
      
      doc.text(issue.inTestHours.toFixed(2), xPos, yPos);
      xPos += colWidths[3];
      
      doc.setFont('helvetica', 'bold');
      doc.text(issue.totalHours.toFixed(2), xPos, yPos);
      doc.setFont('helvetica', 'normal');
      xPos += colWidths[4];
      
      doc.setTextColor(...colors.gray);
      doc.text(truncate(issue.currentStatus, 22), xPos, yPos);
      
      yPos += 7;
    });
  }
  
  // ========== FOOTER em todas as páginas ==========
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...colors.gray);
    doc.text(`BSQA Card Writer - Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }
  
  // Download
  const filename = `relatorio-qa-${project.key}-${formatDateBR(new Date().toISOString().slice(0, 10)).replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}

// ============================================
// UTILITÁRIOS
// ============================================

function showLoading(message) {
  const output = document.getElementById('dashboardOutput');
  if (output) {
    output.innerHTML = `
      <div class="loading-container" data-testid="dashboard-loading">
        <div class="loading-spinner"></div>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }
}

function showError(message) {
  const output = document.getElementById('dashboardOutput');
  if (output) {
    output.innerHTML = `
      <div class="error-container" data-testid="dashboard-error">
        <h3>❌ Erro</h3>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }
}

function showSuccess(message) {
  // Mostra uma mensagem de sucesso temporária na tela
  const existing = document.querySelector('.success-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.innerHTML = `<span>✅ ${escapeHtml(message)}</span>`;
  document.body.appendChild(toast);
  
  // Animação de entrada
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remover após 3 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function disableForm(disabled) {
  const form = document.getElementById('dashboardFilters');
  if (!form) return;
  
  const elements = form.querySelectorAll('input, select, button');
  elements.forEach(el => el.disabled = disabled);
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function truncate(str, maxLength) {
  if (!str) return '';
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
}

function formatDateBR(dateStr) {
  // Converte YYYY-MM-DD para DD/MM/YYYY
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Exportar funções para uso global
window.dashboardLoadStatusTime = loadStatusTime;
window.dashboardGeneratePDF = generatePDF;
