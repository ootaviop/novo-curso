/**
 * ═══════════════════════════════════════════════════════════════
 * 🎵 WAVEFORM VISUALIZER - Web Audio API
 * ═══════════════════════════════════════════════════════════════
 * 
 * Sistema de visualização de waveform real usando Web Audio API
 * - Análise de áudio em tempo real
 * - Renderização SVG dinâmica
 * - Sincronização com progresso do player
 * - Otimização de performance para mobile
 */

class WaveformVisualizer {
  constructor(containerElement) {
    this.container = containerElement;
    this.audioContext = null;
    this.audioBuffer = null;
    this.audioSource = null;
    this.analyser = null;
    this.dataArray = null;
    this.animationId = null;
    
    // Configurações
    this.config = {
      barCount: 80,        // Mais pontos para curva suave
      maxHeight: 60,       // Altura reduzida para design minimalista
      colors: {
        played: '#FFB59A',      // laranja suave
        unplayed: '#E8E8E8',    // cinza claro
        highlight: '#FF9A7A'    // laranja mais escuro
      },
      animationFPS: 30,    // Throttling para economia de bateria
      strokeWidth: 2,      // Largura da linha
      strokeWidthPlayed: 2.5 // Largura da linha tocada (ligeiramente mais grossa)
    };
    
    // Estado
    this.isInitialized = false;
    this.isPlaying = false;
    this.currentProgress = 0;
    this.lastFrameTime = 0;
    this.waveformData = [];
    
    this.init();
  }
  
  /**
   * Inicializa o visualizador
   */
  async init() {
    try {
      await this.setupAudioContext();
      this.createSVG();
      this.isInitialized = true;
      console.log('✅ WaveformVisualizer inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar WaveformVisualizer:', error);
      this.showError();
    }
  }
  
  /**
   * Configura o contexto de áudio
   */
  async setupAudioContext() {
    // Cria contexto de áudio
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Cria analisador
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    
    // Buffer para dados de frequência
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
  }
  
  /**
   * Cria a estrutura SVG
   */
  createSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'podcast-waveform-svg');
    svg.setAttribute('viewBox', '0 0 400 120');
    svg.setAttribute('preserveAspectRatio', 'none');
    
    // Grupo para as barras
    this.barsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.barsGroup.setAttribute('class', 'waveform-bars');
    
    // Grupo para o progresso
    this.progressGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.progressGroup.setAttribute('class', 'waveform-progress');
    this.progressGroup.style.clipPath = 'url(#progressClip)';
    
    // Definição do clip path para progresso
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', 'progressClip');
    
    this.progressRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.progressRect.setAttribute('x', '0');
    this.progressRect.setAttribute('y', '0');
    this.progressRect.setAttribute('width', '0%');
    this.progressRect.setAttribute('height', '100%');
    
    clipPath.appendChild(this.progressRect);
    defs.appendChild(clipPath);
    
    svg.appendChild(defs);
    svg.appendChild(this.barsGroup);
    svg.appendChild(this.progressGroup);
    
    // Limpa container e adiciona SVG
    this.container.innerHTML = '';
    this.container.appendChild(svg);
    
    // Cria barras iniciais (placeholder)
    this.createPlaceholderBars();
  }
  
  /**
   * Cria placeholder de waveform suave enquanto carrega
   */
  createPlaceholderBars() {
    // Gera dados placeholder para criar curva suave
    const placeholderData = [];
    for (let i = 0; i < this.config.barCount; i++) {
      placeholderData.push(Math.random() * 30 + 15); // Altura aleatória
    }
    
    // Cria curva suave com os dados placeholder
    const pathData = this.generateSmoothPath(placeholderData);
    
    // Linha de fundo (placeholder)
    const bgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bgPath.setAttribute('d', pathData);
    bgPath.setAttribute('fill', 'none');
    bgPath.setAttribute('stroke', this.config.colors.unplayed);
    bgPath.setAttribute('stroke-width', this.config.strokeWidth);
    bgPath.setAttribute('stroke-linecap', 'round');
    bgPath.setAttribute('stroke-linejoin', 'round');
    this.barsGroup.appendChild(bgPath);
  }
  
  /**
   * Analisa e renderiza waveform de um buffer de áudio
   */
  async analyzeAudioBuffer(audioBuffer) {
    try {
      this.audioBuffer = audioBuffer;
      this.generateWaveformData();
      this.renderWaveform();
      console.log('✅ Waveform analisado e renderizado');
    } catch (error) {
      console.error('❌ Erro ao analisar áudio:', error);
      this.showError();
    }
  }
  
  /**
   * Gera dados de waveform a partir do buffer de áudio
   */
  generateWaveformData() {
    if (!this.audioBuffer) return;
    
    const channelData = this.audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / this.config.barCount);
    this.waveformData = [];
    
    for (let i = 0; i < this.config.barCount; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, channelData.length);
      
      // Calcula RMS (Root Mean Square) para amplitude
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += channelData[j] * channelData[j];
      }
      
      const rms = Math.sqrt(sum / (end - start));
      const normalizedHeight = Math.min(rms * this.config.maxHeight, this.config.maxHeight);
      
      this.waveformData.push(normalizedHeight);
    }
  }
  
  /**
   * Gera path SVG suave usando interpolação Catmull-Rom
   */
  generateSmoothPath(data) {
    if (!data || data.length < 2) return '';
    
    const width = 400; // Largura do viewBox
    const height = 120; // Altura do viewBox
    const centerY = height / 2;
    const stepX = width / (data.length - 1);
    
    // Cria pontos para interpolação
    const points = data.map((value, index) => ({
      x: index * stepX,
      y: centerY - (value / this.config.maxHeight) * (centerY - 20) // Normaliza altura
    }));
    
    // Interpolação Catmull-Rom para curvas suaves
    let pathData = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const p0 = points[Math.max(0, i - 2)];
      const p1 = points[i - 1];
      const p2 = points[i];
      const p3 = points[Math.min(points.length - 1, i + 1)];
      
      // Calcula pontos de controle para curva suave
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    
    return pathData;
  }

  /**
   * Renderiza o waveform com linhas onduladas suaves
   */
  renderWaveform() {
    if (!this.waveformData.length) return;
    
    // Limpa elementos existentes
    this.barsGroup.innerHTML = '';
    this.progressGroup.innerHTML = '';
    
    // Gera path suave
    const pathData = this.generateSmoothPath(this.waveformData);
    
    // Linha de fundo (não tocada)
    const bgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bgPath.setAttribute('d', pathData);
    bgPath.setAttribute('fill', 'none');
    bgPath.setAttribute('stroke', this.config.colors.unplayed);
    bgPath.setAttribute('stroke-width', this.config.strokeWidth);
    bgPath.setAttribute('stroke-linecap', 'round');
    bgPath.setAttribute('stroke-linejoin', 'round');
    this.barsGroup.appendChild(bgPath);
    
    // Linha de progresso (tocada)
    const progressPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    progressPath.setAttribute('d', pathData);
    progressPath.setAttribute('fill', 'none');
    progressPath.setAttribute('stroke', this.config.colors.played);
    progressPath.setAttribute('stroke-width', this.config.strokeWidthPlayed);
    progressPath.setAttribute('stroke-linecap', 'round');
    progressPath.setAttribute('stroke-linejoin', 'round');
    this.progressGroup.appendChild(progressPath);
    
    // Atualiza clip path inicial
    this.updateProgress(0);
  }
  
  /**
   * Atualiza o progresso visual do waveform
   */
  updateProgress(progress) {
    this.currentProgress = Math.max(0, Math.min(1, progress));
    
    // Atualiza clip path para mostrar apenas a parte tocada
    if (this.progressRect) {
      this.progressRect.setAttribute('width', `${this.currentProgress * 100}%`);
    }
    
    // Destaca ponto atual na linha
    this.highlightCurrentPoint();
  }
  
  /**
   * Destaca o ponto atual sendo reproduzido na linha
   */
  highlightCurrentPoint() {
    const progressPath = this.progressGroup.querySelector('path');
    if (!progressPath) return;
    
    // Adiciona um pequeno círculo no ponto atual
    const width = 400;
    const height = 120;
    const centerY = height / 2;
    const currentX = this.currentProgress * width;
    
    // Remove círculo anterior se existir
    const existingCircle = this.progressGroup.querySelector('.current-point');
    if (existingCircle) {
      existingCircle.remove();
    }
    
    // Calcula Y do ponto atual na curva
    const currentY = this.calculatePointY(this.currentProgress);
    
    // Cria círculo de destaque
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'current-point');
    circle.setAttribute('cx', currentX);
    circle.setAttribute('cy', currentY);
    circle.setAttribute('r', '3');
    circle.setAttribute('fill', this.config.colors.highlight);
    circle.setAttribute('stroke', 'white');
    circle.setAttribute('stroke-width', '1');
    circle.style.filter = 'drop-shadow(0 0 4px rgba(255, 154, 122, 0.6))';
    
    this.progressGroup.appendChild(circle);
  }
  
  /**
   * Calcula a posição Y de um ponto na curva baseado no progresso
   */
  calculatePointY(progress) {
    if (!this.waveformData.length) return 60;
    
    const height = 120;
    const centerY = height / 2;
    const dataIndex = Math.floor(progress * (this.waveformData.length - 1));
    const value = this.waveformData[dataIndex] || 0;
    
    return centerY - (value / this.config.maxHeight) * (centerY - 20);
  }
  
  /**
   * Inicia animação em tempo real (para análise de áudio ao vivo)
   */
  startRealTimeAnalysis(audioSource) {
    if (!this.isInitialized) return;
    
    this.audioSource = audioSource;
    this.audioSource.connect(this.analyser);
    this.isPlaying = true;
    this.animate();
  }
  
  /**
   * Para animação em tempo real
   */
  stopRealTimeAnalysis() {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }
  }
  
  /**
   * Loop de animação (throttled para economia de bateria)
   */
  animate() {
    if (!this.isPlaying) return;
    
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    const targetInterval = 1000 / this.config.animationFPS;
    
    if (deltaTime >= targetInterval) {
      this.updateRealTimeVisualization();
      this.lastFrameTime = now;
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  /**
   * Atualiza visualização em tempo real
   */
  updateRealTimeVisualization() {
    if (!this.analyser || !this.dataArray) return;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Processa dados de frequência para pontos da curva
    const barCount = this.config.barCount;
    const dataLength = this.dataArray.length;
    const blockSize = Math.floor(dataLength / barCount);
    
    for (let i = 0; i < barCount; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, dataLength);
      
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += this.dataArray[j];
      }
      
      const average = sum / (end - start);
      const normalizedHeight = (average / 255) * this.config.maxHeight;
      
      this.waveformData[i] = normalizedHeight;
    }
    
    // Re-renderiza apenas se necessário (otimização)
    this.renderWaveform();
  }
  
  /**
   * Mostra estado de erro
   */
  showError() {
    this.container.innerHTML = `
      <div class="podcast-error">
        <span class="podcast-error-icon">⚠️</span>
        <p>Erro ao carregar visualização de áudio</p>
      </div>
    `;
  }
  
  /**
   * Limpa recursos
   */
  destroy() {
    this.stopRealTimeAnalysis();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.container.innerHTML = '';
    this.isInitialized = false;
    
    console.log('🗑️ WaveformVisualizer destruído');
  }
  
  /**
   * Redimensiona o visualizador
   */
  resize() {
    if (this.isInitialized && this.waveformData.length) {
      this.renderWaveform();
      this.updateProgress(this.currentProgress);
    }
  }
}

// Exporta para uso global
window.WaveformVisualizer = WaveformVisualizer;
