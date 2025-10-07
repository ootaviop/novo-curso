setTimeout(() => { 
    (function() {
    'use strict';

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || 
                    window.innerWidth < 768;
    
    if (isMobile) {
    document.body.style.cursor = 'auto';
    return;
    }

    const cursor = document.getElementById('cursor');
    if (!cursor) return;

    // Estado
    const position = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let currentScale = 1;
    let targetScale = 1;
    let rafId = null;
    let currentMorphTarget = null;
    let isMorphed = false;

    function lerp(start, end, factor) {
    return start + (end - start) * factor;
    }

    function handleMouseMove(e) {
    if (!isMorphed) {
        target.x = e.clientX;
        target.y = e.clientY;
    }
    }

    /**
     * Morph para elemento - VERSÃO OUTLINE
     * 
     * Mudanças críticas vs versão anterior:
     * 1. NÃO adiciona background sólido
     * 2. Cursor vira BORDA ao redor do elemento
     * 3. Adiciona padding na expansão para border ficar visível
     * 
     * Por que funciona?
     * - background: transparent = conteúdo visível
     * - border: 3px solid = contorno claro
     * - Dimensões INCLUEM a borda (ajuste necessário)
     */
    function morphToElement(element) {
    if (!element) return;
    
    currentMorphTarget = element;
    isMorphed = true;
    
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    const borderRadius = computedStyle.borderRadius || '12px';
    
    // Força cursor para o centro do elemento
    target.x = rect.left + (rect.width / 2);
    target.y = rect.top + (rect.height / 2);
    
    /**
     * IMPORTANTE: Adicionamos 6px (3px de cada lado)
     * Por que?
     * - Cursor tem border: 3px
     * - Queremos que a BORDA envolva o elemento
     * - Se usarmos width exato, borda fica cortada
     */
    const borderWidth = 2;
    const offset = borderWidth * 2;
    
    cursor.style.width = `${rect.width + offset}px`;
    cursor.style.height = `${rect.height + offset}px`;
    cursor.style.borderRadius = borderRadius;
    cursor.classList.add('morphed');
    }

    /**
     * Reset cursor para estado bolinha
     */
    function resetCursor() {
    currentMorphTarget = null;
    isMorphed = false;
    
    cursor.style.width = '35px';
    cursor.style.height = '35px';
    cursor.style.borderRadius = '50%';
    cursor.classList.remove('morphed');
    }

    /**
     * Setup elementos morphable
     */
    function setupMorphableElements() {
    const morphables = document.querySelectorAll('.morphable');
    
    morphables.forEach(element => {
        element.addEventListener('mouseenter', () => {
        morphToElement(element);
        });
        
        element.addEventListener('mouseleave', () => {
        resetCursor();
        });
    });
    }

    /**
     * Loop de animação
     */
    function animate() {
    // Se em morph, recalcula posição do elemento (importante para scroll)
    if (currentMorphTarget) {
        const rect = currentMorphTarget.getBoundingClientRect();
        target.x = rect.left + (rect.width / 2);
        target.y = rect.top + (rect.height / 2);
    }
    
    // Interpola posição
    const lerpFactor = isMorphed ? 0.2 : 0.15;
    position.x = lerp(position.x, target.x, lerpFactor);
    position.y = lerp(position.y, target.y, lerpFactor);

    // Interpola scale (transição suave)
    currentScale = lerp(currentScale, targetScale, 0.2);

    /**
     * Aplica transform combinado
     * - translate(x, y): posição absoluta
     * - translate(-50%, -50%): centraliza no ponto
     * - scale(): expande durante o click
     * 
     * CRÍTICO: Incluímos o scale no transform inline porque
     * o requestAnimationFrame sobrescreve qualquer CSS.
     * A interpolação garante transição suave.
     */
    cursor.style.transform = `translate(${position.x}px, ${position.y}px) translate(-50%, -50%) scale(${currentScale})`;

    rafId = requestAnimationFrame(animate);
    }

    /**
     * Left-click effect
     * NÃO previne comportamento padrão para permitir seleção de texto
     */
    function handleLeftClick() {
    // Define scale alvo
    targetScale = 1.5;
    // Adiciona classe de efeito (para opacity)
    cursor.classList.add('cursor-click-active');
    }

    function handleLeftClickRelease() {
    // Restaura scale
    targetScale = 1.0;
    // Remove classe de efeito
    cursor.classList.remove('cursor-click-active');
    }

    // Inicialização
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', (e) => {
    if ((e.button === 0) && !isMorphed) { // Botão esquerdo
        handleLeftClick();
    }
    });
    window.addEventListener('mouseup', (e) => {
    if ((e.button === 0) && !isMorphed) { // Botão esquerdo
        handleLeftClickRelease();
    }
    });
    
    setupMorphableElements();
    rafId = requestAnimationFrame(animate);

    // Cleanup
    window.addEventListener('beforeunload', () => {
    window.removeEventListener('mousemove', handleMouseMove);
    if (rafId) cancelAnimationFrame(rafId);
    });
})();
 }, 100)