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
  savedLocation = { name, phone, city, area, address };
  localStorage.setItem('shopbd_location', JSON.stringify(savedLocation));
  const badge = document.getElementById('meLocSaved');
  if (badge) badge.textContent = '✓ সেভড';
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
    if (badge) badge.textContent = '✓ সেভড';
  }
});
