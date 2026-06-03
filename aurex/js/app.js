/* AUREX Application Core — Interactions, State, UI */

class AurexApp {
  constructor() {
    this.cart     = [];
    this.effects  = [];
    this.feedIdx  = 0;
    this.init();
  }

  init() {
    this.waitForDOMContent().then(() => {
      this.initLoading();
      this.initNav();
      this.initTicker();
      this.initDiscoveryFeed();
      this.initFlashDeals();
      this.initGamification();
      this.initCart();
      this.initWorldMap();
      this.initCollections();
      this.initMembership();
      this.initMysteryBox();
      this.initHeroShowcase();
      AUREX_FX.initCursor();
      AUREX_FX.initScrollReveal();
      AUREX_FX.initCounters();
      AUREX_FX.initMagneticButtons();
      this.initHeroParticles();
      this.initAurora();
    });
  }

  waitForDOMContent() {
    return new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  /* ─── LOADING SCREEN ─────────────────────────────────────── */
  initLoading() {
    const screen = document.getElementById('loading-screen');
    if (!screen) return;
    setTimeout(() => {
      screen.classList.add('hidden');
      document.body.style.overflow = '';
    }, 2200);
    document.body.style.overflow = 'hidden';
  }

  /* ─── NAVIGATION ─────────────────────────────────────────── */
  initNav() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* ─── HERO PARTICLE CANVAS ───────────────────────────────── */
  initHeroParticles() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const fx = new AUREX_FX.NebulaCoreEffect(canvas);
    this.effects.push(fx);
  }

  /* ─── AURORA FOOTER ──────────────────────────────────────── */
  initAurora() {
    const canvas = document.getElementById('aurora-canvas');
    if (!canvas) return;
    const fx = new AUREX_FX.AuroraEffect(canvas);
    this.effects.push(fx);
  }

  /* ─── HERO SHOWCASE ──────────────────────────────────────── */
  initHeroShowcase() {
    const face = document.querySelector('.product-face');
    if (!face) return;
    const products = AUREX.products;
    let idx = 0;
    const cycle = () => {
      idx = (idx + 1) % products.length;
      const p = products[idx];
      const emojiEl = face.querySelector('.product-face-emoji');
      const nameEl  = face.querySelector('.product-face-name');
      const priceEl = face.querySelector('.product-face-price');
      if (emojiEl) emojiEl.textContent = p.emoji;
      if (nameEl)  nameEl.textContent  = p.name;
      if (priceEl) priceEl.textContent = `$${p.price.toLocaleString()}`;
      face.style.background = p.gradient;
    };
    setInterval(cycle, 4000);
  }

  /* ─── LIVE TICKER ─────────────────────────────────────────── */
  initTicker() {
    const track = document.querySelector('.ticker-items');
    if (!track) return;
    const orders = AUREX.liveOrders;
    const makeItem = o => {
      const div   = document.createElement('div');
      div.className = 'ticker-item';
      div.innerHTML = `
        <span class="ticker-flag">${o.flag}</span>
        <span class="ticker-name">${o.name}</span>
        <span class="ticker-product">claimed <strong>${o.product}</strong></span>
        <span class="ticker-amount">$${o.amount.toLocaleString()}</span>
        <span class="ticker-time">${o.time}</span>
      `;
      return div;
    };
    [...orders, ...orders].forEach(o => track.appendChild(makeItem(o)));
  }

  /* ─── DISCOVERY FEED ─────────────────────────────────────── */
  initDiscoveryFeed() {
    const track = document.querySelector('.feed-track');
    if (!track) return;
    AUREX.products.forEach((p, i) => {
      const card = this.buildFeedCard(p, i);
      track.appendChild(card);
    });

    const prevBtn = document.querySelector('.discovery-nav-btn.prev');
    const nextBtn = document.querySelector('.discovery-nav-btn.next');
    if (prevBtn) prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -360, behavior: 'smooth' });
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: 360, behavior: 'smooth' });
    });
  }

  buildFeedCard(p, i) {
    const card = document.createElement('div');
    card.className = 'feed-card reveal reveal-delay-' + ((i % 4) + 1);
    card.innerHTML = `
      <div class="feed-card-bg" style="background:${p.gradient}"></div>
      <div class="feed-card-overlay"></div>
      <div class="feed-card-emoji-bg">${p.emoji}</div>
      <div class="feed-progress">
        <div class="feed-progress-bar" style="width:${p.sold}%"></div>
      </div>
      <div class="feed-card-rating">★ ${p.rating}</div>
      <div class="feed-card-content">
        <div class="feed-card-badge">
          <span class="badge badge-${p.badgeType}">${p.badge}</span>
        </div>
        <div class="feed-card-name">${p.name}</div>
        <div class="feed-card-cat">${p.category} · ${p.tag}</div>
        <div class="feed-card-bottom">
          <div>
            <div class="feed-card-price">$${p.price.toLocaleString()}</div>
            ${p.originalPrice !== p.price
              ? `<div class="feed-card-original">$${p.originalPrice.toLocaleString()}</div>`
              : ''}
          </div>
          <div class="feed-card-action">+</div>
        </div>
      </div>
    `;
    card.querySelector('.feed-card-action').addEventListener('click', (e) => {
      e.stopPropagation();
      this.addToCart(p);
    });
    card.addEventListener('click', () => this.addToCart(p));
    return card;
  }

  /* ─── FLASH DEALS ────────────────────────────────────────── */
  initFlashDeals() {
    const grid = document.querySelector('.flash-grid');
    if (!grid) return;
    AUREX.flashDeals.forEach((deal, i) => {
      const card = this.buildFlashCard(deal);
      card.classList.add('reveal', `reveal-delay-${(i % 4) + 1}`);
      grid.appendChild(card);
    });
    this.startFlashCountdowns();
    this.startGlobalFlashTimer();
  }

  buildFlashCard(deal) {
    const card = document.createElement('div');
    card.className = 'flash-card';
    card.dataset.dealId = deal.id;
    const urgencyPct = deal.claimed >= 90;
    card.innerHTML = `
      <div class="flash-card-bg" style="background:${deal.gradient}">
        ${urgencyPct ? `<div class="flash-card-urgency"><span class="urgency-dot"></span>Final ${100 - deal.claimed}%</div>` : ''}
        <div class="flash-card-emoji">${deal.emoji}</div>
        <div class="flash-discount">−${deal.discount}% OFF</div>
        <div class="flash-card-name">${deal.name}</div>
        <div class="flash-prices">
          <span class="flash-price-new">$${deal.flashPrice.toLocaleString()}</span>
          <span class="flash-price-old">$${deal.originalPrice.toLocaleString()}</span>
        </div>
        <div class="flash-claimed-bar">
          <div class="flash-claimed-track">
            <div class="flash-claimed-fill" style="width:${deal.claimed}%"></div>
          </div>
          <div class="flash-claimed-text">
            <span>${deal.claimed >= 90 ? '🔥 Almost gone' : `${deal.claimed}% claimed`}</span>
            <span class="flash-claimed-pct">${deal.claimed}/${deal.total}</span>
          </div>
        </div>
        <div class="flash-countdown-row" data-ends="${deal.endsIn}">
          <div class="flash-cd-unit">
            <div class="flash-cd-num cd-h">00</div>
            <div class="flash-cd-label">Hrs</div>
          </div>
          <div class="flash-cd-unit">
            <div class="flash-cd-num cd-m">00</div>
            <div class="flash-cd-label">Min</div>
          </div>
          <div class="flash-cd-unit">
            <div class="flash-cd-num cd-s">00</div>
            <div class="flash-cd-label">Sec</div>
          </div>
        </div>
        <button class="flash-card-btn">Claim Deal — $${deal.flashPrice.toLocaleString()}</button>
      </div>
    `;
    card.querySelector('.flash-card-btn').addEventListener('click', () => {
      this.addToCart({ id: deal.id, name: deal.name, price: deal.flashPrice, emoji: deal.emoji });
    });
    return card;
  }

  startFlashCountdowns() {
    const timers = {};
    document.querySelectorAll('.flash-countdown-row').forEach(row => {
      let secs = parseInt(row.dataset.ends, 10);
      timers[row] = setInterval(() => {
        secs = Math.max(0, secs - 1);
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        const fmt = n => String(n).padStart(2, '0');
        row.querySelector('.cd-h').textContent = fmt(h);
        row.querySelector('.cd-m').textContent = fmt(m);
        row.querySelector('.cd-s').textContent = fmt(s);
      }, 1000);
    });
  }

  startGlobalFlashTimer() {
    const els = {
      h: document.getElementById('gfc-h'),
      m: document.getElementById('gfc-m'),
      s: document.getElementById('gfc-s'),
    };
    if (!els.h) return;
    let secs = 11 * 3600 + 47 * 60 + 33;
    const fmt = n => String(n).padStart(2, '0');
    const tick = () => {
      secs = Math.max(0, secs - 1);
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      if (els.h) els.h.textContent = fmt(h);
      if (els.m) els.m.textContent = fmt(m);
      if (els.s) els.s.textContent = fmt(s);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ─── WORLD MAP ──────────────────────────────────────────── */
  initWorldMap() {
    const canvas  = document.getElementById('world-canvas');
    if (!canvas) return;
    const tooltip = document.querySelector('.map-tooltip');
    const renderer = new AUREX_FX.WorldMapRenderer(canvas, AUREX.worldCities);
    renderer.tooltip = tooltip;
    this.effects.push(renderer);
  }

  /* ─── GAMIFICATION ───────────────────────────────────────── */
  initGamification() {
    this.buildAchievements();
    this.buildLeaderboard();
  }

  buildAchievements() {
    const grid = document.querySelector('.achievements-grid');
    if (!grid) return;
    AUREX.achievements.forEach((a, i) => {
      const card = document.createElement('div');
      card.className = `achievement-card reveal reveal-delay-${(i % 4) + 1} ${a.unlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="achievement-xp">+${a.xp} XP</div>
        <div class="achievement-icon">${a.icon}</div>
        <div class="achievement-name">${a.name}</div>
        <div class="achievement-desc">${a.desc}</div>
      `;
      grid.appendChild(card);
    });
  }

  buildLeaderboard() {
    const list = document.querySelector('.leaderboard-list');
    if (!list) return;
    AUREX.leaderboard.forEach((entry, i) => {
      const item = document.createElement('div');
      item.className = 'leaderboard-item reveal reveal-delay-' + ((i % 4) + 1);
      item.innerHTML = `
        <div class="leaderboard-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : entry.rank}</div>
        <div class="leaderboard-flag">${entry.flag}</div>
        <div class="leaderboard-info">
          <div class="leaderboard-name">${entry.name}</div>
          <div class="leaderboard-city">${entry.city} · ${entry.tier}</div>
        </div>
        <div class="leaderboard-xp">${entry.xp.toLocaleString()} XP</div>
      `;
      list.appendChild(item);
    });
  }

  /* ─── COLLECTIONS ────────────────────────────────────────── */
  initCollections() {
    const grid = document.querySelector('.collections-grid');
    if (!grid) return;
    AUREX.collections.forEach((col, i) => {
      const card = document.createElement('div');
      card.className = 'col-card reveal reveal-delay-' + ((i % 4) + 1);
      card.innerHTML = `
        <div class="col-card-bg" style="background:${col.gradient}"></div>
        <div class="col-card-overlay"></div>
        <div class="col-card-content">
          <div class="col-card-accent-line" style="background:${col.accent}"></div>
          <div class="col-card-name">${col.name}</div>
          <div class="col-card-desc">${col.desc}</div>
          <div class="col-card-count">${col.count} pieces</div>
        </div>
        <div class="col-card-arrow">↗</div>
      `;
      grid.appendChild(card);
    });
  }

  /* ─── MEMBERSHIP ─────────────────────────────────────────── */
  initMembership() {
    const grid = document.querySelector('.tiers-grid');
    if (!grid) return;
    AUREX.membershipTiers.forEach((tier, i) => {
      const card = document.createElement('div');
      card.className = `tier-card reveal reveal-delay-${i + 1} ${tier.featured ? 'featured' : ''}`;
      const btnClass = tier.featured ? 'tier-cta-gold' : 'tier-cta-ghost';
      card.innerHTML = `
        ${tier.featured ? '<div class="tier-featured-label">Most Popular</div>' : ''}
        <div class="tier-icon">${tier.icon}</div>
        <div class="tier-name" style="color:${tier.color}">${tier.name}</div>
        <div class="tier-price">${tier.price}${tier.price !== 'Free' ? ' <span>billed annually</span>' : ''}</div>
        <div class="tier-benefits">
          ${tier.benefits.map(b => `
            <div class="tier-benefit">
              <div class="benefit-check">✓</div>
              <span>${b}</span>
            </div>`).join('')}
        </div>
        <button class="tier-cta ${btnClass}">
          ${tier.featured ? 'Ascend to Gold' : tier.price === 'Free' ? 'Get Started' : 'Join Platinum ∞'}
        </button>
      `;
      card.querySelector('.tier-cta').addEventListener('click', () => {
        this.showToast(`Welcome to ${tier.name} tier! 🎉`);
      });
      grid.appendChild(card);
    });
  }

  /* ─── MYSTERY BOX ────────────────────────────────────────── */
  initMysteryBox() {
    const box = document.querySelector('.mystery-box');
    if (!box) return;
    const rewards = [
      '🎁 500 XP Bonus unlocked!',
      '⚡ Flash deal early access granted!',
      '💎 Exclusive member discount: 15% OFF!',
      '🏆 Achievement "Lucky Draw" unlocked!',
      '✨ 1,000 XP dropped to your account!',
      '🌟 Gold tier trial extended 30 days!',
    ];
    let opened = false;
    box.addEventListener('click', () => {
      if (opened) return;
      const reward = rewards[Math.floor(Math.random() * rewards.length)];
      box.innerHTML = `
        <div class="mystery-box-icon">🎉</div>
        <div class="mystery-box-title">${reward}</div>
        <div class="mystery-box-sub">Reward applied to your account</div>
      `;
      box.style.borderStyle = 'solid';
      box.style.borderColor = 'var(--gold-2)';
      opened = true;
      this.showToast(reward);
    });
  }

  /* ─── CART ───────────────────────────────────────────────── */
  initCart() {
    const overlay   = document.getElementById('cart-overlay');
    const drawer    = document.getElementById('cart-drawer');
    const closeBtn  = document.getElementById('cart-close');
    const cartBtn   = document.querySelector('.nav-cart-btn');

    if (cartBtn) cartBtn.addEventListener('click', () => this.openCart());
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeCart());
    if (overlay) overlay.addEventListener('click', () => this.closeCart());
  }

  addToCart(product) {
    this.cart.push({ ...product, cartId: Date.now() });
    this.updateCartUI();
    this.showToast(`${product.emoji || '🛒'} Added to your vault`);
  }

  updateCartUI() {
    const count = document.querySelector('.cart-count');
    if (count) count.textContent = this.cart.length;

    const itemsContainer = document.querySelector('.cart-items');
    const emptyState     = document.querySelector('.cart-empty');
    const total          = document.querySelector('.cart-total-num');

    if (!itemsContainer) return;

    if (this.cart.length === 0) {
      if (emptyState) emptyState.style.display = '';
      itemsContainer.querySelectorAll('.cart-item').forEach(el => el.remove());
      if (total) total.textContent = '$0';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    itemsContainer.querySelectorAll('.cart-item').forEach(el => el.remove());

    this.cart.forEach(item => {
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.dataset.cartId = item.cartId;
      el.innerHTML = `
        <div class="cart-item-emoji" style="background:${item.gradient || 'var(--surface-3)'}">
          ${item.emoji || '📦'}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${item.price.toLocaleString()}</div>
        </div>
        <button class="cart-item-remove">✕</button>
      `;
      el.querySelector('.cart-item-remove').addEventListener('click', () => {
        this.cart = this.cart.filter(c => c.cartId !== item.cartId);
        this.updateCartUI();
      });
      itemsContainer.appendChild(el);
    });

    const sum = this.cart.reduce((a, c) => a + c.price, 0);
    if (total) total.textContent = '$' + sum.toLocaleString();
  }

  openCart() {
    document.getElementById('cart-overlay')?.classList.add('active');
    document.getElementById('cart-drawer')?.classList.add('active');
  }

  closeCart() {
    document.getElementById('cart-overlay')?.classList.remove('active');
    document.getElementById('cart-drawer')?.classList.remove('active');
  }

  /* ─── TOAST ──────────────────────────────────────────────── */
  showToast(msg) {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('exit');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3200);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.aurexApp = new AurexApp();
});
