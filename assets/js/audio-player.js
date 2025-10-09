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

    // --- Estado do áudio e playlist
    this.audio = new Audio();
    this.playlist = []; // [{ element, audioFile, text, audioKey }]
    this.currentIndex = 0;
    this.isPlaying = false;
    this.speeds = [0.75, 1, 1.25, 1.5, 2];
    this.currentSpeedIndex = 1; // Começa em 1x

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
   * 🎨 CRIAÇÃO DA UI
   * ═══════════════════════════════════════════════════════════
   */
  createUI() {
    this.createTriggerButton();
    this.createPlayerBar();
  }

  /**
   * Cria botão "Ouvir esta aula"
   */
  createTriggerButton() {
    const lessonMeta = document.querySelector(".lesson-meta");

    if (!lessonMeta) {
      console.warn(
        "[AudioPlayer] .lesson-meta não encontrado. Botão não será criado."
      );
      return;
    }

    const container = document.createElement("div");
    container.className = "audio-trigger-container";

    const button = document.createElement("button");
    button.className = "audio-trigger-btn morphable";
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${this.getIconSize()}" height="${this.getIconSize()}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-headphones-icon lucide-headphones"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>
      <span>Ouvir esta aula</span>
    `;

    const info = document.createElement("div");
    info.className = "audio-trigger-info";

    const totalDuration = this.estimateTotalDuration();
    info.innerHTML = `
      <div><strong>${this.playlist.length} trechos</strong> de áudio disponíveis</div>
      <div>Duração estimada: ~${totalDuration} minutos</div>
    `;

    container.appendChild(button);
    container.appendChild(info);

    lessonMeta.insertAdjacentElement("afterend", container);

    this.triggerBtn = button;
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
   * Cria barra do player (bottom)
   */
  createPlayerBar() {
    const bar = document.createElement("div");
    bar.className = "audio-player-bar";
    bar.innerHTML = `
      <div class="player-info">
        <div class="player-icon">
          <span class="material-symbols-outlined">play_circle</span>
        </div>
        <div class="player-text">
          <div class="player-title" id="playerTitle">Carregando...</div>
          <div class="player-subtitle" id="playerSubtitle">Leitura guiada</div>
        </div>
      </div>

      <div class="player-controls">
        <div class="player-buttons">
          <button class="player-btn btn-prev" id="btnPrev" title=" ">
            <span class="material-symbols-outlined">skip_previous</span>
          </button>
          
          <button class="player-btn btn-play-pause" id="btnPlayPause" title="Play">
            <span class="material-symbols-outlined">play_arrow</span>
          </button>
          
          <button class="player-btn btn-next" id="btnNext" title=" ">
            <span class="material-symbols-outlined">skip_next</span>
          </button>
        </div>

        <div class="player-progress-container">
          <span class="player-time" id="currentTime">0:00</span>
          <div class="player-progress-bar" id="progressBar">
            <div class="player-progress-fill" id="progressFill"></div>
            <div class="player-progress-scrubber" id="progressScrubber"></div>
            <div class="player-progress-tooltip" id="progressTooltip">0:00</div>
          </div>
          <span class="player-time" id="totalTime">0:00</span>
        </div>
      </div>

      <div class="player-extras">

        <div class="player-volume">
          <button class="player-btn volume-btn" id="volumeBtn" title="Volume">
            <span class="material-symbols-outlined">volume_up</span>
          </button>
          <div class="volume-slider-container">
            <input type="range" class="volume-slider" id="volumeSlider" min="0" max="100" value="100" title="Volume">
          </div>
        </div>
        
        <button class="player-btn player-close-btn" id="btnClose" title="Fechar">
          <span class="material-symbols-outlined btnCloseIcon">close</span>
        </button>
      </div>
    `;

    document.body.appendChild(bar);

    // Armazena referências
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

    // Reinicializa o sistema de cursor para incluir a nova barra de progresso
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
    
    // Remove as rough notations ANTES de esconder o player para evitar o flash
    if (window.roughAnnotationSystem) {
      this.destroyAllRoughAnnotations();
    }
    
    this.hidePlayer();
    this.removeHighlight();
    
    // Recria as rough notations com posições atualizadas
    if (window.roughAnnotationSystem) {
      // Delay para garantir que o player foi completamente removido do DOM
      setTimeout(() => {
        window.roughAnnotationSystem.refresh();
        console.log("[AudioPlayer] ✅ Rough notations recalculadas após fechar player");
      }, 100);
    }
  }

  /**
   * Destrói fisicamente todas as rough notations do DOM
   */
  destroyAllRoughAnnotations() {
    // Remove todos os elementos SVG criados pelas rough notations
    const roughSVGs = document.querySelectorAll('svg[class*="rough-annotation"]');
    roughSVGs.forEach(svg => {
      if (svg.parentNode) {
        svg.parentNode.removeChild(svg);
      }
    });

    // Remove também qualquer elemento com classes de rough notation que possa ter ficado
    const roughElements = document.querySelectorAll('[class*="rough-annotation"]');
    roughElements.forEach(element => {
      if (element.parentNode && element.tagName === 'svg') {
        element.parentNode.removeChild(element);
      }
    });

    console.log(`[AudioPlayer] 🗑️ Removidos ${roughSVGs.length} elementos SVG de rough notations`);
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
    const offset = window.innerHeight / 3; // Posiciona no terço superior

    window.scrollTo({
      top: elementTop - offset,
      behavior: "smooth",
    });
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
