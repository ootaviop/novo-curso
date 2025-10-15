/**
 * ═══════════════════════════════════════════════════════════════
 * 🎵 AUDIO PLAYER - ENGINE COMPLETO
 * ═══════════════════════════════════════════════════════════════
 *
 * Sistema de leitura guiada com:
 * - Reprodução sequencial de áudios
 * - Highlight do parágrafo sendo lido
 * - Auto-scroll suave
 * - Controles estilo Spotify (play/pause, próximo, anterior)
 * - Controle de velocidade
 * - Barra de progresso interativa
 *
 * @author CAEd - Equipe de Cursos
 * @version 1.0.0
 */

class AudioPlayer {
  constructor(HTMLConfig = {}) {
    // --- Referências de elementos DOM (inicializadas posteriormente)
    this.triggerBtn = null;
    this.playerBar = null;
    this.playPauseBtn = null;
    this.prevBtn = null;
    this.nextBtn = null;
    this.closeBtn = null;
    this.progressBar = null;
    this.progressFill = null;
    this.currentTimeEl = null;
    this.totalTimeEl = null;
    this.speedBtn = null;
    this.playerTitle = null;
    this.playerSubtitle = null;
    this.volumeBar = null;
    this.volumeFill = null;
    this.volumeScrubber = null;
    this.volumeBtn = null;
    this.downloadBtn = null;

    // --- Estado do áudio e playlist
    this.audio = new Audio();
    this.playlist = []; // [{ element, audioFile, text, audioKey }]
    this.currentIndex = 0;
    this.isPlaying = false;
    this.speeds = [0.75, 1, 1.25, 1.5, 2];
    this.currentSpeedIndex = 1; // Começa em 1x
    this.volume = 1; // Volume atual (0-1)
    this.isMuted = false; // Estado do mute

    // --- Configuração visual
    this.HTMLConfig = {
      iconSize: (() => {
        const w = window.innerWidth;
        return w >= 1920 ? 24 * 1.4 : 24 * 1;
      })(),
      ...HTMLConfig,
    };

    // --- Configuração de tracks
    this.config = window.audioConfig || { basePath: "./audio/", tracks: {} };

    // Inicialização
    this.init();
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🚀 INICIALIZAÇÃO
   * ═══════════════════════════════════════════════════════════
   */
  init() {
    if (!this.validateConfig()) {
      console.error(
        "[AudioPlayer] Configuração inválida. Verifique se audio-config.js está carregado."
      );
      return;
    }

    this.buildPlaylist();
    this.createUI();
    this.setupEventListeners();

    console.log(
      `[AudioPlayer] ✅ Inicializado com ${this.playlist.length} tracks`
    );
  }

  getIconSize() {
    const { iconSize } = this.HTMLConfig;
    return iconSize;
  }

  /**
   * Valida se a configuração está presente
   */
  validateConfig() {
    return (
      this.config &&
      this.config.tracks &&
      Object.keys(this.config.tracks).length > 0
    );
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 📋 CONSTRUÇÃO DA PLAYLIST
   * ═══════════════════════════════════════════════════════════
   */
  buildPlaylist() {
    // Busca todos os elementos que têm data-audio
    const elementsWithAudio = document.querySelectorAll("[data-audio]");

    elementsWithAudio.forEach((element) => {
      const audioKey = element.dataset.audio;
      const audioFile = this.config.tracks[audioKey];

      if (!audioFile) {
        console.warn(`[AudioPlayer] Áudio não encontrado para: ${audioKey}`);
        return;
      }

      // Extrai texto do elemento
      const text = this.extractText(element);

      this.playlist.push({
        element: element,
        audioFile: this.config.basePath + audioFile,
        text: text,
        audioKey: audioKey,
      });
    });

    if (this.playlist.length === 0) {
      console.error(
        "[AudioPlayer] Nenhum elemento com data-audio encontrado no HTML."
      );
    }
  }

  /**
   * Extrai texto limpo do elemento
   */
  extractText(element) {
    let text = element.textContent.trim();

    // Limita tamanho
    if (text.length > 80) {
      text = text.substring(0, 80) + "...";
    }

    return text;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🎨 INICIALIZAÇÃO DA UI
   * ═══════════════════════════════════════════════════════════
   */
  createUI() {
    this.initializeTriggerButton();
    this.initializePlayerBar();
    this.applyPdfIconSize();
  }

  /**
   * Inicializa botão "Ouvir esta aula" (elemento já existe no HTML)
   */
  initializeTriggerButton() {
    const button = document.querySelector(".audio-trigger-btn");

    if (!button) {
      console.warn(
        "[AudioPlayer] .audio-trigger-btn não encontrado. Botão não será inicializado."
      );
      return;
    }

    // Adicionar classe para animação inicial e remover após execução
    button.classList.add('initial-animation');
    
    // Remover classe após a animação ser executada (0.4s delay + 0.5s duration)
    setTimeout(() => {
        button.classList.remove('initial-animation');
    }, 900); // 400ms delay + 500ms duration

    this.triggerBtn = button;
    
    // Aplica tamanho dinâmico ao ícone SVG
    this.applyIconSize();
    
    // Atualiza informações dinâmicas (número de tracks e duração)
    this.updateTriggerInfo();
  }

  /**
   * Aplica tamanho calculado ao ícone SVG do botão trigger
   */
  applyIconSize() {
    if (!this.triggerBtn) return;
    
    const svg = this.triggerBtn.querySelector("svg");
    if (svg) {
      const iconSize = this.getIconSize();
      svg.setAttribute("width", iconSize);
      svg.setAttribute("height", iconSize);
    }
  }

  /**
   * Aplica tamanho calculado ao ícone SVG do botão PDF trigger
   */
  applyPdfIconSize() {
    const pdfBtn = document.querySelector(".pdf-trigger-btn");
    if (!pdfBtn) return;
    
    const svg = pdfBtn.querySelector("svg");
    if (svg) {
      const iconSize = this.getIconSize();
      svg.setAttribute("width", iconSize);
      svg.setAttribute("height", iconSize);
    }
  }

  /**
   * Atualiza informações dinâmicas do botão trigger
   */
  updateTriggerInfo() {
    const durationEl = document.getElementById("audioDuration");
    
    if (durationEl) {
      const totalDuration = this.estimateTotalDuration();
      durationEl.textContent = `${totalDuration} min`;
    }
  }

  /**
   * Estima duração total (2 min por track em média)
   */
  estimateTotalDuration() {
    const avgDuration = 0.4; // minutos por track
    const total = this.playlist.length * avgDuration;
    return Math.ceil(total);
  }

  /**
   * Inicializa barra do player (elemento já existe no HTML)
   */
  initializePlayerBar() {
    const bar = document.querySelector(".audio-player-bar");

    if (!bar) {
      console.error(
        "[AudioPlayer] .audio-player-bar não encontrado no HTML."
      );
      return;
    }

    // Armazena referências aos elementos
    this.playerBar = bar;
    this.playPauseBtn = bar.querySelector("#btnPlayPause");
    this.prevBtn = bar.querySelector("#btnPrev");
    this.nextBtn = bar.querySelector("#btnNext");
    this.closeBtn = bar.querySelector("#btnClose");
    this.progressBar = bar.querySelector("#progressBar");
    this.progressFill = bar.querySelector("#progressFill");
    this.progressScrubber = bar.querySelector("#progressScrubber");
    this.progressTooltip = bar.querySelector("#progressTooltip");
    this.currentTimeEl = bar.querySelector("#currentTime");
    this.totalTimeEl = bar.querySelector("#totalTime");
    this.speedBtn = bar.querySelector("#speedBtn");
    this.playerTitle = bar.querySelector("#playerTitle");
    this.playerSubtitle = bar.querySelector("#playerSubtitle");
    this.volumeBar = bar.querySelector("#volumeBar");
    this.volumeFill = bar.querySelector("#volumeFill");
    this.volumeScrubber = bar.querySelector("#volumeScrubber");
    this.volumeBtn = bar.querySelector("#volumeBtn");
    this.downloadBtn = bar.querySelector("#btnDownloadAudio");

    // Reinicializa o sistema de cursor para incluir a barra de progresso
    if (window.cursorSystem && typeof window.cursorSystem.reinitializeInteractiveElements === 'function') {
      window.cursorSystem.reinitializeInteractiveElements();
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🎮 EVENT LISTENERS
   * ═══════════════════════════════════════════════════════════
   */
  setupEventListeners() {
    // Botão inicial
    if (this.triggerBtn) {
      this.triggerBtn.addEventListener("click", () => this.start());
    }

    // Controles
    this.playPauseBtn.addEventListener("click", () => this.togglePlayPause());
    this.prevBtn.addEventListener("click", () => this.previous());
    this.nextBtn.addEventListener("click", () => this.next());
    this.closeBtn.addEventListener("click", () => this.close());
    //this.speedBtn.addEventListener("click", () => this.cycleSpeed());

    // Barra de progresso - clique e arrastar
    this.setupProgressBarEvents();

    // Volume slider - clique e arrastar
    this.setupVolumeSliderEvents();
    this.volumeBtn.addEventListener("click", () => this.toggleMute());

    // Botão de download
    if (this.downloadBtn) {
      this.downloadBtn.addEventListener("click", () => this.downloadFullAudio());
    }

    // Eventos do áudio
    this.audio.addEventListener("timeupdate", () => this.updateProgress());
    this.audio.addEventListener("ended", () => this.onTrackEnded());
    this.audio.addEventListener("loadedmetadata", () => this.updateTotalTime());
    this.audio.addEventListener("error", (e) => this.onAudioError(e));

    // Atalhos de teclado
    document.addEventListener("keydown", (e) => this.handleKeyboard(e));
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * ▶️ CONTROLES DE REPRODUÇÃO
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Inicia a leitura guiada
   */
  start() {
    this.currentIndex = 0;
    this.loadTrack(0);
    this.showPlayer();
    this.initializeVolumeSlider();
    this.play();
  }

  /**
   * Play/Pause toggle
   */
  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Play
   */
  play() {
    this.audio
      .play()
      .then(() => {
        this.isPlaying = true;
        this.updatePlayPauseButton();
      })
      .catch((err) => {
        console.error("[AudioPlayer] Erro ao reproduzir:", err);
      });
  }

  /**
   * Pause
   */
  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.updatePlayPauseButton();
  }

  /**
   * Próximo
   */
  next() {
    if (this.currentIndex < this.playlist.length - 1) {
      this.currentIndex++;
      this.loadTrack(this.currentIndex);
      this.play();
    }
  }

  /**
   * Anterior
   */
  previous() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.loadTrack(this.currentIndex);
      this.play();
    }
  }

  /**
   * Fecha o player
   */
  close() {
    this.pause();
    this.hidePlayer();
    this.removeHighlight();
    
    // Recria as rough notations com posições atualizadas após remover o highlight
    if (window.roughAnnotationSystem) {
      // Delay para garantir que o highlight foi removido e o layout estabilizou
      setTimeout(() => {
        window.roughAnnotationSystem.refresh();
        console.log("[AudioPlayer] ✅ Rough notations recalculadas após fechar player");
      }, 50);
    }
  }


  /**
   * ═══════════════════════════════════════════════════════════
   * 🎵 GERENCIAMENTO DE TRACKS
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Carrega uma track pelo índice
   */
  loadTrack(index) {
    if (index < 0 || index >= this.playlist.length) return;

    const track = this.playlist[index];

    this.audio.src = track.audioFile;
    this.audio.playbackRate = this.speeds[this.currentSpeedIndex];

    this.updatePlayerInfo(track);
    this.highlightElement(track.element);
    //this.addSvgToHighlight(track.element);
    this.scrollToElement(track.element);
  }

  /**
   * Chamado quando uma track termina
   */
  onTrackEnded() {
    // Se não for a última, avança automaticamente
    if (this.currentIndex < this.playlist.length - 1) {
      this.next();
    } else {
      // Última track: para e volta pro início
      this.pause();
      this.currentIndex = 0;
      this.loadTrack(0);
    }
  }

  /**
   * Trata erros de carregamento
   */
  onAudioError(e) {
    console.error("[AudioPlayer] Erro ao carregar áudio:", e);
    console.error("Arquivo:", this.audio.src);

    this.playerSubtitle.textContent = "❌ Erro ao carregar áudio";

    // Tenta próximo após 2s
    setTimeout(() => {
      if (this.currentIndex < this.playlist.length - 1) {
        this.next();
      }
    }, 2000);
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 📊 PROGRESSO E TEMPO
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Atualiza barra de progresso
   */
  updateProgress() {
    if (!this.audio.duration) return;

    const percent = this.audio.currentTime / this.audio.duration;
    this.updateProgressBar(percent);

    this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
  }

  /**
   * Atualiza tempo total
   */
  updateTotalTime() {
    if (this.audio.duration) {
      this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🎯 BARRA DE PROGRESSO - CLIQUE E ARRASTAR
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Configura eventos da barra de progresso (clique e arrastar)
   */
  setupProgressBarEvents() {
    let isDragging = false;
    let wasPlaying = false;

    // Clique simples
    this.progressBar.addEventListener("click", (e) => {
      if (!isDragging) {
        this.seekTo(e);
      }
    });

    // Início do arraste
    this.progressBar.addEventListener("mousedown", (e) => {
      e.preventDefault();
      isDragging = true;
      wasPlaying = this.isPlaying;
      
      // Pausa durante o arraste
      if (this.isPlaying) {
        this.pause();
      }
      
      this.progressBar.classList.add("dragging");
      this.progressTooltip.style.display = 'block';
      this.seekTo(e);
    });

    // Arrastar
    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        e.preventDefault();
        this.seekTo(e);
      }
    });

    // Fim do arraste
    document.addEventListener("mouseup", (e) => {
      if (isDragging) {
        isDragging = false;
        this.progressBar.classList.remove("dragging");
        this.progressTooltip.style.display = 'none';
        
        // Retoma reprodução se estava tocando
        if (wasPlaying) {
          this.play();
        }
      }
    });

    // Cancelar arraste se sair da janela
    document.addEventListener("mouseleave", () => {
      if (isDragging) {
        isDragging = false;
        this.progressBar.classList.remove("dragging");
        this.progressTooltip.style.display = 'none';
        if (wasPlaying) {
          this.play();
        }
      }
    });

    // Suporte a touch para dispositivos móveis
    this.progressBar.addEventListener("touchstart", (e) => {
      e.preventDefault();
      isDragging = true;
      wasPlaying = this.isPlaying;
      
      if (this.isPlaying) {
        this.pause();
      }
      
      this.progressBar.classList.add("dragging");
      this.progressTooltip.style.display = 'block';
      const touch = e.touches[0];
      this.seekTo({ clientX: touch.clientX });
    });

    document.addEventListener("touchmove", (e) => {
      if (isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        this.seekTo({ clientX: touch.clientX });
      }
    });

    document.addEventListener("touchend", (e) => {
      if (isDragging) {
        isDragging = false;
        this.progressBar.classList.remove("dragging");
        this.progressTooltip.style.display = 'none';
        if (wasPlaying) {
          this.play();
        }
      }
    });
  }

  /**
   * Navega para um ponto do áudio
   */
  seekTo(e) {
    if (!this.audio.duration) return;
    
    const rect = this.progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * this.audio.duration;
    
    this.audio.currentTime = newTime;
    this.updateProgressBar(percent);
    
    // Atualiza tooltip durante o arraste
    if (this.progressBar.classList.contains("dragging")) {
      this.updateProgressTooltip(e, newTime);
    }
  }

  /**
   * Atualiza visualmente a barra de progresso
   */
  updateProgressBar(percent) {
    this.progressFill.style.width = `${percent * 100}%`;
    this.progressScrubber.style.left = `${percent * 100}%`;
  }

  /**
   * Atualiza tooltip de progresso durante o arraste
   */
  updateProgressTooltip(e, time) {
    const rect = this.progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    this.progressTooltip.textContent = this.formatTime(time);
    this.progressTooltip.style.left = `${percent * 100}%`;
    this.progressTooltip.style.display = 'block';
  }

  /**
   * Formata tempo em mm:ss
   */
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🔊 CONTROLE DE VOLUME
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Configura eventos do volume slider (clique e arrastar)
   */
  setupVolumeSliderEvents() {
    let isDragging = false;

    // Clique simples
    this.volumeBar.addEventListener("click", (e) => {
      if (!isDragging) {
        this.seekVolume(e);
      }
    });

    // Início do arraste
    this.volumeBar.addEventListener("mousedown", (e) => {
      e.preventDefault();
      isDragging = true;
      this.volumeBar.classList.add("dragging");
      this.seekVolume(e);
    });

    // Arrastar
    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        e.preventDefault();
        this.seekVolume(e);
      }
    });

    // Fim do arraste
    document.addEventListener("mouseup", (e) => {
      if (isDragging) {
        isDragging = false;
        this.volumeBar.classList.remove("dragging");
      }
    });

    // Cancelar arraste se sair da janela
    document.addEventListener("mouseleave", () => {
      if (isDragging) {
        isDragging = false;
        this.volumeBar.classList.remove("dragging");
      }
    });

    // Suporte a touch para dispositivos móveis
    this.volumeBar.addEventListener("touchstart", (e) => {
      e.preventDefault();
      isDragging = true;
      this.volumeBar.classList.add("dragging");
      const touch = e.touches[0];
      this.seekVolume({ clientX: touch.clientX });
    });

    document.addEventListener("touchmove", (e) => {
      if (isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        this.seekVolume({ clientX: touch.clientX });
      }
    });

    document.addEventListener("touchend", (e) => {
      if (isDragging) {
        isDragging = false;
        this.volumeBar.classList.remove("dragging");
      }
    });
  }

  /**
   * Navega para um volume específico baseado na posição do clique
   */
  seekVolume(e) {
    const rect = this.volumeBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    this.setVolume(percent);
  }

  /**
   * Define volume do áudio (0-1) e atualiza UI
   */
  setVolume(percent) {
    this.volume = Math.max(0, Math.min(1, percent));
    this.audio.volume = this.volume;
    this.updateVolumeBar(this.volume);
    this.updateVolumeIcon();
  }

  /**
   * Alterna mute/unmute
   */
  toggleMute() {
    if (this.isMuted) {
      // Desmutar
      this.audio.volume = this.volume;
      this.isMuted = false;
    } else {
      // Mutar
      this.audio.volume = 0;
      this.isMuted = true;
    }
    this.updateVolumeIcon();
  }

  /**
   * Atualiza visualmente a barra de volume
   */
  updateVolumeBar(percent) {
    const fillPercent = this.isMuted ? 0 : percent;
    this.volumeFill.style.width = `${fillPercent * 100}%`;
    this.volumeScrubber.style.right = `${(1 - fillPercent) * 100}%`;
  }

  /**
   * Atualiza ícone do botão de volume
   */
  updateVolumeIcon() {
    const icon = this.volumeBtn.querySelector(".material-symbols-outlined");
    
    if (this.isMuted || this.volume === 0) {
      icon.textContent = "volume_off";
    } else if (this.volume < 0.5) {
      icon.textContent = "volume_down";
    } else {
      icon.textContent = "volume_up";
    }
  }

  /**
   * Inicializa o volume slider com valores padrão
   */
  initializeVolumeSlider() {
    this.audio.volume = this.volume;
    this.updateVolumeBar(this.volume);
    this.updateVolumeIcon();
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * ⚡ VELOCIDADE
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Alterna entre velocidades
   */
  cycleSpeed() {
    this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.speeds.length;
    const speed = this.speeds[this.currentSpeedIndex];

    this.audio.playbackRate = speed;
    this.speedBtn.textContent = `${speed}x`;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 🎨 UI UPDATES
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Atualiza botão play/pause
   */
  updatePlayPauseButton() {
    const icon = this.playPauseBtn.querySelector(".material-symbols-outlined");
    icon.textContent = this.isPlaying ? "pause" : "play_arrow";
    this.playPauseBtn.title = this.isPlaying ? " " : " ";
  }

  /**
   * Atualiza informações da track atual
   */
  updatePlayerInfo(track) {
    this.playerTitle.textContent = track.text;
    this.playerSubtitle.textContent = `${this.currentIndex + 1} de ${
      this.playlist.length
    }`;
  }

  /**
   * Mostra a barra do player
   */
  showPlayer() {
    this.playerBar.classList.add("active");
    document.body.classList.add("audio-player-active");
  }

  /**
   * Esconde a barra do player
   */
  hidePlayer() {
    this.playerBar.classList.remove("active");
    document.body.classList.remove("audio-player-active");
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * ✨ HIGHLIGHT E SCROLL
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Destaca elemento sendo lido
   */
  highlightElement(element) {
    this.removeHighlight();
    element.classList.add("audio-highlight");
  }

  /**
   * Remove highlight
   */
  removeHighlight() {
    const highlighted = document.querySelector(".audio-highlight");
    if (highlighted) {
      highlighted.classList.remove("audio-highlight");
    }
  }

  /**
   * Scroll suave até o elemento
   */
  scrollToElement(element) {
    const elementTop = element.getBoundingClientRect().top + window.scrollY;
    const isMobile = window.innerWidth <= 968;
    const playerHeight = this.playerBar?.offsetHeight || 0;
    const safeMargin = 20; // margem extra de segurança
    
    // Em mobile: posiciona parágrafo considerando altura do player + margem segura
    // Desktop: mantém comportamento atual (terço superior)
    const offset = isMobile 
      ? playerHeight + safeMargin + 40 // espaço do player + margem + respiro visual
      : window.innerHeight / 3; // desktop mantém comportamento atual

    window.scrollTo({
      top: elementTop - offset,
      behavior: "smooth",
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * 💾 DOWNLOAD DO ÁUDIO COMPLETO
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Faz download do áudio completo da aula
   */
  downloadFullAudio() {
    if (!this.config.fullAudioTrack) {
      console.warn("[AudioPlayer] Áudio completo não configurado.");
      return;
    }

    const fullAudioPath = this.config.basePath + this.config.fullAudioTrack;
    
    // Cria link temporário para download
    const link = document.createElement('a');
    link.href = fullAudioPath;
    link.download = this.config.fullAudioTrack;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("[AudioPlayer] Download iniciado:", this.config.fullAudioTrack);
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * ⌨️ ATALHOS DE TECLADO
   * ═══════════════════════════════════════════════════════════
   */

  handleKeyboard(e) {
    // Só ativa se player estiver visível
    if (!this.playerBar.classList.contains("active")) return;

    switch (e.key) {
      case " ":
        e.preventDefault();
        this.togglePlayPause();
        break;
      case "ArrowLeft":
        e.preventDefault();
        this.previous();
        break;
      case "ArrowRight":
        e.preventDefault();
        this.next();
        break;
      case "Escape":
        e.preventDefault();
        this.close();
        break;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 🚀 INICIALIZAÇÃO AUTOMÁTICA
// ═══════════════════════════════════════════════════════════════

let audioPlayer;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    audioPlayer = new AudioPlayer();
  });
} else {
  audioPlayer = new AudioPlayer();
}

// Exporta para acesso global (útil para debug)
window.audioPlayer = audioPlayer;
