document.addEventListener('DOMContentLoaded', () => {
    const brailleBtn = document.querySelector('.braille-trigger-btn');
    const contentDiv = document.getElementById('contentAula');

    // Configuração da biblioteca liblouis
    let liblouisReady = false;

    // Função para inicializar a biblioteca liblouis
    function initializeLiblouis() {
        try {
            if (typeof liblouis !== 'undefined') {
                // Configurar carregamento sob demanda das tabelas
                liblouis.enableOnDemandTableLoading('https://cdn.jsdelivr.net/npm/liblouis-build/tables/');
                liblouisReady = true;
                console.log('Biblioteca liblouis inicializada com sucesso');
            } else {
                console.error('Biblioteca liblouis não encontrada');
            }
        } catch (error) {
            console.error('Erro ao inicializar liblouis:', error);
        }
    }

    // Função para extrair conteúdo da aula
    function extractLessonContent() {
        const elements = contentDiv.querySelectorAll('h1, h2, h3, p');
        const content = [];

        for (const element of elements) {
            const tagName = element.tagName.toLowerCase();
            const text = element.textContent.replace(/\s+/g, ' ').trim();
            
            if (!text) continue;

            let formattedText = '';
            
            // Aplicar marcadores para diferenciar níveis de texto
            switch (tagName) {
                case 'h1':
                    formattedText = `===== ${text} =====`;
                    break;
                case 'h2':
                    formattedText = `--- ${text} ---`;
                    break;
                case 'h3':
                    formattedText = `-- ${text} --`;
                    break;
                case 'p':
                default:
                    formattedText = text;
                    break;
            }

            content.push(formattedText);
        }

        return content.join('\n\n');
    }

    // Função para converter texto para Braille
    function convertToBraille(text) {
        try {
            if (!liblouisReady) {
                throw new Error('Biblioteca liblouis não está pronta');
            }

            // Usar tabela para português brasileiro, grau 1
            const table = 'pt-br-g1.ctb';
            
            // Verificar se a tabela está disponível
            if (!liblouis.checkTable(table)) {
                console.warn(`Tabela ${table} não encontrada, usando fallback`);
                // Fallback: conversão básica usando Unicode Braille
                return convertToBrailleFallback(text);
            }

            // Converter usando liblouis
            const result = liblouis.lou_translateString(table, text, text.length, []);
            return result.translated;

        } catch (error) {
            console.error('Erro na conversão liblouis:', error);
            // Fallback para conversão básica
            return convertToBrailleFallback(text);
        }
    }

    // Função fallback para conversão básica
    function convertToBrailleFallback(text) {
        // Mapeamento básico ASCII para Unicode Braille
        const brailleMap = {
            'A': '⠁', 'B': '⠃', 'C': '⠉', 'D': '⠙', 'E': '⠑', 'F': '⠋',
            'G': '⠛', 'H': '⠓', 'I': '⠊', 'J': '⠚', 'K': '⠅', 'L': '⠇',
            'M': '⠍', 'N': '⠝', 'O': '⠕', 'P': '⠏', 'Q': '⠟', 'R': '⠗',
            'S': '⠎', 'T': '⠞', 'U': '⠥', 'V': '⠧', 'W': '⠺', 'X': '⠭',
            'Y': '⠽', 'Z': '⠵',
            'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋',
            'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚', 'k': '⠅', 'l': '⠇',
            'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗',
            's': '⠎', 't': '⠞', 'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭',
            'y': '⠽', 'z': '⠵',
            ' ': '⠀', '!': '⠖', '?': '⠦', '.': '⠲', ',': '⠂', ';': '⠆',
            ':': '⠒', '-': '⠤', '(': '⠶', ')': '⠶', '"': '⠦', "'": '⠦'
        };

        return text.split('').map(char => brailleMap[char] || char).join('');
    }

    // Função para baixar arquivo BRF
    function downloadBrailleFile(content, filename) {
        try {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.brf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('Arquivo Braille baixado com sucesso');
        } catch (error) {
            console.error('Erro ao baixar arquivo Braille:', error);
            alert('Erro ao gerar arquivo Braille. Verifique o console.');
        }
    }

    // Event listener para o botão Braille
    brailleBtn.addEventListener('click', async () => {
        // Capturar o HTML original ANTES de qualquer modificação
        const originalHTML = brailleBtn.innerHTML;
        
        try {
            // Mostrar loading
            brailleBtn.disabled = true;
            brailleBtn.innerHTML = '<span>Gerando...</span>';

            // Extrair conteúdo da aula
            const lessonContent = extractLessonContent();
            
            if (!lessonContent.trim()) {
                throw new Error('Nenhum conteúdo encontrado para converter');
            }

            // Aguardar um pouco para garantir que a biblioteca esteja carregada
            if (!liblouisReady) {
                initializeLiblouis();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Converter para Braille
            const brailleContent = convertToBraille(lessonContent);
            
            // Obter título da aula para nome do arquivo
            const title = document.querySelector('.lesson-title').textContent.replace(/\s+/g, ' ').trim();
            const filename = title || 'aula-braille';
            
            // Baixar arquivo
            downloadBrailleFile(brailleContent, filename);

        } catch (error) {
            console.error('Erro ao processar Braille:', error);
            alert('Erro ao gerar arquivo Braille. Verifique o console.');
        } finally {
            // Restaurar botão - sempre executar
            brailleBtn.disabled = false;
            brailleBtn.innerHTML = originalHTML;
        }
    });

    // Inicializar liblouis quando a página carregar
    initializeLiblouis();
});
