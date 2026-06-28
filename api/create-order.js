/* Vercel serverless function: create a Razorpay order.
   Uses env vars RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET (set in Vercel).
   No npm deps - uses built-in fetch + Buffer (Node 18+). */
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const KEY_ID = (process.env.RAZORPAY_KEY_ID || "").trim();
  const KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!KEY_ID || !KEY_SECRET) {
    res.status(500).json({ error: "Payment is temporarily unavailable. Please try again shortly." });
    return;
  }
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    const amt = Math.round(Number(body.amount));
    if (!amt || amt < 1) { res.status(400).json({ error: "Invalid amount" }); return; }

    const customer = body.customer || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const notes = {
      customer_name: String(customer.name || "").slice(0, 120),
      phone: String(customer.phone || "").slice(0, 20),
      email: String(customer.email || "").slice(0, 120),
      address: String(customer.address || "").slice(0, 480),
      items: items.map(function (i) { return (i.name || "") + " x" + (i.qty || 1); }).join(", ").slice(0, 480)
    };

    const auth = Buffer.from(KEY_ID + ":" + KEY_SECRET).toString("base64");
    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Basic " + auth },
      body: JSON.stringify({
        amount: amt * 100,           // Razorpay expects paise
        currency: "INR",
        receipt: "TM" + Date.now(),
        notes: notes
      })
    });
    const data = await r.json();
    if (!r.ok) {
      res.status(502).json({ error: (data && data.error && data.error.description) || "Could not start payment" });
      return;
    }
    res.status(200).json({ orderId: data.id, amount: data.amount, currency: data.currency, keyId: KEY_ID });
  } catch (e) {
    res.status(500).json({ error: "Server error while starting payment" });
  }
};
