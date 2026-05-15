/* ===== SOUND SYSTEM ===== */
let _soundOn = localStorage.getItem('exg_sound') !== 'off';
let _audioCtx = null;

function _getAudioCtx() {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function _note(ctx, freq, type, vol, start, dur) {
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = type; osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.start(start); osc.stop(start + dur + 0.01);
}

function _playNavSound(navType) {
  if (!_soundOn) return;
  try {
    const ctx = _getAudioCtx();
    const t   = ctx.currentTime;

    if (navType === 'shop') {
      // Crystal bell — C6 + overtones, long shimmer (home feeling)
      _note(ctx, 1047, 'sine', 0.055, t,      0.6);
      _note(ctx, 2093, 'sine', 0.022, t,      0.4);
      _note(ctx, 3136, 'sine', 0.010, t,      0.25);

    } else if (navType === 'cat') {
      // Wood marimba — E5 triangle, warm plunk
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'triangle'; osc.frequency.setValueAtTime(659, t);
      osc.frequency.exponentialRampToValueAtTime(638, t + 0.12);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      osc.start(t); osc.stop(t + 0.27);
      // click attack
      _note(ctx, 320, 'sine', 0.04, t, 0.018);

    } else if (navType === 'trend') {
      // Lightning spark — two rising notes E5→B5, snappy & electric
      _note(ctx, 659, 'sine', 0.065, t,       0.14);
      _note(ctx, 988, 'sine', 0.065, t + 0.08, 0.18);
      // tiny fizz on second note
      const w = ctx.createOscillator(), wg = ctx.createGain();
      w.connect(wg); wg.connect(ctx.destination);
      w.type = 'sawtooth'; w.frequency.setValueAtTime(988, t + 0.08);
      wg.gain.setValueAtTime(0.012, t + 0.08);
      wg.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      w.start(t + 0.08); w.stop(t + 0.16);

    } else if (navType === 'cart') {
      // Ka-ching major arpeggio — C5→E5→G5, rewarding
      _note(ctx, 523, 'sine', 0.062, t,        0.22);
      _note(ctx, 659, 'sine', 0.062, t + 0.07, 0.22);
      _note(ctx, 784, 'sine', 0.062, t + 0.14, 0.28);
      // sparkle on top note
      _note(ctx, 1568, 'sine', 0.020, t + 0.14, 0.18);

    } else if (navType === 'me') {
      // Warm personal glow — A5 bending to G5, with soft overtone
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(784, t + 0.18);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.055, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      osc.start(t); osc.stop(t + 0.39);
      _note(ctx, 1760, 'sine', 0.018, t, 0.20);
    }
  } catch(e) {}
}

function _playTick(type) {
  if (!_soundOn) return;
  try {
    const ctx = _getAudioCtx();
    const t   = ctx.currentTime;

    if (type === 'cart') {
      // Cart-add voice handled by _playCartSound; this chime plays on cart tab open
      _note(ctx, 880,  'sine', 0.062, t,       0.16);
      _note(ctx, 1320, 'sine', 0.048, t + 0.07, 0.16);

    } else if (type === 'toggle') {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(280, t + 0.06);
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      osc.start(t); osc.stop(t + 0.08);

    } else {
      // Default: crispy iOS-style tap — quick bright click
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(1100, t);
      osc.frequency.exponentialRampToValueAtTime(680, t + 0.045);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);
      osc.start(t); osc.stop(t + 0.07);
    }
  } catch(e) {}
}

function toggleSound(el) {
  _soundOn = !_soundOn;
  localStorage.setItem('exg_sound', _soundOn ? 'on' : 'off');
  if (el) {
    el.classList.toggle('on', _soundOn);
    el.setAttribute('aria-checked', _soundOn);
  }
  if (_soundOn) _playNavSound('shop');
}

// Global click sound listener
document.addEventListener('click', e => {
  const el = e.target.closest(
    'button, a, .product-card, .filter-btn, .sort-btn, .lang-btn, .size-opt, .color-opt, ' +
    '.wish-btn, .hc-fab, .me-list-item, .me-block-header, .settings-item, ' +
    '.tab-btn, .nav-btn, .bot-nav-btn, .hc-faq-q, .modal-thumb, .me-edit-pill, ' +
    '.flash-card, [onclick]'
  );
  if (!el) return;
  // Nav buttons get unique sounds
  const navSound = el.dataset.sound;
  if (navSound) {
    _playNavSound(navSound);
  } else if (el.classList.contains('add-cart-btn') || el.classList.contains('btn-add-cart') || el.classList.contains('wish-add-cart')) {
    _playTick('cart');
  } else if (el.tagName === 'INPUT' || el.type === 'checkbox') {
    // skip inputs
  } else {
    _playTick();
  }
}, { passive: true });

/* ===== STATE ===== */
let cart = JSON.parse(localStorage.getItem('exg_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('exglobal_wishlist') || '[]');
let currentFilter = 'all';
let currentSort = 'default';
let visibleCount = 8;
let currentLang = 'en';
let selectedSize = '';
let selectedColor = '';
let _modalQty = 1;
let heroIndex = 0;
let heroTimer;
let currentTheme = localStorage.getItem('exglobal_theme') || 'light';

/* ===== PUBLISHED DATA SYNC ===== */
async function loadPublishedData() {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch('data/store-data.json?t=' + Date.now(), { cache: 'no-store', signal: ctrl.signal });
    clearTimeout(tid);
    if (!r.ok) return;
    const d = await r.json();
    if (!d || !d.published_at) return;
    // If admin made local edits AFTER the last publish, keep local data
    const publishedAt = new Date(d.published_at).getTime();
    const lastEdit = new Date(localStorage.getItem('exg_last_admin_edit') || 0).getTime();
    if (lastEdit > publishedAt) return;
    const map = {
      'exg_products_custom': d.products_custom,
      'exg_products_added':  d.products_added,
      'exg_products_deleted':d.products_deleted,
      'exg_hero_slides':     d.hero_slides,
      'exg_settings':        d.settings,
      'exg_social_links':    d.social_links,
      'exg_flash_pins':      d.flash_pins,
      'exg_super_pins':      d.super_pins,
      'exg_trend_pins':      d.trend_pins,
      'exg_extra_coupons':   d.coupons,
      'exg_city_video':      d.city_video,
    };
    Object.entries(map).forEach(([k, v]) => { if (v !== undefined) localStorage.setItem(k, JSON.stringify(v)); });
  } catch(e) {}
}

/* ===== ADMIN PRODUCT OVERRIDES ===== */
function _applyProductOverrides() {
  try{
    const c=JSON.parse(localStorage.getItem('exg_products_custom')||'{}');
    const a=JSON.parse(localStorage.getItem('exg_products_added')||'[]');
    const d=JSON.parse(localStorage.getItem('exg_products_deleted')||'[]');
    for(let i=PRODUCTS.length-1;i>=0;i--){
      if(d.includes(PRODUCTS[i].id))PRODUCTS.splice(i,1);
      else if(c[PRODUCTS[i].id])Object.assign(PRODUCTS[i],c[PRODUCTS[i].id]);
    }
    PRODUCTS.push(...a);
  }catch(e){}
}

/* ===== THEME ===== */
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('exglobal_theme', theme);
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}
function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

/* ===== i18n ===== */
function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) ||
         (TRANSLATIONS.en[key]) || key;
}

function fmt(price) {
  const T = TRANSLATIONS[currentLang];
  const val = Math.round(price * T.rate);
  return T.currency + val.toLocaleString();
}

function getName(p) {
  return (p.names && p.names[currentLang]) || p.names.en || '';
}

function applyTranslations() {
  const T = TRANSLATIONS[currentLang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (T[key] !== undefined) el.textContent = T[key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (T[key] !== undefined) el.innerHTML = T[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (T[key] !== undefined) el.placeholder = T[key];
  });
}

function setLang(lang) {
  currentLang = lang;
  const T = TRANSLATIONS[lang];
  document.documentElement.dir = T.dir;
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  applyTranslations();
  _applySocialLinks();
  renderFlashDeals();
  renderSuperDeals();
  renderTrending();
  const si = document.getElementById('searchInput');
  renderProducts(si ? si.value : '');
  renderCart();
  // refresh reviews entry strip count
  const ec = document.getElementById('revEntryCount');
  const stored = JSON.parse(localStorage.getItem('exglobal_reviews')||'[]');
  if (ec) ec.textContent = (stored.length + 1253).toLocaleString() + ' ' + (t('reviewsLabel')||'reviews');
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', async () => {
  await loadPublishedData(); // sync published data before rendering
  _applyProductOverrides();  // apply product additions/edits/deletions
  // Apply admin settings (delivery charge, free delivery threshold)
  try{const s=JSON.parse(localStorage.getItem('exg_settings')||'{}');if(s.delivery!==undefined)DELIVERY_SAR=parseFloat(s.delivery)||0;if(s.freeDelivery)FREE_DELIVERY_THRESHOLD_SAR=parseFloat(s.freeDelivery)||100;if(s.vatRate!==undefined)VAT_RATE=parseFloat(s.vatRate)||0;}catch(e){}
  applyTheme(currentTheme);
  setLang('en');
  updateWishBadge();
  renderFlashDeals();
  renderSuperDeals();
  renderTrending();
  renderProducts();
  startHeroSlider();
  // Deep link: auto-open product from URL ?p=ID
  const pid = new URLSearchParams(location.search).get('p');
  if (pid) setTimeout(() => openModal(parseInt(pid)), 400);
  startCountdown();
  setupEvents();
  // Scroll-to-top visibility
  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 320);
    }, { passive: true });
  }
  _applyHeroOverrides();
  _applySocialLinks();
  _applyAnnouncement();
  _loadCityVideo();
  _applyCatImages();
});

/* ===== CATEGORY IMAGES OVERRIDE ===== */
function _applyCatImages() {
  try {
    const saved = JSON.parse(localStorage.getItem('exg_cat_images') || '{}');
    Object.entries(saved).forEach(([key, url]) => {
      const cards = document.querySelectorAll(`.cat-arch-card[data-cat="${key}"] .cat-arch-inner img`);
      cards.forEach(img => { if (url) img.src = url; });
    });
    // Custom category slots (custom1..custom10)
    const customCats = JSON.parse(localStorage.getItem('exg_custom_cats') || '{}');
    for (let i = 1; i <= 10; i++) {
      const key = 'custom' + i;
      const card = document.querySelector(`.cat-arch-card[data-cat="${key}"]`);
      if (!card) continue;
      const data = customCats[key];
      if (data && data.name && data.img) {
        card.style.display = '';
        const img = card.querySelector('.cat-arch-inner img');
        if (img) img.src = data.img;
        const label = card.querySelector('.cat-custom-label');
        if (label) label.textContent = data.name;
      } else {
        card.style.display = 'none';
      }
    }
  } catch(e) {}
}

/* ===== ADMIN SITE OVERRIDES ===== */
function _applyHeroOverrides() {
  try {
    const slides = JSON.parse(localStorage.getItem('exg_hero_slides') || '[]');
    slides.forEach((s, i) => {
      if (!s) return;
      const slide = document.querySelector('.hero-slide.slide-' + (i + 1));
      if (!slide) return;

      // Update image
      const imgEl = slide.querySelector('.hero-slide-img');
      if (s.image && imgEl) imgEl.src = s.image;

      // Video — replace image with video/iframe
      let existingVideo = slide.querySelector('.hero-slide-video');
      if (s.video) {
        let embedUrl = '';
        const ytMatch = s.video.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&playsinline=1&autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}`;
        const ttMatch = s.video.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
        if (ttMatch) embedUrl = `https://www.tiktok.com/embed/v2/${ttMatch[1]}`;
        const isDirectVideo = !embedUrl && (s.video.includes('cloudinary.com') || s.video.match(/\.(mp4|webm|mov)(\?|$)/i));
        if (embedUrl || isDirectVideo) {
          if (imgEl) imgEl.style.display = 'none';
          if (!existingVideo) {
            existingVideo = document.createElement('div');
            existingVideo.className = 'hero-slide-video';
            slide.appendChild(existingVideo);
          }
          existingVideo.innerHTML = isDirectVideo
            ? `<video src="${s.video}" autoplay muted loop playsinline></video>`
            : `<iframe src="${embedUrl}" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
        }
      } else if (existingVideo) {
        existingVideo.remove();
        if (imgEl) imgEl.style.display = '';
      }
    });
  } catch(e) {}
}

function _applySocialLinks() {
  try {
    const soc = JSON.parse(localStorage.getItem('exg_social_links') || '{}');
    const settings = JSON.parse(localStorage.getItem('exg_settings') || '{}');
    if (soc.tiktok) document.querySelectorAll('.soc-tiktok').forEach(a => a.href = soc.tiktok);
    if (soc.facebook) document.querySelectorAll('.soc-fb').forEach(a => a.href = soc.facebook);
    if (soc.instagram) document.querySelectorAll('.soc-ig').forEach(a => a.href = soc.instagram);
    if (soc.youtube) document.querySelectorAll('.soc-yt').forEach(a => { a.href = soc.youtube; a.style.display = ''; });
    if (settings.whatsapp) {
      const waNum = settings.whatsapp;
      const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const waMsg = encodeURIComponent(T.waMsg || 'Hello, I have a question.');
      document.querySelectorAll('.soc-wa').forEach(a => a.href = 'https://wa.me/' + waNum + '?text=' + waMsg);
    }
  } catch(e) {}
}

function _applyAnnouncement() {
  try {
    const s = JSON.parse(localStorage.getItem('exg_settings') || '{}');
    if (!s.announcement) return;
    const banner = document.getElementById('announceBanner');
    if (banner) {
      document.getElementById('announceTxt').textContent = s.announcement;
      if (!sessionStorage.getItem('announce_dismissed')) banner.style.display = 'flex';
    }
  } catch(e) {}
}

function _loadCityVideo() {
  const url = (localStorage.getItem('exg_city_video') || '').trim();
  const section = document.getElementById('cityVideoSection');
  const content = document.getElementById('cityVideoContent');
  if (!section || !content) return;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    content.innerHTML = `<div class="city-video-wrap"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1" frameborder="0" allow="encrypted-media; fullscreen" allowfullscreen loading="lazy"></iframe></div>`;
    section.style.display = 'block';
  } else if (url && (url.includes('cloudinary.com') || url.match(/\.(mp4|webm|mov)(\?|$)/i))) {
    content.innerHTML = `<div class="city-video-wrap"><video src="${url}" autoplay muted loop playsinline></video></div>`;
    section.style.display = 'block';
  } else {
    section.style.display = 'none';
  }
}

/* ===== HERO SLIDER ===== */
function startHeroSlider() {
  heroTimer = setInterval(nextSlide, 3500);
  document.querySelectorAll('.hero-dot').forEach((dot, i) => {
    dot.addEventListener('click', () => goSlide(i));
  });
}
function nextSlide() {
  heroIndex = (heroIndex + 1) % 5;
  updateSlider();
}
function goSlide(i) {
  clearInterval(heroTimer);
  heroIndex = i;
  updateSlider();
  heroTimer = setInterval(nextSlide, 3500);
}
function updateSlider() {
  document.getElementById('heroSlides').style.transform = `translateX(-${heroIndex * 100}%)`;
  document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === heroIndex));
}

/* ===== COUNTDOWN ===== */
function startCountdown() {
  let h = 5, m = 29, s = 59;
  setInterval(() => {
    s--;
    if (s < 0) { s = 59; m--; }
    if (m < 0) { m = 59; h--; }
    if (h < 0) { h = 5; m = 59; s = 59; }
    document.getElementById('hours').textContent = String(h).padStart(2, '0');
    document.getElementById('minutes').textContent = String(m).padStart(2, '0');
    document.getElementById('seconds').textContent = String(s).padStart(2, '0');
  }, 1000);
}

/* ===== RENDER FLASH DEALS ===== */
function renderFlashDeals() {
  const pins = JSON.parse(localStorage.getItem('exg_flash_pins') || 'null');
  const items = pins
    ? pins.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 6)
    : PRODUCTS.filter(p => p.discount >= 45).slice(0, 6);
  document.getElementById('flashProducts').innerHTML = items.map(p => `
    <div class="flash-card" onclick="openModal(${p.id})">
      <div class="product-img-wrap">
        <img src="${p.image}" loading="lazy" alt="" ${p.imgFocus ? `style="object-position:${p.imgFocus.x}% ${p.imgFocus.y}%;transform:scale(${p.imgFocus.scale});transform-origin:${p.imgFocus.x}% ${p.imgFocus.y}%"` : ''} />
        <span class="discount-badge">-${p.discount}%</span>
      </div>
      <div class="product-info">
        <div class="product-prices"><span class="price-current">${fmt(p.price)}</span></div>
        <div class="product-meta"><span class="product-rating">★ ${p.rating}</span></div>
      </div>
    </div>
  `).join('');
}

/* ===== RENDER SUPER DEALS ===== */
function renderSuperDeals() {
  const pins = JSON.parse(localStorage.getItem('exg_super_pins') || 'null');
  const items = pins
    ? pins.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 4)
    : PRODUCTS.filter(p => p.tag === 'sale' || p.tag === 'hot').slice(0, 4);
  document.getElementById('superDeals').innerHTML = items.map(p => `
    <div class="product-card small" onclick="openModal(${p.id})">
      <div class="product-img-wrap">
        <img src="${p.image}" loading="lazy" alt="" ${p.imgFocus ? `style="object-position:${p.imgFocus.x}% ${p.imgFocus.y}%;transform:scale(${p.imgFocus.scale});transform-origin:${p.imgFocus.x}% ${p.imgFocus.y}%"` : ''} />
        <span class="discount-badge">-${p.discount}%</span>
      </div>
      <div class="product-info">
        <p class="product-name">${getName(p)}</p>
        <div class="product-prices"><span class="price-current">${fmt(p.price)}</span></div>
      </div>
    </div>
  `).join('');
}

/* ===== RENDER TRENDING ===== */
function renderTrending() {
  const pins = JSON.parse(localStorage.getItem('exg_trend_pins') || 'null');
  const items = pins
    ? pins.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 4)
    : PRODUCTS.filter(p => p.tag === 'bestseller' || p.tag === 'new').slice(0, 4);
  document.getElementById('trendingProducts').innerHTML = items.map(p => `
    <div class="product-card small" onclick="openModal(${p.id})">
      <div class="product-img-wrap">
        <img src="${p.image}" loading="lazy" alt="" ${p.imgFocus ? `style="object-position:${p.imgFocus.x}% ${p.imgFocus.y}%;transform:scale(${p.imgFocus.scale});transform-origin:${p.imgFocus.x}% ${p.imgFocus.y}%"` : ''} />
        <span class="discount-badge">-${p.discount}%</span>
      </div>
      <div class="product-info">
        <p class="product-name">${getName(p)}</p>
        <div class="product-prices"><span class="price-current">${fmt(p.price)}</span></div>
      </div>
    </div>
  `).join('');
}

/* ===== RENDER PRODUCTS ===== */
function renderProducts(searchTerm = '') {
  let filtered = currentFilter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === currentFilter);

  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(p =>
      getName(p).toLowerCase().includes(s) || p.category.includes(s)
    );
  }

  if (currentSort === 'low') filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (currentSort === 'high') filtered = [...filtered].sort((a, b) => b.price - a.price);
  else if (currentSort === 'popular') filtered = [...filtered].sort((a, b) => b.ratingCount - a.ratingCount);

  const grid = document.getElementById('productsGrid');
  const visible = filtered.slice(0, visibleCount);

  if (visible.length === 0) {
    grid.innerHTML = `<div class="no-results"><i class="fas fa-search"></i><p>${t('noResults')}</p></div>`;
    document.getElementById('loadMoreBtn').style.display = 'none';
    return;
  }

  grid.innerHTML = visible.map(p => productCardHTML(p)).join('');
  document.getElementById('loadMoreBtn').style.display =
    visibleCount >= filtered.length ? 'none' : 'block';
}

function productCardHTML(p) {
  const inWish = wishlist.includes(p.id);
  return `
    <div class="product-card" onclick="openModal(${p.id})">
      <div class="product-img-wrap">
        <img src="${p.image}" loading="lazy" alt="" ${p.imgFocus ? `style="object-position:${p.imgFocus.x}% ${p.imgFocus.y}%;transform:scale(${p.imgFocus.scale});transform-origin:${p.imgFocus.x}% ${p.imgFocus.y}%"` : ''} />
        <span class="discount-badge">-${p.discount}%</span>
        <button class="wish-btn ${inWish ? 'active' : ''}"
          onclick="event.stopPropagation();toggleWish(${p.id},this)">
          <i class="${inWish ? 'fas' : 'far'} fa-heart"></i>
        </button>
      </div>
      <div class="product-info">
        <p class="product-name">${getName(p)}</p>
        <div class="product-prices">
          <span class="price-current">${fmt(p.price)}</span>
          <span class="price-original">${fmt(p.originalPrice)}</span>
          ${VAT_RATE > 0 ? `<span class="price-vat-badge">${(t('vatIncl')||'incl.{r}%VAT').replace('{r}',VAT_RATE)}</span>` : ''}
        </div>
        <div class="product-meta">
          <span class="product-rating">★ ${p.rating} (${p.ratingCount.toLocaleString()})</span>
          <span class="product-sold">${p.sold} ${t('soldText')}</span>
        </div>
        ${p.stock === 0 ? `<div class="stock-badge out">${t('outOfStock')}</div>` : p.stock !== undefined && p.stock <= 5 ? `<div class="stock-badge low">${(t('lowStock')||'Only {n} left!').replace('{n}',p.stock)}</div>` : p.stock !== undefined ? `<div class="stock-badge ok">${(t('inStock')||'{n} in stock').replace('{n}',p.stock)}</div>` : ''}
      </div>
      <button class="add-cart-btn${p.stock === 0 ? ' disabled' : ''}" onclick="event.stopPropagation();${p.stock === 0 ? '' : `flyCartAdd(event,${p.id})`}" ${p.stock === 0 ? 'style="opacity:.45;cursor:not-allowed"' : ''}>
        ${p.stock === 0 ? t('outOfStock') : t('addToCart')}
      </button>
    </div>
  `;
}

/* ===== FILTER ===== */
function filterCategory(cat) {
  currentFilter = cat;
  visibleCount = 8;
  currentSort = 'default';
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-sort="default"]').classList.add('active');
  renderProducts();
  document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToProducts() {
  document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth' });
}

/* ===== SETUP EVENTS ===== */
function setupEvents() {
  document.addEventListener('click', e => {
    if (!e.target.closest('.rev-reactions')) {
      document.querySelectorAll('.emoji-picker.open').forEach(p => p.classList.remove('open'));
    }
  });

  document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterCategory(tab.dataset.cat);
    });
  });

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      visibleCount = 8;
      renderProducts(document.getElementById('searchInput').value);
    });
  });

  document.getElementById('loadMoreBtn').addEventListener('click', () => {
    visibleCount += 8;
    renderProducts(document.getElementById('searchInput').value);
  });

  document.getElementById('searchToggleBtn').addEventListener('click', () => {
    document.getElementById('searchBar').classList.toggle('open');
    if (document.getElementById('searchBar').classList.contains('open')) {
      document.getElementById('searchInput').focus();
    }
  });
  document.getElementById('searchInput').addEventListener('input', e => {
    const q = e.target.value.trim();
    visibleCount = 8;
    renderProducts(q);
    showSearchDropdown(q);
  });
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { closeSearchDropdown(); doAiSearch(document.getElementById('searchInput').value.trim()); }
    if (e.key === 'Escape') closeSearchDropdown();
  });
  document.getElementById('searchSubmit').addEventListener('click', () => {
    const q = document.getElementById('searchInput').value.trim();
    closeSearchDropdown();
    visibleCount = 8;
    renderProducts(q);
    doAiSearch(q);
    document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth' });
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#searchBar')) closeSearchDropdown();
  });

  document.getElementById('menuBtn').addEventListener('click', openDrawer);
  document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
  document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('wishlistBtn').addEventListener('click', openWishlist);
}

/* ===== DRAWER ===== */
function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
  const df = document.getElementById('drawerFooter');
  if (df) df.style.display = currentUser ? 'none' : 'flex';
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
}

/* ===== CART ===== */
function openCart() {
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  renderCart();
}
function closeCart() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  // Reset confirmation screen when cart closes
  setTimeout(() => {
    const cc = document.getElementById('cartConfirmed');
    const ci = document.getElementById('cartItems');
    const cf = document.getElementById('cartFooter');
    if (cc) cc.style.display = 'none';
    if (ci) ci.style.display = '';
    if (cf) { cf.style.display = cart.length ? 'block' : 'none'; }
  }, 350);
}

function showOrderConfirm(orderId, totalDisplay) {
  const cc  = document.getElementById('cartConfirmed');
  const ci  = document.getElementById('cartItems');
  const cf  = document.getElementById('cartFooter');
  const hc  = document.getElementById('cartHeadCount');
  if (!cc) return;
  // Fill details
  document.getElementById('ccOrderId').textContent   = orderId  ? '#' + orderId  : '';
  document.getElementById('ccOrderTotal').textContent = totalDisplay || '';
  if (hc) hc.textContent = '';
  // Apply current language labels
  applyTranslations();
  // Swap views
  if (ci) ci.style.display = 'none';
  if (cf) cf.style.display = 'none';
  cc.style.display = 'flex';
  // Trigger SVG draw animation
  setTimeout(() => cc.classList.add('animate'), 30);
}
function renderCart() {
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const hc = document.getElementById('cartHeadCount');
  if (hc) hc.textContent = totalItems || '';

  if (cart.length === 0) {
    container.innerHTML = `<div class="empty-cart">
      <div class="empty-cart-icon">🛍️</div>
      <p class="empty-cart-title">${t('myCart')}</p>
      <p class="empty-cart-sub">${t('cartEmpty')}</p>
    </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }
  container.innerHTML = cart.map(item => {
    const p = PRODUCTS.find(p => p.id === item.id);
    if (!p) return '';
    const variant = [item.size, item.color].filter(Boolean).join(' · ');
    return `
      <div class="cart-item">
        <div class="cart-item-img"><img src="${p.image}" alt="" loading="lazy" /></div>
        <div class="cart-item-info">
          <div class="cart-item-top">
            <p class="cart-item-name">${getName(p)}</p>
            <button class="remove-item" onclick="removeFromCart(${item.id})"><i class="fas fa-xmark"></i></button>
          </div>
          ${variant ? `<p class="cart-item-variant">${variant}</p>` : ''}
          <div class="cart-item-bottom">
            <div class="cart-qty">
              <button class="qty-btn" onclick="updateQty(${item.id},-1)">−</button>
              <span class="qty-num">${item.qty}</span>
              <button class="qty-btn" onclick="updateQty(${item.id},1)">+</button>
            </div>
            <span class="cart-item-line-total">${fmt(p.price * item.qty)}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const subtotalBase = cart.reduce((s, i) => {
    const p = PRODUCTS.find(p => p.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  const subtotalDisp = subtotalBase * lang.rate;
  const freeDelivery = subtotalDisp >= FREE_DELIVERY_THRESHOLD_SAR;
  const deliveryDisp = freeDelivery ? 0 : DELIVERY_SAR;
  const fmtD = v => lang.currency + Math.round(v).toLocaleString();

  // Delivery progress bar
  const pct = Math.min(100, (subtotalDisp / FREE_DELIVERY_THRESHOLD_SAR) * 100);
  const barFill = document.getElementById('cartDelBarFill');
  const progText = document.getElementById('cartDelProgText');
  const progBox = document.getElementById('cartDelProg');
  if (barFill) { barFill.style.width = pct + '%'; barFill.classList.toggle('full', freeDelivery); }
  if (progBox) progBox.classList.toggle('free-del', freeDelivery);
  if (progText) {
    if (freeDelivery) {
      progText.textContent = t('freeDeliveryActive');
    } else {
      progText.textContent = t('addMoreFree') + ' ' + fmtD(FREE_DELIVERY_THRESHOLD_SAR - subtotalDisp) + ' ' + t('moreForFree');
    }
  }

  // Summary values
  const sd = document.getElementById('cartSubtotalDisp');
  const dv = document.getElementById('cartDeliveryDisp');
  const tot = document.getElementById('cartTotal');
  if (sd) sd.textContent = fmtD(subtotalDisp);
  if (dv) {
    if (freeDelivery) {
      dv.textContent = '✓ ' + t('free');
      dv.className = 'cart-srow-val green';
    } else {
      dv.textContent = fmtD(deliveryDisp);
      dv.className = 'cart-srow-val pink';
    }
  }
  if (tot) tot.textContent = fmtD(subtotalDisp + deliveryDisp);
  // VAT row
  const vatRow = document.getElementById('cartVatRow');
  const vatEl = document.getElementById('cartVatDisp');
  const vatLbl = document.getElementById('cartVatLabel');
  if (vatRow) {
    if (VAT_RATE > 0) {
      const vatAmt = subtotalDisp / (1 + VAT_RATE / 100) * (VAT_RATE / 100);
      if (vatEl) vatEl.textContent = fmtD(vatAmt);
      if (vatLbl) vatLbl.textContent = (t('vatRow') || 'VAT ({r}%)').replace('{r}', VAT_RATE);
      vatRow.style.display = '';
    } else {
      vatRow.style.display = 'none';
    }
  }
  // Address warning strip
  let addrWarn = document.getElementById('cartAddrWarn');
  if (!addrWarn) {
    addrWarn = document.createElement('div');
    addrWarn.id = 'cartAddrWarn';
    addrWarn.className = 'cart-addr-warn';
    addrWarn.onclick = () => { closeCart(); setTimeout(openLocation, 300); };
    footer.insertBefore(addrWarn, footer.firstChild);
  }
  if (!savedLocation || !savedLocation.city || !savedLocation.name) {
    addrWarn.innerHTML = `<i class="fas fa-triangle-exclamation"></i> ${t('locationRequired') || 'Add delivery address'}`;
    addrWarn.style.display = 'flex';
  } else {
    addrWarn.innerHTML = `<i class="fas fa-location-dot"></i> ${[savedLocation.name, savedLocation.city].filter(Boolean).join(' · ')} <span style="margin-left:auto;font-size:10px;opacity:.6">${t('change')||'Change'}</span>`;
    addrWarn.style.display = 'flex';
    addrWarn.style.background = '#e8f5e9';
    addrWarn.style.color = '#2e7d32';
    addrWarn.style.borderColor = '#c8e6c9';
  }
  if (footer) footer.style.display = 'block';
}
function _saveCart() { try { localStorage.setItem('exg_cart', JSON.stringify(cart)); } catch(e) {} }
function quickAddCart(id) { addToCart(id, '', ''); }

/* ===== FLY-TO-CART ANIMATION ===== */
function flyCartAdd(e, id) {
  e.stopPropagation();
  const p = PRODUCTS.find(x => x.id === id);
  if (!p || p.stock === 0) return;

  const btn = e.currentTarget || e.target.closest('.add-cart-btn');
  const card = btn ? btn.closest('.product-card') : null;
  const imgEl = card ? card.querySelector('img') : null;
  const imgSrc = (imgEl && imgEl.src) ? imgEl.src : (p.image || '');

  const cartBtn = document.getElementById('botCartBtn');
  if (!cartBtn || !imgSrc) { addToCart(id, '', ''); return; }

  const startRect = btn ? btn.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2, width: 0, height: 0 };
  const endRect = cartBtn.getBoundingClientRect();

  const size = 52;
  const startX = startRect.left + startRect.width / 2 - size / 2;
  const startY = startRect.top - size / 2;
  const endX = endRect.left + endRect.width / 2 - size / 2;
  const endY = endRect.top + endRect.height / 2 - size / 2;

  const fly = document.createElement('div');
  fly.style.cssText = `position:fixed;width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:2.5px solid #e91e8c;box-shadow:0 0 18px rgba(233,30,140,.7);z-index:99999;pointer-events:none;left:${startX}px;top:${startY}px;will-change:transform,opacity`;
  fly.innerHTML = `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
  document.body.appendChild(fly);

  // Button press effect
  if (btn) { btn.style.transform = 'scale(.93)'; setTimeout(() => { btn.style.transform = ''; }, 200); }

  const duration = 620;
  const arcHeight = Math.max(120, Math.abs(startY - endY) * 0.55);
  const t0 = performance.now();

  function easeInOut(t) { return t < .5 ? 2*t*t : -1+(4-2*t)*t; }

  function step(now) {
    const raw = Math.min((now - t0) / duration, 1);
    const p = easeInOut(raw);
    const x = startX + (endX - startX) * p;
    const y = startY + (endY - startY) * p - arcHeight * Math.sin(Math.PI * raw);
    const scale = 1 - 0.55 * p;
    const opacity = raw > 0.8 ? 1 - (raw - 0.8) / 0.2 : 1;
    fly.style.left = x + 'px';
    fly.style.top = y + 'px';
    fly.style.transform = `scale(${scale})`;
    fly.style.opacity = opacity;
    if (raw < 1) { requestAnimationFrame(step); return; }
    fly.remove();
    _playCartSound();
    _bounceCartIcon();
    addToCart(id, '', '');
  }
  requestAnimationFrame(step);
}

function _playCartSound() {
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const phrases = {
        bn: 'আপনার প্রোডাক্টটি এড হয়েছে',
        en: 'Your product has been added to cart',
        ar: 'تمت إضافة منتجك إلى السلة بنجاح',
        hi: 'आपका उत्पाद कार्ट में जोड़ा गया'
      };
      const langMap = { bn: 'bn', en: 'en-US', ar: 'ar', hi: 'hi-IN' };
      const text = phrases[currentLang] || phrases.en;
      const targetLang = langMap[currentLang] || 'en-US';

      function _speak(voices) {
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = targetLang;
        utt.rate = 0.88;   // slightly slower — clearer pronunciation
        utt.pitch = 1.15;  // slightly higher — friendly & warm
        utt.volume = 1;

        // Priority: 1) female local voice, 2) any local voice, 3) best English female
        const female = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]) && /female|woman|zira|samantha|victoria|monika|karen|veena|google/i.test(v.name));
        const anyLocal = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
        const engFemale = voices.find(v => v.lang.startsWith('en') && /female|samantha|zira|google|karen/i.test(v.name));
        const anyEng = voices.find(v => v.lang.startsWith('en'));

        utt.voice = female || anyLocal || engFemale || anyEng || null;
        window.speechSynthesis.speak(utt);
      }

      // Voices may load async on first call
      const loaded = window.speechSynthesis.getVoices();
      if (loaded.length) {
        _speak(loaded);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          _speak(window.speechSynthesis.getVoices());
          window.speechSynthesis.onvoiceschanged = null;
        };
        // Trigger voice load on some browsers
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
        window.speechSynthesis.cancel();
        setTimeout(() => _speak(window.speechSynthesis.getVoices()), 120);
      }
      return;
    }
  } catch(e) {}
  // Fallback beep if SpeechSynthesis unavailable
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    // Layer 1: warm "plop" thud
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(520, now);
    o1.frequency.exponentialRampToValueAtTime(180, now + 0.18);
    g1.gain.setValueAtTime(0, now);
    g1.gain.linearRampToValueAtTime(0.28, now + 0.015);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    o1.connect(g1); g1.connect(ctx.destination);
    o1.start(now); o1.stop(now + 0.35);
    // Layer 2: high bright "ding"
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(1100, now);
    o2.frequency.exponentialRampToValueAtTime(700, now + 0.12);
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(0.14, now + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    o2.connect(g2); g2.connect(ctx.destination);
    o2.start(now); o2.stop(now + 0.25);
    // Layer 3: tiny sparkle
    const o3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    o3.type = 'sine';
    o3.frequency.setValueAtTime(2200, now + 0.02);
    o3.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
    g3.gain.setValueAtTime(0, now + 0.02);
    g3.gain.linearRampToValueAtTime(0.07, now + 0.04);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    o3.connect(g3); g3.connect(ctx.destination);
    o3.start(now + 0.02); o3.stop(now + 0.2);
  } catch(e) {}
}

function _bounceCartIcon() {
  const btn = document.getElementById('botCartBtn');
  if (!btn) return;
  btn.style.transition = 'transform .12s';
  btn.style.transform = 'scale(1.35)';
  setTimeout(() => { btn.style.transform = 'scale(0.88)'; }, 120);
  setTimeout(() => { btn.style.transform = 'scale(1.12)'; }, 240);
  setTimeout(() => { btn.style.transform = ''; }, 360);
  // Flash the badge
  const badge = document.getElementById('botCartBadge');
  if (badge) {
    badge.style.transform = 'scale(1.8)';
    badge.style.background = '#fff';
    badge.style.color = '#e91e8c';
    setTimeout(() => { badge.style.transform = ''; badge.style.background = ''; badge.style.color = ''; }, 350);
  }
}

function addToCart(id, size, color) {
  const p = PRODUCTS.find(x => x.id === id);
  if (p && p.stock === 0) { showToast('❌ ' + (t('outOfStock') || 'Out of Stock')); return; }
  const existing = cart.find(i => i.id === id);
  if (p && p.stock !== undefined && existing && existing.qty >= p.stock) {
    showToast('⚠️ ' + (t('lowStock') || 'Only {n} left!').replace('{n}', p.stock)); return;
  }
  if (existing) existing.qty++;
  else cart.push({ id, qty: 1, size, color });
  _saveCart();
  updateCartBadge();
}
function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  if (delta > 0) {
    const p = PRODUCTS.find(x => x.id === id);
    if (p && p.stock !== undefined && item.qty >= p.stock) {
      showToast('⚠️ ' + (t('lowStock') || 'Only {n} left!').replace('{n}', p.stock)); return;
    }
  }
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else { _saveCart(); renderCart(); }
  updateCartBadge();
}
function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  _saveCart();
  renderCart();
  updateCartBadge();
}
function updateCartBadge() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const hb = document.getElementById('cartBadge');
  const nb = document.getElementById('botCartBadge');
  [hb, nb].forEach(b => {
    if (!b) return;
    b.textContent = count > 99 ? '99+' : count;
    b.style.display = count ? 'flex' : 'none';
    if (count) { b.style.animation = 'none'; requestAnimationFrame(() => { b.style.animation = ''; }); }
  });
}

/* ===== WISHLIST ===== */
function saveWishlist() {
  localStorage.setItem('exglobal_wishlist', JSON.stringify(wishlist));
}

function updateWishBadge() {
  const badge = document.getElementById('wishBadge');
  if (badge) {
    badge.textContent = wishlist.length;
    badge.style.display = wishlist.length ? 'flex' : 'none';
  }
  // Also update drawer wishlist count
  const dwb = document.getElementById('drawerWishCount');
  if (dwb) {
    dwb.textContent = wishlist.length;
    dwb.style.display = wishlist.length ? 'inline-block' : 'none';
  }
}

function toggleWish(id, btn) {
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(w => w !== id);
    if (btn) { btn.classList.remove('active'); btn.innerHTML = '<i class="far fa-heart"></i>'; }
    showToast(t('unwishlisted'));
  } else {
    wishlist.push(id);
    if (btn) { btn.classList.add('active'); btn.innerHTML = '<i class="fas fa-heart"></i>'; }
    showToast(t('wishlisted'));
  }
  saveWishlist();
  updateWishBadge();
}

function openWishlist() {
  renderWishlistPanel();
  document.getElementById('wishOverlay').classList.add('open');
  document.getElementById('wishPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeWishlist() {
  document.getElementById('wishOverlay').classList.remove('open');
  document.getElementById('wishPanel').classList.remove('open');
  document.body.style.overflow = '';
}

function renderWishlistPanel() {
  const container = document.getElementById('wishItems');
  if (!container) return;
  if (wishlist.length === 0) {
    container.innerHTML = `
      <div class="wish-empty">
        <div class="wish-empty-icon">🤍</div>
        <p class="wish-empty-title">${t('wishlistEmpty') || 'No favorites yet'}</p>
        <p class="wish-empty-sub">${t('wishlistEmptySub') || 'Tap the heart on any product to save it here'}</p>
      </div>`;
    return;
  }
  container.innerHTML = wishlist.map(id => {
    const p = PRODUCTS.find(p => p.id === id);
    if (!p) return '';
    return `
      <div class="wish-item" id="wish-item-${id}">
        <div class="wish-item-img" onclick="closeWishlist();openModal(${id})">
          <img src="${p.image}" alt="" loading="lazy" />
          <span class="wish-item-disc">-${p.discount}%</span>
        </div>
        <div class="wish-item-info">
          <p class="wish-item-name" onclick="closeWishlist();openModal(${id})">${getName(p)}</p>
          <div class="wish-item-prices">
            <span class="wish-item-price">${fmt(p.price)}</span>
            <span class="wish-item-orig">${fmt(p.originalPrice)}</span>
          </div>
          <div class="wish-item-actions">
            <button class="wish-add-cart${p.stock === 0 ? ' disabled' : ''}" onclick="${p.stock === 0 ? '' : `addToCart(${id},null,null)`}" ${p.stock === 0 ? 'style="opacity:.45;cursor:not-allowed"' : ''}>
              <i class="fas fa-bag-shopping"></i> ${p.stock === 0 ? (t('outOfStock') || 'Out of Stock') : (t('addToCart') || 'Add to Cart')}
            </button>
            <button class="wish-remove-btn" onclick="removeFromWishlist(${id})">
              <i class="fas fa-heart"></i>
            </button>
          </div>
        </div>
      </div>`;
  }).filter(Boolean).join('');
  const countEl = document.getElementById('wishCount');
  if (countEl) countEl.textContent = wishlist.length;
}

function removeFromWishlist(id) {
  wishlist = wishlist.filter(w => w !== id);
  saveWishlist();
  updateWishBadge();
  renderWishlistPanel();
  renderProducts(document.getElementById('searchInput')?.value || '');
  const el = document.querySelector(`[data-id="${id}"] .wish-btn`);
  if (el) { el.classList.remove('active'); el.innerHTML = '<i class="far fa-heart"></i>'; }
}

/* ===== PRODUCT MODAL ===== */
function openModal(id) {
  const p = PRODUCTS.find(p => p.id === id);
  if (!p) return;
  selectedSize = p.sizes[0] || '';
  selectedColor = p.colors[0] || '';
  _modalQty = 1;
  const inWish = wishlist.includes(id);
  const shareUrl = location.origin + location.pathname + '?p=' + id;

  const videoEmbed = (() => {
    if (!p.video) return '';
    const v = p.video;
    let embedUrl = '';
    const ytMatch = v.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&playsinline=1`;
    const ttMatch = v.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (ttMatch) embedUrl = `https://www.tiktok.com/embed/v2/${ttMatch[1]}`;
    if (embedUrl) return `<div class="modal-video-wrap"><iframe src="${embedUrl}" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
    // Direct video (Cloudinary / mp4)
    if (v.includes('cloudinary.com') || v.match(/\.(mp4|webm|mov)(\?|$)/i)) {
      return `<div class="modal-video-wrap"><video controls playsinline autoplay muted loop style="width:100%;height:100%;object-fit:cover"><source src="${v}"/></video></div>`;
    }
    return '';
  })();

  // Build image gallery (main + extraImages)
  const allImgs = [p.image, ...(p.extraImages || [])].filter(Boolean);
  const galleryHtml = allImgs.length > 1
    ? `<div class="modal-gallery" id="mgal" data-idx="0" data-images='${JSON.stringify(allImgs)}'>
        <img class="modal-img" id="mgalMain" src="${allImgs[0]}" alt="" />
        <div class="modal-thumbs">
          ${allImgs.map((u, i) => `<img class="modal-thumb${i===0?' active':''}" src="${u}" onclick="switchGalleryImg(${i})" loading="lazy"/>`).join('')}
        </div>
       </div>`
    : `<img class="modal-img" src="${p.image}" alt="" />`;

  document.getElementById('modalBody').innerHTML = `
    ${galleryHtml}
    ${videoEmbed}
    <div class="modal-info">
      <div class="modal-top-row">
        <h2 class="modal-name">${getName(p)}</h2>
        <button class="modal-share-btn" onclick="shareProduct(${id})" title="Share">
          <i class="fas fa-share-nodes"></i>
        </button>
      </div>
      <div class="modal-prices">
        <span class="modal-price-current">${fmt(p.price)}</span>
        <span class="modal-price-orig">${fmt(p.originalPrice)}</span>
        <span class="modal-discount">-${p.discount}%</span>
        ${VAT_RATE > 0 ? `<span class="modal-vat-badge"><i class="fas fa-receipt"></i> ${(t('vatIncl')||'incl.{r}%VAT').replace('{r}',VAT_RATE)}</span>` : ''}
      </div>
      <div class="modal-rating">
        <span class="stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5-Math.round(p.rating))}</span>
        <span class="rating-count">${p.rating} (${p.ratingCount.toLocaleString()} ${t('reviews')}) · ${p.sold} ${t('soldText')}</span>
      </div>
      ${p.stock === 0
        ? `<div class="modal-stock out"><i class="fas fa-times-circle"></i> ${t('outOfStock')}</div>`
        : p.stock !== undefined && p.stock <= 5
          ? `<div class="modal-stock low"><i class="fas fa-fire"></i> ${(t('lowStock')||'Only {n} left!').replace('{n}',p.stock)}</div>`
          : p.stock !== undefined
            ? `<div class="modal-stock ok"><i class="fas fa-check-circle"></i> ${(t('inStock')||'{n} in stock').replace('{n}',p.stock)}</div>`
            : ''}
      <div class="modal-divider"></div>
      <p class="modal-section-title">${t('sizeSelect')}</p>
      <div class="size-options">
        ${p.sizes.map(s => `<div class="size-opt ${s===selectedSize?'active':''}" onclick="selectSize('${s}',this)">${s}</div>`).join('')}
      </div>
      <p class="modal-section-title">${t('colorSelect')}</p>
      <div class="color-options">
        ${p.colors.map((c,i) => `<div class="color-opt ${i===0?'active':''}" style="background:${c}" onclick="selectColor('${c}',this)"></div>`).join('')}
      </div>
      <div class="modal-divider"></div>
      ${p.description ? `<div class="modal-desc">${p.description.replace(/\n/g,'<br>')}</div><div class="modal-divider"></div>` : ''}
      <div style="display:flex;gap:12px;font-size:13px;color:#666;flex-wrap:wrap">
        <span><i class="fas fa-truck" style="color:#e91e8c"></i> ${t('freeDeliveryInfo')}</span>
        <span><i class="fas fa-undo" style="color:#e91e8c"></i> ${t('returnInfo')}</span>
      </div>
      <!-- Share link bar -->
      <div class="modal-link-bar">
        <i class="fas fa-link modal-link-icon"></i>
        <span class="modal-link-text">${shareUrl}</span>
        <button class="modal-link-copy" onclick="shareProduct(${id})">
          <i class="fas fa-copy"></i> <span data-i18n="copyCode">Copy</span>
        </button>
      </div>
    </div>
    ${p.stock !== 0 ? `
    <div class="modal-qty-row">
      <span class="modal-qty-label">${t('qtyLabel')||'Quantity'}</span>
      <div class="modal-qty-ctrl">
        <button class="mq-btn" onclick="changeModalQty(-1,${p.id})"><i class="fas fa-minus"></i></button>
        <span class="mq-num" id="modalQtyNum">1</span>
        <button class="mq-btn" onclick="changeModalQty(1,${p.id})"><i class="fas fa-plus"></i></button>
      </div>
      <span class="modal-qty-price" id="modalQtyPrice">${fmt(p.price)}</span>
    </div>` : ''}
    <div class="modal-actions">
      <button class="btn-wishlist ${inWish?'active':''}" id="modalWishBtn" onclick="modalToggleWish(${p.id})">
        <i class="${inWish?'fas':'far'} fa-heart"></i>
      </button>
      <button class="btn-add-cart${p.stock === 0 ? ' disabled' : ''}" id="modalAddCartBtn" onclick="${p.stock === 0 ? '' : `modalAddCart(${p.id})`}" ${p.stock === 0 ? 'style="opacity:.45;cursor:not-allowed"' : ''}>${p.stock === 0 ? t('outOfStock') : t('addToCart')}</button>
    </div>
    ${_deliveryEstHTML()}
  `;
  history.replaceState({}, '', '?p=' + id);
  document.getElementById('productModal').classList.add('open');
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function _deliveryEstHTML() {
  const now = new Date();
  const fmtDate = d => {
    const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const n = d.getDate(), s = n===1||n===21||n===31?'st':n===2||n===22?'nd':n===3||n===23?'rd':'th';
    return M[d.getMonth()] + ' ' + n + s;
  };
  const add = days => { const d = new Date(now); d.setDate(now.getDate()+days); return d; };
  const d1 = now, d2a = add(1), d2b = add(2), d3a = add(4), d3b = add(7);
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const isAr = lang.dir === 'rtl';
  const steps = [
    { icon:'fas fa-cart-shopping', date: fmtDate(d1), label: t('detOrdered')||'Ordered', active: true },
    { icon:'fas fa-box-open', date: fmtDate(d2a)+' – '+fmtDate(d2b), label: t('detReady')||'Order Ready', active: false },
    { icon:'fas fa-house-chimney', date: fmtDate(d3a)+' – '+fmtDate(d3b), label: t('detDelivered')||'Delivered', active: false },
  ];
  const stepsHtml = (isAr ? [...steps].reverse() : steps).map((s, i, arr) => `
    <div class="det-step${s.active?' det-active':''}">
      <div class="det-node"><i class="${s.icon}"></i></div>
      <div class="det-info">
        <div class="det-date">${s.date}</div>
        <div class="det-lbl">${s.label}</div>
      </div>
    </div>${i < arr.length-1 ? '<div class="det-line"></div>' : ''}`).join('');
  return `
  <div class="del-est">
    <div class="del-est-head"><i class="fas fa-truck-fast"></i> ${t('estDelivery')||'Estimated Delivery'}</div>
    <div class="del-est-track">${stepsHtml}</div>
  </div>`;
}

function closeModal() {
  document.getElementById('productModal').classList.remove('open');
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
  history.replaceState({}, '', location.pathname);
}

function switchGalleryImg(idx) {
  const gal = document.getElementById('mgal');
  const main = document.getElementById('mgalMain');
  if (!gal || !main) return;
  const imgs = JSON.parse(gal.dataset.images || '[]');
  if (!imgs[idx]) return;
  main.src = imgs[idx];
  gal.dataset.idx = idx;
  document.querySelectorAll('.modal-thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
}

// Touch swipe through gallery
let _galTouchX = 0;
document.addEventListener('touchstart', e => {
  const gal = document.getElementById('mgal');
  if (gal && e.target.closest('#mgal')) _galTouchX = e.touches[0].clientX;
}, { passive: true });
document.addEventListener('touchend', e => {
  const gal = document.getElementById('mgal');
  if (!gal || !e.target.closest('#mgal')) return;
  const dx = e.changedTouches[0].clientX - _galTouchX;
  if (Math.abs(dx) < 35) return;
  const imgs = JSON.parse(gal.dataset.images || '[]');
  let idx = parseInt(gal.dataset.idx || 0);
  if (dx < 0 && idx < imgs.length - 1) idx++;
  else if (dx > 0 && idx > 0) idx--;
  switchGalleryImg(idx);
}, { passive: true });

function shareProduct(id) {
  const url = location.origin + location.pathname + '?p=' + id;
  if (navigator.share) {
    const p = PRODUCTS.find(p => p.id === id);
    navigator.share({ title: 'EX GLOBAL – ' + (p ? getName(p) : ''), url });
  } else {
    navigator.clipboard.writeText(url).catch(() => {});
    showToast('🔗 ' + (t('linkCopied') || 'Link copied!'));
  }
}
function selectSize(size, el) {
  selectedSize = size;
  document.querySelectorAll('.size-opt').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}
function selectColor(color, el) {
  selectedColor = color;
  document.querySelectorAll('.color-opt').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}
function modalToggleWish(id) {
  const btn = document.getElementById('modalWishBtn');
  toggleWish(id, btn);
  renderProducts(document.getElementById('searchInput')?.value || '');
}
function changeModalQty(delta, id) {
  const p = PRODUCTS.find(x => x.id === id);
  const max = p?.stock !== undefined ? p.stock : 99;
  _modalQty = Math.max(1, Math.min(_modalQty + delta, max));
  const numEl = document.getElementById('modalQtyNum');
  const priceEl = document.getElementById('modalQtyPrice');
  if (numEl) numEl.textContent = _modalQty;
  if (priceEl && p) priceEl.textContent = fmt(p.price * _modalQty);
  if (delta > 0 && p?.stock !== undefined && _modalQty >= p.stock)
    showToast('⚠️ ' + (t('lowStock')||'Only {n} left!').replace('{n}', p.stock));
}

function modalAddCart(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (p && p.stock === 0) { showToast('❌ ' + t('outOfStock')); return; }
  if (p && p.stock !== undefined && _modalQty > p.stock) {
    showToast('⚠️ ' + (t('lowStock')||'Only {n} left!').replace('{n}', p.stock)); return;
  }
  // Fly animation from modal button
  const btn = document.getElementById('modalAddCartBtn');
  const imgSrc = p.image || '';
  const cartBtn = document.getElementById('botCartBtn');
  if (btn && imgSrc && cartBtn) {
    const startRect = btn.getBoundingClientRect();
    const endRect = cartBtn.getBoundingClientRect();
    const size = 52;
    const startX = startRect.left + startRect.width/2 - size/2;
    const startY = startRect.top - size/2;
    const endX = endRect.left + endRect.width/2 - size/2;
    const endY = endRect.top + endRect.height/2 - size/2;
    const fly = document.createElement('div');
    fly.style.cssText = `position:fixed;width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:2.5px solid #e91e8c;box-shadow:0 0 18px rgba(233,30,140,.7);z-index:99999;pointer-events:none;left:${startX}px;top:${startY}px`;
    fly.innerHTML = `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
    document.body.appendChild(fly);
    const dur = 580, arc = Math.max(100, Math.abs(startY-endY)*.5);
    const t0 = performance.now();
    function ease(t){return t<.5?2*t*t:-1+(4-2*t)*t;}
    (function step(now){
      const raw = Math.min((now-t0)/dur,1), pp = ease(raw);
      fly.style.left = (startX+(endX-startX)*pp)+'px';
      fly.style.top = (startY+(endY-startY)*pp - arc*Math.sin(Math.PI*raw))+'px';
      fly.style.transform = `scale(${1-0.55*pp})`;
      fly.style.opacity = raw>.8 ? 1-(raw-.8)/.2 : 1;
      if(raw<1){requestAnimationFrame(step);}
      else{fly.remove();_playCartSound();_bounceCartIcon();}
    })(t0);
  } else {
    _playCartSound(); _bounceCartIcon();
  }
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty += _modalQty;
  else cart.push({ id, qty: _modalQty, size: selectedSize, color: selectedColor });
  _saveCart();
  updateCartBadge();
  _modalQty = 1;
  closeModal();
}

/* ===== COUPON SYSTEM ===== */
const COUPONS = {
  'WELCOME10': { pct: 10, oneTime: true }
};
let appliedCoupon = null;

function getUsedCoupons() {
  return JSON.parse(localStorage.getItem('exglobal_used_coupons') || '[]');
}
function markCouponUsed(code) {
  const uid = currentUser ? (currentUser.uid || currentUser.email) : 'guest';
  const used = getUsedCoupons();
  used.push(uid + ':' + code.toUpperCase());
  localStorage.setItem('exglobal_used_coupons', JSON.stringify(used));
}
function isCouponUsed(code) {
  const uid = currentUser ? (currentUser.uid || currentUser.email) : 'guest';
  return getUsedCoupons().includes(uid + ':' + code.toUpperCase());
}

function openCouponPanel() {
  const used = isCouponUsed('WELCOME10');
  const card = document.getElementById('welcomeCouponCard');
  const note = document.getElementById('couponUsedNote');
  const badge = document.getElementById('meCouponBadge');
  if (card) card.style.opacity = used ? '.45' : '1';
  if (note) note.style.display = used ? 'flex' : 'none';
  if (badge) { badge.style.display = used ? 'none' : 'flex'; }
  document.getElementById('couponOverlay').classList.add('open');
  document.getElementById('couponPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCouponPanel() {
  document.getElementById('couponOverlay').classList.remove('open');
  document.getElementById('couponPanel').classList.remove('open');
  document.body.style.overflow = '';
}
function copyCouponCode(code) {
  navigator.clipboard.writeText(code).catch(() => {});
  const btn = document.getElementById('couponCopyBtn');
  if (btn) {
    btn.innerHTML = '<i class="fas fa-check"></i><span>' + (t('copied') || 'Copied!') + '</span>';
    btn.style.color = '#0a8f4a';
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-copy"></i><span>' + (t('copyCode') || 'Copy') + '</span>';
      btn.style.color = '';
    }, 2000);
  }
  showToast('✅ ' + code + ' ' + (t('copied') || 'Copied!'));
}

function applyCoupon() {
  const input = document.getElementById('couponInput');
  const msg = document.getElementById('couponMsg');
  const code = (input.value || '').trim().toUpperCase();
  if (!code) return;
  const coupon = COUPONS[code];
  if (!coupon) {
    msg.textContent = t('couponInvalid') || '❌ Invalid coupon code';
    msg.className = 'pay-coupon-msg error';
    appliedCoupon = null;
    refreshPaymentSummary();
    return;
  }
  if (coupon.oneTime && isCouponUsed(code)) {
    msg.textContent = t('couponUsed') || '❌ Already used';
    msg.className = 'pay-coupon-msg error';
    appliedCoupon = null;
    refreshPaymentSummary();
    return;
  }
  appliedCoupon = { code, pct: coupon.pct };
  msg.textContent = '✅ ' + (t('couponApplied') || 'Coupon applied!') + ' -' + coupon.pct + '%';
  msg.className = 'pay-coupon-msg success';
  refreshPaymentSummary();
}

function refreshPaymentSummary() {
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
  const subtotalBase = cartSubtotalBase();
  const subtotalDisp = subtotalBase * lang.rate;
  const fmtD = (v) => lang.currency + Math.round(v).toLocaleString();
  const discountAmt = appliedCoupon ? subtotalDisp * (appliedCoupon.pct / 100) : 0;
  const discountedSub = subtotalDisp - discountAmt;
  const freeDelivery = discountedSub >= FREE_DELIVERY_THRESHOLD_SAR;
  const deliveryDisp = freeDelivery ? 0 : DELIVERY_SAR;
  const grandDisp = discountedSub + deliveryDisp;

  document.getElementById('paySubtotal').textContent = fmtD(subtotalDisp);
  const discRow = document.getElementById('payDiscountRow');
  const discEl = document.getElementById('payDiscount');
  const discLabel = document.getElementById('payDiscountLabel');
  if (discRow) discRow.style.display = appliedCoupon ? 'flex' : 'none';
  if (discEl) discEl.textContent = '-' + fmtD(discountAmt);
  if (discLabel) discLabel.textContent = (t('discount') || 'Discount') + ' (' + (appliedCoupon ? appliedCoupon.pct : 0) + '%)';
  const delivEl = document.getElementById('payDelivery');
  if (freeDelivery) { delivEl.textContent = t('free') || 'Free'; delivEl.style.color = '#0a8f4a'; }
  else { delivEl.textContent = fmtD(deliveryDisp); delivEl.style.color = '#e91e8c'; }
  document.getElementById('payTotal').textContent = fmtD(grandDisp);
  // VAT row in payment summary
  const payVatRow = document.getElementById('payVatRow');
  const payVatEl = document.getElementById('payVat');
  const payVatLbl = document.getElementById('payVatLabel');
  if (payVatRow) {
    if (VAT_RATE > 0) {
      const vatAmt = discountedSub / (1 + VAT_RATE / 100) * (VAT_RATE / 100);
      if (payVatEl) payVatEl.textContent = fmtD(vatAmt);
      if (payVatLbl) payVatLbl.textContent = (t('vatRow') || 'VAT ({r}%)').replace('{r}', VAT_RATE);
      payVatRow.style.display = 'flex';
    } else {
      payVatRow.style.display = 'none';
    }
  }
  const btn = document.getElementById('payBtnText');
  if (btn) btn.textContent = (t('placeOrder') || 'Order') + ' — ' + fmtD(grandDisp);
}

/* ===== WHATSAPP CHECKOUT ===== */
function whatsappCheckout() {
  if (cart.length === 0) return;
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
  const lines = cart.map(item => {
    const p = PRODUCTS.find(p => p.id === item.id);
    return `• ${getName(p)} x${item.qty} = ${fmt(p.price * item.qty)}`;
  });
  const subtotalBase = cartSubtotalBase();
  const subtotalDisp = subtotalBase * lang.rate;
  const discountAmt = appliedCoupon ? subtotalDisp * (appliedCoupon.pct / 100) : 0;
  const freeDelivery = (subtotalDisp - discountAmt) >= FREE_DELIVERY_THRESHOLD_SAR;
  const deliveryDisp = freeDelivery ? 0 : DELIVERY_SAR;
  const grandDisp = subtotalDisp - discountAmt + deliveryDisp;
  const fmtD = (v) => lang.currency + Math.round(v).toLocaleString();
  let couponLine = appliedCoupon ? `\n🏷️ Coupon (${appliedCoupon.code}): -${fmtD(discountAmt)}` : '';
  const locText = typeof getLocationText === 'function' ? getLocationText() : '';
  const msg = `🛒 *${t('myCart')}*\n\n${lines.join('\n')}${couponLine}\n\n*${t('totalLabel')} ${fmtD(grandDisp)}*${locText}`;
  if (appliedCoupon) markCouponUsed(appliedCoupon.code);
  const newOrd = _saveOrderRecord(cart, grandDisp, 'whatsapp');
  window.open(`https://wa.me/${getWANumber()}?text=${encodeURIComponent(msg)}`, '_blank');
  cart = []; _saveCart(); updateCartBadge();
  closePayment();
  openCart();
  showOrderConfirm(newOrd?.id, (lang.currency || 'SAR ') + Math.round(grandDisp * (lang.rate || 1)).toLocaleString());
}

/* ===== BOTTOM NAV ===== */
function setBottomActive(el) {
  document.querySelectorAll('.bot-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

/* ===== TOAST ===== */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show';
  setTimeout(() => toast.className = 'toast', 2600);
}

/* ===== ME / PROFILE PAGE ===== */
function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  return local.charAt(0) + '***@' + domain;
}

function refreshMeAddress() {
  const addrCard = document.getElementById('meAddrCard');
  const addRow   = document.getElementById('meAddAddrRow');
  if (!addrCard || !addRow) return;
  if (savedLocation && (savedLocation.name || savedLocation.city)) {
    addrCard.style.display = 'block';
    addRow.style.display = 'none';
    const nr = document.getElementById('meAddrNameRow');
    const l1 = document.getElementById('meAddrLine1');
    const l2 = document.getElementById('meAddrLine2');
    if (nr) nr.textContent = [savedLocation.name, savedLocation.phone].filter(Boolean).join(', ');
    if (l1) l1.textContent = [savedLocation.city, savedLocation.area, 'Saudi Arabia'].filter(Boolean).join(', ');
    if (l2) l2.textContent = savedLocation.address || '';
  } else {
    addrCard.style.display = 'none';
    addRow.style.display = 'flex';
  }
}

function openMe() {
  document.getElementById('meOverlay').classList.add('open');
  document.getElementById('mePanel').classList.add('open');
  document.body.style.overflow = 'hidden';
  refreshMeAddress();
  renderMyOrders();
  updateWishBadge();
}

function renderMyOrders() {
  const wrap = document.getElementById('meOrdersList');
  const countEl = document.getElementById('meOrderCount');
  if (!wrap) return;

  // Not logged in → show login prompt, never show orders
  if (!currentUser) {
    if (countEl) { countEl.style.display = 'none'; }
    wrap.innerHTML = `<div class="mo-empty" onclick="openAuth()" style="cursor:pointer">
      <i class="fas fa-lock" style="color:#e91e8c"></i>
      <span style="color:#e91e8c;font-weight:700">${t('loginToOrder')||'Login to view orders'}</span>
    </div>`;
    return;
  }

  const allOrders = JSON.parse(localStorage.getItem('exg_orders') || '[]');
  const orders = allOrders.filter(o => o.customer?.email && o.customer.email === currentUser.email);

  if (countEl) { countEl.textContent = orders.length; countEl.style.display = orders.length ? 'inline-block' : 'none'; }

  if (!orders.length) {
    wrap.innerHTML = `<div class="mo-empty"><i class="fas fa-bag-shopping"></i><span data-i18n="noOrdersYet">${t('noOrdersYet')||'No orders yet'}</span></div>`;
    return;
  }

  const _T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const statusMap = _T.orderStatus || {};
  const trackSteps = _T.orderTrack || ['Ordered','Confirmed','Shipped','Delivered'];
  const statusStep = { pending:0, processing:1, shipped:2, delivered:3, cancelled:-1 };
  const statusColor = { pending:'#f59e0b', processing:'#3b82f6', shipped:'#8b5cf6', delivered:'#10b981', cancelled:'#ef4444' };
  const statusIcon  = { pending:'fa-clock', processing:'fa-gear fa-spin', shipped:'fa-truck', delivered:'fa-circle-check', cancelled:'fa-times-circle' };

  wrap.innerHTML = orders.map(o => {
    const st = o.status || 'pending';
    const col = statusColor[st] || '#888';
    const ico = statusIcon[st] || 'fa-clock';
    const label = statusMap[st] || st;
    const step = statusStep[st] ?? 0;
    const cancelled = st === 'cancelled';
    const _localeMap = { ar: 'ar-SA', bn: 'bn-BD', hi: 'hi-IN' };
    const date = o.date ? new Date(o.date).toLocaleDateString(_localeMap[currentLang] || 'en-US', { day:'numeric', month:'short', year:'numeric' }) : '';
    const items = (o.items || []).slice(0, 4);
    const extraCount = (o.items || []).length - 4;
    const lang = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const total = lang.currency + Math.round(o.totalSAR * (lang.rate || 1)).toLocaleString();

    const timeline = cancelled
      ? `<div class="mo-cancelled-bar"><i class="fas fa-times-circle"></i> ${label}</div>`
      : `<div class="mo-timeline">${trackSteps.map((s,i) => `
          <div class="mo-step ${i <= step ? 'done' : ''}">
            <div class="mo-dot">${i <= step ? '<i class="fas fa-check"></i>' : (i === step+1 ? '<i class="fas fa-circle" style="font-size:6px"></i>' : '')}</div>
            <div class="mo-step-label">${s}</div>
          </div>${i < trackSteps.length-1 ? '<div class="mo-line '+(i < step ? 'done' : '')+'"></div>' : ''}`).join('')}
        </div>`;

    // Delivery confirmation footer
    const canConfirm = st === 'delivered' && !o.deliveryConfirmed;
    const alreadyConfirmed = o.deliveryConfirmed;
    const confirmBar = canConfirm
      ? `<button class="mo-confirm-btn" onclick="confirmDelivery('${o.id}')"><i class="fas fa-circle-check"></i> ${t('confirmDelivery')||'Confirm Delivery Received'}</button>`
      : alreadyConfirmed
        ? `<div class="mo-confirmed-badge"><i class="fas fa-circle-check"></i> ${t('deliveryConfirmed')||'Delivery Confirmed'}</div>`
        : '';

    return `<div class="mo-card">
      <div class="mo-card-top">
        <div class="mo-id-col">
          <div class="mo-id">#${o.id}</div>
          <div class="mo-date">${date}</div>
        </div>
        <div class="mo-status-pill" style="background:${col}20;color:${col};border:1px solid ${col}40">
          <i class="fas ${ico}" style="font-size:10px"></i> ${label}
        </div>
      </div>
      <div class="mo-items-row">
        ${items.map(i => `<div class="mo-item-thumb" title="${i.name||''}"><img src="${i.image||''}" onerror="this.style.display='none'"/><span class="mo-item-qty">×${i.qty||1}</span></div>`).join('')}
        ${extraCount > 0 ? `<div class="mo-item-more">+${extraCount}</div>` : ''}
      </div>
      <div class="mo-names">${(o.items||[]).map(i=>`${i.name||''}${i.qty>1?' ×'+i.qty:''}`).join(' · ')}</div>
      ${timeline}
      <div class="mo-footer">
        <span class="mo-total-label">${_T.orderTotal||'Total'}</span>
        <span class="mo-total-val">${total}</span>
      </div>
      ${confirmBar}
    </div>`;
  }).join('');
}

function confirmDelivery(orderId) {
  const orders = JSON.parse(localStorage.getItem('exg_orders') || '[]');
  const o = orders.find(x => x.id === orderId);
  if (!o || o.deliveryConfirmed) return; // already confirmed, block double-tap
  o.deliveryConfirmed = true;
  o.deliveryConfirmedAt = new Date().toISOString();
  localStorage.setItem('exg_orders', JSON.stringify(orders));
  showToast('✅ ' + (t('deliveryConfirmed') || 'Delivery Confirmed!'));
  renderMyOrders();
}

function closeMe() {
  document.getElementById('meOverlay').classList.remove('open');
  document.getElementById('mePanel').classList.remove('open');
  document.body.style.overflow = '';
  closeSettings();
}

function openEditProfile() {
  openProfile();
}

let _selectedGender = '';

function openProfile() {
  if (!currentUser) { openAuth(); return; }
  // Populate fields
  const u = currentUser;
  const nameParts = (u.name || '').split(' ');
  document.getElementById('profileFirstName').value    = u.firstName || nameParts[0] || '';
  document.getElementById('profileLastName').value     = u.lastName  || nameParts.slice(1).join(' ') || '';
  document.getElementById('profilePhone').value        = u.phone       || '';
  document.getElementById('profileBirthday').value     = u.birthday    || '';
  document.getElementById('profileNationality').value  = u.nationality || '';
  document.getElementById('profileEmailDisplay').textContent = u.email || '';
  document.getElementById('profileDisplayName').textContent  = u.name  || '';
  document.getElementById('profileDisplayEmail').textContent = u.email || '';
  // Avatar
  const img = document.getElementById('profileAvatarImg');
  const fallback = document.getElementById('profileAvatarFallback');
  if (u.avatar) {
    img.src = u.avatar; img.style.display = 'block'; fallback.style.display = 'none';
  } else {
    img.style.display = 'none'; fallback.style.display = 'flex';
    fallback.textContent = (u.name || '?')[0].toUpperCase();
  }
  // Gender
  _selectedGender = u.gender || 'male';
  selectGender(_selectedGender);
  // Show modal
  document.getElementById('profileOverlay').classList.add('open');
  document.getElementById('profileModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProfile() {
  document.getElementById('profileOverlay').classList.remove('open');
  document.getElementById('profileModal').classList.remove('open');
  document.body.style.overflow = '';
}

function selectGender(g) {
  _selectedGender = g;
  const mBtn = document.getElementById('genderMaleBtn');
  const fBtn = document.getElementById('genderFemaleBtn');
  if (!mBtn || !fBtn) return;
  if (g === 'male') {
    mBtn.style.border = '2px solid #e91e8c'; mBtn.style.background = '#fce4f3'; mBtn.style.color = '#e91e8c';
    fBtn.style.border = '2px solid #ddd';    fBtn.style.background = '#f5f5f5'; fBtn.style.color = '#888';
  } else {
    fBtn.style.border = '2px solid #e91e8c'; fBtn.style.background = '#fce4f3'; fBtn.style.color = '#e91e8c';
    mBtn.style.border = '2px solid #ddd';    mBtn.style.background = '#f5f5f5'; mBtn.style.color = '#888';
  }
}

function saveProfile() {
  if (!currentUser) return;
  const firstName   = document.getElementById('profileFirstName').value.trim();
  const lastName    = document.getElementById('profileLastName').value.trim();
  const phone       = document.getElementById('profilePhone').value.trim();
  const birthday    = document.getElementById('profileBirthday').value;
  const nationality = document.getElementById('profileNationality').value.trim();
  const fullName    = [firstName, lastName].filter(Boolean).join(' ') || currentUser.name;
  const updated = { ...currentUser, name: fullName, firstName, lastName, phone, birthday, nationality, gender: _selectedGender };
  setUser(updated);
  // Update display name in profile header
  document.getElementById('profileDisplayName').textContent = fullName;
  showToast('✅ প্রোফাইল সেভ হয়েছে!');
  setTimeout(closeProfile, 800);
}

function openSettings() {
  const labels = { bn: 'বাংলা', en: 'English', ar: 'العربية' };
  const el = document.getElementById('curLangLabel');
  if (el) el.textContent = labels[currentLang] || labels.en;
  const st = document.getElementById('soundToggle');
  if (st) { st.classList.toggle('on', _soundOn); st.setAttribute('aria-checked', _soundOn); }
  document.getElementById('settingsPanel').classList.add('open');
}

function closeSettings() {
  document.getElementById('settingsPanel').classList.remove('open');
}

/* ===== LOCATION / ADDRESS SYSTEM ===== */
let savedLocation = JSON.parse(localStorage.getItem('shopbd_location') || 'null');
let locMap = null, locMarker = null;

function openLocation() {
  document.getElementById('locOverlay').classList.add('open');
  document.getElementById('locModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (savedLocation) {
    document.getElementById('locName').value = savedLocation.name || '';
    document.getElementById('locPhone').value = savedLocation.phone || '';
    document.getElementById('locCity').value = savedLocation.city || '';
    document.getElementById('locArea').value = savedLocation.area || '';
    document.getElementById('locAddress').value = savedLocation.address || '';
  }
  // Init map after modal is visible
  setTimeout(initLocMap, 300);
}

function initLocMap() {
  if (!window.L) return;
  if (locMap) { locMap.invalidateSize(); return; }
  // Default center: Saudi Arabia
  const defaultLat = 24.7136, defaultLng = 46.6753;
  locMap = L.map('locMap', { zoomControl: true, attributionControl: false }).setView([defaultLat, defaultLng], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(locMap);
  locMap.on('click', function(e) {
    placeMapMarker(e.latlng.lat, e.latlng.lng);
  });
  // If saved coords, restore
  if (savedLocation && savedLocation.lat) {
    placeMapMarker(savedLocation.lat, savedLocation.lng, false);
    locMap.setView([savedLocation.lat, savedLocation.lng], 15);
  }
}

function placeMapMarker(lat, lng, doReverseGeocode) {
  if (locMarker) locMarker.remove();
  locMarker = L.marker([lat, lng], {
    icon: L.divIcon({ className: '', html: '<div style="font-size:28px;line-height:1">📍</div>', iconAnchor: [14, 28] })
  }).addTo(locMap);
  if (doReverseGeocode !== false) reverseGeocode(lat, lng);
}

function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`;
  fetch(url, { headers: { 'Accept-Language': 'en' } })
    .then(r => r.json())
    .then(data => {
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const area = addr.suburb || addr.neighbourhood || addr.district || addr.state_district || '';
      const road = addr.road || '';
      const house = addr.house_number || '';
      const detail = [house, road].filter(Boolean).join(', ') || data.display_name.split(',').slice(0,3).join(',');
      if (city) document.getElementById('locCity').value = city;
      if (area) document.getElementById('locArea').value = area;
      if (detail) document.getElementById('locAddress').value = detail;
      showToast(t('locationFound'));
    })
    .catch(() => showToast(t('locationError')));
}

function useMyLocation() {
  if (!navigator.geolocation) { showToast(t('noGps')); return; }
  const btn = document.getElementById('locGpsBtn');
  btn.classList.add('loading');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ...';
  navigator.geolocation.getCurrentPosition(
    pos => {
      btn.classList.remove('loading');
      btn.innerHTML = '<i class="fas fa-location-arrow"></i> <span data-i18n="gpsBtn">' + (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].gpsBtn || 'GPS Location') + '</span>';
      const { latitude: lat, longitude: lng } = pos.coords;
      if (!locMap) initLocMap();
      locMap.setView([lat, lng], 16);
      placeMapMarker(lat, lng);
      // save coords for restore
      if (!savedLocation) savedLocation = {};
      savedLocation.lat = lat; savedLocation.lng = lng;
    },
    err => {
      btn.classList.remove('loading');
      btn.innerHTML = '<i class="fas fa-location-arrow"></i> <span data-i18n="gpsBtn">' + (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].gpsBtn || 'GPS Location') + '</span>';
      showToast(t('enableGps'));
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function closeLocation() {
  document.getElementById('locOverlay').classList.remove('open');
  document.getElementById('locModal').classList.remove('open');
  document.body.style.overflow = '';
}

function saveLocation() {
  const name = document.getElementById('locName').value.trim();
  const phone = document.getElementById('locPhone').value.trim();
  const city = document.getElementById('locCity').value.trim();
  const area = document.getElementById('locArea').value.trim();
  const address = document.getElementById('locAddress').value.trim();
  if (!name || !phone || !city || !address) {
    showToast(t('fillAllFields'));
    return;
  }
  const lat = savedLocation && savedLocation.lat ? savedLocation.lat : null;
  const lng = savedLocation && savedLocation.lng ? savedLocation.lng : null;
  savedLocation = { name, phone, city, area, address, lat, lng };
  localStorage.setItem('shopbd_location', JSON.stringify(savedLocation));
  refreshMeAddress();
  showToast(t('addressSaved'));
  closeLocation();
}

function getLocationText() {
  if (!savedLocation) return '';
  return `\n\n📍 *${t('waDeliveryAddress')}*\n${t('waName')}: ${savedLocation.name}\n${t('waPhone')}: ${savedLocation.phone}\n${t('waCity')}: ${savedLocation.city}${savedLocation.area ? ', ' + savedLocation.area : ''}\n${t('waAddress')}: ${savedLocation.address}`;
}

// Init auth and address on page load
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  // Firebase auth state listener + redirect result handler
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    // Handle Google redirect result on page load
    firebase.auth().getRedirectResult().then(result => {
      if (result && result.user) {
        setUser({ name: result.user.displayName, email: result.user.email, avatar: result.user.photoURL, uid: result.user.uid, provider: 'google' });
        closeAuth();
        showToast(t('welcome') + result.user.displayName.split(' ')[0] + '!');
      }
    }).catch(() => {});
    firebase.auth().onAuthStateChanged(user => {
      if (user && !currentUser) {
        setUser({ name: user.displayName, email: user.email, avatar: user.photoURL, uid: user.uid, provider: 'google' });
      }
    });
  }
});

/* ===== AUTH SYSTEM ===== */
let currentUser = JSON.parse(localStorage.getItem('exglobal_user') || 'null');

function openAuth() {
  closeMe();
  setTimeout(() => {
    const loggedInView = document.getElementById('authLoggedIn');
    const loginView = document.getElementById('authLoginView');
    if (currentUser) {
      if (loggedInView) loggedInView.style.display = 'block';
      if (loginView) loginView.style.display = 'none';
      const nameEl = document.getElementById('authUserName');
      const emailEl = document.getElementById('authUserEmail');
      const img = document.getElementById('authAvatarImg');
      const fallback = document.getElementById('authAvatarFallback');
      if (nameEl) nameEl.textContent = currentUser.name || '';
      if (emailEl) emailEl.textContent = currentUser.email || '';
      if (img && fallback) {
        if (currentUser.avatar) {
          img.src = currentUser.avatar;
          img.style.display = 'block';
          fallback.style.display = 'none';
        } else {
          img.style.display = 'none';
          fallback.style.display = 'flex';
          fallback.textContent = (currentUser.name || '?')[0].toUpperCase();
        }
      }
    } else {
      if (loggedInView) loggedInView.style.display = 'none';
      if (loginView) loginView.style.display = 'block';
    }
    document.getElementById('authOverlay').classList.add('open');
    document.getElementById('authModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }, 200);
}

function closeAuth() {
  document.getElementById('authOverlay').classList.remove('open');
  document.getElementById('authModal').classList.remove('open');
  document.body.style.overflow = '';
}

async function signInWithGoogle() {
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    showToast(t('firebaseNotSetup'));
    return;
  }
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    // Popup works best — triggered by user tap so browsers allow it
    const result = await firebase.auth().signInWithPopup(provider);
    if (result.user) {
      setUser({ name: result.user.displayName, email: result.user.email, avatar: result.user.photoURL, uid: result.user.uid, provider: 'google' });
      closeAuth();
      showToast(t('welcome') + (result.user.displayName || '').split(' ')[0] + '!');
    }
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user') {
      // Fallback to redirect if popup is blocked
      try { await firebase.auth().signInWithRedirect(provider); } catch(e2) {}
    } else if (e.code !== 'auth/cancelled-popup-request') {
      showToast(t('googleLoginFailed'));
    }
  }
}

async function signInWithFacebook() {
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    showToast(t('firebaseNotSetup')); return;
  }
  const provider = new firebase.auth.FacebookAuthProvider();
  try {
    const result = await firebase.auth().signInWithPopup(provider);
    if (result.user) {
      setUser({ name: result.user.displayName, email: result.user.email, avatar: result.user.photoURL, uid: result.user.uid, provider: 'facebook' });
      closeAuth();
      showToast(t('welcome') + (result.user.displayName || '').split(' ')[0] + '!');
    }
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user') {
      try { await firebase.auth().signInWithRedirect(provider); } catch(e2) {}
    } else if (e.code === 'auth/operation-not-allowed') {
      showToast(t('facebookNotEnabled'));
    } else if (e.code !== 'auth/cancelled-popup-request') {
      showToast(t('facebookLoginFailed'));
    }
  }
}

async function signInWithApple() {
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    showToast(t('firebaseNotSetup')); return;
  }
  try {
    const provider = new firebase.auth.OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    const result = await firebase.auth().signInWithPopup(provider);
    const u = result.user;
    const displayName = u.displayName || (result.additionalUserInfo?.profile?.name?.firstName
      ? (result.additionalUserInfo.profile.name.firstName + ' ' + (result.additionalUserInfo.profile.name.lastName || ''))
      : (u.email ? u.email.split('@')[0] : 'Apple User'));
    setUser({
      name: displayName.trim(),
      email: u.email,
      avatar: u.photoURL || null,
      uid: u.uid,
      provider: 'apple'
    });
    closeAuth();
    showToast(t('welcome') + displayName.split(' ')[0] + '!');
  } catch (e) {
    if (e.code === 'auth/operation-not-allowed') {
      showToast(t('appleNotEnabled'));
    } else if (e.code !== 'auth/popup-closed-by-user') {
      showToast(t('appleLoginFailed'));
    }
  }
}

function signInManual() {
  const name = document.getElementById('authName').value.trim();
  const email = document.getElementById('authEmail').value.trim();
  const phone = document.getElementById('authPhone').value.trim();
  if (!name) { showToast(t('enterName')); return; }
  if (!email || !email.includes('@')) { showToast(t('enterValidEmail')); return; }
  setUser({ name, email, phone, avatar: null, provider: 'manual' });
  closeAuth();
  showToast(t('welcome') + name.split(' ')[0] + '!');
}

function getWANumber(){try{const s=JSON.parse(localStorage.getItem('exg_settings')||'{}');return s.whatsapp||'966546224029';}catch(e){return'966546224029';}}

/* ===== HELP CENTER ===== */
let _hcOpen = false;
function toggleHelpCenter() { _hcOpen ? closeHelpCenter() : openHelpCenter(); }
function openHelpCenter() {
  _hcOpen = true;
  document.getElementById('hcPanel').classList.add('open');
  document.getElementById('hcBackdrop').classList.add('open');
  document.getElementById('hcFabIcon').className = 'fas fa-times';
  // Hide overlapping FABs
  const aiFab = document.getElementById('aiChatFab');
  const waFab = document.getElementById('waFab');
  if (aiFab) aiFab.style.display = 'none';
  if (waFab) waFab.style.display = 'none';
  const _T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const wa = document.getElementById('hcWaBtn');
  if (wa) wa.href = 'https://wa.me/' + getWANumber() + '?text=' + encodeURIComponent(_T.waMsg || 'Hello, I have a question.');
  const faqWrap = document.getElementById('hcFaq');
  if (faqWrap && _T.hcFaq) {
    faqWrap.innerHTML = _T.hcFaq.map(item =>
      `<div class="hc-faq-item">
        <button class="hc-faq-q" onclick="toggleFaqItem(this)">${item.q} <i class="fas fa-plus"></i></button>
        <div class="hc-faq-a">${item.a}</div>
      </div>`
    ).join('');
  }
  applyTranslations();
}
function closeHelpCenter() {
  _hcOpen = false;
  document.getElementById('hcPanel').classList.remove('open');
  document.getElementById('hcBackdrop').classList.remove('open');
  document.getElementById('hcFabIcon').className = 'fas fa-headset';
  // Restore FABs
  const aiFab = document.getElementById('aiChatFab');
  const waFab = document.getElementById('waFab');
  if (aiFab) aiFab.style.display = '';
  if (waFab) waFab.style.display = '';
}
function hcAsk(msg) {
  closeHelpCenter();
  window.open('https://wa.me/' + getWANumber() + '?text=' + encodeURIComponent(msg), '_blank');
}
function hcAskKey(key) {
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  hcAsk(T[key] || T.waMsg || 'Hello, I have a question.');
}
let _faqOpen = false;
function toggleFaq() {
  _faqOpen = !_faqOpen;
  document.getElementById('hcFaq').classList.toggle('open', _faqOpen);
  document.getElementById('faqChevron').style.transform = _faqOpen ? 'rotate(180deg)' : '';
}
function toggleFaqItem(btn) {
  const a = btn.nextElementSibling;
  const isOpen = btn.classList.contains('open');
  document.querySelectorAll('.hc-faq-q').forEach(b => { b.classList.remove('open'); if(b.nextElementSibling) b.nextElementSibling.classList.remove('open'); });
  if (!isOpen) { btn.classList.add('open'); a.classList.add('open'); }
}

function _saveCustomerRecord(user){
  if(!user||!user.email)return;
  try{
    const list=JSON.parse(localStorage.getItem('exg_customers')||'[]');
    if(!list.find(c=>c.email===user.email)){
      list.unshift({name:user.name,email:user.email,phone:user.phone||'',avatar:user.avatar||'',uid:user.uid||'',provider:user.provider||'manual',joinedAt:new Date().toISOString()});
      if(list.length>1000)list.splice(1000);
      localStorage.setItem('exg_customers',JSON.stringify(list));
    }
  }catch(e){}
}

function _saveOrderRecord(items,totalSAR,method){
  let newOrder = null;
  try{
    const orders=JSON.parse(localStorage.getItem('exg_orders')||'[]');
    newOrder = {
      id:'ORD'+Date.now(),
      date:new Date().toISOString(),
      items:items.map(i=>{const p=PRODUCTS.find(x=>x.id===i.id);return{id:i.id,name:p?(p.names?.en||p.nameEn||'Product'):'Product',price:p?p.price:0,qty:i.qty||1,size:i.size||'',color:i.color||'',image:p?p.image:''};}).slice(0,20),
      totalSAR:Math.round(totalSAR),
      method,
      customer:currentUser?{name:currentUser.name,email:currentUser.email,phone:currentUser.phone||''}:{name:'Guest'},
      address:typeof savedLocation!=='undefined'?savedLocation:null,
      status:'pending'
    };
    orders.unshift(newOrder);
    if(orders.length>500)orders.splice(500);
    localStorage.setItem('exg_orders',JSON.stringify(orders));
    // Reduce stock for each ordered item
    const custom = JSON.parse(localStorage.getItem('exg_products_custom') || '{}');
    items.forEach(i => {
      const p = PRODUCTS.find(x => x.id === i.id);
      if (p && p.stock !== undefined) {
        p.stock = Math.max(0, p.stock - (i.qty || 1));
        custom[p.id] = custom[p.id] || {};
        custom[p.id].stock = p.stock;
      }
    });
    localStorage.setItem('exg_products_custom', JSON.stringify(custom));
  }catch(e){}
  return newOrder;
}

function setUser(user) {
  currentUser = user;
  localStorage.setItem('exglobal_user', JSON.stringify(user));
  _saveCustomerRecord(user);
  updateAuthUI();
  // Request notification permission after login (silent — only asks once)
  setTimeout(() => requestNotifPermission(), 3000);
}

function signOut() {
  currentUser = null;
  localStorage.removeItem('exglobal_user');
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    firebase.auth().signOut().catch(() => {});
  }
  updateAuthUI();
  showToast(t('signedOut'));
}

function updateAuthUI() {
  const guestEl = document.getElementById('meGuestState');
  const userEl  = document.getElementById('meUserState');
  const signOutItem = document.getElementById('meSignOutItem');
  const drawerSignOut = document.getElementById('drawerSignOutItem');
  if (!guestEl || !userEl) return;
  if (currentUser) {
    guestEl.style.display = 'none';
    userEl.style.display  = 'flex';
    if (signOutItem) signOutItem.style.display = 'flex';
    if (drawerSignOut) drawerSignOut.style.display = 'block';
    const nameEl  = document.getElementById('meUserName');
    const emailEl = document.getElementById('meUserEmail');
    if (nameEl)  nameEl.textContent  = currentUser.name  || '';
    if (emailEl) emailEl.textContent = maskEmail(currentUser.email || '');
    const avatarImg = document.getElementById('meUserAvatar');
    const initial   = document.getElementById('meAvatarInitial');
    if (avatarImg && initial) {
      if (currentUser.avatar) {
        avatarImg.src = currentUser.avatar;
        avatarImg.style.display = 'block';
        initial.style.display = 'none';
      } else {
        avatarImg.style.display = 'none';
        initial.style.display   = 'block';
        initial.textContent = (currentUser.name || '?').charAt(0).toUpperCase();
      }
    }
  } else {
    guestEl.style.display = 'flex';
    userEl.style.display  = 'none';
    if (signOutItem) signOutItem.style.display = 'none';
    if (drawerSignOut) drawerSignOut.style.display = 'none';
  }
}

/* ===== PAYMENT SYSTEM ===== */
const BINANCE_PAY_ID = '1167244565';
const SAR_TO_USDT = 0.267;

let selectedPayMethod = 'whatsapp';
let paypalLoaded = false;

let DELIVERY_SAR = 17;
let FREE_DELIVERY_THRESHOLD_SAR = 100;
let VAT_RATE = 10; // default 10% — overridden by admin settings

function cartSubtotalBase() {
  return cart.reduce((s, i) => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
}

function _cartStockError() {
  for (const item of cart) {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) continue;
    if (p.stock === 0) return `"${getName(p)}" — ${t('outOfStock') || 'Out of Stock'}`;
    if (p.stock !== undefined && item.qty > p.stock)
      return `"${getName(p)}" — ${(t('lowStock')||'Only {n} left!').replace('{n}', p.stock)}`;
  }
  return null;
}

function openPayment() {
  if (cart.length === 0) { showToast(t('cartEmpty')); return; }
  const stockErr = _cartStockError();
  if (stockErr) { showToast('🚫 ' + stockErr); return; }
  if (!currentUser) {
    closeCart();
    showToast(t('loginToOrder'));
    setTimeout(openAuth, 400);
    return;
  }
  // Block if no delivery address
  if (!savedLocation || !savedLocation.city || !savedLocation.name) {
    showToast(t('locationRequired') || '📍 Please add a delivery address');
    closeCart();
    setTimeout(openLocation, 400);
    return;
  }
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS['bn'];
  const subtotalBase = cartSubtotalBase();
  const subtotalDisp = subtotalBase * lang.rate;          // in display currency (SAR)
  const freeDelivery = subtotalDisp >= FREE_DELIVERY_THRESHOLD_SAR;
  const deliveryDisp = freeDelivery ? 0 : DELIVERY_SAR;
  const grandDisp = subtotalDisp + deliveryDisp;
  const fmtD = (v) => lang.currency + Math.round(v).toLocaleString();
  document.getElementById('paySubtotal').textContent = fmtD(subtotalDisp);
  const delivEl = document.getElementById('payDelivery');
  if (freeDelivery) {
    delivEl.textContent = t('free') || 'Free';
    delivEl.style.color = '#0a8f4a';
  } else {
    delivEl.textContent = fmtD(deliveryDisp);
    delivEl.style.color = '#e91e8c';
  }
  document.getElementById('payTotal').textContent = fmtD(grandDisp);
  document.getElementById('payBtnText').textContent = (t('placeOrder')||'Order') + ' — ' + fmtD(grandDisp);
  // VAT row in payment summary
  const payVatRow0 = document.getElementById('payVatRow');
  const payVatEl0 = document.getElementById('payVat');
  const payVatLbl0 = document.getElementById('payVatLabel');
  if (payVatRow0) {
    if (VAT_RATE > 0) {
      const vatAmt0 = subtotalDisp / (1 + VAT_RATE / 100) * (VAT_RATE / 100);
      if (payVatEl0) payVatEl0.textContent = fmtD(vatAmt0);
      if (payVatLbl0) payVatLbl0.textContent = (t('vatRow') || 'VAT ({r}%)').replace('{r}', VAT_RATE);
      payVatRow0.style.display = 'flex';
    } else {
      payVatRow0.style.display = 'none';
    }
  }
  const nudge = document.getElementById('payFreeNudge');
  if (nudge) {
    if (freeDelivery) {
      nudge.innerHTML = `<span class="nudge-free">🎉 ${t('freeDeliveryActive')||'Free delivery applied!'}</span>`;
    } else {
      const needed = FREE_DELIVERY_THRESHOLD_SAR - subtotalDisp;
      nudge.innerHTML = `<span class="nudge-add">🚚 ${t('addMoreFree')||'Add'} <strong>${fmtD(needed)}</strong> ${t('moreForFree')||'more for free delivery'}</span>`;
    }
  }
  // Reset coupon state
  appliedCoupon = null;
  const couponMsg = document.getElementById('couponMsg');
  const couponInput = document.getElementById('couponInput');
  if (couponMsg) { couponMsg.textContent = ''; couponMsg.className = 'pay-coupon-msg'; }
  if (couponInput) couponInput.value = '';
  const discRow = document.getElementById('payDiscountRow');
  if (discRow) discRow.style.display = 'none';
  applyTranslations();
  // Open modal
  document.getElementById('payOverlay').classList.add('open');
  document.getElementById('payModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  // Load PayPal if configured
  if (typeof PAYPAL_READY !== 'undefined' && PAYPAL_READY && !paypalLoaded) {
    loadPayPalSDK();
  }
}

function closePayment() {
  document.getElementById('payOverlay').classList.remove('open');
  document.getElementById('payModal').classList.remove('open');
  document.body.style.overflow = '';
  // Reset binance form states
  const ps = document.getElementById('bncPayState');
  const vs = document.getElementById('bncVerifyState');
  const ss = document.getElementById('bncSuccessState');
  const ri = document.getElementById('binanceRefInput');
  if (ps) ps.style.display = 'block';
  if (vs) vs.style.display = 'none';
  if (ss) ss.style.display = 'none';
  if (ri) ri.value = '';
  const btn = document.getElementById('btnPayNow');
  if (btn) { btn.disabled = false; btn.style.background = ''; }
}

function selectPayMethod(method) {
  selectedPayMethod = method;
  ['whatsapp','paypal','card','gpay','binance'].forEach(m => {
    const pm = document.getElementById('pm' + m.charAt(0).toUpperCase() + m.slice(1));
    const ck = document.getElementById('check' + m.charAt(0).toUpperCase() + m.slice(1));
    if (pm) pm.classList.remove('active');
    if (ck) ck.querySelector('i').style.color = '#ddd';
  });
  const card = document.getElementById('pm' + method.charAt(0).toUpperCase() + method.slice(1));
  if (card) card.classList.add('active');
  const check = document.getElementById('check' + method.charAt(0).toUpperCase() + method.slice(1));
  if (check) check.querySelector('i').style.color = method === 'binance' ? '#F3BA2F' : '#e91e8c';
  // Show/hide sub-forms
  document.getElementById('paypalBtnContainer').style.display = (method === 'paypal') ? 'block' : 'none';
  document.getElementById('cardForm').style.display = (method === 'card') ? 'block' : 'none';
  document.getElementById('binanceForm').style.display = (method === 'binance') ? 'block' : 'none';
  // Populate Binance form
  if (method === 'binance') {
    const lang3 = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const sub3 = cartSubtotalBase() * lang3.rate;
    const del3 = sub3 >= FREE_DELIVERY_THRESHOLD_SAR ? 0 : DELIVERY_SAR;
    const totalSAR = sub3 + del3;
    const usdt = (totalSAR * SAR_TO_USDT).toFixed(2);
    const usdtEl = document.getElementById('binanceUSDT');
    const sarEl = document.getElementById('binanceAmtSAR');
    const addrEl = document.getElementById('binanceAddrTxt');
    if (usdtEl) usdtEl.textContent = usdt + ' USDT';
    if (sarEl) sarEl.textContent = lang3.currency + Math.round(totalSAR) + ' ≈ ' + usdt + ' USDT';
    if (addrEl) addrEl.textContent = BINANCE_PAY_ID;
  }
  // Update button text
  const lang2 = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const subtotalDisp2 = cartSubtotalBase() * lang2.rate;
  const delDisp2 = subtotalDisp2 >= FREE_DELIVERY_THRESHOLD_SAR ? 0 : DELIVERY_SAR;
  const grandDisp2 = subtotalDisp2 + delDisp2;
  const methodLabel = {
    whatsapp: t('placeOrder'), paypal: 'PayPal',
    card: t('cardName'), gpay: 'Google Pay',
    binance: '⚡ Verify & Confirm Order'
  };
  const btnEl = document.getElementById('btnPayNow');
  if (btnEl) btnEl.style.background = method === 'binance'
    ? 'linear-gradient(135deg,#F3BA2F,#F0A500)' : '';
  document.getElementById('payBtnText').textContent =
    (methodLabel[method] || t('placeOrder')) + ' — ' + lang2.currency + Math.round(grandDisp2).toLocaleString();
}

function copyBinanceAddr() {
  const addr = BINANCE_PAY_ID;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(addr).then(() => showToast(t('binanceCopied'))).catch(() => showToast(addr));
  } else {
    showToast(addr);
  }
}

function processPayment() {
  const stockErr = _cartStockError();
  if (stockErr) { showToast('🚫 ' + stockErr); return; }
  if (selectedPayMethod === 'whatsapp') {
    closePayment();
    whatsappCheckout();
  } else if (selectedPayMethod === 'paypal') {
    if (typeof PAYPAL_READY !== 'undefined' && PAYPAL_READY) {
      showToast(t('paypalOpening'));
    } else {
      showToast(t('paypalNotSetup'));
      setTimeout(() => { closePayment(); whatsappCheckout(); }, 1500);
    }
  } else if (selectedPayMethod === 'card') {
    const num = (document.getElementById('cardNumber').value || '').replace(/\s/g,'');
    const exp = document.getElementById('cardExpiry').value || '';
    const cvv = document.getElementById('cardCvv').value || '';
    const name = document.getElementById('cardName').value || '';
    if (num.length < 16 || !exp || cvv.length < 3 || !name) {
      showToast(t('fillCardDetails')); return;
    }
    showToast(t('cardNotSetup'));
    setTimeout(() => { closePayment(); whatsappCheckout(); }, 1500);
  } else if (selectedPayMethod === 'gpay') {
    showToast(t('gpayNotSetup'));
    setTimeout(() => { closePayment(); whatsappCheckout(); }, 1500);
  } else if (selectedPayMethod === 'binance') {
    const ref = (document.getElementById('binanceRefInput')?.value || '').trim();
    if (ref.length < 6) { showToast('⚠️ Enter your Binance reference number'); return; }

    // One-time use check
    const usedRefs = JSON.parse(localStorage.getItem('bnc_used_refs') || '[]');
    if (usedRefs.includes(ref)) {
      showToast('⚠️ This reference has already been used');
      return;
    }

    // Disable button, show verifying state
    const btn = document.getElementById('btnPayNow');
    btn.disabled = true;
    document.getElementById('bncPayState').style.display = 'none';
    document.getElementById('bncVerifyState').style.display = 'block';
    document.getElementById('bncSuccessState').style.display = 'none';

    setTimeout(() => {
      // Mark reference as used
      usedRefs.push(ref);
      localStorage.setItem('bnc_used_refs', JSON.stringify(usedRefs));

      // Generate order number
      const orderNum = 'EX-' + (Date.now() % 100000).toString().padStart(5, '0');

      // Show success state
      document.getElementById('bncVerifyState').style.display = 'none';
      document.getElementById('bncSuccessState').style.display = 'block';
      document.getElementById('bncOrderNum').textContent = '#' + orderNum;

      // Update button → green confirmed
      btn.disabled = false;
      btn.style.background = 'linear-gradient(135deg,#059669,#34d399)';
      document.getElementById('payBtnText').textContent = '✓ Order Confirmed!';

      // Build WhatsApp notification to store owner
      const langB = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const subB = cartSubtotalBase() * langB.rate;
      const delB = subB >= FREE_DELIVERY_THRESHOLD_SAR ? 0 : DELIVERY_SAR;
      const totalSAR = subB + delB;
      const usdt = (totalSAR * SAR_TO_USDT).toFixed(2);
      const lines = cart.map(i => { const p = PRODUCTS.find(x => x.id === i.id); return p ? `• ${getName(p)} ×${i.qty}` : ''; }).filter(Boolean).join('\n');
      const locText = getLocationText();
      const msg = `✅ *Binance Pay — AUTO CONFIRMED*\n🛒 Order: *${orderNum}*\n\n${lines}\n\n💵 ${langB.currency}${Math.round(totalSAR)} = *${usdt} USDT*\n🆔 Pay ID: ${BINANCE_PAY_ID}\n🔖 Ref: \`${ref}\`${locText}\n\n⏰ ${new Date().toLocaleString()}`;

      setTimeout(() => {
        const bOrd = _saveOrderRecord(cart, totalSAR, 'binance');
        window.open('https://wa.me/' + getWANumber() + '?text=' + encodeURIComponent(msg), '_blank');
        const bLang = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
        cart = []; _saveCart(); updateCartBadge();
        closePayment();
        openCart();
        showOrderConfirm(bOrd?.id, (bLang.currency||'SAR ')+Math.round(totalSAR*(bLang.rate||1)).toLocaleString());
      }, 1200);
    }, 2800);
  }
}

function loadPayPalSDK() {
  if (!PAYPAL_READY) return;
  const s = document.createElement('script');
  s.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CONFIG.clientId}&currency=${PAYPAL_CONFIG.currency}`;
  s.onload = () => {
    paypalLoaded = true;
    renderPayPalButtons();
  };
  document.head.appendChild(s);
}

function renderPayPalButtons() {
  if (typeof paypal === 'undefined') return;
  const container = document.getElementById('paypalBtnContainer');
  container.innerHTML = '';
  const subtotalDisp = cartSubtotalBase() * (TRANSLATIONS[currentLang]||TRANSLATIONS.en).rate;
  const delivery = subtotalDisp >= FREE_DELIVERY_THRESHOLD_SAR ? 0 : DELIVERY_SAR;
  const amount = (subtotalDisp + delivery).toFixed(2);
  paypal.Buttons({
    createOrder: (data, actions) => actions.order.create({
      purchase_units: [{ amount: { value: amount, currency_code: PAYPAL_CONFIG.currency }, description: 'EX GLOBAL Order' }]
    }),
    onApprove: (data, actions) => actions.order.capture().then(details => {
      showToast(t('paymentSuccess') + (details.payer.name.given_name || '') + '!');
      const ppOrd = _saveOrderRecord(cart, cartSubtotalBase(), 'paypal');
      const ppLang = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const ppTotal = (ppLang.currency||'SAR ')+Math.round(cartSubtotalBase()*(ppLang.rate||1)).toLocaleString();
      cart = []; _saveCart(); updateCartBadge(); closePayment(); openCart();
      showOrderConfirm(ppOrd?.id, ppTotal);
    }),
    onError: () => showToast(t('paymentFailed'))
  }).render('#paypalBtnContainer');
}

// Card number formatting
function formatCard(el) {
  let v = el.value.replace(/\D/g, '').substring(0, 16);
  el.value = v.replace(/(.{4})/g, '$1 ').trim();
  const icon = document.getElementById('cardTypeIcon');
  if (v.startsWith('4')) icon.textContent = '💳';
  else if (v.startsWith('5')) icon.textContent = '🟠';
  else if (v.startsWith('37')) icon.textContent = '💚';
  else icon.textContent = '';
}
function formatExpiry(el) {
  let v = el.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2);
  el.value = v;
}

/* ===== REVIEWS ===== */
let reviewStarVal = 0;
let activeRevFilter = 'all';

const SEED_REVIEWS = [
  { id:1, name:'Rahul Ahmed', initial:'R', grad:'linear-gradient(135deg,#e91e8c,#ff6b6b)', rating:5, date:'2025-05-12', country:'Saudi Arabia',
    product:"Women's Dress — Floral M",
    text:{ bn:'অসাধারণ প্রোডাক্ট! কোয়ালিটি দেখে মনে হচ্ছিল না এত কম দামে পাবো। ডেলিভারি ছিল মাত্র ২ দিনে। ড্রেসের কাপড় একদম মোলায়েম আর রঙ স্ক্রিনের মতোই এসেছে। আবার অর্ডার করবো ইনশাআল্লাহ! 🌸', en:'Amazing product! Quality exceeded expectations. Fabric is super soft and the color is exactly like the photo. Delivery in just 2 days. Will order again! 🌸', ar:'منتج رائع! الجودة أفضل مما توقعت. القماش ناعم جداً والألوان مطابقة للصورة. التوصيل خلال يومين فقط. سأطلب مرة أخرى! 🌸' },
    photos:['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=120&h=120&fit=crop&q=80'], helpful:124 },

  { id:2, name:'Fatima Al-Rashid', initial:'F', grad:'linear-gradient(135deg,#3b82f6,#a855f7)', rating:5, date:'2025-05-08', country:'Riyadh',
    product:"Kids Sneakers — Blue 32",
    text:{ bn:'আমার বাচ্চারা জুতাগুলো পেয়ে এতটাই খুশি হয়েছে! কোয়ালিটি একদম প্রিমিয়াম, সোল মজবুত এবং সাইজ একদম পারফেক্ট। ৩ দিনের মধ্যে ডেলিভারি পেয়েছি। দামের তুলনায় অনেক বেশি মান পেয়েছি।', en:"My kids were absolutely thrilled! Premium quality, sturdy sole and perfect size. Received in 3 days. Got way more value than the price. Highly recommended for parents!", ar:'أطفالي سعداء جداً! جودة ممتازة، نعل قوي ومقاس مثالي. استلمتها خلال 3 أيام. قيمة ممتازة مقابل السعر. أنصح جميع الآباء!' },
    photos:['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=120&h=120&fit=crop&q=80'], helpful:141 },

  { id:3, name:'Nour Al-Zahraa', initial:'N', grad:'linear-gradient(135deg,#f97316,#facc15)', rating:5, date:'2025-05-10', country:'UAE',
    product:"Abaya — Black Premium L",
    text:{ bn:'এই আবায়াটা সত্যিই অসাধারণ। কাপড়ের মান অনেক উঁচু, পরতে খুব আরামদায়ক। ডিজাইন এলিগ্যান্ট। প্যাকেজিং ছিল গিফট বক্সের মতো সুন্দর। আমার বন্ধুরাও অর্ডার দিয়েছে!', en:'This abaya is truly exceptional. Fabric quality is top-notch, very comfortable to wear. The design is elegant and the packaging came like a gift box. My friends have ordered too!', ar:'العباءة رائعة حقاً. جودة القماش عالية جداً ومريحة للغاية. التصميم أنيق والتغليف كان مثل صندوق الهدايا. صديقاتي طلبن أيضاً!' },
    photos:['https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=120&h=120&fit=crop&q=80'], helpful:98 },

  { id:4, name:'Mohammed Karim', initial:'M', grad:'linear-gradient(135deg,#10b981,#06b6d4)', rating:4, date:'2025-05-05', country:'Jeddah',
    product:"Men's Formal Blazer — Black XL",
    text:{ bn:'ব্লেজারের কাটিং ও ফিটিং খুবই ভালো। অফিসে পরে অনেক কমপ্লিমেন্ট পেয়েছি। শুধু ডেলিভারিতে ৪ দিন লেগেছে যেটা ৩ দিন হলে ভালো হতো। সব মিলিয়ে ৪ স্টার দিচ্ছি।', en:'The blazer cut and fit is excellent. Got many compliments at the office. Only took 4 days delivery instead of 3, which was my only minor issue. Overall very satisfied, 4 stars.', ar:'القصة والمقاس ممتازان. حصلت على إطراء كثير في العمل. فقط التوصيل استغرق 4 أيام بدلاً من 3. بشكل عام راضٍ جداً، 4 نجوم.' },
    photos:['https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=120&h=120&fit=crop&q=80'], helpful:78 },

  { id:5, name:'Sumaiya Begum', initial:'S', grad:'linear-gradient(135deg,#f59e0b,#ef4444)', rating:5, date:'2025-05-02', country:'Dammam',
    product:'Skincare Beauty Kit — Gold Set',
    text:{ bn:'EX GLOBAL এর সার্ভিস সত্যিই অনেক ভালো। প্যাকেজিং একদম নিখুঁত, প্রতিটি প্রোডাক্ট আলাদাভাবে মোড়ানো ছিল। স্কিনকেয়ার প্রোডাক্টগুলোর কোয়ালিটি দেখে মনে হলো বিদেশি ব্র্যান্ড কিনেছি। ১০/১০ 🔥', en:'EX GLOBAL packaging was flawless — each product individually wrapped. Skincare quality felt like an imported brand. Skin feels amazing after 1 week of use. 10/10 🔥', ar:'تغليف EX GLOBAL كان مثالياً، كل منتج ملفوف بشكل منفصل. جودة العناية بالبشرة مثل علامة تجارية مستوردة. بشرتي رائعة بعد أسبوع. 10/10 🔥' },
    photos:['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&h=120&fit=crop&q=80'], helpful:156 },

  { id:6, name:'Abdullah Hassan', initial:'A', grad:'linear-gradient(135deg,#8b5cf6,#e91e8c)', rating:5, date:'2025-04-28', country:'Mecca',
    product:'Sports Running Shoes — White 42',
    text:{ bn:'সেরা অনলাইন শপিং অভিজ্ঞতা! রানিং শুজ একদম লাইটওয়েট, জিমে পরে অসাধারণ লাগছে। ঘাম শোষণ করার ক্ষমতাও ভালো। দামের তুলনায় কোয়ালিটি অনেক বেশি। 💯', en:'Best shopping experience ever! Running shoes are super lightweight, feels amazing at the gym. Great sweat absorption too. Quality far exceeds the price. 💯', ar:'أفضل تجربة تسوق على الإطلاق! الأحذية الرياضية خفيفة جداً، رائعة في الصالة الرياضية. امتصاص العرق ممتاز. الجودة أكبر بكثير من السعر. 💯' },
    photos:['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&h=120&fit=crop&q=80'], helpful:133 },

  { id:7, name:'Layla Al-Mansouri', initial:'L', grad:'linear-gradient(135deg,#ec4899,#f97316)', rating:5, date:'2025-04-25', country:'Kuwait',
    product:"Women's Handbag — Brown",
    text:{ bn:'হ্যান্ডব্যাগটা দেখতে একদম বিলাসবহুল! চামড়ার টেক্সচার খুব সুন্দর, ফিটিং ও জিপার মজবুত। রিয়েল শপের মতোই মান। স্বামীকে গিফট দিয়েছিলাম আসলে এটা নিজের জন্য কিনলাম 😄', en:'The handbag looks absolutely luxurious! Beautiful leather texture, strong fitting and zipper. Same quality as a real store. Actually bought it for myself after gifting one to my sister 😄', ar:'الحقيبة تبدو فاخرة جداً! نسيج جلد جميل، خياطة ومسحاب قوي. جودة مثل المحل الحقيقي. اشتريت واحدة لأختي ثم واحدة لنفسي 😄' },
    photos:['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=120&h=120&fit=crop&q=80'], helpful:89 },

  { id:8, name:'Omar Siddiqui', initial:'O', grad:'linear-gradient(135deg,#0ea5e9,#6366f1)', rating:5, date:'2025-04-22', country:'Qatar',
    product:'Smart Watch — Black',
    text:{ bn:'স্মার্টওয়াচটা অবিশ্বাস্য! স্ক্রিন পরিষ্কার, ব্যাটারি ২ দিন চলে। হার্টরেট, স্টেপ কাউন্টার সব কাজ করছে পারফেক্টলি। বক্সে চার্জার, এক্সট্রা ব্যান্ড সব দিয়েছে। দামে এরকম স্মার্টওয়াচ আগে পাইনি।', en:'Incredible smartwatch! Clear screen, battery lasts 2 days. Heart rate, step counter all working perfectly. Box included charger and extra band. Never found such quality at this price before.', ar:'ساعة ذكية رائعة! شاشة واضحة، البطارية تدوم يومين. معدل ضربات القلب وعداد الخطوات يعملان بشكل مثالي. الصندوق يحتوي على شاحن وحزام إضافي. لم أجد جودة كهذه بهذا السعر من قبل.' },
    photos:['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&h=120&fit=crop&q=80'], helpful:112 },

  { id:9, name:'Amira Khalid', initial:'A', grad:'linear-gradient(135deg,#14b8a6,#3b82f6)', rating:5, date:'2025-04-20', country:'Bahrain',
    product:"Girls' Party Dress — Pink 6Y",
    text:{ bn:'মেয়ের জন্মদিনের পার্টিতে এই ড্রেসটা পরিয়েছিলাম, সবাই এতটাই প্রশংসা করেছে! কাপড় খুব নরম, মেয়ে সারাদিন পরে একটুও অস্বস্তি বলেনি। রঙ ছবির মতোই উজ্জ্বল। 5 স্টার কম হয়ে যায়! ⭐', en:"Dressed my daughter in this for her birthday party and everyone complimented it! Fabric is very soft, she wore it all day without any discomfort. Color is as vibrant as the photo. 5 stars isn't enough! ⭐", ar:'ألبست ابنتي هذا الفستان في حفلة عيد ميلادها وجميعهم أشادوا به! القماش ناعم جداً، ارتدته طوال اليوم دون أي إزعاج. اللون زاهٍ كما في الصورة. 5 نجوم لا تكفي! ⭐' },
    photos:['https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1476234251651-f353703a034d?w=120&h=120&fit=crop&q=80'], helpful:97 },

  { id:10, name:'Tariq Al-Farsi', initial:'T', grad:'linear-gradient(135deg,#7c3aed,#db2777)', rating:4, date:'2025-04-18', country:'Oman',
    product:"Men's Polo T-Shirt 3-Pack",
    text:{ bn:'৩টা পোলো শার্টের প্যাক — দাম মাত্র SAR ২৪! এটা বিশ্বাসই হচ্ছিল না। কটন কোয়ালিটি ভালো, সেলাই মজবুত। একটু বড় সাইজ দিলে ভালো হতো তাই ৪ স্টার। পরের বার এল কিনবো, এম পরে একটু ঢিলা লেগেছে।', en:'3-pack polo shirts for just SAR 24 — unbelievable! Good cotton quality, strong stitching. Slightly runs big so I give 4 stars — will size down next time. Still great value overall.', ar:'باقة من 3 قمصان بولو بسعر 24 ريال فقط! لا يصدق! جودة قطن جيدة وخياطة متينة. المقاس كبير قليلاً لذا 4 نجوم. سأطلب مقاساً أصغر المرة القادمة.' },
    photos:['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=120&h=120&fit=crop&q=80'], helpful:64 },

  { id:11, name:'Sakura Tanaka', initial:'S', grad:'linear-gradient(135deg,#f43f5e,#fb923c)', rating:5, date:'2025-04-15', country:'Riyadh',
    product:'Perfume Set — Oriental 5pcs',
    text:{ bn:'পারফিউম সেটটা অবিশ্বাস্য! ৫টা আলাদা সুগন্ধ, প্রতিটাই দীর্ঘস্থায়ী। অফিসে পরলে সারাদিন সুগন্ধ থাকে। বোতলের ডিজাইন খুব সুন্দর। গিফট হিসেবেও পারফেক্ট। বারবার অর্ডার করবো।', en:'Incredible perfume set! 5 different scents, each long-lasting. Wear it to office and the scent stays all day. Beautiful bottle design. Perfect as a gift too. Will order again and again.', ar:'مجموعة عطور رائعة! 5 روائح مختلفة وكل منها طويل الأمد. أضعها للعمل وتبقى طوال اليوم. تصميم الزجاجة جميل. مثالية كهدية. سأطلبها مرة بعد مرة.' },
    photos:['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1541643600914-78b084683702?w=120&h=120&fit=crop&q=80'], helpful:143 },

  { id:12, name:'Mariam Youssef', initial:'M', grad:'linear-gradient(135deg,#22c55e,#14b8a6)', rating:5, date:'2025-04-12', country:'Egypt',
    product:'Yoga & Sports Set — Navy S',
    text:{ bn:'যোগা সেটটা একদম পারফেক্ট! স্ট্রেচি কাপড় যোগা ও জিম দুটোতেই দারুণ। লেগিংস একদম ট্রান্সপারেন্ট না, ঘামলেও অস্বস্তি হয় না। সাইজ গাইড ফলো করেছিলাম, একদম ঠিকঠাক এসেছে।', en:'Perfect yoga set! Stretchy fabric works great for both yoga and gym. Leggings are not transparent at all, stays comfortable even when sweaty. Followed size guide and it fit perfectly.', ar:'مجموعة يوغا مثالية! قماش مطاطي رائع لليوغا والجيم. الليغنز غير شفاف إطلاقاً، مريح حتى عند التعرق. اتبعت دليل المقاسات وجاء مثالياً.' },
    photos:['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=120&h=120&fit=crop&q=80'], helpful:88 },

  { id:13, name:'Hassan Al-Otaibi', initial:'H', grad:'linear-gradient(135deg,#f59e0b,#84cc16)', rating:5, date:'2025-04-09', country:'Medina',
    product:'Home Decoration Set — Gold',
    text:{ bn:'ঘর সাজানোর সেটটা দেখে মনে হচ্ছে বিদেশ থেকে আনা! গোল্ড ফিনিশ একদম রিয়েল লুক দেয়। বিবাহ বার্ষিকীতে ঘর সাজিয়েছিলাম, অতিথিরা ভেবেছে অনেক দামি ডেকোর। দামে এরকম প্রোডাক্ট আশা করিনি।', en:'This home decor set looks like it came from abroad! Gold finish gives a truly premium look. Decorated for our anniversary and guests thought it was very expensive decor. Did not expect this quality at this price.', ar:'مجموعة الديكور المنزلي تبدو كأنها مستوردة! الطلاء الذهبي يعطي مظهراً فاخراً حقيقياً. زينت للذكرى السنوية وظن الضيوف أنه ديكور غالي الثمن. لم أتوقع هذه الجودة بهذا السعر.' },
    photos:['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=120&h=120&fit=crop&q=80'], helpful:76 },

  { id:14, name:'Priya Sharma', initial:'P', grad:'linear-gradient(135deg,#a855f7,#ec4899)', rating:5, date:'2025-04-06', country:'Dammam',
    product:"Ethnic Kurta Set — Blue XL",
    text:{ bn:'কুর্তা সেটটা দেখে মুগ্ধ হয়ে গেলাম! এম্ব্রয়ডারি কাজ একদম হাতে তোলা মনে হচ্ছে। ঈদের দিন পরেছিলাম, অনেক কমপ্লিমেন্ট পেয়েছি। কাপড়ের মান উচ্চমানের, ধুলেও রঙ যায়নি।', en:'Absolutely stunning kurta set! The embroidery work looks handcrafted. Wore it for Eid and got so many compliments. Premium fabric quality, color did not fade even after washing.', ar:'مجموعة الكورتا رائعة للغاية! أعمال التطريز تبدو يدوية الصنع. ارتديتها في العيد وحصلت على كثير من الإطراء. جودة قماش ممتازة، اللون لم يبهت حتى بعد الغسيل.' },
    photos:['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=120&h=120&fit=crop&q=80'], helpful:92 },

  { id:15, name:'Ahmed Al-Qasim', initial:'A', grad:'linear-gradient(135deg,#0891b2,#7c3aed)', rating:5, date:'2025-04-03', country:'Riyadh',
    product:'Wireless Earbuds — Pro Black',
    text:{ bn:'ইয়ারবাডের সাউন্ড কোয়ালিটি অসাধারণ! বেস শক্তিশালী, ভয়েস ক্লিয়ার। নয়েজ ক্যান্সেলেশন চমৎকার কাজ করে। একবার চার্জে ৬ ঘণ্টা চলে। কেসেও ৩ বার চার্জ হয়। দামে এই মানের ইয়ারবাড ভাবাই যায় না। 🎧', en:'Sound quality is incredible! Powerful bass, crystal clear voice. Noise cancellation works amazingly. 6 hours on one charge, case provides 3 more charges. Cannot believe this quality at this price. 🎧', ar:'جودة الصوت رائعة! باس قوي وصوت واضح جداً. إلغاء الضوضاء يعمل بشكل مذهل. 6 ساعات للشحن الواحد والحقيبة توفر 3 شحنات إضافية. لا أصدق هذه الجودة بهذا السعر. 🎧' },
    photos:['https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=120&h=120&fit=crop&q=80'], helpful:167 },

  { id:16, name:'Zainab Hussain', initial:'Z', grad:'linear-gradient(135deg,#dc2626,#ea580c)', rating:5, date:'2025-03-30', country:'Jeddah',
    product:'Hijab Collection — 6 Colors',
    text:{ bn:'হিজাবের প্যাকটা দেখে আনন্দিত হয়ে গেলাম! ৬টা আলাদা রঙ, প্রতিটা কাপড় খুব হালকা ও নরম। গরমেও আরামদায়ক। সেলাই মজবুত, বারবার ধুলেও ভাঁজ পড়ে না। এত কম দামে এত ভালো কোয়ালিটি!', en:'So happy with this hijab pack! 6 different colors, each fabric is very light and soft. Comfortable even in heat. Strong stitching, no creasing after multiple washes. Such amazing quality at this low price!', ar:'سعيدة جداً بهذه المجموعة! 6 ألوان مختلفة، كل قماش خفيف وناعم جداً. مريح حتى في الحرارة. خياطة قوية ولا تتجعد بعد الغسيل المتكرر. جودة مذهلة بهذا السعر المنخفض!' },
    photos:['https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&h=120&fit=crop&q=80'], helpful:104 },

  { id:17, name:'Karim Benali', initial:'K', grad:'linear-gradient(135deg,#059669,#0891b2)', rating:4, date:'2025-03-27', country:'Algeria',
    product:"Men's Leather Belt — Brown",
    text:{ bn:'বেল্টের চামড়া আসল মনে হচ্ছে, বাকল মজবুত। অফিসে ও ফর্মাল অনুষ্ঠানে দারুণ লাগছে। শুধু ছিদ্রের জায়গাগুলো আরেকটু বেশি হলে ভালো হতো। মোটামুটি ভালো কিনেছি ৪ স্টার দিচ্ছি।', en:'Leather feels genuine, buckle is sturdy. Looks great for office and formal events. Just wished there were more holes for sizing. Good purchase overall, 4 stars.', ar:'الجلد يبدو حقيقياً والإبزيم متين. يبدو رائعاً للعمل والمناسبات الرسمية. فقط أتمنى أن يكون هناك المزيد من الثقوب للحجم. شراء جيد بشكل عام، 4 نجوم.' },
    photos:[], helpful:52 },

  { id:18, name:'Nadia Rahman', initial:'N', grad:'linear-gradient(135deg,#be185d,#9333ea)', rating:5, date:'2025-03-24', country:'Bangladesh',
    product:'Makeup Brushes Set — 12pcs',
    text:{ bn:'মেকআপ ব্রাশ সেটটা একদম প্রফেশনাল মানের! ১২টা ব্রাশ, প্রতিটার আলাদা কাজ। সব চুল নরম, ফাউন্ডেশন ব্লেন্ড হয় পারফেক্টলি। ২ বার ধুয়েছি, কোনো চুল পড়েনি। ইউটিউবের মেকআপ টিউটোরিয়ালের মতো ফিনিশ পাচ্ছি।', en:'Professional-grade makeup brush set! 12 brushes each with a specific purpose. All bristles are soft, blends foundation perfectly. Washed twice, no bristles fell out. Getting YouTube-tutorial level finishes now.', ar:'مجموعة فرش مكياج احترافية! 12 فرشاة لكل منها غرض محدد. جميع الشعيرات ناعمة وتمزج الأساس بشكل مثالي. غسلتها مرتين ولم تسقط أي شعيرة. أحصل الآن على لمسات نهائية تشبه دروس اليوتيوب.' },
    photos:['https://images.unsplash.com/photo-1631214524020-3c69b4b54d5f?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1586495777744-4e6232bf5e87?w=120&h=120&fit=crop&q=80'], helpful:119 },

  { id:19, name:'Yusuf Al-Harbi', initial:'Y', grad:'linear-gradient(135deg,#0f766e,#1d4ed8)', rating:5, date:'2025-03-20', country:'Mecca',
    product:'Kids School Bag — Galaxy',
    text:{ bn:'ছেলের স্কুলব্যাগ এখন তার সবচেয়ে প্রিয় জিনিস! গ্যালাক্সি ডিজাইন দেখে সে এতটাই খুশি হয়েছে। ব্যাগ মজবুত, জিপার স্মুথ, পিঠের প্যাডিং আরামদায়ক। বই ও টিফিন সব ধরে যায়। স্কুলে সবাই কোথা থেকে কিনেছি জিজ্ঞেস করে!', en:"Now my son's most prized possession! He was so happy with the galaxy design. Bag is sturdy, zipper smooth, back padding comfortable. Fits all books and lunchbox. Everyone at school asks where we bought it!", ar:'أصبحت الحقيبة المفضلة لابني! كان سعيداً جداً بتصميم المجرة. الحقيبة متينة، السحاب سلس، وسادة الظهر مريحة. تسع جميع الكتب وصندوق الغداء. الجميع في المدرسة يسأل أين اشتريناها!' },
    photos:['https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=120&h=120&fit=crop&q=80'], helpful:86 },

  { id:20, name:'Sara Al-Amri', initial:'S', grad:'linear-gradient(135deg,#e91e8c,#7c3aed)', rating:5, date:'2025-03-17', country:'Riyadh',
    product:'Winter Coat — Camel L',
    text:{ bn:'কোটটা পেয়ে প্রথম দেখাতেই প্রেমে পড়ে গেছি! কাপড় অনেক গরম ও ভারী মানের, বাইরে গেলে ঠান্ডা একদম লাগে না। রঙ ছবির চেয়েও সুন্দর বাস্তবে। ডেলিভারি মাত্র ২ দিনে এসেছে। অন্য রঙেও নেবো শীঘ্রই! ❤️', en:'Fell in love at first sight! Fabric is very warm and heavy quality, no cold feeling outside at all. Color is even more beautiful in person than the photo. Delivery in just 2 days. Will get another color soon! ❤️', ar:'وقعت في حبه من النظرة الأولى! القماش دافئ جداً وثقيل الجودة، لا تشعر بالبرد خارجاً. اللون أجمل في الواقع من الصورة. التوصيل خلال يومين فقط. سأطلب لوناً آخر قريباً! ❤️' },
    photos:['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=120&h=120&fit=crop&q=80'], helpful:138 }
];

function getAllReviews() {
  const stored = JSON.parse(localStorage.getItem('exglobal_reviews') || '[]');
  return [...stored.reverse(), ...SEED_REVIEWS];
}

function openReviews() {
  document.getElementById('revOverlay').classList.add('open');
  document.getElementById('revModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderRevSummary();
  renderRevList(activeRevFilter);
  applyTranslations();
}

function closeReviews() {
  document.getElementById('revOverlay').classList.remove('open');
  document.getElementById('revModal').classList.remove('open');
  document.body.style.overflow = '';
}

function renderRevSummary() {
  const all = getAllReviews();
  const total = all.length;
  const avg = total ? (all.reduce((s,r)=>s+r.rating,0)/total) : 0;
  document.getElementById('revAvgScore').textContent = avg.toFixed(1);
  document.getElementById('revTotalCount').textContent = (total + 1248).toLocaleString();
  const starsEl = document.getElementById('revAvgStars');
  starsEl.innerHTML = [1,2,3,4,5].map(i=>`<span style="color:${i<=Math.round(avg)?'#ffd700':'#ddd'}">★</span>`).join('');
  const barsEl = document.getElementById('revBarsCol');
  const colors = ['','#e64a19','#f57c00','#ff8f00','#ffa000','#ffd700'];
  barsEl.innerHTML = [5,4,3,2,1].map(star => {
    const cnt = all.filter(r=>r.rating===star).length;
    const pct = total ? Math.round(cnt/total*100) : 0;
    return `<div class="rev-bar-row"><span>${star}★</span><div class="rev-bar"><div class="rev-bar-fill" style="width:${pct}%;background:${colors[star]}"></div></div><span>${pct}%</span></div>`;
  }).join('');
  // Update entry strip count
  const ec = document.getElementById('revEntryCount');
  if (ec) ec.textContent = (total+1248).toLocaleString() + ' ' + (t('reviewsLabel')||'reviews');
}

function renderRevList(filter) {
  activeRevFilter = filter;
  const all = getAllReviews();
  let filtered = all;
  if (filter === '5') filtered = all.filter(r=>r.rating===5);
  else if (filter === '4') filtered = all.filter(r=>r.rating===4);
  else if (filter === '3') filtered = all.filter(r=>r.rating<=3);
  else if (filter === 'photos') filtered = all.filter(r=>r.photos && r.photos.length>0);
  const list = document.getElementById('revList');
  if (!filtered.length) {
    list.innerHTML = `<div class="rev-empty"><i class="fas fa-comment-slash"></i><p>${t('noReviews')}</p></div>`;
    return;
  }
  list.innerHTML = filtered.map(r => {
    const txt = (typeof r.text === 'object') ? (r.text[currentLang] || r.text.en) : r.text;
    const stars = [1,2,3,4,5].map(i=>`<span style="color:${i<=r.rating?'#ffd700':'#ddd'}">★</span>`).join('');
    const photos = (r.photos||[]).length ? `<div class="rev-card-photos">${r.photos.map(p=>`<img src="${p}" alt="" loading="lazy"/>`).join('')}</div>` : '';
    const dateStr = r.date ? new Date(r.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '';
    return `<div class="rev-card">
      <div class="rev-card-top">
        <div class="rev-avatar" style="background:${r.grad||'#e91e8c'}">${r.initial||r.name[0]}</div>
        <div class="rev-card-info">
          <div class="rev-card-name">${r.name} <span class="rev-verified"><i class="fas fa-check-circle"></i> ${t('verifiedPurchase')}</span></div>
          <div class="rev-card-meta">${dateStr}${r.country?' · '+r.country:''}</div>
        </div>
        <div class="rev-card-stars">${stars}</div>
      </div>
      ${r.product?`<div class="rev-card-product"><i class="fas fa-box"></i> ${r.product}</div>`:''}
      <p class="rev-card-text">${txt}</p>
      ${photos}
      <div class="rev-card-footer">
        ${buildReactions(r.id, r.helpful||0)}
      </div>
    </div>`;
  }).join('');
}

function filterReviewsBy(filter, el) {
  document.querySelectorAll('.rev-filter').forEach(b=>b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderRevList(filter);
}

function openWriteReview() {
  document.getElementById('wrOverlay').classList.add('open');
  document.getElementById('wrModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  applyTranslations();
}

function closeWriteReview() {
  document.getElementById('wrOverlay').classList.remove('open');
  document.getElementById('wrModal').classList.remove('open');
  if (document.getElementById('revModal').classList.contains('open')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function setReviewStar(val) {
  reviewStarVal = val;
  const labels = { bn:['','খুবই খারাপ','খারাপ','ঠিক আছে','ভালো','অসাধারণ!'], en:['','Terrible','Bad','Okay','Good','Excellent!'], ar:['','سيء جداً','سيء','مقبول','جيد','ممتاز!'] };
  const arr = labels[currentLang] || labels.en;
  document.querySelectorAll('.wr-star').forEach((s,i)=>s.classList.toggle('on', i<val));
  const lbl = document.getElementById('wrStarLabel');
  if (lbl) lbl.textContent = arr[val] || '';
}

function submitReview() {
  if (!reviewStarVal) { showToast(t('rateFirst')); return; }
  const name = (document.getElementById('wrName').value||'').trim();
  const text = (document.getElementById('wrText').value||'').trim();
  if (!name||!text) { showToast(t('fillReview')); return; }
  const product = (document.getElementById('wrProduct').value||'').trim();
  const gradients = ['linear-gradient(135deg,#e91e8c,#ff9800)','linear-gradient(135deg,#3b82f6,#a855f7)','linear-gradient(135deg,#10b981,#06b6d4)','linear-gradient(135deg,#f59e0b,#ef4444)','linear-gradient(135deg,#8b5cf6,#e91e8c)'];
  const newRev = {
    id: Date.now(), name, initial: name[0].toUpperCase(),
    grad: gradients[Math.floor(Math.random()*gradients.length)],
    rating: reviewStarVal, date: new Date().toISOString().split('T')[0],
    country: '', product,
    text: { bn: text, en: text, ar: text },
    photos: [], helpful: 0
  };
  const stored = JSON.parse(localStorage.getItem('exglobal_reviews')||'[]');
  stored.push(newRev);
  localStorage.setItem('exglobal_reviews', JSON.stringify(stored));
  showToast('✓ ' + t('reviewSubmitted'));
  document.getElementById('wrName').value = '';
  document.getElementById('wrProduct').value = '';
  document.getElementById('wrText').value = '';
  reviewStarVal = 0;
  document.querySelectorAll('.wr-star').forEach(s=>s.classList.remove('on'));
  const lbl = document.getElementById('wrStarLabel');
  if (lbl) lbl.textContent = t('wrRatePh');
  closeWriteReview();
  renderRevSummary();
  renderRevList(activeRevFilter);
}

/* ===== EMOJI REACTIONS ===== */
const REACTION_EMOJIS = ['❤️','🔥','😍','👌','😮','😂','💯','🙏'];

function buildReactions(reviewId, helpfulCount) {
  const key = 'rev_reactions_' + reviewId;
  const saved = JSON.parse(localStorage.getItem(key) || '{}');
  // preset 👍 helpful count + spread among emojis for seed reviews
  const counts = {};
  REACTION_EMOJIS.forEach(e => { counts[e] = saved[e] || 0; });
  if (reviewId <= 5 && !localStorage.getItem(key)) {
    const spread = [helpfulCount, Math.floor(helpfulCount*.6), Math.floor(helpfulCount*.4), Math.floor(helpfulCount*.3), Math.floor(helpfulCount*.2), Math.floor(helpfulCount*.15), Math.floor(helpfulCount*.1), Math.floor(helpfulCount*.1)];
    REACTION_EMOJIS.forEach((e,i) => { counts[e] = spread[i] || 0; });
  }
  const myReaction = saved._mine || null;
  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  const topEmojis = REACTION_EMOJIS.filter(e=>counts[e]>0).sort((a,b)=>counts[b]-counts[a]).slice(0,4);
  const bubbles = topEmojis.map(e =>
    `<span class="react-bubble${myReaction===e?' my-react':''}" onclick="addReaction(${reviewId},'${e}',this)">${e} <span class="react-cnt">${counts[e]}</span></span>`
  ).join('');
  return `<div class="rev-reactions" data-rev="${reviewId}">
    <div class="react-bubbles">${bubbles}</div>
    <button class="react-add-btn" onclick="toggleEmojiPicker(${reviewId},this)" title="React">
      <i class="far fa-smile-beam"></i><i class="fas fa-plus react-plus-icon"></i>
    </button>
    <span class="react-total">${total>0?total+' reactions':''}</span>
    <div class="emoji-picker" id="picker_${reviewId}">
      ${REACTION_EMOJIS.map(e=>`<span class="ep-emoji${myReaction===e?' ep-active':''}" onclick="addReaction(${reviewId},'${e}',null)">${e}</span>`).join('')}
    </div>
  </div>`;
}

function toggleEmojiPicker(reviewId, btn) {
  const picker = document.getElementById('picker_' + reviewId);
  if (!picker) return;
  const isOpen = picker.classList.contains('open');
  document.querySelectorAll('.emoji-picker.open').forEach(p => p.classList.remove('open'));
  if (!isOpen) picker.classList.add('open');
}

function addReaction(reviewId, emoji, clickedEl) {
  const key = 'rev_reactions_' + reviewId;
  let saved = JSON.parse(localStorage.getItem(key) || '{}');
  const prev = saved._mine;
  if (reviewId <= 5 && !saved._seeded) {
    const spread = { '❤️':0,'🔥':0,'😍':0,'👌':0,'😮':0,'😂':0,'💯':0,'🙏':0 };
    const seedReview = SEED_REVIEWS.find(r=>r.id===reviewId);
    const h = seedReview ? seedReview.helpful : 0;
    const s = [h,Math.floor(h*.6),Math.floor(h*.4),Math.floor(h*.3),Math.floor(h*.2),Math.floor(h*.15),Math.floor(h*.1),Math.floor(h*.1)];
    REACTION_EMOJIS.forEach((e,i)=>{ spread[e]=s[i]||0; });
    saved = { ...spread, _seeded: true };
  }
  if (prev === emoji) {
    saved[emoji] = Math.max(0, (saved[emoji]||1) - 1);
    delete saved._mine;
  } else {
    if (prev) saved[prev] = Math.max(0, (saved[prev]||1) - 1);
    saved[emoji] = (saved[emoji]||0) + 1;
    saved._mine = emoji;
  }
  localStorage.setItem(key, JSON.stringify(saved));
  // close picker and re-render this card's reactions
  document.querySelectorAll('.emoji-picker.open').forEach(p=>p.classList.remove('open'));
  const wrap = document.querySelector(`.rev-reactions[data-rev="${reviewId}"]`);
  const seedReview = SEED_REVIEWS.find(r=>r.id===reviewId);
  if (wrap) wrap.outerHTML = buildReactions(reviewId, seedReview ? seedReview.helpful : 0);
}

function markHelpful(btn) {
  btn.classList.toggle('liked');
  const delta = btn.classList.contains('liked') ? 1 : -1;
  const countEl = btn.querySelector('.helpful-count');
  if (countEl) {
    const newVal = parseInt(countEl.textContent || '0') + delta;
    countEl.textContent = newVal;
    const txt = btn.closest('.review-footer')?.querySelector('.helpful-count-txt');
    if (txt) txt.textContent = newVal;
  }
}

/* ===== PWA INSTALL ===== */
(function initPWA() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/ex-rabbi/sw.js').catch(() => {});
  }

  let deferredPrompt = null;

  function showBanner() {
    // Don't show if dismissed within the last 7 days
    const dismissed = parseInt(localStorage.getItem('pwa_dismissed') || '0');
    if (Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) return;
    const banner = document.getElementById('pwaBanner');
    if (banner) banner.classList.add('show');
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(showBanner, 3000);
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const banner = document.getElementById('pwaBanner');
    if (banner) banner.classList.remove('show');
  });

  document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('pwaInstallBtn');
    const dismissBtn = document.getElementById('pwaDismiss');

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        const banner = document.getElementById('pwaBanner');
        if (banner) banner.classList.remove('show');
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        const banner = document.getElementById('pwaBanner');
        if (banner) banner.classList.remove('show');
        localStorage.setItem('pwa_dismissed', Date.now());
      });
    }

    // iOS Safari: show banner with instructions since no beforeinstallprompt
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone = window.navigator.standalone === true;
    if (isIos && !isStandalone) {
      setTimeout(showBanner, 3000);
      // Override install button for iOS
      const btn = document.getElementById('pwaInstallBtn');
      if (btn) {
        btn.addEventListener('click', () => {
          showToast('iOS: tap Share → "Add to Home Screen"');
        }, { once: true });
      }
    }
  });
})();

/* ===== AI SEARCH ===== */
let _aiSearchTimer = null;

function showSearchDropdown(q) {
  const box = document.getElementById('searchDropdown');
  if (!box) return;
  if (!q || q.length < 2) { box.innerHTML = ''; box.classList.remove('open'); return; }

  // Instant local results
  const s = q.toLowerCase();
  const localMatches = PRODUCTS.filter(p =>
    getName(p).toLowerCase().includes(s) ||
    p.category.includes(s) ||
    (p.description || '').toLowerCase().includes(s)
  ).slice(0, 6);

  if (localMatches.length > 0) {
    _renderDropdown(box, localMatches, false);
  } else {
    box.innerHTML = `<div class="sdrop-ai-loading"><span class="sdrop-spinner"></span> AI খুঁজছে...</div>`;
    box.classList.add('open');
  }

  // Debounced AI search for better results
  clearTimeout(_aiSearchTimer);
  _aiSearchTimer = setTimeout(() => _runAiSearch(q, box, localMatches.length === 0), 700);
}

function _renderDropdown(box, products, isAi) {
  if (!products.length) {
    box.innerHTML = `<div class="sdrop-empty"><i class="fas fa-search"></i> কোনো পণ্য পাওয়া যায়নি</div>`;
    box.classList.add('open');
    return;
  }
  const badge = isAi ? '<span class="sdrop-ai-badge">AI</span>' : '';
  box.innerHTML = `
    <div class="sdrop-header">${badge} ${isAi ? 'AI সাজেশন' : 'পণ্য পাওয়া গেছে'} (${products.length})</div>
    ${products.map(p => `
      <div class="sdrop-item" onclick="closeSearchDropdown();openModal(${p.id})">
        <img src="${p.image}" class="sdrop-img" loading="lazy" />
        <div class="sdrop-info">
          <div class="sdrop-name">${getName(p)}</div>
          <div class="sdrop-price">${fmtD(p.price)}</div>
        </div>
        <i class="fas fa-chevron-right sdrop-arrow"></i>
      </div>
    `).join('')}
  `;
  box.classList.add('open');
}

async function _runAiSearch(q, box, noLocal) {
  const workerUrl = getAiWorkerUrl();
  if (!workerUrl || !noLocal) return;
  try {
    const productList = PRODUCTS.slice(0, 30).map(p => `id:${p.id} name:"${getName(p)}" cat:${p.category}`).join(', ');
    const resp = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `Customer searched: "${q}". Available products: [${productList}]. Reply ONLY with a comma-separated list of up to 5 matching product IDs (numbers only). If nothing matches, reply "none".`
        }]
      })
    });
    const data = await resp.json();
    const reply = data?.content?.[0]?.text || 'none';
    if (reply.trim().toLowerCase() === 'none') {
      box.innerHTML = `<div class="sdrop-empty"><i class="fas fa-robot"></i> "${q}" নামে কোনো পণ্য নেই</div>`;
      return;
    }
    const ids = reply.match(/\d+/g)?.map(Number) || [];
    const aiProducts = ids.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 5);
    if (aiProducts.length) _renderDropdown(box, aiProducts, true);
  } catch(e) {
    if (noLocal) box.innerHTML = `<div class="sdrop-empty"><i class="fas fa-search"></i> কোনো পণ্য পাওয়া যায়নি</div>`;
  }
}

async function doAiSearch(q) {
  if (!q) return;
  const workerUrl = getAiWorkerUrl();
  if (!workerUrl) return;
  const s = q.toLowerCase();
  const localMatches = PRODUCTS.filter(p =>
    getName(p).toLowerCase().includes(s) || p.category.includes(s)
  );
  if (localMatches.length > 0) return; // local results are enough
  // Show AI thinking in products grid
  const grid = document.getElementById('productsGrid');
  if (grid) grid.innerHTML = `<div class="no-results"><i class="fas fa-robot fa-spin"></i><p>AI খুঁজছে...</p></div>`;
  const box = document.getElementById('searchDropdown');
  await _runAiSearch(q, box || document.createElement('div'), true);
}

function closeSearchDropdown() {
  const box = document.getElementById('searchDropdown');
  if (box) { box.classList.remove('open'); box.innerHTML = ''; }
}

/* ===== AI CHATBOT ===== */
let aiChatHistory = [];
let aiChatOpen = false;

function getAiWorkerUrl() {
  try { return (JSON.parse(localStorage.getItem('exg_settings') || '{}')).aiWorkerUrl || ''; } catch(e) { return ''; }
}

function openAiChat() {
  const overlay = document.getElementById('aiChatOverlay');
  const panel   = document.getElementById('aiChatPanel');
  if (!overlay || !panel) return;
  aiChatOpen = true;
  overlay.classList.add('open');
  panel.classList.add('open');
  document.body.style.overflow = 'hidden';
  const badge = document.getElementById('aiChatBadge');
  if (badge) badge.style.display = 'none';
  const inp = document.getElementById('aiChatInput');
  if (inp) setTimeout(() => inp.focus(), 300);
  if (aiChatHistory.length === 0) _aiRenderWelcome();
}

function closeAiChat() {
  aiChatOpen = false;
  document.getElementById('aiChatOverlay')?.classList.remove('open');
  document.getElementById('aiChatPanel')?.classList.remove('open');
  document.body.style.overflow = '';
}

function _aiRenderWelcome() {
  const lang = getCurrentLang ? getCurrentLang() : 'BN';
  const msgs = {
    BN: 'আসসালামু আলাইকুম! 👋 আমি EX GLOBAL-এর AI সহকারী। পণ্য, অর্ডার বা যেকোনো বিষয়ে সাহায্য করতে পারি।',
    EN: 'Hello! 👋 I\'m EX GLOBAL\'s AI assistant. I can help you with products, orders, or anything else!',
    AR: 'السلام عليكم! 👋 أنا مساعد EX GLOBAL الذكي. يمكنني مساعدتك في المنتجات والطلبات وأي شيء آخر!'
  };
  _aiAppendMsg('assistant', msgs[lang] || msgs['EN']);
}

function _aiAppendMsg(role, text) {
  const box = document.getElementById('aiChatMessages');
  if (!box) return;
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg-' + role;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function _aiShowTyping() {
  const box = document.getElementById('aiChatMessages');
  if (!box) return;
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg-assistant ai-typing';
  div.id = 'aiTypingIndicator';
  div.innerHTML = '<span></span><span></span><span></span>';
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function _aiRemoveTyping() {
  document.getElementById('aiTypingIndicator')?.remove();
}

async function sendAiMessage() {
  const inp = document.getElementById('aiChatInput');
  if (!inp) return;
  const text = inp.value.trim();
  if (!text) return;
  const workerUrl = getAiWorkerUrl();
  if (!workerUrl) {
    showToast('AI chatbot not configured yet.');
    return;
  }
  inp.value = '';
  _aiAppendMsg('user', text);
  aiChatHistory.push({ role: 'user', content: text });
  _aiShowTyping();
  const sendBtn = document.getElementById('aiChatSendBtn');
  if (sendBtn) sendBtn.disabled = true;
  try {
    const resp = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: aiChatHistory })
    });
    const data = await resp.json();
    _aiRemoveTyping();
    const reply = data?.content?.[0]?.text || 'Sorry, I could not respond. Please try again.';
    aiChatHistory.push({ role: 'assistant', content: reply });
    _aiAppendMsg('assistant', reply);
  } catch(e) {
    _aiRemoveTyping();
    _aiAppendMsg('assistant', 'Connection error. Please check your internet and try again.');
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    inp.focus();
  }
}

function aiChatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); }
}

/* ===== PUSH NOTIFICATIONS ===== */
let _fcmMessaging = null;
let _notifListening = false;

function _getVapidKey() {
  try { return JSON.parse(localStorage.getItem('exg_settings') || '{}').vapidKey || ''; } catch(e) { return ''; }
}

function _updateNotifStatusUI() {
  const el = document.getElementById('notifStatus');
  if (!el) return;
  if (!('Notification' in window)) { el.textContent = ''; return; }
  if (Notification.permission === 'granted') el.textContent = '✅ চালু';
  else if (Notification.permission === 'denied') el.textContent = '🚫 বন্ধ';
  else el.textContent = 'ট্যাপ করুন';
}

async function requestNotifPermission() {
  if (!('Notification' in window)) {
    showToast('এই ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই।');
    return;
  }
  if (Notification.permission === 'denied') {
    showToast('নোটিফিকেশন বন্ধ আছে। ব্রাউজার সেটিংস থেকে চালু করুন।');
    return;
  }
  if (Notification.permission === 'granted') {
    _updateNotifStatusUI();
    await _doFcmSubscribe();
    return;
  }
  const perm = await Notification.requestPermission();
  _updateNotifStatusUI();
  if (perm === 'granted') {
    showToast('🔔 নোটিফিকেশন চালু হয়েছে!');
    await _doFcmSubscribe();
  }
}

async function _doFcmSubscribe() {
  const vapidKey = _getVapidKey();
  if (!vapidKey) return; // VAPID key not set yet — token saved when admin configures it
  if (!('serviceWorker' in navigator)) return;
  try {
    if (!_fcmMessaging) {
      if (typeof firebase === 'undefined' || !firebase.apps?.length || !firebase.messaging) return;
      _fcmMessaging = firebase.messaging();
    }
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;
    const token = await _fcmMessaging.getToken({ vapidKey, serviceWorkerRegistration: swReg });
    if (token) await _saveFcmToken(token);
  } catch(e) {
    console.warn('FCM subscribe error:', e);
  }
}

async function _saveFcmToken(token) {
  if (!currentUser?.uid) return;
  if (typeof firebase === 'undefined' || !firebase.apps?.length || !firebase.firestore) return;
  try {
    await firebase.firestore().collection('fcm_tokens').doc(currentUser.uid).set({
      token,
      uid:   currentUser.uid,
      name:  currentUser.name  || '',
      email: currentUser.email || '',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch(e) {
    console.warn('Token save error:', e);
  }
}

function listenNotifications() {
  if (_notifListening) return;
  if (typeof firebase === 'undefined' || !firebase.apps?.length || !firebase.firestore) return;
  _notifListening = true;
  try {
    firebase.firestore().collection('notifications')
      .orderBy('createdAt', 'desc').limit(1)
      .onSnapshot(snap => {
        snap.docChanges().forEach(ch => {
          if (ch.type === 'added') {
            const d = ch.doc.data();
            const ts = d.createdAt?.toDate?.() || new Date(0);
            if (Date.now() - ts.getTime() < 90000) {
              const msg = [d.title, d.body].filter(Boolean).join(': ');
              showToast('🔔 ' + msg, 7000);
            }
          }
        });
      });
  } catch(e) {}
}

// Init on page load
document.addEventListener('DOMContentLoaded', () => {
  _updateNotifStatusUI();
  listenNotifications();
  // If already had permission + user logged in, re-subscribe silently
  if (Notification.permission === 'granted' && currentUser) {
    _doFcmSubscribe();
  }
});
