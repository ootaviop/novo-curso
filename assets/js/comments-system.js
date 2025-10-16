/* ═══════════════════════════════════════════════════════════════
   💬 SISTEMA DE COMENTÁRIOS CONTEXTUAIS
   Permite aos usuários selecionar texto e adicionar comentários
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // 📦 CONFIGURAÇÃO E ESTADO
  // ─────────────────────────────────────────────────────────────
  const STORAGE_KEY = 'lesson_comments';

  const state = {
    comments: [],
    currentSelection: null,
    roughAnnotations: [],
    elements: {}
  };

  // ─────────────────────────────────────────────────────────────
  // 🎨 CRIAÇÃO DOS ELEMENTOS HTML
  // ─────────────────────────────────────────────────────────────
  function createHTMLElements() {
    // Tooltip de seleção "Adicionar comentário"
    const selectionTooltip = document.createElement('div');
    selectionTooltip.className = 'comment-selection-tooltip';
    selectionTooltip.innerHTML = `
      <i data-lucide="message-square-plus"></i>
      <span>Adicionar comentário</span>
    `;
    selectionTooltip.setAttribute('role', 'button');
    selectionTooltip.setAttribute('tabindex', '0');

    // Prevenir qualquer comportamento de link/navegação
    selectionTooltip.addEventListener('click', handleAddCommentClick, { capture: true });
    selectionTooltip.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, { capture: true });

    document.body.appendChild(selectionTooltip);

    // Box de edição de comentário
    const editBox = document.createElement('div');
    editBox.className = 'comment-edit-box';
    editBox.innerHTML = `
      <div class="comment-edit-header">Seu comentário</div>
      <div class="comment-selected-text" id="commentSelectedText"></div>
      <textarea
        class="comment-textarea"
        id="commentTextarea"
        placeholder="Digite seu comentário sobre este trecho..."
        maxlength="1000"
      ></textarea>
      <div class="comment-edit-actions">
        <button class="comment-btn comment-btn-cancel" id="commentBtnCancel">Cancelar</button>
        <button class="comment-btn comment-btn-save" id="commentBtnSave">Salvar</button>
      </div>
    `;
    document.body.appendChild(editBox);

    // Tooltip de visualização (hover)
    const viewTooltip = document.createElement('div');
    viewTooltip.className = 'comment-view-tooltip';
    viewTooltip.innerHTML = `
      <div class="comment-view-header">
        <i data-lucide="message-circle"></i>
        Seu comentário
      </div>
      <div class="comment-view-text" id="commentViewText"></div>
      <div class="comment-view-actions">
        <button class="comment-view-btn comment-view-btn-edit" id="commentViewEdit">
          <i data-lucide="edit-3"></i>
          Editar
        </button>
        <button class="comment-view-btn comment-view-btn-delete" id="commentViewDelete">
          <i data-lucide="trash-2"></i>
          Excluir
        </button>
      </div>
    `;
    document.body.appendChild(viewTooltip);

    // Armazenar referências
    state.elements = {
      selectionTooltip,
      editBox,
      viewTooltip,
      selectedText: document.getElementById('commentSelectedText'),
      textarea: document.getElementById('commentTextarea'),
      btnCancel: document.getElementById('commentBtnCancel'),
      btnSave: document.getElementById('commentBtnSave'),
      viewText: document.getElementById('commentViewText'),
      btnEdit: document.getElementById('commentViewEdit'),
      btnDelete: document.getElementById('commentViewDelete')
    };

    // Event listeners dos botões
    state.elements.btnCancel.addEventListener('click', hideEditBox);
    state.elements.btnSave.addEventListener('click', saveComment);
    state.elements.btnEdit.addEventListener('click', editComment);
    state.elements.btnDelete.addEventListener('click', deleteComment);

    // Validação do textarea
    state.elements.textarea.addEventListener('input', (e) => {
      state.elements.btnSave.disabled = e.target.value.trim().length === 0;
    });

    // Inicializar ícones Lucide
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 💾 GERENCIAMENTO DE DADOS (LocalStorage)
  // ─────────────────────────────────────────────────────────────
  function loadComments() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      state.comments = stored ? JSON.parse(stored) : [];

      console.log(`📂 Carregados ${state.comments.length} comentários`);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      state.comments = [];
    }
  }

  function saveCommentsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.comments));
    } catch (error) {
      console.error('Erro ao salvar comentários:', error);
    }
  }

  function generateCommentId() {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ─────────────────────────────────────────────────────────────
  // 🎯 SELEÇÃO DE TEXTO
  // ─────────────────────────────────────────────────────────────
  function handleTextSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // Se não há seleção válida, esconder tooltip
    if (!selectedText || selectedText.length < 3) {
      hideSelectionTooltip();
      return;
    }

    // Verificar se a seleção está dentro do conteúdo da aula
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const contentArea = container.nodeType === 3
      ? container.parentElement
      : container;

    // Só mostrar se estiver dentro de .contentAula
    if (!contentArea.closest('.contentAula')) {
      hideSelectionTooltip();
      return;
    }

    // Verificar se já existe comentário neste trecho
    const existingComment = state.comments.find(c => c.selectedText === selectedText);
    if (existingComment) {
      hideSelectionTooltip();
      return;
    }

    // Posicionar e mostrar tooltip
    showSelectionTooltip(range, selectedText);
  }

  function showSelectionTooltip(range, selectedText) {
    const rect = range.getBoundingClientRect();
    const tooltip = state.elements.selectionTooltip;

    tooltip.style.left = `${rect.left + (rect.width / 2) - 100}px`;
    tooltip.style.top = `${rect.top + window.scrollY - 45}px`;

    state.currentSelection = {
      range: range.cloneRange(),
      text: selectedText,
      rect
    };

    // Pequeno delay para evitar conflito com o click
    setTimeout(() => {
      tooltip.classList.add('visible');
    }, 10);
  }

  function hideSelectionTooltip() {
    state.elements.selectionTooltip.classList.remove('visible');
  }

  // ─────────────────────────────────────────────────────────────
  // ✏️ ADICIONAR/EDITAR COMENTÁRIO
  // ─────────────────────────────────────────────────────────────
  function handleAddCommentClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (!state.currentSelection) return;

    // Mostrar box de edição
    showEditBox(state.currentSelection);
    hideSelectionTooltip();

    return false;
  }

  function showEditBox(selection) {
    const { rect, text } = selection;
    const editBox = state.elements.editBox;

    // Preencher texto selecionado
    state.elements.selectedText.textContent = text;
    state.elements.textarea.value = '';
    state.elements.btnSave.disabled = true;

    // Calcular posição ideal
    const boxWidth = 340;
    const boxHeight = 300; // Altura aproximada do box

    // Posicionar ao lado direito da seleção primeiro
    let left = rect.right + window.scrollX + 20;
    let top = rect.top + window.scrollY;

    // Ajustar horizontalmente se sair da tela
    if (left + boxWidth > window.innerWidth + window.scrollX) {
      // Tentar colocar à esquerda
      left = rect.left + window.scrollX - boxWidth - 20;

      // Se ainda não couber, centralizar na viewport
      if (left < window.scrollX) {
        left = window.scrollX + (window.innerWidth - boxWidth) / 2;
      }
    }

    // Ajustar verticalmente para garantir visibilidade
    const viewportTop = window.scrollY;
    const viewportBottom = window.scrollY + window.innerHeight;

    // Se o box sair pela parte de baixo
    if (top + boxHeight > viewportBottom) {
      top = viewportBottom - boxHeight - 20;
    }

    // Se o box sair pela parte de cima
    if (top < viewportTop) {
      top = viewportTop + 20;
    }

    // Aplicar posição
    editBox.style.left = `${left}px`;
    editBox.style.top = `${top}px`;
    editBox.style.position = 'absolute';
    editBox.classList.add('visible');

    // Focar no textarea após um pequeno delay para garantir renderização
    setTimeout(() => {
      state.elements.textarea.focus();
    }, 100);
  }

  function hideEditBox() {
    state.elements.editBox.classList.remove('visible');
    state.elements.textarea.value = '';
    state.currentSelection = null;
    window.getSelection().removeAllRanges();
  }

  function saveComment() {
    const commentText = state.elements.textarea.value.trim();

    if (!commentText || !state.currentSelection) return;

    // Salvar Range ANTES de limpar state.currentSelection
    const range = state.currentSelection.range;

    // Salvar contexto para restauração
    const context = serializeRangeContext(range);

    const comment = {
      id: generateCommentId(),
      selectedText: state.currentSelection.text,
      commentText: commentText,
      timestamp: new Date().toISOString(),
      context: context // Contexto para restaurar após reload
    };

    console.log('💾 Salvando comentário:', {
      id: comment.id,
      texto: comment.selectedText.substring(0, 50) + '...'
    });

    state.comments.push(comment);
    saveCommentsToStorage();

    hideEditBox();

    // Aplicar highlight visual usando o Range salvo
    applyHighlightToComment(comment, range);

    // Feedback visual
    showSaveConfirmation();

    // Atualizar contador no botão de download
    updateDownloadButton();
  }

  function editComment() {
    const commentId = state.elements.viewTooltip.dataset.commentId;
    const comment = state.comments.find(c => c.id === commentId);

    if (!comment) return;

    hideViewTooltip();

    // Recriar seleção e mostrar box de edição
    state.currentSelection = {
      text: comment.selectedText,
      rect: state.elements.viewTooltip.getBoundingClientRect(),
      isEdit: true,
      editId: commentId
    };

    showEditBox(state.currentSelection);
    state.elements.textarea.value = comment.commentText;
    state.elements.btnSave.disabled = false;

    // Modificar comportamento do save para edição
    state.elements.btnSave.onclick = () => {
      comment.commentText = state.elements.textarea.value.trim();
      comment.timestamp = new Date().toISOString();
      saveCommentsToStorage();
      hideEditBox();
      showSaveConfirmation('Comentário atualizado!');

      // Restaurar comportamento normal
      state.elements.btnSave.onclick = saveComment;
    };
  }

  function deleteComment() {
    const commentId = state.elements.viewTooltip.dataset.commentId;
    const commentIndex = state.comments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) return;

    // Remover highlight visual
    const comment = state.comments[commentIndex];
    removeHighlightFromComment(comment);

    // Remover do array
    state.comments.splice(commentIndex, 1);
    saveCommentsToStorage();

    hideViewTooltip();
    updateDownloadButton();

    showSaveConfirmation('Comentário excluído!');
  }

  // ─────────────────────────────────────────────────────────────
  // 🎨 APLICAÇÃO DE HIGHLIGHT - VERSÃO SIMPLES E ROBUSTA
  // ─────────────────────────────────────────────────────────────

  /**
   * Aplica highlight visual a um comentário
   * @param {Object} comment - Objeto do comentário
   * @param {Range} range - Range da seleção (opcional, usado ao criar novo)
   */
  function applyHighlightToComment(comment, range = null) {
    try {
      // Verificar se já foi aplicado (buscar por ID)
      const existing = document.getElementById(comment.id);
      if (existing) {
        console.log(`✅ Comentário ${comment.id} já tem highlight`);
        applyRoughNotation(existing, comment);
        return true;
      }

      // Se não temos Range, não podemos aplicar (apenas na restauração)
      if (!range) {
        console.warn(`⚠️ Comentário ${comment.id} não tem Range e wrapper não existe`);
        return false;
      }

      console.log(`🎯 Aplicando highlight: "${comment.selectedText.substring(0, 40)}..."`);

      // Criar wrapper com ID único
      const wrapper = createHighlightWrapper(comment.id);

      // Envolver o Range com o wrapper
      try {
        range.surroundContents(wrapper);
        console.log('✅ Range envolvido com surroundContents');
      } catch (error) {
        // Se surroundContents falhar (texto entre tags), usar método que preserva parciais
        console.warn('⚠️ Range cruza múltiplas tags, usando método alternativo');

        const success = wrapRangePreservingPartialText(range, wrapper);

        if (!success) {
          console.error('❌ Não foi possível envolver range com método alternativo');
          return false;
        }
      }

      // Aplicar Rough Notation
      applyRoughNotation(wrapper, comment);

      console.log(`✅ Highlight aplicado com sucesso para: "${comment.selectedText.substring(0, 40)}..."`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao aplicar highlight:', error);
      return false;
    }
  }

  /**
   * Cria elemento wrapper para o highlight com ID único
   */
  function createHighlightWrapper(commentId) {
    const wrapper = document.createElement('span');
    wrapper.id = commentId; // ← ID ÚNICO para busca O(1)
    wrapper.className = 'commented-text';
    wrapper.dataset.commentId = commentId;
    wrapper.setAttribute('data-has-comment', 'true');
    wrapper.style.display = 'inline';
    return wrapper;
  }

  /**
   * Envolve um Range que cruza múltiplos elementos, preservando texto parcial
   * Esta função divide text nodes para envolver apenas a parte selecionada
   */
  function wrapRangePreservingPartialText(range, wrapper) {
    try {
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      console.log(`🔧 wrapRangePreservingPartialText:`, {
        start: startContainer.nodeName,
        startOffset,
        end: endContainer.nodeName,
        endOffset
      });

      // Caso 1: Mesmo text node (mais simples)
      if (startContainer === endContainer && startContainer.nodeType === Node.TEXT_NODE) {
        console.log('📌 Caso 1: Mesmo text node');

        const text = startContainer.textContent;
        const before = text.substring(0, startOffset);
        const selected = text.substring(startOffset, endOffset);
        const after = text.substring(endOffset);

        // Criar novos text nodes
        const beforeNode = before ? document.createTextNode(before) : null;
        const selectedNode = document.createTextNode(selected);
        const afterNode = after ? document.createTextNode(after) : null;

        // Substituir node original
        const parent = startContainer.parentNode;

        if (beforeNode) parent.insertBefore(beforeNode, startContainer);
        wrapper.appendChild(selectedNode);
        parent.insertBefore(wrapper, startContainer);
        if (afterNode) parent.insertBefore(afterNode, startContainer);
        parent.removeChild(startContainer);

        return true;
      }

      // Caso 2: Range cruza múltiplos nodes (mais complexo)
      console.log('📌 Caso 2: Range cruza múltiplos nodes');

      // Dividir start node
      if (startContainer.nodeType === Node.TEXT_NODE && startOffset > 0) {
        const text = startContainer.textContent;
        const before = text.substring(0, startOffset);
        const selected = text.substring(startOffset);

        const beforeNode = document.createTextNode(before);
        const selectedNode = document.createTextNode(selected);

        const parent = startContainer.parentNode;
        parent.insertBefore(beforeNode, startContainer);
        parent.replaceChild(selectedNode, startContainer);

        // Atualizar range
        range.setStart(selectedNode, 0);
      }

      // Dividir end node
      if (endContainer.nodeType === Node.TEXT_NODE && endOffset < endContainer.textContent.length) {
        const text = endContainer.textContent;
        const selected = text.substring(0, endOffset);
        const after = text.substring(endOffset);

        const selectedNode = document.createTextNode(selected);
        const afterNode = document.createTextNode(after);

        const parent = endContainer.parentNode;
        parent.insertBefore(selectedNode, endContainer);
        parent.replaceChild(afterNode, endContainer);

        // Atualizar range
        range.setEnd(selectedNode, selectedNode.textContent.length);
      }

      // Agora extrair e inserir wrapper
      const fragment = range.extractContents();
      wrapper.appendChild(fragment);
      range.insertNode(wrapper);

      console.log('✅ Range envolvido preservando texto parcial');
      return true;

    } catch (error) {
      console.error('❌ Erro em wrapRangePreservingPartialText:', error);
      return false;
    }
  }

  function applyRoughNotation(wrapper, comment) {
    // Aplicar Rough Notation (círculo)
    if (typeof RoughNotation !== 'undefined') {
      const annotation = RoughNotation.annotate(wrapper, {
        type: 'highlight',
        color: 'var(--rough-notation-soft-orange)',
        strokeWidth: 2,
        padding: 8,
        animationDuration: 800,
        multiline: true,
      });

      annotation.show();
      state.roughAnnotations.push({ id: comment.id, annotation, element: wrapper });
    }

    // Adicionar eventos de hover
    wrapper.addEventListener('mouseenter', (e) => showViewTooltip(e, comment));
    wrapper.addEventListener('mouseleave', hideViewTooltip);
  }

  function removeHighlightFromComment(comment) {
    const annotation = state.roughAnnotations.find(a => a.id === comment.id);

    if (annotation) {
      // Remover anotação Rough Notation
      annotation.annotation.remove();

      // Remover wrapper span
      const wrapper = annotation.element;
      if (wrapper && wrapper.parentNode) {
        const text = document.createTextNode(wrapper.textContent);
        wrapper.parentNode.replaceChild(text, wrapper);
      }

      // Remover do array
      state.roughAnnotations = state.roughAnnotations.filter(a => a.id !== comment.id);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 🔄 SERIALIZAÇÃO E RESTAURAÇÃO DE RANGE
  // ─────────────────────────────────────────────────────────────

  function serializeRangeContext(range) {
    // Encontrar parágrafo contendo a seleção
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }

    const paragraph = container.closest('p, h1, h2, h3, h4, h5, h6, li, div.contentAula');
    if (!paragraph) return null;

    // Pegar todos os parágrafos da aula
    const contentAula = document.querySelector('.contentAula');
    const allParagraphs = Array.from(contentAula.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li'));
    const paragraphIndex = allParagraphs.indexOf(paragraph);

    // Calcular offset de caracteres dentro do parágrafo
    const textContent = paragraph.textContent;
    const rangeText = range.toString();
    const startOffset = textContent.indexOf(rangeText);

    return {
      paragraphIndex: paragraphIndex,
      startOffset: startOffset,
      length: rangeText.length,
      textContent: textContent.substring(0, 50) // Validação
    };
  }

  function deserializeRangeContext(context) {
    if (!context) {
      console.warn('⚠️ Contexto é null');
      return null;
    }

    console.log('🔍 Deserializando contexto:', context);

    const contentAula = document.querySelector('.contentAula');
    if (!contentAula) {
      console.error('❌ .contentAula não encontrado!');
      return null;
    }

    const allParagraphs = Array.from(contentAula.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li'));
    console.log(`📊 Total de parágrafos encontrados: ${allParagraphs.length}`);
    console.log(`📍 Buscando parágrafo índice: ${context.paragraphIndex}`);

    const paragraph = allParagraphs[context.paragraphIndex];

    if (!paragraph) {
      console.error(`❌ Parágrafo ${context.paragraphIndex} não encontrado (total: ${allParagraphs.length})`);
      return null;
    }

    console.log('✅ Parágrafo encontrado:', paragraph.textContent.substring(0, 50));

    // Criar TreeWalker para percorrer text nodes
    const walker = document.createTreeWalker(
      paragraph,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentOffset = 0;
    let startNode = null;
    let startNodeOffset = 0;
    let endNode = null;
    let endNodeOffset = 0;

    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      const textLength = textNode.textContent.length;

      // Início do range
      if (!startNode && currentOffset + textLength > context.startOffset) {
        startNode = textNode;
        startNodeOffset = context.startOffset - currentOffset;
      }

      // Fim do range
      if (!endNode && currentOffset + textLength >= context.startOffset + context.length) {
        endNode = textNode;
        endNodeOffset = (context.startOffset + context.length) - currentOffset;
        break;
      }

      currentOffset += textLength;
    }

    if (!startNode || !endNode) {
      console.error('❌ Text nodes não encontrados');
      console.log(`   currentOffset final: ${currentOffset}`);
      console.log(`   startOffset procurado: ${context.startOffset}`);
      console.log(`   length procurado: ${context.length}`);
      return null;
    }

    // Criar Range
    const range = document.createRange();
    range.setStart(startNode, startNodeOffset);
    range.setEnd(endNode, endNodeOffset);

    console.log(`✅ Range criado: "${range.toString().substring(0, 40)}..."`);
    return range;
  }

  function restoreAllHighlights() {
    console.log(`🔄 Restaurando ${state.comments.length} highlights...`);

    let successCount = 0;
    let failCount = 0;

    state.comments.forEach(comment => {
      // Primeiro: tentar buscar wrapper pelo ID (se já existe)
      const wrapper = document.getElementById(comment.id);

      if (wrapper) {
        console.log(`✅ Wrapper já existe: ${comment.id}`);
        applyRoughNotation(wrapper, comment);
        successCount++;
        return;
      }

      // Segundo: tentar recriar usando contexto
      if (comment.context) {
        console.log(`🔄 Tentando restaurar: ${comment.id}`);
        const range = deserializeRangeContext(comment.context);

        if (range) {
          // Normalizar textos (remover quebras de linha e espaços extras)
          const normalizeText = (text) => text.replace(/\s+/g, ' ').trim();

          const rangeText = normalizeText(range.toString());
          const expectedText = normalizeText(comment.selectedText);

          console.log(`📝 Texto do Range: "${rangeText.substring(0, 40)}..."`);
          console.log(`📝 Texto esperado: "${expectedText.substring(0, 40)}..."`);
          console.log(`🔍 Textos são iguais? ${rangeText === expectedText}`);

          if (rangeText === expectedText) {
            console.log(`✅ Range restaurado com sucesso: ${comment.id}`);
            applyHighlightToComment(comment, range);
            successCount++;
          } else {
            console.warn(`⚠️ Texto do Range não bate: ${comment.id}`);
            console.warn(`   Esperado (${expectedText.length} chars): "${expectedText}"`);
            console.warn(`   Obtido (${rangeText.length} chars): "${rangeText}"`);
            failCount++;
          }
        } else {
          console.error(`❌ deserializeRangeContext retornou null: ${comment.id}`);
          failCount++;
        }
      } else {
        console.warn(`⚠️ Comentário sem contexto: ${comment.id}`);
        failCount++;
      }
    });

    console.log(`✅ Highlights restaurados: ${successCount} sucesso, ${failCount} falhas`);
  }

  // ─────────────────────────────────────────────────────────────
  // 💭 TOOLTIP DE VISUALIZAÇÃO (hover)
  // ─────────────────────────────────────────────────────────────
  let hideTooltipTimeout = null;
  let currentTooltipElement = null;

  function showViewTooltip(event, comment) {
    // Cancelar qualquer timeout de esconder tooltip
    if (hideTooltipTimeout) {
      clearTimeout(hideTooltipTimeout);
      hideTooltipTimeout = null;
    }

    const tooltip = state.elements.viewTooltip;
    const rect = event.target.getBoundingClientRect();

    state.elements.viewText.textContent = comment.commentText;
    tooltip.dataset.commentId = comment.id;

    // Armazenar elemento atual
    currentTooltipElement = event.target;

    // Posicionar abaixo do texto
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;

    tooltip.classList.add('visible');
  }

  function hideViewTooltip() {
    // Delay para permitir mover mouse para a tooltip
    hideTooltipTimeout = setTimeout(() => {
      state.elements.viewTooltip.classList.remove('visible');
      currentTooltipElement = null;
    }, 300);
  }

  function setupTooltipInteractivity() {
    const tooltip = state.elements.viewTooltip;

    // Quando mouse entra na tooltip, cancelar esconder
    tooltip.addEventListener('mouseenter', () => {
      if (hideTooltipTimeout) {
        clearTimeout(hideTooltipTimeout);
        hideTooltipTimeout = null;
      }
    });

    // Quando mouse sai da tooltip, esconder
    tooltip.addEventListener('mouseleave', () => {
      hideViewTooltip();
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 🛠️ UTILITÁRIOS
  // ─────────────────────────────────────────────────────────────

  function showSaveConfirmation(message = 'Comentário salvo!') {
    // Criar notificação toast moderna
    const toast = document.createElement('div');
    toast.className = 'comment-toast';

    // Determinar ícone baseado na mensagem
    let iconName = 'check-circle';
    let iconColor = '#10b981'; // green-500

    if (message.includes('excluído') || message.includes('Excluído')) {
      iconName = 'trash-2';
      iconColor = '#ef4444'; // red-500
    } else if (message.includes('atualizado') || message.includes('Atualizado')) {
      iconName = 'edit-3';
      iconColor = '#3b82f6'; // blue-500
    }

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <i data-lucide="${iconName}" style="width: 20px; height: 20px; color: ${iconColor}; stroke-width: 2.5;"></i>
        <span style="font-size: 14px; font-weight: 500; color: #1e293b;">${message}</span>
      </div>
    `;

    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: white;
      padding: 14px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
      z-index: 10003;
      font-family: 'Red Hat Display', sans-serif;
      border: 1px solid rgba(0, 0, 0, 0.06);
      backdrop-filter: blur(10px);
      opacity: 0;
      transform: translateX(100px);
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    document.body.appendChild(toast);

    // Inicializar ícone Lucide
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Animar entrada
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    // Remover após delay
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100px)';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  function updateDownloadButton() {
    const btn = document.getElementById('downloadCommentsBtn');
    if (btn) {
      const count = state.comments.length;
      const countSpan = btn.querySelector('.download-comments-count');

      btn.disabled = count === 0;

      if (countSpan) {
        countSpan.textContent = count;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 🎬 INICIALIZAÇÃO
  // ─────────────────────────────────────────────────────────────
  function init() {
    // Criar elementos HTML
    createHTMLElements();

    // Configurar interatividade da tooltip
    setupTooltipInteractivity();

    // Carregar comentários salvos
    loadComments();

    // Restaurar highlights visuais
    setTimeout(() => {
      restoreAllHighlights();
      updateDownloadButton();
    }, 1000);

    // Event listener para seleção de texto
    document.addEventListener('mouseup', (e) => {
      // Delay para capturar seleção corretamente
      setTimeout(() => handleTextSelection(), 10);
    });

    // Esconder tooltips ao clicar fora
    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.comment-selection-tooltip') &&
          !e.target.closest('.comment-edit-box') &&
          !e.target.closest('.comment-view-tooltip')) {
        hideSelectionTooltip();
        if (!state.currentSelection?.isEdit) {
          hideEditBox();
        }
      }
    });

    // Esconder tooltip de seleção ao começar nova seleção
    document.addEventListener('selectstart', () => {
      hideSelectionTooltip();
    });

    console.log('✅ Sistema de comentários inicializado');
  }

  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expor funções públicas
  window.CommentsSystem = {
    getComments: () => state.comments,
    exportComments: () => state.comments,
    clearAll: () => {
      if (confirm('Deseja realmente excluir TODOS os comentários?')) {
        state.roughAnnotations.forEach(a => a.annotation.remove());
        state.roughAnnotations = [];
        state.comments = [];
        saveCommentsToStorage();
        updateDownloadButton();
        showSaveConfirmation('Todos os comentários foram excluídos');
      }
    }
  };

})();
