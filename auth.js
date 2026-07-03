/* ===================================================================
   THE MAKHANA - authentication + customer accounts (Supabase)
   Exposes window.TMAuth. Needs supabase-js (CDN) + supabase-config.js
   loaded BEFORE this file. Degrades gracefully if not configured.
   =================================================================== */
window.TMAuth = (function () {
  "use strict";

  var sb = null, enabled = false, user = null, profile = null, modal = null, afterLogin = null;
  // Magic-link flow state
  var linkEmail = "", resendTimer = null;

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
      // sent view helpers
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
        '<p class="tma__gate" id="tmaGate" hidden>Please log in or create an account to place your order.</p>' +
        // success view (hidden by default)
        '<div class="tma__success" id="tmaSuccess" hidden>' +
          '<div class="tma__check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
          '<h2 id="tmaSuccessTitle">All set!</h2>' +
          '<p class="msg" id="tmaSuccessMsg"></p>' +
          '<p class="tma__gate" id="tmaSuccessGate" hidden>Taking you to checkout…</p>' +
          '<div class="tma__actions" id="tmaSuccessActions"></div>' +
        '</div>' +
        // email step (email only) — the single entry point
        '<form id="tmaLogin">' +
          '<h2>Log in or sign up</h2><p class="sub">Enter your email and we\'ll send you a magic sign-in link. No password, no code.</p>' +
          '<label for="tmaLEmail">Email</label><input id="tmaLEmail" type="email" autocomplete="email" required />' +
          '<button class="tma__btn" type="submit">Send sign-in link</button>' +
          '<div class="tma__err" id="tmaLErr"></div>' +
        '</form>' +
        // check-your-email / link sent view (hidden by default)
        '<div id="tmaSent" hidden>' +
          '<h2>Check your email</h2>' +
          '<p class="sub">We\'ve sent a sign-in link to <strong id="tmaSentTarget"></strong>.</p>' +
          '<p class="sub">Click it to sign in — the link works once and expires in 1 hour. You can close this tab after clicking.</p>' +
          '<div class="tma__ok" id="tmaSentOk"></div>' +
          '<div class="tma-otp-links"><button class="tma-link" id="tmaSentResend" type="button">Resend link</button><button class="tma-link" id="tmaSentBack" type="button">Use a different email</button></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(w);
    modal = w;
    w.addEventListener("click", function (e) { if (e.target.closest("[data-tma-close]")) closeModal(); });
    document.getElementById("tmaLogin").addEventListener("submit", onLoginStep1);
    document.getElementById("tmaSentResend").addEventListener("click", onSentResend);
    document.getElementById("tmaSentBack").addEventListener("click", onSentBack);
    return w;
  }

  function firstName() {
    var fn = profile && profile.full_name ? profile.full_name : "";
    if (!fn && user && user.user_metadata && user.user_metadata.full_name) fn = user.user_metadata.full_name;
    return fn ? fn.trim().split(" ")[0] : "";
  }

  // Show the single email step (the only entry point). Kept named showTab for
  // internal call-sites; it no longer references removed tabs/signup elements.
  function showTab() {
    // leaving the success/sent view -> restore the email step
    document.getElementById("tmaSuccess").hidden = true;
    clearSentView();
    document.getElementById("tmaSent").hidden = true;
    document.getElementById("tmaGate").hidden = !afterLogin;
    document.getElementById("tmaLogin").hidden = false;
    var em = document.getElementById("tmaLEmail");
    if (em) { try { em.focus(); } catch (e) {} }
  }

  /* ---------- success view ----------
     opts: { title, message, gate (bool), actions:[{label,href,primary,onClick}] } */
  function showSuccess(opts) {
    if (!modal) return;
    // hide the form chrome
    document.getElementById("tmaGate").hidden = true;
    document.getElementById("tmaLogin").hidden = true;
    document.getElementById("tmaSent").hidden = true;

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

  function openModal() {
    if (!enabled) return;
    if (!modal) buildModal();
    showTab();               // show the single email step
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    var em = document.getElementById("tmaLEmail");
    if (em) { try { em.focus(); } catch (e) {} }
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
    // reset back to the email step so the next open is clean
    document.getElementById("tmaSuccess").hidden = true;
    clearSentView();
    document.getElementById("tmaSent").hidden = true;
  }

  /* ---------- sent (check-your-email) view helpers ---------- */
  function clearSentView() {
    var ok = document.getElementById("tmaSentOk"); if (ok) ok.textContent = "";
    if (resendTimer) { clearInterval(resendTimer); resendTimer = null; }
    var rb = document.getElementById("tmaSentResend");
    if (rb) { rb.disabled = false; rb.textContent = "Resend link"; }
  }

  function showSent() {
    if (!modal) return;
    document.getElementById("tmaGate").hidden = true;
    document.getElementById("tmaLogin").hidden = true;
    document.getElementById("tmaSuccess").hidden = true;
    clearSentView();
    document.getElementById("tmaSentTarget").textContent = linkEmail;
    document.getElementById("tmaSent").hidden = false;
  }

  // Where the magic link should return the user: back to the current page.
  function redirectTo() {
    return window.location.origin + window.location.pathname;
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function onLoginStep1(e) {
    e.preventDefault();
    var btn = e.target.querySelector(".tma__btn"), err = document.getElementById("tmaLErr");
    err.textContent = "";
    var email = (document.getElementById("tmaLEmail").value || "").trim();
    if (!email || !EMAIL_RE.test(email)) { err.textContent = "Please enter a valid email address"; return; }
    btn.disabled = true; btn.textContent = "Sending link…";
    sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true, emailRedirectTo: redirectTo() } }).then(function (r) {
      btn.disabled = false; btn.textContent = "Send sign-in link";
      if (r.error) { err.textContent = r.error.message || "Sorry, we couldn't send your link. Please try again."; return; }
      linkEmail = email;
      showSent();
    }).catch(function () {
      btn.disabled = false; btn.textContent = "Send sign-in link";
      err.textContent = "Sorry, we couldn't send your link. Please try again.";
    });
  }

  function onSentResend() {
    var rb = document.getElementById("tmaSentResend"), ok = document.getElementById("tmaSentOk");
    if (!rb || rb.disabled) return;               // guard against spam
    if (ok) ok.textContent = "";
    rb.disabled = true;
    sb.auth.signInWithOtp({ email: linkEmail, options: { shouldCreateUser: true, emailRedirectTo: redirectTo() } }).then(function (r) {
      if (r.error) {
        if (ok) ok.textContent = "";
        rb.disabled = false; rb.textContent = "Resend link";
        return;
      }
      if (ok) ok.textContent = "New link sent — check your inbox.";
      startResendCountdown(30);
    }).catch(function () {
      rb.disabled = false; rb.textContent = "Resend link";
    });
  }

  function startResendCountdown(secs) {
    var rb = document.getElementById("tmaSentResend");
    if (!rb) return;
    if (resendTimer) { clearInterval(resendTimer); resendTimer = null; }
    var left = secs;
    rb.disabled = true; rb.textContent = "Resend in " + left + "s";
    resendTimer = setInterval(function () {
      left -= 1;
      if (left <= 0) {
        clearInterval(resendTimer); resendTimer = null;
        rb.disabled = false; rb.textContent = "Resend link";
      } else {
        rb.textContent = "Resend in " + left + "s";
      }
    }, 1000);
  }

  function onSentBack() {
    showTab();               // back to the single email step
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

  // Best-effort profile upsert for the logged-in user. Resolves even on failure
  // and NEVER throws/blocks the caller (checkout must not be held up by this).
  // fields = { full_name, phone, address, city, state, pincode, email }.
  function saveProfile(fields) {
    if (!enabled || !user) return Promise.resolve(null);
    var row = {};
    if (fields) {
      ["full_name", "phone", "address", "city", "state", "pincode", "email"].forEach(function (k) {
        if (fields[k] != null) row[k] = fields[k];
      });
    }
    row.id = user.id;
    try {
      return sb.from("profiles").upsert(row)
        .then(function () { return refreshProfile(); })
        .catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
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
    refreshProfile: refreshProfile,
    saveProfile: saveProfile
  };
})();
