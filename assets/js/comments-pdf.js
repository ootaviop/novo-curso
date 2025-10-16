/* ═══════════════════════════════════════════════════════════════
   📄 GERAÇÃO DE PDF COM COMENTÁRIOS
   Exporta todos os comentários do usuário em um PDF formatado
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // 📦 CONFIGURAÇÃO
  // ─────────────────────────────────────────────────────────────
  const CONFIG = {
    pageWidth: 595.28,      // A4 width in points
    pageHeight: 841.89,     // A4 height in points
    margin: 50,
    lineHeight: 18,
    fontSize: {
      title: 24,
      subtitle: 16,
      sectionHeader: 14,
      body: 11,
      small: 9
    },
    colors: {
      primary: [255, 92, 0],       // Orange #ff5c00
      secondary: [102, 126, 234],   // Purple #667eea
      text: [51, 51, 51],           // Dark gray #333
      textLight: [102, 102, 102],   // Gray #666
      background: [255, 243, 224],  // Light orange #fff3e0
      border: [224, 224, 224]       // Light gray #e0e0e0
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 🎨 GERAÇÃO DO PDF
  // ─────────────────────────────────────────────────────────────
  async function generateCommentsPDF() {
    try {
      // Verificar se pdf-lib está disponível
      if (typeof PDFLib === 'undefined') {
        throw new Error('Biblioteca pdf-lib não carregada');
      }

      // Obter comentários
      const comments = window.CommentsSystem?.getComments() || [];

      if (comments.length === 0) {
        alert('Você ainda não tem comentários para exportar!');
        return;
      }

      // Mostrar feedback de loading
      showLoadingFeedback();

      // Criar documento PDF
      const { PDFDocument, rgb, StandardFonts } = PDFLib;
      const pdfDoc = await PDFDocument.create();

      // Carregar fontes
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      // Informações do documento
      const lessonTitle = document.querySelector('.lesson-title')?.textContent?.trim() || 'Aula';
      const currentDate = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      // Adicionar primeira página com capa
      await addCoverPage(pdfDoc, fontBold, fontRegular, lessonTitle, comments.length, currentDate, rgb);

      // Adicionar páginas com comentários
      await addCommentsPages(pdfDoc, fontBold, fontRegular, fontItalic, comments, rgb);

      // Serializar e baixar PDF
      const pdfBytes = await pdfDoc.save();
      downloadPDF(pdfBytes, lessonTitle);

      // Esconder loading e mostrar sucesso
      hideLoadingFeedback();
      showSuccessFeedback(comments.length);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      hideLoadingFeedback();
      alert('Erro ao gerar PDF. Por favor, tente novamente.');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 📄 CAPA DO DOCUMENTO
  // ─────────────────────────────────────────────────────────────
  async function addCoverPage(pdfDoc, fontBold, fontRegular, lessonTitle, commentsCount, date, rgb) {
    const page = pdfDoc.addPage([CONFIG.pageWidth, CONFIG.pageHeight]);
    const { width, height } = page.getSize();

    let y = height - 150;

    // Título principal
    page.drawText('Meus Comentários', {
      x: CONFIG.margin,
      y: y,
      size: CONFIG.fontSize.title,
      font: fontBold,
      color: rgb(...CONFIG.colors.primary.map(c => c / 255))
    });

    y -= 50;

    // Nome da aula
    const titleLines = wrapText(lessonTitle, fontRegular, CONFIG.fontSize.subtitle, width - CONFIG.margin * 2);
    for (const line of titleLines) {
      page.drawText(line, {
        x: CONFIG.margin,
        y: y,
        size: CONFIG.fontSize.subtitle,
        font: fontRegular,
        color: rgb(...CONFIG.colors.text.map(c => c / 255))
      });
      y -= CONFIG.lineHeight + 5;
    }

    y -= 30;

    // Linha decorativa
    page.drawLine({
      start: { x: CONFIG.margin, y: y },
      end: { x: width - CONFIG.margin, y: y },
      thickness: 2,
      color: rgb(...CONFIG.colors.primary.map(c => c / 255))
    });

    y -= 50;

    // Informações do documento
    const info = [
      `Total de comentários: ${commentsCount}`,
      `Data de exportação: ${date}`,
    ];

    for (const text of info) {
      page.drawText(text, {
        x: CONFIG.margin,
        y: y,
        size: CONFIG.fontSize.body,
        font: fontRegular,
        color: rgb(...CONFIG.colors.textLight.map(c => c / 255))
      });
      y -= CONFIG.lineHeight + 8;
    }

    // Rodapé com logo/marca d'água
    page.drawText('Gerado pelo Sistema de Comentários', {
      x: CONFIG.margin,
      y: 50,
      size: CONFIG.fontSize.small,
      font: fontRegular,
      color: rgb(...CONFIG.colors.textLight.map(c => c / 255))
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 💬 PÁGINAS COM COMENTÁRIOS
  // ─────────────────────────────────────────────────────────────
  async function addCommentsPages(pdfDoc, fontBold, fontRegular, fontItalic, comments, rgb) {
    let page = pdfDoc.addPage([CONFIG.pageWidth, CONFIG.pageHeight]);
    let y = CONFIG.pageHeight - CONFIG.margin;
    let commentNumber = 1;

    for (const comment of comments) {
      // Calcular espaço necessário
      const spaceNeeded = calculateCommentSpace(comment, fontRegular, fontItalic, page.getWidth());

      // Se não couber, criar nova página
      if (y - spaceNeeded < CONFIG.margin + 50) {
        // Adicionar número da página
        addPageNumber(page, fontRegular, pdfDoc.getPageCount(), rgb);

        // Nova página
        page = pdfDoc.addPage([CONFIG.pageWidth, CONFIG.pageHeight]);
        y = CONFIG.pageHeight - CONFIG.margin;
      }

      // Renderizar comentário
      y = await renderComment(page, fontBold, fontRegular, fontItalic, comment, y, commentNumber, rgb);
      commentNumber++;
    }

    // Adicionar número na última página
    addPageNumber(page, fontRegular, pdfDoc.getPageCount(), rgb);
  }

  // ─────────────────────────────────────────────────────────────
  // 🎨 RENDERIZAÇÃO DE UM COMENTÁRIO
  // ─────────────────────────────────────────────────────────────
  async function renderComment(page, fontBold, fontRegular, fontItalic, comment, startY, number, rgb) {
    const { width } = page.getSize();
    const contentWidth = width - CONFIG.margin * 2;
    let y = startY;

    // Espaçamento antes do comentário
    y -= 10;

    // ─────────────────────────────────────────────────────────
    // CABEÇALHO: "Comentário #X"
    // ─────────────────────────────────────────────────────────
    page.drawText(`Comentário #${number}`, {
      x: CONFIG.margin,
      y: y,
      size: CONFIG.fontSize.sectionHeader,
      font: fontBold,
      color: rgb(...CONFIG.colors.primary.map(c => c / 255))
    });

    y -= CONFIG.lineHeight + 8;

    // Data do comentário
    const commentDate = new Date(comment.timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    page.drawText(`Data: ${commentDate}`, {
      x: CONFIG.margin,
      y: y,
      size: CONFIG.fontSize.small,
      font: fontRegular,
      color: rgb(...CONFIG.colors.textLight.map(c => c / 255))
    });

    y -= CONFIG.lineHeight + 10;

    // ─────────────────────────────────────────────────────────
    // CAIXA: Texto selecionado
    // ─────────────────────────────────────────────────────────
    const boxPadding = 12;
    const selectedTextLines = wrapText(
      comment.selectedText,
      fontItalic,
      CONFIG.fontSize.body,
      contentWidth - boxPadding * 2
    );

    const boxHeight = (selectedTextLines.length * CONFIG.lineHeight) + (boxPadding * 2);

    // Fundo da caixa
    page.drawRectangle({
      x: CONFIG.margin,
      y: y - boxHeight,
      width: contentWidth,
      height: boxHeight,
      color: rgb(...CONFIG.colors.background.map(c => c / 255))
    });

    // Borda esquerda (laranja)
    page.drawRectangle({
      x: CONFIG.margin,
      y: y - boxHeight,
      width: 4,
      height: boxHeight,
      color: rgb(...CONFIG.colors.primary.map(c => c / 255))
    });

    // Texto selecionado
    let textY = y - boxPadding - 12;
    for (const line of selectedTextLines) {
      page.drawText(line, {
        x: CONFIG.margin + boxPadding + 4,
        y: textY,
        size: CONFIG.fontSize.body,
        font: fontItalic,
        color: rgb(...CONFIG.colors.textLight.map(c => c / 255))
      });
      textY -= CONFIG.lineHeight;
    }

    y -= boxHeight + 15;

    // ─────────────────────────────────────────────────────────
    // TÍTULO: "Seu comentário:"
    // ─────────────────────────────────────────────────────────
    page.drawText('Seu comentário:', {
      x: CONFIG.margin,
      y: y,
      size: CONFIG.fontSize.body,
      font: fontBold,
      color: rgb(...CONFIG.colors.text.map(c => c / 255))
    });

    y -= CONFIG.lineHeight + 5;

    // ─────────────────────────────────────────────────────────
    // TEXTO: Comentário do usuário
    // ─────────────────────────────────────────────────────────
    const commentLines = wrapText(
      comment.commentText,
      fontRegular,
      CONFIG.fontSize.body,
      contentWidth
    );

    for (const line of commentLines) {
      page.drawText(line, {
        x: CONFIG.margin,
        y: y,
        size: CONFIG.fontSize.body,
        font: fontRegular,
        color: rgb(...CONFIG.colors.text.map(c => c / 255))
      });
      y -= CONFIG.lineHeight;
    }

    // Linha separadora
    y -= 20;
    page.drawLine({
      start: { x: CONFIG.margin, y: y },
      end: { x: width - CONFIG.margin, y: y },
      thickness: 1,
      color: rgb(...CONFIG.colors.border.map(c => c / 255)),
      opacity: 0.5
    });

    y -= 30;

    return y;
  }

  // ─────────────────────────────────────────────────────────────
  // 🔧 UTILITÁRIOS
  // ─────────────────────────────────────────────────────────────
  function wrapText(text, font, fontSize, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  function calculateCommentSpace(comment, fontRegular, fontItalic, pageWidth) {
    const contentWidth = pageWidth - CONFIG.margin * 2;

    // Cabeçalho
    let space = CONFIG.fontSize.sectionHeader + 8;

    // Data
    space += CONFIG.fontSize.small + 10;

    // Caixa de texto selecionado
    const selectedLines = wrapText(comment.selectedText, fontItalic, CONFIG.fontSize.body, contentWidth - 28);
    space += (selectedLines.length * CONFIG.lineHeight) + 24 + 15;

    // Título do comentário
    space += CONFIG.fontSize.body + 5;

    // Texto do comentário
    const commentLines = wrapText(comment.commentText, fontRegular, CONFIG.fontSize.body, contentWidth);
    space += (commentLines.length * CONFIG.lineHeight) + 20 + 30;

    return space;
  }

  function addPageNumber(page, font, pageNumber, rgb) {
    const { width } = page.getSize();
    const text = `Pagina ${pageNumber}`;
    const textWidth = font.widthOfTextAtSize(text, CONFIG.fontSize.small);

    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: 30,
      size: CONFIG.fontSize.small,
      font: font,
      color: rgb(...CONFIG.colors.textLight.map(c => c / 255))
    });
  }

  function downloadPDF(pdfBytes, lessonTitle) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Nome do arquivo
    const sanitizedTitle = lessonTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    link.href = url;
    link.download = `comentarios-${sanitizedTitle}-${Date.now()}.pdf`;
    link.click();

    // Limpar URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // ─────────────────────────────────────────────────────────────
  // 💫 FEEDBACK VISUAL
  // ─────────────────────────────────────────────────────────────
  function showLoadingFeedback() {
    const overlay = document.createElement('div');
    overlay.id = 'pdfLoadingOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10004;
      animation: fadeIn 0.3s ease;
    `;

    overlay.innerHTML = `
      <div style="
        background: white;
        padding: 40px;
        border-radius: 16px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      ">
        <div style="
          width: 60px;
          height: 60px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #ff5c00;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <h3 style="margin: 0 0 10px; color: #333; font-size: 20px;">Gerando PDF...</h3>
        <p style="margin: 0; color: #666; font-size: 14px;">Isso pode levar alguns segundos</p>
      </div>
    `;

    document.body.appendChild(overlay);

    // Adicionar animações CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  function hideLoadingFeedback() {
    const overlay = document.getElementById('pdfLoadingOverlay');
    if (overlay) {
      overlay.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => overlay.remove(), 300);
    }
  }

  function showSuccessFeedback(count) {
    const toast = document.createElement('div');
    toast.className = 'comment-toast';
    toast.innerHTML = `
      <div class="comment-toast-content">
        <svg class="comment-toast-icon success" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <div>
          <div class="comment-toast-text" style="font-weight: 700; margin-bottom: 4px;">PDF gerado com sucesso!</div>
          <div class="comment-toast-text" style="font-size: 13px; opacity: 0.7;">${count} comentário${count !== 1 ? 's' : ''} exportado${count !== 1 ? 's' : ''}</div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);

    // Animar entrada
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    // Remover após delay
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // ─────────────────────────────────────────────────────────────
  // 🎬 INICIALIZAÇÃO
  // ─────────────────────────────────────────────────────────────
  function init() {
    // Adicionar evento ao botão de download
    const btn = document.getElementById('downloadCommentsBtn');
    if (btn) {
      btn.addEventListener('click', generateCommentsPDF);
      console.log('✅ Sistema de PDF de comentários inicializado');
    }
  }

  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expor função globalmente
  window.generateCommentsPDF = generateCommentsPDF;

})();
