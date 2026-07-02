/* ===================================================================
   THE MAKHANA - shared mobile menu controller + cart badge sync
   Owns the hamburger / #mobileNav open/close/focus-trap behaviour,
   and keeps every cart-count badge in sync with localStorage.
   No dependencies; safe on pages without the menu/cart markup.
   =================================================================== */

/* ---------- cart badge sync ---------- */
(function () {
  "use strict";

  function syncCartCount() {
    var count = 0;
    try {
      var cart = JSON.parse(localStorage.getItem("makhana_cart")) || [];
      if (!Array.isArray(cart)) cart = [];
      for (var i = 0; i < cart.length; i++) {
        var q = cart[i] && cart[i].qty;
        if (typeof q === "number" && isFinite(q) && q > 0) count += q;
      }
    } catch (e) { count = 0; }

    var badges = document.querySelectorAll('[id=cartCount], .cart-btn__count');
    Array.prototype.forEach.call(badges, function (el) {
      if (el) el.textContent = count;
    });

    var buttons = document.querySelectorAll(".cart-btn");
    Array.prototype.forEach.call(buttons, function (btn) {
      if (btn) btn.setAttribute("aria-label", "Go to shop, " + count + " items in cart");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncCartCount);
  } else {
    syncCartCount();
  }
})();

/* ---------- mobile menu ---------- */
(function () {
  "use strict";

  var mobileNav = document.getElementById("mobileNav");
  var hamburger = document.getElementById("hamburger");
  if (!hamburger || !mobileNav) return;

  var closeBtn = document.getElementById("mobileNavClose");
  var menuLastFocus = null;

  function focusables() {
    return Array.prototype.filter.call(
      mobileNav.querySelectorAll("button, a[href]"),
      function (el) { return !el.disabled && el.offsetParent !== null; }
    );
  }

  function onMenuKey(e) {
    if (e.key === "Escape") { closeMenu(); return; }
    if (e.key !== "Tab") return;
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openMenu() {
    menuLastFocus = document.activeElement;
    mobileNav.classList.add("open");
    mobileNav.setAttribute("aria-hidden", "false");
    hamburger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    if (closeBtn) closeBtn.focus();
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
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  Array.prototype.forEach.call(
    document.querySelectorAll(".mobile-nav__links a"),
    function (a) { a.addEventListener("click", closeMenu); }
  );
})();
