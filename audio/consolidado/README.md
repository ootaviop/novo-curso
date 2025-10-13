# Áudios Consolidados

Este diretório contém os arquivos de áudio consolidados (áudios de todos os parágrafos unidos em um só arquivo) para o modo Podcast.

## Estrutura

- `aula-2-completo.mp3` - Áudio completo da aula "Liderança escolar eficaz é transformacional e compartilhada"

## Como gerar áudios consolidados

1. Use um software de edição de áudio (como Audacity, Adobe Audition, etc.)
2. Importe todos os arquivos de áudio individuais da aula (p1.mp3, p2.mp3, etc.)
3. Cole-os em sequência em uma única faixa
4. Adicione pequenas pausas entre os parágrafos se necessário (0.5-1 segundo)
5. Exporte como MP3 com qualidade 128kbps ou superior
6. Nomeie o arquivo seguindo o padrão: `[identificador-aula]-completo.mp3`

## Configuração

Os arquivos consolidados são configurados no arquivo `assets/js/audio-config.js` na seção `consolidated`.

## Notas

- O áudio consolidado deve ter duração total especificada em segundos no config
- Recomenda-se usar compressão para reduzir o tamanho do arquivo
- Para aulas longas, considere dividir em partes menores (ex: parte 1, parte 2)
