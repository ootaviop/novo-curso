// 🎉 Confetes no final da aula - VERSÃO COM SINCRONIZAÇÃO DE SCROLL
let hasTriggered = false;
let hasInserted = false;
let completionObserver = null;
let animationState = {
  isAnimating: false,
  isPaused: false,
  currentValue: 0,
  animationId: null,
  initialAnimationComplete: false,
  scrollControlled: false
};

// 🔊 Audio Context para som de celebração
let audioContext = null;
let celebrationBuffer = null;

/**
 * Cria o elemento de conclusão da aula dinamicamente
 */
function createCompletionElement() {
  const div = document.createElement('div');
  div.className = 'lesson-completion';
  div.id = 'lessonCompletion';
  div.setAttribute('role', 'status');
  div.setAttribute('aria-live', 'polite');
  
  div.innerHTML = `
    <div class="completion-icon">🎓</div>
    <div class="completion-content">
      <h2 class="completion-title">Parabéns!</h2>
      <p class="completion-message">
        Você completou 
        <span class="completion-counter" id="completionCounter">0</span>% 
        da aula
      </p>
    </div>
  `;
  
  return div;
}

function getConfettiOrigin() {
  const navLessons = document.querySelector('.nav-lessons');
  if (!navLessons) return { x: 0.5, y: 0.6 };
  
  const rect = navLessons.getBoundingClientRect();
  return {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight
  };
}

/**
 * ✨ Verifica se qualquer parte da div está visível na viewport
 * Agora inicia animação assim que elemento aparece (qualquer visibilidade)
 */
function isCounterVisible() {
  const completionDiv = document.getElementById('lessonCompletion');
  
  if (!completionDiv) {
    console.warn('[Completion] Elemento não encontrado');
    return false;
  }
  
  // Verifica se o elemento tem a classe 'visible' (transição CSS completou)
  if (!completionDiv.classList.contains('visible')) {
    console.log('[Completion] Elemento ainda não tem classe visible');
    return false;
  }
  
  const rect = completionDiv.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  // Calcula quanto da div está visível verticalmente
  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, windowHeight);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  const visibilityRatio = rect.height > 0 ? visibleHeight / rect.height : 0;
  
  // Verifica se está dentro da viewport horizontalmente
  const isHorizontallyVisible = rect.left < windowWidth && rect.right > 0;
  
  // Verifica propriedades CSS que podem esconder o elemento
  const style = window.getComputedStyle(completionDiv);
  const isStyleVisible = style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         parseFloat(style.opacity) > 0;
  
  // Mudança: agora aceita qualquer visibilidade (threshold 0.1 = 10%)
  const isVisible = visibilityRatio >= 0.1 && isHorizontallyVisible && isStyleVisible;
  
  if (!isVisible) {
    console.log(`[Completion] Visibilidade insuficiente: ${Math.round(visibilityRatio * 100)}% (necessário: 10%)`);
  } else {
    console.log(`[Completion] ✅ Visibilidade OK: ${Math.round(visibilityRatio * 100)}%`);
  }
  
  return isVisible;
}

/**
 * Inicia ou retoma a animação do contador
 * Fase 1: Anima rapidamente de 0 a 85%
 * Fase 2: Sincroniza com scroll real para 85-100%
 */
function startOrResumeCounterAnimation() {
  const counter = document.getElementById('completionCounter');
  const completionDiv = document.getElementById('lessonCompletion');
  
  if (!counter || !completionDiv) {
    console.warn('[Completion] Elementos não encontrados');
    return;
  }
  
  // Se já está animando, não faz nada
  if (animationState.isAnimating && !animationState.isPaused) {
    console.log('[Completion] Animação já está rodando');
    return;
  }
  
  // Se animação inicial já completou, ativa modo scroll-sync
  if (animationState.initialAnimationComplete) {
    console.log('[Completion] ✅ Ativando modo scroll-sync');
    animationState.scrollControlled = true;
    window.addEventListener('scroll', syncCounterWithScroll, { passive: true });
    return;
  }
  
  // Aguarda transição CSS completar
  const delay = 300;

  setTimeout(() => {
    beginInitialAnimation();
  }, delay);
  
  function beginInitialAnimation() {
    console.log('[Completion] ✅ Iniciando Fase 1: animação 0-85%');
    
    const duration = 800; // ms
    const fps = 60;
    const totalFrames = Math.round((duration / 1000) * fps);
    const targetValue = 85; // Para em 85% ao invés de 100%
    
    let currentFrame = animationState.isPaused 
      ? Math.round((animationState.currentValue / targetValue) * totalFrames) 
      : 0;
    
    animationState.isAnimating = true;
    animationState.isPaused = false;
    
    const animate = () => {
      currentFrame++;
      
      // Easing exponencial (easeOutExpo)
      const progress = currentFrame / totalFrames;
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const value = Math.round(eased * targetValue);
      
      updateCounterValue(value);
      
      if (currentFrame < totalFrames) {
        animationState.animationId = requestAnimationFrame(animate);
      } else {
        // ✅ Fase 1 completa - ativa Fase 2 (scroll-sync)
        console.log('[Completion] ✅ Fase 1 completa (85%) - ativando scroll-sync');
        animationState.isAnimating = false;
        animationState.initialAnimationComplete = true;
        animationState.scrollControlled = true;
        
        // Ativa listener de scroll para Fase 2
        window.addEventListener('scroll', syncCounterWithScroll, { passive: true });
      }
    };
    
    animationState.animationId = requestAnimationFrame(animate);
  }
}

/**
 * Inicializa o áudio de celebração usando Web Audio API
 */
async function initCelebrationAudio() {
  if (audioContext) return; // Já inicializado
  
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const response = await fetch('audio/pos-cut/celebracao.mp3');
    const arrayBuffer = await response.arrayBuffer();
    celebrationBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log('[Celebration] ✅ Áudio carregado com sucesso');
  } catch (error) {
    console.warn('[Celebration] ⚠️ Erro ao carregar áudio:', error);
  }
}

/**
 * Toca o som de celebração
 */
function playCelebrationSound() {
  if (!audioContext || !celebrationBuffer) {
    console.warn('[Celebration] Áudio não disponível');
    return;
  }
  
  // Resume contexto se suspenso (política de autoplay dos browsers)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  const source = audioContext.createBufferSource();
  source.buffer = celebrationBuffer;
  source.connect(audioContext.destination);
  source.start(0);
}

/**
 * Sincroniza contador com scroll real da página (85-100%)
 */
function syncCounterWithScroll() {
  const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
  
  // Mapeia scroll de 85-100% da página para 85-100% do contador
  const scrollStart = 0.85; // Quando scroll atinge 85%, contador começa a mover
  const scrollEnd = 1.0;    // Quando scroll atinge 100%, contador atinge 100%
  
  if (scrollPercent >= scrollStart) {
    const scrollProgress = (scrollPercent - scrollStart) / (scrollEnd - scrollStart);
    const counterValue = 85 + (scrollProgress * 15); // 85% + até 15%
    const clampedValue = Math.min(100, Math.round(counterValue));
    
    updateCounterValue(clampedValue);
    
    // Dispara confetes quando ambos atingem 100%
    if (scrollPercent >= 0.99 && clampedValue === 100 && !hasTriggered) {
      console.log('[Completion] 🎊 Disparando confetes! (scroll + contador = 100%)');
      triggerConfetti();
      hasTriggered = true;
    }
  }
}

/**
 * Atualiza valor do contador e estado
 */
function updateCounterValue(value) {
  const counter = document.getElementById('completionCounter');
  if (counter) {
    counter.textContent = value;
    animationState.currentValue = value;
    
    // Efeito de pulse nos múltiplos de 10
    if (value % 10 === 0 && value < 100) {
      counter.classList.add('pulse');
      setTimeout(() => counter.classList.remove('pulse'), 100);
    }
  }
}

/**
 * Dispara as 5 explosões sequenciais de confetes
 */
function triggerConfetti() {
  // ✅ Tocar som de celebração
  playCelebrationSound();
  
  const origin = getConfettiOrigin();
  const particleCount = window.innerWidth > 768 ? 200 : 120;
  
  const explosions = [
    { ratio: 0.25, spread: 60, startVelocity: 55 },
    { ratio: 0.2, spread: 100 },
    { ratio: 0.2, spread: 150, startVelocity: 25, decay: 0.92, scalar: 1.2 },
    { ratio: 0.35, spread: 130, decay: 0.91, scalar: 0.9 },
    { ratio: 0.2, spread: 145, startVelocity: 25, decay: 0.8, scalar: 1.2 },
    { ratio: 0.25, spread: 150, startVelocity: 45, decay: 0.92, scalar: 1.2 }
  ];
  
  explosions.forEach((explosion, index) => {
    setTimeout(() => {
      confetti({
        origin,
        particleCount: Math.floor(particleCount * explosion.ratio),
        ...explosion
      });
    }, index * 140);
  });
}

/**
 * ✨ Intersection Observer configurado para qualquer visibilidade
 */
function setupCompletionObserver(element) {
  if (completionObserver) {
    completionObserver.disconnect();
  }
  
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1 // ✅ Qualquer parte da div visível (10%)
  };
  
  completionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      console.log(`[Completion] IntersectionObserver: ${Math.round(entry.intersectionRatio * 100)}% visível`);
      
      if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
        const completionDiv = document.getElementById('lessonCompletion');
        
        if (completionDiv && !completionDiv.classList.contains('visible')) {
          console.log('[Completion] ✅ Elemento visível - adicionando classe');
          completionDiv.classList.add('visible');
        }
        
        if (!hasTriggered) {
          hasTriggered = true;
          console.log('[Completion] ✅ Primeira visualização - iniciando Fase 1');
          startOrResumeCounterAnimation();
        }
      } else if (entry.intersectionRatio < 0.1 && hasTriggered) {
        // Se sair completamente da viewport
        console.log('[Completion] ⚠️ Elemento saiu da viewport');
      }
    });
  }, options);
  
  completionObserver.observe(element);
}

/**
 * Verifica a porcentagem de scroll e dispara eventos
 */
function checkScroll() {
  const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
  
  const isSmallScreen = window.innerHeight < 900 || window.innerWidth < 1200;
  const threshold = isSmallScreen ? 0.85 : 0.95;
  
  if (scrollPercent >= threshold && !hasInserted) {
    console.log('[Completion] ✅ Threshold atingido - criando elemento');
    
    const completionDiv = createCompletionElement();
    const navLessons = document.querySelector('.nav-lessons');
    
    if (navLessons && navLessons.parentNode) {
      navLessons.parentNode.insertBefore(completionDiv, navLessons);
      hasInserted = true;
      
      // Configura observer com threshold de 10% (qualquer visibilidade)
      setupCompletionObserver(completionDiv);
      
      // ✅ FALLBACK: verifica se elemento está visível (qualquer parte)
      let attempts = 0;
      const maxAttempts = 5; // Menos tentativas pois condição é mais permissiva
      
      const tryStartAnimation = () => {
        attempts++;
        
        if (hasTriggered || attempts > maxAttempts) {
          if (attempts > maxAttempts) {
            console.warn('[Completion] ⚠️ Fallback excedeu tentativas');
          }
          return;
        }
        
        if (isCounterVisible()) {
          console.log(`[Completion] ✅ Fallback bem-sucedido (tentativa ${attempts})`);
          hasTriggered = true;
          startOrResumeCounterAnimation();
        } else {
          setTimeout(tryStartAnimation, 250);
        }
      };
      
      setTimeout(tryStartAnimation, 400);
    }
  }
  
  const resetThreshold = isSmallScreen ? 0.75 : 0.85;
  if (scrollPercent < resetThreshold && hasTriggered) {
    console.log('[Completion] ⚠️ Reset acionado');
    hasTriggered = false;
    
    // Remove listener de scroll se estava ativo
    if (animationState.scrollControlled) {
      window.removeEventListener('scroll', syncCounterWithScroll);
      animationState.scrollControlled = false;
    }
    
    const completionDiv = document.getElementById('lessonCompletion');
    if (completionDiv) {
      completionDiv.classList.remove('visible');
      const counter = document.getElementById('completionCounter');
      if (counter) counter.textContent = '0';
      
      if (animationState.animationId) {
        cancelAnimationFrame(animationState.animationId);
        animationState.animationId = null;
      }
      
      // Reset completo do estado
      animationState.isAnimating = false;
      animationState.isPaused = false;
      animationState.currentValue = 0;
      animationState.initialAnimationComplete = false;
      animationState.scrollControlled = false;
    }
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  if (typeof confetti === 'undefined') {
    console.error('[Completion] ⚠️ Biblioteca confetti não encontrada');
    return;
  }
  
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('[Completion] ⚠️ Animações desabilitadas (prefers-reduced-motion)');
    return;
  }
  
  // Pré-carrega áudio de celebração
  initCelebrationAudio();
  
  console.log('[Completion] ✅ Sistema inicializado (scroll-sync: 85-100%)');
  window.addEventListener('scroll', checkScroll, { passive: true });
});