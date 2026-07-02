/* ===================================================================
   THE MAKHANA - shared catalogue (data + SVG art + cart store)
   Exposes window.TM, used by the product detail pages (product.html).
   =================================================================== */
window.TM = (function () {
  "use strict";

  /* ---------- Base products (mirrors the homepage) ---------- */
  const PRODUCTS = [
    { id:"peri",    name:"Peri Peri Punch",        price:199, mrp:249, category:"roasted", acc:"#C0492F", weight:"80g",  note:"spicy, zingy, addictive",       ribbon:"BESTSELLER", ribbonType:"bestseller", rating:4.8, reviews:124, cat:"chilli", images:["/images/products/peri.jpg","/images/products/peri-2.jpg"] },
    { id:"pudina",  name:"Chatpata Pudina",        price:199, mrp:249, category:"roasted", acc:"#4F7A52", weight:"80g",  note:"tangy mint chaat hit",          ribbon:"NEW",        ribbonType:"new",        rating:4.7, reviews:98,  cat:"mint", images:["/images/products/pudina.jpg","/images/products/pudina-2.jpg"] },
    { id:"cream",   name:"Cream & Onion",          price:199, mrp:249, category:"roasted", acc:"#8A6BB0", weight:"80g",  note:"creamy, savoury, moreish",      ribbon:"",           ribbonType:"",           rating:4.7, reviews:86,  cat:"onion", images:["/images/products/cream.jpg","/images/products/cream-2.jpg"] },
    { id:"salt",    name:"Salt & Pepper",          price:179, mrp:229, category:"roasted", acc:"#4A5A66", weight:"80g",  note:"classic, perfectly seasoned",   ribbon:"",           ribbonType:"",           rating:4.6, reviews:72,  cat:"pepper", images:["/images/products/salt.jpg"] },
    { id:"pink",    name:"Himalayan Pink Salt",    price:179, mrp:229, category:"roasted", acc:"#C77A86", weight:"80g",  note:"clean, lightly salted",         ribbon:"",           ribbonType:"",           rating:4.7, reviews:64,  cat:"mountain", images:["/images/products/pink.jpg"] },
    { id:"classic", name:"Classic Lightly Salted", price:169, mrp:219, category:"roasted", acc:"#C9A227", weight:"80g",  note:"pure, plain, perfect",          ribbon:"",           ribbonType:"",           rating:4.6, reviews:110, cat:"seed", images:["/images/products/classic.jpg"] },
    { id:"raw",     name:"Raw Phool Makhana",      price:249, mrp:299, category:"raw",     acc:"#6E8B6F", weight:"100g", note:"premium handpicked, big pops",  ribbon:"RAW",        ribbonType:"acc",        rating:4.9, reviews:140, cat:"lotus", images:["/images/products/raw.jpg"] },
    { id:"combo",   name:"Variety Combo (5 packs)",price:799, mrp:1095,category:"combo",   acc:"#B9760C", weight:"400g", note:"all flavours, perfect gifting", ribbon:"COMBO",      ribbonType:"acc",        rating:5.0, reviews:57,  cat:"combo" },
    { id:"test",    name:"Test Product",           price:1,   mrp:1,   category:"roasted", acc:"#97a97c", weight:"1g",   note:"₹1 test order — free shipping", ribbon:"TEST",       ribbonType:"new",        rating:5.0, reviews:1,   cat:"seed",  freeShipping:true }
  ];

  /* ---------- Per-product detail copy ---------- */
  const DETAILS = {
    peri: {
      taste:"Spicy & tangy",
      tagline:"Fiery, zingy and impossible to put down.",
      long:[
        "From the lotus ponds of Madhubani to your snack bowl, our Peri Peri Punch starts with premium, hand-picked foxnuts that are slow-roasted in cold-pressed oil - never deep-fried.",
        "We then dust them in a bold peri peri blend of smoky red chilli, garlic and a squeeze of tang. The result is a guilt-free crunch with a kick that keeps you reaching back into the pack."
      ],
      ingredients:"Roasted makhana (foxnuts), peri peri seasoning (red chilli, garlic, tomato powder, salt, spices), cold-pressed sunflower oil.",
      allergen:"May contain traces of nuts. Made in a facility that also handles milk."
    },
    pudina: {
      taste:"Tangy & minty",
      tagline:"Cool mint chaat, bottled as a crunch.",
      long:[
        "Our Chatpata Pudina takes big, white foxnuts from Bihar and roasts them low-and-slow for an airy crunch.",
        "A street-style toss of dried mint, amchur and chaat masala gives every piece that tangy pudina zing you can't stop snacking on - wholesome and addictive at once."
      ],
      ingredients:"Roasted makhana (foxnuts), mint & chaat seasoning (dried mint, amchur, black salt, cumin, spices), cold-pressed sunflower oil.",
      allergen:"May contain traces of nuts."
    },
    cream: {
      taste:"Creamy & savoury",
      tagline:"Creamy, savoury, dangerously moreish.",
      long:[
        "Cream & Onion is the crowd-pleaser of the range - light foxnuts roasted to a perfect crunch.",
        "Dusted in a creamy onion-and-herb seasoning, it's the comforting, savoury snack that disappears fastest at every gathering."
      ],
      ingredients:"Roasted makhana (foxnuts), cream & onion seasoning (onion powder, milk solids, herbs, salt, spices), cold-pressed sunflower oil.",
      allergen:"Contains milk. May contain traces of nuts."
    },
    salt: {
      taste:"Salty & peppery",
      tagline:"The classic. Perfectly seasoned crunch.",
      long:[
        "Some things never go out of style. Salt & Pepper keeps it simple with premium roasted foxnuts.",
        "A balance of sea salt and freshly cracked black pepper lets the natural, nutty taste of the makhana shine through - a timeless, all-occasion snack."
      ],
      ingredients:"Roasted makhana (foxnuts), sea salt, cracked black pepper, cold-pressed sunflower oil.",
      allergen:"May contain traces of nuts."
    },
    pink: {
      taste:"Lightly salted",
      tagline:"Clean and light, with Himalayan pink salt.",
      long:[
        "For the purists. Himalayan Pink Salt makhana is roasted, never fried, and seasoned with just a whisper of mineral-rich pink salt.",
        "Clean, light and barely-there salty - the kind of snack you feel genuinely good about, any time of day."
      ],
      ingredients:"Roasted makhana (foxnuts), Himalayan pink salt, cold-pressed sunflower oil.",
      allergen:"May contain traces of nuts."
    },
    classic: {
      taste:"Mild & natural",
      tagline:"Just makhana, just right.",
      long:[
        "Our Classic Lightly Salted is makhana in its most honest form - premium foxnuts, slow-roasted to a satisfying crunch.",
        "A gentle pinch of salt is all it needs. Perfect for kids, elders and anyone who loves a clean, subtle, everyday snack."
      ],
      ingredients:"Roasted makhana (foxnuts), a pinch of salt, cold-pressed sunflower oil.",
      allergen:"May contain traces of nuts."
    },
    raw: {
      taste:"Plain (raw)",
      tagline:"Premium handpicked foxnuts - big, white pops.",
      long:[
        "Raw Phool Makhana is the hero ingredient itself - large, hand-graded foxnuts sourced directly from farmer families in Madhubani, Bihar.",
        "Roast them at home in a little ghee or olive oil, add them to kheer and curries, or pop them into a trail mix. Single ingredient, endless possibilities."
      ],
      ingredients:"100% raw makhana (phool makhana). Nothing else.",
      allergen:"May contain traces of nuts."
    },
    combo: {
      taste:"5 flavours",
      tagline:"All five signature flavours in one gift-ready box.",
      long:[
        "Can't decide? The Variety Combo packs all five of our signature roasted flavours - Peri Peri, Chatpata Pudina, Cream & Onion, Salt & Pepper and Himalayan Pink Salt - into one beautiful box.",
        "Sealed fresh from Madhubani, it's the perfect way to discover your favourite, or to gift wholesome snacking to someone you love."
      ],
      ingredients:"5 packs of roasted makhana in assorted flavours (see individual flavours for seasoning details).",
      allergen:"Contains milk (Cream & Onion). May contain traces of nuts."
    },
    test: {
      taste:"Test item",
      tagline:"Re.1 live payment test",
      long:[
        "This is a Re.1 test product we use to verify that live payments work end-to-end on the store. It is not a real snack pack and nothing is shipped.",
        "If you ordered it by accident, contact us with your payment reference and we'll refund it right away."
      ],
      ingredients:"None — this is a payment test item, not a food product.",
      allergen:"Not applicable — no physical product is shipped."
    }
  };
  PRODUCTS.forEach((p) => Object.assign(p, DETAILS[p.id] || {}));

  /* ---------- Helpers ---------- */
  const round = (n) => Math.round(n);
  const rupee = (n) => "₹" + Number(n).toLocaleString("en-IN");
  const pct = (p) => Math.round(((p.mrp - p.price) / p.mrp) * 100);
  const getProduct = (id) => PRODUCTS.find((p) => p.id === id);

  /* size / pack variants → control quantity (price stays consistent with the cart) */
  function variants(p) {
    if (p.category === "combo") {
      return [
        { label: "1 Gift Box", sub: p.weight, qty: 1 },
        { label: "Pack of 2", sub: "2 boxes", qty: 2, tag: "Gifting favourite" }
      ];
    }
    const w = parseInt(p.weight, 10);
    const unit = p.weight.replace(/[0-9]/g, "");
    return [
      { label: "1 Pack", sub: p.weight, qty: 1 },
      { label: "Pack of 3", sub: (w * 3) + unit, qty: 3, tag: "Most popular" },
      { label: "Pack of 6", sub: (w * 6) + unit, qty: 6, tag: "Best value" }
    ];
  }

  function highlights(p) {
    if (p.category === "raw")
      return ["100% natural", "Single ingredient", "Gluten free", "High protein"];
    if (p.category === "combo")
      return ["5 flavours", "Perfect for gifting", "No preservatives", "Roasted, never fried"];
    return ["Roasted, never fried", "No palm oil", "Gluten free", "High protein"];
  }

  function nutrition(p) {
    if (p.category === "raw") {
      return [
        { k: "Energy", v: "347 kcal" }, { k: "Protein", v: "9.7 g" },
        { k: "Carbohydrate", v: "76.9 g" }, { k: "of which sugars", v: "0.1 g" },
        { k: "Total Fat", v: "0.1 g" }, { k: "Dietary Fibre", v: "7.6 g" },
        { k: "Sodium", v: "12 mg" }, { k: "Calcium", v: "60 mg" }
      ];
    }
    return [
      { k: "Energy", v: "385 kcal" }, { k: "Protein", v: "11.8 g" },
      { k: "Carbohydrate", v: "70.2 g" }, { k: "of which sugars", v: "1.2 g" },
      { k: "Total Fat", v: "6.4 g" }, { k: "Dietary Fibre", v: "8.9 g" },
      { k: "Sodium", v: "320 mg" }, { k: "Calcium", v: "58 mg" }
    ];
  }

  function benefits() {
    return [
      { ic: "protein", title: "High in plant protein", text: "A handful keeps you full and fuelled - a smart swap for fried snacks." },
      { ic: "feather", title: "Light & low-calorie", text: "Roasted, never deep-fried, so you get all the crunch with none of the guilt." },
      { ic: "spark", title: "Rich in antioxidants", text: "Foxnuts are naturally loaded with antioxidants and essential minerals." },
      { ic: "heart", title: "Heart & bone friendly", text: "Low in sodium and fat, with calcium and magnesium for stronger bones." }
    ];
  }

  function howto() {
    return [
      { t: "Straight from the pack", d: "The perfect anytime snack - at your desk, in the gym bag or on the go." },
      { t: "With your chai or coffee", d: "Swap the biscuits. A crunchy, wholesome companion for your evening cup." },
      { t: "Toss into salads & bowls", d: "Add a protein-rich crunch to salads, poha, trail mix and chaat." },
      { t: "Cook it up", d: "Drop into kheer, curries and raita, or roast with ghee for a quick treat." }
    ];
  }

  function info(p) {
    return [
      { k: "Origin", v: "Madhubani, Bihar, India" },
      { k: "Shelf life", v: "9 months from manufacture" },
      { k: "Diet", v: "100% Vegetarian" },
      { k: "Storage", v: "Store in a cool, dry place; reseal after opening" },
      { k: "Allergen info", v: p.allergen || "May contain traces of nuts." },
      { k: "Marketed by", v: "The Makhana Foods, India · FSSAI Lic. 23326005001818" }
    ];
  }

  function faqs(p) {
    const base = [
      { q: "Is makhana actually healthy?", a: "Yes! Foxnuts (makhana) are naturally high in protein and fibre, low in fat, gluten-free and rich in antioxidants and minerals like calcium and magnesium - one of the smartest snacks you can keep around." },
      { q: "How many calories are in a pack?", a: "Our roasted flavours are roughly 385 kcal per 100g, and an " + p.weight + " pack is light and airy - a typical handful is well under 100 calories. Raw makhana is even lighter at ~347 kcal/100g." },
      { q: "Is it good for weight loss?", a: "Makhana is filling, high in protein and roasted (never fried), which makes it a great swap for chips and biscuits when you're watching your intake." },
      { q: "How should I store it?", a: "Keep it in a cool, dry place away from sunlight and reseal the pack after opening to keep every piece crunchy." },
      { q: "Who can eat The Makhana?", a: "Everyone - kids, elders, gym-goers and anyone who loves a clean snack. It's 100% vegetarian and gluten-free." }
    ];
    if (p.category === "raw")
      base.push({ q: "How do I roast raw makhana?", a: "Heat a little ghee or olive oil in a pan, add the makhana and roast on low heat for 5-7 minutes, stirring, until crisp. Season to taste and enjoy." });
    else if (p.category === "combo")
      base.push({ q: "Which flavours are in the box?", a: "Peri Peri Punch, Chatpata Pudina, Cream & Onion, Salt & Pepper and Himalayan Pink Salt - one pack of each." });
    else
      base.push({ q: "Is this flavour very spicy?", a: p.id === "peri" ? "It has a bold, smoky kick - flavourful and zingy, but balanced enough to keep snacking." : "Not at all - it's a balanced, everyday flavour the whole family can enjoy." });
    return base;
  }

  /* ---------- SVG icons ---------- */
  const ICON = {
    plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    minus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
    trash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12a2 2 0 0 0 2 1.8h4A2 2 0 0 0 16 19l1-12"/></svg>',
    bag:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 11a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 19L6 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4 10-10"/></svg>',
    lotus:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 14c3 4 5 8 5 11a5 5 0 0 1-10 0c0-3 2-7 5-11z"/><path d="M12 26c4 0 7 1.5 9 4M36 26c-4 0-7 1.5-9 4"/></svg>',
    star:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 17.6 6.7 20l1.1-6L3.4 9.8l6-.8L12 3.5z"/></svg>',
    truck:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7.5 18a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4zM17.5 18a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4z"/></svg>',
    shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/></svg>',
    leaf:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13c3-1 6-4 7-9 1 5 4 8 7 9-3 1-6 4-7 9-1-5-4-8-7-9z"/><path d="M4 20L20 4"/></svg>',
    return:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8a9 9 0 1 1-1 4"/><path d="M3 4v4h4"/></svg>',
    lock:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    protein:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/></svg>',
    feather:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4C11 4 6 9 6 16l-2 4M9 14h6"/></svg>',
    spark:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
    heart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.5 12 20 12 20z"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };
  const benefitIcon = { protein: ICON.protein, feather: ICON.feather, spark: ICON.spark, heart: ICON.heart };
  const stars = () => Array.from({ length: 5 }, () => ICON.star).join("");

  /* ---------- pouch SVG (shared with homepage style) ---------- */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function escapeXML(s) { return String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])); }
  function puff(cx, cy, r, rot, acc, roasted) {
    const rx = r, ry = r * 0.86;
    const speck = roasted ? '<circle cx="' + (cx + r * .25) + '" cy="' + (cy - r * .15) + '" r="1.1" fill="' + acc + '" opacity=".5"/>' : '';
    return '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#FFF8E7"/>' +
      '<ellipse cx="' + cx + '" cy="' + (cy + ry * .22) + '" rx="' + (rx * .82) + '" ry="' + (ry * .62) + '" fill="#EBDCB6" opacity=".55"/>' +
      '<path d="M' + (cx - rx * .55) + ' ' + (cy - ry * .12) + 'q' + (rx * .55) + ' ' + (ry * .34) + ' ' + (rx * 1.1) + ' 0" fill="none" stroke="#CBB488" stroke-width="1.3" stroke-linecap="round"/>' +
      '<ellipse cx="' + (cx - rx * .32) + '" cy="' + (cy - ry * .4) + '" rx="' + (rx * .3) + '" ry="' + (ry * .2) + '" fill="#fff" opacity=".7"/>' +
      speck + '</g>';
  }

  const _cache = {};
  // paper-canister (tin) illustration, parameterised by accent colour
  function pouchSVG(p, opts) {
    opts = opts || {};
    if (!opts.decorative && _cache[p.id]) return _cache[p.id];
    const id = p.id, acc = p.acc;
    const flav = p.name.split(" (")[0].toUpperCase();
    const ribbonName = flav.length > 15 ? p.id.toUpperCase() : flav;
    const a11y = opts.decorative ? 'role="presentation" aria-hidden="true"' : 'role="img" aria-label="' + escapeXML(p.name + " makhana canister") + '"';
    const puffs = [[78, 298, 12, -10], [188, 300, 11, 8], [98, 311, 9, 16]]
      .map((m) => puff(m[0], m[1], m[2], m[3], acc, p.category === "roasted")).join("");
    let stripes = "";
    for (let x = 78; x <= 182; x += 8) stripes += '<line x1="' + x + '" y1="110" x2="' + x + '" y2="312"/>';
    const svg =
'<svg viewBox="0 0 260 340" ' + a11y + ' xmlns="http://www.w3.org/2000/svg">' +
  '<defs>' +
    '<linearGradient id="barrel-' + id + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset="0.10" stop-color="#000" stop-opacity=".05"/><stop offset="0.42" stop-color="#fff" stop-opacity=".36"/><stop offset="0.60" stop-color="#fff" stop-opacity=".08"/><stop offset="0.90" stop-color="#000" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>' +
    '<linearGradient id="lid-' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + shade(acc, 24) + '"/><stop offset="1" stop-color="' + shade(acc, -16) + '"/></linearGradient>' +
    '<clipPath id="body-' + id + '"><path d="M70 112 L190 112 L190 294 Q130 311 70 294 Z"/></clipPath>' +
  '</defs>' +
  '<ellipse cx="130" cy="309" rx="66" ry="11" fill="rgba(40,28,8,.22)" filter="url(#pouchShadow)"/>' +
  '<path d="M70 112 L190 112 L190 294 Q130 311 70 294 Z" fill="#EFE1C2"/>' +
  '<g clip-path="url(#body-' + id + ')" stroke="#E3D3AC" stroke-width="2" opacity=".7">' + stripes + '</g>' +
  '<rect x="68" y="112" width="124" height="11" fill="' + acc + '" clip-path="url(#body-' + id + ')"/>' +
  '<rect x="68" y="280" width="124" height="20" fill="' + acc + '" clip-path="url(#body-' + id + ')"/>' +
  '<rect x="68" y="108" width="124" height="206" fill="url(#barrel-' + id + ')" clip-path="url(#body-' + id + ')"/>' +
  '<circle cx="130" cy="152" r="21" fill="#FFFFFF"/>' +
  '<circle cx="130" cy="152" r="21" fill="none" stroke="' + acc + '" stroke-width="2.4"/>' +
  '<g transform="translate(130 152)" fill="none" stroke="' + acc + '" stroke-width="2" stroke-linecap="round"><path d="M0 -9c2.6 3.4 3.9 6.8 3.9 9.4a3.9 3.9 0 0 1-7.8 0c0-2.6 1.3-6 3.9-9.4z"/><path d="M-10 4c3.4 0 6 1.3 7.6 3.4M10 4c-3.4 0-6 1.3-7.6 3.4"/></g>' +
  '<text x="130" y="196" text-anchor="middle" font-family="Lexend,sans-serif" font-weight="800" font-size="13" letter-spacing="1.3" fill="#3A2E18">THE MAKHANA</text>' +
  '<text x="130" y="214" text-anchor="middle" font-family="Lexend,sans-serif" font-weight="600" font-size="8.5" letter-spacing="1.5" fill="#8A754C">' + (p.category === "raw" ? "RAW" : "ROASTED") + ' · ' + p.weight + '</text>' +
  '<rect x="80" y="248" width="100" height="22" rx="6" fill="#FFFFFF"/>' +
  '<text x="130" y="263" text-anchor="middle" font-family="Lexend,sans-serif" font-weight="700" font-size="10" letter-spacing=".4" fill="' + shade(acc, -34) + '">' + escapeXML(ribbonName) + '</text>' +
  puffs +
  '<path d="M65 104 L65 113 Q65 118 130 120 Q195 118 195 113 L195 104 Z" fill="' + shade(acc, -20) + '"/>' +
  '<ellipse cx="130" cy="104" rx="65" ry="13.5" fill="url(#lid-' + id + ')"/>' +
  '<ellipse cx="130" cy="104" rx="65" ry="13.5" fill="none" stroke="' + shade(acc, -28) + '" stroke-width="1.4" opacity=".5"/>' +
  '<ellipse cx="115" cy="100" rx="30" ry="5.5" fill="#fff" opacity=".28"/>' +
'</svg>';
    if (!opts.decorative) _cache[p.id] = svg;
    return svg;
  }

  /* A bowl of foxnuts - used as a second gallery angle */
  function bowlSVG(p) {
    const acc = p.acc, roasted = p.category === "roasted";
    const pile = [
      [110,150,15,-10],[140,144,17,6],[170,152,14,14],[125,165,15,18],[156,166,16,-8],
      [98,168,12,4],[182,166,12,-12],[140,176,14,2],[112,182,12,12],[166,182,13,-6]
    ].map((m) => puff(m[0], m[1], m[2], m[3], acc, roasted)).join("");
    return '<svg viewBox="0 0 280 240" role="img" aria-label="' + escapeXML(p.name + " in a bowl") + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="bowl-' + p.id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F0E7D2"/></linearGradient></defs>' +
      '<ellipse cx="140" cy="216" rx="92" ry="13" fill="rgba(20,20,20,.16)" filter="url(#pouchShadow)"/>' +
      pile +
      '<path d="M44 168 A96 96 0 0 0 236 168 L226 176 A92 60 0 0 1 54 176 Z" fill="url(#bowl-' + p.id + ')"/>' +
      '<ellipse cx="140" cy="168" rx="96" ry="30" fill="none" stroke="#E4D8BD" stroke-width="3"/>' +
      '<path d="M44 168 A96 96 0 0 0 236 168" fill="none" stroke="#D9CBAA" stroke-width="2" opacity=".7"/>' +
      '<ellipse cx="140" cy="196" rx="70" ry="9" fill="#fff" opacity=".25"/>' +
    '</svg>';
  }

  /* ---------- Cart store (same key/format as the homepage) ---------- */
  const CART_KEY = "makhana_cart";
  function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } }
  function setCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} }
  function addToCart(id, qty) {
    // clamp to a sane 1..99 per-line quantity
    qty = Math.max(1, Math.min(99, Math.round(qty) || 1));
    const cart = getCart();
    const line = cart.find((i) => i.id === id);
    if (line) line.qty = Math.min(99, line.qty + qty); else cart.push({ id: id, qty: qty });
    setCart(cart);
    return cart;
  }
  const cartCount = () => getCart().reduce((s, i) => s + i.qty, 0);

  return {
    PRODUCTS, getProduct, rupee, pct, round,
    variants, highlights, nutrition, benefits, howto, info, faqs,
    ICON, benefitIcon, stars, pouchSVG, bowlSVG, escapeXML,
    CART_KEY, getCart, setCart, addToCart, cartCount
  };
})();
