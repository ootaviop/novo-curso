/**
 * MODE NAVIGATION - Gerenciamento de Navegação entre Modos
 * Controla a navegação e transições entre diferentes modos de consumo
 */

class ModeNavigation {
  constructor(mobileExperience) {
    this.mobileExperience = mobileExperience;
    this.config = {
      transitionDuration: 400,
      swipeThreshold: 50,
      doubleTapDelay: 300
    };
    
    this.lastTapTime = 0;
    this.swipeStartX = 0;
    this.swipeStartY = 0;
    
    this.init();
  }
  
  /**
   * Inicializa sistema de navegação
   */
  init() {
    this.setupNavigationElements();
    this.addEventListeners();
    this.setupSwipeGestures();
  }
  
  /**
   * Configura elementos de navegação
   * HTML agora está no index.html, apenas manipula classes
   */
  setupNavigationElements() {
    // HTML já existe no index.html
    // Apenas configura modo inicial
    this.showModeSelector();
  }
  
  /**
   * Mostra seletor de modos
   */
  showModeSelector() {
    const selector = document.querySelector('.mobile-mode-selector');
    const navigation = document.querySelector('.mobile-navigation');
    const modeNav = document.querySelector('.mobile-mode-nav');
    
    if (selector) {
      selector.style.display = 'flex';
      selector.classList.add('active');
    }
    
    if (navigation) {
      navigation.classList.remove('active');
      const title = navigation.querySelector('.mobile-nav-title');
      if (title) title.textContent = 'Como você deseja consumir essa aula?';
    }
    
    if (modeNav) {
      modeNav.classList.remove('active');
    }
  }
  
  /**
   * Mostra interface do modo
   */
  showModeInterface(mode) {
    const selector = document.querySelector('.mobile-mode-selector');
    const navigation = document.querySelector('.mobile-navigation');
    const modeNav = document.querySelector('.mobile-mode-nav');
    
    // Esconde seletor
    if (selector) {
      selector.style.display = 'none';
      selector.classList.remove('active');
    }
    
    // Mostra navegação
    if (navigation) {
      navigation.classList.add('active');
      const title = navigation.querySelector('.mobile-nav-title');
      if (title) title.textContent = this.getModeTitle(mode);
      
      // Mostra indicador de modo
      const indicator = navigation.querySelector('.mobile-mode-indicator');
      if (indicator) {
        indicator.style.display = 'flex';
        const icon = indicator.querySelector('.mobile-mode-indicator-icon');
        const text = indicator.querySelector('.mobile-mode-indicator-text');
        if (icon) icon.textContent = this.getModeIcon(mode);
        if (text) text.textContent = this.getModeTitle(mode);
      }
    }
    
    // Mostra navegação inferior
    if (modeNav) {
      modeNav.classList.add('active');
      this.updateActiveNavItem(mode);
    }
  }
  
  /**
   * Atualiza item ativo na navegação
   */
  updateActiveNavItem(mode) {
    const navItems = document.querySelectorAll('.mobile-mode-nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.mode === mode) {
        item.classList.add('active');
      }
    });
  }
  
  /**
   * Retorna título do modo
   */
  getModeTitle(mode) {
    const titles = {
      podcast: 'Podcast',
      texto: 'Texto Corrido',
      pdf: 'PDF',
      braille: 'Braille'
    };
    return titles[mode] || mode;
  }
  
  /**
   * Retorna ícone do modo
   */
  getModeIcon(mode) {
    const icons = {
      podcast: '🎧',
      texto: '📖',
      pdf: '📄',
      braille: '⠃⠗⠁'
    };
    return icons[mode] || '📱';
  }
  
  /**
   * Configura gestos de swipe
   */
  setupSwipeGestures() {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    
    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
      
      this.handleSwipe(startX, startY, endX, endY);
    });
  }
  
  /**
   * Manipula gestos de swipe
   */
  handleSwipe(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const minSwipeDistance = 50;
    
    // Verifica se é um swipe horizontal significativo
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe para direita
        this.handleSwipeRight();
      } else {
        // Swipe para esquerda
        this.handleSwipeLeft();
      }
    }
  }
  
  /**
   * Manipula swipe para direita
   */
  handleSwipeRight() {
    // Swipe para direita pode voltar ao seletor de modos
    if (this.mobileExperience.currentMode) {
      this.mobileExperience.returnToModeSelector();
    }
  }
  
  /**
   * Manipula swipe para esquerda
   */
  handleSwipeLeft() {
    // Implementar navegação entre modos se necessário
    console.log('Swipe left detected');
  }
  
  /**
   * Adiciona event listeners
   */
  addEventListeners() {
    // Botão voltar
    document.addEventListener('click', (e) => {
      if (e.target.closest('.mobile-nav-back')) {
        e.preventDefault();
        this.handleBackNavigation();
      }
    });
    
    // Navegação inferior
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('.mobile-mode-nav-item');
      if (navItem) {
        e.preventDefault();
        const mode = navItem.dataset.mode;
        this.handleModeNavigation(mode);
      }
    });
    
    // Double tap para voltar
    document.addEventListener('touchend', (e) => {
      const currentTime = Date.now();
      if (currentTime - this.lastTapTime < this.config.doubleTapDelay) {
        this.handleDoubleTap();
      }
      this.lastTapTime = currentTime;
    });
    
    // Ações da navegação superior
    document.addEventListener('click', (e) => {
      const action = e.target.closest('.mobile-nav-action');
      if (action) {
        const actionType = action.dataset.action;
        this.handleNavAction(actionType);
      }
    });
  }
  
  /**
   * Manipula navegação de voltar
   */
  handleBackNavigation() {
    if (this.mobileExperience.currentMode) {
      this.mobileExperience.returnToModeSelector();
    }
  }
  
  /**
   * Manipula navegação entre modos
   */
  handleModeNavigation(mode) {
    if (this.mobileExperience.isValidMode(mode)) {
      this.mobileExperience.handleModeSelection(mode);
    }
  }
  
  /**
   * Manipula double tap
   */
  handleDoubleTap() {
    // Double tap pode alternar entre modos ou voltar
    if (this.mobileExperience.currentMode) {
      this.handleBackNavigation();
    }
  }
  
  /**
   * Manipula ações da navegação
   */
  handleNavAction(action) {
    switch (action) {
      case 'settings':
        this.showSettings();
        break;
      default:
        console.log('Unknown nav action:', action);
    }
  }
  
  /**
   * Mostra configurações (placeholder)
   */
  showSettings() {
    // TODO: Implementar modal de configurações
    console.log('Settings clicked');
    
    // Por enquanto, mostra alerta
    alert('Configurações serão implementadas nas próximas fases');
  }
  
  /**
   * Anima transição entre modos
   */
  animateModeTransition(fromMode, toMode) {
    // Implementar animações específicas se necessário
    console.log(`Animating transition from ${fromMode} to ${toMode}`);
  }
  
  /**
   * Destroi a instância
   */
  destroy() {
    // Remove event listeners se necessário
    console.log('ModeNavigation destroyed');
  }
}

// Exporta para uso global se necessário
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModeNavigation;
}
