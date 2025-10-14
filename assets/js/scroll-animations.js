/**
 * ═══════════════════════════════════════════════════════════════
 * ✨ SISTEMA DE ANIMAÇÕES DE SCROLL - ANIME.JS
 * ═══════════════════════════════════════════════════════════════
 * 
 * Sistema de revelação progressiva de conteúdo ao scroll.
 * Usa IntersectionObserver para performance otimizada.
 * 
 * @requires anime.js
 * @version 1.0.0
 */

class ScrollReveal {
  constructor(config = {}) {
    this.config = {
      // IntersectionObserver
      threshold: 0.15,
      rootMargin: '0px 0px -2% 0px',
      
      // Animações
      duration: {
        fast: 600,
        medium: 800,
        slow: 1000
      },
      
      easing: 'easeOutCubic',
      staggerDelay: 80,
      
      // Seletores
      selectors: {
        paragraphs: 'section p, .content-wrapper p',
        callouts: '.callout-quote-author, .callout-note, .callout-reflection',
        headings: 'h1, h2, h3',
        breadcrumb: '.breadcrumb',
        navFooter: '.nav-lessons',
        audioButtons: '.audio-trigger-container'
      },
      
      ...config
    };
    
    this.observer = null;
    this.animatedElements = new Set();
    
    this.init();
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * 🚀 INICIALIZAÇÃO
   * ═══════════════════════════════════════════════════════════
   */
  init() {
    // Aguarda DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }
  
  setup() {
    // Prepara elementos (estado inicial)
    this.prepareElements();
    
    // Cria observer
    this.createObserver();
    
    // Observa elementos
    this.observeElements();
    
    console.log('✅ ScrollReveal: Sistema de animações ativado');
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * 🎨 PREPARAÇÃO DE ELEMENTOS (Estado Inicial)
   * ═══════════════════════════════════════════════════════════
   */
  prepareElements() {
    const { selectors } = this.config;
    
    // Parágrafos
    document.querySelectorAll(selectors.paragraphs).forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
    });
    
    // Callouts
    document.querySelectorAll(selectors.callouts).forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'scale(0.95)';
    });
    
    // Títulos
    document.querySelectorAll(selectors.headings).forEach(el => {
      const tagName = el.tagName.toLowerCase();
      el.style.opacity = '0';
      // Define translateY inicial baseado no tipo de título
      const translateY = tagName === 'h1' ? '8px' : tagName === 'h2' ? '6px' : '5px';
      el.style.transform = `translateY(${translateY})`;
    });
    
    // Breadcrumb
    const breadcrumb = document.querySelector(selectors.breadcrumb);
    if (breadcrumb) {
      breadcrumb.style.opacity = '0';
      breadcrumb.style.transform = 'translateX(-30px)';
    }
    
    // Nav Footer
    const navFooter = document.querySelector(selectors.navFooter);
    if (navFooter) {
      navFooter.style.opacity = '0';
      navFooter.style.transform = 'translateY(20px)';
    }
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * 👁️ CRIAÇÃO DO INTERSECTION OBSERVER
   * ═══════════════════════════════════════════════════════════
   */
  createObserver() {
    const options = {
      threshold: this.config.threshold,
      rootMargin: this.config.rootMargin
    };
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
          this.animateElement(entry.target);
          this.animatedElements.add(entry.target);
          this.observer.unobserve(entry.target); // Anima apenas uma vez
        }
      });
    }, options);
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * 🔍 OBSERVAÇÃO DE ELEMENTOS
   * ═══════════════════════════════════════════════════════════
   */
  observeElements() {
    const { selectors } = this.config;
    
    // Combina todos os seletores
    const allSelectors = Object.values(selectors).join(', ');
    const elements = document.querySelectorAll(allSelectors);
    
    elements.forEach(el => {
      this.observer.observe(el);
    });
    
    console.log(`📊 Observando ${elements.length} elementos para animação`);
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * ✨ ANIMAÇÃO DE ELEMENTO
   * ═══════════════════════════════════════════════════════════
   */
  animateElement(element) {
    const { selectors, duration, easing, staggerDelay } = this.config;
    
    // Identifica tipo de elemento
    if (element.matches(selectors.paragraphs)) {
      this.animateParagraph(element);
    } else if (element.matches(selectors.callouts)) {
      this.animateCallout(element);
    } else if (element.matches(selectors.headings)) {
      this.animateHeading(element);
    } else if (element.matches(selectors.breadcrumb)) {
      this.animateBreadcrumb(element);
    } else if (element.matches(selectors.navFooter)) {
      this.animateNavFooter(element);
    }
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * 📝 ANIMAÇÃO: PARÁGRAFOS
   * ═══════════════════════════════════════════════════════════
   * Fade in + slide up com stagger entre parágrafos consecutivos
   */
  animateParagraph(element) {
    // Calcula delay baseado na posição do parágrafo na section
    const section = element.closest('section, .content-wrapper');
    if (!section) {
      this.animateSingleParagraph(element, 0);
      return;
    }
    
    // Busca todos os parágrafos dentro da section
    const paragraphsInSection = Array.from(section.querySelectorAll('p'));
    const index = paragraphsInSection.indexOf(element);
    const delay = index * this.config.staggerDelay;
    
    this.animateSingleParagraph(element, delay);
  }
  
  animateSingleParagraph(element, delay) {
    anime({
      targets: element,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: this.config.duration.medium,
      easing: this.config.easing,
      delay: delay
    });
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * 💬 ANIMAÇÃO: CALLOUTS
   * ═══════════════════════════════════════════════════════════
   * Scale + fade com delay para criar profundidade
   */
  animateCallout(element) {
    anime({
      targets: element,
      opacity: [0, 1],
      scale: [0.95, 1],
      duration: this.config.duration.medium,
      easing: this.config.easing,
      delay: 150
    });
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * 📌 ANIMAÇÃO: TÍTULOS
   * ═══════════════════════════════════════════════════════════
   * Fade in suave com leve movimento vertical - muito sutil
   */
  animateHeading(element) {
    const tagName = element.tagName.toLowerCase();
    let duration, delay, translateY;
    
    // Hierarquia: h1 mais suave, h3 quase imperceptível
    switch (tagName) {
      case 'h1':
        duration = this.config.duration.medium;
        delay = 100;
        translateY = 8;
        break;
      case 'h2':
        duration = this.config.duration.fast;
        delay = 80;
        translateY = 6;
        break;
      case 'h3':
        duration = this.config.duration.fast;
        delay = 60;
        translateY = 5;
        break;
      default:
        duration = this.config.duration.fast;
        delay = 0;
        translateY = 5;
    }
    
    anime({
      targets: element,
      opacity: [0, 1],
      translateY: [translateY, 0],
      duration: duration,
      easing: 'easeOutQuad', // Easing mais suave que cubic
      delay: delay
    });
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * 🍞 ANIMAÇÃO: BREADCRUMB
   * ═══════════════════════════════════════════════════════════
   * Slide from left com fade
   */
  animateBreadcrumb(element) {
    anime({
      targets: element,
      opacity: [0, 1],
      translateX: [-30, 0],
      duration: this.config.duration.medium,
      easing: this.config.easing,
      delay: 200
    });
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * 🧭 ANIMAÇÃO: NAVEGAÇÃO FOOTER
   * ═══════════════════════════════════════════════════════════
   * Slide up com fade, stagger nos itens
   */
  animateNavFooter(element) {
    const navItems = element.querySelectorAll('.nav-item');
    
    // Anima container
    anime({
      targets: element,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: this.config.duration.fast,
      easing: this.config.easing
    });
    
    // Anima itens com stagger
    if (navItems.length > 0) {
      anime({
        targets: navItems,
        opacity: [0, 1],
        translateY: [15, 0],
        duration: this.config.duration.fast,
        easing: this.config.easing,
        delay: anime.stagger(100, { start: 200 })
      });
    }
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * 🧹 LIMPEZA
   * ═══════════════════════════════════════════════════════════
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.animatedElements.clear();
    console.log('🧹 ScrollReveal: Sistema desativado');
  }
}

// ═══════════════════════════════════════════════════════════════
// 🚀 INICIALIZAÇÃO AUTOMÁTICA
// ═══════════════════════════════════════════════════════════════

let scrollReveal;

// Aguarda anime.js estar carregado
if (typeof anime !== 'undefined') {
  scrollReveal = new ScrollReveal();
} else {
  console.error('❌ ScrollReveal: anime.js não encontrado. Carregue anime.js antes deste script.');
}

// Exporta para uso global
window.ScrollReveal = ScrollReveal;
window.scrollReveal = scrollReveal;

