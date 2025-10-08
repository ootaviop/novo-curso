
    /**
 * ═══════════════════════════════════════════════════════════════
 * 🖍️ ROUGH NOTATION - SISTEMA COMPLETO
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
 * USO:
 * <span class="cls-underline">texto</span>
 * <span class="cls-highlight">texto</span>
 * 
 * Todos usam var(--base) como cor e aparecem 200px antes da viewport.
 * 
 * REQUISITOS:
 * - Rough Notation library carregada
 * - Variável CSS --base definida
 */

class RoughAnnotationSystem {
    constructor() {
        this.annotationMap = new Map();
        this.observer = null;
        const w = window.innerWidth;
        w >= 1920 ? this.strokeWidth = 3.2 : this.strokeWidth = 2;

        const colors = {
            "base": "var(--rough-notation-base)",
            "solidOrange": "var(--rough-notation-solid-orange)",
            "solidGreen": "var(--rough-notation-solid-green)",
            "solidBlue": "var(--rough-notation-solid-blue)",
            "solidPurple": "var(--rough-notation-solid-purple)",
            "solidRed": "var(--rough-notation-solid-red)",
            "solidYellow": "var(--rough-notation-solid-yellow)",
            "softOrange": "var(--rough-notation-soft-orange)",
            "softGreen": "var(--rough-notation-soft-green)",
            "softBlue": "var(--rough-notation-soft-blue)",
            "softPurple": "var(--rough-notation-soft-purple)",
            "softRed": "var(--rough-notation-soft-red)",
            "softYellow": "var(--rough-notation-soft-yellow)",
        }
        
        this.annotationTypes = {
            'cls-underline': {
                type: 'underline',
                multiline: true, 
                strokeWidth: this.strokeWidth,
                animationDuration: 800,
                color: colors.solidOrange
            },
            'cls-box': {
                type: 'box',
                multiline: true, 
                strokeWidth: this.strokeWidth,
                padding: 6,
                animationDuration: 1000,
                color: colors.solidGreen
            },
            'cls-circle': {
                type: 'circle',
                multiline: true, 
                strokeWidth: this.strokeWidth,
                padding: 8,
                animationDuration: 800,
                color: colors.solidBlue
            },
            'cls-highlight': {
                type: 'highlight',
                strokeWidth: this.strokeWidth,
                multiline: true,
                animationDuration: 1300,
                color: colors.softYellow
                
            },
            'cls-strike': {
                type: 'strike-through',
                multiline: true, 
                strokeWidth: this.strokeWidth,
                animationDuration: 500,
                color: colors.solidGreen
            },
            'cls-crossed': {
                type: 'crossed-off',
                multiline: true, 
                strokeWidth: this.strokeWidth,
                animationDuration: 600,
                color: colors.solidRed
            },
            'cls-bracket': {
                type: 'bracket',
                multiline: true, 
                strokeWidth: this.strokeWidth,
                brackets: ['left', 'right'],
                animationDuration: 700,
                color: colors.solidOrange
            }
        };
        
        this.init();
    }

    /**
     * Inicializa o sistema
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * Configura o observer e processa elementos
     */
    setup() {
        // Valida se Rough Notation está disponível
        if (typeof RoughNotation === 'undefined') {
            console.error('[RoughAnnotationSystem] Rough Notation library não encontrada.');
            console.error('Adicione: <script src="https://unpkg.com/rough-notation@0.5.1/lib/rough-notation.iife.js"></script>');
            return;
        }

        // Cria o Intersection Observer
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                rootMargin: '-350px 0px', // Dispara 350px DEPOIS de entrar
                threshold: 0
            }
        );

        // Processa todos os elementos
        this.processAllElements();

        console.log(`[RoughAnnotationSystem] ✓ Inicializado com ${this.annotationMap.size} anotações`);
    }

    /**
     * Processa todos os elementos com classes de anotação
     */
    processAllElements() {
        // Para cada tipo de anotação
        Object.keys(this.annotationTypes).forEach(className => {
            const elements = document.querySelectorAll(`.${className}`);
            
            elements.forEach(element => {
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
            console.warn(`[RoughAnnotationSystem] Classe "${className}" não reconhecida`);
            return;
        }

        // Obtém a cor
        const baseColor = this.getBaseColor(element, config);
        
        // Para highlight, usa cor com transparência
        const color = config.type === 'highlight' 
            ? this.adjustColorForHighlight(baseColor)
            : baseColor;

        // Cria a anotação (mas NÃO mostra ainda)
        const annotation = RoughNotation.annotate(element, {
            ...config,
            color: color
        });

        // Armazena no Map
        this.annotationMap.set(element, annotation);

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
        if (color.startsWith('rgba')) {
            return color;
        }

        // Se é hex, converte para rgba com alpha 0.3
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, 0.3)`;
        }

        // Se é rgb, adiciona alpha
        if (color.startsWith('rgb(')) {
            return color.replace('rgb(', 'rgba(').replace(')', ', 0.3)');
        }

        // Fallback
        return color;
    }

    /**
     * Lida com intersecções
     */
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const annotation = this.annotationMap.get(entry.target);
                
                if (annotation) {
                    // Mostra a anotação
                    annotation.show();
                    
                    // Para de observar (anima apenas 1 vez)
                    this.observer.unobserve(entry.target);
                }
            }
        });
    }

    /**
     * Adiciona novos elementos dinamicamente
     * Útil se você adicionar conteúdo via AJAX/SPA
     */
    refresh() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        this.annotationMap.clear();
        this.setup();
        
        console.log('[RoughAnnotationSystem] ✓ Refresh completo');
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
        console.log(`[RoughAnnotationSystem] ✓ Tipo customizado "${className}" adicionado`);
    }

    /**
     * Destrói o sistema (cleanup)
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        this.annotationMap.clear();
        console.log('[RoughAnnotationSystem] ✓ Destruído');
    }

    /**
     * Lista todas as classes disponíveis
     */
    listAvailableClasses() {
        console.log('[RoughAnnotationSystem] Classes disponíveis:');
        Object.keys(this.annotationTypes).forEach(className => {
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
console.log('%c🖍️ Rough Annotation System carregado!', 'color: #ff6b35; font-weight: bold; font-size: 14px;');
console.log('%cClasses disponíveis: .cls-underline, .cls-box, .cls-circle, .cls-highlight, .cls-strike, .cls-crossed, .cls-bracket', 'color: #666; font-size: 12px;');



