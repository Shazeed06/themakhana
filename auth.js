/* ===================================================================
   THE MAKHANA - authentication + customer accounts (Supabase)
   Exposes window.TMAuth. Needs supabase-js (CDN) + supabase-config.js
   loaded BEFORE this file. Degrades gracefully if not configured.
   =================================================================== */
window.TMAuth = (function () {
  "use strict";

  var sb = null, enabled = false, user = null, profile = null, modal = null, afterLogin = null;
  // OTP flow state
  var otpEmail = "", otpMode = "login", otpProfile = null, resendTimer = null;

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
      // Keep header + profile in sync ONLY. The login/signup handlers now own
      // showing the success view, closing the modal and running afterLogin.
      refreshProfile().then(updateHeader);
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
      ".tma-acct:hover{color:var(--primary-deep,#AF0006)}" +
      ".tma{position:fixed;inset:0;z-index:9999;display:none}" +
      ".tma.open{display:block}" +
      ".tma__scrim{position:absolute;inset:0;background:rgba(20,15,5,.55);opacity:0;transition:opacity .25s ease}" +
      ".tma.open .tma__scrim{opacity:1}" +
      ".tma__panel{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(.96);opacity:0;transition:opacity .28s ease,transform .28s cubic-bezier(.2,.8,.2,1);width:min(440px,92vw);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:28px 26px;box-shadow:0 30px 80px -20px rgba(0,0,0,.5)}" +
      ".tma.open .tma__panel{opacity:1;transform:translate(-50%,-50%) scale(1)}" +
      ".tma__close{position:absolute;top:14px;right:16px;border:none;background:none;font-size:26px;line-height:1;cursor:pointer;color:#888}" +
      ".tma__tabs{display:flex;gap:8px;margin-bottom:18px;background:#FFF8E7;border-radius:50px;padding:4px}" +
      ".tma__tab{flex:1;border:none;background:none;padding:9px;border-radius:50px;font-weight:700;font-size:14px;cursor:pointer;color:#6B6B6B;font-family:inherit}" +
      ".tma__tab.active{background:#fff;color:#1c1c1c;box-shadow:0 2px 8px rgba(0,0,0,.08)}" +
      ".tma h2{font-size:21px;font-weight:800;margin:0 0 4px;color:#1c1c1c}" +
      ".tma p.sub{font-size:14px;color:#6A6A6A;margin:0 0 16px}" +
      ".tma label{display:block;font-size:12.5px;font-weight:700;color:#3a3a3a;margin:12px 0 5px}" +
      ".tma input{width:100%;padding:11px 13px;border:1.5px solid #E3E3E3;border-radius:11px;font-size:15px;font-family:inherit;box-sizing:border-box}" +
      ".tma input:focus{outline:none;border-color:#DB0007}" +
      ".tma .row{display:flex;flex-wrap:wrap;gap:10px}.tma .row>div{flex:1 1 120px}" +
      ".tma__btn{width:100%;margin-top:18px;padding:13px;border:none;border-radius:50px;background:#DB0007;color:#fff;font-weight:700;font-size:15px;cursor:pointer;font-family:inherit}" +
      ".tma__btn:hover{background:#AF0006}.tma__btn:disabled{opacity:.6;cursor:default}" +
      ".tma__err{color:#DB0007;font-size:13px;font-weight:600;margin-top:12px;min-height:1px}" +
      ".tma__ok{color:#1e8a4c;font-size:13.5px;font-weight:600;margin-top:12px}" +
      ".tma__gate{font-size:13px;color:#6A6A6A;text-align:center;margin:-2px 0 14px}" +
      // success view
      ".tma__success{text-align:center;padding:14px 4px 6px;animation:tmaFade .45s ease both}" +
      ".tma__check{width:78px;height:78px;border-radius:50%;margin:6px auto 18px;background:#e8f6ee;display:flex;align-items:center;justify-content:center;animation:tmaPop .5s cubic-bezier(.2,.9,.3,1.4) both}" +
      ".tma__check svg{width:40px;height:40px;fill:none;stroke:#1e8a4c;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}" +
      ".tma__check svg path{stroke-dasharray:32;stroke-dashoffset:32;animation:tmaDraw .5s .2s ease forwards}" +
      ".tma__success h2{font-size:23px;margin:0 0 8px}" +
      ".tma__success p.msg{font-size:15px;color:#4A4A4A;line-height:1.5;margin:0 auto;max-width:330px}" +
      ".tma__success .tma__gate{margin:14px 0 0}" +
      ".tma__actions{margin-top:22px;display:flex;flex-direction:column;gap:10px}" +
      ".tma__btn--ghost{background:#fff;color:#1c1c1c;border:1.5px solid #E3E3E3}" +
      ".tma__btn--ghost:hover{background:#F7F7F7}" +
      ".tma__actions .tma__btn{margin-top:0;text-decoration:none;display:block;text-align:center;box-sizing:border-box}" +
      // OTP view helpers
      ".tma-otp-links{display:flex;gap:16px;justify-content:center;margin-top:16px}" +
      ".tma-link{border:none;background:none;color:#DB0007;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;text-decoration:underline;padding:0}" +
      ".tma-link:disabled{opacity:.55;cursor:default}" +
      "@keyframes tmaFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}" +
      "@keyframes tmaPop{0%{transform:scale(0)}60%{transform:scale(1.08)}100%{transform:scale(1)}}" +
      "@keyframes tmaDraw{to{stroke-dashoffset:0}}";
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
        '<div class="tma__tabs" id="tmaTabs"><button class="tma__tab" data-tab="login" type="button">Log in</button><button class="tma__tab" data-tab="signup" type="button">Sign up</button></div>' +
        '<p class="tma__gate" id="tmaGate" hidden>Please log in or create an account to place your order.</p>' +
        // success view (hidden by default)
        '<div class="tma__success" id="tmaSuccess" hidden>' +
          '<div class="tma__check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
          '<h2 id="tmaSuccessTitle">All set!</h2>' +
          '<p class="msg" id="tmaSuccessMsg"></p>' +
          '<p class="tma__gate" id="tmaSuccessGate" hidden>Taking you to checkout…</p>' +
          '<div class="tma__actions" id="tmaSuccessActions"></div>' +
        '</div>' +
        // login form (email only)
        '<form id="tmaLogin">' +
          '<h2>Log in or sign up</h2><p class="sub">Enter your email and we\'ll send you a one-time code — no password needed.</p>' +
          '<label for="tmaLEmail">Email</label><input id="tmaLEmail" type="email" autocomplete="email" required />' +
          '<button class="tma__btn" type="submit">Send code</button>' +
          '<div class="tma__err" id="tmaLErr"></div>' +
        '</form>' +
        // signup form (profile, no password)
        '<form id="tmaSignup" hidden>' +
          '<h2>Create your account</h2><p class="sub">We\'ll send a code to verify your email — no password to remember.</p>' +
          '<label for="tmaSName">Full name</label><input id="tmaSName" type="text" autocomplete="name" required />' +
          '<div class="row"><div><label for="tmaSEmail">Email</label><input id="tmaSEmail" type="email" autocomplete="email" required /></div>' +
          '<div><label for="tmaSPhone">Phone</label><input id="tmaSPhone" type="tel" inputmode="numeric" maxlength="10" autocomplete="tel" required /></div></div>' +
          '<label for="tmaSAddr">Address (house, street, area)</label><input id="tmaSAddr" type="text" autocomplete="street-address" required />' +
          '<div class="row"><div><label for="tmaSCity">City</label><input id="tmaSCity" type="text" autocomplete="address-level2" required /></div>' +
          '<div><label for="tmaSState">State</label><input id="tmaSState" type="text" autocomplete="address-level1" required /></div>' +
          '<div><label for="tmaSPin">Pincode</label><input id="tmaSPin" type="text" inputmode="numeric" maxlength="6" autocomplete="postal-code" required /></div></div>' +
          '<button class="tma__btn" type="submit">Send code</button>' +
          '<div class="tma__err" id="tmaSErr"></div><div class="tma__ok" id="tmaSOk"></div>' +
        '</form>' +
        // shared OTP code view (hidden by default)
        '<form id="tmaOtp" hidden>' +
          '<h2>Enter your code</h2><p class="sub">We sent a 6-digit code to <strong id="tmaOtpTarget"></strong>. It expires in a few minutes.</p>' +
          '<label for="tmaOtpCode">6-digit code</label><input id="tmaOtpCode" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" pattern="\\d{6}" required />' +
          '<button class="tma__btn" type="submit">Verify &amp; continue</button>' +
          '<div class="tma__err" id="tmaOtpErr"></div><div class="tma__ok" id="tmaOtpOk"></div>' +
          '<div class="tma-otp-links"><button class="tma-link" id="tmaOtpResend" type="button">Resend code</button><button class="tma-link" id="tmaOtpBack" type="button">Change email</button></div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(w);
    modal = w;
    w.addEventListener("click", function (e) { if (e.target.closest("[data-tma-close]")) closeModal(); });
    w.querySelectorAll(".tma__tab").forEach(function (t) { t.addEventListener("click", function () { showTab(t.getAttribute("data-tab")); }); });
    document.getElementById("tmaLogin").addEventListener("submit", onLoginStep1);
    document.getElementById("tmaSignup").addEventListener("submit", onSignupStep1);
    document.getElementById("tmaOtp").addEventListener("submit", onOtpVerify);
    document.getElementById("tmaOtpResend").addEventListener("click", onOtpResend);
    document.getElementById("tmaOtpBack").addEventListener("click", onOtpBack);
    return w;
  }

  function firstName() {
    var fn = profile && profile.full_name ? profile.full_name : "";
    if (!fn && user && user.user_metadata && user.user_metadata.full_name) fn = user.user_metadata.full_name;
    return fn ? fn.trim().split(" ")[0] : "";
  }

  function showTab(which) {
    var login = which !== "signup";
    // leaving the success/OTP view -> restore the form view
    document.getElementById("tmaSuccess").hidden = true;
    clearOtpView();
    document.getElementById("tmaOtp").hidden = true;
    document.getElementById("tmaTabs").hidden = false;
    document.getElementById("tmaGate").hidden = !afterLogin;
    document.getElementById("tmaLogin").hidden = !login;
    document.getElementById("tmaSignup").hidden = login;
    modal.querySelectorAll(".tma__tab").forEach(function (t) { t.classList.toggle("active", t.getAttribute("data-tab") === which); });
  }

  /* ---------- success view ----------
     opts: { title, message, gate (bool), actions:[{label,href,primary,onClick}] } */
  function showSuccess(opts) {
    if (!modal) return;
    // hide the form/tab chrome
    document.getElementById("tmaTabs").hidden = true;
    document.getElementById("tmaGate").hidden = true;
    document.getElementById("tmaLogin").hidden = true;
    document.getElementById("tmaSignup").hidden = true;
    document.getElementById("tmaOtp").hidden = true;

    document.getElementById("tmaSuccessTitle").textContent = opts.title || "All set!";
    document.getElementById("tmaSuccessMsg").innerHTML = opts.message || "";
    document.getElementById("tmaSuccessGate").hidden = !opts.gate;

    var wrap = document.getElementById("tmaSuccessActions");
    wrap.innerHTML = "";
    (opts.actions || []).forEach(function (a) {
      var b = document.createElement(a.href ? "a" : "button");
      b.className = "tma__btn" + (a.primary ? "" : " tma__btn--ghost");
      b.textContent = a.label;
      if (a.href) { b.href = a.href; }
      else { b.type = "button"; }
      if (a.onClick) b.addEventListener("click", a.onClick);
      wrap.appendChild(b);
    });

    var sv = document.getElementById("tmaSuccess");
    sv.hidden = false;
    // restart the entry animation each time it's shown
    sv.style.animation = "none"; void sv.offsetWidth; sv.style.animation = "";
  }

  // Shared "proceed after auth" logic for both login & signup success.
  function proceedAfterAuth() {
    if (afterLogin) {
      var cb = afterLogin; afterLogin = null;
      setTimeout(function () { closeModal(); cb(user); }, 1200);
    }
  }

  // Build the two standard buttons shown when there's no checkout gate.
  function defaultSuccessActions() {
    return [
      { label: "View my orders", href: "/account", primary: true },
      { label: "Continue shopping", onClick: function () { closeModal(); } }
    ];
  }

  function openModal(which) {
    if (!enabled) return;
    if (!modal) buildModal();
    showTab(which || "login");
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    // Clear any pending checkout gate: if a requireLogin() promise is still
    // waiting, resolve it with null so a later login doesn't pop a stale
    // checkout. (proceedAfterAuth nulls afterLogin BEFORE calling closeModal,
    // so the successful-login path is not affected.)
    if (afterLogin) {
      var cb = afterLogin; afterLogin = null;
      try { cb(null); } catch (e) {}
    }
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
    // reset back to a form view so the next open is clean
    document.getElementById("tmaSuccess").hidden = true;
    clearOtpView();
    document.getElementById("tmaOtp").hidden = true;
    document.getElementById("tmaTabs").hidden = false;
  }

  /* ---------- OTP view helpers ---------- */
  function clearOtpView() {
    var code = document.getElementById("tmaOtpCode");
    if (code) code.value = "";
    var err = document.getElementById("tmaOtpErr"); if (err) err.textContent = "";
    var ok = document.getElementById("tmaOtpOk"); if (ok) ok.textContent = "";
    if (resendTimer) { clearInterval(resendTimer); resendTimer = null; }
    var rb = document.getElementById("tmaOtpResend");
    if (rb) { rb.disabled = false; rb.textContent = "Resend code"; }
  }

  function showOtp() {
    if (!modal) return;
    document.getElementById("tmaTabs").hidden = true;
    document.getElementById("tmaGate").hidden = true;
    document.getElementById("tmaLogin").hidden = true;
    document.getElementById("tmaSignup").hidden = true;
    document.getElementById("tmaSuccess").hidden = true;
    clearOtpView();
    document.getElementById("tmaOtpTarget").textContent = otpEmail;
    document.getElementById("tmaOtp").hidden = false;
    var code = document.getElementById("tmaOtpCode");
    if (code) code.focus();
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function onLoginStep1(e) {
    e.preventDefault();
    var btn = e.target.querySelector(".tma__btn"), err = document.getElementById("tmaLErr");
    err.textContent = "";
    var email = (document.getElementById("tmaLEmail").value || "").trim();
    if (!email || !EMAIL_RE.test(email)) { err.textContent = "Please enter a valid email address"; return; }
    btn.disabled = true; btn.textContent = "Sending code…";
    sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true } }).then(function (r) {
      btn.disabled = false; btn.textContent = "Send code";
      if (r.error) { err.textContent = r.error.message || "Sorry, we couldn't send your code. Please try again."; return; }
      otpEmail = email; otpMode = "login"; otpProfile = null;
      showOtp();
    }).catch(function () {
      btn.disabled = false; btn.textContent = "Send code";
      err.textContent = "Sorry, we couldn't send your code. Please try again.";
    });
  }

  function onSignupStep1(e) {
    e.preventDefault();
    var btn = e.target.querySelector(".tma__btn"), err = document.getElementById("tmaSErr"), ok = document.getElementById("tmaSOk");
    err.textContent = ""; if (ok) ok.textContent = "";
    var g = function (id) { return (document.getElementById(id).value || "").trim(); };
    var name = g("tmaSName"), email = g("tmaSEmail"), phone = g("tmaSPhone"), pin = g("tmaSPin");
    if (name.length < 2) { err.textContent = "Please enter your full name"; return; }
    if (!email || !EMAIL_RE.test(email)) { err.textContent = "Please enter a valid email address"; return; }
    if (!/^[6-9]\d{9}$/.test(phone)) { err.textContent = "Enter a valid 10-digit mobile number"; return; }
    if (!/^\d{6}$/.test(pin)) { err.textContent = "Enter a valid 6-digit pincode"; return; }
    var profileData = {
      full_name: name, phone: phone, address: g("tmaSAddr"),
      city: g("tmaSCity"), state: g("tmaSState"), pincode: pin
    };
    btn.disabled = true; btn.textContent = "Sending code…";
    sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true, data: profileData } }).then(function (r) {
      btn.disabled = false; btn.textContent = "Send code";
      if (r.error) { err.textContent = r.error.message || "Sorry, we couldn't send your code. Please try again."; return; }
      otpEmail = email; otpMode = "signup"; otpProfile = profileData;
      showOtp();
    }).catch(function () {
      btn.disabled = false; btn.textContent = "Send code";
      err.textContent = "Sorry, we couldn't send your code. Please try again.";
    });
  }

  function onOtpVerify(e) {
    e.preventDefault();
    var btn = e.target.querySelector(".tma__btn"), err = document.getElementById("tmaOtpErr");
    err.textContent = "";
    var code = (document.getElementById("tmaOtpCode").value || "").trim();
    if (!/^\d{6}$/.test(code)) { err.textContent = "Enter the 6-digit code"; return; }
    btn.disabled = true; btn.textContent = "Verifying…";
    sb.auth.verifyOtp({ email: otpEmail, token: code, type: "email" }).then(function (r) {
      if (r.error || !(r.data && r.data.session)) {
        btn.disabled = false; btn.textContent = "Verify & continue";
        err.textContent = "That code is incorrect or has expired. Please request a new one.";
        return;
      }
      btn.disabled = false; btn.textContent = "Verify & continue";
      user = r.data.session.user;
      refreshProfile().then(function () {
        updateHeader();
        var fn = firstName();
        var gated = !!afterLogin;
        showSuccess({
          title: otpMode === "signup" ? "Account created!" : "Welcome back!",
          message: (otpMode === "signup"
            ? "Welcome" + (fn ? ", " + esc(fn) : "") + "! Your account is ready — track all your orders right here."
            : "You're logged in" + (fn ? ", " + esc(fn) : "") + "."),
          gate: gated,
          actions: gated ? [] : defaultSuccessActions()
        });
        proceedAfterAuth();
      });
    }).catch(function () {
      btn.disabled = false; btn.textContent = "Verify & continue";
      err.textContent = "That code is incorrect or has expired. Please request a new one.";
    });
  }

  function onOtpResend() {
    var rb = document.getElementById("tmaOtpResend"), ok = document.getElementById("tmaOtpOk"), err = document.getElementById("tmaOtpErr");
    if (!rb || rb.disabled) return;               // guard against spam
    if (err) err.textContent = ""; if (ok) ok.textContent = "";
    rb.disabled = true;
    var opts = { shouldCreateUser: true };
    if (otpMode === "signup" && otpProfile) opts.data = otpProfile;
    sb.auth.signInWithOtp({ email: otpEmail, options: opts }).then(function (r) {
      if (r.error) {
        if (err) err.textContent = r.error.message || "Sorry, we couldn't resend your code. Please try again.";
        rb.disabled = false; rb.textContent = "Resend code";
        return;
      }
      if (ok) ok.textContent = "New code sent";
      startResendCountdown(30);
    }).catch(function () {
      if (err) err.textContent = "Sorry, we couldn't resend your code. Please try again.";
      rb.disabled = false; rb.textContent = "Resend code";
    });
  }

  function startResendCountdown(secs) {
    var rb = document.getElementById("tmaOtpResend");
    if (!rb) return;
    if (resendTimer) { clearInterval(resendTimer); resendTimer = null; }
    var left = secs;
    rb.disabled = true; rb.textContent = "Resend in " + left + "s";
    resendTimer = setInterval(function () {
      left -= 1;
      if (left <= 0) {
        clearInterval(resendTimer); resendTimer = null;
        rb.disabled = false; rb.textContent = "Resend code";
      } else {
        rb.textContent = "Resend in " + left + "s";
      }
    }, 1000);
  }

  function onOtpBack() {
    var code = document.getElementById("tmaOtpCode"); if (code) code.value = "";
    showTab(otpMode);
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

  // (No client-side saveOrder.) Orders are written ONLY by the server
  // (api/verify-payment via the service role); the RLS insert policy is dropped so
  // a logged-in user cannot forge a paid order. Account history is read-only below.
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
    token: function () {
      if (!enabled || !sb) return Promise.resolve(null);
      return sb.auth.getSession()
        .then(function (r) { return (r.data && r.data.session) ? r.data.session.access_token : null; })
        .catch(function () { return null; });
    },
    openModal: openModal,
    requireLogin: requireLogin,
    signOut: signOut,
    getOrders: getOrders,
    refreshProfile: refreshProfile
  };
})();
