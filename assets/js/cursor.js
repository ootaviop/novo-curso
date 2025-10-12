/**
 * ═══════════════════════════════════════════════════════════
 * 🎯 SISTEMA DE CURSOR CUSTOM - 4 ESTADOS
 * ═══════════════════════════════════════════════════════════
 * 
 * Estados:
 * - default: navegação normal
 * - hover: mão aberta sobre elementos clicáveis
 * - grab: mão fechada durante mousedown
 * - tooltip: cursor de informação sobre elementos com tooltip (não-clicáveis)
 */

class CursorSystem {
  constructor() {
    // Elementos DOM
    this.cursorDefault = document.querySelector('.cursor-default');
    this.cursorHand = document.querySelector('.cursor-hand');
    this.cursorGrab = document.querySelector('.cursor-grab');
    this.cursorTooltip = document.querySelector('.cursor-tooltip');
    this.cursorRipple = document.getElementById('cursorRipple');
    
    // Estado
    this.position = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };
    this.currentState = 'default';
    this.isOverInteractive = false; // Flag para saber se está sobre elemento clicável
    
    // Mobile check
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || 
                    window.innerWidth < 768;
    
    if (this.isMobile) {
      document.body.style.cursor = 'auto';
      return;
    }
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.animate();
    
    console.log('✅ Cursor System: Ativado (3 estados)');
  }
  
  setupEventListeners() {
    // Mouse move
    document.addEventListener('mousemove', (e) => {
      this.target.x = e.clientX;
      this.target.y = e.clientY;
    });
    
    // Mousedown (inicia grab)
    document.addEventListener('mousedown', (e) => {
      // Só ativa grab se estiver sobre elemento interativo
      if (this.isOverInteractive) {
        this.setState('grab');
      }
    });
    
    // Mouseup (volta pro hover ou default)
    document.addEventListener('mouseup', () => {
      if (this.isOverInteractive) {
        this.setState('hover');
      } else {
        this.setState('default');
      }
    });
    
    // Click (ripple)
    document.addEventListener('click', (e) => {
      this.triggerRipple(e.clientX, e.clientY);
    });
    
    // Detecta elementos interativos
    this.setupInteractiveElements();
    
    // Detecta elementos com tooltip
    this.setupTooltipElements();
  }
  
  setupInteractiveElements() {
    const interactiveSelector = 'a, button, [role="button"], [onclick], .morphable, .audio-trigger-btn, .player-btn, .nav-link2, .volume-slider-container';
    
    const interactiveElements = document.querySelectorAll(interactiveSelector);
    
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.isOverInteractive = true;
        this.setState('hover');
      });
      
      el.addEventListener('mouseleave', () => {
        this.isOverInteractive = false;
        this.setState('default');
      });
    });

    // Tratamento especial para a barra de progresso
    this.setupProgressBarCursor();
  }

  setupProgressBarCursor() {
    const progressBar = document.querySelector('#progressBar');
    if (!progressBar) return;

    progressBar.addEventListener('mouseenter', () => {
      this.isOverInteractive = true;
      this.setState('hover');
    });
    
    progressBar.addEventListener('mouseleave', () => {
      this.isOverInteractive = false;
      this.setState('default');
    });
  }

  setupTooltipElements() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    const interactiveSelector = 'a, button, [role="button"], [onclick], .morphable, .audio-trigger-btn, .player-btn, .nav-link2, .volume-slider-container';
    
    tooltipElements.forEach(el => {
      // Verifica se NÃO é um elemento interativo
      const isInteractive = el.matches(interactiveSelector);
      
      if (!isInteractive) {
        el.addEventListener('mouseenter', () => {
          this.isOverInteractive = false;
          this.setState('tooltip');
        });
        
        el.addEventListener('mouseleave', () => {
          this.setState('default');
        });
      }
    });
  }

  // Método para reinicializar elementos interativos (útil quando elementos são criados dinamicamente)
  reinitializeInteractiveElements() {
    this.setupInteractiveElements();
    this.setupTooltipElements();
  }
  
  setState(newState) {
    if (this.currentState === newState) return;
    
    // Remove todos os estados
    this.cursorHand.classList.remove('active');
    this.cursorGrab.classList.remove('active');
    this.cursorTooltip.classList.remove('active');
    
    // Aplica novo estado
    this.currentState = newState;
    
    switch(newState) {
      case 'default':
        this.cursorDefault.classList.add('active');
        break;
        
      case 'hover':
        this.cursorHand.classList.add('active');
        this.cursorGrab.classList.remove('active');
        this.cursorTooltip.classList.remove('active');
        this.cursorDefault.classList.remove('active');
        break;
        
      case 'grab':
        this.cursorGrab.classList.add('active');
        this.cursorHand.classList.remove('active');
        this.cursorTooltip.classList.remove('active');
        this.cursorDefault.classList.remove('active');
        break;
        
      case 'tooltip':
        this.cursorTooltip.classList.add('active');
        this.cursorHand.classList.remove('active');
        this.cursorGrab.classList.remove('active');
        this.cursorDefault.classList.remove('active');
        break;
    }
  }
  
  triggerRipple(x, y) {
    this.cursorRipple.style.left = `${x}px`;
    this.cursorRipple.style.top = `${y}px`;
    this.cursorRipple.classList.remove('active');
    
    void this.cursorRipple.offsetWidth; // Force reflow
    
    this.cursorRipple.classList.add('active');
  }
  
  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }
  
  animate() {
    // Interpolação suave
    this.position.x = this.lerp(this.position.x, this.target.x, 0.75);
    this.position.y = this.lerp(this.position.y, this.target.y, 0.75);

    // Posiciona o cursor customizado na posição real do mouse
    const setCursorPos = (el) => {
      if (!el) return;
      // O CSS já centraliza com translate(-50%, -50%), então posicionamos diretamente
      el.style.left = `${this.position.x}px`;
      el.style.top = `${this.position.y}px`;
    };

    setCursorPos(this.cursorDefault);
    setCursorPos(this.cursorHand);
    setCursorPos(this.cursorGrab);
    setCursorPos(this.cursorTooltip);

    requestAnimationFrame(() => this.animate());
  }
}

// ═══════════════════════════════════════════════════════════
// 🚀 INICIALIZAÇÃO - COM GUARD PARA DESKTOP ONLY
// ═══════════════════════════════════════════════════════════

let cursorSystem;

// Aguarda evento de experiência pronta
document.addEventListener('experience:ready', (e) => {
  if (e.detail.type !== 'desktop') {
    console.log('🚫 Cursor system disabled for mobile');
    return;
  }
  
  console.log('✅ Cursor system enabled for desktop');
  
  // Inicializa cursor system apenas no desktop
  cursorSystem = new CursorSystem();
  window.cursorSystem = cursorSystem;
});