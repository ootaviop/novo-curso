document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.querySelector('.pdf-trigger-btn');
    const contentDiv = document.getElementById('contentAula');

    // Adicionar classe para animação inicial e remover após execução
    downloadBtn.classList.add('initial-animation');

    // Remover classe após a animação ser executada (0.4s delay + 0.5s duration)
    setTimeout(() => {
        downloadBtn.classList.remove('initial-animation');
    }, 900); // 400ms delay + 500ms duration

    // ─────────────────────────────────────────────────────────────
    // 📦 CONFIGURAÇÃO DE ESTILOS (Inspirado no PDF de comentários)
    // ─────────────────────────────────────────────────────────────
    const CONFIG = {
        pageWidth: 595.28,
        pageHeight: 841.89,
        margin: 50,
        lineHeight: 18,
        fontSize: {
            title: 24,
            subtitle: 18,
            h1: 20,
            h2: 16,
            h3: 14,
            body: 11,
            small: 9
        },
        colors: {
            primary: [255, 92, 0],        // Orange #ff5c00
            text: [51, 51, 51],            // Dark gray #333
            textLight: [102, 102, 102],    // Gray #666
            background: [255, 243, 224],   // Light orange #fff3e0
            border: [224, 224, 224],       // Light gray #e0e0e0
            headingDark: [26, 26, 26]      // Almost black #1a1a1a
        },
        spacing: {
            h1Before: 25,
            h1After: 15,
            h2Before: 20,
            h2After: 12,
            h3Before: 15,
            h3After: 10,
            pAfter: 12,
            listAfter: 8
        }
    };

    // Função auxiliar para quebrar texto (sem mudanças)
    function wrapText(text, font, fontSize, maxWidth) {
        // Sanitizar texto antes de processar para evitar erros de encoding
        const sanitizedText = sanitizeTextForPDF(text);
        const words = sanitizedText.split(' ');
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

    // Função para sanitizar texto removendo emojis e caracteres incompatíveis com WinAnsi
    function sanitizeTextForPDF(text) {
        return text
            // Remove emojis e símbolos (U+1F300-U+1F9FF)
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
            // Remove outros caracteres problemáticos
            .replace(/[\u{2600}-\u{26FF}]/gu, '')  // Símbolos diversos
            .replace(/[\u{2700}-\u{27BF}]/gu, '')  // Dingbats
            .replace(/[\u{2000}-\u{206F}]/gu, '')  // Pontuação geral
            .replace(/[\u{2070}-\u{209F}]/gu, '')  // Sobrescrito/subscrito
            .replace(/[\u{20A0}-\u{20CF}]/gu, '')  // Símbolos de moeda
            // Normalizar espaços em branco
            .replace(/\s+/g, ' ')
            .trim();
    }

    // ─────────────────────────────────────────────────────────────
    // 🎨 FUNÇÃO PARA ADICIONAR CAPA
    // ─────────────────────────────────────────────────────────────
    function addCoverPage(pdfDoc, fontBold, fontRegular, lessonTitle, rgb) {
        const page = pdfDoc.addPage([CONFIG.pageWidth, CONFIG.pageHeight]);
        const { width, height } = page.getSize();
        let y = height - 150;

        // Título principal
        page.drawText('Aula Completa', {
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

        // Data de exportação
        const currentDate = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        page.drawText(`Data de exportação: ${currentDate}`, {
            x: CONFIG.margin,
            y: y,
            size: CONFIG.fontSize.body,
            font: fontRegular,
            color: rgb(...CONFIG.colors.textLight.map(c => c / 255))
        });

        // Rodapé
        page.drawText('', {
            x: CONFIG.margin,
            y: 50,
            size: CONFIG.fontSize.small,
            font: fontRegular,
            color: rgb(...CONFIG.colors.textLight.map(c => c / 255))
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 📝 FUNÇÃO PARA DESENHAR LISTAS ESTILIZADAS
    // ─────────────────────────────────────────────────────────────
    function drawList(listElement, pdfDoc, currentPage, font, yPosition, rgb) {
        const items = listElement.querySelectorAll(':scope > li');
        const isOrdered = listElement.tagName.toLowerCase() === 'ol';
        let itemNumber = 1;
        let page = currentPage;

        for (const item of items) {
            const text = sanitizeTextForPDF(item.textContent.replace(/\s+/g, ' ').trim());
            if (!text) continue;

            const prefix = isOrdered ? `${itemNumber++}. ` : '• ';
            const prefixWidth = font.widthOfTextAtSize(prefix, CONFIG.fontSize.body);
            const itemTextWidth = CONFIG.pageWidth - 2 * CONFIG.margin - prefixWidth - 10;

            const lines = wrapText(text, font, CONFIG.fontSize.body, itemTextWidth);

            for (let i = 0; i < lines.length; i++) {
                // Verificar se precisa de nova página
                if (yPosition < CONFIG.margin + 50) {
                    addPageNumber(page, font, pdfDoc.getPageCount(), rgb);
                    page = pdfDoc.addPage([CONFIG.pageWidth, CONFIG.pageHeight]);
                    yPosition = CONFIG.pageHeight - CONFIG.margin;
                }

                const x = i === 0 ? CONFIG.margin : CONFIG.margin + prefixWidth;
                const textToDraw = i === 0 ? `${prefix}${lines[i]}` : lines[i];

                page.drawText(textToDraw, {
                    x: x,
                    y: yPosition,
                    size: CONFIG.fontSize.body,
                    font: font,
                    color: rgb(...CONFIG.colors.text.map(c => c / 255))
                });

                yPosition -= CONFIG.lineHeight;
            }

            yPosition -= CONFIG.spacing.listAfter;
        }

        return { page, yPosition };
    }

    // ─────────────────────────────────────────────────────────────
    // 📄 FUNÇÃO PARA ADICIONAR NÚMERO DE PÁGINA
    // ─────────────────────────────────────────────────────────────
    function addPageNumber(page, font, pageNumber, rgb) {
        const { width } = page.getSize();
        const text = `Página ${pageNumber}`;
        const textWidth = font.widthOfTextAtSize(text, CONFIG.fontSize.small);

        page.drawText(text, {
            x: (width - textWidth) / 2,
            y: 30,
            size: CONFIG.fontSize.small,
            font: font,
            color: rgb(...CONFIG.colors.textLight.map(c => c / 255))
        });
    }


    downloadBtn.addEventListener('click', async () => {
        try {
            // Mostrar feedback de loading
            showLoadingFeedback();

            const pdfDoc = await PDFLib.PDFDocument.create();
            const { rgb } = PDFLib;
            const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            const helveticaBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

            // Obter título da aula
            const lessonTitle = document.querySelector('.lesson-title')?.textContent?.trim() || 'Aula';

            // ─────────────────────────────────────────────────────────
            // ADICIONAR CAPA
            // ─────────────────────────────────────────────────────────
            addCoverPage(pdfDoc, helveticaBoldFont, helveticaFont, lessonTitle, rgb);

            // ─────────────────────────────────────────────────────────
            // ADICIONAR CONTEÚDO DA AULA
            // ─────────────────────────────────────────────────────────
            let page = pdfDoc.addPage([CONFIG.pageWidth, CONFIG.pageHeight]);
            let yPosition = CONFIG.pageHeight - CONFIG.margin;

            // Selecionar elementos de conteúdo
            const elements = contentDiv.querySelectorAll('h1, h2, h3, p, ul, ol');
            let isFirstElement = true;

            for (const element of elements) {
                const tagName = element.tagName.toLowerCase();
                let fontSize, font, color, spaceBefore, spaceAfter;

                // Definir estilos baseado no elemento
                switch (tagName) {
                    case 'h1':
                        fontSize = CONFIG.fontSize.h1;
                        font = helveticaBoldFont;
                        color = rgb(...CONFIG.colors.primary.map(c => c / 255));
                        spaceBefore = isFirstElement ? 0 : CONFIG.spacing.h1Before;
                        spaceAfter = CONFIG.spacing.h1After;
                        break;
                    case 'h2':
                        fontSize = CONFIG.fontSize.h2;
                        font = helveticaBoldFont;
                        color = rgb(...CONFIG.colors.headingDark.map(c => c / 255));
                        spaceBefore = isFirstElement ? 0 : CONFIG.spacing.h2Before;
                        spaceAfter = CONFIG.spacing.h2After;
                        break;
                    case 'h3':
                        fontSize = CONFIG.fontSize.h3;
                        font = helveticaBoldFont;
                        color = rgb(...CONFIG.colors.text.map(c => c / 255));
                        spaceBefore = isFirstElement ? 0 : CONFIG.spacing.h3Before;
                        spaceAfter = CONFIG.spacing.h3After;
                        break;
                    case 'ul':
                    case 'ol':
                        // Adicionar espaçamento antes da lista
                        yPosition -= isFirstElement ? 0 : CONFIG.spacing.listAfter;

                        // Verificar se precisa de nova página
                        if (yPosition < CONFIG.margin + 100) {
                            addPageNumber(page, helveticaFont, pdfDoc.getPageCount(), rgb);
                            page = pdfDoc.addPage([CONFIG.pageWidth, CONFIG.pageHeight]);
                            yPosition = CONFIG.pageHeight - CONFIG.margin;
                        }

                        const listResult = drawList(element, pdfDoc, page, helveticaFont, yPosition, rgb);
                        page = listResult.page;
                        yPosition = listResult.yPosition;
                        isFirstElement = false;
                        continue;
                    default:
                        fontSize = CONFIG.fontSize.body;
                        font = helveticaFont;
                        color = rgb(...CONFIG.colors.text.map(c => c / 255));
                        spaceBefore = 0;
                        spaceAfter = CONFIG.spacing.pAfter;
                }

                // Aplicar espaçamento antes
                yPosition -= spaceBefore;

                // Pegar e sanitizar texto
                const text = sanitizeTextForPDF(element.textContent.replace(/\s+/g, ' ').trim());
                if (!text) continue;

                // Quebrar texto em linhas
                const lines = wrapText(text, font, fontSize, CONFIG.pageWidth - 2 * CONFIG.margin);

                for (const line of lines) {
                    // Verificar se precisa de nova página
                    if (yPosition < CONFIG.margin + 50) {
                        addPageNumber(page, helveticaFont, pdfDoc.getPageCount(), rgb);
                        page = pdfDoc.addPage([CONFIG.pageWidth, CONFIG.pageHeight]);
                        yPosition = CONFIG.pageHeight - CONFIG.margin;
                    }

                    // Desenhar linha de texto
                    page.drawText(line, {
                        x: CONFIG.margin,
                        y: yPosition,
                        size: fontSize,
                        font: font,
                        color: color
                    });

                    yPosition -= CONFIG.lineHeight;
                }

                // Aplicar espaçamento depois
                yPosition -= spaceAfter;
                isFirstElement = false;
            }

            // Adicionar número na última página
            addPageNumber(page, helveticaFont, pdfDoc.getPageCount(), rgb);

            // ─────────────────────────────────────────────────────────
            // SALVAR E BAIXAR PDF
            // ─────────────────────────────────────────────────────────
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            // Nome do arquivo sanitizado
            const sanitizedTitle = lessonTitle
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

            a.href = url;
            a.download = `aula-${sanitizedTitle}-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Esconder loading e mostrar sucesso
            hideLoadingFeedback();
            showSuccessFeedback();

        } catch (error) {
            console.error('Erro ao gerar o PDF:', error);
            hideLoadingFeedback();
            alert('Ocorreu um erro ao gerar o PDF. Verifique o console.');
        }
    });

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

        // Adicionar animações CSS se ainda não existem
        if (!document.getElementById('pdfAnimations')) {
            const style = document.createElement('style');
            style.id = 'pdfAnimations';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    function hideLoadingFeedback() {
        const overlay = document.getElementById('pdfLoadingOverlay');
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => overlay.remove(), 300);
        }
    }

    function showSuccessFeedback() {
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
                    <div class="comment-toast-text" style="font-size: 13px; opacity: 0.7;">O download deve iniciar automaticamente</div>
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
});