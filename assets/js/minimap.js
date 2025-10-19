/**
 * ═══════════════════════════════════════════════════════════════
 * 🗺️ SCROLL MINIMAP + SIDEBAR NAVIGATION
 * ═══════════════════════════════════════════════════════════════
 *
 * Navegação visual precisa com minimap dinâmico e sidebar expansível.
 * Utiliza proporção áurea (φ ≈ 1.618) em timings e dimensões.
 *
 * @author Refatorado com precisão cirúrgica
 * @version 2.0.0
 */

class ScrollMinimap {
  constructor(config = {}) {
    // Proporção Áurea
    const PHI = 1.618;

    this.config = {
      // Seletores
      navLevelSelector: "[data-nav-level]",

      // Scroll
      scrollOffset: 80,
      sectionDetectionOffset: "third", // 'top', 'center', 'third'

      // Responsividade
      breakpointMobile: 768,

      // Níveis (Hierarquia Visual)
      // Os valores abaixo precisarão ser calcaulados por um método que irá receber o valor da variável --text-h[n]
      // Para responsividade, defina levelWidths como função que retorna valores diferentes conforme a largura da tela.
      levelWidths: (() => {
        // Exemplo: desktop, tablet, mobile
        const w = window.innerWidth;
        if (w >= 1920)
          return [
            (34 * w) / 1200,
            (26 * w) / 1200,
            (21 * w) / 1200,
            (18 * w) / 1200,
            (15 * w) / 1200,
          ]; // Desktop
        return [
          (23 * w) / 800,
          (17 * w) / 800,
          (14 * w) / 800,
          (12 * w) / 800,
          (10 * w) / 800,
        ]; // Tablet
      })(),
      maxLevels: 5,
      levelOpacities: [1.0, 0.9, 0.8, 0.7, 0.6],
      levelColors: ["#222", "#555", "#777", "#999", "#bbb"],

      // Indicador
      indicatorSnapToLine: true,
      indicatorTransitionDuration: 0.3,

      // Velocidade (px/segundo)
      enableVelocityEffect: true,
      minVelocity: 200,
      maxVelocity: 2500,
      velocityMultiplierMin: 0.5,
      velocityMultiplierMax: 1.3,
      velocityCurveExponent: 0.8,
      velocitySmoothingFactor: 0.15,
      velocityDecayRate: 0.7,

      // Influence Radius (proporção áurea)
      minInfluenceRadius: 15,
      maxInfluenceRadius: Math.round(25 * PHI * PHI), // ≈ 65px

      // Highlight
      highlightMaxScale: 1.4,

      // Sidebar (proporção áurea aplicada)
      sidebarWidth: 320, // ≈ 200 × φ
      sidebarHoverDelay: 70, // 250ms × φ
      sidebarHideDelay: 800, // Delay maior para evitar flickering
      sidebarTransitionDuration: 0.3,
      minimapTransitionDuration: 0.25,

      ...config,
    };

    // Elementos DOM (referências aos elementos existentes no HTML)
    this.navContainer = null;
    this.minimapWrapper = null;
    this.minimapLines = null;
    this.indicator = null;
    this.indicatorLabel = null;
    this.sidebar = null;
    this.navItems = null;
    this.progressPercentage = null;
    this.progressBarFill = null;

    // Estado
    this.sections = [];
    this.currentActiveSection = null;
    this.scrollHistory = []; // ✅ Propriedade (fix memory leak)
    this.isScrolling = false;
    this.isSidebarActive = false; // ✅ Flag para evitar flickering
    this.hoverTimeout = null;
    this.hideTimeout = null;

    // Métricas de Scroll
    this.scrollMetrics = {
      velocity: 0,
      velocityMultiplier: 1,
    };

    this.init();
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🚀 INICIALIZAÇÃO
   * ═══════════════════════════════════════════════════════════
   */
  init() {
    // Validação Mobile
    if (window.innerWidth < this.config.breakpointMobile) {
      console.log(
        `[ScrollMinimap] Não renderizado em mobile (${window.innerWidth}px)`
      );
      return;
    }

    // Validação DOM Crítica
    if (!this.validateDOM()) {
      console.error("[ScrollMinimap] Elementos DOM essenciais não encontrados");
      return;
    }

    this.injectStyles();
    this.buildMinimap();
    this.setupScrollListener();
    this.setupScrollIsolation();
    this.updateIndicatorPosition();

    // Inicializa estado visual
    requestAnimationFrame(() => {
      this.resetLineScales();
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * ✅ VALIDAÇÃO DOM
   * ═══════════════════════════════════════════════════════════
   */
  validateDOM() {
    // Busca elementos da estrutura que já existe no HTML
    this.navContainer = document.getElementById("navContainer");
    this.minimapWrapper = document.getElementById("minimapWrapper");
    this.minimapLines = document.getElementById("minimapLines");
    this.indicator = document.getElementById("scrollIndicator");
    this.indicatorLabel = document.getElementById("indicatorLabel");
    this.sidebar = document.getElementById("sidebar");
    this.navItems = document.getElementById("navItems");
    this.progressPercentage = document.getElementById("progressPercentage");
    this.progressBarFill = document.getElementById("progressBarFill");

    // Valida se todos os elementos essenciais existem
    if (
      !this.navContainer ||
      !this.minimapWrapper ||
      !this.minimapLines ||
      !this.indicator ||
      !this.indicatorLabel ||
      !this.sidebar ||
      !this.navItems ||
      !this.progressPercentage ||
      !this.progressBarFill
    ) {
      console.error("[ScrollMinimap] Estrutura HTML incompleta");
      return false;
    }

    return true;
  }


  /**
   * ═══════════════════════════════════════════════════════════
   * 🗺️ CONSTRUÇÃO DO MINIMAP
   * ═══════════════════════════════════════════════════════════
   */
  buildMinimap() {
    const allSections = document.querySelectorAll(this.config.navLevelSelector);

    if (allSections.length === 0) {
      console.warn("[ScrollMinimap] Nenhuma seção encontrada");
      return;
    }

    allSections.forEach((section, index) => {
      const level = parseInt(section.dataset.navLevel) || 1;
      const label = section.dataset.label || `Seção ${index + 1}`;

      // Cria linha do minimap
      const line = this.createLine(level);
      this.minimapLines.appendChild(line);

      // Cria item da sidebar
      const navItem = this.createNavItem(level, label, index);
      this.navItems.appendChild(navItem);

      this.sections.push({
        element: section,
        level: level,
        label: label,
        lineElement: line,
        navItem: navItem,
        index: index,
      });
    });

    console.log(`[ScrollMinimap] ${this.sections.length} seções carregadas`);
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 📏 CRIAÇÃO DE LINHA DO MINIMAP
   * ═══════════════════════════════════════════════════════════
   */
  createLine(level) {
    const line = document.createElement("div");
    line.className = "minimap-line";

    const width = this.getWidthForLevel(level);
    line.style.width = `${width}px`;

    if (this.config.levelOpacities) {
      const opacity = this.config.levelOpacities[level - 1] || 1;
      line.style.opacity = opacity;
    }

    if (this.config.levelColors) {
      const color = this.config.levelColors[level - 1];
      if (color) line.style.backgroundColor = color;
    }

    line.dataset.level = level;

    return line;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 📝 CRIAÇÃO DE ITEM DE NAVEGAÇÃO
   * ═══════════════════════════════════════════════════════════
   */
  createNavItem(level, label, index) {
    const li = document.createElement("li");
    li.className = "nav-item";
    li.dataset.level = level;
    li.dataset.index = index;

    const link = document.createElement("a");
    link.className = "nav-link2";
    link.href = "#";

    // Marcador minimalista
    const marker = document.createElement("span");
    marker.className = "nav-marker";
    marker.textContent = "—"; // ou '—' para traço

    const text = document.createElement("span");
    text.textContent = label;

    link.appendChild(marker);
    link.appendChild(text);
    li.appendChild(link);

    li.addEventListener("click", (e) => {
      e.preventDefault();
      this.scrollToSection(index);
    });

    return li;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🎯 UTILITÁRIOS
   * ═══════════════════════════════════════════════════════════
   */
  getWidthForLevel(level) {
    const { levelWidths } = this.config;
    return levelWidths[level - 1] || levelWidths[levelWidths.length - 1];
  }

  getLevelIcon(level) {
    const icons = ["●", "○", "◆", "◇", "▪"];
    return icons[level - 1] || "•";
  }

  scrollToSection(index) {
    const section = this.sections[index];
    if (!section) return;

    const targetY = section.element.offsetTop - this.config.scrollOffset;
    window.scrollTo({
      top: targetY,
      behavior: "smooth",
    });
  }

  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🎯 CENTRALIZAÇÃO AUTOMÁTICA DO ITEM ATIVO
   * ═══════════════════════════════════════════════════════════
   */
  centerActiveItemInSidebar(navItem) {
    if (!navItem || !this.navItems) return;

    const navItemsContainer = this.navItems;
    const itemRect = navItem.getBoundingClientRect();
    const containerRect = navItemsContainer.getBoundingClientRect();

    // Calcula posição do item relativa ao container
    const itemRelativeTop = itemRect.top - containerRect.top;

    // Calcula quanto precisa scrollar para centralizar
    const containerCenter = containerRect.height / 2;
    const itemCenter = itemRelativeTop + itemRect.height / 2;
    const scrollAmount = itemCenter - containerCenter;

    // Aplica scroll suave
    navItemsContainer.scrollTo({
      top: navItemsContainer.scrollTop + scrollAmount,
      behavior: 'smooth'
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🔒 ISOLAMENTO DE SCROLL DA SIDEBAR
   * ═══════════════════════════════════════════════════════════
   */
  setupScrollIsolation() {
    const navItems = this.navItems;
    const sidebar = this.sidebar;

    // Previne scroll da página quando mouse está sobre a sidebar
    const preventPageScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = navItems;
      const isScrollingDown = e.deltaY > 0;
      const isScrollingUp = e.deltaY < 0;

      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
      const isAtTop = scrollTop <= 1;

      // Sempre bloqueia scroll da página quando mouse está sobre sidebar
      e.stopPropagation();

      // Permite scroll interno se ainda tem espaço
      if ((isScrollingDown && !isAtBottom) || (isScrollingUp && !isAtTop)) {
        e.preventDefault();
        navItems.scrollTop += e.deltaY;
      } else {
        // Bloqueia completamente quando não tem mais espaço
        e.preventDefault();
      }
    };

    // Aplica em toda a sidebar, não apenas no navItems
    sidebar.addEventListener('wheel', preventPageScroll, { passive: false });
    navItems.addEventListener('wheel', preventPageScroll, { passive: false });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 📊 SCROLL LISTENER (Velocity + Progress)
   * ═══════════════════════════════════════════════════════════
   */
  setupScrollListener() {
    let ticking = false;
    const HISTORY_DURATION = 100;

    const handleScroll = () => {
      if (this.config.enableVelocityEffect) {
        const now = performance.now();
        const currentY = window.scrollY;

        // Adiciona ao histórico
        this.scrollHistory.push({ y: currentY, time: now });

        // Remove eventos antigos
        while (
          this.scrollHistory.length > 0 &&
          now - this.scrollHistory[0].time > HISTORY_DURATION
        ) {
          this.scrollHistory.shift();
        }

        // Calcula velocidade
        if (this.scrollHistory.length >= 2) {
          const oldest = this.scrollHistory[0];
          const newest = this.scrollHistory[this.scrollHistory.length - 1];

          const deltaY = Math.abs(newest.y - oldest.y);
          const deltaTime = newest.time - oldest.time;

          const rawVelocity = deltaTime > 0 ? (deltaY / deltaTime) * 1000 : 0;

          this.scrollMetrics.velocity = this.lerp(
            this.scrollMetrics.velocity,
            rawVelocity,
            this.config.velocitySmoothingFactor
          );

          this.scrollMetrics.velocityMultiplier =
            this.calculateVelocityMultiplier();
        }
      }

      this.isScrolling = true;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.updateIndicatorPosition();
          this.updateProgress();
          ticking = false;
        });
        ticking = true;
      }

      // Reset velocity após parar de scrollar
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        if (this.config.enableVelocityEffect) {
          this.scrollMetrics.velocityMultiplier = this.lerp(
            this.scrollMetrics.velocityMultiplier,
            1.0,
            this.config.velocityDecayRate
          );
        }

        this.isScrolling = false;
        this.resetLineScales();
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * ⚡ CÁLCULO DE VELOCITY MULTIPLIER
   * ═══════════════════════════════════════════════════════════
   */
  calculateVelocityMultiplier() {
    if (!this.config.enableVelocityEffect) return 1;

    const v = this.scrollMetrics.velocity;
    const {
      minVelocity,
      maxVelocity,
      velocityMultiplierMin,
      velocityMultiplierMax,
      velocityCurveExponent,
    } = this.config;

    if (v < minVelocity) {
      const ratio = v / minVelocity;
      return Math.max(0.3, velocityMultiplierMin * ratio);
    }

    const clampedV = Math.min(v, maxVelocity);
    const normalized = (clampedV - minVelocity) / (maxVelocity - minVelocity);
    const curved = Math.pow(normalized, velocityCurveExponent);

    return (
      velocityMultiplierMin +
      curved * (velocityMultiplierMax - velocityMultiplierMin)
    );
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 📍 ATUALIZAÇÃO DA POSIÇÃO DO INDICADOR
   * ═══════════════════════════════════════════════════════════
   */
  updateIndicatorPosition() {
    const currentSection = this.getCurrentSection();

    if (!currentSection) return;

    if (this.config.indicatorSnapToLine) {
      const lineRect = currentSection.lineElement.getBoundingClientRect();
      const minimapRect = this.minimapLines.getBoundingClientRect();

      const lineRelativeY =
        lineRect.top - minimapRect.top + lineRect.height / 2;

      this.currentActiveSection = currentSection;

      this.indicator.style.transition = `transform ${this.config.indicatorTransitionDuration}s cubic-bezier(0.4, 0.0, 0.2, 1)`;
      this.indicator.style.transform = `translateY(${lineRelativeY}px)`;
    }

    this.indicatorLabel.textContent = currentSection.label;
    this.highlightActiveLine(currentSection.lineElement);
    this.updateActiveNavItem(currentSection.navItem);
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🎯 DETECÇÃO DA SEÇÃO ATUAL
   * ═══════════════════════════════════════════════════════════
   */
  getCurrentSection() {
    let scrollPos;

    switch (this.config.sectionDetectionOffset) {
      case "top":
        scrollPos = window.scrollY + this.config.scrollOffset;
        break;
      case "third":
        scrollPos = window.scrollY + window.innerHeight / 3;
        break;
      case "center":
      default:
        scrollPos = window.scrollY + window.innerHeight / 2;
    }

    for (let i = this.sections.length - 1; i >= 0; i--) {
      const section = this.sections[i];
      if (section.element.offsetTop <= scrollPos) {
        return section;
      }
    }

    return this.sections[0];
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🎨 HIGHLIGHT DA LINHA ATIVA (Velocity Effect)
   * ═══════════════════════════════════════════════════════════
   */
  highlightActiveLine(activeLineElement) {
    if (!activeLineElement) return;

    const activeRect = activeLineElement.getBoundingClientRect();
    const activeCenterY = activeRect.top + activeRect.height / 2;

    const effectiveMaxScale =
      1 +
      (this.config.highlightMaxScale - 1) *
        this.scrollMetrics.velocityMultiplier;

    const { minInfluenceRadius, maxInfluenceRadius } = this.config;
    const effectiveMaxInfluence =
      minInfluenceRadius +
      (maxInfluenceRadius - minInfluenceRadius) *
        this.scrollMetrics.velocityMultiplier;

    this.sections.forEach(({ lineElement, level }) => {
      const originalColor =
        this.config.levelColors[level - 1] || this.config.levelColors[0];
      lineElement.style.backgroundColor = originalColor;

      const lineRect = lineElement.getBoundingClientRect();
      const lineCenterY = lineRect.top + lineRect.height / 2;
      const distance = Math.abs(activeCenterY - lineCenterY);

      let scale = 1;
      if (distance < effectiveMaxInfluence) {
        const normalizedDistance = distance / effectiveMaxInfluence;
        const influence = 1 - normalizedDistance;
        scale = 1 + influence ** 2 * (effectiveMaxScale - 1);
      }

      lineElement.style.transition =
        "transform 0.19s cubic-bezier(0.3, 0.3, 0.98, 0.98)";
      lineElement.style.transform = `scaleX(${scale})`;
    });

    activeLineElement.style.backgroundColor = "#ff6b35";
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🔖 ATUALIZAÇÃO DO NAV ITEM ATIVO
   * ═══════════════════════════════════════════════════════════
   */
  updateActiveNavItem(activeNavItem) {
    if (!activeNavItem) return;

    this.sections.forEach(({ navItem }) => {
      navItem.classList.remove("active");
    });

    activeNavItem.classList.add("active");

    // Centraliza automaticamente o item ativo
    this.centerActiveItemInSidebar(activeNavItem);
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 📊 CÁLCULO DE PROGRESSO
   * ═══════════════════════════════════════════════════════════
   */
  updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const scrollable = docHeight - windowHeight;

    if (scrollable <= 0) {
      this.progressPercentage.textContent = "0%";
      this.progressBarFill.style.width = "0%";
      return;
    }

    const percentage = Math.min(
      100,
      Math.max(0, (scrollTop / scrollable) * 100)
    );

    this.progressPercentage.textContent = `${Math.round(percentage)}%`;
    this.progressBarFill.style.width = `${percentage}%`;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🔄 RESET DE ESCALAS
   * ═══════════════════════════════════════════════════════════
   */
  resetLineScales() {
    this.sections.forEach(({ lineElement }) => {
      lineElement.style.transform = "scaleX(1)";
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🎨 INJEÇÃO DE CSS CUSTOM PROPERTIES DINÂMICAS
   * ═══════════════════════════════════════════════════════════
   */
  injectStyles() {
    const styleId = "scroll-minimap-dynamic-vars";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      :root {
        --minimap-sidebar-width: ${this.config.sidebarWidth}px;
        --minimap-minimap-transition: ${this.config.minimapTransitionDuration}s;
        --minimap-sidebar-transition: ${this.config.sidebarTransitionDuration}s;
      }
    `;

    document.head.appendChild(style);
  }
}

// ═══════════════════════════════════════════════════════════════
// 🚀 INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════
const minimap = new ScrollMinimap({
  scrollOffset: 80,
  indicatorSnapToLine: true,
  sectionDetectionOffset: "third",
  levelOpacities: [1.0, 0.9, 0.8, 0.7, 0.6],
});
