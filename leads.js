/* THE MAKHANA — lead capture (partial + complete).
   Captures name / phone / email a visitor types into ANY form field on the
   site — even if they never submit — so the brand can follow up on abandoned
   forms. On submit it marks the lead complete. Sends via /api/lead (server
   stores it with the service role). Privacy: forms carry a consent notice and
   the privacy policy discloses this. Passwords are never captured. */
(function () {
  "use strict";
  var KEY = "tm_lead_key";
  function uuid() { try { return crypto.randomUUID(); } catch (e) { return "lk-" + Date.now() + "-" + Math.random().toString(36).slice(2); } }
  var leadKey;
  try { leadKey = localStorage.getItem(KEY) || (function () { var k = uuid(); try { localStorage.setItem(KEY, k); } catch (e) {} return k; })(); }
  catch (e) { leadKey = uuid(); }

  var state = { name: "", phone: "", email: "" };
  var lastSent = "";
  var completed = false;
  var timer = null;

  function fieldOf(el) {
    if (!el || el.tagName !== "INPUT") return null;
    var t = (el.type || "").toLowerCase();
    if (t === "password" || t === "hidden" || t === "checkbox" || t === "radio" || t === "search") return null;
    var s = ((el.id || "") + " " + (el.name || "") + " " + (el.autocomplete || "") + " " + (el.placeholder || "")).toLowerCase();
    if (t === "email" || /email/.test(s)) return "email";
    if (t === "tel" || /phone|mobile|\btel\b/.test(s)) return "phone";
    if (/name/.test(s) && !/user(name)?|company|card/.test(s)) return "name";
    return null;
  }
  function source() {
    if (document.getElementById("coName")) return "checkout";
    if (/contact/.test(location.pathname)) return "contact";
    if (document.getElementById("newsEmail")) return "newsletter";
    return "form";
  }
  function collect() {
    var inputs = document.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i++) {
      var f = fieldOf(inputs[i]);
      if (f && inputs[i].value && inputs[i].value.trim()) state[f] = inputs[i].value.trim().slice(0, 140);
    }
  }
  function hasData() { return !!(state.name || state.phone || state.email); }

  function send(status, beacon) {
    if (!hasData()) return;
    if (completed && status === "partial") return;
    var payload = {
      lead_key: leadKey, name: state.name, phone: state.phone, email: state.email,
      source: source(), page: location.pathname, status: status
    };
    var body = JSON.stringify(payload);
    if (status === "partial" && body === lastSent) return;
    lastSent = body;
    if (status === "complete") completed = true;
    try {
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon("/api/lead", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true }).catch(function () {});
      }
    } catch (e) {}
  }

  document.addEventListener("input", function (e) {
    if (!fieldOf(e.target)) return;
    collect();
    clearTimeout(timer);
    timer = setTimeout(function () { send("partial"); }, 900);
  }, true);
  document.addEventListener("blur", function (e) {
    if (fieldOf(e.target)) { collect(); send("partial"); }
  }, true);
  document.addEventListener("submit", function () { collect(); if (hasData()) send("complete"); }, true);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") { collect(); send("partial", true); }
  });
  window.addEventListener("pagehide", function () { collect(); send("partial", true); });
})();
