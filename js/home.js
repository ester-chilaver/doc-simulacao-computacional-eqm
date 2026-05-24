/* ══════════════════════════════════════════
   HOME.JS — Central Light Animation
   Neurociência Computacional
   ══════════════════════════════════════════ */

(function () {
  const canvas = document.getElementById('tunnelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, cx, cy;
  let phase = 0;

  // Ciclo completo: ~18 segundos a 60fps
  // 0.00 → 0.83: luz cresce (ease-in, bem devagar)
  // 0.83 → 1.00: fade out suave, reinicia
  const SPEED = 1 / 1080;
  const GROW_END = 0.83;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W * 0.8;
    cy = H * 0.8;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Fundo escuro
    ctx.fillStyle = '#020101';
    ctx.fillRect(0, 0, W, H);

    const base = Math.min(W, H);

    // Calcular crescimento e opacidade
    let grow, alpha;

    if (phase <= GROW_END) {
      // Ease-in acentuado: começa quase imperceptível, cresce gradualmente
      grow = Math.pow(phase / GROW_END, 2.4);
      alpha = 1;
    } else {
      grow = 1;
      // Fade out suave ao final do ciclo
      alpha = 1 - (phase - GROW_END) / (1 - GROW_END);
      alpha = Math.max(0, alpha);
    }

    // ── Halo externo difuso (aurora ao redor da luz) ──
    const haloR = base * grow * 0.72;
    if (haloR > 0) {
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
      halo.addColorStop(0,   `rgba(200, 140, 40,  ${0.07 * alpha})`);
      halo.addColorStop(0.35, `rgba(180, 110, 25, ${0.04 * alpha})`);
      halo.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);
    }

    // ── Glow quente intermediário ──
    const glowR = base * (0.012 + grow * 0.28);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    glow.addColorStop(0,    `rgba(255, 235, 150, ${0.65 * alpha})`);
    glow.addColorStop(0.18, `rgba(252, 200,  70, ${0.30 * alpha})`);
    glow.addColorStop(0.55, `rgba(240, 155,  35, ${0.08 * alpha})`);
    glow.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // ── Núcleo branco central ──
    const coreR = base * (0.006 + grow * 0.08);
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    core.addColorStop(0,    `rgba(255, 254, 250, ${alpha})`);
    core.addColorStop(0.25, `rgba(255, 248, 215, ${0.88 * alpha})`);
    core.addColorStop(0.65, `rgba(255, 220, 110, ${0.38 * alpha})`);
    core.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, W, H);

    // ── Vignette: escurece as bordas, deixa o centro respirar ──
    const vigR = Math.max(W, H) * 0.82;
    const vignette = ctx.createRadialGradient(cx, cy, base * 0.04, cx, cy, vigR);
    vignette.addColorStop(0,    'rgba(0,0,0,0)');
    vignette.addColorStop(0.42, 'rgba(2,1,1,0.25)');
    vignette.addColorStop(1,    'rgba(2,1,1,0.97)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    phase += SPEED;
    if (phase >= 1) phase = 0;

    requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener('resize', resize);
})();
