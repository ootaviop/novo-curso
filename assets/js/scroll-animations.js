/**
 * ═══════════════════════════════════════════════════════════════
 * ✨ SISTEMA DE ANIMAÇÕES DE SCROLL - ANIME.JS
 * ═══════════════════════════════════════════════════════════════
 * 
 * Sistema de revelação progressiva de conteúdo ao scroll.
 * Usa IntersectionObserver para performance otimizada.
 * 
 * @requires anime.js
 * @version 2.0.0 (Simplificado)
 */

class ScrollReveal {
  constructor(config = {}) {
    this.config = {
      // IntersectionObserver
      threshold: 0.15,
      rootMargin: '0px 0px -2% 0px',
      
      // Durações
      duration: {
        fast: 600,
        medium: 800
      },
      
      // Easings customizadas
      easings: {
        heading: 'cubicBezier(0.33, 1, 0.68, 1)',
        paragraph: 'cubicBezier(0.25, 1, 0.5, 1)',
        callout: 'cubicBezier(0.34, 1.2, 0.64, 1)',
        navigation: 'easeOutCubic',
      },
      
      // Seletores
      selectors: {
        paragraphs: 'section p, .content-wrapper p',
        callouts: '.callout-quote-author, .callout-note, .callout-reflection',
        headings: 'h1, h2, h3',
        breadcrumb: '.breadcrumb',
        navFooter: '.nav-lessons'
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
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }
  
  setup() {
    this.prepareElements();
    this.createObserver();
    this.observeElements();
    
    console.log('✅ ScrollReveal: Sistema ativado');
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * 🎨 PREPARAÇÃO DE ELEMENTOS (Estado Inicial)
   * ═══════════════════════════════════════════════════════════
   */
  prepareElements() {
    const { selectors } = this.config;
    
    // Aplica estado inicial para TODOS os elementos animáveis
    const allElements = document.querySelectorAll(
      `${selectors.paragraphs}, ${selectors.callouts}, ${selectors.headings}, ${selectors.breadcrumb}`
    );
    
    allElements.forEach(el => {
      el.style.opacity = '0';
      
      // Define transform baseado no tipo
      if (el.matches(selectors.callouts)) {
        el.style.transform = 'scale(0.92)';
      } else if (el.matches(selectors.breadcrumb)) {
        el.style.transform = 'translateX(-30px)';
      } else {
        el.style.transform = 'translateY(20px)';
      }
    });
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * 👁️ CRIAÇÃO DO INTERSECTION OBSERVER
   * ═══════════════════════════════════════════════════════════
   */
  createObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
          this.animateElement(entry.target);
          this.animatedElements.add(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: this.config.threshold,
      rootMargin: this.config.rootMargin
    });
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * 🔍 OBSERVAÇÃO DE ELEMENTOS
   * ═══════════════════════════════════════════════════════════
   */
  observeElements() {
    const { selectors } = this.config;
    const allSelectors = Object.values(selectors).join(', ');
    const elements = document.querySelectorAll(allSelectors);
    
    elements.forEach(el => this.observer.observe(el));
    
    console.log(`📊 Observando ${elements.length} elementos`);
  }
  
  /**
   * ═══════════════════════════════════════════════════════════
   * ✨ ANIMAÇÃO DE ELEMENTO (Router)
   * ═══════════════════════════════════════════════════════════
   */
  animateElement(element) {
    const { selectors } = this.config;
    
    if (element.matches(selectors.paragraphs)) {
      this.animateParagraphs(element);
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
   * 📝 ANIMAÇÕES ESPECÍFICAS
   * ═══════════════════════════════════════════════════════════
   */
  
  animateParagraphs(element) {
    // Pega todos os parágrafos da mesma section para stagger
    const section = element.closest('section, .content-wrapper');
    const paragraphs = section 
      ? Array.from(section.querySelectorAll(this.config.selectors.paragraphs))
      : [element];
    
    const index = paragraphs.indexOf(element);
    
    anime({
      targets: element,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: this.config.duration.medium,
      easing: this.config.easings.paragraph,
      delay: index * 100 // Stagger simplificado
    });
  }
  
  animateCallout(element) {
    anime({
      targets: element,
      opacity: [0, 1],
      scale: [0.92, 1],
      duration: this.config.duration.medium,
      easing: this.config.easings.callout,
      delay: 150
    });
  }
  
  animateHeading(element) {
    anime({
      targets: element,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: this.config.duration.fast,
      easing: this.config.easings.heading,
      delay: 100
    });
  }
  
  animateBreadcrumb(element) {
    anime({
      targets: element,
      opacity: [0, 1],
      translateX: [-30, 0],
      duration: this.config.duration.medium,
      easing: this.config.easings.navigation,
      delay: 200
    });
  }
  
  animateNavFooter(element) {
    const navItems = element.querySelectorAll('.nav-item');
    
    // Se não tem itens, anima o container inteiro
    if (navItems.length === 0) {
      anime({
        targets: element,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: this.config.duration.fast,
        easing: this.config.easings.navigation
      });
      return;
    }
    
    // Se tem itens, anima só eles com stagger
    anime({
      targets: navItems,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: this.config.duration.fast,
      easing: this.config.easings.navigation,
      delay: anime.stagger(100, { start: 200 })
    });
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
    console.log('🧹 ScrollReveal: Desativado');
  }
}

// ═══════════════════════════════════════════════════════════════
// 🚀 INICIALIZAÇÃO AUTOMÁTICA
// ═══════════════════════════════════════════════════════════════

let scrollReveal;

if (typeof anime !== 'undefined') {
  scrollReveal = new ScrollReveal();
} else {
  console.error('❌ ScrollReveal: anime.js não encontrado');
}

window.ScrollReveal = ScrollReveal;
window.scrollReveal = scrollReveal;