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
            navLevelSelector: '[data-nav-level]',
            
            // Scroll
            scrollOffset: 80,
            sectionDetectionOffset: 'third', // 'top', 'center', 'third'
            
            // Responsividade
            breakpointMobile: 468,
            
            // Níveis (Hierarquia Visual)
            levelWidths: [48, 38, 31, 26, 22],
            maxLevels: 5,
            levelOpacities: [1.0, 0.9, 0.8, 0.7, 0.6],
            levelColors: ['#222', '#555', '#777', '#999', '#bbb'],
            
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
            sidebarHideDelay: 500, // 400ms × φ³
            sidebarTransitionDuration: 0.3,
            minimapTransitionDuration: 0.25,
            
            ...config
        };

        // Elementos DOM
        this.navContainer = null;
        this.minimapWrapper = null;
        this.minimapLines = null;
        this.indicator = null;
        this.indicatorLabel = null;
        this.sidebar = null;
        this.sidebarHeader = null;
        this.navItems = null;
        this.progressPercentage = null;
        this.progressBarFill = null;
        
        // Estado
        this.sections = [];
        this.currentActiveSection = null;
        this.scrollHistory = []; // ✅ Propriedade (fix memory leak)
        this.isScrolling = false;
        this.hoverTimeout = null;
        this.hideTimeout = null;
        
        // Métricas de Scroll
        this.scrollMetrics = {
            velocity: 0,
            velocityMultiplier: 1
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
            console.log(`[ScrollMinimap] Não renderizado em mobile (${window.innerWidth}px)`);
            return;
        }
        
        // Validação DOM Crítica
        if (!this.validateDOM()) {
            console.error('[ScrollMinimap] Elementos DOM essenciais não encontrados');
            return;
        }
        
        this.buildStructure();
        this.buildMinimap();
        this.setupScrollListener();
        this.setupSidebarBehavior();
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
        const minimapContainer = document.getElementById('minimap');
        const minimapLines = document.getElementById('minimapLines');
        const scrollIndicator = document.getElementById('scrollIndicator');
        const indicatorLabel = document.getElementById('indicatorLabel');
        
        if (!minimapContainer || !minimapLines || !scrollIndicator || !indicatorLabel) {
            return false;
        }
        
        // Armazena referências originais
        this.minimapLines = minimapLines;
        this.indicator = scrollIndicator;
        this.indicatorLabel = indicatorLabel;
        this.originalMinimapContainer = minimapContainer;
        
        return true;
    }

    /**
     * ═══════════════════════════════════════════════════════════
     * 🏗️ CONSTRUÇÃO DA ESTRUTURA (Minimap + Sidebar)
     * ═══════════════════════════════════════════════════════════
     */
    buildStructure() {
        const body = document.body;
        
        // Container Principal
        this.navContainer = document.createElement('div');
        this.navContainer.className = 'navigation-container';
        this.navContainer.id = 'navContainer';
        
        // Minimap Wrapper (Estado Passivo)
        this.minimapWrapper = document.createElement('div');
        this.minimapWrapper.className = 'minimap-wrapper';
        this.minimapWrapper.id = 'minimapWrapper';
        
        // Move elementos existentes para o wrapper
        this.minimapWrapper.appendChild(this.minimapLines);
        this.minimapWrapper.appendChild(this.indicator);
        
        // Sidebar (Estado Ativo)
        this.sidebar = this.createSidebar();
        
        // Monta estrutura
        this.navContainer.appendChild(this.minimapWrapper);
        this.navContainer.appendChild(this.sidebar);
        
        // Substitui container original
        this.originalMinimapContainer.replaceWith(this.navContainer);
        
        // Injeta estilos
        this.injectStyles();
    }

    /**
     * ═══════════════════════════════════════════════════════════
     * 📑 CRIAÇÃO DA SIDEBAR
     * ═══════════════════════════════════════════════════════════
     */
    createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.className = 'navigation-sidebar';
        sidebar.id = 'sidebar';
        
        // Header
        const header = document.createElement('div');
        header.className = 'sidebar-header';
        
        const title = document.createElement('div');
        title.className = 'sidebar-title';
        title.textContent = 'Índice do Curso';
        
        const progressInfo = document.createElement('div');
        progressInfo.className = 'progress-info';
        
        this.progressPercentage = document.createElement('div');
        this.progressPercentage.className = 'progress-percentage';
        this.progressPercentage.textContent = '0%';
        
        const progressBarContainer = document.createElement('div');
        progressBarContainer.className = 'progress-bar-container';
        
        this.progressBarFill = document.createElement('div');
        this.progressBarFill.className = 'progress-bar-fill';
        progressBarContainer.appendChild(this.progressBarFill);
        
        progressInfo.appendChild(this.progressPercentage);
        progressInfo.appendChild(progressBarContainer);
        
        header.appendChild(title);
        header.appendChild(progressInfo);
        
        // Nav Items
        this.navItems = document.createElement('ul');
        this.navItems.className = 'nav-items';
        this.navItems.id = 'navItems';
        
        sidebar.appendChild(header);
        sidebar.appendChild(this.navItems);
        
        return sidebar;
    }

    /**
     * ═══════════════════════════════════════════════════════════
     * 🗺️ CONSTRUÇÃO DO MINIMAP
     * ═══════════════════════════════════════════════════════════
     */
    buildMinimap() {
        const allSections = document.querySelectorAll(this.config.navLevelSelector);
        
        if (allSections.length === 0) {
            console.warn('[ScrollMinimap] Nenhuma seção encontrada');
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
                index: index
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
        const line = document.createElement('div');
        line.className = 'minimap-line';
        
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
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.dataset.level = level;
        li.dataset.index = index;
        
        const link = document.createElement('a');
        link.className = 'nav-link';
        link.href = '#';
        
        const icon = document.createElement('span');
        icon.className = 'level-icon';
        icon.textContent = this.getLevelIcon(level);
        
        const text = document.createElement('span');
        text.textContent = label;
        
        link.appendChild(icon);
        link.appendChild(text);
        li.appendChild(link);
        
        // Click handler
        li.addEventListener('click', (e) => {
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
        const icons = ['●', '○', '◆', '◇', '▪'];
        return icons[level - 1] || '•';
    }

    scrollToSection(index) {
        const section = this.sections[index];
        if (!section) return;
        
        const targetY = section.element.offsetTop - this.config.scrollOffset;
        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
    }

    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    /**
     * ═══════════════════════════════════════════════════════════
     * 🎭 COMPORTAMENTO DA SIDEBAR (Hover com Delays)
     * ═══════════════════════════════════════════════════════════
     */
    setupSidebarBehavior() {
        // Mouseenter: Delay antes de mostrar sidebar
        this.navContainer.addEventListener('mouseenter', () => {
            clearTimeout(this.hoverTimeout);
            clearTimeout(this.hideTimeout);
            
            this.hoverTimeout = setTimeout(() => {
                this.navContainer.classList.add('sidebar-active');
            }, this.config.sidebarHoverDelay);
        });

        // Mouseleave: Delay antes de esconder sidebar
        this.navContainer.addEventListener('mouseleave', () => {
            clearTimeout(this.hoverTimeout);
            clearTimeout(this.hideTimeout);
            
            this.hideTimeout = setTimeout(() => {
                this.navContainer.classList.remove('sidebar-active');
            }, this.config.sidebarHideDelay);
        });
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
                while (this.scrollHistory.length > 0 && 
                       (now - this.scrollHistory[0].time) > HISTORY_DURATION) {
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
                    
                    this.scrollMetrics.velocityMultiplier = this.calculateVelocityMultiplier();
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

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    /**
     * ═══════════════════════════════════════════════════════════
     * ⚡ CÁLCULO DE VELOCITY MULTIPLIER
     * ═══════════════════════════════════════════════════════════
     */
    calculateVelocityMultiplier() {
        if (!this.config.enableVelocityEffect) return 1;
        
        const v = this.scrollMetrics.velocity;
        const { minVelocity, maxVelocity, velocityMultiplierMin, 
                velocityMultiplierMax, velocityCurveExponent } = this.config;
        
        if (v < minVelocity) {
            const ratio = v / minVelocity;
            return Math.max(0.3, velocityMultiplierMin * ratio);
        }
        
        const clampedV = Math.min(v, maxVelocity);
        const normalized = (clampedV - minVelocity) / (maxVelocity - minVelocity);
        const curved = Math.pow(normalized, velocityCurveExponent);
        
        return velocityMultiplierMin + (curved * (velocityMultiplierMax - velocityMultiplierMin));
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
            
            const lineRelativeY = lineRect.top - minimapRect.top + (lineRect.height / 2);
            
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
        
        switch(this.config.sectionDetectionOffset) {
            case 'top':
                scrollPos = window.scrollY + this.config.scrollOffset;
                break;
            case 'third':
                scrollPos = window.scrollY + (window.innerHeight / 3);
                break;
            case 'center':
            default:
                scrollPos = window.scrollY + (window.innerHeight / 2);
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
        const activeCenterY = activeRect.top + (activeRect.height / 2);
        
        const effectiveMaxScale = 1 + ((this.config.highlightMaxScale - 1) * this.scrollMetrics.velocityMultiplier);
        
        const { minInfluenceRadius, maxInfluenceRadius } = this.config;
        const effectiveMaxInfluence = minInfluenceRadius + 
            ((maxInfluenceRadius - minInfluenceRadius) * this.scrollMetrics.velocityMultiplier);
        
        this.sections.forEach(({ lineElement, level }) => {
            const originalColor = this.config.levelColors[level - 1] || this.config.levelColors[0];
            lineElement.style.backgroundColor = originalColor;
            
            const lineRect = lineElement.getBoundingClientRect();
            const lineCenterY = lineRect.top + (lineRect.height / 2);
            const distance = Math.abs(activeCenterY - lineCenterY);
            
            let scale = 1;
            if (distance < effectiveMaxInfluence) {
                const normalizedDistance = distance / effectiveMaxInfluence;
                const influence = 1 - normalizedDistance;
                scale = 1 + (influence ** 2) * (effectiveMaxScale - 1);
            }
            
            lineElement.style.transition = 'transform 0.19s cubic-bezier(0.3, 0.3, 0.98, 0.98)';
            lineElement.style.transform = `scaleX(${scale})`;
        });
        
        activeLineElement.style.backgroundColor = '#ff6b35';
    }

    /**
     * ═══════════════════════════════════════════════════════════
     * 🔖 ATUALIZAÇÃO DO NAV ITEM ATIVO
     * ═══════════════════════════════════════════════════════════
     */
    updateActiveNavItem(activeNavItem) {
        if (!activeNavItem) return;
        
        this.sections.forEach(({ navItem }) => {
            navItem.classList.remove('active');
        });
        
        activeNavItem.classList.add('active');
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
            this.progressPercentage.textContent = '0%';
            this.progressBarFill.style.width = '0%';
            return;
        }
        
        const percentage = Math.min(100, Math.max(0, (scrollTop / scrollable) * 100));
        
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
            lineElement.style.transform = 'scaleX(1)';
        });
    }

    /**
     * ═══════════════════════════════════════════════════════════
     * 🎨 INJEÇÃO DE ESTILOS CSS
     * ═══════════════════════════════════════════════════════════
     */
    injectStyles() {
        const styleId = 'scroll-minimap-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* ═══════════════════════════════════════════════════════════
               🎯 CONTAINER PRINCIPAL
               ═══════════════════════════════════════════════════════════ */
            .navigation-container {
                position: fixed;
                right: 1.5rem;
                top: 50%;
                transform: translateY(-50%);
                z-index: 1000;
                width: ${this.config.sidebarWidth}px;
                display: flex;
                justify-content: flex-end;
                pointer-events: none;
            }

            /* ═══════════════════════════════════════════════════════════
               🗺️ MINIMAP WRAPPER (Estado Passivo)
               ═══════════════════════════════════════════════════════════ */
            .minimap-wrapper {
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
                opacity: 1;
                transition: opacity ${this.config.minimapTransitionDuration}s cubic-bezier(0.4, 0.0, 0.2, 1),
                            transform ${this.config.minimapTransitionDuration}s cubic-bezier(0.4, 0.0, 0.2, 1);
                pointer-events: auto;
            }

            .navigation-container.sidebar-active .minimap-wrapper {
                opacity: 0;
                transform: translateY(-50%) translateX(20px);
                pointer-events: none;
            }

            /* ═══════════════════════════════════════════════════════════
               📑 SIDEBAR (Estado Ativo)
               ═══════════════════════════════════════════════════════════ */
            .navigation-sidebar {
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%) translateX(100%);
                width: ${this.config.sidebarWidth}px;
                max-height: 80vh;
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 
                    0 0 0 1px rgba(0,0,0,0.04),
                    0 8px 16px rgba(0,0,0,0.04),
                    0 16px 48px rgba(0,0,0,0.08);
                opacity: 0;
                transition: all ${this.config.sidebarTransitionDuration}s cubic-bezier(0.4, 0.0, 0.2, 1);
                transition-delay: 0.15s;
                pointer-events: none;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .navigation-container.sidebar-active .navigation-sidebar {
                opacity: 1;
                transform: translateY(-50%) translateX(0);
                pointer-events: auto;
            }

            /* Header */
            .sidebar-header {
                padding: 1.5rem 1.5rem 1rem;
                border-bottom: 1px solid #f0f0f0;
                flex-shrink: 0;
            }

            .sidebar-title {
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #999;
                margin-bottom: 0.75rem;
            }

            .progress-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .progress-percentage {
                font-size: 1.5rem;
                font-weight: 700;
                color: #ff6b35;
                font-variant-numeric: tabular-nums;
            }

            .progress-bar-container {
                flex: 1;
                height: 6px;
                background: #f0f0f0;
                border-radius: 3px;
                overflow: hidden;
            }

            .progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #ff6b35 0%, #ff8c61 100%);
                border-radius: 3px;
                transition: width 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                width: 0%;
            }

            /* Nav Items */
            .nav-items {
                list-style: none;
                padding: 0.5rem 0;
                margin: 0;
                overflow-y: auto;
                flex: 1;
            }

            .nav-items::-webkit-scrollbar {
                width: 6px;
            }

            .nav-items::-webkit-scrollbar-track {
                background: transparent;
            }

            .nav-items::-webkit-scrollbar-thumb {
                background: #e5e5e5;
                border-radius: 3px;
            }

            .nav-items::-webkit-scrollbar-thumb:hover {
                background: #d1d1d1;
            }

            .nav-item {
                position: relative;
                // cursor: pointer;
                user-select: none;
            }

            .nav-link {
                display: flex;
                align-items: center;
                padding: 0.5rem 1.5rem;
                color: #4a4a4a;
                text-decoration: none;
                font-size: 0.9375rem;
                transition: all 0.15s ease;
                position: relative;
                gap: 0.75rem;
            }

            .nav-item[data-level="1"] .nav-link { padding-left: 1.5rem; font-weight: 500; }
            .nav-item[data-level="2"] .nav-link { padding-left: 2.25rem; font-size: 0.875rem; }
            .nav-item[data-level="3"] .nav-link { padding-left: 3rem; font-size: 0.8125rem; }
            .nav-item[data-level="4"] .nav-link { padding-left: 3.75rem; font-size: 0.8125rem; }
            .nav-item[data-level="5"] .nav-link { padding-left: 4.5rem; font-size: 0.75rem; }

            .nav-link:hover {
                color: #1a1a1a;
                background: #f8f8f8;
            }

            .nav-item.active .nav-link {
                color: #ff6b35;
                background: linear-gradient(90deg, rgba(255,107,53,0.08) 0%, transparent 100%);
                font-weight: 500;
            }

            .nav-item.active .nav-link::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                width: 3px;
                height: 100%;
                background: #ff6b35;
                border-radius: 0 2px 2px 0;
            }

            .level-icon {
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                color: #999;
                flex-shrink: 0;
            }

            .nav-item[data-level="1"] .level-icon { color: #666; }
            .nav-item.active .level-icon { color: #ff6b35; }

            /* ═══════════════════════════════════════════════════════════
               📱 RESPONSIVO
               ═══════════════════════════════════════════════════════════ */
            @media (max-width: 768px) {
                .navigation-container {
                    display: none;
                }
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
    sectionDetectionOffset: 'third',
    levelOpacities: [1.0, 0.9, 0.8, 0.7, 0.6],
});