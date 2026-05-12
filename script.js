/* ===== STATE ===== */
let cart = [];
let wishlist = [];
let currentFilter = 'all';
let currentSort = 'default';
let visibleCount = 8;
let currentProduct = null;
let selectedSize = '';
let selectedColor = '';
let heroIndex = 0;
let heroTimer;

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
  const slides = document.querySelectorAll('.hero-slide');
  heroIndex = (heroIndex + 1) % slides.length;
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
  document.querySelectorAll('.hero-dot').forEach((d, i) => {
    d.classList.toggle('active', i === heroIndex);
  });
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
  const flashProds = PRODUCTS.filter(p => p.discount >= 45).slice(0, 6);
  const container = document.getElementById('flashProducts');
  container.innerHTML = flashProds.map(p => `
    <div class="flash-card" onclick="openModal(${p.id})">
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <span class="discount-badge">-${p.discount}%</span>
      </div>
      <div class="product-info">
        <div class="product-prices">
          <span class="price-current">৳${p.price}</span>
        </div>
        <div class="product-meta">
          <span class="product-rating">★ ${p.rating}</span>
        </div>
      </div>
    </div>
  `).join('');
}

/* ===== RENDER SUPER DEALS ===== */
function renderSuperDeals() {
  const deals = PRODUCTS.filter(p => p.tag === 'sale' || p.tag === 'hot').slice(0, 4);
  document.getElementById('superDeals').innerHTML = deals.map(p => `
    <div class="product-card small" onclick="openModal(${p.id})">
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <span class="discount-badge">-${p.discount}%</span>
      </div>
      <div class="product-info">
        <p class="product-name">${p.name}</p>
        <div class="product-prices">
          <span class="price-current">৳${p.price}</span>
        </div>
      </div>
    </div>
  `).join('');
}

/* ===== RENDER TRENDING ===== */
function renderTrending() {
  const trending = PRODUCTS.filter(p => p.tag === 'bestseller' || p.tag === 'new').slice(0, 4);
  document.getElementById('trendingProducts').innerHTML = trending.map(p => `
    <div class="product-card small" onclick="openModal(${p.id})">
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <span class="discount-badge">-${p.discount}%</span>
      </div>
      <div class="product-info">
        <p class="product-name">${p.name}</p>
        <div class="product-prices">
          <span class="price-current">৳${p.price}</span>
        </div>
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
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (currentSort === 'low') filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (currentSort === 'high') filtered = [...filtered].sort((a, b) => b.price - a.price);
  else if (currentSort === 'popular') filtered = [...filtered].sort((a, b) => b.ratingCount - a.ratingCount);

  const grid = document.getElementById('productsGrid');
  const visible = filtered.slice(0, visibleCount);

  if (visible.length === 0) {
    grid.innerHTML = `<div class="no-results"><i class="fas fa-search"></i><p>কোনো পণ্য পাওয়া যায়নি</p></div>`;
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
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <span class="discount-badge">-${p.discount}%</span>
        <button class="wish-btn ${inWish ? 'active' : ''}"
          onclick="event.stopPropagation(); toggleWish(${p.id}, this)">
          <i class="${inWish ? 'fas' : 'far'} fa-heart"></i>
        </button>
      </div>
      <div class="product-info">
        <p class="product-name">${p.name}</p>
        <div class="product-prices">
          <span class="price-current">৳${p.price}</span>
          <span class="price-original">৳${p.originalPrice}</span>
        </div>
        <div class="product-meta">
          <span class="product-rating">★ ${p.rating} (${p.ratingCount.toLocaleString()})</span>
          <span class="product-sold">${p.sold} বিক্রয়</span>
        </div>
      </div>
      <button class="add-cart-btn" onclick="event.stopPropagation(); quickAddCart(${p.id})">
        🛒 কার্টে যোগ করুন
      </button>
    </div>
  `;
}

/* ===== FILTER BY CATEGORY ===== */
function filterCategory(cat) {
  currentFilter = cat;
  visibleCount = 8;
  currentSort = 'default';
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-sort="default"]').classList.add('active');
  document.querySelectorAll('.cat-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.cat === cat || (cat !== 'all' && t.dataset.cat === 'all' && cat === 'all'));
  });
  renderProducts();
  document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ===== SCROLL TO PRODUCTS ===== */
function scrollToProducts() {
  document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth' });
}

/* ===== LOAD MORE ===== */
document.getElementById('loadMoreBtn').addEventListener('click', () => {
  visibleCount += 8;
  renderProducts(document.getElementById('searchInput').value);
});

/* ===== SETUP EVENTS ===== */
function setupEvents() {
  // Category tabs
  document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterCategory(tab.dataset.cat);
    });
  });

  // Sort buttons
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      visibleCount = 8;
      renderProducts(document.getElementById('searchInput').value);
    });
  });

  // Search
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
    const term = document.getElementById('searchInput').value.trim();
    visibleCount = 8;
    renderProducts(term);
    document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth' });
  });

  // Drawer
  document.getElementById('menuBtn').addEventListener('click', openDrawer);
  document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
  document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);

  // Cart button
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('wishlistBtn').addEventListener('click', () => {
    showToast('উইশলিস্ট: ' + wishlist.length + ' টি পণ্য');
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
    container.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>কার্ট খালি আছে</p></div>`;
    footer.style.display = 'none';
    return;
  }
  container.innerHTML = cart.map(item => {
    const p = PRODUCTS.find(p => p.id === item.id);
    return `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${p.image}" alt="${p.name}" />
        </div>
        <div class="cart-item-info">
          <p class="cart-item-name">${p.name}</p>
          <p class="cart-item-price">৳${p.price}</p>
          <div class="cart-qty">
            <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
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
  document.getElementById('cartTotal').textContent = '৳' + total.toLocaleString();
  footer.style.display = 'block';
}
function quickAddCart(id) {
  addToCart(id, '', '');
}
function addToCart(id, size, color) {
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, qty: 1, size, color });
  }
  updateCartBadge();
  showToast('✓ কার্টে যোগ হয়েছে');
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
    showToast('উইশলিস্ট থেকে সরানো হয়েছে');
  } else {
    wishlist.push(id);
    btn.classList.add('active');
    btn.innerHTML = '<i class="fas fa-heart"></i>';
    showToast('❤️ উইশলিস্টে যোগ হয়েছে');
  }
  document.getElementById('wishBadge').textContent = wishlist.length;
  document.getElementById('wishBadge').style.display = wishlist.length ? 'flex' : 'none';
}

/* ===== PRODUCT MODAL ===== */
function openModal(id) {
  const p = PRODUCTS.find(p => p.id === id);
  if (!p) return;
  currentProduct = p;
  selectedSize = p.sizes[0] || '';
  selectedColor = p.colors[0] || '';
  const inWish = wishlist.includes(id);

  document.getElementById('modalBody').innerHTML = `
    <img class="modal-img" src="${p.image}" alt="${p.name}" />
    <div class="modal-info">
      <h2 class="modal-name">${p.name}</h2>
      <div class="modal-prices">
        <span class="modal-price-current">৳${p.price}</span>
        <span class="modal-price-orig">৳${p.originalPrice}</span>
        <span class="modal-discount">-${p.discount}%</span>
      </div>
      <div class="modal-rating">
        <span class="stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}</span>
        <span class="rating-count">${p.rating} (${p.ratingCount.toLocaleString()} রিভিউ) · ${p.sold} বিক্রয়</span>
      </div>
      <div class="modal-divider"></div>
      ${p.sizes.length > 0 ? `
        <p class="modal-section-title">সাইজ বেছে নিন</p>
        <div class="size-options" id="sizeOptions">
          ${p.sizes.map(s => `
            <div class="size-opt ${s === selectedSize ? 'active' : ''}" onclick="selectSize('${s}', this)">${s}</div>
          `).join('')}
        </div>
      ` : ''}
      ${p.colors.length > 0 ? `
        <p class="modal-section-title">রঙ বেছে নিন</p>
        <div class="color-options" id="colorOptions">
          ${p.colors.map((c, i) => `
            <div class="color-opt ${i === 0 ? 'active' : ''}"
              style="background:${c}"
              onclick="selectColor('${c}', this)"></div>
          `).join('')}
        </div>
      ` : ''}
      <div class="modal-divider"></div>
      <div style="display:flex;gap:10px;font-size:13px;color:#666;padding:0 0 4px">
        <span><i class="fas fa-truck" style="color:#e91e8c"></i> ৫০০+ টাকায় ফ্রি ডেলিভারি</span>
        <span><i class="fas fa-undo" style="color:#e91e8c"></i> ৭ দিন রিটার্ন</span>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-wishlist ${inWish ? 'active' : ''}" id="modalWishBtn"
        onclick="modalToggleWish(${p.id})">
        <i class="${inWish ? 'fas' : 'far'} fa-heart"></i>
      </button>
      <button class="btn-add-cart" onclick="modalAddCart(${p.id})">
        🛒 কার্টে যোগ করুন
      </button>
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
    showToast('উইশলিস্ট থেকে সরানো হয়েছে');
  } else {
    wishlist.push(id);
    btn.classList.add('active');
    btn.innerHTML = '<i class="fas fa-heart"></i>';
    showToast('❤️ উইশলিস্টে যোগ হয়েছে');
  }
  document.getElementById('wishBadge').textContent = wishlist.length;
  document.getElementById('wishBadge').style.display = wishlist.length ? 'flex' : 'none';
  renderProducts(document.getElementById('searchInput').value);
}

function modalAddCart(id) {
  addToCart(id, selectedSize, selectedColor);
  closeModal();
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
