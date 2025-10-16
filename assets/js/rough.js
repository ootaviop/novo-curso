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

    this.shownElements = new Set();
    this.tooltipInstances = new Map();
    this.viewportDelay = 1000; // Delay de 1 segundo após aparecer na viewport

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
    entries.forEach(entry => {
      if (entry.isIntersecting && !this.shownElements.has(entry.target)) {
        const element = entry.target;
        const item = this.annotationMap.get(element);

        if (!item) return;

        // Aguarda 1 segundo e então mostra a annotation
        setTimeout(() => {
          // Verifica novamente se ainda não foi mostrado (evita duplicatas)
          if (!this.shownElements.has(element)) {
            item.annotation.show();
            this.shownElements.add(element);
            this.initializeTooltip(element);

            // Para de observar este elemento
            if (this.observer) {
              this.observer.unobserve(element);
            }
          }
        }, this.viewportDelay);
      }
    });
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

  /**
   * Recria todas as annotations que já foram mostradas
   * Útil quando o layout dos elementos mudou (ex: padding do audio-highlight)
   */
  refresh() {
    console.log('[RoughAnnotationSystem] 🔄 Iniciando refresh das annotations...');
    
    // Coleta elementos que já foram mostrados
    const elementsToRefresh = Array.from(this.shownElements);
    
    if (elementsToRefresh.length === 0) {
      console.log('[RoughAnnotationSystem] Nenhuma annotation para refresh');
      return;
    }

    // Remove annotations antigas
    elementsToRefresh.forEach(element => {
      this.destroyAnnotation(element);
    });

    // Recria annotations com novas posições
    elementsToRefresh.forEach(element => {
      // Encontra a classe original do elemento
      const className = this.findAnnotationClass(element);
      if (className) {
        this.createAnnotation(element, className);
        // Marca como mostrado imediatamente (sem animação)
        const item = this.annotationMap.get(element);
        if (item) {
          item.annotation.show();
          this.shownElements.add(element);
        }
      }
    });

    console.log(`[RoughAnnotationSystem] ✅ Refresh concluído para ${elementsToRefresh.length} annotations`);
  }

  /**
   * Destrói uma annotation específica (SVG + referências)
   */
  destroyAnnotation(element) {
    const item = this.annotationMap.get(element);
    if (item && item.annotation) {
      // Remove o SVG do DOM
      const svg = element.parentNode?.querySelector('svg[class*="rough-annotation"]');
      if (svg && svg.parentNode) {
        svg.parentNode.removeChild(svg);
      }
    }

    // Remove das estruturas de controle
    this.annotationMap.delete(element);
    this.shownElements.delete(element);
    
    // Remove tooltip se existir
    if (this.tooltipInstances.has(element)) {
      const tippyInstance = this.tooltipInstances.get(element);
      if (tippyInstance && tippyInstance.destroy) {
        tippyInstance.destroy();
      }
      this.tooltipInstances.delete(element);
    }

    // Para de observar o elemento
    if (this.observer) {
      this.observer.unobserve(element);
    }
  }

  /**
   * Encontra qual classe de annotation um elemento possui
   */
  findAnnotationClass(element) {
    for (const className of Object.keys(this.annotationTypes)) {
      if (element.classList.contains(className)) {
        return className;
      }
    }
    return null;
  }
}

// Auto-inicialização
const roughAnnotationSystem = new RoughAnnotationSystem();
window.roughAnnotationSystem = roughAnnotationSystem;
