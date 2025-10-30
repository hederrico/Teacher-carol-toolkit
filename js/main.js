/**
 * Teacher Carol's Toolkit - JavaScript Principal
 * Funcionalidades para a homepage e interações
 */

// ============================================
// SCROLL HEADER
// ============================================

function initScrollHeader() {
  const header = document.querySelector('.header');
  
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// ============================================
// ANIMAÇÃO DE FADE-IN NOS CARDS
// ============================================

function initCardAnimations() {
  const cards = document.querySelectorAll('.tool-card');
  
  if (!cards.length) return;

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Adiciona a classe fade-in que tem a animação
        entry.target.classList.add('fade-in');
        // Define opacidade 1 após adicionar a classe
        entry.target.style.opacity = '1';
        
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  cards.forEach(card => {
    card.style.opacity = '0';
    observer.observe(card);
  });
}

// ============================================
// CONTADOR DE FERRAMENTAS
// ============================================

function updateToolCount() {
  const availableTools = document.querySelectorAll('.status-available').length;
  const comingSoonTools = document.querySelectorAll('.status-coming-soon').length;
  const totalTools = availableTools + comingSoonTools;

  // Atualiza elementos se existirem
  const countElement = document.querySelector('[data-tool-count]');
  if (countElement) {
    countElement.textContent = `${availableTools} de ${totalTools} ferramentas disponíveis`;
  }
}

// ============================================
// SMOOTH SCROLL PARA LINKS INTERNOS
// ============================================

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      
      if (href === '#') return;
      
      e.preventDefault();
      
      const target = document.querySelector(href);
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ============================================
// TRATAMENTO DE ERROS PARA LINKS INDISPONÍVEIS
// ============================================

function initComingSoonLinks() {
  const comingSoonCards = document.querySelectorAll('.tool-card');
  
  comingSoonCards.forEach(card => {
    const status = card.querySelector('.status-coming-soon');
    
    if (status) {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Esta ferramenta estará disponível em breve!', 'info');
      });
      
      // Adiciona cursor not-allowed
      card.style.cursor = 'not-allowed';
    }
  });
}

// ============================================
// SISTEMA DE NOTIFICAÇÕES
// ============================================

function showNotification(message, type = 'info') {
  // Remove notificação existente se houver
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Cria nova notificação
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${getNotificationIcon(type)}</span>
      <span class="notification-message">${message}</span>
    </div>
  `;

  // Adiciona estilos inline (caso não estejam no CSS)
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: white;
    padding: 1rem 1.5rem;
    border-radius: var(--border-radius-lg, 12px);
    box-shadow: var(--shadow-xl);
    z-index: 9999;
    animation: slideInRight 0.3s ease-out;
    max-width: 400px;
  `;

  document.body.appendChild(notification);

  // Remove após 4 segundos
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

function getNotificationIcon(type) {
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };
  return icons[type] || icons.info;
}

// ============================================
// ANALYTICS DE CLIQUES (preparado para futuro)
// ============================================

function trackToolClick(toolName) {
  // Placeholder para futura integração com Google Analytics ou similar
  console.log(`Ferramenta clicada: ${toolName}`);
  
  // Exemplo de como implementar no futuro:
  // if (typeof gtag !== 'undefined') {
  //   gtag('event', 'tool_click', {
  //     'event_category': 'engagement',
  //     'event_label': toolName
  //   });
  // }
}

// ============================================
// MODO ESCURO (preparado para futuro)
// ============================================

function initThemeToggle() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themeToggle = document.querySelector('[data-theme-toggle]');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }
}

// ============================================
// BUSCA/FILTRO DE FERRAMENTAS (preparado para futuro)
// ============================================

function initToolSearch() {
  const searchInput = document.querySelector('[data-tool-search]');
  
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const toolCards = document.querySelectorAll('.tool-card');

    toolCards.forEach(card => {
      const title = card.querySelector('.tool-title').textContent.toLowerCase();
      const description = card.querySelector('.tool-description').textContent.toLowerCase();
      
      const matches = title.includes(searchTerm) || description.includes(searchTerm);
      
      card.style.display = matches ? 'flex' : 'none';
    });
  });
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Teacher Carol\'s Toolkit carregado!');
  
  // Inicializa todas as funcionalidades
  initScrollHeader();
  initCardAnimations();
  initSmoothScroll();
  initComingSoonLinks();
  updateToolCount();
  initThemeToggle();
  initToolSearch();

  // Adiciona listeners de analytics nos cards disponíveis
  document.querySelectorAll('.tool-card .status-available').forEach(card => {
    const toolCard = card.closest('.tool-card');
    const toolName = toolCard.querySelector('.tool-title').textContent;
    
    toolCard.addEventListener('click', () => {
      trackToolClick(toolName);
    });
  });
});

// ============================================
// ANIMAÇÕES CSS ADICIONAIS
// ============================================

// Adiciona animações via JavaScript se necessário
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
