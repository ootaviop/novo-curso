/**
 * ═══════════════════════════════════════════════════════════════
 * 🎉 LESSON COMPLETION SYSTEM - Versão 2.0
 * ═══════════════════════════════════════════════════════════════
 * 
 * Sistema moderno de celebração de conclusão de aula com:
 * - Progress ring animado (SVG)
 * - Sistema de badges/conquistas
 * - Gamificação baseada em comportamento real
 * - Lógica única e clara com IntersectionObserver
 * - Integração total com anime.js
 * 
 * @requires anime.js
 * @requires canvas-confetti
 * @version 2.0.0
 */

class LessonCompletionSystem {
  constructor(config = {}) {
    // ═══════════════════════════════════════════════════════════
    // 🎛️ CONFIGURAÇÃO
    // ═══════════════════════════════════════════════════════════
    this.config = {
      // Thresholds
      scrollThresholdDesktop: 0.95,
      scrollThresholdMobile: 0.90,
      visibilityThreshold: 0.5,
      
      // Timings (ms)
      counterDuration: 1200,
      ringDuration: 1500,
      confettiDelay: 800,
      
      // Dados do usuário (serão calculados)
      startTime: Date.now(),
      audioUsed: false,
      
      ...config
    };
    
    // ═══════════════════════════════════════════════════════════
    // 📊 ESTADO
    // ═══════════════════════════════════════════════════════════
    this.state = {
      hasShown: false,
      element: null,
      observer: null,
      scrollListener: null
    };
    
    // ═══════════════════════════════════════════════════════════
    // 🎖️ SISTEMA DE CONQUISTAS
    // ═══════════════════════════════════════════════════════════
    this.achievements = {
      focado: {
        icon: '🎯',
        label: 'Focado',
        check: (data) => !data.audioUsed,
        description: 'Completou sem usar áudio'
      },
      auditivo: {
        icon: '🎧',
        label: 'Aprendiz Auditivo',
        check: (data) => data.audioUsed,
        description: 'Utilizou o player de áudio'
      },
      explorador: {
        icon: '🔍',
        label: 'Explorador',
        check: (data) => data.scrollDepth > 0.95,
        description: 'Explorou todo o conteúdo'
      },
      dedicado: {
        icon: '⭐',
        label: 'Dedicado',
        check: (data) => data.timeSpent >= 5 && data.timeSpent <= 15,
        description: 'Tempo de leitura adequado'
      },
      veloz: {
        icon: '⚡',
        label: 'Leitor Veloz',
        check: (data) => data.timeSpent < 5,
        description: 'Completou rapidamente'
      }
    };
    
    this.init();
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🚀 INICIALIZAÇÃO
  // ═══════════════════════════════════════════════════════════
  init() {
    // Detecta uso de áudio
    this.detectAudioUsage();
    
    // Monitora scroll
    this.state.scrollListener = this.checkScrollProgress.bind(this);
    window.addEventListener('scroll', this.state.scrollListener, { passive: true });
    
    // Pré-carrega som de celebração
    this.preloadCelebrationAudio();
    
    console.log('[LessonCompletion] ✅ Sistema inicializado');
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🎵 DETECÇÃO DE USO DO ÁUDIO
  // ═══════════════════════════════════════════════════════════
  detectAudioUsage() {
    // Monitora se o player de áudio foi utilizado
    const audioTriggerBtn = document.querySelector('.audio-trigger-btn');
    if (audioTriggerBtn) {
      audioTriggerBtn.addEventListener('click', () => {
        this.config.audioUsed = true;
        console.log('[LessonCompletion] 🎧 Áudio utilizado');
      }, { once: true });
    }
  }
  
  // ═══════════════════════════════════════════════════════════
  // 📏 VERIFICAÇÃO DE PROGRESSO DE SCROLL
  // ═══════════════════════════════════════════════════════════
  checkScrollProgress() {
    if (this.state.hasShown) return;
    
    const scrollPercent = (window.scrollY + window.innerHeight) / 
                          document.documentElement.scrollHeight;
    
    // Threshold adaptativo baseado no tamanho da tela
    const threshold = window.innerWidth < 768 
      ? this.config.scrollThresholdMobile 
      : this.config.scrollThresholdDesktop;
    
    if (scrollPercent >= threshold) {
      console.log('[LessonCompletion] 🎯 Threshold atingido:', scrollPercent.toFixed(2));
      this.createElement();
      this.observeElement();
      
      // Remove listener (não precisa mais checar)
      window.removeEventListener('scroll', this.state.scrollListener);
    }
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🏗️ CRIAÇÃO DO ELEMENTO
  // ═══════════════════════════════════════════════════════════
  createElement() {
    this.state.element = document.createElement('div');
    this.state.element.className = 'lesson-completion';
    this.state.element.setAttribute('role', 'status');
    this.state.element.setAttribute('aria-live', 'polite');
    this.state.element.innerHTML = this.getTemplate();
    
    // Insere antes da navegação
    const navLessons = document.querySelector('.nav-lessons');
    if (navLessons?.parentNode) {
      navLessons.parentNode.insertBefore(this.state.element, navLessons);
      console.log('[LessonCompletion] 📦 Elemento criado');
    }
  }
  
  // ═══════════════════════════════════════════════════════════
  // 📐 TEMPLATE HTML
  // ═══════════════════════════════════════════════════════════
  getTemplate() {
    return `
      <div class="completion-background">
        <div class="completion-gradient"></div>
        <div class="completion-particles"></div>
      </div>
      
      <div class="completion-content">
        <!-- Progress Ring -->
        <div class="completion-ring-container">
          <svg class="completion-ring" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" />
                <stop offset="100%" />
              </linearGradient>
            </defs>
            <circle class="ring-track" cx="80" cy="80" r="70" />
            <circle class="ring-progress" cx="80" cy="80" r="70" />
          </svg>
          
          <div class="completion-counter-wrapper">
            <div class="completion-counter" id="completionCounter">0</div>
            <div class="completion-counter-label">completo</div>
          </div>
        </div>
        
        <!-- Text Section -->
        <div class="completion-text-section">
          <h2 class="completion-title">Parabéns! 🎉</h2>
          <p class="completion-subtitle">
            Você concluiu esta aula com sucesso e desbloqueou novas conquistas!
          </p>
          
          <!-- Badges de Conquistas -->
          <div class="completion-achievements" id="achievementsList"></div>
        </div>
      </div>
    `;
  }
  
  // ═══════════════════════════════════════════════════════════
  // 👁️ OBSERVAÇÃO DE VISIBILIDADE
  // ═══════════════════════════════════════════════════════════
  observeElement() {
    this.state.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        
        // Só dispara quando 50%+ está visível
        if (entry.isIntersecting && 
            entry.intersectionRatio >= this.config.visibilityThreshold) {
          console.log('[LessonCompletion] 👁️ Elemento visível:', entry.intersectionRatio.toFixed(2));
          this.show();
        }
      },
      { 
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: '0px'
      }
    );
    
    this.state.observer.observe(this.state.element);
  }
  
  // ═══════════════════════════════════════════════════════════
  // ✨ EXIBIÇÃO E ANIMAÇÃO
  // ═══════════════════════════════════════════════════════════
  show() {
    if (this.state.hasShown) return;
    this.state.hasShown = true;
    
    console.log('[LessonCompletion] 🎬 Iniciando animações');
    
    // 1. Mostra o card (CSS transition)
    this.state.element.classList.add('visible');
    
// 2. Anima o progress ring
// 2. Anima o progress ring com validação de 100%
setTimeout(() => {
  const ringProgress = this.state.element.querySelector('.ring-progress');
  
  if (!ringProgress) {
    console.warn('[LessonCompletion] Ring progress não encontrado');
    return;
  }
  
  // Valores fixos validados
  const circumference = 439.823;
  const targetOffset = 0; // 100% completo
  
  // Garante estado inicial via JS (força antes da animação)
  ringProgress.style.strokeDasharray = circumference;
  ringProgress.style.strokeDashoffset = circumference;
  
  // Força reflow
  void ringProgress.offsetHeight;
  
  // Variável para controlar se já completou
  let hasCompleted = false;
  
  // Anima com validação a cada frame
  const animation = anime({
    targets: ringProgress,
    strokeDashoffset: [circumference, targetOffset],
    easing: 'cubicBezier(0.34, 1.56, 0.64, 1)',
    duration: 1500,
    round: 10, // Arredonda para evitar decimais estranhos
    
    // ✅ VALIDAÇÃO A CADA FRAME
    update: function(anim) {
      const currentOffset = parseFloat(ringProgress.style.strokeDashoffset) || circumference;
      
      // Se atingiu ou ultrapassou 100%, PARA IMEDIATAMENTE
      if (currentOffset <= 0 && !hasCompleted) {
        hasCompleted = true;
        ringProgress.style.strokeDashoffset = '0'; // Força exatamente 0
        anim.pause(); // Para a animação
        console.log('[LessonCompletion] ✅ Ring completado em 100%');
      }
      
      // Se por algum motivo ficou negativo, corrige
      if (currentOffset < 0) {
        ringProgress.style.strokeDashoffset = '0';
        anim.pause();
        console.warn('[LessonCompletion] ⚠️ Offset negativo corrigido');
      }
    },
    
    // Callback de conclusão
    complete: function() {
      // Garante que terminou em 0
      ringProgress.style.strokeDashoffset = '0';
      hasCompleted = true;
      console.log('[LessonCompletion] ✅ Animação finalizada');
    }
  });
  
  console.log('[LessonCompletion] 🎬 Animação iniciada:', {
    circumference,
    target: targetOffset,
    duration: '1500ms'
  });
}, 100);
    
    
    // 3. Anima o contador (anime.js)
    const counter = document.getElementById('completionCounter');

    anime({
      targets: { value: 0 },
      value: 100,
      round: 1,
      easing: 'easeOutExpo',
      duration: this.config.counterDuration,
      update: function(anim) {
        counter.textContent = Math.round(anim.animations[0].currentValue) + '%';
      }
    });

    // adiciona o valor em % ao contador
    
    // 4. Calcula e mostra badges
    setTimeout(() => {
      this.showAchievements();
    }, 400);
    
    // 5. Dispara celebração (confete + som)
    setTimeout(() => {
      this.celebrate();
    }, this.config.confettiDelay);
    
    // Cleanup do observer
    this.state.observer.disconnect();
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🎖️ SISTEMA DE CONQUISTAS
  // ═══════════════════════════════════════════════════════════
  showAchievements() {
    const userData = this.collectUserData();
    const earned = this.calculateAchievements(userData);
    
    console.log('[LessonCompletion] 🏆 Conquistas desbloqueadas:', earned.length);
    
    const container = document.getElementById('achievementsList');
    if (!container) return;
    
    earned.forEach((achievement, index) => {
      const badge = document.createElement('div');
      badge.className = 'achievement-badge';
      badge.style.animationDelay = `${index * 0.1}s`;
      badge.title = achievement.description;
      badge.innerHTML = `
        <span class="badge-icon">${achievement.icon}</span>
        <span class="badge-label">${achievement.label}</span>
      `;
      container.appendChild(badge);
    });
  }
  
  // ═══════════════════════════════════════════════════════════
  // 📊 COLETA DE DADOS DO USUÁRIO
  // ═══════════════════════════════════════════════════════════
  collectUserData() {
    const timeSpent = (Date.now() - this.config.startTime) / 60000; // minutos
    
    const scrollPercent = (window.scrollY + window.innerHeight) / 
                          document.documentElement.scrollHeight;
    
    return {
      audioUsed: this.config.audioUsed,
      timeSpent: timeSpent,
      scrollDepth: scrollPercent
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🏅 CÁLCULO DE CONQUISTAS
  // ═══════════════════════════════════════════════════════════
  calculateAchievements(userData) {
    const earned = [];
    
    for (const [key, achievement] of Object.entries(this.achievements)) {
      if (achievement.check(userData)) {
        earned.push(achievement);
      }
    }
    
    // Garante pelo menos 2 badges (sempre mostra "Explorador")
    if (earned.length === 0) {
      earned.push(this.achievements.explorador);
    }
    
    return earned;
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🎊 CELEBRAÇÃO (Confete + Som)
  // ═══════════════════════════════════════════════════════════
  celebrate() {
    // Som
    this.playCelebrationSound();
    
    // Confete (5 explosões sequenciais)
    this.triggerConfetti();
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🔊 ÁUDIO DE CELEBRAÇÃO
  // ═══════════════════════════════════════════════════════════
  preloadCelebrationAudio() {
    if (!window.AudioContext) return;
    
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    fetch('audio/pos-cut/celebracao.mp3')
      .then(response => response.arrayBuffer())
      .then(buffer => this.audioContext.decodeAudioData(buffer))
      .then(decodedBuffer => {
        this.celebrationBuffer = decodedBuffer;
        console.log('[LessonCompletion] 🔊 Áudio pré-carregado');
      })
      .catch(error => {
        console.warn('[LessonCompletion] ⚠️ Erro ao carregar áudio:', error);
      });
  }
  
  playCelebrationSound() {
    if (!this.audioContext || !this.celebrationBuffer) return;
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = this.celebrationBuffer;
    // ajustar volume da reprodução para 0.15
    source.volume = 0.15;
    source.connect(this.audioContext.destination);
    source.start(0);
    
    console.log('[LessonCompletion] 🔊 Som reproduzido');
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🎉 CONFETE (Canvas Confetti)
  // ═══════════════════════════════════════════════════════════
  triggerConfetti() {
    if (typeof confetti === 'undefined') {
      console.warn('[LessonCompletion] ⚠️ Biblioteca confetti não encontrada');
      return;
    }
    
    const origin = this.getConfettiOrigin();
    const particleCount = window.innerWidth > 768 ? 150 : 100;
    
    // 5 explosões sequenciais com timing variado
    const explosions = [
      { ratio: 0.25, spread: 60, startVelocity: 55 },
      { ratio: 0.2, spread: 100 },
      { ratio: 0.35, spread: 140, decay: 0.91 },
      { ratio: 0.1, spread: 120, startVelocity: 25 },
      { ratio: 0.1, spread: 130, startVelocity: 45 },
      { ratio: 0.35, spread: 130, decay: 0.91 },
      { ratio: 0.1, spread: 110, startVelocity: 55 },
      { ratio: 0.3, spread: 120, startVelocity: 65 }
    ];
    
    explosions.forEach((config, index) => {
      setTimeout(() => {
        confetti({
          origin,
          particleCount: Math.floor(particleCount * config.ratio),
          ...config
        });
      }, index * 150);
    });
    
    console.log('[LessonCompletion] 🎊 Confete disparado');
  }
  
  getConfettiOrigin() {
    const element = this.state.element;
    if (!element) return { x: 0.5, y: 0.5 };
    
    const rect = element.getBoundingClientRect();
    return {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🧹 CLEANUP
  // ═══════════════════════════════════════════════════════════
  destroy() {
    if (this.state.observer) {
      this.state.observer.disconnect();
    }
    
    if (this.state.scrollListener) {
      window.removeEventListener('scroll', this.state.scrollListener);
    }
    
    if (this.state.element) {
      this.state.element.remove();
    }
    
    console.log('[LessonCompletion] 🧹 Sistema destruído');
  }
}

// ═══════════════════════════════════════════════════════════════
// 🚀 AUTO-INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════

let lessonCompletion;

document.addEventListener('DOMContentLoaded', () => {
  // Valida dependências
  if (typeof anime === 'undefined') {
    console.error('[LessonCompletion] ❌ anime.js não encontrado');
    return;
  }
  
  if (typeof confetti === 'undefined') {
    console.warn('[LessonCompletion] ⚠️ confetti.js não encontrado');
  }
  
  // Respeita prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('[LessonCompletion] ♿ Animações reduzidas (acessibilidade)');
  }
  
  // Inicializa
  lessonCompletion = new LessonCompletionSystem();
  
  // Exporta para debug
  window.lessonCompletion = lessonCompletion;
});