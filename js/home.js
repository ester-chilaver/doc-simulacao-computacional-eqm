/* ══════════════════════════════════════════
   HOME.JS — Tunnel Animation & Homepage
   Neurociência Computacional
   ══════════════════════════════════════════ */

(function () {
  const canvas = document.getElementById('tunnelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, cx, cy;
  let time = 0;
  const RINGS = 20;
  const SPEED = 0.0035;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W * 0.5;
    cy = H * 0.5;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Deep background
    ctx.fillStyle = '#040203';
    ctx.fillRect(0, 0, W, H);

    // Perspective tunnel lines (walls converging to vanishing point)
    const wallPoints = [
      [0, 0], [W, 0], [W, H], [0, H],
      [W * 0.5, 0], [W * 0.5, H], [0, H * 0.5], [W, H * 0.5],
      [W * 0.25, 0], [W * 0.75, 0], [W * 0.25, H], [W * 0.75, H],
      [0, H * 0.25], [0, H * 0.75], [W, H * 0.25], [W, H * 0.75],
    ];
    ctx.strokeStyle = 'rgba(245, 140, 20, 0.03)';
    ctx.lineWidth = 0.5;
    wallPoints.forEach(function (pt) {
      ctx.beginPath();
      ctx.moveTo(pt[0], pt[1]);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    });

    // Animated tunnel rings flowing toward center
    for (let i = 0; i < RINGS; i++) {
      // Phase: 0 = at center (just disappeared), 1 = at outer edge (just appeared)
      let phase = ((i / RINGS) + time) % 1;

      // Exponential easing for perspective — rings accelerate toward center
      const t = Math.pow(phase, 1.6);

      const rx = W * 0.54 * t;
      const ry = H * 0.52 * t;

      if (rx < 1) continue;

      // Opacity: visible in mid-range, fade near center and fade at far edge
      const fade = Math.sin(phase * Math.PI);
      const opacity = fade * 0.28;

      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(245, 155, 25, ' + opacity + ')';
      ctx.lineWidth = Math.max(0.4, (1 - t) * 1.8);
      ctx.stroke();
    }

    // Vignette — darkens the edges
    const vigR = Math.max(W, H) * 0.75;
    const vignette = ctx.createRadialGradient(cx, cy, H * 0.08, cx, cy, vigR);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.45, 'rgba(4,2,3,0.05)');
    vignette.addColorStop(1, 'rgba(4,2,3,0.94)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // Central light source — the "light at the end"
    const pulse = 1 + Math.sin(time * Math.PI * 6) * 0.025;
    const lightR = Math.min(W, H) * 0.2 * pulse;

    const light = ctx.createRadialGradient(cx, cy, 0, cx, cy, lightR);
    light.addColorStop(0, 'rgba(255, 252, 240, 1)');
    light.addColorStop(0.03, 'rgba(255, 248, 210, 0.97)');
    light.addColorStop(0.1, 'rgba(250, 210, 120, 0.65)');
    light.addColorStop(0.25, 'rgba(245, 166, 35, 0.18)');
    light.addColorStop(0.55, 'rgba(220, 120, 20, 0.04)');
    light.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, W, H);

    // Subtle second glow halo
    const haloR = Math.min(W, H) * 0.38;
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
    halo.addColorStop(0, 'rgba(245, 180, 60, 0.06)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    time += SPEED;
    requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener('resize', resize);
})();
