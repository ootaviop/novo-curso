class ScrollMinimap {
    constructor(config = {}) {
        this.config = {
            navLevelSelector: '[data-nav-level]',
            throttleDelay: 50,
            hideDelay: 2000,
            edgeThreshold: 100,
            scrollOffset: 80,
            smoothScroll: true,
            breakpointMobile: 468,
            
            // Níveis
            levelWidths: [48, 38, 31, 26, 22],
            maxLevels: 5,
            levelOpacities: [1.0, 0.9, 0.8, 0.7, 0.6],
            levelColors: ['#222', '#555', '#777', '#999', '#bbb'],

            
            // Snap to Line
            indicatorSnapToLine: true,
            indicatorTransitionDuration: 0.3,
            sectionDetectionOffset: 'third', // 'top', 'center', 'third'
            
            // Velocity
            enableVelocityEffect: true,
            minVelocity: 0.3,
            maxVelocity: 4.0,
            velocityMultiplierMin: 0.92,
            velocityMultiplierMax: 1.12,
            velocityCurveExponent: 0.6,
            velocitySmoothingFactor: 0.2,
            velocityDecayRate: 0.5,
            
            ...config
        };

        this.minimapLines = document.getElementById('minimapLines');
        this.indicator = document.getElementById('scrollIndicator');
        this.indicatorLabel = document.getElementById('indicatorLabel');
        this.minimap = document.getElementById('minimap');
        this.sections = [];
        
        this.scrollTimeout = null;
        this.hideTimeout = null;
        this.isVisible = false;
        this.currentActiveSection = null;
        
        this.scrollMetrics = {
            lastY: window.scrollY,
            lastTime: performance.now(),
            velocity: 0,
            velocityMultiplier: 1
        };
        
        this.isScrolling = false;
        
        this.init();
    }

    init() {
        if (window.innerWidth < this.config.breakpointMobile) {
            console.log(`[ScrollMinimap] Não renderizado (largura: ${window.innerWidth}px < ${this.config.breakpointMobile}px)`);
            if (this.minimap) this.minimap.style.display = 'none';
            return;
        }
        
        this.buildMinimap();
        this.initializeLineStates();
        this.setupScrollListener();
        this.setupMouseProximity();
        this.setupProximityEffect();
        //this.setupLineClicks();
        this.updateIndicatorPosition();
        
        requestAnimationFrame(() => {
            this.resetLineScales();
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 🗺️ CONSTRUÇÃO DO MINIMAP (SIMPLES - GAP FIXO)
    // ═══════════════════════════════════════════════════════════
    buildMinimap() {
        console.log('🗺️ Iniciando construção do minimap...');
        
        const allSections = document.querySelectorAll(this.config.navLevelSelector);
        
        if (allSections.length === 0) {
            console.warn('⚠️ Nenhum elemento encontrado com', this.config.navLevelSelector);
            return;
        }
        
        allSections.forEach((section, index) => {
            const level = parseInt(section.dataset.navLevel) || 1;
            const label = section.dataset.label || `Seção ${index + 1}`;
            
            if (level < 1 || level > this.config.maxLevels) {
                console.warn(`⚠️ Nível ${level} fora do range (1-${this.config.maxLevels}). Usando nível 1.`);
            }
            
            const line = this.createLine(level);
            this.minimapLines.appendChild(line);
            
            this.sections.push({
                element: section,
                level: level,
                label: label,
                lineElement: line
            });
        });
        
        console.log(`✅ Minimap construído: ${this.sections.length} seções`);
    }

    createLine(level) {
        const line = document.createElement('div');
        line.className = 'minimap-line';
        
        // Aplica largura baseada no nível
        const width = this.getWidthForLevel(level);
        line.style.width = `${width}px`;
        
        // ═══════════════════════════════════════════════════════════
        // 👇 DESCOMENTE ESTAS LINHAS (JÁ ESTÃO NO CÓDIGO):
        // ═══════════════════════════════════════════════════════════
        if (this.config.levelOpacities) {
            const opacity = this.config.levelOpacities[level - 1] || 1;
            line.style.opacity = opacity;
        }

        if (this.config.levelColors) {
            const color = this.config.levelColors[level - 1];
            if (color) line.style.backgroundColor = color;
        }
        
        // Armazena nível como data-attribute
        line.dataset.level = level;
        
        return line;
    }

    getWidthForLevel(level) {
        const { levelWidths } = this.config;
        return levelWidths[level - 1] || levelWidths[levelWidths.length - 1];
    }

    // setupLineClicks() {
    //     this.sections.forEach(({ lineElement, element, label }) => {
    //         lineElement.style.cursor = 'pointer';
    //         lineElement.title = `Ir para: ${label}`;
            
    //         lineElement.addEventListener('click', (e) => {
    //             e.preventDefault();
    //             this.scrollToSection(element);
    //             this.flashLine(lineElement);
    //         });
    //     });
    // }



    scrollToSection(element) {
        const targetPosition = element.offsetTop - this.config.scrollOffset;
        
        if (this.config.smoothScroll) {
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        } else {
            window.scrollTo(0, targetPosition);
        }
        
        this.showMinimap();
    }

    flashLine(lineElement) {
        const originalBg = lineElement.style.backgroundColor;
        
        lineElement.style.backgroundColor = '#ff6b35';
        lineElement.style.transition = 'background-color 0.15s ease';
        
        setTimeout(() => {
            lineElement.style.backgroundColor = originalBg;
        }, 300);
    }

    showMinimap() {
        if (!this.isVisible) {
            this.minimap.classList.add('visible');
            this.isVisible = true;
        }
        
        clearTimeout(this.hideTimeout);
        
        this.hideTimeout = setTimeout(() => {
            this.hideMinimap();
        }, this.config.hideDelay);
    }

    hideMinimap() {
        if (this.isVisible) {
            this.minimap.classList.remove('visible');
            this.isVisible = false;
        }
    }

    setupMouseProximity() {
        let mouseMoveTimeout;
        
        document.addEventListener('mousemove', (e) => {
            const distanceFromRight = window.innerWidth - e.clientX;
            
            if (distanceFromRight <= this.config.edgeThreshold) {
                this.showMinimap();
            }
            
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(() => {}, 100);
        });
    }

    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    calculateVelocityMultiplier() {
        if (!this.config.enableVelocityEffect) return 1;
        
        const v = this.scrollMetrics.velocity;
        const { minVelocity, maxVelocity, velocityMultiplierMin, velocityMultiplierMax, velocityCurveExponent } = this.config;
        
        const clampedV = Math.max(minVelocity, Math.min(v, maxVelocity));
        const normalized = (clampedV - minVelocity) / (maxVelocity - minVelocity);
        const curved = Math.pow(normalized, velocityCurveExponent);
        
        return velocityMultiplierMin + (curved * (velocityMultiplierMax - velocityMultiplierMin));
    }

    setupScrollListener() {
        let ticking = false;
        
        const handleScroll = () => {
            if (this.config.enableVelocityEffect) {
                const now = performance.now();
                const currentY = window.scrollY;
                
                const deltaY = Math.abs(currentY - this.scrollMetrics.lastY);
                const deltaTime = now - this.scrollMetrics.lastTime;
                
                if (deltaTime > 0) {
                    const rawVelocity = deltaY / deltaTime;
                    
                    this.scrollMetrics.velocity = this.lerp(
                        this.scrollMetrics.velocity,
                        rawVelocity,
                        this.config.velocitySmoothingFactor
                    );
                    
                    this.scrollMetrics.velocityMultiplier = this.calculateVelocityMultiplier();
                }
                
                this.scrollMetrics.lastY = currentY;
                this.scrollMetrics.lastTime = now;
            }
            
            this.isScrolling = true;
            this.showMinimap();
            
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateIndicatorPosition();
                    ticking = false;
                });
                ticking = true;
            }
            
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

    setupProximityEffect() {
        const minimapLines = this.minimapLines;
        const lines = Array.from(minimapLines.querySelectorAll('.minimap-line'));
        
        const linePositions = lines.map(line => {
            const rect = line.getBoundingClientRect();
            return rect.top + (rect.height / 2);
        });
        
        let animationFrameId = null;

        const applyProximityScale = (mouseY) => {
            if (this.isScrolling) return;
            
            lines.forEach((line, index) => {
                const lineCenterY = linePositions[index];
                const distance = Math.abs(mouseY - lineCenterY);
                
                const maxInfluence = 50;
                const maxScale = 2;
                
                let scale = 1;
                if (distance < maxInfluence) {
                    const influence = 1 - (distance / maxInfluence);
                    scale = 1 + (influence ** 2) * (maxScale - 1);
                }
                
                line.style.transform = `scaleX(${scale})`;
            });
        };

        minimapLines.addEventListener('mouseenter', () => {
            this.showMinimap();
        });

        minimapLines.addEventListener('mousemove', (e) => {
            this.showMinimap();
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(() => applyProximityScale(e.clientY));
        });

        minimapLines.addEventListener('mouseleave', () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (!this.isScrolling) {
                lines.forEach(line => line.style.transform = 'scaleX(1)');
            }
        });
    }

    initializeLineStates() {
        this.sections.forEach(({ lineElement }) => {
            lineElement.style.transform = 'scaleX(1)';
            lineElement.style.backgroundColor = '';
            lineElement.style.transition = '';
        });
    }

    resetLineScales() {
        this.sections.forEach(({ lineElement }) => {
            lineElement.style.transform = 'scaleX(1)';
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 📍 ATUALIZAR POSIÇÃO DO INDICADOR (SNAP TO LINE)
    // ═══════════════════════════════════════════════════════════
    updateIndicatorPosition() {
        const currentSection = this.getCurrentSection();
        
        if (!currentSection) return;
        
        if (this.config.indicatorSnapToLine) {
            // Snap: Indicador "trava" em cada linha
            const lineRect = currentSection.lineElement.getBoundingClientRect();
            const minimapRect = this.minimapLines.getBoundingClientRect();
            
            const lineRelativeY = lineRect.top - minimapRect.top + (lineRect.height / 2);
            
            // Detecta mudança de seção
            const hasChanged = this.currentActiveSection !== currentSection;
            this.currentActiveSection = currentSection;
            
            // Aplica transição suave
            this.indicator.style.transition = `transform ${this.config.indicatorTransitionDuration}s cubic-bezier(0.4, 0.0, 0.2, 1)`;
            this.indicator.style.transform = `translateY(${lineRelativeY}px)`;
            
        } else {
            // Contínuo: Indicador segue scroll
            const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
            const minimapHeight = this.minimapLines.offsetHeight;
            const indicatorY = scrollPercent * minimapHeight;
            
            this.indicator.style.transition = 'transform 0.1s linear';
            this.indicator.style.transform = `translateY(${indicatorY}px)`;
        }
        
        this.indicatorLabel.textContent = currentSection.label;
        this.highlightActiveLine(currentSection.lineElement);
    }

    // ═══════════════════════════════════════════════════════════
    // 🎯 DETECTAR SEÇÃO ATUAL
    // ═══════════════════════════════════════════════════════════
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

    highlightActiveLine(activeLineElement) {
    if (!activeLineElement) return;
    
    const activeRect = activeLineElement.getBoundingClientRect();
    const activeCenterY = activeRect.top + (activeRect.height / 2);
    
    this.sections.forEach(({ lineElement, level }) => {  // 👈 Agora recebe 'level'
        // 🔧 CORREÇÃO: Restaura cor original ao invés de resetar
        const originalColor = this.config.levelColors[level - 1] || this.config.levelColors[0];
        lineElement.style.backgroundColor = originalColor;
        
        const lineRect = lineElement.getBoundingClientRect();
        const lineCenterY = lineRect.top + (lineRect.height / 2);
        const distance = Math.abs(activeCenterY - lineCenterY);
        
        const maxInfluence = 50;
        const maxScale = 1.4;
        
        let scale = 1;
        if (distance < maxInfluence) {
            const normalizedDistance = distance / maxInfluence;
            const influence = 1 - normalizedDistance;
            const baseScale = 1 + (influence ** 2) * (maxScale - 1);
            
            scale = baseScale * this.scrollMetrics.velocityMultiplier;
        }
        
        lineElement.style.transition = 'transform 0.19s cubic-bezier(.3,.3,.98,.98)';
        lineElement.style.transform = `scaleX(${scale})`;
    });
    
    // 🎯 Linha ativa ainda pode ter cor especial, se quiser
    activeLineElement.style.backgroundColor = '#ff6b35';
}
}

// ═══════════════════════════════════════════════════════════
// 🚀 INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════
const minimap = new ScrollMinimap({
    scrollOffset: 80,
    smoothScroll: true,
    indicatorSnapToLine: true,
    sectionDetectionOffset: 'third',
    levelOpacities: [1.0, 0.9, 0.8, 0.7, 0.6],
});