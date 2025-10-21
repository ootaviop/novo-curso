/**
 * ═══════════════════════════════════════════════════════════════
 * 🗺️ SCROLL MINIMAP + SIDEBAR NAVIGATION
 * ═══════════════════════════════════════════════════════════════
 *
 * Navegação visual precisa com minimap dinâmico e sidebar expansível.
 * Refatorado para simplicidade e manutenibilidade.
 *
 * @author Refatorado - Versão Simplificada
 * @version 3.0.0
 * @changes Removido overengineering: velocity effects, proporção áurea 
 *          artificial, configurações excessivas, código morto
 */

class ScrollMinimap {
  constructor(config = {}) {
    this.config = {
      // Scroll
      scrollOffset: 80,

      // Níveis (Hierarquia Visual)
      levelWidths: [34, 26, 21, 18, 15], // valores em px fixos
      levelOpacities: [1.0, 0.9, 0.8, 0.7, 0.6],
      levelColors: ["#222", "#555", "#777", "#999", "#bbb"],

      // Highlight
      highlightMaxScale: 1.4,
      influenceRadius: 60, // valor fixo

      // Sidebar
      sidebarWidth: 320,

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
    this.isScrolling = false;

    this.init();
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🚀 INICIALIZAÇÃO
   * ═══════════════════════════════════════════════════════════
   */
  init() {
    // Validação Mobile
    if (window.innerWidth < 768) {
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
    this.setupProgressTracking();
    this.setupProgressReset();
    this.setupScrollListener();
    this.updateIndicatorPosition();

    // Inicializa estado visual
    requestAnimationFrame(() => {
      this.resetLineScales();
    });

    // Renderiza ícones Lucide após toda construção
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
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
    // Busca APENAS seções navegáveis
    const navSections = document.querySelectorAll('[data-nav-section="true"]');
    
    if (navSections.length === 0) {
      console.warn("[ScrollMinimap] Nenhuma seção navegável encontrada");
      return;
    }

    // Agrupa por data-nav-group
    const groups = this.groupSectionsByNavGroup(navSections);
    
    // Renderiza grupos + itens
    this.renderNavigationGroups(groups);
    
    console.log(`[ScrollMinimap] ${navSections.length} seções em ${Object.keys(groups).length} grupos`);
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

  getGroupDisplayName(groupKey) {
    const names = {
      'introducao': 'Introdução',
      'conteudo': 'Conteúdo Principal',
      'reflexao': 'Momento de Reflexão',
      'aprofundamento': 'Aprofundamento',
      'conclusao': 'Conclusão',
      'outros': 'Outras Seções'
    };
    
    return names[groupKey] || groupKey;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 📊 AGRUPAMENTO DE SEÇÕES POR GRUPO DE NAVEGAÇÃO
   * ═══════════════════════════════════════════════════════════
   */
  groupSectionsByNavGroup(sections) {
    const groups = {};
    
    sections.forEach((section, index) => {
      const group = section.dataset.navGroup || 'outros';
      
      if (!groups[group]) {
        groups[group] = {
          name: this.getGroupDisplayName(group),
          items: []
        };
      }
      
      const level = parseInt(section.dataset.navLevel) || 1;
      const title = section.dataset.navTitle || `Seção ${index + 1}`;
      const icon = section.dataset.navIcon || 'file-text';
      
      // Conta tipos de conteúdo dentro desta seção
      const contentBadges = this.scanContentTypes(section);
      
      groups[group].items.push({
        element: section,
        level: level,
        title: title,
        icon: icon,
        badges: contentBadges,
        index: index
      });
    });
    
    return groups;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🔍 ESCANEIA TIPOS DE CONTEÚDO DENTRO DA SEÇÃO
   * ═══════════════════════════════════════════════════════════
   */
  scanContentTypes(section) {
    const types = section.querySelectorAll('[data-content-type]');
    const badges = {};
    
    types.forEach(el => {
      const type = el.dataset.contentType;
      badges[type] = (badges[type] || 0) + 1;
    });
    
    return badges;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🎨 RENDERIZA GRUPOS DE NAVEGAÇÃO
   * ═══════════════════════════════════════════════════════════
   */
  renderNavigationGroups(groups) {
    const groupOrder = ['introducao', 'conteudo', 'reflexao', 'aprofundamento', 'conclusao', 'outros'];
    
    groupOrder.forEach(groupKey => {
      if (!groups[groupKey]) return;
      
      const group = groups[groupKey];
      
      // Header do grupo
      const header = document.createElement('div');
      header.className = 'nav-group-header';
      header.textContent = group.name;
      this.navItems.appendChild(header);
      
      // Itens do grupo
      group.items.forEach(item => {
        const navItem = this.createNavItemWithIcon(item);
        this.navItems.appendChild(navItem);
        
        // Cria linha do minimap (mantém compatibilidade)
        const line = this.createLine(item.level);
        this.minimapLines.appendChild(line);
        
        this.sections.push({
          element: item.element,
          level: item.level,
          title: item.title,
          lineElement: line,
          navItem: navItem,
          index: item.index
        });
      });
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🎯 CRIA ITEM DE NAVEGAÇÃO COM ÍCONE
   * ═══════════════════════════════════════════════════════════
   */
  createNavItemWithIcon(item) {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.dataset.level = item.level;
    li.dataset.index = item.index;

    const link = document.createElement('a');
    link.className = 'nav-link2';
    link.href = '#';

    // Progress indicator (checkbox)
    const progressIndicator = document.createElement('span');
    progressIndicator.className = 'nav-progress-indicator';
    
    // Ícone de check (Lucide circle-check)
    const checkIcon = document.createElement('i');
    checkIcon.className = 'nav-check-icon';
    checkIcon.setAttribute('data-lucide', 'circle-check');
    progressIndicator.appendChild(checkIcon);
    
    // Content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'nav-link2-content';

    // Ícone (Lucide)
    const iconWrapper = document.createElement('span');
    iconWrapper.className = 'nav-item-icon';
    iconWrapper.setAttribute('data-lucide', item.icon);

    // Texto
    const text = document.createElement('span');
    text.textContent = item.title;
    
    // Badges de conteúdo
    const badgesContainer = this.createContentBadges(item.badges);

    contentWrapper.appendChild(iconWrapper);
    contentWrapper.appendChild(text);
    
    link.appendChild(progressIndicator);
    link.appendChild(contentWrapper);
    link.appendChild(badgesContainer);
    
    li.appendChild(link);

    li.addEventListener('click', (e) => {
      e.preventDefault();
      this.scrollToSection(item.index);
    });

    return li;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🏷️ CRIA BADGES DE CONTEÚDO
   * ═══════════════════════════════════════════════════════════
   */
  createContentBadges(badges) {
    const container = document.createElement('div');
    container.className = 'nav-content-badges';
    
    const badgeIconMap = {
      'quote': 'quote',
      'highlight': 'message-square-text',
      'reflection': 'lightbulb',
      'question': 'help-circle'
    };
    
    Object.entries(badges).forEach(([type, count]) => {
      if (count === 0) return;
      
      const badge = document.createElement('span');
      badge.className = 'nav-content-badge';
      badge.setAttribute('data-lucide', badgeIconMap[type] || 'circle');
      badge.title = `${count} ${type}(s)`;
      
      container.appendChild(badge);
    });
    
    return container;
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
   * 📊 SCROLL LISTENER
   * ═══════════════════════════════════════════════════════════
   */
  setupScrollListener() {
    let ticking = false;
    let scrollTimeout;

    const handleScroll = () => {
      this.isScrolling = true;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.updateIndicatorPosition();
          ticking = false;
        });
        ticking = true;
      }

      // Reset após parar de scrollar
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
        this.resetLineScales();
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🔄 RESET DE PROGRESSO COM CTRL + F5
   * ═══════════════════════════════════════════════════════════
   */
  setupProgressReset() {
    window.addEventListener('keydown', (e) => {
      // Detecta Ctrl + F5 (Ctrl + R também funciona)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'F5' || e.key === 'r')) {
        // Limpa o progresso
        localStorage.removeItem('lesson-progress');
        this.completedSections.clear();
        
        // Remove marcação visual de todos os itens
        this.sections.forEach(section => {
          if (section.navItem) {
            section.navItem.classList.remove('completed');
          }
        });
        
        // Atualiza porcentagem
        this.updateProgressPercentageTracking();
        
        console.log('[ScrollMinimap] Progresso resetado');
      }
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 📊 SISTEMA DE PROGRESS TRACKING
   * ═══════════════════════════════════════════════════════════
   */
  setupProgressTracking() {
    // Carrega progresso salvo
    this.completedSections = new Set(
      JSON.parse(localStorage.getItem('lesson-progress') || '[]')
    );
    
    // Marca itens já completados
    this.sections.forEach((section, index) => {
      if (this.completedSections.has(index)) {
        section.navItem.classList.add('completed');
      }
    });
    
    // Intersection Observer para tracking
    const observerOptions = {
      threshold: 0.5, // 50% visível
      rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const sectionData = this.sections.find(s => s.element === entry.target);
        if (!sectionData) return;
        
        // Marca como completo quando 50% visível
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          this.markSectionCompleted(sectionData.index);
        }
      });
    }, observerOptions);
    
    // Observa todas as seções
    this.sections.forEach(section => {
      observer.observe(section.element);
    });
  }

  markSectionCompleted(index) {
    if (this.completedSections.has(index)) return;
    
    this.completedSections.add(index);
    
    // Salva no localStorage
    localStorage.setItem(
      'lesson-progress',
      JSON.stringify([...this.completedSections])
    );
    
    // Atualiza UI
    const section = this.sections[index];
    if (section && section.navItem) {
      section.navItem.classList.add('completed');
    }
    
    // Atualiza porcentagem de progresso
    this.updateProgressPercentageTracking();
  }

  updateProgressPercentageTracking() {
    const total = this.sections.length;
    const completed = this.completedSections.size;
    const percentage = Math.round((completed / total) * 100);
    
    if (this.progressPercentage) {
      this.progressPercentage.textContent = `${percentage}%`;
    }
    if (this.progressBarFill) {
      this.progressBarFill.style.width = `${percentage}%`;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 📍 ATUALIZAÇÃO DA POSIÇÃO DO INDICADOR
   * ═══════════════════════════════════════════════════════════
   */
  updateIndicatorPosition() {
    const currentSection = this.getCurrentSection();

    if (!currentSection) return;

    const lineRect = currentSection.lineElement.getBoundingClientRect();
    const minimapRect = this.minimapLines.getBoundingClientRect();

    const lineRelativeY =
      lineRect.top - minimapRect.top + lineRect.height / 2;

    this.currentActiveSection = currentSection;

    this.indicator.style.transform = `translateY(${lineRelativeY}px)`;

    this.indicatorLabel.textContent = currentSection.title;
    this.highlightActiveLine(currentSection.lineElement);
    this.updateActiveNavItem(currentSection.navItem);
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🎯 DETECÇÃO DA SEÇÃO ATUAL
   * ═══════════════════════════════════════════════════════════
   */
  getCurrentSection() {
    const scrollPos = window.scrollY + window.innerHeight / 3;

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
   * 🎨 HIGHLIGHT DA LINHA ATIVA
   * ═══════════════════════════════════════════════════════════
   */
  highlightActiveLine(activeLineElement) {
    if (!activeLineElement) return;

    const activeRect = activeLineElement.getBoundingClientRect();
    const activeCenterY = activeRect.top + activeRect.height / 2;

    const maxScale = this.config.highlightMaxScale;
    const influenceRadius = this.config.influenceRadius;

    this.sections.forEach(({ lineElement, level }) => {
      const originalColor =
        this.config.levelColors[level - 1] || this.config.levelColors[0];
      lineElement.style.backgroundColor = originalColor;

      const lineRect = lineElement.getBoundingClientRect();
      const lineCenterY = lineRect.top + lineRect.height / 2;
      const distance = Math.abs(activeCenterY - lineCenterY);

      let scale = 1;
      if (distance < influenceRadius) {
        const normalizedDistance = distance / influenceRadius;
        const influence = 1 - normalizedDistance;
        scale = 1 + influence ** 2 * (maxScale - 1);
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
    this.centerActiveItemInSidebar(activeNavItem);
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
      }
    `;

    document.head.appendChild(style);
  }
}

// ═══════════════════════════════════════════════════════════════
// 🚀 INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════
const minimap = new ScrollMinimap();
