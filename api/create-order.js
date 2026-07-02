/* Vercel serverless function: create a Razorpay order.
   The amount is computed SERVER-SIDE from the cart (lib/catalog) — the browser's
   amount is IGNORED, so a tampered client can never pay less than the goods cost.
   The priced cart + customer are stored in the Razorpay order `notes` so
   verify-payment can record an authoritative order after the payment succeeds.
   Env: RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET (Vercel). */
var catalog = require("../lib/catalog");

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  var KEY_ID = (process.env.RAZORPAY_KEY_ID || "").trim();
  var KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!KEY_ID || !KEY_SECRET) {
    res.status(500).json({ error: "Payment is temporarily unavailable. Please try again shortly." });
    return;
  }

  try {
    var body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    // Authoritative server-side pricing from item ids + quantities. Client amount ignored.
    var priced = catalog.priceCart(body.items);
    if (!priced.items.length || priced.total < 1) {
      res.status(400).json({ error: "Your cart is empty or invalid." });
      return;
    }

    var customer = body.customer || {};
    // compact cart string, capped at 250 chars at an ITEM boundary (never cut mid-item)
    var cartCompact = "";
    for (var ci = 0; ci < priced.items.length; ci++) {
      var piece = priced.items[ci].id + ":" + priced.items[ci].qty;
      var withPiece = cartCompact ? cartCompact + ";" + piece : piece;
      if (withPiece.length > 250) break;
      cartCompact = withPiece;
    }
    var notes = {
      cart: cartCompact,
      sub: String(priced.subtotal),
      ship: String(priced.shipping),
      tot: String(priced.total),
      name: String(customer.name || "").slice(0, 120),
      phone: String(customer.phone || "").slice(0, 20),
      email: String(customer.email || "").slice(0, 120),
      addr: String(customer.address || "").slice(0, 250)
    };

    var auth = Buffer.from(KEY_ID + ":" + KEY_SECRET).toString("base64");
    var r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Basic " + auth },
      body: JSON.stringify({
        amount: priced.total * 100,     // paise — SERVER computed
        currency: "INR",
        receipt: "TM" + Date.now(),
        notes: notes
      })
    });
    var data = await r.json();
    if (!r.ok) {
      res.status(502).json({ error: (data && data.error && data.error.description) || "Could not start payment" });
      return;
    }
    res.status(200).json({ orderId: data.id, amount: priced.total, currency: data.currency, keyId: KEY_ID });
  } catch (e) {
    res.status(500).json({ error: "Server error while starting payment" });
  }
};
