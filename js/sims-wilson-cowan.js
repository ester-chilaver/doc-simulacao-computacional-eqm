// sims-wilson-cowan.js
// Todas as simulações são IIFEs para evitar poluição do escopo global.
// Ordem: SIM_01 → SIM_02 → SIM_03 → SIM_04

// ── SIM_01 — Curva F-I (estática, sem rAF) ──────────────────────────────────
(function () {
  const canvas = document.getElementById('curvaFICanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const cssStyle = getComputedStyle(document.documentElement);
  const COLOR_AMBER  = cssStyle.getPropertyValue('--amber').trim();
  const COLOR_DIM    = cssStyle.getPropertyValue('--text-dim').trim();
  const COLOR_BORDER = cssStyle.getPropertyValue('--border').trim();

  let a     = 1.2;
  let theta = 2.8;

  function F(I) {
    return 1 / (1 + Math.exp(-a * (I - theta)))
         - 1 / (1 + Math.exp(a * theta));
  }

  function findHalfSat() {
    const fmax = F(20);
    const target = fmax / 2;
    let lo = theta, hi = 20;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (F(mid) < target) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function resize() {
    canvas.width  = canvas.offsetWidth  * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  function draw() {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    const I_MIN = -2, I_MAX = 10;
    const Y_MIN = -0.08, Y_MAX = 1.05;
    const PAD = { left: 42, right: 16, top: 16, bottom: 32 };
    const pw = w - PAD.left - PAD.right;
    const ph = h - PAD.top  - PAD.bottom;

    const toX = (I) => PAD.left + (I - I_MIN) / (I_MAX - I_MIN) * pw;
    const toY = (v) => PAD.top  + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * ph;

    // grid
    ctx.strokeStyle = COLOR_BORDER;
    ctx.lineWidth = 1;
    for (let v = 0; v <= 1; v += 0.25) {
      ctx.beginPath();
      ctx.moveTo(PAD.left, toY(v));
      ctx.lineTo(PAD.left + pw, toY(v));
      ctx.stroke();
    }

    // axes
    ctx.strokeStyle = 'rgba(232,228,220,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(toX(0), PAD.top); ctx.lineTo(toX(0), PAD.top + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD.left, toY(0)); ctx.lineTo(PAD.left + pw, toY(0)); ctx.stroke();

    // threshold dashed line
    ctx.strokeStyle = 'rgba(232,228,220,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(toX(theta), PAD.top); ctx.lineTo(toX(theta), PAD.top + ph); ctx.stroke();
    ctx.setLineDash([]);

    // theta label
    ctx.fillStyle = COLOR_DIM;
    ctx.font = '10px IBM Plex Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('θ', toX(theta), PAD.top + ph + 20);

    // axis labels
    ctx.textAlign = 'right';
    for (let v = 0; v <= 1; v += 0.25) {
      ctx.fillText(v.toFixed(2), PAD.left - 6, toY(v) + 4);
    }
    ctx.textAlign = 'center';
    for (let I = 0; I <= 10; I += 2) {
      ctx.fillText(I, toX(I), PAD.top + ph + 20);
    }

    // curve
    ctx.beginPath();
    ctx.strokeStyle = COLOR_AMBER;
    ctx.lineWidth = 2.5;
    let first = true;
    for (let ix = 0; ix <= pw; ix++) {
      const I = I_MIN + (ix / pw) * (I_MAX - I_MIN);
      const v = F(I);
      const px = PAD.left + ix;
      const py = toY(v);
      if (first) { ctx.moveTo(px, py); first = false; } else { ctx.lineTo(px, py); }
    }
    ctx.stroke();

    // stat updates
    document.getElementById('fi0').textContent      = F(0).toFixed(4);
    document.getElementById('fiTheta').textContent  = F(theta).toFixed(4);
    document.getElementById('fiTheta15').textContent = F(theta * 1.5).toFixed(4);
    const hs = findHalfSat();
    document.getElementById('fiHalfSat').textContent = hs.toFixed(2);
  }

  resize();
  draw();
  window.addEventListener('resize', () => { resize(); draw(); });

  const gainSlider  = document.getElementById('gainSlider');
  const thetaSlider = document.getElementById('thetaSlider');
  const gainVal     = document.getElementById('gainVal');
  const thetaVal    = document.getElementById('thetaVal');

  gainSlider.addEventListener('input', () => {
    a = parseFloat(gainSlider.value);
    gainVal.textContent = a.toFixed(2);
    gainSlider.setAttribute('aria-valuenow', a);
    draw();
  });

  thetaSlider.addEventListener('input', () => {
    theta = parseFloat(thetaSlider.value);
    thetaVal.textContent = theta.toFixed(2);
    thetaSlider.setAttribute('aria-valuenow', theta);
    draw();
  });
})();


// ── SIM_02 — Wilson-Cowan Temporal (rAF + RK4) ──────────────────────────────
(function () {
  const canvas = document.getElementById('wcTemporalCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const cssStyle = getComputedStyle(document.documentElement);
  const COLOR_AMBER  = cssStyle.getPropertyValue('--amber').trim();
  const COLOR_BORDER = cssStyle.getPropertyValue('--border').trim();

  const DT = 0.05;
  const STEPS_PER_FRAME = 5;
  const BUFFER_SIZE = 800;
  const DETECT_WIN  = 500;

  const bufE = new Float32Array(BUFFER_SIZE);
  const bufI = new Float32Array(BUFFER_SIZE);
  let bufHead = 0;

  const params = {
    tauE: 1.0, tauI: 2.0,
    aE: 1.2, thE: 2.8,
    aI: 1.0, thI: 4.0,
    wEE: 9.0, wEI: 8.0,
    wIE: 10.0, wII: 8.0,
    Ie: 0.5, Ii: 0.0
  };

  let rE = 0.1, rI = 0.1;
  let paused = false;
  let animId = null;

  function sigmoid(I, a, th) {
    return 1 / (1 + Math.exp(-a * (I - th))) - 1 / (1 + Math.exp(a * th));
  }

  function derivatives(re, ri) {
    const IE = params.wEE * re - params.wEI * ri + params.Ie;
    const II = params.wIE * re - params.wII * ri + params.Ii;
    return {
      e: (-re + sigmoid(IE, params.aE, params.thE)) / params.tauE,
      i: (-ri + sigmoid(II, params.aI, params.thI)) / params.tauI
    };
  }

  function rk4Step(re, ri) {
    const k1 = derivatives(re,                ri);
    const k2 = derivatives(re + DT/2 * k1.e,  ri + DT/2 * k1.i);
    const k3 = derivatives(re + DT/2 * k2.e,  ri + DT/2 * k2.i);
    const k4 = derivatives(re + DT   * k3.e,  ri + DT   * k3.i);
    return {
      e: Math.max(0, Math.min(1, re + (DT/6) * (k1.e + 2*k2.e + 2*k3.e + k4.e))),
      i: Math.max(0, Math.min(1, ri + (DT/6) * (k1.i + 2*k2.i + 2*k3.i + k4.i)))
    };
  }

  function resetState() {
    rE = 0.1; rI = 0.1;
    bufHead = 0;
    bufE.fill(0);
    bufI.fill(0);
  }

  function detectBehavior() {
    const n = Math.min(bufHead, DETECT_WIN);
    if (n < 30) return { type: 'AGUARDANDO', freq: null };
    let sum = 0;
    const startIdx = bufHead - n;
    for (let i = 0; i < n; i++) {
      sum += bufE[(startIdx + i) % BUFFER_SIZE];
    }
    const mean = sum / n;
    let variance = 0;
    for (let i = 0; i < n; i++) {
      const v = bufE[(startIdx + i) % BUFFER_SIZE] - mean;
      variance += v * v;
    }
    const std = Math.sqrt(variance / n);

    if (std < 0.01) return { type: 'PONTO FIXO ESTÁVEL', freq: null };

    // detect peaks for frequency
    const peaks = [];
    for (let i = 1; i < n - 1; i++) {
      const prev = bufE[(startIdx + i - 1) % BUFFER_SIZE];
      const curr = bufE[(startIdx + i)     % BUFFER_SIZE];
      const next = bufE[(startIdx + i + 1) % BUFFER_SIZE];
      if (curr > prev && curr > next && curr > mean + std * 0.5) {
        peaks.push(i);
      }
    }

    let freq = null;
    if (peaks.length >= 2) {
      let totalGap = 0;
      for (let j = 1; j < peaks.length; j++) totalGap += peaks[j] - peaks[j-1];
      const avgGap = totalGap / (peaks.length - 1);
      const period = avgGap * STEPS_PER_FRAME * DT;
      freq = (1 / period).toFixed(2);
    }
    return { type: 'OSCILAÇÃO', freq };
  }

  function resize() {
    canvas.width  = canvas.offsetWidth  * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  function draw() {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    const n = Math.min(bufHead, BUFFER_SIZE);
    if (n < 2) return;

    const PAD = { left: 8, right: 8, top: 10, bottom: 10 };
    const pw = w - PAD.left - PAD.right;
    const ph = h - PAD.top  - PAD.bottom;

    // grid lines
    ctx.strokeStyle = COLOR_BORDER;
    ctx.lineWidth = 1;
    for (let v = 0; v <= 1; v += 0.25) {
      const py = PAD.top + (1 - v) * ph;
      ctx.beginPath(); ctx.moveTo(PAD.left, py); ctx.lineTo(PAD.left + pw, py); ctx.stroke();
    }

    const startIdx = bufHead - n;

    function drawBuf(buf, color) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      for (let i = 0; i < n; i++) {
        const val = buf[(startIdx + i) % BUFFER_SIZE];
        const px = PAD.left + (i / (BUFFER_SIZE - 1)) * pw;
        const py = PAD.top  + (1 - val) * ph;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    drawBuf(bufE, '#5b9cf6');
    drawBuf(bufI, '#e05c5c');

    // legend
    ctx.font = '10px IBM Plex Mono, monospace';
    ctx.fillStyle = '#5b9cf6'; ctx.fillText('r_E', PAD.left + 6, PAD.top + 16);
    ctx.fillStyle = '#e05c5c'; ctx.fillText('r_I', PAD.left + 6, PAD.top + 30);
  }

  function updateStats() {
    document.getElementById('wcStatRE').textContent = rE.toFixed(3);
    document.getElementById('wcStatRI').textContent = rI.toFixed(3);
    const beh = detectBehavior();
    document.getElementById('wcBehavior').textContent = beh.type;
    document.getElementById('wcFreq').textContent = beh.freq ? beh.freq + ' u.a.' : '—';
  }

  function loop() {
    if (!paused) {
      for (let s = 0; s < STEPS_PER_FRAME; s++) {
        const next = rk4Step(rE, rI);
        rE = next.e; rI = next.i;
      }
      bufE[bufHead % BUFFER_SIZE] = rE;
      bufI[bufHead % BUFFER_SIZE] = rI;
      bufHead++;
    }
    draw();
    if (bufHead % 6 === 0) updateStats();
    animId = requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', () => { resize(); draw(); });
  loop();

  function bindSlider(sliderId, labelId, paramKey) {
    const slider = document.getElementById(sliderId);
    const label  = document.getElementById(labelId);
    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      label.textContent = v.toFixed(2);
      slider.setAttribute('aria-valuenow', v);
      params[paramKey] = v;
      resetState();
    });
  }

  bindSlider('wcIeSlider',  'wcIeVal',  'Ie');
  bindSlider('wcWeeSlider', 'wcWeeVal', 'wEE');
  bindSlider('wcWeiSlider', 'wcWeiVal', 'wEI');
  bindSlider('wcWieSlider', 'wcWieVal', 'wIE');
  bindSlider('wcWiiSlider', 'wcWiiVal', 'wII');

  document.getElementById('wcPause').addEventListener('click', () => {
    paused = !paused;
    document.getElementById('wcPause').textContent = paused ? '▶ Continuar' : '⏸ Pausar';
  });

  document.getElementById('wcReset').addEventListener('click', () => {
    resetState();
    if (paused) { paused = false; document.getElementById('wcPause').textContent = '⏸ Pausar'; }
  });
})();


// ── SIM_03 — Plano de Fase (rAF + campo vetorial + nullclines) ───────────────
(function () {
  const canvas = document.getElementById('planoDeFaseCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const cssStyle = getComputedStyle(document.documentElement);
  const COLOR_AMBER  = cssStyle.getPropertyValue('--amber').trim();

  const DT = 0.05;
  const STEPS_PER_FRAME = 4;
  const MAX_TRAJ = 5;
  const TRAIL_LEN = 600;
  const TRAJ_COLORS = ['#f5a623', '#4ecdc4', '#a3d977', '#e05c5c', '#b8a9f5'];

  const params = {
    tauE: 1.0, tauI: 2.0,
    aE: 1.2, thE: 2.8,
    aI: 1.0, thI: 4.0,
    wEE: 9.0, wEI: 8.0,
    wIE: 10.0, wII: 8.0,
    Ie: 0.5, Ii: 0.0
  };

  // trajectories: [{trail: [{e,i},...], color}]
  let trajectories = [{ trail: [{ e: 0.1, i: 0.1 }], color: TRAJ_COLORS[0] }];

  // cached field and nullclines
  let vectorField = null;
  let nullclineE  = null;
  let nullclineI  = null;
  let fixedPt     = null;
  let isStable    = null;

  function sigmoid(I, a, th) {
    return 1 / (1 + Math.exp(-a * (I - th))) - 1 / (1 + Math.exp(a * th));
  }

  function derivs(re, ri) {
    const IE = params.wEE * re - params.wEI * ri + params.Ie;
    const II = params.wIE * re - params.wII * ri + params.Ii;
    return {
      e: (-re + sigmoid(IE, params.aE, params.thE)) / params.tauE,
      i: (-ri + sigmoid(II, params.aI, params.thI)) / params.tauI
    };
  }

  function rk4Step(re, ri) {
    const k1 = derivs(re,                ri);
    const k2 = derivs(re + DT/2 * k1.e,  ri + DT/2 * k1.i);
    const k3 = derivs(re + DT/2 * k2.e,  ri + DT/2 * k2.i);
    const k4 = derivs(re + DT   * k3.e,  ri + DT   * k3.i);
    return {
      e: Math.max(0, Math.min(1, re + (DT/6) * (k1.e + 2*k2.e + 2*k3.e + k4.e))),
      i: Math.max(0, Math.min(1, ri + (DT/6) * (k1.i + 2*k2.i + 2*k3.i + k4.i)))
    };
  }

  // bisection: find x in [0,1] where g(x) = 0
  function bisect(g, lo, hi) {
    for (let k = 0; k < 50; k++) {
      const mid = (lo + hi) / 2;
      if (g(mid) > 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function computeNullclines() {
    const N = 120;
    const ncE = [], ncI = [];

    for (let j = 0; j <= N; j++) {
      const rI = j / N;
      // nullcline E: -rE + F_E(wEE*rE - wEI*rI + Ie) = 0
      const g = (re) => -re + sigmoid(params.wEE * re - params.wEI * rI + params.Ie, params.aE, params.thE);
      if (g(0) * g(1) < 0) {
        ncE.push({ e: bisect(g, 0, 1), i: rI });
      }
    }

    for (let j = 0; j <= N; j++) {
      const rE = j / N;
      // nullcline I: -rI + F_I(wIE*rE - wII*rI + Ii) = 0
      const g = (ri) => -ri + sigmoid(params.wIE * rE - params.wII * ri + params.Ii, params.aI, params.thI);
      if (g(0) * g(1) < 0) {
        ncI.push({ e: rE, i: bisect(g, 0, 1) });
      }
    }

    nullclineE = ncE;
    nullclineI = ncI;
  }

  function computeVectorField() {
    const GRID = 12;
    const field = [];
    for (let iy = 0; iy <= GRID; iy++) {
      for (let ix = 0; ix <= GRID; ix++) {
        const re = ix / GRID;
        const ri = iy / GRID;
        const d = derivs(re, ri);
        const mag = Math.sqrt(d.e * d.e + d.i * d.i);
        field.push({ re, ri, de: d.e, di: d.i, mag });
      }
    }
    vectorField = field;
  }

  function findFixedPoint() {
    // run from center to find fixed point
    let re = 0.3, ri = 0.3;
    for (let i = 0; i < 3000; i++) {
      const next = rk4Step(re, ri);
      re = next.e; ri = next.i;
    }
    fixedPt = { e: re, i: ri };

    // stability: run with small perturbation
    let pre = re + 0.05, pri = ri + 0.05;
    for (let i = 0; i < 500; i++) {
      const next = rk4Step(pre, pri);
      pre = next.e; pri = next.i;
    }
    const dist = Math.sqrt((pre - re) ** 2 + (pri - ri) ** 2);
    isStable = dist < 0.05;

    updateStats();
  }

  function recompute() {
    computeNullclines();
    computeVectorField();
    findFixedPoint();
  }

  function resetTrajectories() {
    trajectories = [{ trail: [{ e: 0.1, i: 0.1 }], color: TRAJ_COLORS[0] }];
    document.getElementById('ppNTraj').textContent = '1';
  }

  function updateStats() {
    if (fixedPt) {
      document.getElementById('ppFixedPt').textContent =
        '(' + fixedPt.e.toFixed(3) + ', ' + fixedPt.i.toFixed(3) + ')';
      document.getElementById('ppStability').textContent =
        isStable ? 'ESTÁVEL' : 'INSTÁVEL';
    }
  }

  function resize() {
    const size = Math.min(canvas.offsetWidth, 360);
    canvas.width  = canvas.offsetWidth  * devicePixelRatio;
    canvas.height = canvas.offsetWidth  * devicePixelRatio;
    canvas.style.height = canvas.offsetWidth + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  function toCanvas(re, ri) {
    const w = canvas.offsetWidth;
    return { x: re * w, y: (1 - ri) * w };
  }

  function drawArrow(x, y, de, di, scale) {
    const len = Math.sqrt(de * de + di * di);
    if (len < 1e-8) return;
    const nx = de / len * scale;
    const ny = -di / len * scale;
    const ex = x + nx, ey = y + ny;
    ctx.beginPath();
    ctx.moveTo(x - nx * 0.5, y - ny * 0.5);
    ctx.lineTo(ex, ey);
    // arrowhead
    const angle = Math.atan2(ny, nx);
    const aSize = 3;
    ctx.lineTo(ex - aSize * Math.cos(angle - 0.5), ey - aSize * Math.sin(angle - 0.5));
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - aSize * Math.cos(angle + 0.5), ey - aSize * Math.sin(angle + 0.5));
    ctx.stroke();
  }

  function draw() {
    const w = canvas.offsetWidth;
    ctx.clearRect(0, 0, w, w);

    // 1. vector field
    if (vectorField) {
      const maxMag = Math.max(...vectorField.map(v => v.mag)) || 1;
      ctx.strokeStyle = 'rgba(232,228,220,0.25)';
      ctx.lineWidth = 1;
      for (const v of vectorField) {
        const p = toCanvas(v.re, v.ri);
        const scale = 12 * (v.mag / maxMag) + 4;
        drawArrow(p.x, p.y, v.de, v.di, scale);
      }
    }

    // 2. nullcline E (blue dashed)
    if (nullclineE && nullclineE.length > 1) {
      ctx.strokeStyle = '#5b9cf6';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      nullclineE.forEach((pt, i) => {
        const p = toCanvas(pt.e, pt.i);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. nullcline I (red dashed)
    if (nullclineI && nullclineI.length > 1) {
      ctx.strokeStyle = '#e05c5c';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      nullclineI.forEach((pt, i) => {
        const p = toCanvas(pt.e, pt.i);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. trajectories
    for (const traj of trajectories) {
      const trail = traj.trail;
      if (trail.length < 2) continue;
      const start = Math.max(0, trail.length - TRAIL_LEN);
      for (let i = start + 1; i < trail.length; i++) {
        const alpha = (i - start) / (trail.length - start);
        ctx.strokeStyle = traj.color.replace(')', `, ${alpha * 0.85})`).replace('rgb', 'rgba').replace('#', 'rgba(').replace('rgba(', traj.color.startsWith('#') ? 'rgba(' : '');
        // simpler alpha approach
        ctx.globalAlpha = alpha * 0.9;
        ctx.strokeStyle = traj.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const a2 = toCanvas(trail[i-1].e, trail[i-1].i);
        const b2 = toCanvas(trail[i].e,   trail[i].i);
        ctx.moveTo(a2.x, a2.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // moving dot
      const last = trail[trail.length - 1];
      const lp = toCanvas(last.e, last.i);
      ctx.beginPath();
      ctx.fillStyle = traj.color;
      ctx.arc(lp.x, lp.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. fixed point
    if (fixedPt) {
      const fp = toCanvas(fixedPt.e, fixedPt.i);
      ctx.beginPath();
      ctx.arc(fp.x, fp.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = isStable ? '#f5a623' : '#e05c5c';
      ctx.fill();
      ctx.strokeStyle = '#0e0e10';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // axis labels
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#e8e4dc';
    ctx.font = '10px IBM Plex Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('r_I ↑', 4, 14);
    ctx.textAlign = 'right';
    ctx.fillText('r_E →', w - 4, w - 6);
    ctx.fillText('0', 20, w - 6);
    ctx.fillText('1', w - 4, 14);
    ctx.globalAlpha = 1;
  }

  recompute();
  resize();
  window.addEventListener('resize', () => { resize(); draw(); });

  function loop() {
    for (const traj of trajectories) {
      for (let s = 0; s < STEPS_PER_FRAME; s++) {
        const last = traj.trail[traj.trail.length - 1];
        const next = rk4Step(last.e, last.i);
        traj.trail.push(next);
        if (traj.trail.length > TRAIL_LEN) traj.trail.shift();
      }
    }
    draw();
    requestAnimationFrame(loop);
  }
  loop();

  // click to add trajectory
  canvas.addEventListener('click', (evt) => {
    const rect = canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    const w = canvas.offsetWidth;
    const re = Math.max(0, Math.min(1, x / w));
    const ri = Math.max(0, Math.min(1, 1 - y / w));

    if (trajectories.length >= MAX_TRAJ) trajectories.shift();
    const colorIdx = trajectories.length % TRAJ_COLORS.length;
    trajectories.push({ trail: [{ e: re, i: ri }], color: TRAJ_COLORS[colorIdx] });
    document.getElementById('ppNTraj').textContent = trajectories.length;
  });

  document.getElementById('ppReset').addEventListener('click', () => {
    resetTrajectories();
  });

  document.getElementById('ppClear').addEventListener('click', () => {
    resetTrajectories();
  });

  function bindSliderPP(sliderId, labelId, paramKey) {
    const slider = document.getElementById(sliderId);
    const label  = document.getElementById(labelId);
    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      label.textContent = v.toFixed(2);
      slider.setAttribute('aria-valuenow', v);
      params[paramKey] = v;
      recompute();
    });
  }

  bindSliderPP('ppIeSlider',  'ppIeVal',  'Ie');
  bindSliderPP('ppWiiSlider', 'ppWiiVal', 'wII');
})();


// ── SIM_04 — Diagrama de Bifurcação (setTimeout, não bloqueia UI) ────────────
(function () {
  const canvas = document.getElementById('bifurcacaoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const progressBar = document.getElementById('bifProgressBar');
  const calcBtn     = document.getElementById('bifCalcBtn');

  const BIF_PARAMS = {
    tauE: 1.0, tauI: 2.0,
    aE: 1.2, thE: 2.8,
    aI: 1.0, thI: 4.0,
    wEE: 9.0, wEI: 8.0,
    wIE: 10.0, wII: 3.0,   // wII fixo em 3.0
    Ii: 0.0
  };

  const DT = 0.1;
  const N_POINTS = 40;
  const WARMUP   = 5000;
  const ANALYSIS = 2000;

  const IE_VALUES = Array.from({ length: N_POINTS }, (_, i) => i * (5 / (N_POINTS - 1)));

  let results = [];
  let currentIdx = 0;
  let running = false;

  function sigmoid(I, a, th) {
    return 1 / (1 + Math.exp(-a * (I - th))) - 1 / (1 + Math.exp(a * th));
  }

  function rk4Step(re, ri, Ie) {
    function derivs(re2, ri2) {
      const p = BIF_PARAMS;
      const IE = p.wEE * re2 - p.wEI * ri2 + Ie;
      const II = p.wIE * re2 - p.wII * ri2 + p.Ii;
      return {
        e: (-re2 + sigmoid(IE, p.aE, p.thE)) / p.tauE,
        i: (-ri2 + sigmoid(II, p.aI, p.thI)) / p.tauI
      };
    }
    const k1 = derivs(re, ri);
    const k2 = derivs(re + DT/2 * k1.e, ri + DT/2 * k1.i);
    const k3 = derivs(re + DT/2 * k2.e, ri + DT/2 * k2.i);
    const k4 = derivs(re + DT   * k3.e, ri + DT   * k3.i);
    return {
      e: Math.max(0, Math.min(1, re + (DT/6) * (k1.e + 2*k2.e + 2*k3.e + k4.e))),
      i: Math.max(0, Math.min(1, ri + (DT/6) * (k1.i + 2*k2.i + 2*k3.i + k4.i)))
    };
  }

  function runAnalysis(Ie) {
    let re = 0.2, ri = 0.2;
    for (let i = 0; i < WARMUP; i++) {
      const next = rk4Step(re, ri, Ie);
      re = next.e; ri = next.i;
    }
    let sumE = 0, sumI = 0, sum2E = 0;
    let minE = 1, maxE = 0;
    let minI = 1, maxI = 0;
    for (let i = 0; i < ANALYSIS; i++) {
      const next = rk4Step(re, ri, Ie);
      re = next.e; ri = next.i;
      sumE += re; sumI += ri;
      sum2E += re * re;
      if (re < minE) minE = re;
      if (re > maxE) maxE = re;
      if (ri < minI) minI = ri;
      if (ri > maxI) maxI = ri;
    }
    const meanE = sumE / ANALYSIS;
    const meanI = sumI / ANALYSIS;
    const stdE  = Math.sqrt(sum2E / ANALYSIS - meanE * meanE);
    const osc   = stdE > 0.01;
    return { Ie, meanE, meanI, minE, maxE, minI, maxI, osc };
  }

  function resize() {
    canvas.width  = canvas.offsetWidth  * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  function renderDiagram(res) {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    if (res.length === 0) return;

    const PAD = { left: 44, right: 16, top: 16, bottom: 36 };
    const pw = w - PAD.left - PAD.right;
    const ph = h - PAD.top  - PAD.bottom;

    const toX = (Ie) => PAD.left + (Ie / 5) * pw;
    const toY = (v)  => PAD.top  + (1 - v)  * ph;

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let v = 0; v <= 1; v += 0.25) {
      ctx.beginPath(); ctx.moveTo(PAD.left, toY(v)); ctx.lineTo(PAD.left + pw, toY(v)); ctx.stroke();
    }
    for (let I = 0; I <= 5; I++) {
      ctx.beginPath(); ctx.moveTo(toX(I), PAD.top); ctx.lineTo(toX(I), PAD.top + ph); ctx.stroke();
    }

    // axis labels
    ctx.fillStyle = 'rgba(232,228,220,0.4)';
    ctx.font = '10px IBM Plex Mono, monospace';
    ctx.textAlign = 'right';
    for (let v = 0; v <= 1; v += 0.25) {
      ctx.fillText(v.toFixed(2), PAD.left - 6, toY(v) + 4);
    }
    ctx.textAlign = 'center';
    for (let I = 0; I <= 5; I++) {
      ctx.fillText(I, toX(I), PAD.top + ph + 20);
    }
    ctx.fillText('I_ext', PAD.left + pw / 2, PAD.top + ph + 34);

    // oscillation shaded area (green)
    const oscRegions = res.filter(r => r.osc);
    if (oscRegions.length > 0) {
      ctx.fillStyle = 'rgba(163,217,119,0.15)';
      ctx.beginPath();
      oscRegions.forEach((r, i) => {
        if (i === 0) ctx.moveTo(toX(r.Ie), toY(r.maxE));
        else ctx.lineTo(toX(r.Ie), toY(r.maxE));
      });
      for (let i = oscRegions.length - 1; i >= 0; i--) {
        ctx.lineTo(toX(oscRegions[i].Ie), toY(oscRegions[i].minE));
      }
      ctx.closePath();
      ctx.fill();
      // border lines
      ctx.strokeStyle = 'rgba(163,217,119,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      oscRegions.forEach((r, i) => {
        i === 0 ? ctx.moveTo(toX(r.Ie), toY(r.maxE)) : ctx.lineTo(toX(r.Ie), toY(r.maxE));
      });
      ctx.stroke();
      ctx.beginPath();
      oscRegions.forEach((r, i) => {
        i === 0 ? ctx.moveTo(toX(r.Ie), toY(r.minE)) : ctx.lineTo(toX(r.Ie), toY(r.minE));
      });
      ctx.stroke();
    }

    // rE mean (blue)
    ctx.strokeStyle = '#5b9cf6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    res.forEach((r, i) => {
      i === 0 ? ctx.moveTo(toX(r.Ie), toY(r.meanE)) : ctx.lineTo(toX(r.Ie), toY(r.meanE));
    });
    ctx.stroke();

    // rI mean (red)
    ctx.strokeStyle = '#e05c5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    res.forEach((r, i) => {
      i === 0 ? ctx.moveTo(toX(r.Ie), toY(r.meanI)) : ctx.lineTo(toX(r.Ie), toY(r.meanI));
    });
    ctx.stroke();

    // detect bifurcation points
    let bif1 = null, bif2 = null;
    for (let i = 1; i < res.length; i++) {
      if (!res[i-1].osc && res[i].osc && bif1 === null) bif1 = res[i].Ie;
      if (res[i-1].osc  && !res[i].osc && bif2 === null) bif2 = res[i].Ie;
    }

    // mark bifurcation lines
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    if (bif1 !== null) {
      ctx.strokeStyle = '#f5a623';
      ctx.beginPath(); ctx.moveTo(toX(bif1), PAD.top); ctx.lineTo(toX(bif1), PAD.top + ph); ctx.stroke();
    }
    if (bif2 !== null) {
      ctx.strokeStyle = '#f5a623';
      ctx.beginPath(); ctx.moveTo(toX(bif2), PAD.top); ctx.lineTo(toX(bif2), PAD.top + ph); ctx.stroke();
    }
    ctx.setLineDash([]);

    document.getElementById('bifPt1').textContent = bif1 !== null ? bif1.toFixed(2) : '—';
    document.getElementById('bifPt2').textContent = bif2 !== null ? bif2.toFixed(2) : '—';
  }

  function drawPartial() {
    renderDiagram(results);
  }

  function processNext() {
    if (currentIdx >= N_POINTS) {
      renderDiagram(results);
      calcBtn.textContent = '▶ Recalcular';
      calcBtn.disabled = false;
      running = false;
      return;
    }
    results.push(runAnalysis(IE_VALUES[currentIdx]));
    currentIdx++;
    progressBar.style.width = `${(currentIdx / N_POINTS) * 100}%`;
    if (currentIdx % 5 === 0) drawPartial();
    setTimeout(processNext, 0);
  }

  resize();
  window.addEventListener('resize', () => { resize(); if (results.length > 0) renderDiagram(results); });

  calcBtn.addEventListener('click', () => {
    if (running) return;
    running = true;
    results = [];
    currentIdx = 0;
    progressBar.style.width = '0%';
    calcBtn.textContent = '⏳ Calculando…';
    calcBtn.disabled = true;
    document.getElementById('bifPt1').textContent = '—';
    document.getElementById('bifPt2').textContent = '—';
    setTimeout(processNext, 0);
  });
})();
