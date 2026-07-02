/* Vercel serverless function: validate a coupon against a cart.
   The cart is priced SERVER-SIDE (lib/catalog) and the discount is computed by
   lib/coupons — the browser never supplies price/discount. A bad or inactive
   code is a normal 200 {ok:false,...}, NOT a 500; 500 is reserved for a true
   server fault. Never leaks internals. */
var catalog = require("../lib/catalog");
var coupons = require("../lib/coupons");

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  try {
    var body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    var priced = catalog.priceCart(body.items);
    var v = coupons.validate(body.code, priced);

    if (!v.ok) {
      res.status(200).json({ ok: false, error: v.reason || "This code isn't valid." });
      return;
    }

    res.status(200).json({
      ok: true,
      code: v.code,
      label: v.label,
      discount: v.discount,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      total: priced.subtotal + priced.shipping - v.discount
    });
  } catch (e) {
    res.status(500).json({ error: "Server error while validating the code" });
  }
};
