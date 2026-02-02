// dashboard.js - Lógica do Dashboard de Métricas QA
import { loadCommonComponents, loadThemeFromConfig, generateBreadcrumbs } from './main.js';

// Estado global do dashboard
let currentDashboardData = null;
let currentStatusTimeData = null;
let currentFilters = {
  projectKey: null,
  period: null
};

// Instâncias dos gráficos (para destruir ao recarregar)
let chartInstances = {
  leakagePie: null,
  validRatePie: null,
  leakageLine: null,
  validRateLine: null
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadCommonComponents();
  loadThemeFromConfig();
  await loadProjects();
  bindFilterEvents();
  generateBreadcrumbs([
    { name: 'Home', url: 'index.html' },
    { name: 'Dashboard QA', url: 'dashboard.html', active: true }
  ]);
});

// ============================================
// CARREGAMENTO DE PROJETOS
// ============================================

async function loadProjects() {
  const projectSelect = document.getElementById('projectSelect');
  if (!projectSelect) return;

  try {
    projectSelect.innerHTML = '<option value="">Carregando projetos...</option>';
    projectSelect.disabled = true;

    const response = await fetch(window.ApiConfig.buildUrl('/dashboard'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'projects' })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Erro ao carregar projetos');
    }

    const projects = data.data?.projects || [];
    
    if (projects.length === 0) {
      projectSelect.innerHTML = '<option value="">Nenhum projeto disponível</option>';
      return;
    }

    projectSelect.innerHTML = '<option value="">Selecione um projeto...</option>' +
      projects.map(p => `<option value="${escapeHtml(p.key)}">${escapeHtml(p.name)} (${escapeHtml(p.key)})</option>`).join('');
    
    projectSelect.disabled = false;

  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    projectSelect.innerHTML = `<option value="">Erro: ${escapeHtml(error.message)}</option>`;
  }
}

// ============================================
// EVENTOS DOS FILTROS
// ============================================

function bindFilterEvents() {
  const form = document.getElementById('dashboardFilters');
  const periodSelect = document.getElementById('periodType');
  const projectSelect = document.getElementById('projectSelect');
  const generateBtn = document.getElementById('generateBtn');

  if (!form) return;

  // Toggle campos de data customizada
  periodSelect?.addEventListener('change', handlePeriodChange);

  // Validar botão gerar
  projectSelect?.addEventListener('change', validateGenerateButton);
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
  const projectSelect = document.getElementById('projectSelect');
  const periodType = document.getElementById('periodType');
  const generateBtn = document.getElementById('generateBtn');
  
  const projectSelected = projectSelect?.value;
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
  
  const projectKey = document.getElementById('projectSelect').value;
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
    // Buscar dados do dashboard
    const dashboardResponse = await fetch(window.ApiConfig.buildUrl('/dashboard'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'dashboard',
        projectKey,
        period
      })
    });
    
    const dashboardData = await dashboardResponse.json();
    
    if (!dashboardData.success) {
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
          headers: { 'Content-Type': 'application/json' },
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
  
  output.innerHTML = `
    <!-- Info do Projeto e Período -->
    <div class="dashboard-header-info" data-testid="dashboard-info">
      <div class="project-info">
        <h2>${escapeHtml(project.name || project.key)}</h2>
        <span class="project-key">${escapeHtml(project.key)}</span>
      </div>
      <div class="period-info">
        <span class="period-label">${getPeriodLabel(period.type)}</span>
        <span class="period-dates">${formatDateBR(period.startDate)} a ${formatDateBR(period.endDate)}</span>
        ${period.sprint ? `<span class="sprint-info">Sprint: ${escapeHtml(period.sprint.name)}</span>` : ''}
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
    
    <!-- Botão PDF -->
    <div class="pdf-section" data-testid="dashboard-pdf-section">
      <button type="button" class="submit-btn btn-secondary" id="downloadPdfBtn" onclick="window.dashboardGeneratePDF()" data-testid="dashboard-btn-pdf">
        📄 Baixar Relatório PDF
      </button>
    </div>
    
    <!-- Meta info -->
    <div class="meta-info" data-testid="dashboard-meta-info">
      <small>Gerado em: ${escapeHtml(meta?.generatedAt || new Date().toISOString())}</small>
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

function getPeriodLabel(type) {
  switch (type) {
    case 'month_current': return 'Mês Atual';
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
  
  // Ordenar por totalHours desc
  const sortedIssues = [...issues].sort((a, b) => b.totalHours - a.totalHours);
  
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
        <table class="status-time-table" data-testid="dashboard-statustime-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Tipo</th>
              <th>Summary</th>
              <th>Status</th>
              <th>Ready (h)</th>
              <th>Test (h)</th>
              <th>Total (h)</th>
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
    const response = await fetch(window.ApiConfig.buildUrl('/dashboard/status-time'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectKey: currentFilters.projectKey,
        period: currentFilters.period
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Erro ao carregar Status Time');
    }
    
    currentStatusTimeData = data.data;
    statusTimeSection.innerHTML = renderStatusTimeTable();
    
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
  
  let yPos = 20;
  const lineHeight = 7;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Métricas QA', pageWidth / 2, yPos, { align: 'center' });
  yPos += lineHeight * 2;
  
  // Info do projeto
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Projeto: ${project.name || project.key} (${project.key})`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Período: ${formatDateBR(period.startDate)} a ${formatDateBR(period.endDate)}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Tipo: ${getPeriodLabel(period.type)}`, margin, yPos);
  yPos += lineHeight;
  if (period.sprint) {
    doc.text(`Sprint: ${period.sprint.name}`, margin, yPos);
    yPos += lineHeight;
  }
  doc.text(`Gerado em: ${meta?.generatedAt || new Date().toISOString()}`, margin, yPos);
  yPos += lineHeight * 2;
  
  // Linha separadora
  doc.setDrawColor(200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += lineHeight;
  
  // Métricas
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Métricas Consolidadas', margin, yPos);
  yPos += lineHeight * 1.5;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  // Defect Leakage
  doc.setFont('helvetica', 'bold');
  doc.text('Defect Leakage (Taxa de Escape):', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${metrics.defectLeakage.ratePercent.toFixed(2)}%`, margin + 80, yPos);
  yPos += lineHeight;
  doc.text(`  - Bugs de Produção: ${metrics.defectLeakage.productionBugs}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`  - Total Defeitos Válidos: ${metrics.defectLeakage.totalDefectsValid}`, margin, yPos);
  yPos += lineHeight * 1.5;
  
  // Defect Valid Rate
  doc.setFont('helvetica', 'bold');
  doc.text('Defect Valid Rate (Taxa de Acerto):', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${metrics.defectValidRate.ratePercent.toFixed(2)}%`, margin + 80, yPos);
  yPos += lineHeight;
  doc.text(`  - Defeitos Válidos: ${metrics.defectValidRate.validDefects}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`  - Total Reportados: ${metrics.defectValidRate.totalReported}`, margin, yPos);
  yPos += lineHeight * 1.5;
  
  // Defects Ratio
  doc.setFont('helvetica', 'bold');
  doc.text('Defects Ratio (objetivo: >10:1):', margin, yPos);
  doc.setFont('helvetica', 'normal');
  const { ratio, subBugsValid, bugsValid } = metrics.defectsRatio;
  let ratioValue, ratioStatus;
  if (bugsValid === 0 && subBugsValid > 0) {
    ratioValue = 'Infinito:1';
    ratioStatus = '[EXCELENTE] Nenhum bug de producao';
  } else if (bugsValid === 0 && subBugsValid === 0) {
    ratioValue = '-';
    ratioStatus = 'Sem defeitos no periodo';
  } else if (ratio !== null) {
    ratioValue = `${ratio.toFixed(1)}:1`;
    if (ratio >= 10) {
      ratioStatus = '[META ATINGIDA] Excelente deteccao no desenvolvimento';
    } else if (ratio >= 5) {
      ratioStatus = '[ATENCAO] Proximo da meta';
    } else {
      ratioStatus = '[CRITICO] Abaixo da meta';
    }
  } else {
    ratioValue = 'N/A';
    ratioStatus = 'Dados insuficientes';
  }
  doc.text(ratioValue, margin + 70, yPos);
  yPos += lineHeight;
  doc.text(`  Status: ${ratioStatus}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`  - Sub-Bugs (Desenvolvimento): ${subBugsValid}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`  - Bugs (Producao): ${bugsValid}`, margin, yPos);
  yPos += lineHeight * 2;
  
  // Capturar gráficos
  const chartsContainer = document.getElementById('chartsContainer');
  if (chartsContainer) {
    try {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Gráficos de Evolução', margin, yPos);
      yPos += lineHeight;
      
      const canvas = await html2canvas(chartsContainer, { 
        backgroundColor: null,
        scale: 2
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Verificar se cabe na página
      if (yPos + imgHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
      yPos += imgHeight + lineHeight;
    } catch (e) {
      console.error('Erro ao capturar gráficos:', e);
    }
  }
  
  // Status Time
  if (currentStatusTimeData) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Status Time', margin, yPos);
    yPos += lineHeight * 1.5;
    
    const { summary, issues } = currentStatusTimeData;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Issues analisadas: ${summary.count}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Total Ready to test: ${summary.totalReadyToTestHours.toFixed(2)}h`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Total In Test: ${summary.totalInTestHours.toFixed(2)}h`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Total Geral: ${summary.totalHours.toFixed(2)}h`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Média Ready to test: ${summary.avgReadyToTestHours.toFixed(2)}h`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Média In Test: ${summary.avgInTestHours.toFixed(2)}h`, margin, yPos);
    yPos += lineHeight * 2;
    
    // Top 10 issues
    doc.setFont('helvetica', 'bold');
    doc.text('Top 10 Issues por Tempo Total:', margin, yPos);
    yPos += lineHeight * 1.5;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const sortedIssues = [...issues].sort((a, b) => b.totalHours - a.totalHours).slice(0, 10);
    
    // Header da tabela
    doc.setFont('helvetica', 'bold');
    doc.text('Key', margin, yPos);
    doc.text('Ready (h)', margin + 30, yPos);
    doc.text('Test (h)', margin + 55, yPos);
    doc.text('Total (h)', margin + 80, yPos);
    doc.text('Status', margin + 105, yPos);
    yPos += lineHeight;
    
    doc.setFont('helvetica', 'normal');
    sortedIssues.forEach(issue => {
      if (yPos > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(issue.key, margin, yPos);
      doc.text(issue.readyToTestHours.toFixed(2), margin + 30, yPos);
      doc.text(issue.inTestHours.toFixed(2), margin + 55, yPos);
      doc.text(issue.totalHours.toFixed(2), margin + 80, yPos);
      doc.text(truncate(issue.currentStatus, 20), margin + 105, yPos);
      yPos += lineHeight;
    });
  }
  
  // Download
  const filename = `relatorio-qa-${project.key}-${new Date().toISOString().slice(0, 10)}.pdf`;
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
