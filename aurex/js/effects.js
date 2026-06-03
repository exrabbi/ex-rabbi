/* AUREX Effects Engine — Canvas, Particles, World Map */

/* ── PARTICLE NEBULA ─────────────────────────────────────── */
class NebulaCoreEffect {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    this.raf = null;
    this.init();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    this.resize();
    const count = Math.min(180, Math.floor(window.innerWidth / 8));
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(this.mkParticle());
    }
    if (this.raf) cancelAnimationFrame(this.raf);
    this.tick();
  }

  mkParticle(x, y) {
    const isGold   = Math.random() > 0.4;
    const colors   = ['#D4A843', '#F2C95C', '#A07B2A', '#E8D5A3', '#C9A84C'];
    const color    = colors[Math.floor(Math.random() * colors.length)];
    return {
      x: x ?? Math.random() * this.canvas.width,
      y: y ?? Math.random() * this.canvas.height,
      baseX: x ?? Math.random() * this.canvas.width,
      baseY: y ?? Math.random() * this.canvas.height,
      size: Math.random() * 2.2 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.6 + 0.15,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.015 + 0.005,
      color,
      isGold,
    };
  }

  tick() {
    const { ctx, canvas, particles, mouse } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Connection lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / 120) * 0.12;
          ctx.strokeStyle = '#D4A843';
          ctx.lineWidth   = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Particles
    particles.forEach(p => {
      p.x     += p.vx;
      p.y     += p.vy;
      p.pulse += p.pulseSpeed;

      if (p.x < -5)              p.x = canvas.width  + 5;
      if (p.x > canvas.width+5)  p.x = -5;
      if (p.y < -5)              p.y = canvas.height + 5;
      if (p.y > canvas.height+5) p.y = -5;

      const mdx  = p.x - mouse.x;
      const mdy  = p.y - mouse.y;
      const md   = Math.sqrt(mdx * mdx + mdy * mdy);
      if (md < 100) {
        p.x += (mdx / md) * 0.4;
        p.y += (mdy / md) * 0.4;
      }

      const sz   = p.size + Math.sin(p.pulse) * 0.6;
      const op   = p.opacity + Math.sin(p.pulse) * 0.12;
      const grd  = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 4);
      grd.addColorStop(0, p.color + 'FF');
      grd.addColorStop(1, p.color + '00');

      ctx.save();
      ctx.globalAlpha = Math.min(1, op);
      ctx.fillStyle   = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = Math.min(1, op * 1.5);
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    this.raf = requestAnimationFrame(() => this.tick());
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}

/* ── WORLD MAP RENDERER ───────────────────────────────────── */
class WorldMapRenderer {
  constructor(canvas, cities) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.cities  = cities;
    this.pulses  = [];
    this.tooltip = null;
    this.raf     = null;
    this.time    = 0;
    this.init();
  }

  latLngToXY(lat, lng, w, h) {
    const pad = 30;
    const x = ((lng + 180) / 360) * (w - pad * 2) + pad;
    const y = ((90 - lat) / 180)  * (h - pad * 2) + pad;
    return { x, y };
  }

  init() {
    const dpr    = window.devicePixelRatio || 1;
    const rect   = this.canvas.getBoundingClientRect();
    const W      = rect.width  || 900;
    const H      = Math.round(W * 0.5);
    this.canvas.width  = W * dpr;
    this.canvas.height = H * dpr;
    this.canvas.style.height = H + 'px';
    this.ctx.scale(dpr, dpr);
    this.W = W;
    this.H = H;

    this.cityPts = this.cities.map(c => ({
      ...c,
      ...this.latLngToXY(c.lat, c.lng, W, H),
    }));

    this.cities.forEach((_, i) => {
      setTimeout(() => {
        this.spawnPulse(i);
      }, i * 600);
    });

    this.canvas.addEventListener('mousemove', e => this.onMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => {
      if (this.tooltip) {
        this.tooltip.classList.remove('visible');
      }
    });

    this.tick();
  }

  spawnPulse(cityIdx) {
    const c = this.cityPts[cityIdx];
    if (!c) return;
    this.pulses.push({
      x: c.x, y: c.y,
      r: 0,
      maxR: 30 + Math.random() * 15,
      opacity: 0.9,
      speed: 0.5 + Math.random() * 0.3,
    });
    setTimeout(() => this.spawnPulse(cityIdx), 2000 + Math.random() * 3000);
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found = null;
    for (const c of this.cityPts) {
      const dx = mx - c.x;
      const dy = my - c.y;
      if (Math.sqrt(dx*dx + dy*dy) < 16) {
        found = c;
        break;
      }
    }
    if (this.tooltip) {
      if (found) {
        this.tooltip.querySelector('.map-tooltip-city').textContent = `${found.flag} ${found.name}`;
        this.tooltip.querySelector('.map-tooltip-orders').textContent = `${found.orders} orders active`;
        this.tooltip.style.left = (e.clientX - this.canvas.getBoundingClientRect().left + 12) + 'px';
        this.tooltip.style.top  = (e.clientY - this.canvas.getBoundingClientRect().top  - 40) + 'px';
        this.tooltip.classList.add('visible');
      } else {
        this.tooltip.classList.remove('visible');
      }
    }
  }

  drawMap() {
    const { ctx, W, H } = this;

    // Dot grid background
    ctx.save();
    ctx.fillStyle = 'rgba(212,168,67,0.06)';
    const gs = 14;
    for (let x = 0; x < W; x += gs) {
      for (let y = 0; y < H; y += gs) {
        ctx.beginPath();
        ctx.arc(x, y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Simplified continent shapes
    ctx.save();
    ctx.fillStyle   = 'rgba(212,168,67,0.045)';
    ctx.strokeStyle = 'rgba(212,168,67,0.12)';
    ctx.lineWidth   = 1;

    // North America
    ctx.beginPath();
    ctx.moveTo(W*0.08, H*0.12);
    ctx.bezierCurveTo(W*0.22, H*0.06, W*0.30, H*0.08, W*0.32, H*0.16);
    ctx.bezierCurveTo(W*0.34, H*0.28, W*0.30, H*0.38, W*0.26, H*0.50);
    ctx.bezierCurveTo(W*0.24, H*0.58, W*0.20, H*0.62, W*0.18, H*0.68);
    ctx.bezierCurveTo(W*0.15, H*0.72, W*0.14, H*0.62, W*0.12, H*0.56);
    ctx.bezierCurveTo(W*0.06, H*0.45, W*0.04, H*0.32, W*0.06, H*0.22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // South America
    ctx.beginPath();
    ctx.moveTo(W*0.22, H*0.52);
    ctx.bezierCurveTo(W*0.26, H*0.50, W*0.30, H*0.54, W*0.30, H*0.62);
    ctx.bezierCurveTo(W*0.30, H*0.75, W*0.26, H*0.88, W*0.22, H*0.94);
    ctx.bezierCurveTo(W*0.18, H*0.96, W*0.16, H*0.90, W*0.16, H*0.80);
    ctx.bezierCurveTo(W*0.15, H*0.68, W*0.17, H*0.56, W*0.20, H*0.52);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Europe
    ctx.beginPath();
    ctx.moveTo(W*0.44, H*0.10);
    ctx.bezierCurveTo(W*0.50, H*0.08, W*0.55, H*0.10, W*0.56, H*0.18);
    ctx.bezierCurveTo(W*0.57, H*0.25, W*0.54, H*0.32, W*0.50, H*0.36);
    ctx.bezierCurveTo(W*0.47, H*0.38, W*0.44, H*0.36, W*0.42, H*0.30);
    ctx.bezierCurveTo(W*0.40, H*0.22, W*0.41, H*0.14, W*0.44, H*0.10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Africa
    ctx.beginPath();
    ctx.moveTo(W*0.44, H*0.38);
    ctx.bezierCurveTo(W*0.50, H*0.36, W*0.56, H*0.40, W*0.56, H*0.50);
    ctx.bezierCurveTo(W*0.56, H*0.62, W*0.54, H*0.76, W*0.50, H*0.88);
    ctx.bezierCurveTo(W*0.48, H*0.94, W*0.46, H*0.92, W*0.44, H*0.86);
    ctx.bezierCurveTo(W*0.40, H*0.74, W*0.40, H*0.58, W*0.42, H*0.48);
    ctx.bezierCurveTo(W*0.42, H*0.42, W*0.43, H*0.38, W*0.44, H*0.38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Asia
    ctx.beginPath();
    ctx.moveTo(W*0.56, H*0.10);
    ctx.bezierCurveTo(W*0.70, H*0.06, W*0.84, H*0.08, W*0.88, H*0.18);
    ctx.bezierCurveTo(W*0.92, H*0.28, W*0.90, H*0.40, W*0.86, H*0.48);
    ctx.bezierCurveTo(W*0.82, H*0.54, W*0.74, H*0.52, W*0.68, H*0.48);
    ctx.bezierCurveTo(W*0.62, H*0.44, W*0.58, H*0.38, W*0.58, H*0.30);
    ctx.bezierCurveTo(W*0.57, H*0.22, W*0.55, H*0.16, W*0.56, H*0.10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Oceania
    ctx.beginPath();
    ctx.moveTo(W*0.76, H*0.60);
    ctx.bezierCurveTo(W*0.82, H*0.58, W*0.88, H*0.62, W*0.88, H*0.70);
    ctx.bezierCurveTo(W*0.88, H*0.78, W*0.84, H*0.84, W*0.78, H*0.84);
    ctx.bezierCurveTo(W*0.74, H*0.84, W*0.72, H*0.80, W*0.72, H*0.74);
    ctx.bezierCurveTo(W*0.72, H*0.66, W*0.74, H*0.60, W*0.76, H*0.60);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  tick() {
    const { ctx, W, H, time } = this;
    this.time += 0.016;
    ctx.clearRect(0, 0, W, H);

    this.drawMap();

    // Pulse rings
    this.pulses = this.pulses.filter(p => p.r < p.maxR);
    this.pulses.forEach(p => {
      p.r       += p.speed;
      p.opacity  = (1 - p.r / p.maxR) * 0.7;
      if (p.opacity <= 0) return;
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.strokeStyle = '#D4A843';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // City dots
    this.cityPts.forEach((c, i) => {
      const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 12);
      glow.addColorStop(0, 'rgba(212,168,67,0.6)');
      glow.addColorStop(1, 'rgba(212,168,67,0)');
      ctx.save();
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F2C95C';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    this.raf = requestAnimationFrame(() => this.tick());
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}

/* ── AURORA FOOTER EFFECT ─────────────────────────────────── */
class AuroraEffect {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.time   = 0;
    this.raf    = null;
    this.init();
  }

  init() {
    const W = this.canvas.offsetWidth || 1440;
    const H = 200;
    this.canvas.width  = W;
    this.canvas.height = H;
    this.W = W;
    this.H = H;
    this.tick();
  }

  tick() {
    const { ctx, W, H } = this;
    this.time += 0.008;
    const t = this.time;
    ctx.clearRect(0, 0, W, H);

    const colors = ['rgba(212,168,67', 'rgba(124,58,237', 'rgba(14,165,233'];
    colors.forEach((c, i) => {
      const offset = (i * Math.PI * 2) / 3;
      ctx.save();
      ctx.globalAlpha = 0.12 + Math.sin(t + offset) * 0.04;
      const grd = ctx.createLinearGradient(0, 0, W, 0);
      for (let x = 0; x <= 10; x++) {
        const pct = x / 10;
        const wave = Math.sin(t * 1.5 + pct * Math.PI * 4 + offset) * 0.4 + 0.5;
        grd.addColorStop(pct, `${c},${wave.toFixed(2)})`);
      }
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) {
        const y = H * 0.4 + Math.sin(t * 0.8 + x * 0.006 + offset) * H * 0.25 +
                             Math.sin(t * 1.4 + x * 0.012 + offset) * H * 0.15;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    this.raf = requestAnimationFrame(() => this.tick());
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}

/* ── MAGNETIC BUTTON EFFECT ──────────────────────────────── */
function initMagneticButtons() {
  document.querySelectorAll('.btn-primary, .nav-cart-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect   = btn.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = e.clientX - cx;
      const dy     = e.clientY - cy;
      const dist   = Math.sqrt(dx*dx + dy*dy);
      const maxDst = Math.max(rect.width, rect.height) * 0.8;
      if (dist < maxDst) {
        const strength = (1 - dist / maxDst) * 0.35;
        btn.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      }
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ── CUSTOM CURSOR ───────────────────────────────────────── */
function initCursor() {
  const outer = document.querySelector('.cursor-outer');
  const inner = document.querySelector('.cursor-inner');
  if (!outer || !inner) return;

  let ox = 0, oy = 0;
  let tx = 0, ty = 0;

  document.addEventListener('mousemove', e => {
    tx = e.clientX;
    ty = e.clientY;
    inner.style.left = tx + 'px';
    inner.style.top  = ty + 'px';
  });

  const animateCursor = () => {
    ox += (tx - ox) * 0.12;
    oy += (ty - oy) * 0.12;
    outer.style.left = ox + 'px';
    outer.style.top  = oy + 'px';
    requestAnimationFrame(animateCursor);
  };
  animateCursor();

  document.querySelectorAll('button, a, .feed-card, .flash-card, .col-card, .mystery-box').forEach(el => {
    el.addEventListener('mouseenter', () => outer.classList.add('hovering'));
    el.addEventListener('mouseleave', () => outer.classList.remove('hovering'));
  });
}

/* ── SCROLL REVEAL ───────────────────────────────────────── */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ── NUMBER COUNTER ANIMATION ────────────────────────────── */
function animateCounter(el, target, duration = 2000, prefix = '', suffix = '') {
  const start     = performance.now();
  const startVal  = 0;
  const update    = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    const val      = Math.floor(eased * target);
    el.textContent = prefix + val.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function initCounters() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el  = e.target;
        const val = parseFloat(el.dataset.count);
        const sfx = el.dataset.suffix || '';
        const pfx = el.dataset.prefix || '';
        animateCounter(el, val, 2200, pfx, sfx);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
}

window.AUREX_FX = {
  NebulaCoreEffect,
  WorldMapRenderer,
  AuroraEffect,
  initMagneticButtons,
  initCursor,
  initScrollReveal,
  initCounters,
};
