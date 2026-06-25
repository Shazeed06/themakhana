/* ===================================================================
   THE MAKHANA - store logic, SVG pouches, cart, UI
   =================================================================== */
(function () {
  "use strict";

  /* ---------- Data ---------- */
  const PRODUCTS = [
    { id:"peri",    name:"Peri Peri Punch",        price:199, mrp:249, category:"roasted", acc:"#C0492F", weight:"80g",  note:"spicy, zingy, addictive", ribbon:"BESTSELLER", ribbonType:"bestseller", rating:4.8, reviews:124, cat:"chilli" },
    { id:"pudina",  name:"Chatpata Pudina",        price:199, mrp:249, category:"roasted", acc:"#4F7A52", weight:"80g",  note:"tangy mint chaat hit",     ribbon:"NEW",        ribbonType:"new",        rating:4.7, reviews:98,  cat:"mint" },
    { id:"cream",   name:"Cream & Onion",          price:199, mrp:249, category:"roasted", acc:"#8A6BB0", weight:"80g",  note:"creamy, savoury, moreish", ribbon:"",           ribbonType:"",           rating:4.7, reviews:86,  cat:"onion" },
    { id:"salt",    name:"Salt & Pepper",          price:179, mrp:229, category:"roasted", acc:"#4A5A66", weight:"80g",  note:"classic, perfectly seasoned", ribbon:"",        ribbonType:"",           rating:4.6, reviews:72,  cat:"pepper" },
    { id:"pink",    name:"Himalayan Pink Salt",    price:179, mrp:229, category:"roasted", acc:"#C77A86", weight:"80g",  note:"clean, lightly salted",    ribbon:"",           ribbonType:"",           rating:4.7, reviews:64,  cat:"mountain" },
    { id:"classic", name:"Classic Lightly Salted", price:169, mrp:219, category:"roasted", acc:"#C9A227", weight:"80g",  note:"pure, plain, perfect",     ribbon:"",           ribbonType:"",           rating:4.6, reviews:110, cat:"seed" },
    { id:"raw",     name:"Raw Phool Makhana",      price:249, mrp:299, category:"raw",     acc:"#6E8B6F", weight:"100g", note:"premium handpicked, big pops", ribbon:"RAW",     ribbonType:"acc",        rating:4.9, reviews:140, cat:"lotus" },
    { id:"combo",   name:"Variety Combo (5 packs)",price:799, mrp:1095,category:"combo",   acc:"#B9760C", weight:"400g", note:"all flavours, perfect gifting", ribbon:"COMBO",  ribbonType:"acc",        rating:5.0, reviews:57,  cat:"combo" }
  ];

  const REVIEWS = [
    { quote:"“The peri peri is dangerously good. My 4pm slump never stood a chance - I'm on my third pack this month.”", name:"Ananya Sharma", city:"Mumbai" },
    { quote:"“Finally a snack I feel good giving my kids. Light, crunchy and not a drop of oil. The pudina is unreal.”", name:"Rohan Mehta", city:"Bengaluru" },
    { quote:"“Sent the combo box as a Diwali gift and got three calls asking where I bought it. Premium all the way.”", name:"Kavya Iyer", city:"Delhi" }
  ];

  /* ---------- Helpers ---------- */
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const rupee = (n) => "₹" + Number(n).toLocaleString("en-IN");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pct = (p) => Math.round(((p.mrp - p.price) / p.mrp) * 100);

  /* ---------- SVG icons ---------- */
  const ICON = {
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12a2 2 0 0 0 2 1.8h4A2 2 0 0 0 16 19l1-12"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 11a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 19L6 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4 10-10"/></svg>',
    lotus: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 14c3 4 5 8 5 11a5 5 0 0 1-10 0c0-3 2-7 5-11z"/><path d="M12 26c4 0 7 1.5 9 4M36 26c-4 0-7 1.5-9 4"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 17.6 6.7 20l1.1-6L3.4 9.8l6-.8L12 3.5z"/></svg>',
    truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7.5 18a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4zM17.5 18a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4z"/></svg>'
  };
  const stars = (n) => Array.from({ length: 5 }, () => ICON.star).join("");

  /* ---------- Flavour cue icons (inside pouch label) ---------- */
  function cueIcon(type) {
    const c = {
      chilli:  '<path d="M0 -8c3 1 4 4 3 8-1 5-5 8-8 8" /><path d="M0 -8c-1 -2 0 -4 2 -5" />',
      mint:    '<path d="M-6 6c0 -8 6 -12 12 -12 0 8 -6 12 -12 12z"/><path d="M-6 6L4 -4"/>',
      onion:   '<circle r="7"/><path d="M0 -7v14M-7 0h14"/>',
      pepper:  '<circle cx="-4" cy="-3" r="1.4"/><circle cx="3" cy="-4" r="1.4"/><circle cx="0" cy="2" r="1.4"/><circle cx="5" cy="3" r="1.4"/><circle cx="-4" cy="4" r="1.4"/>',
      mountain:'<path d="M-8 6L-2 -6 2 0 5 -5 8 6z"/>',
      seed:    '<ellipse rx="4.5" ry="7"/>',
      lotus:   '<path d="M0 -6c2 3 3 6 3 8a3 3 0 0 1-6 0c0-2 1-5 3-8z"/><path d="M-7 4c2.5 0 4.5 1 6 3M7 4c-2.5 0-4.5 1-6 3"/>',
      combo:   '<path d="M-7 -3l3 8M0 -5v9M7 -3l-3 8" stroke-width="1.6"/>'
    };
    return c[type] || c.seed;
  }

  /* ---------- THE POUCH (reusable parameterised SVG) ---------- */
  const _pouchCache = {};
  // Renders a paper-canister (tin) illustration for a product, parameterised by accent colour.
  function pouchSVG(p, opts) {
    opts = opts || {};
    if (!opts.decorative && _pouchCache[p.id]) return _pouchCache[p.id];
    const id = p.id;
    const acc = p.acc;
    const flav = p.name.split(" (")[0].toUpperCase();
    const ribbonName = flav.length > 15 ? p.id.toUpperCase() : flav;
    const a11y = opts.decorative
      ? 'role="presentation" aria-hidden="true"'
      : 'role="img" aria-label="' + escapeXML(p.name + " makhana canister") + '"';

    // a few foxnut puffs at the base, as garnish
    const puffs = [[78, 298, 12, -10], [188, 300, 11, 8], [98, 311, 9, 16]]
      .map((m) => {
        const cx = m[0], cy = m[1], r = m[2], rot = m[3], rx = r, ry = r * 0.86;
        return '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">' +
          '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#FBF3E0"/>' +
          '<ellipse cx="' + cx + '" cy="' + (cy + ry * 0.22) + '" rx="' + (rx * 0.8) + '" ry="' + (ry * 0.6) + '" fill="#E7D5AC" opacity=".6"/>' +
          '<path d="M' + (cx - rx * 0.5) + ' ' + (cy - ry * 0.1) + 'q' + (rx * 0.5) + ' ' + (ry * 0.32) + ' ' + rx + ' 0" fill="none" stroke="#C9B07F" stroke-width="1.1" stroke-linecap="round"/>' +
          '<ellipse cx="' + (cx - rx * 0.3) + '" cy="' + (cy - ry * 0.4) + '" rx="' + (rx * 0.28) + '" ry="' + (ry * 0.18) + '" fill="#fff" opacity=".75"/>' +
          '</g>';
      }).join("");

    let stripes = "";
    for (let x = 78; x <= 182; x += 8) stripes += '<line x1="' + x + '" y1="110" x2="' + x + '" y2="312"/>';

    const svg =
'<svg viewBox="0 0 260 340" ' + a11y + ' xmlns="http://www.w3.org/2000/svg">' +
  '<defs>' +
    '<linearGradient id="barrel-' + id + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#000" stop-opacity=".22"/>' +
      '<stop offset="0.10" stop-color="#000" stop-opacity=".05"/>' +
      '<stop offset="0.42" stop-color="#fff" stop-opacity=".36"/>' +
      '<stop offset="0.60" stop-color="#fff" stop-opacity=".08"/>' +
      '<stop offset="0.90" stop-color="#000" stop-opacity=".08"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity=".26"/>' +
    '</linearGradient>' +
    '<linearGradient id="lid-' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + shade(acc, 24) + '"/>' +
      '<stop offset="1" stop-color="' + shade(acc, -16) + '"/>' +
    '</linearGradient>' +
    '<clipPath id="body-' + id + '"><path d="M70 112 L190 112 L190 294 Q130 311 70 294 Z"/></clipPath>' +
  '</defs>' +
  '<ellipse cx="130" cy="309" rx="66" ry="11" fill="rgba(40,28,8,.22)" filter="url(#pouchShadow)"/>' +
  '<path d="M70 112 L190 112 L190 294 Q130 311 70 294 Z" fill="#EFE1C2"/>' +
  '<g clip-path="url(#body-' + id + ')" stroke="#E3D3AC" stroke-width="2" opacity=".7">' + stripes + '</g>' +
  '<rect x="68" y="112" width="124" height="11" fill="' + acc + '" clip-path="url(#body-' + id + ')"/>' +
  '<rect x="68" y="280" width="124" height="20" fill="' + acc + '" clip-path="url(#body-' + id + ')"/>' +
  '<rect x="68" y="108" width="124" height="206" fill="url(#barrel-' + id + ')" clip-path="url(#body-' + id + ')"/>' +
  '<circle cx="130" cy="152" r="21" fill="#FFFDF7"/>' +
  '<circle cx="130" cy="152" r="21" fill="none" stroke="' + acc + '" stroke-width="2.4"/>' +
  '<g transform="translate(130 152)" fill="none" stroke="' + acc + '" stroke-width="2" stroke-linecap="round">' +
    '<path d="M0 -9c2.6 3.4 3.9 6.8 3.9 9.4a3.9 3.9 0 0 1-7.8 0c0-2.6 1.3-6 3.9-9.4z"/>' +
    '<path d="M-10 4c3.4 0 6 1.3 7.6 3.4M10 4c-3.4 0-6 1.3-7.6 3.4"/>' +
  '</g>' +
  '<text x="130" y="196" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="13" letter-spacing="1.3" fill="#3A2E18">THE MAKHANA</text>' +
  '<text x="130" y="214" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600" font-size="8.5" letter-spacing="1.5" fill="#8A754C">' + (p.category === "raw" ? "RAW" : "ROASTED") + ' · ' + p.weight + '</text>' +
  '<rect x="80" y="248" width="100" height="22" rx="6" fill="#FFFDF7"/>' +
  '<text x="130" y="263" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="10" letter-spacing=".4" fill="' + shade(acc, -34) + '">' + escapeXML(ribbonName) + '</text>' +
  puffs +
  '<path d="M65 104 L65 113 Q65 118 130 120 Q195 118 195 113 L195 104 Z" fill="' + shade(acc, -20) + '"/>' +
  '<ellipse cx="130" cy="104" rx="65" ry="13.5" fill="url(#lid-' + id + ')"/>' +
  '<ellipse cx="130" cy="104" rx="65" ry="13.5" fill="none" stroke="' + shade(acc, -28) + '" stroke-width="1.4" opacity=".5"/>' +
  '<ellipse cx="115" cy="100" rx="30" ry="5.5" fill="#fff" opacity=".28"/>' +
'</svg>';
    if (!opts.decorative) _pouchCache[p.id] = svg;
    return svg;
  }

  function serrate(x, y, w, acc) {
    const teeth = 19, tw = w / teeth;
    let d = "M" + x + " " + y;
    for (let i = 0; i < teeth; i++) {
      d += " l" + (tw / 2) + " 5 l" + (tw / 2) + " -5";
    }
    return '<path d="' + d + ' v8 h-' + w + ' Z" fill="' + shade(acc, -20) + '"/>';
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function escapeXML(s) { return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])); }

  /* ---------- Render products ---------- */
  const grid = $("#productGrid");
  const filterCount = $("#filterCount");
  let activeFilter = "all";

  function cardHTML(p) {
    const ribbon = p.ribbon
      ? '<span class="ribbon ribbon--' + p.ribbonType + '">' + p.ribbon + '</span>' : "";
    const isCombo = p.category === "combo";
    const badge = isCombo ? "" : '<span class="disc-badge">-' + pct(p) + "%</span>";
    const nm = p.name.split(" (")[0];
    return '' +
      '<article class="card reveal" style="--acc:' + p.acc + '" data-cat="' + p.category + '">' +
        ribbon + badge +
        '<a class="card__media" href="/products/' + p.id + '" aria-label="View ' + escapeXML(nm) + '"><div class="card__pouch">' + pouchSVG(p) + '</div></a>' +
        '<button class="add-btn" data-add="' + p.id + '" aria-label="Add ' + escapeXML(p.name) + ' to cart">' +
          ICON.bag + '<span class="add-btn__label">Add to cart</span></button>' +
        '<h3 class="card__name"><a href="/products/' + p.id + '">' + nm + '</a></h3>' +
        '<div class="card__price">' +
          '<span class="card__now">' + rupee(p.price) + '</span>' +
          '<span class="card__mrp">' + rupee(p.mrp) + '</span>' +
        '</div>' +
      '</article>';
  }

  let productsRendered = false;
  function renderProducts(filter) {
    activeFilter = filter || "all";
    const list = activeFilter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeFilter);
    grid.style.opacity = "0";
    grid.innerHTML = list.map(cardHTML).join("");
    filterCount.textContent = "Showing " + list.length + " product" + (list.length === 1 ? "" : "s");
    requestAnimationFrame(() => {
      grid.style.transition = "opacity .35s ease";
      grid.style.opacity = "1";
      // On first paint the single init-time observeReveals(document) pass covers these
      // cards; only re-observe on later filter re-renders to avoid double registration.
      if (productsRendered) observeReveals(grid);
      productsRendered = true;
    });
  }

  /* ---------- Flavour explorer ---------- */
  function renderFlavours() {
    const row = $("#flavourRow");
    if (!row) return;
    const ids = ["peri", "pudina", "cream", "salt", "pink", "raw"];
    row.innerHTML = ids.map((id) => {
      const p = getProduct(id);
      if (!p) return "";
      const nm = p.name.split(" (")[0];
      return '<a class="flavour-card reveal" href="/products/' + p.id + '" style="--acc:' + p.acc + '" aria-label="Shop ' + nm + '">' +
        '<div class="flavour-card__art">' + pouchSVG(p) + '</div>' +
        '<div class="flavour-card__name">' + nm + '</div>' +
        '<div class="flavour-card__taste">' + p.note + '</div>' +
        '<div class="flavour-card__price tnum">' + rupee(p.price) + '</div>' +
      '</a>';
    }).join("");
  }

  /* ---------- Reviews ---------- */
  function renderReviews() {
    // Aggregate proof line, derived from per-product review data.
    const totalReviews = PRODUCTS.reduce((s, p) => s + p.reviews, 0);
    const avgRating = PRODUCTS.reduce((s, p) => s + p.rating * p.reviews, 0) / totalReviews;
    const roundedTotal = Math.floor(totalReviews / 50) * 50; // → "700+"
    const agg = $("#reviewsAgg");
    if (agg) {
      agg.innerHTML =
        '<span class="stars" aria-hidden="true">' + stars(5) + '</span>' +
        '<span>Rated ' + avgRating.toFixed(1) + '/5</span>' +
        '<span class="agg-sub">by ' + roundedTotal + '+ snackers across India</span>';
    }
    $("#reviewsGrid").innerHTML = REVIEWS.map((r) =>
      '<article class="review reveal">' +
        '<div class="review__stars" aria-label="5 out of 5 stars">' + stars(5) + '</div>' +
        '<p class="review__quote">' + r.quote + '</p>' +
        '<div class="review__who">' +
          '<div><div class="review__name">' + r.name + '</div><div class="review__city">' + r.city + '</div></div>' +
          '<span class="review__verified">' + ICON.check + 'Verified buyer</span>' +
        '</div>' +
      '</article>'
    ).join("");
  }

  /* ---------- Cart ---------- */
  const CART_KEY = "makhana_cart";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { cart = []; }

  const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} };
  const getProduct = (id) => PRODUCTS.find((p) => p.id === id);
  const cartCount = () => cart.reduce((s, i) => s + i.qty, 0);

  function addToCart(id) {
    const line = cart.find((i) => i.id === id);
    if (line) line.qty += 1; else cart.push({ id: id, qty: 1 });
    saveCart(); updateCartUI(); bumpCount();
  }
  function changeQty(id, delta) {
    const line = cart.find((i) => i.id === id);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) {
      cart = cart.filter((i) => i.id !== id);
      saveCart(); updateCartUI();      // structural change → full rebuild
      return;
    }
    saveCart();
    // Lightweight update: only touch the affected line + summary, no SVG re-parse.
    const p = getProduct(id);
    const row = $('.cart-item[data-line="' + id + '"]', $("#cartItems"));
    if (row) {
      const val = $(".qty__val", row); if (val) val.textContent = line.qty;
      const tot = $(".cart-item__total", row); if (tot) tot.textContent = rupee(p.price * line.qty);
    } else {
      updateCartUI(); return;
    }
    updateCartSummary();
  }
  function removeFromCart(id) {
    cart = cart.filter((i) => i.id !== id);
    saveCart(); updateCartUI();
  }

  const cartCountEl = $("#cartCount");
  const cartBtnEl = $("#cartBtn");
  const buyBar = $("#buyBar");
  function bumpCount() {
    cartCountEl.classList.remove("pop");
    void cartCountEl.offsetWidth;
    cartCountEl.classList.add("pop");
  }

  const FREE_SHIP_THRESHOLD = 599;

  // Updates count badge, button label, summary totals and the free-shipping nudge.
  function updateCartSummary() {
    const count = cartCount();
    cartCountEl.textContent = count;
    if (cartBtnEl) cartBtnEl.setAttribute("aria-label", "Open cart, " + count + " item" + (count === 1 ? "" : "s"));
    if (buyBar) buyBar.classList.toggle("has-items", count > 0);

    const subtotal = cart.reduce((s, l) => { const p = getProduct(l.id); return p ? s + p.price * l.qty : s; }, 0);
    const mrpTotal = cart.reduce((s, l) => { const p = getProduct(l.id); return p ? s + p.mrp * l.qty : s; }, 0);
    const saved = mrpTotal - subtotal;
    $("#cartSubtotal").textContent = rupee(subtotal);
    $("#cartSaved").textContent = rupee(saved);
    $("#cartTotal").textContent = rupee(subtotal);
    $("#cartSaveRow").style.display = saved > 0 ? "flex" : "none";

    // Free-shipping progress nudge
    const nudge = $("#shipNudge"), nText = $("#shipNudgeText"), nFill = $("#shipNudgeFill");
    if (nudge && nText && nFill) {
      const remaining = FREE_SHIP_THRESHOLD - subtotal;
      const pctFill = Math.max(0, Math.min(100, Math.round((subtotal / FREE_SHIP_THRESHOLD) * 100)));
      nFill.style.width = pctFill + "%";
      if (subtotal > 0 && remaining > 0) {
        nudge.classList.remove("ship-nudge--done");
        nText.innerHTML = ICON.truck + "<span>You're " + rupee(remaining) + " away from free shipping</span>";
      } else if (subtotal > 0) {
        nudge.classList.add("ship-nudge--done");
        nText.innerHTML = ICON.check + "<span>You've unlocked free shipping!</span>";
      } else {
        nText.innerHTML = ICON.truck + "<span>Free shipping over " + rupee(FREE_SHIP_THRESHOLD) + "</span>";
      }
    }
  }

  function updateCartUI() {
    const body = $("#cartItems");
    const foot = $("#cartFoot");

    if (!cart.length) {
      body.innerHTML = '<div class="cart__empty">' + ICON.lotus +
        '<p>Your basket is empty</p>' +
        '<a href="#products" data-close-cart>Shop the range</a></div>';
      foot.classList.add("is-empty");
      updateCartSummary();
      return;
    }
    foot.classList.remove("is-empty");

    body.innerHTML = cart.map((line) => {
      const p = getProduct(line.id);
      if (!p) return "";
      return '<div class="cart-item" data-line="' + p.id + '" style="--acc:' + p.acc + '">' +
        '<div class="cart-item__art">' + pouchSVG(p, { decorative: true }) + '</div>' +
        '<div>' +
          '<div class="cart-item__name">' + p.name.split(" (")[0] + '</div>' +
          '<div class="cart-item__price tnum">' + rupee(p.price) + ' each</div>' +
          '<div class="cart-item__controls">' +
            '<div class="qty">' +
              '<button data-qty="-1" data-id="' + p.id + '" aria-label="Decrease quantity">' + ICON.minus + '</button>' +
              '<span class="qty__val">' + line.qty + '</span>' +
              '<button data-qty="1" data-id="' + p.id + '" aria-label="Increase quantity">' + ICON.plus + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="cart-item__line">' +
          '<div class="cart-item__total tnum">' + rupee(p.price * line.qty) + '</div>' +
          '<button class="cart-item__remove" data-remove="' + p.id + '" aria-label="Remove ' + p.name + '">' + ICON.trash + 'Remove</button>' +
        '</div>' +
      '</div>';
    }).join("");

    updateCartSummary();
  }

  /* ---------- Cart drawer (focus trap) ---------- */
  const drawer = $("#cartDrawer");
  const scrim = $("#cartScrim");
  let lastFocus = null;
  let scrimTimer = null;

  // Page regions that must be made inert/hidden while a modal surface is open,
  // so screen-reader + Tab focus is actually contained behind the overlay.
  const bgRegions = [$("#header"), $("#main"), $(".footer"), $("#announce"), buyBar];
  function setBackgroundInert(on) {
    bgRegions.forEach((el) => {
      if (!el) return;
      if (on) { el.setAttribute("inert", ""); el.setAttribute("aria-hidden", "true"); }
      else { el.removeAttribute("inert"); el.removeAttribute("aria-hidden"); }
    });
  }

  function openCart() {
    lastFocus = document.activeElement;
    clearTimeout(scrimTimer);
    scrim.hidden = false;
    requestAnimationFrame(() => { scrim.classList.add("open"); drawer.classList.add("open"); });
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setBackgroundInert(true);
    $("#cartClose").focus();
    document.addEventListener("keydown", onCartKey);
  }
  function closeCart() {
    scrim.classList.remove("open");
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onCartKey);
    setBackgroundInert(false);
    clearTimeout(scrimTimer);
    scrimTimer = setTimeout(() => { scrim.hidden = true; }, 350);
    if (lastFocus) lastFocus.focus();
  }
  function onCartKey(e) {
    if (e.key === "Escape") { closeCart(); return; }
    if (e.key !== "Tab") return;
    const f = $$('button, a[href], input', drawer).filter((el) => !el.disabled && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Toasts ---------- */
  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.innerHTML = ICON.check + "<span>" + msg + "</span>";
    $("#toasts").appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }

  /* ---------- Confetti ---------- */
  function confettiBurst(x, y, acc) {
    if (reduceMotion) return;
    const colors = ["#fff", acc, "#F0AC1A", "#FBF3E0"];
    for (let i = 0; i < 12; i++) {
      const c = document.createElement("span");
      c.className = "confetti";
      c.style.left = x + "px"; c.style.top = y + "px";
      c.style.background = colors[i % colors.length];
      document.body.appendChild(c);
      const ang = Math.random() * Math.PI - Math.PI / 2;
      const dist = 40 + Math.random() * 60;
      const dx = Math.cos(ang) * dist, dy = -Math.abs(Math.sin(ang) * dist) - 20;
      c.animate([
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: "translate(" + dx + "px," + (dy + 80) + "px) scale(.4)", opacity: 0 }
      ], { duration: 700 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = () => c.remove();
    }
  }

  /* ---------- Reveal observer ---------- */
  let io;
  function observeReveals(scope) {
    if (reduceMotion) { $$(".reveal", scope).forEach((el) => el.classList.add("in")); return; }
    if (!io) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            const el = e.target;
            setTimeout(() => el.classList.add("in"), (Number(el.dataset.stagger) || 0) * 70);
            io.unobserve(el);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    }
    $$(".reveal:not(.in)", scope || document).forEach((el, i) => {
      if (!el.dataset.stagger) {
        const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
        el.dataset.stagger = sibs.indexOf(el);
      }
      io.observe(el);
    });
  }

  /* ---------- Events ---------- */
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) {
      const id = add.dataset.add;
      addToCart(id);
      const label = $(".add-btn__label", add);
      if (label && !add.classList.contains("added")) {
        const prev = label.textContent;
        add.classList.add("added");
        label.textContent = "Added ✓";
        const r = add.getBoundingClientRect();
        confettiBurst(r.left + r.width / 2, r.top, getProduct(id).acc);
        setTimeout(() => { add.classList.remove("added"); label.textContent = prev; }, 900);
      }
      return;
    }
    const qty = e.target.closest("[data-qty]");
    if (qty) { changeQty(qty.dataset.id, Number(qty.dataset.qty)); return; }
    const rm = e.target.closest("[data-remove]");
    if (rm) { removeFromCart(rm.dataset.remove); return; }
    if (e.target.closest("[data-close-cart]")) { closeCart(); return; }
  });

  $("#cartBtn").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  scrim.addEventListener("click", closeCart);

  $("#checkoutBtn").addEventListener("click", () => {
    if (!cart.length) { toast("Your basket is empty"); return; }
    closeCart();
    Checkout.open({
      items: cart,
      getProduct: getProduct,
      rupee: rupee,
      freeShip: FREE_SHIP_THRESHOLD,
      onPlaced: () => { cart = []; saveCart(); updateCartUI(); bumpCount(); toast("Order placed - thank you!"); }
    });
  });

  /* filter */
  $$(".filter__pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      $$(".filter__pill").forEach((p) => { p.classList.remove("is-active"); p.setAttribute("aria-pressed", "false"); });
      pill.classList.add("is-active"); pill.setAttribute("aria-pressed", "true");
      renderProducts(pill.dataset.filter);
    });
  });

  /* newsletter */
  $("#newsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#newsEmail");
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    if (!ok) { input.classList.add("invalid"); input.focus(); toast("Please enter a valid email"); return; }
    input.classList.remove("invalid");
    input.value = "";
    toast("You're in - check your inbox.");
  });
  $("#newsEmail").addEventListener("input", () => $("#newsEmail").classList.remove("invalid"));

  /* announcement */
  $("#announceClose").addEventListener("click", () => {
    $("#announce").classList.add("is-hidden");
    try { sessionStorage.setItem("makhana_announce", "1"); } catch (e) {}
  });
  try { if (sessionStorage.getItem("makhana_announce")) $("#announce").classList.add("is-hidden"); } catch (e) {}

  /* header scroll + sticky mobile buy bar */
  const header = $("#header");
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 40);
    if (buyBar) {
      // Reveal once past the hero; CSS (display:flex only <=900px) keeps it mobile-only.
      const show = y > window.innerHeight * 0.7;
      buyBar.classList.toggle("show", show);
      document.body.classList.toggle("has-buybar", show);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* hamburger */
  const mobileNav = $("#mobileNav"), hamburger = $("#hamburger");
  let menuLastFocus = null;
  function onMenuKey(e) {
    if (e.key === "Escape") { closeMenu(); return; }
    if (e.key !== "Tab") return;
    const f = $$('button, a[href]', mobileNav).filter((el) => !el.disabled && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openMenu() {
    menuLastFocus = document.activeElement;
    mobileNav.classList.add("open");
    mobileNav.setAttribute("aria-hidden", "false");
    hamburger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    $("#mobileNavClose").focus();
    document.addEventListener("keydown", onMenuKey);
  }
  function closeMenu() {
    mobileNav.classList.remove("open");
    mobileNav.setAttribute("aria-hidden", "true");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onMenuKey);
    if (menuLastFocus) menuLastFocus.focus(); else hamburger.focus();
  }
  hamburger.addEventListener("click", openMenu);
  $("#mobileNavClose").addEventListener("click", closeMenu);
  $$(".mobile-nav__links a").forEach((a) => a.addEventListener("click", closeMenu));

  /* hero pouch */
  /* ---------- Hero slider ---------- */
  (function heroSlider() {
    const el = $("#heroPouch");
    if (!el) return;
    const imgs = ["images/hero-trio.jpg", "images/hero-box.jpg"];
    const alts = ["Three roasted makhana pouches - peri peri, himalayan salt, pudina", "The Makhana seven-flavour foxnut gift box"];
    const captions = ["The lineup · 3 signature roasts", "The gift box · 7 flavours"];
    el.innerHTML =
      '<div class="hero__slider"><div class="hero__track">' +
      imgs.map((s, i) => '<img class="hero__slide' + (i === 0 ? " is-active" : "") + '" src="' + s + '" alt="' + alts[i] + '" loading="' + (i === 0 ? "eager" : "lazy") + '" />').join("") +
      '<span class="hero__caption" aria-hidden="true">' + captions[0] + '</span><span class="hero__progress run" aria-hidden="true"></span>' +
      '</div><div class="hero__dots">' +
      imgs.map((s, i) => '<button class="hero__dot' + (i === 0 ? " is-active" : "") + '" data-i="' + i + '" aria-label="Show slide ' + (i + 1) + '"></button>').join("") +
      "</div></div>";
    const slides = el.querySelectorAll(".hero__slide");
    const dots = el.querySelectorAll(".hero__dot");
    const caption = el.querySelector(".hero__caption");
    const bar = el.querySelector(".hero__progress");
    let idx = 0, timer = null;
    function go(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach((sl, i) => sl.classList.toggle("is-active", i === idx));
      dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
      if (caption) caption.textContent = captions[idx];
      if (bar && !reduceMotion) { bar.classList.remove("run"); void bar.offsetWidth; bar.classList.add("run"); }
    }
    function start() { timer = setInterval(() => go(idx + 1), 4000); }
    function stop() { clearInterval(timer); }
    el.addEventListener("click", (e) => { const d = e.target.closest(".hero__dot"); if (d) { stop(); go(+d.dataset.i); start(); return; } if (e.target.closest(".hero__arrow--prev")) { stop(); go(idx - 1); start(); } else if (e.target.closest(".hero__arrow--next")) { stop(); go(idx + 1); start(); } });
    el.addEventListener("mouseenter", stop);
    el.addEventListener("mouseleave", start);
    start();
  })();

  /* ---------- Init ---------- */
  renderProducts("all");
  renderFlavours();
  renderReviews();
  updateCartUI();
  observeReveals(document);
})();
