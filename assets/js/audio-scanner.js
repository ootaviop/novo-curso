/**
 * ═══════════════════════════════════════════════════════════════
 * 🔍 AUDIO SCANNER - SETUP INICIAL
 * ═══════════════════════════════════════════════════════════════
 * 
 * INSTRUÇÕES DE USO:
 * 1. Adicione este script ao final do seu HTML (antes de fechar </body>):
 *    <script src="./assets/js/audio-scanner.js"></script>
 * 
 * 2. Abra a página no navegador
 * 
 * 3. Abra o Console (F12 → Console)
 * 
 * 4. O script vai:
 *    ✅ Escanear todos os elementos que precisam de áudio
 *    ✅ Numerar automaticamente
 *    ✅ Gerar o template do audio-config.js
 *    ✅ Mostrar sugestões de data-audio para adicionar no HTML
 * 
 * 5. Copie os resultados do console e use-os para:
 *    - Adicionar data-audio no HTML
 *    - Preencher o audio-config.js
 * 
 * 6. DEPOIS DE USAR, REMOVA ESTE SCRIPT DO HTML!
 */

(function() {
  'use strict';

  console.log('%c🔍 AUDIO SCANNER - Iniciando varredura...', 'color: #ff6b35; font-size: 16px; font-weight: bold;');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Seletor único que pega TUDO na ordem do DOM
  const mainSelector = `
    .lesson-title,
    .lesson-meta,
    section[data-nav-level] h1,
    section[data-nav-level] h2,
    section[data-nav-level] h3,
    section[data-nav-level] h4,
    section[data-nav-level] h5,
    section[data-nav-level] h6,
    section[data-nav-level] p,
    .callout p,
    .callout-quote p
  `;

  // Pega todos os elementos NA ORDEM que aparecem no HTML
  const allElements = document.querySelectorAll(mainSelector);
  
  console.log(`✅ Total de elementos encontrados: ${allElements.length}\n`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📋 ELEMENTOS NA ORDEM SEQUENCIAL DO HTML');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const elementsFound = [];
  const audioConfigTemplate = {};
  

  // Itera em ordem, numerando sequencialmente
  allElements.forEach((element, index) => {
    const sequentialNumber = index + 1;
    const text = element.textContent.trim().substring(0, 60) + '...';
    
    // Determina o tipo do elemento
    let type = 'texto';
    let icon = '📝';
    
    if (element.classList.contains('lesson-title')) {
      type = 'Título Principal';
      icon = '📌';
    } else if (element.classList.contains('lesson-meta')) {
      type = 'Meta (tempo)';
      icon = '⏱️';
    } else if (element.tagName.match(/^H[1-6]$/)) {
      type = `Título ${element.tagName}`;
      icon = '🔷';
    } else if (element.closest('.callout-quote')) {
      type = 'Citação';
      icon = '💬';
    } else if (element.closest('.callout')) {
      type = 'Destaque';
      icon = '⚠️';
    } else {
      type = 'Parágrafo';
      icon = '📝';
    }

    // Gera o data-audio sequencial
    const suggestedAudio = `p${sequentialNumber}`;
    
    // Sugere nome do arquivo baseado no que ele tem
    let suggestedFilename;
    if (element.classList.contains('lesson-title')) {
      suggestedFilename = 'titulo.mp3';
    } else if (element.classList.contains('lesson-meta')) {
      suggestedFilename = 'tempo-leitura.mp3';
    } else {
      suggestedFilename = `p${sequentialNumber}.mp3`;
    }

    // Armazena
    elementsFound.push({
      element,
      type,
      icon,
      suggestedAudio,
      suggestedFilename,
      text
    });

    audioConfigTemplate[suggestedAudio] = suggestedFilename;

    // Log visual
    console.log(`${icon} [${suggestedAudio.padEnd(4)}] ${type.padEnd(18)} → "${text}"`);
  });

  // ═══════════════════════════════════════════════════════════════
  // RELATÓRIO FINAL
  // ═══════════════════════════════════════════════════════════════

  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('📊 RELATÓRIO FINAL');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`✅ Total de elementos encontrados: ${elementsFound.length}`);
  console.log(`✅ Arquivos de áudio necessários: ${elementsFound.length}`);

  // ═══════════════════════════════════════════════════════════════
  // TEMPLATE DO AUDIO-CONFIG.JS
  // ═══════════════════════════════════════════════════════════════

  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('📋 TEMPLATE DO audio-config.js');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Copie e cole no arquivo audio-config.js:\n');

  const configCode = `const audioConfig = {
  basePath: './audio/',
  tracks: ${JSON.stringify(audioConfigTemplate, null, 4)}
};`;

  console.log(configCode);

  // ═══════════════════════════════════════════════════════════════
  // GUIA DE data-audio PARA O HTML
  // ═══════════════════════════════════════════════════════════════

  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('🏷️ ADICIONE ESTES data-audio NO SEU HTML');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('IMPORTANTE: Adicione NA ORDEM que aparecem aqui!\n');

  elementsFound.forEach(({ element, suggestedAudio, text, icon, type }) => {
    console.log(`${icon} data-audio="${suggestedAudio}" (${type})`);
    console.log(`   → Texto: "${text}"`);
    console.log(`   → Tag: ${element.tagName.toLowerCase()}${element.className ? '.' + element.className.split(' ')[0] : ''}`);
    console.log('');
  });

  // ═══════════════════════════════════════════════════════════════
  // CHECKLIST FINAL
  // ═══════════════════════════════════════════════════════════════

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ CHECKLIST - O QUE FAZER AGORA:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('1️⃣  Copie o código do audio-config.js acima');
  console.log('2️⃣  Cole no arquivo audio-config.js');
  console.log('3️⃣  Ajuste os nomes dos arquivos .mp3 se necessário:');
  console.log('    Exemplo: Se você gravou "p6(citacao).mp3", ajuste no config');
  console.log('4️⃣  Adicione os data-audio no HTML seguindo a ORDEM acima');
  console.log('5️⃣  Remova a tag <script> do audio-scanner.js do HTML');
  console.log('6️⃣  Adicione audio-player.css e audio-player.js');
  console.log('7️⃣  Teste o player! 🎉\n');
  console.log('⚠️  ATENÇÃO: Se seus arquivos .mp3 têm numeração diferente,');
  console.log('    você pode renomeá-los OU ajustar o audio-config.js');
  console.log('    O importante é que o data-audio="pX" corresponda ao arquivo!\n');

  // ═══════════════════════════════════════════════════════════════
  // EXPORTA PARA A JANELA (opcional)
  // ═══════════════════════════════════════════════════════════════

  window.audioScanResult = {
    elements: elementsFound,
    config: audioConfigTemplate,
    total: elementsFound.length
  };

  console.log('%c💡 DICA: Você pode acessar window.audioScanResult para ver os dados em formato de objeto', 'color: #666; font-style: italic;');

})();