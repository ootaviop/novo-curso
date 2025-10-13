/**
 * ═══════════════════════════════════════════════════════════════
 * 🎵 CONFIGURAÇÃO DOS ÁUDIOS
 * ═══════════════════════════════════════════════════════════════
 * 
 * INSTRUÇÕES:
 * 1. Rode o audio-scanner.js primeiro
 * 2. Copie o template gerado no console
 * 3. Cole aqui substituindo o conteúdo
 * 4. Ajuste os nomes dos arquivos .mp3 conforme sua pasta /audio/
 * 
 * ESTRUTURA:
 * - basePath: caminho da pasta onde estão os áudios
 * - tracks: mapeamento data-audio → arquivo.mp3
 */

const audioConfig = {
  // Caminho base dos arquivos de áudio
  basePath: './audio/pos-cut/',
  
  // Mapeamento dos áudios
  // Chave: valor do data-audio no HTML
  // Valor: nome do arquivo .mp3
  tracks: {
    // ═══════════════════════════════════════════════════════════
    // 🏷️ EXEMPLO DE ESTRUTURA (substitua pelo scanner)
    // ═══════════════════════════════════════════════════════════
    
    // Cabeçalho da aula
    'titulo': 'titulo.mp3',
    'tempo-leitura': 'tempo-leitura.mp3',
    
    // Parágrafos
    'p1': 'p1.mp3',
    'p2': 'p2.mp3',
    'p3': 'p3.mp3',
    'p4': 'p4.mp3',
    'p5': 'p5.mp3',
    
    // Citações
    'p6': 'p6(citacao).mp3',
    
    // Continue adicionando baseado no output do scanner...
    'p7': 'p7.mp3',
    'p8': 'p8.mp3',
    'p9': 'p9.mp3',
    'p10': 'p10.mp3',
    'p11': 'p11.mp3',
    
    // Destaques
    'p12': 'p12(destaque).mp3',
    
    // Títulos de seção
    'p13': 'p13(titulo).mp3',
    
    'p14': 'p14.mp3',
    'p15': 'p15.mp3',
    
    'p16': 'p16(destaque).mp3',
    
    'p17': 'p17.mp3',
    'p18': 'p18.mp3',
    'p19': 'p19.mp3',
    
    'p20': 'p20(citacao).mp3',
    
    'p21': 'p21.mp3',
    
    // ═══════════════════════════════════════════════════════════
    // 💡 ADICIONE MAIS CONFORME NECESSÁRIO
    // ═══════════════════════════════════════════════════════════
  }
};

// ═══════════════════════════════════════════════════════════════
// 🎵 ÁUDIOS CONSOLIDADOS (MODO PODCAST)
// ═══════════════════════════════════════════════════════════════

// Configuração para áudios consolidados (todos os parágrafos unidos)
audioConfig.consolidated = {
  'aula-2-lideranca': {
    file: './audio/consolidado/aula-2-completo.mp3',
    title: 'Liderança escolar eficaz é transformacional e compartilhada',
    duration: 397, // segundos (6:37)
    description: 'Aula completa sobre liderança escolar transformacional e distribuída'
  }
};

// Exporta para uso global
window.audioConfig = audioConfig;