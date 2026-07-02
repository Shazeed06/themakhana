/* ===================================================================
   THE MAKHANA - shop page: product grid + cart (uses window.TM + Checkout)
   =================================================================== */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var TM = window.TM;
  if (!TM) return;
  var FREE = 599;

  function cardHTML(p) {
    var ribbon = p.ribbon ? '<span class="ribbon ribbon--' + p.ribbonType + '">' + p.ribbon + '</span>' : '';
    var isCombo = p.category === 'combo';
    var badge = isCombo ? '' : '<span class="disc-badge">-' + TM.pct(p) + '%</span>';
    var nm = p.name.split(' (')[0];
    var media = (p.images && p.images[0])
      ? '<img class="card__img" src="' + p.images[0] + '" alt="" loading="lazy" width="600" height="600" style="width:100%;height:100%;object-fit:contain;display:block">'
      : '<div class="card__pouch">' + TM.pouchSVG(p) + '</div>';
    return '<article class="card reveal" style="--acc:' + p.acc + '" data-cat="' + p.category + '">' +
      ribbon + badge +
      '<a class="card__media" href="/products/' + p.id + '" aria-label="View ' + nm + '">' + media + '</a>' +
      '<button class="add-btn" data-add="' + p.id + '" aria-label="Add ' + nm + ' to cart">' + TM.ICON.bag + '<span class="add-btn__label">Add to cart</span></button>' +
      '<h3 class="card__name"><a href="/products/' + p.id + '">' + nm + '</a></h3>' +
      '<div class="card__price"><span class="card__now">' + TM.rupee(p.price) + '</span><span class="card__mrp">' + TM.rupee(p.mrp) + '</span></div>' +
      '</article>';
  }
  // Reveal scroll-animation elements. shop.html does NOT load script.js (which
  // owns the global reveal observer), so without this the .reveal product cards
  // stay at opacity:0 forever on motion-enabled devices (i.e. real phones).
  function reveal() {
    var els = $$('.reveal:not(.in)');
    if (!els.length) return;
    // Reveal immediately (staggered) — robust on every device, no dependence on
    // scroll position or motion settings; the .reveal->.in transition fades them in.
    requestAnimationFrame(function () {
      els.forEach(function (el, i) { setTimeout(function () { el.classList.add('in'); }, Math.min(i * 35, 420)); });
    });
  }
  var curFilter = 'all', curQuery = '';
  function renderGrid(filter, q) {
    curFilter = filter || 'all';
    curQuery = (q === undefined || q === null) ? curQuery : String(q).toLowerCase().trim();
    var list = TM.PRODUCTS.filter(function (p) {
      var okCat = curFilter === 'all' || p.category === curFilter;
      var okQ = !curQuery || p.name.toLowerCase().includes(curQuery);
      return okCat && okQ;
    });
    var grid = $('#productGrid');
    if (!list.length) {
      grid.innerHTML = '<p class="shop-empty" style="grid-column:1/-1;text-align:center;padding:40px 16px;color:var(--ink-soft,#6b5b51);font-weight:600">No makhana matched &mdash; try another search.</p>';
    } else {
      grid.innerHTML = list.map(cardHTML).join('');
    }
    var fc = $('#filterCount'); if (fc) fc.textContent = 'Showing ' + list.length + ' product' + (list.length === 1 ? '' : 's');
    reveal();
  }

  function count() { return TM.getCart().reduce(function (s, i) { return s + i.qty; }, 0); }
  function bump() { var el = $('#cartCount'); if (!el) return; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }

  function updateSummary() {
    var c = TM.getCart();
    var sub = c.reduce(function (s, l) { var p = TM.getProduct(l.id); return p ? s + p.price * l.qty : s; }, 0);
    var mrp = c.reduce(function (s, l) { var p = TM.getProduct(l.id); return p ? s + p.mrp * l.qty : s; }, 0);
    $('#cartCount').textContent = count();
    $('#cartSubtotal').textContent = TM.rupee(sub);
    $('#cartSaved').textContent = TM.rupee(mrp - sub);
    $('#cartTotal').textContent = TM.rupee(sub);
    $('#cartSaveRow').style.display = (mrp - sub) > 0 ? 'flex' : 'none';
    var nFill = $('#shipNudgeFill'), nText = $('#shipNudgeText');
    if (nFill && nText) {
      var rem = FREE - sub, pct = Math.max(0, Math.min(100, Math.round(sub / FREE * 100)));
      nFill.style.width = pct + '%';
      if (sub > 0 && rem > 0) nText.innerHTML = '<span>You are ' + TM.rupee(rem) + ' away from free shipping</span>';
      else if (sub > 0) nText.innerHTML = '<span>You have unlocked free shipping!</span>';
      else nText.innerHTML = '<span>Free shipping over ' + TM.rupee(FREE) + '</span>';
    }
  }
  function renderCart() {
    var c = TM.getCart(), body = $('#cartItems'), foot = $('#cartFoot');
    if (!c.length) {
      body.innerHTML = '<div class="cart__empty">' + TM.ICON.lotus + '<p>Your basket is empty</p><a href="/shop" data-close-cart>Shop the range</a></div>';
      foot.classList.add('is-empty'); return;
    }
    foot.classList.remove('is-empty');
    body.innerHTML = c.map(function (l) {
      var p = TM.getProduct(l.id); if (!p) return '';
      return '<div class="cart-item" data-line="' + p.id + '" style="--acc:' + p.acc + '">' +
        '<div class="cart-item__art">' + TM.pouchSVG(p, { decorative: true }) + '</div>' +
        '<div><div class="cart-item__name">' + p.name.split(' (')[0] + '</div><div class="cart-item__price tnum">' + TM.rupee(p.price) + ' each</div>' +
        '<div class="cart-item__controls"><div class="qty"><button data-qty="-1" data-id="' + p.id + '" aria-label="Decrease quantity">' + TM.ICON.minus + '</button><span class="qty__val">' + l.qty + '</span><button data-qty="1" data-id="' + p.id + '" aria-label="Increase quantity">' + TM.ICON.plus + '</button></div></div></div>' +
        '<div class="cart-item__line"><div class="cart-item__total tnum">' + TM.rupee(p.price * l.qty) + '</div><button class="cart-item__remove" data-remove="' + p.id + '" aria-label="Remove ' + p.name + '">' + TM.ICON.trash + 'Remove</button></div>' +
        '</div>';
    }).join('');
  }

  function add(id) { TM.addToCart(id); renderCart(); updateSummary(); bump(); }
  function changeQty(id, d) { var c = TM.getCart(), l = c.find(function (i) { return i.id === id; }); if (!l) return; l.qty += d; if (l.qty <= 0) c = c.filter(function (i) { return i.id !== id; }); TM.setCart(c); renderCart(); updateSummary(); }
  function removeItem(id) { TM.setCart(TM.getCart().filter(function (i) { return i.id !== id; })); renderCart(); updateSummary(); }

  var drawer = $('#cartDrawer'), scrim = $('#cartScrim');
  function openCart() { scrim.hidden = false; requestAnimationFrame(function () { scrim.classList.add('open'); drawer.classList.add('open'); }); drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function closeCart() { scrim.classList.remove('open'); drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; setTimeout(function () { scrim.hidden = true; }, 350); }

  function toast(msg) { var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.innerHTML = TM.ICON.check + '<span>' + msg + '</span>'; $('#toasts').appendChild(el); requestAnimationFrame(function () { el.classList.add('show'); }); setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 300); }, 2600); }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-add]');
    if (a) { add(a.dataset.add); var lab = $('.add-btn__label', a); if (lab && !a.classList.contains('added')) { var prev = lab.textContent; a.classList.add('added'); lab.textContent = 'Added ✓'; setTimeout(function () { a.classList.remove('added'); lab.textContent = prev; }, 900); } return; }
    var q = e.target.closest('[data-qty]'); if (q) { changeQty(q.dataset.id, +q.dataset.qty); return; }
    var r = e.target.closest('[data-remove]'); if (r) { removeItem(r.dataset.remove); return; }
    if (e.target.closest('[data-close-cart]')) { closeCart(); return; }
  });
  $('#cartBtn').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  scrim.addEventListener('click', closeCart);
  $('#checkoutBtn').addEventListener('click', function () {
    if (!TM.getCart().length) { toast('Your basket is empty'); return; }
    closeCart();
    window.Checkout.open({ items: TM.getCart(), getProduct: TM.getProduct, rupee: TM.rupee, freeShip: FREE, onPlaced: function () { TM.setCart([]); renderCart(); updateSummary(); bump(); toast('Order placed - thank you!'); } });
  });

  function setActiveFilter(filter) {
    $$('.filter__pill').forEach(function (p) { var on = p.dataset.filter === filter; p.classList.toggle('is-active', on); p.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    $$('.shop-cat').forEach(function (c) { c.classList.toggle('is-active', c.dataset.filter === filter); });
  }
  $$('.filter__pill').forEach(function (pill) {
    pill.addEventListener('click', function () {
      setActiveFilter(pill.dataset.filter);
      renderGrid(pill.dataset.filter);
    });
  });
  $$('.shop-cat').forEach(function (cat) {
    cat.addEventListener('click', function () {
      setActiveFilter(cat.dataset.filter);
      renderGrid(cat.dataset.filter);
    });
  });
  var searchEl = $('#shopSearch');
  if (searchEl) {
    searchEl.addEventListener('input', function () { renderGrid(curFilter, searchEl.value); });
    searchEl.addEventListener('search', function () { renderGrid(curFilter, searchEl.value); });
  }

  renderGrid('all');
  renderCart();
  updateSummary();
})();
