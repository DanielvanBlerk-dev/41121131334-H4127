'use strict';

/* ─── ADMIN CONFIG ────────────────────────────────────────────────────────── */
// Change this password before deploying. Store it server-side in production.
const ADMIN_PASSWORD = 'atelier2026';
const STORAGE_KEY    = 'atelier_artworks';
const SESSION_KEY    = 'atelier_admin';

/* ─── DEFAULT ARTWORKS ────────────────────────────────────────────────────── */
const DEFAULT_ARTWORKS = [
  {
    id: 1, title: 'Still Life with Lemons', medium: 'Oil on linen · 50 × 60 cm', price: 1800, sold: false,
    svg: '<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="400" fill="#f0ebe0"/><rect x="0" y="280" width="300" height="120" fill="#d4c9b0"/><ellipse cx="110" cy="265" rx="48" ry="22" fill="#c8a820" opacity="0.9"/><ellipse cx="190" cy="270" rx="42" ry="19" fill="#d4b422"/><ellipse cx="150" cy="258" rx="36" ry="16" fill="#e8c830"/><rect x="80" y="100" width="140" height="165" rx="2" fill="#9b8870" opacity="0.3"/><path d="M120 180 Q150 140 180 180" stroke="#7a6050" fill="none" stroke-width="1.5"/><circle cx="90" cy="80" r="8" fill="#8fb050" opacity="0.6"/><circle cx="200" cy="90" r="6" fill="#7a9840" opacity="0.5"/></svg>'
  },
  {
    id: 2, title: 'Coastal Morning', medium: 'Oil on board · 30 × 40 cm', price: 950, sold: false,
    svg: '<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="400" fill="#e8eef5"/><rect y="0" width="300" height="220" fill="#c8d8e8"/><rect y="220" width="300" height="60" fill="#b8c8d8"/><rect y="280" width="300" height="120" fill="#d4c8a8"/><ellipse cx="150" cy="80" rx="60" ry="40" fill="#f5f0e8" opacity="0.7"/><path d="M0 250 Q75 235 150 248 Q225 260 300 245" stroke="#8a9ab0" fill="none" stroke-width="1.5" opacity="0.6"/></svg>'
  },
  {
    id: 3, title: 'Interior, Late Afternoon', medium: 'Acrylic on linen · 60 × 80 cm', price: 2400, sold: false,
    svg: '<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="400" fill="#e8dcc8"/><rect x="160" y="40" width="100" height="250" fill="#f5e8c0" opacity="0.8"/><rect x="0" y="0" width="160" height="300" fill="#c8b898" opacity="0.4"/><rect x="60" y="180" width="80" height="120" rx="2" fill="#6a5840" opacity="0.3"/><rect x="40" y="300" width="220" height="100" fill="#a89878"/><circle cx="80" cy="160" r="30" fill="#d4a840" opacity="0.4"/></svg>'
  },
  {
    id: 4, title: 'Portrait Study No. 7', medium: 'Oil on board · 25 × 35 cm', price: 1200, sold: true,
    svg: '<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="400" fill="#e0d4c8"/><rect x="50" y="50" width="200" height="300" fill="#c8b8a8" opacity="0.4"/><ellipse cx="150" cy="160" rx="55" ry="65" fill="#d4a888" opacity="0.9"/><ellipse cx="150" cy="100" rx="40" ry="45" fill="#c09878"/><path d="M120 165 Q150 180 180 165" stroke="#8a6858" fill="none" stroke-width="1.5"/></svg>'
  },
  {
    id: 5, title: 'Garden at Dusk', medium: 'Oil on linen · 70 × 90 cm', price: 3200, sold: false,
    svg: '<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="400" fill="#2a2040"/><rect y="250" width="300" height="150" fill="#3a3428" opacity="0.9"/><circle cx="200" cy="80" r="35" fill="#d4901c" opacity="0.5"/><ellipse cx="80" cy="240" rx="45" ry="80" fill="#2a4820" opacity="0.8"/><ellipse cx="220" cy="230" rx="35" ry="65" fill="#1e3818" opacity="0.8"/></svg>'
  },
  {
    id: 6, title: 'The White Jug', medium: 'Oil on board · 20 × 25 cm', price: 680, sold: false,
    svg: '<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="400" fill="#e8e4dc"/><rect y="280" width="300" height="120" fill="#d0ccc4"/><path d="M120 280 Q110 200 120 140 Q130 100 150 100 Q170 100 180 140 Q190 200 180 280Z" fill="#f5f3ef"/><path d="M180 160 Q210 155 205 175 Q200 195 180 185" fill="#f5f3ef"/><ellipse cx="150" cy="280" rx="32" ry="8" fill="#c8c4bc"/></svg>'
  },
];

/* ─── STATE ───────────────────────────────────────────────────────────────── */
let artworks       = loadArtworks();
let cart           = [];
let isAdmin        = false;
let pendingDeleteId = null;
let newImgData     = null;
let squareCard     = null;
let squarePayments = null;

/* ─── PERSISTENCE ─────────────────────────────────────────────────────────── */
function loadArtworks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_ARTWORKS));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_ARTWORKS));
  }
}

function saveArtworks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(artworks));
  } catch (e) {
    // Likely quota exceeded by base64 image data — retry without imgData blobs
    console.warn('localStorage quota exceeded, saving without image blobs:', e);
    try {
      const slim = artworks.map(a => Object.assign({}, a, { imgData: null }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch (e2) {
      console.error('localStorage save failed entirely:', e2);
    }
  }
}

/* ─── ADMIN AUTH ──────────────────────────────────────────────────────────── */
function checkSession() {
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
}

function openLogin() {
  el('admin-pw').value = '';
  el('login-error').textContent = '';
  el('login-overlay').classList.add('open');
  setTimeout(() => el('admin-pw').focus(), 200);
}

function closeLogin() {
  el('login-overlay').classList.remove('open');
}

function attemptLogin() {
  const pw = el('admin-pw').value;
  if (pw === ADMIN_PASSWORD) {
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* private browsing */ }
    isAdmin = true;
    closeLogin();
    activateAdminMode();
  } else {
    el('login-error').textContent = 'Incorrect password.';
    el('admin-pw').value = '';
    el('admin-pw').focus();
  }
}

function adminLogout() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  isAdmin = false;
  el('admin-bar').classList.remove('visible');
  el('admin-nav-link').classList.remove('active');
  renderGallery();
}

function activateAdminMode() {
  isAdmin = true;
  el('admin-bar').classList.add('visible');
  el('admin-nav-link').classList.add('active');
  renderGallery();
}

/* ─── GALLERY ─────────────────────────────────────────────────────────────── */
function renderGallery() {
  const grid = el('gallery-grid');

  // Build all card elements in a fragment — no innerHTML with event handlers
  const fragment = document.createDocumentFragment();

  artworks.forEach(art => {
    const card = document.createElement('div');
    card.className = 'artwork-card';
    card.id = 'card-' + art.id;

    // --- image area ---
    const imgWrap = document.createElement('div');
    imgWrap.className = 'artwork-img';

    if (art.imgData) {
      const img = document.createElement('img');
      img.src = art.imgData;
      img.alt = art.title;
      imgWrap.appendChild(img);
    } else if (art.svg) {
      imgWrap.innerHTML = art.svg; // SVG markup only — safe, no script tags
    }

    if (art.sold) {
      const overlay = document.createElement('div');
      overlay.className = 'sold-overlay';
      overlay.textContent = 'Sold';
      imgWrap.appendChild(overlay);
    }

    // --- label row ---
    const labelRow = document.createElement('div');
    labelRow.className = 'artwork-label';
    const titleEl = document.createElement('span');
    titleEl.className = 'artwork-title';
    titleEl.textContent = art.title;
    const priceEl = document.createElement('span');
    priceEl.className = 'artwork-price';
    priceEl.textContent = 'AUD $' + art.price.toLocaleString();
    labelRow.appendChild(titleEl);
    labelRow.appendChild(priceEl);

    // --- medium ---
    const mediumEl = document.createElement('div');
    mediumEl.className = 'artwork-medium';
    mediumEl.textContent = art.medium;

    // --- add to cart button ---
    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn' + (inCart(art.id) ? ' added' : '');
    addBtn.disabled = art.sold || inCart(art.id);
    addBtn.textContent = art.sold ? 'Sold' : inCart(art.id) ? 'In your selection' : '+ Add to selection';
    addBtn.addEventListener('click', () => addToCart(art.id));

    // --- admin controls ---
    const adminCtrl = document.createElement('div');
    adminCtrl.className = 'admin-controls' + (isAdmin ? ' visible' : '');

    const soldBtn = document.createElement('button');
    soldBtn.className = 'admin-ctrl-btn sold-toggle';
    soldBtn.textContent = art.sold ? 'Mark available' : 'Mark sold';
    soldBtn.addEventListener('click', () => toggleSold(art.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'admin-ctrl-btn del';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => confirmDelete(art.id, art.title));

    adminCtrl.appendChild(soldBtn);
    adminCtrl.appendChild(delBtn);

    card.appendChild(imgWrap);
    card.appendChild(labelRow);
    card.appendChild(mediumEl);
    card.appendChild(addBtn);
    card.appendChild(adminCtrl);

    fragment.appendChild(card);
  });

  grid.innerHTML = '';
  grid.appendChild(fragment);
}

function inCart(id) {
  return cart.some(i => i.id === id);
}

/* ─── ADMIN ACTIONS ───────────────────────────────────────────────────────── */
function toggleSold(id) {
  const art = artworks.find(a => a.id === id);
  if (!art) return;
  art.sold = !art.sold;
  if (art.sold) cart = cart.filter(i => i.id !== id);
  saveArtworks();
  updateCartUI();
  renderGallery();
}

function confirmDelete(id, title) {
  pendingDeleteId = id;
  el('confirm-sub').textContent = '"' + title + '" will be removed from your gallery permanently.';
  el('confirm-overlay').classList.add('open');
}

function closeConfirm() {
  el('confirm-overlay').classList.remove('open');
  // Don't null pendingDeleteId here — do it AFTER deletion succeeds
}

function executeDeletion() {
  if (pendingDeleteId === null || pendingDeleteId === undefined) return;
  artworks = artworks.filter(a => a.id !== pendingDeleteId);
  cart     = cart.filter(i => i.id !== pendingDeleteId);
  pendingDeleteId = null;
  saveArtworks();
  updateCartUI();
  renderGallery();
  el('confirm-overlay').classList.remove('open');
}

/* ─── ADD PAINTING ────────────────────────────────────────────────────────── */
function openAddPanel() {
  el('add-panel').classList.add('open');
  document.body.style.overflow = 'hidden';
  el('new-title').value   = '';
  el('new-medium').value  = '';
  el('new-price').value   = '';
  el('new-sold').checked  = false;
  el('add-error').textContent = '';
  el('img-placeholder').style.display = 'block';
  el('img-preview-el').style.display  = 'none';
  newImgData = null;
}

function closeAddPanel() {
  el('add-panel').classList.remove('open');
  document.body.style.overflow = '';
}

function handleImgUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    newImgData = ev.target.result;
    el('img-placeholder').style.display = 'none';
    const preview = el('img-preview-el');
    preview.src = newImgData;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function saveNewPainting() {
  const title    = el('new-title').value.trim();
  const medium   = el('new-medium').value.trim();
  const priceRaw = el('new-price').value;
  const sold     = el('new-sold').checked;
  const errEl    = el('add-error');

  if (!title)  { errEl.textContent = 'Please enter a title.'; return; }
  if (!medium) { errEl.textContent = 'Please enter the medium and dimensions.'; return; }
  const price = parseInt(priceRaw, 10);
  if (!priceRaw || isNaN(price) || price < 0) { errEl.textContent = 'Please enter a valid price.'; return; }

  const newId = Date.now();
  artworks.push({ id: newId, title, medium, price, sold, imgData: newImgData || null, svg: null });
  saveArtworks();
  renderGallery();
  closeAddPanel();
  setTimeout(() => {
    const card = document.getElementById('card-' + newId);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 200);
}

/* ─── CART ────────────────────────────────────────────────────────────────── */
function addToCart(id) {
  const art = artworks.find(a => a.id === id);
  if (!art || art.sold || inCart(id)) return;
  cart.push(art);
  updateCartUI();
  renderGallery();
  openCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCartUI();
  renderGallery();
}

function updateCartUI() {
  const count = cart.length;
  el('cart-count').textContent = count;
  el('checkout-btn').disabled  = count === 0;
  const total = cart.reduce((s, i) => s + i.price, 0);
  el('cart-total').textContent = 'AUD $' + total.toLocaleString();

  const itemsEl = el('cart-items');
  const emptyEl = el('cart-empty');

  if (count === 0) {
    itemsEl.innerHTML = '';
    itemsEl.appendChild(emptyEl);
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';
  // Build cart items without innerHTML event handlers
  const frag = document.createDocumentFragment();
  frag.appendChild(emptyEl); // keep it in DOM (hidden)

  cart.forEach(art => {
    const item = document.createElement('div');
    item.className = 'cart-item';

    const thumb = document.createElement('div');
    thumb.className = 'cart-item-thumb';
    if (art.imgData) {
      const img = document.createElement('img');
      img.src = art.imgData; img.alt = art.title;
      thumb.appendChild(img);
    } else if (art.svg) {
      thumb.innerHTML = art.svg;
    }

    const info = document.createElement('div');
    const nameEl = document.createElement('div');
    nameEl.className = 'cart-item-name'; nameEl.textContent = art.title;
    const metaEl = document.createElement('div');
    metaEl.className = 'cart-item-meta'; metaEl.textContent = art.medium;
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-item'; removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => removeFromCart(art.id));
    info.appendChild(nameEl); info.appendChild(metaEl); info.appendChild(removeBtn);

    const priceEl = document.createElement('div');
    priceEl.className = 'cart-item-price';
    priceEl.textContent = '$' + art.price.toLocaleString();

    item.appendChild(thumb); item.appendChild(info); item.appendChild(priceEl);
    frag.appendChild(item);
  });

  itemsEl.innerHTML = '';
  itemsEl.appendChild(frag);
}

function openCart() {
  el('cart-overlay').classList.add('open');
  el('cart-panel').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  el('cart-overlay').classList.remove('open');
  el('cart-panel').classList.remove('open');
  document.body.style.overflow = '';
}

function toggleCart() {
  if (el('cart-panel').classList.contains('open')) closeCart();
  else openCart();
}

/* ─── CHECKOUT ────────────────────────────────────────────────────────────── */
function buildOrderSummary() {
  const total = cart.reduce((s, i) => s + i.price, 0);
  const summaryEl = el('order-summary');
  summaryEl.innerHTML = '';

  cart.forEach(a => {
    const row = document.createElement('div');
    row.className = 'order-line';
    const nameSpan = document.createElement('span');
    const em = document.createElement('em'); em.textContent = a.title;
    nameSpan.appendChild(em);
    const priceSpan = document.createElement('span');
    priceSpan.textContent = 'AUD $' + a.price.toLocaleString();
    row.appendChild(nameSpan); row.appendChild(priceSpan);
    summaryEl.appendChild(row);
  });

  const totalRow = document.createElement('div');
  totalRow.className = 'order-line total';
  totalRow.innerHTML = '<strong>Total</strong><strong>AUD $' + total.toLocaleString() + '</strong>';
  summaryEl.appendChild(totalRow);
}

async function openCheckout() {
  closeCart();
  document.body.style.overflow = 'hidden';
  buildOrderSummary();
  el('checkout-modal').classList.add('open');
  el('checkout-body').style.display = 'block';
  el('success-state').style.display = 'none';
  if (!squareCard) await initSquare();
}

function closeCheckout() {
  el('checkout-modal').classList.remove('open');
  document.body.style.overflow = '';
}

/* ─── SQUARE ──────────────────────────────────────────────────────────────── */
async function initSquare() {
  if (!window.Square) {
    showPaymentError('Square failed to load. Check your connection.');
    return;
  }
  try {
    const cfg = window.SQUARE_CONFIG;
    squarePayments = window.Square.payments(cfg.applicationId, cfg.locationId);
    squareCard = await squarePayments.card();
    await squareCard.attach('#card-container');
  } catch (e) {
    console.error('Square init error:', e);
    el('card-container').textContent = '⚠️ Payment form could not load. Check your Square credentials in square-config.js.';
  }
}

function showPaymentError(msg) {
  const errEl = el('payment-error');
  errEl.textContent = msg;
  errEl.style.display = 'block';
}

function validateForm() {
  const fields = [
    ['first-name', 'First name'], ['last-name', 'Last name'],
    ['email', 'Email'], ['address', 'Address'],
    ['city', 'City'], ['postcode', 'Postcode'],
  ];
  for (const [id, label] of fields) {
    if (!el(id).value.trim()) {
      showPaymentError('Please enter your ' + label + '.');
      return false;
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el('email').value)) {
    showPaymentError('Please enter a valid email address.');
    return false;
  }
  return true;
}

async function handlePayment() {
  el('payment-error').style.display = 'none';
  if (!validateForm()) return;
  if (!squareCard) { showPaymentError('Payment form is not ready. Please try again.'); return; }

  const btn = el('pay-btn');
  btn.disabled = true;
  btn.textContent = 'Processing…';

  try {
    const result = await squareCard.tokenize();
    if (result.status === 'OK') {
      await processPayment(result.token);
    } else {
      const msg = (result.errors || []).map(e => e.message).join(' ') || 'Card error — please check your details.';
      showPaymentError(msg);
      btn.disabled = false;
      btn.textContent = 'Complete Purchase';
    }
  } catch (e) {
    showPaymentError('An unexpected error occurred. Please try again.');
    console.error(e);
    btn.disabled = false;
    btn.textContent = 'Complete Purchase';
  }
}

async function processPayment(sourceId) {
  // ── PRODUCTION ────────────────────────────────────────────────────────────
  // POST { sourceId, items: cart, customer: { ... } } to your backend.
  // Your backend calls Square POST /v2/payments with your secret key.
  // NEVER call Square's Payments API directly from the browser.
  // ─────────────────────────────────────────────────────────────────────────
  void sourceId; // suppress lint warning in demo
  await new Promise(r => setTimeout(r, 1400)); // simulate network round-trip

  const orderId = 'ATL-' + Math.random().toString(36).substr(2, 8).toUpperCase();

  // Mark purchased works as sold
  cart.forEach(item => {
    const art = artworks.find(a => a.id === item.id);
    if (art) art.sold = true;
  });
  saveArtworks();

  showSuccess(orderId);
}

function showSuccess(orderId) {
  el('checkout-body').style.display = 'none';
  el('success-state').style.display = 'block';
  el('success-order-id').textContent = 'Order ' + orderId;
}

function resetShop() {
  cart = [];
  squareCard = null;
  squarePayments = null;
  el('card-container').innerHTML = '';
  updateCartUI();
  renderGallery();
  closeCheckout();
}

/* ─── HELPER ──────────────────────────────────────────────────────────────── */
function el(id) { return document.getElementById(id); }

/* ─── BOOT — attach all listeners after DOM ready ─────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Nav
  el('cart-toggle-btn').addEventListener('click', toggleCart);
  el('admin-nav-link').addEventListener('click', e => { e.preventDefault(); openLogin(); });

  // Cart panel
  el('cart-overlay').addEventListener('click', closeCart);
  el('cart-close-btn').addEventListener('click', closeCart);
  el('checkout-btn').addEventListener('click', openCheckout);

  // Checkout modal
  el('checkout-close-btn').addEventListener('click', closeCheckout);
  el('pay-btn').addEventListener('click', handlePayment);

  // Success
  el('success-continue-btn').addEventListener('click', resetShop);

  // Login
  el('login-btn').addEventListener('click', attemptLogin);
  el('login-cancel-btn').addEventListener('click', closeLogin);
  el('admin-pw').addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });

  // Admin bar
  el('admin-add-btn').addEventListener('click', openAddPanel);
  el('admin-logout-btn').addEventListener('click', adminLogout);

  // Add panel
  el('add-panel-close-btn').addEventListener('click', closeAddPanel);
  el('img-upload-area').addEventListener('click', () => el('img-file').click());
  el('img-file').addEventListener('change', handleImgUpload);
  el('save-painting-btn').addEventListener('click', saveNewPainting);

  // Delete confirm
  el('confirm-cancel-btn').addEventListener('click', closeConfirm);
  el('confirm-delete-btn').addEventListener('click', executeDeletion);

  // Boot
  if (checkSession()) activateAdminMode();
  renderGallery();
  updateCartUI();
});
