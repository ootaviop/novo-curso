<!-- f562660e-0ca0-411a-bf57-a1dc6c3777f2 24526465-651b-42fa-98a2-e5bf2a657697 -->
# Sistema Orquestrador Desktop/Mobile - Arquitetura Moderna

## Visão Geral

Resolver o conflito de scripts/estilos desktop contaminando a experiência mobile através de uma arquitetura moderna baseada em ES6 Modules, Custom Events e carregamento condicional inteligente. Não cometa overenginiering!!!

---

## Fase 1: Diagnóstico Completo dos Conflitos

### 1.1 Mapear Scripts Desktop Problemáticos

**Arquivos a analisar:**

- `assets/js/cursor.js` - Sistema de cursor customizado (CRÍTICO - causa bug atual)
- `assets/js/minimap.js` - Minimapa de navegação
- `assets/js/rough.js` - Anotações visuais
- `assets/js/audio-player.js` - Player de áudio
- `assets/js/pdf-lib.js` - Geração de PDF
- `assets/js/braille-lib.js` - Conversão Braille
- `assets/js/drawSVG.js` - Animações SVG

**Verificar em cada um:**

- Executa automaticamente no `DOMContentLoaded`?
- Aplica estilos globais via JS?
- Tem guards de mobile existentes?
- Depende de elementos DOM que não existem no mobile?

### 1.2 Mapear CSS Desktop Problemático

**Arquivos críticos:**

- `assets/css/no-cursor.css` - Remove cursor nativo (CRÍTICO)
- `assets/css/cursor.css` - Estilos do cursor custom (CRÍTICO)
- `assets/css/minimap.css` - Estilos do minimap
- `assets/css/arrow.css` - Animações de setas
- `assets/css/audio-player.css` - Player de áudio

**Verificar:**

- Estilos globais que afetam mobile
- Media queries existentes mas ineficazes
- Regras com `!important` que sobrescrevem mobile

---

## Fase 2: Arquitetura do Sistema Orquestrador

### 2.1 Criar ExperienceRouter (ES6 Module)

**Arquivo:** `assets/js/core/experience-router.js`

**Responsabilidades:**

- Detectar tipo de dispositivo no carregamento inicial
- Disparar Custom Event `experience:ready` com tipo detectado
- Gerenciar carregamento dinâmico de scripts específicos
- Expor API limpa via `export` (sem variáveis globais)

**Estrutura:**

```javascript
// experience-router.js
export class ExperienceRouter {
  constructor() {
    this.breakpoint = 768;
    this.experienceType = this.detectExperience();
  }
  
  detectExperience() {
    return window.innerWidth <= this.breakpoint ? 'mobile' : 'desktop';
  }
  
  init() {
    this.hideInactiveExperience();
    this.loadExperienceAssets();
    this.dispatchReadyEvent();
    this.watchResize();
  }
  
  loadExperienceAssets() {
    if (this.experienceType === 'desktop') {
      this.loadDesktopScripts();
      this.loadDesktopStyles();
    } else {
      this.loadMobileScripts();
      this.loadMobileStyles();
    }
  }
  
  dispatchReadyEvent() {
    const event = new CustomEvent('experience:ready', {
      detail: { type: this.experienceType }
    });
    document.dispatchEvent(event);
  }
}

// Auto-init
const router = new ExperienceRouter();
router.init();
export default router;
```

### 2.2 Sistema de Custom Events

**Eventos a implementar:**

- `experience:ready` - Disparado quando experiência é detectada
- `experience:changed` - Disparado em resize que muda experiência
- `desktop:loaded` - Scripts desktop carregados
- `mobile:loaded` - Scripts mobile carregados

**Benefício:** Comunicação desacoplada entre módulos sem variáveis globais

---

## Fase 3: Refatoração de Scripts Desktop

### 3.1 Adicionar Guards em Scripts Existentes

**Padrão a aplicar em TODOS os scripts desktop:**

```javascript
// No início de cada script desktop
document.addEventListener('experience:ready', (e) => {
  if (e.detail.type !== 'desktop') return;
  
  // Código existente aqui
  initDesktopFeature();
});
```

**Aplicar em:**

- `cursor.js` ✅ PRIORIDADE 1 (resolve bug atual)
- `minimap.js`
- `rough.js`
- `audio-player.js`
- `drawSVG.js`

### 3.2 Script de Carregamento Dinâmico

**Arquivo:** `assets/js/core/script-loader.js`

```javascript
export class ScriptLoader {
  static async load(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  static async loadMultiple(scripts) {
    return Promise.all(scripts.map(src => this.load(src)));
  }
}
```

---

## Fase 4: Refatoração de CSS

### 4.1 Criar Bundles Condicionais

**Seguir padrão do `components.css` existente:**

**Arquivo:** `assets/css/desktop.bundle.css`

```css
/* Desktop Bundle - Carregado apenas no desktop */
@import url('./cursor.css');
@import url('./no-cursor.css');
@import url('./minimap.css');
@import url('./arrow.css');
@import url('./audio-player.css');
@import url('./hero.css');
/* ... outros estilos desktop */
```

**Arquivo:** `assets/css/mobile.bundle.css`

```css
/* Mobile Bundle - Carregado apenas no mobile */
@import url('./mobile/mobile-base.css');
@import url('./mobile/mobile-navigation.css');
@import url('./mobile/mobile-transitions.css');
@import url('./mobile/mode-selector.css');
/* ... outros estilos mobile */
```

### 4.2 Carregamento Condicional no HTML

**Modificar `index.html`:**

- Remover links diretos para estilos específicos
- Deixar apenas estilos compartilhados (variables.css, reset.css, typography.css)
- Bundles carregados dinamicamente pelo ExperienceRouter

---

## Fase 5: Refatoração de HTML Dinâmico

### 5.1 Mover Navegações para index.html

**Adicionar no `index.html` dentro de `.mobile-experience`:**

```html
<!-- MOBILE NAVIGATION - Agora em HTML -->
<nav class="mobile-navigation">
  <button class="mobile-nav-back">
    <span class="mobile-nav-back-icon">←</span>
    Voltar
  </button>
  <h1 class="mobile-nav-title">Selecionar Modo</h1>
  <div class="mobile-nav-actions">
    <button class="mobile-nav-action" data-action="settings">
      <span class="mobile-nav-action-icon">⚙️</span>
    </button>
  </div>
  <div class="mobile-mode-indicator" style="display: none;">
    <span class="mobile-mode-indicator-icon">📱</span>
    <span class="mobile-mode-indicator-text">Modo</span>
  </div>
</nav>

<!-- MOBILE BOTTOM NAV -->
<nav class="mobile-mode-nav">
  <div class="mobile-mode-nav-list">
    <div class="mobile-mode-nav-item" data-mode="podcast">
      <span class="mobile-mode-nav-item-icon">🎧</span>
      <span class="mobile-mode-nav-item-text">Podcast</span>
    </div>
    <div class="mobile-mode-nav-item" data-mode="texto">
      <span class="mobile-mode-nav-item-icon">📖</span>
      <span class="mobile-mode-nav-item-text">Texto</span>
    </div>
    <div class="mobile-mode-nav-item" data-mode="pdf">
      <span class="mobile-mode-nav-item-icon">📄</span>
      <span class="mobile-mode-nav-item-text">PDF</span>
    </div>
    <div class="mobile-mode-nav-item" data-mode="braille">
      <span class="mobile-mode-nav-item-icon">⠃⠗⠁</span>
      <span class="mobile-mode-nav-item-text">Braille</span>
    </div>
  </div>
</nav>
```

### 5.2 Simplificar mode-navigation.js

**Remover:**

- Métodos `createTopNavigation()` e `createBottomNavigation()`
- Lógica de `createElement` e `innerHTML`

**Manter apenas:**

- Manipulação de classes
- Event listeners
- Lógica de transições

---

## Fase 6: Atualização do index.html

### 6.1 Ordem de Carregamento Otimizada

```html
<head>
  <!-- 1. Estilos compartilhados (sempre carregam) -->
  <link rel="stylesheet" href="assets/css/variables.css" />
  <link rel="stylesheet" href="assets/css/reset.css" />
  <link rel="stylesheet" href="assets/css/typography.css" />
  
  <!-- 2. ExperienceRouter (PRIMEIRO script - tipo module) -->
  <script type="module" src="assets/js/core/experience-router.js"></script>
</head>

<body>
  <!-- Conteúdo HTML -->
  
  <!-- 3. Scripts compartilhados -->
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <!-- 4. Scripts específicos carregados dinamicamente pelo router -->
  <!-- Não mais carregados diretamente aqui -->
</body>
```

### 6.2 Remover Scripts Desktop do Carregamento Direto

**Remover do HTML (serão carregados pelo router):**

- `cursor.js`
- `minimap.js`
- `rough.js`
- `drawSVG.js`

---

## Fase 7: Correção do Bug Crítico (Cursor)

### 7.1 Fix Imediato em cursor.js

**Adicionar guard no início:**

```javascript
document.addEventListener('experience:ready', (e) => {
  if (e.detail.type !== 'desktop') {
    console.log('Cursor system disabled for mobile');
    return;
  }
  
  // Código existente do cursor
  document.addEventListener('DOMContentLoaded', () => {
    cursorSystem = new CursorSystem();
    window.cursorSystem = cursorSystem;
  });
});
```

### 7.2 Garantir CSS Isolado

**Modificar `no-cursor.css`:**

```css
/* Aplicar APENAS dentro de .desktop-experience */
.desktop-experience body,
.desktop-experience * {
  cursor: none !important;
}

/* Garantir que mobile sempre tem cursor */
.mobile-experience,
.mobile-experience * {
  cursor: auto !important;
}
```

---

## Checklist de Validação

### ✅ Desktop

- [ ] Cursor customizado funciona
- [ ] Minimap funciona
- [ ] Rough annotations funcionam
- [ ] Audio player funciona
- [ ] Nenhum CSS mobile interfere

### ✅ Mobile

- [ ] Cursor nativo visível em TODOS os elementos
- [ ] Navegação entre modos fluida
- [ ] Nenhum script desktop executa
- [ ] Performance mantida
- [ ] Gestos touch funcionam

### ✅ Transições

- [ ] Resize desktop→mobile funciona
- [ ] Resize mobile→desktop funciona
- [ ] Assets corretos carregados em cada modo

---

## Arquivos Afetados

### Novos Arquivos

- `assets/js/core/experience-router.js` (ES6 Module)
- `assets/js/core/script-loader.js` (ES6 Module)
- `assets/css/desktop.bundle.css`
- `assets/css/mobile.bundle.css`

### Arquivos Modificados

- `index.html` - ordem de carregamento + HTML das navegações mobile
- `assets/js/cursor.js` - adicionar guard
- `assets/js/minimap.js` - adicionar guard
- `assets/js/rough.js` - adicionar guard
- `assets/js/mobile/mode-navigation.js` - remover criação de HTML
- `assets/js/mobile/mobile-experience.js` - remover placeholder dinâmico
- `assets/css/no-cursor.css` - escopo para desktop only

### Arquivos Analisados (sem modificação)

- Todos os outros scripts desktop (para confirmar impacto)

### To-dos

- [ ] d
- [ ] Mapear todos os scripts desktop que executam automaticamente e identificar conflitos
- [ ] Mapear CSS desktop com regras globais que afetam mobile
- [ ] Criar ExperienceRouter como ES6 Module com detecção e Custom Events
- [ ] Criar ScriptLoader para carregamento dinâmico de scripts
- [ ] Criar desktop.bundle.css e mobile.bundle.css seguindo padrão components.css
- [ ] Adicionar guard em cursor.js e isolar no-cursor.css (BUG CRÍTICO)
- [ ] Adicionar guards experience:ready em todos os scripts desktop
- [ ] Mover HTML das navegações mobile de mode-navigation.js para index.html
- [ ] Simplificar mode-navigation.js removendo lógica de criação de HTML
- [ ] Atualizar index.html com nova ordem de carregamento e tipo module
- [ ] Validar que todas as funcionalidades desktop funcionam corretamente
- [ ] Validar que mobile está isolado e cursor nativo está visível
- [ ] Validar transições entre desktop e mobile no resize