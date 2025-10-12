/**
 * EXPERIENCE ROUTER - Sistema Orquestrador Desktop/Mobile
 * Gerencia detecção de dispositivo e carregamento condicional de assets
 * Usa Custom Events para comunicação desacoplada
 */

class ExperienceRouter {
  constructor() {
    this.breakpoint = 768;
    this.experienceType = this.detectExperience();
    this.stylesLoaded = false;
    this.scriptsLoaded = false;
    this.skeletonElement = null;
  }
  
  /**
   * Detecta tipo de experiência baseado na largura da viewport
   */
  detectExperience() {
    return window.innerWidth <= this.breakpoint ? 'mobile' : 'desktop';
  }
  
  /**
   * Inicializa o router
   */
  async init() {
    console.log(`🎯 Experience Router: ${this.experienceType} detectado`);
    
    this.initializeSkeleton();
    this.showSkeleton();
    this.hideInactiveExperience();
    
    await this.loadExperienceAssets();
    await this.delay(250); // Garante renderização
    
    // Mostra desktop experience após CSS carregar
    if (this.experienceType === 'desktop') {
      const desktopExp = document.querySelector('.desktop-experience');
      if (desktopExp) desktopExp.style.opacity = '1';
    }
    
    this.hideSkeleton();
    this.dispatchReadyEvent();
    this.watchResize();
  }
  
  /**
   * Esconde experiência inativa
   */
  hideInactiveExperience() {
    const desktopExp = document.querySelector('.desktop-experience');
    const mobileExp = document.querySelector('.mobile-experience');
    
    if (this.experienceType === 'mobile') {
      if (desktopExp) desktopExp.style.display = 'none';
      if (mobileExp) {
        mobileExp.style.display = 'block';
        mobileExp.classList.add('mobile-visible');
      }
    } else {
      if (desktopExp) {
        desktopExp.style.display = 'block';
        desktopExp.style.opacity = '0'; // Oculta até CSS carregar
      }
      if (mobileExp) {
        mobileExp.style.display = 'none';
        mobileExp.classList.remove('mobile-visible');
      }
    }
  }
  
  /**
   * Carrega assets específicos da experiência
   */
  async loadExperienceAssets() {
    try {
      if (this.experienceType === 'desktop') {
        await Promise.all([
          this.loadDesktopStyles(),
          this.loadDesktopScripts()
        ]);
      } else {
        await Promise.all([
          this.loadMobileStyles(),
          this.loadMobileScripts()
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar assets:', error);
    }
  }
  
  /**
   * Carrega estilos desktop
   */
  loadDesktopStyles() {
    return new Promise((resolve) => {
      if (this.stylesLoaded) return resolve();
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'assets/css/desktop.bundle.css';
      link.onload = () => {
        console.log('✅ Desktop CSS carregado');
        this.stylesLoaded = true;
        resolve();
      };
      document.head.appendChild(link);
    });
  }
  
  /**
   * Carrega estilos mobile
   */
  loadMobileStyles() {
    return new Promise((resolve) => {
      if (this.stylesLoaded) return resolve();
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'assets/css/mobile.bundle.css';
      link.onload = () => {
        console.log('✅ Mobile CSS carregado');
        this.stylesLoaded = true;
        resolve();
      };
      document.head.appendChild(link);
    });
  }
  
  /**
   * Carrega scripts desktop
   * Scripts individuais têm seus próprios guards experience:ready
   */
  async loadDesktopScripts() {
    // Scripts desktop já estão no HTML mas com guards
    // Este método serve para carregar scripts adicionais se necessário
    console.log('✅ Desktop scripts prontos (com guards)');
    this.scriptsLoaded = true;
  }
  
  /**
   * Carrega scripts mobile
   */
  async loadMobileScripts() {
    // Scripts mobile já estão no HTML
    console.log('✅ Mobile scripts prontos');
    this.scriptsLoaded = true;
  }
  
  /**
   * Dispara evento de experiência pronta
   */
  dispatchReadyEvent() {
    const event = new CustomEvent('experience:ready', {
      detail: { 
        type: this.experienceType,
        timestamp: Date.now()
      }
    });
    document.dispatchEvent(event);
    console.log(`📢 Event dispatched: experience:ready (${this.experienceType})`);
  }
  
  /**
   * Inicializa referência ao skeleton
   */
  initializeSkeleton() {
    this.skeletonElement = document.getElementById('experienceSkeleton');
    if (!this.skeletonElement) {
      console.warn('⚠️ Skeleton element não encontrado');
    }
  }
  
  /**
   * Mostra skeleton apropriado
   */
  showSkeleton() {
    if (!this.skeletonElement) return;
    
    const skeletonDesktop = document.getElementById('skeletonDesktop');
    const skeletonMobile = document.getElementById('skeletonMobile');
    
    // Mostra skeleton correto
    if (this.experienceType === 'desktop') {
      if (skeletonDesktop) skeletonDesktop.style.display = 'block';
      if (skeletonMobile) skeletonMobile.style.display = 'none';
    } else {
      if (skeletonDesktop) skeletonDesktop.style.display = 'none';
      if (skeletonMobile) skeletonMobile.style.display = 'block';
    }
    
    // Mostra container principal
    this.skeletonElement.classList.remove('hidden', 'removed');
    console.log(`🎭 Skeleton ${this.experienceType} exibido`);
  }
  
  /**
   * Esconde skeleton com fade out
   */
  hideSkeleton() {
    if (!this.skeletonElement) return;
    
    // Fade out
    this.skeletonElement.classList.add('hidden');
    
    // Remove completamente após transição
    setTimeout(() => {
      this.skeletonElement.classList.add('removed');
      console.log('🎭 Skeleton removido');
    }, 300);
  }
  
  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Observa mudanças de tamanho da janela
   */
  watchResize() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      
      resizeTimeout = setTimeout(async () => {
        const newExperience = this.detectExperience();
        
        if (newExperience !== this.experienceType) {
          console.log(`🔄 Experience mudou: ${this.experienceType} → ${newExperience}`);
          
          // Dispara evento de mudança
          const changeEvent = new CustomEvent('experience:changed', {
            detail: {
              from: this.experienceType,
              to: newExperience,
              timestamp: Date.now()
            }
          });
          document.dispatchEvent(changeEvent);
          
          // Atualiza tipo
          this.experienceType = newExperience;
          this.stylesLoaded = false;
          this.scriptsLoaded = false;
          
          // Mostra skeleton, carrega e esconde
          this.showSkeleton();
          this.hideInactiveExperience();
          
          await this.loadExperienceAssets();
          await this.delay(250);
          
          // Mostra experiência após CSS carregar
          if (this.experienceType === 'desktop') {
            const desktopExp = document.querySelector('.desktop-experience');
            if (desktopExp) desktopExp.style.opacity = '1';
          }
          
          this.hideSkeleton();
          this.dispatchReadyEvent();
        }
      }, 300);
    });
  }
}

// Auto-inicialização
const router = new ExperienceRouter();

// Inicia após DOM estar pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => router.init());
} else {
  router.init();
}

// Exporta para uso global
window.ExperienceRouter = ExperienceRouter;
window.experienceRouter = router;

