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
  function pouchSVG(p, opts) {
    opts = opts || {};
    // Memoise the (heavy) labelled pouch markup per product id.
    if (!opts.decorative && _pouchCache[p.id]) return _pouchCache[p.id];
    const id = p.id;
    const acc = p.acc;
    const flav = p.name.split(" (")[0].toUpperCase();
    const ribbonName = flav.length > 16 ? p.id.toUpperCase() : flav;
    // Decorative variant (cart line items) is hidden from SR: the row text already names the product.
    const a11y = opts.decorative
      ? 'role="presentation" aria-hidden="true"'
      : 'role="img" aria-label="' + escapeXML(p.name + " makhana pouch") + '"';

    // makhana puffs - irregular off-round foxnut blobs with a crease/dimple + rim highlight
    const puffs = [
      [98, 252, 14, -8], [128, 246, 16, 5], [156, 256, 13, 12],
      [112, 270, 12, 18], [142, 268, 11, -10]
    ].map((m, i) => {
      const [cx, cy, r, rot] = m;
      const rx = r, ry = r * 0.86; // slightly oblong, like a popped foxnut
      const speck = p.category === "roasted" ?
        '<circle cx="' + (cx + r * .25) + '" cy="' + (cy - r * .15) + '" r="1.1" fill="' + acc + '" opacity=".5"/>' : '';
      // body, soft inner shade, two short crease arcs (the foxnut split), tiny rim highlight
      return '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#FBF3E0"/>' +
        '<ellipse cx="' + cx + '" cy="' + (cy + ry * .22) + '" rx="' + (rx * .82) + '" ry="' + (ry * .62) + '" fill="#EBDCB6" opacity=".55"/>' +
        '<path d="M' + (cx - rx * .55) + ' ' + (cy - ry * .12) + 'q' + (rx * .55) + ' ' + (ry * .34) + ' ' + (rx * 1.1) + ' 0" fill="none" stroke="#CBB488" stroke-width="1.3" stroke-linecap="round"/>' +
        '<path d="M' + (cx - rx * .32) + ' ' + (cy + ry * .3) + 'q' + (rx * .32) + ' ' + (ry * .26) + ' ' + (rx * .64) + ' 0" fill="none" stroke="#CBB488" stroke-width="1" stroke-linecap="round" opacity=".7"/>' +
        '<ellipse cx="' + (cx - rx * .32) + '" cy="' + (cy - ry * .4) + '" rx="' + (rx * .3) + '" ry="' + (ry * .2) + '" fill="#fff" opacity=".7"/>' +
        speck + '</g>';
    }).join("");

    const svg = '' +
'<svg viewBox="0 0 260 340" ' + a11y + ' xmlns="http://www.w3.org/2000/svg">' +
  '<defs>' +
    '<linearGradient id="body-' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + acc + '"/>' +
      '<stop offset="1" stop-color="' + shade(acc, -14) + '"/>' +
    '</linearGradient>' +
    '<linearGradient id="hl-' + id + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#fff" stop-opacity=".2"/>' +
      '<stop offset="0.18" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset="0.82" stop-color="#000" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity=".12"/>' +
    '</linearGradient>' +
    // horizontal barrel shading → fakes the cylindrical stand-up pouch
    '<linearGradient id="barrel-' + id + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#000" stop-opacity=".22"/>' +
      '<stop offset="0.08" stop-color="#000" stop-opacity=".10"/>' +
      '<stop offset="0.38" stop-color="#fff" stop-opacity=".16"/>' +
      '<stop offset="0.62" stop-color="#fff" stop-opacity=".04"/>' +
      '<stop offset="0.92" stop-color="#000" stop-opacity=".12"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity=".24"/>' +
    '</linearGradient>' +
    '<clipPath id="win-' + id + '"><rect x="78" y="232" width="104" height="58" rx="14"/></clipPath>' +
    '<clipPath id="bodyClip-' + id + '"><path d="M48 70 Q48 50 70 48 L190 48 Q212 50 212 70 L214 296 Q214 312 198 314 L62 314 Q46 312 46 296 Z"/></clipPath>' +
  '</defs>' +
  // ground shadow
  '<ellipse cx="132" cy="322" rx="78" ry="12" fill="rgba(40,28,8,.22)" filter="url(#pouchShadow)"/>' +
  // body silhouette (stand-up doypack)
  '<path d="M48 70 Q48 50 70 48 L190 48 Q212 50 212 70 L214 296 Q214 312 198 314 L62 314 Q46 312 46 296 Z" fill="url(#body-' + id + ')"/>' +
  // cylindrical barrel shading (dark edges, light core)
  '<g clip-path="url(#bodyClip-' + id + ')">' +
    '<rect x="44" y="46" width="174" height="270" fill="url(#barrel-' + id + ')"/>' +
    // bottom gusset fold shadow
    '<ellipse cx="130" cy="312" rx="92" ry="20" fill="#000" opacity=".14"/>' +
    '<path d="M52 300 Q130 290 208 300" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="6"/>' +
  '</g>' +
  // edge modelling
  '<path d="M48 70 Q48 50 70 48 L190 48 Q212 50 212 70 L214 296 Q214 312 198 314 L62 314 Q46 312 46 296 Z" fill="url(#hl-' + id + ')"/>' +
  // center gusset crease
  '<path d="M130 52 L130 312" stroke="#fff" stroke-opacity=".07" stroke-width="6"/>' +
  // top crimp (serrated seal)
  serrate(54, 46, 152, acc) +
  // hang hole
  '<circle cx="130" cy="40" r="5" fill="none" stroke="' + shade(acc, -22) + '" stroke-width="2.5"/>' +
  // gloss highlight (primary diagonal sheen)
  '<ellipse cx="90" cy="108" rx="40" ry="78" fill="#fff" opacity=".18" transform="rotate(-18 90 108)" clip-path="url(#bodyClip-' + id + ')"/>' +
  // secondary thin specular streak
  '<rect x="70" y="58" width="9" height="248" rx="4.5" fill="#fff" opacity=".12" transform="rotate(-7 74 180)" clip-path="url(#bodyClip-' + id + ')"/>' +
  // brand label band
  '<rect x="60" y="92" width="140" height="120" rx="12" fill="#FFFDF7"/>' +
  // lotus glyph
  '<g transform="translate(130 118)" fill="none" stroke="' + acc + '" stroke-width="2" stroke-linecap="round">' +
    '<path d="M0 -10c3 4 4.5 8 4.5 11a4.5 4.5 0 0 1-9 0c0-3 1.5-7 4.5-11z"/>' +
    '<path d="M-11 6c4 0 7 1.5 9 4M11 6c-4 0-7 1.5-9 4"/>' +
  '</g>' +
  // wordmark
  '<text x="130" y="150" text-anchor="middle" font-family="\'Inter\',sans-serif" font-weight="800" font-size="15" letter-spacing="1.5" fill="#211A0E">THE MAKHANA</text>' +
  // flavour ribbon
  '<path d="M44 168 L216 168 L208 184 L216 200 L44 200 L52 184 Z" fill="' + shade(acc, -16) + '"/>' +
  '<text x="130" y="189" text-anchor="middle" font-family="\'Inter\',sans-serif" font-weight="700" font-size="13" letter-spacing="1" fill="#fff">' + escapeXML(ribbonName) + '</text>' +
  // flavour cue icon
  '<g transform="translate(130 224)" fill="none" stroke="' + acc + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + cueIcon(p.cat) + '</g>' +
  // die-cut window
  '<rect x="78" y="232" width="104" height="58" rx="14" fill="#241B0C" opacity=".14"/>' +
  '<g clip-path="url(#win-' + id + ')"><rect x="78" y="232" width="104" height="58" fill="#2A2114"/>' + puffs + '</g>' +
  '<rect x="78" y="232" width="104" height="58" rx="14" fill="none" stroke="' + shade(acc, -22) + '" stroke-width="2"/>' +
  // net weight chip + tag
  '<rect x="62" y="298" width="40" height="16" rx="8" fill="#FFFDF7"/>' +
  '<text x="82" y="310" text-anchor="middle" font-family="\'Inter\',sans-serif" font-weight="700" font-size="9.5" fill="#211A0E">' + p.weight + '</text>' +
  '<text x="176" y="310" text-anchor="middle" font-family="\'Inter\',sans-serif" font-weight="700" font-size="8.5" letter-spacing="1" fill="#fff" opacity=".9">' + (p.category === "raw" ? "RAW" : "ROASTED") + '</text>' +
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
    const isFeature = p.ribbonType === "bestseller";
    const badge = isCombo ? "" : '<span class="disc-badge">-' + pct(p) + "%</span>";
    const sash = isCombo ? '<span class="card__sash">Best value</span>' : "";
    const meta = isCombo ? "5 packs &middot; gifting box" : (p.category === "raw" ? "Raw" : "Roasted");
    const pitch = isFeature
      ? '<p class="card__pitch">' + ICON.star + '<span>Our #1 seller - most loved this month</span></p>'
      : "";
    const cls = "card reveal" + (isCombo ? " card--combo" : "") + (isFeature ? " card--feature" : "");

    return '' +
      '<article class="' + cls + '" style="--acc:' + p.acc + '" data-cat="' + p.category + '">' +
        ribbon + badge + sash +
        '<a class="card__media" href="product.html?id=' + p.id + '" aria-label="View ' + p.name.split(" (")[0] + '"><div class="card__pouch"><span class="card__pop"></span>' + pouchSVG(p) + '</div></a>' +
        '<div class="card__body">' +
          '<p class="card__cat">' + (isCombo ? "VARIETY COMBO" : p.category.toUpperCase()) + '</p>' +
          '<h3 class="card__name"><a href="product.html?id=' + p.id + '">' + p.name.split(" (")[0] + '</a></h3>' +
          pitch +
          '<p class="card__note">' + p.note + '</p>' +
          '<span class="card__rule"></span>' +
          '<p class="card__meta tnum"><span>' + p.weight + '</span><span class="dot"></span><span>' + meta + '</span></p>' +
          '<div class="card__price">' +
            '<span class="card__now">' + rupee(p.price) + '</span>' +
            '<span class="card__mrp">' + rupee(p.mrp) + '</span>' +
            '<span class="card__save">Save ' + rupee(p.mrp - p.price) + '</span>' +
          '</div>' +
          '<div class="card__stars"><span class="stars" aria-hidden="true">' + stars(5) + '</span>' +
            '<span class="count">' + p.rating.toFixed(1) + ' (' + p.reviews + ')</span></div>' +
          '<a class="card__details" href="product.html?id=' + p.id + '">View details <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>' +
          '<button class="add-btn" data-add="' + p.id + '" aria-label="Add ' + p.name + ' to cart">' +
            ICON.bag + '<span class="add-btn__label">Add to cart</span></button>' +
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
      return '<a class="flavour-card reveal" href="product.html?id=' + p.id + '" style="--acc:' + p.acc + '" aria-label="Shop ' + nm + '">' +
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
    cart = []; saveCart(); updateCartUI(); bumpCount();
    closeCart();
    toast("Order placed (demo)");
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
    el.innerHTML =
      '<div class="hero__slider"><div class="hero__track">' +
      imgs.map((s, i) => '<img class="hero__slide' + (i === 0 ? " is-active" : "") + '" src="' + s + '" alt="The Makhana flavours" loading="' + (i === 0 ? "eager" : "lazy") + '" />').join("") +
      '</div><div class="hero__dots">' +
      imgs.map((s, i) => '<button class="hero__dot' + (i === 0 ? " is-active" : "") + '" data-i="' + i + '" aria-label="Show slide ' + (i + 1) + '"></button>').join("") +
      "</div></div>";
    const slides = el.querySelectorAll(".hero__slide");
    const dots = el.querySelectorAll(".hero__dot");
    let idx = 0, timer = null;
    function go(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach((sl, i) => sl.classList.toggle("is-active", i === idx));
      dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
    }
    function start() { if (!reduceMotion) timer = setInterval(() => go(idx + 1), 4000); }
    function stop() { clearInterval(timer); }
    el.addEventListener("click", (e) => { const d = e.target.closest(".hero__dot"); if (d) { stop(); go(+d.dataset.i); start(); } });
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
