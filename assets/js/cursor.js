/**
 * ═══════════════════════════════════════════════════════════
 * 🎯 SISTEMA DE CURSOR MODULAR
 * ═══════════════════════════════════════════════════════════
 * 
 * 4 Modelos Disponíveis:
 * - 'hand-craft': Mão artesanal detalhada
 * - 'geometric': Formas geométricas Bauhaus
 * - 'blob': Forma orgânica líquida
 * - 'arrow-evolved': Seta com elementos dinâmicos
 */

class CursorSystem {
    constructor(config = {}) {
      // ═══════════════════════════════════════════════════════
      // ⚙️ CONFIGURAÇÃO - ESCOLHA SEU MODELO AQUI!
      // ═══════════════════════════════════════════════════════
      this.selectedModel = config.model || 'hand-craft'; // 👈 MUDE AQUI!
      
      // Modelos disponíveis
      this.availableModels = [
        'hand-craft',    // Modelo 1
        'geometric',     // Modelo 2
        'blob',          // Modelo 3
        'arrow-evolved'  // Modelo 4
      ];
      
      // Valida modelo
      if (!this.availableModels.includes(this.selectedModel)) {
        console.warn(`Modelo "${this.selectedModel}" não encontrado. Usando "hand-craft".`);
        this.selectedModel = 'hand-craft';
      }
      
      // Elementos DOM
      this.cursorSystem = document.getElementById('cursorSystem');
      this.activeModel = null;
      this.cursorDefault = null;
      this.cursorHand = null;
      this.cursorText = null;
      this.cursorRipple = document.getElementById('cursorRipple');
      this.trailPath = null;
      
      // Estado
      this.position = { x: 0, y: 0 };
      this.target = { x: 0, y: 0 };
      this.currentState = 'default';
      
      // Trail (apenas para modelo 1)
      this.trailPoints = [];
      this.maxTrailLength = 8;
      
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
      this.activateModel(this.selectedModel);
      this.cacheElements();
      this.setupEventListeners();
      this.animate();
      
      console.log(`✅ Cursor System: Modelo "${this.selectedModel}" ativado`);
    }
    
    /**
     * Ativa um modelo específico
     */
    activateModel(modelName) {
      // Remove classe active de todos
      const allModels = this.cursorSystem.querySelectorAll('.cursor-model');
      allModels.forEach(m => m.classList.remove('active'));
      
      // Ativa o modelo escolhido
      this.activeModel = this.cursorSystem.querySelector(`[data-model="${modelName}"]`);
      
      if (this.activeModel) {
        this.activeModel.classList.add('active');
      } else {
        console.error(`Modelo "${modelName}" não encontrado no DOM`);
      }
    }
    
    /**
     * Cacheia elementos do modelo ativo
     */
    cacheElements() {
      if (!this.activeModel) return;
      
      this.cursorDefault = this.activeModel.querySelector('.cursor-default');
      this.cursorHand = this.activeModel.querySelector('.cursor-hand');
      this.cursorText = this.activeModel.querySelector('.cursor-text');
      this.trailPath = this.activeModel.querySelector('.trail-path');
    }
    
    setupEventListeners() {
      // Mouse move
      document.addEventListener('mousemove', (e) => {
        this.target.x = e.clientX;
        this.target.y = e.clientY;
        
        // Trail (apenas modelo 1)
        if (this.selectedModel === 'hand-craft' && this.trailPath) {
          this.trailPoints.push({ x: e.clientX, y: e.clientY });
          if (this.trailPoints.length > this.maxTrailLength) {
            this.trailPoints.shift();
          }
        }
      });
      
      // Click
      document.addEventListener('click', (e) => {
        this.triggerRipple(e.clientX, e.clientY);
      });
      
      // Detecta elementos interativos
      this.setupInteractiveElements();
    }
    
    setupInteractiveElements() {
      // Links e botões
      const interactiveElements = document.querySelectorAll(
        'a, button, .morphable, [role="button"]'
      );
      
      interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => this.setState('hand'));
        el.addEventListener('mouseleave', () => this.setState('default'));
      });
      
      // Campos de texto
      const textElements = document.querySelectorAll(
        'input[type="text"], textarea, [contenteditable="true"]'
      );
      
      textElements.forEach(el => {
        el.addEventListener('mouseenter', () => this.setState('text'));
        el.addEventListener('mouseleave', () => this.setState('default'));
      });
    }
    
    setState(newState) {
      if (this.currentState === newState) return;
      
      // Remove todos os estados
      this.cursorDefault.style.opacity = '0';
      this.cursorHand.classList.remove('active');
      this.cursorText.classList.remove('active');
      
      // Aplica novo estado
      this.currentState = newState;
      
      switch(newState) {
        case 'default':
          this.cursorDefault.style.opacity = '1';
          break;
        case 'hand':
          this.cursorHand.classList.add('active');
          break;
        case 'text':
          this.cursorText.classList.add('active');
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
    
    updateTrail() {
      if (!this.trailPath || this.trailPoints.length < 2) return;
      
      let pathData = `M${this.trailPoints[0].x},${this.trailPoints[0].y}`;
      
      for (let i = 1; i < this.trailPoints.length; i++) {
        pathData += ` L${this.trailPoints[i].x},${this.trailPoints[i].y}`;
      }
      
      this.trailPath.setAttribute('d', pathData);
    }
    
    animate() {
      // Interpola posição
      this.position.x = this.lerp(this.position.x, this.target.x, 0.15);
      this.position.y = this.lerp(this.position.y, this.target.y, 0.15);
      
      // Atualiza posições
      if (this.cursorDefault) {
        this.cursorDefault.style.left = `${this.position.x}px`;
        this.cursorDefault.style.top = `${this.position.y}px`;
      }
      
      if (this.cursorHand) {
        this.cursorHand.style.left = `${this.position.x}px`;
        this.cursorHand.style.top = `${this.position.y}px`;
      }
      
      if (this.cursorText) {
        this.cursorText.style.left = `${this.position.x}px`;
        this.cursorText.style.top = `${this.position.y}px`;
      }
      
      // Atualiza trail (modelo 1)
      if (this.selectedModel === 'hand-craft') {
        this.updateTrail();
      }
      
      requestAnimationFrame(() => this.animate());
    }
    
    /**
     * ═══════════════════════════════════════════════════════
     * 🔄 TROCA DE MODELO EM RUNTIME (opcional)
     * ═══════════════════════════════════════════════════════
     */
    switchModel(newModel) {
      if (!this.availableModels.includes(newModel)) {
        console.error(`Modelo "${newModel}" não existe`);
        return;
      }
      
      this.selectedModel = newModel;
      this.activateModel(newModel);
      this.cacheElements();
      
      // Reseta trail
      this.trailPoints = [];
      
      console.log(`✅ Modelo alterado para: "${newModel}"`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🚀 INICIALIZAÇÃO
  // ═══════════════════════════════════════════════════════════
  
  let cursorSystem;
  
  document.addEventListener('DOMContentLoaded', () => {
    // ⚙️ CONFIGURE SEU MODELO AQUI!
    cursorSystem = new CursorSystem({
      model: 'arrow-evolved'  // 👈 Opções: 'hand-craft', 'geometric', 'blob', 'arrow-evolved'
    });
    
    // Expõe globalmente para debug
    window.cursorSystem = cursorSystem;
  });
  
  // ═══════════════════════════════════════════════════════════
  // 💡 EXEMPLO DE USO:
  // ═══════════════════════════════════════════════════════════
  // No console, você pode testar:
  // cursorSystem.switchModel('geometric')
  // cursorSystem.switchModel('blob')
  // cursorSystem.switchModel('arrow-evolved')
  // cursorSystem.switchModel('hand-craft')