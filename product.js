/* ===================================================================
   THE MAKHANA - product detail page behaviour (uses window.TM)
   =================================================================== */
(function () {
  "use strict";
  const TM = window.TM;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const { rupee, pct, ICON, stars, pouchSVG, bowlSVG, escapeXML } = TM;

  /* ---------- resolve product ---------- */
  const params = new URLSearchParams(location.search);
  let _pid = params.get("id");
  if (!_pid) { var _seg = location.pathname.replace(/\/+$/, "").split("/").pop(); if (_seg && _seg !== "product.html" && _seg !== "products") _pid = _seg.replace(/\.html$/, ""); }
  let p = TM.getProduct(_pid);
  if (!p) p = TM.PRODUCTS[0];

  const shortName = p.name.split(" (")[0];
  document.title = "The Makhana - " + shortName;
  const metaDesc = shortName + " - " + p.tagline + " Premium roasted & raw makhana from Madhubani, Bihar.";
  const md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute("content", metaDesc);

  /* ---------- per-product SEO (canonical, OG, Twitter, robots, JSON-LD) ---------- */
  (function seo() {
    const head = document.head;
    const SITE = "https://www.themakhana.in/";
    const canonical = SITE + "products/" + p.id;
    const ogImage = SITE + "images/logo.png"; // placeholder OG/social image
    const catName = p.category === "combo" ? "Combos" : (p.category === "raw" ? "Raw" : "Roasted");

    // upsert a <meta>/<link> tag keyed by an attribute, creating it if absent
    function upsert(tag, keyAttr, keyVal, valAttr, val) {
      let el = head.querySelector(tag + "[" + keyAttr + '="' + keyVal + '"]');
      if (!el) {
        el = document.createElement(tag);
        el.setAttribute(keyAttr, keyVal);
        head.appendChild(el);
      }
      el.setAttribute(valAttr, val);
      return el;
    }
    const meta = (name, content) => upsert("meta", "name", name, "content", content);
    const prop = (property, content) => upsert("meta", "property", property, "content", content);
    function link(rel, href) {
      let el = head.querySelector('link[rel="' + rel + '"]');
      if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); head.appendChild(el); }
      el.setAttribute("href", href);
      return el;
    }

    link("canonical", canonical);
    meta("robots", "index,follow");
    meta("theme-color", "#F5C518");

    // Open Graph
    prop("og:type", "product");
    prop("og:title", shortName + " - The Makhana");
    prop("og:description", metaDesc);
    prop("og:url", canonical);
    prop("og:site_name", "The Makhana");
    prop("og:image", ogImage);
    prop("product:price:amount", String(p.price));
    prop("product:price:currency", "INR");

    // Twitter
    meta("twitter:card", "summary_large_image");
    meta("twitter:title", shortName + " - The Makhana");
    meta("twitter:description", metaDesc);
    meta("twitter:image", ogImage);

    // JSON-LD: Product + BreadcrumbList + FAQPage
    const longDesc = (p.long && p.long.length ? p.long.join(" ") : p.tagline);
    const productLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: shortName,
      description: longDesc,
      brand: { "@type": "Brand", name: "The Makhana" },
      sku: p.id,
      category: catName,
      image: ogImage,
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: p.price,
        availability: "https://schema.org/InStock",
        url: canonical
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: p.rating,
        reviewCount: p.reviews
      }
    };
    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Shop", item: SITE + "shop" },
        { "@type": "ListItem", position: 3, name: catName, item: SITE + "shop" },
        { "@type": "ListItem", position: 4, name: shortName, item: canonical }
      ]
    };
    const faqList = (TM.faqs(p) || []);
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqList.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a }
      }))
    };
    [productLd, breadcrumbLd, faqLd].forEach((data) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.textContent = JSON.stringify(data);
      head.appendChild(s);
    });
  })();

  /* ---------- breadcrumb ---------- */
  const catName = p.category === "combo" ? "Combos" : (p.category === "raw" ? "Raw" : "Roasted");
  $("#crumb").innerHTML =
    '<a href="/">Home</a><span class="sep">/</span>' +
    '<a href="/shop">Shop</a><span class="sep">/</span>' +
    '<a href="/shop">' + catName + '</a><span class="sep">/</span><b>' + shortName + '</b>';

  /* ---------- gallery ---------- */
  const stage = $("#galleryStage"), thumbs = $("#galleryThumbs");
  const views = (p.images && p.images.length)
    ? p.images.map((src, i) => ({
        label: "View " + (i + 1),
        html: '<img src="' + src + '" alt="' + escapeXML(p.name) + ' pack" loading="' + (i === 0 ? "eager" : "lazy") + '" />',
        rot: 0
      }))
    : [
        { label: "Pack", html: pouchSVG(p), rot: 0 },
        { label: "In the bowl", html: bowlSVG(p), rot: 0 },
        { label: "Angle", html: pouchSVG(p), rot: -7 }
      ];
  const ribbonBadge = p.ribbon ? '<span class="gallery__badge">' + p.ribbon + '</span>' : "";
  function showView(i) {
    stage.innerHTML = ribbonBadge + views[i].html;
    const g = stage.querySelector("svg, img");
    if (g && views[i].rot) g.style.transform = "rotate(" + views[i].rot + "deg)";
    $$(".thumb", thumbs).forEach((t, j) => t.classList.toggle("active", j === i));
  }
  thumbs.innerHTML = views.map((v, i) =>
    '<button class="thumb" aria-label="View ' + v.label + '" data-view="' + i + '">' + v.html + '</button>'
  ).join("");
  thumbs.addEventListener("click", (e) => { const t = e.target.closest("[data-view]"); if (t) showView(+t.dataset.view); });
  showView(0);

  /* ---------- info column ---------- */
  const variants = TM.variants(p);
  const hlIcon = (label) => {
    const l = label.toLowerCase();
    if (l.indexOf("protein") > -1) return ICON.protein;
    if (l.indexOf("gluten") > -1 || l.indexOf("natural") > -1 || l.indexOf("palm") > -1) return ICON.leaf;
    if (l.indexOf("preservative") > -1) return ICON.shield;
    if (l.indexOf("gift") > -1) return ICON.bag;
    if (l.indexOf("fried") > -1) return ICON.feather;
    return ICON.spark;
  };

  $("#pdpInfo").innerHTML =
    '<p class="pdp__cat">' + (p.category === "combo" ? "VARIETY COMBO" : p.category.toUpperCase() + " MAKHANA") + '</p>' +
    '<h1 class="pdp__title">' + shortName + '</h1>' +
    '<div class="pdp__rate"><span class="stars" aria-hidden="true">' + stars() + '</span>' +
      '<span>' + p.rating.toFixed(1) + '</span><span>&middot;</span><a href="#faqSec">' + p.reviews + ' reviews</a>' +
      '<span>&middot;</span><span>' + p.taste + '</span></div>' +
    '<p class="pdp__tag">' + p.tagline + '</p>' +
    '<div class="pdp__price"><span class="pdp__now" id="pNow"></span><span class="pdp__mrp" id="pMrp"></span><span class="pdp__off">' + pct(p) + '% OFF</span></div>' +
    '<p class="pdp__tax">Inclusive of all taxes</p>' +
    '<div class="opt-group"><div class="opt-label">Select pack <span id="pSub"></span></div>' +
      '<div class="variants" id="variants">' +
        variants.map((v, i) =>
          '<button class="variant" data-v="' + i + '">' + (v.tag ? '<span class="variant__tag">' + v.tag + '</span>' : "") +
            '<span class="variant__l">' + v.label + '</span><br><span class="variant__s">' + v.sub + '</span></button>'
        ).join("") +
      '</div></div>' +
    '<div class="buy-row">' +
      '<div class="qstep" role="group" aria-label="Quantity">' +
        '<button id="qMinus" aria-label="Decrease quantity">' + ICON.minus + '</button>' +
        '<span class="qstep__v" id="qVal">1</span>' +
        '<button id="qPlus" aria-label="Increase quantity">' + ICON.plus + '</button>' +
      '</div>' +
      '<button class="btn btn--primary pdp__add" id="addBtn">' + ICON.bag + '<span>Add to cart</span></button>' +
    '</div>' +
    '<button class="pdp__buy" id="buyBtn">Buy it now</button>' +
    '<div class="hl-row">' +
      TM.highlights(p).map((h) => '<div class="hl">' + hlIcon(h) + '<span>' + h + '</span></div>').join("") +
    '</div>' +
    '<div class="assure-mini">' +
      '<div>' + ICON.truck + 'Free shipping over ₹599</div>' +
      '<div>' + ICON.return + '7-day easy returns</div>' +
      '<div>' + ICON.bag + 'Cash on delivery</div>' +
      '<div>' + ICON.lock + 'Secure checkout</div>' +
    '</div>';

  /* selection state */
  let sel = 0, qty = 1;
  function packQty() { return variants[sel].qty; }
  function units() { return packQty() * qty; }
  function refreshPrice() {
    const u = units();
    $("#pNow").textContent = rupee(p.price * u);
    $("#pMrp").textContent = rupee(p.mrp * u);
    $("#pSub").textContent = "· " + units() + " pack" + (units() === 1 ? "" : "s") + " (" + (parseInt(p.weight, 10) * units()) + (p.weight.replace(/[0-9]/g, "")) + ")";
    $$(".variant", $("#variants")).forEach((b, i) => b.classList.toggle("active", i === sel));
  }
  $("#variants").addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (b) { sel = +b.dataset.v; refreshPrice(); } });
  $("#qMinus").addEventListener("click", () => { qty = Math.max(1, qty - 1); $("#qVal").textContent = qty; refreshPrice(); });
  $("#qPlus").addEventListener("click", () => { qty = Math.min(20, qty + 1); $("#qVal").textContent = qty; refreshPrice(); });
  refreshPrice();

  $("#addBtn").addEventListener("click", () => { TM.addToCart(p.id, units()); updateCartUI(); bumpCount(); toast("Added to basket"); openCart(); });
  $("#buyBtn").addEventListener("click", () => { TM.addToCart(p.id, units()); updateCartUI(); bumpCount(); openCart(); });

  /* ---------- Description + benefits ---------- */
  $("#descSec").innerHTML =
    '<p class="kicker">About this pack</p>' +
    '<h2>The story in every <em>crunch</em></h2>' +
    '<div class="prose">' + p.long.map((para) => "<p>" + para + "</p>").join("") + '</div>' +
    '<div class="ben-grid">' +
      TM.benefits().map((b) =>
        '<div class="ben"><div class="ben__ic">' + TM.benefitIcon[b.ic] + '</div><h3>' + b.title + '</h3><p>' + b.text + '</p></div>'
      ).join("") +
    '</div>';

  /* ---------- Makhana vs Popcorn ---------- */
  $("#vsSec").innerHTML =
    '<div class="vs-card">' +
      '<h2>Makhana vs <em>Popcorn</em></h2>' +
      '<p class="sub">A healthier crunch, every single time.</p>' +
      '<div class="vs-scroll">' +
      '<div class="vs-table">' +
        '<div class="h lab">Per 100g</div><div class="h mk">The Makhana</div><div class="h other">Popcorn</div>' +
        '<div class="lab">Protein</div><div class="mk">11.8 g</div><div class="other">11 g</div>' +
        '<div class="lab">Total fat</div><div class="mk">6.4 g</div><div class="other">~44 g (buttered)</div>' +
        '<div class="lab">Fibre</div><div class="mk">8.9 g</div><div class="other">7 g</div>' +
        '<div class="lab">Deep-fried?</div><div class="mk">Never</div><div class="other">Often</div>' +
        '<div class="lab">Gluten-free</div><div class="mk">Yes</div><div class="other">Yes</div>' +
      '</div>' +
      '</div>' +
    '</div>';

  /* ---------- Nutrition + ingredients + info ---------- */
  const nut = TM.nutrition(p), inf = TM.info(p);
  $("#factsSec").innerHTML =
    '<p class="kicker">The good stuff</p><h2>Nutrition &amp; <em>ingredients</em></h2>' +
    '<div class="facts">' +
      '<div class="fact-card"><h3>Nutrition (per 100g)</h3>' +
        '<table class="ntable"><thead><tr><th>Nutrient</th><th style="text-align:right">Amount</th></tr></thead><tbody>' +
        nut.map((n) => '<tr><td class="' + (n.k.indexOf("which") > -1 ? "serv" : "") + '">' + n.k + '</td><td>' + n.v + '</td></tr>').join("") +
        '</tbody></table></div>' +
      '<div class="fact-card"><h3>Ingredients</h3><p class="ingredients">' + p.ingredients + '</p>' +
        '<h3 style="margin-top:22px">Product information</h3>' +
        '<table class="info-table"><tbody>' +
          inf.map((r) => '<tr><td>' + r.k + '</td><td>' + r.v + '</td></tr>').join("") +
        '</tbody></table></div>' +
    '</div>';

  /* ---------- How to enjoy ---------- */
  $("#howtoSec").innerHTML =
    '<p class="kicker">Serving ideas</p><h2>How to <em>enjoy</em> it</h2>' +
    '<div class="howto-grid">' +
      TM.howto().map((h, i) => '<div class="howto"><div class="howto__n">0' + (i + 1) + '</div><h3>' + h.t + '</h3><p>' + h.d + '</p></div>').join("") +
    '</div>';

  /* ---------- FAQ ---------- */
  const faqs = TM.faqs(p);
  $("#faqSec").innerHTML =
    '<p class="kicker">Good to know</p><h2>Frequently <em>asked</em></h2>' +
    '<div class="faqs">' +
      faqs.map((f) =>
        '<div class="faq"><button class="faq__q" aria-expanded="false">' + f.q + '<span class="ic" aria-hidden="true"></span></button>' +
        '<div class="faq__a"><p>' + f.a + '</p></div></div>'
      ).join("") +
    '</div>';
  $("#faqSec").addEventListener("click", (e) => {
    const q = e.target.closest(".faq__q"); if (!q) return;
    const faq = q.parentElement, a = $(".faq__a", faq), open = faq.classList.toggle("open");
    q.setAttribute("aria-expanded", open ? "true" : "false");
    a.style.maxHeight = open ? a.scrollHeight + "px" : "0";
  });

  /* ---------- Related ---------- */
  const related = TM.PRODUCTS.filter((x) => x.id !== p.id).slice(0, 4);
  $("#relatedSec").innerHTML =
    '<p class="kicker">More crunch</p><h2>You may also <em>like</em></h2>' +
    '<div class="rel-grid">' +
      related.map((r) =>
        '<a class="rel" href="/products/' + r.id + '" style="--acc:' + r.acc + '">' +
          '<div class="rel__art">' + pouchSVG(r) + '</div>' +
          '<h3>' + r.name.split(" (")[0] + '</h3>' +
          '<div class="rel__p">' + rupee(r.price) + '<small>' + rupee(r.mrp) + '</small></div>' +
        '</a>'
      ).join("") +
    '</div>';

  /* =================== CART DRAWER =================== */
  const cartCountEl = $("#cartCount");
  const FREE = 599;
  function bumpCount() { cartCountEl.classList.remove("pop"); void cartCountEl.offsetWidth; cartCountEl.classList.add("pop"); }

  function updateSummary() {
    const cart = TM.getCart();
    const count = cart.reduce((s, i) => s + i.qty, 0);
    cartCountEl.textContent = count;
    const sub = cart.reduce((s, l) => { const x = TM.getProduct(l.id); return x ? s + x.price * l.qty : s; }, 0);
    const mrp = cart.reduce((s, l) => { const x = TM.getProduct(l.id); return x ? s + x.mrp * l.qty : s; }, 0);
    $("#cartSubtotal").textContent = rupee(sub);
    $("#cartSaved").textContent = rupee(mrp - sub);
    $("#cartTotal").textContent = rupee(sub);
    $("#cartSaveRow").style.display = (mrp - sub) > 0 ? "flex" : "none";
    const nText = $("#shipNudgeText"), nFill = $("#shipNudgeFill");
    const remaining = FREE - sub, fill = Math.max(0, Math.min(100, Math.round(sub / FREE * 100)));
    nFill.style.width = fill + "%";
    if (sub > 0 && remaining > 0) { $("#shipNudge").classList.remove("ship-nudge--done"); nText.innerHTML = ICON.truck + "<span>You're " + rupee(remaining) + " away from free shipping</span>"; }
    else if (sub > 0) { $("#shipNudge").classList.add("ship-nudge--done"); nText.innerHTML = ICON.check + "<span>You've unlocked free shipping!</span>"; }
    else nText.innerHTML = ICON.truck + "<span>Free shipping over " + rupee(FREE) + "</span>";
  }

  function updateCartUI() {
    const cart = TM.getCart(), body = $("#cartItems"), foot = $("#cartFoot");
    if (!cart.length) {
      body.innerHTML = '<div class="cart__empty">' + ICON.lotus + '<p>Your basket is empty</p><a href="/shop">Shop the range</a></div>';
      foot.classList.add("is-empty"); updateSummary(); return;
    }
    foot.classList.remove("is-empty");
    body.innerHTML = cart.map((line) => {
      const x = TM.getProduct(line.id); if (!x) return "";
      return '<div class="cart-item" data-line="' + x.id + '" style="--acc:' + x.acc + '">' +
        '<div class="cart-item__art">' + pouchSVG(x, { decorative: true }) + '</div>' +
        '<div><div class="cart-item__name">' + x.name.split(" (")[0] + '</div>' +
        '<div class="cart-item__price tnum">' + rupee(x.price) + ' each</div>' +
        '<div class="cart-item__controls"><div class="qty">' +
          '<button data-qty="-1" data-id="' + x.id + '" aria-label="Decrease quantity">' + ICON.minus + '</button>' +
          '<span class="qty__val">' + line.qty + '</span>' +
          '<button data-qty="1" data-id="' + x.id + '" aria-label="Increase quantity">' + ICON.plus + '</button>' +
        '</div></div></div>' +
        '<div class="cart-item__line"><div class="cart-item__total tnum">' + rupee(x.price * line.qty) + '</div>' +
        '<button class="cart-item__remove" data-remove="' + x.id + '" aria-label="Remove">' + ICON.trash + 'Remove</button></div>' +
      '</div>';
    }).join("");
    updateSummary();
  }

  function setQty(id, delta) {
    const cart = TM.getCart(), line = cart.find((i) => i.id === id); if (!line) return;
    line.qty += delta;
    let next = line.qty <= 0 ? cart.filter((i) => i.id !== id) : cart;
    TM.setCart(next); updateCartUI();
  }
  function removeItem(id) { TM.setCart(TM.getCart().filter((i) => i.id !== id)); updateCartUI(); }

  const drawer = $("#cartDrawer"), scrim = $("#cartScrim");
  let lastFocus = null, scrimTimer = null;
  function openCart() {
    lastFocus = document.activeElement; clearTimeout(scrimTimer); scrim.hidden = false;
    requestAnimationFrame(() => { scrim.classList.add("open"); drawer.classList.add("open"); });
    drawer.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
    $("#cartClose").focus(); document.addEventListener("keydown", onKey);
  }
  function closeCart() {
    scrim.classList.remove("open"); drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = ""; document.removeEventListener("keydown", onKey);
    clearTimeout(scrimTimer); scrimTimer = setTimeout(() => { scrim.hidden = true; }, 350);
    if (lastFocus) lastFocus.focus();
  }
  function onKey(e) { if (e.key === "Escape") closeCart(); }

  $("#cartBtn").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  scrim.addEventListener("click", closeCart);
  $("#checkoutBtn").addEventListener("click", () => {
    if (!TM.getCart().length) { toast("Your basket is empty"); return; }
    closeCart();
    Checkout.open({
      items: TM.getCart(),
      getProduct: TM.getProduct,
      rupee: TM.rupee,
      freeShip: 599,
      onPlaced: () => { TM.setCart([]); updateCartUI(); bumpCount(); toast("Order placed - thank you!"); }
    });
  });
  document.addEventListener("click", (e) => {
    const q = e.target.closest("[data-qty]"); if (q) { setQty(q.dataset.id, +q.dataset.qty); return; }
    const rm = e.target.closest("[data-remove]"); if (rm) { removeItem(rm.dataset.remove); return; }
  });

  /* ---------- Toast ---------- */
  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast"; el.setAttribute("role", "status");
    el.innerHTML = ICON.check + "<span>" + msg + "</span>";
    $("#toasts").appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, 2600);
  }

  /* ---------- header scroll ---------- */
  const header = $("#header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- init ---------- */
  updateCartUI();
  window.scrollTo(0, 0);
})();
