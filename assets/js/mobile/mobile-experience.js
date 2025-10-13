/**
 * MOBILE EXPERIENCE - Sistema Principal
 * Gerencia a experiência mobile isolada do sistema desktop
 * Foca em: seletor de modos, navegação interna, persistência
 */

class MobileExperience {
  constructor() {
    this.config = {
      animationDuration: 400,
      localStorageKey: 'mobile-preferred-mode'
    };
    
    this.currentMode = null;
    this.isInitialized = false;
    
    // Bind methods
    this.handleModeSelection = this.handleModeSelection.bind(this);
    
    // Escuta evento de experiência pronta
    this.setupExperienceListener();
  }
  
  /**
   * Escuta evento experience:ready do ExperienceRouter
   */
  setupExperienceListener() {
    document.addEventListener('experience:ready', (e) => {
      if (e.detail.type === 'mobile') {
        this.init();
      }
    });
  }
  
  /**
   * Inicializa o sistema mobile
   */
  init() {
    if (this.isInitialized) {
      console.log('🔄 Mobile Experience: reinicializando');
    }
    
    // Carrega modo preferido se existir
    this.loadPreferredMode();
    
    // Inicializa componentes
    this.initializeComponents();
    
    this.isInitialized = true;
    
    console.log('✅ Mobile Experience: inicializado');
  }
  
  /**
   * Carrega modo preferido do localStorage
   */
  loadPreferredMode() {
    const savedMode = localStorage.getItem(this.config.localStorageKey);
    if (savedMode && this.isValidMode(savedMode)) {
      // Aplicar modo salvo (implementar nas próximas fases)
      console.log('Preferred mode loaded:', savedMode);
    }
  }
  
  /**
   * Valida se o modo é válido
   */
  isValidMode(mode) {
    const validModes = ['podcast', 'texto', 'pdf', 'braille'];
    return validModes.includes(mode);
  }
  
  /**
   * Salva modo preferido no localStorage
   */
  savePreferredMode(mode) {
    if (this.isValidMode(mode)) {
      localStorage.setItem(this.config.localStorageKey, mode);
    }
  }
  
  /**
   * Inicializa componentes mobile
   */
  initializeComponents() {
    // Inicializa seletor de modos
    this.initializeModeSelector();
    
    // Inicializa navegação
    this.initializeNavigation();
  }
  
  /**
   * Inicializa o seletor de modos
   */
  initializeModeSelector() {
    const selector = document.querySelector('.mobile-mode-selector');
    if (!selector) return;
    
    selector.classList.add('active');
    
    // Adiciona event listeners aos quadrantes
    const quadrants = selector.querySelectorAll('.mobile-mode-quadrant');
    quadrants.forEach(quadrant => {
      quadrant.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.handleModeSelection(mode);
      });
      
      // Haptic feedback (se disponível)
      quadrant.addEventListener('touchstart', () => {
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      });
    });
  }
  
  /**
   * Inicializa sistema de navegação
   */
  initializeNavigation() {
    const navigation = document.querySelector('.mobile-navigation');
    if (!navigation) return;
    
    // Botão voltar
    const backButton = navigation.querySelector('.mobile-nav-back');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.returnToModeSelector();
      });
    }
    
    // Navegação entre modos (bottom nav)
    const modeNav = document.querySelector('.mobile-mode-nav');
    if (modeNav) {
      const navItems = modeNav.querySelectorAll('.mobile-mode-nav-item');
      navItems.forEach(item => {
        item.addEventListener('click', (e) => {
          const mode = e.currentTarget.dataset.mode;
          this.handleModeSelection(mode);
        });
      });
    }
  }
  
  /**
   * Manipula seleção de modo
   */
  handleModeSelection(mode) {
    if (!this.isValidMode(mode)) {
      console.error('Invalid mode selected:', mode);
      return;
    }
    
    console.log('Mode selected:', mode);
    
    // Salva preferência
    this.savePreferredMode(mode);
    
    // Aplica modo selecionado
    this.applyMode(mode);
  }
  
  /**
   * Aplica modo selecionado
   */
  applyMode(mode) {
    this.currentMode = mode;
    
    // Esconde seletor de modos
    this.hideModeSelector();
    
    // Mostra navegação
    this.showNavigation(mode);
    
    // Aplica modo específico (implementar nas próximas fases)
    this.loadModeInterface(mode);
    
    // Anima transição
    this.animateModeTransition(mode);
  }
  
  /**
   * Esconde seletor de modos
   */
  hideModeSelector() {
    const selector = document.querySelector('.mobile-mode-selector');
    if (selector) {
      selector.classList.remove('active');
      selector.style.display = 'none';
    }
  }
  
  /**
   * Mostra navegação
   */
  showNavigation(mode) {
    const navigation = document.querySelector('.mobile-navigation');
    const modeNav = document.querySelector('.mobile-mode-nav');
    
    if (navigation) {
      navigation.classList.add('active');
      
      // Atualiza título
      const title = navigation.querySelector('.mobile-nav-title');
      if (title) {
        title.textContent = this.getModeTitle(mode);
      }
      
      // Atualiza indicador de modo
      this.updateModeIndicator(mode);
    }
    
    if (modeNav) {
      modeNav.classList.add('active');
      
      // Atualiza item ativo
      this.updateActiveNavItem(mode);
    }
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
   * Atualiza indicador de modo
   */
  updateModeIndicator(mode) {
    const indicator = document.querySelector('.mobile-mode-indicator');
    if (!indicator) return;
    
    const icon = indicator.querySelector('.mobile-mode-indicator-icon');
    const text = indicator.querySelector('.mobile-mode-indicator-text');
    
    if (icon) icon.textContent = this.getModeIcon(mode);
    if (text) text.textContent = this.getModeTitle(mode);
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
   * Carrega interface do modo
   */
  loadModeInterface(mode) {
    console.log(`Loading interface for mode: ${mode}`);
    
    switch (mode) {
      case 'podcast':
        this.loadPodcastInterface();
        break;
      case 'texto':
        this.showModePlaceholder(mode);
        break;
      case 'pdf':
        this.showModePlaceholder(mode);
        break;
      case 'braille':
        this.showModePlaceholder(mode);
        break;
      default:
        console.warn(`Modo não implementado: ${mode}`);
        this.showModePlaceholder(mode);
    }
  }
  
  /**
   * Carrega interface do podcast
   */
  loadPodcastInterface() {
    const container = document.querySelector('.mobile-podcast-player');
    if (!container) {
      console.error('Container do podcast player não encontrado');
      return;
    }
    
    // Esconde outros elementos mobile
    this.hideMobileElements();
    
    // Mostra container do podcast
    container.style.display = 'block';
    
    // Inicializa o player
    try {
      this.currentPodcastPlayer = new PodcastPlayer(container, this);
      console.log('✅ Interface do podcast carregada');
    } catch (error) {
      console.error('❌ Erro ao carregar interface do podcast:', error);
      this.showModePlaceholder('podcast');
    }
  }
  
  /**
   * Esconde elementos mobile padrão
   */
  hideMobileElements() {
    const elementsToHide = [
      '.mobile-mode-selector',
      '.mobile-mode-nav'
    ];
    
    elementsToHide.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.display = 'none';
      }
    });
  }
  
  /**
   * Mostra elementos mobile padrão
   */
  showMobileElements() {
    const elementsToShow = [
      '.mobile-mode-selector',
      '.mobile-mode-nav'
    ];
    
    elementsToShow.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.display = '';
      }
    });
  }
  
  /**
   * Mostra placeholder do modo (temporário)
   * TODO: Implementar interfaces específicas nas próximas fases
   */
  showModePlaceholder(mode) {
    // Placeholder simplificado sem criar HTML dinamicamente
    console.log(`📱 Modo ${mode} selecionado - Interface será implementada na Fase 2`);
  }
  
  /**
   * Anima transição entre modos
   */
  animateModeTransition(mode) {
    // Implementar animações específicas se necessário
    console.log(`Animating transition to mode: ${mode}`);
  }
  
  /**
   * Retorna ao seletor de modos
   */
  returnToModeSelector() {
    // Cleanup do player atual se existir
    if (this.currentPodcastPlayer) {
      this.currentPodcastPlayer.cleanup();
      this.currentPodcastPlayer = null;
    }
    
    // Esconde navegação
    this.hideNavigation();
    
    // Remove placeholder atual
    const placeholder = document.querySelector('.mobile-mode-placeholder');
    if (placeholder) placeholder.remove();
    
    // Esconde container do podcast
    const podcastContainer = document.querySelector('.mobile-podcast-player');
    if (podcastContainer) {
      podcastContainer.style.display = 'none';
    }
    
    // Mostra elementos mobile padrão
    this.showMobileElements();
    
    // Mostra seletor de modos
    this.showModeSelector();
    
    // Reset modo atual
    this.currentMode = null;
  }
  
  /**
   * Esconde navegação
   */
  hideNavigation() {
    const navigation = document.querySelector('.mobile-navigation');
    const modeNav = document.querySelector('.mobile-mode-nav');
    
    if (navigation) navigation.classList.remove('active');
    if (modeNav) modeNav.classList.remove('active');
  }
  
  /**
   * Mostra seletor de modos
   */
  showModeSelector() {
    const selector = document.querySelector('.mobile-mode-selector');
    if (selector) {
      selector.style.display = 'flex';
      selector.classList.add('active');
    }
  }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.mobileExperience = new MobileExperience();
});
