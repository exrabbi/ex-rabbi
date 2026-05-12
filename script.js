/* ===== STATE ===== */
let cart = [];
let wishlist = [];
let currentFilter = 'all';
let currentSort = 'default';
let visibleCount = 8;
let currentLang = 'bn';
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
  renderProducts(document.getElementById('searchInput').value);
  renderCart();
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
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
  if (el) el.textContent = labels[currentLang] || 'বাংলা';
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
      showToast('📍 লোকেশন পাওয়া গেছে');
    })
    .catch(() => showToast('লোকেশন লোড হয়নি, আবার চেষ্টা করুন'));
}

function useMyLocation() {
  if (!navigator.geolocation) { showToast('GPS সাপোর্ট নেই'); return; }
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
      showToast('GPS চালু করুন এবং অনুমতি দিন');
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
    showToast('সব তথ্য পূরণ করুন');
    return;
  }
  const lat = savedLocation && savedLocation.lat ? savedLocation.lat : null;
  const lng = savedLocation && savedLocation.lng ? savedLocation.lng : null;
  savedLocation = { name, phone, city, area, address, lat, lng };
  localStorage.setItem('shopbd_location', JSON.stringify(savedLocation));
  const badge = document.getElementById('meLocSaved');
  if (badge) badge.textContent = (TRANSLATIONS[currentLang] || TRANSLATIONS['bn']).savedBadge || '✓ Saved';
  showToast('✓ ঠিকানা সেভ হয়েছে');
  closeLocation();
}

function getLocationText() {
  if (!savedLocation) return '';
  return `\n\n📍 *ডেলিভারি ঠিকানা*\nনাম: ${savedLocation.name}\nফোন: ${savedLocation.phone}\nশহর: ${savedLocation.city}${savedLocation.area ? ', ' + savedLocation.area : ''}\nঠিকানা: ${savedLocation.address}`;
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
    showToast('⚠️ Firebase এখনো সেটআপ হয়নি');
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
    showToast('✓ স্বাগতম, ' + result.user.displayName.split(' ')[0] + '!');
  } catch (e) {
    showToast('Google লগইন ব্যর্থ হয়েছে');
  }
}

function signInManual() {
  const name = document.getElementById('authName').value.trim();
  const email = document.getElementById('authEmail').value.trim();
  const phone = document.getElementById('authPhone').value.trim();
  if (!name) { showToast('নাম লিখুন'); return; }
  if (!email || !email.includes('@')) { showToast('সঠিক ইমেইল দিন'); return; }
  setUser({ name, email, phone, avatar: null, provider: 'manual' });
  closeAuth();
  showToast('✓ স্বাগতম, ' + name.split(' ')[0] + '!');
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

function openPayment() {
  if (cart.length === 0) { showToast('কার্ট খালি আছে'); return; }
  // Update totals
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS['bn'];
  const fmt = (v) => lang.currency + (v * lang.rate).toFixed(2);
  document.getElementById('paySubtotal').textContent = fmt(total);
  document.getElementById('payTotal').textContent = fmt(total);
  document.getElementById('payBtnText').textContent = 'অর্ডার দিন — ' + fmt(total);
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
  const labels = { whatsapp: 'WhatsApp-এ অর্ডার দিন', paypal: 'PayPal দিয়ে পেমেন্ট', card: 'কার্ড দিয়ে পেমেন্ট', gpay: 'Google Pay' };
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS['bn'];
  const fmt = (v) => lang.currency + (v * lang.rate).toFixed(2);
  document.getElementById('payBtnText').textContent = (labels[method] || 'পেমেন্ট করুন') + ' — ' + fmt(total);
}

function processPayment() {
  if (selectedPayMethod === 'whatsapp') {
    closePayment();
    whatsappCheckout();
  } else if (selectedPayMethod === 'paypal') {
    if (typeof PAYPAL_READY !== 'undefined' && PAYPAL_READY) {
      showToast('PayPal উইন্ডো খুলছে...');
    } else {
      showToast('⚠️ PayPal এখনো সেটআপ হয়নি — WhatsApp অর্ডার দিন');
      setTimeout(() => { closePayment(); whatsappCheckout(); }, 1500);
    }
  } else if (selectedPayMethod === 'card') {
    const num = (document.getElementById('cardNumber').value || '').replace(/\s/g,'');
    const exp = document.getElementById('cardExpiry').value || '';
    const cvv = document.getElementById('cardCvv').value || '';
    const name = document.getElementById('cardName').value || '';
    if (num.length < 16 || !exp || cvv.length < 3 || !name) {
      showToast('সব কার্ড তথ্য দিন'); return;
    }
    showToast('⚠️ Card gateway এখনো সেটআপ হয়নি');
    setTimeout(() => { closePayment(); whatsappCheckout(); }, 1500);
  } else if (selectedPayMethod === 'gpay') {
    showToast('⚠️ Google Pay এখনো সেটআপ হয়নি');
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
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS['bn'];
  const amount = (total * lang.rate).toFixed(2);
  paypal.Buttons({
    createOrder: (data, actions) => actions.order.create({
      purchase_units: [{ amount: { value: amount, currency_code: PAYPAL_CONFIG.currency }, description: 'EX GLOBAL Order' }]
    }),
    onApprove: (data, actions) => actions.order.capture().then(details => {
      showToast('✓ পেমেন্ট সফল! ধন্যবাদ ' + (details.payer.name.given_name || '') + '!');
      cart = []; updateCart(); closePayment();
    }),
    onError: () => showToast('পেমেন্ট ব্যর্থ হয়েছে, আবার চেষ্টা করুন')
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

function openWriteReview() {
  document.getElementById('wrOverlay').classList.add('open');
  document.getElementById('wrModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeWriteReview() {
  document.getElementById('wrOverlay').classList.remove('open');
  document.getElementById('wrModal').classList.remove('open');
  document.body.style.overflow = '';
}

function setReviewStar(val) {
  reviewStarVal = val;
  const labels = { bn: ['','খুবই খারাপ','খারাপ','ঠিক আছে','ভালো','অসাধারণ!'], en: ['','Terrible','Bad','Okay','Good','Excellent!'], ar: ['','سيء جداً','سيء','مقبول','جيد','ممتاز!'] };
  const lang = labels[currentLang] || labels.en;
  document.querySelectorAll('.wr-star').forEach((s,i) => s.classList.toggle('on', i < val));
  const lbl = document.getElementById('wrStarLabel');
  if (lbl) lbl.textContent = lang[val] || '';
}

function submitReview() {
  if (!reviewStarVal) { showToast(t('rateFirst') || 'রেটিং দিন'); return; }
  const name = (document.getElementById('wrName').value || '').trim();
  const text = (document.getElementById('wrText').value || '').trim();
  if (!name || !text) { showToast(t('fillReview') || 'নাম ও রিভিউ লিখুন'); return; }
  showToast('✓ ' + (t('reviewSubmitted') || 'রিভিউ জমা হয়েছে! ধন্যবাদ'));
  document.getElementById('wrName').value = '';
  document.getElementById('wrText').value = '';
  reviewStarVal = 0;
  document.querySelectorAll('.wr-star').forEach(s => s.classList.remove('on'));
  const lbl = document.getElementById('wrStarLabel');
  if (lbl) lbl.textContent = '';
  closeWriteReview();
}

function markHelpful(btn) {
  btn.classList.toggle('liked');
  const span = btn.querySelector('span');
  if (span) span.textContent = parseInt(span.textContent) + (btn.classList.contains('liked') ? 1 : -1);
}

function filterReviews(tag, el) {
  document.querySelectorAll('.review-tag').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
}
