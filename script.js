/* ═══════════════════════════════════════════════════════════
   GLOBAL FORTIFICATION — error resilience, safe storage,
   performance helpers. Runs before everything else.
   ═══════════════════════════════════════════════════════════ */

// 1. Catch all uncaught JS errors & promise rejections silently
//    — prevents a single bug from showing a blank white page
window.onerror = () => true;
window.addEventListener('unhandledrejection', e => { e.preventDefault(); }, { passive: true });

// 2. Safe localStorage — handles QuotaExceededError & private-mode blocks
const _ls = {
  get(key, def = '') {
    try { const v = localStorage.getItem(key); return v === null ? def : v; } catch { return def; }
  },
  getJSON(key, def = null) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? def; } catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(key, String(val)); return true; }
    catch(e) { if (e.name === 'QuotaExceededError') _ls._evict(); try { localStorage.setItem(key, String(val)); } catch {} return false; }
  },
  setJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch(e) { if (e.name === 'QuotaExceededError') _ls._evict(); try { localStorage.setItem(key, JSON.stringify(val)); } catch {} return false; }
  },
  remove(key) { try { localStorage.removeItem(key); } catch {} },
  _evict() {
    // Clear non-essential caches to free up quota space
    ['exg_recently_viewed','exg_play_liked','exg_play_following',
     'exglobal_reviews','exg_play_videos'].forEach(k => { try { localStorage.removeItem(k); } catch {} });
  }
};

// 3. Debounce utility — prevents rapid repeated calls (e.g. search typing)
function _debounce(fn, ms) {
  let t;
  return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}

// 4. Page Visibility API — pause all timers when tab is hidden
//    Saves CPU/battery; resumes hero slider when tab comes back
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause repeating timers to save resources
    try { clearInterval(heroTimer); } catch {}
    try { clearInterval(_revTimer); } catch {}
    try { clearInterval(_liveActTimer); } catch {}
    try { clearInterval(_tTimer); } catch {}
  } else {
    // Resume hero slider when tab is visible again
    try { startHeroSlider(); } catch {}
  }
}, { passive: true });

/* ═══════════════════════════════════════════════════════════ */

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
let currentPriceMax = 9999;
// Track last render state to enable append-only "load more"
let _rnFilter = '', _rnSort = '', _rnSearch = '', _rnPrice = 9999, _rnColors = '', _rnCount = 0;
let currentColors = [];
let currentLang = 'ar';
let selectedSize = '';
let selectedColor = '';
let _modalQty = 1;
let heroIndex = 0;
let heroTimer;
let _heroSlideCount = 5;
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
    'exg_promo_banners':   d.promo_banners,
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
let _productOverridesApplied = false;
function _applyProductOverrides() {
  if (_productOverridesApplied) return; // guard: never mutate PRODUCTS twice
  _productOverridesApplied = true;
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
  localStorage.setItem('exglobal_theme', theme); // save customer choice
  const icon = document.getElementById('themeIcon');
  if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
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

/* ===== TAMARA + TABBY BNPL HELPERS ===== */
function _tamaraHTML(price, large) {
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const sar = Math.round(price * T.rate);
  const each = Math.round(sar / 4);
  return `<div class="tamara-pill${large?' tamara-large':''}"><span class="tamara-t">t</span><span>4 × ${T.currency}${each}</span><span class="tamara-info" onclick="event.stopPropagation();showToast('Pay in 4 interest-free installments with Tamara')">ⓘ</span></div>`;
}
function _tabbyHTML(price, large) {
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const sar = Math.round(price * T.rate);
  const each = Math.round(sar / 4);
  return `<div class="tabby-pill${large?' tabby-large':''}"><span class="tabby-t">T</span><span>4 × ${T.currency}${each} with Tabby</span></div>`;
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
  const drwLv = document.getElementById('drwLangVal');
  if (drwLv) drwLv.textContent = _langLabels[lang] || lang;
  applyTranslations();
  _applySocialLinks();
  renderFlashDeals();
  renderSuperDeals();
  renderTrending();
  renderSponsored();
  renderHotSeller();
  renderNewArrivals();
  renderTrustpilotReviews();
  renderCategoryStrips();
  renderRecentlyViewed();
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

/* ===== COUNTRY PICKER ===== */
function openCountryPicker() {
  const saved = localStorage.getItem('exg_country') || 'sa';
  document.querySelectorAll('#countrySheet .lang-sheet-row').forEach(row => {
    row.classList.toggle('active', row.dataset.country === saved);
    const chk = row.querySelector('.lang-sheet-check');
    if (chk) chk.style.opacity = row.dataset.country === saved ? '1' : '0';
  });
  document.getElementById('countrySheetOverlay').classList.add('open');
  document.getElementById('countrySheet').classList.add('open');
}
function closeCountryPicker() {
  document.getElementById('countrySheetOverlay').classList.remove('open');
  document.getElementById('countrySheet').classList.remove('open');
}
function pickCountry(code, label) {
  localStorage.setItem('exg_country', code);
  const el = document.getElementById('countryValLabel');
  if (el) el.textContent = label;
  closeCountryPicker();
  showToast('✅ Country updated to ' + label);
}

/* ===== PREFERENCES SHEET ===== */
function openPreferencesSheet() {
  const darkBtn = document.getElementById('prefDarkToggle');
  const soundBtn = document.getElementById('prefSoundToggle');
  if (darkBtn) darkBtn.classList.toggle('on', document.documentElement.getAttribute('data-theme') === 'dark');
  if (soundBtn) soundBtn.classList.toggle('on', typeof soundEnabled === 'undefined' ? true : soundEnabled);
  const flashOn = localStorage.getItem('exg_pref_flash') !== 'off';
  const recentOn = localStorage.getItem('exg_pref_recent') !== 'off';
  const ft = document.getElementById('prefFlashToggle');
  const rt = document.getElementById('prefRecentToggle');
  if (ft) ft.classList.toggle('on', flashOn);
  if (rt) rt.classList.toggle('on', recentOn);
  document.getElementById('prefSheetOverlay').classList.add('open');
  document.getElementById('prefSheet').classList.add('open');
}
function closePrefSheet() {
  document.getElementById('prefSheetOverlay').classList.remove('open');
  document.getElementById('prefSheet').classList.remove('open');
}
function prefToggleDark(btn) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  applyTheme(isDark ? 'light' : 'dark');
  btn.classList.toggle('on', !isDark);
}
function prefToggleSound(btn) {
  toggleSound(document.getElementById('soundToggle'));
  btn.classList.toggle('on', typeof soundEnabled !== 'undefined' ? soundEnabled : true);
}
function prefToggleFlash(btn) {
  const on = !btn.classList.contains('on');
  btn.classList.toggle('on', on);
  localStorage.setItem('exg_pref_flash', on ? 'on' : 'off');
  showToast(on ? '🔔 Flash Sale Alerts enabled' : '🔕 Flash Sale Alerts disabled');
}
function prefToggleRecent(btn) {
  const on = !btn.classList.contains('on');
  btn.classList.toggle('on', on);
  localStorage.setItem('exg_pref_recent', on ? 'on' : 'off');
  showToast(on ? '✅ Recently Viewed enabled' : 'Recently Viewed hidden');
}
function clearRecentlyViewed() {
  localStorage.removeItem('exg_recently_viewed');
  if (typeof renderRecentlyViewed === 'function') renderRecentlyViewed();
  showToast('🗑 Recently viewed cleared');
  closePrefSheet();
}

/* ===== SELL WITH US ===== */
function openSellWithUs() {
  const msg = encodeURIComponent('مرحباً! أريد البيع على منصة EX GLOBAL 🛍\n\nHello! I want to sell on EX GLOBAL 🛍');
  window.open('https://wa.me/966546224029?text=' + msg, '_blank', 'noopener');
}

function _revealPage() {
  document.documentElement.style.transition = 'opacity .18s';
  document.documentElement.style.opacity = '1';
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', async () => {
  if (history.scrollRestoration) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  // Show any pre-existing reveal elements immediately (don't wait for data load)
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  try { await Promise.race([loadPublishedData(), new Promise(r => setTimeout(r, 2000))]); } catch(e) {}
  _applyProductOverrides();  // apply product additions/edits/deletions
  // Apply admin settings (delivery always free — overrides any stored setting)
  try{const s=JSON.parse(localStorage.getItem('exg_settings')||'{}');if(s.vatRate!==undefined)VAT_RATE=parseFloat(s.vatRate)||0;}catch(e){}
  DELIVERY_SAR = 0; FREE_DELIVERY_THRESHOLD_SAR = 0;
  applyTheme(currentTheme);
  setLang(localStorage.getItem('exg_lang') || 'ar');
  _revealPage(); // remove opacity:0 set in <head>
  updateWishBadge();
  updateCartBadge();
  _initTrendCircle(); // show video/image inside Trend circle button
  renderFlashDeals();
  renderBrandDeals();
  renderMysteryBoxes();
  renderSuperDeals();
  renderTrending();
  renderSponsored();
  renderHotSeller();
  renderNewArrivals();
  renderTrustpilotReviews();
  renderCategoryStrips();
  renderFilterRow();
  renderReviewsStrip();
  renderRecentlyViewed();
  // VIP and Check-in blocks removed
  _renderReferralBlock();
  renderProducts();
  startHeroSlider();
  // Show all newly rendered reveal elements immediately (no animation delay)
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => el.classList.add('visible'));
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
  initScrollReveal();
  _checkBirthdayWish();
  renderPromoBanners();
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
    const raw = JSON.parse(localStorage.getItem('exg_hero_slides') || '[]');
    const valid = raw.filter(s => s && (s.image || s.video));
    if (!valid.length) return;

    const heroSlides = document.getElementById('heroSlides');
    const heroDots   = document.getElementById('heroDots');
    if (!heroSlides) return;

    // Rebuild slides — only the ones the admin uploaded
    heroSlides.innerHTML = valid.map((s, i) => {
      let inner = '';
      if (s.video) {
        let embedUrl = '';
        const ytMatch = s.video.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&playsinline=1&autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}`;
        const ttMatch = s.video.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
        if (ttMatch) embedUrl = `https://www.tiktok.com/embed/v2/${ttMatch[1]}`;
        const isDirect = !embedUrl && (s.video.includes('cloudinary.com') || s.video.match(/\.(mp4|webm|mov)(\?|$)/i));
        if (isDirect) {
          inner = `<div class="hero-slide-video"><video src="${s.video}" autoplay muted loop playsinline></video></div>`;
        } else if (embedUrl) {
          inner = `<div class="hero-slide-video"><iframe src="${embedUrl}" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
        }
      }
      if (!inner && s.image) {
        inner = `<img class="hero-slide-img" src="${s.image}" alt="" loading="${i === 0 ? 'eager' : 'lazy'}" onerror="this.style.display='none'" />`;
      }
      return `<div class="hero-slide slide-${i + 1}">${inner}</div>`;
    }).join('');

    // Rebuild dots to match uploaded slide count
    if (heroDots) {
      heroDots.innerHTML = valid.map((_, i) =>
        `<span class="hero-dot${i === 0 ? ' active' : ''}"></span>`
      ).join('');
      heroDots.querySelectorAll('.hero-dot').forEach((dot, i) => {
        dot.addEventListener('click', () => goSlide(i));
      });
    }

    // Update cycle count and reset position
    _heroSlideCount = valid.length;
    heroIndex = 0;
    heroSlides.style.transform = 'translateX(0%)';
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
  heroIndex = (heroIndex + 1) % _heroSlideCount;
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
/* ── Full-image card: image fills card, white panel overlays bottom ── */
function flashCardHTML(p) {
  const inWish = wishlist.includes(p.id);
  const origPrice = p.discount > 0 ? fmt(Math.round(p.price / (1 - p.discount / 100))) : '';
  const isOOS = p.stock === 0;

  const badge = p.discount >= 40
    ? `<span class="fc2-badge fc2-badge-flash"><i class="fas fa-bolt"></i> FLASH</span>`
    : p.tag === 'bestseller' ? `<span class="fc2-badge fc2-badge-best"><i class="fas fa-trophy"></i></span>`
    : p.tag === 'new' ? `<span class="fc2-badge fc2-badge-new">NEW</span>` : '';

  const discPill = p.discount > 0 ? `<div class="fc2-disc-pill">-${p.discount}%</div>` : '';

  const choiceBadge = (p.ratingCount >= 300 || p.tag === 'bestseller')
    ? `<div class="fc2-choice"><i class="fas fa-crown"></i> Top Choice</div>` : '';

  const soldRaw = p.sold || p.ratingCount || 0;
  const soldTxt = soldRaw > 0
    ? `<div class="fc2-sold">${soldRaw >= 1000 ? Math.floor(soldRaw/1000)+'K' : soldRaw}++ sold</div>` : '';

  const couponRow = p.discount > 0
    ? `<div class="fc2-coupon"><i class="fas fa-tag"></i> ${fmt(p.price)} with coupon</div>` : '';

  // Rating row
  const rating = p.rating || 4.5;
  const ratingCount = p.ratingCount || 0;
  const ratingStr = ratingCount >= 1000
    ? (ratingCount/1000).toFixed(1).replace('.0','') + 'K'
    : ratingCount > 0 ? ratingCount : '';
  const ratingRow = `<div class="fc2-rating-row">
    <i class="fas fa-star fc2-star"></i>
    <span class="fc2-rating-val">${rating}</span>
    ${ratingStr ? `<span class="fc2-rating-cnt">(${ratingStr})</span>` : ''}
  </div>`;

  // Delivery / status badge
  const isLowStock = !isOOS && p.stock > 0 && p.stock <= 5;
  const statusBadge = isOOS ? ''
    : isLowStock
    ? `<div class="fc2-status fc2-status-hot"><i class="fas fa-fire"></i> Selling out fast</div>`
    : (p.tag === 'bestseller' || ratingCount > 500)
    ? `<div class="fc2-status fc2-status-del"><i class="fas fa-truck"></i> Free Delivery</div>`
    : `<div class="fc2-status fc2-status-del"><i class="fas fa-truck-fast"></i> Fast Delivery</div>`;

  const imgSrc = p.cardImg || p.image;
  return `
    <div class="fc2-card" onclick="openModal(${p.id})">
      <div class="fc2-img">
        <img src="${imgSrc}" loading="lazy" alt=""
          onerror="this.onerror=null;this.src='https://picsum.photos/seed/p${p.id}/400/500'"
          style="${p.imgFocus?`object-position:${p.imgFocus.x}% ${p.imgFocus.y}%`:'object-position:top center'}"/>
        ${isOOS ? '<div class="fc2-oos"><span>Out of Stock</span></div>' : ''}
        ${badge}
        <button class="fc2-wish wish-btn ${inWish ? 'active' : ''}" onclick="event.stopPropagation();toggleWish(${p.id},this)">
          <i class="${inWish ? 'fas' : 'far'} fa-heart"></i>
        </button>
        ${discPill}
      </div>
      <div class="fc2-panel">
        ${choiceBadge}
        <h3 class="fc2-name">${getName(p)}</h3>
        <div class="fc2-meta-row">
          ${ratingRow}
          ${soldTxt}
        </div>
        ${statusBadge}
        <div class="fc2-prices">
          <span class="fc2-price">${fmt(p.price)}</span>
          ${origPrice ? `<span class="fc2-orig">${origPrice}</span>` : ''}
        </div>
        ${couponRow}
        <button class="fc2-btn" onclick="event.stopPropagation();${isOOS ? '' : `nxAtc(event,${p.id})`}" ${isOOS ? 'disabled style="opacity:.45;cursor:not-allowed"' : ''}>
          <i class="fas fa-bag-shopping"></i> ${isOOS ? 'Out of Stock' : 'Buy Now'}
        </button>
      </div>
    </div>`;
}

function renderFlashDeals() {
  const pins = JSON.parse(localStorage.getItem('exg_flash_pins') || 'null');
  const items = pins
    ? pins.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 6)
    : PRODUCTS.filter(p => p.discount >= 45).slice(0, 6);
  document.getElementById('flashProducts').innerHTML = items.map(p => flashCardHTML(p)).join('');
}

/* ── Promo Banner Slider ── */
let _promoIdx = 0, _promoTimer = null, _promoBanners = [];
function renderPromoBanners() {
  _promoBanners = JSON.parse(localStorage.getItem('exg_promo_banners') || '[]')
    .filter(b => b && b.img);
  const wrap = document.getElementById('promoSliderWrap');
  const track = document.getElementById('promoSliderTrack');
  const dots = document.getElementById('promoSliderDots');
  if (!wrap || !track || !dots) return;
  if (!_promoBanners.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  track.innerHTML = _promoBanners.map((b, i) => {
    const isVid = /\.(mp4|webm|mov|ogg)(\?|$)/i.test(b.img);
    const media = isVid
      ? `<video src="${b.img}" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:contain;"></video>`
      : `<img src="${b.img}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display='none'"/>`;
    const clickAct = b.link
      ? `window.open('${b.link}','_blank')`
      : `_openPromoLightbox('${b.img}')`;
    return `<div class="promo-slide" onclick="${clickAct}">${media}</div>`;
  }).join('');
  dots.innerHTML = _promoBanners.map((_, i) =>
    `<div class="promo-dot${i===0?' active':''}" onclick="_promGoTo(${i})"></div>`
  ).join('');
  _promoIdx = 0; _promoSetPos();
  if (_promoTimer) clearInterval(_promoTimer);
  if (_promoBanners.length > 1) {
    _promoTimer = setInterval(() => _promGoTo((_promoIdx + 1) % _promoBanners.length), 3500);
  }
  // Touch swipe
  let tx = 0;
  const vp = document.getElementById('promoSliderVp');
  vp.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  vp.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 40) _promGoTo(dx < 0
      ? Math.min(_promoIdx + 1, _promoBanners.length - 1)
      : Math.max(_promoIdx - 1, 0));
  }, { passive: true });
}
function _promGoTo(i) {
  _promoIdx = i; _promoSetPos();
  document.querySelectorAll('.promo-dot').forEach((d, j) =>
    d.classList.toggle('active', j === i));
}
function _promoSetPos() {
  const t = document.getElementById('promoSliderTrack');
  if (t) t.style.transform = `translateX(-${_promoIdx * 100}%)`;
}

function _dealMiniCard(p) {
  const name = (typeof getName === 'function' ? getName(p) : (p.names?.en || p.name || ''));
  const hasOrig = p.originalPrice && p.originalPrice > p.price;
  return `<div class="deal-mini-card" onclick="openModal(${p.id})">
    <div class="dmc-img-wrap">
      <img src="${p.image}" loading="lazy" alt="" onerror="this.onerror=null;this.src='https://picsum.photos/seed/p${p.id}/300/400'" ${p.imgFocus ? `style="object-position:${p.imgFocus.x}% ${p.imgFocus.y}%"` : ''} />
      ${p.discount ? `<span class="deal-mini-badge">-${p.discount}%</span>` : ''}
    </div>
    <div class="dmc-body">
      <p class="dmc-name">${name.substring(0, 28)}</p>
      <div class="dmc-prices">
        <span class="dmc-price">${fmt(p.price)}</span>
        ${hasOrig ? `<span class="dmc-orig">${fmt(p.originalPrice)}</span>` : ''}
      </div>
    </div>
  </div>`;
}

/* ===== RENDER SUPER DEALS — Nike pcard in horizontal marquee ===== */
function renderSuperDeals() {
  const track = document.getElementById('sdealsTrack');
  if (!track) return;
  const pins = JSON.parse(localStorage.getItem('exg_super_pins') || 'null');
  let items = pins
    ? pins.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 12)
    : PRODUCTS.filter(p => p.tag === 'sale' || p.tag === 'hot' || p.discount >= 25).slice(0, 12);
  // Fallback: if no items matched, use top 12 by discount
  if (items.length === 0) {
    items = [...PRODUCTS].sort((a, b) => (b.discount || 0) - (a.discount || 0)).slice(0, 12);
  }
  // If still nothing, hide the section
  if (items.length === 0) {
    const wrap = track.closest('.sdeal-wrap');
    if (wrap) wrap.style.display = 'none';
    return;
  }
  const html = items.map(p => productCardHTML(p)).join('');
  track.innerHTML = html + html; // duplicate for seamless infinite loop
}

/* ===== RENDER TRENDING ===== */
function renderTrending() {
  const pins = JSON.parse(localStorage.getItem('exg_trend_pins') || 'null');
  const items = pins
    ? pins.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 4)
    : PRODUCTS.filter(p => p.tag === 'bestseller' || p.tag === 'new').slice(0, 4);
  document.getElementById('trendingProducts').innerHTML = items.map(p => flashCardHTML(p)).join('');
}

/* ===== RENDER SPONSORED / FEATURED BRANDS ===== */
function renderSponsored() {
  const track = document.getElementById('spTrack');
  if (!track) return;
  // Use pinned sponsored IDs or auto-pick top-discount products
  const pins = JSON.parse(localStorage.getItem('exg_sp_pins') || 'null');
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const cur = T.currency || 'SAR ';
  const rate = T.rate || 1;
  const items = pins
    ? pins.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 8)
    : [...PRODUCTS].sort((a, b) => (b.discount||0) - (a.discount||0)).slice(0, 8);

  track.innerHTML = items.map(p => {
    const brand = p.brand || p.category || 'EX GLOBAL';
    const imgSrc = p.image || (p.images && p.images[0]) || '';
    const discountLabel = p.discount ? `Up to ${p.discount}% Off` : `${cur}${Math.round(p.price * rate)}`;
    const name = p.names?.[currentLang] || p.names?.en || p.name || '';
    return `<div class="sp-card" onclick="openModal(${p.id})">
      <div class="sp-card-img-wrap">
        <img class="sp-card-img" src="${imgSrc}" loading="lazy" alt="${name}"
          onerror="this.src='https://picsum.photos/seed/sp${p.id}/130/120'">
        <div class="sp-card-brand">${brand.slice(0,12)}</div>
        <div class="sp-card-ad">AD</div>
        <div class="sp-card-banner">${discountLabel}</div>
      </div>
      <div class="sp-card-name">${name}</div>
    </div>`;
  }).join('');
}

/* ===== RENDER HOT SELLER ===== */
function renderHotSeller() {
  const pins = JSON.parse(localStorage.getItem('exg_hot_pins') || 'null');
  const items = pins
    ? pins.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 4)
    : [...PRODUCTS].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 4);
  document.getElementById('hotSellerProducts').innerHTML = items.map(p => flashCardHTML(p)).join('');
}

/* ===== RENDER NEW ARRIVALS ===== */
function renderNewArrivals() {
  const pins = JSON.parse(localStorage.getItem('exg_new_pins') || 'null');
  const items = pins
    ? pins.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 4)
    : PRODUCTS.filter(p => p.tag === 'new').concat(PRODUCTS.filter(p => p.tag !== 'new')).slice(0, 4);
  document.getElementById('newArrivalsProducts').innerHTML = items.map(p => flashCardHTML(p)).join('');
}

/* ===== TRUSTPILOT STYLE CUSTOMER REVIEWS ===== */
function renderTrustpilotReviews() {
  const sec = document.getElementById('tpCustSection');
  if (!sec || typeof SEED_REVIEWS === 'undefined') return;
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const avgRating = (SEED_REVIEWS.reduce((s,r)=>s+r.rating,0)/SEED_REVIEWS.length).toFixed(1);
  const avatars = [
    'https://i.pravatar.cc/80?img=11','https://i.pravatar.cc/80?img=5','https://i.pravatar.cc/80?img=47',
    'https://i.pravatar.cc/80?img=32','https://i.pravatar.cc/80?img=15','https://i.pravatar.cc/80?img=22',
    'https://i.pravatar.cc/80?img=9','https://i.pravatar.cc/80?img=41','https://i.pravatar.cc/80?img=38',
    'https://i.pravatar.cc/80?img=55','https://i.pravatar.cc/80?img=60','https://i.pravatar.cc/80?img=3',
    'https://i.pravatar.cc/80?img=27','https://i.pravatar.cc/80?img=18','https://i.pravatar.cc/80?img=25',
    'https://i.pravatar.cc/80?img=33','https://i.pravatar.cc/80?img=44','https://i.pravatar.cc/80?img=50',
    'https://i.pravatar.cc/80?img=12','https://i.pravatar.cc/80?img=7','https://i.pravatar.cc/80?img=63',
    'https://i.pravatar.cc/80?img=20','https://i.pravatar.cc/80?img=36','https://i.pravatar.cc/80?img=48',
    'https://i.pravatar.cc/80?img=17','https://i.pravatar.cc/80?img=29','https://i.pravatar.cc/80?img=52',
    'https://i.pravatar.cc/80?img=8','https://i.pravatar.cc/80?img=43','https://i.pravatar.cc/80?img=57'
  ];
  const starsFilled = Math.round(parseFloat(avgRating));
  const starsHtml = Array.from({length:5},(_,i)=>`<i class="${i<starsFilled?'fas':'far'} fa-star tpr-star"></i>`).join('');
  const cards = SEED_REVIEWS.map((r,i) => {
    const txt = r.text[currentLang] || r.text.en || '';
    const firstLine = txt.split(/[.!?।\n]/)[0].trim();
    const body = txt.slice(firstLine.length + 1).trim().split(' ').slice(0, 10).join(' ');
    const rStars = Array.from({length:5},(_,j)=>`<i class="${j<r.rating?'fas':'far'} fa-star tpr-gstar"></i>`).join('');
    const av = avatars[i % avatars.length];
    const firstName = r.name.split(' ')[0];
    return `<div class="tpr-card">
      <div class="tpr-top-row">
        <div class="tpr-av-wrap">
          <img class="tpr-av" src="${av}" alt="${r.name}" loading="lazy" onerror="this.style.display='none'">
        </div>
        <div class="tpr-name">${firstName}</div>
      </div>
      <div class="tpr-stars">${rStars}</div>
      <div class="tpr-title">${firstLine.slice(0,30)}${firstLine.length>30?'…':''}</div>
      <div class="tpr-body">${body.slice(0,55)}${body.length>55?'…':''}</div>
      <div class="tpr-meta"><i class="fas fa-check-circle"></i> ${r.country}</div>
    </div>`;
  }).join('');
  sec.innerHTML = `
    <div class="tpr-header">
      <h2 class="tpr-h2">What Our Customers Have To Say</h2>
      <div class="tpr-sub-row">
        <span class="tpr-count">150,000+ Customers</span>
        <span class="tpr-sep">|</span>
        <span class="tpr-excellent">Excellent</span>
        <span class="tpr-tp-stars">${starsHtml}</span>
        <span class="tpr-tp-badge">★ Trustpilot</span>
      </div>
    </div>
    <div class="tpr-scroll">${cards}</div>`;
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

  if (currentPriceMax < 9999) filtered = filtered.filter(p => p.price <= currentPriceMax);
  if (currentColors.length > 0) filtered = filtered.filter(p => (p.colors || []).some(c => currentColors.includes(c)));
  if (currentSort === 'low') filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (currentSort === 'high') filtered = [...filtered].sort((a, b) => b.price - a.price);
  else if (currentSort === 'popular') filtered = [...filtered].sort((a, b) => b.ratingCount - a.ratingCount);

  // ── Hide Out of Stock products from the grid ──
  filtered = filtered.filter(p => p.stock !== 0);

  const grid = document.getElementById('productsGrid');
  const visible = filtered.slice(0, visibleCount);

  if (visible.length === 0) {
    grid.innerHTML = `<div class="no-results"><i class="fas fa-search"></i><p>${t('noResults')}</p></div>`;
    document.getElementById('loadMoreBtn').style.display = 'none';
    _rnCount = 0;
    return;
  }

  // Append-only when just loading more (filter/sort/search unchanged)
  const colorsKey = currentColors.join(',');
  const isLoadMore = (
    searchTerm  === _rnSearch  && currentFilter === _rnFilter &&
    currentSort === _rnSort    && currentPriceMax === _rnPrice &&
    colorsKey   === _rnColors  && visibleCount > _rnCount && grid.children.length > 0
  );
  if (isLoadMore) {
    const newCards = filtered.slice(_rnCount, visibleCount).map(p => productCardHTML(p)).join('');
    grid.insertAdjacentHTML('beforeend', newCards);
  } else {
    // Inject NEW RELEASE banner card after every 6th product card
    const cards = visible.map(p => productCardHTML(p));
    if (cards.length >= 4) cards.splice(4, 0, _nrGridBannerHTML());
    grid.innerHTML = cards.join('');
  }
  _rnFilter = currentFilter; _rnSort = currentSort; _rnSearch = searchTerm;
  _rnPrice = currentPriceMax; _rnColors = colorsKey; _rnCount = visibleCount;
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
  _gsapCardEntrance();
}

// ── NEW RELEASE banner card injected into the product grid ──
function _nrGridBannerHTML() {
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const rate = T.rate || 1;
  const cur  = T.currency || 'SAR ';
  // Best discounted 'new' product
  const p = PRODUCTS.filter(x => x.stock !== 0 && x.discount > 0 && x.tag === 'new')
    .sort((a,b) => b.discount - a.discount)[0]
    || PRODUCTS.filter(x => x.stock !== 0 && x.discount > 0)
    .sort((a,b) => b.discount - a.discount)[0]
    || PRODUCTS.find(x => x.stock !== 0);
  if (!p) return '';
  const img  = p.image || (p.images && p.images[0]) || '';
  const disc = p.discount || 50;
  const sale = Math.round(p.price * rate);
  return `<div class="nr-grid-card" onclick="openModal(${p.id})">
    <div class="nr-gc-deco1"></div>
    <div class="nr-gc-deco2"></div>
    <div class="nr-gc-left">
      <div class="nr-gc-eyebrow"><span class="nr-gc-dot"></span> JUST DROPPED</div>
      <div class="nr-gc-headline">
        <span class="nr-gc-new">NEW</span>
        <span class="nr-gc-rel">RELEASE</span>
      </div>
      <div class="nr-gc-price">${cur}${sale}</div>
      <button class="nr-gc-btn"><i class="fas fa-bolt"></i> ORDER NOW</button>
    </div>
    <div class="nr-gc-right">
      <div class="nr-gc-glow"></div>
      <img class="nr-gc-img" src="${img}" alt="New Release" loading="lazy">
      <div class="nr-gc-badge">
        <span class="nr-gc-badge-special">SPECIAL</span>
        <span class="nr-gc-badge-pct">${disc}%</span>
        <span class="nr-gc-badge-off">OFF</span>
      </div>
    </div>
  </div>`;
}

function productCardHTML(p) {
  return flashCardHTML(p).replace('class="fc2-card"', 'class="fc2-card product-card"');
}

function nxAtc(ev, id) {
  const btn = ev.currentTarget;
  if (btn.dataset.atcBusy) return;
  btn.dataset.atcBusy = '1';
  flyCartAdd(ev, id);

  // Phase 1: shirt flies OUT (up), cart flies IN (from below)
  btn.style.setProperty('--shirt-y', '-50px');
  btn.style.setProperty('--shirt-scale', '0');
  btn.style.setProperty('--cart-y', '0px');
  btn.style.setProperty('--cart-op', '1');

  // Phase 2: reset — removing properties transitions back to CSS defaults
  // shirt default: translateY(0) scale(1) = visible at center
  // cart default: translateY(50px) opacity(0) = hidden below
  setTimeout(() => {
    btn.style.removeProperty('--shirt-y');
    btn.style.removeProperty('--shirt-scale');
    btn.style.removeProperty('--cart-y');
    btn.style.removeProperty('--cart-op');
    delete btn.dataset.atcBusy;
  }, 900);
}

/* ===== DESKTOP NAV ACTIVE STATE ===== */
function _updateDeskNav(cat) {
  document.querySelectorAll('.desk-nav-link[data-desk-cat]').forEach(a => {
    a.classList.toggle('active', a.dataset.deskCat === cat);
  });
}

/* ===== FILTER ===== */
function filterCategory(cat) {
  currentFilter = cat;
  visibleCount = 8;
  currentSort = 'default';
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-sort="default"]').classList.add('active');
  _updateDeskNav(cat);
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
      }, 80);
    }, { rootMargin: '200px' });
    observer.observe(sentinel);
  }

  document.getElementById('searchToggleBtn').addEventListener('click', () => {
    openVspPanel();
  });
  document.getElementById('searchInput').addEventListener('input', _debounce(e => {
    const q = e.target.value.trim();
    visibleCount = 8;
    renderProducts(q);
    showSearchDropdown(q);
  }, 180));
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

/* ===== PREMIUM LOADING SCREEN ===== */
function dismissSaudiIntro() {
  const el = document.getElementById('saudiIntro');
  if (!el || !el._siActive) return;
  el._siActive = false;
  if (el._siTimer) clearTimeout(el._siTimer);
  el.classList.add('si-out');
  setTimeout(() => {
    el.style.display = 'none';
    el.classList.remove('si-out');
    _maybeShowFwPop();
  }, 420);
}

(function initSaudiIntro() {
  const el = document.getElementById('saudiIntro');
  if (!el) { _maybeShowFwPop(); return; }
  el._siActive = true;
  el.style.display = 'flex';

  // Kick off progress bar animation
  const bar = document.getElementById('siBar');
  if (bar) requestAnimationFrame(() => { bar.style.width = '100%'; });

  // Generate floating sparkle particles
  const dustEl = document.getElementById('siDust');
  if (dustEl) {
    const glyphs = ['✦','✶','★','◆','●','✦','✸','✺'];
    for (let i = 0; i < 26; i++) {
      const p = document.createElement('span');
      p.className = 'si-particle';
      const size = 8 + Math.random() * 14;
      const isPink = Math.random() > .5;
      p.textContent = glyphs[i % glyphs.length];
      p.style.cssText = [
        `left:${(4 + Math.random() * 92).toFixed(1)}%`,
        `top:${(10 + Math.random() * 80).toFixed(1)}%`,
        `font-size:${size.toFixed(0)}px`,
        `color:${isPink ? 'rgba(233,30,140,' : 'rgba(0,0,0,'}${(.08 + Math.random() * .22).toFixed(2)})`,
        `--dx:${((Math.random() - .5) * 70).toFixed(0)}px`,
        `--dy:${(-(18 + Math.random() * 90)).toFixed(0)}px`,
        `--dur:${(2.2 + Math.random() * 3.2).toFixed(2)}s`,
        `--dly:${(Math.random() * 2.2).toFixed(2)}s`,
        `--op:${(.12 + Math.random() * .3).toFixed(2)}`,
        `--rot:${(90 + Math.random() * 270).toFixed(0)}deg`
      ].join(';');
      dustEl.appendChild(p);
    }
  }

  el._siTimer = setTimeout(dismissSaudiIntro, 2500);
})();

/* ===== FIRST-VISIT WELCOME POPUP ===== */
function _maybeShowFwPop() {
  if (localStorage.getItem('exg_visited')) return;
  localStorage.setItem('exg_visited', '1');
  const pop = document.getElementById('fwPop');
  if (!pop) return;
  pop.style.display = 'flex';
  pop._fwTimer = setTimeout(dismissFwPop, 4000);
}
function dismissFwPop() {
  const pop = document.getElementById('fwPop');
  if (!pop || pop.classList.contains('fw-hide')) return;
  if (pop._fwTimer) clearTimeout(pop._fwTimer);
  pop.classList.add('fw-hide');
  setTimeout(() => { pop.style.display = 'none'; }, 380);
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
          <div class="cart-item-actions">
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
  // Address strip is now shown on checkout page — hide it here
  const addrStrip = document.getElementById('cartAddrStrip');
  if (addrStrip) addrStrip.style.display = 'none';
  const _oldWarn = document.getElementById('cartAddrWarn');
  if (_oldWarn) _oldWarn.remove();
  // Update simplified cart bar
  const cstCountEl = document.getElementById('cstCount');
  const cstTotalEl = document.getElementById('cstTotal');
  const totalItemCount = cart.reduce((s, i) => s + i.qty, 0);
  if (cstCountEl) cstCountEl.textContent = totalItemCount + ' item' + (totalItemCount !== 1 ? 's' : '');
  if (cstTotalEl) cstTotalEl.textContent = fmtD(subtotalDisp + deliveryDisp);
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
    if (btn) {
      const origHTML = btn.innerHTML;
      btn.classList.add('atc-success');
      btn.innerHTML = `<i class="fas fa-check-circle" style="position:relative;z-index:2"></i><span style="position:relative;z-index:2">Added ✓</span>`;
      setTimeout(() => { btn.classList.remove('atc-success'); btn.innerHTML = origHTML; }, 1300);
    }
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
  if(typeof gtag==='function')gtag('event','add_to_cart',{currency:'SAR',value:p?p.price:0,items:[{item_id:id,item_name:p?(p.names?.en||'Product'):'Product',price:p?p.price:0,quantity:1}]});
  if(typeof fbq==='function')fbq('track','AddToCart',{content_ids:[id],value:p?p.price:0,currency:'SAR'});
  updateCartBadge();
  _abandonedCartReset();
  if (!localStorage.getItem('exg_spin_shown') && cart.length === 1) setTimeout(_showSpinWheel, 900);
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
    // Use class toggle so CSS !important rules don't fight inline style
    if (b.id === 'botCartBadge') {
      b.classList.toggle('bnb-show', count > 0);
      b.style.display = '';
    } else {
      b.style.display = count ? 'flex' : 'none';
    }
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
    if (btn) {
      btn.classList.remove('active');
      btn.innerHTML = '<i class="far fa-heart"></i>';
      _springBtn(btn, -5);
    }
    showToast(t('unwishlisted'));
  } else {
    wishlist.push(id);
    if (btn) {
      btn.classList.add('active');
      btn.innerHTML = '<i class="fas fa-heart"></i>';
      _springBtn(btn, -10);
      _heartPop(btn);
      _wishBurst(btn);
    }
    _flyWishAnimation(id, btn);
    showToast(t('wishlisted'));
  }
  saveWishlist();
  updateWishBadge();
}

/* Spring bounce — reference: translateY(var(--button-y)) */
function _springBtn(btn, peakPx) {
  if (!btn) return;
  btn.style.setProperty('--button-y', peakPx + 'px');
  setTimeout(() => btn.style.setProperty('--button-y', Math.abs(peakPx * 0.3) + 'px'), 140);
  setTimeout(() => btn.style.setProperty('--button-y', '0px'), 280);
}

/* Heart icon pop animation */
function _heartPop(btn) {
  const ico = btn.querySelector('i');
  if (!ico) return;
  ico.classList.remove('popping');
  void ico.offsetWidth; // reflow
  ico.classList.add('popping');
  ico.addEventListener('animationend', () => ico.classList.remove('popping'), { once: true });
}

/* Particle burst — 8 small dots fly outward */
function _wishBurst(btn) {
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const burst = document.createElement('div');
  burst.className = 'wish-burst';
  burst.style.cssText = `left:${rect.left + rect.width/2}px;top:${rect.top + rect.height/2}px;position:fixed;z-index:10003;`;
  const colors = ['#e91e8c','#ff5ea3','#ff9800','#f44336','#9c27b0','#ff6b9d','#ffd700','#e91e8c'];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * 360;
    const dist = 28 + Math.random() * 14;
    const dx = Math.cos(angle * Math.PI / 180) * dist;
    const dy = Math.sin(angle * Math.PI / 180) * dist;
    const dot = document.createElement('span');
    dot.style.cssText = `--dx:${dx}px;--dy:${dy}px;background:${colors[i]};left:-3.5px;top:-3.5px;animation-delay:${i*18}ms`;
    burst.appendChild(dot);
  }
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 800);
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
  terms: {
    en: { title: 'Terms of Service', body: `
      <p style="color:#888;font-size:12px">Effective date: January 2025 · Governed by the laws of the Kingdom of Saudi Arabia</p>
      <div class="info-card">📜 By using EX GLOBAL, you agree to these terms. Please read them carefully before placing an order.</div>

      <h2>1. 🧑‍💼 Account & Eligibility</h2>
      <ul>
        <li>You must be at least <strong>18 years old</strong> to create an account and place orders</li>
        <li>You are responsible for maintaining the confidentiality of your account credentials</li>
        <li>You agree to provide accurate, current, and complete information during registration</li>
        <li>EX GLOBAL reserves the right to suspend accounts that violate these terms</li>
      </ul>

      <h2>2. 🛍️ Products & Pricing</h2>
      <ul>
        <li>All prices are displayed in <strong>Saudi Riyal (SAR)</strong> and include <strong>15% VAT</strong> as required by ZATCA</li>
        <li>We strive to display accurate product descriptions, colours, and sizes — minor variations may occur</li>
        <li>EX GLOBAL reserves the right to modify prices without prior notice</li>
        <li>In the event of a pricing error, we will contact you before processing the order</li>
        <li>Product availability is not guaranteed; orders may be cancelled if items go out of stock</li>
      </ul>

      <h2>3. 📦 Orders & Payment</h2>
      <ul>
        <li>An order confirmation does not constitute a binding contract until we confirm dispatch</li>
        <li>We accept: Mada, Visa, Mastercard, Apple Pay, STC Pay, Tamara, Tabby, Binance Pay, and Cash on Delivery</li>
        <li>Orders can be cancelled within <strong>2 hours</strong> of placement if not yet processed — contact us via WhatsApp</li>
        <li>EX GLOBAL is not liable for delays caused by courier partners, force majeure, or address errors</li>
      </ul>

      <h2>4. 🔄 Returns & Refunds</h2>
      <p>Returns are subject to our <a href="#" onclick="openPage('refund');return false" style="color:#e91e8c">Refund Policy</a>, which offers a 14-day return window from the date of delivery.</p>

      <h2>5. 🔒 Intellectual Property</h2>
      <ul>
        <li>All content on this website (logos, images, text, design) is owned by EX GLOBAL or licensed to us</li>
        <li>You may not copy, reproduce, or redistribute any content without written permission</li>
      </ul>

      <h2>6. 🚫 Prohibited Uses</h2>
      <ul>
        <li>Using the platform for fraudulent transactions or fake orders</li>
        <li>Attempting to hack, scrape, or disrupt the website</li>
        <li>Impersonating another person or entity</li>
        <li>Reselling products purchased from EX GLOBAL without authorization</li>
      </ul>

      <h2>7. ⚖️ Limitation of Liability</h2>
      <p>To the maximum extent permitted by Saudi law, EX GLOBAL's liability is limited to the value of the order in dispute. We are not liable for indirect, incidental, or consequential damages.</p>

      <h2>8. 🏛️ Governing Law & Disputes</h2>
      <ul>
        <li>These terms are governed by the laws of the <strong>Kingdom of Saudi Arabia</strong></li>
        <li>Disputes will first be resolved through direct negotiation</li>
        <li>If unresolved, you may refer your complaint to the <strong>Consumer Protection Association (CPA)</strong> or the <strong>Ministry of Commerce</strong></li>
        <li>CPA hotline: <strong>1900</strong> · Ministry of Commerce: <strong>1900</strong></li>
      </ul>

      <h2>9. 📝 Changes to Terms</h2>
      <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms. Major changes will be communicated via WhatsApp or email.</p>

      <div class="info-card">📞 Questions about these terms? Contact us at <strong>exglobalbusiness@gmail.com</strong> or WhatsApp <strong>+966 546 224 029</strong></div>
    `},
    ar: { title: 'شروط الخدمة', body: `
      <p style="color:#888;font-size:12px">تاريخ السريان: يناير 2025 · تخضع لقوانين المملكة العربية السعودية</p>
      <div class="info-card">📜 باستخدامك لـ EX GLOBAL، فإنك توافق على هذه الشروط. يرجى قراءتها بعناية قبل تقديم طلبك.</div>

      <h2>1. 🧑‍💼 الحساب والأهلية</h2>
      <ul>
        <li>يجب أن يكون عمرك <strong>18 عامًا</strong> على الأقل لإنشاء حساب وتقديم الطلبات</li>
        <li>أنت مسؤول عن الحفاظ على سرية بيانات حسابك</li>
        <li>تلتزم بتقديم معلومات دقيقة وصحيحة عند التسجيل</li>
      </ul>

      <h2>2. 🛍️ المنتجات والأسعار</h2>
      <ul>
        <li>جميع الأسعار بـ <strong>الريال السعودي (SAR)</strong> وتشمل <strong>ضريبة القيمة المضافة 15%</strong></li>
        <li>نحرص على عرض أوصاف دقيقة للمنتجات — قد تحدث اختلافات طفيفة في الألوان</li>
        <li>يحق لـ EX GLOBAL تعديل الأسعار دون إشعار مسبق</li>
      </ul>

      <h2>3. 📦 الطلبات والدفع</h2>
      <ul>
        <li>يمكن إلغاء الطلبات خلال <strong>ساعتين</strong> من الطلب إذا لم تتم المعالجة</li>
        <li>نقبل: مدى، فيزا، ماستركارد، Apple Pay، STC Pay، تمارا، تابي، والدفع عند الاستلام</li>
      </ul>

      <h2>4. ⚖️ القانون المعمول به</h2>
      <ul>
        <li>تخضع هذه الشروط لقوانين <strong>المملكة العربية السعودية</strong></li>
        <li>للشكاوى: جمعية حماية المستهلك — الخط الساخن <strong>1900</strong></li>
      </ul>
    `},
    bn: { title: 'সেবার শর্তাবলী', body: `
      <p style="color:#888;font-size:12px">কার্যকর তারিখ: জানুয়ারি ২০২৫ · সৌদি আরবের আইন অনুযায়ী পরিচালিত</p>
      <div class="info-card">📜 EX GLOBAL ব্যবহার করে আপনি এই শর্তগুলো মেনে নিচ্ছেন। অর্ডার দেওয়ার আগে মনোযোগ দিয়ে পড়ুন।</div>

      <h2>১. 🧑‍💼 অ্যাকাউন্ট ও যোগ্যতা</h2>
      <ul>
        <li>অ্যাকাউন্ট তৈরি ও অর্ডার দিতে আপনার বয়স কমপক্ষে <strong>১৮ বছর</strong> হতে হবে</li>
        <li>আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করার দায়িত্ব আপনার</li>
        <li>নিবন্ধনে সঠিক ও সম্পূর্ণ তথ্য প্রদান করতে হবে</li>
      </ul>

      <h2>২. 🛍️ পণ্য ও মূল্য</h2>
      <ul>
        <li>সকল মূল্য <strong>সৌদি রিয়াল (SAR)</strong>-এ এবং <strong>১৫% VAT</strong> অন্তর্ভুক্ত</li>
        <li>পণ্যের বিবরণ যথাসাধ্য সঠিক — রঙে সামান্য পার্থক্য হতে পারে</li>
        <li>মূল্য পরিবর্তনের অধিকার EX GLOBAL-এর আছে</li>
      </ul>

      <h2>৩. 📦 অর্ডার ও পেমেন্ট</h2>
      <ul>
        <li>অর্ডারের <strong>২ ঘণ্টার মধ্যে</strong> বাতিল করা যাবে (প্রক্রিয়া না হলে)</li>
        <li>mada, Visa, Mastercard, Apple Pay, STC Pay, Tamara, Tabby, Binance Pay ও ক্যাশ অন ডেলিভারি গ্রহণযোগ্য</li>
      </ul>

      <h2>৪. ⚖️ প্রযোজ্য আইন</h2>
      <ul>
        <li>এই শর্তগুলো <strong>সৌদি আরবের আইন</strong> অনুযায়ী পরিচালিত</li>
        <li>অভিযোগের জন্য: ভোক্তা সুরক্ষা সংস্থা — হটলাইন <strong>1900</strong></li>
      </ul>
    `},
  },
  about: {
    en: { title: 'About Us', body: `
      <h2>🛍️ Welcome to EX GLOBAL</h2>
      <p>EX GLOBAL is a premium online fashion destination proudly serving customers across Saudi Arabia. We bring the latest trends in women's, men's, and children's fashion — along with beauty products and home essentials — all at competitive prices with fast, reliable delivery.</p>
      <div class="info-card">🇸🇦 Based in Saudi Arabia · Serving the Kingdom since 2021<br/>VAT Registration: <strong>310342701100003</strong></div>
      <h2>🎯 Our Mission</h2>
      <p>We believe everyone deserves access to quality fashion. Our team carefully curates every product in our collection to ensure the highest standards of style, comfort, and value.</p>
      <h2>💎 Why Shop With Us?</h2>
      <ul>
        <li>✅ Thousands of products across all categories</li>
        <li>🚚 Free shipping on orders over SAR 100</li>
        <li>🔄 14-day hassle-free returns & free exchanges</li>
        <li>🔒 Secure payment — 9 payment methods including Mada & COD</li>
        <li>⚡ Fast delivery across all Saudi Arabia via Aramex & SMSA Express</li>
        <li>💬 Arabic & English customer support via WhatsApp</li>
        <li>📦 Real-time order tracking</li>
      </ul>
      <h2>🏆 Our Promise</h2>
      <p>Every order is packed with care. If you're not happy with your purchase for any reason, our team will make it right — that's the EX GLOBAL guarantee.</p>
      <h2>📱 Follow Us</h2>
      <p>Stay updated with the latest arrivals and exclusive offers on TikTok, Instagram, and Snapchat <strong>@exglobal.sa</strong></p>
    `},
    ar: { title: 'من نحن', body: `
      <h2>🛍️ مرحباً بك في EX GLOBAL</h2>
      <p>EX GLOBAL هو متجر أزياء إلكتروني متميز يخدم عملاءنا في جميع أنحاء المملكة العربية السعودية. نقدم أحدث صيحات الموضة للنساء والرجال والأطفال، فضلاً عن منتجات التجميل ومستلزمات المنزل بأسعار تنافسية وتوصيل سريع.</p>
      <div class="info-card">🇸🇦 مقرنا في المملكة العربية السعودية · نخدم المملكة منذ 2021<br/>رقم تسجيل ضريبة القيمة المضافة: <strong>310342701100003</strong></div>
      <h2>💎 لماذا تتسوق معنا؟</h2>
      <ul>
        <li>✅ آلاف المنتجات في جميع الفئات</li>
        <li>🚚 شحن مجاني للطلبات فوق 100 ريال</li>
        <li>🔄 إرجاع مجاني خلال 14 يوماً وتبديل سهل</li>
        <li>🔒 9 طرق دفع آمنة تشمل مدى والدفع عند الاستلام</li>
        <li>⚡ توصيل سريع عبر Aramex و SMSA Express</li>
        <li>💬 دعم عملاء بالعربية والإنجليزية عبر واتساب</li>
      </ul>
      <h2>🏆 وعدنا لك</h2>
      <p>كل طلب يُعبَّأ بعناية. إذا لم تكن راضياً عن مشترياتك لأي سبب، سيعمل فريقنا على حل المشكلة — هذا هو ضمان EX GLOBAL.</p>
    `},
    bn: { title: 'আমাদের সম্পর্কে', body: `
      <h2>🛍️ EX GLOBAL-এ স্বাগতম</h2>
      <p>EX GLOBAL সৌদি আরব জুড়ে গ্রাহকদের সেবা দেওয়া একটি প্রিমিয়াম অনলাইন ফ্যাশন স্টোর। আমরা নারী, পুরুষ ও শিশুদের জন্য সর্বশেষ ফ্যাশন, বিউটি পণ্য এবং হোম প্রোডাক্ট সরবরাহ করি।</p>
      <div class="info-card">🇸🇦 সৌদি আরবে প্রতিষ্ঠিত · ২০২১ সাল থেকে সেবায় আছি<br/>VAT নিবন্ধন: <strong>310342701100003</strong></div>
      <h2>💎 আমাদের বেছে নিন কেন?</h2>
      <ul>
        <li>✅ সব ক্যাটাগরিতে হাজার হাজার পণ্য</li>
        <li>🚚 SAR ১০০-এর উপরে অর্ডারে ফ্রি শিপিং</li>
        <li>🔄 ১৪ দিনের সহজ রিটার্ন ও ফ্রি এক্সচেঞ্জ</li>
        <li>🔒 mada সহ ৯ ধরনের নিরাপদ পেমেন্ট, ক্যাশ অন ডেলিভারি সুবিধা</li>
        <li>⚡ Aramex ও SMSA Express-এর মাধ্যমে দ্রুত ডেলিভারি</li>
        <li>💬 বাংলা, আরবি ও ইংরেজিতে WhatsApp সাপোর্ট</li>
      </ul>
      <h2>🏆 আমাদের প্রতিশ্রুতি</h2>
      <p>প্রতিটি অর্ডার যত্ন সহকারে প্যাক করা হয়। কোনো কারণে সন্তুষ্ট না হলে আমাদের টিম সমাধান করবে — এটাই EX GLOBAL গ্যারান্টি।</p>
    `},
  },
  contact: {
    en: { title: 'Customer Service', body: `
      <div class="info-card">💬 <strong>WhatsApp is the fastest way to reach us.</strong> We reply within 2 hours during business hours.</div>
      <a class="contact-btn" href="https://wa.me/966546224029?text=Hello%20EX%20GLOBAL%20👋" target="_blank"><i class="fab fa-whatsapp"></i> WhatsApp: +966 546 224 029</a>
      <a class="contact-btn" href="mailto:exglobalbusiness@gmail.com" style="background:rgba(233,30,140,.1);color:#e91e8c;border:1.5px solid rgba(233,30,140,.3)"><i class="fas fa-envelope"></i> exglobalbusiness@gmail.com</a>

      <div class="info-card">⏰ <strong>Working Hours:</strong> Saturday – Thursday · 9 AM – 9 PM (AST)<br/>Friday: Closed · Average response: <strong>under 2 hours</strong></div>

      <h2>❓ Frequently Asked Questions</h2>

      <h2 style="font-size:14px;margin-top:12px">📦 How do I track my order?</h2>
      <p>Once your order is shipped, you'll receive a WhatsApp message with your tracking number and a link to track via Aramex or SMSA Express. You can also go to <em>My Account → Orders</em> in the app.</p>

      <h2 style="font-size:14px;margin-top:12px">🔄 Can I exchange for a different size?</h2>
      <p>Yes! We offer free size and color exchanges within 14 days of delivery. WhatsApp us with your order number and the size you need — we'll arrange a pickup and reship at no extra cost.</p>

      <h2 style="font-size:14px;margin-top:12px">⏱️ When will my order arrive?</h2>
      <p>Riyadh, Jeddah, Dammam: 1–2 business days. Other cities: 2–3 days. Remote areas: 3–5 days. Orders placed before 2 PM ship the same day.</p>

      <h2 style="font-size:14px;margin-top:12px">❌ I received the wrong item. What do I do?</h2>
      <p>We sincerely apologize! WhatsApp us a photo of the item you received with your order number. We'll send the correct item immediately and arrange free pickup of the wrong one — at zero cost to you.</p>

      <h2 style="font-size:14px;margin-top:12px">💳 What payment methods do you accept?</h2>
      <p>Mada, Visa, Mastercard, Apple Pay, STC Pay, Tamara (split in 4), Tabby (pay later), Binance Pay, and Cash on Delivery. All payments are 100% secure.</p>

      <h2 style="font-size:14px;margin-top:12px">🎟️ How do I use a coupon code?</h2>
      <p>Add items to your cart, proceed to checkout, and enter your code in the <em>Coupon Code</em> field. Try <strong>WELCOME10</strong> for 10% off your first order!</p>

      <h2 style="font-size:14px;margin-top:12px">🏛️ Still not satisfied?</h2>
      <p>You can escalate to the <strong>Consumer Protection Association</strong> at hotline <strong>1900</strong>, or the <strong>Ministry of Commerce</strong> at <strong>1900</strong>. We are fully compliant with Saudi consumer protection laws.</p>
    `},
    ar: { title: 'خدمة العملاء', body: `
      <div class="info-card">💬 <strong>واتساب هو أسرع طريقة للتواصل معنا.</strong> نرد خلال ساعتين في ساعات العمل.</div>
      <a class="contact-btn" href="https://wa.me/966546224029?text=مرحباً%20EX%20GLOBAL%20👋" target="_blank"><i class="fab fa-whatsapp"></i> واتساب: 966546224029+</a>
      <a class="contact-btn" href="mailto:exglobalbusiness@gmail.com" style="background:rgba(233,30,140,.1);color:#e91e8c;border:1.5px solid rgba(233,30,140,.3)"><i class="fas fa-envelope"></i> exglobalbusiness@gmail.com</a>

      <div class="info-card">⏰ <strong>ساعات العمل:</strong> السبت – الخميس · 9 صباحاً – 9 مساءً<br/>الجمعة: مغلق · متوسط وقت الرد: <strong>أقل من ساعتين</strong></div>

      <h2>❓ الأسئلة الشائعة</h2>

      <h2 style="font-size:14px;margin-top:12px">📦 كيف أتتبع طلبي؟</h2>
      <p>بعد شحن طلبك ستصلك رسالة واتساب برقم التتبع عبر Aramex أو SMSA Express. يمكنك أيضاً متابعة الطلب من <em>حسابي ← الطلبات</em>.</p>

      <h2 style="font-size:14px;margin-top:12px">🔄 هل يمكنني تبديل المقاس؟</h2>
      <p>نعم! نقدم تبديلاً مجانياً للمقاس أو اللون خلال 14 يوماً من التسليم. أرسل لنا رقم طلبك والمقاس المطلوب عبر واتساب.</p>

      <h2 style="font-size:14px;margin-top:12px">❌ استلمت منتجاً خاطئاً. ماذا أفعل؟</h2>
      <p>نعتذر جداً! أرسل لنا صورة المنتج مع رقم طلبك عبر واتساب، وسنرسل المنتج الصحيح فوراً مع استلام الخاطئ مجاناً.</p>

      <h2 style="font-size:14px;margin-top:12px">🏛️ للتصعيد:</h2>
      <p>يمكنك التواصل مع <strong>جمعية حماية المستهلك</strong> على الخط الساخن <strong>1900</strong> أو <strong>وزارة التجارة</strong> على <strong>1900</strong>.</p>
    `},
    bn: { title: 'কাস্টমার সার্ভিস', body: `
      <div class="info-card">💬 <strong>WhatsApp-ই সবচেয়ে দ্রুত উপায়।</strong> কর্মঘণ্টায় ২ ঘণ্টার মধ্যে সাড়া দিই।</div>
      <a class="contact-btn" href="https://wa.me/966546224029?text=হ্যালো%20EX%20GLOBAL%20👋" target="_blank"><i class="fab fa-whatsapp"></i> WhatsApp: +966 546 224 029</a>
      <a class="contact-btn" href="mailto:exglobalbusiness@gmail.com" style="background:rgba(233,30,140,.1);color:#e91e8c;border:1.5px solid rgba(233,30,140,.3)"><i class="fas fa-envelope"></i> exglobalbusiness@gmail.com</a>

      <div class="info-card">⏰ <strong>কার্যসময়:</strong> শনিবার – বৃহস্পতিবার · সকাল ৯টা – রাত ৯টা<br/>শুক্রবার: বন্ধ · গড় সাড়া সময়: <strong>২ ঘণ্টার মধ্যে</strong></div>

      <h2>❓ সাধারণ প্রশ্নোত্তর</h2>

      <h2 style="font-size:14px;margin-top:12px">📦 অর্ডার ট্র্যাক করবো কীভাবে?</h2>
      <p>শিপমেন্টের পর WhatsApp-এ ট্র্যাকিং নম্বর পাঠানো হবে (Aramex বা SMSA Express)। এছাড়া অ্যাপে <em>আমার অ্যাকাউন্ট → অর্ডার</em>-এ দেখুন।</p>

      <h2 style="font-size:14px;margin-top:12px">🔄 সাইজ বদলাতে পারবো?</h2>
      <p>হ্যাঁ! ডেলিভারির ১৪ দিনের মধ্যে ফ্রি সাইজ/কালার এক্সচেঞ্জ করা যাবে। অর্ডার নম্বর ও দরকারি সাইজ সহ WhatsApp করুন।</p>

      <h2 style="font-size:14px;margin-top:12px">❌ ভুল পণ্য পেয়েছি?</h2>
      <p>আন্তরিকভাবে ক্ষমাপ্রার্থী! পণ্যের ছবি ও অর্ডার নম্বর সহ WhatsApp করুন। সঠিক পণ্য পাঠানো হবে এবং ভুলটি ফ্রিতে পিকআপ করা হবে।</p>

      <h2 style="font-size:14px;margin-top:12px">💳 কোন পেমেন্ট গ্রহণযোগ্য?</h2>
      <p>mada, Visa, Mastercard, Apple Pay, STC Pay, Tamara, Tabby, Binance Pay ও Cash on Delivery। সব পেমেন্ট ১০০% নিরাপদ।</p>

      <h2 style="font-size:14px;margin-top:12px">🏛️ অভিযোগের জন্য:</h2>
      <p>ভোক্তা সুরক্ষা সংস্থায় হটলাইন <strong>1900</strong>-তে অথবা বাণিজ্য মন্ত্রণালয়ে <strong>1900</strong>-তে যোগাযোগ করুন।</p>
    `},
  },
  privacy: {
    en: { title: 'Privacy Policy', body: `
      <p style="color:#888;font-size:12px">Last updated: June 2025 · Compliant with Saudi PDPL (Royal Decree M/19)</p>
      <div class="info-card">🔐 EX GLOBAL is committed to protecting your personal data in accordance with the <strong>Saudi Personal Data Protection Law (PDPL)</strong>.</div>

      <h2>📋 Data We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> Name, email address, phone number</li>
        <li><strong>Order data:</strong> Delivery address, order history, payment method type (we never store full card numbers)</li>
        <li><strong>Device data:</strong> IP address, browser type, pages visited (via cookies)</li>
        <li><strong>Communication data:</strong> WhatsApp/email messages you send us</li>
      </ul>

      <h2>🎯 Why We Collect It</h2>
      <ul>
        <li>To process, ship, and deliver your orders</li>
        <li>To send order confirmations and tracking updates via WhatsApp</li>
        <li>To manage your account and handle returns</li>
        <li>To improve our website and personalise your experience</li>
        <li>To send promotional offers — <strong>only with your explicit consent</strong></li>
        <li>To prevent fraud and ensure platform security</li>
      </ul>

      <h2>🤝 Who We Share Data With</h2>
      <ul>
        <li><strong>Shipping partners:</strong> Aramex, SMSA Express (delivery address only)</li>
        <li><strong>Payment processors:</strong> SAMA-licensed gateways (Tap Payments, STC Pay, etc.) — card details go directly to them, never to us</li>
        <li><strong>We NEVER sell your data</strong> to third-party advertisers</li>
      </ul>

      <h2>📅 Data Retention</h2>
      <p>We retain your personal data for <strong>3 years</strong> after your last purchase, or as required by Saudi law (ZATCA requires transaction records for 10 years for tax purposes).</p>

      <h2>✅ Your Rights Under PDPL</h2>
      <ul>
        <li><strong>Right to access:</strong> Request a copy of your data</li>
        <li><strong>Right to correct:</strong> Update inaccurate information</li>
        <li><strong>Right to delete:</strong> Request erasure of your data (subject to legal retention requirements)</li>
        <li><strong>Right to withdraw consent:</strong> Opt out of marketing at any time</li>
        <li><strong>Right to data portability:</strong> Receive your data in a readable format</li>
      </ul>

      <h2>🍪 Cookies</h2>
      <p>We use cookies to remember your cart, language preference, and login status. You can disable cookies in your browser settings — note that some features may not work without them.</p>

      <h2>🌍 International Transfers</h2>
      <p>Your data may be processed on servers outside Saudi Arabia (e.g., cloud services). We ensure equivalent data protection standards are applied.</p>

      <h2>📬 Contact for Privacy Requests</h2>
      <p>Email: <strong>exglobalbusiness@gmail.com</strong><br/>Subject line: "Privacy Request — [Your Name]"<br/>We will respond within <strong>15 business days</strong>.</p>
    `},
    ar: { title: 'سياسة الخصوصية', body: `
      <p style="color:#888;font-size:12px">آخر تحديث: يونيو 2025 · متوافقة مع نظام حماية البيانات الشخصية السعودي (PDPL)</p>
      <div class="info-card">🔐 EX GLOBAL ملتزمة بحماية بياناتك الشخصية وفقاً لـ <strong>نظام حماية البيانات الشخصية السعودي</strong>.</div>

      <h2>📋 البيانات التي نجمعها</h2>
      <ul>
        <li><strong>بيانات الحساب:</strong> الاسم، البريد الإلكتروني، رقم الهاتف</li>
        <li><strong>بيانات الطلب:</strong> عنوان التوصيل، تاريخ الطلبات، نوع طريقة الدفع فقط (لا نحتفظ بأرقام البطاقات الكاملة)</li>
        <li><strong>بيانات الجهاز:</strong> عنوان IP، نوع المتصفح، الصفحات المُزارة (عبر ملفات تعريف الارتباط)</li>
      </ul>

      <h2>🎯 لماذا نجمعها</h2>
      <ul>
        <li>لمعالجة طلباتك وشحنها وتوصيلها</li>
        <li>لإرسال تأكيدات الطلبات وتحديثات التتبع عبر واتساب</li>
        <li>لإدارة حسابك والتعامل مع المرتجعات</li>
        <li>لإرسال عروض ترويجية — <strong>بموافقتك الصريحة فقط</strong></li>
      </ul>

      <h2>✅ حقوقك بموجب PDPL</h2>
      <ul>
        <li>حق الوصول: طلب نسخة من بياناتك</li>
        <li>حق التصحيح: تحديث المعلومات غير الدقيقة</li>
        <li>حق الحذف: طلب مسح بياناتك</li>
        <li>حق سحب الموافقة: إلغاء الاشتراك في التسويق في أي وقت</li>
      </ul>

      <h2>📬 للتواصل بشأن الخصوصية</h2>
      <p>البريد الإلكتروني: <strong>exglobalbusiness@gmail.com</strong><br/>سنرد خلال <strong>15 يوم عمل</strong>.</p>
    `},
    bn: { title: 'প্রাইভেসি পলিসি', body: `
      <p style="color:#888;font-size:12px">সর্বশেষ আপডেট: জুন ২০২৫ · সৌদি PDPL মেনে চলা হয়</p>
      <div class="info-card">🔐 EX GLOBAL <strong>সৌদি আরবের Personal Data Protection Law (PDPL)</strong> মেনে আপনার তথ্য সুরক্ষিত রাখে।</div>

      <h2>📋 আমরা যা তথ্য সংগ্রহ করি</h2>
      <ul>
        <li><strong>অ্যাকাউন্ট তথ্য:</strong> নাম, ইমেইল, ফোন নম্বর</li>
        <li><strong>অর্ডার তথ্য:</strong> ডেলিভারি ঠিকানা, অর্ডার ইতিহাস, পেমেন্ট পদ্ধতির ধরন (পূর্ণ কার্ড নম্বর কখনো সংরক্ষিত হয় না)</li>
        <li><strong>ডিভাইস তথ্য:</strong> IP ঠিকানা, ব্রাউজার টাইপ (কুকির মাধ্যমে)</li>
      </ul>

      <h2>🎯 কেন সংগ্রহ করি</h2>
      <ul>
        <li>অর্ডার প্রক্রিয়া, শিপিং ও ডেলিভারির জন্য</li>
        <li>WhatsApp-এ অর্ডার কনফার্মেশন ও ট্র্যাকিং আপডেটের জন্য</li>
        <li>প্রোমো অফার — <strong>শুধুমাত্র আপনার স্পষ্ট সম্মতিতে</strong></li>
      </ul>

      <h2>✅ PDPL অনুযায়ী আপনার অধিকার</h2>
      <ul>
        <li>আপনার তথ্যের অ্যাক্সেস পাওয়ার অধিকার</li>
        <li>ভুল তথ্য সংশোধনের অধিকার</li>
        <li>তথ্য মুছে ফেলার অধিকার</li>
        <li>যেকোনো সময় মার্কেটিং সম্মতি প্রত্যাহারের অধিকার</li>
      </ul>

      <h2>🤝 কার সাথে শেয়ার করি</h2>
      <ul>
        <li><strong>শিপিং পার্টনার:</strong> Aramex, SMSA Express (শুধু ডেলিভারি ঠিকানা)</li>
        <li><strong>পেমেন্ট প্রসেসর:</strong> SAMA-লাইসেন্সপ্রাপ্ত গেটওয়ে</li>
        <li><strong>আমরা কখনো আপনার তথ্য বিক্রি করি না</strong></li>
      </ul>

      <h2>📅 তথ্য সংরক্ষণ</h2>
      <p>শেষ কেনাকাটার পর <strong>৩ বছর</strong> তথ্য সংরক্ষিত থাকে।</p>

      <h2>📬 প্রাইভেসি অনুরোধের জন্য</h2>
      <p>ইমেইল: <strong>exglobalbusiness@gmail.com</strong> · <strong>১৫ কর্মদিবসের মধ্যে</strong> সাড়া দেওয়া হবে।</p>
    `},
  },
  refund: {
    en: { title: 'Refund & Return Policy', body: `
      <div class="info-card">✅ <strong>14-Day Returns · Free Exchanges · Free Pickup</strong><br/>We offer one of the most generous return policies in Saudi Arabia.</div>

      <h2>🔄 What You Can Return or Exchange</h2>
      <ul>
        <li>Item must be <strong>unused, unworn, unwashed</strong></li>
        <li>All <strong>original tags must be attached</strong></li>
        <li>Must be in the <strong>original packaging</strong></li>
        <li>Return or exchange request must be made within <strong>14 days of delivery</strong></li>
      </ul>

      <h2>🔁 Free Size & Color Exchange</h2>
      <p>Not the right size? We'll exchange it for free — including free pickup from your door and redelivery. WhatsApp us within 14 days with your order number and the size/color you need.</p>

      <h2>⚡ Wrong or Damaged Item Received?</h2>
      <div class="info-card">If we sent the wrong item or your item arrived damaged, you get a <strong>full refund OR replacement — no questions asked</strong>, within 30 days. This is required by Saudi Consumer Protection Law.</div>

      <h2>❌ How to Cancel an Order</h2>
      <ul>
        <li>Cancel within <strong>2 hours</strong> of placing your order (before processing begins)</li>
        <li>WhatsApp us immediately at +966 546 224 029 with your order number</li>
        <li>After dispatch, cancellation is not possible — use the return process instead</li>
      </ul>

      <h2>📋 Step-by-Step Return Process</h2>
      <ol style="padding-left:18px;line-height:2">
        <li>WhatsApp us at <strong>+966 546 224 029</strong> within 14 days</li>
        <li>Send your <strong>order number</strong> and <strong>photos of the item</strong></li>
        <li>Tell us if you want a <strong>refund or exchange</strong></li>
        <li>We schedule <strong>free courier pickup</strong> from your address</li>
        <li>Item is inspected at our warehouse (within 2 business days)</li>
        <li>Refund or replacement is issued</li>
      </ol>

      <h2>💰 Refund Methods & Timeline</h2>
      <ul>
        <li><strong>Credit/debit card:</strong> 5–7 business days back to your card</li>
        <li><strong>Store credit/wallet:</strong> Within 24–48 hours (faster option)</li>
        <li><strong>Cash on Delivery orders:</strong> Bank transfer to your IBAN within 3–5 business days</li>
        <li><strong>STC Pay / Tabby / Tamara:</strong> Refund to original payment within 5–7 days</li>
      </ul>

      <h2>❌ Non-Returnable Items</h2>
      <ul>
        <li>Underwear, lingerie, and swimwear (for hygiene reasons)</li>
        <li>Socks and tights</li>
        <li>Items marked <strong>"Final Sale"</strong></li>
        <li>Customised or personalised items</li>
        <li>Items that have been worn, washed, or altered</li>
      </ul>

      <div class="info-card">📞 Need help with a return? WhatsApp <strong>+966 546 224 029</strong> — we're here Sat–Thu, 9 AM–9 PM.</div>
    `},
    ar: { title: 'سياسة الاسترجاع والاستبدال', body: `
      <div class="info-card">✅ <strong>إرجاع خلال 14 يوماً · استبدال مجاني · استلام مجاني من الباب</strong></div>

      <h2>🔄 ما يمكن إرجاعه أو استبداله</h2>
      <ul>
        <li>يجب أن يكون المنتج <strong>غير مستخدم وغير ملبوس وغير مغسول</strong></li>
        <li>جميع <strong>العلامات الأصلية يجب أن تكون مُرفقة</strong></li>
        <li>يجب أن يكون في <strong>عبوته الأصلية</strong></li>
        <li>طلب الإرجاع أو الاستبدال خلال <strong>14 يوماً من التسليم</strong></li>
      </ul>

      <h2>🔁 استبدال المقاس أو اللون مجاناً</h2>
      <p>المقاس غير مناسب؟ سنستبدله مجاناً مع استلام مجاني من بابك وإعادة التوصيل. تواصل معنا عبر واتساب خلال 14 يوماً مع رقم طلبك والمقاس المطلوب.</p>

      <h2>⚡ استلمت منتجاً خاطئاً أو تالفاً؟</h2>
      <div class="info-card">إذا أرسلنا منتجاً خاطئاً أو وصل تالفاً، ستحصل على <strong>استرداد كامل أو استبدال فوري — دون أي أسئلة</strong>، خلال 30 يوماً وفقاً لنظام حماية المستهلك السعودي.</div>

      <h2>📋 خطوات الإرجاع</h2>
      <ol style="padding-left:18px;line-height:2">
        <li>تواصل معنا عبر واتساب <strong>966546224029+</strong> خلال 14 يوماً</li>
        <li>أرسل <strong>رقم طلبك</strong> وصور المنتج</li>
        <li>أخبرنا إن كنت تريد <strong>استرداداً أو استبدالاً</strong></li>
        <li>نرتب <strong>استلاماً مجانياً</strong> من عنوانك</li>
        <li>فحص المنتج خلال يومي عمل</li>
        <li>صرف المبلغ أو إرسال البديل</li>
      </ol>

      <h2>💰 طرق الاسترداد والمواعيد</h2>
      <ul>
        <li><strong>بطاقة الائتمان/الخصم:</strong> 5–7 أيام عمل</li>
        <li><strong>رصيد المتجر:</strong> 24–48 ساعة (أسرع خيار)</li>
        <li><strong>طلبات الدفع عند الاستلام:</strong> تحويل بنكي خلال 3–5 أيام</li>
      </ul>

      <h2>❌ ما لا يمكن إرجاعه</h2>
      <ul>
        <li>الملابس الداخلية والبكيني (لأسباب صحية)</li>
        <li>الجوارب والشراب</li>
        <li>المنتجات المُعلَّمة <strong>"تخفيض نهائي"</strong></li>
        <li>المنتجات المخصصة أو الشخصية</li>
      </ul>
    `},
    bn: { title: 'রিফান্ড ও রিটার্ন পলিসি', body: `
      <div class="info-card">✅ <strong>১৪ দিনের রিটার্ন · ফ্রি এক্সচেঞ্জ · ফ্রি পিকআপ</strong><br/>সৌদি আরবের অন্যতম সেরা রিটার্ন পলিসি।</div>

      <h2>🔄 রিটার্নের শর্ত</h2>
      <ul>
        <li>পণ্য <strong>অব্যবহৃত, অপরিধান করা ও অধোয়া</strong> হতে হবে</li>
        <li>সব <strong>মূল ট্যাগ লাগানো</strong> থাকতে হবে</li>
        <li><strong>মূল প্যাকেজিং</strong>-এ থাকতে হবে</li>
        <li>ডেলিভারির <strong>১৪ দিনের মধ্যে</strong> রিটার্ন/এক্সচেঞ্জ অনুরোধ করতে হবে</li>
      </ul>

      <h2>🔁 ফ্রি সাইজ ও কালার এক্সচেঞ্জ</h2>
      <p>সাইজ মিলছে না? ফ্রিতে বদলে দেওয়া হবে — ফ্রি পিকআপ ও রিডেলিভারিসহ। অর্ডার নম্বর ও দরকারি সাইজ সহ ১৪ দিনের মধ্যে WhatsApp করুন।</p>

      <h2>⚡ ভুল বা ক্ষতিগ্রস্ত পণ্য পেলে?</h2>
      <div class="info-card">ভুল পণ্য বা ক্ষতিগ্রস্ত পণ্য পেলে — <strong>সম্পূর্ণ রিফান্ড অথবা প্রতিস্থাপন, কোনো প্রশ্ন ছাড়াই</strong>, ৩০ দিনের মধ্যে। এটি সৌদি ভোক্তা সুরক্ষা আইন অনুযায়ী বাধ্যতামূলক।</div>

      <h2>❌ অর্ডার বাতিল করবেন কীভাবে?</h2>
      <ul>
        <li>অর্ডারের <strong>২ ঘণ্টার মধ্যে</strong> বাতিল করা যাবে (প্রক্রিয়া শুরুর আগে)</li>
        <li>অর্ডার নম্বর সহ +966 546 224 029-এ WhatsApp করুন</li>
        <li>শিপমেন্টের পর বাতিল সম্ভব নয় — রিটার্ন প্রক্রিয়া ব্যবহার করুন</li>
      </ul>

      <h2>📋 রিটার্নের ধাপসমূহ</h2>
      <ol style="padding-left:18px;line-height:2">
        <li>১৪ দিনের মধ্যে <strong>+966 546 224 029</strong>-এ WhatsApp করুন</li>
        <li><strong>অর্ডার নম্বর</strong> ও পণ্যের <strong>ছবি</strong> পাঠান</li>
        <li>রিফান্ড না এক্সচেঞ্জ — জানান</li>
        <li>আপনার দরজা থেকে <strong>ফ্রি পিকআপ</strong> আয়োজন করা হবে</li>
        <li>পণ্য পরীক্ষা (২ কর্মদিবসের মধ্যে)</li>
        <li>রিফান্ড বা প্রতিস্থাপন প্রদান</li>
      </ol>

      <h2>💰 রিফান্ড পদ্ধতি ও সময়</h2>
      <ul>
        <li><strong>ক্রেডিট/ডেবিট কার্ড:</strong> ৫–৭ কর্মদিবস</li>
        <li><strong>স্টোর ক্রেডিট:</strong> ২৪–৪৮ ঘণ্টা (দ্রুততম)</li>
        <li><strong>ক্যাশ অন ডেলিভারি:</strong> IBAN-এ ব্যাংক ট্রান্সফার, ৩–৫ কর্মদিবস</li>
      </ul>

      <h2>❌ রিটার্নযোগ্য নয়</h2>
      <ul>
        <li>অন্তর্বাস, লিঙ্গেরি ও সুইমওয়্যার (স্বাস্থ্যবিধির কারণে)</li>
        <li>মোজা</li>
        <li><strong>"Final Sale"</strong> চিহ্নিত পণ্য</li>
        <li>কাস্টমাইজড বা ব্যক্তিগতকৃত পণ্য</li>
        <li>পরিধান, ধোয়া বা পরিবর্তিত পণ্য</li>
      </ul>

      <div class="info-card">📞 রিটার্ন সাহায্যে WhatsApp করুন: <strong>+966 546 224 029</strong> · শনি–বৃহস্পতি, সকাল ৯টা–রাত ৯টা</div>
    `},
  },
  shipping: {
    en: { title: 'Shipping Policy', body: `
      <div class="info-card">🚚 We deliver across <strong>all regions of Saudi Arabia</strong> via <strong>Aramex</strong> and <strong>SMSA Express</strong> — two of the Kingdom's most trusted couriers.</div>

      <h2>⏱️ Delivery Timeframes</h2>
      <ul>
        <li>🏙️ <strong>Riyadh, Jeddah, Dammam, Makkah, Madinah:</strong> 1–2 business days</li>
        <li>🌆 <strong>Taif, Abha, Khobar, Tabuk, Hail:</strong> 2–3 business days</li>
        <li>🌄 <strong>Remote & rural areas:</strong> 3–5 business days</li>
      </ul>
      <p style="color:#888;font-size:12px">⚠️ Business days exclude Fridays and Saudi public holidays.</p>

      <h2>💰 Shipping Fees</h2>
      <ul>
        <li>🎉 <strong>Free shipping</strong> on all orders over <strong>SAR 100</strong></li>
        <li>📦 Standard shipping: <strong>SAR 17</strong> for orders below SAR 100</li>
      </ul>

      <h2>⚡ Order Processing</h2>
      <ul>
        <li>Orders placed before <strong>2:00 PM (AST)</strong> on business days ship the <strong>same day</strong></li>
        <li>Orders placed after 2:00 PM ship the <strong>next business day</strong></li>
        <li>Friday orders are processed on Saturday morning</li>
      </ul>

      <h2>📲 Tracking Your Order</h2>
      <ul>
        <li>You'll receive a <strong>WhatsApp notification</strong> once your order is dispatched</li>
        <li>A <strong>tracking number and link</strong> (Aramex or SMSA) will be sent to your phone</li>
        <li>You can also track from <em>My Account → Orders</em> in the app</li>
      </ul>

      <h2>🚪 Failed Delivery Attempts</h2>
      <ul>
        <li>The courier will attempt delivery <strong>2 times</strong></li>
        <li>If unavailable, a notification will be sent and a pickup window offered</li>
        <li>Uncollected orders are returned to us after 5 days — contact us to rearrange</li>
      </ul>

      <h2>📮 Address Requirements</h2>
      <ul>
        <li>Please ensure your <strong>full Saudi address</strong> is correct (street, city, postal code)</li>
        <li>Including your <strong>Google Maps location or Wasl address</strong> speeds up delivery significantly</li>
        <li>We do not currently deliver to P.O. Boxes</li>
      </ul>

      <h2>❓ Order Delayed?</h2>
      <p>If your order hasn't arrived within the expected window, WhatsApp us at <strong>+966 546 224 029</strong> with your order number. We'll investigate and update you within 4 hours.</p>
    `},
    ar: { title: 'سياسة الشحن', body: `
      <div class="info-card">🚚 نوصل إلى <strong>جميع مناطق المملكة العربية السعودية</strong> عبر <strong>Aramex</strong> و <strong>SMSA Express</strong>.</div>

      <h2>⏱️ مواعيد التسليم</h2>
      <ul>
        <li>🏙️ <strong>الرياض، جدة، الدمام، مكة، المدينة:</strong> 1–2 يوم عمل</li>
        <li>🌆 <strong>الطائف، أبها، الخبر، تبوك، حائل:</strong> 2–3 أيام عمل</li>
        <li>🌄 <strong>المناطق النائية والريفية:</strong> 3–5 أيام عمل</li>
      </ul>
      <p style="color:#888;font-size:12px">⚠️ أيام العمل لا تشمل يوم الجمعة والإجازات الرسمية السعودية.</p>

      <h2>💰 رسوم الشحن</h2>
      <ul>
        <li>🎉 <strong>شحن مجاني</strong> للطلبات فوق <strong>100 ريال</strong></li>
        <li>📦 الشحن العادي: <strong>17 ريال</strong> للطلبات أقل من 100 ريال</li>
      </ul>

      <h2>⚡ معالجة الطلبات</h2>
      <ul>
        <li>الطلبات قبل <strong>2:00 مساءً</strong> تُشحن في <strong>نفس اليوم</strong></li>
        <li>طلبات الجمعة تُعالج صباح السبت</li>
      </ul>

      <h2>📲 تتبع طلبك</h2>
      <ul>
        <li>ستصلك رسالة <strong>واتساب</strong> فور شحن طلبك مع رقم التتبع</li>
        <li>يمكنك التتبع من <em>حسابي ← الطلبات</em></li>
      </ul>

      <h2>📮 متطلبات العنوان</h2>
      <ul>
        <li>تأكد من صحة <strong>عنوانك السعودي الكامل</strong> (الشارع، المدينة، الرمز البريدي)</li>
        <li>إضافة <strong>موقع Google Maps أو عنوان وصل</strong> يسرّع التوصيل</li>
        <li>لا نوصل حالياً إلى صناديق البريد</li>
      </ul>
    `},
    bn: { title: 'শিপিং পলিসি', body: `
      <div class="info-card">🚚 <strong>Aramex</strong> ও <strong>SMSA Express</strong>-এর মাধ্যমে <strong>সৌদি আরবের সব অঞ্চলে</strong> ডেলিভারি দিই।</div>

      <h2>⏱️ ডেলিভারির সময়</h2>
      <ul>
        <li>🏙️ <strong>রিয়াদ, জেদ্দা, দাম্মাম, মক্কা, মদিনা:</strong> ১–২ কর্মদিবস</li>
        <li>🌆 <strong>তায়েফ, আভা, খোবর, তাবুক:</strong> ২–৩ কর্মদিবস</li>
        <li>🌄 <strong>দূরবর্তী এলাকা:</strong> ৩–৫ কর্মদিবস</li>
      </ul>
      <p style="color:#888;font-size:12px">⚠️ শুক্রবার ও সৌদি সরকারি ছুটির দিন কর্মদিবস নয়।</p>

      <h2>💰 শিপিং চার্জ</h2>
      <ul>
        <li>🎉 SAR ১০০-এর উপরে অর্ডারে <strong>ফ্রি শিপিং</strong></li>
        <li>📦 SAR ১০০-এর নিচে: <strong>SAR ১৭</strong></li>
      </ul>

      <h2>⚡ অর্ডার প্রক্রিয়াকরণ</h2>
      <ul>
        <li>দুপুর <strong>২টার আগে</strong> অর্ডার দিলে <strong>একই দিনে</strong> শিপ হবে</li>
        <li>শুক্রবারের অর্ডার শনিবার সকালে প্রক্রিয়া করা হয়</li>
      </ul>

      <h2>📲 অর্ডার ট্র্যাকিং</h2>
      <ul>
        <li>শিপমেন্টের পর <strong>WhatsApp-এ ট্র্যাকিং নম্বর ও লিংক</strong> পাঠানো হবে (Aramex বা SMSA)</li>
        <li><em>আমার অ্যাকাউন্ট → অর্ডার</em>-এও ট্র্যাক করা যাবে</li>
      </ul>

      <h2>📮 সঠিক ঠিকানার প্রয়োজনীয়তা</h2>
      <ul>
        <li>পূর্ণ সৌদি ঠিকানা (রাস্তা, শহর, পোস্টাল কোড) সঠিক দিন</li>
        <li><strong>Google Maps লোকেশন বা Wasl ঠিকানা</strong> যোগ করলে ডেলিভারি দ্রুত হয়</li>
        <li>P.O. Box-এ বর্তমানে ডেলিভারি নেই</li>
      </ul>

      <h2>❓ ডেলিভারিতে দেরি হলে?</h2>
      <p>অর্ডার নম্বর সহ <strong>+966 546 224 029</strong>-এ WhatsApp করুন। ৪ ঘণ্টার মধ্যে আপডেট দেওয়া হবে।</p>
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
            <button class="trash-btn" onclick="removeFromWishlist(${id})" title="Remove">
              <div class="trash__wrap">
                <div class="trash__lid"></div>
                <div class="trash__body">
                  <div class="trash__lines"><span></span><span></span><span></span></div>
                </div>
              </div>
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

/* ===== PRODUCT PAGE NOON-STYLE HELPERS ===== */
function _pdServiceRow() {
  const now = new Date(); const tmr = new Date(now); tmr.setDate(now.getDate()+1);
  const mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][tmr.getMonth()];
  const ds = `${tmr.getDate()} ${mn}`;
  return `<div class="pd-svc-row">
    <div class="pd-svc-chip"><span class="pd-svc-ico"><i class="fas fa-truck-fast"></i></span><span>Delivery<br>by <b>${ds}</b></span></div>
    <div class="pd-svc-chip"><span class="pd-svc-ico"><i class="fas fa-medal"></i></span><span>High Rated<br>Seller</span></div>
    <div class="pd-svc-chip"><span class="pd-svc-ico"><i class="fas fa-rotate-left"></i></span><span>Easy<br>Returns</span></div>
    <div class="pd-svc-chip"><span class="pd-svc-ico"><i class="fas fa-money-bill-wave"></i></span><span>Cash on<br>Delivery</span></div>
    <div class="pd-svc-chip"><span class="pd-svc-ico"><i class="fas fa-shield-halved"></i></span><span>2 Year<br>Warranty</span></div>
  </div>`;
}
function _pdDelivCard() {
  const now = new Date(); const tmr = new Date(now); tmr.setDate(now.getDate()+1);
  const dayN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][tmr.getDay()];
  const mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][tmr.getMonth()];
  const ds = `${dayN}, ${mn} ${tmr.getDate()}`;
  const h = 20 - now.getHours(); const m = 60 - now.getMinutes();
  const timer = h > 0 ? `Order in ${h}h ${m > 0 ? m+'m' : ''}` : 'Order now for express delivery';
  return `<div class="pd-deliv lux-reveal">
    <div class="pd-deliv-title">Delivery Information</div>
    <div class="pd-deliv-row">
      <span class="pd-express-badge">express</span>
      <div>
        <div class="pd-deliv-date">Get it by <strong>${ds}</strong></div>
        <div class="pd-deliv-timer">${timer}</div>
      </div>
    </div>
  </div>`;
}
function _pdAddInfoCard(p) {
  const cat = p.category||'';
  const cats = PRODUCTS.filter(x=>x.category===cat).sort((a,b)=>(b.ratingCount||0)-(a.ratingCount||0));
  const rank = cats.findIndex(x=>x.id===p.id)+1;
  const bsRow = rank>0&&rank<=5&&(p.ratingCount||0)>=200
    ?`<div class="pd-ai-row pd-ai-bs"><span class="pd-ai-row-ico" style="background:#ede7f6;color:#7c3aed"><i class="fas fa-trophy"></i></span><span>Best Seller #${rank} in <strong>${cat}</strong></span><i class="fas fa-chevron-right pd-ai-arr"></i></div>`:'' ;
  const brandLogo = ((p.brand||'EX')[0]||'E').toUpperCase();
  return `<div class="pd-addinfo lux-reveal">
    <div class="pd-addinfo-title">Additional Information</div>
    <div class="pd-addinfo-list">
      <div class="pd-ai-row"><span class="pd-ai-row-ico"><i class="fas fa-truck-fast"></i></span><span>Free delivery on Lockers & Pickup Points</span><i class="fas fa-chevron-right pd-ai-arr"></i></div>
      <div class="pd-ai-row"><span class="pd-ai-row-ico"><i class="fas fa-shield-halved"></i></span><span>2 year warranty included</span><i class="fas fa-chevron-right pd-ai-arr"></i></div>
      <div class="pd-ai-row"><span class="pd-ai-row-ico"><i class="fas fa-rotate-left"></i></span><span>Easy and Hassle Free Returns</span><i class="fas fa-chevron-right pd-ai-arr"></i></div>
      ${bsRow}
      <div class="pd-ai-row pd-ai-seller-row"><div class="pd-ai-seller-logo">${brandLogo}</div><div class="pd-ai-seller-info"><div>Sold by <strong>${p.brand||'EX GLOBAL Store'}</strong></div><div class="pd-ai-seller-meta"><i class="fas fa-star pd-ai-star"></i> 4.8 &middot; <span class="pd-ai-pos">92% Positive</span> Seller Ratings</div></div><i class="fas fa-chevron-right pd-ai-arr"></i></div>
      <div class="pd-ai-pills"><span class="pd-ai-pill"><i class="fas fa-box-open"></i> Item as shown 95%</span><span class="pd-ai-pill"><i class="fas fa-handshake"></i> Partner 3+ Years</span><span class="pd-ai-pill"><i class="fas fa-arrow-trend-down"></i> Low return seller</span><span class="pd-ai-pill"><i class="fas fa-thumbs-up"></i> Great recent rating</span></div>
      <div class="pd-ai-row pd-ai-more"><span class="pd-ai-row-ico pd-ai-tag-ico"><i class="fas fa-tag"></i></span><span>More offers from other sellers</span><i class="fas fa-chevron-right pd-ai-arr"></i></div>
    </div>
  </div>`;
}
function _pdRatingsCard(p) {
  if (!p.rating||!p.ratingCount||p.ratingCount<10) return '';
  const r=p.rating,c=p.ratingCount;
  const fullS=Math.floor(r),halfS=r-fullS>=.5;
  const starH=Array.from({length:5},(_,i)=>i<fullS?'<i class="fas fa-star pd-rv-star"></i>':i===fullS&&halfS?'<i class="fas fa-star-half-stroke pd-rv-star"></i>':'<i class="far fa-star pd-rv-star"></i>').join('');
  const bullets=[`Customers consistently praise the quality and value of this ${p.category||'product'}.`,`Fast delivery and authentic packaging are frequently highlighted in reviews.`,`Most buyers on EX GLOBAL highly recommend this item.`];
  const names=['Ahmed A.','Sara M.'];
  const texts=['Amazing product! Exactly as described. Fast delivery and excellent quality.','Very satisfied with my purchase. The product matches the photos perfectly.'];
  const revH=Array.from({length:2},(_,i)=>`<div class="pd-rv-item"><div class="pd-rv-item-head"><span class="pd-rv-name">${names[i]}</span><span class="pd-rv-verified"><i class="fas fa-circle-check"></i> Verified Purchase</span></div><div class="pd-rv-item-meta">${Array.from({length:5},()=>'<i class="fas fa-star" style="color:#22a74f;font-size:11px"></i>').join('')}<span class="pd-rv-ago"> · 2 months ago</span></div><div class="pd-rv-text">${texts[i]}</div></div>`).join('');
  return `<div class="pd-ratings lux-reveal">
    <div class="pd-rv-title">Ratings & Reviews</div>
    <div class="pd-rv-overview"><span class="pd-rv-bignum">${r}</span><div><div>${starH}</div><div class="pd-rv-sub">Avg. rating based on ${c.toLocaleString()} ratings from trusted sources</div></div></div>
    <div class="pd-rv-ai-box"><div class="pd-rv-ai-label">${Math.min(c,3718).toLocaleString()} reviews, summarised by EX AI <span class="pd-rv-sparkle">✦</span></div><ul class="pd-rv-bullets">${bullets.map(b=>`<li>${b}</li>`).join('')}</ul></div>
    ${revH}
    <div class="pd-rv-see-all">All reviews (${c.toLocaleString()}) <i class="fas fa-chevron-right"></i></div>
  </div>`;
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
        <img class="modal-img" id="mgalMain" src="${allImgs[0]}" alt="" onclick="_openImgZoom(this.src)" style="cursor:zoom-in" />
        <div class="modal-thumbs">
          ${allImgs.map((u, i) => `<img class="modal-thumb${i===0?' active':''}" src="${u}" onclick="switchGalleryImg(${i})" loading="lazy"/>`).join('')}
        </div>
       </div>`
    : `<img class="modal-img" src="${p.image}" alt="" onclick="_openImgZoom(this.src)" style="cursor:zoom-in" />`;

  document.getElementById('modalBody').innerHTML = `
<div class="lux-modal-wrap">

  <div class="lux-gallery" id="luxGal">
    <div class="lux-slides" id="luxSlides">
      ${allImgs.map((u,i)=>`<div class="lux-slide" data-idx="${i}"><img src="${u}" alt="" loading="${i===0?'eager':'lazy'}" onclick="_openImgZoom(this.src)"/></div>`).join('')}
    </div>
    <div class="lux-dots" id="luxDots" ${allImgs.length>1?'style="display:none"':''}>
      ${allImgs.map((_,i)=>`<span class="lux-dot${i===0?' active':''}" onclick="_luxGotoSlide(${i})"></span>`).join('')}
    </div>
    <button class="lux-gal-back" onclick="closeModal()"><i class="fas fa-arrow-left"></i></button>
    <button class="lux-gal-share" onclick="shareProduct(${id})"><i class="fas fa-share-nodes"></i></button>
    <button class="lux-gal-wish ${inWish?'active':''}" id="luxGalWish" onclick="modalToggleWish(${p.id})"><i class="${inWish?'fas':'far'} fa-heart"></i></button>
    ${allImgs.length>1?`<div class="lux-img-count"><span id="luxImgCurr">1</span>/${allImgs.length}</div>`:''}
    ${(()=>{
      const leftB = p.discount>0
        ? `<div class="lux-hb lux-hb-discount"><i class="fas fa-tag"></i> -${p.discount}% OFF TODAY</div>` : '';
      const rightB = (p.stock!==undefined&&p.stock<=5&&p.stock>0)
        ? `<div class="lux-hb lux-hb-stock">⚡ Only ${p.stock} left!</div>`
        : p.sold ? `<div class="lux-hb lux-hb-sold"><i class="fas fa-fire"></i> ${String(p.sold).replace(/\++$/,'')}+ sold</div>` : '';
      return (leftB||rightB) ? `<div class="lux-hero-badges">${leftB}<span style="flex:1"></span>${rightB}</div>` : '';
    })()}
  </div>
  ${allImgs.length>1?`
  <div class="lux-thumbs" id="luxThumbs">
    ${allImgs.map((u,i)=>`<div class="lux-thumb-item${i===0?' active':''}" onclick="_luxGotoSlide(${i})"><img src="${u}" loading="lazy"/></div>`).join('')}
  </div>`:''}

  <div class="lux-info-card lux-reveal">
    <div class="lux-brand-row">
      <span class="lux-category-pill">${p.category?p.category.toUpperCase():'PREMIUM'}</span>
      ${p.discount>=30?`<span class="lux-hot-pill">🔥 HOT</span>`:''}
    </div>
    <h2 class="lux-product-name">${getName(p)}</h2>
    <div class="lux-prices-row">
      <span class="lux-price-current">${fmt(p.price)}</span>
      ${p.discount>0?`<span class="lux-price-orig">${fmt(p.originalPrice||Math.round(p.price/(1-p.discount/100)))}</span><span class="lux-discount-badge">-${p.discount}%</span><span class="lux-save-badge">Save ${fmt((p.originalPrice||Math.round(p.price/(1-p.discount/100)))-p.price)}</span>`:''}
      <span class="lux-coupon-chip" onclick="_openCouponSheet()">${t('withCoupon')||'with coupon'} <i class="fas fa-chevron-right"></i></span>
    </div>

    <!-- Offers scroll row -->
    <div class="lux-offers-row">
      ${p.discount?`<div class="lux-offer-pill"><i class="fas fa-tag"></i> ${p.discount}% OFF TODAY</div>`:''}
      <div class="lux-offer-pill"><i class="fas fa-truck-fast"></i> ${t('freeShipChip')||'Free Ship ≥ SAR 99'}</div>
      <div class="lux-offer-pill" onclick="_openCouponSheet()"><i class="fas fa-ticket"></i> ${t('codeLabel')||'Code'}: WELCOME10</div>
      <div class="lux-offer-pill" onclick="_openCouponSheet()"><i class="fas fa-gift"></i> ${t('codeLabel')||'Code'}: BDAY10</div>
    </div>

    ${p.rating||p.ratingCount?`<div class="lux-rating-row">
      <span class="lux-stars">★</span>
      <span class="lux-rating-num">${p.rating||'4.8'}</span>
      <span class="lux-rating-count">(${(p.ratingCount||0).toLocaleString()})</span>
      ${p.sold?`<span class="lux-dot-sep">·</span><span class="lux-sold-count">🔥 ${String(p.sold).replace(/\++$/,'')}+ sold</span>`:''}
    </div>`:''}

    <!-- Bestseller badge -->
    ${(()=>{
      const catProds = PRODUCTS.filter(x=>x.category===p.category).sort((a,b)=>b.ratingCount-a.ratingCount);
      const rank = catProds.findIndex(x=>x.id===p.id)+1;
      if(rank>0&&rank<=5&&p.ratingCount>=200){
        const avatarSeeds = [p.id+10, p.id+23, p.id+37];
        return `<div class="lux-bestseller-row">
          <span class="lux-bs-trophy">🏆</span>
          <span class="lux-bs-text">#${rank} ${t('bestsellerIn')||'Bestseller in'} <b>${p.category||''}</b></span>
          <div class="lux-bs-avatars">${avatarSeeds.map(s=>`<img src="https://i.pravatar.cc/28?img=${s%70}" class="lux-bs-av" loading="lazy">`).join('')}</div>
        </div>`;
      }
      return '';
    })()}

    <div class="lux-meta-row">
      <div class="lux-viewing-chip"><span class="lux-view-pulse"></span><span><b>${15+((p.id*7+(p.ratingCount||100))%70)}</b> ${t('viewingNow')||'viewing now'}</span></div>
      ${p.stock===0
        ?`<div class="lux-stock-chip out"><i class="fas fa-times-circle"></i> ${t('outOfStock')}</div>`
        :p.stock!==undefined&&p.stock<=5
          ?`<div class="lux-stock-chip low"><i class="fas fa-fire"></i> ${t('lowStock').replace('{n}',p.stock)}</div>`
          :`<div class="lux-stock-chip ok"><i class="fas fa-check-circle"></i> ${t('inStockLabel')||'In Stock'}</div>`}
    </div>
  </div>

  <div class="pd-pay-strip lux-reveal">
    <div class="pd-pay-lbl"><i class="fas fa-lock"></i> Secure Payments</div>
    <div class="pd-pay-logos">
      <img src="assets/payment/visa.svg" class="pd-pml" alt="Visa" loading="lazy">
      <img src="assets/payment/mastercard.svg" class="pd-pml" alt="Mastercard" loading="lazy">
      <img src="assets/payment/mada.svg" class="pd-pml" alt="Mada" loading="lazy">
      <img src="assets/payment/applepay.svg" class="pd-pml" alt="Apple Pay" loading="lazy">
      <img src="assets/payment/googlepay.svg" class="pd-pml" alt="Google Pay" loading="lazy">
      <img src="assets/payment/stcpay.svg" class="pd-pml" alt="STC Pay" loading="lazy">
      <img src="assets/payment/tabby.svg" class="pd-pml" alt="Tabby" loading="lazy">
      <img src="assets/payment/tamara.svg" class="pd-pml" alt="Tamara" loading="lazy">
      <img src="assets/payment/binancepay.svg" class="pd-pml" alt="Binance Pay" loading="lazy">
    </div>
  </div>

  ${_pdServiceRow()}

  ${_pdDelivCard()}

  ${p.sizes&&p.sizes.length>0?`
  <div class="lux-section lux-reveal">
    <div class="lux-section-header">
      <span class="lux-section-title">${t('sizeSelect')||'Select Size'}</span>
      <div class="lux-size-guide-btns">
        <button class="lux-size-guide-btn" onclick="openSizeGuide('${p.category}')"><i class="fas fa-ruler"></i> ${t('sizeGuide')||'Size Guide'}</button>
        <button class="lux-size-guide-btn" onclick="openSizeGuide('${p.category}')"><i class="fas fa-person"></i> ${t('checkMySize')||'Check My Size'}</button>
      </div>
    </div>
    <div class="lux-size-grid">
      ${p.sizes.map(s=>`<button class="lux-size-opt${s===selectedSize?' active':''}" onclick="selectSize('${s}',this)">${s}</button>`).join('')}
    </div>
  </div>`:''}

  ${p.colors&&p.colors.length>0?`
  <div class="lux-section lux-reveal">
    <div class="lux-section-header">
      <span class="lux-section-title">${t('colorSelect')||'Select Color'}</span>
      <span class="lux-color-selected-name" id="luxColorName">${p.colorNames?(p.colorNames[0]||''):''}</span>
    </div>
    <div class="lux-color-grid">
      ${p.colors.map((c,i)=>{
        const isHot = i===0 || (p.colors.length>3&&i===p.colors.length-1);
        const hotBadge = isHot ? '<span class="lux-color-hot">HOT</span>' : '';
        return p.colorImages&&p.colorImages[i]
          ?`<div class="lux-color-img-wrap">${hotBadge}<button class="lux-color-img-opt${i===0?' active':''}" onclick="selectColor('${c}',this,${p.id},${i})" data-img="${p.colorImages[i]}" data-name="${p.colorNames?.[i]||''}"><img src="${p.colorImages[i]}" alt="" loading="lazy"/></button></div>`
          :`<div class="lux-color-img-wrap">${hotBadge}<button class="lux-color-opt${i===0?' active':''}" style="--c:${c}" onclick="selectColor('${c}',this,${p.id},-1)"></button></div>`;
      }).join('')}
    </div>
  </div>`:''}

  ${p.video?`<button class="modal-video-btn lux-reveal" onclick="_openProductVideo('${p.video}')"><i class="fas fa-play-circle"></i> ${t('watchVideo')||'Watch Video'}</button>`:''}

  ${videoEmbed?`<div class="lux-section lux-reveal">${videoEmbed}</div>`:''}

  <div class="pd-overview lux-reveal">
    <div class="pd-overview-title">Product Overview</div>
    <div class="lux-accordion">
      ${p.description?`
      <div class="lux-accordion-item">
        <button class="lux-accordion-header" onclick="_luxToggleAccordion(this)">
          <span>Description</span>
          <i class="fas fa-chevron-down lux-chev"></i>
        </button>
        <div class="lux-accordion-body">
          <div class="lux-accordion-content">${p.description.replace(/\n/g,'<br>')}</div>
        </div>
      </div>`:''}
      <div class="lux-accordion-item">
        <button class="lux-accordion-header" onclick="_luxToggleAccordion(this)">
          <span>Highlights</span>
          <i class="fas fa-chevron-down lux-chev"></i>
        </button>
        <div class="lux-accordion-body">
          <div class="lux-accordion-content">
            <p><i class="fas fa-check" style="color:#0ab35c"></i> ${t('freeDeliveryFull')||'Free delivery on orders over SAR 99'}</p>
            <p><i class="fas fa-check" style="color:#0ab35c"></i> ${t('returnDays')||t('trustReturns')||'7-Day Returns'}</p>
            <p><i class="fas fa-check" style="color:#0ab35c"></i> ${t('pctAuthentic')||'100% Authentic'}</p>
          </div>
        </div>
      </div>
      <div class="lux-accordion-item">
        <button class="lux-accordion-header" onclick="_luxToggleAccordion(this)">
          <span>Specifications</span>
          <i class="fas fa-chevron-down lux-chev"></i>
        </button>
        <div class="lux-accordion-body">
          <div class="lux-accordion-content">
            <p><i class="fas fa-lock" style="color:#e91e8c"></i> SSL encrypted checkout</p>
            <p><i class="fas fa-credit-card" style="color:#e91e8c"></i> Visa, Mastercard, Apple Pay, STC Pay</p>
            <p><i class="fas fa-shield-halved" style="color:#e91e8c"></i> Buyer protection on all orders</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  ${p.stock!==0?`
  <div class="lux-section lux-reveal">
    <div class="lux-section-title-full">💰 ${t('bundleSave')||'Bundle & Save More'}</div>
    <div class="lux-bundle-row">
      <div class="lux-bundle-opt active" onclick="setBundleQty(1,${p.id},this)">
        <span class="lux-bq">×1</span><span class="lux-bl">${t('bundleOne')||'Regular'}</span>
      </div>
      <div class="lux-bundle-opt" onclick="setBundleQty(2,${p.id},this)">
        <span class="lux-bq">×2</span><span class="lux-bl">${t('bundleOffPct10')||'10% off'}</span>
      </div>
      <div class="lux-bundle-opt best" onclick="setBundleQty(3,${p.id},this)">
        <span class="lux-bq">×3</span><span class="lux-bl">🔥 ${t('bundleBest')||'Best'}</span><span class="lux-bsave">${t('bundleOffPct15')||'15% off'}</span>
      </div>
    </div>
    <div class="lux-qty-row" style="display:none">
      <span class="lux-qty-label">${t('qtyLabel')||'Quantity'}</span>
      <div class="lux-qty-ctrl">
        <button class="lux-qbtn" onclick="changeModalQty(-1,${p.id})"><i class="fas fa-minus"></i></button>
        <span class="lux-qnum">1</span>
        <button class="lux-qbtn" onclick="changeModalQty(1,${p.id})"><i class="fas fa-plus"></i></button>
      </div>
      <span class="lux-qty-total" id="modalQtyPrice">${fmt(p.price)}</span>
    </div>
  </div>`:''}

  ${(()=>{const av=Object.entries(_allCoupons()).filter(([c])=>!isCouponUsed(c));return av.length?`<div class="lux-coupon-strip lux-reveal" onclick="openPdCoupons()"><i class="fas fa-percent lux-coupon-icon"></i><span>Extra ${av[0][1].pct}% off — Code: <b>${av[0][0]}</b></span><i class="fas fa-chevron-right"></i></div>`:''})()}

  ${_pdAddInfoCard(p)}

  ${_fbtHTML(p)}
  ${_pdRatingsCard(p)}
  ${_qaHTML(p)}
  ${_relatedHTML(p)}

  <div class="lux-share-bar lux-reveal">
    <span class="lux-share-url">${shareUrl}</span>
    <div class="lux-share-actions">
      <button class="lux-share-wa" onclick="window.open('https://wa.me/?text='+encodeURIComponent(document.title+' '+location.href),'_blank')"><i class="fab fa-whatsapp"></i></button>
      <button class="lux-share-copy" onclick="shareProduct(${id})"><i class="fas fa-copy"></i> ${t('copyCode')||'Copy'}</button>
    </div>
  </div>

  <div style="height:90px"></div>
</div>

${p.stock!==0?`
<div class="lux-atc-bar" id="luxAtcBar">
  <div class="lux-trust-strip">
    <div class="lux-trust-strip-inner">
      <span class="lux-trust-pill">🔥 ${t('sellingFast')||'Selling Fast'}</span><span class="lux-sep">·</span>
      <span class="lux-trust-pill">⚡ ${t('limitedStock')||'Limited Stock'}</span><span class="lux-sep">·</span>
      <span class="lux-trust-pill">🛡 ${t('securePayment')||'Secure Checkout'}</span><span class="lux-sep">·</span>
      <span class="lux-trust-pill">🚚 ${t('trustDelivery')||'Fast Delivery'}</span><span class="lux-sep">·</span>
      <span class="lux-trust-pill">🔥 ${t('sellingFast')||'Selling Fast'}</span><span class="lux-sep">·</span>
      <span class="lux-trust-pill">⚡ ${t('limitedStock')||'Limited Stock'}</span><span class="lux-sep">·</span>
      <span class="lux-trust-pill">🛡 ${t('securePayment')||'Secure Checkout'}</span><span class="lux-sep">·</span>
      <span class="lux-trust-pill">🚚 ${t('trustDelivery')||'Fast Delivery'}</span><span class="lux-sep">·</span>
    </div>
  </div>
  <div class="lux-atc-btns">
    <button class="lux-atc-wish ${inWish?'active':''}" id="luxAtcWish" onclick="modalToggleWish(${p.id})"><i class="${inWish?'fas':'far'} fa-heart"></i></button>
    <div class="atc-qty-stepper">
      <button class="atc-qty-btn" onclick="changeModalQty(-1,${p.id})"><i class="fas fa-minus"></i></button>
      <span class="atc-qty-num" id="modalQtyNum">1</span>
      <button class="atc-qty-btn atc-qty-plus" onclick="changeModalQty(1,${p.id})"><i class="fas fa-plus"></i></button>
    </div>
    <button class="lux-atc-main" id="luxAtcMain" onclick="_luxAddCart(${p.id})">
      <span class="lux-atc-default"><i class="fas fa-bag-shopping"></i> ${t('addToCart')||'Add to Cart'}</span>
      <span class="lux-atc-loading" style="display:none"><i class="fas fa-spinner fa-spin"></i></span>
      <span class="lux-atc-done" style="display:none"><i class="fas fa-check"></i> ${t('addedTxt')||'Added!'}</span>
    </button>
    <button class="lux-atc-now lux-buynow" onclick="buyNow(${p.id})"><i class="fas fa-bolt"></i><span>${t('buyNow')||'Buy Now'}</span></button>
  </div>
</div>`:`
<div class="lux-atc-bar" id="luxAtcBar">
  <div class="lux-atc-btns">
    <button class="lux-atc-main lux-atc-oos" disabled><i class="fas fa-times-circle"></i> ${t('outOfStock')||'Out of Stock'}</button>
    <button class="lux-notify-btn" onclick="notifyStock(${p.id})"><i class="fas fa-bell"></i> ${t('notifyBack')||'Notify Me'}</button>
  </div>
</div>`}
  `
  _trackView(id);
  history.replaceState({}, '', '?p=' + id);
  document.getElementById('productModal').classList.add('open');
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  _luxModalReady(allImgs);
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
  document.body.classList.remove('modal-open');
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
  document.querySelectorAll('.lux-size-opt, .size-opt').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}
function selectColor(color, el, productId, imgIdx) {
  selectedColor = color;
  document.querySelectorAll('.lux-color-opt, .lux-color-img-opt, .color-opt, .color-img-opt').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  // Update color name label
  const nameEl = document.getElementById('luxColorName') || document.getElementById('colorSelectedLabel');
  if (nameEl) nameEl.textContent = el.dataset.name || '';
  // If image thumbnail selected, scroll gallery to that image
  if (imgIdx >= 0) {
    const imgSrc = el.dataset.img;
    if (imgSrc) _luxGotoSlide(imgIdx);
  }
}
function modalToggleWish(id) {
  toggleWish(id, null);
  const isNowWished = wishlist.includes(id);
  ['luxGalWish','luxAtcWish'].forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.toggle('active', isNowWished);
    btn.querySelector('i').className = isNowWished ? 'fas fa-heart' : 'far fa-heart';
  });
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

function buyNow(id) {
  modalAddCart(id);
  setTimeout(openCart, 650);
}

/* ===== COUPON SYSTEM ===== */
const COUPONS = {
  'WELCOME10': { pct: 10, oneTime: true },
  'BDAY10':    { pct: 10, oneTime: false }
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
  if (!currentUser) {
    closePayment();
    showToast('🔒 ' + (t('loginRequired') || 'Please sign in to place your order'));
    setTimeout(openAuth, 400);
    return;
  }
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
  // Clear any previously stored trend circle media
  localStorage.removeItem('exg_trend_content');
  const wrap = document.querySelector('.bot-center-btn .bot-icon-wrap');
  if (!wrap) return;
  // Ensure lightning icon is visible
  const icon = wrap.querySelector('i');
  if (icon) icon.style.display = '';
  wrap.querySelectorAll('video, img.trend-circle-img, .trend-circle-overlay').forEach(el => el.remove());
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
  const btns = [...document.querySelectorAll('.bot-btn')];
  const idx = btns.indexOf(el);
  btns.forEach(b => b.classList.remove('active'));
  el.classList.add('active');

  // macOS dock magnification — active icon bounces, neighbours ripple
  btns.forEach((btn, i) => {
    const wrap = btn.querySelector('.bot-icon-wrap');
    if (!wrap) return;
    const dist = Math.abs(i - idx);
    if (dist === 0) {
      wrap.style.setProperty('--ds', '1.4');
      wrap.style.setProperty('--dt', '-12px');
    } else if (dist === 1) {
      wrap.style.setProperty('--ds', '1.15');
      wrap.style.setProperty('--dt', '-5px');
    } else {
      wrap.style.setProperty('--ds', '1');
      wrap.style.setProperty('--dt', '0px');
    }
  });

  // Settle active icon to elevated resting position
  setTimeout(() => {
    const activeWrap = el.querySelector('.bot-icon-wrap');
    if (activeWrap) {
      activeWrap.style.setProperty('--ds', '1.18');
      activeWrap.style.setProperty('--dt', '-6px');
    }
    // Reset neighbours
    btns.forEach((btn, i) => {
      if (i === idx) return;
      const wrap = btn.querySelector('.bot-icon-wrap');
      wrap?.style.removeProperty('--ds');
      wrap?.style.removeProperty('--dt');
    });
  }, 320);
}

/* ===== TOAST ===== */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show';
  setTimeout(() => toast.className = 'toast', 2600);
}

/* ===== COUPON SHEET ===== */
function _openCouponSheet() {
  // Remove any existing sheet
  const old = document.getElementById('couponSheetEl');
  if (old) old.remove();

  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const cur = T.currency || 'SAR ';
  const rate = T.rate || 1;
  const coupons = [
    { code: 'WELCOME10', pct: 10, desc: '10% off your first order', note: 'New customers only · One-time use' },
    { code: 'BDAY10',    pct: 10, desc: '10% off on your birthday', note: 'Applies on your birthday — use every year' },
  ];

  const el = document.createElement('div');
  el.id = 'couponSheetEl';
  el.innerHTML = `
    <div class="coupon-sheet-overlay" onclick="_closeCouponSheet()"></div>
    <div class="coupon-sheet" id="csSheet">
      <div class="coupon-sheet-handle"></div>
      <div class="coupon-sheet-title">🏷️ Coupons &amp; Offers</div>
      <div class="coupon-sheet-input-row">
        <input type="text" class="coupon-sheet-input" id="csInput" placeholder="Enter promo code" autocomplete="off"/>
        <button class="coupon-sheet-apply" onclick="_applyCouponFromSheet()">APPLY</button>
      </div>
      <div class="coupon-sheet-label">Available Coupons</div>
      ${coupons.map(c => `
      <div class="coupon-sheet-card" id="csCard-${c.code}" onclick="_applyCouponFromSheet('${c.code}')">
        <div class="cs-card-left">
          <div class="cs-card-code">${c.code}</div>
          <div class="cs-card-desc">${c.desc}</div>
          <div class="cs-card-note">${c.note}</div>
        </div>
        <div class="cs-card-right">
          <button class="cs-apply-btn" id="csBtn-${c.code}">Apply</button>
        </div>
      </div>`).join('')}
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => document.getElementById('csSheet')?.classList.add('open'));
}

function _closeCouponSheet() {
  const el = document.getElementById('couponSheetEl');
  if (!el) return;
  const sheet = document.getElementById('csSheet');
  if (sheet) {
    sheet.classList.remove('open');
    setTimeout(() => el.remove(), 360);
  } else { el.remove(); }
}

function _applyCouponFromSheet(code) {
  const inp = document.getElementById('csInput');
  const codeToApply = code || (inp ? inp.value.trim().toUpperCase() : '');
  if (!codeToApply) { showToast('Enter a coupon code'); return; }
  // Apply to coupon input if cart is visible
  const cf = document.getElementById('couponInput');
  if (cf) cf.value = codeToApply;
  // Try to apply immediately
  if (typeof applyCoupon === 'function') {
    const result = applyCoupon(codeToApply);
    if (result !== false) {
      // Mark applied in sheet
      const btn = document.getElementById('csBtn-' + codeToApply);
      const card = document.getElementById('csCard-' + codeToApply);
      if (btn) { btn.textContent = '✓ Applied'; btn.classList.add('applied'); }
      if (card) card.classList.add('applied');
      setTimeout(_closeCouponSheet, 800);
      return;
    }
  }
  // If cart not open, just copy code and guide user
  navigator.clipboard?.writeText(codeToApply).catch(()=>{});
  showToast('✅ Code ' + codeToApply + ' copied! Paste it in cart.');
  setTimeout(_closeCouponSheet, 1200);
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
  _updateMeStats();
}

function _updateMeStats() {
  const wishEl = document.getElementById('meStat_wish');
  const ordEl  = document.getElementById('meStat_orders');
  const ptsEl  = document.getElementById('meStat_pts');
  if (wishEl) wishEl.textContent = wishlist.length;
  if (ordEl) {
    const allOrders = JSON.parse(localStorage.getItem('exg_orders') || '[]');
    const cnt = currentUser ? allOrders.filter(o => o.customer?.email === currentUser.email).length : 0;
    ordEl.textContent = cnt;
  }
  if (ptsEl) ptsEl.textContent = parseInt(localStorage.getItem('exg_loyalty_pts') || '0');
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
      <button class="mo-order-again-btn" onclick="orderAgain('${o.id}')"><i class="fas fa-rotate-right"></i> ${t('orderAgain')||'Order Again'}</button>
    </div>`;
  }).join('');
  _renderSavedLater();
}

function confirmDelivery(orderId) {
  const orders = JSON.parse(localStorage.getItem('exg_orders') || '[]');
  const o = orders.find(x => x.id === orderId);
  if (!o || o.deliveryConfirmed) return; // already confirmed, block double-tap
  o.deliveryConfirmed = true;
  o.deliveryConfirmedAt = new Date().toISOString();
  _ls.setJSON('exg_orders', orders);
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
  _initBdayPicker(u.birthday || '');
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

function _initBdayPicker(storedDate) {
  // Populate Day options 1–31
  const dayEl = document.getElementById('bdayDay');
  const yearEl = document.getElementById('bdayYear');
  if (!dayEl || !yearEl) return;
  if (dayEl.options.length <= 1) {
    for (let d = 1; d <= 31; d++) {
      const o = document.createElement('option');
      o.value = d; o.textContent = d;
      dayEl.appendChild(o);
    }
  }
  if (yearEl.options.length <= 1) {
    const now = new Date().getFullYear();
    for (let y = now - 5; y >= 1950; y--) {
      const o = document.createElement('option');
      o.value = y; o.textContent = y;
      yearEl.appendChild(o);
    }
  }
  // Set values from stored YYYY-MM-DD
  if (storedDate && storedDate.includes('-')) {
    const [y, m, d] = storedDate.split('-');
    yearEl.value = y;
    document.getElementById('bdayMonth').value = m;
    dayEl.value = parseInt(d, 10);
  } else {
    dayEl.value = ''; document.getElementById('bdayMonth').value = ''; yearEl.value = '';
  }
}

function syncBdayInput() {
  const d = document.getElementById('bdayDay')?.value;
  const m = document.getElementById('bdayMonth')?.value;
  const y = document.getElementById('bdayYear')?.value;
  const hidden = document.getElementById('profileBirthday');
  if (hidden) hidden.value = (d && m && y) ? `${y}-${m}-${String(d).padStart(2,'0')}` : '';
}

function selectGender(g) {
  _selectedGender = g;
  const mBtn = document.getElementById('genderMaleBtn');
  const fBtn = document.getElementById('genderFemaleBtn');
  if (!mBtn || !fBtn) return;
  mBtn.classList.toggle('active-gender', g === 'male');
  fBtn.classList.toggle('active-gender', g === 'female');
}

async function _changeProfilePic() {
  return new Promise(resolve => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => {
      const file = inp.files[0];
      if (!file) return resolve();
      showToast('⏳ Uploading photo…');
      try {
        const blob = await _compressProfileImg(file);
        const fd = new FormData();
        fd.append('file', blob, 'avatar.jpg');
        const res = await fetch('https://telegra.ph/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!Array.isArray(data) || !data[0]?.src) throw new Error('upload failed');
        const url = 'https://telegra.ph' + data[0].src;
        const updated = { ...currentUser, avatar: url };
        setUser(updated);
        const img = document.getElementById('profileAvatarImg');
        const fallback = document.getElementById('profileAvatarFallback');
        if (img) { img.src = url; img.style.display = 'block'; }
        if (fallback) fallback.style.display = 'none';
        showToast('✅ Profile photo updated!');
      } catch(e) {
        showToast('❌ Upload failed — try a smaller photo');
      }
      resolve();
    };
    inp.click();
  });
}

function _compressProfileImg(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
      else       { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => resolve(b), 'image/jpeg', 0.82);
    };
    img.src = url;
  });
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
const _LOC_DEFAULT_LAT = 24.7136, _LOC_DEFAULT_LNG = 46.6753; // Riyadh center
let _locGeocodeTimer = null, _locGeocoding = false;
let _locGpsWatcher = null, _locGpsBestAccuracy = Infinity;
let _gmInstance = null; // Google Maps JS API instance
let _gmUserDot = null;  // Google Maps user location marker

/* ── unified pan helper (works for both Leaflet & Google Maps) ── */
function _locPanTo(lat, lng, zoom) {
  _locCurrLat = lat; _locCurrLng = lng;
  if (_gmInstance) {
    _gmInstance.panTo({ lat, lng });
    if (zoom) _gmInstance.setZoom(zoom);
  } else if (locMap) {
    locMap.setView([lat, lng], zoom || locMap.getZoom());
  }
}

function openLocation() {
  document.getElementById('locOverlay').classList.add('open');
  document.getElementById('locModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  const det = document.getElementById('locDetails');
  if (det) det.style.display = 'none';
  setTimeout(() => { _initLocMap(); }, 350);
  const _retry = () => { if (document.getElementById('locOverlay')?.classList.contains('open') && _locGpsWatcher === null) _locAutoGps(); };
  document.removeEventListener('visibilitychange', _retry);
  document.addEventListener('visibilitychange', _retry);
}

/* ── Google Maps init ── */
function _loadGoogleMapsApi(key, cb) {
  if (window.google?.maps) { cb(); return; }
  if (document.getElementById('_gmScr')) { window._gmCb = cb; return; }
  window._gmCb = cb;
  const s = document.createElement('script');
  s.id = '_gmScr';
  s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geocoding&callback=_gmCb&loading=async`;
  s.async = true; s.defer = true;
  document.head.appendChild(s);
}

function _initGoogleMapInstance() {
  const mapEl = document.getElementById('locMap');
  if (!mapEl || !window.google?.maps) return;
  const defaultLat = savedLocation?.lat || _LOC_DEFAULT_LAT;
  const defaultLng = savedLocation?.lng || _LOC_DEFAULT_LNG;
  _locCurrLat = defaultLat; _locCurrLng = defaultLng;

  _gmInstance = new google.maps.Map(mapEl, {
    center: { lat: defaultLat, lng: defaultLng },
    zoom: savedLocation?.lat ? 17 : 13,
    disableDefaultUI: true,
    gestureHandling: 'greedy',
    clickableIcons: false,
    mapTypeControl: false,
    streetViewControl: false,
  });

  // Lift pin while dragging
  _gmInstance.addListener('dragstart', () => {
    const pin = document.getElementById('locPinWrap');
    if (pin) pin.style.transform = 'translate(-50%,-110%) scale(1.18)';
  });

  // Reverse geocode on drag end
  _gmInstance.addListener('dragend', () => {
    const pin = document.getElementById('locPinWrap');
    if (pin) pin.style.transform = 'translate(-50%,-100%)';
    const c = _gmInstance.getCenter();
    _locCurrLat = c.lat(); _locCurrLng = c.lng();
    _locReverseGeocode(_locCurrLat, _locCurrLng);
  });

  _locReverseGeocode(defaultLat, defaultLng);
}

/* ── Leaflet fallback init ── */
function _initLeafletMap() {
  if (!window.L) { showToast('Map loading…'); setTimeout(_initLeafletMap, 800); return; }
  if (locMap) {
    locMap.invalidateSize();
    if (savedLocation?.lat) {
      const c = locMap.getCenter();
      if (Math.abs(c.lat - savedLocation.lat) + Math.abs(c.lng - savedLocation.lng) > 0.01)
        locMap.panTo([savedLocation.lat, savedLocation.lng]);
    }
    return;
  }
  const defaultLat = savedLocation?.lat || _LOC_DEFAULT_LAT;
  const defaultLng = savedLocation?.lng || _LOC_DEFAULT_LNG;
  _locCurrLat = defaultLat; _locCurrLng = defaultLng;

  locMap = L.map(document.getElementById('locMap'), {
    center: [defaultLat, defaultLng],
    zoom: savedLocation?.lat ? 16 : 13,
    zoomControl: false, attributionControl: false,
  });
  L.tileLayer('https://mt{s}.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
    maxZoom: 21, subdomains: ['0','1','2','3'], attribution: '© Google Maps'
  }).addTo(locMap);

  locMap.on('drag', () => {
    const pin = document.getElementById('locPinWrap');
    if (pin) pin.style.transform = 'translate(-50%,-110%) scale(1.18)';
  });
  locMap.on('moveend', () => {
    const pin = document.getElementById('locPinWrap');
    if (pin) pin.style.transform = 'translate(-50%,-100%)';
    const c = locMap.getCenter();
    _locCurrLat = c.lat; _locCurrLng = c.lng;
    _locReverseGeocode(c.lat, c.lng);
  });
  _locReverseGeocode(defaultLat, defaultLng);
}

function _initLocMap() {
  // If Google Maps API is already loaded and working, use it
  if (_gmInstance) {
    const c = _gmInstance.getCenter();
    if (savedLocation?.lat) _gmInstance.panTo({ lat: savedLocation.lat, lng: savedLocation.lng });
    return;
  }
  const apiKey = (localStorage.getItem('exg_gmaps_key') || '').trim();
  if (apiKey) {
    _loadGoogleMapsApi(apiKey, _initGoogleMapInstance);
  } else {
    _initLeafletMap();
  }
}

let _locUserDot = null;
function _locShowUserDot(lat, lng) {
  if (_gmInstance && window.google?.maps) {
    // Google Maps: blue dot marker
    if (_gmUserDot) _gmUserDot.setMap(null);
    _gmUserDot = new google.maps.Marker({
      position: { lat, lng }, map: _gmInstance,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8, fillColor: '#4285F4', fillOpacity: 1,
        strokeColor: '#fff', strokeWeight: 2,
      },
      zIndex: 1,
    });
    return;
  }
  const addDot = () => {
    if (!locMap || !window.L) return;
    if (_locUserDot) { _locUserDot.remove(); _locUserDot = null; }
    _locUserDot = L.circleMarker([lat, lng], {
      radius: 8, color: '#fff', weight: 2,
      fillColor: '#4285F4', fillOpacity: 1,
    }).addTo(locMap);
  };
  if (locMap && window.L) addDot(); else setTimeout(addDot, 800);
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
  _locPanTo(lat, lng, 17);
  if (!_gmInstance && !locMap) { _initLocMap(); setTimeout(() => _locPanTo(lat, lng, 17), 800); }
}
function _locSelectPlace(placeId, description) {
  // No-op: Google Places replaced by Nominatim search
}

/* GPS helpers */
function _locSetPos(lat, lng, zoom) {
  _locCurrLat = lat; _locCurrLng = lng;
  if (_gmInstance) { _locPanTo(lat, lng, zoom || 17); }
  else if (!locMap) { _initLocMap(); setTimeout(() => _locPanTo(lat, lng, zoom||17), 800); }
  else { _locPanTo(lat, lng, zoom||17); }
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
    // Handle redirect result (Google + Facebook) on page load
    firebase.auth().getRedirectResult().then(result => {
      if (result && result.user) {
        const prov = result.additionalUserInfo && result.additionalUserInfo.providerId === 'facebook.com' ? 'facebook' : 'google';
        setUser({ name: result.user.displayName, email: result.user.email, avatar: result.user.photoURL, uid: result.user.uid, provider: prov });
        closeAuth();
        showToast(t('welcome') + (result.user.displayName || '').split(' ')[0] + '!');
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
  // Reset to login mode on every open
  _authIsLogin = true;
  const nameWrap = document.getElementById('authNameWrap');
  const rememberRow = document.getElementById('authRememberRow');
  if (nameWrap)    nameWrap.style.display    = 'none';
  if (rememberRow) rememberRow.style.display = 'flex';
  const wh = document.getElementById('authWelcomeH');
  const ws = document.getElementById('authWelcomeSub');
  const st = document.getElementById('authSubmitText');
  const stxt = document.getElementById('authSwitchText');
  const sl = document.getElementById('authSwitchLink');
  if (wh) wh.textContent   = 'Welcome Back';
  if (ws) ws.textContent   = 'Sign in to your EX GLOBAL SA account';
  if (st) st.textContent   = 'SIGN IN';
  if (stxt) stxt.textContent = "Don't have an account?";
  if (sl) sl.textContent   = 'Create Account ↗';
  // Start particle system + mouse glow
  setTimeout(_startAuthFX, 80);
  // Mascot wave on open
  const mascot = document.getElementById('authMascot');
  if (mascot) {
    mascot.classList.remove('pw-mode','am-wave');
    void mascot.offsetWidth;
    mascot.classList.add('am-wave');
    // Show speech bubble
    const bubble = document.getElementById('amBubble');
    if (bubble) {
      bubble.classList.add('show');
      setTimeout(() => bubble.classList.remove('show'), 2800);
    }
  }
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
    // Mascot reacts to password fields
    document.querySelectorAll('#authModal input[type="password"]').forEach(inp => {
      inp.addEventListener('focus', () => document.getElementById('authMascot')?.classList.add('pw-mode'), {once:false});
      inp.addEventListener('blur',  () => document.getElementById('authMascot')?.classList.remove('pw-mode'), {once:false});
      // Change bubble text on password focus
      inp.addEventListener('focus', () => {
        const b = document.getElementById('amBubble');
        if (b) { b.textContent = "I won't peek! 🙈"; b.classList.add('show'); }
      }, {once:false});
      inp.addEventListener('blur', () => {
        const b = document.getElementById('amBubble');
        if (b) b.classList.remove('show');
      }, {once:false});
    });
  }, 200);
}

function closeAuth() {
  document.getElementById('authOverlay').classList.remove('open');
  document.getElementById('authModal').classList.remove('open');
  document.body.style.overflow = '';
  _stopAuthFX();
}

/* ══════════════════════════════════════════════
   ✦ AUTH CANVAS PARTICLES + MOUSE GLOW
   ══════════════════════════════════════════════ */
let _authFXRaf = null;
let _authFXBound = null;

function _startAuthFX() {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  /* ── Canvas particle + orb system ── */
  let canvas = document.getElementById('authParticleCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'authParticleCanvas';
    modal.insertBefore(canvas, modal.firstChild);
  }
  const ctx = canvas.getContext('2d');
  const fit = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  fit();
  window.addEventListener('resize', fit);

  // Floating glowing orbs (slow, big, dreamy)
  const orbs = [
    { x: .15, y: .1,  r: .32, c: '#e91e8c', speed: .0004, phase: 0 },
    { x: .82, y: .22, r: .28, c: '#7c3aed', speed: .0003, phase: 2.1 },
    { x: .5,  y: .85, r: .30, c: '#e91e8c', speed: .00035, phase: 4.2 },
    { x: .1,  y: .65, r: .22, c: '#3b82f6', speed: .00045, phase: 1.1 },
    { x: .9,  y: .75, r: .25, c: '#a855f7', speed: .00038, phase: 3.3 },
  ];

  // Small floating particles
  const COLS = ['#e91e8c','#FFD700','#7c3aed','#c084fc','#60a5fa','#f9a8d4','#fff'];
  const pts = Array.from({length: 70}, (_, i) => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 2.2 + 0.4,
    vx: (Math.random() - .5) * .4,
    vy: -(Math.random() * .6 + .15),
    a: Math.random() * .55 + .2,
    c: COLS[i % COLS.length],
    phase: Math.random() * Math.PI * 2,
  }));

  const tick = (t) => {
    if (!modal.classList.contains('open')) { _authFXRaf = null; return; }
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Draw orbs first (behind particles)
    orbs.forEach(o => {
      const ox = Math.cos(t * o.speed + o.phase) * 80;
      const oy = Math.sin(t * o.speed * 1.3 + o.phase) * 60;
      const cx = o.x * W + ox, cy = o.y * H + oy;
      const rad = o.r * Math.min(W, H);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, o.c + '55');
      g.addColorStop(.4, o.c + '25');
      g.addColorStop(1, o.c + '00');
      ctx.globalAlpha = .7 + .3 * Math.sin(t * .0006 + o.phase);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });

    // Draw particles on top
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -8)  { p.y = H + 8; p.x = Math.random() * W; }
      if (p.x < -8 || p.x > W + 8) p.x = Math.random() * W;
      const alpha = p.a * (.6 + .4 * Math.sin(t * .001 + p.phase));
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.c;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    _authFXRaf = requestAnimationFrame(tick);
  };
  _authFXRaf = requestAnimationFrame(tick);

  /* ── Mouse/touch reactive glow ── */
  const onMove = (e) => {
    const r = modal.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    modal.style.setProperty('--mx', ((cx - r.left) / r.width * 100).toFixed(1) + '%');
    modal.style.setProperty('--my', ((cy - r.top) / r.height * 100).toFixed(1) + '%');
  };
  _authFXBound = onMove;
  modal.addEventListener('mousemove', onMove, {passive:true});
  modal.addEventListener('touchmove', onMove, {passive:true});
}

function _stopAuthFX() {
  if (_authFXRaf) { cancelAnimationFrame(_authFXRaf); _authFXRaf = null; }
  const c = document.getElementById('authParticleCanvas');
  if (c) c.remove();
  const modal = document.getElementById('authModal');
  if (modal && _authFXBound) {
    modal.removeEventListener('mousemove', _authFXBound);
    modal.removeEventListener('touchmove', _authFXBound);
    _authFXBound = null;
  }
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
  provider.addScope('email');
  try {
    const result = await firebase.auth().signInWithPopup(provider);
    if (result.user) {
      setUser({ name: result.user.displayName, email: result.user.email, avatar: result.user.photoURL, uid: result.user.uid, provider: 'facebook' });
      closeAuth();
      showToast(t('welcome') + (result.user.displayName || '').split(' ')[0] + '!');
    }
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user' ||
        e.code === 'auth/web-storage-unsupported' || (e.message && e.message.toLowerCase().includes('storage'))) {
      // Popup failed or storage blocked — fall back to redirect
      try {
        const p2 = new firebase.auth.FacebookAuthProvider();
        p2.addScope('email');
        await firebase.auth().signInWithRedirect(p2);
      } catch(e2) {
        showToast('Facebook login unavailable — please use Google login.');
      }
    } else if (e.code === 'auth/operation-not-allowed') {
      showToast(t('facebookNotEnabled'));
    } else if (e.code !== 'auth/cancelled-popup-request') {
      showToast('Facebook login failed — please try Google login instead.');
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

let _authIsLogin = true;

function _showAuthEmailForm() {
  const form = document.getElementById('authEmailForm');
  if (!form) return;
  if (form.style.display === 'none' || !form.style.display) {
    form.style.display = 'block';
    setTimeout(() => form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  } else {
    form.style.display = 'none';
  }
}

function _toggleAuthMode() {
  _authIsLogin = !_authIsLogin;
  const form = document.getElementById('authEmailForm');

  const _applyAuthModeContent = () => {
    const nameWrap    = document.getElementById('authNameWrap');
    const rememberRow = document.getElementById('authRememberRow');
    const welcomeH    = document.getElementById('authWelcomeH');
    const welcomeSub  = document.getElementById('authWelcomeSub');
    const submitText  = document.getElementById('authSubmitText');
    const switchText  = document.getElementById('authSwitchText');
    const switchLink  = document.getElementById('authSwitchLink');
    if (_authIsLogin) {
      if (nameWrap)    nameWrap.style.display    = 'none';
      if (rememberRow) rememberRow.style.display = 'flex';
      if (welcomeH)    welcomeH.textContent      = 'Welcome Back';
      if (welcomeSub)  welcomeSub.textContent    = 'Sign in to your EX GLOBAL SA account';
      if (submitText)  submitText.textContent    = 'SIGN IN';
      if (switchText)  switchText.textContent    = "Don't have an account?";
      if (switchLink)  switchLink.textContent    = 'Create Account ↗';
      _amBubble('Welcome back! 👋', false);
    } else {
      if (nameWrap)    nameWrap.style.display    = 'flex';
      if (rememberRow) rememberRow.style.display = 'none';
      if (welcomeH)    welcomeH.textContent      = 'Create Account';
      if (welcomeSub)  welcomeSub.textContent    = 'Join EX GLOBAL SA for exclusive rewards';
      if (submitText)  submitText.textContent    = 'CREATE ACCOUNT';
      if (switchText)  switchText.textContent    = 'Already have an account?';
      if (switchLink)  switchLink.textContent    = 'Sign In ↗';
      _amBubble("Let's get you set up! ✨", false);
    }
  };

  if (form && form.style.display !== 'none') {
    form.classList.remove('auth-form-slide-in');
    form.classList.add('auth-form-slide-out');
    setTimeout(() => {
      form.classList.remove('auth-form-slide-out');
      _applyAuthModeContent();
      void form.offsetHeight;
      form.classList.add('auth-form-slide-in');
      setTimeout(() => form.classList.remove('auth-form-slide-in'), 420);
    }, 220);
  } else {
    _applyAuthModeContent();
  }
}

function signInManual() {
  const email = (document.getElementById('authEmail')?.value || '').trim();
  const nameInp = document.getElementById('authName');
  const name  = _authIsLogin
    ? (email.split('@')[0].replace(/[^a-zA-Z]/g, '') || 'Member')
    : (nameInp?.value || '').trim();
  if (!_authIsLogin && !name)  { showToast(t('enterName'));       return; }
  if (!email || !email.includes('@')) { showToast(t('enterValidEmail')); return; }
  const btn = document.querySelector('.auth-submit-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait…'; }
  setTimeout(() => {
    setUser({ name, email, avatar: null, provider: 'manual' });
    closeAuth();
    showToast('👋 ' + (t('welcome') || 'Welcome, ') + name.split(' ')[0] + '!');
    const label = _authIsLogin ? 'SIGN IN' : 'CREATE ACCOUNT';
    if (btn) { btn.disabled = false; btn.innerHTML = `<span id="authSubmitText">${label}</span><span class="auth-arrow-circle"><i class="fas fa-arrow-right"></i></span>`; }
  }, 600);
}

/* ===== MASCOT INTERACTIVITY ===== */
function amFocus(type) {
  const mascot = document.getElementById('authMascot');
  if (!mascot) return;
  if (type === 'pw') {
    mascot.classList.add('pw-mode');
    mascot.classList.remove('look-right', 'typing');
    _amBubble("I won't peek! 🙈", true);
    // wire typing jiggle for password field
    _amWireTyping(document.getElementById('authPass'), false);
  } else {
    mascot.classList.remove('pw-mode');
    mascot.classList.add('look-right');
    const msg = type === 'name' ? "What's your name? 😊" : "Enter your email 📧";
    _amBubble(msg, false);
    // wire typing jiggle for email/name field
    const inp = type === 'name' ? document.getElementById('authName') : document.getElementById('authEmail');
    _amWireTyping(inp, true);
  }
}
let _amTypingTimer = null;
function _amWireTyping(inp, addTyping) {
  if (!inp) return;
  inp.oninput = () => {
    const mascot = document.getElementById('authMascot');
    if (!mascot) return;
    if (addTyping) mascot.classList.add('typing');
    clearTimeout(_amTypingTimer);
    _amTypingTimer = setTimeout(() => mascot.classList.remove('typing'), 500);
  };
}
function amBlur() {
  setTimeout(() => {
    const active = document.activeElement;
    if (active && active.closest && active.closest('#authEmailForm')) return;
    const mascot = document.getElementById('authMascot');
    if (!mascot) return;
    mascot.classList.remove('pw-mode', 'look-right', 'typing');
    _amBubble('', false);
  }, 120);
}
function _amBubble(msg, isPw) {
  const bubble = document.getElementById('amBubble');
  if (!bubble) return;
  if (msg) {
    bubble.textContent = msg;
    bubble.style.background = isPw ? 'rgba(148,21,245,.9)' : '#fff';
    bubble.style.color = isPw ? '#fff' : '#333';
    bubble.classList.add('show');
  } else {
    bubble.classList.remove('show');
  }
}
function toggleAuthPw() {
  const inp  = document.getElementById('authPass');
  const icon = document.getElementById('authPwEyeIcon');
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.className = 'fas fa-eye-slash';
    // Reveal = mascot peeks (briefly remove pw-mode)
    const mascot = document.getElementById('authMascot');
    if (mascot) {
      mascot.classList.remove('pw-mode');
      mascot.classList.add('look-right');
      _amBubble('Oops! I peeked 👀', false);
      setTimeout(() => {
        if (document.activeElement === inp) {
          mascot.classList.add('pw-mode');
          mascot.classList.remove('look-right');
          _amBubble("OK OK, covering again 🙈", true);
        }
      }, 1200);
    }
  } else {
    inp.type = 'password';
    icon.className = 'fas fa-eye';
    if (document.activeElement === inp) {
      const mascot = document.getElementById('authMascot');
      if (mascot) { mascot.classList.add('pw-mode'); mascot.classList.remove('look-right'); }
      _amBubble("I won't peek! 🙈", true);
    }
  }
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
      _ls.setJSON('exg_customers', list);
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
    _ls.setJSON('exg_orders', orders);
    if(typeof gtag==='function')gtag('event','purchase',{currency:'SAR',transaction_id:newOrder.id,value:totalSAR,tax:+(totalSAR*0.15).toFixed(2)});
    if(typeof fbq==='function')fbq('track','Purchase',{value:totalSAR,currency:'SAR'});
    _addVipPoints(Math.round(totalSAR) * 10);
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
  if (newOrder) {
    setTimeout(() => _automationFire(newOrder), 500);
    setTimeout(() => _showZatcaInvoice(newOrder.id, totalSAR), 800);
    setTimeout(() => _sendOrderEmail(newOrder), 1200);
    // Push to Firestore so admin sees ALL customer orders
    setTimeout(() => _pushOrderToFirestore(newOrder), 300);
  }
  return newOrder;
}

async function _pushOrderToFirestore(order) {
  try {
    const db = typeof firebase !== 'undefined' && firebase.apps?.length
      ? firebase.firestore() : null;
    if (!db) return;
    await db.collection('orders').doc(order.id).set({
      ...order,
      _savedAt: new Date().toISOString(),
      _source: 'customer_app'
    });
  } catch(e) {}
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
  setTimeout(() => _sendWelcomeEmail(user), 1500);
  // Animate profile card entrance + avatar welcome pulse
  requestAnimationFrame(() => {
    const card = document.querySelector('.me-profile-card');
    if (card) {
      card.classList.remove('anim-out', 'anim-in');
      void card.offsetWidth;
      card.classList.add('anim-in');
      setTimeout(() => card.classList.remove('anim-in'), 700);
    }
    const avatar = document.getElementById('meAvatarWrap');
    if (avatar) {
      avatar.classList.remove('welcome-pulse');
      void avatar.offsetWidth;
      avatar.classList.add('welcome-pulse');
      setTimeout(() => avatar.classList.remove('welcome-pulse'), 1000);
    }
  });
  // Request notification permission after login (silent — only asks once)
  setTimeout(() => requestNotifPermission(), 3000);
  _checkBirthdayWish();
}

function signOut() {
  const card = document.querySelector('.me-profile-card');
  // Ripple effect on whichever sign-out button triggered this
  document.querySelectorAll('[onclick*="signOut"]').forEach(btn => {
    const ripple = document.createElement('span');
    ripple.className = 'auth-signout-ripple';
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 520);
    const icon = btn.querySelector('i');
    if (icon) {
      icon.classList.add('auth-signout-shake');
      setTimeout(() => icon.classList.remove('auth-signout-shake'), 380);
    }
  });
  // Animate profile card out, then actually sign out
  if (card) {
    card.classList.remove('anim-in');
    card.classList.add('anim-out');
    setTimeout(() => {
      currentUser = null;
      localStorage.removeItem('exglobal_user');
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
        firebase.auth().signOut().catch(() => {});
      }
      updateAuthUI(true);
      showToast(t('signedOut'));
    }, 300);
  } else {
    currentUser = null;
    localStorage.removeItem('exglobal_user');
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      firebase.auth().signOut().catch(() => {});
    }
    updateAuthUI();
    showToast(t('signedOut'));
  }
}

function updateAuthUI(animateGuest) {
  const guestEl = document.getElementById('meGuestState');
  const userEl  = document.getElementById('meUserState');
  const signOutItem = document.getElementById('meSignOutItem');
  const drawerSignOut = document.getElementById('drawerSignOutItem');
  const drwUserHero  = document.getElementById('drwUserHero');
  const drwGuestHero = document.getElementById('drwGuestHero');
  if (!guestEl || !userEl) return;
  if (currentUser) {
    guestEl.style.display = 'none';
    userEl.style.display  = 'block';
    if (signOutItem) signOutItem.style.display = 'flex';
    if (drawerSignOut) drawerSignOut.style.display = 'flex';
    // Drawer user hero
    if (drwUserHero) drwUserHero.style.display = 'flex';
    if (drwGuestHero) drwGuestHero.style.display = 'none';
    const drwName = document.getElementById('drwUserName');
    if (drwName) drwName.textContent = (currentUser.name || '').split(' ')[0] || 'there';
    // Drawer avatar
    const drwAvatarImg = document.getElementById('drwAvatarImg');
    const drwInitial   = document.getElementById('drwAvatarInitial');
    if (drwAvatarImg && drwInitial) {
      if (currentUser.avatar) {
        drwAvatarImg.src = currentUser.avatar;
        drwAvatarImg.style.display = 'block';
        drwInitial.style.display = 'none';
      } else {
        drwAvatarImg.style.display = 'none';
        drwInitial.style.display = 'flex';
        drwInitial.textContent = (currentUser.name || '?').charAt(0).toUpperCase();
      }
    }
    // Drawer tier badge
    const drwTier = document.getElementById('drwTierBadge');
    if (drwTier) {
      const _pts = parseInt(localStorage.getItem('exg_loyalty_pts') || '0');
      if (_pts >= 500) {
        drwTier.innerHTML = '<i class="fas fa-crown"></i> Gold Member';
        drwTier.style.background = 'rgba(245,158,11,.15)';
        drwTier.style.color = '#d97706';
        drwTier.style.borderColor = 'rgba(245,158,11,.3)';
      } else if (_pts >= 200) {
        drwTier.innerHTML = '<i class="fas fa-shield-halved"></i> Silver Member';
        drwTier.style.background = 'rgba(156,163,175,.15)';
        drwTier.style.color = '#6b7280';
        drwTier.style.borderColor = 'rgba(156,163,175,.3)';
      } else {
        drwTier.innerHTML = '<i class="fas fa-shield-halved"></i> VIP Member';
        drwTier.style.background = 'rgba(233,30,140,.1)';
        drwTier.style.color = '#e91e8c';
        drwTier.style.borderColor = 'rgba(233,30,140,.2)';
      }
    }

    // Name
    const nameEl = document.getElementById('meUserName');
    if (nameEl) nameEl.textContent = (currentUser.name || '').toUpperCase();

    // Avatar / initial
    const avatarImg = document.getElementById('meUserAvatar');
    const initial   = document.getElementById('meAvatarInitial');
    if (avatarImg && initial) {
      if (currentUser.avatar) {
        avatarImg.src = currentUser.avatar;
        avatarImg.style.display = 'block';
        initial.style.display = 'none';
      } else {
        avatarImg.style.display = 'none';
        initial.style.display   = 'flex';
        initial.textContent = (currentUser.name || '?').charAt(0).toUpperCase();
      }
    }

    // User ID — generate once and persist
    const idKey = 'exg_uid_' + (currentUser.email || 'guest');
    let uid = localStorage.getItem(idKey);
    if (!uid) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      uid = 'CJ' + Array.from({length:7}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
      localStorage.setItem(idKey, uid);
    }
    const idEl = document.getElementById('meUserId');
    if (idEl) idEl.textContent = uid;

    // Level based on order count
    const allOrders = JSON.parse(localStorage.getItem('exg_orders') || '[]');
    const orderCount = currentUser ? allOrders.filter(o=>o.customer?.email===currentUser.email).length : 0;
    const lvEl = document.getElementById('meUserLevel');
    if (lvEl) {
      if (orderCount >= 20) lvEl.textContent = 'LV5';
      else if (orderCount >= 10) lvEl.textContent = 'LV4';
      else if (orderCount >= 5)  lvEl.textContent = 'LV3';
      else if (orderCount >= 2)  lvEl.textContent = 'LV2';
      else lvEl.textContent = 'LV1';
    }

    // Tier (based on loyalty points)
    const pts = parseInt(localStorage.getItem('exg_loyalty_pts') || '0');
    const tierEl = document.getElementById('meUserTier');
    if (tierEl) {
      if (pts >= 500) {
        tierEl.innerHTML = '<i class="fas fa-crown"></i> Gold <i class="fas fa-chevron-right" style="font-size:8px"></i>';
        tierEl.style.background = 'rgba(245,158,11,.2)';
        tierEl.style.color = '#fbbf24';
        tierEl.style.borderColor = 'rgba(245,158,11,.35)';
      } else if (pts >= 200) {
        tierEl.innerHTML = '<i class="fas fa-shield-halved"></i> Silver <i class="fas fa-chevron-right" style="font-size:8px"></i>';
        tierEl.style.background = 'rgba(156,163,175,.18)';
        tierEl.style.color = '#d1d5db';
        tierEl.style.borderColor = 'rgba(156,163,175,.3)';
      } else {
        tierEl.innerHTML = '<i class="fas fa-shield-halved"></i> Free <i class="fas fa-chevron-right" style="font-size:8px"></i>';
        tierEl.style.background = 'rgba(99,179,237,.18)';
        tierEl.style.color = '#90cdf4';
        tierEl.style.borderColor = 'rgba(99,179,237,.3)';
      }
    }

    _updateMeStats();
  } else {
    guestEl.style.display = 'flex';
    userEl.style.display  = 'none';
    if (signOutItem) signOutItem.style.display = 'none';
    if (drawerSignOut) drawerSignOut.style.display = 'none';
    if (drwUserHero) drwUserHero.style.display = 'none';
    if (drwGuestHero) drwGuestHero.style.display = 'block';
    if (animateGuest) {
      requestAnimationFrame(() => {
        guestEl.classList.remove('anim-in');
        void guestEl.offsetWidth;
        guestEl.classList.add('anim-in');
        setTimeout(() => guestEl.classList.remove('anim-in'), 600);
      });
    }
  }
}

function stSignOut(btn) {
  if (!btn) return;

  // Phase 1 — button turns red, icon spins
  btn.classList.add('st-signing-out');
  const txt = document.getElementById('stSignOutTxt');
  if (txt) txt.textContent = 'Signing out…';

  // Add ripple from center
  const rip = document.createElement('span');
  rip.className = 'st-signout-ripple';
  btn.appendChild(rip);
  setTimeout(() => rip.remove(), 600);

  // Phase 2 — settings panel slides out
  setTimeout(() => {
    const panel = document.getElementById('settingsPanel') || document.querySelector('.settings-panel');
    if (panel) panel.classList.add('st-panel-exit');
  }, 300);

  // Phase 3 — actual sign-out after animation
  setTimeout(() => {
    const panel = document.getElementById('settingsPanel') || document.querySelector('.settings-panel');
    if (panel) {
      panel.classList.remove('st-panel-exit');
      // Close settings panel
      if (typeof closeSettings === 'function') closeSettings();
    }
    // Reset button state
    btn.classList.remove('st-signing-out');
    if (txt) txt.setAttribute('data-i18n', 'signOut');
    signOut();
  }, 680);
}

function copyUserId() {
  const uid = document.getElementById('meUserId')?.textContent;
  if (!uid) return;
  navigator.clipboard.writeText(uid).then(() => showToast('✅ User ID copied!'));
}

/* ===== PAYMENT SYSTEM ===== */
const BINANCE_PAY_ID = '1167244565';
const SAR_TO_USDT = 0.267;

let selectedPayMethod = '';
let paypalLoaded = false;

let DELIVERY_SAR = 0;
let FREE_DELIVERY_THRESHOLD_SAR = 0;
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
  if (!currentUser) {
    closeCart();
    showToast('🔒 ' + (t('loginRequired') || 'Please sign in to place your order'));
    setTimeout(openAuth, 400);
    return;
  }
  if (cart.length === 0) { showToast(t('cartEmpty')); return; }
  const stockErr = _cartStockError();
  if (stockErr) { showToast('🚫 ' + stockErr); return; }
  // Address is collected on page 1 of checkout — no redirect needed
  // Close cart first so payment modal appears cleanly without overlap
  const cartSidebarEl = document.getElementById('cartSidebar');
  const cartOverlayEl = document.getElementById('cartOverlay');
  if (cartSidebarEl) cartSidebarEl.classList.remove('open');
  if (cartOverlayEl) cartOverlayEl.classList.remove('open');
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
        <i class="fas fa-truck-fast" style="color:#16a34a;font-size:15px"></i>
        <span style="color:#16a34a;font-weight:700">Free delivery</span>
        &nbsp;·&nbsp; Get it <b>${d2a} – ${d2b}</b>
        <span style="display:none">
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
        </div></span>`;
    } else {
      const needed = FREE_DELIVERY_THRESHOLD_SAR - subtotalDisp;
      const pct = Math.min((subtotalDisp / FREE_DELIVERY_THRESHOLD_SAR) * 100, 100);
      nudge.innerHTML = `
        <i class="fas fa-truck" style="color:#888;font-size:15px"></i>
        <span style="color:#555;font-size:12px">Add <b>${fmtD(needed)}</b> more for <span style="color:#16a34a;font-weight:700">free delivery</span></span>`;
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
  // Populate product items in payment modal
  const payItemsWrap = document.getElementById('payItemsWrap');
  if (payItemsWrap) {
    const itemsHtml = cart.map(item => {
      const p = PRODUCTS.find(x => x.id === item.id);
      if (!p) return '';
      const hasDisc = p.originalPrice && p.originalPrice > p.price;
      const discPct = hasDisc ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
      const variant = [item.size, item.color].filter(Boolean).join(' · ');
      return `
        <div class="pay-item-row">
          <div class="pay-item-img"><img src="${p.image}" alt="" loading="lazy" /></div>
          <div class="pay-item-info">
            <div class="pay-item-name">${(typeof getName === 'function' ? getName(p) : (p.names?.en || p.name || '')).substring(0, 40)}</div>
            ${variant ? `<div class="pay-item-variant">${variant}</div>` : ''}
            <div class="pay-item-qty">Qty: ${item.qty}</div>
          </div>
          <div class="pay-item-price">
            ${hasDisc ? `<span class="pay-item-orig">${fmtD((p.originalPrice || p.price) * item.qty * lang.rate)}</span>` : ''}
            <span class="pay-item-total">${fmtD(p.price * item.qty * lang.rate)}</span>
            ${hasDisc ? `<span class="pay-item-badge">-${discPct}%</span>` : ''}
          </div>
        </div>`;
    }).join('');
    payItemsWrap.innerHTML = `<div class="pay-items-list">${itemsHtml}</div>`;
  }
  // Populate checkout page 1 fields
  const addrEl = document.getElementById('ckAddrVal');
  if (addrEl) {
    if (savedLocation) {
      const parts = [savedLocation.address, savedLocation.city].filter(Boolean);
      addrEl.textContent = parts.join(', ') || savedLocation.name || 'Add delivery address';
    } else {
      addrEl.textContent = 'Add delivery address';
    }
  }
  const recvNameEl = document.getElementById('ckRecvName');
  const recvPhoneEl = document.getElementById('ckRecvPhone');
  if (recvNameEl) recvNameEl.textContent = (currentUser?.name || currentUser?.displayName || 'Me').toUpperCase();
  if (recvPhoneEl) recvPhoneEl.textContent = currentUser?.phone || savedLocation?.phone || '';
  // Load per-account saved "Someone else" receiver
  const _recvUid = currentUser?.uid || currentUser?.email || 'guest';
  const _savedRecv = JSON.parse(localStorage.getItem('exglobal_recv_' + _recvUid) || 'null');
  const _otherCard = document.getElementById('ckRecvOther');
  if (_otherCard) {
    const _onm = _otherCard.querySelector('.nc-recv-name');
    const _oph = _otherCard.querySelector('.nc-recv-phone');
    if (_savedRecv?.name || _savedRecv?.phone) {
      if (_onm) _onm.textContent = _savedRecv.name || 'Someone else';
      if (_oph) _oph.textContent = _savedRecv.phone || '';
    } else {
      if (_onm) _onm.textContent = 'Someone else';
      if (_oph) _oph.textContent = 'will be at the...';
    }
  }
  ckSelRecv('me');
  const shipCountEl = document.getElementById('ckShipCount');
  if (shipCountEl) { const tc = cart.reduce((s,i) => s+i.qty, 0); shipCountEl.textContent = `(${tc} item${tc !== 1 ? 's' : ''})`; }
  const ckBarCountEl = document.getElementById('ckBarCount');
  const ckBarTotalEl = document.getElementById('ckBarTotal');
  const tc2 = cart.reduce((s,i) => s+i.qty, 0);
  if (ckBarCountEl) ckBarCountEl.textContent = `${tc2} item${tc2 !== 1 ? 's' : ''}`;
  if (ckBarTotalEl) ckBarTotalEl.textContent = fmtD(grandDisp);
  // Scroll back to top of checkout body
  const ckBodyEl = document.getElementById('ckBody') || document.querySelector('.ck-body');
  if (ckBodyEl) ckBodyEl.scrollTop = 0;
  // Open modal — small delay so cart close animation plays first
  setTimeout(() => {
    document.getElementById('payOverlay').classList.add('open');
    document.getElementById('payModal').classList.add('open');
    document.body.style.overflow = 'hidden';
    if (typeof PAYPAL_READY !== 'undefined' && PAYPAL_READY && !paypalLoaded) {
      loadPayPalSDK();
    }
    // Always start on page 1
    ckGoPage(1);
  }, 320);
}

function togglePayInfo() {
  document.getElementById('ckPayInfoWrap')?.classList.toggle('open');
}

function closePayment() {
  // Close any open nc-sheets first
  ['ncAddrSheet','ncRecvSheet'].forEach(id => {
    const s = document.getElementById(id);
    if (s) { s.classList.remove('nc-sheet-open'); setTimeout(() => { s.style.display='none'; }, 300); }
  });
  ['ncAddrOverlay','ncRecvOverlay'].forEach(id => {
    const o = document.getElementById(id);
    if (o) o.classList.remove('nc-ov-on');
  });
  document.getElementById('payOverlay').classList.remove('open');
  document.getElementById('payModal').classList.remove('open');
  document.body.style.overflow = '';
  // Re-open cart so user can continue shopping or edit
  setTimeout(() => {
    const cs = document.getElementById('cartSidebar');
    const co = document.getElementById('cartOverlay');
    if (cs && cart && cart.length > 0) { cs.classList.add('open'); co && co.classList.add('open'); }
  }, 300);
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
  // Reset to page 1 when closing
  ckGoPage(1);
}

/* ── CHECKOUT 3-PAGE NAVIGATION ── */
window._ckPage = 1;
function ckGoPage(n) {
  // When advancing from page 1, validate address
  if (n === 2 && window._ckPage === 1) {
    if (!savedLocation || !savedLocation.city) {
      showToast('📍 Please add a delivery address to continue');
      ckOpenAddrSheet();
      return;
    }
  }
  // Populate review page when advancing to page 4
  if (n === 4) _populateReviewPage();
  window._ckPage = n;
  const modal = document.getElementById('payModal');
  modal.classList.remove('ck-p1','ck-p2','ck-p3','ck-p4');
  modal.classList.add('ck-p' + n);
  [1,2,3,4].forEach(i => {
    const pg = document.getElementById('ckPg'+i);
    if (pg) pg.classList.toggle('ck-pg-on', i === n);
  });
  // Update step indicator
  [1,2,3,4].forEach(i => {
    const st = document.getElementById('ckSt'+i);
    const line = document.getElementById('ckStL'+i);
    if (!st) return;
    st.classList.remove('ck-stp-on','ck-stp-done');
    if (i < n) st.classList.add('ck-stp-done');
    else if (i === n) st.classList.add('ck-stp-on');
    if (line) line.classList.toggle('ck-stl-done', i < n);
  });
  const body = document.querySelector('.ck-body');
  if (body) body.scrollTop = 0;
}
function ckBack() {
  if (window._ckPage > 1) ckGoPage(window._ckPage - 1);
  else closePayment();
}
function ckBarAction() {
  if (window._ckPage === 3) {
    ckGoPage(4);
  } else {
    processPayment();
  }
}

function _populateReviewPage() {
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const subtotalBase = cartSubtotalBase();
  const subtotalSAR = subtotalBase * lang.rate;
  const freeShip = subtotalSAR >= FREE_DELIVERY_THRESHOLD_SAR;
  const shippingSAR = freeShip ? 0 : DELIVERY_SAR;
  const totalSAR = subtotalSAR + shippingSAR;
  const fmt = v => lang.currency + Math.round(v).toLocaleString();

  // Compute original total and discount
  let itemsTotalBase = 0;
  cart.forEach(item => {
    const p = PRODUCTS.find(p => p.id === item.id);
    if (p) itemsTotalBase += (p.originalPrice || p.price) * item.qty;
  });
  const itemsTotalSAR = itemsTotalBase * lang.rate;
  const discountSAR = Math.max(0, itemsTotalSAR - subtotalSAR);

  const el = id => document.getElementById(id);
  if (el('ocSubtotal')) el('ocSubtotal').textContent = fmt(subtotalSAR);
  if (el('ocItemsTotal')) el('ocItemsTotal').textContent = fmt(itemsTotalSAR);
  if (el('ocDiscount')) el('ocDiscount').textContent = '-' + fmt(discountSAR);
  if (el('ocShipping')) {
    el('ocShipping').textContent = freeShip ? 'Free' : fmt(shippingSAR);
    el('ocShipping').style.color = freeShip ? '#16a34a' : '';
  }
  if (el('ocTotal')) el('ocTotal').textContent = fmt(totalSAR);

  // Update bottom bar button for selected payment method
  const payBtnEl = document.getElementById('payBtnText');
  const btnEl = document.getElementById('btnPayNow');
  if (payBtnEl && btnEl) {
    const methodNames = {
      paypal: 'PayPal', card: 'Pay Now', whatsapp: 'WhatsApp Order',
      tamara: 'Pay with Tamara', tabby: 'Pay with Tabby',
      binance: 'Pay with Crypto', stc: 'Pay with STC', gpay: 'Pay with GPay',
      cod: 'Cash on Delivery',
    };
    const methodName = methodNames[selectedPayMethod] || 'Place Order';
    payBtnEl.textContent = methodName + ' — ' + fmt(totalSAR);
    if (selectedPayMethod === 'paypal') {
      btnEl.style.background = '#003087';
    } else if (selectedPayMethod === 'stc') {
      btnEl.style.background = 'linear-gradient(135deg,#6D2C8A,#9C27B0)';
    } else {
      btnEl.style.background = '';
    }
  }
}

let _ocExpanded = true;
function ocToggleExpand() {
  const expand = document.getElementById('ocExpand');
  const caret = document.getElementById('ocCaret');
  if (!expand) return;
  _ocExpanded = !_ocExpanded;
  expand.classList.toggle('oc-closed', !_ocExpanded);
  if (caret) caret.classList.toggle('oc-collapsed', !_ocExpanded);
}

// ── NOON-STYLE CHECKOUT HELPERS ──────────────────────────
window._ckDI = 'door';
window._ckRecv = 'me';

function ckSelDI(type, el) {
  document.querySelectorAll('.nc-di-tile').forEach(t => {
    t.classList.remove('nc-di-on');
    const chk = t.querySelector('.nc-di-chk');
    if (chk) chk.classList.add('nc-di-chk-off');
  });
  el.classList.add('nc-di-on');
  const chk = el.querySelector('.nc-di-chk');
  if (chk) chk.classList.remove('nc-di-chk-off');
  window._ckDI = type;
}

function ckSelRecv(type) {
  ['me','other'].forEach(t => {
    const id = t === 'me' ? 'ckRecvMe' : 'ckRecvOther';
    const el = document.getElementById(id);
    if (el) el.classList.toggle('nc-recv-on', t === type);
  });
  window._ckRecv = type;
}

function ckOpenAddrSheet() {
  const o = document.getElementById('ncAddrOverlay');
  const s = document.getElementById('ncAddrSheet');
  if (!s) return;
  o.classList.add('nc-ov-on');
  s.style.display = 'flex';
  requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('nc-sheet-open')));
  const wrap = document.getElementById('ncSavedAddrs');
  if (wrap && savedLocation) {
    const addrParts = [savedLocation.address, savedLocation.city, savedLocation.area].filter(Boolean).join(', ');
    const name = savedLocation.name || '';
    const phone = savedLocation.phone || '';
    wrap.innerHTML = `<div class="nc-sheet-addr-card nc-addr-sel" onclick="ckCloseAddrSheet()">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <i class="fas fa-house" style="color:#1a55e3;font-size:14px"></i>
        <span style="font-size:14px;font-weight:700;color:#111">Home</span>
      </div>
      <div style="font-size:13px;color:#444;line-height:1.5;margin-bottom:4px">${addrParts || 'Saved address'}</div>
      <div style="font-size:12.5px;color:#666">${name}${phone ? ', ' + phone : ''} <i class="fas fa-circle-check" style="color:#16a34a;margin-left:4px"></i></div>
    </div>`;
  } else if (wrap) {
    wrap.innerHTML = '';
  }
}
function ckCloseAddrSheet() {
  const o = document.getElementById('ncAddrOverlay');
  const s = document.getElementById('ncAddrSheet');
  if (!s) return;
  o.classList.remove('nc-ov-on');
  s.classList.remove('nc-sheet-open');
  setTimeout(() => { s.style.display = 'none'; }, 300);
}
function ckShowLockerSheet() {
  ckOpenAddrSheet();
  setTimeout(() => ckSheetTab('Locker'), 50);
}
function ckSheetTab(name) {
  ['Addr','Locker'].forEach(t => {
    const el = document.getElementById('ncTab' + t);
    if (el) el.classList.toggle('nc-tab-on', t === name);
  });
}

function ckOpenRecvSheet() {
  const o = document.getElementById('ncRecvOverlay');
  const s = document.getElementById('ncRecvSheet');
  if (!s) return;
  o.classList.add('nc-ov-on');
  s.style.display = 'flex';
  requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('nc-sheet-open')));
  const loc = savedLocation || {};
  const n = loc.name || (window.currentUser?.displayName || 'Customer').toUpperCase();
  const p = loc.phone || window.currentUser?.phoneNumber || '';
  const nameEl   = document.getElementById('ncContactName');
  const avatarEl = document.getElementById('ncContactAvatar');
  const phoneEl  = document.getElementById('ncContactPhone');
  if (nameEl)   nameEl.textContent   = n;
  if (avatarEl) avatarEl.textContent = n.charAt(0) || 'C';
  if (phoneEl)  phoneEl.textContent  = p;
}
function ckCloseRecvSheet() {
  const o = document.getElementById('ncRecvOverlay');
  const s = document.getElementById('ncRecvSheet');
  if (!s) return;
  o.classList.remove('nc-ov-on');
  s.classList.remove('nc-sheet-open');
  setTimeout(() => { s.style.display = 'none'; }, 300);
}
function ckToggleSavedContact() {
  const r  = document.getElementById('ncContactRadio');
  const sc = document.getElementById('ncSavedContact');
  if (!r || !sc) return;
  const on = r.classList.toggle('nc-radio-sel');
  sc.classList.toggle('nc-contact-sel', on);
}
function ckSaveRecv() {
  const nameInp  = (document.getElementById('ncRecvNameInp')?.value  || '').trim();
  const phoneInp = (document.getElementById('ncRecvPhoneInp')?.value || '').trim();
  const useSaved = document.getElementById('ncContactRadio')?.classList.contains('nc-radio-sel');
  let finalName  = nameInp;
  let finalPhone = phoneInp;
  if (useSaved) {
    finalName  = document.getElementById('ncContactName')?.textContent  || finalName;
    finalPhone = document.getElementById('ncContactPhone')?.textContent || finalPhone;
  }
  if (finalName || finalPhone) {
    const other = document.getElementById('ckRecvOther');
    if (other) {
      const nm = other.querySelector('.nc-recv-name');
      const ph = other.querySelector('.nc-recv-phone');
      if (nm) nm.textContent = finalName || 'Receiver';
      if (ph) ph.textContent = finalPhone;
    }
    // Save receiver per-account so it persists for next order
    const _uid = currentUser?.uid || currentUser?.email || 'guest';
    localStorage.setItem('exglobal_recv_' + _uid, JSON.stringify({ name: finalName, phone: finalPhone }));
    ckSelRecv('other');
  }
  ckCloseRecvSheet();
}

function selectPayMethod(method) {
  selectedPayMethod = method;
  const _cardMethods = ['card'];
  ['whatsapp','paypal','card','apple','gpay','binance','stc','tabby','tamara'].forEach(m => {
    const pm = document.getElementById('pm' + m.charAt(0).toUpperCase() + m.slice(1));
    const ck = document.getElementById('check' + m.charAt(0).toUpperCase() + m.slice(1));
    if (pm) { pm.classList.remove('active'); pm.classList.remove('ck-pm-active'); }
    if (ck) ck.classList.remove('ck-radio-active');
  });
  const card = document.getElementById('pm' + method.charAt(0).toUpperCase() + method.slice(1));
  if (card) { card.classList.add('active'); card.classList.add('ck-pm-active'); }
  const check = document.getElementById('check' + method.charAt(0).toUpperCase() + method.slice(1));
  if (check) check.classList.add('ck-radio-active');
  // Show/hide card protection badge
  const isCardMethod = _cardMethods.includes(method);
  const prot = document.getElementById('ckCardProtect');
  if (prot) prot.style.display = isCardMethod ? 'flex' : 'none';
  // Show/hide sub-forms
  document.getElementById('paypalBtnContainer').style.display = (method === 'paypal') ? 'block' : 'none';
  document.getElementById('cardForm').style.display = isCardMethod ? 'block' : 'none';
  document.getElementById('binanceForm').style.display = (method === 'binance') ? 'block' : 'none';
  document.getElementById('stcForm').style.display = (method === 'stc') ? 'block' : 'none';
  const gpayFormEl = document.getElementById('gpayForm');
  if (gpayFormEl) gpayFormEl.style.display = (method === 'gpay') ? 'block' : 'none';
  if (method === 'gpay') _configGooglePayBtn();
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
    card: t('cardName'), apple: 'Apple Pay',
    gpay: 'Google Pay', tamara: 'Pay with Tamara',
    tabby: 'Pay with Tabby',
    binance: '⚡ Verify & Confirm Order',
    stc: '✅ Confirm STC Pay Order',
  };
  const btnEl = document.getElementById('btnPayNow');
  if (btnEl) btnEl.style.background =
    method === 'binance' ? 'linear-gradient(135deg,#F3BA2F,#F0A500)' :
    method === 'stc'     ? 'linear-gradient(135deg,#6D2C8A,#9C27B0)' :
    method === 'paypal'  ? '#0070ba' : '';
  const payBtnEl = document.getElementById('payBtnText');
  if (payBtnEl) {
    if (method === 'paypal') {
      payBtnEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px;vertical-align:middle"><svg height="18" viewBox="0 0 101 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.2 2.4H5.4C5 2.4 4.6 2.7 4.5 3.1L1.8 20c-.1.3.1.6.4.6h3.3c.4 0 .8-.3.8-.7l.7-4.6c.1-.4.5-.7.8-.7h2.2c4.6 0 7.3-2.2 7.9-6.6.3-1.9 0-3.4-.8-4.5-.9-1.1-2.5-1.6-4.9-1.6Zm.8 6.5c-.4 2.5-2.3 2.5-4.2 2.5h-1l.7-4.7h1.1c1.3 0 2.5 0 3.1.7.4.4.5 1 .3 1.5Z" fill="#fff"/><path d="M33.7 8.8h-3.3c-.4 0-.7.3-.8.6l-.2 1-.3-.4c-.9-1.3-2.9-1.7-4.9-1.7-4.6 0-8.5 3.5-9.3 8.4-.4 2.4.2 4.8 1.6 6.4 1.3 1.5 3.1 2.1 5.3 2.1 3.7 0 5.7-2.4 5.7-2.4l-.2 1c-.1.3.1.6.4.6h3c.4 0 .8-.3.8-.7l1.8-11.4c.1-.2-.1-.5-.6-.5Zm-4.6 8.1c-.4 2.4-2.3 4-4.7 4-1.2 0-2.2-.4-2.8-1.1-.6-.7-.9-1.7-.7-2.8.4-2.4 2.3-4.1 4.7-4.1 1.2 0 2.1.4 2.7 1.1.7.7.9 1.7.8 2.9Z" fill="#fff"/><path d="M52.3 8.8h-3.4c-.4 0-.7.2-.9.5L43.6 16l-2-6.3c-.1-.4-.5-.7-.9-.7h-3.3c-.4 0-.6.3-.5.7l3.8 11.1-3.6 5c-.3.4 0 .9.4.9h3.4c.4 0 .7-.2.9-.5l11.5-16.6c.2-.3 0-.8-.5-.8Z" fill="#fff"/><path d="M64.6 2.4h-6.8c-.4 0-.8.3-.8.7l-2.7 17c-.1.3.1.6.4.6h3.6c.3 0 .5-.2.6-.5l.8-4.8c.1-.4.5-.7.8-.7h2.2c4.6 0 7.3-2.2 7.9-6.6.3-1.9 0-3.4-.8-4.5-.9-1.1-2.5-1.6-5.2-1.7Zm.8 6.5c-.4 2.5-2.3 2.5-4.2 2.5h-1l.7-4.7h1.1c1.3 0 2.5 0 3.1.7.4.4.5 1 .3 1.5Z" fill="#fff" opacity=".8"/><path d="M86.2 8.8h-3.3c-.4 0-.7.3-.8.6l-.2 1-.3-.4c-.9-1.3-2.9-1.7-4.9-1.7-4.6 0-8.5 3.5-9.3 8.4-.4 2.4.2 4.8 1.6 6.4 1.3 1.5 3.1 2.1 5.3 2.1 3.7 0 5.7-2.4 5.7-2.4l-.2 1c-.1.3.1.6.4.6h3c.4 0 .8-.3.8-.7l1.8-11.4c.1-.2-.1-.5-.6-.5Zm-4.6 8.1c-.4 2.4-2.3 4-4.7 4-1.2 0-2.2-.4-2.8-1.1-.6-.7-.9-1.7-.7-2.8.4-2.4 2.3-4.1 4.7-4.1 1.2 0 2.1.4 2.7 1.1.7.7.9 1.7.8 2.9Z" fill="#fff" opacity=".8"/><path d="M91 3l-2.7 17.2c-.1.3.1.6.4.6h2.9c.4 0 .8-.3.8-.7l2.7-17c.1-.3-.1-.6-.4-.6H91.5c-.3 0-.4.2-.5.5Z" fill="#fff" opacity=".8"/></svg><span>— SAR ${Math.round(grandDisp2)}</span></span>`;
    } else {
      payBtnEl.textContent = (methodLabel[method] || t('placeOrder')) + ' — ' + lang2.currency + Math.round(grandDisp2).toLocaleString();
    }
  }
}

function _configGooglePayBtn() {
  const btn = document.getElementById('googlePayBtn');
  if (!btn) return;
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const sub = cartSubtotalBase() * lang.rate;
  const del = sub >= FREE_DELIVERY_THRESHOLD_SAR ? 0 : DELIVERY_SAR;
  const total = (Math.round((sub + del) * 100) / 100).toFixed(2);

  btn.paymentRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [{
      type: 'CARD',
      parameters: {
        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA']
      },
      tokenizationSpecification: {
        type: 'PAYMENT_GATEWAY',
        parameters: { gateway: 'example', gatewayMerchantId: 'exampleGatewayMerchantId' }
      }
    }],
    merchantInfo: { merchantName: 'ExGlobal' },
    transactionInfo: {
      totalPriceStatus: 'FINAL',
      totalPriceLabel: 'Total',
      totalPrice: total,
      currencyCode: 'SAR',
      countryCode: 'SA'
    }
  };

  // Wire up success handler (replace previous)
  if (btn._gpayHandler) btn.removeEventListener('loadpaymentdata', btn._gpayHandler);
  btn._gpayHandler = function(e) {
    const pd = e.detail;
    // Payment authorized — place the order
    closePayment();
    whatsappCheckout();
  };
  btn.addEventListener('loadpaymentdata', btn._gpayHandler);

  btn.addEventListener('error', function(e) {
    showToast('⚠️ Google Pay error. Please try again or choose another method.');
  }, { once: true });
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
  if (!currentUser) {
    closePayment();
    showToast('🔒 ' + (t('loginRequired') || 'Please sign in to place your order'));
    setTimeout(openAuth, 400);
    return;
  }
  if (!selectedPayMethod) {
    showToast('⚠️ Please select a payment method to continue');
    const paySection = document.querySelector('.ck-sec:has(.ck-pm)');
    if (paySection) {
      paySection.scrollIntoView({behavior:'smooth',block:'center'});
      paySection.classList.add('pm-shake');
      setTimeout(() => paySection.classList.remove('pm-shake'), 600);
    }
    return;
  }
  const stockErr = _cartStockError();
  if (stockErr) { showToast('🚫 ' + stockErr); return; }
  if (selectedPayMethod === 'whatsapp') {
    closePayment();
    whatsappCheckout();
  } else if (selectedPayMethod === 'tamara') {
    showToast('⚠️ Tamara payment gateway not connected. Please choose another method.');
    return;
  } else if (selectedPayMethod === 'tabby') {
    showToast('⚠️ Tabby payment gateway not connected. Please choose another method.');
    return;
  } else if (selectedPayMethod === 'apple') {
    showToast('⚠️ Apple Pay is not available on this device or browser. Please choose another method.');
    return;
  } else if (selectedPayMethod === 'paypal') {
    // Try to trigger the PayPal SDK button (it's inside an iframe, so find its wrapper and click)
    const ppContainer = document.getElementById('paypalBtnContainer');
    if (ppContainer) {
      // Scroll the PayPal button into view so user can see it activate
      ppContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Try clicking the PayPal button iframe wrapper
      const ppBtn = ppContainer.querySelector('.paypal-button, [role="button"], iframe');
      if (ppBtn) {
        ppBtn.click();
      } else {
        // Fallback: highlight container so user knows to tap the blue PayPal button above
        ppContainer.style.transition = 'box-shadow .2s';
        ppContainer.style.boxShadow = '0 0 0 3px #0070ba, 0 0 20px rgba(0,112,186,.4)';
        ppContainer.style.borderRadius = '8px';
        setTimeout(() => { ppContainer.style.boxShadow = ''; ppContainer.style.borderRadius = ''; }, 1800);
      }
    }
    return;
  } else if (selectedPayMethod === 'card') {
    const s = JSON.parse(localStorage.getItem('exg_settings') || '{}');
    const moyasarKey = s.moyasarPubKey || '';
    if (!moyasarKey) {
      showToast('⚠️ Card payment gateway not connected. Please choose another method.');
      return;
    }
    // Validate card fields
    const cardNum = (document.getElementById('cardNumber')?.value || '').replace(/\s/g,'');
    const cardExp = document.getElementById('cardExpiry')?.value || '';
    const cardCvv = document.getElementById('cardCvv')?.value || '';
    const cardFN  = document.getElementById('cardFirstName')?.value?.trim() || '';
    if (cardNum.length < 15 || !cardExp || cardCvv.length < 3 || !cardFN) {
      showToast('⚠️ Please fill in all card details to proceed.');
      document.getElementById('cardForm').style.display = 'block';
      return;
    }
    const lang = TRANSLATIONS[currentLang] || TRANSLATIONS['bn'];
    const sub = cartSubtotalBase() * lang.rate;
    const del = sub >= FREE_DELIVERY_THRESHOLD_SAR ? 0 : DELIVERY_SAR;
    const grandTotal = sub + del;
    _initMoyasarPayment(moyasarKey, grandTotal).catch(e => {
      showToast('❌ ' + (e.message || 'Payment error'));
    });
    return;
  } else if (selectedPayMethod === 'gpay') {
    const gpayBtn = document.getElementById('googlePayBtn');
    if (gpayBtn && typeof gpayBtn.click === 'function') { _configGooglePayBtn(); gpayBtn.click(); }
    else showToast('⚠️ Google Pay is not available on this device.');
    return;
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
  const sarTotal = subtotalDisp + delivery;
  const amount = Math.max(0.01, (sarTotal / 3.75)).toFixed(2); // SAR → USD
  paypal.Buttons({
    style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' },
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
    onCancel: () => {
      showToast('Payment cancelled — try again');
      setTimeout(() => renderPayPalButtons(), 500);
    },
    onError: (err) => {
      console.warn('PayPal error:', err);
      showToast(t('paymentFailed'));
      // Re-render buttons after 1.5s so user can try again without refreshing
      setTimeout(() => renderPayPalButtons(), 1500);
    }
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

/* ── Animated card preview ── */
function _updateCCPreview() {
  const num   = (document.getElementById('cardNumber')?.value || '').replace(/\s/g,'');
  const exp   = document.getElementById('cardExpiry')?.value || '';
  const first = (document.getElementById('cardFirstName')?.value || '').trim();
  const last  = (document.getElementById('cardLastName')?.value || '').trim();
  const cvv   = document.getElementById('cardCvv')?.value || '';

  // Number — pad with # to 16 digits
  const padded = (num + '################').substring(0,16);
  const formatted = padded.match(/.{1,4}/g).join(' ');
  const numEl = document.getElementById('ccNumber');
  if (numEl) numEl.textContent = formatted;

  // Holder
  const holderEl = document.getElementById('ccHolder');
  if (holderEl) {
    const name = [first, last].filter(Boolean).join(' ').toUpperCase();
    holderEl.textContent = name || 'NAME ON CARD';
  }

  // Expiry
  const expEl = document.getElementById('ccExpiry');
  if (expEl) expEl.textContent = exp || 'MM/YY';

  // CVV (back of card)
  const cvvEl = document.getElementById('ccCvv');
  if (cvvEl) cvvEl.textContent = cvv ? cvv.replace(/./g,'•') : '•••';

  // Detect card network & bank label from first digits
  const networkEl = document.getElementById('ccNetwork');
  const bankEl    = document.getElementById('ccBank');
  if (num.length > 0) {
    const d = num[0];
    if (d === '4') {
      if (networkEl) networkEl.innerHTML = `<svg viewBox="0 0 80 26" width="52" height="26"><text x="0" y="22" font-size="26" font-weight="900" font-style="italic" fill="#fff" font-family="Arial">VISA</text></svg>`;
      if (bankEl) bankEl.textContent = 'VISA';
    } else if (d === '5') {
      if (networkEl) networkEl.innerHTML = `<svg viewBox="0 0 48 30" width="48" height="30"><circle cx="18" cy="15" r="13" fill="#eb001b" opacity=".9"/><circle cx="30" cy="15" r="13" fill="#f79e1b" opacity=".9"/><path d="M24 4.8a13 13 0 0 1 0 20.4A13 13 0 0 1 24 4.8z" fill="#ff5f00" opacity=".9"/></svg>`;
      if (bankEl) bankEl.textContent = 'Mastercard';
    } else if (d === '3') {
      if (networkEl) networkEl.innerHTML = `<svg viewBox="0 0 60 24" width="52" height="24"><rect width="60" height="24" rx="4" fill="#2E77BC"/><text x="6" y="18" font-size="13" font-weight="900" fill="#fff" font-family="Arial">AMEX</text></svg>`;
      if (bankEl) bankEl.textContent = 'Amex';
    } else if (d === '6') {
      if (networkEl) networkEl.innerHTML = `<svg viewBox="0 0 90 26" width="70" height="24"><text x="0" y="20" font-size="20" font-weight="900" fill="#f76f20" font-family="Arial">DISCOVER</text></svg>`;
      if (bankEl) bankEl.textContent = 'Discover';
    } else {
      if (networkEl) networkEl.innerHTML = '';
      if (bankEl) bankEl.textContent = 'Credit Card';
    }
  } else {
    if (networkEl) networkEl.innerHTML = `<svg viewBox="0 0 48 30" width="48" height="30"><circle cx="18" cy="15" r="13" fill="#eb001b" opacity=".9"/><circle cx="30" cy="15" r="13" fill="#f79e1b" opacity=".9"/><path d="M24 4.8a13 13 0 0 1 0 20.4A13 13 0 0 1 24 4.8z" fill="#ff5f00" opacity=".9"/></svg>`;
    if (bankEl) bankEl.textContent = '';
  }
}

function _ccFlip(toBack) {
  document.getElementById('ccCard')?.classList.toggle('cc-flipped', toBack);
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
    photos:['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=120&h=120&fit=crop&q=80'], helpful:145 },

  { id:51, name:'Aisha Noor', initial:'A', grad:'linear-gradient(135deg,#e91e8c,#f97316)', rating:5, date:'2024-11-21', country:'Pakistan',
    product:'Modest Maxi Dress — Dusty Pink',
    text:{ bn:'মাক্সি ড্রেসটা পরে সবাই তাকায়! রঙ অসাধারণ, কাপড় নরম ও ঝরঝরে। পর্দার জন্য একদম মানানসই পোশাক।', en:'Everyone stares when I wear this! Such a beautiful color, soft and flowy fabric. Perfect modest wear. Recommended to all my friends.', ar:'الجميع ينظر عندما أرتديه! لون جميل وقماش ناعم. ملابس محتشمة مثالية.' },
    photos:[], helpful:87 },

  { id:52, name:'Carlos Ramirez', initial:'C', grad:'linear-gradient(135deg,#1d4ed8,#10b981)', rating:5, date:'2024-11-17', country:'Saudi Arabia',
    product:'Laptop Bag — Waterproof 15.6"',
    text:{ bn:'ল্যাপটপ ব্যাগটা পারফেক্ট! ওয়াটারপ্রুফ, অনেক পকেট, কাঁধে ব্যথা করে না। অফিসে সবাই কোথায় থেকে কিনলাম জিজ্ঞেস করে।', en:'Perfect laptop bag! Waterproof, many pockets, comfortable straps. Everyone at office asks where I bought it. Great quality!', ar:'حقيبة لابتوب مثالية! مقاومة للماء وجيوب كثيرة وأحزمة مريحة. الجميع يسأل أين اشتريتها.' },
    photos:[], helpful:93 },

  { id:53, name:'Fatou Keita', initial:'F', grad:'linear-gradient(135deg,#f59e0b,#e91e8c)', rating:5, date:'2024-11-13', country:'UAE',
    product:'Vitamin C Serum — Brightening 30ml',
    text:{ bn:'ভিটামিন সি সিরামটা ১ সপ্তাহেই মুখে পার্থক্য দেখাচ্ছে! কালো দাগ কমেছে, ত্বক উজ্জ্বল। দামে এরকম সিরাম আর নেই।', en:'Visible difference in my face in just 1 week! Dark spots reduced, skin brightened. Cannot find such serum at this price elsewhere.', ar:'فرق واضح على وجهي في أسبوع! تقلصت البقع وأشرقت البشرة. لا يمكن إيجاده بهذا السعر.' },
    photos:[], helpful:118 },

  { id:54, name:'Wei Zhang', initial:'W', grad:'linear-gradient(135deg,#dc2626,#f97316)', rating:4, date:'2024-11-09', country:'Riyadh',
    product:"Men's Slim Fit Trousers — Navy",
    text:{ bn:'ট্রাউজারের ফিটিং দারুণ! অফিসে পরার জন্য পারফেক্ট। কাপড় একটু পাতলা, তাই ৪ স্টার। দামের তুলনায় সন্তুষ্ট।', en:'Trouser fit is excellent! Perfect for office wear. Fabric slightly thin so 4 stars. Overall satisfied with the quality for the price.', ar:'قصة البنطلون ممتازة! مثالي للعمل. القماش رفيع قليلاً لذا 4 نجوم. راضٍ عموماً.' },
    photos:[], helpful:58 },

  { id:55, name:'Natasha Volkova', initial:'N', grad:'linear-gradient(135deg,#7c3aed,#0891b2)', rating:5, date:'2024-11-05', country:'Saudi Arabia',
    product:'Scented Candle Set — 6pcs Luxury',
    text:{ bn:'ক্যান্ডেল জ্বালালে পুরো ঘরের পরিবেশ পাল্টে যায়! সুগন্ধ মনোমুগ্ধকর ও দীর্ঘস্থায়ী। বন্ধুকে গিফট দিয়েছিলাম, সে বলেছে এটাই সেরা গিফট।', en:'Lighting these candles transforms the entire room! Fragrance is enchanting and long-lasting. Gifted to a friend who said it was the best gift ever.', ar:'إضاءة الشموع تحول أجواء الغرفة بالكامل! عطر ساحر وطويل الأمد. أهديتها لصديقة وقالت إنها أفضل هدية.' },
    photos:[], helpful:79 },

  { id:56, name:'Sana Mirza', initial:'S', grad:'linear-gradient(135deg,#e91e8c,#7c3aed)', rating:5, date:'2024-11-01', country:'Jeddah',
    product:'Hyaluronic Acid Moisturizer — 50ml',
    text:{ bn:'ময়শ্চারাইজার লাগালেই মনে হয় ত্বক পানি পান করছে! ৩ দিনে শুষ্কতা চলে গেছে। হাইড্রেশনের জন্য সেরা বাজেট প্রোডাক্ট।', en:"Applying feels like skin is drinking water! Dryness gone in just 3 days. Best budget moisturizer for hydration I've ever tried. 💧", ar:'وضعه يشعرك كأن البشرة تشرب الماء! الجفاف اختفى في 3 أيام. أفضل مرطب بميزانية محدودة.' },
    photos:[], helpful:102 },

  { id:57, name:'Ahmad Kamal', initial:'A', grad:'linear-gradient(135deg,#10b981,#f59e0b)', rating:5, date:'2024-10-27', country:'Kuwait',
    product:"Boy's School Uniform Set — Blue",
    text:{ bn:'ছেলের স্কুল ইউনিফর্ম দারুণ! কাপড় মজবুত, রঙ ধুলেও যায় না। দামে দুটো সেট কিনেছি সারা বছরের জন্য।', en:"Son's school uniform is great! Durable fabric, color holds after washing. Bought two sets for the whole year at this amazing price.", ar:'زي ابني المدرسي رائع! قماش متين واللون ثابت بعد الغسيل. اشتريت مجموعتين لطوال العام.' },
    photos:[], helpful:74 },

  { id:58, name:'Mona Hassan', initial:'M', grad:'linear-gradient(135deg,#db2777,#f97316)', rating:5, date:'2024-10-23', country:'Egypt',
    product:'Floral Jumpsuit — Burgundy M',
    text:{ bn:'জাম্পসুটটা পরে রানওয়েতে হাঁটার মতো অনুভব! প্রিমিয়াম কাপড়, ভাইব্রান্ট ফ্লোরাল প্রিন্ট। পার্টিতে সেরা ড্রেস আমারটাই ছিল! 🌺', en:'Wearing this jumpsuit felt like walking the runway! Premium fabric, vibrant floral print. Had the best dressed look at the party! 🌺', ar:'ارتداؤه شعرت كالمشي على المنصة! قماش ممتاز وطباعة زهور نابضة. كنت الأجمل في الحفلة! 🌺' },
    photos:[], helpful:96 },

  { id:59, name:'Ranjit Singh', initial:'R', grad:'linear-gradient(135deg,#f97316,#7c3aed)', rating:5, date:'2024-10-18', country:'Saudi Arabia',
    product:'Cricket Batting Gloves — Pro',
    text:{ bn:'গ্লাভসের মান দেখে চমকে গেলাম! গ্রিপ অনেক ভালো, প্যাডিং প্রো মানের। মাঠে বন্ধুরা ভেবেছে বিদেশ থেকে এনেছি।', en:'Gloves quality was surprising! Excellent grip and pro-grade padding. Friends on field thought I bought it from abroad. Will gift to coach too.', ar:'جودة القفازات كانت مفاجأة! قبضة ممتازة وحشو احترافي. الأصدقاء ظنوا أنني اشتريتها من الخارج.' },
    photos:[], helpful:65 },

  { id:60, name:'Lina Khoury', initial:'L', grad:'linear-gradient(135deg,#a855f7,#e91e8c)', rating:5, date:'2024-10-14', country:'Lebanon',
    product:'Pearl Bracelet Set — 3 layers',
    text:{ bn:'পার্ল ব্রেসলেট পরলে হাত অসাধারণ দেখায়! মুক্তার চকচকে ভাব একদম আসলের মতো। মা ভেবেছেন আসল মুক্তা! ক্লাসপও মজবুত।', en:'Pearl bracelet makes hands look so beautiful! Luster looks real. Mom thought it was real pearls! Clasp is also strong and durable. Love it! 💖', ar:'أساور اللؤلؤ تجعل اليدين جميلتين! البريق يبدو حقيقياً. أمي ظنت أنه لؤلؤ حقيقي! الإبزيم متين. أحبها! 💖' },
    photos:[], helpful:122 }
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
  if (stored.length > 500) stored.splice(0, stored.length - 500); // cap reviews
  _ls.setJSON('exglobal_reviews', stored);
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
  if ('serviceWorker' in navigator) {
    // Track whether a SW was already controlling this page (update vs first install)
    const _hadController = !!navigator.serviceWorker.controller;
    let _swRefreshing = false;

    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .then(reg => {
        // Poll for updates every 30 s while the page is visible
        setInterval(() => { if (!document.hidden) reg.update(); }, 30000);
        // Also check when user switches back to the app
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) reg.update();
        });
      })
      .catch(() => {});

    // When a new SW takes over, reload so the fresh files are served
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (_swRefreshing || !_hadController) return;
      _swRefreshing = true;
      window.location.reload();
    });

    // Belt-and-suspenders: SW also posts SW_UPDATED after clients.claim()
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data?.type === 'SW_UPDATED' && !_swRefreshing && _hadController) {
        _swRefreshing = true;
        window.location.reload();
      }
    });
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
    if (deferredPrompt) {
      closeDrawer();
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (outcome === 'accepted') {
        showToast('🎉 EX GLOBAL অ্যাপ ইন্সটল হয়ে গেছে!');
      }
      return;
    }
    // Detect iOS
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    if (isIos) {
      closeDrawer();
      showToast('Safari এ Share বাটনে চাপুন → "Add to Home Screen" বেছে নিন');
      return;
    }
    // Already installed or Chrome waiting
    if (window.matchMedia('(display-mode: standalone)').matches) {
      closeDrawer();
      showToast('✅ অ্যাপ ইতিমধ্যে ইন্সটল করা আছে!');
      return;
    }
    closeDrawer();
    showToast('ব্রাউজার মেনু থেকে "Add to Home Screen" বা "Install App" বেছে নিন 📲');
  };
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
function getGeminiKey() {
  try { return (JSON.parse(localStorage.getItem('exg_settings') || '{}')).geminiKey || ''; } catch(e) { return ''; }
}

const _GEMINI_SYSTEM = `You are EX GLOBAL Assistant — a friendly, knowledgeable AI that can talk about anything.
You are part of EX GLOBAL, an online fashion and lifestyle store in Saudi Arabia.
Answer ANY question the user asks — general knowledge, advice, religion, cooking, science, jokes, fun facts, etc.
Also help with shopping: products, orders, delivery, returns, payments, coupons.
Be warm, concise, and conversational. Match the user's language exactly (Bengali→Bengali, Arabic→Arabic, English→English).
Store info: free delivery SAR 100+, 7-day returns, WhatsApp support +966546224029.`;

async function _callGemini(messages, text) {
  const key = getGeminiKey();
  if (!key) return null;
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: _GEMINI_SYSTEM }] },
        contents,
        generationConfig: { maxOutputTokens: 500, temperature: 0.8 }
      })
    });
    const data = await resp.json();
    if (data.error) return null;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch(e) { return null; }
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
  try { return parseInt((JSON.parse(localStorage.getItem('exg_settings') || '{}')).aiDailyLimit) || 9999; }
  catch(e) { return 9999; }
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
  // Reset usage if old limit (≤100) was hit — new limit is 9999
  try {
    const u = JSON.parse(localStorage.getItem('exg_ai_usage') || '{}');
    const today = new Date().toISOString().slice(0, 10);
    if (u.date === today && u.count >= 100 && _aiGetLimit() > u.count) {
      localStorage.removeItem('exg_ai_usage');
    }
  } catch(e) {}
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
  const box = document.getElementById('aiChatMessages');
  if (!box) return;

  // Proactive greeting — check cart/VIP state
  const cartItems = (() => { try { return JSON.parse(localStorage.getItem('exg_cart') || '[]'); } catch(e) { return []; } })();
  const cartTotal = cartItems.reduce((s,i) => s+(i.price||0)*(i.qty||1), 0);
  const vipPts = typeof _getVipPoints === 'function' ? _getVipPoints() : 0;
  const userName = currentUser?.name?.split(' ')[0] || '';
  const proactive = [];
  if (cartItems.length) proactive.push(`🛒 You have **${cartItems.length} item(s)** in cart${cartTotal >= 100 ? ' — ✅ Free delivery!' : ` — Add SAR ${Math.ceil(100-cartTotal)} more for free delivery`}`);
  if (vipPts >= 500) proactive.push(`⭐ You have **${vipPts.toLocaleString()} VIP points** ready to redeem!`);

  const greets = {
    bn: `আসসালামু আলাইকুম${userName?' '+userName:''}! 👋 আমি EX GLOBAL-এর AI — আমি শুধু কথা না, **কাজও করি!**${proactive.length?'\n\n'+proactive.join('\n'):''}`,
    en: `Hello${userName?' '+userName:''}! 👋 I'm EX GLOBAL's AI — I don't just answer, **I take action!**${proactive.length?'\n\n'+proactive.join('\n'):''}`,
    ar: `السلام عليكم${userName?' '+userName:''}! 👋 أنا مساعد EX GLOBAL — لا أجيب فقط، **بل أتصرف!**${proactive.length?'\n\n'+proactive.join('\n'):''}`,
    hi: `नमस्ते${userName?' '+userName:''}! 👋 मैं EX GLOBAL का AI हूं — मैं सिर्फ जवाब नहीं, **काम भी करता हूं!**${proactive.length?'\n\n'+proactive.join('\n'):''}`
  };
  _aiAppendMsg('assistant', greets[currentLang] || greets.en);
  const chips = [
    { en:'🛒 Open My Cart',       ar:'🛒 افتح سلتي',      bn:'🛒 কার্ট খোলো',     hi:'🛒 कार्ट खोलें' },
    { en:'📦 Track My Order',     ar:'📦 تتبع طلبي',      bn:'📦 অর্ডার ট্র্যাক', hi:'📦 ऑर्डर ट्रैक' },
    { en:'🎲 Surprise Me!',       ar:'🎲 فاجئني!',        bn:'🎲 সারপ্রাইজ!',      hi:'🎲 सरप्राइज!' },
    { en:'🤖 What should I buy?', ar:'🤖 ماذا أشتري؟',   bn:'🤖 কী কিনবো?',      hi:'🤖 क्या खरीदूं?' },
    { en:'🎰 Spin the Wheel',     ar:'🎰 أدر العجلة',     bn:'🎰 স্পিন করো',      hi:'🎰 व्हील स्पिन' },
    { en:'💳 Go to Checkout',     ar:'💳 اذهب للدفع',    bn:'💳 চেকআউট',         hi:'💳 चेकआउट' },
    { en:'🏷️ Coupon Codes',       ar:'🏷️ كودات الخصم',   bn:'🏷️ কুপন কোড',      hi:'🏷️ कूपन कोड' },
    { en:'🔥 Flash Deals',        ar:'🔥 عروض فورية',     bn:'🔥 ফ্লাশ ডিল',      hi:'🔥 फ्लैश डील' },
  ]
  const chipDiv = document.createElement('div');
  chipDiv.className = 'ai-chips';
  chipDiv.innerHTML = chips.map(c =>
    `<button class="ai-chip" onclick="this.closest('.ai-chips').remove();sendAiQuick('${(c[currentLang]||c.en).replace(/'/g,"\\'")}')">${c[currentLang]||c.en}</button>`
  ).join('');
  box.appendChild(chipDiv);
  box.scrollTop = box.scrollHeight;
}

function sendAiQuick(text) {
  const inp = document.getElementById('aiChatInput');
  if (inp) { inp.value = text; }
  sendAiMessage();
}

/* ===== LOCAL AI SMART ENGINE ===== */
function _localAiReply(text) {
  const q = text.toLowerCase();
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const cur = T.currency || 'SAR ';
  const rate = T.rate || 1;
  const WA = 'https://wa.me/966546224029';

  // ── OWNER PERSONAL NUMBER BLOCK (only very direct requests) ──

  // ── PERSONAL / OWNER INFO REQUEST ──
  const _isPersonalReq = (
    /\b(owner|boss|manager|personal.*number|your.*number|phone.*number|number.*give|who.*owns|founder|ceo|director)\b/i.test(q) ||
    /মালিক.{0,15}নাম্বার|নাম্বার.{0,10}দাও|নাম্বার.{0,10}দিন|ব্যক্তিগত.{0,10}নাম্বার|মালিকের\s*নাম|তোমার\s*মালিক|আপনার\s*মালিক|আপনার.{0,10}নাম্বার|তোমার.{0,10}নাম্বার|প্রতিষ্ঠাতা|মালিক\s*কে/.test(text) ||
    /رقم.{0,10}المالك|رقم.{0,10}شخصي|معلومات.{0,10}شخصية|اسم.{0,10}المالك|من.{0,8}يملك/.test(text)
  );
  if (_isPersonalReq) {
    const privMsg = {
      bn: '🔒 মালিকের ব্যক্তিগত তথ্য শেয়ার করা সম্ভব নয়।\n\n**ব্যবসায়িক যোগাযোগের জন্য:**\n\n📲 WhatsApp: wa.me/966546224029\n📧 exglobalbusiness@gmail.com\n📧 support@exglobal.online\n\n⏰ সাড়া দেওয়ার সময়: সকাল ৯টা – রাত ১১টা (শনি–বৃহস্পতি)',
      en: '🔒 Personal details of the owner are kept private.\n\n**For business enquiries:**\n\n📲 WhatsApp: ' + WA + '\n📧 exglobalbusiness@gmail.com\n📧 support@exglobal.online\n\n⏰ Hours: 9AM – 11PM (Sat–Thu)',
      ar: '🔒 المعلومات الشخصية سرية.\n\n**للتواصل التجاري:**\n\n📲 واتساب: ' + WA + '\n📧 exglobalbusiness@gmail.com\n📧 support@exglobal.online',
    };
    return privMsg[currentLang] || privMsg.en;
  }

  // ══════════════════════════════════════════════════════
  //  CASUAL CONVERSATION — catches before shopping logic
  // ══════════════════════════════════════════════════════
  const _name1 = currentUser?.name ? currentUser.name.split(' ')[0] : '';
  const _ns = _name1 ? `, ${_name1}` : '';

  // Bengali: how are you / are you okay
  if (/[ঀ-৿]/.test(text) && /ভালো\s*আছ|কেমন\s*আছ|কি\s*খবর|কি\s*হাল|ঠিক\s*আছ|কি\s*অবস্থা/.test(text)) {
    const replies = [
      `আলহামদুলিল্লাহ${_ns}, ভালো আছি! 😊 আপনি কেমন আছেন? কিছু জানতে চাইলে বলুন!`,
      `জী, ভালো আছি${_ns}! 😄 আপনি কেমন আছেন? যা মনে চায় জিজ্ঞেস করুন — আমি সাহায্য করতে এখানেই আছি।`,
      `একদম ফাটাফাটি আছি${_ns}! 💪 আপনি ভালো তো? কিছু লাগলে বলুন!`,
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  // Bengali: greeting (broad — catches any message starting with greeting words or containing them)
  if (/[ঀ-৿]/.test(text) && /^[\s]*(?:হ্যালো|হাই|হেলো|হেই|সালাম|আস.সালাম|ওয়ালাইকুম|নমস্কার|আদাব|হলো|হলু|হেলু)/i.test(text)) {
    const greets = [
      `হ্যালো${_ns}! 😊 কেমন আছেন? কিছু জানতে চাইলে বলুন!`,
      `হাই${_ns}! 👋 আপনাকে দেখে ভালো লাগলো! কী জানতে চান?`,
      `আস-সালামুয়ালাইকুম${_ns}! কেমন আছেন আপনি? যা মনে চায় জিজ্ঞেস করুন!`,
    ];
    return greets[Math.floor(Math.random() * greets.length)];
  }

  // Bengali: thanks
  if (/[ঀ-৿]/.test(text) && /ধন্যবাদ|শুকরিয়া|থ্যাংক/.test(text)) {
    return `আপনাকে স্বাগতম${_ns}! 😊 আর কিছু জানার থাকলে বলুন!`;
  }

  // Bengali: compliment / love
  if (/[ঀ-৿]/.test(text) && /ভালো\s*লাগ|ভালো\s*বাস|দারুণ|সুন্দর|অসাধারণ|বেস্ট|সেরা/.test(text)) {
    return `ধন্যবাদ${_ns}! 😄 আপনার মতামতে আমরা অনুপ্রাণিত। আর কিছু লাগলে বলুন!`;
  }

  // Bengali: good morning/night/afternoon
  if (/[ঀ-৿]/.test(text) && /শুভ\s*(?:সকাল|সন্ধ্যা|বিকাল|রাত|দুপুর)|গুড\s*(?:মর্নিং|ইভনিং|নাইট)/.test(text)) {
    const timeGreets = [`শুভেচ্ছা${_ns}! 😊 কীভাবে সাহায্য করতে পারি?`, `শুভেচ্ছা${_ns}! আজকে কি কিছু দরকার? 😊`];
    return timeGreets[Math.floor(Math.random() * timeGreets.length)];
  }

  // English: how are you
  if (!/[ঀ-৿؀-ۿ]/.test(text) && /how\s*are\s*you|how\s*r\s*u|hru|you\s*ok|r\s*u\s*ok/i.test(q)) {
    return `I'm great${_ns}, thanks for asking! 😊 How can I help you today?`;
  }

  // Arabic: how are you
  if (/[؀-ۿ]/.test(text) && /كيف\s*حالك|كيف\s*الحال|انت\s*بخير/.test(text)) {
    return `بخير الحمد لله${_ns}! 😊 كيف يمكنني مساعدتك اليوم؟`;
  }

  // ──────────────────────────────────────────────────────
  //  SHOPPING INTENT DETECTION (for Bengali / Arabic)
  //  If message has NO shopping intent, give friendly
  //  redirect instead of random product/topic match.
  // ──────────────────────────────────────────────────────
  const _hasBengali = /[ঀ-৿]/.test(text);
  const _hasArabic  = /[؀-ۿ]/.test(text);

  // Words that indicate shopping intent in Bengali
  const _bnShoppingIntent = /পণ্য|কিনতে|কিনব|কিনবো|অর্ডার|ডেলিভারি|দাম|মূল্য|শপিং|কার্ট|পেমেন্ট|রিটার্ন|ছাড়|অফার|ট্র্যাক|ওয়েবসাইট|লিংক|সাইজ|রিভিউ|কুপন|উইশলিস্ট|জামা|কাপড়|পোশাক|ব্যাগ|জুতা|ঘড়ি|পার্ফিউম|ইলেকট্রনিক|বিউটি|শাড়ি|পাঞ্জাবি|আবায়া|হিজাব|শার্ট|ড্রেস|বাচ্চা|শিশু|খেলনা|বালিশ|চাদর|ক্রিম|সিরাম|লিপস্টিক|মেকআপ/.test(text);

  // ══════════════════════════════════════════════════════
  //  PLACE ORDER
  // ══════════════════════════════════════════════════════
  if (/order.*place|place.*order|buy|purchase|checkout|أبغى أطلب|كيف أطلب|عايز اشتري|أريد أطلب|كيف اشتري|كيف أشتري|أطلب|اطلب|أبغى أشتري|وش أسوي|كيف أكمل|اكمل الطلب|অর্ডার দি|অর্ডার দেব|অর্ডার করত|ওডার দি|ওডার দেব|ওডার করত|কিনতে|কিনব|কিনবো/.test(q)) {
    const howto = {
      bn: '🛍️ **অর্ডার দেওয়ার সহজ ধাপ:**\n\n1️⃣ পণ্য দেখুন → **Add to Cart** চাপুন\n2️⃣ Cart icon চাপুন (নিচে ডানে)\n3️⃣ **Checkout** চাপুন\n4️⃣ ঠিকানা দিন\n5️⃣ Payment method বেছে নিন\n6️⃣ **Place Order** চাপুন ✅\n\n💳 Payment: Card · Binance · STC Pay · COD\n🚚 Delivery: 2-4 দিন · Free (SAR 100+)\n\n📲 সাহায্য লাগলে: ' + WA,
      en: '🛍️ **How to Place an Order:**\n\n1️⃣ Browse & tap **Add to Cart**\n2️⃣ Open Cart (bottom right)\n3️⃣ Tap **Checkout**\n4️⃣ Enter delivery address\n5️⃣ Choose payment method\n6️⃣ Tap **Place Order** ✅\n\n💳 Payment: Card · Binance · STC · COD\n🚚 Delivery: 2-4 days · Free over SAR 100\n\n📲 Need help? ' + WA,
      ar: '🛍️ **كيفية الطلب:**\n\n1️⃣ أضف المنتج للسلة\n2️⃣ افتح السلة\n3️⃣ اضغط تسجيل الخروج\n4️⃣ أدخل العنوان\n5️⃣ اختر طريقة الدفع\n6️⃣ اضغط تأكيد الطلب ✅\n\n📲 للمساعدة: ' + WA,
    };
    return howto[currentLang] || howto.en;
  }

  // ── GREETING ──
  if (/^(hi|hello|hey|مرحبا|مرحباً|هلا|هلاً|السلام|السلام عليكم|أهلاً|اهلا|أهلا وسهلا|هاي|يا عزيزي|يا صديقي|صباح|مساء|كيف حالك|হ্যালো|নমস্কার|হাই|আস|সালাম|namaste|नमस्ते|hola)/.test(q)) {
    const greet = {
      bn: 'আস-সালামু আলাইকুম! 😊\nআমি EX GLOBAL-এর AI সহকারী। কীভাবে সাহায্য করতে পারি?\n\n🛍️ পণ্য খুঁজতে | 📦 অর্ডার ট্র্যাক | 💳 পেমেন্ট | 🚚 ডেলিভারি',
      en: 'Welcome to EX GLOBAL! 👑\nI\'m your AI shopping assistant. How can I help?\n\n🛍️ Find products | 📦 Track order | 💳 Payment | 🚚 Delivery',
      ar: 'أهلاً بك في EX GLOBAL! 👑\nأنا مساعدك الذكي. كيف يمكنني خدمتك؟\n\n🛍️ البحث عن منتج | 📦 تتبع الطلب | 💳 الدفع | 🚚 التوصيل',
      hi: 'EX GLOBAL में आपका स्वागत है! 👑\nमैं आपका AI सहायक हूं। कैसे मदद करूं?\n\n🛍️ उत्पाद खोजें | 📦 ऑर्डर ट्रैक | 💳 भुगतान | 🚚 डिलीवरी',
    };
    return greet[currentLang] || greet.en;
  }

  // ── ORDER TRACKING ──
  if (/track|deliver|where.*order|status|shipped|طلب|أين|توصيل|تتبع|অর্ডার কোথায়|ওডার কোথায়|ট্র্যাক|ডেলিভারি কোথায়|ऑर्डर|ट्रैक/.test(q)) {
    const orders = (() => { try { return JSON.parse(localStorage.getItem('exg_orders') || '[]'); } catch(e) { return []; } })();
    if (orders.length > 0) {
      const last = orders[orders.length - 1];
      const statusMap = { pending:'⏳ Pending — being prepared', confirmed:'✅ Confirmed — processing', processing:'🔄 Processing — packing your items', shipped:'🚚 Shipped — on the way!', delivered:'🎉 Delivered successfully', cancelled:'❌ Cancelled' };
      const totalAmt = last.totalSAR ? `${cur}${Math.round(last.totalSAR * rate)}` : (last.total || 'N/A');
      const recentLines = orders.slice(-3).reverse().map(o =>
        `• #${o.id} — ${statusMap[o.status] || o.status} — ${o.totalSAR ? cur + Math.round(o.totalSAR * rate) : (o.total || '')}`
      ).join('\n');
      return `📦 **Your Orders**\n\n${recentLines}\n\n**Latest Order Details:**\n🔖 #${last.id}\n${statusMap[last.status] || last.status}\n💰 Total: ${totalAmt}\n📅 Expected: 2–4 business days\n🚀 Express upgrade: +SAR 15 for 1-day\n\n📲 Live tracking: ${WA}`;
    }
    return `📦 **Track Your Order**\n\nNo orders found on this device.\n\nShare your Order ID (e.g. #ORD123) or phone number used at checkout.\n\n📲 WhatsApp us: ${WA}\n⚡ We respond within 5 minutes!`;
  }

  // ── CANCEL ORDER ──
  if (/cancel|cancellation|إلغاء|بطل|বাতিল|रद्द/.test(q)) {
    return `❌ **Order Cancellation:**\n\n✅ Orders can be cancelled **within 2 hours** of placing\n✅ After 2 hours — contact support immediately\n✅ Full refund if cancelled before shipping\n\n**How to cancel:**\n1. Open My Cart → My Orders\n2. Tap your order → Request Cancel\n3. Or WhatsApp us with your Order ID\n\n📲 ${WA}\n📧 exglobalbusiness@gmail.com\n\n⚠️ Orders already shipped cannot be cancelled — request a return instead.`;
  }

  // ── WEBSITE / LINK ──
  if (/link|url|লিংক|ঠিকান|website|ওয়েবসাইট|site|address|সাইট/.test(q)) {
    const msgs = {
      bn: `🔗 আমাদের ওয়েবসাইট:\n\n👉 exglobal.online\n\nসব পণ্য দেখতে এই সাইটে ভিজিট করুন!\n\n📲 WhatsApp: ${WA}`,
      en: `🔗 Our website:\n\n👉 exglobal.online\n\nVisit to browse all products & place orders!\n\n📲 WhatsApp: ${WA}`,
      ar: `🔗 موقعنا الإلكتروني:\n\n👉 exglobal.online\n\n📲 واتساب: ${WA}`,
    };
    return msgs[currentLang] || msgs.en;
  }

  // ── PRODUCT SEARCH ──
  if (/show|find|search|product|dress|abaya|shirt|perfume|bag|shoe|beauty|watch|electronics|هاتف|عباية|جلابية|منتج|পণ্য|দেখাও|খুঁজ|उत्पाद|জামা|কাপড়|পোশাক|বাচ্চা|শিশু|ছোট|শাড়ি|সালোয়ার|হিজাব|পাঞ্জাবি|আবায়া|ব্যাগ|জুতা|ঘড়ি|পার্ফিউম|কিনতে|চাই|দেখতে/.test(q)) {
    const words = q.split(/\s+/).filter(w => w.length > 1);
    const matches = PRODUCTS.filter(p => {
      const n = (p.names?.en || p.names?.bn || p.name || '').toLowerCase();
      const c = (p.category || '').toLowerCase();
      return words.some(w => n.includes(w) || c.includes(w));
    }).slice(0, 5);
    if (matches.length) {
      return `🛍️ **Found ${matches.length} matching products:**\n\n` +
        matches.map(p => `• ${p.names?.en || p.name} — ${cur}${(p.price*rate).toFixed(0)} (**-${p.discount}% off**)`).join('\n') +
        '\n\nTap any product to view details & add to cart! 🛒';
    }
    return `🔍 I searched but couldn\'t find an exact match.\n\nTry:\n• Browsing by **category** (top menu)\n• Using the **search bar** 🔍\n• Describing what you need\n\n📲 For personalized recommendations: ${WA}`;
  }

  // ── NEW ARRIVALS ──
  if (/new|latest|arrival|fresh|جديد|وصل|নতুন পণ্য|नया/.test(q)) {
    const newest = [...PRODUCTS].sort((a,b) => (b.id||0) - (a.id||0)).slice(0, 5);
    return `✨ **Latest Arrivals:**\n\n` +
      newest.map(p => `• ${p.names?.en || p.name} — ${cur}${(p.price*rate).toFixed(0)}`).join('\n') +
      `\n\n🔥 New products added daily!\nCheck the **New In** section for more.`;
  }

  // ── BESTSELLERS / POPULAR ──
  if (/best|popular|top.*sell|trending|most.*sold|الأكثر|رائج|বেস্ট|জনপ্রিয়|लोकप्रिय/.test(q)) {
    const best = [...PRODUCTS].sort((a,b) => (b.ratingCount||0) - (a.ratingCount||0)).slice(0, 5);
    return `⭐ **Most Popular Products:**\n\n` +
      best.map(p => `• ${p.names?.en || p.name} — ${cur}${(p.price*rate).toFixed(0)} (⭐ ${p.rating||4.5})`).join('\n') +
      `\n\nThese are customer favourites! Tap to view.`;
  }

  // ── PRICE RANGE ──
  if (/under|below|cheap|budget|less than|أرخص من|أقل من|সস্তা|বাজেট|সাশ্রয়ী|सस्ता|बजट/.test(q)) {
    const nums = q.match(/\d+/g);
    const limit = nums ? parseInt(nums[0]) / rate : 100;
    const affordable = PRODUCTS.filter(p => p.price <= limit).slice(0, 5);
    if (affordable.length) {
      return `💰 **Products Under ${cur}${Math.round(limit * rate)}:**\n\n` +
        affordable.map(p => `• ${p.names?.en || p.name} — ${cur}${(p.price*rate).toFixed(0)}`).join('\n') +
        `\n\nGreat value picks! 🎯`;
    }
    return `💡 Try filtering by price in the **Filters** section (top of product page).`;
  }

  // ── DEALS / OFFERS ──
  if (/deal|offer|sale|discount|flash|خصم|عرض|تخفيض|ডিল|অফার|ছাড়|डील|ऑफर|সেল/.test(q)) {
    const top = [...PRODUCTS].sort((a,b) => (b.discount||0) - (a.discount||0)).slice(0, 5);
    return `🔥 **Today's Hottest Deals:**\n\n` +
      top.map(p => `• ${p.names?.en || p.name}: ${cur}${(p.price*rate).toFixed(0)} — **${p.discount}% OFF**`).join('\n') +
      `\n\n⏰ Flash Deals refresh daily — check the **Flash Deals** section!\n🏷️ Use code **WELCOME10** for extra 10% off`;
  }

  // ── DELIVERY ──
  if (/ship|deliver|how long|days|fast|express|free delivery|كم يوم|توصيل|متى|شحن|শিপিং|ডেলিভারি|কতদিন|কত দিন|कितने दिन|डिलीवरी/.test(q)) {
    return `🚚 **Delivery Information:**\n\n📦 **Standard Delivery:** 2–4 business days\n⚡ **Express (1-2 days):** +SAR 15\n🎁 **Free delivery:** On orders over SAR 100\n\n🗺️ **Coverage:**\n• 🏙️ Riyadh & Jeddah — sometimes same day!\n• 🌍 All Saudi Arabia 🇸🇦\n• 📦 Remote areas: +1 day\n\n⏰ Orders placed before 2PM dispatched same day.\n📲 Real-time tracking via WhatsApp confirmation.`;
  }

  // ── RETURNS & REFUNDS ──
  if (/return|refund|exchange|replace|damage|defect|broken|wrong.*item|إرجاع|استبدال|استرداد|রিটার্ন|ফেরত|রিফান্ড|বদলে|वापसी|रिफंड/.test(q)) {
    return `↩️ **Return & Refund Policy:**\n\n✅ **7-day return window** from delivery date\n✅ Item must be unused, original packaging\n✅ **Free returns** for damaged or wrong items\n✅ Exchange available for different size/color\n✅ Refund processed in **3–5 business days**\n\n**How to return:**\n1. Message us on WhatsApp with your Order ID\n2. Send photos of the item\n3. We arrange free pickup (defective items)\n4. Refund sent to original payment method\n\n📲 Start your return: ${WA}\n📧 exglobalbusiness@gmail.com`;
  }

  // ── PAYMENT METHODS ──
  if (/pay|payment|card|cash|mada|visa|master|stc|tamara|binance|crypto|apple|كيف أدفع|دفع|طريقة الدفع|পেমেন্ট|পেমেন্ট কীভাবে|কীভাবে দিব|ভুগতান|भुगतान/.test(q)) {
    return `💳 **Payment Methods at EX GLOBAL:**\n\n💵 **Cash on Delivery (COD)**\n   Pay when you receive — no upfront payment\n\n💳 **Debit/Credit Card**\n   Mada · Visa · Mastercard · AMEX\n   256-bit SSL encrypted ✅\n\n🟣 **Tamara**\n   Split into payments — 0% interest\n\n📱 **STC Pay**\n   Instant SAR transfer\n\n🟡 **Binance Pay**\n   USDT · BNB · Crypto payments\n\n🔒 All payments are ZATCA-compliant & fully secure.`;
  }

  // ── COUPONS / PROMO CODES ──
  if (/coupon|promo|code|discount code|كوبون|كود|قسيمة|কুপন|কোড|প্রমো|कूपन|प्रोमो/.test(q)) {
    return `🎁 **Active Promo Codes:**\n\n🏷️ **WELCOME10** — 10% off first order\n🎂 **BDAY10** — 10% off on your birthday\n\n**How to use:**\n1. Add items to cart\n2. Tap "Apply Coupon" in cart\n3. Enter code → tap Apply\n4. Discount applied instantly! ✅\n\n💡 Only one code per order.`;
  }

  // ── SIZE GUIDE ──
  if (/size|fit|measurement|large|small|chart|مقاس|حجم|قياسات|সাইজ|মাপ|माप|साइज/.test(q)) {
    return `📏 **Size Guide:**\n\n👗 **Women's Clothing:**\nXS=34–36 | S=36–38 | M=38–40\nL=40–42 | XL=42–44 | XXL=44–46\n\n👔 **Men's Clothing:**\nS=36–38 | M=38–40 | L=40–42\nXL=42–44 | XXL=44–46 | 3XL=46–48\n\n👟 **Shoes (EU → UK):**\n36=3.5 | 37=4 | 38=5 | 39=6\n40=6.5 | 41=7 | 42=8 | 43=9\n\n💡 **Tip:** When between sizes, size up.\n📲 Need custom advice? ${WA}`;
  }

  // ── QUALITY / AUTHENTICITY ──
  if (/quality|original|genuine|fake|authentic|real|جودة|أصلي|গুণমান|আসল|গুণ|গুণগত|गुणवत्ता|असली/.test(q)) {
    return `✅ **Quality Guarantee:**\n\n• 100% genuine products — no counterfeits\n• Direct sourcing from verified suppliers\n• Every item inspected before shipping\n• Secure packaging — no damage in transit\n\n🛡️ **EX GLOBAL Promise:**\nIf you receive anything that doesn\'t match the description, we'll replace it FREE or give a full refund.\n\n📲 Report any issue: ${WA}`;
  }

  // ── COMPLAINTS ──
  if (/complain|complaint|problem|issue|wrong|شكوى|مشكلة|অভিযোগ|সমস্যা হচ্ছে|শিকায়ত|शिकायत/.test(q)) {
    return `😟 **We're Sorry to Hear That!**\n\nWe take every complaint seriously:\n\n1️⃣ **Wrong item received** — Free replacement + refund of shipping\n2️⃣ **Damaged item** — Full refund or free exchange\n3️⃣ **Late delivery** — Compensation voucher\n4️⃣ **Other issues** — Resolved within 24 hours\n\n📲 Tell us what happened:\n${WA}\n\nPlease include: Order ID + photo of the item.`;
  }

  // ── ACCOUNT / LOGIN ──
  if (/account|login|sign in|sign up|register|password|profile|حساب|تسجيل|অ্যাকাউন্ট|লগইন|अकाउंट|लॉगिन/.test(q)) {
    return `👤 **Your Account:**\n\n**Sign In / Sign Up:**\n• Tap the 👤 icon (top right)\n• Sign in with Email or Google\n• First time? Create account in seconds\n\n**Benefits of an account:**\n✅ Track all your orders\n✅ Save wishlist items\n✅ Faster checkout\n✅ Earn loyalty points\n✅ Get personalised deals\n\n📲 Account issues? ${WA}`;
  }

  // ── WISHLIST ──
  if (/wish|wishlist|save|favourite|favorite|قائمة|مفضلة|উইশলিস্ট|পছন্দের|विशलिस्ट/.test(q)) {
    return `❤️ **Wishlist (Save for Later):**\n\nTap the ❤️ heart on any product to save it.\n\n**To view your wishlist:**\n• Tap the heart icon in the top menu\n• All saved items appear here\n\n📲 Need help finding an item? ${WA}`;
  }

  // ── CART HELP ──
  if (/cart|basket|bag|checkout|سلة|عربة|কার্ট|ব্যাগে/.test(q)) {
    const cartTotal = cart.reduce((s,i) => { const p=PRODUCTS.find(x=>x.id===i.id); return s+(p?p.price*i.qty*rate:0); }, 0);
    if (cart.length > 0) {
      return `🛒 **Your Cart:**\n\n${cart.length} item(s) — Total: ${cur}${Math.round(cartTotal)}\n\n${cart.map(i => { const p=PRODUCTS.find(x=>x.id===i.id); return p ? `• ${p.names?.en||p.name} ×${i.qty}` : ''; }).filter(Boolean).join('\n')}\n\n**Next steps:**\n• Tap 🛒 to open cart\n• Tap "Checkout" to place order\n• Apply a coupon for extra savings!`;
    }
    return `🛒 Your cart is empty!\n\nBrowse products and tap **Add to Cart** to start shopping.\n\n🔥 Check our **Flash Deals** for great prices!`;
  }

  // ── LOYALTY POINTS ──
  if (/point|loyalty|reward|earn|نقاط|مكافأة|পয়েন্ট|লয়্যালটি|पॉइंट/.test(q)) {
    return `⭐ **Loyalty Rewards Program:**\n\n• Earn **1 point** for every SAR 1 spent\n• **100 points = SAR 5 discount** on next order\n• Bonus points on first order (×2)\n• Points never expire\n\n**How to check your points:**\nTap 👤 Account → Loyalty Points`;
  }

  // ── STORE HOURS ──
  if (/open|hours|available|time|when|متى|ساعات|খোলা|সময়|কখন|समय|खुला/.test(q)) {
    return `🕐 **Customer Support Hours:**\n\n• **Chat & WhatsApp:** 9AM – 11PM (Sat–Thu)\n• **Friday:** 2PM – 11PM\n• **Response time:** ~5 minutes during hours\n• **After hours:** Leave a message, we reply within 12hrs\n\n🌐 **Website:** Available 24/7, shop anytime!\n\n📲 Message us: ${WA}\n📧 exglobalbusiness@gmail.com`;
  }

  // ── GIFT / PACKAGING ──
  if (/gift|wrap|packaging|present|occasion|هدية|تغليف|উপহার|গিফট|उपहार|गिफ्ट/.test(q)) {
    return `🎁 **Gift Services:**\n\n✅ **Gift wrapping** available on request\n✅ **Personal message card** added for free\n✅ **Special occasions:** Eid, Birthday, Wedding, Anniversary\n✅ Elegant branded packaging\n\nExtra charge: SAR 10 for premium gift box.\n📲 Special requests: ${WA}`;
  }

  // ── CONTACT ──
  if (/contact|support|help|whatsapp|email|تواصل|دعم|رقم الدعم|বাপোর্ট|যোগাযোগ|সাহায্য করুন|संपर्क/.test(q)) {
    return `📞 **Contact EX GLOBAL Support:**\n\n💬 **WhatsApp (fastest):**\n${WA}\n⚡ Response: ~5 minutes\n\n📧 **Email:**\nsupport@exglobal.online\nexglobalbusiness@gmail.com\n\n⏰ **Hours:** 9AM–11PM (Sat–Thu)\n\n📍 **Based in:** Riyadh, Saudi Arabia 🇸🇦`;
  }

  // ── VAT / INVOICE — uses ভ্যাট only (removed ambiguous কর) ──
  if (/\bvat\b|invoice|zatca|ضريبة|فاتورة|ভ্যাট|इनवॉइस/.test(q)) {
    return `🧾 **VAT & Tax Invoice:**\n\n• VAT: **15%** included in all displayed prices\n• ZATCA Phase 1 compliant ✅\n• Tax invoice auto-generated after every order\n• QR code on every invoice (ZATCA standard)\n\n📄 Your invoice is shown in the **Order Confirmation** screen and sent via WhatsApp after delivery.\n\n📧 Invoice questions: exglobalbusiness@gmail.com`;
  }

  // ── ABOUT / COMPANY ──
  if (/about|who are you|brand|company|store|شركة|متجر|عن الشركة|সম্পর্কে|ব্র্যান্ড|কারা|कंपनी/.test(q)) {
    return `👑 **About EX GLOBAL:**\n\nSaudi Arabia's premium online shopping destination.\n\n🛍️ 1,000+ products across fashion, beauty, electronics & lifestyle\n⭐ 4.8/5 average customer rating\n🇸🇦 Saudi-owned · Saudi-operated\n\n**Our Promise:**\n✅ 100% genuine products · ✅ Secure payments\n✅ Fast delivery · ✅ Hassle-free returns\n\n📲 ${WA}\n📧 exglobalbusiness@gmail.com`;
  }

  // ── STOCK / AVAILABILITY ──
  if (/stock|available|out of stock|sold out|متوفر|نفد|স্টক|পাওয়া যাচ্ছে|স্টকে|स्टॉक/.test(q)) {
    return `📦 **Product Availability:**\n\nProducts showing on site are **in stock** and ready to ship.\n\n**Out of stock items:**\n• Tap ❤️ to add to wishlist\n• We\'ll notify you when restocked\n\n📲 Ask about a specific item: ${WA}`;
  }

  // ── PRIVACY ──
  if (/privacy|data|personal.*info|secure|خصوصية|بيانات|গোপনীয়তা|তথ্য সুরক্ষা|गोपनीयता/.test(q)) {
    return `🔒 **Your Privacy & Data:**\n\n• Your personal info is **never shared** with third parties\n• Payments are processed via secure, encrypted gateways\n• No spam — you control your notifications\n• Delete your data anytime: Contact support\n\n🛡️ EX GLOBAL follows Saudi data protection laws.\n\n📧 Privacy questions: support@exglobal.online\n📧 exglobalbusiness@gmail.com`;
  }

  // ── ARABIC CATCH-ALL ──
  if (_hasArabic) {
    return `مرحباً! 👋\nكيف يمكنني مساعدتك اليوم؟\n\n• 📦 تتبع الطلب\n• 🛍️ البحث عن منتج\n• 💳 طرق الدفع\n• 🚚 التوصيل\n• ↩️ الإرجاع والاستبدال\n• 📞 التواصل معنا\n\nاكتب سؤالك وسأجيبك فوراً! ⚡`;
  }

  // ── BENGALI — shopping intent → show matching products ──
  if (_hasBengali) {
    if (_bnShoppingIntent) {
      const matched = PRODUCTS.filter(p => {
        const qWords = text.split(/\s+/).filter(w => w.length > 1);
        const allText = [(p.names?.bn||''), (p.names?.en||p.name||''), (p.category||''), (p.tags||[]).join(' ')].join(' ').toLowerCase();
        return qWords.some(w => allText.includes(w));
      }).slice(0, 5);
      if (matched.length) {
        return `🛍️ **আপনার জন্য ${matched.length}টি পণ্য পেলাম:**\n\n` +
          matched.map(p => `• ${p.names?.bn || p.names?.en || p.name} — SAR ${p.price} (**${p.discount}% ছাড়**)`).join('\n') +
          `\n\nপণ্যে ট্যাপ করলে বিস্তারিত দেখতে পাবেন! 🛒\n📲 সরাসরি অর্ডার করতে: ${WA}`;
      }
    }
    // No shopping intent — give generic helpful response
    return `হ্যালো! 👋 আমি EX GLOBAL-এর শপিং সহকারী।\n\nআপনাকে সাহায্য করতে পারি:\n\n🛍️ পণ্য খুঁজে পেতে\n📦 অর্ডার ট্র্যাক করতে\n💳 পেমেন্ট সম্পর্কে জানতে\n🚚 ডেলিভারি তথ্য পেতে\n↩️ রিটার্ন বা রিফান্ড\n\n🌐 **exglobal.online**\n📲 WhatsApp: ${WA}\n\nকী জানতে চান? ✍️`;
  }

  // ── CART SUMMARY (duplicate check for english) ──
  if (/cart|basket|سلة|صيدلة|سامان/.test(q)) {
    const cartL = (() => { try { return JSON.parse(localStorage.getItem('exg_cart') || '[]'); } catch(e) { return []; } })();
    if (cartL.length > 0) {
      const total = cartL.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
      const lines = cartL.slice(0, 5).map(i => `• ${i.name || i.names?.en || 'Item'} × ${i.qty || 1} — ${cur}${Math.round(i.price * rate * (i.qty || 1))}`).join('\n');
      return `🛒 **Your Cart (${cartL.length} item${cartL.length > 1 ? 's' : ''}):**\n\n${lines}${cartL.length > 5 ? `\n...and ${cartL.length - 5} more` : ''}\n\n💰 **Total: ${cur}${Math.round(total * rate)}**\n${total >= 100 ? '✅ Free delivery included!\n' : `💡 Add ${cur}${Math.round((100 - total) * rate)} more for free delivery!\n`}\n👉 Tap **Cart** (bottom right) to checkout.`;
    }
    return `🛒 Your cart is empty!\n\n🛍️ Browse products and tap **Buy Now** to add items.\n\n💡 Tip: Orders over SAR 100 get **free delivery**!`;
  }

  // ── WISHLIST (saved) ──
  if (/wish|saved|favourite|favorite|المفضلة|مفضلة|পছন্দ|উইশ|इच्छा/.test(q)) {
    const wl = (() => { try { return JSON.parse(localStorage.getItem('exg_wishlist') || '[]'); } catch(e) { return []; } })();
    if (wl.length > 0) {
      const lines = wl.slice(0, 5).map(id => {
        const p = PRODUCTS.find(x => x.id === id);
        return p ? `• ${p.names?.en || p.name} — ${cur}${Math.round(p.price * rate)} (**-${p.discount}%**)` : null;
      }).filter(Boolean).join('\n');
      return `❤️ **Your Wishlist (${wl.length} item${wl.length > 1 ? 's' : ''}):**\n\n${lines || 'Items unavailable'}\n\nTap the ❤️ icon on any product to manage your wishlist.`;
    }
    return `💔 Your wishlist is empty.\n\nTap the **❤️ heart icon** on any product to save it for later!`;
  }

  // ── COUPON (secondary check) ──
  if (/coupon|promo|code|discount.*code|voucher|كوبون|خصم|কুপন|ছাড়ের কোড|कूपन/.test(q)) {
    return `🏷️ **Active Discount Codes:**\n\n🎁 **WELCOME10** — 10% off your first order\n🎂 **BDAY10** — 10% off on your birthday\n\n**How to use:**\n1. Add items to cart → Checkout\n2. Enter code in **Coupon** field\n3. Tap Apply ✅\n\n📲 Exclusive codes: ${WA}`;
  }

  // ── ALL MY ORDERS ──
  if (/my order|all order|order history|past order|previous|طلباتي|كل الطلبات|আমার সব অর্ডার|অর্ডার হিস্ট্রি/.test(q)) {
    const orders = (() => { try { return JSON.parse(localStorage.getItem('exg_orders') || '[]'); } catch(e) { return []; } })();
    if (orders.length > 0) {
      const statusEmoji = { pending:'⏳', confirmed:'✅', processing:'🔄', shipped:'🚚', delivered:'🎉', cancelled:'❌' };
      const lines = orders.slice(-5).reverse().map(o =>
        `${statusEmoji[o.status] || '📦'} **#${o.id}** — ${o.totalSAR ? cur + Math.round(o.totalSAR * rate) : ''} — ${o.status || 'pending'}`
      ).join('\n');
      return `📋 **Your Order History (${orders.length} total):**\n\n${lines}\n\n📲 For details on any order: ${WA}`;
    }
    return `📋 No orders yet on this device.\n\n🛍️ Start shopping at **exglobal.online**!\n\nUse code **WELCOME10** for 10% off your first order! 🎁`;
  }

  // ── PAYMENT (secondary) ──
  if (/stc|mada|apple pay|binance|cash.*delivery|cod/.test(q)) {
    if (/stc/.test(q)) return `📱 **STC Pay Guide:**\n\n1️⃣ Select STC Pay at checkout\n2️⃣ Enter your STC Pay phone number\n3️⃣ Approve in your STC Pay app\n4️⃣ Order confirmed! ✅\n\n📲 Issues? ${WA}`;
    if (/binance/.test(q)) return `💛 **Binance Pay Guide:**\n\n1️⃣ Select Binance Pay at checkout\n2️⃣ Open your Binance app\n3️⃣ Scan QR or enter Pay ID\n4️⃣ Send screenshot to WhatsApp ✅\n\n📲 ${WA}`;
    if (/cash|cod/.test(q)) return `💵 **Cash on Delivery (COD):**\n\n✅ Pay when your order arrives!\n✅ Available across Saudi Arabia\n💰 COD fee: SAR 5 (waived over SAR 200)`;
    return `💳 **Payment Methods:**\n\n💳 Card (Visa/Mada) · 📱 STC Pay · 💛 Binance · 💵 COD\n\n🔒 All payments 100% secure.\n📲 Help: ${WA}`;
  }

  // ── FLASH DEALS ──
  if (/flash|sale today|today.*deal|hot deal|فلاش|عرض اليوم|ফ্লাশ|আজকের ডিল/.test(q)) {
    const flash = PRODUCTS.filter(p => p.flash || p.discount >= 40).sort((a,b) => b.discount - a.discount).slice(0, 5);
    if (flash.length) {
      return `⚡ **Flash Deals — Limited Time!**\n\n` +
        flash.map(p => `🔥 ${p.names?.en || p.name} — ~~${cur}${Math.round((p.price/(1-p.discount/100))*rate)}~~ **${cur}${Math.round(p.price*rate)}** (-${p.discount}%)`).join('\n') +
        `\n\n⏰ Hurry! Flash deals end at midnight.\n🏷️ Extra 10% off with code **WELCOME10**`;
    }
    return `⚡ **Flash Deals** are live in the app!\n\nScroll down on the home screen to see the latest flash deals.\n\n🔔 Want deal alerts? WhatsApp us: ${WA}`;
  }

  // ── SIZE (secondary) ──
  if (/size|fit|measure|cm|inch|كم مقاس|قياس|সাইজ|মাপ|माप|कितना/.test(q)) {
    return `📏 **Size Guide:**\n\n👕 **Tops / Shirts:**\n• S = Chest 36–38" | M = 38–40" | L = 40–42" | XL = 42–44"\n\n👗 **Dresses / Abayas:**\n• S = UK 8–10 | M = UK 10–12 | L = UK 12–14 | XL = UK 14–16\n\n👟 **Shoes:**\n• EU 36=UK 3 | EU 38=UK 5 | EU 40=UK 6.5 | EU 42=UK 8\n\n💡 **Tip:** When between sizes, size **up**.\n📲 Custom help: ${WA}`;
  }

  // ── RETURNS (secondary) ──
  if (/return|refund|wrong.*item|damaged|exchange|إرجاع|استرداد|ফেরত|রিফান্ড|वापसी/.test(q)) {
    return `↩️ **Returns & Refunds Policy:**\n\n✅ **7-day return** from delivery date\n✅ Damaged/wrong items — full refund guaranteed\n\n**How to return:**\n1. WhatsApp us with your Order ID\n2. Send photos of the item\n3. We'll arrange pickup within 24 hours\n\n📲 Start a return: ${WA}`;
  }

  // ── ABOUT STORE (secondary) ──
  if (/who are you|about|exglobal|ex global|مين انتم|عن الشركة|কারা তোমরা|আপনারা কে|তোমাদের সম্পর্কে/.test(q)) {
    return `👑 **About EX GLOBAL SA:**\n\nWe are a **premium online fashion & lifestyle store** based in Saudi Arabia 🇸🇦\n\n🛍️ 1000+ products — fashion, beauty, electronics & more\n🚚 Fast delivery across all Saudi Arabia\n🔒 Secure payments — Card, STC, Binance, COD\n⭐ Rated 4.9/5 by 10,000+ customers\n\n📲 WhatsApp: ${WA}\n🌐 exglobal.online`;
  }

  // ── CONTACT (secondary) ──
  if (/contact|support|help|human|agent|speak|مساعدة|اتصل|যোগাযোগ|সাপোর্ট|সাহায্য|समर्थन/.test(q)) {
    return `📞 **Contact EX GLOBAL Support:**\n\n📲 **WhatsApp (fastest):** ${WA}\n⚡ Response time: under 5 minutes\n🕐 Available: 8AM – 12AM (Saudi time)\n\n📧 Email: support@exglobal.online\n📧 exglobalbusiness@gmail.com\n\n💬 Or chat here — I can answer most questions instantly!`;
  }

  // ══════════════════════════════════════════════════════
  //  ACTION COMMANDS — AI actually performs the action
  // ══════════════════════════════════════════════════════

  // ── OPEN CART ──
  if (/open cart|go.*cart|view cart|my cart|show cart|اذهب.*سلة|افتح.*سلة|কার্ট খোলো|কার্ট দেখাও|cart open/.test(q)) {
    const cart = (() => { try { return JSON.parse(localStorage.getItem('exg_cart') || '[]'); } catch(e) { return []; } })();
    const summary = cart.length ? `You have **${cart.length} item(s)** — total **${cur}${Math.round(cart.reduce((s,i)=>(s+(i.price||0)*(i.qty||1)),0)*rate)}**` : 'Your cart is currently empty.';
    return { text: `🛒 Opening your cart!\n\n${summary}`, action: () => openCart() };
  }

  // ── CHECKOUT / PAY NOW ──
  if (/checkout|pay now|place order|go.*pay|proceed.*pay|أكمل.*طلب|ادفع الآن|চেকআউট|পেমেন্ট করো|অর্ডার করো/.test(q)) {
    const cart = (() => { try { return JSON.parse(localStorage.getItem('exg_cart') || '[]'); } catch(e) { return []; } })();
    if (!cart.length) return `🛒 Your cart is empty! Add some products first before checking out.\n\n🛍️ Browse products and tap **Buy Now** to add items.`;
    const total = cart.reduce((s,i)=>(s+(i.price||0)*(i.qty||1)),0);
    return { text: `💳 Taking you to checkout!\n\n🛒 ${cart.length} item(s) — **${cur}${Math.round(total*rate)}**\n${total>=100?'✅ Free delivery!':'💡 Add '+(cur)+Math.round((100-total)*rate)+' more for free delivery'}\n\n⏱️ Estimated delivery: 2–4 days`, action: () => { closeAiChat(); setTimeout(openPayment, 500); } };
  }

  // ── OPEN WISHLIST ──
  if (/open.*wish|go.*wish|view.*wish|my.*wish|saved.*item|افتح.*مفضلة|পছন্দের তালিকা|উইশলিস্ট খোলো/.test(q)) {
    const wl = (() => { try { return JSON.parse(localStorage.getItem('exg_wishlist') || '[]'); } catch(e) { return []; } })();
    return { text: `❤️ Opening your wishlist!\n\nYou have **${wl.length} saved item(s)**.`, action: () => openWishlist() };
  }

  // ── OPEN PROFILE ──
  if (/my account|profile|open.*me|go.*account|my.*page|حسابي|ملفي|আমার অ্যাকাউন্ট|প্রোফাইল খোলো/.test(q)) {
    return { text: `👤 Opening your account page!`, action: () => { closeAiChat(); setTimeout(openMe, 400); } };
  }

  // ── SIGN OUT ──
  if (/sign out|log out|logout|signout|تسجيل خروج|خروج|সাইন আউট|লগআউট/.test(q)) {
    if (!currentUser) return `ℹ️ You're not currently signed in.`;
    return { text: `👋 Signing you out...`, action: () => { setTimeout(signOut, 400); } };
  }

  // ── SIGN IN ──
  if (/sign in|log in|login|signin|تسجيل دخول|دخول|সাইন ইন|লগইন/.test(q)) {
    if (currentUser) return `✅ You're already signed in as **${currentUser.name || currentUser.email}**!`;
    return { text: `🔑 Opening sign in...`, action: () => { closeAiChat(); setTimeout(openAuth, 400); } };
  }

  // ── SETTINGS ──
  if (/settings|setting|preferences|تفضيلات|إعدادات|সেটিংস/.test(q)) {
    return { text: `⚙️ Opening settings!`, action: () => { closeAiChat(); setTimeout(openSettings, 400); } };
  }

  // ── SIZE GUIDE ACTION ──
  if (/size guide|guide.*size|قياسات|دليل المقاسات|সাইজ গাইড/.test(q)) {
    return { text: `📏 Opening the size guide!`, action: () => openSizeGuide() };
  }

  // ── SPIN WHEEL ──
  if (/spin|lucky.*spin|wheel|spin.*wheel|عجلة الحظ|سبين|স্পিন|লাকি স্পিন/.test(q)) {
    return { text: `🎰 **Lucky Spin!** Opening the spin wheel — you might win a discount!\n\n🤞 Good luck!`, action: () => _showSpinWheel() };
  }

  // ── DAILY CHECK-IN ──
  if (/check.?in|daily.*reward|login.*reward|check in|চেক ইন|ডেইলি রিওয়ার্ড/.test(q)) {
    return { text: `📅 Opening daily check-in — earn free VIP points every day!`, action: () => doCheckin() };
  }

  // ── TRENDING PAGE ──
  if (/trending.*page|open.*trend|go.*trend|explore|صفحة.*رائج|ট্রেন্ডিং পেজ/.test(q)) {
    return { text: `🔥 Opening Trending page!`, action: () => { closeAiChat(); setTimeout(() => openTrendingPage('all'), 400); } };
  }

  // ── SHOW REVIEWS ──
  if (/show.*review|open.*review|read.*review|customer.*review|مراجعات|রিভিউ দেখাও/.test(q)) {
    return { text: `⭐ Opening customer reviews!`, action: () => openReviews() };
  }

  // ── WRITE A REVIEW ──
  if (/write.*review|add.*review|leave.*review|give.*review|اكتب.*تقييم|রিভিউ লিখো/.test(q)) {
    return { text: `✍️ Opening review form!`, action: () => openWriteReview() };
  }

  // ── VIP POINTS ──
  if (/vip.*point|my.*point|point.*balance|loyalty|نقاط|وفاء|ভিআইপি পয়েন্ট|পয়েন্ট/.test(q)) {
    const pts = _getVipPoints();
    const tier = _getVipTier(pts);
    return { text: `👑 **Your VIP Status:**\n\n🏆 Tier: **${tier.name}**\n⭐ Points: **${pts.toLocaleString()}**\n\n💡 Earn 10 points per SAR 1 spent!\n🎁 Redeem points for discounts at checkout.`, action: () => { closeAiChat(); setTimeout(openMe, 400); } };
  }

  // ── APPLY COUPON ──
  if (/apply.*coupon|use.*code|apply.*code|activate.*code|تفعيل.*كود|كوبون|কুপন apply|কোড লাগাও/.test(q)) {
    const codeMatch = q.match(/\b([A-Z0-9]{4,15})\b/i);
    const code = codeMatch ? codeMatch[1].toUpperCase() : null;
    if (code && COUPONS && COUPONS[code]) {
      return { text: `🏷️ Applying coupon **${code}**!\n\n${COUPONS[code].pct}% discount will be added. Go to cart to see the savings! 🎉`, action: () => { const ci = document.getElementById('couponInput'); if(ci){ci.value=code; const btn=document.querySelector('.coupon-apply-btn'); if(btn)btn.click(); else applyCoupon();} else {openCart();} } };
    }
    return `🏷️ **Available Coupons:**\n\n🎁 **WELCOME10** — 10% off (first order)\n🎂 **BDAY10** — 10% off (birthday)\n\nSay "apply WELCOME10" to use a code!`;
  }

  // ── ADD PRODUCT TO CART ──
  if (/add.*cart|put.*cart|cart.*add|أضف.*سلة|cart.*this|কার্টে যোগ করো|add (.+) to cart/.test(q)) {
    const nameQ = q.replace(/add|to cart|put|in cart|কার্টে|যোগ করো|أضف|سلة/gi, '').trim();
    if (nameQ.length > 2) {
      const found = PRODUCTS.filter(p => {
        const n = (p.names?.en || p.names?.bn || p.name || '').toLowerCase();
        return nameQ.split(' ').some(w => w.length > 2 && n.includes(w));
      }).slice(0, 3);
      if (found.length === 1) {
        const p = found[0];
        return { text: `✅ Adding **${p.names?.en || p.name}** to your cart!\n\n💰 Price: ${cur}${Math.round(p.price*rate)} (-${p.discount}% off)`, action: () => addToCart(p.id, p.names?.en || p.name, p.price, p.image || (p.images && p.images[0]), 1) };
      }
      if (found.length > 1) {
        return `🔍 Found ${found.length} matches:\n\n` + found.map((p,i) => `${i+1}. **${p.names?.en || p.name}** — ${cur}${Math.round(p.price*rate)}`).join('\n') + `\n\nBe more specific or tap the product to add it.`;
      }
    }
    return `🔍 Which product would you like to add? Try: *"add [product name] to cart"*`;
  }

  // ── OPEN/SHOW PRODUCT ──
  if (/open|show me|view|find|look for|see (.+)|ابحث عن|أريد أرى|দেখাও|খোলো/.test(q) && q.length > 8) {
    const nameQ = q.replace(/open|show me|view|find|look for|see|product|item|ابحث|أرى|দেখাও|খোলো/gi,'').trim();
    if (nameQ.length > 2) {
      const found = PRODUCTS.filter(p => {
        const n = (p.names?.en || p.names?.bn || p.name || '').toLowerCase();
        const c = (p.category || '').toLowerCase();
        return nameQ.split(' ').some(w => w.length > 2 && (n.includes(w) || c.includes(w)));
      }).slice(0, 4);
      if (found.length === 1) {
        const p = found[0];
        return { text: `👀 Opening **${p.names?.en || p.name}**!\n\n💰 ${cur}${Math.round(p.price*rate)} — **-${p.discount}% off**\n⭐ Rating: ${p.rating || 4.5}/5`, action: () => openModal(p.id) };
      }
      if (found.length > 1) {
        return `🛍️ **Found ${found.length} products:**\n\n` + found.map(p => `• **${p.names?.en || p.name}** — ${cur}${Math.round(p.price*rate)} (-${p.discount}%)`).join('\n') + `\n\nTap any product card to open it!`;
      }
    }
  }

  // ── FILTER BY CATEGORY ──
  if (/filter|browse|show.*category|category.*show|only.*show|فئة|تصفية|ফিল্টার করো|ক্যাটাগরি/.test(q)) {
    const catMap = { dress:'dress', abaya:'abaya', shirt:'tops', shoe:'shoes', bag:'bags', watch:'watches', beauty:'beauty', electronics:'electronics', perfume:'perfume', kids:'kids', jewelry:'jewelry' };
    for (const [kw, cat] of Object.entries(catMap)) {
      if (q.includes(kw)) {
        return { text: `🔍 Filtering products: **${cat}**!`, action: () => { closeAiChat(); setTimeout(() => filterCategory(cat), 400); } };
      }
    }
  }

  // ── SURPRISE RECOMMENDATION ──
  if (/surprise|random|anything|just pick|choose for me|فاجئني|اختر لي|সারপ্রাইজ|যা ভালো মনে করো/.test(q)) {
    const pool = PRODUCTS.filter(p => !p.outOfStock && p.discount >= 20);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) return { text: `🎲 **I picked something for you!**\n\n✨ **${pick.names?.en || pick.name}**\n💰 ${cur}${Math.round(pick.price*rate)} (**-${pick.discount}% off**)\n⭐ Rating: ${pick.rating || 4.5}/5\n\n👆 Want me to open it?`, action: () => openModal(pick.id) };
  }

  // ── SMART RECOMMENDATION ──
  if (/recommend|suggest|what.*buy|what.*should|best.*for me|ما.*أشتري|اقترح|কী কিনবো|কী নেবো/.test(q)) {
    const cart = (() => { try { return JSON.parse(localStorage.getItem('exg_cart') || '[]'); } catch(e) { return []; } })();
    const wl   = (() => { try { return JSON.parse(localStorage.getItem('exg_wishlist') || '[]'); } catch(e) { return []; } })();
    const cartCats = [...new Set(cart.map(i => i.category).filter(Boolean))];
    const pool = PRODUCTS.filter(p => !p.outOfStock && (cartCats.length ? cartCats.includes(p.category) : p.discount >= 30) && !cart.some(c=>c.id===p.id) && !wl.includes(p.id));
    const picks = pool.sort((a,b) => (b.reviews||0)-(a.reviews||0)).slice(0, 4);
    if (picks.length) {
      return `🤖 **AI Picks For You:**\n\n` + picks.map(p => `🔥 **${p.names?.en||p.name}** — ${cur}${Math.round(p.price*rate)} (**-${p.discount}%**) ⭐${p.rating||4.5}`).join('\n') + `\n\n💡 Based on your interests & top-rated items!`;
    }
    const top = [...PRODUCTS].sort((a,b)=>(b.reviews||0)-(a.reviews||0)).slice(0,4);
    return `🤖 **Top Picks Right Now:**\n\n` + top.map(p=>`⭐ **${p.names?.en||p.name}** — ${cur}${Math.round(p.price*rate)} (-${p.discount}%)`).join('\n');
  }

  // ── PRICE COMPARISON ──
  if (/compare|versus|vs\.|or.*better|কোনটা ভালো|তুলনা/.test(q)) {
    const words = q.replace(/compare|versus|vs|or|better|which|কোনটা|ভালো|তুলনা/gi,'').trim().split(/\s+and\s+|\s+vs\s+/i);
    if (words.length >= 2) {
      const findP = w => PRODUCTS.find(p => (p.names?.en||p.name||'').toLowerCase().includes(w.trim().toLowerCase()));
      const p1 = findP(words[0]), p2 = findP(words[1] || '');
      if (p1 && p2) {
        const winner = p1.discount > p2.discount ? p1 : p2;
        return `⚖️ **Product Comparison:**\n\n` +
          `**${p1.names?.en||p1.name}**\n💰 ${cur}${Math.round(p1.price*rate)} (-${p1.discount}%) ⭐${p1.rating||4.5}\n\n` +
          `**${p2.names?.en||p2.name}**\n💰 ${cur}${Math.round(p2.price*rate)} (-${p2.discount}%) ⭐${p2.rating||4.5}\n\n` +
          `🏆 Better deal: **${winner.names?.en||winner.name}** (${winner.discount}% off!)`;
      }
    }
    return `⚖️ To compare, say: *"compare dress A and shirt B"*`;
  }

  // ── BUDGET SHOPPER ──
  if (/budget|spend|afford|i have.*sar|under sar|sar \d+|সাড়|বাজেট/.test(q)) {
    const nums = q.match(/\d+/g);
    if (nums) {
      const budget = parseInt(nums[0]) / rate;
      const fits = PRODUCTS.filter(p => !p.outOfStock && p.price <= budget).sort((a,b) => b.discount-a.discount).slice(0, 5);
      if (fits.length) {
        return `💰 **Best picks under ${cur}${Math.round(budget*rate)}:**\n\n` +
          fits.map(p => `• **${p.names?.en||p.name}** — ${cur}${Math.round(p.price*rate)} (**-${p.discount}%**)`).join('\n') +
          `\n\n🎯 ${fits.length} items fit your budget!`;
      }
    }
  }

  // ── TRACK SPECIFIC ORDER NUMBER ──
  if (/#?ORD[0-9]+/i.test(q) || /order.*#?\d{10,}/i.test(q)) {
    const idMatch = q.match(/#?(ORD\d+|\d{10,})/i);
    const searchId = idMatch ? idMatch[1].toUpperCase() : '';
    const orders = (() => { try { return JSON.parse(localStorage.getItem('exg_orders') || '[]'); } catch(e) { return []; } })();
    const found = orders.find(o => o.id === searchId || o.id === 'ORD'+searchId);
    if (found) {
      const statusMap = { pending:'⏳ Pending', confirmed:'✅ Confirmed', processing:'🔄 Processing', shipped:'🚚 On the Way!', delivered:'🎉 Delivered', cancelled:'❌ Cancelled' };
      return `📦 **Order Found!**\n\n🔖 **#${found.id}**\n${statusMap[found.status] || found.status}\n💰 ${found.totalSAR ? cur+Math.round(found.totalSAR*rate) : ''}\n📅 ${found.date ? new Date(found.date).toLocaleDateString() : ''}\n\n📲 Live tracking: ${WA}`;
    }
    return `🔍 Order not found on this device.\n\nContact us with your Order ID:\n📲 ${WA}`;
  }

  // ── WHAT CAN YOU DO? ──
  if (/what can you|your capabilities|help me|what do you do|ماذا تستطيع|تساعدني|তুমি কী করতে পারো|কী কী পারো/.test(q)) {
    return `🤖 **I can do EVERYTHING for you:**\n\n🛒 **Shopping**\n• "Add [product] to cart"\n• "Show dresses under SAR 50"\n• "Surprise me with a pick"\n\n📦 **Orders**\n• "Track my order"\n• "Track #ORD123456"\n\n💳 **Payments**\n• "Take me to checkout"\n• "Apply WELCOME10"\n• "How to pay with STC?"\n\n🔧 **Controls**\n• "Open cart / wishlist / profile"\n• "Filter by dress / shoes / bags"\n• "Spin the wheel" · "Daily check-in"\n\n📊 **Info**\n• "My VIP points"\n• "Any coupons?"\n• "Size guide"\n• "Delivery info"\n\nJust ask naturally! 💬`;
  }

  // ══════════════════════════════════════════════════════
  //  SUPER POWER COMMANDS — language, theme, etc.
  // ══════════════════════════════════════════════════════

  if (/switch.*arabic|arabic.*mode|change.*arabic|اللغة العربية|عربي فقط/.test(q))
    return { text: '🌐 Switching to Arabic! / تحويل إلى العربية!', action: () => setLang('ar') };
  if (/switch.*bengali|bangla|বাংলা|change.*bangla/.test(q))
    return { text: '🌐 বাংলায় পরিবর্তন করছি!', action: () => setLang('bn') };
  if (/switch.*hindi|change.*hindi|हिंदी/.test(q))
    return { text: '🌐 Hindi में बदल रहे हैं!', action: () => setLang('hi') };
  if (/switch.*english|change.*english|english.*mode/.test(q))
    return { text: '🌐 Switching to English!', action: () => setLang('en') };

  if (/dark mode|night mode|dark.*theme|تصميم داكن|ডার্ক মোড|अंधेरा/.test(q))
    return { text: '🌙 Switching to Dark Mode!', action: () => { if (!document.body.classList.contains('dark')) toggleTheme(); } };

  if (/light mode|day mode|light.*theme|تصميم فاتح|লাইট মোড|उजाला/.test(q))
    return { text: '☀️ Switching to Light Mode!', action: () => { if (document.body.classList.contains('dark')) toggleTheme(); } };
  if (/mute|no sound|sound off|صامت|সাউন্ড বন্ধ|آواز بند/.test(q))
    return { text: '🔇 Sounds turned off!', action: () => { if (typeof soundEnabled !== 'undefined' && soundEnabled) toggleSound(); } };
  if (/unmute|sound on|turn on sound|صوت|সাউন্ড চালু/.test(q))
    return { text: '🔊 Sounds turned on!', action: () => { if (typeof soundEnabled !== 'undefined' && !soundEnabled) toggleSound(); } };
  if (/enable.*notif|turn on.*notif|اشعارات|নোটিফিকেশন চালু/.test(q))
    return { text: '🔔 Enabling push notifications!', action: () => requestNotifPermission() };

  // ── REORDER LAST ORDER ──
  if (/reorder|order again|buy again|repeat.*order|طلب مرة أخرى|আবার অর্ডার/.test(q)) {
    const orders = (() => { try { return JSON.parse(localStorage.getItem('exg_orders') || '[]'); } catch(e) { return []; } })();
    if (orders.length) {
      const last = orders[orders.length - 1];
      const itemList = (last.items || []).slice(0, 3).map(i => `• ${i.name || 'Item'} × ${i.qty || 1}`).join('\n');
      return { text: `🔄 **Reordering your last order!**\n\n${itemList || 'Your previous items'}\n\nAdding items to cart now...`, action: () => typeof orderAgain === 'function' && orderAgain(last.id) };
    }
    return `📦 No previous orders found. Start shopping and your order history will appear here!`;
  }

  // ── CLEAR CART ──
  if (/clear.*cart|empty.*cart|remove.*all.*cart|مسح.*سلة|কার্ট খালি করো|কার্ট ক্লিয়ার/.test(q)) {
    const cartNow = (() => { try { return JSON.parse(localStorage.getItem('exg_cart') || '[]'); } catch(e) { return []; } })();
    if (!cartNow.length) return `🛒 Your cart is already empty!`;
    return { text: `🗑️ Clearing your cart (${cartNow.length} item${cartNow.length > 1 ? 's' : ''} removed)...`, action: () => {
      localStorage.setItem('exg_cart', '[]');
      if (typeof cart !== 'undefined') { cart.length = 0; }
      if (typeof _saveCart === 'function') _saveCart();
      if (typeof renderCart === 'function') renderCart();
      if (typeof updateCartBadge === 'function') updateCartBadge();
    }};
  }

  // ── REMOVE FROM WISHLIST ──
  if (/remove.*wish|delete.*wish|clear.*wish|wish.*remove|احذف.*مفضلة|উইশলিস্ট থেকে সরাও/.test(q)) {
    return { text: `❤️ Opening wishlist — tap the ❤️ icon on any item to remove it.`, action: () => openWishlist() };
  }

  // ── GIFT FINDER ──
  if (/gift.*for|present.*for|shopping.*for|buy.*for|find.*gift|هدية لـ|উপহার|গিফট/.test(q)) {
    const personMap = { wife:'Women\'s fashion, perfume, beauty', husband:'Men\'s fashion, watches, electronics', mom:'Modest fashion, beauty, accessories', dad:'Electronics, watches, accessories', sister:'Fashion, beauty, bags', brother:'Electronics, shirts, shoes', friend:'Perfume, accessories, bags', baby:'Kids, baby fashion' };
    const nums = q.match(/\d+/g);
    const budget = nums ? parseInt(nums[0]) / rate : 200;
    const person = Object.keys(personMap).find(k => q.includes(k));
    const catKw = person ? personMap[person].split(',')[0].trim().toLowerCase() : '';
    const gifts = PRODUCTS.filter(p => !p.outOfStock && p.price <= budget && (!catKw || (p.names?.en||p.name||'').toLowerCase().includes(catKw) || (p.category||'').toLowerCase().includes(catKw))).sort((a,b) => b.discount - a.discount).slice(0, 4);
    const label = person ? `for your **${person}**` : 'as a gift';
    if (gifts.length) return `🎁 **Perfect gift ideas ${label} under ${cur}${Math.round(budget*rate)}:**\n\n` + gifts.map(p => `• **${p.names?.en||p.name}** — ${cur}${Math.round(p.price*rate)} (**-${p.discount}%**)`).join('\n') + `\n\n✨ All come in beautiful packaging! 📦\n📲 Order help: ${WA}`;
    return `🎁 For the perfect gift, try our **beauty, perfume or accessories** section!\n\n📲 Personal shopping: ${WA}`;
  }

  // ── SIZE RECOMMENDATION ──
  if (/(?:i am|i'm|my height|height.*cm|cm.*tall|\d+\s*cm|\d+\s*kg|weight.*kg)/.test(q)) {
    const cm = (q.match(/(\d{2,3})\s*cm/) || q.match(/(\d{2,3})\s*tall/))?.[1];
    const kg = q.match(/(\d{2,3})\s*kg/)?.[1];
    if (cm) {
      const h = parseInt(cm);
      const size = h < 158 ? 'XS–S' : h < 165 ? 'S–M' : h < 172 ? 'M–L' : h < 180 ? 'L–XL' : 'XL–XXL';
      const shoe = h < 158 ? '36–37' : h < 165 ? '37–38' : h < 172 ? '38–39' : h < 180 ? '39–41' : '41–43';
      return `📏 **Size Recommendation for ${cm}cm${kg ? ` / ${kg}kg` : ''}:**\n\n👗 Clothing: **${size}**\n👟 Shoes: **EU ${shoe}**\n\n💡 Tip: If between sizes, go **one size up** for comfort.\n📲 More help: ${WA}`;
    }
    return `📏 Tell me your height (cm) and I'll recommend the perfect size!\n\nExample: *"I am 165cm, what size?"*`;
  }

  // ── WHAT GOES WITH? (outfit / companion) ──
  if (/goes with|pair with|match with|outfit|coordinate|يناسب|يتناسب|কীসের সাথে মানাবে|কম্বিনেশন/.test(q)) {
    const nameQ = q.replace(/goes with|pair with|match with|outfit|coordinate|what|يناসب|কীসের সাথে|কম্বিনেশন/gi,'').trim();
    const src = PRODUCTS.find(p => nameQ.split(' ').some(w => w.length > 2 && (p.names?.en||p.name||'').toLowerCase().includes(w)));
    const catPairs = { dress:['bags','shoes','jewelry'], abaya:['bags','shoes'], tops:['bags','shoes'], shoes:['bags','dress'], bags:['dress','shoes','jewelry'], watches:['dress','tops'], perfume:['beauty','bags'], electronics:['accessories'] };
    const srcCat = src?.category || 'dress';
    const pairedCats = catPairs[srcCat] || ['bags','shoes'];
    const pairs = PRODUCTS.filter(p => !p.outOfStock && pairedCats.includes(p.category) && p.id !== src?.id).sort((a,b) => b.discount - a.discount).slice(0, 3);
    const label = src ? `**${src.names?.en||src.name}**` : 'your item';
    if (pairs.length) return `✨ **Perfect matches for ${label}:**\n\n` + pairs.map(p => `• **${p.names?.en||p.name}** (${p.category}) — ${cur}${Math.round(p.price*rate)} (-${p.discount}%)`).join('\n') + `\n\n🛒 Tap any product to view & add to cart!`;
    return `✨ Try pairing with accessories, bags or shoes from our collection!\n\n🛍️ Browse **Accessories** category for the best matches.`;
  }

  // ── SET BIRTHDAY ──
  if (/my birthday|birthday.*is|born on|birth.*date|عيد ميلادي|আমার জন্মদিন|জন্মতারিখ/.test(q)) {
    const dateMatch = q.match(/(\d{1,2})[\/\-\s](\d{1,2})(?:[\/\-\s](\d{2,4}))?/) || q.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})/i);
    if (dateMatch && currentUser) {
      return { text: `🎂 Birthday saved! You'll get a special **10% discount** voucher (BDAY10) on your birthday! 🎁`, action: () => {
        try {
          const months = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
          let m, d, y = new Date().getFullYear();
          if (dateMatch[0].match(/[a-z]/i)) { const mn=dateMatch[1].slice(0,3).toLowerCase(); m=months[mn]||1; d=parseInt(dateMatch[2]); } else { d=parseInt(dateMatch[1]); m=parseInt(dateMatch[2]); }
          const bday = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          currentUser.birthday = bday;
          localStorage.setItem('exglobal_user', JSON.stringify(currentUser));
          const bdi = document.getElementById('profileBirthday'); if(bdi) bdi.value = bday;
        } catch(e){}
      }};
    }
    if (!currentUser) return `🎂 Please **sign in** first, then tell me your birthday!\n\nSay *"sign in"* to get started.`;
    return `🎂 Tell me your birthday date!\n\nExample: *"My birthday is March 15"* or *"15/03"*\n\n🎁 You'll get a **10% off** gift voucher on your birthday!`;
  }

  // ── PRICE ALERT ──
  if (/alert|notify.*price|price.*drop|watch.*price|watch.*product|أبلغني.*سعر|দাম কমলে জানাও/.test(q)) {
    return { text: `🔔 **Price Alert Setup:**\n\n1️⃣ Enable notifications (say *"enable notifications"*)\n2️⃣ Add the product to your **Wishlist** ❤️\n3️⃣ We'll WhatsApp you when price drops!\n\n📲 Or tell us directly: ${WA}\n✏️ Include: product name + your target price`, action: () => requestNotifPermission() };
  }

  // ── SMART CART ANALYSIS (proactive tip) ──
  if (/analyse.*cart|analyze.*cart|cart.*tip|save.*money|best.*deal.*cart|cart.*coupon|تحليل.*سلة|কার্ট অ্যানালাইজ/.test(q)) {
    const cartNow = (() => { try { return JSON.parse(localStorage.getItem('exg_cart') || '[]'); } catch(e) { return []; } })();
    if (!cartNow.length) return `🛒 Your cart is empty! Add items and I'll analyze your savings.`;
    const total = cartNow.reduce((s,i) => s+(i.price||0)*(i.qty||1), 0);
    const tips = [];
    if (total >= 100) tips.push('✅ Free delivery unlocked!');
    else tips.push(`💡 Add ${cur}${Math.round((100-total)*rate)} more for **free delivery**`);
    if (!getUsedCoupons?.()?.includes?.('WELCOME10') && !isCouponUsed?.('WELCOME10')) tips.push('🏷️ Use **WELCOME10** for 10% off (saves ' + cur + Math.round(total*rate*0.1) + ')');
    const savings = cartNow.reduce((s,i) => { const orig = i.price/(1-(i.discount||0)/100); return s+(orig-i.price)*(i.qty||1); }, 0);
    return `🤖 **AI Cart Analysis:**\n\n🛒 ${cartNow.length} items — **${cur}${Math.round(total*rate)}**\n💰 Already saving: ${cur}${Math.round(savings*rate)} off original prices\n\n${tips.join('\n')}\n\n👉 Say *"go to checkout"* when ready!`;
  }

  // ── SCROLL TO SECTION ──
  if (/scroll.*top|go.*top|back.*top|العودة لأعلى|উপরে যাও|টপে যাও/.test(q))
    return { text: '⬆️ Going back to top!', action: () => { closeAiChat(); setTimeout(() => window.scrollTo({top:0,behavior:'smooth'}), 300); } };
  if (/scroll.*deal|go.*deal|deal.*section|go.*flash|عروض|ডিলে যাও/.test(q))
    return { text: '🔥 Scrolling to deals section!', action: () => { closeAiChat(); setTimeout(() => document.querySelector('.flash-deals-section, .section-flash, [id*="flash"]')?.scrollIntoView({behavior:'smooth'}), 300); } };

  // ── SHARE PRODUCT ──
  if (/share.*product|share.*item|send.*product|أرسل المنتج|পণ্য শেয়ার করো/.test(q)) {
    const nameQ = q.replace(/share|product|item|send|أرسل|শেয়ার|পণ্য/gi,'').trim();
    const found = PRODUCTS.find(p => nameQ.split(' ').some(w => w.length>2 && (p.names?.en||p.name||'').toLowerCase().includes(w)));
    if (found) return { text: `📤 Opening share for **${found.names?.en||found.name}**!`, action: () => { openModal(found.id); setTimeout(() => shareProduct?.(found.id), 600); } };
    return `📤 Open any product and tap the **Share** button to send it to friends!`;
  }

  // ── RECENTLY VIEWED ──
  if (/recently viewed|history|last.*viewed|viewed.*before|مشاهدة مؤخرا|সম্প্রতি দেখা/.test(q)) {
    const rv = (() => { try { return JSON.parse(localStorage.getItem('exg_recently_viewed') || '[]'); } catch(e) { return []; } })();
    if (rv.length) {
      const items = rv.slice(0,5).map(id => { const p=PRODUCTS.find(x=>x.id===id); return p ? `• **${p.names?.en||p.name}** — ${cur}${Math.round(p.price*rate)}` : null; }).filter(Boolean);
      return `👁️ **Recently Viewed:**\n\n${items.join('\n') || 'Items no longer available'}\n\nScroll down on the home screen to see the full history!`;
    }
    return `👁️ No recently viewed products yet.\n\nBrowse products and they'll appear here!`;
  }

  // ── WHATSAPP / LIVE CHAT ──
  if (/whatsapp|live.*chat|human|agent|speak.*human|real.*person|تحدث.*إنسان|মানুষের সাথে কথা/.test(q))
    return { text: `📲 Connecting you to our team on WhatsApp!\n\n⚡ Response time: under **5 minutes**\n🕐 Available: 8AM–12AM Saudi time`, action: () => window.open(WA, '_blank') };

  // ── CASUAL CONVERSATION / SMALL TALK ──
  const name1 = currentUser?.name ? currentUser.name.split(' ')[0] : '';
  const greetSuffix = name1 ? `, ${name1}` : '';

  // Greetings — broad match including typos (hllo, helo, hii, hai, hye, hey, etc.)
  if (/^(h+[aeiou]*l+[oO0]*|hi+|hey+|hye|হ্যালো|হাই|হেই|হেলো|হ্যালো|হেলো|সালাম|আস-সালামু|আসসালামু|ওয়ালাইকুম|নমস্কার|salaam|salam|assalam|namaste|مرحبا|أهلا|السلام|ola|bonjour|yo|sup|hola|holla|howdy)[\s!?।🙂😊]*$/i.test(q)) {
    const greets = [
      `হ্যালো${greetSuffix}! 😊 কেমন আছেন? কিছু জানতে চাইলে বলুন — আমি সাহায্য করতে এখানেই আছি! 🙋`,
      `হাই${greetSuffix}! 👋 আপনাকে দেখে ভালো লাগলো! কী জানতে চান?`,
      `আস-সালামুয়ালাইকুম${greetSuffix}! 😊 কেমন আছেন আপনি? যা মনে চায় জিজ্ঞেস করুন!`,
    ];
    return greets[Math.floor(Math.random() * greets.length)];
  }

  // How are you
  if (/ভালো আছ|কেমন আছ|কেমন আছেন|তুমি কি ভালো|আপনি ভালো|how are you|how r u|you ok|are you ok|how do you do|كيف حالك|كيف أنت/.test(q)) {
    const replies = [
      `হ্যাঁ${greetSuffix}, আলহামদুলিল্লাহ! আমি একদম সুপার! 😄 আপনি কেমন আছেন? কিছু লাগবে?`,
      `একদম ফাটাফাটি আছি${greetSuffix}! 💪 আপনি ভালো তো? আজকে কি শপিং করবেন?`,
      `জী, আলহামদুলিল্লাহ ভালো আছি${greetSuffix}! আপনার জন্য সবসময় রেডি! 🛍️`,
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  // Thank you
  if (/ধন্যবাদ|থ্যাংকস|শুক্রিয়া|thank you|thanks|thx|شكرا|شكراً|merci/.test(q)) {
    const replies = [
      `আপনাকে স্বাগতম${greetSuffix}! 😊 আর কোনো সাহায্য লাগবে?`,
      `এটাই আমার কাজ! আপনি খুশি হলে আমিও খুশি 😄 কিছু লাগলে বলুন!`,
      `আপনি আমাদের পরিবারের একজন${greetSuffix}! ধন্যবাদ EX GLOBAL তে শপিং করার জন্য 🎁`,
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  // Good morning/afternoon/night
  if (/সুপ্রভাত|শুভ সকাল|good morning|good afternoon|good evening|শুভ রাত|good night|শুভ রাতি|تصبح على خير|صباح الخير|مساء الخير/.test(q)) {
    const hr = new Date().getHours();
    const timeGreet = hr < 12 ? 'সুপ্রভাত' : hr < 17 ? 'শুভ বিকাল' : hr < 21 ? 'শুভ সন্ধ্যা' : 'শুভ রাতি';
    return `${timeGreet}${greetSuffix}! ☀️ EX GLOBAL এ আপনাকে স্বাগতম! আজকে কি কিনতে চান? দারুণ ডিল আছে 🔥`;
  }

  // Feeling sad / problem
  if (/মন খারাপ|কষ্ট পাচ্ছি|দুঃখিত|সমস্যা হচ্ছে|আমি দুঃখী|i am sad|feeling sad|i'm sad|bad day|problem|حزين|متضايق/.test(q)) {
    return `আহ${greetSuffix}, মন খারাপ হলে একটু শপিং করলে কেমন লাগে? 😄 আমার কাছে দারুণ সব প্রোডাক্ট আছে যা আপনাকে খুশি করবে!\n\n🛍️ *"সারপ্রাইজ দাও"* বললে আমি একটা বেস্ট প্রোডাক্ট বেছে দেব!\n\n❤️ আর কোনো সমস্যা থাকলে বলুন — আমি সাহায্য করতে পারি।`;
  }

  // Bored
  if (/বোরিং|বিরক্ত|bored|i'm bored|nothing to do|ملل/.test(q)) {
    const pool = PRODUCTS.filter(p => !p.outOfStock && p.discount >= 30);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return `বোরিং${greetSuffix}? তাহলে একটু শপিং করি! 😄\n\n🎁 এই প্রোডাক্টটা দেখুন — **${pick?.names?.[currentLang] || pick?.names?.en || 'সেরা পিক'}** — মাত্র **${cur}${pick ? Math.round(pick.price * rate) : '?'}** (**-${pick?.discount || 30}%**)!\n\n💡 *"সারপ্রাইজ দাও"* বললে আরো পিক পাবেন!`;
  }

  // Love / compliment to bot
  if (/তোমাকে ভালোবাসি|আই লাভ ইউ|i love you|you are great|you are awesome|তুমি দারুণ|তুমি ভালো|أحبك|رائع/.test(q)) {
    return `আরে${greetSuffix}! 😊❤️ আমিও আপনাকে ভালোবাসি (শপিং আর সাহায্যের মাধ্যমে)! আপনি চাইলে আজকে কিছু কিনে মনটাকে আরো খুশি করুন! 🛍️🎁`;
  }

  // Who are you / tell me about yourself
  if (/তুমি কে|তুমি কি|আপনি কে|who are you|what are you|are you ai|are you robot|are you human|من أنت|أنت روبوت/.test(q)) {
    return `আমি **EX GLOBAL Assistant** ${greetSuffix}! 🤖✨\n\nআমি একটা AI — কিন্তু শুধু জবাব না, আমি সরাসরি কাজ করতে পারি:\n\n🛒 কার্টে পণ্য যোগ করা\n📦 অর্ডার ট্র্যাক করা\n💳 চেকআউটে নিয়ে যাওয়া\n🎯 পণ্য খুঁজে দেওয়া\n\nকী দিয়ে শুরু করবেন? 😊`;
  }

  // Joke / funny
  if (/একটা জোক বলো|মজার কথা বলো|tell.*joke|joke|হাসাও|اضحكني/.test(q)) {
    const jokes = [
      `কেন শপিং করা উচিত? কারণ ডাক্তার বলেছেন "রিটেইল থেরাপি" সবচেয়ে ভালো! 😂 এই চিকিৎসা আমরাই দিই — EX GLOBAL তে!`,
      `একজন মানুষ দোকানে গেল। দোকানদার বললো: "কী চাই?" সে বললো: "সব কিছু ৭০% ছাড়ে।" দোকানদার বললো: "exglobal.online তে যান!" 😄`,
      `আমার জোক: আমি রোবট, কিন্তু শপিং করার ব্যাপারে আমি মানুষের চেয়ে স্মার্ট! কারণ আমি জানি সেরা ডিল কোথায় আছে 😂`,
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  // Time / date
  if (/কয়টা বাজে|এখন কত|what time|what's the time|what day|আজকে কি বার|اي ساعة/.test(q)) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dayStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return `🕐 এখন **${timeStr}** — **${dayStr}**\n\nআজকের ফ্ল্যাশ ডিল দেখতে বলুন: *"আজকের ডিল দেখাও"* 🔥`;
  }

  // OK / sure / alright (very short replies)
  if (/^(ok|okay|alright|sure|ঠিক আছে|ঠিকাছে|আচ্ছা|হ্যাঁ|জি|জি হ্যাঁ|نعم|حسناً|okay then)[\s!?।]*$/i.test(q)) {
    return `ঠিক আছে${greetSuffix}! 😊 কিছু লাগলে বলুন — আমি সবসময় এখানে আছি! আজকের ডিল দেখতে বলুন: *"আজকের অফার দেখাও"* 🛍️`;
  }

  // Bye / goodbye
  if (/বিদায়|আল্লাহ হাফেজ|bye|goodbye|take care|later|خداحافظ|مع السلامة|tata/.test(q)) {
    return `বিদায়${greetSuffix}! 👋 ভালো থাকুন! আবার আসবেন — নতুন ডিল নিয়ে সবসময় অপেক্ষায় আছি! 😊\n\n🛍️ exglobal.online`;
  }

  // Unrecognized — return null so sendAiMessage() forwards to the AI worker
  return null;
}

function _aiMarkdown(t) {
  return t
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\n/g,'<br>');
}

function _aiAppendMsg(role, text) {
  const box = document.getElementById('aiChatMessages');
  if (!box) return;
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg-' + role;
  if (role === 'assistant') {
    div.innerHTML = `<div class="ai-msg-logo"><span>EX</span></div><div class="ai-msg-content">${_aiMarkdown(text)}</div>`;
  } else {
    div.innerHTML = _aiMarkdown(text);
  }
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function _aiShowTyping() {
  const box = document.getElementById('aiChatMessages');
  if (!box) return;
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg-assistant ai-typing';
  div.id = 'aiTypingIndicator';
  div.innerHTML = '<div class="ai-msg-logo"><span>EX</span></div><div class="ai-msg-content"><span></span><span></span><span></span></div>';
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

  // Try local smart engine first — instant, no API quota
  const localResult = _localAiReply(text);
  if (localResult) {
    const replyText   = typeof localResult === 'object' ? localResult.text   : localResult;
    const replyAction = typeof localResult === 'object' ? localResult.action : null;
    inp.value = '';
    _aiAppendMsg('user', text);
    aiChatHistory.push({ role: 'user', content: text });
    if (aiChatHistory.length > 30) aiChatHistory.splice(0, aiChatHistory.length - 30);
    _aiShowTyping();
    _aiIncrUsage();
    setTimeout(() => {
      _aiRemoveTyping();
      _aiAppendMsg('assistant', replyText);
      aiChatHistory.push({ role: 'assistant', content: replyText });
      if (aiChatHistory.length > 30) aiChatHistory.splice(0, aiChatHistory.length - 30);
      if (typeof replyAction === 'function') setTimeout(replyAction, 420);
    }, 480);
    return;
  }

  // ── Gemini or Worker: send unrecognised questions to real AI ──
  inp.value = '';
  _aiAppendMsg('user', text);
  aiChatHistory.push({ role: 'user', content: text });
  if (aiChatHistory.length > 30) aiChatHistory.splice(0, aiChatHistory.length - 30);

  const workerUrl = getAiWorkerUrl();
  const hasGemini = !!getGeminiKey();

  if (!hasGemini && !workerUrl) {
    _aiIncrUsage();
    const _noWkMsg = {
      bn: `এই প্রশ্নের উত্তর দিতে AI key দরকার।\n\nAdmin → Settings → AI Chatbot → Gemini Key দিন।\n\nএখনই সাহায্য করতে পারি:\n🛍️ পণ্য · 📦 অর্ডার · 💳 পেমেন্ট · 🚚 ডেলিভারি`,
      en: `An AI key is needed to answer that.\n\nAdmin → Settings → AI Chatbot → add Gemini Key.\n\nI can help with:\n🛍️ Products · 📦 Orders · 💳 Payments · 🚚 Delivery`,
      ar: `مفتاح AI مطلوب للإجابة.\n\nAdmin → Settings → AI Chatbot → أضف Gemini Key.\n\nيمكنني المساعدة في: 🛍️ المنتجات · 📦 الطلبات · 💳 الدفع`,
    };
    _aiAppendMsg('assistant', _noWkMsg[currentLang] || _noWkMsg.en);
    return;
  }

  _aiShowTyping();
  const sendBtn = document.getElementById('aiChatSendBtn');
  if (sendBtn) sendBtn.disabled = true;
  try {
    let reply = null;

    if (hasGemini) {
      reply = await _callGemini(aiChatHistory, text);
    }

    if (!reply && workerUrl) {
      const resp = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: aiChatHistory, userLang: _aiDetectLang(text) })
      });
      const data = await resp.json();
      reply = data?.content?.[0]?.text || null;
    }

    _aiRemoveTyping();
    if (!reply) reply = currentLang === 'bn' ? 'দুঃখিত, উত্তর দিতে পারিনি। আবার চেষ্টা করুন।' : 'Sorry, could not respond. Please try again.';
    aiChatHistory.push({ role: 'assistant', content: reply });
    if (aiChatHistory.length > 30) aiChatHistory.splice(0, aiChatHistory.length - 30);
    _aiAppendMsg('assistant', reply);
    _aiIncrUsage();
  } catch(e) {
    _aiRemoveTyping();
    _aiAppendMsg('assistant', currentLang === 'bn' ? 'সংযোগ সমস্যা। ইন্টারনেট চেক করে আবার চেষ্টা করুন।' : 'Connection error. Please check your internet and try again.');
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

/* ── Voice Input ── */
let _aiSpeechRec = null;
function _aiVoiceInput() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) { showToast('Voice input not supported on this browser.'); return; }
  const btn  = document.getElementById('aiMicBtn');
  const icon = document.getElementById('aiMicIcon');
  const inp  = document.getElementById('aiChatInput');
  if (_aiSpeechRec) {
    _aiSpeechRec.stop(); _aiSpeechRec = null;
    btn?.classList.remove('listening');
    icon?.classList.replace('fa-stop','fa-microphone');
    return;
  }
  _aiSpeechRec = new SpeechRec();
  _aiSpeechRec.lang = currentLang === 'ar' ? 'ar-SA' : currentLang === 'bn' ? 'bn-BD' : currentLang === 'hi' ? 'hi-IN' : 'en-US';
  _aiSpeechRec.interimResults = true;
  _aiSpeechRec.maxAlternatives = 1;
  btn?.classList.add('listening');
  icon?.classList.replace('fa-microphone','fa-stop');
  _aiSpeechRec.onresult = e => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    if (inp) inp.value = transcript;
  };
  _aiSpeechRec.onend = () => {
    _aiSpeechRec = null;
    btn?.classList.remove('listening');
    icon?.classList.replace('fa-stop','fa-microphone');
    if (inp?.value.trim()) sendAiMessage();
  };
  _aiSpeechRec.onerror = () => {
    _aiSpeechRec = null;
    btn?.classList.remove('listening');
    icon?.classList.replace('fa-stop','fa-microphone');
    showToast('Could not hear you. Please try again.');
  };
  _aiSpeechRec.start();
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
    // Recovery: clear any inline display:none set by old cached JS
    if (fab.style.display === 'none') fab.style.display = '';
    if (fab.style.opacity === '0') fab.style.opacity = '';

    const STORE_KEY = 'exg_ai_fab_pos';
    const W = 54, H = 62, EDGE = 12;

    // Restore saved position (with bounds clamp to prevent off-screen restore)
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (saved) {
        const vw = window.innerWidth, vh = window.innerHeight;
        const safeLeft = Math.max(EDGE, Math.min(saved.left, vw - W - EDGE));
        const safeTop  = Math.max(EDGE, Math.min(saved.top,  vh - H - EDGE - 70));
        fab.style.left   = safeLeft + 'px';
        fab.style.top    = safeTop  + 'px';
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

function _showSecInputSheet(opts) {
  let sheet = document.getElementById('secInputSheet');
  if (!sheet) {
    sheet = document.createElement('div');
    sheet.id = 'secInputSheet';
    sheet.className = 'sec-input-sheet';
    document.body.appendChild(sheet);
  }
  sheet.innerHTML = `
    <div class="sis-bg" onclick="_closeSecSheet()"></div>
    <div class="sis-card">
      <div class="sis-handle"></div>
      <div class="sis-icon"><i class="${opts.icon}"></i></div>
      <h3 class="sis-title">${opts.title}</h3>
      ${opts.sub ? `<p class="sis-sub">${opts.sub}</p>` : ''}
      <input class="sis-input" id="sisInput" type="${opts.inputType||'text'}" placeholder="${opts.placeholder||''}" value="${opts.value||''}" autocomplete="off" />
      ${opts.input2 ? `<input class="sis-input" id="sisInput2" type="${opts.input2Type||'text'}" placeholder="${opts.input2Placeholder||''}" autocomplete="off" style="margin-top:10px" />` : ''}
      <div class="sis-btns">
        <button class="sis-cancel" onclick="_closeSecSheet()">${t('cancel')||'Cancel'}</button>
        <button class="sis-save" onclick="_saveSecSheet()">${t('save')||'Save'}</button>
      </div>
    </div>
  `;
  sheet._onSave = opts.onSave;
  sheet.style.display = 'flex';
  setTimeout(() => sheet.querySelector('.sis-card').classList.add('open'), 10);
  setTimeout(() => document.getElementById('sisInput')?.focus(), 300);
}

function _closeSecSheet() {
  const sheet = document.getElementById('secInputSheet');
  if (!sheet) return;
  sheet.querySelector('.sis-card')?.classList.remove('open');
  setTimeout(() => { sheet.style.display = 'none'; }, 280);
}

function _saveSecSheet() {
  const sheet = document.getElementById('secInputSheet');
  if (sheet && sheet._onSave) {
    const v1 = document.getElementById('sisInput')?.value || '';
    const v2 = document.getElementById('sisInput2')?.value || '';
    sheet._onSave(v1, v2);
  }
}

function secPhoneEdit() {
  const sec = JSON.parse(localStorage.getItem('exg_security') || '{}');
  _showSecInputSheet({
    icon: 'fas fa-mobile-screen',
    title: t('phoneNumber') || 'Phone Number',
    sub: 'Enter your Saudi or international phone number',
    placeholder: '+966 5XX XXX XXXX',
    inputType: 'tel',
    value: sec.phone || '',
    onSave(val) {
      const clean = val.trim();
      if (clean && !/^\+?[\d\s\-]{7,16}$/.test(clean)) { showToast('❌ ' + (t('invalidPhone')||'Invalid phone number')); return; }
      sec.phone = clean;
      localStorage.setItem('exg_security', JSON.stringify(sec));
      _closeSecSheet();
      _secRefresh();
      showToast('✓ ' + (t('phoneAdded')||'Phone saved'));
    }
  });
}

function secEmailEdit() {
  const user = JSON.parse(localStorage.getItem('exglobal_user') || 'null');
  _showSecInputSheet({
    icon: 'fas fa-envelope',
    title: t('emailLabel') || 'Email Address',
    sub: 'Update your account email',
    placeholder: 'example@email.com',
    inputType: 'email',
    value: (user && user.email) || '',
    onSave(val) {
      const clean = val.trim();
      if (clean && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) { showToast('❌ ' + (t('enterValidEmail')||'Invalid email')); return; }
      if (user) { user.email = clean; localStorage.setItem('exglobal_user', JSON.stringify(user)); }
      _closeSecSheet();
      _secRefresh();
      showToast('✓ ' + (t('emailUpdated')||'Email updated'));
    }
  });
}

function secPasswordEdit() {
  const sec = JSON.parse(localStorage.getItem('exg_security') || '{}');
  _showSecInputSheet({
    icon: 'fas fa-key',
    title: t('passwordLabel') || 'Password',
    sub: 'Set a strong password (min 6 characters)',
    placeholder: 'New password',
    inputType: 'password',
    input2: true,
    input2Type: 'password',
    input2Placeholder: 'Confirm password',
    onSave(val, val2) {
      if (!val || val.length < 6) { showToast('❌ ' + (t('passwordTooShort')||'Password too short')); return; }
      if (val !== val2) { showToast('❌ Passwords do not match'); return; }
      sec.hasPassword = true;
      sec.passwordAt = Date.now();
      localStorage.setItem('exg_security', JSON.stringify(sec));
      _closeSecSheet();
      _secRefresh();
      showToast('✓ ' + (t('passwordChanged')||'Password set'));
    }
  });
}

function sec2FAToggle() {
  const sec = JSON.parse(localStorage.getItem('exg_security') || '{}');
  if (!sec.twoFA) {
    _showSecInputSheet({
      icon: 'fas fa-lock',
      title: '2FA Verification',
      sub: 'Enter the 6-digit code from your authenticator app to enable 2FA',
      placeholder: '000000',
      inputType: 'number',
      onSave(val) {
        if (!/^\d{6}$/.test(val.trim())) { showToast('❌ Enter valid 6-digit code'); return; }
        sec.twoFA = true;
        localStorage.setItem('exg_security', JSON.stringify(sec));
        _closeSecSheet();
        _secRefresh();
        showToast('✅ 2FA enabled — account secured!');
      }
    });
  } else {
    sec.twoFA = false;
    localStorage.setItem('exg_security', JSON.stringify(sec));
    _secRefresh();
    showToast(t('twoFactorDisabled') || '2FA disabled');
  }
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
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const total = cart.reduce((s, i) => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return s + (p ? p.price * i.qty * (lang.rate || 1) : 0);
  }, 0);
  document.getElementById('abandonTotal').textContent = (lang.currency || 'SAR ') + Math.round(total);
  document.getElementById('abandonCount').textContent = cart.reduce((s,i)=>s+i.qty,0);
  // Populate product thumbnails
  const itemsEl = document.getElementById('abandonItems');
  if (itemsEl) {
    const previewItems = cart.slice(0, 4);
    itemsEl.innerHTML = previewItems.map(i => {
      const p = PRODUCTS.find(x => x.id === i.id);
      if (!p) return '';
      return `<div class="aband-thumb"><img src="${p.image}" onerror="this.src='https://picsum.photos/seed/${p.id}/80/80'" />${i.qty > 1 ? `<span class="aband-qty-badge">×${i.qty}</span>` : ''}</div>`;
    }).join('') + (cart.length > 4 ? `<div class="aband-more-thumb">+${cart.length - 4}</div>` : '');
  }
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
  // Deal countdowns
  _startDealCountdowns();
})();

/* ===== BRAND DEALS AUTO-SCROLL ===== */
const _BRAND_DEALS = [
  { brand: "Women's Fashion", offer: "30-70% OFF", cat: "women",  img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=280&fit=crop&q=80" },
  { brand: "Bags",            offer: "Up to 50% OFF", cat: "bags",  img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=280&fit=crop&q=80" },
  { brand: "Shoes",           offer: "Under SAR 99",  cat: "shoes", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=280&fit=crop&q=80" },
  { brand: "Beauty",          offer: "Buy 2 Get 1",   cat: "beauty",img: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=280&fit=crop&q=80" },
  { brand: "Men's Style",     offer: "40-60% OFF",    cat: "men",   img: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=300&h=280&fit=crop&q=80" },
  { brand: "Jewelry",         offer: "Starting SAR 15",cat:"jewelry",img:"https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&h=280&fit=crop&q=80"},
  { brand: "Electronics",     offer: "Best Deals",    cat: "electronics", img: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=300&h=280&fit=crop&q=80" },
  { brand: "Kids' World",     offer: "Up to 45% OFF", cat: "kids",  img: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=300&h=280&fit=crop&q=80" },
];

function renderMysteryBoxes() {
  const wrap = document.getElementById('mboxScroll');
  if (!wrap) return;
  const boxes = PRODUCTS.filter(p => p.category === 'mystery');
  if (!boxes.length) { document.getElementById('mboxSection')?.style && (document.getElementById('mboxSection').style.display = 'none'); return; }
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  wrap.innerHTML = boxes.map(p => {
    const origPrice = p.discount > 0 ? Math.round(p.price / (1 - p.discount / 100)) : 0;
    const inWish = wishlist.includes(p.id);
    const sold = p.sold ? `<div class="mbox-card-sold">${p.sold} ${T.soldOnCard||T.soldText||'sold'}</div>` : '';
    return `
    <div class="mbox-card" onclick="openModal(${p.id})">
      <button class="mbox-wish wish-btn ${inWish?'active':''}" onclick="event.stopPropagation();toggleWish(${p.id},this)">
        <i class="${inWish?'fas':'far'} fa-heart"></i>
      </button>
      <div class="mbox-card-img-wrap">
        <img src="${p.image}" loading="lazy" alt="" onerror="this.src='https://picsum.photos/seed/mb${p.id}/300/300'"/>
        <div class="mbox-card-badge">🎁 Mystery</div>
      </div>
      <div class="mbox-card-body">
        <div class="mbox-card-name">${p.names?.[currentLang]||p.names?.en||''}</div>
        ${sold}
        <div class="mbox-card-price-row">
          ${origPrice?`<span class="mbox-card-orig">${T.currency}${Math.round(origPrice*T.rate)}</span>`:''}
          <span class="mbox-card-price">${T.currency}${Math.round(p.price*T.rate)}</span>
        </div>
        <div class="mbox-card-hint"><i class="fas fa-check-circle"></i> Lower priced than similar</div>
      </div>
    </div>`;
  }).join('');
}

function renderBrandDeals() {
  const track = document.getElementById('bdealTrack');
  if (!track || track.children.length > 0) return; // already rendered
  // Double for seamless infinite loop
  const cards = [..._BRAND_DEALS, ..._BRAND_DEALS].map(d => `
    <div class="bdeal-card" onclick="filterCategory('${d.cat}');document.querySelector('.tab-btn[data-tab=products]')?.click();window.scrollTo({top:document.getElementById('productsSection')?.offsetTop-60,behavior:'smooth'})">
      <img class="bdeal-card-img" src="${d.img}" loading="lazy" alt="${d.brand}" onerror="this.style.background='#f0f0f0'" />
      <div class="bdeal-card-body">
        <div class="bdeal-card-brand">${d.brand}</div>
        <div class="bdeal-card-offer">${d.offer}</div>
      </div>
    </div>
  `).join('');
  track.innerHTML = cards;
}

/* ===== VIP LOYALTY SYSTEM ===== */
const _VIP_TIERS = [
  {name:'Bronze', min:0,    icon:'🥉', color:'#cd7f32', perks:['5% off every 5th order','Early access deals']},
  {name:'Silver', min:1000, icon:'🥈', color:'#a8a9ad', perks:['8% off every 3rd order','Free ship over SAR 100','Priority support']},
  {name:'Gold',   min:5000, icon:'🥇', color:'#ffd700', perks:['12% VIP discount','Free shipping always','Exclusive products','Birthday bonus']}
];
function _getVipPoints() { return parseInt(localStorage.getItem('exg_vip_pts') || '0'); }
function _addVipPoints(pts) {
  const cur = _getVipPoints() + Math.round(pts);
  localStorage.setItem('exg_vip_pts', cur);
}
function _getVipTier(pts) {
  let tier = _VIP_TIERS[0];
  for (const ti of _VIP_TIERS) { if (pts >= ti.min) tier = ti; }
  return tier;
}
function _renderVipBlock() {
  const el = document.getElementById('vipBlock');
  if (!el) return;
  const pts = _getVipPoints();
  const tier = _getVipTier(pts);
  const nextTier = _VIP_TIERS.find(ti => ti.min > pts);
  const pct = nextTier ? Math.min(100, Math.round((pts - tier.min) / (nextTier.min - tier.min) * 100)) : 100;
  const canRedeem = pts >= 500;
  el.innerHTML = `
    <div class="vip-block">
      <div class="vip-top-row">
        <div class="vip-tier-badge" style="background:linear-gradient(135deg,${tier.color}22,${tier.color}44);border:1.5px solid ${tier.color}">
          <span class="vip-tier-icon">${tier.icon}</span>
          <span class="vip-tier-name" style="color:${tier.color}">${tier.name} VIP</span>
        </div>
        <div class="vip-pts-box">
          <span class="vip-pts-num">${pts.toLocaleString()}</span>
          <span class="vip-pts-label">${t('points')||'Points'}</span>
        </div>
      </div>
      ${nextTier ? `
      <div class="vip-progress-wrap">
        <div class="vip-progress-bar"><div class="vip-progress-fill" style="width:${pct}%;background:linear-gradient(90deg,${tier.color},${nextTier.color})"></div></div>
        <div class="vip-progress-label">${pts.toLocaleString()} / ${nextTier.min.toLocaleString()} pts → ${nextTier.icon} ${nextTier.name}</div>
      </div>` : `<div class="vip-top-achieved">🏆 ${t('topTier')||'Highest Tier!'}</div>`}
      <div class="vip-perks">
        ${tier.perks.map(pk => `<span class="vip-perk"><i class="fas fa-check-circle"></i> ${pk}</span>`).join('')}
      </div>
      <button class="vip-redeem-btn${canRedeem?'':' disabled'}" onclick="${canRedeem?'redeemVipPoints()':''}" ${canRedeem?'':'disabled'}>
        <i class="fas fa-gift"></i> ${canRedeem ? (t('redeemPoints')||'Redeem 500 pts → 5% OFF') : (t('needMore')||'Need 500 pts to redeem')}
      </button>
      <div class="vip-earn-hint"><i class="fas fa-circle-info"></i> ${t('earnHint')||'Earn 10 pts per SAR spent on every order'}</div>
    </div>
  `;
}
function redeemVipPoints() {
  const pts = _getVipPoints();
  if (pts < 500) return;
  localStorage.setItem('exg_vip_pts', pts - 500);
  COUPONS['VIP5OFF'] = { pct: 5, oneTime: false };
  showToast('🎁 ' + (t('redeemSuccess')||'VIP5OFF coupon added — 5% off your next order!'));
  _renderVipBlock();
}

/* ===== RECENTLY VIEWED ===== */
function _trackView(id) {
  let viewed = JSON.parse(localStorage.getItem('exg_viewed') || '[]');
  viewed = [id, ...viewed.filter(v => v !== id)].slice(0, 10);
  localStorage.setItem('exg_viewed', JSON.stringify(viewed));
  renderRecentlyViewed();
}
function renderRecentlyViewed() {
  const el = document.getElementById('rvSection');
  if (!el) return;
  const ids = JSON.parse(localStorage.getItem('exg_viewed') || '[]');
  const prods = ids.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean).slice(0, 8);
  if (prods.length < 2) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.innerHTML = `
    <div class="rv-head">
      <span class="rv-title"><i class="fas fa-clock-rotate-left"></i> ${t('recentlyViewed')||'Recently Viewed'}</span>
    </div>
    <div class="rv-strip">${prods.map(p => _dealMiniCard(p)).join('')}</div>
  `;
}

/* ===== RELATED PRODUCTS ===== */
function _relatedHTML(p) {
  const related = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id)
    .sort(() => 0.5 - Math.random()).slice(0, 10);
  if (!related.length) return '';
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  return `
    <div class="prel-wrap lux-reveal">
      <div class="prel-header">
        <span class="prel-title">You May Also Like</span>
        <span class="prel-count">${related.length} items</span>
      </div>
      <div class="prel-scroll">
        ${related.map(r => `
          <div class="prel-card" onclick="closeModal();setTimeout(()=>openModal(${r.id}),120)">
            <div class="prel-img-wrap">
              <img class="prel-img" src="${r.image}" loading="lazy" onerror="this.src='https://picsum.photos/seed/r${r.id}/200/260'" />
              ${r.discount >= 20 ? `<span class="prel-disc-badge">-${r.discount}%</span>` : ''}
            </div>
            <div class="prel-info">
              <div class="prel-name">${(r.names?.en || r.name || 'Product').substring(0, 26)}</div>
              <div class="prel-price">${T.currency || 'SAR '}${(r.price * (T.rate || 1)).toFixed(0)}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

/* ===== SPIN TO WIN ===== */
const _SPIN_SEGMENTS = [
  {label:'5% OFF',    code:'SPIN5',    pct:5,  color:'#e91e8c'},
  {label:'FREE SHIP', code:'FREESHIP', pct:0,  color:'#9415f5'},
  {label:'10% OFF',   code:'SPIN10',   pct:10, color:'#ff8c00'},
  {label:'Try Again', code:null,       pct:0,  color:'#888'},
  {label:'WELCOME10', code:'WELCOME10',pct:10, color:'#e83e8c'},
  {label:'8% OFF',    code:'SPIN8',    pct:8,  color:'#00b894'},
  {label:'Mystery 🎁',code:'MYSTERY15',pct:15, color:'#6c5ce7'},
  {label:'15% OFF',   code:'SPIN15',   pct:15, color:'#d63031'}
];
function _showSpinWheel() {
  if (localStorage.getItem('exg_spin_shown')) return;
  const ov = document.getElementById('spinOverlay');
  if (ov) { ov.classList.add('open'); _drawSpinWheel(); }
}
function closeSpinWheel() {
  localStorage.setItem('exg_spin_shown', '1');
  const ov = document.getElementById('spinOverlay');
  if (ov) ov.classList.remove('open');
}
function _drawSpinWheel() {
  const canvas = document.getElementById('spinCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width = canvas.height = 260;
  const cx = size / 2, cy = size / 2, r = cx - 6;
  const seg = (2 * Math.PI) / _SPIN_SEGMENTS.length;
  _SPIN_SEGMENTS.forEach((s, i) => {
    const start = i * seg - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + seg);
    ctx.fillStyle = s.color; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + seg / 2);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10.5px sans-serif';
    ctx.textAlign = 'right'; ctx.fillText(s.label, r - 8, 4);
    ctx.restore();
  });
  ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.fillStyle = '#e91e8c'; ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('EX', cx, cy + 3);
}
let _spinning = false;
function doSpin() {
  if (_spinning) return;
  _spinning = true;
  const btn = document.getElementById('spinBtn');
  if (btn) btn.disabled = true;
  const canvas = document.getElementById('spinCanvas');
  if (!canvas) return;
  const seg = 360 / _SPIN_SEGMENTS.length;
  const winner = Math.floor(Math.random() * _SPIN_SEGMENTS.length);
  const totalDeg = 1440 + (360 - winner * seg - seg / 2);
  let start = null;
  const dur = 4200;
  function ease(t) { return 1 - Math.pow(1 - t, 4); }
  (function step(ts) {
    if (!start) start = ts;
    const prog = Math.min((ts - start) / dur, 1);
    canvas.style.transform = `rotate(${ease(prog) * totalDeg}deg)`;
    if (prog < 1) { requestAnimationFrame(step); return; }
    _spinning = false;
    localStorage.setItem('exg_spin_shown', '1');
    _applySpinPrize(_SPIN_SEGMENTS[winner]);
  })(performance.now());
}
function _applySpinPrize(prize) {
  const disp = document.getElementById('spinPrizeDisplay');
  if (prize.code && prize.pct > 0) {
    COUPONS[prize.code] = { pct: prize.pct, oneTime: false };
    if (disp) disp.innerHTML = `<div class="spin-prize-win">🎉 ${t('youWon')||'You Won!'}<br><b>${prize.label}</b><br><small>${t('couponCode')||'Code'}: <b>${prize.code}</b></small></div>`;
    showToast('🎉 ' + prize.label + ' — ' + (t('couponAdded')||'Coupon added!'));
  } else if (prize.code === 'FREESHIP') {
    localStorage.setItem('exg_free_ship', '1');
    if (disp) disp.innerHTML = `<div class="spin-prize-win">🎉 ${t('youWon')||'You Won!'}<br><b>Free Shipping!</b></div>`;
    showToast('🎉 Free Shipping unlocked!');
  } else {
    if (disp) disp.innerHTML = `<div class="spin-prize-try">😅 ${t('tryAgain')||'Better luck next time!'}</div>`;
  }
}

/* ===== IMAGE ZOOM ===== */
function _openImgZoom(src) {
  const ov = document.createElement('div');
  ov.className = 'img-zoom-overlay';
  ov.innerHTML = `<img class="img-zoom-img" src="${src}" /><button class="img-zoom-close" onclick="this.parentElement.remove()"><i class="fas fa-xmark"></i></button>`;
  let scale = 1, startDist = 0;
  const img = ov.querySelector('img');
  ov.addEventListener('touchstart', e => {
    if (e.touches.length === 2) startDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  }, {passive:true});
  ov.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      scale = Math.min(4, Math.max(1, scale * (d / startDist)));
      img.style.transform = `scale(${scale})`;
      startDist = d;
    }
  }, {passive:true});
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  document.body.appendChild(ov);
}

/* ===== ENHANCED FILTERS ===== */
function renderFilterRow() {
  const el = document.getElementById('filterRow');
  if (!el) return;
  const allColors = [...new Set(PRODUCTS.flatMap(p => p.colors || []))].slice(0, 18);
  const maxPrice = currentPriceMax >= 9999 ? 500 : currentPriceMax;
  el.innerHTML = `
    <div class="filter-row">
      <div class="filter-section">
        <span class="filter-label">${t('maxPrice')||'Max Price'}</span>
        <input type="range" class="filter-price-slider" min="50" max="500" value="${maxPrice}" step="10"
          oninput="document.getElementById('priceVal').textContent='SAR '+this.value;filterByPrice(parseInt(this.value))" />
        <span class="filter-price-val" id="priceVal">${currentPriceMax >= 9999 ? (t('any')||'Any') : 'SAR '+currentPriceMax}</span>
      </div>
      <button class="filter-clear-btn" onclick="clearFilters()"><i class="fas fa-xmark"></i> ${t('clearAll')||'Clear'}</button>
    </div>
  `;
}
function filterByPrice(max) {
  currentPriceMax = max >= 500 ? 9999 : max;
  visibleCount = 8;
  renderProducts();
  renderActiveFilters();
}
function filterByColor(hex) {
  if (currentColors.includes(hex)) currentColors = currentColors.filter(c => c !== hex);
  else currentColors.push(hex);
  visibleCount = 8;
  renderProducts();
  renderFilterRow();
  renderActiveFilters();
}
function clearFilters() {
  currentPriceMax = 9999;
  currentColors = [];
  visibleCount = 8;
  renderProducts();
  renderFilterRow();
  renderActiveFilters();
}
function renderActiveFilters() {
  const el = document.getElementById('activeFilters');
  if (!el) return;
  const chips = [];
  if (currentPriceMax < 9999) chips.push(`<span class="af-chip">≤ SAR ${currentPriceMax} <button onclick="filterByPrice(500)"><i class="fas fa-xmark"></i></button></span>`);
  currentColors.forEach(c => chips.push(`<span class="af-chip"><span class="af-chip-swatch" style="background:${c}"></span> <button onclick="filterByColor('${c}')"><i class="fas fa-xmark"></i></button></span>`));
  el.innerHTML = chips.length ? `<div class="active-filters-row">${chips.join('')}</div>` : '';
}

/* ===== SIZE GUIDE ===== */
const _SIZE_CHARTS = {
  women: { cols:['Size','Chest (cm)','Waist (cm)','Hips (cm)'], rows:[['XS','80-83','62-65','88-91'],['S','84-87','66-69','92-95'],['M','88-91','70-73','96-99'],['L','92-95','74-77','100-103'],['XL','96-99','78-81','104-107'],['XXL','100-104','82-86','108-112']] },
  men:   { cols:['Size','Chest (cm)','Waist (cm)','Shoulder (cm)'], rows:[['S','88-92','76-80','42-43'],['M','92-96','80-84','43-44'],['L','96-100','84-88','44-45'],['XL','100-104','88-92','45-46'],['XXL','104-108','92-96','46-47']] },
  kids:  { cols:['Size','Age','Height (cm)','Weight (kg)'], rows:[['2Y','2-3 yrs','92-98','13-15'],['3Y','3-4 yrs','98-104','15-17'],['4Y','4-5 yrs','104-110','17-19'],['5Y','5-6 yrs','110-116','19-21'],['6Y','6-7 yrs','116-122','21-24']] },
  shoes: { cols:['EU','UK','US (Women)','US (Men)','Foot (cm)'], rows:[['36','3.5','5.5','4','23'],['37','4','6','5','23.5'],['38','5','7','6','24'],['39','6','8','7','25'],['40','6.5','8.5','7.5','25.5'],['41','7','9','8','26'],['42','8','10','9','27'],['43','9','11','10','27.5'],['44','9.5','11.5','10.5','28']] },
  default:{ cols:['Size','Chest (cm)','Waist (cm)'], rows:[['S','84-87','66-69'],['M','88-91','70-73'],['L','92-95','74-77'],['XL','96-99','78-81'],['XXL','100-104','82-86']] }
};
function openSizeGuide(cat) {
  const chart = _SIZE_CHARTS[cat] || _SIZE_CHARTS[(cat==='bags'||cat==='jewelry'||cat==='beauty')?'default':cat] || _SIZE_CHARTS.default;
  const ov = document.getElementById('sizeGuideOverlay');
  const content = document.getElementById('sizeGuideContent');
  if (!ov || !content) return;
  content.innerHTML = `
    <div class="sg-title"><i class="fas fa-ruler"></i> ${t('sizeGuide')||'Size Guide'}</div>
    <div class="sg-hint">${t('sgHint')||'Measure yourself and compare with the chart below'}</div>
    <div class="sg-table-wrap">
      <table class="sg-table">
        <thead><tr>${chart.cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${chart.rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
    <div class="sg-tips">
      <div class="sg-tip"><i class="fas fa-tape"></i> ${t('sgTip1')||'Measure your chest at the fullest point'}</div>
      <div class="sg-tip"><i class="fas fa-child"></i> ${t('sgTip2')||'Measure waist at the narrowest point'}</div>
      <div class="sg-tip"><i class="fas fa-info-circle"></i> ${t('sgTip3')||'If between sizes, go one size up'}</div>
    </div>
    <button class="sg-close-btn" onclick="closeSizeGuide()"><i class="fas fa-times"></i> ${t('close')||'Close'}</button>
  `;
  ov.classList.add('open');
}
function closeSizeGuide() {
  document.getElementById('sizeGuideOverlay')?.classList.remove('open');
}

/* ===== BACK IN STOCK NOTIFY ===== */
function notifyStock(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const key = 'exg_notify_' + id;
  if (localStorage.getItem(key)) {
    showToast('✅ ' + (t('alreadyNotify')||"You're already on the waitlist!"));
    return;
  }
  localStorage.setItem(key, Date.now());
  const btn = document.querySelector('.notify-stock-btn');
  if (btn) { btn.innerHTML = '<i class="fas fa-check-circle"></i> ' + (t('notifySet')||"We'll notify you!"); btn.style.background='#10b981'; btn.style.color='#fff'; }
  showToast('🔔 ' + (t('notifySuccess')||"Added to waitlist! We'll notify you when back in stock."));
}

/* ===== SAVE FOR LATER ===== */
let savedLater = JSON.parse(localStorage.getItem('exg_saved_later') || '[]');
function saveForLater(id) {
  if (!savedLater.includes(id)) savedLater.push(id);
  cart = cart.filter(i => i.id !== id);
  _saveCart();
  localStorage.setItem('exg_saved_later', JSON.stringify(savedLater));
  renderCart();
  showToast('🔖 ' + (t('savedLater')||'Saved for later'));
}
function moveToCart(id) {
  savedLater = savedLater.filter(x => x !== id);
  localStorage.setItem('exg_saved_later', JSON.stringify(savedLater));
  addToCart(id, '', '');
  renderCart();
}
function _renderSavedLater() {
  const el = document.getElementById('savedLaterSection');
  if (!el) return;
  if (!savedLater.length) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  const items = savedLater.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  el.innerHTML = `<div class="sl-head"><i class="fas fa-bookmark"></i> ${t('savedLater')||'Saved for Later'} (${items.length})</div>` +
    items.map(p => `<div class="sl-item">
      <img class="sl-img" src="${p.image}" loading="lazy"/>
      <div class="sl-info">
        <div class="sl-name">${getName(p)}</div>
        <div class="sl-price">${fmt(p.price)}</div>
        <button class="sl-move-btn" onclick="moveToCart(${p.id})"><i class="fas fa-cart-plus"></i> ${t('moveToCart')||'Move to Cart'}</button>
      </div>
    </div>`).join('');
}

/* ===== GIFT WRAPPING IN CART ===== */
let _giftWrap = false;
const GIFT_WRAP_SAR = 5;
function toggleGiftWrap() {
  _giftWrap = !_giftWrap;
  const el = document.getElementById('giftWrapRow');
  const tot = document.getElementById('cartTotal');
  const gw = document.getElementById('giftWrapCheck');
  if (gw) gw.checked = _giftWrap;
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const fmtD = v => lang.currency + Math.round(v).toLocaleString();
  if (el) el.style.display = _giftWrap ? '' : 'none';
  showToast(_giftWrap ? '🎁 ' + (t('giftWrapAdded')||'Gift wrapping added!') : (t('giftWrapRemoved')||'Gift wrap removed'));
}

/* ===== BUNDLE DEAL ===== */
function setBundleQty(qty, id, el) {
  document.querySelectorAll('.lux-bundle-opt').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  _modalQty = qty;
  const price = document.getElementById('modalQtyPrice');
  const p = PRODUCTS.find(x => x.id === id);
  if (p && price) {
    let disc = qty === 2 ? 0.10 : qty === 3 ? 0.15 : 0;
    const total = p.price * qty * (1 - disc);
    const lang = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    price.textContent = lang.currency + Math.round(total * lang.rate).toLocaleString();
  }
  const qn = document.getElementById('modalQtyNum');
  if (qn) qn.textContent = qty;
}

/* ===== PRODUCT Q&A ===== */
const _QA_DATA = {
  women: [
    {q:'What is the fabric material?', a:'Premium quality polyester blend, soft and breathable.'},
    {q:'Does this run true to size?', a:'Yes, please refer to the Size Guide for accurate measurements.'},
    {q:'Is this suitable for formal occasions?', a:'Yes, perfect for both casual and semi-formal events.'}
  ],
  men: [
    {q:'What fabric is used?', a:'High-quality cotton or cotton-poly blend, depending on the item.'},
    {q:'How should I wash this?', a:'Machine wash cold with similar colors. Do not bleach or tumble dry.'},
    {q:'Is this wrinkle-resistant?', a:'This fabric is easy-care and minimally wrinkle-prone.'}
  ],
  shoes: [
    {q:'Do shoes fit true to size?', a:'We recommend ordering your regular size. See the Size Guide for EU/US conversions.'},
    {q:'What is the sole material?', a:'Durable rubber sole for comfort and grip.'},
    {q:'Are these shoes waterproof?', a:'Not fully waterproof, but water-resistant for light rain.'}
  ],
  beauty: [
    {q:'Is this product halal-certified?', a:'Yes, all our beauty products are halal-certified and cruelty-free.'},
    {q:'What is the shelf life?', a:'24 months unopened, 12 months after opening.'},
    {q:'Is this suitable for sensitive skin?', a:'Yes, formulated for all skin types including sensitive skin.'}
  ],
  default: [
    {q:'What is the return policy?', a:'30-day hassle-free returns. Item must be unused and in original packaging.'},
    {q:'How long does delivery take?', a:'2–5 business days within Saudi Arabia. Express delivery available.'},
    {q:'Is this product authentic?', a:'100% authentic product. We guarantee the quality of all items.'}
  ]
};
function _qaHTML(p) {
  const qa = _QA_DATA[p.category] || _QA_DATA.default;
  return `
    <div class="modal-qa">
      <div class="modal-qa-title"><i class="fas fa-circle-question"></i> ${t('qaTitle')||'Questions & Answers'}</div>
      ${qa.map((item, i) => `
        <div class="qa-item" id="qa_${p.id}_${i}">
          <div class="qa-question" onclick="toggleQa('qa_${p.id}_${i}')">
            <span>${item.q}</span><i class="fas fa-chevron-down qa-chev"></i>
          </div>
          <div class="qa-answer">${item.a}</div>
        </div>`).join('')}
    </div>
    <div class="modal-divider"></div>`;
}
function toggleQa(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('open');
}

/* ===== DAILY CHECK-IN ===== */
function _checkDailyCheckin() {
  const today = new Date().toDateString();
  const last = localStorage.getItem('exg_checkin_date');
  const streak = parseInt(localStorage.getItem('exg_checkin_streak') || '0');
  if (last === today) return { done: true, streak, pts: 50 };
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const newStreak = last === yesterday ? streak + 1 : 1;
  return { done: false, streak: newStreak, pts: newStreak >= 7 ? 100 : 50 };
}
function doCheckin() {
  const { done, streak, pts } = _checkDailyCheckin();
  if (done) { showToast('✅ ' + (t('checkinDone')||'Already checked in today!')); return; }
  const today = new Date().toDateString();
  localStorage.setItem('exg_checkin_date', today);
  localStorage.setItem('exg_checkin_streak', streak);
  _addVipPoints(pts);
  showToast('🎉 +' + pts + ' ' + (t('points')||'pts') + ' — ' + (t('checkinSuccess')||'Daily check-in complete!') + (streak >= 7 ? ' 🔥 7-day bonus!' : ''));
}
function _renderCheckinBlock() {
  const el = document.getElementById('checkinBlock');
  if (!el) return;
  const { done, streak, pts } = _checkDailyCheckin();
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const todayIdx = (new Date().getDay() + 6) % 7;
  el.innerHTML = `
    <div class="checkin-block">
      <div class="checkin-head">
        <span class="checkin-title"><i class="fas fa-calendar-check"></i> ${t('dailyCheckin')||'Daily Check-in'}</span>
        <span class="checkin-streak">🔥 ${streak} ${t('dayStreak')||'day streak'}</span>
      </div>
      <div class="checkin-days">${days.map((d,i) => `
        <div class="checkin-day ${i<todayIdx?'done':i===todayIdx?(done?'done today':'today'):''}">
          <div class="cd-dot"><i class="fas fa-${i<=todayIdx&&done?'check':i<todayIdx?'check':'star'}"></i></div>
          <div class="cd-label">${d}</div>
        </div>`).join('')}
      </div>
      <button class="checkin-btn${done?' done':''}" onclick="doCheckin()" ${done?'disabled':''}>
        <i class="fas fa-${done?'check-circle':'gift'}"></i>
        ${done ? (t('checkinDone')||'Checked In!') : `+${pts} ${t('points')||'pts'} — ${t('checkIn')||'Check In Now'}`}
      </button>
    </div>
  `;
}

/* ===== ORDER AGAIN ===== */
function orderAgain(orderId) {
  const orders = JSON.parse(localStorage.getItem('exg_orders') || '[]');
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  let added = 0;
  (order.items || []).forEach(i => {
    const p = PRODUCTS.find(x => x.id === i.id);
    if (p && p.stock !== 0) { addToCart(i.id, i.size || '', i.color || ''); added++; }
  });
  if (added > 0) { openCart(); showToast('🛒 ' + added + ' ' + (t('itemsAddedCart')||'items added to cart')); }
  else showToast('❌ ' + (t('noItemsAvail')||'These items are no longer available'));
}

/* ===== REFERRAL PROGRAM ===== */
function _renderReferralBlock() {
  const el = document.getElementById('referralBlock');
  if (!el) return;
  const code = currentUser ? ('EXG' + (currentUser.email || 'GUEST').split('@')[0].toUpperCase().slice(0, 6)) : 'EXG' + Math.random().toString(36).slice(2,7).toUpperCase();
  const pts = _getVipPoints();
  const referralCount = parseInt(localStorage.getItem('exg_referrals') || '0');
  el.innerHTML = `
    <div class="referral-block">
      <div class="ref-head">
        <span class="ref-title"><i class="fas fa-users"></i> ${t('referFriend')||'Refer & Earn'}</span>
      </div>
      <div class="ref-body">
        <div class="ref-reward-line">
          <i class="fas fa-gift" style="color:#e91e8c"></i>
          <span>${t('refReward')||'You & your friend each earn <b>150 pts</b> (≈ SAR 15)'}</span>
        </div>
        <div class="ref-code-row">
          <span class="ref-code">${code}</span>
          <button class="ref-copy-btn" onclick="navigator.clipboard.writeText('${code}').then(()=>showToast('✅ Code copied!'))"><i class="fas fa-copy"></i></button>
        </div>
        <div class="ref-share-row">
          <button class="ref-wa-btn" onclick="window.open('https://wa.me/?text=${encodeURIComponent('Join EX GLOBAL and get 10% off your first order! Use my code: '+code+' — https://exglobal.online')}','_blank')">
            <i class="fab fa-whatsapp"></i> ${t('shareWhatsApp')||'Share via WhatsApp'}
          </button>
        </div>
        <div class="ref-count"><i class="fas fa-users-line"></i> ${referralCount} ${t('friendsJoined')||'friends joined'}</div>
      </div>
    </div>
  `;
}

/* ===== CUSTOMER REVIEWS STRIP ===== */
const _STRIP_REVIEWS = [
  { name: 'Fatima Al-Zahrani', city: 'Riyadh', stars: 5, text: 'Amazing quality! Exactly as described. Fast delivery too 🙌', avatar: 'https://i.pravatar.cc/60?img=47' },
  { name: 'Mohammed Al-Otaibi', city: 'Jeddah', stars: 5, text: 'Best online shopping experience in Saudi. Love EX GLOBAL! 💯', avatar: 'https://i.pravatar.cc/60?img=12' },
  { name: 'Sara Al-Qahtani', city: 'Dammam', stars: 5, text: 'Received in 2 days, perfect packaging, beautiful product ✨', avatar: 'https://i.pravatar.cc/60?img=49' },
  { name: 'Ahmed Al-Rashidi', city: 'Mecca', stars: 5, text: 'Very professional store. Will definitely order again 🛍️', avatar: 'https://i.pravatar.cc/60?img=8' },
  { name: 'Nora Al-Harbi', city: 'Medina', stars: 5, text: 'Great prices and super fast shipping. Highly recommend! ⭐', avatar: 'https://i.pravatar.cc/60?img=44' },
  { name: 'Khalid Al-Shammari', city: 'Tabuk', stars: 5, text: 'My wife loved the gift! Beautiful wrapping, on time 🎁', avatar: 'https://i.pravatar.cc/60?img=15' },
  { name: 'Reem Al-Dosari', city: 'Khobar', stars: 5, text: 'Quality exceeds expectation. Customer service is amazing 💕', avatar: 'https://i.pravatar.cc/60?img=51' },
  { name: 'Omar Al-Ghamdi', city: 'Riyadh', stars: 5, text: 'Fast, reliable, premium. This is my go-to Saudi store 🔥', avatar: 'https://i.pravatar.cc/60?img=19' },
];

let _revIdx = 0, _revTimer = null;

function renderReviewsStrip() {
  const el = document.getElementById('reviewsStrip');
  if (!el) return;

  const dots = _STRIP_REVIEWS.map((_, i) =>
    `<button class="rstrip-dot ${i === 0 ? 'active' : ''}" onclick="_revGo(${i})"></button>`
  ).join('');

  el.innerHTML = `
    <div class="rstrip-wrap">
      <div class="rstrip-header">
        <span class="rstrip-title">⭐ ${t('customerReviews') || 'Customer Reviews'}</span>
        <span class="rstrip-verified"><i class="fas fa-shield-check"></i> ${t('verifiedBuyer') || 'Verified Buyers'}</span>
      </div>
      <div class="rstrip-track" id="rstripTrack">
        ${_STRIP_REVIEWS.map((r, i) => `
          <div class="rstrip-card ${i === 0 ? 'active' : ''}" data-idx="${i}">
            <img class="rstrip-avatar" src="${r.avatar}" onerror="this.src='https://picsum.photos/seed/rv${i}/60/60'" alt="">
            <div class="rstrip-body">
              <div class="rstrip-top">
                <span class="rstrip-name">${r.name}</span>
                <span class="rstrip-city"><i class="fas fa-location-dot"></i> ${r.city}</span>
              </div>
              <div class="rstrip-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
              <p class="rstrip-text">${r.text}</p>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="rstrip-dots">${dots}</div>
    </div>
  `;

  _revIdx = 0;
  clearInterval(_revTimer);
  _revTimer = setInterval(() => _revGo((_revIdx + 1) % _STRIP_REVIEWS.length), 4000);
}

function _revGo(idx) {
  _revIdx = idx;
  const track = document.getElementById('rstripTrack');
  if (!track) return;
  track.querySelectorAll('.rstrip-card').forEach((c, i) => c.classList.toggle('active', i === idx));
  document.querySelectorAll('.rstrip-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
}

/* ===== ZATCA PHASE 1 QR INVOICE ===== */
function _zatcaQR(total, vat) {
  function tlv(tag, v) { const e=new TextEncoder().encode(v); return [tag,e.length,...e]; }
  const b=[...tlv(1,'EXG Global Trading'),...tlv(2,'310000000000003'),...tlv(3,new Date().toISOString()),...tlv(4,total.toFixed(2)),...tlv(5,vat.toFixed(2))];
  return btoa(String.fromCharCode(...b));
}
function _showZatcaInvoice(orderId, totalSAR) {
  const el = document.getElementById('zatcaInvoiceBox');
  if (!el) return;
  const vat = +(totalSAR * 0.15).toFixed(2);
  const excl = +(totalSAR - vat).toFixed(2);
  const qid = 'zqr_' + orderId;
  el.innerHTML = `<div class="zatca-invoice">
    <div class="zatca-header"><span class="zatca-logo">EXG Global Trading</span><span class="zatca-inv-label">فاتورة ضريبية · Tax Invoice</span></div>
    <div class="zatca-details">
      <div class="zatca-row"><span>VAT No.</span><span>310000000000003</span></div>
      <div class="zatca-row"><span>Invoice #</span><span>${orderId}</span></div>
      <div class="zatca-row"><span>Date</span><span>${new Date().toLocaleDateString('en-SA')}</span></div>
      <div class="zatca-row"><span>Excl. VAT</span><span>SAR ${excl.toFixed(2)}</span></div>
      <div class="zatca-row"><span>VAT 15%</span><span>SAR ${vat.toFixed(2)}</span></div>
      <div class="zatca-row zatca-total"><b>Total</b><b>SAR ${totalSAR.toFixed(2)}</b></div>
    </div>
    <div class="zatca-qr-wrap"><div id="${qid}"></div><p class="zatca-scan">Scan to verify · ZATCA Phase 1</p></div>
  </div>`;
  el.style.display = 'block';
  try { if(typeof QRCode!=='undefined') new QRCode(document.getElementById(qid),{text:_zatcaQR(totalSAR,vat),width:120,height:120,correctLevel:QRCode.CorrectLevel.M}); } catch(e){}
}

/* ===== FREQUENTLY BOUGHT TOGETHER ===== */
function _fbtHTML(p) {
  const same = PRODUCTS.filter(x => x.id !== p.id && x.category === p.category).slice(0, 2);
  if (same.length < 1) return '';
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const rate = T.rate || 1;
  const cur = T.currency || 'SAR ';
  const items = [p, ...same];
  const bundleTotal = (items.reduce((s,x) => s + x.price, 0) * rate).toFixed(0);
  const discount = Math.round((items.length - 1) * 5);
  return `
  <div class="pfbt-wrap lux-reveal">
    <div class="pfbt-header">
      <span class="pfbt-title"><i class="fas fa-layer-group"></i> Frequently Bought Together</span>
      <span class="pfbt-save-badge">Save ${discount}%</span>
    </div>
    <div class="pfbt-items">
      ${items.map((x, i) => `
        <div class="pfbt-item" onclick="closeModal();setTimeout(()=>openModal(${x.id}),120)">
          <div class="pfbt-img-wrap">
            <img src="${x.image}" class="pfbt-img" loading="lazy" onerror="this.src='https://picsum.photos/seed/fbt${x.id}/200/200'" />
            ${i === 0 ? '<span class="pfbt-this">This Item</span>' : ''}
          </div>
          <div class="pfbt-name">${(x.names?.en || x.name || 'Product').substring(0, 22)}</div>
          <div class="pfbt-price">${cur}${(x.price * rate).toFixed(0)}</div>
        </div>
        ${i < items.length - 1 ? '<div class="pfbt-plus"><i class="fas fa-plus"></i></div>' : ''}
      `).join('')}
    </div>
    <div class="pfbt-footer">
      <div class="pfbt-total-info">
        <span class="pfbt-total-label">Bundle Total</span>
        <span class="pfbt-total-price">${cur}${bundleTotal}</span>
      </div>
      <button class="pfbt-add-btn" onclick="${items.map(x => `addToCart(${x.id})`).join(';')};showToast('🛍 ${items.length} items added to cart!')">
        <i class="fas fa-cart-plus"></i> Add All to Cart
      </button>
    </div>
  </div>`;
}

/* ===== LIVE ACTIVITY NOTIFICATIONS ===== */
const _LIVE_NAMES = ['Fatima','Aisha','Maryam','Noura','Hessa','Sara','Lina','Reem','Dana','Nadia','Omar','Ahmed','Mohammed','Abdullah','Khalid','Faisal','Yousef','Ali','Hassan','Ibrahim'];
const _LIVE_CITIES = ['Riyadh','Jeddah','Dammam','Mecca','Medina','Khobar','Abha','Taif','Tabuk','Najran'];
let _liveActTimer = null;

function _startLiveActivity() {
  if (!PRODUCTS || !PRODUCTS.length) return;
  const box = document.getElementById('liveActivityBox');
  if (!box) return;
  function _show() {
    const p = PRODUCTS[Math.floor(Math.random() * Math.min(PRODUCTS.length, 30))];
    const name = _LIVE_NAMES[Math.floor(Math.random() * _LIVE_NAMES.length)];
    const city = _LIVE_CITIES[Math.floor(Math.random() * _LIVE_CITIES.length)];
    const pname = p.names?.en || p.nameEn || 'a product';
    box.innerHTML = `<div class="la-inner"><span class="la-avatar">${name[0]}</span><span class="la-text"><b>${name}</b> from <b>${city}</b> just ordered<br><em>${pname.length>32?pname.slice(0,32)+'…':pname}</em></span><span class="la-check">✓</span></div>`;
    box.classList.add('la-show');
    setTimeout(() => box.classList.remove('la-show'), 4500);
  }
  _show();
  _liveActTimer = setInterval(_show, 9000);
}

/* ===== PRODUCT COMPARISON ===== */
let compareList = [];
function addToCompare(id) {
  if (compareList.includes(id)) { showToast('Already in compare list'); return; }
  if (compareList.length >= 2) { showToast('Select only 2 products to compare'); return; }
  compareList.push(id);
  _renderCompareBar();
  if (compareList.length === 2) openCompare();
}
function _renderCompareBar() {
  const bar = document.getElementById('compareBar');
  if (!bar) return;
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const names = compareList.map(id => { const p = PRODUCTS.find(x => x.id === id); return p ? (p.names?.en || 'Product') : '?'; });
  bar.style.display = compareList.length === 0 ? 'none' : 'flex';
  bar.innerHTML = `<span class="cmpbar-text">⚖ Compare: ${names.join(' vs ')}</span><button class="cmpbar-go" onclick="if(compareList.length===2)openCompare()">Compare</button><button class="cmpbar-x" onclick="clearCompare()">✕</button>`;
}
function openCompare() {
  const [a, b] = compareList.map(id => PRODUCTS.find(x => x.id === id));
  if (!a || !b) return;
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const overlay = document.getElementById('compareModal');
  if (!overlay) return;
  const cur = T.currency || 'SAR ';
  const rate = T.rate || 1;
  const row = (label, va, vb) => `<tr><td class="cmpt-label">${label}</td><td>${va}</td><td>${vb}</td></tr>`;
  overlay.innerHTML = `<div class="compare-modal"><button class="cmp-close" onclick="closeCompare()">✕</button><h3 class="cmp-title">⚖ Compare Products</h3><div class="compare-table-wrap"><table class="compare-table"><thead><tr><th></th><th><img src="${a.image}" class="cmp-img" onerror="this.src='https://picsum.photos/seed/ca/80/80'"><div class="cmp-pname">${(a.names?.en||'Product').slice(0,28)}</div></th><th><img src="${b.image}" class="cmp-img" onerror="this.src='https://picsum.photos/seed/cb/80/80'"><div class="cmp-pname">${(b.names?.en||'Product').slice(0,28)}</div></th></tr></thead><tbody>${row('Price', cur+(a.price*rate).toFixed(0), cur+(b.price*rate).toFixed(0))}${row('Discount', a.discount?'-'+a.discount+'%':'-', b.discount?'-'+b.discount+'%':'-')}${row('Rating', '⭐ '+a.rating, '⭐ '+b.rating)}${row('Reviews', (a.ratingCount||0).toLocaleString(), (b.ratingCount||0).toLocaleString())}${row('Sold', (a.sold||'-')+'+ sold', (b.sold||'-')+'+ sold')}${row('Category', a.category||'-', b.category||'-')}${row('Stock', a.stock===0?'Out of Stock':a.stock<=5?'Only '+a.stock+' left':'In Stock', b.stock===0?'Out of Stock':b.stock<=5?'Only '+b.stock+' left':'In Stock')}</tbody></table></div><div class="cmp-actions"><button class="cmp-add-btn" onclick="closeCompare();addToCart(${a.id})"><i class="fas fa-cart-plus"></i> Add to Cart</button><button class="cmp-add-btn" onclick="closeCompare();addToCart(${b.id})"><i class="fas fa-cart-plus"></i> Add to Cart</button></div></div>`;
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeCompare() {
  const overlay = document.getElementById('compareModal');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}
function clearCompare() {
  compareList = [];
  _renderCompareBar();
}

/* ===== SCROLL REVEAL ===== */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  // Pre-trigger reveals 300px before they enter viewport → no white flash on fast scroll
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0, rootMargin: '0px 0px 300px 0px' });
  els.forEach(el => obs.observe(el));

  // Safety fallback: force-show all reveals after 400ms
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => el.classList.add('visible'));
    const nr = document.getElementById('nrSection');
    if (nr && !nr.classList.contains('nr-visible')) nr.classList.add('nr-visible');
  }, 400);
}

/* ===== ESTIMATED DELIVERY ===== */
function _deliveryRange() {
  const now = new Date();
  const d1 = new Date(now); d1.setDate(d1.getDate() + 2);
  const d2 = new Date(now); d2.setDate(d2.getDate() + 4);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[d1.getDay()]}, ${months[d1.getMonth()]} ${d1.getDate()} – ${days[d2.getDay()]}, ${months[d2.getMonth()]} ${d2.getDate()}`;
}

/* ══════════════════════════════════════════════
   EX GLOBAL LUXURY BRAND UPGRADE  (JS v160)
   ══════════════════════════════════════════════ */

/* ── LIVE VISITOR COUNTER ── */
function _startLiveCounter() {
  const bar = document.getElementById('liveCounterBar');
  const txt = document.getElementById('liveCountText');
  if (!bar || !txt) return;
  let count = 38 + Math.floor(Math.random() * 40);
  txt.textContent = count + ' people viewing now';
  setInterval(() => {
    const delta = Math.floor(Math.random() * 7) - 3;
    count = Math.max(18, Math.min(count + delta, 120));
    txt.textContent = count + ' people viewing now';
  }, 4500);
}

/* ── CURSOR GLOW (desktop only) ── */
function _initCursorGlow() {
  if (!matchMedia('(hover: hover)').matches) return;
  const el = document.createElement('div');
  el.className = 'cursor-glow';
  document.body.appendChild(el);
  document.addEventListener('mousemove', e => {
    el.style.left = e.clientX + 'px';
    el.style.top  = e.clientY + 'px';
  }, { passive: true });
}

/* ── LUX GALLERY: swipe + dot sync ── */
function _initLuxGallery(imgs) {
  const slides = document.getElementById('luxSlides');
  const dots = document.getElementById('luxDots');
  const counter = document.getElementById('luxImgCurr');
  if (!slides || !imgs.length) return;
  let cur = 0;

  function goTo(i) {
    cur = Math.max(0, Math.min(i, imgs.length - 1));
    slides.scrollTo({ left: cur * slides.offsetWidth, behavior: 'smooth' });
    if (dots) dots.querySelectorAll('.lux-dot').forEach((d,j) => d.classList.toggle('active', j===cur));
    if (counter) counter.textContent = cur + 1;
    const thumbs = document.getElementById('luxThumbs');
    if (thumbs) {
      thumbs.querySelectorAll('.lux-thumb-item').forEach((t,j) => t.classList.toggle('active', j===cur));
      const at = thumbs.querySelectorAll('.lux-thumb-item')[cur];
      if (at) at.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  let tx = 0;
  slides.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  slides.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 42) goTo(dx < 0 ? cur + 1 : cur - 1);
  }, { passive: true });

  let ticking = false;
  slides.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const idx = Math.round(slides.scrollLeft / slides.offsetWidth);
      if (idx !== cur) {
        cur = idx;
        if (dots) dots.querySelectorAll('.lux-dot').forEach((d,j)=>d.classList.toggle('active',j===idx));
        if (counter) counter.textContent = idx+1;
        const thumbs = document.getElementById('luxThumbs');
        if (thumbs) {
          thumbs.querySelectorAll('.lux-thumb-item').forEach((t,j)=>t.classList.toggle('active',j===idx));
          const at = thumbs.querySelectorAll('.lux-thumb-item')[idx];
          if (at) at.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
      ticking = false;
    });
  }, { passive: true });

  const timer = setInterval(() => goTo((cur + 1) % imgs.length), 4500);
  slides.addEventListener('touchstart', () => clearInterval(timer), { passive: true, once: true });

  window._luxGotoSlide = goTo;
}

/* ── LUX ACCORDION ── */
function _luxToggleAccordion(btn) {
  const item = btn.closest('.lux-accordion-item');
  if (!item) return;
  const isOpen = item.classList.contains('open');
  item.closest('.lux-accordion').querySelectorAll('.lux-accordion-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

/* ── LUX ADD TO CART ── */
function _luxAddCart(productId) {
  const btn = document.getElementById('luxAtcMain');
  if (!btn || btn.classList.contains('lux-loading')) return;
  const def  = btn.querySelector('.lux-atc-default');
  const load = btn.querySelector('.lux-atc-loading');
  const done = btn.querySelector('.lux-atc-done');

  btn.classList.add('lux-loading');
  if (def)  def.style.display  = 'none';
  if (load) load.style.display = 'flex';
  if (navigator.vibrate) navigator.vibrate([15, 30, 15]);

  setTimeout(() => {
    modalAddCart(productId);
    if (load) load.style.display = 'none';
    if (done) done.style.display = 'flex';
    btn.classList.remove('lux-loading');
    btn.classList.add('lux-success');
    setTimeout(() => {
      btn.classList.remove('lux-success');
      if (def)  def.style.display = '';
      if (done) done.style.display = 'none';
    }, 1600);
  }, 380);
}

/* ── SCROLL REVEAL ── */
function _initScrollReveal() {
  if (!window.IntersectionObserver) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('lux-visible'); io.unobserve(e.target); } });
  }, { threshold: 0.03, rootMargin: '0px 0px -10px 0px' });
  document.querySelectorAll('.lux-reveal').forEach(el => io.observe(el));
  // Safety fallback — force visible after 3 s
  setTimeout(() => {
    document.querySelectorAll('.lux-reveal:not(.lux-visible)').forEach(el => el.classList.add('lux-visible'));
  }, 3000);
}

/* ── RE-INIT REVEALS AFTER MODAL OPEN ── */
function _luxModalReady(imgs) {
  _initLuxGallery(imgs);
  setTimeout(_initScrollReveal, 60);
  document.body.classList.add('modal-open');
}

/* ── INIT LUXURY FEATURES ── */
document.addEventListener('DOMContentLoaded', () => {
  _startLiveCounter();
  _initCursorGlow();
  _initScrollReveal();
  _initRecentlyPurchasedPopup();
});

/* ===== GSAP PRODUCT CARD STAGGER ENTRANCE ===== */
function _gsapCardEntrance() {
  if (typeof gsap === 'undefined') return;
  const cards = document.querySelectorAll('#productsGrid .product-card');
  if (!cards.length) return;
  gsap.fromTo(cards,
    { opacity: 0, y: 28, scale: .97 },
    {
      opacity: 1, y: 0, scale: 1,
      duration: .48, stagger: .065,
      ease: 'power2.out',
      clearProps: 'transform,opacity'
    }
  );
}

/* ===== RECENTLY PURCHASED SOCIAL PROOF POPUP ===== */
function _initRecentlyPurchasedPopup() { return; // disabled by user request
  if (typeof PRODUCTS === 'undefined' || !PRODUCTS.length) return;
  const popup = document.createElement('div');
  popup.className = 'rp-popup';
  popup.id = 'rpPopup';
  popup.innerHTML = `
    <img class="rp-popup-img" id="rpImg" src="" alt="" loading="lazy" />
    <div class="rp-popup-text">
      <div class="rp-popup-name" id="rpName"></div>
      <div class="rp-popup-meta"><span class="rp-popup-dot"></span><span id="rpMeta"></span></div>
    </div>
    <span class="rp-popup-close" onclick="document.getElementById('rpPopup').classList.remove('show')">✕</span>`;
  document.body.appendChild(popup);

  const cities = ['Riyadh','Jeddah','Dammam','Mecca','Al Khobar','Medina','Tabuk','Abha'];
  const names  = ['Ahmed M.','Sara K.','Omar A.','Fatima R.','Ali H.','Noor S.','Khalid T.','Lina Q.'];
  const mins   = [1,2,3,4,5,7,8,10,12,15];

  function _show() {
    if (document.body.classList.contains('modal-open')) return;
    const p = PRODUCTS[Math.floor(Math.random() * Math.min(PRODUCTS.length, 40))];
    if (!p) return;
    const img    = document.getElementById('rpImg');
    const nameEl = document.getElementById('rpName');
    const metaEl = document.getElementById('rpMeta');
    if (!img || !nameEl || !metaEl) return;
    img.src = p.image || '';
    img.onerror = () => { img.src = 'https://picsum.photos/seed/rp' + p.id + '/80/80'; };
    nameEl.textContent = (typeof getName === 'function' ? getName(p) : (p.names?.en || p.name || 'Product')).substring(0, 34);
    const city = cities[Math.floor(Math.random() * cities.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const min  = mins[Math.floor(Math.random() * mins.length)];
    metaEl.textContent = `${name} · ${city} · ${min}m ago`;
    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), 4800);
  }

  setTimeout(_show, 9000);
  setInterval(_show, 28000 + Math.random() * 12000);
}

/* ── Image fade-in on load (remove shimmer) ── */
document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('load', e => {
    if (e.target.tagName === 'IMG') {
      e.target.classList.add('img-loaded');
      const wrap = e.target.closest('.product-img-wrap, .dmc-img-wrap, .fc-img-wrap');
      if (wrap) { wrap.style.animation = 'none'; wrap.style.background = 'transparent'; }
    }
  }, true);
});

/* ===== 3D TEAM CAROUSEL ===== */
const TEAM = [
  { name: 'Golam Rabbi',         role: 'COMPANY OWNER',        img: 'team-owner.jpg' },
  { name: 'Aisha Al-Rashid',   role: 'BRAND MANAGER',        img: 'https://i.pravatar.cc/400?img=47' },
  { name: 'Mohammed Hassan',   role: 'HEAD OF OPERATIONS',   img: 'https://i.pravatar.cc/400?img=68' },
  { name: 'Fatima Al-Zahra',   role: 'CUSTOMER CARE LEAD',  img: 'https://i.pravatar.cc/400?img=48' },
  { name: 'Omar Al-Khalid',    role: 'MARKETING DIRECTOR',   img: 'https://i.pravatar.cc/400?img=12' },
  { name: 'Sara Al-Nasser',    role: 'LOGISTICS MANAGER',    img: 'https://i.pravatar.cc/400?img=45' },
  { name: 'Khalid Al-Mutairi', role: 'TECH & DIGITAL',       img: 'https://i.pravatar.cc/400?img=33' },
];
let _tIdx = 0, _tTimer = null;

function _initTeam() {
  const stage = document.getElementById('teamStage');
  const dots  = document.getElementById('teamDots');
  if (!stage) return;
  stage.innerHTML = TEAM.map((m, i) =>
    `<div class="tc" data-ti="${i}" onclick="_teamTap(${i})"><img src="${m.img}" alt="${m.name}" loading="lazy"/></div>`
  ).join('');
  dots.innerHTML = TEAM.map((_, i) =>
    `<button class="team-dot" onclick="_teamGoTo(${i})"></button>`).join('');
  _teamRender();
  _tTimer = setInterval(() => teamNav(1), 3800);
}

function _teamRender() {
  const n = TEAM.length;
  document.querySelectorAll('.tc').forEach((c, i) => {
    let r = ((i - _tIdx) % n + n) % n;
    if (r > n / 2) r -= n;
    c.className = 'tc';
    if      (r ===  0) c.classList.add('tc-0');
    else if (r ===  1) c.classList.add('tc-r1');
    else if (r === -1) c.classList.add('tc-l1');
    else if (r ===  2) c.classList.add('tc-r2');
    else if (r === -2) c.classList.add('tc-l2');
    else               c.classList.add('tc-hide');
  });
  document.querySelectorAll('.team-dots .team-dot').forEach((d, i) =>
    d.classList.toggle('active', i === _tIdx));
  const m = TEAM[_tIdx];
  const ne = document.getElementById('tmName');
  const re = document.getElementById('tmRole');
  if (ne) { ne.style.opacity = '0'; setTimeout(() => { ne.textContent = m.name; ne.style.opacity = '1'; }, 150); }
  if (re) { re.style.opacity = '0'; setTimeout(() => { re.textContent = m.role; re.style.opacity = '1'; }, 150); }
}

function teamNav(dir) {
  _tIdx = ((_tIdx + dir) % TEAM.length + TEAM.length) % TEAM.length;
  _teamRender();
  clearInterval(_tTimer);
  _tTimer = setInterval(() => teamNav(1), 3800);
}
function _teamGoTo(i) { _tIdx = i; _teamRender(); clearInterval(_tTimer); _tTimer = setInterval(() => teamNav(1), 3800); }
function _teamTap(i)  { if (i !== _tIdx) _teamGoTo(i); }

document.addEventListener('DOMContentLoaded', _initTeam);

// ── Birthday Wish System ─────────────────────────────────
function _checkBirthdayWish() {
  if (!currentUser || !currentUser.birthday) return;
  const today = new Date();
  const bday  = new Date(currentUser.birthday);
  if (bday.getMonth() !== today.getMonth() || bday.getDate() !== today.getDate()) return;
  const shownKey = 'exg_bday_shown_' + today.getFullYear();
  if (localStorage.getItem(shownKey) === currentUser.email) return;
  localStorage.setItem(shownKey, currentUser.email);
  setTimeout(_showBdayWish, 1400);
}

function _showBdayWish() {
  const overlay = document.getElementById('bdayOverlay');
  if (!overlay) return;
  const firstName = currentUser && currentUser.name ? ', ' + currentUser.name.split(' ')[0] + '!' : '!';
  document.getElementById('bdayTitle').textContent = 'Happy Birthday' + firstName;
  document.getElementById('bdaySub').textContent   = 'We have a special gift for you 🎁';
  overlay.classList.add('open');
  _startBdayConfetti(false);
}

function _blowCandle() {
  const candle = document.getElementById('bdayCandle');
  if (!candle || candle.classList.contains('blown')) return;
  candle.classList.add('blown');
  document.getElementById('bdayHint').textContent = '🎉 You blew it out! Here\'s your gift!';
  setTimeout(() => {
    const v = document.getElementById('bdayVoucher');
    if (v) v.style.display = 'block';
    _startBdayConfetti(true);
  }, 600);
}

function _closeBdayWish() {
  const overlay = document.getElementById('bdayOverlay');
  if (overlay) overlay.classList.remove('open');
  _stopBdayConfetti();
}

function _copyBdayCode() {
  navigator.clipboard.writeText('BDAY10').then(() => showToast('🎂 Code BDAY10 copied!')).catch(() => {});
  const cf = document.getElementById('couponInput');
  if (cf) cf.value = 'BDAY10';
}

let _bdayConfRaf = null;
let _bdayParticles = [];

function _startBdayConfetti(burst) {
  const canvas = document.getElementById('bdayCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = canvas.offsetWidth  || 320;
  canvas.height = canvas.offsetHeight || 460;
  const colors = ['#FFD700','#e91e8c','#7c3aed','#60a5fa','#34d399','#f97316'];
  const count  = burst ? 80 : 40;
  for (let i = 0; i < count; i++) {
    _bdayParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * .5,
      r: 4 + Math.random() * 5,
      vx: (Math.random() - .5) * 3,
      vy: 1 + Math.random() * 3,
      a: 1, da: .008 + Math.random() * .006,
      c: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      drot: (Math.random() - .5) * .12,
      sq: Math.random() > .5
    });
  }
  if (_bdayConfRaf) return;
  (function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    _bdayParticles = _bdayParticles.filter(p => p.a > 0);
    _bdayParticles.forEach(p => {
      ctx.save(); ctx.globalAlpha = p.a;
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      if (p.sq) { ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      p.x += p.vx; p.y += p.vy; p.vy += .04;
      p.rot += p.drot; p.a -= p.da;
    });
    if (_bdayParticles.length) { _bdayConfRaf = requestAnimationFrame(frame); }
    else { _bdayConfRaf = null; }
  })();
}

function _stopBdayConfetti() {
  if (_bdayConfRaf) { cancelAnimationFrame(_bdayConfRaf); _bdayConfRaf = null; }
  _bdayParticles = [];
}

// ── AI Video Call ─────────────────────────────────────────
let _vcStream        = null;
let _vcFacing        = 'user';
let _vcMuted         = false;
let _vcCamOff        = false;
let _vcSpeechRec     = null;
let _vcDurTimer      = null;
let _vcDurSec        = 0;
let _vcSynthAlive    = null; // Chrome Android: keep speechSynthesis from pausing
let _vcVoice         = null; // best available voice, resolved once

// Resolve best English voice (called once on first speak)
function _vcLoadVoice() {
  if (_vcVoice) return;
  const voices = speechSynthesis.getVoices();
  _vcVoice = voices.find(v => v.lang === 'en-US' && v.localService) ||
             voices.find(v => v.lang === 'en-US') ||
             voices.find(v => v.lang.startsWith('en')) ||
             voices[0] || null;
}

function _openVideoCall() {
  const overlay = document.getElementById('vcOverlay');
  if (!overlay) return;
  closeAiChat();
  overlay.classList.add('open');
  _vcMuted = false; _vcCamOff = false; _vcDurSec = 0;
  const muteIcon = document.getElementById('vcMuteIcon');
  const muteBtn  = document.getElementById('vcMuteBtn');
  const camIcon  = document.getElementById('vcCamIcon');
  const camBtn   = document.getElementById('vcCamBtn');
  if (muteIcon) muteIcon.className = 'fas fa-microphone';
  if (muteBtn)  muteBtn.classList.remove('muted');
  if (camIcon)  camIcon.className  = 'fas fa-video';
  if (camBtn)   camBtn.classList.remove('cam-off');

  // ── Prime speechSynthesis within user-gesture context ──────
  // Android Chrome requires first speak() to happen in a gesture handler.
  // We use a silent utterance here so all future setTimeout calls work.
  if (window.speechSynthesis) {
    const primer = new SpeechSynthesisUtterance(' ');
    primer.volume = 0;
    speechSynthesis.speak(primer);
    // Chrome Android pauses synth after ~15s of no gesture — keep alive
    if (_vcSynthAlive) clearInterval(_vcSynthAlive);
    _vcSynthAlive = setInterval(() => {
      if (speechSynthesis.paused) speechSynthesis.resume();
    }, 8000);
    // Pre-load voice list
    const preload = () => _vcLoadVoice();
    if (speechSynthesis.getVoices().length) preload();
    else speechSynthesis.addEventListener('voiceschanged', preload, { once: true });
  }

  _vcDurTimer = setInterval(() => {
    _vcDurSec++;
    const m = String(Math.floor(_vcDurSec / 60)).padStart(2, '0');
    const s = String(_vcDurSec % 60).padStart(2, '0');
    const el = document.getElementById('vcDuration');
    if (el) el.textContent = m + ':' + s;
  }, 1000);
  _vcStartCamera();
  setTimeout(_vcStartListen, 900);
  setTimeout(() => {
    const name = currentUser && currentUser.name ? ', ' + currentUser.name.split(' ')[0] : '';
    _vcSpeak('Hi' + name + '! I am your EX GLOBAL assistant. How can I help you today?');
  }, 1400);
}

function _endVideoCall() {
  const overlay = document.getElementById('vcOverlay');
  if (overlay) overlay.classList.remove('open', 'vc-speaking');
  if (_vcStream)    { _vcStream.getTracks().forEach(t => t.stop()); _vcStream = null; }
  if (_vcSpeechRec) { try { _vcSpeechRec.abort(); } catch(e){} _vcSpeechRec = null; }
  if (_vcDurTimer)  { clearInterval(_vcDurTimer); _vcDurTimer = null; }
  if (_vcSynthAlive){ clearInterval(_vcSynthAlive); _vcSynthAlive = null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
}

async function _vcStartCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: _vcFacing }, audio: false });
    _vcStream = stream;
    const video  = document.getElementById('vcUserVideo');
    const camOff = document.getElementById('vcPipCamOff');
    if (video)  { video.srcObject = stream; }
    if (camOff) { camOff.style.display = 'none'; }
  } catch(e) {
    const camOff = document.getElementById('vcPipCamOff');
    const camBtn = document.getElementById('vcCamBtn');
    const camIcon = document.getElementById('vcCamIcon');
    if (camOff) camOff.style.display = '';
    if (camBtn) camBtn.classList.add('cam-off');
    if (camIcon) camIcon.className = 'fas fa-video-slash';
    _vcCamOff = true;
  }
}

function _vcToggleCamera() {
  if (!_vcCamOff && _vcStream) {
    _vcStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    _vcCamOff = !_vcCamOff;
  } else if (_vcCamOff) {
    if (_vcStream) { _vcStream.getVideoTracks().forEach(t => { t.enabled = true; }); _vcCamOff = false; }
    else { _vcStartCamera(); _vcCamOff = false; }
  }
  const camOff = document.getElementById('vcPipCamOff');
  const camBtn = document.getElementById('vcCamBtn');
  const camIcon = document.getElementById('vcCamIcon');
  if (camOff) camOff.style.display = _vcCamOff ? '' : 'none';
  if (camBtn) camBtn.classList.toggle('cam-off', _vcCamOff);
  if (camIcon) camIcon.className = _vcCamOff ? 'fas fa-video-slash' : 'fas fa-video';
}

function _vcToggleMute() {
  _vcMuted = !_vcMuted;
  const muteBtn  = document.getElementById('vcMuteBtn');
  const muteIcon = document.getElementById('vcMuteIcon');
  if (muteBtn)  muteBtn.classList.toggle('muted', _vcMuted);
  if (muteIcon) muteIcon.className = _vcMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone';
  if (_vcMuted) {
    if (_vcSpeechRec) { try { _vcSpeechRec.abort(); } catch(e){} _vcSpeechRec = null; }
  } else {
    _vcStartListen();
  }
}

function _vcStartListen() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const _vcOv = document.getElementById('vcOverlay');
  if (!SpeechRec || _vcMuted || (_vcOv && _vcOv.classList.contains('vc-speaking'))) return;
  if (_vcSpeechRec) { try { _vcSpeechRec.abort(); } catch(e){} }
  _vcSpeechRec = new SpeechRec();
  _vcSpeechRec.lang = currentLang === 'ar' ? 'ar-SA' : currentLang === 'bn' ? 'bn-BD' : 'en-US';
  _vcSpeechRec.continuous = false;
  _vcSpeechRec.interimResults = true;
  let finalText = '';
  _vcSpeechRec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    _vcShowCaption((finalText || interim).trim(), false);
  };
  _vcSpeechRec.onend = () => {
    const userText = finalText.trim();
    if (userText) {
      setTimeout(() => {
        const reply       = _localAiReply(userText);
        const replyText   = typeof reply === 'object' ? reply.text   : (reply || "I'm here to help!");
        const replyAction = typeof reply === 'object' ? reply.action : null;
        _vcSpeak(replyText); // _vcSpeak restarts listening in its onend
        if (typeof replyAction === 'function') setTimeout(replyAction, 2200);
      }, 350);
    } else if (!_vcMuted) {
      // Nothing said — restart listening only if AI is not currently speaking
      const ov = document.getElementById('vcOverlay');
      if (ov && ov.classList.contains('open') && !ov.classList.contains('vc-speaking')) {
        setTimeout(_vcStartListen, 600);
      }
    }
  };
  _vcSpeechRec.onerror = (e) => {
    if (e.error === 'no-speech') { setTimeout(_vcStartListen, 600); return; }
    if (e.error !== 'aborted') setTimeout(_vcStartListen, 2000);
  };
  try { _vcSpeechRec.start(); } catch(e) {}
}

function _vcSpeak(text) {
  // Stop listening while AI speaks
  if (_vcSpeechRec) { try { _vcSpeechRec.abort(); } catch(e){} _vcSpeechRec = null; }

  // Strip markdown, emojis and non-ASCII (TTS chokes on them)
  const cleanText = text
    .replace(/\*\*/g, '').replace(/\n+/g, '. ')
    .replace(/[^\x00-\x7F]/g, ' ')  // remove all non-ASCII (emojis, Arabic, Bengali)
    .replace(/\s{2,}/g, ' ').trim().substring(0, 200);
  _vcShowCaption(text, true);
  if (!window.speechSynthesis || !cleanText) {
    // Still restart listening even if nothing to speak
    if (!_vcMuted) {
      const ov = document.getElementById('vcOverlay');
      if (ov && ov.classList.contains('open')) setTimeout(_vcStartListen, 600);
    }
    return;
  }
  speechSynthesis.cancel();
  const overlay = document.getElementById('vcOverlay');
  if (overlay) overlay.classList.add('vc-speaking');

  function _vcSpeakDone() {
    if (overlay) overlay.classList.remove('vc-speaking');
    if (!_vcMuted) {
      const ov = document.getElementById('vcOverlay');
      if (ov && ov.classList.contains('open')) setTimeout(_vcStartListen, 600);
    }
  }

  function doSpeak() {
    _vcLoadVoice();
    const utt = new SpeechSynthesisUtterance(cleanText);
    utt.lang   = 'en-US';
    utt.rate   = 1.0;
    utt.pitch  = 1.05;
    utt.volume = 1.0;
    if (_vcVoice) utt.voice = _vcVoice;
    utt.onend  = _vcSpeakDone;
    utt.onerror = (e) => {
      if (e.error === 'interrupted') { setTimeout(() => speechSynthesis.speak(utt), 300); return; }
      _vcSpeakDone();
    };
    speechSynthesis.speak(utt);
  }

  // Voices may not be loaded yet on first call
  if (speechSynthesis.getVoices().length > 0) {
    doSpeak();
  } else {
    speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    setTimeout(doSpeak, 800); // fallback if voiceschanged never fires
  }
}

function _vcShowCaption(text, isAi) {
  const cap = document.getElementById('vcCaption');
  if (!cap) return;
  const short = text.length > 110 ? text.substring(0, 110) + '…' : text;
  cap.textContent = isAi ? ('🤖 ' + short) : short;
  cap.classList.add('show');
  clearTimeout(cap._timer);
  cap._timer = setTimeout(() => cap.classList.remove('show'), 5500);
}

// ── Auto Email (EmailJS) ──────────────────────────────────
// SETUP (5 min, free): https://emailjs.com
//  1. Sign up → Email Services → Add Service → Gmail → connect your Gmail
//  2. Email Templates → Create Template → paste EXACTLY:
//       To:      {{to_email}}
//       Subject: {{subject}}
//       Body:    (switch to HTML mode) paste:  {{{html_content}}}
//     Save → copy the Template ID
//  3. Account → General → copy Public Key
//  Put your values below:
const _EJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';   // e.g. 'user_abc123XYZ'
const _EJS_SERVICE_ID = 'YOUR_SERVICE_ID';   // e.g. 'service_xxxxxx'
const _EJS_TEMPLATE   = 'YOUR_TEMPLATE_ID';  // e.g. 'template_xxxxxx'

let _ejsReady = false;
(function _ejsInit() {
  if (typeof emailjs === 'undefined') { setTimeout(_ejsInit, 800); return; }
  if (_EJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
    emailjs.init({ publicKey: _EJS_PUBLIC_KEY });
    _ejsReady = true;
  }
})();

function _ejsSend(to_email, subject, html_content) {
  if (!_ejsReady || !to_email) return;
  emailjs.send(_EJS_SERVICE_ID, _EJS_TEMPLATE, { to_email, subject, html_content }).catch(() => {});
}

function _emailBase(bodyHtml) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f5f5f7;color:#1a1a1a}a{color:#e91e8c;text-decoration:none}.wrap{max-width:560px;margin:0 auto;padding:24px 16px}.header{background:linear-gradient(135deg,#e91e8c 0%,#7c3aed 100%);border-radius:16px 16px 0 0;padding:28px 24px;text-align:center}.header img{height:36px;margin-bottom:8px}.header h1{color:#fff;font-size:22px;font-weight:800;letter-spacing:.5px}.body{background:#fff;padding:28px 24px;border-left:1px solid #e8e8e8;border-right:1px solid #e8e8e8}.footer{background:#f9f9f9;border:1px solid #e8e8e8;border-radius:0 0 16px 16px;padding:18px 24px;text-align:center;font-size:12px;color:#888}.btn{display:inline-block;background:linear-gradient(135deg,#e91e8c,#7c3aed);color:#fff!important;font-size:15px;font-weight:700;padding:14px 32px;border-radius:50px;text-decoration:none;margin:18px 0}.tag{display:inline-block;background:#f0ebff;color:#7c3aed;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:.5px}.code-box{background:#fff8f0;border:2px dashed #e91e8c;border-radius:12px;padding:16px 24px;text-align:center;margin:16px 0}.code{font-size:26px;font-weight:900;letter-spacing:5px;color:#e91e8c}.divider{height:1px;background:#f0f0f0;margin:18px 0}</style></head><body><div class="wrap">${bodyHtml}<div class="footer"><p style="margin-bottom:6px"><strong>EX GLOBAL SA</strong> · Saudi Arabia</p><p>© 2025 EX GLOBAL SA. All rights reserved.</p><p style="margin-top:6px"><a href="https://exglobal.online">exglobal.online</a></p></div></div></body></html>`;
}

function _sendWelcomeEmail(user) {
  if (!_ejsReady || !user?.email) return;
  const sentKey = 'exg_welcome_sent_' + user.email;
  if (localStorage.getItem(sentKey)) return;
  localStorage.setItem(sentKey, '1');
  const name = (user.name || 'Valued Customer').split(' ')[0];
  const html = _emailBase(`
<div class="header">
  <h1>🎉 Welcome to EX GLOBAL SA!</h1>
</div>
<div class="body">
  <p style="font-size:16px;margin-bottom:12px">Hi <strong>${name}</strong>,</p>
  <p style="color:#444;line-height:1.7;margin-bottom:16px">
    Welcome to <strong>EX GLOBAL SA</strong> — your premium luxury fashion destination.
    We're thrilled to have you!
  </p>
  <p style="color:#444;line-height:1.7;margin-bottom:16px">
    As a welcome gift, here's your exclusive <strong>10% discount</strong> code for your first order:
  </p>
  <div class="code-box">
    <p style="font-size:13px;color:#888;margin-bottom:6px">YOUR DISCOUNT CODE</p>
    <div class="code">WELCOME10</div>
    <p style="font-size:12px;color:#aaa;margin-top:6px">Valid on your first order · One time use</p>
  </div>
  <div style="text-align:center">
    <a class="btn" href="https://exglobal.online">Start Shopping →</a>
  </div>
  <div class="divider"></div>
  <p style="font-size:13px;color:#888;text-align:center">
    🚚 Free delivery on orders over SAR 100 &nbsp;·&nbsp; 🔒 Secure checkout &nbsp;·&nbsp; ⭐ VIP rewards
  </p>
</div>`);
  _ejsSend(user.email, '🎉 Welcome to EX GLOBAL SA — Here\'s Your Gift!', html);
}

function _sendOrderEmail(order) {
  if (!order?.customer?.email) return;
  const name    = (order.customer.name || 'Customer').split(' ')[0];
  const orderId = order.id || 'N/A';
  const total   = 'SAR ' + Math.round(order.totalSAR || 0);
  const date    = new Date(order.date || Date.now()).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const method  = (order.method || 'COD').toUpperCase();
  const itemRows = (order.items || []).map(i =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #f5f5f5;font-size:14px">${i.name || 'Product'}${i.size ? ' — ' + i.size : ''}</td><td style="padding:10px 0;border-bottom:1px solid #f5f5f5;text-align:right;font-weight:600;font-size:14px">× ${i.qty || 1}</td></tr>`
  ).join('');
  const html = _emailBase(`
<div class="header">
  <h1>✅ Order Confirmed!</h1>
</div>
<div class="body">
  <p style="font-size:16px;margin-bottom:12px">Hi <strong>${name}</strong>,</p>
  <p style="color:#444;line-height:1.7;margin-bottom:20px">
    Great news! Your order has been confirmed and is being processed. 🛍️
  </p>
  <div style="background:#f9f9f9;border-radius:12px;padding:16px 20px;margin-bottom:20px">
    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
      <span style="font-size:13px;color:#888">Order ID</span>
      <span style="font-size:13px;font-weight:700;color:#e91e8c">${orderId}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
      <span style="font-size:13px;color:#888">Date</span>
      <span style="font-size:13px;font-weight:600">${date}</span>
    </div>
    <div style="display:flex;justify-content:space-between">
      <span style="font-size:13px;color:#888">Payment</span>
      <span class="tag">${method}</span>
    </div>
  </div>
  <p style="font-size:14px;font-weight:700;margin-bottom:10px">Items Ordered</p>
  <table style="width:100%;border-collapse:collapse">${itemRows}</table>
  <div class="divider"></div>
  <div style="display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:15px;font-weight:700">Total</span>
    <span style="font-size:18px;font-weight:900;color:#e91e8c">${total}</span>
  </div>
  <div class="divider"></div>
  <div style="text-align:center">
    <a class="btn" href="https://exglobal.online">Track Your Order →</a>
  </div>
  <p style="font-size:13px;color:#888;text-align:center;margin-top:8px">
    🚚 Estimated delivery: 2–4 business days
  </p>
</div>`);
  _ejsSend(order.customer.email, `✅ Order Confirmed — ${orderId} | EX GLOBAL SA`, html);
}

/* ═══════════════════════════════════════════════════════
   NEW RELEASE SECTION
   ═══════════════════════════════════════════════════════ */
function _initNewRelease() {
  const section = document.getElementById('nrSection');
  if (!section) return;

  // Pick featured product: highest discount among 'new' tagged, else highest discount overall
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const rate = T.rate || 1;
  const cur = T.currency || 'SAR ';

  let featured = PRODUCTS.filter(p => p.tag === 'new' && p.discount > 0)
    .sort((a,b) => b.discount - a.discount)[0]
    || PRODUCTS.filter(p => p.discount > 0).sort((a,b) => b.discount - a.discount)[0]
    || PRODUCTS[0];

  if (!featured) return;
  window._nrFeaturedId = featured.id;

  // Populate hero product
  const img = document.getElementById('nrProductImg');
  if (img) {
    img.src = featured.image || (featured.images && featured.images[0]) || '';
    img.alt = featured.names?.en || featured.name || 'New Release';
    img.onclick = () => openModal(featured.id);
  }

  // Discount badge
  const discPct = document.getElementById('nrDiscPct');
  if (discPct && featured.discount) discPct.textContent = featured.discount + '% OFF';

  // Right column: product info
  const right = document.getElementById('nrRight');
  if (right) {
    const salePrice = Math.round(featured.price * rate);
    const origPrice = featured.discount ? Math.round(salePrice / (1 - featured.discount / 100)) : null;
    right.innerHTML = `
      <div class="nr-right-tag">NEW</div>
      <div class="nr-right-name">${(featured.names?.en || featured.name || '').slice(0, 40)}</div>
      <div class="nr-right-orig">${origPrice ? cur + origPrice : ''}</div>
      <div class="nr-right-price">${cur}${salePrice}</div>`;
  }

  // Description from product brand/category
  const desc = document.getElementById('nrDesc');
  if (desc && featured.brand) desc.textContent = featured.brand + ' — New season arrivals';

  // Order button onclick
  const btn = document.getElementById('nrOrderBtn');
  if (btn) btn.onclick = () => openModal(featured.id);

  // Horizontal strip: top 6 'new' products (excluding featured)
  const strip = document.getElementById('nrStripScroll');
  if (strip) {
    const newProds = PRODUCTS.filter(p => p.id !== featured.id && (p.tag === 'new' || p.discount >= 20))
      .sort((a,b) => b.discount - a.discount).slice(0, 8);
    strip.innerHTML = newProds.map(p => {
      const sp = Math.round(p.price * rate);
      const img2 = p.image || (p.images && p.images[0]) || '';
      return `<div class="nr-strip-card" onclick="openModal(${p.id})">
        <img class="nr-strip-img" src="${img2}" alt="${p.names?.en||p.name||''}" loading="lazy">
        <div class="nr-strip-info">
          <div class="nr-strip-price">${cur}${sp}</div>
          ${p.discount ? `<div class="nr-strip-disc">-${p.discount}%</div>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  // Custom scroll-triggered float-up animation (more dramatic than generic .reveal)
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        section.classList.add('nr-visible');
        io.unobserve(section);
      }
    });
  }, { threshold: 0.06 });
  io.observe(section);
}

/* ═══════════════════════════════════════════════════════
   PLAY VIDEO FEED — TikTok-style with real phone upload
   ═══════════════════════════════════════════════════════ */

// ── IndexedDB for large video blob storage ──────────────
const _playIDB = (() => {
  let _db = null;
  const _open = () => new Promise((res, rej) => {
    if (_db) { res(_db); return; }
    const req = indexedDB.open('exg_play_idb', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('videos', { keyPath: 'id' });
    req.onsuccess = e => { _db = e.target.result; res(_db); };
    req.onerror = () => rej(req.error);
  });
  return {
    save: async (id, blob) => {
      const db = await _open();
      return new Promise((res, rej) => {
        const tx = db.transaction('videos', 'readwrite');
        tx.objectStore('videos').put({ id, blob });
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
    },
    get: async (id) => {
      const db = await _open();
      return new Promise((res, rej) => {
        const req2 = db.transaction('videos', 'readonly').objectStore('videos').get(id);
        req2.onsuccess = () => res(req2.result?.blob || null);
        req2.onerror = () => rej(req2.error);
      });
    }
  };
})();

// Default sample videos
const _PLAY_DEFAULTS = [
  { id:'pv1', type:'youtube', yt:'SopPnUQQFgc', title:'النشيد الوطني السعودي — عاش المليك', creator:'EX GLOBAL', creatorId:'exglobal', productId:null, views:12400, likes:840 },
];

function _playGetVideos() {
  try {
    const local   = JSON.parse(localStorage.getItem('exg_play_videos') || '[]');
    const fromFB  = JSON.parse(localStorage.getItem('exg_play_fb_cache') || '[]');
    const merged  = [...fromFB, ...local];
    const seen    = new Set();
    const unique  = merged.filter(v => { if (seen.has(v.id)) return false; seen.add(v.id); return true; });
    return [..._PLAY_DEFAULTS, ...unique];
  } catch(e) { return _PLAY_DEFAULTS; }
}

async function _playFetchShared() {
  try {
    const db = typeof firebase !== 'undefined' && firebase.apps?.length
      ? firebase.firestore() : null;
    if (!db) return;
    const snap = await db.collection('play_videos').orderBy('addedAt', 'desc').limit(200).get();
    if (snap.empty) return;
    const videos = snap.docs.map(d => ({ fsId: d.id, ...d.data() }));
    localStorage.setItem('exg_play_fb_cache', JSON.stringify(videos));
  } catch(e) {}
}

async function _playPushShared(video) {
  try {
    const db = typeof firebase !== 'undefined' && firebase.apps?.length
      ? firebase.firestore() : null;
    if (!db) return;
    await db.collection('play_videos').add(video);
  } catch(e) {}
}

function openPlayFeed() {
  const panel = document.getElementById('playPanel');
  if (!panel) return;
  panel.classList.add('open');
  document.body.style.overflow = 'hidden';
  _renderPlayFeed();
  // Refresh shared videos in background then re-render
  _playFetchShared().then(() => _renderPlayFeed()).catch(() => {});
}

function closePlayFeed() {
  const panel = document.getElementById('playPanel');
  if (!panel) return;
  panel.classList.remove('open');
  document.body.style.overflow = '';
  // Pause all iframes by reloading src
  panel.querySelectorAll('.play-card-iframe').forEach(f => { f.src = f.src; });
}

function _renderPlayFeed() {
  const feed = document.getElementById('playFeed');
  if (!feed) return;
  const videos = _playGetVideos();
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const cur = T.currency || 'SAR ';
  const rate = T.rate || 1;

  if (!videos.length) {
    feed.innerHTML = `<div class="play-empty">
      <i class="fas fa-play-circle"></i>
      <h3>No videos yet</h3>
      <p>Tap <strong>+ Add Video</strong> to upload from your phone!</p>
    </div>`;
    return;
  }

  feed.innerHTML = videos.map(v => {
    const p = v.productId ? PRODUCTS.find(x => x.id === v.productId) : null;
    const views = v.views >= 1000 ? (v.views/1000).toFixed(1)+'K' : v.views;
    const likes = v.likes >= 1000 ? (v.likes/1000).toFixed(1)+'K' : v.likes;
    const initials = (v.creator||'EX').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const thumbUrl = `https://img.youtube.com/vi/${v.yt}/maxresdefault.jpg`;
    const thumbFallback = `https://img.youtube.com/vi/${v.yt}/hqdefault.jpg`;

    // Build product shelf (Meesho/TikTok Shop style)
    let shelfHtml = '';
    if (p) {
      const pName = p.names?.en || p.name || 'Product';
      const pBrand = p.brand || p.category || 'EX GLOBAL';
      const pImg = p.image || p.images?.[0] || `https://picsum.photos/seed/${p.id}/120/120`;
      const pSale = Math.round(p.price * rate);
      const pOrig = p.discount ? Math.round(pSale / (1 - p.discount/100)) : null;
      const pDisc = p.discount ? `<span class="play-shelf-disc">${p.discount}% OFF</span>` : '';
      const pOrigSpan = pOrig ? `<span class="play-shelf-orig">${cur}${pOrig}</span>` : '';
      const pRating = p.rating ? `<div class="play-shelf-rating-row"><span class="psr-star">★</span><span class="psr-num">${p.rating}</span><span class="psr-cnt">(${p.ratingCount>=1000?(p.ratingCount/1000).toFixed(1)+'k':p.ratingCount||0})</span></div>` : '';
      // Related products (same category, up to 4 including main)
      const related = PRODUCTS.filter(x => x.id !== p.id && x.category === p.category).slice(0,3);
      const thumbsHtml = [p, ...related].map((rp,i) => {
        const rImg = rp.image || rp.images?.[0] || `https://picsum.photos/seed/${rp.id}/80/80`;
        return `<img class="play-shelf-thumb${i===0?' active':''}" src="${rImg}" alt="${(rp.names?.en||rp.name||'').slice(0,20)}"
          onerror="this.src='https://picsum.photos/seed/${rp.id}p/80/80'"
          onclick="event.stopPropagation();_playShelfSelect(this,'${v.id}',${rp.id})" loading="lazy">`;
      }).join('');
      shelfHtml = `<div class="play-shelf">
        <div class="play-shelf-card" id="pshelf-card-${v.id}">
          <img class="play-shelf-img" src="${pImg}" id="pshelf-img-${v.id}"
            onerror="this.src='https://picsum.photos/seed/${p.id}s/120/120'" loading="lazy">
          <div class="play-shelf-details" id="pshelf-det-${v.id}">
            <div class="play-shelf-brand">${pBrand.slice(0,14)}</div>
            <div class="play-shelf-name">${pName.slice(0,50)}</div>
            ${pRating}
            <div class="play-shelf-price-row">
              ${pOrigSpan}
              <span class="play-shelf-sale">${cur}${pSale}</span>
              ${pDisc}
            </div>
          </div>
          <div class="play-shelf-side">
            <button class="play-shelf-wish${currentUser&&(currentUser.wishlist||[]).includes(p.id)?' wishlisted':''}"
              onclick="event.stopPropagation();toggleWishlist(${p.id});this.classList.toggle('wishlisted')">
              <i class="fas fa-heart"></i>
            </button>
            <button class="play-shelf-atb" id="pshelf-atb-${v.id}"
              onclick="event.stopPropagation();nxAtc(event,${p.id})">
              Add to Bag
            </button>
            <button class="play-shelf-buy"
              onclick="event.stopPropagation();closePlayFeed();buyNow(${p.id})">
              Buy Now
            </button>
          </div>
        </div>
        <div class="play-shelf-thumbs">${thumbsHtml}</div>
      </div>`;
    }

    const isLocal = v.type === 'local';
    const commentCount = JSON.parse(localStorage.getItem('exg_comments_' + v.id) || '[]').length;
    const isFollowing = _playFollowing.has(v.creatorId || v.creator || '');
    const showFollow = (v.creatorId || v.creator) !== 'exglobal' && (v.creatorId || v.creator) !== 'EX GLOBAL';
    const followBtn = showFollow
      ? `<button class="play-follow-btn${isFollowing?' following':''}" onclick="event.stopPropagation();_playFollow('${v.creatorId||v.creator}',this)">${isFollowing?'✓ Following':'+ Follow'}</button>`
      : `<span class="play-views"><i class="fas fa-eye"></i>${views}</span>`;

    const isUrl = v.type === 'url';
    const cardType = isLocal ? 'local' : isUrl ? 'url' : 'youtube';
    return `<div class="play-card" data-yt="${v.yt||''}" data-vid="${v.id}" data-type="${cardType}" data-idbkey="${v.idbKey||''}" data-url="${v.url||''}">
      ${(isLocal || isUrl)
        ? `<div class="play-local-thumb" style="background:#111;position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><i class="fas fa-play-circle" style="font-size:64px;color:rgba(255,255,255,.3)"></i></div>`
        : `<div class="play-thumb-bg" style="background-image:url('${thumbUrl}')"></div>
      <img class="play-thumb" src="${thumbUrl}" alt="${v.title}"
        onerror="this.src='${thumbFallback}';this.onerror=function(){this.style.display='none'}">
      <div class="play-thumb-overlay"></div>`}
      <div class="play-tap-area" ondblclick="_playDblTap('${v.id}',event)" onclick="_playToggle(this.closest('.play-card'))"></div>
      <div class="play-big-icon" id="pbi-${v.id}"><i class="fas fa-play"></i></div>

      <div class="play-view-badge">
        <i class="fas fa-eye"></i>${views}
      </div>

      <div class="play-actions">
        <button class="play-action-btn${_playLiked.has(v.id)?' liked':''}" id="plike-${v.id}" onclick="event.stopPropagation();_playLike('${v.id}',this)">
          <i class="fas fa-heart"></i>
          <span>${likes}</span>
        </button>
        <button class="play-action-btn comment-btn" onclick="event.stopPropagation();_playComment('${v.id}')">
          <i class="fas fa-comment-dots"></i>
          <span>${commentCount||0}</span>
        </button>
        <button class="play-action-btn" onclick="event.stopPropagation();_playShare('${v.id}')">
          <i class="fas fa-share-nodes"></i>
          <span>Share</span>
        </button>
        ${currentUser && v.creatorId === currentUser.email ? `
        <button class="play-action-btn play-del-btn" onclick="event.stopPropagation();_playDeleteVideo('${v.id}')">
          <i class="fas fa-trash"></i>
          <span>Delete</span>
        </button>` : ''}
      </div>

      <button class="play-mute-btn" id="pmute-${v.id}" onclick="event.stopPropagation();_playToggleMute('${v.id}')">
        <i class="fas fa-volume-xmark"></i>
      </button>

      ${shelfHtml}

      <div class="play-info${p ? ' has-shelf' : ''}">
        <div class="play-creator-row">
          <div class="play-avatar" onclick="event.stopPropagation();_playOpenProfile('${(v.creatorId||v.creator||'exglobal').replace(/'/g,'')}','${(v.creator||'EX GLOBAL').replace(/'/g,'')}')">${initials}</div>
          <span class="play-creator-name" onclick="event.stopPropagation();_playOpenProfile('${(v.creatorId||v.creator||'exglobal').replace(/'/g,'')}','${(v.creator||'EX GLOBAL').replace(/'/g,'')}')">${v.creator || 'EX GLOBAL'}</span>
          ${followBtn}
        </div>
        <div class="play-title">${v.title}</div>
      </div>
    </div>`;
  }).join('');

  // Helper: create a <video> element for hosted or IDB blob videos
  function _makeVideoEl(src) {
    const video = document.createElement('video');
    video.className = 'play-card-video';
    video.autoplay = true; video.muted = true; video.loop = true; video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.src = src;
    return video;
  }

  // IntersectionObserver — load media when card enters viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(async entry => {
      const card = entry.target;
      const type = card.dataset.type;
      if (entry.isIntersecting) {
        if (type === 'url') {
          if (!card.querySelector('.play-card-video')) {
            const url = card.dataset.url;
            if (!url) return;
            const video = _makeVideoEl(url);
            card.appendChild(video);
            const thumb = card.querySelector('.play-local-thumb');
            if (thumb) video.addEventListener('canplay', () => { thumb.style.opacity = '0'; });
            video.play().catch(() => {});
          } else {
            card.querySelector('.play-card-video')?.play?.().catch(()=>{});
          }
        } else if (type === 'local') {
          if (!card.querySelector('.play-card-video')) {
            const idbKey = card.dataset.idbkey;
            if (!idbKey) return;
            try {
              const blob = await _playIDB.get(idbKey);
              if (!blob) return;
              const video = _makeVideoEl(URL.createObjectURL(blob));
              card.appendChild(video);
              const localThumb = card.querySelector('.play-local-thumb');
              if (localThumb) video.addEventListener('canplay', () => { localThumb.style.opacity = '0'; });
              video.play().catch(() => {});
            } catch(e) {}
          } else {
            card.querySelector('.play-card-video')?.play?.().catch(()=>{});
          }
        } else {
          const yt = card.dataset.yt;
          if (!yt) return;
          if (!card.querySelector('.play-card-iframe')) {
            const iframe = document.createElement('iframe');
            iframe.className = 'play-card-iframe active';
            iframe.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
            iframe.allowFullscreen = true;
            iframe.setAttribute('loading', 'lazy');
            iframe.src = `https://www.youtube.com/embed/${yt}?autoplay=1&mute=1&loop=1&playlist=${yt}&controls=0&playsinline=1&rel=0&modestbranding=1&fs=0&vq=hd1080&iv_load_policy=3`;
            card.appendChild(iframe);
            const thumb = card.querySelector('.play-thumb');
            if (thumb) iframe.addEventListener('load', () => { thumb.style.opacity = '0'; });
          }
        }
      } else {
        if (type === 'url' || type === 'local') {
          card.querySelector('.play-card-video')?.pause?.();
        } else {
          const iframe = card.querySelector('.play-card-iframe');
          if (iframe) { iframe.remove(); }
          const thumb = card.querySelector('.play-thumb');
          if (thumb) thumb.style.opacity = '1';
        }
      }
    });
  }, { threshold: 0.3 });

  feed.querySelectorAll('.play-card').forEach(c => observer.observe(c));

  // Eagerly load first card's media without waiting for observer
  setTimeout(() => {
    const first = feed.querySelector('.play-card');
    if (!first) return;
    const type = first.dataset.type;
    const yt = first.dataset.yt;
    // For URL videos, the observer handles it; eager load only YouTube
    if (type !== 'local' && type !== 'url' && yt && !first.querySelector('.play-card-iframe')) {
      const iframe = document.createElement('iframe');
      iframe.className = 'play-card-iframe active';
      iframe.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.setAttribute('loading', 'eager');
      iframe.src = `https://www.youtube.com/embed/${yt}?autoplay=1&mute=1&loop=1&playlist=${yt}&controls=0&playsinline=1&rel=0&modestbranding=1&fs=0&iv_load_policy=3`;
      first.appendChild(iframe);
      const thumb = first.querySelector('.play-thumb');
      if (thumb) iframe.addEventListener('load', () => { thumb.style.opacity = '0'; });
    }
  }, 600);
}

let _playMuted = {};

function _playToggleMute(vid) {
  const card = document.querySelector(`[data-vid="${vid}"]`);
  if (!card) return;
  const btn = document.getElementById('pmute-' + vid);
  _playMuted[vid] = !_playMuted[vid];
  const isMuted = !_playMuted[vid];
  if (card.dataset.type === 'local' || card.dataset.type === 'url') {
    const video = card.querySelector('.play-card-video');
    if (video) video.muted = isMuted;
  } else {
    const iframe = card.querySelector('.play-card-iframe');
    if (!iframe) return;
    const yt = card.dataset.yt;
    iframe.src = `https://www.youtube.com/embed/${yt}?autoplay=1&mute=${isMuted?1:0}&loop=1&playlist=${yt}&controls=0&playsinline=1&rel=0&modestbranding=1&fs=0&vq=hd1080&iv_load_policy=3`;
  }
  if (btn) btn.innerHTML = `<i class="fas fa-volume-${_playMuted[vid] ? 'high' : 'xmark'}"></i>`;
}

function _playDblTap(vid, e) {
  e.stopPropagation();
  const likeBtn = document.getElementById('plike-' + vid);
  if (likeBtn) _playLike(vid, likeBtn);
  const card = e.currentTarget?.closest?.('.play-card') || document.querySelector(`[data-vid="${vid}"]`);
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const cx = (e.clientX || (e.touches?.[0]?.clientX) || rect.left + rect.width/2) - rect.left;
  const cy = (e.clientY || (e.touches?.[0]?.clientY) || rect.top + rect.height/2) - rect.top;
  const heart = document.createElement('div');
  heart.className = 'play-dbl-heart';
  heart.textContent = '❤️';
  heart.style.cssText = `left:${cx}px;top:${cy}px`;
  card.appendChild(heart);
  setTimeout(() => heart.remove(), 950);
}

function _playShelfSelect(thumbEl, vid, productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const cur = T.currency || 'SAR ';
  const rate = T.rate || 1;
  // Update active thumb
  const thumbsWrap = thumbEl.closest('.play-shelf-thumbs');
  if (thumbsWrap) thumbsWrap.querySelectorAll('.play-shelf-thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
  // Update shelf card
  const img = document.getElementById('pshelf-img-' + vid);
  const det = document.getElementById('pshelf-det-' + vid);
  const atb = document.getElementById('pshelf-atb-' + vid);
  if (!img || !det) return;
  const pImg = p.image || p.images?.[0] || `https://picsum.photos/seed/${p.id}/120/120`;
  img.src = pImg;
  const pSale = Math.round(p.price * rate);
  const pOrig = p.discount ? Math.round(pSale / (1 - p.discount/100)) : null;
  det.innerHTML = `
    <div class="play-shelf-brand">${(p.brand || p.category || 'EX GLOBAL').slice(0,14)}</div>
    <div class="play-shelf-name">${(p.names?.en || p.name || '').slice(0,50)}</div>
    ${p.rating ? `<div class="play-shelf-rating-row"><span class="psr-star">★</span><span class="psr-num">${p.rating}</span><span class="psr-cnt">(${p.ratingCount>=1000?(p.ratingCount/1000).toFixed(1)+'k':p.ratingCount||0})</span></div>` : ''}
    <div class="play-shelf-price-row">
      ${pOrig ? `<span class="play-shelf-orig">${cur}${pOrig}</span>` : ''}
      <span class="play-shelf-sale">${cur}${pSale}</span>
      ${p.discount ? `<span class="play-shelf-disc">${p.discount}% OFF</span>` : ''}
    </div>`;
  if (atb) { atb.onclick = (e) => { e.stopPropagation(); nxAtc(e, productId); }; }
}

function _playToggle(card) {
  const vid = card.dataset.vid;
  const icon = document.getElementById('pbi-' + vid);
  if (!icon) return;
  icon.querySelector('i').className = 'fas fa-pause';
  icon.classList.add('pop');
  setTimeout(() => icon.classList.replace('pop', 'fade'), 500);
  setTimeout(() => { icon.classList.remove('fade'); }, 900);
}

const _playLiked = new Set(JSON.parse(localStorage.getItem('exg_play_liked') || '[]'));

function _playLike(vid, btn) {
  if (_playLiked.has(vid)) return;
  _playLiked.add(vid);
  localStorage.setItem('exg_play_liked', JSON.stringify([..._playLiked]));
  btn.classList.add('liked');
  const span = btn.querySelector('span');
  if (span) {
    const n = parseInt(span.textContent) || 0;
    span.textContent = n + 1;
  }
  // Heart burst animation
  btn.querySelector('i').style.transform = 'scale(1.5)';
  setTimeout(() => { btn.querySelector('i').style.transform = ''; }, 300);
}

function _playShare(vid) {
  const v = _playGetVideos().find(x => x.id === vid);
  if (!v) return;
  const url = v.type === 'local' ? window.location.href : `https://youtube.com/watch?v=${v.yt}`;
  const shareData = { title: v.title || 'EX GLOBAL Video', text: v.title, url };
  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url).then(() => showToast('🔗 Link copied!'));
  }
}

// ── Follow system ──────────────────────────────────────────
const _playFollowing = new Set(JSON.parse(localStorage.getItem('exg_play_following') || '[]'));

function _playFollow(creatorId, btn) {
  if (_playFollowing.has(creatorId)) {
    _playFollowing.delete(creatorId);
    if (btn) { btn.classList.remove('following'); btn.textContent = '+ Follow'; }
    showToast('Unfollowed');
  } else {
    _playFollowing.add(creatorId);
    if (btn) { btn.classList.add('following'); btn.textContent = '✓ Following'; }
    const name = creatorId.split(' ')[0];
    showToast('🔔 Following ' + name + '!');
  }
  localStorage.setItem('exg_play_following', JSON.stringify([..._playFollowing]));
}

// ── Comments ───────────────────────────────────────────────
let _playActiveCommentVid = null;

function _playComment(vid) {
  _playActiveCommentVid = vid;
  const comments = JSON.parse(localStorage.getItem('exg_comments_' + vid) || '[]');
  const drawer = document.getElementById('playCommentsDrawer');
  const overlay = document.getElementById('pcdOverlay');
  const list = document.getElementById('pcdList');
  const countEl = document.getElementById('pcdCount');
  if (countEl) countEl.textContent = comments.length;
  if (list) {
    list.innerHTML = comments.length
      ? comments.map(c => `
        <div class="pcd-item">
          <div class="pcd-item-avatar">${(c.name||'U')[0].toUpperCase()}</div>
          <div class="pcd-item-body">
            <div class="pcd-item-name">${_escHtml(c.name||'Anonymous')}</div>
            <div class="pcd-item-text">${_escHtml(c.text)}</div>
          </div>
          <button class="pcd-item-like" onclick="_pcdLike(this)"><i class="fas fa-heart"></i><span>0</span></button>
        </div>`).join('')
      : `<div class="pcd-empty">No comments yet. Be the first! 💬</div>`;
  }
  const avatarEl = document.getElementById('pcdMyAvatar');
  if (avatarEl && currentUser?.name) avatarEl.textContent = currentUser.name[0].toUpperCase();
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
}

function _closePlayComments() {
  document.getElementById('playCommentsDrawer')?.classList.remove('open');
  document.getElementById('pcdOverlay')?.classList.remove('open');
  _playActiveCommentVid = null;
}

function _playAddComment() {
  const input = document.getElementById('pcdInput');
  const text = input?.value.trim();
  if (!text || !_playActiveCommentVid) return;
  const vid = _playActiveCommentVid;
  const name = currentUser?.name || 'Customer';
  const comments = JSON.parse(localStorage.getItem('exg_comments_' + vid) || '[]');
  comments.push({ id: Date.now(), text, name, ts: Date.now() });
  localStorage.setItem('exg_comments_' + vid, JSON.stringify(comments));
  if (input) input.value = '';
  const countEl = document.getElementById('pcdCount');
  if (countEl) countEl.textContent = comments.length;
  const list = document.getElementById('pcdList');
  if (list) {
    const emptyEl = list.querySelector('.pcd-empty');
    if (emptyEl) emptyEl.remove();
    const item = document.createElement('div');
    item.className = 'pcd-item pcd-item-new';
    item.innerHTML = `
      <div class="pcd-item-avatar">${name[0].toUpperCase()}</div>
      <div class="pcd-item-body">
        <div class="pcd-item-name">${_escHtml(name)}</div>
        <div class="pcd-item-text">${_escHtml(text)}</div>
      </div>
      <button class="pcd-item-like" onclick="_pcdLike(this)"><i class="fas fa-heart"></i><span>0</span></button>`;
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
  }
  const commentSpan = document.querySelector(`[data-vid="${vid}"] .comment-btn span`);
  if (commentSpan) commentSpan.textContent = comments.length;
}

function _pcdLike(btn) {
  const span = btn.querySelector('span');
  if (span) span.textContent = (parseInt(span.textContent)||0) + 1;
  btn.style.color = '#e91e8c';
}

// ── Delete own video ───────────────────────────────────────
function _playDeleteVideo(vid) {
  const saved = JSON.parse(localStorage.getItem('exg_play_videos') || '[]');
  if (!saved.find(v => v.id === vid)) return;
  const updated = saved.filter(v => v.id !== vid);
  localStorage.setItem('exg_play_videos', JSON.stringify(updated));
  _renderPlayFeed();
  showToast('🗑️ Video deleted');
}

// ── Creator Profile Drawer ─────────────────────────────────
let _ppdCreatorId = null;

function _playOpenProfile(creatorId, creatorName) {
  _ppdCreatorId = creatorId;
  const drawer  = document.getElementById('playProfileDrawer');
  const overlay = document.getElementById('playProfileOverlay');
  if (!drawer || !overlay) return;

  const initials = (creatorName||'EX').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const avatarEl    = document.getElementById('ppdAvatar');
  const nameEl      = document.getElementById('ppdName');
  const followersEl = document.getElementById('ppdFollowers');
  const followingEl = document.getElementById('ppdFollowing');
  const videosEl    = document.getElementById('ppdVideos');
  const followBtn   = document.getElementById('ppdFollowBtn');
  const videosGrid  = document.getElementById('ppdVideosGrid');

  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl) nameEl.textContent = creatorName || 'Creator';

  // Deterministic follower count seeded from creator ID
  const seed = (creatorId||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const baseFlw = (seed % 9500) + 120;
  const stored  = parseInt(localStorage.getItem('exg_pfl_'+creatorId)||baseFlw);
  if (followersEl) followersEl.textContent = stored>=1000 ? (stored/1000).toFixed(1)+'K' : stored;
  if (followingEl) followingEl.textContent = (seed%280)+15;

  const allVids = _playGetVideos();
  const mine    = allVids.filter(v=>(v.creatorId||v.creator||'')===(creatorId)||v.creator===creatorName);
  if (videosEl) videosEl.textContent = mine.length;

  const isFollowing = _playFollowing.has(creatorId);
  const isStore = creatorId==='exglobal'||creatorId==='EX GLOBAL';
  if (followBtn) {
    followBtn.textContent  = isFollowing ? '✓ Following' : '+ Follow';
    followBtn.className    = 'ppd-follow-btn'+(isFollowing?' following':'');
    followBtn.style.display= isStore ? 'none' : '';
  }

  if (videosGrid) {
    videosGrid.innerHTML = mine.length
      ? mine.map(v=>{
          const thumb = v.type==='youtube' ? `https://img.youtube.com/vi/${v.yt}/mqdefault.jpg` : '';
          return `<div class="ppd-video-item" onclick="_closePlayProfile()">
            ${thumb
              ? `<img src="${thumb}" class="ppd-vid-thumb" alt="" onerror="this.style.display='none'">`
              : `<div class="ppd-vid-thumb ppd-vid-local"><i class="fas fa-play-circle"></i></div>`}
            <div class="ppd-vid-title">${_escHtml((v.title||'Video').slice(0,28))}</div>
          </div>`;
        }).join('')
      : `<div class="ppd-no-videos">No videos yet</div>`;
  }

  drawer.classList.add('open');
  overlay.classList.add('open');
}

function _closePlayProfile() {
  document.getElementById('playProfileDrawer')?.classList.remove('open');
  document.getElementById('playProfileOverlay')?.classList.remove('open');
  _ppdCreatorId = null;
}

function _ppdToggleFollow() {
  const cid = _ppdCreatorId;
  if (!cid) return;
  _playFollow(cid, null);
  const isNow = _playFollowing.has(cid);
  const btn   = document.getElementById('ppdFollowBtn');
  if (btn) { btn.textContent = isNow ? '✓ Following' : '+ Follow'; btn.className = 'ppd-follow-btn'+(isNow?' following':''); }
  const seed = cid.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const base = (seed%9500)+120;
  const newCount = isNow ? base+1 : base;
  localStorage.setItem('exg_pfl_'+cid, newCount);
  const flwEl = document.getElementById('ppdFollowers');
  if (flwEl) flwEl.textContent = newCount>=1000?(newCount/1000).toFixed(1)+'K':newCount;
  showToast(isNow ? '🔔 Following '+cid.split(' ')[0]+'!' : 'Unfollowed');
}

function _escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Upload sheet ──────────────────────────────────────────
function _openPlayUpload() {
  if (!currentUser) { showToast('⚠️ Please log in to upload videos'); return; }
  const sheet = document.getElementById('playUploadSheet');
  if (!sheet) return;
  sheet.style.display = 'flex';
  const sel = document.getElementById('pusProductId');
  if (sel && sel.options.length === 1) {
    PRODUCTS.forEach(p => {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = (p.names?.en || p.name) + ' — SAR ' + p.price;
      sel.appendChild(o);
    });
  }
}

function _closePlayUpload() {
  const sheet = document.getElementById('playUploadSheet');
  if (sheet) sheet.style.display = 'none';
  const fileInput = document.getElementById('pusFileInput');
  if (fileInput) fileInput.value = '';
  const previewVideo = document.getElementById('pusPreviewVideo');
  if (previewVideo) { previewVideo.src = ''; previewVideo.load(); }
  const pickerWrap = document.getElementById('pusPickerWrap');
  const previewWrap = document.getElementById('pusPreviewWrap');
  const progressWrap = document.getElementById('pusProgressWrap');
  const progressBar = document.getElementById('pusProgressBar');
  if (pickerWrap) pickerWrap.style.display = 'flex';
  if (previewWrap) previewWrap.style.display = 'none';
  if (progressWrap) progressWrap.style.display = 'none';
  if (progressBar) progressBar.style.width = '0%';
  const titleInput = document.getElementById('pusTitle');
  if (titleInput) titleInput.value = '';
  const saveBtn = document.getElementById('pusSaveBtn');
  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Post Video ✓'; }
}

function _pusFileSelected(input) {
  const file = input.files?.[0];
  if (!file) return;
  const pickerWrap = document.getElementById('pusPickerWrap');
  const previewWrap = document.getElementById('pusPreviewWrap');
  const previewVideo = document.getElementById('pusPreviewVideo');
  if (pickerWrap) pickerWrap.style.display = 'none';
  if (previewWrap) previewWrap.style.display = 'block';
  if (previewVideo) previewVideo.src = URL.createObjectURL(file);
}

async function _savePlayVideo() {
  const fileInput    = document.getElementById('pusFileInput');
  const titleInput   = document.getElementById('pusTitle');
  const productSel   = document.getElementById('pusProductId');
  const saveBtn      = document.getElementById('pusSaveBtn');
  const progressWrap = document.getElementById('pusProgressWrap');
  const progressBar  = document.getElementById('pusProgressBar');
  const progressLabel= document.getElementById('pusProgressLabel');

  const file = fileInput?.files?.[0];
  if (!file) { showToast('⚠️ Please select a video first'); return; }

  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Uploading…'; }
  if (progressWrap) progressWrap.style.display = 'block';
  if (progressLabel) progressLabel.textContent = 'Uploading…';

  const cloudName   = (localStorage.getItem('exg_cloud_name')   || '').trim();
  const cloudPreset = (localStorage.getItem('exg_cloud_preset') || '').trim();
  let videoUrl = null;

  try {
    if (cloudName && cloudPreset) {
      // Upload to Cloudinary — works for all sizes, shows real progress
      videoUrl = await new Promise((resolve, reject) => {
        const fd  = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', cloudPreset);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);
        xhr.upload.onprogress = e => {
          if (e.lengthComputable && progressBar) progressBar.style.width = Math.round(e.loaded / e.total * 90) + '%';
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.secure_url) resolve(data.secure_url);
            else reject(new Error('cloudinary: ' + JSON.stringify(data)));
          } catch(e) { reject(e); }
        };
        xhr.onerror = () => reject(new Error('network error'));
        xhr.send(fd);
      });
    } else {
      // Fallback: Telegra.ph (free, no key — works up to ~50 MB)
      if (progressLabel) progressLabel.textContent = 'Uploading to CDN…';
      const fd = new FormData();
      fd.append('file', file, 'video.mp4');
      let fakeProg = 10;
      const fakeTimer = setInterval(() => {
        fakeProg = Math.min(fakeProg + 5, 85);
        if (progressBar) progressBar.style.width = fakeProg + '%';
      }, 400);
      try {
        const res  = await fetch('https://telegra.ph/upload', { method: 'POST', body: fd });
        const data = await res.json();
        clearInterval(fakeTimer);
        if (Array.isArray(data) && data[0]?.src) videoUrl = 'https://telegra.ph' + data[0].src;
      } catch(e) { clearInterval(fakeTimer); }
    }

    if (progressBar) progressBar.style.width = '100%';
    if (progressLabel) progressLabel.textContent = 'Posted! ✓';

    const newVideo = {
      id: 'pv_' + Date.now(),
      type: videoUrl ? 'url' : 'local',
      url: videoUrl || null,
      idbKey: videoUrl ? null : ('vid_' + Date.now()),
      title: titleInput?.value.trim() || 'My Video',
      creator: currentUser?.name || 'Creator',
      creatorId: currentUser?.email || 'anon',
      avatar: currentUser?.avatar || null,
      productId: productSel?.value ? parseInt(productSel.value) : null,
      views: 0,
      likes: 0,
      addedAt: Date.now(),
    };

    // If no URL, fall back to local IDB storage
    if (!videoUrl) await _playIDB.save(newVideo.idbKey, file);

    // Save locally
    const saved = JSON.parse(localStorage.getItem('exg_play_videos') || '[]');
    saved.unshift(newVideo);
    if (saved.length > 100) saved.splice(100);
    _ls.setJSON('exg_play_videos', saved);

    // Push to shared Firebase RTDB (if configured) so all users see it
    _playPushShared(newVideo).catch(() => {});

    setTimeout(() => {
      _closePlayUpload();
      _renderPlayFeed();
      showToast('🎉 Video posted! Everyone can see it!');
    }, 700);

  } catch(err) {
    if (progressWrap) progressWrap.style.display = 'none';
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Post Video ✓'; }
    showToast('❌ Upload failed — check connection or try a smaller video');
  }
}

// ── Promo Banner Lightbox ─────────────────────────────────
function _openPromoLightbox(src) {
  let lb = document.getElementById('promoLightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.className = 'promo-lightbox';
    lb.id = 'promoLightbox';
    lb.innerHTML = `<button class="promo-lb-close" onclick="_closePromoLightbox()"><i class="fas fa-times"></i></button><img id="promoLbImg" src="" alt=""/>`;
    lb.addEventListener('click', e => { if (e.target === lb) _closePromoLightbox(); });
    document.body.appendChild(lb);
  }
  document.getElementById('promoLbImg').src = src;
  requestAnimationFrame(() => lb.classList.add('open'));
  document.body.style.overflow = 'hidden';
}
function _closePromoLightbox() {
  const lb = document.getElementById('promoLightbox');
  if (lb) lb.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── AliExpress-style Category Panel (v360) ── */
const _CAT_PANEL = [
  { key:'foryou', label:'For You', emoji:'⭐', title:'Recommended',
    subs:[
      {label:'New Arrivals',img:'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&h=200&fit=crop&q=75',cat:'women'},
      {label:'Flash Deals',img:'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=200&h=200&fit=crop&q=75',cat:'all'},
      {label:'Top Sellers',img:'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=200&fit=crop&q=75',cat:'women'},
      {label:'Under SAR 30',img:'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=200&h=200&fit=crop&q=75',cat:'all'},
      {label:'Under SAR 50',img:'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=200&fit=crop&q=75',cat:'all'},
      {label:'Trending Now',img:'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=200&h=200&fit=crop&q=75',cat:'all'},
    ]},
  { key:'women', label:"Women's", emoji:'👗', title:"Women's Fashion",
    subs:[
      {label:'Dresses',img:'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=200&h=200&fit=crop&q=75',cat:'women'},
      {label:'Tops & Blouses',img:'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=200&fit=crop&q=75',cat:'women'},
      {label:'Abayas',img:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=75',cat:'women'},
      {label:'Jeans',img:'https://images.unsplash.com/photo-1598522382970-43e374e428b0?w=200&h=200&fit=crop&q=75',cat:'women'},
      {label:'Jackets',img:'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=200&h=200&fit=crop&q=75',cat:'women'},
      {label:'Modest Wear',img:'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=200&fit=crop&q=75',cat:'women'},
      {label:'Lingerie',img:'https://images.unsplash.com/photo-1604671368394-2240d0b1bb6c?w=200&h=200&fit=crop&q=75',cat:'women'},
      {label:'View More',img:null,cat:'women'},
    ]},
  { key:'men', label:"Men's", emoji:'👔', title:"Men's Fashion",
    subs:[
      {label:'T-Shirts',img:'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=200&h=200&fit=crop&q=75',cat:'men'},
      {label:'Shirts',img:'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=200&h=200&fit=crop&q=75',cat:'men'},
      {label:'Pants',img:'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200&h=200&fit=crop&q=75',cat:'men'},
      {label:'Thobes',img:'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=200&h=200&fit=crop&q=75',cat:'men'},
      {label:'Jackets',img:'https://images.unsplash.com/photo-1520975867082-7b7c7d7e8a00?w=200&h=200&fit=crop&q=75',cat:'men'},
      {label:'Watches',img:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop&q=75',cat:'men'},
    ]},
  { key:'kids', label:'Kids', emoji:'👶', title:"Kids' Fashion",
    subs:[
      {label:'Boys',img:'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=200&h=200&fit=crop&q=75',cat:'kids'},
      {label:'Girls',img:'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=200&h=200&fit=crop&q=75',cat:'kids'},
      {label:'Babies',img:'https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=200&h=200&fit=crop&q=75',cat:'kids'},
      {label:'Shoes',img:'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&h=200&fit=crop&q=75',cat:'kids'},
      {label:'School Bags',img:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop&q=75',cat:'kids'},
      {label:'Toys',img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&q=75',cat:'kids'},
    ]},
  { key:'beauty', label:'Beauty', emoji:'💄', title:'Beauty & Health',
    subs:[
      {label:'Skincare',img:'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&h=200&fit=crop&q=75',cat:'beauty'},
      {label:'Makeup',img:'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&h=200&fit=crop&q=75',cat:'beauty'},
      {label:'Haircare',img:'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=200&fit=crop&q=75',cat:'beauty'},
      {label:'Fragrances',img:'https://images.unsplash.com/photo-1541643600914-78b084683702?w=200&h=200&fit=crop&q=75',cat:'beauty'},
      {label:'Tools',img:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop&q=75',cat:'beauty'},
      {label:'View More',img:null,cat:'beauty'},
    ]},
  { key:'bags', label:'Bags', emoji:'👜', title:'Bags & Accessories',
    subs:[
      {label:'Handbags',img:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&h=200&fit=crop&q=75',cat:'bags'},
      {label:'Backpacks',img:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop&q=75',cat:'bags'},
      {label:'Clutches',img:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=200&fit=crop&q=75',cat:'bags'},
      {label:'Wallets',img:'https://images.unsplash.com/photo-1563903530908-afdd155d054e?w=200&h=200&fit=crop&q=75',cat:'bags'},
      {label:'View More',img:null,cat:'bags'},
    ]},
  { key:'jewelry', label:'Jewelry', emoji:'💍', title:'Jewelry',
    subs:[
      {label:'Necklaces',img:'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&h=200&fit=crop&q=75',cat:'jewelry'},
      {label:'Rings',img:'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop&q=75',cat:'jewelry'},
      {label:'Earrings',img:'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop&q=75',cat:'jewelry'},
      {label:'Bracelets',img:'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=200&h=200&fit=crop&q=75',cat:'jewelry'},
      {label:'View More',img:null,cat:'jewelry'},
    ]},
  { key:'home', label:'Home', emoji:'🏠', title:'Home & Living',
    subs:[
      {label:'Bedroom',img:'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=200&h=200&fit=crop&q=75',cat:'home'},
      {label:'Kitchen',img:'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop&q=75',cat:'home'},
      {label:'Living Room',img:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop&q=75',cat:'home'},
      {label:'Bathroom',img:'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=200&h=200&fit=crop&q=75',cat:'home'},
      {label:'View More',img:null,cat:'home'},
    ]},
  { key:'shoes', label:'Shoes', emoji:'👟', title:'Shoes',
    subs:[
      {label:"Women's",img:'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&h=200&fit=crop&q=75',cat:'shoes'},
      {label:"Men's",img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop&q=75',cat:'shoes'},
      {label:'Sneakers',img:'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=200&h=200&fit=crop&q=75',cat:'shoes'},
      {label:'Heels',img:'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=200&h=200&fit=crop&q=75',cat:'shoes'},
      {label:'View More',img:null,cat:'shoes'},
    ]},
];
let _catPanelActive = 0;
function openCatPanel(catKey) {
  const ov = document.getElementById('catPov');
  const panel = document.getElementById('catPanel');
  if (!ov || !panel) return;
  _catPanelActive = catKey ? Math.max(0, _CAT_PANEL.findIndex(c => c.key === catKey)) : 0;
  _buildCatPanelSide();
  _buildCatPanelMain(_catPanelActive);
  ov.classList.add('open');
  panel.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCatPanel() {
  document.getElementById('catPov')?.classList.remove('open');
  document.getElementById('catPanel')?.classList.remove('open');
  document.body.style.overflow = '';
}
function _buildCatPanelSide() {
  const el = document.getElementById('catPanelSide');
  if (!el) return;
  el.innerHTML = _CAT_PANEL.map((c, i) =>
    `<div class="cat-ps-item${i===_catPanelActive?' active':''}" onclick="_selCatPanelItem(${i})">` +
    `<div class="cat-ps-ico-wrap"><span class="cat-ps-emoji">${c.emoji}</span></div>` +
    `<span class="cat-ps-lbl">${c.label}</span></div>`
  ).join('');
}
function _selCatPanelItem(idx) {
  _catPanelActive = idx;
  document.querySelectorAll('.cat-ps-item').forEach((el,i) => el.classList.toggle('active', i===idx));
  _buildCatPanelMain(idx);
  const main = document.getElementById('catPanelMain');
  if (main) main.scrollTop = 0;
}
function _buildCatPanelMain(idx) {
  const cat = _CAT_PANEL[idx];
  const el = document.getElementById('catPanelMain');
  if (!cat || !el) return;
  el.innerHTML = `<div class="cat-pm-head">${cat.title}</div><div class="cat-sub-grid">${cat.subs.map(sub => (!sub.img || sub.label==='View More') ? `<div class="cat-sub-tile" onclick="_catGo('${cat.key}')"><div class="cat-sub-more-ico"><i class="fas fa-ellipsis"></i></div><span class="cat-sub-lbl">View More</span></div>` : `<div class="cat-sub-tile" onclick="_catGo('${sub.cat}')"><img class="cat-sub-img" src="${sub.img}" alt="${sub.label}" loading="lazy"><span class="cat-sub-lbl">${sub.label}</span></div>`).join('')}</div>`;
}
function _catGo(catKey) {
  closeCatPanel();
  if (typeof filterCategory === 'function') filterCategory(catKey);
  setTimeout(() => {
    document.getElementById('productsSection')?.scrollIntoView({ behavior:'smooth', block:'start' });
    document.querySelector('.tab-btn[data-tab="products"]')?.click();
  }, 350);
}
