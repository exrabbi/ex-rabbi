/* ===== STATE ===== */
let cart = [];
let wishlist = [];
let currentFilter = 'all';
let currentSort = 'default';
let visibleCount = 8;
let currentLang = 'en';
let selectedSize = '';
let selectedColor = '';
let heroIndex = 0;
let heroTimer;

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
document.addEventListener('DOMContentLoaded', () => {
  setLang('en');
  renderFlashDeals();
  renderSuperDeals();
  renderTrending();
  renderProducts();
  startHeroSlider();
  startCountdown();
  setupEvents();
});

/* ===== HERO SLIDER ===== */
function startHeroSlider() {
  heroTimer = setInterval(nextSlide, 3500);
  document.querySelectorAll('.hero-dot').forEach((dot, i) => {
    dot.addEventListener('click', () => goSlide(i));
  });
}
function nextSlide() {
  heroIndex = (heroIndex + 1) % 3;
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
  const items = PRODUCTS.filter(p => p.discount >= 45).slice(0, 6);
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
  const items = PRODUCTS.filter(p => p.tag === 'sale' || p.tag === 'hot').slice(0, 4);
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
  const items = PRODUCTS.filter(p => p.tag === 'bestseller' || p.tag === 'new').slice(0, 4);
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

  document.getElementById('menuBtn').addEventListener('click', openDrawer);
  document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
  document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('wishlistBtn').addEventListener('click', () => {
    showToast(t('wishlistCount') + ' ' + wishlist.length + ' ' + t('items'));
  });
}

/* ===== DRAWER ===== */
function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
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
  if (cart.length === 0) {
    container.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>${t('cartEmpty')}</p></div>`;
    footer.style.display = 'none';
    return;
  }
  container.innerHTML = cart.map(item => {
    const p = PRODUCTS.find(p => p.id === item.id);
    return `
      <div class="cart-item">
        <div class="cart-item-img"><img src="${p.image}" alt="" /></div>
        <div class="cart-item-info">
          <p class="cart-item-name">${getName(p)}</p>
          <p class="cart-item-price">${fmt(p.price)}</p>
          <div class="cart-qty">
            <button class="qty-btn" onclick="updateQty(${item.id},-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="updateQty(${item.id},1)">+</button>
            <button class="remove-item" onclick="removeFromCart(${item.id})"><i class="fas fa-trash-alt"></i></button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  const total = cart.reduce((sum, item) => {
    const p = PRODUCTS.find(p => p.id === item.id);
    return sum + p.price * item.qty;
  }, 0);
  document.getElementById('cartTotal').textContent = fmt(total);
  footer.style.display = 'block';
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
  document.getElementById('cartBadge').textContent = count;
  document.getElementById('cartBadge').style.display = count ? 'flex' : 'none';
}

/* ===== WISHLIST ===== */
function toggleWish(id, btn) {
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(w => w !== id);
    btn.classList.remove('active');
    btn.innerHTML = '<i class="far fa-heart"></i>';
    showToast(t('unwishlisted'));
  } else {
    wishlist.push(id);
    btn.classList.add('active');
    btn.innerHTML = '<i class="fas fa-heart"></i>';
    showToast(t('wishlisted'));
  }
  document.getElementById('wishBadge').textContent = wishlist.length;
  document.getElementById('wishBadge').style.display = wishlist.length ? 'flex' : 'none';
}

/* ===== PRODUCT MODAL ===== */
function openModal(id) {
  const p = PRODUCTS.find(p => p.id === id);
  if (!p) return;
  selectedSize = p.sizes[0] || '';
  selectedColor = p.colors[0] || '';
  const inWish = wishlist.includes(id);

  document.getElementById('modalBody').innerHTML = `
    <img class="modal-img" src="${p.image}" alt="" />
    <div class="modal-info">
      <h2 class="modal-name">${getName(p)}</h2>
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
    </div>
    <div class="modal-actions">
      <button class="btn-wishlist ${inWish?'active':''}" id="modalWishBtn" onclick="modalToggleWish(${p.id})">
        <i class="${inWish?'fas':'far'} fa-heart"></i>
      </button>
      <button class="btn-add-cart" onclick="modalAddCart(${p.id})">${t('addToCart')}</button>
    </div>
  `;
  document.getElementById('productModal').classList.add('open');
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('productModal').classList.remove('open');
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
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
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(w => w !== id);
    btn.classList.remove('active');
    btn.innerHTML = '<i class="far fa-heart"></i>';
    showToast(t('unwishlisted'));
  } else {
    wishlist.push(id);
    btn.classList.add('active');
    btn.innerHTML = '<i class="fas fa-heart"></i>';
    showToast(t('wishlisted'));
  }
  document.getElementById('wishBadge').textContent = wishlist.length;
  document.getElementById('wishBadge').style.display = wishlist.length ? 'flex' : 'none';
  renderProducts(document.getElementById('searchInput').value);
}
function modalAddCart(id) {
  addToCart(id, selectedSize, selectedColor);
  closeModal();
}

/* ===== WHATSAPP CHECKOUT ===== */
function whatsappCheckout() {
  if (cart.length === 0) return;
  const lines = cart.map(item => {
    const p = PRODUCTS.find(p => p.id === item.id);
    return `• ${getName(p)} x${item.qty} = ${fmt(p.price * item.qty)}`;
  });
  const total = cart.reduce((s, i) => {
    const p = PRODUCTS.find(p => p.id === i.id);
    return s + p.price * i.qty;
  }, 0);
  const locText = typeof getLocationText === 'function' ? getLocationText() : '';
  const msg = `🛒 *${t('myCart')}*\n\n${lines.join('\n')}\n\n*${t('totalLabel')} ${fmt(total)}*${locText}`;
  window.open(`https://wa.me/966546224029?text=${encodeURIComponent(msg)}`, '_blank');
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

/* ===== ME / ACCOUNT PANEL ===== */
function openMe() {
  document.getElementById('meOverlay').classList.add('open');
  document.getElementById('mePanel').classList.add('open');
  document.body.style.overflow = 'hidden';
  const sub = document.getElementById('meWishSub');
  if (sub) sub.textContent = wishlist.length + ' ' + t('items');
  const bal = document.getElementById('meWalletBal');
  if (bal) bal.textContent = TRANSLATIONS[currentLang].currency + '0.00';
}

function closeMe() {
  document.getElementById('meOverlay').classList.remove('open');
  document.getElementById('mePanel').classList.remove('open');
  document.body.style.overflow = '';
  closeSettings();
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
  const badge = document.getElementById('meLocSaved');
  if (badge) badge.textContent = (TRANSLATIONS[currentLang] || TRANSLATIONS['bn']).savedBadge || '✓ Saved';
  showToast(t('addressSaved'));
  closeLocation();
}

function getLocationText() {
  if (!savedLocation) return '';
  return `\n\n📍 *${t('waDeliveryAddress')}*\n${t('waName')}: ${savedLocation.name}\n${t('waPhone')}: ${savedLocation.phone}\n${t('waCity')}: ${savedLocation.city}${savedLocation.area ? ', ' + savedLocation.area : ''}\n${t('waAddress')}: ${savedLocation.address}`;
}

// Load saved location badge on page load
document.addEventListener('DOMContentLoaded', () => {
  if (savedLocation) {
    const badge = document.getElementById('meLocSaved');
    if (badge) badge.textContent = (TRANSLATIONS[currentLang] || TRANSLATIONS['bn']).savedBadge || '✓ Saved';
  }
  // Init auth UI
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

function setUser(user) {
  currentUser = user;
  localStorage.setItem('exglobal_user', JSON.stringify(user));
  updateAuthUI();
}

function signOut() {
  currentUser = null;
  localStorage.removeItem('exglobal_user');
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    firebase.auth().signOut().catch(() => {});
  }
  updateAuthUI();
  showToast((TRANSLATIONS[currentLang] || TRANSLATIONS['bn']).signedOut || 'Signed out');
}

function updateAuthUI() {
  const guestEl = document.getElementById('meGuestState');
  const userEl = document.getElementById('meUserState');
  if (!guestEl || !userEl) return;
  if (currentUser) {
    guestEl.style.display = 'none';
    userEl.style.display = 'flex';
    document.getElementById('meUserName').textContent = currentUser.name;
    document.getElementById('meUserEmail').textContent = currentUser.email;
    const avatarImg = document.getElementById('meUserAvatar');
    const initial = document.getElementById('meAvatarInitial');
    if (currentUser.avatar) {
      avatarImg.src = currentUser.avatar;
      avatarImg.style.display = 'block';
      initial.style.display = 'none';
    } else {
      avatarImg.style.display = 'none';
      initial.style.display = 'block';
      initial.textContent = currentUser.name.charAt(0).toUpperCase();
    }
  } else {
    guestEl.style.display = 'flex';
    userEl.style.display = 'none';
  }
}

/* ===== PAYMENT SYSTEM ===== */
let selectedPayMethod = 'whatsapp';
let paypalLoaded = false;

const DELIVERY_SAR = 17;
const FREE_DELIVERY_THRESHOLD_SAR = 100;

function cartSubtotalBase() {
  return cart.reduce((s, i) => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
}

function openPayment() {
  if (cart.length === 0) { showToast(t('cartEmpty')); return; }
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
}

function selectPayMethod(method) {
  selectedPayMethod = method;
  ['whatsapp','paypal','card','gpay'].forEach(m => {
    document.getElementById('pm' + m.charAt(0).toUpperCase() + m.slice(1)).classList.remove('active');
    document.getElementById('check' + m.charAt(0).toUpperCase() + m.slice(1)).querySelector('i').style.color = '#ddd';
  });
  const card = document.getElementById('pm' + method.charAt(0).toUpperCase() + method.slice(1));
  if (card) { card.classList.add('active'); }
  const check = document.getElementById('check' + method.charAt(0).toUpperCase() + method.slice(1));
  if (check) check.querySelector('i').style.color = '#e91e8c';
  // Show/hide sub-forms
  document.getElementById('paypalBtnContainer').style.display = (method === 'paypal') ? 'block' : 'none';
  document.getElementById('cardForm').style.display = (method === 'card') ? 'block' : 'none';
  // Update button text
  const lang2 = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const subtotalDisp2 = cartSubtotalBase() * lang2.rate;
  const delDisp2 = subtotalDisp2 >= FREE_DELIVERY_THRESHOLD_SAR ? 0 : DELIVERY_SAR;
  const grandDisp2 = subtotalDisp2 + delDisp2;
  const methodLabel = { whatsapp: t('placeOrder'), paypal: 'PayPal', card: t('cardName'), gpay: 'Google Pay' };
  document.getElementById('payBtnText').textContent =
    (methodLabel[method] || t('placeOrder')) + ' — ' + lang2.currency + Math.round(grandDisp2).toLocaleString();
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
  const num = btn.querySelector('.rev-helpful-num');
  if (num) num.textContent = parseInt(num.textContent||'0') + (btn.classList.contains('liked') ? 1 : -1);
}
