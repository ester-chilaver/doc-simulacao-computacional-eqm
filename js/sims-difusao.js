/* ══════════════════════════════════════════
   SIMS-DIFUSAO.JS — Simulações Módulo 01
   Neurociência Computacional
   ══════════════════════════════════════════ */

// ── SIM 1: Difusão do Calor ──
(function () {
  const canvas = document.getElementById('heatCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const N = 200;
  let T = new Float32Array(N).fill(0);
  let t = 0, alpha = 0.15, paused = true;
  let peakPos = 100;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  function reset() {
    T = new Float32Array(N).fill(0);
    peakPos = Math.floor((parseInt(document.getElementById('peakSlider').value) / 100) * N);
    T[peakPos] = 100;
    t = 0;
    document.getElementById('heatTime').textContent = '0';
    document.getElementById('heatMax').textContent = '100.0';
    document.getElementById('heatEntropy').textContent = '—';
  }
  reset();

  function step() {
    const dt = 0.3, dx2 = 1;
    const nT = new Float32Array(T);
    for (let i = 1; i < N - 1; i++) {
      nT[i] = T[i] + alpha * dt * (T[i + 1] - 2 * T[i] + T[i - 1]) / dx2;
    }
    nT[0] = nT[1];
    nT[N - 1] = nT[N - 2];
    T = nT;
    t++;
  }

  function draw() {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(245,166,35,0.22)');
    grad.addColorStop(1, 'rgba(245,166,35,0)');

    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * w;
      const y = h - (T[i] / 110) * (h - 20);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * w;
      const y = h - (T[i] / 110) * (h - 20);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#f5a623';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, h - 1);
    ctx.lineTo(w, h - 1);
    ctx.strokeStyle = 'rgba(245,166,35,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const maxT = Math.max(...T).toFixed(1);
    const sum = T.reduce((a, b) => a + b, 0.001);
    const entropy = T.reduce((s, v) => {
      const p = v / sum;
      return p > 0 ? s - p * Math.log(p) : s;
    }, 0).toFixed(2);

    document.getElementById('heatTime').textContent = t;
    document.getElementById('heatMax').textContent = maxT;
    document.getElementById('heatEntropy').textContent = entropy;
  }

  function loop() {
    if (!paused) { for (let i = 0; i < 0.5; i++) step(); }
    draw();
    requestAnimationFrame(loop);
  }
  loop();

  document.getElementById('alphaSlider').addEventListener('input', function () {
    alpha = parseFloat(this.value);
    document.getElementById('alphaVal').textContent = alpha.toFixed(2);
  });

  document.getElementById('peakSlider').addEventListener('input', function () {
    document.getElementById('peakVal').textContent = this.value + '%';
    reset();
  });

  document.getElementById('heatPause').textContent = '▶ Iniciar';

  document.getElementById('heatReset').addEventListener('click', function () {
    reset();
    paused = true;
    document.getElementById('heatPause').textContent = '▶ Iniciar';
  });
  document.getElementById('heatPause').addEventListener('click', function () {
    paused = !paused;
    this.textContent = paused ? '▶ Continuar' : '⏸ Pausar';
  });

  window.addEventListener('resize', function () { resize(); draw(); });
})();

// ── SIM 2: Gaussiana + MSD ──
(function () {
  const gc = document.getElementById('gaussCanvas');
  const mc = document.getElementById('msdCanvas');
  if (!gc || !mc) return;
  const gCtx = gc.getContext('2d');
  const mCtx = mc.getContext('2d');

  let D = 0.5, t = 0.5, speed = 1, paused = true;
  const msdHistory = [];
  const maxT = 120;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    [gc, mc].forEach(function (c) {
      c.width = c.offsetWidth * dpr;
      c.height = c.offsetHeight * dpr;
    });
    gCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  function reset() {
    t = 0.5;
    msdHistory.length = 0;
    document.getElementById('gaussTime').textContent = '0';
  }
  reset();

  function gaussian(x, t, D) {
    return (1 / Math.sqrt(4 * Math.PI * D * t)) * Math.exp(-(x * x) / (4 * D * t));
  }

  function drawGauss() {
    const w = gc.offsetWidth, h = gc.offsetHeight;
    gCtx.clearRect(0, 0, w, h);

    const xMin = -15, xMax = 15, nPts = 200;
    const maxY = gaussian(0, t, D);

    const grad = gCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(78,205,196,0.22)');
    grad.addColorStop(1, 'rgba(78,205,196,0)');

    gCtx.beginPath();
    for (let i = 0; i <= nPts; i++) {
      const x = xMin + (i / nPts) * (xMax - xMin);
      const y = gaussian(x, t, D);
      const px = (i / nPts) * w;
      const py = h - 10 - (y / Math.max(maxY, 0.001)) * (h - 20);
      i === 0 ? gCtx.moveTo(px, py) : gCtx.lineTo(px, py);
    }
    gCtx.lineTo(w, h - 1);
    gCtx.lineTo(0, h - 1);
    gCtx.closePath();
    gCtx.fillStyle = grad;
    gCtx.fill();

    gCtx.beginPath();
    for (let i = 0; i <= nPts; i++) {
      const x = xMin + (i / nPts) * (xMax - xMin);
      const y = gaussian(x, t, D);
      const px = (i / nPts) * w;
      const py = h - 10 - (y / Math.max(maxY, 0.001)) * (h - 20);
      i === 0 ? gCtx.moveTo(px, py) : gCtx.lineTo(px, py);
    }
    gCtx.strokeStyle = '#4ecdc4';
    gCtx.lineWidth = 2;
    gCtx.stroke();

    const sigma = Math.sqrt(2 * D * t);
    const sigmaFrac = sigma / (xMax - xMin);
    const cx = w / 2;
    gCtx.setLineDash([4, 4]);
    gCtx.strokeStyle = 'rgba(245,166,35,0.35)';
    gCtx.lineWidth = 1;
    [cx + sigmaFrac * w, cx - sigmaFrac * w].forEach(function (px) {
      gCtx.beginPath();
      gCtx.moveTo(px, 0);
      gCtx.lineTo(px, h);
      gCtx.stroke();
    });
    gCtx.setLineDash([]);
  }

  function drawMSD() {
    const w = mc.offsetWidth, h = mc.offsetHeight;
    mCtx.clearRect(0, 0, w, h);

    const msdMax = 2 * D * maxT;

    mCtx.beginPath();
    for (let ti = 0; ti <= maxT; ti++) {
      const px = (ti / maxT) * w;
      const py = h - 10 - (2 * D * ti / msdMax) * (h - 20);
      ti === 0 ? mCtx.moveTo(px, py) : mCtx.lineTo(px, py);
    }
    mCtx.strokeStyle = 'rgba(245,166,35,0.28)';
    mCtx.lineWidth = 1.5;
    mCtx.setLineDash([6, 3]);
    mCtx.stroke();
    mCtx.setLineDash([]);

    if (msdHistory.length > 1) {
      mCtx.beginPath();
      msdHistory.forEach(function (v, i) {
        const px = (v.t / maxT) * w;
        const py = h - 10 - (v.msd / msdMax) * (h - 20);
        i === 0 ? mCtx.moveTo(px, py) : mCtx.lineTo(px, py);
      });
      mCtx.strokeStyle = '#4ecdc4';
      mCtx.lineWidth = 2;
      mCtx.stroke();
    }

    mCtx.font = '10px IBM Plex Mono, monospace';
    mCtx.fillStyle = 'rgba(90,86,80,0.8)';
    mCtx.fillText('2Dt', w - 30, h - (h - 20) * 0.95 + 10);
  }

  function loop() {
    if (!paused) {
      t += 0.08 * speed;
      if (t > maxT) t = 0.5;
      msdHistory.push({ t: t, msd: 2 * D * t });
      if (msdHistory.length > 800) msdHistory.shift();
    }
    drawGauss();
    drawMSD();

    const sigma = Math.sqrt(2 * D * t);
    document.getElementById('gaussTime').textContent = t.toFixed(1);
    document.getElementById('gaussSigma').textContent = sigma.toFixed(2);
    document.getElementById('gaussMSD').textContent = (2 * D * t).toFixed(2);
    requestAnimationFrame(loop);
  }
  loop();

  document.getElementById('dSlider').addEventListener('input', function () {
    D = parseFloat(this.value);
    document.getElementById('dVal').textContent = D.toFixed(1);
    msdHistory.length = 0;
  });

  document.getElementById('speedSlider').addEventListener('input', function () {
    speed = parseFloat(this.value);
    document.getElementById('speedVal').textContent = speed.toFixed(1) + '×';
  });

  document.getElementById('gaussPause').textContent = '▶ Iniciar';

  document.getElementById('gaussReset').addEventListener('click', function () {
    reset();
    paused = true;
    document.getElementById('gaussPause').textContent = '▶ Iniciar';
  });
  document.getElementById('gaussPause').addEventListener('click', function () {
    paused = !paused;
    this.textContent = paused ? '▶ Continuar' : '⏸ Pausar';
  });

  window.addEventListener('resize', resize);
})();

// ── SIM 3: Random Walk Ensemble ──
(function () {
  const canvas = document.getElementById('walkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let N = 20, stepSize = 1.0, running = false;
  let particles = [], stepCount = 0;
  const maxSteps = 300;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  function initParticles() {
    N = parseInt(document.getElementById('nPartSlider').value);
    stepSize = parseFloat(document.getElementById('stepSlider').value);
    const colors = ['#f5a623', '#4ecdc4', '#5b9bd5', '#e05c5c', '#a3d977'];
    particles = Array.from({ length: N }, function (_, i) {
      return {
        positions: [0],
        color: colors[i % colors.length] + (N > 20 ? '55' : 'aa'),
      };
    });
    stepCount = 0;
    updateStats();
  }
  initParticles();

  function stepAll() {
    particles.forEach(function (p) {
      const last = p.positions[p.positions.length - 1];
      const move = Math.random() < 0.5 ? stepSize : -stepSize;
      p.positions.push(last + move);
    });
    stepCount++;
  }

  function draw() {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    const yRange = 30 * stepSize;
    const len = particles[0] ? particles[0].positions.length : 1;
    const xScale = w / Math.max(len, 2);

    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.strokeStyle = 'rgba(245,166,35,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    particles.forEach(function (p) {
      ctx.beginPath();
      p.positions.forEach(function (pos, i) {
        const px = i * xScale;
        const py = h / 2 - (pos / yRange) * (h * 0.45);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.strokeStyle = p.color;
      ctx.lineWidth = N > 30 ? 1 : 1.5;
      ctx.stroke();
    });

    if (N <= 30) {
      particles.forEach(function (p) {
        const last = p.positions[p.positions.length - 1];
        const px = (p.positions.length - 1) * xScale;
        const py = h / 2 - (last / yRange) * (h * 0.45);
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
    }
  }

  function updateStats() {
    if (!particles.length) return;
    const lastPositions = particles.map(function (p) {
      return p.positions[p.positions.length - 1];
    });
    const msdSim = lastPositions.reduce(function (s, x) { return s + x * x; }, 0) / lastPositions.length;
    const msdTheo = 2 * (stepSize * stepSize / 2) * stepCount;
    const err = stepCount > 0 ? Math.abs(msdSim - msdTheo) / Math.max(msdTheo, 0.001) * 100 : 0;

    document.getElementById('walkStep').textContent = stepCount;
    document.getElementById('walkMSDsim').textContent = msdSim.toFixed(2);
    document.getElementById('walkMSDtheo').textContent = msdTheo.toFixed(2);
    document.getElementById('walkErr').textContent = stepCount > 0 ? err.toFixed(1) + '%' : '—';
  }

  function runLoop() {
    if (!running) return;
    if (stepCount < maxSteps) {
      for (let i = 0; i < 2; i++) stepAll();
      draw();
      updateStats();
      requestAnimationFrame(runLoop);
    } else {
      running = false;
      document.getElementById('walkRun').textContent = '▶ Executar';
    }
  }

  document.getElementById('walkRun').addEventListener('click', function () {
    if (running) {
      running = false;
      this.textContent = '▶ Executar';
    } else {
      if (stepCount >= maxSteps) initParticles();
      running = true;
      this.textContent = '⏸ Pausar';
      runLoop();
    }
  });

  document.getElementById('walkReset2').addEventListener('click', function () {
    running = false;
    document.getElementById('walkRun').textContent = '▶ Executar';
    initParticles();
    draw();
  });

  document.getElementById('nPartSlider').addEventListener('input', function () {
    document.getElementById('nPartVal').textContent = this.value;
  });

  document.getElementById('stepSlider').addEventListener('input', function () {
    document.getElementById('stepVal').textContent = parseFloat(this.value).toFixed(1);
  });

  draw();
  window.addEventListener('resize', function () { resize(); draw(); });
})();
