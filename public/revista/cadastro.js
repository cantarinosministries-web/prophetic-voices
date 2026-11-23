/* The Prophetic Voices — aviso de cadastro gratuito para ler e baixar o artigo (só aparece para quem não entrou) */
(function () {
  var gate = document.getElementById('gate');
  if (!gate || !window.PV_LOGIN) return;
  var L = window.PV_LOGIN, alvo = document.getElementById('gateBotoes');
  var volta = gate.getAttribute('data-volta') || location.pathname + '#leitor';
  function desenhar() {
    L.sessao().then(function (s) {
      if (s && s.provedores && s.provedores.length) alvo.innerHTML = L.botoes(s.provedores, { volta: volta });
    });
  }
  desenhar();
  window.addEventListener('pv:lang', function () { setTimeout(desenhar, 0); });
  // "Baixar PDF" e "Ler online" levam ao aviso e o destacam
  document.querySelectorAll('[data-cadastro], a[href="#leitor"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
      gate.classList.remove('gate-pulse'); void gate.offsetWidth; gate.classList.add('gate-pulse');
    });
  });
  if (location.hash === '#leitor') setTimeout(function () { gate.classList.add('gate-pulse'); }, 400);
})();
