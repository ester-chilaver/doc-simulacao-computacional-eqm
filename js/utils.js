/* ══════════════════════════════════════════
   UTILS.JS — Shared Utilities
   Neurociência Computacional
   ══════════════════════════════════════════ */

// ── Progress Bar ──
(function () {
  const bar = document.getElementById('progressBar');
  if (!bar) return;
  window.addEventListener('scroll', function () {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = pct + '%';
  });
})();

// ── Reveal on Scroll ──
(function () {
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(function (el) {
    observer.observe(el);
  });
})();

// ── Copy Code Buttons ──
(function () {
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const code = btn.closest('.code-block').querySelector('code').innerText;
      navigator.clipboard.writeText(code).then(function () {
        btn.textContent = 'copiado ✓';
        setTimeout(function () { btn.textContent = 'copiar'; }, 1800);
      });
    });
  });
})();
