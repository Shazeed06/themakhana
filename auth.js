/* ===================================================================
   THE MAKHANA - authentication + customer accounts (Supabase)
   Exposes window.TMAuth. Needs supabase-js (CDN) + supabase-config.js
   loaded BEFORE this file. Degrades gracefully if not configured.
   =================================================================== */
window.TMAuth = (function () {
  "use strict";

  var sb = null, enabled = false, user = null, profile = null, modal = null, afterLogin = null;

  function configured() {
    return typeof window.SUPABASE_URL === "string" && window.SUPABASE_URL.indexOf("http") === 0 &&
      typeof window.SUPABASE_ANON_KEY === "string" && window.SUPABASE_ANON_KEY.length > 20 &&
      window.SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY";
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) { return ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]; }); }

  function init() {
    if (!configured() || !window.supabase) { enabled = false; updateHeader(); return; }
    try { sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY); }
    catch (e) { enabled = false; updateHeader(); return; }
    enabled = true;
    sb.auth.getSession().then(function (r) {
      user = (r.data && r.data.session) ? r.data.session.user : null;
      refreshProfile().then(updateHeader);
    });
    sb.auth.onAuthStateChange(function (_e, session) {
      user = session ? session.user : null;
      refreshProfile().then(function () {
        updateHeader();
        if (user && afterLogin) { var cb = afterLogin; afterLogin = null; closeModal(); cb(user); }
      });
    });
  }

  function refreshProfile() {
    if (!enabled || !user) { profile = null; return Promise.resolve(null); }
    return sb.from("profiles").select("*").eq("id", user.id).single()
      .then(function (r) { profile = r.data || null; return profile; })
      .catch(function () { profile = null; return null; });
  }

  /* ---------- header account state ---------- */
  function updateHeader() {
    document.querySelectorAll(".header__actions").forEach(function (bar) {
      var el = bar.querySelector("#tmAccount");
      if (!enabled) { if (el) el.remove(); return; }
      if (!el) {
        el = document.createElement("a");
        el.id = "tmAccount";
        el.className = "tma-acct";
        el.setAttribute("aria-label", "Account");
        bar.insertBefore(el, bar.firstChild);
      }
      if (user) {
        var nm = (profile && profile.full_name ? profile.full_name.split(" ")[0] : "Account");
        el.href = "/account";
        el.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg><span>' + esc(nm) + "</span>";
        el.onclick = null;
      } else {
        el.href = "#";
        el.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg><span>Log in</span>';
        el.onclick = function (e) { e.preventDefault(); openModal("login"); };
      }
    });
    try { document.dispatchEvent(new CustomEvent("tmauth:change", { detail: { user: user } })); } catch (e) {}
  }

  /* ---------- auth modal ---------- */
  function ensureStyles() {
    if (document.getElementById("tma-styles")) return;
    var st = document.createElement("style"); st.id = "tma-styles";
    st.textContent =
      ".tma-acct{display:inline-flex;align-items:center;gap:7px;font-weight:700;font-size:14px;color:var(--ink,#2a2a2a);text-decoration:none;padding:6px 10px;border-radius:50px}" +
      ".tma-acct svg{fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}" +
      ".tma-acct:hover{color:var(--primary-deep,#b8860b)}" +
      ".tma{position:fixed;inset:0;z-index:9999;display:none}" +
      ".tma.open{display:block}" +
      ".tma__scrim{position:absolute;inset:0;background:rgba(20,15,5,.55)}" +
      ".tma__panel{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(440px,92vw);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:28px 26px;box-shadow:0 30px 80px -20px rgba(0,0,0,.5)}" +
      ".tma__close{position:absolute;top:14px;right:16px;border:none;background:none;font-size:26px;line-height:1;cursor:pointer;color:#888}" +
      ".tma__tabs{display:flex;gap:8px;margin-bottom:18px;background:#f3efe6;border-radius:50px;padding:4px}" +
      ".tma__tab{flex:1;border:none;background:none;padding:9px;border-radius:50px;font-weight:700;font-size:14px;cursor:pointer;color:#7a7363;font-family:inherit}" +
      ".tma__tab.active{background:#fff;color:#1c1c1c;box-shadow:0 2px 8px rgba(0,0,0,.08)}" +
      ".tma h2{font-size:21px;font-weight:800;margin:0 0 4px;color:#1c1c1c}" +
      ".tma p.sub{font-size:14px;color:#6a6356;margin:0 0 16px}" +
      ".tma label{display:block;font-size:12.5px;font-weight:700;color:#3a3a3a;margin:12px 0 5px}" +
      ".tma input{width:100%;padding:11px 13px;border:1.5px solid #e3ddcf;border-radius:11px;font-size:15px;font-family:inherit;box-sizing:border-box}" +
      ".tma input:focus{outline:none;border-color:#F5C518}" +
      ".tma .row{display:flex;gap:10px}.tma .row>div{flex:1}" +
      ".tma__btn{width:100%;margin-top:18px;padding:13px;border:none;border-radius:50px;background:#1c1c1c;color:#fff;font-weight:700;font-size:15px;cursor:pointer;font-family:inherit}" +
      ".tma__btn:hover{background:#000}.tma__btn:disabled{opacity:.6;cursor:default}" +
      ".tma__err{color:#c0392b;font-size:13px;font-weight:600;margin-top:12px;min-height:1px}" +
      ".tma__ok{color:#1e8a4c;font-size:13.5px;font-weight:600;margin-top:12px}" +
      ".tma__gate{font-size:13px;color:#6a6356;text-align:center;margin:-2px 0 14px}";
    document.head.appendChild(st);
  }

  function buildModal() {
    ensureStyles();
    var w = document.createElement("div");
    w.className = "tma"; w.id = "tmaModal";
    w.innerHTML =
      '<div class="tma__scrim" data-tma-close></div>' +
      '<div class="tma__panel" role="dialog" aria-modal="true" aria-label="Account">' +
        '<button class="tma__close" type="button" data-tma-close aria-label="Close">&times;</button>' +
        '<div class="tma__tabs"><button class="tma__tab" data-tab="login" type="button">Log in</button><button class="tma__tab" data-tab="signup" type="button">Sign up</button></div>' +
        '<p class="tma__gate" id="tmaGate" hidden>Please log in or create an account to place your order.</p>' +
        // login form
        '<form id="tmaLogin">' +
          '<h2>Welcome back</h2><p class="sub">Log in to see your orders and check out faster.</p>' +
          '<label for="tmaLEmail">Email</label><input id="tmaLEmail" type="email" autocomplete="email" required />' +
          '<label for="tmaLPass">Password</label><input id="tmaLPass" type="password" autocomplete="current-password" required />' +
          '<button class="tma__btn" type="submit">Log in</button>' +
          '<div class="tma__err" id="tmaLErr"></div>' +
        '</form>' +
        // signup form
        '<form id="tmaSignup" hidden>' +
          '<h2>Create your account</h2><p class="sub">So you can track orders and reorder in one tap.</p>' +
          '<label for="tmaSName">Full name</label><input id="tmaSName" type="text" autocomplete="name" required />' +
          '<div class="row"><div><label for="tmaSEmail">Email</label><input id="tmaSEmail" type="email" autocomplete="email" required /></div>' +
          '<div><label for="tmaSPhone">Phone</label><input id="tmaSPhone" type="tel" inputmode="numeric" maxlength="10" autocomplete="tel" required /></div></div>' +
          '<label for="tmaSAddr">Address (house, street, area)</label><input id="tmaSAddr" type="text" autocomplete="street-address" required />' +
          '<div class="row"><div><label for="tmaSCity">City</label><input id="tmaSCity" type="text" autocomplete="address-level2" required /></div>' +
          '<div><label for="tmaSState">State</label><input id="tmaSState" type="text" autocomplete="address-level1" required /></div>' +
          '<div><label for="tmaSPin">Pincode</label><input id="tmaSPin" type="text" inputmode="numeric" maxlength="6" autocomplete="postal-code" required /></div></div>' +
          '<label for="tmaSPass">Password (min 6 chars)</label><input id="tmaSPass" type="password" autocomplete="new-password" required />' +
          '<button class="tma__btn" type="submit">Create account</button>' +
          '<div class="tma__err" id="tmaSErr"></div><div class="tma__ok" id="tmaSOk"></div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(w);
    modal = w;
    w.addEventListener("click", function (e) { if (e.target.closest("[data-tma-close]")) closeModal(); });
    w.querySelectorAll(".tma__tab").forEach(function (t) { t.addEventListener("click", function () { showTab(t.getAttribute("data-tab")); }); });
    document.getElementById("tmaLogin").addEventListener("submit", onLogin);
    document.getElementById("tmaSignup").addEventListener("submit", onSignup);
    return w;
  }

  function showTab(which) {
    var login = which !== "signup";
    document.getElementById("tmaLogin").hidden = !login;
    document.getElementById("tmaSignup").hidden = login;
    modal.querySelectorAll(".tma__tab").forEach(function (t) { t.classList.toggle("active", t.getAttribute("data-tab") === which); });
  }

  function openModal(which) {
    if (!enabled) return;
    if (!modal) buildModal();
    document.getElementById("tmaGate").hidden = !afterLogin;
    showTab(which || "login");
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }

  function onLogin(e) {
    e.preventDefault();
    var btn = e.target.querySelector(".tma__btn"), err = document.getElementById("tmaLErr");
    err.textContent = ""; btn.disabled = true; btn.textContent = "Logging in…";
    sb.auth.signInWithPassword({
      email: document.getElementById("tmaLEmail").value.trim(),
      password: document.getElementById("tmaLPass").value
    }).then(function (r) {
      btn.disabled = false; btn.textContent = "Log in";
      if (r.error) { err.textContent = r.error.message || "Could not log in"; return; }
      // onAuthStateChange handles close + afterLogin
    });
  }

  function onSignup(e) {
    e.preventDefault();
    var btn = e.target.querySelector(".tma__btn"), err = document.getElementById("tmaSErr"), ok = document.getElementById("tmaSOk");
    err.textContent = ""; ok.textContent = "";
    var g = function (id) { return (document.getElementById(id).value || "").trim(); };
    var phone = g("tmaSPhone"), pin = g("tmaSPin"), pass = document.getElementById("tmaSPass").value;
    if (!/^[6-9]\d{9}$/.test(phone)) { err.textContent = "Enter a valid 10-digit mobile number"; return; }
    if (!/^\d{6}$/.test(pin)) { err.textContent = "Enter a valid 6-digit pincode"; return; }
    if (pass.length < 6) { err.textContent = "Password must be at least 6 characters"; return; }
    btn.disabled = true; btn.textContent = "Creating…";
    sb.auth.signUp({
      email: g("tmaSEmail"), password: pass,
      options: { data: {
        full_name: g("tmaSName"), phone: phone, address: g("tmaSAddr"),
        city: g("tmaSCity"), state: g("tmaSState"), pincode: pin
      } }
    }).then(function (r) {
      btn.disabled = false; btn.textContent = "Create account";
      if (r.error) { err.textContent = r.error.message || "Could not sign up"; return; }
      // If email confirmation is OFF, session is active now (onAuthStateChange fires).
      // If ON, there's no session yet - tell the user to confirm.
      if (r.data && r.data.session) { /* logged in - handled by listener */ }
      else { ok.textContent = "Account created! Please check your email to confirm, then log in."; showTab("login"); }
    });
  }

  /* ---------- public helpers ---------- */
  function requireLogin() {
    return new Promise(function (resolve) {
      if (!enabled) { resolve(null); return; }      // not configured -> don't block checkout
      if (user) { resolve(user); return; }
      afterLogin = function (u) { resolve(u); };
      openModal("login");
    });
  }
  function signOut() { if (enabled) return sb.auth.signOut(); return Promise.resolve(); }

  function saveOrder(o) {
    if (!enabled || !user) return Promise.resolve({ skipped: true });
    return sb.from("orders").insert({
      user_id: user.id, order_no: o.order_no, items: o.items,
      subtotal: o.subtotal, shipping: o.shipping, total: o.total,
      payment_method: o.payment_method, payment_id: o.payment_id || null,
      name: o.name, phone: o.phone, email: o.email, address: o.address
    }).then(function (r) { return r; }).catch(function (e) { return { error: e }; });
  }
  function getOrders() {
    if (!enabled || !user) return Promise.resolve([]);
    return sb.from("orders").select("*").order("created_at", { ascending: false })
      .then(function (r) { return r.data || []; }).catch(function () { return []; });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  return {
    get enabled() { return enabled; },
    user: function () { return user; },
    profile: function () { return profile; },
    openModal: openModal,
    requireLogin: requireLogin,
    signOut: signOut,
    saveOrder: saveOrder,
    getOrders: getOrders,
    refreshProfile: refreshProfile
  };
})();
