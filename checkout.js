/* ===================================================================
   THE MAKHANA - shared checkout flow (COD + Razorpay online payment)
   window.Checkout.open({ items, getProduct, rupee, freeShip, onPlaced })
   - items: [{id, qty}]   - getProduct: (id) => {name, price,...}
   - rupee: optional formatter   - freeShip: free-shipping threshold
   - onPlaced: callback after a successful order (clear cart, close drawer)

   Online payments use Vercel functions /api/create-order and
   /api/verify-payment (need RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET env vars).
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
              '<label class="co-pay"><input type="radio" name="pay" value="online" />' +
                '<span><strong>Pay Online</strong><small>UPI, Cards, Netbanking &amp; Wallets — secure via Razorpay</small></span></label>' +
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
            '<p class="co-pay-err" id="coPayErr" hidden style="color:#c0392b;font-size:13px;font-weight:600;line-height:1.5;margin:10px 0 0;text-align:center"></p>' +
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
    // payment method switch updates the button label
    wrap.addEventListener("change", function (e) {
      if (e.target && e.target.name === "pay") { clearPayErr(); updatePayUI(); }
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
    // Every line item is a free-shipping product → no shipping charge.
    var allFree = items.length > 0 && items.every(function (l) {
      var p = gp(l.id); return p && p.freeShipping === true;
    });
    var ship = (sub === 0 || sub >= freeShip || allFree) ? 0 : 49;
    document.getElementById("coSub").textContent = money(sub);
    document.getElementById("coShip").textContent = ship === 0 ? "FREE" : money(ship);
    total = sub + ship;
    document.getElementById("coTotal").textContent = money(total);
    updatePayUI();
  }

  function selectedMethod() {
    var r = modal.querySelector('input[name="pay"]:checked');
    return r ? r.value : "cod";
  }

  function updatePayUI() {
    if (!modal) return;
    var method = selectedMethod();
    var btn = document.getElementById("coPlace");
    if (btn && !btn.disabled) btn.textContent = method === "online" ? ("Pay " + money(total)) : "Place order";
    var sec = modal.querySelector(".co-secure");
    if (sec) sec.innerHTML = CHECK + (method === "online"
      ? " 100% secure payment via Razorpay · 7-day returns"
      : " Cash on delivery · 7-day easy returns");
  }

  function setErr(id, msg) {
    var e = document.getElementById("err-" + id);
    if (e) e.textContent = msg;
    var f = document.getElementById(id).closest(".co-field");
    if (f) f.classList.toggle("is-invalid", !!msg);
  }

  function clearPayErr() {
    var box = document.getElementById("coPayErr");
    if (box) { box.textContent = ""; box.hidden = true; }
  }
  function showPayErr(msg) {
    var box = document.getElementById("coPayErr");
    if (box && msg) { box.textContent = msg; box.hidden = false; }
  }

  function gatherData() {
    var g = function (id) { return (document.getElementById(id).value || "").trim(); };
    var items = (opts.items || []).map(function (l) {
      var p = opts.getProduct(l.id);
      return p ? { name: p.name.split(" (")[0], qty: l.qty, price: p.price } : null;
    }).filter(Boolean);
    return {
      name: g("coName"), phone: g("coPhone"), email: g("coEmail"),
      address: g("coAddr") + ", " + g("coCity") + ", " + g("coState") + " - " + g("coPin"),
      items: items
    };
  }

  function onSubmit(e) {
    e.preventDefault();
    clearPayErr();
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
    var em = document.getElementById("coEmail");
    if (em.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) {
      setErr("coEmail", "Enter a valid email"); if (!firstBad) firstBad = em;
    } else { setErr("coEmail", ""); }

    if (firstBad) { firstBad.focus(); return; }

    var data = gatherData();
    if (selectedMethod() === "online") {
      payOnline(data);
    } else {
      var orderId = "TM" + String(Date.now()).slice(-6);
      saveToAccount({ order_no: orderId, method: "cod", paymentId: null, data: data });
      showDone(data.name, data.phone, orderId, false);
      if (opts.onPlaced) opts.onPlaced({ id: orderId, name: data.name, phone: data.phone, total: total, method: "cod" });
    }
  }

  /* ---------- Razorpay online payment ---------- */
  function loadRazorpay(cb) {
    if (window.Razorpay) { cb(true); return; }
    var s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = function () { cb(true); };
    s.onerror = function () { cb(false); };
    document.head.appendChild(s);
  }

  function busy(on, label) {
    var btn = document.getElementById("coPlace");
    if (!btn) return;
    btn.disabled = on;
    if (on) btn.textContent = label || "Please wait…";
    else updatePayUI();
  }

  function payOnline(data) {
    clearPayErr();
    busy(true, "Starting payment…");
    fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: total,
        items: data.items,
        customer: { name: data.name, phone: data.phone, email: data.email, address: data.address }
      })
    })
      .then(function (r) {
        return r.text().then(function (t) {
          var j = null; try { j = JSON.parse(t); } catch (e) { j = null; }
          return { ok: r.ok, j: j };
        });
      })
      .then(function (res) {
        if (!res.ok || !res.j || !res.j.orderId) {
          throw new Error((res.j && res.j.error) || "Online payment isn't available right now — please choose Cash on Delivery.");
        }
        var o = res.j;
        loadRazorpay(function (loaded) {
          if (!loaded) { busy(false); showPayErr("Could not load the payment window. Check your connection and try again."); return; }
          var rzp = new window.Razorpay({
            key: o.keyId,
            order_id: o.orderId,
            amount: o.amount,
            currency: o.currency || "INR",
            name: "The Makhana",
            description: "Order payment",
            image: location.origin + "/images/logo.png",
            prefill: { name: data.name, contact: data.phone, email: data.email || "" },
            notes: { address: data.address },
            theme: { color: "#97a97c" },
            handler: function (resp) { verifyAndFinish(resp, data); },
            modal: { ondismiss: function () { busy(false); showPayErr("Payment cancelled. You can try again or choose Cash on Delivery."); } }
          });
          rzp.on("payment.failed", function () { busy(false); showPayErr("Payment failed. Please try again or choose Cash on Delivery."); });
          busy(true, "Opening payment…");
          rzp.open();
        });
      })
      .catch(function (err) { busy(false); showPayErr((err && err.message) || "Could not start payment. Please try Cash on Delivery."); });
  }

  function verifyAndFinish(resp, data) {
    busy(true, "Verifying payment…");
    fetch("/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: resp.razorpay_order_id,
        razorpay_payment_id: resp.razorpay_payment_id,
        razorpay_signature: resp.razorpay_signature
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.valid) {
          var orderId = String(resp.razorpay_payment_id || ("TM" + Date.now())).replace("pay_", "");
          saveToAccount({ order_no: orderId, method: "online", paymentId: resp.razorpay_payment_id, data: data });
          showDone(data.name, data.phone, orderId, true);
          if (opts.onPlaced) opts.onPlaced({ id: orderId, name: data.name, phone: data.phone, total: total, method: "online", paymentId: resp.razorpay_payment_id });
        } else {
          busy(false);
          showPayErr("We could not verify the payment. If money was deducted it will be auto-refunded, or contact us and we'll sort it out.");
        }
      })
      .catch(function () { busy(false); showPayErr("Could not verify the payment. If money was deducted, please contact us."); });
  }

  function showDone(name, phone, orderId, paid) {
    document.getElementById("coForm").hidden = true;
    var done = document.getElementById("coDone");
    var payLine = paid
      ? "Payment of <strong>" + money(total) + "</strong> received. We&rsquo;ll call you on <strong>" + esc(phone) + "</strong> to confirm delivery."
      : "We&rsquo;ll call you on <strong>" + esc(phone) + "</strong> to confirm delivery. Pay <strong>" + money(total) + "</strong> in cash when it arrives.";
    done.innerHTML =
      '<div class="co-done">' +
        '<div class="co-done__tick">' + CHECK + '</div>' +
        '<h2>' + (paid ? "Payment successful!" : "Order placed!") + '</h2>' +
        '<p>Thank you, ' + esc(name) + '. Your order <strong>#' + esc(orderId) + '</strong> is confirmed.</p>' +
        '<p class="co-done__sub">' + payLine + '</p>' +
        '<button class="btn btn--primary" type="button" data-co-close>Continue shopping</button>' +
      '</div>';
    done.hidden = false;
  }

  function onKey(e) { if (e.key === "Escape") close(); }

  function prefillFromProfile() {
    if (!window.TMAuth || !window.TMAuth.enabled) return;
    var p = window.TMAuth.profile(), u = window.TMAuth.user();
    function set(id, v) { var el = document.getElementById(id); if (el && !el.value && v) el.value = v; }
    if (p) { set("coName", p.full_name); set("coPhone", p.phone); set("coAddr", p.address); set("coCity", p.city); set("coState", p.state); set("coPin", p.pincode); set("coEmail", p.email); }
    if (u && u.email) set("coEmail", u.email);
  }

  function saveToAccount(o) {
    if (!window.TMAuth || !window.TMAuth.saveOrder) return;
    var sub = 0; (o.data.items || []).forEach(function (i) { sub += i.price * i.qty; });
    var ship = total - sub; if (ship < 0) ship = 0;
    try {
      window.TMAuth.saveOrder({
        order_no: o.order_no, items: o.data.items, subtotal: sub, shipping: ship, total: total,
        payment_method: o.method, payment_id: o.paymentId,
        name: o.data.name, phone: o.data.phone, email: o.data.email, address: o.data.address
      });
    } catch (e) { /* never block the confirmation on a save error */ }
  }

  function open(o) {
    opts = o;
    // require login before ordering (only if Supabase auth is configured)
    if (window.TMAuth && window.TMAuth.enabled && !window.TMAuth.user()) {
      window.TMAuth.requireLogin().then(function (u) { if (u) reallyOpen(); });
      return;
    }
    reallyOpen();
  }

  function reallyOpen() {
    if (!modal) build();
    document.getElementById("coDone").hidden = true;
    document.getElementById("coForm").hidden = false;
    clearPayErr();
    busy(false);
    Array.prototype.forEach.call(modal.querySelectorAll(".co-field.is-invalid"), function (f) { f.classList.remove("is-invalid"); });
    prefillFromProfile();
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
