document.addEventListener("DOMContentLoaded", () => {
  // 1. Seleciona TODOS os contêineres de callout na página
  // O seletor [class^="callout-"] pega qualquer elemento cuja classe comece com "callout-"
  // Inclui também os botões do topo da página
  const allCallouts = document.querySelectorAll(
    '[class^="callout-"], .nav-item, .audio-trigger-btn, .pdf-trigger-btn, .braille-trigger-btn, .lesson-meta'
  );
  console.log(allCallouts);

  // 2. Itera sobre cada callout encontrado
  allCallouts.forEach((callout) => {
    // 3. Dentro de cada callout, encontra o ícone e seus caminhos
    // Para callouts normais, procura por .icon
    // Para botões do topo, procura diretamente pelo SVG
    let icon = callout.querySelector(".icon");
    if (!icon) {
      // Se não encontrar .icon, procura diretamente pelo SVG (caso dos botões do topo)
      icon = callout.querySelector("svg");
    }
    if (!icon) return; // Se não houver ícone, pula para o próximo callout
    const paths = icon.querySelectorAll("path, polyline, line, circle");

    // 4. Se houver caminhos para animar...
    if (paths.length > 0) {
      // Cria a animação para este ícone específico, mas a deixa pausada
      const animation = anime({
        targets: paths,
        strokeDashoffset: [anime.setDashoffset, 0],
        duration: 1200,
        easing: "easeInOutQuad",
        autoplay: false,
        delay: (el, i) => i * 100, // Adiciona um pequeno delay entre elementos
      });

      // Cria um observador para ESTE callout específico
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Adiciona classe para mostrar o SVG
              callout.classList.add('svg-ready');
              // Inicia a animação após um pequeno delay para garantir que o SVG está visível
              setTimeout(() => {
                animation.play(); // Inicia a animação deste callout
              }, 100);
              observer.unobserve(entry.target); // Para de observar
            }
          });
        },
        {
          threshold: 0.1, // Reduzido para garantir que os botões do topo sejam detectados
        }
      );

      // Começa a observar o contêiner do callout
      observer.observe(callout);
    }
  });
});
