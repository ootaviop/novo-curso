/**
 * ROUGH NOTATION - Sistema de anotações com tooltips
 * 
 * CLASSES DISPONÍVEIS:
 * .cls-underline   → Sublinhado
 * .cls-box         → Caixa ao redor
 * .cls-circle      → Círculo ao redor
 * .cls-highlight   → Marcador (fundo)
 * .cls-strike      → Riscado (linha única no meio)
 * .cls-crossed     → Riscado (X cruzado)
 * .cls-bracket     → Colchetes nas laterais
 *
 * USO BÁSICO:
 * <span class="cls-underline">texto</span>
 * <span class="cls-highlight">texto</span>
 *
 * USO COM TOOLTIP:
 * <span class="cls-underline" data-tooltip="Informação adicional">texto</span>
 * <span class="cls-highlight" data-tooltip="Este é um destaque importante">texto</span>
 *
 * REQUISITOS:
 * - Rough Notation library carregada
 * - Tippy.js e Popper.js carregadas (para tooltips)
 */

class RoughAnnotationSystem {
  constructor() {
    this.annotationMap = new Map();
    this.observer = null;
    const w = window.innerWidth;
    w >= 1920 ? (this.strokeWidth = 3.2) : (this.strokeWidth = 2);

    this.queue = [];
    this.isProcessingQueue = false;
    this.shownElements = new Set();
    this.tooltipInstances = new Map();

    const colors = {
      base: "var(--rough-notation-base)",
      solidOrange: "var(--rough-notation-solid-orange)",
      solidGreen: "var(--rough-notation-solid-green)",
      solidBlue: "var(--rough-notation-solid-blue)",
      solidPurple: "var(--rough-notation-solid-purple)",
      solidRed: "var(--rough-notation-solid-red)",
      solidYellow: "var(--rough-notation-solid-yellow)",
      softOrange: "var(--rough-notation-soft-orange)",
      softGreen: "var(--rough-notation-soft-green)",
      softBlue: "var(--rough-notation-soft-blue)",
      softPurple: "var(--rough-notation-soft-purple)",
      softRed: "var(--rough-notation-soft-red)",
      softYellow: "var(--rough-notation-soft-yellow)",
    };

    this.annotationTypes = {
      "cls-underline": {
        type: "underline",
        multiline: true,
        strokeWidth: this.strokeWidth,
        animationDuration: 800,
        color: colors.solidOrange,
      },
      "cls-box": {
        type: "box",
        multiline: true,
        strokeWidth: this.strokeWidth,
        padding: 6,
        animationDuration: 1000,
        color: colors.solidGreen,
      },
      "cls-circle": {
        type: "circle",
        multiline: true,
        strokeWidth: this.strokeWidth,
        padding: 8,
        animationDuration: 800,
        color: colors.solidBlue,
      },
      "cls-highlight": {
        type: "highlight",
        strokeWidth: this.strokeWidth,
        multiline: true,
        animationDuration: 1000,
        color: colors.softYellow,
      },
      "cls-strike": {
        type: "strike-through",
        multiline: true,
        strokeWidth: this.strokeWidth,
        animationDuration: 500,
        color: colors.solidGreen,
      },
      "cls-crossed": {
        type: "crossed-off",
        multiline: true,
        strokeWidth: this.strokeWidth,
        animationDuration: 600,
        color: colors.solidRed,
      },
      "cls-bracket": {
        type: "bracket",
        multiline: true,
        strokeWidth: this.strokeWidth,
        brackets: ["left", "right"],
        animationDuration: 700,
        color: colors.solidOrange,
      },
    };

    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    if (typeof RoughNotation === "undefined") {
      console.error("[RoughAnnotationSystem] Rough Notation library não encontrada.");
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: 0.15,
        rootMargin: "0px 0px -5% 0px"
      }
    );

    this.processAllElements();
    console.log(`[RoughAnnotationSystem] Inicializado com ${this.annotationMap.size} anotações`);
  }

  processAllElements() {
    Object.keys(this.annotationTypes).forEach((className) => {
      const elements = document.querySelectorAll(`.${className}`);
      elements.forEach((element) => {
        this.createAnnotation(element, className);
      });
    });
  }

  createAnnotation(element, className) {
    const config = this.annotationTypes[className];

    if (!config) {
      console.warn(`[RoughAnnotationSystem] Classe "${className}" não reconhecida`);
      return;
    }

    const baseColor = this.getBaseColor(element, config);
    const color = config.type === "highlight" 
      ? this.adjustColorForHighlight(baseColor)
      : baseColor;

    const annotation = RoughNotation.annotate(element, {
      ...config,
      color: color,
    });

    this.annotationMap.set(element, {
      annotation,
      duration: config.animationDuration,
    });

    this.observer.observe(element);
  }

  getBaseColor(element, config) {
    if (element.dataset.color) {
      return element.dataset.color.trim();
    }
    return config.color;
  }

  adjustColorForHighlight(color) {
    if (color.startsWith("rgba")) {
      return color;
    }

    if (color.startsWith("#")) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, 0.3)`;
    }

    if (color.startsWith("rgb(")) {
      return color.replace("rgb(", "rgba(").replace(")", ", 0.3)");
    }

    return color;
  }

  handleIntersection(entries) {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .map((e) => e.target)
      .filter((el) => this.annotationMap.has(el) && !this.shownElements.has(el));

    if (visible.length === 0) return;

    visible.sort(
      (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top
    );

    for (const el of visible) {
      if (!this.queue.includes(el)) {
        this.queue.push(el);
      }
    }

    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  async processQueue() {
    this.isProcessingQueue = true;
    while (this.queue.length > 0) {
      const el = this.queue.shift();
      const item = this.annotationMap.get(el);
      if (!item) continue;
      if (this.shownElements.has(el)) continue;

      const scrollAnimDelay = this.calculateScrollAnimationDelay(el);
      
      if (scrollAnimDelay > 0) {
        await this.sleep(scrollAnimDelay);
      }

      item.annotation.show();
      this.shownElements.add(el);

      this.initializeTooltip(el);

      if (this.observer) {
        this.observer.unobserve(el);
      }

      const waitMs = (item.duration || 800) + 50;
      await this.sleep(waitMs);
    }
    this.isProcessingQueue = false;
  }

  /**
   * Calcula delay otimizado para sincronizar com animação de scroll
   * Inicia rough notation durante a animação de scroll (40% do progresso)
   */
  calculateScrollAnimationDelay(element) {
    const SCROLL_ANIM_DURATION = 800;
    const SCROLL_STAGGER = 80;
    const OVERLAP_PERCENTAGE = 0.4; // Inicia após 40% da animação de scroll
    
    const animatedParent = element.closest('section p, .content-wrapper p, .callout-quote-author, .callout-note, .callout-reflection, h1, h2, h3');
    
    if (!animatedParent) {
      return 0;
    }
    
    if (animatedParent.matches('p')) {
      const section = animatedParent.closest('section, .content-wrapper');
      if (section) {
        const paragraphsInSection = Array.from(section.querySelectorAll('p'));
        const index = paragraphsInSection.indexOf(animatedParent);
        const staggerDelay = index * SCROLL_STAGGER;
        return (SCROLL_ANIM_DURATION * OVERLAP_PERCENTAGE) + staggerDelay;
      }
      return SCROLL_ANIM_DURATION * OVERLAP_PERCENTAGE;
    }
    
    if (animatedParent.matches('.callout-quote-author, .callout-note, .callout-reflection')) {
      return (SCROLL_ANIM_DURATION * OVERLAP_PERCENTAGE) + 150;
    }
    
    if (animatedParent.matches('h1')) {
      return (SCROLL_ANIM_DURATION * OVERLAP_PERCENTAGE) + 100;
    }
    if (animatedParent.matches('h2, h3')) {
      return (600 * OVERLAP_PERCENTAGE) + 80;
    }
    
    return 0;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  initializeTooltip(element) {
    const tooltipContent = element.getAttribute('data-tooltip');
    if (!tooltipContent) return;

    if (typeof tippy === 'undefined') {
      console.warn('[RoughAnnotationSystem] Tippy.js não encontrada. Tooltips não serão exibidas.');
      return;
    }

    if (this.tooltipInstances.has(element)) {
      return;
    }

    const tippyInstance = tippy(element, {
      content: tooltipContent,
      placement: 'top',
      followCursor: true,
      animation: 'fade',
      theme: 'orange-rounded',
      arrow: false,
      interactive: false,
      delay: [200, 0],
      popperOptions: {
        modifiers: [
          {
            name: 'flip',
            options: {
              fallbackPlacements: ['bottom', 'left', 'right'],
            },
          },
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
            },
          },
        ],
      },
    });

    this.tooltipInstances.set(element, tippyInstance);
  }
}

// Auto-inicialização
const roughAnnotationSystem = new RoughAnnotationSystem();
window.roughAnnotationSystem = roughAnnotationSystem;
