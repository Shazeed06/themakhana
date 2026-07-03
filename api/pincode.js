/* Vercel serverless function: look up an Indian PIN code's city + state.
   GET /api/pincode?pin=NNNNNN -> 200 {ok:true, city, state} on success.
   A malformed/unknown/invalid pin is a normal 200 {ok:false}, NEVER a 500;
   500 is not returned even on a fetch fault (we degrade to {ok:false}).
   Pincodes are static, so responses are cached hard. No npm deps. */

module.exports = async (req, res) => {
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }

  // Pincodes never change -> cache aggressively at the CDN and browser.
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");

  try {
    // Prefer the parsed query; fall back to parsing the raw URL defensively.
    var pin = req.query && req.query.pin;
    if (!pin && req.url) {
      try {
        var q = req.url.indexOf("?");
        if (q !== -1) {
          var params = new URLSearchParams(req.url.slice(q + 1));
          pin = params.get("pin");
        }
      } catch (e) { /* ignore parse errors, treated as no pin below */ }
    }
    pin = (pin == null ? "" : String(pin)).trim();

    if (!/^\d{6}$/.test(pin)) { res.status(200).json({ ok: false }); return; }

    // Guard the upstream call with a timeout so a slow API can't hang us.
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 5000) : null;

    var data;
    try {
      var resp = await fetch("https://api.postalpincode.in/pincode/" + pin,
        controller ? { signal: controller.signal } : undefined);
      data = await resp.json();
    } finally {
      if (timer) clearTimeout(timer);
    }

    var first = Array.isArray(data) ? data[0] : null;
    if (first && first.Status === "Success" && first.PostOffice && first.PostOffice.length) {
      var po = first.PostOffice[0];
      res.status(200).json({ ok: true, city: po.District, state: po.State });
      return;
    }

    res.status(200).json({ ok: false });
  } catch (e) {
    // A bad pin or an upstream/network fault must never surface as a 500.
    res.status(200).json({ ok: false });
  }
};
