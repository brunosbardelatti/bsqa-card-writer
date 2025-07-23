import { loadCommonComponents, loadThemeFromConfig } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadCommonComponents();
  loadThemeFromConfig();
  
  // Adicionar animações e interações específicas da home
  addHomeInteractions();
});

function addHomeInteractions() {
  // Adicionar efeitos hover nos cards
  const cards = document.querySelectorAll('.feature-card, .type-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px)';
      card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
    });
  });



  // Adicionar scroll suave para seções
  const sections = document.querySelectorAll('.hero-section, .quick-actions, .analysis-types, .features');
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
  });

  // Adicionar contador de funcionalidades
  animateCounters();
}

function animateCounters() {
  // Simular contador de tipos de análise
  const analysisTypes = document.querySelectorAll('.type-card');
  const typesCount = analysisTypes.length;
  
  // Encontrar elemento que mostra o número de tipos (se existir)
  const typesText = document.querySelector('.hero-features .feature-card:nth-child(4) p');
  if (typesText) {
    typesText.textContent = `${typesCount} tipos diferentes de análise`;
  }
}

// Função para adicionar efeito de destaque nos cards de tipo de análise
export function highlightAnalysisType(typeName) {
  const typeCards = document.querySelectorAll('.type-card');
  typeCards.forEach(card => {
    const cardTitle = card.querySelector('h4');
    if (cardTitle && cardTitle.textContent.includes(typeName)) {
      card.style.border = '2px solid var(--accent-color)';
      card.style.transform = 'scale(1.05)';
      
      setTimeout(() => {
        card.style.border = '';
        card.style.transform = '';
      }, 2000);
    }
  });
}

// Função para mostrar estatísticas de uso (futuro)
export function showUsageStats() {
  // Esta função pode ser implementada no futuro para mostrar estatísticas
  console.log('Estatísticas de uso serão implementadas em versões futuras');
} 