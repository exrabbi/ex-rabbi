/* ===== STATE ===== */
let cart = [];
let wishlist = JSON.parse(localStorage.getItem('exglobal_wishlist') || '[]');
let currentFilter = 'all';
let currentSort = 'default';
let visibleCount = 8;
let currentLang = 'en';
let selectedSize = '';
let selectedColor = '';
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
  try{const s=JSON.parse(localStorage.getItem('exg_settings')||'{}');if(s.delivery!==undefined)DELIVERY_SAR=parseFloat(s.delivery)||0;if(s.freeDelivery)FREE_DELIVERY_THRESHOLD_SAR=parseFloat(s.freeDelivery)||100;}catch(e){}
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
});

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
        <img src="${p.image}" loading="lazy" alt="" />
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
        <img src="${p.image}" loading="lazy" alt="" />
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
        <img src="${p.image}" loading="lazy" alt="" />
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
        <img src="${p.image}" loading="lazy" alt="" />
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
        </div>
        <div class="product-meta">
          <span class="product-rating">★ ${p.rating} (${p.ratingCount.toLocaleString()})</span>
          <span class="product-sold">${p.sold} ${t('soldText')}</span>
        </div>
      </div>
      <button class="add-cart-btn" onclick="event.stopPropagation();quickAddCart(${p.id})">
        ${t('addToCart')}
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
    visibleCount = 8;
    renderProducts(e.target.value.trim());
    if (e.target.value.trim()) {
      document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth' });
    }
  });
  document.getElementById('searchSubmit').addEventListener('click', () => {
    visibleCount = 8;
    renderProducts(document.getElementById('searchInput').value.trim());
    document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('menuBtn').addEventListener('click', openMe);
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
  if (footer) footer.style.display = 'block';
}
function quickAddCart(id) { addToCart(id, '', ''); }
function addToCart(id, size, color) {
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty++;
  else cart.push({ id, qty: 1, size, color });
  updateCartBadge();
  showToast(t('addedToCart'));
}
function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else renderCart();
  updateCartBadge();
}
function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
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
            <button class="wish-add-cart" onclick="addToCart(${id},null,null);showToast(t('addedToCart'))">
              <i class="fas fa-bag-shopping"></i> ${t('addToCart') || 'Add to Cart'}
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
        <span class="rating-count">${p.rating} (${p.ratingCount.toLocaleString()} ${t('reviews')}) · ${p.sold} ${t('soldText')}</span>
      </div>
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
    <div class="modal-actions">
      <button class="btn-wishlist ${inWish?'active':''}" id="modalWishBtn" onclick="modalToggleWish(${p.id})">
        <i class="${inWish?'fas':'far'} fa-heart"></i>
      </button>
      <button class="btn-add-cart" onclick="modalAddCart(${p.id})">${t('addToCart')}</button>
    </div>
  `;
  history.replaceState({}, '', '?p=' + id);
  document.getElementById('productModal').classList.add('open');
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
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
function modalAddCart(id) {
  addToCart(id, selectedSize, selectedColor);
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
  _saveOrderRecord(cart, grandDisp, 'whatsapp');
  window.open(`https://wa.me/${getWANumber()}?text=${encodeURIComponent(msg)}`, '_blank');
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
  const wc = document.getElementById('meWishCount');
  if (wc) { wc.textContent = wishlist.length > 0 ? wishlist.length : ''; wc.style.display = wishlist.length > 0 ? 'inline-block' : 'none'; }
}

function closeMe() {
  document.getElementById('meOverlay').classList.remove('open');
  document.getElementById('mePanel').classList.remove('open');
  document.body.style.overflow = '';
  closeSettings();
}

function openEditProfile() {
  if (!currentUser) return;
  const nameEl  = document.getElementById('authName');
  const emailEl = document.getElementById('authEmail');
  const phoneEl = document.getElementById('authPhone');
  if (nameEl)  nameEl.value  = currentUser.name  || '';
  if (emailEl) emailEl.value = currentUser.email || '';
  if (phoneEl) phoneEl.value = currentUser.phone || '';
  openAuth();
}

function openSettings() {
  const labels = { bn: 'বাংলা', en: 'English', ar: 'العربية' };
  const el = document.getElementById('curLangLabel');
  if (el) el.textContent = labels[currentLang] || labels.en;
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
  // Firebase auth state listener (if Firebase is configured)
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
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
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebase.auth().signInWithPopup(provider);
    setUser({
      name: result.user.displayName,
      email: result.user.email,
      avatar: result.user.photoURL,
      uid: result.user.uid,
      provider: 'google'
    });
    closeAuth();
    showToast(t('welcome') + result.user.displayName.split(' ')[0] + '!');
  } catch (e) {
    showToast(t('googleLoginFailed'));
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
  const wa = document.getElementById('hcWaBtn');
  const _T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  if (wa) wa.href = 'https://wa.me/' + getWANumber() + '?text=' + encodeURIComponent(_T.waMsg || 'Hello, I have a question.');
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
      localStorage.setItem('exg_customers',JSON.stringify(list));
    }
  }catch(e){}
}

function _saveOrderRecord(items,totalSAR,method){
  try{
    const orders=JSON.parse(localStorage.getItem('exg_orders')||'[]');
    orders.unshift({
      id:'ORD'+Date.now(),
      date:new Date().toISOString(),
      items:items.map(i=>{const p=PRODUCTS.find(x=>x.id===i.id);return{id:i.id,name:p?(p.names?.en||p.nameEn||'Product'):'Product',price:p?p.price:0,qty:i.qty||1,image:p?p.image:''};}).slice(0,20),
      totalSAR:Math.round(totalSAR),
      method,
      customer:currentUser?{name:currentUser.name,email:currentUser.email,phone:currentUser.phone||''}:{name:'Guest'},
      address:typeof savedLocation!=='undefined'?savedLocation:null,
      status:'pending'
    });
    if(orders.length>500)orders.splice(500);
    localStorage.setItem('exg_orders',JSON.stringify(orders));
  }catch(e){}
}

function setUser(user) {
  currentUser = user;
  localStorage.setItem('exglobal_user', JSON.stringify(user));
  _saveCustomerRecord(user);
  updateAuthUI();
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
  if (!guestEl || !userEl) return;
  if (currentUser) {
    guestEl.style.display = 'none';
    userEl.style.display  = 'flex';
    if (signOutItem) signOutItem.style.display = 'flex';
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
  }
}

/* ===== PAYMENT SYSTEM ===== */
const BINANCE_PAY_ID = '1167244565';
const SAR_TO_USDT = 0.267;

let selectedPayMethod = 'whatsapp';
let paypalLoaded = false;

let DELIVERY_SAR = 17;
let FREE_DELIVERY_THRESHOLD_SAR = 100;

function cartSubtotalBase() {
  return cart.reduce((s, i) => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
}

function openPayment() {
  if (cart.length === 0) { showToast(t('cartEmpty')); return; }
  if (!currentUser) {
    closeCart();
    showToast(t('loginToOrder'));
    setTimeout(openAuth, 400);
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
        _saveOrderRecord(cart, totalSAR, 'binance');
        window.open('https://wa.me/' + getWANumber() + '?text=' + encodeURIComponent(msg), '_blank');
        cart = []; updateCart();
        setTimeout(closePayment, 3000);
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
      cart = []; updateCart(); closePayment();
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
