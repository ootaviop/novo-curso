document.addEventListener("DOMContentLoaded", () => {
  // 1. Seleciona TODOS os contêineres de callout na página
  // O seletor [class^="callout-"] pega qualquer elemento cuja classe comece com "callout-"
  const allCallouts = document.querySelectorAll(
    '[class^="callout-"], .nav-item'
  );
  console.log(allCallouts);

  // 2. Itera sobre cada callout encontrado
  allCallouts.forEach((callout) => {
    // 3. Dentro de cada callout, encontra o ícone e seus caminhos
    const icon = callout.querySelector(".icon");
    if (!icon) return; // Se não houver ícone, pula para o próximo callout
    const paths = icon.querySelectorAll("path, polyline, line");

    // 4. Se houver caminhos para animar...
    if (paths.length > 0) {
      // Cria a animação para este ícone específico, mas a deixa pausada
      const animation = anime({
        targets: paths,
        strokeDashoffset: [anime.setDashoffset, 0],
        duration: 1000,
        easing: "easeInOutQuad",
        autoplay: false,
      });

      // Cria um observador para ESTE callout específico
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animation.play(); // Inicia a animação deste callout
              observer.unobserve(entry.target); // Para de observar
            }
          });
        },
        {
          threshold: 0.5,
        }
      );

      // Começa a observar o contêiner do callout
      observer.observe(callout);
    }
  });
});
