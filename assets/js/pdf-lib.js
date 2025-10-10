document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.querySelector('.pdf-trigger-btn');
    const contentDiv = document.getElementById('contentAula');

    // 1. DEFINIÇÃO DE ESTILOS (sem mudanças)
    const STYLES = {
        h1: { size: 24, weight: 'bold', color: PDFLib.rgb(0.15, 0.15, 0.15), spaceAfter: 15 },
        h2: { size: 20, weight: 'bold', color: PDFLib.rgb(0.2, 0.2, 0.2), spaceAfter: 12 },
        h3: { size: 16, weight: 'bold', color: PDFLib.rgb(0.25, 0.25, 0.25), spaceAfter: 10 },
        p:  { size: 12, weight: 'normal', color: PDFLib.rgb(0, 0, 0), spaceAfter: 10 },
        li: { size: 12, weight: 'normal', color: PDFLib.rgb(0, 0, 0), spaceAfter: 6 },
    };

    // Função auxiliar para quebrar texto (sem mudanças)
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

    // Função para desenhar listas (sem mudanças)
    function drawList(listElement, page, font, yPosition, margin, width, lineHeight) {
        const items = listElement.querySelectorAll(':scope > li');
        const isOrdered = listElement.tagName.toLowerCase() === 'ol';
        let itemNumber = 1;

        for (const item of items) {
            const text = item.textContent.replace(/\s+/g, ' ').trim();
            if (!text) continue;

            const prefix = isOrdered ? `${itemNumber++}. ` : '• ';
            const prefixWidth = font.widthOfTextAtSize(prefix, STYLES.li.size);
            const itemTextWidth = width - 2 * margin - prefixWidth;

            const lines = wrapText(text, font, STYLES.li.size, itemTextWidth);
            
            let currentY = yPosition;
            lines.forEach((line, index) => {
                if (currentY < margin + lineHeight) {
                    page = pdfDoc.addPage();
                    currentY = height - margin;
                }
                const x = index === 0 ? margin : margin + prefixWidth;
                const textToDraw = index === 0 ? `${prefix}${line}` : line;
                page.drawText(textToDraw, {
                    x: x,
                    y: currentY,
                    size: STYLES.li.size,
                    font: font,
                    color: STYLES.li.color,
                });
                currentY -= lineHeight;
            });
            yPosition = currentY - STYLES.li.spaceAfter;
        }
        return yPosition;
    }


    downloadBtn.addEventListener('click', async () => {
        try {
            const pdfDoc = await PDFLib.PDFDocument.create();
            const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            const helveticaBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
            
            let page = pdfDoc.addPage();
            const { width, height } = page.getSize();
            const margin = 50;
            let yPosition = height - margin;

            // 2. SELECIONAR APENAS OS ELEMENTOS DE BLOCO PRINCIPAIS
            // Esta é a mudança crucial. Não selecionamos elementos inline (a, code) aqui.
            const elements = contentDiv.querySelectorAll('h1, h2, h3, p, ul, ol');

            // 3. ITERAR E PROCESSAR CADA ELEMENTO DE BLOCO
            for (const element of elements) {
                // A verificação 'closest' foi removida, pois não é mais necessária.
                
                const tagName = element.tagName.toLowerCase();
                let style = STYLES.p; // Estilo padrão
                let font = helveticaFont;

                // 4. DEFINIR O ESTILO E A FONTE COM BASE NA TAG
                switch (tagName) {
                    case 'h1': style = STYLES.h1; font = helveticaBoldFont; break;
                    case 'h2': style = STYLES.h2; font = helveticaBoldFont; break;
                    case 'h3': style = STYLES.h3; font = helveticaBoldFont; break;
                    case 'ul':
                    case 'ol':
                        // Para listas, usamos a função auxiliar
                        yPosition = drawList(element, page, helveticaFont, yPosition, margin, width, STYLES.li.size * 1.5);
                        continue; // Pula para o próximo elemento do loop principal
                    case 'p':
                    default:
                        // Mantém o estilo padrão de parágrafo para <p> e qualquer outra tag não listada
                        style = STYLES.p;
                        font = helveticaFont;
                        break;
                }
                
                // Pega TODO o texto dentro do elemento, incluindo o de elementos filhos como <a> e <code>.
                // A estilização inline deles será perdida, mas o texto será mantido.
                const text = element.textContent.replace(/\s+/g, ' ').trim();
                if (!text) continue;

                const lines = wrapText(text, font, style.size, width - 2 * margin);

                for (const line of lines) {
                    if (yPosition < margin + style.size * 1.5) {
                        page = pdfDoc.addPage();
                        yPosition = height - margin;
                    }
                    page.drawText(line, {
                        x: margin,
                        y: yPosition,
                        size: style.size,
                        font: font,
                        color: style.color,
                    });
                    yPosition -= style.size * 1.5;
                }
                yPosition -= style.spaceAfter;
            }
            const title = document.querySelector('.lesson-title').textContent.replace(/\s+/g, ' ').trim();
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Erro ao gerar o PDF:', error);
            alert('Ocorreu um erro ao gerar o PDF. Verifique o console.');
        }
    });
});