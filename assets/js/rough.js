/**
 * ═══════════════════════════════════════════════════════════════
 * 🖍️ ROUGH NOTATION - SISTEMA COMPLETO COM TOOLTIPS
 * ═══════════════════════════════════════════════════════════════
 *
 * CLASSES DISPONÍVEIS:
 *
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
 * Todos usam var(--base) como cor e aparecem 200px antes da viewport.
 * Tooltips aparecem automaticamente após a animação da anotação.
 *
 * REQUISITOS:
 * - Rough Notation library carregada
 * - Tippy.js e Popper.js carregadas (para tooltips)
 * - Variável CSS --base definida
 */

class RoughAnnotationSystem {
  constructor() {
    this.annotationMap = new Map();
    this.observer = null;
    const w = window.innerWidth;
    w >= 1920 ? (this.strokeWidth = 3.2) : (this.strokeWidth = 2);

    // Fila global e controle de execução sequencial
    this.queue = [];
    this.isProcessingQueue = false;
    this.shownElements = new Set();
    
    // Mapa de instâncias de tooltips
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

  /**
   * Inicializa o sistema
   */
  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setup());
    } else {
      this.setup();
    }
  }

  /**
   * Configura o observer e processa elementos
   */
  setup() {
    // Valida se Rough Notation está disponível
    if (typeof RoughNotation === "undefined") {
      console.error(
        "[RoughAnnotationSystem] Rough Notation library não encontrada."
      );
      console.error(
        'Adicione: <script src="https://unpkg.com/rough-notation@0.5.1/lib/rough-notation.iife.js"></script>'
      );
      return;
    }

    // Cria o Intersection Observer
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: 0.15,               // Alinhado com scroll-animations
        rootMargin: "0px 0px -5% 0px"  // Elemento bem posicionado para leitura
      }
    );

    // Processa todos os elementos
    this.processAllElements();

    console.log(
      `[RoughAnnotationSystem] ✓ Inicializado com ${this.annotationMap.size} anotações`
    );
  }

  /**
   * Processa todos os elementos com classes de anotação
   */
  processAllElements() {
    // Para cada tipo de anotação
    Object.keys(this.annotationTypes).forEach((className) => {
      const elements = document.querySelectorAll(`.${className}`);

      elements.forEach((element) => {
        this.createAnnotation(element, className);
      });
    });
  }

  /**
   * Cria uma anotação para um elemento específico
   */
  createAnnotation(element, className) {
    // Pega configuração do tipo
    const config = this.annotationTypes[className];

    if (!config) {
      console.warn(
        `[RoughAnnotationSystem] Classe "${className}" não reconhecida`
      );
      return;
    }

    // Obtém a cor
    const baseColor = this.getBaseColor(element, config);

    // Para highlight, usa cor com transparência
    const color =
      config.type === "highlight"
        ? this.adjustColorForHighlight(baseColor)
        : baseColor;

    // Cria a anotação (mas NÃO mostra ainda)
    const annotation = RoughNotation.annotate(element, {
      ...config,
      color: color,
    });

    // Armazena no Map com duração para controle de delay
    this.annotationMap.set(element, {
      annotation,
      duration: config.animationDuration,
    });

    // Começa a observar
    this.observer.observe(element);
  }

  getBaseColor(element, config) {
    // 1️⃣ Se existir data-color
    if (element.dataset.color) {
      return element.dataset.color.trim();
    }

    // 2️⃣ Se existir cor inline
    // const inlineColor = element.style.color;
    // if (inlineColor) {
    //     return inlineColor.trim();
    // }

    // 3️⃣ Fallback para cor padrão
    return config.color;
  }

  /**
   * Ajusta cor para highlight (adiciona transparência)
   */
  adjustColorForHighlight(color) {
    // Se já é rgba, retorna
    if (color.startsWith("rgba")) {
      return color;
    }

    // Se é hex, converte para rgba com alpha 0.3
    if (color.startsWith("#")) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, 0.3)`;
    }

    // Se é rgb, adiciona alpha
    if (color.startsWith("rgb(")) {
      return color.replace("rgb(", "rgba(").replace(")", ", 0.3)");
    }

    // Fallback
    return color;
  }

  /**
   * Lida com intersecções
   */
  handleIntersection(entries) {
    // Coleta elementos visíveis nesta batelada
    const visible = entries
      .filter((e) => e.isIntersecting)
      .map((e) => e.target)
      .filter(
        (el) => this.annotationMap.has(el) && !this.shownElements.has(el)
      );

    if (visible.length === 0) return;

    // Ordena por posição Y na viewport para sequência visual
    visible.sort(
      (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top
    );

    // Enfileira, evitando duplicatas
    for (const el of visible) {
      if (!this.queue.includes(el)) {
        this.queue.push(el);
      }
    }

    // Inicia processamento sequencial, se necessário
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

      // ✨ CALCULA DELAY baseado na animação de scroll do elemento pai
      const scrollAnimDelay = this.calculateScrollAnimationDelay(el);
      
      if (scrollAnimDelay > 0) {
        await this.sleep(scrollAnimDelay);
      }

      // Executa a animação
      item.annotation.show();
      this.shownElements.add(el);

      // Inicializa tooltip se disponível
      this.initializeTooltip(el);

      // Depois de mostrar, não observar mais
      if (this.observer) {
        this.observer.unobserve(el);
      }

      // Aguarda duração da animação + 50ms
      const waitMs = (item.duration || 800) + 50;
      await this.sleep(waitMs);
    }
    this.isProcessingQueue = false;
  }

  /**
   * Calcula delay necessário para aguardar animação de scroll do elemento pai
   * @param {HTMLElement} element - Elemento com rough notation
   * @returns {number} - Delay em ms
   */
  calculateScrollAnimationDelay(element) {
    // Configurações do ScrollReveal (sincronizadas)
    const SCROLL_ANIM_DURATION = 800; // duration.medium do scroll-animations.js
    const SCROLL_STAGGER = 80; // staggerDelay do scroll-animations.js
    const SAFETY_MARGIN = 100; // margem de segurança
    
    // Verifica se elemento está dentro de um parágrafo animado
    const animatedParent = element.closest('section p, .content-wrapper p, .callout-quote-author, .callout-note, .callout-reflection, h1, h2, h3');
    
    if (!animatedParent) {
      return 0; // Não está dentro de elemento animado
    }
    
    // Se está em um parágrafo, calcula stagger baseado na posição
    if (animatedParent.matches('p')) {
      const section = animatedParent.closest('section, .content-wrapper');
      if (section) {
        const paragraphsInSection = Array.from(section.querySelectorAll('p'));
        const index = paragraphsInSection.indexOf(animatedParent);
        const staggerDelay = index * SCROLL_STAGGER;
        return SCROLL_ANIM_DURATION + staggerDelay + SAFETY_MARGIN;
      }
      return SCROLL_ANIM_DURATION + SAFETY_MARGIN;
    }
    
    // Se está em callout, usa delay fixo de 150ms + duração
    if (animatedParent.matches('.callout-quote-author, .callout-note, .callout-reflection')) {
      return SCROLL_ANIM_DURATION + 150 + SAFETY_MARGIN;
    }
    
    // Se está em título, usa duração específica
    if (animatedParent.matches('h1')) {
      return SCROLL_ANIM_DURATION + 100 + SAFETY_MARGIN; // h1: 800ms + delay 100ms
    }
    if (animatedParent.matches('h2, h3')) {
      return 600 + 80 + SAFETY_MARGIN; // h2/h3: 600ms + delay 80ms
    }
    
    return 0;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Inicializa tooltip para um elemento, se ele possuir data-tooltip
   */
  initializeTooltip(element) {
    // Verifica se elemento possui atributo data-tooltip
    const tooltipContent = element.getAttribute('data-tooltip');
    if (!tooltipContent) return;

    // Valida se Tippy.js está disponível
    if (typeof tippy === 'undefined') {
      console.warn('[RoughAnnotationSystem] Tippy.js não encontrada. Tooltips não serão exibidas.');
      return;
    }

    // Verifica se já existe tooltip para este elemento
    if (this.tooltipInstances.has(element)) {
      return;
    }

    // Cria instância Tippy.js com configuração inteligente
    const tippyInstance = tippy(element, {
      content: tooltipContent,
      placement: 'top',
      followCursor: true,
      animation: 'fade',
      theme: 'orange-rounded',
      arrow: false,
      interactive: false,
      delay: [200, 0], // 200ms para aparecer, 0ms para desaparecer
      // Fallback automático de posições se não couber
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

    // Armazena instância no Map
    this.tooltipInstances.set(element, tippyInstance);
  }

  /**
   * Destroi todas as instâncias de tooltips
   */
  destroyTooltips() {
    this.tooltipInstances.forEach((tippyInstance) => {
      if (tippyInstance && tippyInstance.destroy) {
        tippyInstance.destroy();
      }
    });
    this.tooltipInstances.clear();
  }

  /**
   * Adiciona novos elementos dinamicamente
   * Útil se você adicionar conteúdo via AJAX/SPA
   */
  refresh() {
    if (this.observer) {
      this.observer.disconnect();
    }

    // Destroi tooltips existentes
    this.destroyTooltips();

    this.annotationMap.clear();
    this.queue = [];
    this.isProcessingQueue = false;
    this.shownElements.clear();
    this.setup();

    console.log("[RoughAnnotationSystem] ✓ Refresh completo");
  }

  /**
   * Adiciona uma nova classe de anotação customizada
   *
   * @param {string} className - Nome da classe (sem o ponto)
   * @param {object} config - Configuração da anotação
   *
   * Exemplo:
   * system.addCustomType('minha-anotacao', {
   *   type: 'underline',
   *   strokeWidth: 3,
   *   animationDuration: 1000
   * });
   */
  addCustomType(className, config) {
    this.annotationTypes[className] = config;
    console.log(
      `[RoughAnnotationSystem] ✓ Tipo customizado "${className}" adicionado`
    );
  }

  /**
   * Destrói o sistema (cleanup)
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }

    // Destroi todas as tooltips antes de limpar
    this.destroyTooltips();

    this.annotationMap.clear();
    this.queue = [];
    this.isProcessingQueue = false;
    this.shownElements.clear();
    console.log("[RoughAnnotationSystem] ✓ Destruído");
  }

  /**
   * Lista todas as classes disponíveis
   */
  listAvailableClasses() {
    console.log("[RoughAnnotationSystem] Classes disponíveis:");
    Object.keys(this.annotationTypes).forEach((className) => {
      const config = this.annotationTypes[className];
      console.log(`  .${className} → ${config.type}`);
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// 🚀 AUTO-INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════

const roughAnnotationSystem = new RoughAnnotationSystem();

// Exporta para uso global
window.roughAnnotationSystem = roughAnnotationSystem;

// Log de boas-vindas
console.log(
  "%c🖍️ Rough Annotation System carregado!",
  "color: #ff6b35; font-weight: bold; font-size: 14px;"
);
console.log(
  "%cClasses disponíveis: .cls-underline, .cls-box, .cls-circle, .cls-highlight, .cls-strike, .cls-crossed, .cls-bracket",
  "color: #666; font-size: 12px;"
);
