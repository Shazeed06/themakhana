/* ===================================================================
   THE MAKHANA - shared checkout flow
   window.Checkout.open({ items, getProduct, rupee, freeShip, onPlaced })
   - items: [{id, qty}]   - getProduct: (id) => {name, price,...}
   - rupee: optional formatter   - freeShip: free-shipping threshold
   - onPlaced: callback after a successful order (clear cart, close drawer)
   =================================================================== */
(function () {
  "use strict";

  var modal = null, opts = null, total = 0;
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4 10-10"/></svg>';

  function esc(s) { return String(s).replace(/[<>&"]/g, function (c) { return ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]; }); }
  function money(n) { return (opts && opts.rupee) ? opts.rupee(n) : "₹" + Number(n).toLocaleString("en-IN"); }

  function field(id, label, type, ac, extra) {
    return '<div class="co-field">' +
      '<label class="co-label" for="' + id + '">' + label + '</label>' +
      '<input class="co-input" id="' + id + '" name="' + id + '" type="' + type + '" autocomplete="' + ac + '" ' + (extra || "") + ' />' +
      '<span class="co-field__err" id="err-' + id + '"></span>' +
      '</div>';
  }

  function build() {
    var wrap = document.createElement("div");
    wrap.className = "checkout";
    wrap.id = "checkoutModal";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML =
      '<div class="checkout__scrim" data-co-close></div>' +
      '<div class="checkout__panel" role="dialog" aria-modal="true" aria-label="Checkout">' +
        '<button class="checkout__close" type="button" data-co-close aria-label="Close checkout">&times;</button>' +
        '<form class="checkout__body" id="coForm" novalidate>' +
          '<div class="checkout__fields">' +
            '<h2 class="checkout__title">Checkout</h2>' +
            '<fieldset class="co-group"><legend>Contact details</legend>' +
              field("coName", "Full name", "text", "name") +
              '<div class="co-row">' +
                field("coPhone", "Phone number", "tel", "tel", 'inputmode="numeric" maxlength="10"') +
                field("coEmail", "Email (optional)", "email", "email") +
              '</div>' +
            '</fieldset>' +
            '<fieldset class="co-group"><legend>Delivery address</legend>' +
              field("coAddr", "House no, street, area", "text", "street-address") +
              '<div class="co-row">' +
                field("coCity", "City", "text", "address-level2") +
                field("coState", "State", "text", "address-level1") +
              '</div>' +
              field("coPin", "Pincode", "text", "postal-code", 'inputmode="numeric" maxlength="6"') +
            '</fieldset>' +
            '<fieldset class="co-group"><legend>Payment</legend>' +
              '<label class="co-pay"><input type="radio" name="pay" value="cod" checked />' +
                '<span><strong>Cash on Delivery</strong><small>Pay in cash when your order arrives</small></span></label>' +
            '</fieldset>' +
          '</div>' +
          '<aside class="checkout__summary">' +
            '<h3>Order summary</h3>' +
            '<div class="co-items" id="coItems"></div>' +
            '<div class="co-line"><span>Subtotal</span><span id="coSub"></span></div>' +
            '<div class="co-line"><span>Shipping</span><span id="coShip"></span></div>' +
            '<div class="co-line co-line--total"><span>Total</span><span id="coTotal"></span></div>' +
            '<button class="btn btn--primary btn--block" type="submit" id="coPlace">Place order</button>' +
            '<p class="co-secure">' + CHECK + ' Cash on delivery · 7-day easy returns</p>' +
          '</aside>' +
        '</form>' +
        '<div class="checkout__done" id="coDone" hidden></div>' +
      '</div>';
    document.body.appendChild(wrap);
    modal = wrap;
    wrap.addEventListener("click", function (e) { if (e.target.closest("[data-co-close]")) close(); });
    document.getElementById("coForm").addEventListener("submit", onSubmit);
    // live-clear error styling as the user types
    wrap.addEventListener("input", function (e) {
      var f = e.target.closest(".co-field");
      if (f) f.classList.remove("is-invalid");
    });
    return wrap;
  }

  function renderSummary() {
    var items = opts.items || [];
    var gp = opts.getProduct;
    var sub = 0, rows = "";
    items.forEach(function (l) {
      var p = gp(l.id); if (!p) return;
      var lt = p.price * l.qty; sub += lt;
      rows += '<div class="co-item"><span class="co-item__name">' + esc(p.name.split(" (")[0]) +
        ' <em>× ' + l.qty + '</em></span><span class="co-item__amt">' + money(lt) + '</span></div>';
    });
    document.getElementById("coItems").innerHTML = rows;
    var freeShip = opts.freeShip || 599;
    var ship = (sub === 0 || sub >= freeShip) ? 0 : 49;
    document.getElementById("coSub").textContent = money(sub);
    document.getElementById("coShip").textContent = ship === 0 ? "FREE" : money(ship);
    total = sub + ship;
    document.getElementById("coTotal").textContent = money(total);
  }

  function setErr(id, msg) {
    var e = document.getElementById("err-" + id);
    if (e) e.textContent = msg;
    var f = document.getElementById(id).closest(".co-field");
    if (f) f.classList.toggle("is-invalid", !!msg);
  }

  function onSubmit(e) {
    e.preventDefault();
    var checks = [
      ["coName", function (v) { return v.trim().length >= 2; }, "Please enter your name"],
      ["coPhone", function (v) { return /^[6-9]\d{9}$/.test(v.trim()); }, "Enter a valid 10-digit mobile number"],
      ["coAddr", function (v) { return v.trim().length >= 5; }, "Please enter your full address"],
      ["coCity", function (v) { return v.trim().length >= 2; }, "Enter your city"],
      ["coState", function (v) { return v.trim().length >= 2; }, "Enter your state"],
      ["coPin", function (v) { return /^\d{6}$/.test(v.trim()); }, "Enter a valid 6-digit pincode"]
    ];
    var firstBad = null;
    checks.forEach(function (c) {
      var el = document.getElementById(c[0]);
      var ok = c[1](el.value);
      setErr(c[0], ok ? "" : c[2]);
      if (!ok && !firstBad) firstBad = el;
    });
    // email is optional, but if filled it must be valid
    var em = document.getElementById("coEmail");
    if (em.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) {
      setErr("coEmail", "Enter a valid email"); if (!firstBad) firstBad = em;
    } else { setErr("coEmail", ""); }

    if (firstBad) { firstBad.focus(); return; }

    var name = document.getElementById("coName").value.trim();
    var phone = document.getElementById("coPhone").value.trim();
    var orderId = "TM" + String(Date.now()).slice(-6);
    showDone(name, phone, orderId);
    if (opts.onPlaced) opts.onPlaced({ id: orderId, name: name, phone: phone, total: total });
  }

  function showDone(name, phone, orderId) {
    document.getElementById("coForm").hidden = true;
    var done = document.getElementById("coDone");
    done.innerHTML =
      '<div class="co-done">' +
        '<div class="co-done__tick">' + CHECK + '</div>' +
        '<h2>Order placed!</h2>' +
        '<p>Thank you, ' + esc(name) + '. Your order <strong>#' + orderId + '</strong> is confirmed.</p>' +
        '<p class="co-done__sub">We’ll call you on <strong>' + esc(phone) + '</strong> to confirm delivery. Pay <strong>' + money(total) + '</strong> in cash when it arrives.</p>' +
        '<button class="btn btn--primary" type="button" data-co-close>Continue shopping</button>' +
      '</div>';
    done.hidden = false;
  }

  function onKey(e) { if (e.key === "Escape") close(); }

  function open(o) {
    opts = o;
    if (!modal) build();
    // reset to form view
    document.getElementById("coDone").hidden = true;
    document.getElementById("coForm").hidden = false;
    Array.prototype.forEach.call(modal.querySelectorAll(".co-field.is-invalid"), function (f) { f.classList.remove("is-invalid"); });
    renderSummary();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    var first = document.getElementById("coName");
    if (first) setTimeout(function () { first.focus(); }, 80);
  }

  function close() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
  }

  window.Checkout = { open: open, close: close };
})();
