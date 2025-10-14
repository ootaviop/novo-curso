/**
 * ═══════════════════════════════════════════════════════════════
 * 📜 HERO SCROLL BEHAVIOR
 * ═══════════════════════════════════════════════════════════════
 *
 * Sistema de scroll suave para a Hero section:
 * - Hero section ocupa 100vh
 * - Scroll em passadas de 100vh
 * - Botão "Ler aula" faz scroll para o conteúdo
 * - Comportamento de scroll otimizado
 *
 * @author CAEd - Equipe de Cursos
 * @version 1.0.0
 */

class HeroScrollManager {
  constructor() {
    this.isScrolling = false;
    this.currentSection = 0;
    this.sections = [];
    this.scrollTimeout = null;
    
    this.init();
  }

  init() {
    this.setupScrollBehavior();
    this.setupReadLessonButton();
    this.setupKeyboardNavigation();
    this.setupWheelNavigation();
  }

  setupScrollBehavior() {
    // Configura o comportamento de scroll suave
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Identifica as seções da página
    this.sections = this.identifySections();
    
    // Adiciona listener para scroll
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  identifySections() {
    const sections = [];
    
    // Hero section (sempre a primeira)
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
      sections.push({
        element: heroSection,
        start: 0,
        end: window.innerHeight
      });
    }
    
    // Seção de conteúdo
    const contentSection = document.querySelector('[data-content-start]');
    if (contentSection) {
      const rect = contentSection.getBoundingClientRect();
      sections.push({
        element: contentSection,
        start: window.innerHeight,
        end: window.innerHeight + rect.height
      });
    }
    
    return sections;
  }

  setupReadLessonButton() {
    const readBtn = document.getElementById('readLessonBtn');
    if (readBtn) {
      readBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.scrollToContent();
      });
    }
  }

  scrollToContent() {
    const contentSection = document.querySelector('[data-content-start]');
    if (contentSection) {
      contentSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Evita scroll duplo durante animação
      if (this.isScrolling) return;
      
      const currentScroll = window.pageYOffset;
      const viewportHeight = window.innerHeight;
      
      switch(e.key) {
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          // Só intercepta se estiver na hero section
          if (currentScroll < viewportHeight * 0.1) {
            e.preventDefault();
            this.scrollToContent();
          }
          break;
        case 'ArrowUp':
        case 'PageUp':
          // Só intercepta se estiver no conteúdo e quiser voltar para hero
          if (currentScroll > viewportHeight * 0.9) {
            e.preventDefault();
            this.scrollToHero();
          }
          break;
        case 'Home':
          e.preventDefault();
          this.scrollToHero();
          break;
      }
    });
  }

  setupWheelNavigation() {
    let wheelTimeout;
    
    window.addEventListener('wheel', (e) => {
      // Evita scroll duplo durante animação
      if (this.isScrolling) return;
      
      clearTimeout(wheelTimeout);
      
      wheelTimeout = setTimeout(() => {
        if (Math.abs(e.deltaY) > 50) { // Threshold para evitar scrolls pequenos
          const currentScroll = window.pageYOffset;
          const viewportHeight = window.innerHeight;
          
          // Aplica scroll de 100vh APENAS quando estiver na hero section (scroll < 10% da viewport)
          if (currentScroll < viewportHeight * 0.1 && e.deltaY > 0) {
            e.preventDefault();
            this.scrollToContent();
          }
          // Para o resto da página, usa scroll normal
          // (não intercepta scroll para cima ou quando já está no conteúdo)
        }
      }, 10);
    }, { passive: false }); // Mudei para false para permitir preventDefault
  }

  scrollToNext() {
    if (this.isScrolling) return;
    
    const currentScroll = window.pageYOffset;
    const viewportHeight = window.innerHeight;
    
    // Se estamos na hero section, vai para o conteúdo
    if (currentScroll < viewportHeight * 0.1) {
      this.scrollToContent();
    }
    // Para o resto da página, não interfere no scroll normal
  }

  scrollToPrevious() {
    if (this.isScrolling) return;
    
    const currentScroll = window.pageYOffset;
    const viewportHeight = window.innerHeight;
    
    // Se estamos no conteúdo, volta para a hero
    if (currentScroll > viewportHeight * 0.9) {
      this.scrollToHero();
    }
    // Para o resto da página, não interfere no scroll normal
  }

  scrollToHero() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    this.setScrollingState();
  }

  setScrollingState() {
    this.isScrolling = true;
    clearTimeout(this.scrollTimeout);
    
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
    }, 800); // Tempo baseado na duração do scroll suave
  }

  handleScroll() {
    // Atualiza o estado da seção atual
    const currentScroll = window.pageYOffset;
    const viewportHeight = window.innerHeight;
    
    // Detecta se estamos na hero section
    if (currentScroll < viewportHeight * 0.1) {
      this.currentSection = 0;
      document.body.classList.add('at-hero');
    } else {
      this.currentSection = 1;
      document.body.classList.remove('at-hero');
    }
  }

  // Método público para scroll programático
  scrollToSection(sectionIndex) {
    if (sectionIndex === 0) {
      this.scrollToHero();
    } else if (sectionIndex === 1) {
      this.scrollToContent();
    }
  }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new HeroScrollManager();
});

// Exporta para uso global se necessário
window.HeroScrollManager = HeroScrollManager;
