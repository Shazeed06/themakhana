/* ===================================================================
   THE MAKHANA - shared checkout flow (Razorpay online payment)
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
  // Payment-flow guards (reset on every payOnline start):
  // - closedSinceSubmit: user closed the checkout while create-order was in flight → don't open Razorpay.
  // - paymentCaptured: handler fired → a later modal dismiss must be a no-op.
  // - payFailed: payment.failed message must not be overwritten by a later dismiss.
  var closedSinceSubmit = false, paymentCaptured = false, payFailed = false;
  // Applied coupon state: null or { code, discount, label }. Server is authoritative;
  // this is only used to render the summary and to pass the code to create-order.
  var appliedCoupon = null;
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

  // Per the email CONTRACT rule: only render the email input when there is NO
  // logged-in email. If TMAuth is enabled and the user has an email, we use it
  // silently in gatherData and never show a field.
  function loggedInEmail() {
    if (window.TMAuth && window.TMAuth.enabled && window.TMAuth.user) {
      var u = window.TMAuth.user();
      if (u && u.email) return u.email;
    }
    return "";
  }
  function showEmailField() { return !loggedInEmail(); }

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
                (showEmailField() ? field("coEmail", "Email (optional)", "email", "email") : "") +
              '</div>' +
            '</fieldset>' +
            '<fieldset class="co-group"><legend>Delivery address</legend>' +
              field("coAddr", "House no, street, area", "text", "street-address") +
              field("coPin", "Pincode", "text", "postal-code", 'inputmode="numeric" maxlength="6"') +
              // Location confirmation line (filled from the pincode). City/State inputs
              // stay in the DOM (hidden by default) so gatherData + validation work; the
              // "Change" button reveals them for manual editing.
              '<p class="co-loc" id="coLoc" hidden></p>' +
              '<div class="co-row co-manual" id="coManual" hidden>' +
                field("coCity", "City", "text", "address-level2") +
                field("coState", "State", "text", "address-level1") +
              '</div>' +
            '</fieldset>' +
            '<fieldset class="co-group"><legend>Payment</legend>' +
              '<label class="co-pay"><input type="radio" name="pay" value="online" checked />' +
                '<span><strong>Pay Online</strong><small>UPI, Cards, Netbanking &amp; Wallets — secure via Razorpay</small></span></label>' +
            '</fieldset>' +
          '</div>' +
          '<aside class="checkout__summary">' +
            '<h3>Order summary</h3>' +
            '<div class="co-items" id="coItems"></div>' +
            '<div class="co-coupon">' +
              '<div class="co-coupon__row">' +
                '<input id="coCoupon" class="co-coupon__input" type="text" placeholder="Coupon code" autocomplete="off" maxlength="24" />' +
                '<button id="coApply" class="co-coupon__btn" type="button">Apply</button>' +
              '</div>' +
              '<p class="co-coupon__msg" id="coCouponMsg" hidden></p>' +
            '</div>' +
            '<div class="co-line"><span>Subtotal</span><span id="coSub"></span></div>' +
            '<div class="co-line"><span>Shipping</span><span id="coShip"></span></div>' +
            '<div class="co-line co-line--discount" id="coDiscountLine" hidden><span id="coDiscountLabel">Discount</span><span id="coDiscount"></span></div>' +
            '<div class="co-line co-line--total"><span>Total</span><span id="coTotal"></span></div>' +
            '<button class="btn btn--primary btn--block" type="submit" id="coPlace">Pay</button>' +
            '<p class="co-pay-err" id="coPayErr" hidden style="color:#DB0007;font-size:13px;font-weight:600;line-height:1.5;margin:10px 0 0;text-align:center"></p>' +
            '<p class="co-secure">' + CHECK + ' Secure payment via Razorpay · 7-day returns on unopened packs</p>' +
            '<p class="co-consent" style="font-size:11.5px;color:#8a8478;text-align:center;margin:8px 0 0;line-height:1.5">By continuing you agree to our <a href="/privacy" style="color:inherit;text-decoration:underline">Privacy Policy</a>.</p>' +
          '</aside>' +
        '</form>' +
        '<div class="checkout__done" id="coDone" hidden></div>' +
      '</div>';
    document.body.appendChild(wrap);
    modal = wrap;
    wrap.addEventListener("click", function (e) { if (e.target.closest("[data-co-close]")) close(); });
    document.getElementById("coForm").addEventListener("submit", onSubmit);
    document.getElementById("coApply").addEventListener("click", applyCoupon);
    // pincode → city/state auto-fill (debounced on input, immediate on blur)
    var pinEl = document.getElementById("coPin");
    if (pinEl) { pinEl.addEventListener("input", onPinInput); pinEl.addEventListener("blur", onPinBlur); }
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

  function setCouponMsg(text, kind) {
    var m = document.getElementById("coCouponMsg");
    if (!m) return;
    m.classList.remove("is-ok", "is-err");
    if (!text) { m.textContent = ""; m.hidden = true; return; }
    if (kind) m.classList.add(kind);
    m.textContent = text;
    m.hidden = false;
  }

  function applyCoupon() {
    var input = document.getElementById("coCoupon");
    var code = (input ? input.value || "" : "").trim();
    if (!code) {
      // empty → clear any applied coupon and hide the discount line + msg
      appliedCoupon = null;
      setCouponMsg("", null);
      renderSummary();
      return;
    }
    var btn = document.getElementById("coApply");
    if (btn) { btn.disabled = true; btn.textContent = "Checking…"; }
    fetch("/api/validate-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code,
        items: (opts.items || []).map(function (l) { return { id: l.id, qty: l.qty }; })
      })
    })
      .then(function (r) {
        return r.text().then(function (t) {
          var j = null; try { j = JSON.parse(t); } catch (e) { j = null; }
          return j;
        });
      })
      .then(function (j) {
        if (closedSinceSubmit || !modal) return; // checkout was closed while the request was in flight
        if (j && j.ok) {
          appliedCoupon = { code: j.code, discount: j.discount, label: j.label };
          setCouponMsg((j.code || code) + " applied — you saved " + money(j.discount), "is-ok");
        } else {
          appliedCoupon = null;
          setCouponMsg((j && j.error) || "This code isn't valid.", "is-err");
        }
        renderSummary();
      })
      .catch(function () {
        if (closedSinceSubmit || !modal) return;
        appliedCoupon = null;
        setCouponMsg("Could not check that code. Please try again.", "is-err");
        renderSummary();
      })
      .then(function () {
        var b = document.getElementById("coApply");
        if (b) { b.disabled = false; b.textContent = "Apply"; }
      });
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
    var flatShip = (typeof opts.flatShip === "number") ? opts.flatShip : 49;
    var ship = (sub === 0 || sub >= freeShip || allFree) ? 0 : flatShip;
    // Discount applies to the product subtotal only — never to shipping. Math.min
    // caps it to the current subtotal (e.g. if the cart shrank after applying).
    var discount = appliedCoupon ? Math.min(appliedCoupon.discount, sub) : 0;
    document.getElementById("coSub").textContent = money(sub);
    document.getElementById("coShip").textContent = ship === 0 ? "FREE" : money(ship);
    var dLine = document.getElementById("coDiscountLine");
    if (dLine) {
      if (discount > 0) {
        document.getElementById("coDiscountLabel").textContent = "Discount (" + appliedCoupon.code + ")";
        document.getElementById("coDiscount").textContent = "−" + money(discount);
        dLine.hidden = false;
      } else {
        dLine.hidden = true;
      }
    }
    total = sub + ship - discount;
    document.getElementById("coTotal").textContent = money(total);
    updatePayUI();
  }

  function selectedMethod() {
    var r = modal.querySelector('input[name="pay"]:checked');
    return r ? r.value : "online";
  }

  function updatePayUI() {
    if (!modal) return;
    var method = selectedMethod();
    var btn = document.getElementById("coPlace");
    if (btn && !btn.disabled) btn.textContent = "Pay " + money(total);
    var sec = modal.querySelector(".co-secure");
    if (sec) sec.innerHTML = CHECK + " Secure payment via Razorpay · 7-day returns on unopened packs";
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

  /* ---------- pincode → city/state auto-fill ---------- */
  var pinTimer = null, pinReqSeq = 0;

  // Reveal the editable City/State inputs (used when a pin can't be resolved or
  // the user taps "Change"). Keeps them in the DOM either way for validation.
  function revealManual() {
    var m = document.getElementById("coManual");
    if (m) m.hidden = false;
  }

  // Render the compact .co-loc line. kind: "" (neutral/loading), "ok", "err".
  function setLoc(html, kind, withEdit) {
    var loc = document.getElementById("coLoc");
    if (!loc) return;
    loc.classList.remove("co-loc--ok", "co-loc--err");
    if (!html) { loc.innerHTML = ""; loc.hidden = true; return; }
    if (kind === "ok") loc.classList.add("co-loc--ok");
    else if (kind === "err") loc.classList.add("co-loc--err");
    loc.innerHTML = html +
      (withEdit ? ' <button type="button" class="co-loc__edit" id="coLocEdit">Change</button>' : "");
    loc.hidden = false;
    var edit = document.getElementById("coLocEdit");
    if (edit) edit.addEventListener("click", revealManual);
  }

  function setCityState(city, state) {
    var c = document.getElementById("coCity"), s = document.getElementById("coState");
    if (c) { c.value = city || ""; c.closest(".co-field").classList.remove("is-invalid"); }
    if (s) { s.value = state || ""; s.closest(".co-field").classList.remove("is-invalid"); }
  }

  // Show the location line from whatever city/state we already hold (used on
  // prefill and after a successful lookup).
  function showLocFromValues() {
    var c = document.getElementById("coCity"), s = document.getElementById("coState");
    var city = c ? (c.value || "").trim() : "", state = s ? (s.value || "").trim() : "";
    if (city || state) {
      setLoc("📍 " + esc([city, state].filter(Boolean).join(", ")), "ok", true);
    }
  }

  function lookupPin(pin) {
    var seq = ++pinReqSeq; // guard against out-of-order/stale responses
    setLoc("Finding your area…", "", false);
    fetch("/api/pincode?pin=" + encodeURIComponent(pin))
      .then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (j) {
        if (seq !== pinReqSeq || !modal) return; // a newer request superseded this one
        if (j && j.ok && (j.city || j.state)) {
          setCityState(j.city, j.state);
          setErr("coPin", "");
          setLoc("📍 " + esc([j.city, j.state].filter(Boolean).join(", ")), "ok", true);
        } else {
          // Unknown pin → let the customer type city/state themselves.
          setLoc("Couldn't find that PIN — you can enter city &amp; state manually", "err", false);
          revealManual();
        }
      })
      .catch(function () {
        if (seq !== pinReqSeq || !modal) return;
        // Never block on the API — fall back to manual entry.
        setLoc("Couldn't find that PIN — you can enter city &amp; state manually", "err", false);
        revealManual();
      });
  }

  // Fired on input (debounced) and on blur of the pincode field.
  function onPinInput() {
    var el = document.getElementById("coPin");
    if (!el) return;
    var pin = (el.value || "").replace(/\D/g, "");
    if (pin.length !== 6) { if (pinTimer) clearTimeout(pinTimer); return; }
    if (pinTimer) clearTimeout(pinTimer);
    pinTimer = setTimeout(function () { lookupPin(pin); }, 250);
  }
  function onPinBlur() {
    var el = document.getElementById("coPin");
    if (!el) return;
    var pin = (el.value || "").replace(/\D/g, "");
    if (pin.length === 6) { if (pinTimer) clearTimeout(pinTimer); lookupPin(pin); }
  }

  function gatherData() {
    var g = function (id) { return (document.getElementById(id).value || "").trim(); };
    var items = (opts.items || []).map(function (l) {
      var p = opts.getProduct(l.id);
      return p ? { name: p.name.split(" (")[0], qty: l.qty, price: p.price } : null;
    }).filter(Boolean);
    // Email: use the visible field if present, else the logged-in email silently.
    var emailEl = document.getElementById("coEmail");
    var email = emailEl ? (emailEl.value || "").trim() : loggedInEmail();
    var name = g("coName"), phone = g("coPhone");
    var city = g("coCity"), state = g("coState"), pincode = g("coPin"), addr = g("coAddr");
    // Best-effort: persist this address so the next order is 1-tap. Guarded, never throws.
    if (window.TMAuth && window.TMAuth.enabled && window.TMAuth.user && window.TMAuth.user() && window.TMAuth.saveProfile) {
      try {
        window.TMAuth.saveProfile({
          full_name: name, phone: phone, address: addr,
          city: city, state: state, pincode: pincode, email: email
        });
      } catch (e) { /* never block checkout on a profile save */ }
    }
    return {
      name: name, phone: phone, email: email,
      address: addr + ", " + city + ", " + state + " - " + pincode,
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
    // City/State come from the pincode auto-fill (or manual entry). If either is
    // empty, reveal the manual inputs so the customer can fix it.
    if (!document.getElementById("coCity").value.trim() || !document.getElementById("coState").value.trim()) {
      revealManual();
    }
    // Email is only validated when the field is actually shown (no logged-in email).
    var em = document.getElementById("coEmail");
    if (em) {
      if (em.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) {
        setErr("coEmail", "Enter a valid email"); if (!firstBad) firstBad = em;
      } else { setErr("coEmail", ""); }
    }

    if (firstBad) { firstBad.focus(); return; }

    var data = gatherData();
    payOnline(data);
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
    closedSinceSubmit = false;
    paymentCaptured = false;
    payFailed = false;
    busy(true, "Starting payment…");
    fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: (opts.items || []).map(function (l) { return { id: l.id, qty: l.qty }; }),
        coupon: (appliedCoupon ? appliedCoupon.code : ""),
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
        if (closedSinceSubmit) { busy(false); return; } // user closed checkout while we were creating the order
        if (!res.ok || !res.j || !res.j.orderId) {
          throw new Error((res.j && res.j.error) || "Online payment isn't available right now — please try again in a moment.");
        }
        var o = res.j;
        // The server returns the DISCOUNTED total it actually charged (amount, in
        // rupees). Adopt it so the button, Razorpay description and confirmation
        // reflect the true charge. order_id remains authoritative for the amount.
        total = (typeof o.amount === "number") ? o.amount : total;
        loadRazorpay(function (loaded) {
          if (closedSinceSubmit) { busy(false); return; }
          if (!loaded) { busy(false); showPayErr("Could not load the payment window. Check your connection and try again."); return; }
          // NOTE: do not pass `amount` here — order_id is authoritative (the server
          // created the order with the correct paise amount; our local total is rupees).
          var rzp = new window.Razorpay({
            key: o.keyId,
            order_id: o.orderId,
            currency: o.currency || "INR",
            name: "The Makhana",
            description: "Order payment",
            image: location.origin + "/images/logo.png",
            prefill: { name: data.name, contact: data.phone, email: data.email || "" },
            notes: { address: data.address },
            theme: { color: "#DB0007" },
            handler: function (resp) { paymentCaptured = true; verifyAndFinish(resp, data); },
            modal: { ondismiss: function () {
              if (paymentCaptured) return; // payment went through — don't disturb the confirm flow
              busy(false);
              if (!payFailed) showPayErr("Payment cancelled. You can try again."); // keep the failure message visible
            } }
          });
          rzp.on("payment.failed", function () { payFailed = true; busy(false); showPayErr("Payment failed. Please try again."); });
          busy(true, "Opening payment…");
          rzp.open();
        });
      })
      .catch(function (err) { busy(false); showPayErr((err && err.message) || "Could not start payment. Please try again."); });
  }

  function verifyAndFinish(resp, data) {
    busy(true, "Confirming your order…");
    // The server (verify-payment) verifies the signature, records the order with
    // the service role and emails the customer — the browser no longer writes the
    // order. We pass the Supabase access token so the server ties it to the user.
    var tokenP = (window.TMAuth && window.TMAuth.token) ? window.TMAuth.token() : Promise.resolve(null);
    tokenP.then(function (token) {
      return fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
          accessToken: token
        })
      });
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.valid) {
          var orderId = j.order_no || String(resp.razorpay_payment_id || ("TM" + Date.now())).replace("pay_", "");
          showDone(data.name, data.phone, orderId, true, j.recorded !== false);
          if (opts.onPlaced) opts.onPlaced({ id: orderId, name: data.name, phone: data.phone, total: total, method: "online", paymentId: resp.razorpay_payment_id });
        } else {
          busy(false);
          showPayErr("We could not verify the payment. If money was deducted, contact us with your payment reference and we'll resolve it promptly.");
        }
      })
      .catch(function () { busy(false); showPayErr("Could not confirm the order. If money was deducted, please contact us — we'll sort it out."); });
  }

  function showDone(name, phone, orderId, paid, recorded) {
    if (recorded === undefined) recorded = true;
    document.getElementById("coForm").hidden = true;
    var done = document.getElementById("coDone");
    var payLine = paid
      ? (recorded
          ? "Payment of <strong>" + money(total) + "</strong> received. A confirmation email is on its way &mdash; we&rsquo;ll reach out on <strong>" + esc(phone) + "</strong> if anything needs confirming."
          : "Payment of <strong>" + money(total) + "</strong> received. Our team will confirm your order on <strong>" + esc(phone) + "</strong> shortly &mdash; you&rsquo;re all set.")
      : "Payment pending &mdash; your order is not confirmed until payment completes.";
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
    var p = window.TMAuth.profile ? window.TMAuth.profile() : null;
    var u = window.TMAuth.user ? window.TMAuth.user() : null;
    function set(id, v) { var el = document.getElementById(id); if (el && !el.value && v) el.value = v; }
    if (p) {
      set("coName", p.full_name); set("coPhone", p.phone); set("coAddr", p.address);
      set("coCity", p.city); set("coState", p.state); set("coPin", p.pincode);
      set("coEmail", p.email); // no-op when the email field isn't rendered
    }
    if (u && u.email) set("coEmail", u.email);
    // If we have a pincode + a resolved city/state, show the confirmation line so a
    // fully-prefilled returning customer sees everything ready and can just Pay.
    var pinEl = document.getElementById("coPin");
    if (pinEl && /^\d{6}$/.test((pinEl.value || "").trim())) showLocFromValues();
  }

  // NOTE: orders are persisted SERVER-SIDE only (api/verify-payment via the service
  // role). The browser must never insert orders directly — that's the forgery vector
  // the RLS lockdown closes. Do not re-add a client-side order-save here.

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
    // start every checkout with a clean coupon slate
    appliedCoupon = null;
    var cInput = document.getElementById("coCoupon");
    if (cInput) cInput.value = "";
    setCouponMsg("", null);
    var dLine0 = document.getElementById("coDiscountLine");
    if (dLine0) dLine0.hidden = true;
    Array.prototype.forEach.call(modal.querySelectorAll(".co-field.is-invalid"), function (f) { f.classList.remove("is-invalid"); });
    // clean location slate; manual city/state stay hidden until needed
    setLoc("", null);
    var manual0 = document.getElementById("coManual");
    if (manual0) manual0.hidden = true;
    prefillFromProfile();
    renderSummary();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    // autofocus the first EMPTY visible field (so a fully-prefilled returning
    // customer lands on the Pay button, not an already-filled input)
    var order = ["coName", "coPhone", "coEmail", "coAddr", "coPin"];
    var first = null;
    for (var i = 0; i < order.length; i++) {
      var el = document.getElementById(order[i]); // null when not rendered (e.g. email hidden)
      if (el && !(el.value || "").trim()) { first = el; break; }
    }
    if (first) setTimeout(function () { first.focus(); }, 80);
  }

  function close() {
    if (!modal) return;
    closedSinceSubmit = true; // any in-flight create-order must not open Razorpay
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
  }

  window.Checkout = { open: open, close: close };
})();
