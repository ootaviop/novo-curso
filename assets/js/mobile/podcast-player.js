/**
 * ═══════════════════════════════════════════════════════════════
 * 🎧 PODCAST PLAYER - Mobile Minimalist Player
 * ═══════════════════════════════════════════════════════════════
 * 
 * Player de áudio consolidado para mobile com design minimalista
 * - Gerenciamento de estado completo
 * - Controles de reprodução (play/pause, skip, velocidade)
 * - Compartilhamento unificado (share API + download)
 * - Media Session API para controles de lock screen
 */

class PodcastPlayer {
  constructor(containerElement, mobileExperience) {
    this.container = containerElement;
    this.mobileExperience = mobileExperience;
    
    // Estado do player
    this.audio = null;
    this.isPlaying = false;
    this.isLoading = false;
    this.currentAudioConfig = null;
    this.currentProgress = 0;
    this.currentTime = 0;
    this.duration = 0;
    
    // Componentes
    this.mediaSession = null;
    
    // Configurações
    this.config = {
      skipTime: 15, // segundos
      speeds: [0.75, 1, 1.25, 1.5, 2],
      currentSpeedIndex: 1, // 1x
      localStorageKey: 'podcast-player-state'
    };
    
    // Referências DOM
    this.elements = {};
    
    // Bind methods
    this.handlePlayPause = this.handlePlayPause.bind(this);
    this.handleSeek = this.handleSeek.bind(this);
    this.handleSkip = this.handleSkip.bind(this);
    this.handleSpeedChange = this.handleSpeedChange.bind(this);
    this.handleShare = this.handleShare.bind(this);
    
    this.init();
  }
  
  /**
   * Inicializa o player
   */
  async init() {
    try {
      this.showLoadingState();
      await this.loadAudioConfig();
      this.createUI();
      await this.loadAudio();
      this.setupEventListeners();
      this.loadSavedState();
      this.setupMediaSession();
      
      console.log('✅ PodcastPlayer inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar PodcastPlayer:', error);
      this.showErrorState();
    }
  }
  
  /**
   * Carrega configuração de áudio
   */
  async loadAudioConfig() {
    if (!window.audioConfig || !window.audioConfig.consolidated) {
      throw new Error('Configuração de áudio consolidado não encontrada');
    }
    
    // Por enquanto, usa a primeira aula disponível
    // TODO: Implementar seleção dinâmica baseada na aula atual
    const audioKeys = Object.keys(window.audioConfig.consolidated);
    if (audioKeys.length === 0) {
      throw new Error('Nenhum áudio consolidado disponível');
    }
    
    this.currentAudioConfig = window.audioConfig.consolidated[audioKeys[0]];
    this.duration = this.currentAudioConfig.duration;
  }
  
  /**
   * Cria a interface do usuário
   */
  createUI() {
    console.log('🎨 Criando UI do podcast player...');
    this.container.innerHTML = `
      <!-- Navigation Bar -->
      <div class="podcast-nav-bar">
        <button class="podcast-nav-back" aria-label="Voltar">
          <i class="fas fa-arrow-left"></i>
        </button>
        <button class="podcast-nav-share" aria-label="Compartilhar">
          <i class="fas fa-share-alt"></i>
        </button>
      </div>
      
      <!-- Content -->
      <div class="podcast-content">
        <!-- Título centralizado -->
        <h2 class="podcast-lesson-title">${this.currentAudioConfig.title}</h2>
        
        <!-- Botão Play/Pause principal -->
        <button class="podcast-play-pause" id="playPause" aria-label="Play/Pause">
          <i class="fas fa-play" id="playPauseIcon"></i>
        </button>
        
        <!-- Controles em linha -->
        <div class="podcast-controls">
          <button class="podcast-control-btn skip" id="skipBack" aria-label="Retroceder 15s">
            <svg viewBox="0 0 24 24">
              <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </button>
          <button class="podcast-control-btn speed" id="speedBtn" aria-label="Velocidade">
            <span id="speedText">1×</span>
          </button>
          <button class="podcast-control-btn skip" id="skipForward" aria-label="Avançar 15s">
            <svg viewBox="0 0 24 24">
              <path d="M13 17l5-5-5-5M6 17l5-5-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </button>
        </div>
        
        <!-- Progress Container -->
        <div class="podcast-progress-container">
          <div class="podcast-progress-bar" id="progressBar">
            <div class="podcast-progress-fill" id="progressFill"></div>
            <div class="podcast-progress-scrubber" id="progressScrubber"></div>
          </div>
          <div class="podcast-time-display">
            <span id="currentTime">0:00</span>
            <span id="totalTime">${this.formatTime(this.duration)}</span>
          </div>
        </div>
      </div>
    `;
    
    // Armazena referências DOM
    this.elements = {
      backBtn: this.container.querySelector('.podcast-nav-back'),
      shareBtn: this.container.querySelector('.podcast-nav-share'),
      progressBar: this.container.querySelector('#progressBar'),
      progressFill: this.container.querySelector('#progressFill'),
      progressScrubber: this.container.querySelector('#progressScrubber'),
      currentTime: this.container.querySelector('#currentTime'),
      totalTime: this.container.querySelector('#totalTime'),
      playPauseBtn: this.container.querySelector('#playPause'),
      playPauseIcon: this.container.querySelector('#playPauseIcon'),
      skipBackBtn: this.container.querySelector('#skipBack'),
      skipForwardBtn: this.container.querySelector('#skipForward'),
      speedBtn: this.container.querySelector('#speedBtn'),
      speedText: this.container.querySelector('#speedText')
    };
    
    console.log('🎨 UI criada, elementos encontrados:', this.elements);
  }
  

  /**
   * Carrega o áudio (waveform removido)
   */
  async loadAudio() {
    return new Promise((resolve, reject) => {
      this.audio = new Audio();
      this.audio.crossOrigin = 'anonymous';
      this.audio.preload = 'metadata';
      
      this.audio.addEventListener('loadedmetadata', () => {
        this.duration = this.audio.duration;
        this.elements.totalTime.textContent = this.formatTime(this.duration);
        resolve();
      });
      
      this.audio.addEventListener('error', (e) => {
        console.error('Erro ao carregar áudio:', e);
        reject(e);
      });
      
      this.audio.src = this.currentAudioConfig.file;
    });
  }
  
  
  /**
   * Configura event listeners
   */
  setupEventListeners() {
    console.log('🔧 Configurando event listeners...');
    console.log('Elements:', this.elements);
    
    // Verifica se todos os elementos existem
    const requiredElements = ['backBtn', 'playPauseBtn', 'skipBackBtn', 'skipForwardBtn', 'speedBtn', 'shareBtn'];
    for (const elementName of requiredElements) {
      if (!this.elements[elementName]) {
        console.error(`❌ Elemento não encontrado: ${elementName}`);
        return;
      }
    }
    
    // Botão voltar
    this.elements.backBtn.addEventListener('click', () => {
      this.cleanup();
      this.mobileExperience.returnToModeSelector();
    });
    
    // Controles de reprodução
    this.elements.playPauseBtn.addEventListener('click', (e) => {
      console.log('🎵 Play/Pause clicado!');
      e.preventDefault();
      e.stopPropagation();
      this.handlePlayPause();
    });
    this.elements.skipBackBtn.addEventListener('click', (e) => {
      console.log('⏮️ Skip Back clicado!');
      e.preventDefault();
      e.stopPropagation();
      this.handleSkip(-this.config.skipTime);
    });
    this.elements.skipForwardBtn.addEventListener('click', (e) => {
      console.log('⏭️ Skip Forward clicado!');
      e.preventDefault();
      e.stopPropagation();
      this.handleSkip(this.config.skipTime);
    });
    this.elements.speedBtn.addEventListener('click', (e) => {
      console.log('⚡ Speed clicado!');
      e.preventDefault();
      e.stopPropagation();
      this.handleSpeedChange();
    });
    
    // Barra de progresso
    this.setupProgressBarEvents();
    
    // Compartilhamento (unificado com download)
    this.elements.shareBtn.addEventListener('click', this.handleShare);
    
    // Eventos de áudio
    if (this.audio) {
      this.audio.addEventListener('timeupdate', () => this.updateProgress());
      this.audio.addEventListener('ended', () => this.handleAudioEnded());
      this.audio.addEventListener('play', () => this.handlePlay());
      this.audio.addEventListener('pause', () => this.handlePause());
    }
    
    console.log('✅ Event listeners configurados');
  }
  
  /**
   * Configura eventos da barra de progresso
   */
  setupProgressBarEvents() {
    let isDragging = false;
    
    // Clique simples
    this.elements.progressBar.addEventListener('click', (e) => {
      if (!isDragging) {
        this.handleSeek(e);
      }
    });
    
    // Touch events para mobile
    this.elements.progressBar.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDragging = true;
      this.handleSeek(e.touches[0]);
    });
    
    this.elements.progressBar.addEventListener('touchmove', (e) => {
      if (isDragging) {
        e.preventDefault();
        this.handleSeek(e.touches[0]);
      }
    });
    
    this.elements.progressBar.addEventListener('touchend', () => {
      isDragging = false;
    });
  }
  
  /**
   * Manipula play/pause
   */
  async handlePlayPause() {
    console.log('🎵 handlePlayPause chamado, isPlaying:', this.isPlaying);
    if (!this.audio) {
      console.error('❌ Audio não disponível');
      return;
    }
    
    try {
      if (this.isPlaying) {
        console.log('⏸️ Pausando áudio');
        this.audio.pause();
      } else {
        console.log('▶️ Reproduzindo áudio');
        await this.audio.play();
      }
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
    }
  }
  
  /**
   * Manipula skip (avançar/retroceder)
   */
  handleSkip(seconds) {
    console.log('⏭️ handleSkip chamado:', seconds, 'segundos');
    if (!this.audio) {
      console.error('❌ Audio não disponível');
      return;
    }
    
    const newTime = Math.max(0, Math.min(this.duration, this.audio.currentTime + seconds));
    console.log('⏭️ Pulando para:', newTime, 'segundos');
    this.audio.currentTime = newTime;
    this.updateProgress();
  }
  
  /**
   * Manipula mudança de velocidade
   */
  handleSpeedChange() {
    console.log('⚡ handleSpeedChange chamado');
    this.config.currentSpeedIndex = (this.config.currentSpeedIndex + 1) % this.config.speeds.length;
    const speed = this.config.speeds[this.config.currentSpeedIndex];
    
    if (this.audio) {
      this.audio.playbackRate = speed;
      console.log('⚡ Velocidade alterada para:', speed);
    }
    
    this.elements.speedText.textContent = `${speed}×`;
    
    // Feedback haptic
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }
  
  /**
   * Manipula seek na barra de progresso
   */
  handleSeek(event) {
    if (!this.audio || !this.duration) return;
    
    const rect = this.elements.progressBar.getBoundingClientRect();
    const clientX = event.clientX || event.touches[0].clientX;
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = percent * this.duration;
    
    this.audio.currentTime = newTime;
    this.updateProgress();
  }
  
  /**
   * Manipula compartilhamento (unificado com download)
   */
  async handleShare() {
    try {
      // Feedback visual
      const originalIcon = this.elements.shareBtn.innerHTML;
      this.elements.shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      
      if (navigator.share && navigator.canShare) {
        // Web Share API com arquivo
        const response = await fetch(this.currentAudioConfig.file);
        const blob = await response.blob();
        const file = new File([blob], `${this.currentAudioConfig.title}.mp3`, { type: 'audio/mpeg' });
        
        await navigator.share({
          title: this.currentAudioConfig.title,
          text: 'Confira essa aula!',
          files: [file]
        });
      } else {
        // Fallback: download direto
        const response = await fetch(this.currentAudioConfig.file);
        const blob = await response.blob();
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentAudioConfig.title}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      // Feedback haptic
      if (navigator.vibrate) {
        navigator.vibrate([50, 100, 50]);
      }
      
      // Restaura ícone original
      setTimeout(() => {
        this.elements.shareBtn.innerHTML = originalIcon;
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      
      // Fallback silencioso para download
      try {
        const response = await fetch(this.currentAudioConfig.file);
        const blob = await response.blob();
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentAudioConfig.title}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (fallbackError) {
        console.error('Erro no fallback de download:', fallbackError);
      }
      
      // Restaura ícone original
      setTimeout(() => {
        this.elements.shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
      }, 1000);
    }
  }
  
  /**
   * Atualiza progresso visual
   */
  updateProgress() {
    if (!this.audio || !this.duration) return;
    
    this.currentProgress = this.audio.currentTime / this.duration;
    this.currentTime = this.audio.currentTime;
    
    // Atualiza barra de progresso
    this.elements.progressFill.style.width = `${this.currentProgress * 100}%`;
    this.elements.progressScrubber.style.left = `${this.currentProgress * 100}%`;
    
    // Atualiza tempo
    this.elements.currentTime.textContent = this.formatTime(this.currentTime);
    
    // Salva estado
    this.saveState();
  }
  
  /**
   * Manipula início da reprodução
   */
  handlePlay() {
    this.isPlaying = true;
    this.elements.playPauseIcon.className = 'fas fa-pause';
    this.updateMediaSession();
  }
  
  /**
   * Manipula pausa
   */
  handlePause() {
    this.isPlaying = false;
    this.elements.playPauseIcon.className = 'fas fa-play';
    this.updateMediaSession();
  }
  
  /**
   * Manipula fim do áudio
   */
  handleAudioEnded() {
    this.isPlaying = false;
    this.elements.playPauseIcon.className = 'fas fa-play';
    this.audio.currentTime = 0;
    this.updateProgress();
    this.updateMediaSession();
  }
  
  /**
   * Configura Media Session API
   */
  setupMediaSession() {
    if (!navigator.mediaSession) return;
    
    this.mediaSession = navigator.mediaSession;
    
    // Configura metadados
    this.updateMediaSession();
    
    // Configura action handlers
    this.mediaSession.setActionHandler('play', () => this.handlePlayPause());
    this.mediaSession.setActionHandler('pause', () => this.handlePlayPause());
    this.mediaSession.setActionHandler('seekbackward', () => this.handleSkip(-this.config.skipTime));
    this.mediaSession.setActionHandler('seekforward', () => this.handleSkip(this.config.skipTime));
    this.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        this.audio.currentTime = details.seekTime;
        this.updateProgress();
      }
    });
  }
  
  /**
   * Atualiza Media Session
   */
  updateMediaSession() {
    if (!this.mediaSession) return;
    
    this.mediaSession.metadata = new MediaMetadata({
      title: this.currentAudioConfig.title,
      artist: 'CAEd - Curso de Aperfeiçoamento',
      album: 'Liderança Escolar',
      artwork: [
        // Placeholder para artwork
        { src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiByeD0iMTIiIGZpbGw9IiNGRjZCMzUiLz4KPHN2ZyB4PSIyNCIgeT0iMjQiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTggNVYxOUwyMCAxMkw4IDVaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+', sizes: '96x96', type: 'image/svg+xml' }
      ]
    });
    
    this.mediaSession.setPositionState({
      duration: this.duration,
      playbackRate: this.audio ? this.audio.playbackRate : 1,
      position: this.currentTime
    });
  }
  
  /**
   * Formata tempo em mm:ss
   */
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  /**
   * Salva estado no localStorage
   */
  saveState() {
    const state = {
      currentTime: this.currentTime,
      playbackRate: this.audio ? this.audio.playbackRate : 1,
      speedIndex: this.config.currentSpeedIndex,
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.config.localStorageKey, JSON.stringify(state));
  }
  
  /**
   * Carrega estado salvo
   */
  loadSavedState() {
    try {
      const saved = localStorage.getItem(this.config.localStorageKey);
      if (saved) {
        const state = JSON.parse(saved);
        
        // Aplica velocidade salva
        if (state.speedIndex !== undefined) {
          this.config.currentSpeedIndex = state.speedIndex;
          const speed = this.config.speeds[this.config.currentSpeedIndex];
          this.elements.speedText.textContent = `${speed}×`;
        }
        
        // Aplica posição salva (se não muito antiga - 24h)
        if (state.currentTime && state.timestamp) {
          const age = Date.now() - state.timestamp;
          if (age < 24 * 60 * 60 * 1000) { // 24 horas
            setTimeout(() => {
              if (this.audio) {
                this.audio.currentTime = state.currentTime;
                this.updateProgress();
              }
            }, 100);
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar estado salvo:', error);
    }
  }
  
  /**
   * Mostra estado de carregamento
   */
  showLoadingState() {
    this.container.innerHTML = `
      <div class="podcast-loading" role="status" aria-live="polite">
        <div class="podcast-loading-spinner" aria-hidden="true"></div>
        <span>Carregando player...</span>
      </div>
    `;
  }
  
  /**
   * Mostra estado de erro
   */
  showErrorState() {
    this.container.innerHTML = `
      <div class="podcast-error" role="alert">
        <span class="podcast-error-icon" aria-hidden="true">⚠️</span>
        <p>Erro ao carregar player de podcast</p>
        <button onclick="location.reload()" aria-label="Recarregar página para tentar novamente">
          Tentar novamente
        </button>
      </div>
    `;
  }
  
  /**
   * Limpa recursos
   */
  cleanup() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    
    
    if (this.mediaSession) {
      this.mediaSession.setActionHandler('play', null);
      this.mediaSession.setActionHandler('pause', null);
      this.mediaSession.setActionHandler('seekbackward', null);
      this.mediaSession.setActionHandler('seekforward', null);
      this.mediaSession.setActionHandler('seekto', null);
    }
    
    this.container.innerHTML = '';
    this.elements = {};
    
    console.log('🗑️ PodcastPlayer limpo');
  }
}

// Exporta para uso global
window.PodcastPlayer = PodcastPlayer;
