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
  // Try Firestore first — real-time sync across all devices
  const fsOk = await _tryLoadFirestore();
  if (fsOk) return;
  // Fallback: static store-data.json (manual GitHub publish)
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch('data/store-data.json?t=' + Date.now(), { cache: 'no-store', signal: ctrl.signal });
    clearTimeout(tid);
    if (!r.ok) return;
    const d = await r.json();
    if (!d || !d.published_at) return;
    const publishedAt = new Date(d.published_at).getTime();
    const lastEdit = new Date(localStorage.getItem('exg_last_admin_edit') || 0).getTime();
    if (lastEdit > publishedAt) return;
    _applyConfigMap(d);
  } catch(e) {}
}

async function _tryLoadFirestore() {
  try {
    if (typeof firebase === 'undefined' || !firebase.apps?.length || typeof firebase.firestore !== 'function') return false;
    const db = firebase.firestore();
    const doc = await Promise.race([
      db.collection('notifications').doc('store-config').get(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('fs-timeout')), 5000))
    ]);
    if (!doc.exists) return false;
    const d = doc.data();
    if (!d || !d.updated_at) return false;
    _applyConfigMap(d);
    // Real-time listener: notify customer when admin makes changes
    let _firstSnap = true;
    db.collection('store_config').doc('main').onSnapshot(snap => {
      if (_firstSnap) { _firstSnap = false; return; }
      if (!snap.exists) return;
      _applyConfigMap(snap.data());
      _showLiveUpdateBanner();
    }, () => {});
    return true;
  } catch(e) { return false; }
}

function _applyConfigMap(d) {
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
    'exg_trend_content':   d.trend_content,
    'exg_cat_images':      d.cat_images,
    'exg_custom_cats':     d.custom_cats,
  };
  Object.entries(map).forEach(([k, v]) => { if (v !== undefined) localStorage.setItem(k, JSON.stringify(v)); });
  // Refresh trend circle if content changed
  if (d.trend_content !== undefined) _initTrendCircle();
}

function _showLiveUpdateBanner() {
  if (document.getElementById('liveUpdateBanner')) return;
  const b = document.createElement('div');
  b.id = 'liveUpdateBanner';
  b.style.cssText = 'position:fixed;top:58px;left:0;right:0;z-index:99998;background:#e91e8c;color:#fff;text-align:center;padding:10px 16px;font-size:13px;font-weight:600;cursor:pointer;animation:fadeIn .3s';
  b.innerHTML = '🔄 নতুন আপডেট এসেছে — ট্যাপ করে রিফ্রেশ করুন';
  b.onclick = () => location.reload();
  document.body.appendChild(b);
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
  if (!p.names) return '';
  return p.names[currentLang] || p.names.en || p.names.bn || p.names.ar || p.names.hi || '';
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

const _langLabels = { bn: 'বাংলা', en: 'English', ar: 'العربية', hi: 'हिन्दी' };

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('exg_lang', lang);
  const T = TRANSLATIONS[lang];
  document.documentElement.dir = T.dir;
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  const lbl = document.getElementById('curLangLabel');
  if (lbl) lbl.textContent = _langLabels[lang] || lang;
  applyTranslations();
  _applySocialLinks();
  renderFlashDeals();
  renderSuperDeals();
  renderTrending();
  renderHotSeller();
  renderNewArrivals();
  renderCategoryStrips();
  const si = document.getElementById('searchInput');
  renderProducts(si ? si.value : '');
  renderCart();
  // refresh reviews entry strip count
  const ec = document.getElementById('revEntryCount');
  const stored = JSON.parse(localStorage.getItem('exglobal_reviews')||'[]');
  if (ec) ec.textContent = (stored.length + 4871).toLocaleString() + ' ' + (t('reviewsLabel')||'reviews');
}

function openLangPicker() {
  document.getElementById('langSheetOverlay').classList.add('open');
  document.getElementById('langSheet').classList.add('open');
  // highlight active language
  document.querySelectorAll('.lang-sheet-row').forEach(row => {
    row.classList.toggle('active', row.dataset.lang === currentLang);
  });
}

function closeLangPicker() {
  document.getElementById('langSheetOverlay').classList.remove('open');
  document.getElementById('langSheet').classList.remove('open');
}

function pickLang(lang) {
  setLang(lang);
  closeLangPicker();
}

function _revealPage() {
  document.documentElement.style.transition = 'opacity .18s';
  document.documentElement.style.opacity = '1';
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', async () => {
  try { await Promise.race([loadPublishedData(), new Promise(r => setTimeout(r, 2000))]); } catch(e) {}
  _applyProductOverrides();  // apply product additions/edits/deletions
  // Apply admin settings (delivery charge, free delivery threshold)
  try{const s=JSON.parse(localStorage.getItem('exg_settings')||'{}');if(s.delivery!==undefined)DELIVERY_SAR=parseFloat(s.delivery)||0;if(s.freeDelivery)FREE_DELIVERY_THRESHOLD_SAR=parseFloat(s.freeDelivery)||100;if(s.vatRate!==undefined)VAT_RATE=parseFloat(s.vatRate)||0;}catch(e){}
  applyTheme(currentTheme);
  setLang(localStorage.getItem('exg_lang') || 'en');
  _revealPage(); // remove opacity:0 set in <head>
  updateWishBadge();
  updateCartBadge();
  _initTrendCircle(); // show video/image inside Trend circle button
  renderFlashDeals();
  renderSuperDeals();
  renderTrending();
  renderHotSeller();
  renderNewArrivals();
  renderCategoryStrips();
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
  _applyColTiles();
  initColScroll();
});

/* ===== COLLECTION TILES — apply saved admin data ===== */
function _applyColTiles() {
  const saved = JSON.parse(localStorage.getItem('exg_col_tiles') || 'null');
  if (!saved) return;
  const container = document.getElementById('colShowcaseScroll');
  if (!container) return;
  // filter out empty tiles
  const tiles = saved.filter(t => t.img || t.name);
  if (!tiles.length) return;
  container.innerHTML = tiles.map(t => `
    <div class="col-showcase-tile" onclick="filterCategory('${t.cat || 'all'}')">
      <div class="col-tile-img" style="background-image:url('${t.img}')"></div>
      <div class="col-tile-name">${t.name}</div>
      <div class="col-tile-sub">${t.sub}</div>
    </div>
  `).join('');
}

/* ===== COLLECTION SHOWCASE AUTO-SCROLL ===== */
function initColScroll() {
  const el = document.getElementById('colShowcaseScroll');
  if (!el) return;
  // clone tiles for seamless infinite loop
  [...el.children].forEach(tile => el.appendChild(tile.cloneNode(true)));
  const half = () => el.scrollWidth / 2;
  let pos = 0, paused = false;
  el.addEventListener('mouseenter', () => paused = true);
  el.addEventListener('mouseleave', () => paused = false);
  el.addEventListener('touchstart', () => paused = true, { passive: true });
  el.addEventListener('touchend', () => { setTimeout(() => paused = false, 900); }, { passive: true });
  (function tick() {
    if (!paused) {
      pos += 0.5;
      if (pos >= half()) pos = 0;
      el.scrollLeft = pos;
    }
    requestAnimationFrame(tick);
  })();
}

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
        <img src="${p.image}" loading="lazy" alt="" onerror="this.onerror=null;this.src='https://picsum.photos/seed/p${p.id}/400/400'" ${p.imgFocus ? `style="object-position:${p.imgFocus.x}% ${p.imgFocus.y}%;transform:scale(${p.imgFocus.scale});transform-origin:${p.imgFocus.x}% ${p.imgFocus.y}%"` : ''} />
        <span class="discount-badge">-${p.discount}%</span>
      </div>
      <div class="product-info">
        <div class="product-prices"><span class="price-current">${fmt(p.price)}</span></div>
        <div class="product-meta"><span class="product-rating">★ ${p.rating}</span></div>
      </div>
    </div>
  `).join('');
}

function _dealMiniCard(p) {
  return `<div class="deal-mini-card" onclick="openModal(${p.id})">
    <img src="${p.image}" loading="lazy" alt="" onerror="this.onerror=null;this.src='https://picsum.photos/seed/p${p.id}/300/400'" ${p.imgFocus ? `style="object-position:${p.imgFocus.x}% ${p.imgFocus.y}%;transform:scale(${p.imgFocus.scale});transform-origin:${p.imgFocus.x}% ${p.imgFocus.y}%"` : ''} />
    <span class="deal-mini-badge">-${p.discount}%</span>
    <div class="deal-mini-price">${fmt(p.price)}</div>
  </div>`;
}

/* ===== RENDER SUPER DEALS ===== */
function renderSuperDeals() {
  const pins = JSON.parse(localStorage.getItem('exg_super_pins') || 'null');
  const items = pins
    ? pins.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 4)
    : PRODUCTS.filter(p => p.tag === 'sale' || p.tag === 'hot').slice(0, 4);
  document.getElementById('superDeals').innerHTML = items.map(_dealMiniCard).join('');
}

/* ===== RENDER TRENDING ===== */
function renderTrending() {
  const pins = JSON.parse(localStorage.getItem('exg_trend_pins') || 'null');
  const items = pins
    ? pins.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 4)
    : PRODUCTS.filter(p => p.tag === 'bestseller' || p.tag === 'new').slice(0, 4);
  document.getElementById('trendingProducts').innerHTML = items.map(_dealMiniCard).join('');
}

/* ===== RENDER HOT SELLER ===== */
function renderHotSeller() {
  const pins = JSON.parse(localStorage.getItem('exg_hot_pins') || 'null');
  const items = pins
    ? pins.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 4)
    : [...PRODUCTS].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 4);
  document.getElementById('hotSellerProducts').innerHTML = items.map(_dealMiniCard).join('');
}

/* ===== RENDER NEW ARRIVALS ===== */
function renderNewArrivals() {
  const pins = JSON.parse(localStorage.getItem('exg_new_pins') || 'null');
  const items = pins
    ? pins.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 4)
    : PRODUCTS.filter(p => p.tag === 'new').concat(PRODUCTS.filter(p => p.tag !== 'new')).slice(0, 4);
  document.getElementById('newArrivalsProducts').innerHTML = items.map(_dealMiniCard).join('');
}

/* ===== RENDER CATEGORY STRIPS ===== */
const _CAT_STRIPS = [
  { cat:'women',       icon:'👗', key:'catWomen',      color:'#fce4ec' },
  { cat:'men',         icon:'👔', key:'catMen',        color:'#e3f2fd' },
  { cat:'electronics', icon:'📱', key:'catElectronics',color:'#e8eaf6' },
  { cat:'beauty',      icon:'💄', key:'catBeauty',     color:'#fce4ec' },
  { cat:'shoes',       icon:'👠', key:'catShoes',      color:'#fff8e1' },
  { cat:'sports',      icon:'🏋️', key:'catSports',    color:'#e8f5e9' },
  { cat:'home',        icon:'🏠', key:'catHome',       color:'#f3e5f5' },
  { cat:'kids',        icon:'👶', key:'catKids',       color:'#fff3e0' },
  { cat:'bags',        icon:'👜', key:'catBags',       color:'#efebe9' },
  { cat:'jewelry',     icon:'💍', key:'catJewelry',    color:'#fff8e1' },
  { cat:'pets',        icon:'🐾', key:'catPets',       color:'#e8f5e9' },
];
function renderCategoryStrips() {
  const container = document.getElementById('catShowcaseStrips');
  if (!container) return;
  container.innerHTML = _CAT_STRIPS.map(cfg => {
    const prods = PRODUCTS.filter(p => p.category === cfg.cat).slice(0, 5);
    if (!prods.length) return '';
    const label = t(cfg.key) || cfg.key;
    return `<div class="cat-strip" style="--cs-bg:${cfg.color}">
      <div class="cat-strip-head">
        <div class="cat-strip-title-row">
          <span class="cat-strip-title">${label}</span>
        </div>
        <button class="cat-strip-seeall" onclick="filterCategory('${cfg.cat}');document.querySelector('.tab-btn[data-tab=\\'products\\']')?.click();window.scrollTo({top:document.getElementById('productsSection')?.offsetTop-60,behavior:'smooth'})">
          ${t('seeAll')||'See All'} <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div class="cat-strip-scroll">
        ${prods.map(p => `
          <div class="cat-strip-card" onclick="openModal(${p.id})">
            <div class="cat-strip-img-wrap">
              <img src="${p.image}" loading="lazy" alt="" onerror="this.src='https://picsum.photos/seed/p${p.id}/300/300'" />
              <span class="cat-strip-disc">-${p.discount}%</span>
              ${p.video ? `<div class="cat-strip-play"><i class="fas fa-play"></i></div>` : ''}
            </div>
            <div class="cat-strip-info">
              <p class="cat-strip-name">${getName(p)}</p>
              <div class="cat-strip-price">${fmt(p.price)}</div>
              <div class="cat-strip-stars">★ ${p.rating} <span>(${p.ratingCount>=1000?(p.ratingCount/1000).toFixed(1)+'k':p.ratingCount})</span></div>
            </div>
            <button class="cat-strip-add-btn${p.stock===0?' disabled':''}" onclick="event.stopPropagation();${p.stock===0?'':` flyCartAdd(event,${p.id})`}" ${p.stock===0?'style="opacity:.5;cursor:not-allowed"':''}>
              <i class="fas fa-${p.stock===0?'times-circle':'bag-shopping'}"></i>
              ${p.stock===0?(t('outOfStock')||'Out of Stock'):(t('addToCart')||'Add to Cart')}
            </button>
          </div>`).join('')}
        <div class="cat-strip-more" onclick="filterCategory('${cfg.cat}');document.querySelector('.tab-btn[data-tab=\\'products\\']')?.click();window.scrollTo({top:document.getElementById('productsSection')?.offsetTop-60,behavior:'smooth'})">
          <i class="fas fa-grip"></i><span>${t('seeAll')||'See All'}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ===== RENDER PRODUCTS ===== */
function renderProducts(searchTerm = '') {
  let filtered = currentFilter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === currentFilter);

  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(p =>
      getName(p).toLowerCase().includes(s) ||
      p.category.includes(s) ||
      (p.tag || '').toLowerCase().includes(s) ||
      (p.colorNames || []).some(c => c.toLowerCase().includes(s)) ||
      (p.description || '').toLowerCase().includes(s)
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

  const dots      = document.getElementById('autoLoadDots');
  const loadText  = document.getElementById('autoLoadText');
  const allDone   = document.getElementById('allLoadedMsg');
  const allDoneSpan = allDone ? allDone.querySelector('span') : null;
  const allLoaded = visibleCount >= filtered.length;
  if (dots)     dots.style.display     = allLoaded ? 'none' : 'flex';
  if (loadText) { loadText.style.display = allLoaded ? 'none' : 'block'; loadText.textContent = t('loadingMore') || 'Loading...'; }
  if (allDone)  allDone.style.display  = allLoaded ? 'flex'  : 'none';
  if (allDoneSpan) allDoneSpan.textContent = t('allProductsShown') || 'All shown';
}

function productCardHTML(p) {
  const inWish = wishlist.includes(p.id);
  const rcFmt = p.ratingCount >= 1000 ? (p.ratingCount/1000).toFixed(1)+'k' : p.ratingCount;
  const soldFmt = p.sold >= 1000 ? (p.sold/1000).toFixed(1)+'k' : p.sold;
  return `
    <div class="product-card" onclick="openModal(${p.id})">
      <div class="product-img-wrap">
        <img src="${p.image}" loading="lazy" alt="" onerror="this.onerror=null;this.src='https://picsum.photos/seed/p${p.id}/400/400'" ${p.imgFocus ? `style="object-position:${p.imgFocus.x}% ${p.imgFocus.y}%;transform:scale(${p.imgFocus.scale});transform-origin:${p.imgFocus.x}% ${p.imgFocus.y}%"` : ''} />
        ${p.discount >= 40 ? `<span class="flash-badge">⚡FLASH</span>` : ''}
        <button class="wish-btn ${inWish ? 'active' : ''}"
          onclick="event.stopPropagation();toggleWish(${p.id},this)">
          <i class="${inWish ? 'fas' : 'far'} fa-heart"></i>
        </button>
      </div>
      <div class="product-info">
        <p class="product-name">${getName(p)}</p>
        <div class="pc-price-row">
          <span class="price-current">${fmt(p.price)}</span>
          <span class="pc-disc-pill">-${p.discount}%</span>
        </div>
        <div class="pc-meta-row">
          <span class="pc-star">★ ${p.rating} (${rcFmt})</span>
          <span class="pc-sep">|</span>
          <span class="pc-sold">${soldFmt} ${t('soldText')}</span>
        </div>
        <div class="pc-location"><i class="fas fa-location-dot"></i> Riyadh, KSA</div>
        ${p.stock === 0 ? `<div class="stock-badge out"><i class="fas fa-times-circle"></i> ${t('outOfStock')}</div>` : p.stock !== undefined && p.stock <= 5 ? `<div class="stock-badge low"><i class="fas fa-fire"></i> ${(t('lowStock')||'Only {n} left!').replace('{n}',p.stock)}</div>` : ''}
      </div>
      <button class="add-cart-btn${p.stock === 0 ? ' disabled' : ''}" onclick="event.stopPropagation();${p.stock === 0 ? '' : `flyCartAdd(event,${p.id})`}" ${p.stock === 0 ? 'style="opacity:.45;cursor:not-allowed"' : ''}>
        ${p.stock === 0 ? `<i class="fas fa-times-circle" style="margin-right:5px;opacity:.7"></i>${t('outOfStock')}` : `<i class="fas fa-bag-shopping" style="margin-right:5px;font-size:11px"></i>${t('addToCart')}`}
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

  // Infinite scroll — load more products when sentinel enters viewport
  const sentinel = document.getElementById('autoLoadSentinel');
  const spinner  = document.getElementById('autoLoadSpinner');
  if (sentinel) {
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      const q = document.getElementById('searchInput').value;
      // Check if more products exist
      const allFiltered = PRODUCTS.filter(p => !q || p.names?.bn?.includes(q) || p.names?.en?.toLowerCase().includes(q.toLowerCase()));
      if (visibleCount >= allFiltered.length) return;
      // Show spinner briefly then load more
      if (spinner) spinner.style.display = 'block';
      setTimeout(() => {
        visibleCount += 8;
        renderProducts(q);
        if (spinner) spinner.style.display = 'none';
      }, 400);
    }, { rootMargin: '200px' });
    observer.observe(sentinel);
  }

  document.getElementById('searchToggleBtn').addEventListener('click', () => {
    openVspPanel();
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
    const sp = document.getElementById('stcPendWrap');
    const cb = document.getElementById('cartBody');
    if (cc) cc.style.display = 'none';
    if (sp) sp.style.display = 'none';
    if (ci) ci.style.display = '';
    if (cb) cb.style.display = '';
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
  setTimeout(() => cc.classList.add('animate'), 30);
  setTimeout(_ccLaunchConfetti, 200);
}
function _ccLaunchConfetti() {
  const wrap = document.getElementById('ccConfettiWrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  const colors = ['#e91e8c','#8b2be2','#ffd700','#00bcd4','#ff5722','#4caf50','#ff9800','#2196f3'];
  for (let i = 0; i < 36; i++) {
    const el = document.createElement('div');
    el.className = 'cc-confetti-piece';
    const size = 5 + Math.random() * 7;
    el.style.cssText = `left:${Math.random()*100}%;background:${colors[i%colors.length]};width:${size}px;height:${size}px;border-radius:${Math.random()>.5?'50%':'3px'};animation-duration:${.9+Math.random()*1.2}s;animation-delay:${Math.random()*.6}s;`;
    wrap.appendChild(el);
  }
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
    const hasDiscount = p.originalPrice && p.originalPrice > p.price;
    const discPct = hasDiscount ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
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
            <div class="cart-item-price-col">
              ${hasDiscount ? `<span class="cart-item-original">${fmt(p.originalPrice * item.qty)}</span>` : ''}
              <span class="cart-item-line-total">${fmt(p.price * item.qty)}</span>
              ${hasDiscount ? `<span class="cart-item-disc-badge">-${discPct}%</span>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const subtotalBase = cart.reduce((s, i) => {
    const p = PRODUCTS.find(p => p.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  const originalBase = cart.reduce((s, i) => {
    const p = PRODUCTS.find(p => p.id === i.id);
    return s + (p ? (p.originalPrice || p.price) * i.qty : 0);
  }, 0);
  const subtotalDisp = subtotalBase * lang.rate;
  const originalDisp = originalBase * lang.rate;
  const discountDisp = originalDisp - subtotalDisp;
  const freeDelivery = subtotalDisp >= FREE_DELIVERY_THRESHOLD_SAR;
  const deliveryDisp = freeDelivery ? 0 : DELIVERY_SAR;
  const fmtD = v => lang.currency + Math.round(v).toLocaleString();

  // Delivery progress (VIP design)
  const pct = Math.min(100, (subtotalDisp / FREE_DELIVERY_THRESHOLD_SAR) * 100);
  const progBox = document.getElementById('cartDelProg');
  const needed = FREE_DELIVERY_THRESHOLD_SAR - subtotalDisp;
  if (progBox) {
    if (freeDelivery) {
      progBox.innerHTML = `
        <div class="del-free-strip">
          <i class="fas fa-truck-fast"></i>
          <span>${t('freeDeliveryActive').replace(/🎉/g,'').trim()}</span>
          <i class="fas fa-check-circle" style="margin-left:auto"></i>
        </div>`;
    } else {
      progBox.innerHTML = `
        <div class="del-mini">
          <div class="del-mini-row">
            <i class="fas fa-truck"></i>
            <span>${t('addMoreFree') || 'Add'} <b>${fmtD(needed)}</b> ${t('moreForFree') || 'more for free delivery'}</span>
          </div>
          <div class="del-mini-track"><div class="del-mini-fill" style="width:${pct}%"></div></div>
        </div>`;
    }
  }

  // Summary values
  const origEl = document.getElementById('cartOriginalTotal');
  const discEl = document.getElementById('cartDiscountDisp');
  if (origEl) origEl.textContent = fmtD(originalDisp);
  if (discEl) discEl.textContent = '-' + fmtD(discountDisp);
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
  // Delivery address strip — always show in cart footer
  let addrStrip = document.getElementById('cartAddrStrip');
  if (!addrStrip) {
    addrStrip = document.createElement('div');
    addrStrip.id = 'cartAddrStrip';
    footer.insertBefore(addrStrip, footer.firstChild);
  }
  if (!savedLocation || !savedLocation.name || !savedLocation.phone || !savedLocation.city) {
    addrStrip.className = 'cart-addr-strip cart-addr-strip--missing';
    addrStrip.innerHTML = `
      <div class="cas-left">
        <i class="fas fa-location-dot cas-icon"></i>
        <div>
          <p class="cas-label">${t('deliveryAddress') || 'Delivery address required'}</p>
          <p class="cas-sub">${t('addAddressHint') || 'Add your address to place order'}</p>
        </div>
      </div>
      <button class="cas-add-btn" onclick="closeCart();setTimeout(openLocation,300)">
        ${t('addBtn') || 'Add'} <i class="fas fa-chevron-right"></i>
      </button>`;
  } else {
    addrStrip.className = 'cart-addr-strip cart-addr-strip--set';
    addrStrip.innerHTML = `
      <div class="cas-left">
        <i class="fas fa-circle-check cas-icon"></i>
        <div>
          <p class="cas-label">${savedLocation.name} · ${savedLocation.phone}</p>
          <p class="cas-sub">${[savedLocation.city, savedLocation.area].filter(Boolean).join(', ')}</p>
        </div>
      </div>
      <button class="cas-change-btn" onclick="closeCart();setTimeout(openLocation,300)">
        ${t('changeBtn') || 'Change'}
      </button>`;
  }
  // Remove old-style warning if still present
  const _oldWarn = document.getElementById('cartAddrWarn');
  if (_oldWarn) _oldWarn.remove();
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
  if (!_soundOn) return;
  try {
    const ctx = _getAudioCtx();
    const now = ctx.currentTime;

    function vipNote(freq, type, vol, start, dur) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(start); osc.stop(start + dur + 0.05);
    }

    // VIP luxury bell arpeggio — C5 → E5 → G5 → C6 (major chord rising)
    vipNote(523,  'sine',     0.30, now,        0.55);  // C5 bell hit
    vipNote(1046, 'triangle', 0.12, now,        0.50);  // C6 overtone shimmer
    vipNote(659,  'sine',     0.26, now + 0.11, 0.50);  // E5
    vipNote(1319, 'triangle', 0.09, now + 0.11, 0.42);  // E6 shimmer
    vipNote(784,  'sine',     0.22, now + 0.22, 0.48);  // G5
    vipNote(1047, 'sine',     0.28, now + 0.34, 0.65);  // C6 — crown note, longer ring
    vipNote(2093, 'triangle', 0.07, now + 0.34, 0.55);  // C7 sparkle on crown
    vipNote(2637, 'sine',     0.04, now + 0.38, 0.40);  // E7 ultra sparkle
    // Soft bass "thud" for luxury weight
    vipNote(130,  'sine',     0.18, now,        0.22);
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
  _abandonedCartReset();
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
    _flyWishAnimation(id, btn);
    showToast(t('wishlisted'));
  }
  saveWishlist();
  updateWishBadge();
}

function _flyWishAnimation(id, srcBtn) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const wishBtn = document.getElementById('wishlistBtn');
  if (!wishBtn) return;

  const card   = srcBtn ? srcBtn.closest('.product-card') : null;
  const imgEl  = card ? card.querySelector('img') : null;
  const imgSrc = (imgEl && imgEl.src) ? imgEl.src : (p.image || '');
  if (!imgSrc) return;

  const startRect = srcBtn ? srcBtn.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2, width: 0, height: 0 };
  const endRect   = wishBtn.getBoundingClientRect();

  const size   = 44;
  const startX = startRect.left + startRect.width  / 2 - size / 2;
  const startY = startRect.top  + startRect.height / 2 - size / 2;
  const endX   = endRect.left   + endRect.width    / 2 - size / 2;
  const endY   = endRect.top    + endRect.height   / 2 - size / 2;

  // Pulse the heart button
  if (srcBtn) { srcBtn.style.transform = 'scale(1.4)'; setTimeout(() => { srcBtn.style.transform = ''; }, 300); }

  const fly = document.createElement('div');
  fly.style.cssText = `position:fixed;width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:2.5px solid #e91e8c;box-shadow:0 0 16px rgba(233,30,140,.75);z-index:99999;pointer-events:none;left:${startX}px;top:${startY}px;will-change:transform,opacity`;
  fly.innerHTML = `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
  document.body.appendChild(fly);

  const duration  = 580;
  const arcHeight = Math.max(100, Math.abs(startY - endY) * 0.5);
  const t0        = performance.now();

  function ease(t) { return t < .5 ? 2*t*t : -1+(4-2*t)*t; }

  function step(now) {
    const raw = Math.min((now - t0) / duration, 1);
    const ep  = ease(raw);
    const x   = startX + (endX - startX) * ep;
    const y   = startY + (endY - startY) * ep - arcHeight * Math.sin(Math.PI * raw);
    const sc  = 1 - 0.6 * ep;
    const op  = raw > 0.78 ? 1 - (raw - 0.78) / 0.22 : 1;
    fly.style.left      = x  + 'px';
    fly.style.top       = y  + 'px';
    fly.style.transform = `scale(${sc})`;
    fly.style.opacity   = op;
    if (raw < 1) { requestAnimationFrame(step); return; }
    fly.remove();
    // Bounce the wishlist icon
    wishBtn.style.transform = 'scale(1.45)';
    setTimeout(() => { wishBtn.style.transform = ''; }, 220);
  }
  requestAnimationFrame(step);
}

/* ===== STATIC PAGES ===== */
const PAGE_CONTENT = {
  about: {
    en: { title: 'About Us', body: `
      <h2>🛍️ Welcome to EX GLOBAL</h2>
      <p>EX GLOBAL is a premium online fashion destination proudly serving customers across Saudi Arabia. We bring the latest trends in women's, men's, and children's fashion — along with beauty products and home essentials — all at competitive prices with fast, reliable delivery.</p>
      <div class="info-card">🇸🇦 Based in Saudi Arabia · Serving the Kingdom since 2021</div>
      <h2>🎯 Our Mission</h2>
      <p>We believe everyone deserves access to quality fashion. Our team carefully curates every product in our collection to ensure the highest standards of style, comfort, and value.</p>
      <h2>💎 Why Shop With Us?</h2>
      <ul>
        <li>Thousands of products across all categories</li>
        <li>Free shipping on orders over SAR 100</li>
        <li>7-day hassle-free returns</li>
        <li>Secure payment — Cash on Delivery available</li>
        <li>Fast delivery across Saudi Arabia</li>
      </ul>
      <h2>📱 Follow Us</h2>
      <p>Stay updated with the latest arrivals and exclusive offers on our social media channels.</p>
    `},
    ar: { title: 'من نحن', body: `
      <h2>🛍️ مرحباً بك في EX GLOBAL</h2>
      <p>EX GLOBAL هو متجر أزياء إلكتروني متميز يخدم عملاءنا في جميع أنحاء المملكة العربية السعودية. نقدم لك أحدث صيحات الموضة للنساء والرجال والأطفال، فضلاً عن منتجات التجميل ومستلزمات المنزل، بأسعار تنافسية وتوصيل سريع وموثوق.</p>
      <div class="info-card">🇸🇦 مقرنا في المملكة العربية السعودية · نخدم المملكة منذ عام 2021</div>
      <h2>🎯 مهمتنا</h2>
      <p>نؤمن بأن الجميع يستحق الوصول إلى أزياء عالية الجودة. يختار فريقنا كل منتج في مجموعتنا بعناية لضمان أعلى معايير الأناقة والراحة والقيمة.</p>
      <h2>💎 لماذا تتسوق معنا؟</h2>
      <ul>
        <li>آلاف المنتجات في جميع الفئات</li>
        <li>شحن مجاني للطلبات التي تزيد عن 100 ريال</li>
        <li>إرجاع مجاني خلال 7 أيام</li>
        <li>دفع آمن — الدفع عند الاستلام متاح</li>
        <li>توصيل سريع في جميع أنحاء المملكة</li>
      </ul>
    `},
    bn: { title: 'আমাদের সম্পর্কে', body: `
      <h2>🛍️ EX GLOBAL-এ স্বাগতম</h2>
      <p>EX GLOBAL সৌদি আরব জুড়ে গ্রাহকদের সেবা দেওয়া একটি প্রিমিয়াম অনলাইন ফ্যাশন স্টোর। আমরা নারী, পুরুষ ও শিশুদের জন্য সর্বশেষ ফ্যাশন, বিউটি পণ্য এবং হোম প্রোডাক্ট সরবরাহ করি — সব প্রতিযোগিতামূলক মূল্যে এবং দ্রুত ডেলিভারিতে।</p>
      <div class="info-card">🇸🇦 সৌদি আরবে প্রতিষ্ঠিত · ২০২১ সাল থেকে সেবায় আছি</div>
      <h2>🎯 আমাদের লক্ষ্য</h2>
      <p>আমরা বিশ্বাস করি সবাই মানসম্মত ফ্যাশন পাওয়ার যোগ্য। আমাদের টিম প্রতিটি পণ্য যত্ন সহকারে বাছাই করে সর্বোচ্চ মান নিশ্চিত করে।</p>
      <h2>💎 আমাদের বেছে নিন কেন?</h2>
      <ul>
        <li>সব ক্যাটাগরিতে হাজার হাজার পণ্য</li>
        <li>SAR ১০০-এর উপরে অর্ডারে ফ্রি শিপিং</li>
        <li>৭ দিনের সহজ রিটার্ন</li>
        <li>নিরাপদ পেমেন্ট — ক্যাশ অন ডেলিভারি সুবিধা</li>
        <li>সৌদি আরব জুড়ে দ্রুত ডেলিভারি</li>
      </ul>
    `},
  },
  contact: {
    en: { title: 'Contact Us', body: `
      <h2>💬 Get In Touch</h2>
      <p>We're here to help! Reach out to us through any of the channels below and we'll get back to you as soon as possible.</p>
      <a class="contact-btn" href="https://wa.me/966546224029?text=Hello, I need help with my order" target="_blank"><i class="fab fa-whatsapp"></i> WhatsApp: +966 546 224 029</a>
      <div class="info-card">⏰ Available: Saturday – Thursday · 9 AM – 9 PM (AST)<br/>We reply within <strong>2–4 hours</strong> during working hours.</div>
      <h2>📧 Email</h2>
      <p>exglobalbusiness@gmail.com</p>
      <h2>📱 Social Media</h2>
      <p>You can also DM us on Instagram or TikTok for quick questions about products, sizes, or availability.</p>
      <h2>📦 Order Issues?</h2>
      <p>If you have a problem with your order (wrong item, damaged product, delayed delivery), please WhatsApp us with your order number and a photo — we'll resolve it quickly.</p>
    `},
    ar: { title: 'اتصل بنا', body: `
      <h2>💬 تواصل معنا</h2>
      <p>نحن هنا لمساعدتك! تواصل معنا عبر أي من القنوات أدناه وسنرد عليك في أقرب وقت ممكن.</p>
      <a class="contact-btn" href="https://wa.me/966546224029?text=مرحباً، أحتاج مساعدة بخصوص طلبي" target="_blank"><i class="fab fa-whatsapp"></i> واتساب: 966546224029+</a>
      <div class="info-card">⏰ متاحون: السبت – الخميس · 9 صباحاً – 9 مساءً<br/>نرد خلال <strong>2–4 ساعات</strong> في ساعات العمل.</div>
      <h2>📧 البريد الإلكتروني</h2>
      <p>exglobalbusiness@gmail.com</p>
      <h2>📦 مشكلة في طلبك؟</h2>
      <p>إذا كانت لديك مشكلة في طلبك (منتج خاطئ، تالف، تأخر في التوصيل)، يرجى التواصل معنا عبر واتساب مع رقم الطلب وصورة — وسنحلها بسرعة.</p>
    `},
    bn: { title: 'যোগাযোগ করুন', body: `
      <h2>💬 আমাদের সাথে যোগাযোগ</h2>
      <p>আমরা সবসময় আপনার সাহায্যে আছি। যেকোনো প্রশ্ন বা সমস্যায় নিচের যেকোনো মাধ্যমে যোগাযোগ করুন।</p>
      <a class="contact-btn" href="https://wa.me/966546224029?text=হ্যালো, আমার অর্ডার নিয়ে সাহায্য দরকার" target="_blank"><i class="fab fa-whatsapp"></i> WhatsApp: +966 546 224 029</a>
      <div class="info-card">⏰ সময়: শনিবার – বৃহস্পতিবার · সকাল ৯টা – রাত ৯টা<br/>কর্মঘণ্টায় <strong>২–৪ ঘণ্টার</strong> মধ্যে সাড়া দিই।</div>
      <h2>📧 ইমেইল</h2>
      <p>exglobalbusiness@gmail.com</p>
      <h2>📦 অর্ডারে সমস্যা?</h2>
      <p>ভুল পণ্য, ক্ষতিগ্রস্ত পণ্য বা ডেলিভারি দেরি হলে — অর্ডার নম্বর ও ছবি সহ WhatsApp করুন, আমরা দ্রুত সমাধান করব।</p>
    `},
  },
  privacy: {
    en: { title: 'Privacy Policy', body: `
      <p style="color:#888;font-size:12px">Last updated: January 2025</p>
      <h2>📋 Information We Collect</h2>
      <ul>
        <li>Name, phone number, and delivery address (for order processing)</li>
        <li>Email address (for account creation and order updates)</li>
        <li>Device information and browsing data (via cookies)</li>
        <li>Payment information — processed securely and never stored on our servers</li>
      </ul>
      <h2>🔒 How We Use Your Information</h2>
      <ul>
        <li>To process and deliver your orders</li>
        <li>To send order confirmations and delivery updates via WhatsApp</li>
        <li>To improve our website and customer experience</li>
        <li>To send promotional offers (you can opt out anytime)</li>
      </ul>
      <h2>🚫 We Do NOT</h2>
      <ul>
        <li>Sell your personal data to third parties</li>
        <li>Store your payment card details</li>
        <li>Share your information without your consent</li>
      </ul>
      <h2>🍪 Cookies</h2>
      <p>We use cookies to remember your cart, language preference, and improve your browsing experience. You can disable cookies in your browser settings at any time.</p>
      <h2>📬 Contact</h2>
      <p>For privacy concerns, contact us at: exglobalbusiness@gmail.com</p>
    `},
    ar: { title: 'سياسة الخصوصية', body: `
      <p style="color:#888;font-size:12px">آخر تحديث: يناير 2025</p>
      <h2>📋 المعلومات التي نجمعها</h2>
      <ul>
        <li>الاسم ورقم الهاتف وعنوان التوصيل (لمعالجة الطلبات)</li>
        <li>البريد الإلكتروني (لإنشاء الحساب وتحديثات الطلبات)</li>
        <li>معلومات الجهاز وبيانات التصفح (عبر ملفات تعريف الارتباط)</li>
      </ul>
      <h2>🔒 كيف نستخدم معلوماتك</h2>
      <ul>
        <li>لمعالجة طلباتك وتوصيلها</li>
        <li>لإرسال تأكيدات الطلبات عبر واتساب</li>
        <li>لتحسين موقعنا وتجربة العملاء</li>
      </ul>
      <h2>🚫 لا نقوم بـ</h2>
      <ul>
        <li>بيع بياناتك الشخصية لأطراف ثالثة</li>
        <li>تخزين بيانات بطاقتك الائتمانية</li>
        <li>مشاركة معلوماتك دون موافقتك</li>
      </ul>
    `},
    bn: { title: 'প্রাইভেসি পলিসি', body: `
      <p style="color:#888;font-size:12px">সর্বশেষ আপডেট: জানুয়ারি ২০২৫</p>
      <h2>📋 আমরা যা তথ্য সংগ্রহ করি</h2>
      <ul>
        <li>নাম, ফোন নম্বর ও ডেলিভারি ঠিকানা (অর্ডার প্রক্রিয়াকরণের জন্য)</li>
        <li>ইমেইল ঠিকানা (অ্যাকাউন্ট ও অর্ডার আপডেটের জন্য)</li>
        <li>ডিভাইসের তথ্য ও ব্রাউজিং ডেটা (কুকি-র মাধ্যমে)</li>
      </ul>
      <h2>🔒 তথ্য ব্যবহারের উদ্দেশ্য</h2>
      <ul>
        <li>আপনার অর্ডার প্রক্রিয়া ও ডেলিভারি করতে</li>
        <li>WhatsApp-এ অর্ডার কনফার্মেশন পাঠাতে</li>
        <li>ওয়েবসাইট ও সেবা উন্নত করতে</li>
      </ul>
      <h2>🚫 আমরা করি না</h2>
      <ul>
        <li>তৃতীয় পক্ষের কাছে আপনার তথ্য বিক্রি</li>
        <li>পেমেন্ট কার্ডের তথ্য সংরক্ষণ</li>
        <li>আপনার অনুমতি ছাড়া তথ্য শেয়ার</li>
      </ul>
      <h2>📬 যোগাযোগ</h2>
      <p>গোপনীয়তা সংক্রান্ত যেকোনো বিষয়ে: exglobalbusiness@gmail.com</p>
    `},
  },
  refund: {
    en: { title: 'Refund Policy', body: `
      <div class="info-card">✅ We offer a <strong>7-day return window</strong> from the date of delivery.</div>
      <h2>📦 Return Conditions</h2>
      <ul>
        <li>Item must be unused and in original condition</li>
        <li>Original packaging and tags must be intact</li>
        <li>Item must not be washed, altered, or damaged</li>
        <li>Sale items and undergarments are non-returnable</li>
      </ul>
      <h2>🔄 How to Return</h2>
      <ul>
        <li>WhatsApp us at +966 546 224 029 within 7 days of delivery</li>
        <li>Send your order number and photos of the item</li>
        <li>Our team will arrange pickup or guide you through the process</li>
      </ul>
      <h2>💰 Refund Timeline</h2>
      <ul>
        <li>Refunds are processed within <strong>3–5 business days</strong> after we receive the item</li>
        <li>Refund will be credited to your original payment method</li>
        <li>For Cash on Delivery orders: refund via bank transfer</li>
      </ul>
      <h2>❌ Non-Returnable Items</h2>
      <ul>
        <li>Underwear and swimwear (for hygiene reasons)</li>
        <li>Customised or personalised items</li>
        <li>Items marked as final sale</li>
      </ul>
    `},
    ar: { title: 'سياسة الاسترجاع', body: `
      <div class="info-card">✅ نقدم <strong>نافذة إرجاع مدتها 7 أيام</strong> من تاريخ التسليم.</div>
      <h2>📦 شروط الإرجاع</h2>
      <ul>
        <li>يجب أن تكون السلعة غير مستخدمة وفي حالتها الأصلية</li>
        <li>يجب أن تكون العبوة الأصلية والعلامات سليمة</li>
        <li>لا يجوز أن تكون السلعة مغسولة أو معدلة أو تالفة</li>
        <li>لا يمكن إرجاع الملابس الداخلية والعناصر المخصومة</li>
      </ul>
      <h2>🔄 كيفية الإرجاع</h2>
      <ul>
        <li>تواصل معنا عبر واتساب خلال 7 أيام من التسليم</li>
        <li>أرسل رقم طلبك وصور المنتج</li>
        <li>سيتولى فريقنا ترتيب الاستلام</li>
      </ul>
      <h2>💰 موعد الاسترداد</h2>
      <p>تتم معالجة المبالغ المستردة خلال <strong>3–5 أيام عمل</strong> بعد استلام المنتج.</p>
    `},
    bn: { title: 'রিফান্ড পলিসি', body: `
      <div class="info-card">✅ ডেলিভারির তারিখ থেকে <strong>৭ দিনের মধ্যে</strong> রিটার্ন করা যাবে।</div>
      <h2>📦 রিটার্নের শর্ত</h2>
      <ul>
        <li>পণ্য অব্যবহৃত ও মূল অবস্থায় থাকতে হবে</li>
        <li>মূল প্যাকেজিং ও ট্যাগ অক্ষত থাকতে হবে</li>
        <li>পণ্য ধোয়া, পরিবর্তন বা ক্ষতিগ্রস্ত হলে রিটার্ন হবে না</li>
        <li>অন্তর্বাস ও সেল পণ্য ফেরতযোগ্য নয়</li>
      </ul>
      <h2>🔄 রিটার্ন প্রক্রিয়া</h2>
      <ul>
        <li>ডেলিভারির ৭ দিনের মধ্যে +966 546 224 029-এ WhatsApp করুন</li>
        <li>অর্ডার নম্বর ও পণ্যের ছবি পাঠান</li>
        <li>আমাদের টিম পিকআপ বা প্রক্রিয়া গাইড করবে</li>
      </ul>
      <h2>💰 রিফান্ড সময়সীমা</h2>
      <p>পণ্য পাওয়ার <strong>৩–৫ কর্মদিবসের</strong> মধ্যে রিফান্ড প্রক্রিয়া সম্পন্ন হবে।</p>
      <h2>❌ রিটার্নযোগ্য নয়</h2>
      <ul>
        <li>অন্তর্বাস ও সুইমওয়্যার (স্বাস্থ্যবিধির কারণে)</li>
        <li>কাস্টমাইজড বা ব্যক্তিগতকৃত পণ্য</li>
        <li>ফাইনাল সেল হিসেবে চিহ্নিত পণ্য</li>
      </ul>
    `},
  },
  shipping: {
    en: { title: 'Shipping Policy', body: `
      <div class="info-card">🚚 We deliver across <strong>all regions of Saudi Arabia</strong>.</div>
      <h2>⏱️ Delivery Times</h2>
      <ul>
        <li><strong>Riyadh, Jeddah, Dammam:</strong> 1–3 business days</li>
        <li><strong>Other major cities:</strong> 2–4 business days</li>
        <li><strong>Remote areas:</strong> 4–7 business days</li>
      </ul>
      <h2>💰 Shipping Rates</h2>
      <ul>
        <li>Standard shipping: <strong>SAR 15</strong></li>
        <li>Free shipping on orders over <strong>SAR 100</strong> 🎉</li>
      </ul>
      <h2>📦 Order Processing</h2>
      <ul>
        <li>Orders placed before 2 PM are processed the same day</li>
        <li>Orders placed after 2 PM are processed the next business day</li>
        <li>You'll receive a WhatsApp notification once your order is shipped</li>
      </ul>
      <h2>🔍 Track Your Order</h2>
      <p>Once shipped, you'll receive a tracking number via WhatsApp. You can also check your order status in the <strong>My Account</strong> section of the app.</p>
      <h2>❓ Delayed Delivery?</h2>
      <p>If your order hasn't arrived within the expected timeframe, please contact us on WhatsApp at +966 546 224 029 with your order number.</p>
    `},
    ar: { title: 'سياسة الشحن', body: `
      <div class="info-card">🚚 نوصل إلى <strong>جميع مناطق المملكة العربية السعودية</strong>.</div>
      <h2>⏱️ مواعيد التسليم</h2>
      <ul>
        <li><strong>الرياض وجدة والدمام:</strong> 1–3 أيام عمل</li>
        <li><strong>المدن الرئيسية الأخرى:</strong> 2–4 أيام عمل</li>
        <li><strong>المناطق النائية:</strong> 4–7 أيام عمل</li>
      </ul>
      <h2>💰 رسوم الشحن</h2>
      <ul>
        <li>الشحن العادي: <strong>15 ريال</strong></li>
        <li>شحن مجاني للطلبات التي تزيد عن <strong>100 ريال</strong> 🎉</li>
      </ul>
      <h2>📦 معالجة الطلبات</h2>
      <ul>
        <li>الطلبات قبل 2 مساءً تُعالج في نفس اليوم</li>
        <li>ستتلقى إشعاراً عبر واتساب عند شحن طلبك</li>
      </ul>
    `},
    bn: { title: 'শিপিং পলিসি', body: `
      <div class="info-card">🚚 আমরা <strong>সৌদি আরবের সব অঞ্চলে</strong> ডেলিভারি দিই।</div>
      <h2>⏱️ ডেলিভারির সময়</h2>
      <ul>
        <li><strong>রিয়াদ, জেদ্দা, দাম্মাম:</strong> ১–৩ কর্মদিবস</li>
        <li><strong>অন্যান্য প্রধান শহর:</strong> ২–৪ কর্মদিবস</li>
        <li><strong>দূরবর্তী এলাকা:</strong> ৪–৭ কর্মদিবস</li>
      </ul>
      <h2>💰 শিপিং চার্জ</h2>
      <ul>
        <li>স্ট্যান্ডার্ড শিপিং: <strong>SAR ১৫</strong></li>
        <li>SAR ১০০-এর উপরে অর্ডারে ফ্রি শিপিং 🎉</li>
      </ul>
      <h2>📦 অর্ডার প্রক্রিয়াকরণ</h2>
      <ul>
        <li>দুপুর ২টার আগের অর্ডার একই দিনে প্রক্রিয়া করা হয়</li>
        <li>শিপমেন্টের পর WhatsApp-এ ট্র্যাকিং নম্বর পাঠানো হবে</li>
      </ul>
      <h2>❓ দেরি হলে কি করবেন?</h2>
      <p>নির্ধারিত সময়ের মধ্যে পণ্য না আসলে অর্ডার নম্বর সহ +966 546 224 029-এ WhatsApp করুন।</p>
    `},
  },
};

function openPage(type) {
  const page = PAGE_CONTENT[type];
  if (!page) return;
  const lang = page[currentLang] || page.en;
  document.getElementById('pageTitle').textContent = lang.title;
  document.getElementById('pageBody').innerHTML = lang.body;
  document.getElementById('pagePanel').classList.add('open');
  document.getElementById('pageOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  // Close settings panel if open
  const sp = document.getElementById('settingsPanel');
  if (sp && sp.classList.contains('open')) sp.classList.remove('open');
}

function closePage() {
  document.getElementById('pagePanel').classList.remove('open');
  document.getElementById('pageOverlay').classList.remove('open');
  document.body.style.overflow = '';
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
      </div>
      <div class="modal-rating">
        <span class="stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5-Math.round(p.rating))}</span>
        <span class="rating-count">${p.rating} (${p.ratingCount.toLocaleString()} ${t('reviews')}) · 🔥 ${p.sold >= 1000 ? (p.sold/1000).toFixed(1)+'k' : p.sold}+ ${t('soldText')}</span>
      </div>
      <div class="modal-viewing">
        <span class="modal-view-dot"></span>
        <span>${15 + ((p.id * 7 + p.ratingCount) % 70)} ${t('peopleViewing') || 'people are viewing this'}</span>
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
      <div class="color-label-row">
        <p class="modal-section-title">${t('colorSelect')}</p>
        <span class="color-selected-label" id="colorSelectedLabel">${p.colorNames ? p.colorNames[0] || '' : ''}</span>
      </div>
      <div class="color-options">
        ${p.colors.map((c,i) => p.colorImages && p.colorImages[i]
          ? `<div class="color-img-opt ${i===0?'active':''}" onclick="selectColor('${c}',this,${p.id},${i})" data-img="${p.colorImages[i]}" data-name="${p.colorNames?.[i]||''}"><img src="${p.colorImages[i]}" alt="" loading="lazy" /></div>`
          : `<div class="color-opt ${i===0?'active':''}" style="background:${c}" onclick="selectColor('${c}',this,${p.id},-1)"></div>`
        ).join('')}
      </div>
      <div class="modal-divider"></div>
      ${p.description ? `<div class="modal-desc">${p.description.replace(/\n/g,'<br>')}</div><div class="modal-divider"></div>` : ''}
      ${(()=>{const av=Object.entries(_allCoupons()).filter(([c])=>!isCouponUsed(c));return av.length?`<div class="pd-coupon-row" onclick="openPdCoupons()"><div class="pd-coupon-icon"><i class="fas fa-percent"></i></div><span class="pd-coupon-text">Extra ${av[0][1].pct}% off — CODE: ${av[0][0]}</span><i class="fas fa-chevron-right pd-coupon-chev"></i></div>`:'';})()}
      <div style="display:flex;gap:12px;font-size:13px;color:#666;flex-wrap:wrap">
        <span><i class="fas fa-truck" style="color:#e91e8c"></i> ${t('freeDeliveryInfo')}</span>
        <span><i class="fas fa-undo" style="color:#e91e8c"></i> ${t('returnInfo')}</span>
      </div>
      ${p.video ? `<button class="modal-video-btn" onclick="_openProductVideo('${p.video}')">
        <i class="fas fa-play-circle"></i> <span data-i18n="watchVideo">Watch Video</span>
      </button>` : ''}
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
      <button class="btn-add-cart${p.stock === 0 ? ' disabled' : ''}" id="modalAddCartBtn" onclick="${p.stock === 0 ? '' : `modalAddCart(${p.id})`}" ${p.stock === 0 ? 'style="opacity:.45;cursor:not-allowed"' : ''}>${p.stock === 0 ? `<i class="fas fa-times-circle" style="margin-right:6px;opacity:.7"></i>${t('outOfStock')}` : `<i class="fas fa-bag-shopping" style="margin-right:7px"></i>${t('addToCart')}`}</button>
    </div>
    ${_deliveryEstHTML()}
  `;
  history.replaceState({}, '', '?p=' + id);
  document.getElementById('productModal').classList.add('open');
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function _openProductVideo(videoId) {
  const overlay = document.createElement('div');
  overlay.className = 'video-overlay';
  const isLocal = videoId.match(/\.(mp4|webm|mov)(\?|$)/i);
  const innerHtml = isLocal
    ? `<video controls autoplay playsinline style="width:100%;height:100%;object-fit:contain;border-radius:12px"><source src="${videoId}"/></video>`
    : `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  overlay.innerHTML = `
    <div class="video-container">
      <button class="video-close" onclick="this.closest('.video-overlay').remove()"><i class="fas fa-xmark"></i></button>
      ${innerHtml}
    </div>`;
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
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
function selectColor(color, el, productId, imgIdx) {
  selectedColor = color;
  document.querySelectorAll('.color-opt, .color-img-opt').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  // Update color name label
  const nameEl = document.getElementById('colorSelectedLabel');
  if (nameEl) nameEl.textContent = el.dataset.name || '';
  // If image thumbnail selected, update the main modal product image
  if (imgIdx >= 0) {
    const imgSrc = el.dataset.img;
    const mainImg = document.getElementById('modalMainImg');
    if (mainImg && imgSrc) mainImg.src = imgSrc;
  }
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

function openPdCoupons() {
  const av = Object.entries(_allCoupons()).filter(([c]) => !isCouponUsed(c));
  if (!av.length) return;
  const list = document.getElementById('pdCouponList');
  if (!list) return;
  list.innerHTML = av.map(([code, c]) => `
    <div class="pd-cs-card">
      <div class="pd-cs-card-top">
        <div class="pd-cs-pct-badge">
          <span class="pd-cs-pct-num">${c.pct}%</span>
          <span class="pd-cs-pct-off">OFF</span>
        </div>
        <div class="pd-cs-info">
          <div class="pd-cs-head-title">Extra ${c.pct}% Off</div>
          <div class="pd-cs-head-sub">${c.oneTime ? 'One-time use only' : 'Unlimited use'}</div>
        </div>
      </div>
      <div class="pd-cs-code-row">
        <span class="pd-cs-code-lbl">Code:</span>
        <span class="pd-cs-code">${code}</span>
        <button class="pd-cs-copy-btn" onclick="navigator.clipboard.writeText('${code}').then(()=>{showToast('✅ Code copied!');})">
          <i class="fas fa-copy"></i> Copy
        </button>
      </div>
      <div class="pd-cs-terms">
        <p>Valid on all products in your cart</p>
        <p>Apply code at checkout in payment page</p>
        ${c.oneTime ? '<p>Can only be used once per account</p>' : ''}
      </div>
    </div>`).join('');
  document.getElementById('pdCouponOverlay').classList.add('open');
  document.getElementById('pdCouponSheet').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closePdCoupons() {
  document.getElementById('pdCouponOverlay').classList.remove('open');
  document.getElementById('pdCouponSheet').classList.remove('open');
  document.body.style.overflow = '';
}

function _allCoupons() {
  const map = Object.assign({}, COUPONS);
  try {
    const extra = JSON.parse(localStorage.getItem('exg_extra_coupons') || '[]');
    extra.forEach(c => { if (c.code) map[c.code.toUpperCase()] = { pct: c.pct, oneTime: !!c.oneTime }; });
  } catch(e) {}
  return map;
}

function _showCouponSuggestions() {
  const box = document.getElementById('couponSuggestBox');
  if (!box) return;
  const all = _allCoupons();
  // All coupons are one-time use — filter out already used ones
  const available = Object.entries(all).filter(([code]) => !isCouponUsed(code));
  if (!available.length) { box.style.display = 'none'; return; }
  box.innerHTML = `<div class="coupon-suggest-hd"><i class="fas fa-gift"></i>&nbsp; AVAILABLE VOUCHERS</div>` +
    available.map(([code, c]) => `
      <div class="coupon-suggest-item" onclick="_applySuggestedCoupon('${code}')">
        <div class="csi-icon"><i class="fas fa-tag"></i></div>
        <div class="csi-info">
          <div class="csi-code">${code}</div>
          <div class="csi-desc">One-time use &nbsp;·&nbsp; Tap to apply</div>
        </div>
        <div class="csi-pct">-${c.pct}%</div>
      </div>`).join('');
  box.style.display = 'block';
}

function _applySuggestedCoupon(code) {
  const input = document.getElementById('couponInput');
  if (input) { input.value = code; }
  document.getElementById('couponSuggestBox').style.display = 'none';
  applyCoupon();
}

function applyCoupon() {
  const input = document.getElementById('couponInput');
  const msg = document.getElementById('couponMsg');
  const code = (input.value || '').trim().toUpperCase();
  if (!code) return;
  document.getElementById('couponSuggestBox').style.display = 'none';
  const coupon = _allCoupons()[code];
  if (!coupon) {
    msg.innerHTML = '<i class="fas fa-circle-xmark"></i> ' + (t('couponInvalid') || 'Invalid coupon code');
    msg.className = 'pay-coupon-msg error';
    appliedCoupon = null;
    refreshPaymentSummary();
    return;
  }
  if (isCouponUsed(code)) {
    msg.innerHTML = '<i class="fas fa-circle-xmark"></i> ' + (t('couponUsed') || 'Already used');
    msg.className = 'pay-coupon-msg error';
    appliedCoupon = null;
    refreshPaymentSummary();
    return;
  }
  appliedCoupon = { code, pct: coupon.pct };
  msg.innerHTML = '<i class="fas fa-circle-check"></i> ' + (t('couponApplied') || 'Coupon applied!') + ' &nbsp;—&nbsp; <strong>-' + coupon.pct + '%</strong>';
  msg.className = 'pay-coupon-msg success';
  refreshPaymentSummary();
}

function refreshPaymentSummary() {
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
  const subtotalBase = cartSubtotalBase();
  const subtotalDisp = subtotalBase * lang.rate;
  const fmtD = (v) => lang.currency + Math.round(v).toLocaleString();

  // Product-level discount (originalPrice vs actual price)
  const originalBase = cart.reduce((s, i) => {
    const p = PRODUCTS.find(p => p.id === i.id);
    return s + (p ? (p.originalPrice || p.price) * i.qty : 0);
  }, 0);
  const originalDisp = originalBase * lang.rate;
  const itemDiscountDisp = originalDisp - subtotalDisp;
  const origEl = document.getElementById('payOriginalTotal');
  const itemDiscEl = document.getElementById('payItemDiscount');
  if (origEl) origEl.textContent = fmtD(originalDisp);
  if (itemDiscEl) itemDiscEl.textContent = '-' + fmtD(itemDiscountDisp);

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
  // WhatsApp orders disabled — use codCheckout instead
  codCheckout();
}

function codCheckout() {
  // Re-validate location before placing order
  if (!savedLocation || !savedLocation.name || !savedLocation.phone || !savedLocation.city) {
    showToast('📍 Please add a delivery address first');
    closePayment();
    setTimeout(openLocation, 400);
    return;
  }
  if (cart.length === 0) return;
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
  const subtotalBase = cartSubtotalBase();
  const subtotalDisp = subtotalBase * lang.rate;
  const discountAmt = appliedCoupon ? subtotalDisp * (appliedCoupon.pct / 100) : 0;
  const freeDelivery = (subtotalDisp - discountAmt) >= FREE_DELIVERY_THRESHOLD_SAR;
  const deliveryDisp = freeDelivery ? 0 : DELIVERY_SAR;
  const grandDisp = subtotalDisp - discountAmt + deliveryDisp;
  if (appliedCoupon) markCouponUsed(appliedCoupon.code);
  const newOrd = _saveOrderRecord(cart, grandDisp, 'cod');
  cart = []; _saveCart(); updateCartBadge();
  closePayment();
  openCart();
  showOrderConfirm(newOrd?.id, (lang.currency || 'SAR ') + Math.round(grandDisp).toLocaleString());
}

/* ===== BOTTOM NAV ===== */
/* ===== TREND CIRCLE MEDIA ===== */
function _initTrendCircle() {
  const data = JSON.parse(localStorage.getItem('exg_trend_content') || 'null');
  const wrap = document.querySelector('.bot-center-btn .bot-icon-wrap');
  if (!wrap) return;

  // Remove any previous media
  wrap.querySelectorAll('video, img.trend-circle-img, .trend-circle-overlay').forEach(el => el.remove());

  if (!data || !data.url) return; // no content — show default lightning icon

  // Hide the lightning bolt icon
  const icon = wrap.querySelector('i');
  if (icon) icon.style.display = 'none';

  // Overlay tint
  const overlay = document.createElement('div');
  overlay.className = 'trend-circle-overlay';
  wrap.appendChild(overlay);

  if (data.type === 'video') {
    const isYT = data.url.includes('youtu');
    if (isYT) {
      // YouTube — use thumbnail as still image in circle (can't embed in 52px)
      const vid = data.url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      if (vid) {
        const img = document.createElement('img');
        img.className = 'trend-circle-img';
        img.src = `https://img.youtube.com/vi/${vid[1]}/mqdefault.jpg`;
        wrap.insertBefore(img, wrap.firstChild);
      }
    } else {
      // MP4 — play inside circle
      const video = document.createElement('video');
      video.src = data.url;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      wrap.insertBefore(video, wrap.firstChild);
      video.play().catch(() => {});
    }
  } else {
    // Image
    const img = document.createElement('img');
    img.className = 'trend-circle-img';
    img.src = data.url;
    wrap.insertBefore(img, wrap.firstChild);
  }
}

function openTrendContent() {
  const data = JSON.parse(localStorage.getItem('exg_trend_content') || 'null');
  if (!data || !data.url) return; // nothing configured

  // Build modal
  let existing = document.getElementById('trendModal');
  if (existing) existing.remove();

  const isVideo = data.type === 'video';
  const isYouTube = isVideo && (data.url.includes('youtu') || data.url.includes('youtube'));
  let mediaHtml = '';
  if (isYouTube) {
    const vid = data.url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    const embedId = vid ? vid[1] : '';
    mediaHtml = `<iframe src="https://www.youtube.com/embed/${embedId}?autoplay=1&playsinline=1" frameborder="0" allowfullscreen allow="autoplay" style="width:100%;aspect-ratio:9/16;max-height:72vh;border-radius:16px"></iframe>`;
  } else if (isVideo) {
    mediaHtml = `<video src="${data.url}" controls autoplay playsinline style="width:100%;max-height:72vh;border-radius:16px;background:#000"></video>`;
  } else {
    mediaHtml = `<img src="${data.url}" style="width:100%;max-height:80vh;object-fit:contain;border-radius:16px"/>`;
  }

  const modal = document.createElement('div');
  modal.id = 'trendModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.88);padding:16px';
  modal.innerHTML = `
    <div style="width:100%;max-width:420px;position:relative">
      <button onclick="document.getElementById('trendModal').remove()" style="position:absolute;top:-14px;right:-8px;z-index:1;width:36px;height:36px;border-radius:50%;background:#222;color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;border:2px solid #444">✕</button>
      ${mediaHtml}
    </div>`;
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  document.body.appendChild(modal);
}

function setBottomActive(el) {
  if (el.classList.contains('active')) return;
  document.querySelectorAll('.bot-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  // Bounce the icon on tap
  const wrap = el.querySelector('.bot-icon-wrap');
  if (wrap) {
    wrap.style.animation = 'none';
    void wrap.offsetWidth; // reflow
    wrap.style.animation = 'botIconBounce .4s cubic-bezier(.34,1.56,.64,1)';
    setTimeout(() => { wrap.style.animation = ''; }, 420);
  }
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

function _deleteAddress() {
  if (!confirm('Delete your saved address?')) return;
  savedLocation = null;
  localStorage.removeItem('exglobal_location');
  refreshMeAddress();
  // Refresh cart strip if cart is open
  const footer = document.getElementById('cartFooter');
  if (footer && footer.style.display !== 'none') renderCart();
  showToast('Address deleted');
}

function refreshMeAddress() {
  const addrCard = document.getElementById('meAddrCard');
  const addRow   = document.getElementById('meAddAddrRow');
  if (!addrCard || !addRow) return;
  if (savedLocation && (savedLocation.name || savedLocation.city)) {
    addrCard.style.display = 'block';
    addRow.style.display   = 'none';
    const name  = (savedLocation.name  || '').trim();
    const phone = (savedLocation.phone || '').trim();
    const city  = (savedLocation.city  || '').trim();
    const area  = (savedLocation.area  || '').trim();
    const type  = savedLocation.type || 'home';
    const label = (savedLocation.label || '').trim();
    const extra = [savedLocation.apt, savedLocation.building, savedLocation.directions]
                    .map(s => (s || '').trim()).filter(Boolean).join(' · ');
    const typeIcon  = type === 'work' ? 'fa-briefcase' : type === 'other' ? 'fa-location-dot' : 'fa-house';
    const typeLabel = label || (type === 'work' ? 'Work' : type === 'other' ? 'Other' : 'Home');
    const addrLine  = [area, city, 'Saudi Arabia'].filter(Boolean).join(', ');
    const namePhone = [name, phone].filter(Boolean).join(' · ');
    addrCard.innerHTML = `
      <div class="me-addr-card-inner">
        <div class="me-addr-icon-box"><i class="fas ${typeIcon}"></i></div>
        <div class="me-addr-info">
          <div class="me-addr-top-row">
            <span class="me-addr-name">${namePhone}</span>
            <span class="me-addr-type-tag">${typeLabel}</span>
          </div>
          <div class="me-addr-line1">${addrLine}</div>
          ${extra ? `<div class="me-addr-extra">${extra}</div>` : ''}
        </div>
        <div class="me-addr-actions">
          <button class="me-addr-edit-btn" onclick="openLocation()" title="Edit"><i class="fas fa-pen"></i></button>
          <button class="me-addr-del-btn" onclick="_deleteAddress()" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
  } else {
    addrCard.style.display = 'none';
    addRow.style.display   = 'flex';
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
  // Show panel
  document.getElementById('profileOverlay').classList.add('open');
  document.getElementById('profilePanel').style.transform = 'translateX(0)';
  document.body.style.overflow = 'hidden';
}

function closeProfile() {
  document.getElementById('profileOverlay').classList.remove('open');
  document.getElementById('profilePanel').style.transform = 'translateX(100%)';
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
let savedLocation = JSON.parse(localStorage.getItem('exglobal_location') || 'null');
let locMap = null, _locSearchTimer = null, _locCurrentAddr = '';
let _locCurrLat = 24.7136, _locCurrLng = 46.6753, _locCurrData = {};
let _locGeocodeTimer = null, _locGeocoding = false;
let _locGpsWatcher = null, _locGpsBestAccuracy = Infinity;

function openLocation() {
  document.getElementById('locOverlay').classList.add('open');
  document.getElementById('locModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  const fab = document.getElementById('aiChatFab');
  if (fab) fab.style.display = 'none';
  const det = document.getElementById('locDetails');
  if (det) det.style.display = 'none';
  setTimeout(() => { _initLocMap(); _locAutoGps(); }, 350);
  // When user returns from browser settings, retry GPS
  const _retry = () => { if (document.getElementById('locOverlay')?.classList.contains('open')) _locAutoGps(); };
  document.removeEventListener('visibilitychange', _retry);
  document.addEventListener('visibilitychange', _retry);
}

function _initLocMap() {
  if (!window.google?.maps) { showToast('Map loading…'); setTimeout(_initLocMap, 800); return; }
  if (locMap) {
    google.maps.event.trigger(locMap, 'resize');
    if (savedLocation?.lat) {
      const c = locMap.getCenter();
      const dist = Math.abs(c.lat() - savedLocation.lat) + Math.abs(c.lng() - savedLocation.lng);
      if (dist > 0.01) locMap.setCenter({ lat: savedLocation.lat, lng: savedLocation.lng });
    }
    return;
  }
  const defaultLat = savedLocation?.lat || 24.0;
  const defaultLng = savedLocation?.lng || 45.0;
  _locCurrLat = defaultLat; _locCurrLng = defaultLng;

  locMap = new google.maps.Map(document.getElementById('locMap'), {
    center: { lat: defaultLat, lng: defaultLng },
    zoom: savedLocation?.lat ? 16 : 6,
    disableDefaultUI: true,
    gestureHandling: 'greedy',
    clickableIcons: false,
  });

  locMap.addListener('drag', () => {
    const pin = document.getElementById('locPinWrap');
    if (pin) pin.style.transform = 'translate(-50%,-110%) scale(1.18)';
  });
  locMap.addListener('idle', () => {
    const pin = document.getElementById('locPinWrap');
    if (pin) pin.style.transform = 'translate(-50%,-100%)';
    const c = locMap.getCenter();
    _locCurrLat = c.lat(); _locCurrLng = c.lng();
    _locReverseGeocode(c.lat(), c.lng());
  });

  _locReverseGeocode(defaultLat, defaultLng);
}

let _locUserDot = null;
function _locShowUserDot(lat, lng) {
  const addDot = () => {
    if (!locMap || !window.google?.maps) return;
    if (_locUserDot) _locUserDot.setMap(null);
    _locUserDot = new google.maps.Marker({
      position: { lat, lng }, map: locMap,
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8,
        fillColor: '#4285F4', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
      zIndex: 1,
    });
  };
  if (locMap && window.google?.maps) addDot(); else setTimeout(addDot, 800);
}

let _locNearbyAddrs = [];
function _locReverseGeocode(lat, lng) {
  clearTimeout(_locGeocodeTimer);
  _locGeocoding = true;
  _locCurrentAddr = '';
  _locCurrData = {};
  const addrEl = document.getElementById('locAddrText');
  if (addrEl) addrEl.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#e91e8c;margin-right:6px"></i>Finding address…';
  const labelEl = document.getElementById('locPinLabel');
  if (labelEl) { labelEl.textContent = ''; labelEl.classList.remove('show'); }
  const nearbyEl = document.getElementById('locNearbyList');
  if (nearbyEl) nearbyEl.style.display = 'none';

  _locGeocodeTimer = setTimeout(() => {
    const _applyAddr = (formatted, components) => {
      _locGeocoding = false;
      if (!formatted) { if (addrEl) addrEl.textContent = 'Drag map to set location'; return; }
      _locCurrentAddr = formatted;
      _locCurrLat = lat; _locCurrLng = lng;
      _locCurrData = components || {};
      if (addrEl) addrEl.textContent = formatted;
      if (labelEl) { labelEl.textContent = formatted; labelEl.classList.add('show'); }
      const street = [components?.road, components?.suburb, components?.city, components?.country].filter(Boolean).join(', ');
      const area   = [components?.suburb, components?.city, components?.country].filter(Boolean).join(', ');
      _locNearbyAddrs = [formatted, street, area].filter((v, i, arr) => v && arr.indexOf(v) === i);
      if (nearbyEl && _locNearbyAddrs.length > 1) {
        nearbyEl.style.display = 'block';
        nearbyEl.innerHTML = _locNearbyAddrs.map((addr, i) => `
          <div class="loc-nearby-item${i===0?' active':''}" onclick="_locSelectNearby(${i})">
            <div class="loc-nearby-radio"></div>
            <span class="loc-nearby-addr">${addr}</span>
          </div>`).join('');
      }
    };
    const _nominatimFallback = () => {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`)
        .then(r => r.json()).then(data => {
          const a = data.address || {};
          const addr = [a.house_number, a.road, a.suburb||a.neighbourhood, a.city||a.town||a.village||a.county, a.country].filter(Boolean).join(', ') || data.display_name || '';
          _applyAddr(addr, { road:a.road, suburb:a.suburb||a.neighbourhood, city:a.city||a.town||a.village||a.county, country:a.country, house_number:a.house_number });
        }).catch(() => { _locGeocoding = false; if (addrEl) addrEl.textContent = 'Drag map to set location'; });
    };
    if (window.google?.maps) {
      new google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
        if (status !== 'OK' || !results?.length) { _nominatimFallback(); return; }
        const best = results[0];
        const get = (type) => (best.address_components||[]).find(c=>c.types.includes(type))?.long_name||'';
        _applyAddr(best.formatted_address, {
          road:get('route'), suburb:get('sublocality')||get('neighborhood'),
          city:get('locality')||get('administrative_area_level_2'),
          country:get('country'), house_number:get('street_number'), postcode:get('postal_code'),
        });
      });
    } else { _nominatimFallback(); }
  }, 400);
}

function _locSelectNearby(idx) {
  if (!_locNearbyAddrs[idx]) return;
  _locCurrentAddr = _locNearbyAddrs[idx];
  const addrEl = document.getElementById('locAddrText');
  if (addrEl) addrEl.textContent = _locCurrentAddr;
  const labelEl = document.getElementById('locPinLabel');
  if (labelEl) { labelEl.textContent = _locCurrentAddr; labelEl.classList.add('show'); }
  const nearbyEl = document.getElementById('locNearbyList');
  if (nearbyEl) nearbyEl.querySelectorAll('.loc-nearby-item').forEach((el, i) => el.classList.toggle('active', i === idx));
}

let _locAddrType = 'home', _locTagSelected = '';

function _locOpenDetails() {
  const addrEl = document.getElementById('locAddrText');
  if (_locGeocoding) {
    if (addrEl) { addrEl.textContent = 'Getting address… please wait ⏳'; addrEl.classList.add('loc-addr-hint'); setTimeout(()=>addrEl.classList.remove('loc-addr-hint'),1800); }
    return;
  }
  if (!_locCurrentAddr) {
    if (addrEl) { addrEl.classList.add('loc-addr-shake'); setTimeout(()=>addrEl.classList.remove('loc-addr-shake'),500); }
    return;
  }
  const det = document.getElementById('locDetails');
  if (!det) return;

  // Populate address card
  document.getElementById('locDetAddrText').textContent = _locCurrentAddr;

  // Pre-fill fields
  const a = _locCurrData;
  const building = [a.house_number, a.road].filter(Boolean).join(', ');
  document.getElementById('locBuilding').value = building || savedLocation?.building || '';
  document.getElementById('locApt').value = savedLocation?.apt || '';
  document.getElementById('locDirections').value = savedLocation?.directions || '';
  document.getElementById('locName').value = savedLocation?.name || '';
  document.getElementById('locPhone').value = savedLocation?.phone || '';

  // Set type buttons using data-type attribute
  _locAddrType = savedLocation?.type || 'home';
  document.querySelectorAll('.loc-type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === _locAddrType);
  });

  _locRenderTags();
  det.style.display = 'flex';
  // Hide map UI elements that bleed through
  const toast = document.getElementById('locMapToast');
  if (toast) toast.style.display = 'none';
  // Auto-focus name field if empty
  const nameEl = document.getElementById('locName');
  if (nameEl && !nameEl.value) setTimeout(() => nameEl.focus(), 300);
}

function _locBackToMap() {
  const det = document.getElementById('locDetails');
  if (det) det.style.display = 'none';
}

function _locSetType(btn, type) {
  _locAddrType = type;
  document.querySelectorAll('.loc-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function _locRenderTags() {
  const saved = JSON.parse(localStorage.getItem('exg_addr_labels') || '[]');
  const container = document.getElementById('locDetTags');
  if (!container) return;
  container.innerHTML = saved.map(label => `
    <button class="loc-det-tag${label === _locTagSelected ? ' active' : ''}" onclick="_locSelectTag('${label}')">${label}</button>
  `).join('');
}

function _locSelectTag(label) {
  _locTagSelected = (_locTagSelected === label) ? '' : label;
  _locRenderTags();
}

function _locAddTag() {
  const label = prompt('Enter a label for this address (e.g. "Home Riyadh"):');
  if (!label || !label.trim()) return;
  const saved = JSON.parse(localStorage.getItem('exg_addr_labels') || '[]');
  if (!saved.includes(label.trim())) { saved.push(label.trim()); localStorage.setItem('exg_addr_labels', JSON.stringify(saved)); }
  _locTagSelected = label.trim();
  _locRenderTags();
}

function _locSearchDebounce(val) {
  clearTimeout(_locSearchTimer);
  const drop = document.getElementById('locSearchDrop');
  if (!val.trim()) { if (drop) drop.style.display = 'none'; return; }
  // Show loading immediately
  if (drop) {
    drop.innerHTML = `<div class="loc-search-loading"><i class="fas fa-spinner fa-spin"></i> Searching…</div>`;
    drop.style.display = 'block';
  }
  _locSearchTimer = setTimeout(() => _locDoSearch(val), 400);
}

function _locDoSearch(query) {
  if (!query) query = (document.getElementById('locSearchInput') || {}).value || '';
  const q = query.trim();
  if (!q) return;
  const drop = document.getElementById('locSearchDrop');
  if (!drop) return;

  const _showNominatimSearch = () => {
    const bias = `&viewbox=${_locCurrLng-1},${_locCurrLat+1},${_locCurrLng+1},${_locCurrLat-1}&bounded=0`;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&accept-language=en&countrycodes=sa${bias}`)
      .then(r=>r.json()).then(results => {
        if (!results?.length) { drop.innerHTML=`<div class="loc-search-empty"><i class="fas fa-search"></i> No results</div>`; return; }
        drop.innerHTML = results.map(r => {
          const parts = (r.display_name||'').split(',');
          return `<div class="loc-search-item" onclick="_locSelectResult(${r.lat},${r.lon},\`${(r.display_name||'').replace(/\`/g,"'").substring(0,120)}\`)">
            <i class="fas fa-location-dot"></i>
            <div class="loc-search-text">
              <span class="loc-search-main">${parts.slice(0,2).join(',').trim()}</span>
              <span class="loc-search-sub">${parts.slice(2,4).join(',').trim()}</span>
            </div></div>`;
        }).join('');
        drop.style.display = 'block';
      }).catch(()=>{ drop.innerHTML=`<div class="loc-search-empty"><i class="fas fa-wifi-slash"></i> Network error</div>`; });
  };

  if (window.google?.maps?.places) {
    new google.maps.places.AutocompleteService().getPlacePredictions({
      input: q, componentRestrictions: { country: 'sa' },
    }, (predictions, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions?.length) { _showNominatimSearch(); return; }
      drop.innerHTML = predictions.map(p => {
        const main = p.structured_formatting?.main_text || p.description;
        const sub  = p.structured_formatting?.secondary_text || '';
        return `<div class="loc-search-item" onclick="_locSelectPlace('${p.place_id}','${(p.description||'').replace(/'/g,"\\'").substring(0,120)}')">
          <i class="fas fa-location-dot"></i>
          <div class="loc-search-text">
            <span class="loc-search-main">${main}</span>
            ${sub ? `<span class="loc-search-sub">${sub}</span>` : ''}
          </div>
        </div>`;
      }).join('');
      drop.style.display = 'block';
    });
  } else { _showNominatimSearch(); }
}

function _locSelectResult(lat, lng, displayName) {
  const drop = document.getElementById('locSearchDrop'); if (drop) drop.style.display = 'none';
  const inp = document.getElementById('locSearchInput'); if (inp) inp.value = '';
  lat = parseFloat(lat); lng = parseFloat(lng);
  _locCurrLat = lat; _locCurrLng = lng;
  if (displayName) { _locCurrentAddr = displayName; const el = document.getElementById('locAddrText'); if (el) el.textContent = displayName; }
  if (locMap) { locMap.panTo({ lat, lng }); locMap.setZoom(17); }
  else { _initLocMap(); setTimeout(() => { locMap?.setCenter({ lat, lng }); locMap?.setZoom(17); }, 700); }
}
function _locSelectPlace(placeId, description) {
  const drop = document.getElementById('locSearchDrop');
  if (drop) drop.style.display = 'none';
  const inp = document.getElementById('locSearchInput');
  if (inp) inp.value = '';
  if (!window.google?.maps?.places) return;
  const svc = new google.maps.places.PlacesService(document.createElement('div'));
  svc.getDetails({ placeId, fields: ['geometry', 'formatted_address'] }, (place, status) => {
    if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    _locCurrLat = lat; _locCurrLng = lng;
    _locCurrentAddr = place.formatted_address || description;
    const addrEl = document.getElementById('locAddrText');
    if (addrEl) addrEl.textContent = _locCurrentAddr;
    if (locMap) { locMap.panTo({ lat, lng }); locMap.setZoom(17); }
    else { _initLocMap(); setTimeout(() => { locMap?.setCenter({ lat, lng }); locMap?.setZoom(17); }, 700); }
  });
}

/* GPS helpers */
function _locSetPos(lat, lng, zoom) {
  _locCurrLat = lat; _locCurrLng = lng;
  if (!locMap) { _initLocMap(); setTimeout(() => { locMap?.panTo({ lat, lng }); locMap?.setZoom(zoom||17); }, 700); }
  else { locMap.panTo({ lat, lng }); locMap.setZoom(zoom||17); }
}
function _locSetBtn(html, loading) {
  const btn = document.getElementById('locGpsBtn');
  if (!btn) return;
  btn.innerHTML = html;
  btn.classList.toggle('loading', !!loading);
}
function _locGpsSuccess(pos) {
  const lat = pos.coords.latitude, lng = pos.coords.longitude;
  const acc = Math.round(pos.coords.accuracy);
  _locSetBtn('<i class="fas fa-location-crosshairs"></i> Locate me', false);
  _locShowUserDot(lat, lng);
  _locSetPos(lat, lng, acc < 200 ? 17 : 15);
  const g = document.getElementById('locGpsGuide'); if (g) g.remove();
}
function _locGpsFail(err) {
  _locSetBtn('<i class="fas fa-location-crosshairs"></i> Locate me', false);
  _locShowGpsGuide(err?.code);
}
function _locStopGpsWatch() {
  if (_locGpsWatcher !== null) {
    navigator.geolocation.clearWatch(_locGpsWatcher);
    _locGpsWatcher = null;
  }
  _locGpsBestAccuracy = Infinity;
}
function _locAutoGps() {
  if (!navigator.geolocation) return;
  _locStopGpsWatch();
  const _startWatch = () => {
    _locSetBtn('<i class="fas fa-spinner fa-spin"></i> Locating…', true);
    _locGpsBestAccuracy = Infinity;
    _locGpsWatcher = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy;
        // Accept every update that is more accurate than the previous one
        if (acc < _locGpsBestAccuracy) {
          _locGpsBestAccuracy = acc;
          _locGpsSuccess(pos);
        }
        // Stop watching once we have a GPS-quality fix (≤ 50 m)
        if (acc <= 50) _locStopGpsWatch();
      },
      (err) => { _locStopGpsWatch(); _locGpsFail(err); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };
  if (navigator.permissions) {
    navigator.permissions.query({name:'geolocation'}).then(p => {
      if (p.state === 'denied') { _locShowGpsGuide(1); return; }
      _startWatch();
    }).catch(_startWatch);
  } else { _startWatch(); }
}
function useMyLocation() { _locAutoGps(); }

function _locShowGpsGuide(code) {
  const old = document.getElementById('locGpsGuide'); if (old) old.remove();
  const isAr = currentLang === 'ar';
  const denied = code === 1;
  const guide = document.createElement('div');
  guide.id = 'locGpsGuide';
  guide.style.cssText = 'position:absolute;bottom:80px;left:12px;right:12px;background:rgba(10,8,0,.97);border:1.5px solid #e91e8c;border-radius:18px;padding:16px;z-index:600;box-shadow:0 8px 40px rgba(233,30,140,.25)';
  const steps = denied
    ? (isAr
      ? ['اضغط على 🔒 في شريط العنوان بالأعلى','اختر <b>الموقع</b> ← <b>السماح</b>','ثم اضغط <b>Locate me</b> مجدداً']
      : ['Tap the <b>🔒 lock icon</b> in your browser address bar','Tap <b>Location</b> → select <b>Allow</b>','Then tap <b>Locate me</b> button again'])
    : (isAr
      ? ['تأكد أن GPS مفعّل في الإعدادات','اضغط <b>Locate me</b> مرة أخرى']
      : ['Make sure <b>Location/GPS is ON</b> in your phone settings','Then tap <b>Locate me</b> again']);
  guide.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div style="font-size:14px;font-weight:800;color:#fff">📍 ${isAr ? 'كيفية تفعيل الموقع' : 'How to enable GPS'}</div>
      <button onclick="document.getElementById('locGpsGuide').remove()" style="background:rgba(255,255,255,.1);border:none;color:#fff;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:12px">✕</button>
    </div>
    ${steps.map((s,i)=>`<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px">
      <div style="background:#e91e8c;color:#fff;font-size:11px;font-weight:900;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i+1}</div>
      <div style="font-size:12px;color:#ddd;line-height:1.5">${s}</div>
    </div>`).join('')}
    <button onclick="_locAutoGps();document.getElementById('locGpsGuide').remove()" style="width:100%;margin-top:8px;padding:11px;background:linear-gradient(135deg,#e91e8c,#8b2be2);color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:800;cursor:pointer">
      <i class="fas fa-location-crosshairs"></i> ${isAr ? 'حاول مرة أخرى' : 'Try Again'}
    </button>
    <div style="text-align:center;margin-top:8px;font-size:11px;color:#666">${isAr ? 'أو ابحث عن عنوانك ↑' : 'Or type your address in the search bar ↑'}</div>`;
  const mapWrap = document.getElementById('locMapWrap');
  if (mapWrap) mapWrap.appendChild(guide);
}

function _locFallbackIP() {}

function closeLocation() {
  _locStopGpsWatch();
  document.getElementById('locOverlay').classList.remove('open');
  document.getElementById('locModal').classList.remove('open');
  const det = document.getElementById('locDetails');
  if (det) det.style.display = 'none';
  const drop = document.getElementById('locSearchDrop');
  if (drop) drop.style.display = 'none';
  const input = document.getElementById('locSearchInput');
  if (input) input.value = '';
  // Restore AI fab
  const fab = document.getElementById('aiChatFab');
  if (fab) fab.style.display = '';
  document.body.style.overflow = '';
  _locGeocoding = false;
}

function saveLocation() {
  const name = (document.getElementById('locName').value || '').trim();
  const phone = (document.getElementById('locPhone').value || '').trim();
  if (!name) {
    showToast('Please enter your full name');
    document.getElementById('locName').focus();
    return;
  }
  if (!phone) {
    showToast('Please enter your phone number');
    document.getElementById('locPhone').focus();
    return;
  }
  const apt = (document.getElementById('locApt').value || '').trim();
  const building = (document.getElementById('locBuilding').value || '').trim();
  const directions = (document.getElementById('locDirections').value || '').trim();
  const a = _locCurrData;
  const city = a.city || a.town || a.village || a.county || savedLocation?.city || '';
  const area = a.suburb || a.neighbourhood || a.district || savedLocation?.area || '';
  const address = _locCurrentAddr || savedLocation?.address || '';
  if (_locTagSelected) {
    const labels = JSON.parse(localStorage.getItem('exg_addr_labels') || '[]');
    if (!labels.includes(_locTagSelected)) { labels.push(_locTagSelected); localStorage.setItem('exg_addr_labels', JSON.stringify(labels)); }
  }
  savedLocation = {
    name, phone, apt, building, directions,
    city, area, address, type: _locAddrType,
    label: _locTagSelected,
    lat: _locCurrLat, lng: _locCurrLng
  };
  localStorage.setItem('exglobal_location', JSON.stringify(savedLocation));
  refreshMeAddress();
  showToast('✅ Address saved!');
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

function _saveOrderRecord(items,totalSAR,method,status,txnRef){
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
      status:status||'pending',
      ...(txnRef?{txnRef}:{})
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
  // Fire automations (non-blocking)
  if (newOrder) setTimeout(() => _automationFire(newOrder), 500);
  return newOrder;
}

/* ===== AUTOMATIONS ===== */
async function _automationFire(order) {
  _syncOrderToSheets(order);
  _sendOrderConfirmEmail(order);
}

async function _syncOrderToSheets(order) {
  const url = localStorage.getItem('exg_sheet_webhook');
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
  } catch(e) {}
}

async function _sendOrderConfirmEmail(order) {
  const pubKey   = localStorage.getItem('exg_emailjs_pubkey');
  const service  = localStorage.getItem('exg_emailjs_service');
  const template = localStorage.getItem('exg_emailjs_template');
  const toEmail  = order.customer?.email || '';
  if (!pubKey || !service || !template || !toEmail) return;
  // Load EmailJS SDK if not loaded
  if (!window.emailjs) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    emailjs.init(pubKey);
  }
  const itemsText = (order.items || []).map(i => `${i.name} × ${i.qty}  —  SAR ${i.price * i.qty}`).join('\n');
  const addr = order.address || {};
  const addrText = [addr.name, addr.phone, addr.city, addr.area, addr.address].filter(Boolean).join(', ');
  try {
    await emailjs.send(service, template, {
      to_email:      toEmail,
      customer_name: order.customer?.name || 'Customer',
      order_id:      order.id || '',
      items:         itemsText,
      total:         'SAR ' + (order.totalSAR || 0),
      address:       addrText || 'Not provided',
      payment:       (order.method || '').toUpperCase(),
      date:          new Date(order.date).toLocaleString('en-SA')
    });
  } catch(e) {}
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
  // Block if no delivery address (name + phone + city all required)
  if (!savedLocation || !savedLocation.name || !savedLocation.phone || !savedLocation.city) {
    closeCart();
    showToast('📍 ' + (t('locationRequired') || 'Add delivery address to continue'));
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
      // Estimated delivery dates
      const now = new Date();
      const addD = (n) => { const d = new Date(now); d.setDate(d.getDate() + n); return d; };
      const locMap = { ar: 'ar-SA', bn: 'bn-BD', hi: 'hi-IN' };
      const loc = locMap[currentLang] || 'en-US';
      const fmt = (d) => d.toLocaleDateString(loc, { month: 'short', day: 'numeric' });
      const d0  = fmt(now);
      const d1a = fmt(addD(2)), d1b = fmt(addD(3));
      const d2a = fmt(addD(5)), d2b = fmt(addD(7));
      const _T  = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      nudge.innerHTML = `
        <div class="ndg-free-pill" style="margin-bottom:12px">
          <div class="ndg-icon-circle"><i class="fas fa-truck-fast"></i></div>
          <span>${t('freeDeliveryActive') || 'Free delivery applied!'}</span>
          <div class="ndg-check"><i class="fas fa-check"></i></div>
        </div>
        <div class="del-timeline">
          <div class="del-step">
            <div class="del-circle"><i class="fas fa-bag-shopping"></i></div>
            <div class="del-date">${d0}</div>
            <div class="del-sub">${_T.trackOrdered || 'Ordered'}</div>
          </div>
          <div class="del-line"></div>
          <div class="del-step">
            <div class="del-circle"><i class="fas fa-truck-fast"></i></div>
            <div class="del-date">${d1a} – ${d1b}</div>
            <div class="del-sub">${_T.delReady || 'Order Ready'}</div>
          </div>
          <div class="del-line"></div>
          <div class="del-step">
            <div class="del-circle del-circle-last"><i class="fas fa-box-open"></i></div>
            <div class="del-date">${d2a} – ${d2b}</div>
            <div class="del-sub">${_T.trackDelivered || 'Delivered'}</div>
          </div>
        </div>`;
    } else {
      const needed = FREE_DELIVERY_THRESHOLD_SAR - subtotalDisp;
      const pct = Math.min((subtotalDisp / FREE_DELIVERY_THRESHOLD_SAR) * 100, 100);
      nudge.innerHTML = `
        <div class="del-mini">
          <div class="del-mini-row">
            <i class="fas fa-truck"></i>
            <span>${t('addMoreFree') || 'Add'} <b>${fmtD(needed)}</b> ${t('moreForFree') || 'more for free delivery'}</span>
          </div>
          <div class="del-mini-track"><div class="del-mini-fill" style="width:${pct}%"></div></div>
        </div>`;
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
  // Update card method label to show supported networks when Moyasar is configured
  try {
    const _s = JSON.parse(localStorage.getItem('exg_settings') || '{}');
    const _cardLabelEl = document.getElementById('pmCardLabel');
    if (_cardLabelEl) {
      _cardLabelEl.textContent = _s.moyasarPubKey
        ? '💳 mada / Visa / Mastercard'
        : (t('cardName') || 'Credit Card');
    }
  } catch (_e) {}
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
  ['whatsapp','paypal','card','gpay','binance','stc'].forEach(m => {
    const pm = document.getElementById('pm' + m.charAt(0).toUpperCase() + m.slice(1));
    const ck = document.getElementById('check' + m.charAt(0).toUpperCase() + m.slice(1));
    if (pm) pm.classList.remove('active');
    if (ck) ck.querySelector('i').style.color = '#ddd';
  });
  const card = document.getElementById('pm' + method.charAt(0).toUpperCase() + method.slice(1));
  if (card) card.classList.add('active');
  const check = document.getElementById('check' + method.charAt(0).toUpperCase() + method.slice(1));
  if (check) check.querySelector('i').style.color =
    method === 'binance' ? '#F3BA2F' : method === 'stc' ? '#6D2C8A' : '#e91e8c';
  // Show/hide sub-forms
  document.getElementById('paypalBtnContainer').style.display = (method === 'paypal') ? 'block' : 'none';
  document.getElementById('cardForm').style.display = (method === 'card') ? 'block' : 'none';
  document.getElementById('binanceForm').style.display = (method === 'binance') ? 'block' : 'none';
  document.getElementById('stcForm').style.display = (method === 'stc') ? 'block' : 'none';
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
  // Populate STC Pay form
  if (method === 'stc') {
    const s = JSON.parse(localStorage.getItem('exg_settings') || '{}');
    const stcNum = s.stcPayNumber || '0546224029';
    const lang4 = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const sub4 = cartSubtotalBase() * lang4.rate;
    const del4 = sub4 >= FREE_DELIVERY_THRESHOLD_SAR ? 0 : DELIVERY_SAR;
    const totalSAR4 = sub4 + del4;
    const phoneEl = document.getElementById('stcPhoneTxt');
    const amtEl   = document.getElementById('stcAmtDisplay');
    const pillEl  = document.getElementById('stcAmtSAR');
    if (phoneEl) phoneEl.textContent = stcNum;
    if (amtEl)   amtEl.textContent   = 'SAR ' + Math.round(totalSAR4);
    if (pillEl)  pillEl.textContent  = 'SAR ' + Math.round(totalSAR4);
  }
  // Update button text & color
  const lang2 = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const subtotalDisp2 = cartSubtotalBase() * lang2.rate;
  const delDisp2 = subtotalDisp2 >= FREE_DELIVERY_THRESHOLD_SAR ? 0 : DELIVERY_SAR;
  const grandDisp2 = subtotalDisp2 + delDisp2;
  const methodLabel = {
    whatsapp: t('placeOrder'), paypal: 'PayPal',
    card: t('cardName'), gpay: 'Google Pay',
    binance: '⚡ Verify & Confirm Order',
    stc: '✅ Confirm STC Pay Order',
  };
  const btnEl = document.getElementById('btnPayNow');
  if (btnEl) btnEl.style.background =
    method === 'binance' ? 'linear-gradient(135deg,#F3BA2F,#F0A500)' :
    method === 'stc'     ? 'linear-gradient(135deg,#6D2C8A,#9C27B0)' : '';
  document.getElementById('payBtnText').textContent =
    (methodLabel[method] || t('placeOrder')) + ' — ' + lang2.currency + Math.round(grandDisp2).toLocaleString();
}

function copyStcNumber() {
  const s = JSON.parse(localStorage.getItem('exg_settings') || '{}');
  const num = s.stcPayNumber || '0546224029';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(num).then(() => showToast('✅ STC Pay number copied!')).catch(() => showToast(num));
  } else { showToast(num); }
}
function showStcPending(orderId, totalDisplay, txnRef) {
  const pend = document.getElementById('stcPendWrap');
  const conf = document.getElementById('cartConfirmed');
  const body = document.getElementById('cartBody');
  const foot = document.getElementById('cartFooter');
  if (!pend) return;
  if (conf) conf.style.display = 'none';
  if (body) body.style.display = 'none';
  if (foot) foot.style.display = 'none';
  document.getElementById('stcPendOrderId').textContent = orderId || '';
  document.getElementById('stcPendAmount').textContent = totalDisplay || '';
  document.getElementById('stcPendRef').textContent = txnRef || '';
  pend.style.display = 'flex';
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
      setTimeout(() => { closePayment(); codCheckout(); }, 1500);
    }
  } else if (selectedPayMethod === 'card') {
    const s = JSON.parse(localStorage.getItem('exg_settings') || '{}');
    const moyasarKey = s.moyasarPubKey || '';
    if (!moyasarKey) {
      showToast(t('cardNotSetup'));
      setTimeout(() => { closePayment(); codCheckout(); }, 1500);
      return;
    }
    // Moyasar payment integration
    const lang = TRANSLATIONS[currentLang] || TRANSLATIONS['bn'];
    const sub = cartSubtotalBase() * lang.rate;
    const del = sub >= FREE_DELIVERY_THRESHOLD_SAR ? 0 : DELIVERY_SAR;
    const grandTotal = sub + del;
    _initMoyasarPayment(moyasarKey, grandTotal).catch(e => {
      showToast('❌ ' + (e.message || 'Payment error'));
    });
    return;
  } else if (selectedPayMethod === 'gpay') {
    showToast(t('gpayNotSetup'));
    setTimeout(() => { closePayment(); codCheckout(); }, 1500);
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
  } else if (selectedPayMethod === 'stc') {
    const ref = (document.getElementById('stcRefInput')?.value || '').trim();
    if (!/^\d{8,16}$/.test(ref)) {
      showToast('⚠️ Invalid ID — STC Pay transaction reference must be 8–16 digits (numbers only)');
      return;
    }
    const usedStc = JSON.parse(localStorage.getItem('stc_used_refs') || '[]');
    if (usedStc.includes(ref)) { showToast('⚠️ This transaction ID has already been used'); return; }

    const btn = document.getElementById('btnPayNow');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';

    setTimeout(() => {
      usedStc.push(ref);
      localStorage.setItem('stc_used_refs', JSON.stringify(usedStc));

      const langS = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const subS  = cartSubtotalBase() * langS.rate;
      const delS  = subS >= FREE_DELIVERY_THRESHOLD_SAR ? 0 : DELIVERY_SAR;
      const totalS = subS + delS;
      const s = JSON.parse(localStorage.getItem('exg_settings') || '{}');
      const stcNum = s.stcPayNumber || '0546224029';
      const lines = cart.map(i => { const p = PRODUCTS.find(x => x.id === i.id); return p ? `• ${getName(p)} ×${i.qty}` : ''; }).filter(Boolean).join('\n');
      const locText = getLocationText();

      const sOrd = _saveOrderRecord(cart, totalS, 'stc', 'awaiting_stc', ref);
      const msg = `💜 *STC Pay — VERIFY PAYMENT*\n🛒 Order: *${sOrd?.id || ''}*\n\n${lines}\n\n💵 *SAR ${Math.round(totalS)}*\n📱 STC Pay Number: ${stcNum}\n🔖 Txn Ref: \`${ref}\`${locText}\n\n⚠️ Check STC app — approve in admin after verifying\n⏰ ${new Date().toLocaleString()}`;

      btn.disabled = false;
      window.open('https://wa.me/' + getWANumber() + '?text=' + encodeURIComponent(msg), '_blank');
      cart = []; _saveCart(); updateCartBadge();
      closePayment();
      showStcPending(sOrd?.id, 'SAR ' + Math.round(totalS).toLocaleString(), ref);
    }, 1500);
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
  const cmBrand = document.getElementById('cmBrand');
  let html = '', brandHtml = '';

  if (/^4/.test(v)) {
    html = '<div class="cti cti-visa">VISA</div>';
    brandHtml = '<div class="cm-brand-visa">VISA</div>';
  } else if (/^(5[1-5]|2[2-7])/.test(v)) {
    html = '<div class="cti cti-mc"><svg width="34" height="22" viewBox="0 0 38 24"><circle cx="14" cy="12" r="11" fill="#eb001b"/><circle cx="24" cy="12" r="11" fill="#f79e1b"/><path d="M19 3.8a11 11 0 0 1 0 16.4A11 11 0 0 1 19 3.8z" fill="#ff5f00"/></svg></div>';
    brandHtml = '<svg width="52" height="34" viewBox="0 0 38 24"><circle cx="14" cy="12" r="11" fill="#eb001b"/><circle cx="24" cy="12" r="11" fill="#f79e1b"/><path d="M19 3.8a11 11 0 0 1 0 16.4A11 11 0 0 1 19 3.8z" fill="#ff5f00"/></svg>';
  } else if (/^3[47]/.test(v)) {
    html = '<div class="cti cti-amex"><span>AMERICAN</span><span>EXPRESS</span></div>';
    brandHtml = '<div style="color:rgba(255,255,255,.9);font-size:10px;font-weight:900;background:#016fd0;padding:3px 7px;border-radius:5px;line-height:1.3;text-align:center"><div>AMERICAN</div><div>EXPRESS</div></div>';
  } else if (/^(6011|622|64|65)/.test(v)) {
    html = '<div class="cti cti-disc">DISCOVER</div>';
    brandHtml = '<div style="color:rgba(255,255,255,.9);font-size:13px;font-weight:900">DISCOVER</div>';
  } else if (/^(4(00861|01066|01[1-9]|013)|5(0(77[0-3]|78[3-9]|79[0-9]|800|801|803|804|8[19]|82[0-6]|893|894|895|96|97)|68)|6(002|104|105))/.test(v) || /^(9(682|683|684|685|686|687|688|689|69))/.test(v)) {
    html = '<div class="cti cti-mada">mada</div>';
    brandHtml = '<div style="color:#fff;font-size:14px;font-weight:900;background:#0072bc;padding:3px 8px;border-radius:5px">mada</div>';
  } else if (v.length > 0) {
    html = '<div class="cti cti-generic"><i class="fas fa-credit-card"></i></div>';
  }

  if (icon) icon.innerHTML = html;
  if (cmBrand) cmBrand.innerHTML = brandHtml;
}
function formatExpiry(el) {
  let v = el.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2);
  el.value = v;
}
function _syncCardName() {
  const f = (document.getElementById('cardFirstName')?.value || '').trim();
  const l = (document.getElementById('cardLastName')?.value || '').trim();
  const h = document.getElementById('cardName');
  if (h) h.value = [f, l].filter(Boolean).join(' ');
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
    photos:['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=120&h=120&fit=crop&q=80'], helpful:138 },

  { id:21, name:'Rania Mansour', initial:'R', grad:'linear-gradient(135deg,#0d9488,#2563eb)', rating:5, date:'2025-03-14', country:'UAE',
    product:"Women's Satin Blouse — Ivory M",
    text:{ bn:'ব্লাউজের কাপড় সিল্কের মতো মসৃণ! অফিসে পরি, মিটিংয়ে সবাই প্রশংসা করে। ঘামলেও অস্বস্তি হয় না। মেশিনে ধুয়েছি একবার, রঙ একটুও যায়নি। EX GLOBAL এর পণ্য এখন আমার প্রথম পছন্দ।', en:"Fabric is smooth like silk! Wear it to office, everyone compliments me in meetings. Comfortable even when warm. Machine washed once, color didn't fade at all. EX GLOBAL is now my first choice.", ar:'القماش ناعم كالحرير! أرتديه للعمل والجميع يثنون علي في الاجتماعات. مريح حتى عند الحرارة. غسلته بالغسالة مرة، لم يبهت اللون أبداً. EX GLOBAL أصبح خياري الأول.' },
    photos:['https://images.unsplash.com/photo-1485518882345-15568b007407?w=120&h=120&fit=crop&q=80'], helpful:71 },

  { id:22, name:'Bilal Chaudhry', initial:'B', grad:'linear-gradient(135deg,#7c3aed,#2563eb)', rating:4, date:'2025-03-11', country:'Pakistan',
    product:"Men's Casual Sneaker — White 41",
    text:{ bn:'জুতার ডিজাইন অনেক সুন্দর, পরতে আরামদায়ক। ফোম সোল নরম, সারাদিন হাঁটলেও পা ব্যথা হয় না। সাইজ একটু ছোট মনে হয়েছে, পরের বার হাফ নম্বর বড় নেবো। তারপরেও ৪ স্টার দিচ্ছি কারণ বিল্ড কোয়ালিটি ভালো।', en:'Great shoe design, very comfortable to wear. Foam sole is soft, no foot pain after walking all day. Size runs slightly small, will go half size up next time. Still 4 stars for the good build quality.', ar:'تصميم الحذاء رائع ومريح جداً. النعل الإسفنجي ناعم، لا يؤلم القدم بعد المشي طوال اليوم. المقاس صغير قليلاً، سآخذ نصف مقاس أكبر في المرة القادمة. لا يزال 4 نجوم لجودة البناء الجيدة.' },
    photos:['https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=120&h=120&fit=crop&q=80'], helpful:48 },

  { id:23, name:'Dalila Benhadj', initial:'D', grad:'linear-gradient(135deg,#be185d,#f59e0b)', rating:5, date:'2025-03-08', country:'Morocco',
    product:'Gold Jewelry Set — Necklace+Earring',
    text:{ bn:'জুয়েলারি সেটটা দেখে বিশ্বাসই হচ্ছিল না এত কম দামে! সোনার মতো চকচক করছে, অনুষ্ঠানে পরেছিলাম সবাই ভেবেছে আসল সোনা। মরিচা ধরেনি এখনো। আমার মা, বোনদের জন্যও অর্ডার দিয়েছি।', en:"Couldn't believe the price for this jewelry set! Shines like real gold, wore it to a wedding and everyone thought it was real gold. No rust yet. Ordered for my mom and sisters too.", ar:'لم أصدق السعر لهذه المجموعة! تلمع كالذهب الحقيقي، ارتديتها في حفل زفاف والجميع ظنه ذهباً حقيقياً. لا صدأ حتى الآن. طلبت لأمي وأخواتي أيضاً.' },
    photos:['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1601121141461-9d6647bef0a1?w=120&h=120&fit=crop&q=80'], helpful:103 },

  { id:24, name:'Khaled Ibrahim', initial:'K', grad:'linear-gradient(135deg,#059669,#10b981)', rating:5, date:'2025-03-05', country:'Egypt',
    product:"Men's Thobe — White Premium XL",
    text:{ bn:'থোবটা জুমার নামাজে পরেছিলাম, অনেক সুন্দর লেগেছে। কাপড় হালকা তবে মজবুত। সেলাই নিখুঁত, কোনো ফাঁকা জায়গা নেই। রঙ একদম ধবধবে সাদা। ডেলিভারি পেয়েছি মাত্র ৩ দিনে। আবার নেবো ইনশাআল্লাহ।', en:'Wore the thobe for Friday prayer, looked really beautiful. Fabric is light yet sturdy. Stitching is flawless, no loose threads. Color is brilliant white. Got delivery in just 3 days. Will order again inshAllah.', ar:'ارتديت الثوب لصلاة الجمعة، بدا رائعاً. القماش خفيف لكنه متين. الخياطة مثالية، لا خيوط مفككة. اللون أبيض ناصع. استلمته خلال 3 أيام فقط. سأطلب مرة أخرى إن شاء الله.' },
    photos:['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&q=80'], helpful:88 },

  { id:25, name:'Meera Pillai', initial:'M', grad:'linear-gradient(135deg,#f43f5e,#a855f7)', rating:5, date:'2025-03-01', country:'India',
    product:'Saree — Silk Maroon 5.5m',
    text:{ bn:'শাড়িটা দেখে অবাক হয়ে গেলাম! রঙ একদম গভীর মেরুন, জরির কাজ সূক্ষ্ম। বিয়েতে পরেছিলাম, ফটোগ্রাফার বললেন শাড়ি অসাধারণ হয়েছে। ৫ স্টার দিতে পারছি, কারণ আরো বেশি দেওয়া যায় না 😍', en:"Stunned by this saree! Deep maroon color, delicate zari work. Wore it to a wedding and the photographer said the saree looked stunning. 5 stars because I can't give more 😍", ar:'ذهلت من هذه الساري! لون أحمر عميق وأعمال زري رقيقة. ارتديتها في حفل زفاف والمصور قال إنها كانت رائعة. 5 نجوم لأنني لا أستطيع إعطاء أكثر 😍' },
    photos:['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=120&h=120&fit=crop&q=80'], helpful:129 },

  { id:26, name:'Yasser Al-Dossari', initial:'Y', grad:'linear-gradient(135deg,#1d4ed8,#0891b2)', rating:3, date:'2025-02-26', country:'Bahrain',
    product:'Sports Jacket — Grey L',
    text:{ bn:'জ্যাকেট ঠিকঠাক আছে, কিন্তু আমার প্রত্যাশা ছিল একটু বেশি। কাপড় একটু পাতলা মনে হয়েছে, তবে ফিটিং ভালো। ডেলিভারি ৫ দিন লেগেছে যেটা একটু বেশি। দামের তুলনায় মোটামুটি মান পেয়েছি।', en:'Jacket is okay but I expected a bit more. Fabric feels a bit thin, though the fit is good. Delivery took 5 days which is a bit slow. Got decent quality for the price.', ar:'الجاكيت مقبول لكنني توقعت أكثر. القماش يبدو رقيقاً قليلاً رغم أن المقاس جيد. التوصيل استغرق 5 أيام وهو بطيء نوعاً ما. جودة مقبولة مقابل السعر.' },
    photos:[], helpful:31 },

  { id:27, name:'Hana Khatib', initial:'H', grad:'linear-gradient(135deg,#ec4899,#f97316)', rating:5, date:'2025-02-22', country:'Jordan',
    product:"Girls' Abaya Set — Navy 10Y",
    text:{ bn:'মেয়ের জন্য আবায়া সেট নিয়েছিলাম, দেখে মন ভরে গেছে! কাপড় নরম, ছোটদের ত্বকে কোনো সমস্যা করেনি। ডিজাইন খুব সুন্দর, মেয়ে পরতে ভালোবাসে। স্কুলে মেয়ের টিচারও প্রশংসা করেছেন!', en:"Bought abaya set for my daughter and I'm absolutely delighted! Soft fabric, no skin irritation for kids. Beautiful design, she loves wearing it. Even her teacher at school complimented it!", ar:'اشتريت مجموعة العباءة لابنتي وأنا سعيدة جداً! قماش ناعم، لا تهيج للجلد للأطفال. تصميم جميل وهي تحب ارتداءها. حتى معلمتها في المدرسة أثنت عليها!' },
    photos:['https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=120&h=120&fit=crop&q=80'], helpful:77 },

  { id:28, name:'Sameer Qureshi', initial:'S', grad:'linear-gradient(135deg,#7c3aed,#e91e8c)', rating:5, date:'2025-02-19', country:'Saudi Arabia',
    product:'Leather Wallet — Brown Slim',
    text:{ bn:'ওয়ালেটটা হাতে নিয়ে বুঝলাম কোয়ালিটি কতটা ভালো! চামড়া নরম, সেলাই মজবুত। ৬টা কার্ড স্লট, টাকার জায়গা প্রশস্ত। পুরুষদের জন্য পারফেক্ট গিফট। স্বামীকে দিয়েছিলাম, সে প্রতিদিন ব্যবহার করছেন।', en:'Picked up the wallet and immediately felt the quality! Soft leather, strong stitching. 6 card slots, spacious bill section. Perfect gift for men. Gave it to my husband and he uses it every day.', ar:'أمسكت المحفظة وشعرت فوراً بالجودة! جلد ناعم وخياطة متينة. 6 فتحات للبطاقات وقسم أوراق نقدية واسع. هدية مثالية للرجال. أعطيتها لزوجي ويستخدمها كل يوم.' },
    photos:['https://images.unsplash.com/photo-1627123424574-724758594785?w=120&h=120&fit=crop&q=80'], helpful:62 },

  { id:29, name:'Lina Hadid', initial:'L', grad:'linear-gradient(135deg,#0f766e,#7c3aed)', rating:4, date:'2025-02-15', country:'Lebanon',
    product:'Casual Jumpsuit — Olive Green S',
    text:{ bn:'জাম্পসুটটা সুন্দর কিন্তু ছবির চেয়ে একটু ভিন্ন শেড এসেছে। তারপরেও পরতে দারুণ লাগছে, কাপড় আরামদায়ক। ফিটিং পারফেক্ট, কোমরের বেল্ট দিয়ে আরো সুন্দর দেখাচ্ছে। সব মিলিয়ে ৪ স্টার।', en:'Jumpsuit is nice but the shade came slightly different from the photo. Still looks great to wear, fabric is comfortable. Perfect fitting, looks even better with the waist belt. Overall 4 stars.', ar:'البذلة جميلة لكن اللون جاء مختلفاً قليلاً عن الصورة. ومع ذلك تبدو رائعة عند الارتداء والقماش مريح. المقاس مثالي وتبدو أجمل مع حزام الخصر. 4 نجوم بشكل عام.' },
    photos:['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=120&h=120&fit=crop&q=80'], helpful:55 },

  { id:30, name:'Farrukh Tashkentov', initial:'F', grad:'linear-gradient(135deg,#2563eb,#22c55e)', rating:5, date:'2025-02-11', country:'Saudi Arabia',
    product:'Backpack — 30L Black Waterproof',
    text:{ bn:'ব্যাকপ্যাকটা অবিশ্বাস্য! ৩০ লিটার কিন্তু ওজন অনেক হালকা। ওয়াটারপ্রুফ কভার কাজ করে, বৃষ্টিতে ভেজেনি। ল্যাপটপ কম্পার্টমেন্ট পারফেক্ট, USB চার্জিং পোর্টও আছে। ট্রাভেল ও অফিস দুটোতেই পারফেক্ট। 🎒', en:'Backpack is unbelievable! 30L but very lightweight. Waterproof cover actually works, stayed dry in rain. Laptop compartment is perfect, has USB charging port too. Perfect for both travel and office. 🎒', ar:'الحقيبة لا تصدق! 30 لتر لكنها خفيفة جداً. الغطاء المقاوم للماء يعمل فعلاً، بقيت جافة في المطر. حقيبة الكمبيوتر مثالية وتحتوي على منفذ USB للشحن. مثالية للسفر والعمل. 🎒' },
    photos:['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=120&h=120&fit=crop&q=80'], helpful:114 },

  { id:31, name:'Aisha Mokhtar', initial:'A', grad:'linear-gradient(135deg,#be185d,#0891b2)', rating:5, date:'2025-02-07', country:'Kuwait',
    product:'Abaya — Embroidered Black M',
    text:{ bn:'এই আবায়ার এমব্রয়ডারি কাজ দেখে চোখ ধাঁধিয়ে গেছে! হাতের কাজের মতো সূক্ষ্ম। রমজানে পরেছিলাম, মসজিদে সবাই কোথা থেকে কিনেছি জিজ্ঞেস করেছে। প্যাকেজিং ছিল লাক্সারি বক্সে। হাজার হাজার মেয়ে এটা দেখে কিনবে। ⭐⭐⭐⭐⭐', en:'The embroidery on this abaya is breathtaking! Intricate as handwork. Wore it during Ramadan and everyone at the mosque asked where I bought it. Packaging came in a luxury box. Thousands of women will want this after seeing it. ⭐⭐⭐⭐⭐', ar:'التطريز على هذه العباءة خلاب! دقيق كالعمل اليدوي. ارتديتها في رمضان وسألني الجميع في المسجد عن مكان شرائها. التغليف جاء في صندوق فاخر. آلاف النساء سيردنها بعد رؤيتها. ⭐⭐⭐⭐⭐' },
    photos:['https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=120&h=120&fit=crop&q=80'], helpful:201 },

  { id:32, name:'Tarek Zaki', initial:'T', grad:'linear-gradient(135deg,#f59e0b,#ef4444)', rating:5, date:'2025-02-03', country:'Cairo',
    product:"Men's Watch — Stainless Steel Gold",
    text:{ bn:'ঘড়িটা দেখতে একদম রোলেক্সের মতো! কিন্তু দাম অনেক কম। ব্যান্ড মজবুত, ডায়াল পরিষ্কার। ওয়াটার রেজিস্ট্যান্ট, হাত ধোওয়ার সময় সমস্যা নেই। অফিসে বসরাও প্রশংসা করেছেন। ১ মাস ব্যবহার হয়েছে, কোনো সমস্যা নেই।', en:'Watch looks exactly like a Rolex! But the price is so much lower. Band is sturdy, dial is clean. Water resistant, no issue washing hands. Even my boss complimented it. Used for 1 month, zero issues.', ar:'الساعة تبدو مثل رولكس تماماً! لكن السعر أقل بكثير. الحزام متين والوجه نظيف. مقاوم للماء ولا مشكلة عند غسل اليدين. حتى مديري أثنى عليها. استخدمتها شهراً كاملاً، لا أي مشكلة.' },
    photos:['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&h=120&fit=crop&q=80'], helpful:95 },

  { id:33, name:'Siti Rahma', initial:'S', grad:'linear-gradient(135deg,#10b981,#f43f5e)', rating:5, date:'2025-01-30', country:'Indonesia',
    product:'Modest Dress — Pastel Blue L',
    text:{ bn:'ড্রেসটা একদম পরীর মতো! পাস্টেল রঙ এতটাই সুন্দর যে দেখে মন ভালো হয়ে যায়। কাপড় ব্রিদেবল, গরমেও আরাম। ফুলহাতা তবে গরম লাগে না। বিয়েতে পরেছিলাম, ১০০+ লাইক পড়েছে ইনস্টাতে!', en:'Dress looks absolutely magical! The pastel color is so beautiful it lifts my mood. Fabric is breathable, comfortable even in heat. Long sleeves but not hot. Wore to a wedding and got 100+ likes on Instagram!', ar:'الفستان يبدو سحرياً! اللون الباستيل جميل جداً ويرفع معنوياتي. القماش يتنفس ومريح حتى في الحرارة. أكمام طويلة لكن ليست ساخنة. ارتديته في حفل زفاف وحصلت على 100+ إعجاب على إنستغرام!' },
    photos:['https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=120&h=120&fit=crop&q=80'], helpful:158 },

  { id:34, name:'Mustafa Kemal', initial:'M', grad:'linear-gradient(135deg,#1d4ed8,#7c3aed)', rating:4, date:'2025-01-27', country:'Turkey',
    product:"Men's Formal Trousers — Navy 32",
    text:{ bn:'ট্রাউজার্সের কাটিং একদম প্রফেশনাল। কাপড়ে আয়রন ভালো থাকে, অফিসে সারাদিন স্মার্ট দেখায়। হালকা ক্রিজ ছিল শুরুতে, স্টিম দেওয়ার পর ঠিক হয়ে গেছে। একটু ছোট কমার দরকার ছিল, তাই ৪ স্টার।', en:'Trouser cut is very professional. Fabric holds the iron well, looks smart all day at the office. Had a slight crease initially, fixed with steam. Needed slight hemming which is why 4 stars.', ar:'قصة البنطلون احترافية جداً. القماش يحتفظ بالكي جيداً ويبدو أنيقاً طوال اليوم في العمل. كان فيه تجعد طفيف في البداية أصلحته بالبخار. يحتاج تقصير طفيف، لذا 4 نجوم.' },
    photos:[], helpful:44 },

  { id:35, name:'Rasha Nouri', initial:'R', grad:'linear-gradient(135deg,#a855f7,#f43f5e)', rating:5, date:'2025-01-23', country:'Iraq',
    product:'Handbag — Designer Pink Mini',
    text:{ bn:'এই মিনি ব্যাগটা আমার সবচেয়ে প্রিয় জিনিস হয়ে গেছে! পিংক কালার একদম ভাইব্রেন্ট, চেইন মজবুত। বাইরে বেরোলে সবাই কোথা থেকে কিনেছি জিজ্ঞেস করে। ভেতরে কয়েকটা পকেট আছে। একটু ছোট হওয়াই এর সৌন্দর্য!', en:'This mini bag has become my most prized possession! Pink color is so vibrant, chain is sturdy. Everyone asks where I bought it when I go out. Has a few pockets inside. The smallness is exactly what makes it beautiful!', ar:'أصبحت هذه الحقيبة الصغيرة أثمن ما لدي! اللون الوردي زاهٍ جداً والسلسلة متينة. الجميع يسألني أين اشتريتها عند الخروج. فيها جيوب داخلية. صغرها هو بالضبط ما يجعلها جميلة!' },
    photos:['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=120&h=120&fit=crop&q=80'], helpful:87 },

  { id:36, name:'Deepak Nair', initial:'D', grad:'linear-gradient(135deg,#f97316,#a855f7)', rating:5, date:'2025-01-19', country:'India',
    product:'Kids Cricket Set — Full Kit',
    text:{ bn:'ছেলের জন্মদিনে এই ক্রিকেট কিট দিয়েছিলাম, সে এখন প্রতিদিন খেলছে! ব্যাট মজবুত, বল ভারসাম্যপূর্ণ। সব গিয়ার একসাথে পেয়ে সে অনেক খুশি। ডেলিভারি ছিল ৩ দিনে। সুন্দর প্যাকেজিং।', en:"Gave this cricket kit for my son's birthday and he plays every day now! Bat is sturdy, ball is balanced. He was so happy to get all gear together. Delivery in 3 days. Beautiful packaging.", ar:'أعطيت هذه المجموعة الكريكت لابني في عيد ميلاده ويلعب الآن كل يوم! المضرب متين والكرة متوازنة. كان سعيداً جداً بالحصول على كل الأدوات معاً. التوصيل خلال 3 أيام. تغليف جميل.' },
    photos:['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=120&h=120&fit=crop&q=80'], helpful:53 },

  { id:37, name:'Wafa Al-Sabah', initial:'W', grad:'linear-gradient(135deg,#0891b2,#22c55e)', rating:5, date:'2025-01-15', country:'Kuwait',
    product:'Perfume — Oud Intense 100ml',
    text:{ bn:'আউড পারফিউম এত দিন ধরে চলে! সকালে লাগিয়ে রাত পর্যন্ত সুগন্ধ থাকে। খলিজি স্টাইলের আউড, একটু মিষ্টি ও গভীর। বোতলের ডিজাইন রাজকীয়। গিফট করার জন্য বাক্সটা একদম পারফেক্ট। আমার সবচেয়ে প্রিয় পারফিউম হয়ে গেছে।', en:'This oud perfume lasts so long! Applied in the morning and the scent stays till night. Khaleeji-style oud, slightly sweet and deep. Bottle design is royal. Box is perfect for gifting. Has become my favorite perfume.', ar:'هذا العطر يدوم طويلاً جداً! وضعته صباحاً والرائحة تبقى حتى الليل. عود بأسلوب خليجي، حلو قليلاً وعميق. تصميم الزجاجة ملكي. الصندوق مثالي للإهداء. أصبح عطري المفضل.' },
    photos:['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=120&h=120&fit=crop&q=80'], helpful:142 },

  { id:38, name:'Ibrahim Çelik', initial:'I', grad:'linear-gradient(135deg,#dc2626,#f97316)', rating:3, date:'2025-01-11', country:'Turkey',
    product:"Men's Polo Shirt — Red XL",
    text:{ bn:'শার্টটা দেখতে সুন্দর কিন্তু সাইজ চার্টে যা লেখা ছিল তার চেয়ে ছোট এসেছে। XL নিয়েছিলাম, কিন্তু L এর মতো ফিট করেছে। কাপড়ের মান ঠিক আছে। কাস্টমার সার্ভিসে যোগাযোগ করেছি, সাহায্য করেছে।', en:'Shirt looks nice but came smaller than the size chart indicated. Ordered XL but fits like an L. Fabric quality is fine. Contacted customer service and they helped. Will order again in XXL.', ar:'القميص يبدو جميلاً لكنه جاء أصغر مما يوضحه مخطط المقاسات. طلبت XL لكنه يلائم كـ L. جودة القماش مقبولة. تواصلت مع خدمة العملاء وساعدوني. سأطلب مجدداً بمقاس XXL.' },
    photos:[], helpful:29 },

  { id:39, name:'Noha Sami', initial:'N', grad:'linear-gradient(135deg,#7c3aed,#0891b2)', rating:5, date:'2025-01-07', country:'Egypt',
    product:'Face Serum Set — Vitamin C+E',
    text:{ bn:'এই সিরাম সেট ব্যবহার করার ২ সপ্তাহ পর আমার ত্বক উজ্জ্বল হয়ে গেছে! ডার্ক স্পট কমে গেছে, স্কিন হাইড্রেটেড থাকছে। ভিটামিন সি সিরাম সকালে, ভিটামিন ই রাতে — পারফেক্ট রুটিন। আমার বান্ধবীরাও অর্ডার দিয়েছে।', en:'After 2 weeks of using this serum set, my skin has become glowing! Dark spots reduced, skin stays hydrated. Vitamin C serum in the morning, Vitamin E at night — perfect routine. My friends have all ordered too.', ar:'بعد أسبوعين من استخدام مجموعة السيروم، أصبح بشرتي مشرقة! تقلصت البقع الداكنة والبشرة تبقى مرطبة. سيروم فيتامين C صباحاً وفيتامين E ليلاً، روتين مثالي. صديقاتي جميعهن طلبن أيضاً.' },
    photos:['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&h=120&fit=crop&q=80'], helpful:176 },

  { id:40, name:'Akira Yamamoto', initial:'A', grad:'linear-gradient(135deg,#e91e8c,#f59e0b)', rating:5, date:'2025-01-03', country:'Saudi Arabia',
    product:'Anime Hoodie — Oversized Black',
    text:{ bn:'হুডিটা একদম ওভারসাইজড পারফেক্ট! কাপড় ভারী ও উষ্ণ, ফ্লিস লাইনিং আছে। প্রিন্ট রঙিন ও শার্প, ধুলেও উঠছে না। পকেট গভীর। শীতে বাসায় এবং বাইরে দুটোতেই পারফেক্ট। আরো কয়েকটা ডিজাইন নেবো!', en:'Hoodie is perfectly oversized! Fabric is heavy and warm, has fleece lining. Print is colorful and sharp, not coming off after washing. Deep pockets. Perfect for both indoor and outdoor in winter. Will get more designs!', ar:'الهودي مقاسه الكبير مثالي! القماش ثقيل ودافئ ومبطن بالفليس. الطباعة ملونة وحادة ولا تنزل بعد الغسيل. جيوب عميقة. مثالي للداخل والخارج في الشتاء. سآخذ تصاميم أخرى!' },
    photos:['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=120&h=120&fit=crop&q=80'], helpful:93 },

  { id:41, name:'Amna Al-Rashidi', initial:'A', grad:'linear-gradient(135deg,#14b8a6,#a855f7)', rating:5, date:'2024-12-30', country:'Oman',
    product:'Bridal Hijab Set — Gold Embroidered',
    text:{ bn:'বিয়ের দিন এই হিজাব পরেছিলাম। গোল্ড এমব্রয়ডারি এতটাই সুন্দর যে ফটোগ্রাফার বললেন এটা ছাড়া ফটো অসম্পূর্ণ! কাপড় শিফন, হালকা ও দোদুল্যমান। প্যাকেজিং গিফট বক্সে এসেছে। বিয়ের দিনকে স্মরণীয় করে দিয়েছে।', en:'Wore this hijab on my wedding day. The gold embroidery is so beautiful that the photographer said the photos would be incomplete without it! Chiffon fabric, light and flowing. Packaging came in a gift box. Made my wedding day unforgettable.', ar:'ارتديت هذا الحجاب في يوم زفافي. التطريز الذهبي جميل جداً لدرجة أن المصور قال إن الصور ستكون ناقصة بدونه! قماش شيفون خفيف ومتدفق. التغليف جاء في صندوق هدايا. جعل يوم زفافي لا يُنسى.' },
    photos:['https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=120&h=120&fit=crop&q=80'], helpful:189 },

  { id:42, name:'Tariq Memon', initial:'T', grad:'linear-gradient(135deg,#0f766e,#f97316)', rating:5, date:'2024-12-27', country:'Pakistan',
    product:'Football Jersey — PSG #10',
    text:{ bn:'জার্সিটা একদম অফিশিয়াল লুকের মতো! কাপড় হালকা ও ব্রিদেবল। মাঠে খেলার সময় ঘাম শোষণ করে ভালো। প্রিন্ট শার্প, ধুলেও ফিকে হয়নি। দামে এরকম জার্সি আশা করিনি। বন্ধুদেরও গিফট দিয়েছি।', en:'Jersey looks exactly like the official one! Fabric is light and breathable. Absorbs sweat well during playing. Print is sharp, did not fade after washing. Did not expect such quality at this price. Gifted to friends too.', ar:'الجيرسي يبدو مثل الرسمي تماماً! القماش خفيف ويتنفس. يمتص العرق جيداً خلال اللعب. الطباعة حادة ولم تبهت بعد الغسيل. لم أتوقع هذه الجودة بهذا السعر. أهديت لأصدقاء أيضاً.' },
    photos:['https://images.unsplash.com/photo-1576820022036-f0ceab21ce71?w=120&h=120&fit=crop&q=80'], helpful:108 },

  { id:43, name:'Ghada Mansouri', initial:'G', grad:'linear-gradient(135deg,#db2777,#0891b2)', rating:5, date:'2024-12-23', country:'UAE',
    product:'Luxury Scarf — Cashmere Beige',
    text:{ bn:'ক্যাশমেরে স্কার্ফটা হাতে নিয়ে মনে হলো বাতাস ধরেছি! এত নরম ও মোলায়েম যে কথায় প্রকাশ করা যাবে না। শীতে গলায় জড়িয়ে বেরোলে আলাদা ক্লাস দেখায়। রঙও টাইমলেস বেইজ। বারবার নেবো।', en:"Touching the cashmere scarf felt like holding air! So soft and silky, words can't describe it. Wearing it around the neck in winter looks incredibly classy. Timeless beige color. Will buy again and again.", ar:'لمس وشاح الكشمير شعرت كأنني أمسك الهواء! ناعم وحريري جداً لدرجة لا توصفها الكلمات. ارتداؤه حول الرقبة في الشتاء يبدو أنيقاً بشكل لا يصدق. لون بيج كلاسيكي. سأشتريه مراراً.' },
    photos:['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=120&h=120&fit=crop&q=80'], helpful:127 },

  { id:44, name:'Younes Belhaj', initial:'Y', grad:'linear-gradient(135deg,#7c3aed,#f59e0b)', rating:4, date:'2024-12-19', country:'Algeria',
    product:'Sunglasses — Aviator Gold',
    text:{ bn:'চশমা দেখতে অসাধারণ সুন্দর! পরলে রেট্রো ভাইব আসে। UV প্রোটেকশন আছে, রোদে চোখ আরামদায়ক। শুধু কেসটা একটু সাধারণ ছিল। তারপরেও দামের তুলনায় ভালো কেনাকাটা হয়েছে।', en:'Sunglasses look absolutely amazing! Gives a retro vibe when worn. Has UV protection, eyes comfortable in sun. Only the case was a bit basic. Still a good purchase for the price.', ar:'النظارات الشمسية تبدو رائعة! تعطي طابعاً كلاسيكياً عند الارتداء. لها حماية من الأشعة فوق البنفسجية والعيون مريحة في الشمس. فقط الحافظة كانت بسيطة قليلاً. ومع ذلك شراء جيد مقابل السعر.' },
    photos:['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=120&h=120&fit=crop&q=80'], helpful:61 },

  { id:45, name:'Faten Khalil', initial:'F', grad:'linear-gradient(135deg,#0891b2,#a855f7)', rating:5, date:'2024-12-15', country:'Tunisia',
    product:"Women's Sneaker — White Chunky 38",
    text:{ bn:'এই স্নিকার পরে রাস্তায় বেরোলে মনে হয় ক্লাউড এ হাঁটছি! সোল এত মোটা আর নরম। ডিজাইন ট্রেন্ডি, যেকোনো আউটফিটের সাথে মানায়। ৩ মাস হলো পরছি, একটুও বিবর্ণ হয়নি।', en:'Walking in these sneakers feels like walking on clouds! Such thick and soft sole. Design is trendy, goes with any outfit. Been wearing for 3 months, not faded at all.', ar:'المشي بهذه الأحذية يشعرك وكأنك تمشي على الغيوم! نعل سميك وناعم جداً. التصميم عصري ويلائم أي ملابس. أرتديها منذ 3 أشهر ولم تبهت أبداً.' },
    photos:['https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&h=120&fit=crop&q=80'], helpful:149 },

  { id:46, name:'Hamad Al-Thani', initial:'H', grad:'linear-gradient(135deg,#1d4ed8,#dc2626)', rating:5, date:'2024-12-11', country:'Qatar',
    product:'Premium Luggage Set — 3pcs Navy',
    text:{ bn:'লাগেজ সেট তিনটা মিলিয়ে একটা কমপ্লিট সেট! মাঝারিটা কেবিন ব্যাগেজে যায়, বড়টায় অনেক কিছু ধরে। চাকা স্মুথ, সব দিকে ঘোরে। লক সিস্টেম মজবুত। দুবাই ট্রিপে নিয়ে গিয়েছিলাম, দারুণ অভিজ্ঞতা।', en:'Luggage set of 3 forms a complete set! The medium fits in cabin baggage, the large holds everything. Wheels are smooth, rotate all directions. Lock system is sturdy. Took to Dubai trip, excellent experience.', ar:'مجموعة الأمتعة الثلاثة تشكل مجموعة كاملة! الوسطى تناسب أمتعة المقصورة والكبيرة تسع الكثير. العجلات سلسة وتدور بجميع الاتجاهات. نظام القفل متين. أخذتها في رحلة دبي، تجربة رائعة.' },
    photos:['https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=120&h=120&fit=crop&q=80'], helpful:116 },

  { id:47, name:'Roshan Kumari', initial:'R', grad:'linear-gradient(135deg,#f43f5e,#f59e0b)', rating:5, date:'2024-12-07', country:'India',
    product:'Kids Dress — Lehenga Pink 8Y',
    text:{ bn:'মেয়ের লেহেঙ্গা পেয়ে সে এতটাই খুশি যে পরেই ঘুমিয়ে পড়েছে 😂 কাপড় ঝকঝকে, কারুকাজ সুন্দর। বিয়েতে পরিয়েছিলাম, একশো ছবি তোলা হয়েছে! প্যাকেজিং ছিল অনেক সুন্দর। এত কম দামে এরকম পোশাক ভাবাই যায় না।', en:'My daughter was so happy with the lehenga she fell asleep wearing it 😂 Fabric is glittery, beautiful craftsmanship. Wore it to a wedding and 100 photos were taken! Packaging was very beautiful. Cannot imagine such a dress at this price.', ar:'ابنتي كانت سعيدة جداً باللهنغا لدرجة أنها نامت وهي ترتديها 😂 القماش لامع والحرفية جميلة. ارتدتها في حفل زفاف والتقطوا 100 صورة! التغليف كان جميلاً جداً. لا أتخيل مثل هذا الفستان بهذا السعر.' },
    photos:['https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=120&h=120&fit=crop&q=80'], helpful:172 },

  { id:48, name:'Ahmad Fayez', initial:'A', grad:'linear-gradient(135deg,#059669,#7c3aed)', rating:5, date:'2024-12-03', country:'Saudi Arabia',
    product:'Prayer Mat — Premium Velvet',
    text:{ bn:'জায়নামাজটা অনেক নরম ও আরামদায়ক। নামাজে মনোযোগ আসে বেশি। ভেলভেটের মান উচ্চমানের, রঙ গাঢ় ও সুন্দর। রোলআপ করে সহজে বহন করা যায়। রমজানে উপহার দিয়েছিলাম পরিবারকে, সবাই খুব খুশি হয়েছে।', en:'Prayer mat is very soft and comfortable. Helps focus more during prayer. Velvet quality is premium, color is deep and beautiful. Easy to roll up and carry. Gifted to family during Ramadan, everyone was very happy.', ar:'السجادة ناعمة ومريحة جداً. تساعد على التركيز أكثر أثناء الصلاة. جودة المخمل ممتازة واللون غامق وجميل. سهل اللف والحمل. أهديتها للعائلة في رمضان والجميع كان سعيداً جداً.' },
    photos:['https://images.unsplash.com/photo-1585421514738-01798e348b17?w=120&h=120&fit=crop&q=80'], helpful:134 },

  { id:49, name:'Elena Petrov', initial:'E', grad:'linear-gradient(135deg,#3b82f6,#e91e8c)', rating:5, date:'2024-11-29', country:'Saudi Arabia',
    product:'Gym Set — Sports Bra+Legging Black',
    text:{ bn:'জিম সেটটা সত্যিই পারফেক্ট! স্পোর্টস ব্রার সাপোর্ট অনেক ভালো, ওয়ার্কআউটে অস্বস্তি হয় না। লেগিং হাই-ওয়েস্ট, পেট টাইট রাখে। স্কোয়াট প্রুফ টেস্ট করেছি — পাশ! দামে এরকম সেট ভাবাই যায় না। 💪', en:'Gym set is truly perfect! Sports bra support is excellent, no discomfort during workout. Leggings are high-waist, keeps the tummy in check. Squat proof tested — passed! Cannot imagine such a set at this price. 💪', ar:'مجموعة الجيم مثالية حقاً! دعم حمالة الصدر الرياضية ممتاز، لا إزعاج أثناء التمرين. الليغنز عالي الخصر ويضبط البطن. اختبرت مقاومة القرفصاء وناجح! لا أتخيل مثل هذه المجموعة بهذا السعر. 💪' },
    photos:['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=120&h=120&fit=crop&q=80','https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=120&h=120&fit=crop&q=80'], helpful:161 },

  { id:50, name:'Karima Bensalem', initial:'K', grad:'linear-gradient(135deg,#f97316,#0891b2)', rating:5, date:'2024-11-25', country:'Morocco',
    product:'Moroccan Kaftan — Embroidered Blue',
    text:{ bn:'কাফতানটা দেখে মনে হলো মরক্কো থেকে আনা! এমব্রয়ডারি হাতের কাজের মতো সূক্ষ্ম। কাপড় ভারী ও দামি মনের হয়। বিয়েতে পরে দেশীয় ঐতিহ্য ধরে রেখেছিলাম। প্রত্যেকে ছবি তুলতে চেয়েছে আমার সাথে!', en:'The kaftan looks like it was brought from Morocco itself! Embroidery is as intricate as handwork. Fabric is heavy and feels expensive. Wore it to a wedding maintaining cultural heritage. Everyone wanted to take photos with me!', ar:'الكفتان يبدو كأنه جُلب من المغرب نفسه! التطريز دقيق كالعمل اليدوي. القماش ثقيل ويشعر بالفخامة. ارتديته في حفل زفاف محتفظاً بالتراث الثقافي. الجميع أراد التقاط الصور معي!' },
    photos:['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=120&h=120&fit=crop&q=80'], helpful:145 }
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

const REV_KEYWORDS = [
  { label: 'Comfortable',  words: ['comfort','comfortable','مريح','आरामदायक','আরামদায়ক'] },
  { label: 'Perfect Fit',  words: ['fit perfectly','perfect fit','مقاس مثالي','মাপ মিলেছে','আকার ঠিক'] },
  { label: 'Excellent',    words: ['excellent','amazing','rائع','رائع','অসাধারণ','अद्भुत'] },
  { label: 'Good Quality', words: ['quality','جودة','গুণমান','गुणवत्ता','কোয়ালিটি'] },
  { label: 'Fast Delivery',words: ['delivery','days','توصيل','ডেলিভারি','डिलीवरी','দিনে'] },
  { label: 'Recommended',  words: ['recommend','أنصح','অর্ডার করব','recommend'] },
];

const COUNTRY_FLAGS = {
  'Saudi Arabia':'🇸🇦','Riyadh':'🇸🇦','Jeddah':'🇸🇦','Mecca':'🇸🇦','Medina':'🇸🇦',
  'Dammam':'🇸🇦','Makkah':'🇸🇦','Al Qatif':'🇸🇦','KSA':'🇸🇦',
  'UAE':'🇦🇪','Dubai':'🇦🇪','Abu Dhabi':'🇦🇪',
  'Kuwait':'🇰🇼','Qatar':'🇶🇦','Oman':'🇴🇲','Bahrain':'🇧🇭',
  'Egypt':'🇪🇬','Bangladesh':'🇧🇩','Algeria':'🇩🇿','Pakistan':'🇵🇰',
  'India':'🇮🇳','Jordan':'🇯🇴','Morocco':'🇲🇦','Lebanon':'🇱🇧',
};

function _revCountry(c) {
  if (!c) return '';
  for (const [k,v] of Object.entries(COUNTRY_FLAGS)) {
    if (c.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return '🌍';
}

function renderRevSummary() {
  const all = getAllReviews();
  const total = all.length;
  const avg = total ? (all.reduce((s,r)=>s+r.rating,0)/total) : 0;
  document.getElementById('revAvgScore').textContent = avg.toFixed(1);
  document.getElementById('revTotalCount').textContent = (total + 4871).toLocaleString();
  const starsEl = document.getElementById('revAvgStars');
  starsEl.innerHTML = [1,2,3,4,5].map(i=>`<span style="color:${i<=Math.round(avg)?'#ffd700':'#e0e0e0'}">★</span>`).join('');
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

  // Keyword pills
  const pillsEl = document.getElementById('revKeywordRow');
  if (pillsEl) {
    const pills = REV_KEYWORDS.map(kw => {
      const cnt = all.filter(r => {
        const txt = (typeof r.text === 'object') ? (r.text.en || '') : (r.text || '');
        return kw.words.some(w => txt.toLowerCase().includes(w.toLowerCase()));
      }).length;
      return { label: kw.label, cnt };
    }).filter(p => p.cnt > 0).sort((a,b) => b.cnt - a.cnt);
    pillsEl.innerHTML = pills.map(p =>
      `<button class="rev-kw-pill" onclick="filterRevByKeyword('${p.label}',this)">${p.label}(${p.cnt})</button>`
    ).join('');
  }
}

function renderRevList(filter, keyword) {
  activeRevFilter = filter;
  const all = getAllReviews();
  let filtered = all;
  if (filter === '5') filtered = all.filter(r=>r.rating===5);
  else if (filter === '4') filtered = all.filter(r=>r.rating===4);
  else if (filter === '3') filtered = all.filter(r=>r.rating<=3);
  else if (filter === 'photos') filtered = all.filter(r=>r.photos && r.photos.length>0);
  if (keyword) {
    const kw = REV_KEYWORDS.find(k=>k.label===keyword);
    if (kw) filtered = filtered.filter(r=>{
      const txt = (typeof r.text === 'object') ? (r.text.en || '') : (r.text || '');
      return kw.words.some(w=>txt.toLowerCase().includes(w.toLowerCase()));
    });
  }
  const list = document.getElementById('revList');
  if (!filtered.length) {
    list.innerHTML = `<div class="rev-empty"><i class="fas fa-comment-slash"></i><p>${t('noReviews')}</p></div>`;
    return;
  }
  list.innerHTML = filtered.map(r => {
    const txt = (typeof r.text === 'object') ? (r.text[currentLang] || r.text.en) : r.text;
    const stars = [1,2,3,4,5].map(i=>`<i class="fa${i<=r.rating?'s':'r'} fa-star" style="color:${i<=r.rating?'#222':'#e0e0e0'};font-size:12px"></i>`).join('');
    const photos = (r.photos||[]).length
      ? `<div class="rev-card-photos">${r.photos.map(p=>`<img src="${p}" alt="" loading="lazy" onclick="event.stopPropagation()"/>`).join('')}</div>` : '';
    const dateStr = r.date ? new Date(r.date).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}) : '';
    const flag = _revCountry(r.country);
    const helpful = JSON.parse(localStorage.getItem('exg_helpful_'+r.id)||'{"cnt":'+(r.helpful||0)+',"voted":false}');
    return `<div class="rev-card">
      <div class="rev-card-top">
        <div class="rev-avatar-temu" style="background:${r.grad||'#e91e8c'}">${r.initial||r.name[0]}</div>
        <div class="rev-temu-meta">
          <div class="rev-temu-name">${r.name}${flag?' <span class="rev-flag">in ${flag}</span>':''}<span class="rev-temu-date"> on ${dateStr}</span></div>
          <div class="rev-temu-stars">${stars}</div>
        </div>
      </div>
      ${r.product?`<div class="rev-purchased"><span class="rev-purchased-lbl">${t('purchasedLabel')||'Purchased:'}</span> ${r.product}</div>`:''}
      <p class="rev-card-text">${txt}</p>
      ${photos}
      <div class="rev-temu-footer">
        <button class="rev-temu-action" onclick="_revShare(${r.id})"><i class="fas fa-share-nodes"></i> ${t('shareAction')||'Share'}</button>
        <span class="rev-pipe">|</span>
        <button class="rev-temu-action rev-helpful-btn" id="revHelp${r.id}" onclick="_revHelpful(${r.id},this)">
          <i class="${helpful.voted?'fas':'far'} fa-thumbs-up"></i> ${t('helpfulAction')||'Helpful'} ${helpful.cnt > 0?'('+helpful.cnt+')':''}
        </button>
        <span class="rev-pipe">|</span>
        <button class="rev-temu-action rev-report-btn" onclick="_revReport(${r.id})"><i class="fas fa-flag"></i> ${t('reportAction')||'Report'}</button>
      </div>
    </div>`;
  }).join('');
}

function filterReviewsBy(filter, el) {
  document.querySelectorAll('.rev-filter').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.rev-kw-pill').forEach(b=>b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderRevList(filter);
}

function filterRevByKeyword(keyword, el) {
  document.querySelectorAll('.rev-kw-pill').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.rev-filter').forEach(b=>b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderRevList('all', keyword);
}

function _revHelpful(id, btn) {
  const key = 'exg_helpful_' + id;
  const data = JSON.parse(localStorage.getItem(key) || '{"cnt":0,"voted":false}');
  if (data.voted) return;
  const rev = getAllReviews().find(r=>r.id===id);
  data.cnt = (rev ? rev.helpful||0 : data.cnt) + 1;
  data.voted = true;
  localStorage.setItem(key, JSON.stringify(data));
  if (btn) {
    btn.innerHTML = `<i class="fas fa-thumbs-up"></i> ${t('helpfulAction')||'Helpful'} (${data.cnt})`;
    btn.style.color = '#e91e8c';
  }
}

function _revShare(id) {
  if (navigator.share) {
    navigator.share({ title: 'EX GLOBAL Review', url: location.href });
  } else {
    navigator.clipboard?.writeText(location.href);
    showToast(t('linkCopied') || 'Link copied!');
  }
}

function _revReport(id) {
  showToast('Report submitted. Thank you.');
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

/* ===== SPLASH SCREEN ===== */
(function initSplash() {
  // ── Letter-by-letter brand name ──
  const brandEl = document.getElementById('exsBrand');
  if (brandEl) {
    const text = 'EX GLOBAL';
    let delay = 1.4;
    text.split('').forEach(ch => {
      if (ch === ' ') {
        const sp = document.createElement('span');
        sp.className = 'exs-space';
        brandEl.appendChild(sp);
      } else {
        const sp = document.createElement('span');
        sp.textContent = ch;
        sp.style.animationDelay = delay + 's';
        delay += 0.1;
        brandEl.appendChild(sp);
      }
    });
  }

  // ── Floating gold particles (circles + diamonds) ──
  const pContainer = document.getElementById('exsParticles');
  if (pContainer) {
    const golds = ['#d4a017','#f0c040','#e8b520','#ffd700','rgba(255,215,0,.75)','rgba(212,160,23,.55)'];
    for (let i = 0; i < 26; i++) {
      const p = document.createElement('div');
      p.className = 'exs-particle';
      const isDiamond = Math.random() > .5;
      const size = isDiamond ? Math.random() * 4 + 3 : Math.random() * 3 + 2;
      const color = golds[Math.floor(Math.random() * golds.length)];
      p.style.cssText = [
        `width:${size}px`, `height:${size}px`,
        `left:${Math.random() * 100}%`,
        `top:${Math.random() * 80 + 55}%`,
        `background:${color}`,
        isDiamond ? 'border-radius:1px;transform:rotate(45deg)' : 'border-radius:50%',
        `opacity:${Math.random() * .5 + .25}`,
        `animation-duration:${Math.random() * 6 + 5}s`,
        `animation-delay:${Math.random() * 5}s`,
        `box-shadow:0 0 ${Math.ceil(size * 2)}px ${color}`,
      ].join(';');
      pContainer.appendChild(p);
    }
  }

  function hideSplash() {
    const s = document.getElementById('exSplash');
    if (s) { s.classList.add('hidden'); setTimeout(() => s.remove(), 900); }
  }
  const t = setTimeout(hideSplash, 5000);
  window.addEventListener('load', () => {
    if (document.readyState === 'complete') {
      clearTimeout(t);
      setTimeout(hideSplash, 4500);
    }
  });
})();

/* ===== PWA INSTALL ===== */
(function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  let deferredPrompt = null;

  function showDrawerInstall(show) {
    const item = document.getElementById('drawerInstallItem');
    if (item) item.style.display = show ? '' : 'none';
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    showDrawerInstall(true);
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    showDrawerInstall(false);
  });

  // Global function called from drawer menu
  window.installPWA = async function() {
    if (!deferredPrompt) {
      showToast('অ্যাপ ইতিমধ্যে ইন্সটল করা আছে অথবা আপনার ব্রাউজার সাপোর্ট করে না।');
      return;
    }
    closeDrawer();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    showDrawerInstall(false);
    if (outcome === 'accepted') {
      showToast('🎉 EX GLOBAL অ্যাপ ইন্সটল হয়ে গেছে!');
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    // iOS Safari: show drawer install for iOS users not yet in standalone
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone = window.navigator.standalone === true;
    if (isIos && !isStandalone) {
      showDrawerInstall(true);
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
    getName(p).toLowerCase().includes(s) ||
    p.category.includes(s) ||
    (p.tag || '').toLowerCase().includes(s) ||
    (p.colorNames || []).some(c => c.toLowerCase().includes(s)) ||
    (p.description || '').toLowerCase().includes(s)
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

/* ── AI Usage tracking ── */
function _aiGetUsage() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const d = JSON.parse(localStorage.getItem('exg_ai_usage') || '{}');
    if (d.date !== today) return { date: today, count: 0 };
    return d;
  } catch(e) { return { date: new Date().toISOString().slice(0, 10), count: 0 }; }
}
function _aiGetLimit() {
  try { return parseInt((JSON.parse(localStorage.getItem('exg_settings') || '{}')).aiDailyLimit) || 20; }
  catch(e) { return 20; }
}
function _aiIncrUsage() {
  const u = _aiGetUsage(); u.count++;
  localStorage.setItem('exg_ai_usage', JSON.stringify(u));
  _aiUpdateUsageBar();
}
function _aiUpdateUsageBar() {
  const u = _aiGetUsage();
  const limit = _aiGetLimit();
  const count = u.count;
  const pct   = Math.min(Math.round((count / limit) * 100), 100);
  const _T    = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const textEl = document.getElementById('aiUsageText');
  const pctEl  = document.getElementById('aiUsagePct');
  const fillEl = document.getElementById('aiUsageFill');

  if (textEl) {
    const tpl = _T.aiUsageLabel || 'Today: {used}/{limit} messages';
    textEl.textContent = tpl.replace('{used}', count).replace('{limit}', limit);
  }
  if (pctEl) pctEl.textContent = pct + '%';
  if (fillEl) {
    fillEl.style.width = pct + '%';
    fillEl.classList.toggle('warn', pct >= 70 && pct < 100);
    fillEl.classList.toggle('full', pct >= 100);
  }

  const inp     = document.getElementById('aiChatInput');
  const sendBtn = document.getElementById('aiChatSendBtn');
  const isOver  = count >= limit;
  if (inp) {
    inp.disabled = isOver;
    inp.placeholder = isOver
      ? (_T.aiLimitReached || 'Daily limit reached. Try again tomorrow.')
      : (_T.aiChatPlaceholder || 'Type your question...');
  }
  if (sendBtn) sendBtn.disabled = isOver;
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
  _aiUpdateUsageBar();
  if (aiChatHistory.length === 0) _aiRenderWelcome();
  const inp = document.getElementById('aiChatInput');
  if (inp && !inp.disabled) setTimeout(() => inp.focus(), 300);
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

  // Check daily limit
  const usage = _aiGetUsage();
  const limit = _aiGetLimit();
  if (usage.count >= limit) {
    const _T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    _aiAppendMsg('assistant', _T.aiLimitReached || 'Daily AI message limit reached. Please try again tomorrow.');
    inp.value = '';
    return;
  }

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
      body: JSON.stringify({ messages: aiChatHistory, userLang: _aiDetectLang(text) })
    });
    const data = await resp.json();
    _aiRemoveTyping();
    const reply = data?.content?.[0]?.text || 'Sorry, I could not respond. Please try again.';
    aiChatHistory.push({ role: 'assistant', content: reply });
    _aiAppendMsg('assistant', reply);
    _aiIncrUsage(); // increment AFTER successful response
  } catch(e) {
    _aiRemoveTyping();
    _aiAppendMsg('assistant', 'Connection error. Please check your internet and try again.');
  } finally {
    const u2 = _aiGetUsage();
    if (sendBtn) sendBtn.disabled = u2.count >= limit;
    if (u2.count < limit) inp.focus();
  }
}

function _aiDetectLang(text) {
  if (/[ঀ-৿]/.test(text)) return 'Bengali';
  if (/[؀-ۿݐ-ݿࢠ-ࣿ]/.test(text)) return 'Arabic';
  if (/[ऀ-ॿ]/.test(text)) return 'Hindi';
  // For short/ambiguous messages fall back to the app's active language
  const appLangMap = { bn: 'Bengali', en: 'English', ar: 'Arabic', hi: 'Hindi' };
  return appLangMap[currentLang] || 'English';
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

/* ═══════════════════════════════════════════════════════════════════
   ORDER TRACKING
   ═══════════════════════════════════════════════════════════════════ */

function openTrackPanel(prefillId) {
  document.getElementById('trackOverlay').classList.add('open');
  document.getElementById('trackPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
  applyTranslations();
  if (prefillId) {
    document.getElementById('trackInput').value = prefillId;
    setTimeout(searchOrder, 100);
  } else {
    setTimeout(() => document.getElementById('trackInput').focus(), 300);
  }
}

function closeTrackPanel() {
  document.getElementById('trackOverlay').classList.remove('open');
  document.getElementById('trackPanel').classList.remove('open');
  document.body.style.overflow = '';
}

async function searchOrder() {
  const raw = (document.getElementById('trackInput').value || '').trim().toUpperCase();
  if (!raw) { showToast(t('enterOrderId') || 'Enter Order ID'); return; }

  const resultEl = document.getElementById('trackResult');
  resultEl.innerHTML = '<div class="trk-loading"><div class="trk-spinner"></div></div>';

  // 1. localStorage first (same device)
  const localOrders = JSON.parse(localStorage.getItem('exg_orders') || '[]');
  const localMatch = localOrders.find(o =>
    (o.id || '').toUpperCase() === raw ||
    (o.trackingNumber || '').toUpperCase() === raw ||
    (o.awb || '').toUpperCase() === raw
  );
  if (localMatch) { _renderTrackResult(localMatch, resultEl); return; }

  // 2. Firestore lookup
  try {
    const FIREBASE_API_KEY = 'AIzaSyCPSsxifbE92WqEa2VsGdSqaJIRTPkZiLQ';
    const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/exglobal21/databases/(default)/documents';
    const resp = await fetch(`${FIRESTORE_BASE}/notifications/${encodeURIComponent(raw)}?key=${FIREBASE_API_KEY}`);
    if (resp.ok) {
      const doc = await resp.json();
      if (doc.fields) {
        const order = _fsFieldsToObj(doc.fields);
        if (order.docType === 'order' || order.id) { _renderTrackResult(order, resultEl); return; }
      }
    }
  } catch (e) { /* network issue, fall through */ }

  resultEl.innerHTML = `<div class="trk-not-found">
    <i class="fas fa-magnifying-glass"></i>
    <p>${t('orderNotFound') || 'Order not found. Please check your Order ID.'}</p>
  </div>`;
}

function _fsFieldsToObj(fields) {
  function fromVal(v) {
    if (!v) return null;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return parseInt(v.integerValue, 10);
    if ('doubleValue' in v) return v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('nullValue' in v) return null;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromVal);
    if ('mapValue' in v) {
      const obj = {};
      for (const [k, fv] of Object.entries(v.mapValue.fields || {})) obj[k] = fromVal(fv);
      return obj;
    }
    return null;
  }
  const obj = {};
  for (const [k, fv] of Object.entries(fields)) obj[k] = fromVal(fv);
  return obj;
}

function _renderTrackResult(order, el) {
  const _T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const trackSteps = _T.orderTrack || ['Ordered', 'Confirmed', 'Shipped', 'Delivered'];
  const statusStep  = { pending: 0, confirmed: 1, processing: 1, shipped: 2, delivered: 3 };
  const statusColor = { pending: '#f59e0b', confirmed: '#3b82f6', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };
  const statusIcon  = { pending: 'fa-clock', confirmed: 'fa-check-circle', processing: 'fa-gear fa-spin', shipped: 'fa-truck', delivered: 'fa-circle-check', cancelled: 'fa-times-circle' };

  const st   = order.status || 'pending';
  const step = statusStep[st] ?? 0;
  const col  = statusColor[st] || '#888';
  const ico  = statusIcon[st]  || 'fa-clock';
  const label = ((_T.orderStatus || {})[st]) || st;
  const lang  = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const total = lang.currency + Math.round((order.totalSAR || 0) * (lang.rate || 1)).toLocaleString();
  const _localeMap = { ar: 'ar-SA', bn: 'bn-BD', hi: 'hi-IN' };
  const date  = order.date ? new Date(order.date).toLocaleDateString(_localeMap[currentLang] || 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const items = (order.items || []).slice(0, 5);
  const trackingNum = order.trackingNumber || order.awb || '';

  const timeline = `<div class="mo-timeline" style="margin:16px 0 8px">${
    trackSteps.map((s, i) => `
      <div class="mo-step ${i <= step ? 'done' : ''}">
        <div class="mo-dot">${i <= step ? '<i class="fas fa-check"></i>' : (i === step + 1 ? '<i class="fas fa-circle" style="font-size:6px"></i>' : '')}</div>
        <div class="mo-step-label">${s}</div>
      </div>${i < trackSteps.length - 1 ? `<div class="mo-line ${i < step ? 'done' : ''}"></div>` : ''}`)
    .join('')}
  </div>`;

  const awbSection = trackingNum ? `
    <div class="trk-awb-row">
      <i class="fas fa-truck" style="color:#8b5cf6;font-size:14px"></i>
      <span class="trk-awb-label">${t('trackingNumber') || 'Tracking #'}</span>
      <span class="trk-awb-num">${trackingNum}</span>
      <button class="trk-copy-btn" onclick="navigator.clipboard?.writeText('${trackingNum}').then(()=>showToast('✅ Copied!'))">
        <i class="fas fa-copy"></i>
      </button>
    </div>` : '';

  el.innerHTML = `
    <div class="trk-result-card">
      <div class="trk-result-top">
        <div>
          <div class="trk-order-id">#${order.id || ''}</div>
          <div class="trk-order-date">${date}</div>
        </div>
        <div class="trk-status-pill" style="background:${col}18;color:${col};border:1px solid ${col}35">
          <i class="fas ${ico}" style="font-size:11px"></i> ${label}
        </div>
      </div>
      ${items.length ? `<div class="mo-items-row" style="margin:14px 0 0">
        ${items.map(i => `<div class="mo-item-thumb"><img src="${i.image || ''}" onerror="this.style.display='none'"/><span class="mo-item-qty">×${i.qty || 1}</span></div>`).join('')}
      </div>` : ''}
      <div class="trk-names">${(order.items || []).map(i => `${i.name || ''}${(i.qty || 1) > 1 ? ' ×' + i.qty : ''}`).join(' · ')}</div>
      ${timeline}
      ${awbSection}
      <div class="trk-total-row">
        <span style="color:#888;font-size:13px">${_T.orderTotal || 'Total'}</span>
        <span style="font-weight:700;color:#e91e8c;font-size:15px">${total}</span>
      </div>
      <div id="trkLiveEvents"></div>
    </div>`;

  if (trackingNum) _fetchLiveTracking(trackingNum);
}

async function _fetchLiveTracking(awb) {
  const s = JSON.parse(localStorage.getItem('exg_settings') || '{}');
  const workerUrl = (s.workerUrl2 || localStorage.getItem('exg_worker_url2') || '').replace(/\/$/, '');
  if (!workerUrl) return;
  try {
    const resp = await fetch(`${workerUrl}/api/track/${encodeURIComponent(awb)}`);
    if (!resp.ok) return;
    const data = await resp.json();
    const events = data.events || data.trackingEvents || [];
    if (!events.length) return;
    const eventsEl = document.getElementById('trkLiveEvents');
    if (!eventsEl) return;
    eventsEl.innerHTML = `
      <div class="trk-events-head"><i class="fas fa-route"></i> ${t('liveTracking') || 'Live Tracking'}</div>
      <div class="trk-events-list">
        ${events.map(ev => `
          <div class="trk-event-item">
            <div class="trk-event-dot"></div>
            <div class="trk-event-info">
              <div class="trk-event-desc">${ev.description || ev.UpdateDescription || ev.status || ''}</div>
              <div class="trk-event-time">${ev.timestamp || ev.UpdateDateTime || ''} ${ev.location || ev.UpdateLocation?.City ? '· ' + (ev.location || ev.UpdateLocation?.City || '') : ''}</div>
            </div>
          </div>`).join('')}
      </div>`;
  } catch (e) { /* silent */ }
}

/* ═══════════════════════════════════════════════════════════════════
   MOYASAR PAYMENT INTEGRATION
   Saudi Arabia payment gateway — supports mada, Visa, Mastercard
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Initialize Moyasar payment for the given amount (SAR).
 * Uses Moyasar Hosted Payment Page approach:
 *   1. Build callback URLs with order metadata
 *   2. Redirect to Moyasar payment page  OR  use Moyasar.js inline form
 *
 * On return from Moyasar:
 *   - success: URL contains ?status=paid&id=... → handled by _handleMoyasarCallback()
 *   - failure: URL contains ?status=failed&message=...
 */
async function _initMoyasarPayment(publishableKey, amountSAR) {
  // Amounts in Moyasar are in halalas (SAR × 100, integer)
  const amountHalalas = Math.round(amountSAR * 100);

  // Build order snapshot to pass through metadata
  const langNow = TRANSLATIONS[currentLang] || TRANSLATIONS['bn'];
  const orderId = 'ORD' + Date.now();
  const orderItems = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return p ? {
      id: i.id, name: p.names?.en || p.nameEn || 'Product',
      price: p.price || 0, qty: i.qty || 1,
      size: i.size || '', color: i.color || '',
      image: p.image || '', cjVariantId: p.cjVariantId || '',
    } : null;
  }).filter(Boolean);

  const metadata = {
    orderId,
    customerName: currentUser?.name || '',
    customerEmail: currentUser?.email || '',
    customerPhone: currentUser?.phone || savedLocation?.phone || '',
    addressName: savedLocation?.name || currentUser?.name || '',
    addressPhone: savedLocation?.phone || currentUser?.phone || '',
    city: savedLocation?.city || '',
    district: savedLocation?.district || '',
    address: savedLocation?.address || savedLocation?.street || '',
    country: 'SA',
    zip: savedLocation?.zip || '',
    items: JSON.stringify(orderItems).slice(0, 500), // Moyasar metadata has size limits
  };

  // Build callback URL — back to current page with result params
  const callbackBase = window.location.href.split('?')[0];
  const callbackUrl = callbackBase + '?moyasar_callback=1&order_id=' + orderId;

  // Build the Moyasar payment URL (Hosted Payment Page)
  // See: https://moyasar.com/docs/api/payments
  const params = new URLSearchParams({
    'publishable_api_key': publishableKey,
    'amount': amountHalalas,
    'currency': 'SAR',
    'description': `EX GLOBAL Order ${orderId}`,
    'callback_url': callbackUrl,
    'source[type]': 'creditcard',
    ...Object.fromEntries(
      Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, v])
    ),
  });

  // Save pending order to localStorage so we can recover it after redirect
  try {
    const pendingOrders = JSON.parse(localStorage.getItem('exg_pending_moyasar') || '{}');
    pendingOrders[orderId] = {
      orderId, amountSAR, amountHalalas, metadata,
      items: orderItems, cartSnapshot: [...cart],
      timestamp: Date.now(),
    };
    localStorage.setItem('exg_pending_moyasar', JSON.stringify(pendingOrders));
  } catch (e) { /* non-fatal */ }

  // Show loading state on button
  const btn = document.getElementById('btnPayNow');
  if (btn) {
    btn.disabled = true;
    const btnTxt = document.getElementById('payBtnText');
    if (btnTxt) btnTxt.textContent = 'جارٍ التحويل... / Redirecting...';
  }

  // Redirect to Moyasar hosted payment page
  const moyasarPayUrl = 'https://api.moyasar.com/v1/payments/initiate?' + params.toString();

  // Small delay so user sees the loading state
  setTimeout(() => {
    window.location.href = moyasarPayUrl;
  }, 400);
}

/**
 * Handle Moyasar callback after returning from payment page.
 * Called on page load when URL contains ?moyasar_callback=1
 *
 * Successful URL example:
 *   index.html?moyasar_callback=1&order_id=ORD123&id=pay_xxx&status=paid
 *
 * Failed URL example:
 *   index.html?moyasar_callback=1&order_id=ORD123&status=failed&message=...
 */
async function _handleMoyasarCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.get('moyasar_callback')) return;

  const status = urlParams.get('status') || '';
  const orderId = urlParams.get('order_id') || '';
  const paymentId = urlParams.get('id') || '';
  const errorMessage = urlParams.get('message') || '';

  // Clean URL immediately to avoid re-processing on refresh
  const cleanUrl = window.location.href.split('?')[0];
  window.history.replaceState({}, '', cleanUrl);

  if (status === 'paid' && orderId) {
    // Payment successful!
    try {
      // Retrieve pending order snapshot
      const pendingOrders = JSON.parse(localStorage.getItem('exg_pending_moyasar') || '{}');
      const pending = pendingOrders[orderId];

      // Build full order object
      const fullOrder = {
        id: orderId,
        date: new Date().toISOString(),
        paymentId,
        paymentMethod: 'card',
        paymentGateway: 'moyasar',
        totalSAR: pending ? Math.round(pending.amountSAR) : 0,
        customer: {
          name: currentUser?.name || pending?.metadata?.customerName || '',
          email: currentUser?.email || pending?.metadata?.customerEmail || '',
          phone: currentUser?.phone || pending?.metadata?.customerPhone || '',
        },
        address: {
          name: pending?.metadata?.addressName || '',
          phone: pending?.metadata?.addressPhone || '',
          city: pending?.metadata?.city || '',
          district: pending?.metadata?.district || '',
          address: pending?.metadata?.address || '',
          country: 'SA',
          zip: pending?.metadata?.zip || '',
        },
        items: pending?.items || [],
        status: 'confirmed',
      };

      // Save order locally
      _saveOrderRecord(pending?.cartSnapshot || [], fullOrder.totalSAR, 'card');

      // Save to Firestore
      await _saveOrderToFirestore(fullOrder);

      // Clean up pending order
      delete pendingOrders[orderId];
      localStorage.setItem('exg_pending_moyasar', JSON.stringify(pendingOrders));

      // Clear cart and show success
      cart = []; _saveCart(); updateCartBadge();
      const langFin = TRANSLATIONS[currentLang] || TRANSLATIONS['bn'];
      closePayment();
      setTimeout(() => {
        openCart();
        showOrderConfirm(orderId, 'SAR ' + (fullOrder.totalSAR || 0));
      }, 300);

      showToast('✅ Payment successful! Order confirmed.', 5000);
    } catch (e) {
      console.error('Moyasar callback handling error:', e);
      showToast('✅ Payment received — your order is being processed.', 6000);
    }
  } else if (status === 'failed' || status === 'cancelled') {
    const msg = decodeURIComponent(errorMessage || 'Payment was not completed');
    showToast('❌ ' + msg, 5000);
    // Re-open payment modal so customer can retry
    setTimeout(() => openPayment(), 800);
  }
}

/**
 * Save an order document to Firestore via REST API.
 * Collection: notifications, docType: 'order'
 * Uses the Firebase API key (public — same key used in index.html)
 */
async function _saveOrderToFirestore(orderData) {
  const FIREBASE_API_KEY = 'AIzaSyCPSsxifbE92WqEa2VsGdSqaJIRTPkZiLQ';
  const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/exglobal21/databases/(default)/documents';
  const docId = orderData.id || ('ORD' + Date.now());
  const url = `${FIRESTORE_BASE}/notifications/${encodeURIComponent(docId)}?key=${FIREBASE_API_KEY}`;

  // Convert JS value to Firestore value format
  function toFsVal(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') {
      return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    }
    if (typeof v === 'string') return { stringValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsVal) } };
    if (typeof v === 'object') {
      const fields = {};
      for (const [k, val] of Object.entries(v)) fields[k] = toFsVal(val);
      return { mapValue: { fields } };
    }
    return { stringValue: String(v) };
  }

  const fullDoc = {
    ...orderData,
    docType: 'order',
    createdAt: new Date().toISOString(),
    source: 'website',
  };

  const fields = {};
  for (const [k, v] of Object.entries(fullDoc)) fields[k] = toFsVal(v);

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Firestore write failed (${res.status}): ${errBody}`);
    }
    return true;
  } catch (e) {
    console.error('_saveOrderToFirestore error:', e);
    throw e;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   DRAGGABLE AI FAB
   ═══════════════════════════════════════════════════════════════════ */
(function _initDraggableFab() {
  document.addEventListener('DOMContentLoaded', () => {
    const fab = document.getElementById('aiChatFab');
    if (!fab) return;

    const STORE_KEY = 'exg_ai_fab_pos';
    const W = 54, H = 62, EDGE = 12;

    // Restore saved position
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (saved) {
        fab.style.left   = saved.left + 'px';
        fab.style.top    = saved.top  + 'px';
        fab.style.right  = 'auto';
        fab.style.bottom = 'auto';
      }
    } catch(e) {}

    let startX, startY, startLeft, startTop, dragged = false;

    function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

    function onStart(e) {
      const isTouch = e.touches;
      const cx = isTouch ? e.touches[0].clientX : e.clientX;
      const cy = isTouch ? e.touches[0].clientY : e.clientY;
      const rect = fab.getBoundingClientRect();
      startX = cx; startY = cy;
      startLeft = rect.left; startTop = rect.top;
      dragged = false;
      fab.classList.add('dragging');
      fab.style.left   = startLeft + 'px';
      fab.style.top    = startTop  + 'px';
      fab.style.right  = 'auto';
      fab.style.bottom = 'auto';
      document.addEventListener(isTouch ? 'touchmove' : 'mousemove', onMove, { passive: false });
      document.addEventListener(isTouch ? 'touchend'  : 'mouseup',   onEnd,  { once: true });
    }

    function onMove(e) {
      const isTouch = e.touches;
      const cx = isTouch ? e.touches[0].clientX : e.clientX;
      const cy = isTouch ? e.touches[0].clientY : e.clientY;
      const dx = cx - startX, dy = cy - startY;
      if (!dragged && Math.abs(dx) + Math.abs(dy) > 6) dragged = true;
      if (!dragged) return;
      if (isTouch) e.preventDefault();
      const vw = window.innerWidth, vh = window.innerHeight;
      const newLeft = clamp(startLeft + dx, EDGE, vw - W - EDGE);
      const newTop  = clamp(startTop  + dy, EDGE, vh - H - EDGE);
      fab.style.left = newLeft + 'px';
      fab.style.top  = newTop  + 'px';
    }

    function onEnd(e) {
      const isTouch = e.changedTouches;
      document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', onMove);
      fab.classList.remove('dragging');
      if (!dragged) return; // was a tap — let onclick fire
      // Snap to nearest edge
      const rect = fab.getBoundingClientRect();
      const vw = window.innerWidth;
      const snapLeft = rect.left < vw / 2
        ? EDGE
        : vw - W - EDGE;
      fab.style.left = snapLeft + 'px';
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({ left: snapLeft, top: rect.top }));
      } catch(_) {}
    }

    fab.addEventListener('mousedown',  onStart);
    fab.addEventListener('touchstart', onStart, { passive: true });

    // Prevent click from firing after a drag
    fab.addEventListener('click', e => { if (dragged) { dragged = false; e.stopImmediatePropagation(); } }, true);
  });
})();

// ===== ACCOUNT SECURITY PANEL =====
function openAccountSecurity() {
  document.getElementById('secOverlay').classList.add('open');
  document.getElementById('secPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
  _secRefresh();
  applyTranslations();
}

function closeAccountSecurity() {
  document.getElementById('secOverlay').classList.remove('open');
  document.getElementById('secPanel').classList.remove('open');
  document.body.style.overflow = '';
}

function _secRefresh() {
  const user = JSON.parse(localStorage.getItem('exglobal_user') || 'null');
  const sec  = JSON.parse(localStorage.getItem('exg_security') || '{}');

  // Phone
  const phone = sec.phone || (user && user.phone) || '';
  document.getElementById('secPhoneVal').textContent = phone || t('notAdded');
  const phoneBtnSpan = document.getElementById('secPhoneBtn').querySelector('span');
  phoneBtnSpan.textContent = t(phone ? 'edit' : 'add');

  // Email
  const email = (user && user.email) || '';
  document.getElementById('secEmailVal').textContent = email || '—';

  // Password
  const hasPass = !!sec.hasPassword;
  document.getElementById('secPasswordVal').textContent = t(hasPass ? 'passwordSet' : 'notSet');
  const passBtnSpan = document.getElementById('secPasswordBtn').querySelector('span');
  passBtnSpan.textContent = t(hasPass ? 'change' : 'add');

  // 2FA
  const twoFA = !!sec.twoFA;
  document.getElementById('sec2FAVal').textContent = t(twoFA ? 'twoFactorOn' : 'twoFactorOff');
  document.getElementById('sec2FABtnText').textContent = t(twoFA ? 'turnOff' : 'turnOn');

  // Google
  const googleLinked = !!sec.googleLinked || !!(user && user.provider === 'google');
  document.getElementById('secGoogleVal').textContent = t(googleLinked ? 'linked' : 'notLinked');
  document.getElementById('secGoogleBtnText').textContent = t(googleLinked ? 'linked' : 'link');
  document.getElementById('secGoogleBtn').classList.toggle('linked', googleLinked);

  // Facebook
  const fbLinked = !!sec.fbLinked || !!(user && user.provider === 'facebook');
  document.getElementById('secFbVal').textContent = t(fbLinked ? 'linked' : 'notLinked');
  document.getElementById('secFbBtnText').textContent = t(fbLinked ? 'linked' : 'link');
  document.getElementById('secFbBtn').classList.toggle('linked', fbLinked);
}

function secPhoneEdit() {
  const sec = JSON.parse(localStorage.getItem('exg_security') || '{}');
  const current = sec.phone || '';
  const val = prompt(t('enterPhone'), current);
  if (val === null) return;
  const clean = val.trim();
  if (clean && !/^\+?[\d\s\-]{7,16}$/.test(clean)) { showToast('❌ ' + t('invalidPhone')); return; }
  sec.phone = clean;
  localStorage.setItem('exg_security', JSON.stringify(sec));
  _secRefresh();
  showToast('✓ ' + t('phoneAdded'));
}

function secEmailEdit() {
  const user = JSON.parse(localStorage.getItem('exglobal_user') || 'null');
  const current = (user && user.email) || '';
  const val = prompt(t('enterNewEmail'), current);
  if (val === null) return;
  const clean = val.trim();
  if (clean && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) { showToast('❌ ' + t('enterValidEmail')); return; }
  if (user) { user.email = clean; localStorage.setItem('exglobal_user', JSON.stringify(user)); }
  _secRefresh();
  showToast('✓ ' + t('emailUpdated'));
}

function secPasswordEdit() {
  const sec = JSON.parse(localStorage.getItem('exg_security') || '{}');
  const val = prompt(t('enterNewPassword'));
  if (val === null) return;
  if (val.length < 6) { showToast('❌ ' + t('passwordTooShort')); return; }
  sec.hasPassword = true;
  sec.passwordAt = Date.now();
  localStorage.setItem('exg_security', JSON.stringify(sec));
  _secRefresh();
  showToast('✓ ' + t('passwordChanged'));
}

function sec2FAToggle() {
  const sec = JSON.parse(localStorage.getItem('exg_security') || '{}');
  sec.twoFA = !sec.twoFA;
  localStorage.setItem('exg_security', JSON.stringify(sec));
  _secRefresh();
  showToast(t(sec.twoFA ? 'twoFactorEnabled' : 'twoFactorDisabled'));
}

function secGoogleLink() {
  const sec = JSON.parse(localStorage.getItem('exg_security') || '{}');
  const user = JSON.parse(localStorage.getItem('exglobal_user') || 'null');
  if (sec.googleLinked || (user && user.provider === 'google')) return;
  closeAccountSecurity();
  setTimeout(openAuth, 300);
}

function secFbLink() {
  const sec = JSON.parse(localStorage.getItem('exg_security') || '{}');
  const user = JSON.parse(localStorage.getItem('exglobal_user') || 'null');
  if (sec.fbLinked || (user && user.provider === 'facebook')) return;
  closeAccountSecurity();
  setTimeout(openAuth, 300);
}

function openSignInActivity() {
  const history = JSON.parse(localStorage.getItem('exg_signin_history') || '[]');
  const user    = JSON.parse(localStorage.getItem('exglobal_user') || 'null');

  // Build list (always show current session at top)
  const rows = [];
  if (user) {
    rows.push({ device: navigator.platform || 'This Device', ts: Date.now(), current: true });
  }
  rows.push(...history.slice(0, 4));

  const sheet = document.createElement('div');
  sheet.className = 'sec-activity-sheet';
  sheet.innerHTML = `
    <div class="sec-activity-bg" onclick="this.parentElement.remove()"></div>
    <div class="sec-activity-card">
      <div class="sec-activity-handle"></div>
      <div class="sec-activity-title">${t('signInActivity')}</div>
      ${rows.length ? rows.map(r => `
        <div class="sec-act-item">
          <div class="sec-act-dot ${r.current ? 'current' : 'old'}"></div>
          <div class="sec-act-info">
            <div class="sec-act-device">${r.device}${r.current ? ' (' + t('thisDevice') + ')' : ''}</div>
            <div class="sec-act-time">${new Date(r.ts).toLocaleString()}</div>
          </div>
        </div>`).join('') : `<p style="color:#aaa;font-size:13px">${t('noSignInHistory')}</p>`}
      <button class="sec-act-close-btn" onclick="this.closest('.sec-activity-sheet').remove()">${t('close') || 'Close'}</button>
    </div>`;
  document.body.appendChild(sheet);
  requestAnimationFrame(() => sheet.classList.add('open'));
}

function confirmDeleteAccount() {
  if (!confirm(t('confirmDeleteAccount'))) return;
  localStorage.clear();
  showToast(t('accountDeleted'));
  setTimeout(() => location.reload(), 1500);
}

// Log sign-in event to history
function _logSignIn(device) {
  const history = JSON.parse(localStorage.getItem('exg_signin_history') || '[]');
  history.unshift({ device: device || navigator.platform || 'Web Browser', ts: Date.now() });
  localStorage.setItem('exg_signin_history', JSON.stringify(history.slice(0, 10)));
}

// Check for Moyasar callback on page load
(function _checkMoyasarCallback() {
  if (window.location.search.includes('moyasar_callback=1')) {
    // Wait for page to fully init before processing callback
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(_handleMoyasarCallback, 500);
      });
    } else {
      setTimeout(_handleMoyasarCallback, 500);
    }
  }
})();

/* ===================================================
   VIP SEARCH PANEL
   =================================================== */
const VSP_TRENDING = [
  'Abaya', 'Kaftan', 'Jalabiya', 'Hijab', 'Evening dress',
  'Kids fashion', 'Perfume', 'Saudi style', 'Luxury brands', 'Summer collection'
];

function openVspPanel() {
  // clean up old broken truncated-dataUrl history entries
  try {
    const h = JSON.parse(localStorage.getItem('exg_search_history') || '[]');
    const cleaned = h.map(x => ({
      term: x.term,
      image: (x.image && !x.image.startsWith('color:') && !x.image.startsWith('data:')) ? '' : x.image
    }));
    localStorage.setItem('exg_search_history', JSON.stringify(cleaned));
  } catch(e) {}
  document.getElementById('vspOverlay').classList.add('open');
  document.getElementById('vspPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
  _vspRenderRecent();
  _vspRenderTrending();
  setTimeout(() => {
    const inp = document.getElementById('vspInput');
    if (inp) inp.focus();
  }, 320);
}

function closeVspPanel() {
  document.getElementById('vspOverlay').classList.remove('open');
  document.getElementById('vspPanel').classList.remove('open');
  document.body.style.overflow = '';
  const inp = document.getElementById('vspInput');
  if (inp) inp.value = '';
  document.getElementById('vspClearBtn').style.display = 'none';
  document.getElementById('vspResults').style.display = 'none';
  document.getElementById('vspDefault').style.display = 'block';
}

function _vspClearInput() {
  document.getElementById('vspInput').value = '';
  document.getElementById('vspClearBtn').style.display = 'none';
  document.getElementById('vspResults').style.display = 'none';
  document.getElementById('vspDefault').style.display = 'block';
  document.getElementById('vspInput').focus();
}

function _vspOnInput(val) {
  document.getElementById('vspClearBtn').style.display = val ? 'flex' : 'none';
  if (!val.trim()) {
    document.getElementById('vspResults').style.display = 'none';
    document.getElementById('vspDefault').style.display = 'block';
    return;
  }
  document.getElementById('vspDefault').style.display = 'none';
  document.getElementById('vspResults').style.display = 'block';
  _vspSearch(val.trim());
}

function _vspSearch(q) {
  const s = q.toLowerCase();
  const matches = PRODUCTS.filter(p =>
    getName(p).toLowerCase().includes(s) ||
    p.category.includes(s) ||
    (p.tag || '').toLowerCase().includes(s) ||
    (p.colorNames || []).some(c => c.toLowerCase().includes(s)) ||
    (p.description || '').toLowerCase().includes(s)
  ).slice(0, 12);

  const res = document.getElementById('vspResults');
  if (!matches.length) {
    res.innerHTML = `<div class="vsp-no-result">
      <div class="vsp-no-result-icon"><i class="fas fa-box-open"></i></div>
      <p class="vsp-no-result-title">Product Not Available</p>
      <p class="vsp-no-result-sub">No products match "<strong>${q}</strong>" in our store</p>
    </div>`;
    return;
  }
  res.innerHTML = matches.map(p => `
    <div class="vsp-res-item" onclick="_vspPickProduct(${p.id},'${q.replace(/'/g,"\\'").replace(/"/g,'\\"')}','${(p.image||'').replace(/'/g,"\\'")}')">
      <img src="${p.image}" class="vsp-res-img" loading="lazy" onerror="this.style.display='none'" />
      <div class="vsp-res-info" style="flex:1;min-width:0">
        <div class="vsp-res-name">${getName(p)}</div>
        <div class="vsp-res-price">${fmtD(p.price)}</div>
      </div>
      <i class="fas fa-chevron-right" style="color:#ddd;font-size:13px;flex-shrink:0"></i>
    </div>
  `).join('');
}

function _vspPickProduct(id, query, image) {
  _vspSaveHistory(query, image);
  closeVspPanel();
  openModal(id);
}

function _vspSubmit(val) {
  if (!val.trim()) return;
  _vspSaveHistory(val.trim(), '');
  closeVspPanel();
  visibleCount = 8;
  renderProducts(val.trim());
  document.getElementById('productsSection')?.scrollIntoView({ behavior: 'smooth' });
}

function _vspSaveHistory(term, image) {
  const h = JSON.parse(localStorage.getItem('exg_search_history') || '[]');
  const idx = h.findIndex(x => x.term === term);
  if (idx > -1) h.splice(idx, 1);
  h.unshift({ term, image });
  if (h.length > 10) h.pop();
  localStorage.setItem('exg_search_history', JSON.stringify(h));
}

function _vspRenderRecent() {
  const h = JSON.parse(localStorage.getItem('exg_search_history') || '[]');
  const section = document.getElementById('vspRecentSection');
  const list = document.getElementById('vspRecentList');
  if (!section || !list) return;
  if (!h.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = h.map(item => {
    let thumb;
    if (item.image && item.image.startsWith('color:')) {
      const hex = item.image.slice(6);
      thumb = `<div class="vsp-recent-img vsp-recent-swatch" style="background:${hex}"></div>`;
    } else if (item.image && item.image.startsWith('data:')) {
      thumb = `<img src="${item.image}" class="vsp-recent-img" loading="lazy" onerror="this.outerHTML='<div class=\\'vsp-recent-img vsp-recent-placeholder\\'><i class=\\'fas fa-search\\'></i></div>'" />`;
    } else {
      thumb = `<div class="vsp-recent-img vsp-recent-placeholder"><i class="fas fa-search"></i></div>`;
    }
    return `<div class="vsp-recent-card" onclick="_vspDoTerm('${item.term.replace(/'/g,"\\'")}')">
      ${thumb}
      <span class="vsp-recent-term">${item.term}</span>
    </div>`;
  }).join('');
}

function _vspDoTerm(term) {
  document.getElementById('vspInput').value = term;
  document.getElementById('vspClearBtn').style.display = 'flex';
  document.getElementById('vspDefault').style.display = 'none';
  document.getElementById('vspResults').style.display = 'block';
  _vspSearch(term);
}

function _vspClearHistory() {
  localStorage.removeItem('exg_search_history');
  _vspRenderRecent();
}

function _vspRenderTrending() {
  const wrap = document.getElementById('vspTrending');
  if (!wrap) return;
  wrap.innerHTML = VSP_TRENDING.map(t => `
    <button class="vsp-trend-chip" onclick="_vspDoTerm('${t}')">
      <i class="fas fa-arrow-trend-up"></i> ${t}
    </button>
  `).join('');
}

/* ===================================================
   EX GLOBAL VISION (Visual Search Camera)
   =================================================== */
let _exvStream = null, _exvFacing = 'environment';

async function openVision() {
  const sc = document.getElementById('exvScreen');
  sc.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  await _exvStartCamera();
}

function closeVision() {
  _exvStopCamera();
  document.getElementById('exvScreen').style.display = 'none';
  document.body.style.overflow = '';
}

async function _exvStartCamera() {
  try {
    _exvStopCamera();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: _exvFacing, width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    _exvStream = stream;
    const video = document.getElementById('exvVideo');
    video.srcObject = stream;
    video.style.display = 'block';
  } catch(e) {
    document.getElementById('exvVideo').style.display = 'none';
    showToast('Camera not available — use Gallery');
  }
}

function _exvStopCamera() {
  if (_exvStream) { _exvStream.getTracks().forEach(t => t.stop()); _exvStream = null; }
}

function _exvFlip() {
  _exvFacing = _exvFacing === 'environment' ? 'user' : 'environment';
  _exvStartCamera();
}

function _exvToggleFlash() {
  const btn = document.getElementById('exvFlashBtn');
  btn.classList.toggle('active');
  if (_exvStream) {
    const track = _exvStream.getVideoTracks()[0];
    if (track?.getCapabilities?.()?.torch) {
      track.applyConstraints({ advanced: [{ torch: btn.classList.contains('active') }] });
    }
  }
}

function _exvGallery() {
  document.getElementById('exvFileInput').click();
}

function _exvHandleFile(input) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => _exvProcessImage(e.target.result);
  reader.readAsDataURL(file);
  input.value = '';
}

function _exvCapture() {
  const video = document.getElementById('exvVideo');
  if (!video.srcObject) { _exvGallery(); return; }
  const canvas = document.getElementById('exvCanvas');
  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 240;
  canvas.getContext('2d').drawImage(video, 0, 0);
  _exvProcessImage(canvas.toDataURL('image/jpeg', 0.8));
}

function _exvProcessImage(dataUrl) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.getElementById('exvCanvas');
    canvas.width = 60; canvas.height = 60;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 60, 60);
    const data = ctx.getImageData(0, 0, 60, 60).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i+1]; b += data[i+2]; n++; }
    r = Math.round(r/n); g = Math.round(g/n); b = Math.round(b/n);
    const brightness = (r + g + b) / 3;
    let colorName = 'fashion';
    if (brightness < 55) colorName = 'black';
    else if (brightness > 210) colorName = 'white';
    else if (r > g + 45 && r > b + 45) colorName = 'red';
    else if (g > r + 30 && g > b + 30) colorName = 'green';
    else if (b > r + 45 && b > g + 30) colorName = 'blue';
    else if (r > 180 && g > 140 && b < 90) colorName = 'yellow';
    else if (r > 180 && g > 80 && b < 70) colorName = 'orange';
    else if (r > 140 && b > 140 && g < 100) colorName = 'purple';
    else if (r > 180 && b > 140 && g < 100) colorName = 'pink';
    else colorName = 'beige';
    closeVision();
    const hexColor = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    _vspSaveHistory(colorName, 'color:' + hexColor);
    openVspPanel();
    setTimeout(() => _vspDoTerm(colorName), 150);
  };
  img.src = dataUrl;
}

/* ===== ABANDONED CART RECOVERY ===== */
let _abandonedTimer = null;
function _abandonedCartReset() {
  clearTimeout(_abandonedTimer);
  if (!cart.length) return;
  const cartOpen = document.getElementById('cartDrawer')?.classList.contains('open')
    || document.getElementById('cartModal')?.classList.contains('open')
    || document.getElementById('payModal')?.classList.contains('open');
  if (cartOpen) return;
  if (sessionStorage.getItem('exg_abandon_shown')) return;
  _abandonedTimer = setTimeout(_showAbandonedPopup, 3 * 60 * 1000); // 3 min
}
function _showAbandonedPopup() {
  if (!cart.length) return;
  if (sessionStorage.getItem('exg_abandon_shown')) return;
  const overlay = document.getElementById('abandonOverlay');
  const popup   = document.getElementById('abandonPopup');
  if (!overlay || !popup) return;
  const total = cart.reduce((s, i) => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  document.getElementById('abandonTotal').textContent = lang.currency + total;
  document.getElementById('abandonCount').textContent = cart.reduce((s,i)=>s+i.qty,0);
  overlay.classList.add('show');
  popup.classList.add('show');
  sessionStorage.setItem('exg_abandon_shown', '1');
}
function closeAbandonPopup() {
  document.getElementById('abandonOverlay')?.classList.remove('show');
  document.getElementById('abandonPopup')?.classList.remove('show');
}
function abandonCheckout() {
  closeAbandonPopup();
  openCart();
}
// Reset timer when cart opened/closed
const _origOpenCart = openCart;
openCart = function() { clearTimeout(_abandonedTimer); _origOpenCart(); };
const _origCloseCart = closeCart;
closeCart = function() { _origCloseCart(); _abandonedCartReset(); };

/* ===== EXIT INTENT POPUP ===== */
let _exitShown = false;
function _initExitIntent() {
  if (sessionStorage.getItem('exg_exit_shown')) return;
  // Desktop: mouse leaves top of viewport
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 5 && !_exitShown) _showExitPopup();
  });
  // Mobile: after 60s of idle (no scroll/touch) if cart has items
  let _idleTimer = null;
  const _resetIdle = () => {
    clearTimeout(_idleTimer);
    _idleTimer = setTimeout(() => { if (cart.length && !_exitShown) _showExitPopup(); }, 60000);
  };
  ['touchstart','scroll'].forEach(ev => window.addEventListener(ev, _resetIdle, { passive: true }));
  _resetIdle();
}
function _showExitPopup() {
  if (_exitShown || sessionStorage.getItem('exg_exit_shown')) return;
  _exitShown = true;
  sessionStorage.setItem('exg_exit_shown', '1');
  const overlay = document.getElementById('exitOverlay');
  const popup   = document.getElementById('exitPopup');
  if (!overlay || !popup) return;
  overlay.classList.add('show');
  popup.classList.add('show');
}
function closeExitPopup() {
  document.getElementById('exitOverlay')?.classList.remove('show');
  document.getElementById('exitPopup')?.classList.remove('show');
}
function exitGrabDeal() {
  closeExitPopup();
  // Auto-apply 10% coupon
  const inp = document.getElementById('couponInput');
  if (inp) { inp.value = 'COMEBACK10'; applyCoupon(); }
  openPayment();
}
// Init after page load
window.addEventListener('load', () => { setTimeout(_initExitIntent, 5000); });

/* ===== TRENDING PAGE ===== */
let _tpSort = 'default';
let _tpCat  = 'all';

const _TP_SUBCATS = [
  { cat:'women',  name:'Women',  img:'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=120&h=120&fit=crop&q=80' },
  { cat:'men',    name:'Men',    img:'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=120&h=120&fit=crop&q=80' },
  { cat:'kids',   name:'Kids',   img:'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=120&h=120&fit=crop&q=80' },
  { cat:'beauty', name:'Beauty', img:'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=120&h=120&fit=crop&q=80' },
  { cat:'bags',   name:'Bags',   img:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=120&h=120&fit=crop&q=80' },
  { cat:'shoes',  name:'Shoes',  img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&h=120&fit=crop&q=80' },
  { cat:'sports', name:'Sports', img:'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&h=120&fit=crop&q=80' },
  { cat:'jewelry',name:'Jewelry',img:'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=120&h=120&fit=crop&q=80' },
];

function openTrendingPage(cat) {
  _tpCat = cat || 'all';
  _tpSort = 'default';
  document.getElementById('tpOverlay').style.display = 'block';
  document.getElementById('tpPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
  _renderTpSubcats();
  _renderTpGrid();
  // reset chip active states
  document.querySelectorAll('.tp-chip').forEach(c => c.classList.remove('active'));
  const allChip = document.querySelector('.tp-chip');
  if (allChip) allChip.classList.add('active');
  document.querySelectorAll('.tp-sort-btn').forEach(b => b.classList.remove('active'));
  const firstSort = document.querySelector('.tp-sort-btn');
  if (firstSort) firstSort.classList.add('active');
}

function closeTrendingPage() {
  document.getElementById('tpOverlay').style.display = 'none';
  document.getElementById('tpPanel').classList.remove('open');
  document.body.style.overflow = '';
}

function _renderTpSubcats() {
  const el = document.getElementById('tpSubcats');
  if (!el) return;
  el.innerHTML = _TP_SUBCATS.map(s => `
    <div class="tp-subcat${_tpCat===s.cat?' active':''}" onclick="tpFilterCat(this,'${s.cat}')">
      <div class="tp-subcat-img"><img src="${s.img}" loading="lazy" alt="" /></div>
      <span class="tp-subcat-name">${s.name}</span>
    </div>
  `).join('');
}

function _renderTpGrid() {
  let items = _tpCat === 'all'
    ? [...PRODUCTS]
    : PRODUCTS.filter(p => p.category === _tpCat);

  if (_tpSort === 'popular')  items = items.sort((a,b) => b.ratingCount - a.ratingCount);
  else if (_tpSort === 'price') items = items.sort((a,b) => a.price - b.price);
  else if (_tpSort === 'new')   items = items.sort((a,b) => b.id - a.id);
  else items = items.sort((a,b) => (b.tag==='bestseller'?1:0)-(a.tag==='bestseller'?1:0));

  const el = document.getElementById('tpGrid');
  if (!el) return;
  el.innerHTML = items.slice(0, 30).map(p => {
    const sold = p.ratingCount >= 1000
      ? (p.ratingCount/1000).toFixed(1)+'k+'
      : p.ratingCount+'+';
    const stars = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5-Math.round(p.rating));
    return `<div class="tp-card" onclick="openModal(${p.id})">
      <div class="tp-card-img-wrap">
        <img src="${p.image}" loading="lazy" alt="" onerror="this.onerror=null;this.src='https://picsum.photos/seed/p${p.id}/300/400'" ${p.imgFocus?`style="object-position:${p.imgFocus.x}% ${p.imgFocus.y}%;transform:scale(${p.imgFocus.scale});transform-origin:${p.imgFocus.x}% ${p.imgFocus.y}%"`:''} />
        <span class="tp-disc">-${p.discount}%</span>
      </div>
      <div class="tp-card-info">
        <p class="tp-card-name">${getName(p)}</p>
        <div class="tp-sold-row">
          <span class="tp-sold">${sold} sold</span>
          <span class="tp-stars">${stars}</span>
        </div>
        <div class="tp-price-row">
          <div>
            <span class="tp-orig">${fmt(p.originalPrice)} <span class="tp-disc-pct">-${p.discount}%</span></span>
            <div class="tp-price">${fmt(p.price)}</div>
            <div class="tp-coupon">after coupon</div>
          </div>
          <button class="tp-cart-btn" onclick="event.stopPropagation();${p.stock===0?'':` flyCartAdd(event,${p.id})`}" ${p.stock===0?'disabled style="opacity:.4"':''}>
            <i class="fas fa-cart-plus"></i>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function tpSetSort(btn, sort) {
  _tpSort = sort;
  document.querySelectorAll('.tp-sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _renderTpGrid();
}

function tpFilterCat(el, cat) {
  _tpCat = cat;
  document.querySelectorAll('.tp-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  _renderTpSubcats();
  _renderTpGrid();
}

/* ===== SOCIAL PROOF & OFFER ELEMENTS ===== */

// 1. Welcome popup
function _showWelcomePopup() {
  if (localStorage.getItem('exg_welcome_shown')) return;
  const ov = document.getElementById('welcomeOverlay');
  const pp = document.getElementById('welcomePopup');
  if (!ov || !pp) return;
  ov.style.display = 'block';
  pp.style.display = 'block';
}
function closeWelcomePopup() {
  const ov = document.getElementById('welcomeOverlay');
  const pp = document.getElementById('welcomePopup');
  if (ov) ov.style.display = 'none';
  if (pp) pp.style.display = 'none';
  localStorage.setItem('exg_welcome_shown', '1');
}

// 2. "Just Bought" social proof toasts
const _SP_NAMES = ['Ahmed','Mohammed','Sara','Fatima','Ali','Nora','Khalid','Reem','Omar','Lina','Hassan','Dana','Youssef','Mona','Tariq'];
const _SP_CITIES = ['Riyadh','Jeddah','Dammam','Makkah','Madinah','Khobar','Taif','Tabuk'];
let _spTimer = null;

function _startSocialProof() {
  const el = document.getElementById('socialToast');
  if (!el) return;
  const hotProds = PRODUCTS.filter(p => p.tag === 'bestseller' || p.tag === 'hot' || p.tag === 'sale');
  if (!hotProds.length) return;

  function _showNext() {
    const p = hotProds[Math.floor(Math.random() * hotProds.length)];
    const name = _SP_NAMES[Math.floor(Math.random() * _SP_NAMES.length)];
    const city = _SP_CITIES[Math.floor(Math.random() * _SP_CITIES.length)];
    const mins = Math.floor(Math.random() * 12) + 1;
    const pname = (getName(p) || '').split(' ').slice(0,4).join(' ');
    el.innerHTML = `<span class="social-toast-icon">🛒</span>
      <div class="social-toast-text">
        <strong>${name} from ${city}</strong>
        just bought <em>${pname}</em>
        <div class="social-toast-time">${mins} min ago</div>
      </div>`;
    el.classList.add('show');
    setTimeout(() => { el.classList.remove('show'); }, 4500);
    const next = 35000 + Math.random() * 25000;
    _spTimer = setTimeout(_showNext, next);
  }
  // first show after 8 seconds
  _spTimer = setTimeout(_showNext, 8000);
}

// 3. Deal countdown timers
function _startDealCountdowns() {
  const ids = ['dealCd1', 'dealCd2'];
  const offsets = [18400, 12600]; // seconds offset so each section shows different time

  ids.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    const stored = localStorage.getItem('exg_deal_end_' + i);
    let endTs = stored ? parseInt(stored) : 0;
    if (!endTs || endTs < Date.now()) {
      endTs = Date.now() + (4 * 3600 + offsets[i]) * 1000;
      localStorage.setItem('exg_deal_end_' + i, endTs);
    }
    function _tick() {
      const rem = Math.max(0, Math.floor((endTs - Date.now()) / 1000));
      if (rem === 0) {
        endTs = Date.now() + 4 * 3600 * 1000;
        localStorage.setItem('exg_deal_end_' + i, endTs);
      }
      const h = String(Math.floor(rem / 3600)).padStart(2,'0');
      const m = String(Math.floor((rem % 3600) / 60)).padStart(2,'0');
      const s = String(rem % 60).padStart(2,'0');
      el.textContent = `⏱ ${h}:${m}:${s}`;
    }
    _tick();
    setInterval(_tick, 1000);
  });
}

// Init all offer elements
(function _initOfferElements() {
  // Welcome popup after 2.5s (only once per browser)
  setTimeout(_showWelcomePopup, 2500);
  // Social proof toasts
  _startSocialProof();
  // Deal countdowns
  _startDealCountdowns();
})();
